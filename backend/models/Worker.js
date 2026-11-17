const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    rol: { type: String, enum: ['trabajador', 'administrador'], default: 'trabajador' }
  },
  { timestamps: true, collection: 'trabajadores' }
);

module.exports = mongoose.model('Worker', workerSchema);
