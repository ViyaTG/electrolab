const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    rol: { type: String, enum: Object.values(ROLES), default: ROLES.CLIENTE },
    // Recuperación de contraseña (solo clientes). Se guarda un HMAC del código, nunca el código.
    resetCodeHash: { type: String, select: false },
    resetCodeExpires: { type: Date, select: false },
    resetAttempts: { type: Number, default: 0, select: false }
  },
  { timestamps: true, collection: 'usuarios' }
);

module.exports = mongoose.model('User', userSchema);
