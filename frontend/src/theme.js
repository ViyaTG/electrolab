export const colors = {
  bg: '#F1F1F3',
  text: '#171719',
  soft: '#38383D',
  muted: '#626268',
  dim: '#6B6B72',
  accent: '#171719',
  primary: '#171719',
  ok: '#303035',
  warn: '#535359',
  danger: '#29292D',
  dangerText: '#29292D',
  border: 'rgba(0, 0, 0, 0.18)',
  field: 'rgba(255, 255, 255, 0.78)'
};

// Semáforo de inventario: agotado, bajo (hasta 30) y disponible.
export function stockLevel(qty) {
  if (qty <= 0) return { color: '#991B1B', bg: '#FEE2E2', label: 'Agotado' };
  if (qty <= 30) return { color: '#854D0E', bg: '#FEF9C3', label: 'Stock bajo' };
  return { color: '#166534', bg: '#DCFCE7', label: 'Disponible' };
}

export const money = (n) => `$${Number(n || 0).toFixed(2)}`;
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
export const fmtDateTime = (d) =>
  new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
