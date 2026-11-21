const test = require('node:test');
const assert = require('node:assert/strict');
const { completeEan13, allocateBarcode } = require('../services/barcodes');
test('EAN-13 calcula el dígito de control conocido y conserva ceros', () => {
  assert.equal(completeEan13('400638133393'), '4006381333931');
  assert.equal(completeEan13('200000000000'), '2000000000008');
  assert.throws(() => completeEan13('123'));
});
test('El generador evita códigos ya utilizados', async () => {
  let attempts = 0;
  const model = { exists: () => ({ session: async () => ++attempts === 1 }) };
  const code = await allocateBarcode(model);
  assert.match(code, /^20\d{11}$/);
  assert.equal(code, completeEan13(code.slice(0, 12)));
  assert.equal(attempts, 2);
});
