const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { todayInStore } = require('../services/appointments');
const access = JSON.parse(fs.readFileSync(path.join(__dirname, '../../releases/web-review-access.json'), 'utf8'));
const base = 'http://127.0.0.1:4100/api';

async function call(endpoint, token, method = 'GET', body) {
  const response = await fetch(base + endpoint, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
  return { status: response.status, data: await response.json() };
}
async function login(account, staff) {
  const result = await call(staff ? '/auth/staff/login' : '/auth/login', null, 'POST', { email: account.email, password: account.password });
  assert.equal(result.status, 200, 'No se pudo iniciar sesión en la base de revisión.');
  return result.data.token;
}
const later = (days) => {
  const date = new Date(`${todayInStore()}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
async function main() {
  const admin = await login(access.personal.find((account) => account.rol === 'administrador'), true);
  const worker = await login(access.personal.find((account) => account.rol === 'trabajador'), true);
  const customer = await login(access.cliente, false);
  assert.equal((await call('/skus')).status, 401);
  assert.equal((await call('/skus', customer)).status, 403);
  assert.equal((await call('/skus', worker)).status, 200);
  let skuId, productId;
  try {
    const code = `REVIEW-${Date.now()}`;
    const created = await call('/skus', admin, 'POST', { codigo: code.toLowerCase(), descripcion: 'Prueba de integración' });
    assert.equal(created.status, 201); assert.equal(created.data.codigo, code); skuId = created.data._id;
    assert.equal((await call('/skus', admin, 'POST', { codigo: code })).status, 409);
    const category = (await call('/categories')).data[0];
    const product = { sku: code, nombre: 'Producto de prueba temporal', categoria: category._id, precio: 10, cantidad: 8 };
    assert.equal((await call('/products', admin, 'POST', { ...product, sku: 'SKU-NO-REGISTRADO' })).status, 400);
    const saved = await call('/products', admin, 'POST', product);
    assert.equal(saved.status, 201); productId = saved.data._id;
    assert.equal((await call(`/skus/${skuId}`, admin, 'DELETE')).status, 409);
    assert.equal((await call(`/skus/${skuId}`, admin, 'PUT', { codigo: `${code}-EDIT`, descripcion: 'Actualizado' })).status, 200);
    const catalog = (await call('/products', admin)).data;
    const renamed = catalog.find((row) => row._id === productId);
    assert.equal(renamed.sku, `${code}-EDIT`); assert.equal(renamed.version, 1);
    assert.equal((await call(`/products/${productId}`, admin, 'PUT', { version: 0, cantidad: 12, sku: `${code}-EDIT` })).status, 409);
    assert.equal((await call(`/products/${productId}`, admin, 'PUT', { version: 1, cantidad: 12, sku: `${code}-EDIT` })).status, 200);
    console.log('SKU: permisos, alta, duplicados, edición, referencia en productos y eliminación protegida correctos.');

    const sale = (await call('/sales/mine', customer)).data.find((row) => row.folio === 'VTA-00000001');
    const payload = { ventaId: sale._id, productoId: sale.items[0].producto, cantidad: 1, motivo: 'Prueba de reserva concurrente en revisión web', metodoReembolso: 'tarjeta', modalidad: 'cita_fisica', fechaCita: later(2), horaCita: '09:00', fotoEvidencia: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZtcAAAAASUVORK5CYII=' };
    assert.equal((await call('/refunds', customer, 'POST', { ...payload, fechaCita: todayInStore() })).status, 400);
    assert.equal((await call('/refunds', customer, 'POST', { ...payload, horaCita: '09:10' })).status, 400);
    const availability = await call(`/refunds/availability?fecha=${payload.fechaCita}`, customer);
    assert.equal(availability.status, 200); assert.equal(availability.data.horarios.length, 27);
    const simultaneous = await Promise.all([call('/refunds', customer, 'POST', payload), call('/refunds', customer, 'POST', payload)]);
    assert.deepEqual(simultaneous.map((result) => result.status).sort(), [201, 409]);
    assert.equal(simultaneous.find((result) => result.status === 409).data.code, 'APPOINTMENT_TAKEN');
    const booked = simultaneous.find((result) => result.status === 201).data;
    assert.equal((await call(`/refunds/availability?fecha=${payload.fechaCita}`, customer)).data.horarios.find((slot) => slot.hora === '09:00').disponible, false);
    assert.equal((await call(`/refunds/${booked._id}/resolve`, admin, 'PATCH', { decision: 'rechazar' })).status, 200);
    assert.equal((await call(`/refunds/availability?fecha=${payload.fechaCita}`, customer)).data.horarios.find((slot) => slot.hora === '09:00').disponible, true);
    const overbooking = await Promise.all(['09:20', '09:40'].map((horaCita) => call('/refunds', customer, 'POST', { ...payload, fechaCita: later(3), horaCita, cantidad: 2 })));
    assert.deepEqual(overbooking.map((result) => result.status).sort(), [201, 409]);
    assert.equal(overbooking.find((result) => result.status === 409).data.code, 'CANTIDAD_EXCEDIDA');
    await call(`/refunds/${overbooking.find((result) => result.status === 201).data._id}/resolve`, admin, 'PATCH', { decision: 'rechazar' });
    const history = await call('/refunds?limit=20&skip=0', admin);
    assert.equal(history.status, 200); assert.ok(Array.isArray(history.data.items));
    console.log('Citas: fechas pasadas bloqueadas, turnos válidos, reserva atómica, liberación y cantidades concurrentes correctas.');
    console.log('Historial de reembolsos administrativo: respuesta paginada válida.');
  } finally {
    if (productId) await call(`/products/${productId}`, admin, 'DELETE');
    if (skuId) await call(`/skus/${skuId}`, admin, 'DELETE');
  }
}
main().catch((error) => { console.error('Falló la verificación de revisión:', error.message); process.exitCode = 1; });
