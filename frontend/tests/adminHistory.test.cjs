const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { loadSource } = require('./loadSource.cjs');

function renderHistory(tab, data) {
  const values = [tab, data, false, false, ''];
  const Container = ({ children }) => React.createElement('div', null, children);
  const mocks = {
    react: { ...React, useState: () => [values.shift(), () => {}], useEffect: () => {}, useCallback: (callback) => callback, useRef: () => ({ current: 0 }) },
    'react-native': { StyleSheet: { create: (styles) => styles } },
    '../i18n/ui': { Text: Container },
    '../components/GlassCard': { __esModule: true, default: Container },
    '../components/ui': { Screen: Container, Badge: ({ text }) => React.createElement('span', null, text), Btn: () => null, Empty: ({ text }) => React.createElement('span', null, text), Loading: () => React.createElement('span', null, 'Loading history'), Msg: () => null, Segmented: () => null },
    '../context/AuthContext': { useAuth: () => ({ api: async () => ({ items: [], total: 0 }) }) },
    '../context/NavContext': { useNav: () => ({ back: () => {} }) },
    '../api/client': { errMsg: (error) => error.message },
    '../theme': { colors: {}, money: (number) => `$${number || 0}`, fmtDateTime: () => 'date' }
  };
  const Screen = loadSource('src/screens/AdminHistoryScreen.js', mocks).default;
  return renderToStaticMarkup(React.createElement(Screen));
}
test('Cambiar a reembolsos con datos de ventas aún en memoria no cierra la pantalla', () => {
  const html = renderHistory('reembolsos', { kind: 'ventas', total: 1, items: [{ _id: 'sale', folio: 'VTA-TEST', items: [] }] });
  assert.ok(html.includes('Loading history'));
  assert.ok(!html.includes('VTA-TEST'));
});
test('Un estado antiguo o desconocido se muestra sin lanzar una excepción', () => {
  const html = renderHistory('reembolsos', { kind: 'reembolsos', total: 1, items: [{ _id: 'refund', folio: 'RMB-TEST', estado: 'legacy' }] });
  assert.ok(html.includes('Estado desconocido'));
});
test('Cambiar de reembolsos a ventas tampoco usa los registros de la pestaña anterior', () => {
  assert.ok(renderHistory('ventas', { kind: 'reembolsos', total: 1, items: [{ _id: 'refund', folio: 'RMB-TEST' }] }).includes('Loading history'));
});
