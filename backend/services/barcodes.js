const crypto = require('node:crypto');

// Prefijo 20: identificador de uso interno, no un GTIN comercial registrado.
/**
 * Añade el dígito de control de pesos alternos 1 y 3.
 * @param {string} body Exactamente doce dígitos, incluidos ceros iniciales.
 * @returns {string} Identificador de trece dígitos.
 * @throws {Error} Si la base no contiene doce dígitos.
 */
function completeEan13(body) {
  if (!/^\d{12}$/.test(body)) throw new Error('EAN-13 requiere 12 dígitos base.');
  const sum = [...body].reduce((total, digit, index) => total + Number(digit) * (index % 2 ? 3 : 1), 0);
  return body + ((10 - sum % 10) % 10);
}
/**
 * Busca hasta veinte candidatos internos libres. El índice único arbitra carreras.
 * @param {import('mongoose').Model} Product Modelo de catálogo.
 * @param {import('mongoose').ClientSession} [session] Sesión de la transacción.
 * @returns {Promise<string>} Código EAN-13 interno disponible al consultar.
 */
async function allocateBarcode(Product, session) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = completeEan13('20' + String(crypto.randomInt(0, 10000000000)).padStart(10, '0'));
    if (!(await Product.exists({ codigoBarras: code }).session(session || null))) return code;
  }
  throw new Error('No se pudo reservar un código de barras único.');
}
module.exports = { completeEan13, allocateBarcode };
