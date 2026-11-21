require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const { allocateBarcode } = require('../services/barcodes');

async function main() {
  const apply = process.argv.includes('--apply');
  await connectDB();
  try {
    await Product.init();
    const rows = await Product.find().sort({ sku: 1 }).lean();
    const pending = rows.filter(row => !row.codigoBarras?.trim());
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', products: rows.length, missing: pending.length }));
    if (!apply) return;
    const output = path.resolve(__dirname, '../../releases/barcodes');
    fs.mkdirSync(output, { recursive: true });
    // Respaldo mínimo de los campos que cambiarán, antes de escribir.
    const backup = path.join(output, `backup-${Date.now()}.json`);
    fs.writeFileSync(backup, JSON.stringify(pending.map(row => ({ _id: row._id, codigoBarras: row.codigoBarras ?? null, version: row.version })), null, 2));
    let assigned = 0;
    for (const row of pending) {
      for (let attempt = 0; attempt < 20; attempt++) {
        try {
          const code = await allocateBarcode(Product);
          const result = await Product.updateOne({ _id: row._id, $or: [ { codigoBarras: { $exists: false } }, { codigoBarras: null }, { codigoBarras: /^\s*$/ } ] },
            { $set: { codigoBarras: code, actualizadoPor: 'sistema:codigos-barras' }, $inc: { version: 1 } });
          assigned += result.modifiedCount;
          break;
        } catch (error) { if (error.code !== 11000 || attempt === 19) throw error; }
      }
    }
    const catalog = await Product.find().sort({ sku: 1 }).select('sku nombre codigoBarras').lean();
    fs.writeFileSync(path.join(output, 'catalogo.json'), JSON.stringify(catalog, null, 2));
    const quote = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    fs.writeFileSync(path.join(output, 'catalogo.csv'), '\uFEFF' + ['sku,nombre,codigoBarras', ...catalog.map(row => [row.sku, row.nombre, row.codigoBarras].map(quote).join(','))].join('\r\n'));
    console.log(JSON.stringify({ assigned, total: catalog.length, catalogFile: path.join(output, 'catalogo.json') }));
  } finally { await mongoose.disconnect(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
