const Sale = require('../models/Sale');
const Refund = require('../models/Refund');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { STOCK_ALERT_THRESHOLD } = require('../config/constants');

const round2 = (n) => Math.round(n * 100) / 100;

const dateMatch = ({ desde, hasta }) => {
  const range = {};
  if (desde) range.$gte = new Date(`${desde}T00:00:00.000Z`);
  if (hasta) range.$lte = new Date(`${hasta}T23:59:59.999Z`);
  return Object.keys(range).length ? { createdAt: range } : {};
};

// Reporte por cliente: compras, total gastado y reembolsos aprobados.
exports.byCustomer = asyncHandler(async (req, res) => {
  const match = dateMatch(req.query);
  const [sales, refunds] = await Promise.all([
    Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$cliente',
          nombre: { $first: '$clienteNombre' },
          email: { $first: '$clienteEmail' },
          compras: { $sum: 1 },
          unidades: { $sum: { $sum: '$items.cantidad' } },
          totalGastado: { $sum: '$total' }
        }
      },
      { $sort: { totalGastado: -1 } },
      { $limit: req.query.limit }
    ]),
    Refund.aggregate([{ $match: { ...match, estado: 'aprobado' } }, { $group: { _id: '$cliente', reembolsado: { $sum: '$monto' } } }])
  ]);
  const refundMap = new Map(refunds.map((r) => [String(r._id), r.reembolsado]));
  res.json(
    sales.map((s) => {
      const reembolsado = refundMap.get(String(s._id)) || 0;
      return { ...s, totalGastado: round2(s.totalGastado), reembolsado: round2(reembolsado), neto: round2(s.totalGastado - reembolsado) };
    })
  );
});

// Productos más vendidos (unidades netas = vendidas - reembolsadas).
exports.topProducts = asyncHandler(async (req, res) => {
  const rows = await Sale.aggregate([
    { $match: dateMatch(req.query) },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.producto',
        sku: { $first: '$items.sku' },
        nombre: { $first: '$items.nombre' },
        unidades: { $sum: '$items.cantidad' },
        reembolsadas: { $sum: '$items.cantidadReembolsada' },
        ingresos: { $sum: { $multiply: ['$items.cantidad', '$items.precioUnitario'] } }
      }
    },
    { $addFields: { unidadesNetas: { $subtract: ['$unidades', '$reembolsadas'] } } },
    { $sort: { unidadesNetas: -1, ingresos: -1 } },
    { $limit: req.query.limit }
  ]);
  res.json(rows.map((r) => ({ ...r, ingresos: round2(r.ingresos) })));
});

// Campana de notificaciones del administrador.
exports.stockAlerts = asyncHandler(async (req, res) => {
  const items = await Product.find({ cantidad: { $lt: STOCK_ALERT_THRESHOLD } })
    .select('sku nombre cantidad categoria')
    .populate('categoria', 'nombre')
    .sort({ cantidad: 1 })
    .lean();
  res.json({ umbral: STOCK_ALERT_THRESHOLD, total: items.length, items });
});
