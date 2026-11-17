const mongoose = require('mongoose');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { generateFolio } = require('../utils/folio');
const { decorateSales } = require('../services/refundRules');
const { DECLINED_TEST_CARD } = require('../config/constants');

const round2 = (n) => Math.round(n * 100) / 100;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Pago simulado: valida stock y descuenta inventario en una transacción atómica.
exports.checkout = asyncHandler(async (req, res) => {
  const { items, pago } = req.body;
  if (pago.numeroTarjeta === DECLINED_TEST_CARD) {
    throw new HttpError(402, 'Pago rechazado por el banco emisor (simulación).', { code: 'PAGO_RECHAZADO' });
  }
  const customer = await User.findById(req.user.id);
  if (!customer) throw new HttpError(401, 'Sesión inválida o expirada.', { code: 'TOKEN_INVALIDO' });

  // Si el mismo producto viene repetido, se suman las cantidades.
  const merged = new Map();
  items.forEach((it) => merged.set(it.productoId, (merged.get(it.productoId) || 0) + it.cantidad));

  const session = await mongoose.startSession();
  let sale;
  try {
    await session.withTransaction(async () => {
      const saleItems = [];
      let total = 0;
      for (const [productoId, cantidad] of merged) {
        // OCC sobre el inventario: el descuento solo ocurre si todavía alcanza el stock.
        const product = await Product.findOneAndUpdate(
          { _id: productoId, cantidad: { $gte: cantidad } },
          { $inc: { cantidad: -cantidad, version: 1 } },
          { new: true, session }
        );
        if (!product) {
          const current = await Product.findById(productoId).session(session).select('nombre cantidad');
          if (!current) throw new HttpError(404, 'Uno de los productos ya no está disponible.', { code: 'PRODUCTO_NO_ENCONTRADO', productoId });
          throw new HttpError(409, `Stock insuficiente para "${current.nombre}". Disponible: ${current.cantidad}.`, {
            code: 'STOCK_INSUFICIENTE',
            productoId,
            disponible: current.cantidad
          });
        }
        // El precio siempre sale de la base de datos, nunca del cliente.
        total += product.precio * cantidad;
        saleItems.push({ producto: product._id, sku: product.sku, nombre: product.nombre, precioUnitario: product.precio, cantidad });
      }
      const [created] = await Sale.create(
        [
          {
            folio: generateFolio('VTA'),
            cliente: customer._id,
            clienteNombre: customer.nombre,
            clienteEmail: customer.email,
            items: saleItems,
            total: round2(total),
            pago: { metodo: 'tarjeta_simulada', ultimos4: pago.numeroTarjeta.slice(-4), titular: pago.titular }
          }
        ],
        { session }
      );
      sale = created;
    });
  } finally {
    await session.endSession();
  }
  res.status(201).json(sale);
});

exports.mySales = asyncHandler(async (req, res) => {
  const sales = await Sale.find({ cliente: req.user.id }).sort({ createdAt: -1 }).limit(100).lean();
  res.json(await decorateSales(sales));
});

// Búsqueda para el reembolso directo: por nombre del cliente y/o folio de venta.
exports.searchSales = asyncHandler(async (req, res) => {
  const { nombre, folio } = req.query;
  if (!nombre && !folio) throw new HttpError(400, 'Indica el nombre del cliente o el folio de la venta.');
  const filter = {};
  if (nombre) filter.clienteNombre = new RegExp(escapeRegex(nombre), 'i');
  if (folio) filter.folio = new RegExp(`^${escapeRegex(folio)}`, 'i');
  const sales = await Sale.find(filter).sort({ createdAt: -1 }).limit(20).lean();
  res.json(await decorateSales(sales));
});

exports.listAllSales = asyncHandler(async (req, res) => {
  const { limit, skip } = req.query;
  const [sales, total] = await Promise.all([
    Sale.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Sale.countDocuments()
  ]);
  res.json({ total, items: sales });
});
