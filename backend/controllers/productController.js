const Product = require('../models/Product');
const mongoose = require('mongoose');
const Sku = require('../models/Sku');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { fuzzyFilterAndRank } = require('../utils/fuzzySearch');
const { STAFF_ROLES } = require('../config/constants');

const assertCategoryExists = async (id) => {
  if (!(await Category.exists({ _id: id }))) throw new HttpError(400, 'La categoría seleccionada no existe.');
};

// Catálogo público; el campo interno `actualizadoPor` solo lo ve el personal.
exports.listProducts = asyncHandler(async (req, res) => {
  const { q, categoria } = req.query;
  const products = await Product.find(categoria ? { categoria } : {})
    .populate('categoria', 'nombre')
    .sort({ updatedAt: -1 })
    .lean();
  const ranked = fuzzyFilterAndRank(products, q);
  const isStaff = STAFF_ROLES.includes(req.user && req.user.rol);
  res.json(isStaff ? ranked : ranked.map(({ actualizadoPor, ...publicFields }) => publicFields));
});

exports.createProduct = asyncHandler(async (req, res) => {
  const data = req.body;
  await assertCategoryExists(data.categoria);
  let product;
  await mongoose.connection.transaction(async (session) => {
    const sku = data.sku.toUpperCase();
    if (!(await Sku.findOneAndUpdate({ codigo: sku }, { $inc: { version: 1 } }, { session }))) throw new HttpError(400, 'Selecciona un SKU registrado.');
    [product] = await Product.create([{
      ...data, sku, codigoBarras: data.codigoBarras || undefined,
      version: 0, actualizadoPor: req.user.email
    }], { session });
  });
  await product.populate('categoria', 'nombre');
  res.status(201).json(product);
});

// Control de Concurrencia Optimista: solo se aplica el $set si la versión sigue siendo la que el cliente leyó.
exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { version, ...fields } = req.body;
  if (fields.categoria) await assertCategoryExists(fields.categoria);

  const set = { ...fields, actualizadoPor: req.user.email };
  const update = { $inc: { version: 1 } };
  if (set.sku) set.sku = set.sku.toUpperCase();
  if (set.codigoBarras === '') {
    delete set.codigoBarras;
    update.$unset = { codigoBarras: 1 };
  }
  update.$set = set;

  let updated;
  await mongoose.connection.transaction(async (session) => {
    if (set.sku && !(await Sku.findOneAndUpdate({ codigo: set.sku }, { $inc: { version: 1 } }, { session }))) throw new HttpError(400, 'Selecciona un SKU registrado.');
    updated = await Product.findOneAndUpdate({ _id: id, version }, update, { new: true, runValidators: true, session }).populate('categoria', 'nombre');
  });
  if (updated) return res.json(updated);

  const current = await Product.findById(id).populate('categoria', 'nombre');
  if (!current) throw new HttpError(404, 'El producto ya no existe en el inventario.');
  throw new HttpError(409, 'Conflicto de edición concurrente: los datos de esta pieza fueron modificados por otro usuario. Recarga antes de guardar.', {
    code: 'OCC_CONFLICT',
    currentDocument: current
  });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const deleted = await Product.findByIdAndDelete(req.params.id);
  if (!deleted) throw new HttpError(404, 'Producto no encontrado');
  res.json({ message: 'Producto eliminado correctamente' });
});
