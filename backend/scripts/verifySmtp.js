require('dotenv').config();
const { verifyMail } = require('../utils/mailer');

verifyMail().then(() => {
  console.log(`Configuración de correo correcta (${process.env.MAIL_PROVIDER || 'smtp'}). No se envió ningún correo.`);
}).catch((error) => {
  console.error('No se pudo verificar el correo:', error.code || error.message);
  process.exitCode = 1;
});
