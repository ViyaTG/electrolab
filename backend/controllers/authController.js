const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { ROLES, STAFF_ROLES } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { sendResetCode } = require('../utils/mailer');

const SALT_ROUNDS = 12;
// Se compara contra este hash cuando el usuario no existe, para que el tiempo de respuesta no delate si el correo está registrado.
const DUMMY_HASH = bcrypt.hashSync('contraseña-de-relleno', 10);

const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, nombre: user.nombre, rol: user.rol }, process.env.JWT_SECRET, {
    expiresIn: '8h',
    algorithm: 'HS256'
  });
const publicUser = (user) => ({ id: user._id, nombre: user.nombre, email: user.email, rol: user.rol });

const hashCode = (code) => crypto.createHmac('sha256', process.env.JWT_SECRET).update(code).digest('hex');
const safeEqual = (a, b) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

// Un mismo flujo para ambos accesos; cambia solo el rol permitido.
const buildLogin = (allowedRoles) =>
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, rol: { $in: allowedRoles } }).select('+passwordHash');
    const matches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !matches) throw new HttpError(401, 'Credenciales incorrectas');
    res.json({ token: signToken(user), user: publicUser(user) });
  });

exports.login = buildLogin([ROLES.CLIENTE]);
exports.staffLogin = buildLogin(STAFF_ROLES);

// El registro público siempre crea clientes: el rol nunca viene del cliente HTTP.
exports.register = asyncHandler(async (req, res) => {
  const { nombre, email, password } = req.body;
  if (await User.exists({ email })) throw new HttpError(409, 'Ya existe una cuenta con ese correo.');
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ nombre, email, passwordHash, rol: ROLES.CLIENTE });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email, rol: ROLES.CLIENTE });
  if (user) {
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    await User.updateOne(
      { _id: user._id },
      { $set: { resetCodeHash: hashCode(code), resetCodeExpires: new Date(Date.now() + 15 * 60 * 1000), resetAttempts: 0 } }
    );
    try {
      await sendResetCode(user.email, code);
    } catch (error) {
      console.error('No se pudo enviar el correo de recuperación:', error.message);
    }
  }
  // Respuesta idéntica exista o no el correo.
  res.json({ message: 'Si el correo está registrado, recibirás un código de recuperación.' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, codigo, nuevaPassword } = req.body;
  const invalid = new HttpError(400, 'Código inválido o expirado');
  const user = await User.findOne({ email, rol: ROLES.CLIENTE }).select('+resetCodeHash +resetCodeExpires +resetAttempts');
  if (!user || !user.resetCodeHash || !user.resetCodeExpires || user.resetCodeExpires < new Date() || user.resetAttempts >= 5) {
    throw invalid;
  }
  if (!safeEqual(hashCode(codigo), user.resetCodeHash)) {
    await User.updateOne({ _id: user._id }, { $inc: { resetAttempts: 1 } });
    throw invalid;
  }
  const passwordHash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);
  await User.updateOne(
    { _id: user._id },
    { $set: { passwordHash }, $unset: { resetCodeHash: 1, resetCodeExpires: 1, resetAttempts: 1 } }
  );
  res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
});

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new HttpError(404, 'Usuario no encontrado');
  res.json(publicUser(user));
});
