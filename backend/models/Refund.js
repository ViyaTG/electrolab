const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
  {
    folio: { type: String, required: true, unique: true },
    tipo: { type: String, enum: ['app', 'directo'], required: true },
    estado: { type: String, enum: ['pendiente', 'aprobado', 'rechazado'], default: 'pendiente', index: true },
    venta: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true, index: true },
    ventaFolio: { type: String, required: true },
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clienteNombre: { type: String, required: true },
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    monto: { type: Number, required: true, min: 0 },
    motivo: { type: String, required: true, trim: true },
    metodoReembolso: { type: String, enum: ['tarjeta', 'efectivo'], required: true },
    modalidad: { type: String, enum: ['cita_fisica', 'correo', 'directo'], required: true },
    fechaCita: { type: String },
    fotoEvidencia: { type: String },
    // Resultado de la revisión del producto: solo si funciona vuelve al inventario.
    funciona: { type: Boolean, default: null },
    reintegradoAlStock: { type: Boolean, default: false },
    procesadoPor: { type: String },
    fechaResolucion: { type: Date },
    notas: { type: String, trim: true }
  },
  { timestamps: true, collection: 'reembolsos' }
);

module.exports = mongoose.model('Refund', refundSchema);
