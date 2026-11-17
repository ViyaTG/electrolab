const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    nombre: { type: String, required: true, trim: true },
    categoria: { type: String, required: true, trim: true },
    encapsulado: { type: String, default: 'N/A', trim: true },
    ubicacion: { type: String, default: 'Gaveta A1', trim: true },
    especificaciones: { type: String, default: '', trim: true },
    cantidad: { type: Number, required: true, min: 0, default: 0 },
    version: { type: Number, required: true, default: 0 },
    actualizadoPor: { type: String, default: 'sistema' }
  },
  { timestamps: true, collection: 'productos' }
);

module.exports = mongoose.model('Component', componentSchema);
