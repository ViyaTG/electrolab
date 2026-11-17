import i18next from 'i18next';
import en from './en';

export const i18n = i18next.createInstance();
i18n.init({ lng: 'es', fallbackLng: 'es', initImmediate: false, resources: { es: { translation: {} }, en: { translation: en } }, keySeparator: false, nsSeparator: false, interpolation: { escapeValue: false }, returnNull: false });
export const locale = () => i18n.language === 'en' ? 'en-US' : 'es-MX';

const patterns = [
  [/^Cantidad \(máx\. (.+)\)$/, 'Quantity (max. $1)'],
  [/^La cantidad debe estar entre 1 y (.+)\.$/, 'Quantity must be between 1 and $1.'],
  [/^Solo hay (.+) disponibles$/, 'Only $1 available'],
  [/^Sin resultados para "(.*)"\.$/, 'No results for "$1".'],
  [/^¿Eliminar "(.*)"\?$/, 'Delete "$1"?'],
  [/^¿Eliminar "(.*)" del inventario\?$/, 'Remove "$1" from inventory?'],
  [/^Pagar (.+)$/, 'Pay $1'],
  [/^Todo en orden: no hay productos con menos de (.+) unidades\.$/, 'All clear: there are no products with fewer than $1 units.'],
  [/^Preséntalo en tienda el (.+) junto con el producto\.$/, 'Bring it to the store on $1 along with the product.'],
  [/^La venta (.+) superó el plazo de 90 días\.$/, 'Sale $1 is outside the 90-day refund period.'],
  [/^cita física (.+)$/, 'in-store appointment $1'],
  [/^Pendientes \((.*)$/, 'Pending ($1'],
  [/^, (.+) productos$/, ', $1 products'],
  [/^• (.+) reembolsado\(s\)$/, '• $1 refunded'],
  [/^• (.+) en trámite$/, '• $1 pending'],
  [/^Elige el día (.+)$/, 'Choose day $1'],
  [/^Debe tener al menos (.+) caracteres$/, 'Must have at least $1 characters'],
  [/^Debe tener como máximo (.+) caracteres$/, 'Must have at most $1 characters'],
  [/^Debe ser mayor o igual a (.+)$/, 'Must be greater than or equal to $1'],
  [/^Debe ser menor o igual a (.+)$/, 'Must be less than or equal to $1'],
  [/^Reembolso (.+) registrado por (\$[\d,.]+)\. (.*)$/, (_, folio, amount, detail) => `Refund ${folio} recorded for ${amount}. ${translateText(detail)}`],
  [/^Stock insuficiente para "(.*)"\. Disponible: (.+)\.$/, 'Insufficient stock for "$1". Available: $2.']
];

export function translateText(value) {
  if (typeof value !== 'string' || i18n.language !== 'en') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  const exact = en[trimmed];
  if (exact) return value.replace(trimmed, i18n.t(trimmed));
  if (trimmed.endsWith(':') && en[trimmed.slice(0, -1)]) return value.replace(trimmed, `${i18n.t(trimmed.slice(0, -1))}:`);
  for (const [pattern, replacement] of patterns) {
    if (pattern.test(trimmed)) return value.replace(trimmed, trimmed.replace(pattern, replacement));
  }
  if (value.includes(' • ')) return value.split(' • ').map(translateText).join(' • ');
  if (value.includes(': ')) return value.split(': ').map((part, index) => translateText(index === 0 ? `${part}:` : part)).join(' ').replace(/: /, ': ');
  return value;
}
