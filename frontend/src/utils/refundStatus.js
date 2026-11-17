export const REFUND_STATE = {
  pendiente: { label: 'Pendiente', color: '#535359', bg: 'rgba(0, 0, 0, 0.08)' },
  aprobado: { label: 'Aprobado', color: '#303035', bg: 'rgba(0, 0, 0, 0.08)' },
  rechazado: { label: 'Rechazado', color: '#303035', bg: 'rgba(0, 0, 0, 0.08)' }
};
export const refundStatus = (state) => REFUND_STATE[state] || { label: 'Estado desconocido', color: '#535359', bg: '#EEEEF0' };
