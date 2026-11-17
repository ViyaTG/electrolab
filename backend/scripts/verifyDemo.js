const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

async function main() {
  const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.credentials.local.json'), 'utf8'));
  assert.equal(credentials.length, 5);
  const base = 'http://127.0.0.1:4000/api';
  for (const account of credentials) {
    const response = await fetch(`${base}/auth/staff/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: account.email, password: account.password }), signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, 200, `Acceso fallido: ${account.email}`);
    const data = await response.json();
    assert.equal(data.user.rol, account.rol);
    console.log(`Acceso correcto: ${account.email} (${data.user.rol})`);
  }
  const response = await fetch(`${base}/products`, { signal: AbortSignal.timeout(10000) });
  assert.equal(response.status, 200);
  const products = await response.json();
  assert.ok(products.length >= 20);
  console.log(`Catálogo API: ${products.length} productos.`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
