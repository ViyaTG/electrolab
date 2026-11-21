const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const spec = require('../docs/openapi');

test('OpenAPI cubre las 33 operaciones vigentes, validadores y roles', () => {
  assert.equal(Object.values(spec.paths).reduce((n, path) => n + Object.keys(path).length, 0), 33);
  assert.ok(spec.paths['/products'].post.requestBody.content['application/json'].schema.required.includes('sku'));
  assert.equal(spec.paths['/products/{id}'].put.parameters[0].in, 'path');
  assert.deepEqual(spec.paths['/skus'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/auth/login'].post.security, []);
  assert.equal(spec.components.schemas.Product.properties.codigoBarras.nullable, true);
});

test('Swagger y OpenAPI se sirven por HTTP con recursos locales', async () => {
  const app = express();
  const swagger = require('swagger-ui-express');
  app.get('/api/openapi.json', (req, res) => res.json(spec));
  app.use('/api/docs', swagger.serve, swagger.setup(spec));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    assert.equal((await (await fetch(base + '/api/openapi.json')).json()).openapi, '3.0.3');
    assert.match(await (await fetch(base + '/api/docs/')).text(), /swagger-ui/);
    assert.equal((await fetch(base + '/api/docs/swagger-ui-bundle.js')).status, 200);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
