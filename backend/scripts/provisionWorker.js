require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { STAFF_ROLES } = require('../config/constants');

const SALT_ROUNDS = 12;

// Uso: npm run provision -- <email> '<password>' "<nombre>" [trabajador|administrador] [--reset]
async function provisionStaff() {
  const args = process.argv.slice(2);
  const reset = args.includes('--reset');
  const [email, plainPassword, nombre = 'Trabajador de Tienda', rol = 'administrador'] = args.filter((a) => a !== '--reset');

  if (!email || !plainPassword) {
    console.error('Uso: npm run provision -- <email> \'<password>\' "<nombre>" [trabajador|administrador] [--reset]');
    process.exit(1);
  }
  if (!STAFF_ROLES.includes(rol)) {
    console.error(`Rol inválido. Usa: ${STAFF_ROLES.join(' o ')}`);
    process.exit(1);
  }
  if (plainPassword.length < 8) {
    console.error('La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing && !reset) {
      console.error(`Error: ya existe una cuenta con el correo ${normalizedEmail}. Agrega --reset para cambiarle la contraseña.`);
      process.exit(1);
    }
    if (existing && reset) {
      if (!STAFF_ROLES.includes(existing.rol)) {
        console.error('Esa cuenta es de un cliente: no se puede restablecer desde este script.');
        process.exit(1);
      }
      await User.updateOne({ _id: existing._id }, { $set: { passwordHash } });
      console.log(`Contraseña restablecida para ${normalizedEmail}.`);
      process.exit(0);
    }

    const user = await User.create({ nombre, email: normalizedEmail, passwordHash, rol });
    console.log('====================================================');
    console.log('Cuenta aprovisionada exitosamente en MongoDB Atlas:');
    console.log(`ID:     ${user._id}`);
    console.log(`Nombre: ${user.nombre}`);
    console.log(`Email:  ${user.email}`);
    console.log(`Rol:    ${user.rol}`);
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('Error durante el aprovisionamiento:', error.message);
    process.exit(1);
  }
}

provisionStaff();
