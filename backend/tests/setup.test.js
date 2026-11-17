const { test } = require('node:test');
const assert = require('node:assert/strict');
const { smtpOptions } = require('../utils/mailer');
const { products } = require('../scripts/seedDemo');

test('SMTP requiere autenticación y TLS en los puertos de envío', () => {
  assert.equal(smtpOptions({}), null);
  assert.throws(() => smtpOptions({ SMTP_HOST: 'smtp.example.com' }), /SMTP_USER/);
  const env = { SMTP_HOST: 'smtp.example.com', SMTP_USER: 'sender@example.com', SMTP_PASS: 'test-only' };
  assert.equal(smtpOptions(env).requireTLS, true);
  assert.equal(smtpOptions({ ...env, SMTP_PORT: '465' }).secure, true);
  assert.throws(() => smtpOptions({ ...env, SMTP_PORT: '465', SMTP_SECURE: 'false' }), /465/);
  assert.throws(() => smtpOptions({ ...env, SMTP_PORT: 'wrong' }), /puerto/);
});

test('El catálogo inicial contiene 20 SKU y cantidades distintas, con todos los niveles de stock', () => {
  assert.equal(products.length, 20);
  assert.equal(new Set(products.map((p) => p[0])).size, 20);
  assert.equal(new Set(products.map((p) => p[4])).size, 20);
  assert.ok(products.some((p) => p[4] === 0));
  assert.ok(products.some((p) => p[4] > 0 && p[4] <= 30));
  assert.ok(products.some((p) => p[4] > 30));
});
