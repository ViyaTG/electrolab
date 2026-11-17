const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SLOTS, isFutureDay, todayInStore, isDate } = require('../services/appointments');
const { refundCreate } = require('../validators/schemas');

test('27 citas de 20 minutos desde las 09:00, con la última a las 17:40', () => {
  assert.equal(SLOTS.length, 27);
  assert.equal(SLOTS[0], '09:00'); assert.equal(SLOTS.at(-1), '17:40');
  assert.equal(new Set(SLOTS).size, 27);
  assert.equal(SLOTS.includes('18:00'), false);
});
test('La fecha se compara en Ciudad de México y excluye hoy y días inválidos', () => {
  const now = new Date('2026-11-18T02:00:00Z');
  assert.equal(todayInStore(now), '2026-11-17');
  assert.equal(isFutureDay('2026-11-17', now), false);
  assert.equal(isFutureDay('2026-11-16', now), false);
  assert.equal(isFutureDay('2026-11-18', now), true);
  assert.equal(isDate('2028-02-30'), false); assert.equal(isDate('2028-02-29'), true);
});
test('La API exige hora válida para citas físicas y no la acepta por correo', () => {
  const base = { ventaId: '1234567890abcdef12345678', productoId: '1234567890abcdef12345678', cantidad: 1, motivo: 'Producto de prueba que no funciona', metodoReembolso: 'tarjeta', modalidad: 'cita_fisica', fechaCita: '2099-01-01', fotoEvidencia: 'data:image/png;base64,AAAA' };
  assert.equal(refundCreate.safeParse(base).success, false);
  assert.equal(refundCreate.safeParse({ ...base, horaCita: '09:10' }).success, false);
  assert.equal(refundCreate.safeParse({ ...base, horaCita: '18:00' }).success, false);
  assert.equal(refundCreate.safeParse({ ...base, horaCita: '17:40' }).success, true);
  assert.equal(refundCreate.safeParse({ ...base, modalidad: 'correo', horaCita: '09:00' }).success, false);
});
