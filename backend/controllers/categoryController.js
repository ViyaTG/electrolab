/**
 * @module controllers/categoryController
 * Casos de uso HTTP. Los routers aplican autenticación, roles y validación Zod.
 * @see ../routes/categoryRoutes.js
 */
const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');

const COLLATION = { locale: 'es', strength: 1 };

exports.listCategories = asyncHandler(async (req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().collation(COLLATION).sort({ nombre: 1 }).lean(),
    Product.aggregate([{ $group: { _id: '$categoria', total: { $sum: 1 } } }])
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.total]));
  res.json(categories.map((c) => ({ ...c, productos: countMap.get(String(c._id)) || 0 })));
});

exports.createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create({ nombre: req.body.nombre });
  res.status(201).json({ ...category.toObject(), productos: 0 });
});

// Los productos guardan la referencia (ObjectId), por lo que el nuevo nombre se refleja en todos automáticamente.
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, { $set: { nombre: req.body.nombre } }, { new: true, runValidators: true });
  if (!category) throw new HttpError(404, 'Categoría no encontrada');
  res.json(category);
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Product.countDocuments({ categoria: req.params.id });
  if (inUse > 0) {
    throw new HttpError(409, `No se puede eliminar: la categoría tiene ${inUse} producto(s) asignado(s).`, {
      code: 'CATEGORY_IN_USE',
      productos: inUse
    });
  }
  const deleted = await Category.findByIdAndDelete(req.params.id);
  if (!deleted) throw new HttpError(404, 'Categoría no encontrada');
  res.json({ message: 'Categoría eliminada correctamente' });
});
