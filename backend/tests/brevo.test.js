const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createBrevoMailer } = require('../utils/brevoMailer');
const env = { BREVO_API_KEY: 'test-only-key', MAIL_FROM_EMAIL: 'sender@example.com', MAIL_FROM_NAME: 'ES' };

test('Envía recuperación vía HTTPS y confirma que el proveedor la aceptó', async () => {
  let request;
  const mailer = createBrevoMailer({ env, request: async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ messageId: 'example-id' }) };
  } });
  assert.equal(await mailer.send('client@example.com', 'Recuperación', 'Código 123456'), 'example-id');
  assert.equal(request.url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(request.options.method, 'POST');
  const body = JSON.parse(request.options.body);
  assert.equal(body.sender.email, env.MAIL_FROM_EMAIL);
  assert.deepEqual(body.to, [{ email: 'client@example.com' }]);
  assert.equal(body.textContent, 'Código 123456');
});
test('No confirma éxito si faltan credenciales, rechazan el envío o falta messageId', async () => {
  await assert.rejects(createBrevoMailer({ env: {} }).send('x@example.com', 'x', 'x'), /BREVO_API_KEY/);
  const rejected = createBrevoMailer({ env, request: async () => ({ ok: false, status: 401, json: async () => ({}) }) });
  await assert.rejects(rejected.send('x@example.com', 'x', 'x'), /HTTP 401/);
  const missing = createBrevoMailer({ env, request: async () => ({ ok: true, json: async () => ({}) }) });
  await assert.rejects(missing.send('x@example.com', 'x', 'x'), /confirmó/);
});
test('La verificación exige un remitente activo y nunca envía mensajes', async () => {
  const mailer = createBrevoMailer({ env, request: async (url, options) => {
    assert.equal(url, 'https://api.brevo.com/v3/senders');
    assert.equal(options.method, 'GET');
    return { ok: true, json: async () => ({ senders: [{ email: env.MAIL_FROM_EMAIL, active: false }] }) };
  } });
  await assert.rejects(mailer.verify(), /verificado/);
});
