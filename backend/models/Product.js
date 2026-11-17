const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    nombre: { type: String, required: true, trim: true },
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    encapsulado: { type: String, default: 'N/A', trim: true },
    ubicacion: { type: String, default: 'Gaveta A1', trim: true },
    especificaciones: { type: String, default: '', trim: true },
    precio: { type: Number, required: true, min: 0, default: 0 },
    cantidad: { type: Number, required: true, min: 0, default: 0 },
    codigoBarras: { type: String, trim: true },
    // OCC: se incrementa en cada modificación (edición, venta o reintegro).
    version: { type: Number, required: true, default: 0 },
    actualizadoPor: { type: String, default: 'sistema' }
  },
  { timestamps: true, collection: 'productos' }
);

productSchema.index({ codigoBarras: 1 }, { unique: true, partialFilterExpression: { codigoBarras: { $type: 'string' } } });

module.exports = mongoose.model('Product', productSchema);
