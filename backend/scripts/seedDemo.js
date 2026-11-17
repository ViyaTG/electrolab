require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Rerunnable: inserts missing records and never resets existing stock or passwords.
const products = [
  ['ESP32-DEVKIT', 'Placa de desarrollo ESP32', 'Microcontroladores', 185, 0, 'Módulo', 'Wi-Fi y Bluetooth, lógica de 3.3 V'],
  ['ARD-UNO-R3', 'Arduino UNO R3 compatible', 'Microcontroladores', 240, 4, 'Placa', 'ATmega328P, alimentación USB'],
  ['ARD-NANO-V3', 'Arduino Nano V3 compatible', 'Microcontroladores', 125, 9, 'Placa', 'ATmega328P, formato compacto'],
  ['RP-PICO', 'Raspberry Pi Pico', 'Microcontroladores', 145, 15, 'Placa', 'RP2040, doble núcleo'],
  ['NE555-DIP8', 'Temporizador NE555', 'Circuitos integrados', 12, 22, 'DIP-8', 'Temporizador de propósito general'],
  ['LM358-DIP8', 'Amplificador operacional LM358', 'Circuitos integrados', 10, 30, 'DIP-8', 'Amplificador operacional dual'],
  ['SN74HC08', 'Compuertas AND 74HC08', 'Circuitos integrados', 18, 31, 'DIP-14', 'Cuatro compuertas AND de dos entradas'],
  ['LM7805-TO220', 'Regulador de voltaje 7805', 'Alimentación', 15, 38, 'TO-220', 'Salida regulada de 5 V'],
  ['RES-220-025', 'Resistencia 220 ohm', 'Pasivos', 1, 45, 'Axial', '1/4 W, tolerancia 5%'],
  ['RES-1K-025', 'Resistencia 1 kiloohm', 'Pasivos', 1, 53, 'Axial', '1/4 W, tolerancia 5%'],
  ['RES-10K-025', 'Resistencia 10 kiloohm', 'Pasivos', 1, 64, 'Axial', '1/4 W, tolerancia 5%'],
  ['CAP-100NF', 'Capacitor cerámico 100 nF', 'Pasivos', 2, 76, 'Radial', 'Desacoplo, 50 V'],
  ['CAP-100UF-25V', 'Capacitor electrolítico 100 uF', 'Pasivos', 4, 87, 'Radial', 'Polarizado, 25 V'],
  ['LED-RED-5MM', 'LED rojo 5 mm', 'Optoelectrónica', 2, 99, 'THT 5 mm', 'Indicador luminoso rojo'],
  ['LED-WHITE-5MM', 'LED blanco 5 mm', 'Optoelectrónica', 3, 112, 'THT 5 mm', 'Indicador luminoso blanco'],
  ['DHT11-MOD', 'Sensor de temperatura DHT11', 'Sensores', 45, 126, 'Módulo', 'Lectura digital de temperatura y humedad'],
  ['HCSR04', 'Sensor ultrasónico HC-SR04', 'Sensores', 38, 141, 'Módulo', 'Medición de distancia, alimentación de 5 V'],
  ['LDR-GL5528', 'Fotorresistencia GL5528', 'Sensores', 8, 157, 'THT', 'Resistencia dependiente de la luz'],
  ['SG90-SERVO', 'Micro servomotor SG90', 'Actuadores', 55, 174, 'Servo', 'Servo de posición, tamaño 9 g'],
  ['BREAD-830', 'Protoboard de 830 puntos', 'Prototipado', 65, 192, 'Tablero', 'Conexiones sin soldadura, rieles de alimentación']
];

async function main() {
  const credentialsPath = path.join(__dirname, '..', '.credentials.local.json');
  const credentials = fs.existsSync(credentialsPath) ? JSON.parse(fs.readFileSync(credentialsPath, 'utf8')) : [];
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 12000 });
  try {
    await Promise.all([User.init(), Product.init(), Category.init()]);
    let createdUsers = 0;
    for (const [rol, total] of [['administrador', 2], ['trabajador', 3]]) {
      for (let i = 1; i <= total; i++) {
        const email = `${rol === 'administrador' ? 'admin' : 'trabajador'}${i}@electrolab.test`;
        const existing = await User.findOne({ email }).select('+passwordHash');
        if (existing) {
          if (existing.rol !== rol) throw new Error(`La cuenta ${email} ya existe con otro rol.`);
          const saved = credentials.find((c) => c.email === email);
          if (saved && !(await bcrypt.compare(saved.password, existing.passwordHash))) throw new Error(`Credencial local desactualizada: ${email}`);
          continue;
        }
        let credential = credentials.find((c) => c.email === email);
        if (!credential) {
          credential = { email, password: `Es!${crypto.randomBytes(15).toString('base64url')}9`, rol };
          credentials.push(credential);
          fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2) + '\n', { mode: 0o600 });
        }
        await User.create({ nombre: `${rol === 'administrador' ? 'Administrador' : 'Trabajador'} ${i}`, email, rol, passwordHash: await bcrypt.hash(credential.password, 12) });
        createdUsers++;
      }
    }
    let createdProducts = 0;
    for (const [index, [sku, nombre, categoryName, precio, cantidad, encapsulado, especificaciones]] of products.entries()) {
      const categoria = await Category.findOneAndUpdate({ nombre: categoryName }, { $setOnInsert: { nombre: categoryName } }, { upsert: true, new: true, collation: { locale: 'es', strength: 1 } });
      const result = await Product.updateOne({ sku }, { $setOnInsert: { sku, nombre, categoria: categoria._id, precio, cantidad, encapsulado, especificaciones, ubicacion: `Gaveta ${String(index + 1).padStart(2, '0')}`, version: 0, actualizadoPor: 'carga-inicial' } }, { upsert: true, runValidators: true });
      createdProducts += result.upsertedCount;
    }
    const savedProducts = await Product.find({ sku: { $in: products.map((p) => p[0]) } });
    console.log(JSON.stringify({ createdUsers, createdProducts, catalogProducts: savedProducts.length, distinctStock: new Set(savedProducts.map((p) => p.cantidad)).size, credentialsFile: credentialsPath }, null, 2));
  } finally { await mongoose.disconnect(); }
}

if (require.main === module) main().catch((error) => { console.error('No se completó la carga:', error.message); process.exitCode = 1; });
module.exports = { products };
