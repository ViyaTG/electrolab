const crypto = require('node:crypto');

// Prefijo 20: identificador de uso interno, no un GTIN comercial registrado.
function completeEan13(body) {
  if (!/^\d{12}$/.test(body)) throw new Error('EAN-13 requiere 12 dígitos base.');
  const sum = [...body].reduce((total, digit, index) => total + Number(digit) * (index % 2 ? 3 : 1), 0);
  return body + ((10 - sum % 10) % 10);
}
async function allocateBarcode(Product, session) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = completeEan13('20' + String(crypto.randomInt(0, 10000000000)).padStart(10, '0'));
    if (!(await Product.exists({ codigoBarras: code }).session(session || null))) return code;
  }
  throw new Error('No se pudo reservar un código de barras único.');
}
module.exports = { completeEan13, allocateBarcode };
