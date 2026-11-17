require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Refund = require('../models/Refund');
const Sku = require('../models/Sku');
const { importExistingSkus } = require('../controllers/skuController');
const { todayInStore } = require('../services/appointments');

// Dedicated review database: production records are read but never changed.
async function main() {
  const source = await mongoose.createConnection(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 }).asPromise();
  try {
    const [users, categories, products] = await Promise.all([
      source.db.collection('usuarios').find({ rol: { $in: ['administrador', 'trabajador'] } }).toArray(),
      source.db.collection('categorias').find().toArray(), source.db.collection('productos').find().toArray()
    ]);
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'electrolab_web_review', serverSelectionTimeoutMS: 15000 });
    for (const [Model, rows] of [[User, users], [Category, categories], [Product, products]]) {
      if (rows.length) await Model.collection.bulkWrite(rows.map((row) => ({ updateOne: { filter: { _id: row._id }, update: { $setOnInsert: row }, upsert: true } })));
    }
    await Promise.all([User.init(), Category.init(), Product.init(), Sale.init(), Refund.init(), Sku.init()]);
    await importExistingSkus();
    const output = path.join(__dirname, '../../releases/web-review-access.json');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    const saved = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')) : null;
    const password = saved?.cliente?.password || `El!${crypto.randomBytes(12).toString('hex')}9`;
    const email = 'review@electrolab.test';
    const customer = await User.findOneAndUpdate({ email }, { $setOnInsert: { email, nombre: 'Cliente de revisión web', rol: 'cliente', passwordHash: await bcrypt.hash(password, 12) } }, { upsert: true, new: true });
    const product = await Product.findOne({ cantidad: { $gt: 30 } });
    if (!product) throw new Error('Falta un producto para preparar la revisión.');
    for (let index = 0; index < 21; index++) {
      await Sale.updateOne({ folio: `VTA-${(index + 1).toString(16).padStart(8, '0').toUpperCase()}` }, { $setOnInsert: {
        cliente: customer._id, clienteNombre: customer.nombre, clienteEmail: email,
        items: [{ producto: product._id, sku: product.sku, nombre: product.nombre, precioUnitario: product.precio, cantidad: 3, cantidadReembolsada: 0 }],
        total: product.precio * 3, pago: { metodo: 'tarjeta_simulada', ultimos4: '1111', titular: customer.nombre }, createdAt: new Date(Date.now() - index * 60000)
      } }, { upsert: true, runValidators: true });
    }
    const fixtureSale = await Sale.findOne({ folio: 'VTA-00000015' });
    for (const [index, estado] of ['pendiente', 'aprobado', 'rechazado'].entries()) {
      await Refund.updateOne({ folio: `RMB-${(index + 1).toString(16).padStart(8, '0').toUpperCase()}` }, { $setOnInsert: {
        tipo: 'app', estado, venta: fixtureSale._id, ventaFolio: fixtureSale.folio, cliente: customer._id, clienteNombre: customer.nombre,
        producto: product._id, sku: product.sku, nombre: product.nombre, cantidad: 1, monto: product.precio,
        motivo: 'Registro de demostración para revisión web', metodoReembolso: 'tarjeta', modalidad: 'correo', reservaActiva: false
      } }, { upsert: true, runValidators: true });
    }
    const tomorrow = new Date(`${todayInStore()}T12:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    await Refund.updateOne({ folio: 'RMB-00000001', estado: 'pendiente' }, { $set: { modalidad: 'cita_fisica', fechaCita: tomorrow.toISOString().slice(0, 10), horaCita: '10:00', reservaActiva: true } });
    const staff = JSON.parse(fs.readFileSync(path.join(__dirname, '../.credentials.local.json'), 'utf8'));
    fs.writeFileSync(output, JSON.stringify({ url: 'http://127.0.0.1:8083', database: 'electrolab_web_review', cliente: { email, password }, personal: staff }, null, 2) + '\n', { mode: 0o600 });
    const reviewEnv = path.join(__dirname, '../review.env.local');
    if (!fs.existsSync(reviewEnv)) fs.writeFileSync(reviewEnv, `PORT=4100\nMONGODB_DB_NAME=electrolab_web_review\nJWT_SECRET=${crypto.randomBytes(32).toString('hex')}\nNODE_ENV=development\nMAIL_PROVIDER=smtp\nSMTP_HOST=\n`, { mode: 0o600 });
    console.log(JSON.stringify({ database: 'electrolab_web_review', products: await Product.countDocuments(), skus: await Sku.countDocuments(), credentialFile: output }));
  } finally { await source.close(); await mongoose.disconnect(); }
}
main().catch((error) => { console.error('No se pudo preparar la revisión:', error.message); process.exitCode = 1; });
