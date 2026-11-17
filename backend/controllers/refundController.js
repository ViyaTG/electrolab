const mongoose = require('mongoose');
const Refund = require('../models/Refund');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { generateFolio } = require('../utils/folio');
const { assertRefundable, pendingQtyFor } = require('../services/refundRules');

const round2 = (n) => Math.round(n * 100) / 100;
const LIST_FIELDS = '-fotoEvidencia';

// Cliente: crea la solicitud y se genera el folio.
exports.createRefund = asyncHandler(async (req, res) => {
  const { ventaId, productoId, cantidad, motivo, metodoReembolso, modalidad, fechaCita, fotoEvidencia } = req.body;
  const sale = await Sale.findOne({ _id: ventaId, cliente: req.user.id });
  if (!sale) throw new HttpError(404, 'Venta no encontrada.');

  const pending = await pendingQtyFor(sale._id, productoId);
  const item = assertRefundable(sale, productoId, cantidad, pending);

  const refund = await Refund.create({
    folio: generateFolio('RMB'),
    tipo: 'app',
    venta: sale._id,
    ventaFolio: sale.folio,
    cliente: sale.cliente,
    clienteNombre: sale.clienteNombre,
    producto: item.producto,
    sku: item.sku,
    nombre: item.nombre,
    cantidad,
    monto: round2(item.precioUnitario * cantidad),
    motivo,
    metodoReembolso,
    modalidad,
    fechaCita,
    fotoEvidencia
  });
  const { fotoEvidencia: omitted, ...publicRefund } = refund.toObject();
  res.status(201).json(publicRefund);
});

exports.myRefunds = asyncHandler(async (req, res) => {
  res.json(await Refund.find({ cliente: req.user.id }).select(LIST_FIELDS).sort({ createdAt: -1 }).limit(100));
});

exports.listRefunds = asyncHandler(async (req, res) => {
  const { estado, limit, skip } = req.query;
  const filter = estado ? { estado } : {};
  const [items, total] = await Promise.all([
    Refund.find(filter).select(LIST_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Refund.countDocuments(filter)
  ]);
  res.json({ total, items });
});

exports.getRefundByFolio = asyncHandler(async (req, res) => {
  const refund = await Refund.findOne({ folio: req.params.folio.toUpperCase() });
  if (!refund) throw new HttpError(404, 'No se encontró un reembolso con ese folio.');
  res.json(refund);
});

// Aplica el reembolso a la venta (con OCC sobre el renglón) y, si el producto funciona, lo regresa al inventario.
async function applyToSaleAndStock(session, sale, item, cantidad, funciona) {
  const updated = await Sale.updateOne(
    { _id: sale._id, items: { $elemMatch: { producto: item.producto, cantidadReembolsada: item.cantidadReembolsada } } },
    { $inc: { 'items.$.cantidadReembolsada': cantidad } },
    { session }
  );
  if (updated.modifiedCount !== 1) {
    throw new HttpError(409, 'La venta fue modificada por otro trabajador. Intenta de nuevo.', { code: 'OCC_CONFLICT' });
  }
  if (!funciona) return false;
  const restocked = await Product.updateOne({ _id: item.producto }, { $inc: { cantidad, version: 1 } }, { session });
  return restocked.modifiedCount === 1;
}

// Opción A (trabajador): aprobar o rechazar un folio generado desde la app.
exports.resolveRefund = asyncHandler(async (req, res) => {
  const { decision, funciona, notas } = req.body;
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const refund = await Refund.findById(req.params.id).session(session);
      if (!refund) throw new HttpError(404, 'Reembolso no encontrado.');
      if (refund.estado !== 'pendiente') throw new HttpError(409, 'Este folio ya fue resuelto.', { code: 'YA_RESUELTO' });

      refund.procesadoPor = req.user.email;
      refund.fechaResolucion = new Date();
      refund.notas = notas;

      if (decision === 'rechazar') {
        refund.estado = 'rechazado';
      } else {
        const sale = await Sale.findById(refund.venta).session(session);
        if (!sale) throw new HttpError(404, 'La venta original ya no existe.');
        // El plazo de 90 días se evalúa a la fecha en que el cliente hizo la solicitud.
        const item = assertRefundable(sale, refund.producto, refund.cantidad, 0, refund.createdAt);
        refund.reintegradoAlStock = await applyToSaleAndStock(session, sale, item, refund.cantidad, funciona);
        refund.estado = 'aprobado';
        refund.funciona = funciona;
      }
      await refund.save({ session });
      result = refund;
    });
  } finally {
    await session.endSession();
  }
  res.json(result);
});

// Opción B (trabajador): reembolso físico directo en tienda, sin cita ni folio previo.
exports.createDirectRefund = asyncHandler(async (req, res) => {
  const { ventaId, productoId, cantidad, funciona, metodoReembolso, motivo } = req.body;
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const sale = await Sale.findById(ventaId).session(session);
      if (!sale) throw new HttpError(404, 'Venta no encontrada.');
      const pending = await pendingQtyFor(sale._id, productoId);
      const item = assertRefundable(sale, productoId, cantidad, pending);
      const reintegrado = await applyToSaleAndStock(session, sale, item, cantidad, funciona);
      const [created] = await Refund.create(
        [
          {
            folio: generateFolio('RMB'),
            tipo: 'directo',
            estado: 'aprobado',
            venta: sale._id,
            ventaFolio: sale.folio,
            cliente: sale.cliente,
            clienteNombre: sale.clienteNombre,
            producto: item.producto,
            sku: item.sku,
            nombre: item.nombre,
            cantidad,
            monto: round2(item.precioUnitario * cantidad),
            motivo: motivo || 'Devolución física directa en tienda',
            metodoReembolso,
            modalidad: 'directo',
            funciona,
            reintegradoAlStock: reintegrado,
            procesadoPor: req.user.email,
            fechaResolucion: new Date()
          }
        ],
        { session }
      );
      result = created;
    });
  } finally {
    await session.endSession();
  }
  res.status(201).json(result);
});
