const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 40 },
  descripcion: { type: String, trim: true, default: '', maxlength: 120 },
  version: { type: Number, default: 0 }
}, { timestamps: true, collection: 'skus' });
module.exports = mongoose.model('Sku', schema);
