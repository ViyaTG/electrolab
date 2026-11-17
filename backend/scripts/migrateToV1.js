require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Migración desde el MVP v0.1.0 (idempotente: se puede ejecutar más de una vez):
//  1) Copia `trabajadores` -> `usuarios` conservando contraseñas y roles.
//  2) Convierte `categoria` (texto) de cada producto en una referencia a la colección `categorias`.
//  3) Asegura `precio` en los productos existentes (0 si no lo tenían).
async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  await Promise.all([User.init(), Category.init(), Product.init()]);

  let movedUsers = 0;
  const legacyWorkers = await db.collection('trabajadores').find().toArray();
  for (const w of legacyWorkers) {
    const exists = await db.collection('usuarios').findOne({ email: w.email });
    if (exists) continue;
    await db.collection('usuarios').insertOne({
      nombre: w.nombre,
      email: w.email,
      passwordHash: w.passwordHash,
      rol: w.rol || 'trabajador',
      createdAt: w.createdAt || new Date(),
      updatedAt: new Date(),
      __v: 0
    });
    movedUsers++;
  }

  let convertedProducts = 0;
  const products = await db.collection('productos').find().toArray();
  for (const p of products) {
    const set = {};
    if (typeof p.categoria === 'string') {
      const name = p.categoria.trim() || 'Sin categoría';
      const category = await Category.findOneAndUpdate(
        { nombre: name },
        { $setOnInsert: { nombre: name } },
        { upsert: true, new: true, collation: { locale: 'es', strength: 1 } }
      );
      set.categoria = category._id;
    }
    if (typeof p.precio !== 'number') set.precio = 0;
    if (Object.keys(set).length) {
      await db.collection('productos').updateOne({ _id: p._id }, { $set: set });
      convertedProducts++;
    }
  }

  console.log(`Usuarios copiados: ${movedUsers}. Productos actualizados: ${convertedProducts}.`);
  console.log('Revisa los precios: los productos antiguos quedaron en $0 hasta que los edites.');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Error en la migración:', err.message);
  process.exit(1);
});
