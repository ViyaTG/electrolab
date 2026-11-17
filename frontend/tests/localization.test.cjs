const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./loadSource.cjs');
const { i18n, translateText } = loadSource('src/i18n/index.js');
const { calendarDays, moveMonth, addDays } = loadSource('src/utils/storeCalendar.js');
test('El idioma traduce controles, mensajes dinámicos y conserva los datos del catálogo', async () => {
  await i18n.changeLanguage('en');
  assert.equal(translateText('Inventario'), 'Inventory');
  assert.equal(translateText('Cantidad (máx. 7)'), 'Quantity (max. 7)');
  assert.equal(translateText('Solo hay 3 disponibles'), 'Only 3 available');
  assert.equal(translateText('ESP32-S3'), 'ESP32-S3');
  assert.equal(translateText('Cliente: Ana'), 'Customer: Ana');
  await i18n.changeLanguage('es');
  assert.equal(translateText('Inventario'), 'Inventario');
});
test('El calendario maneja meses, años y días bisiestos sin cambiar el día', () => {
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('2028-02-29', 1), '2028-03-01');
  assert.equal(moveMonth('2026-12', 1), '2027-01');
  assert.equal(calendarDays('2028-02').filter(Boolean).length, 29);
});
