const jwt = require('jsonwebtoken');

const readToken = (req) => {
  const header = req.headers.authorization;
  return header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;
};

const decode = (token) => jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

// Exige un token válido.
const verifyToken = (req, res, next) => {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ code: 'TOKEN_INVALIDO', message: 'Acceso no autorizado. Inicia sesión.' });
  }
  try {
    req.user = decode(token);
    return next();
  } catch (error) {
    return res.status(401).json({ code: 'TOKEN_INVALIDO', message: 'Sesión inválida o expirada.' });
  }
};

// Identifica al usuario si manda token, pero deja pasar a visitantes anónimos.
const optionalAuth = (req, res, next) => {
  const token = readToken(req);
  if (token) {
    try {
      req.user = decode(token);
    } catch (error) {
      req.user = undefined;
    }
  }
  next();
};

// RBAC: solo los roles indicados pueden continuar.
const requireRole = (...roles) => {
  const middleware = (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ code: 'PROHIBIDO', message: 'No tienes permisos para realizar esta acción.' });
    }
    return next();
  };
  middleware.allowedRoles = roles;
  return middleware;
};

module.exports = { verifyToken, optionalAuth, requireRole };
