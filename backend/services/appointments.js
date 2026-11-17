const TIME_ZONE = 'America/Mexico_City';
const SLOTS = Array.from({ length: 27 }, (_, index) => {
  const minutes = 9 * 60 + index * 20;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});
function todayInStore(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function isFutureDay(value, now = new Date()) { return isDate(value) && value > todayInStore(now); }
module.exports = { TIME_ZONE, SLOTS, todayInStore, isDate, isFutureDay };
