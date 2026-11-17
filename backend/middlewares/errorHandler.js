const HttpError = require('../utils/httpError');

const DUPLICATE_MESSAGES = {
  sku: 'Ya existe un producto con ese SKU.',
  codigoBarras: 'Ese código de barras ya está asignado a otro producto.',
  nombre: 'Ya existe una categoría con ese nombre.',
  email: 'Ya existe una cuenta con ese correo.',
  folio: 'Conflicto al generar el folio. Intenta de nuevo.'
};

module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, ...err.extra });
  }
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    return res.status(409).json({ code: 'DUPLICADO', message: DUPLICATE_MESSAGES[field] || 'Ya existe un registro con esos datos.' });
  }
  if (err && (err.name === 'CastError' || err.name === 'ValidationError')) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Datos inválidos' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'La solicitud es demasiado grande (reduce el tamaño de la imagen).' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Error interno del servidor' });
};
