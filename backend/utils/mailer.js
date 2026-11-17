let transporter;
const { createBrevoMailer } = require('./brevoMailer');

function smtpOptions(env = process.env) {
  if (!env.SMTP_HOST) return null;
  for (const key of ['SMTP_USER', 'SMTP_PASS']) {
    if (!env[key]) throw new Error(`Falta configurar ${key} en backend/.env`);
  }
  const port = Number(env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT debe ser un puerto válido.');
  const secure = env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : port === 465;
  if (port === 465 && !secure) throw new Error('El puerto SMTP 465 requiere SMTP_SECURE=true.');
  return {
    host: env.SMTP_HOST, port, secure, requireTLS: !secure,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000
  };
}

const getTransporter = () => {
  const options = smtpOptions();
  if (!options) return null;
  if (!transporter) {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport(options);
  }
  return transporter;
};

exports.sendResetCode = async (to, code) => {
  const subject = 'ES - Código de recuperación de contraseña';
  const text = `ES\n\nTu código de recuperación es: ${code}\n\nVence en 15 minutos. Escríbelo en la aplicación para elegir una nueva contraseña.\n\nNo compartas este código. Si no solicitaste recuperar tu cuenta, ignora este mensaje.`;
  const provider = process.env.MAIL_PROVIDER || 'smtp';
  if (provider === 'brevo') return createBrevoMailer().send(to, subject, text);
  if (provider !== 'smtp') throw new Error('MAIL_PROVIDER debe ser smtp o brevo.');
  const t = getTransporter();
  if (!t) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DESARROLLO] Código de recuperación para ${to}: ${code}`);
    } else {
      throw new Error('SMTP no configurado: no se envió el código de recuperación.');
    }
    return;
  }
  await t.sendMail({
    from: process.env.MAIL_FROM?.includes('@') ? process.env.MAIL_FROM : { name: process.env.MAIL_FROM || 'ES', address: process.env.SMTP_USER },
    to,
    subject, text
  });
};

exports.verifySMTP = async () => {
  const t = getTransporter();
  if (!t) throw new Error('Configura SMTP_HOST, SMTP_USER y SMTP_PASS en backend/.env para activar el correo.');
  return t.verify();
};
exports.smtpOptions = smtpOptions;
exports.verifyMail = async () => {
  const provider = process.env.MAIL_PROVIDER || 'smtp';
  if (provider === 'brevo') return createBrevoMailer().verify();
  if (provider !== 'smtp') throw new Error('MAIL_PROVIDER debe ser smtp o brevo.');
  return exports.verifySMTP();
};
