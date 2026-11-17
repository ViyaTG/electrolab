const crypto = require('crypto');

// Ej.: VTA-3F9A12BC (ventas) o RMB-0A1B2C3D (reembolsos)
exports.generateFolio = (prefix) => `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
