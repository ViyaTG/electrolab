const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  { nombre: { type: String, required: true, trim: true, maxlength: 60 } },
  { timestamps: true, collection: 'categorias' }
);

// Nombre único sin distinguir mayúsculas ni acentos.
categorySchema.index({ nombre: 1 }, { unique: true, collation: { locale: 'es', strength: 1 } });

module.exports = mongoose.model('Category', categorySchema);
