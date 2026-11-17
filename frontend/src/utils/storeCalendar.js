export const STORE_TIME_ZONE = 'America/Mexico_City';
export function storeToday(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: STORE_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function addDays(value, amount) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount, 12));
  return date.toISOString().slice(0, 10);
}
export function moveMonth(value, amount) {
  const [year, month] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + amount, 1, 12)).toISOString().slice(0, 7);
}
export function calendarDays(month) {
  const [year, number] = month.split('-').map(Number);
  const offset = (new Date(Date.UTC(year, number - 1, 1, 12)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, number, 0, 12)).getUTCDate();
  return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`)];
}
