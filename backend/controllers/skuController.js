/**
 * @module controllers/skuController
 * Casos de uso HTTP. Los routers aplican autenticación, roles y validación Zod.
 * @see ../routes/skuRoutes.js
 */
const mongoose = require('mongoose');
const Sku = require('../models/Sku');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');

async function importExistingSkus() {
  for (const codigo of await Product.distinct('sku')) {
    if (codigo) await Sku.updateOne({ codigo }, { $setOnInsert: { codigo, descripcion: '', version: 0 } }, { upsert: true });
  }
}
exports.importExistingSkus = importExistingSkus;
exports.list = asyncHandler(async (req, res) => {
  const [skus, counts] = await Promise.all([Sku.find().sort({ codigo: 1 }).lean(), Product.aggregate([{ $group: { _id: '$sku', total: { $sum: 1 } } }])]);
  const totals = new Map(counts.map((row) => [row._id, row.total]));
  res.json(skus.map((row) => ({ ...row, productos: totals.get(row.codigo) || 0 })));
});
exports.create = asyncHandler(async (req, res) => {
  const sku = await Sku.create(req.body);
  res.status(201).json({ ...sku.toObject(), productos: 0 });
});
exports.update = asyncHandler(async (req, res) => {
  let result;
  await mongoose.connection.transaction(async (session) => {
    const sku = await Sku.findById(req.params.id).session(session);
    if (!sku) throw new HttpError(404, 'SKU no encontrado.');
    const old = sku.codigo;
    sku.codigo = req.body.codigo;
    sku.descripcion = req.body.descripcion;
    sku.version++;
    await sku.save({ session });
    if (old !== sku.codigo) await Product.updateMany({ sku: old }, { $set: { sku: sku.codigo, actualizadoPor: req.user.email }, $inc: { version: 1 } }, { session });
    result = sku;
  });
  res.json(result);
});
exports.remove = asyncHandler(async (req, res) => {
  await mongoose.connection.transaction(async (session) => {
    const sku = await Sku.findById(req.params.id).session(session);
    if (!sku) throw new HttpError(404, 'SKU no encontrado.');
    if (await Product.exists({ sku: sku.codigo }).session(session)) throw new HttpError(409, 'No se puede eliminar un SKU asignado a un producto.', { code: 'SKU_IN_USE' });
    await sku.deleteOne({ session });
  });
  res.json({ message: 'SKU eliminado.' });
});
