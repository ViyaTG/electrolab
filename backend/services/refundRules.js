const Refund = require('../models/Refund');
const HttpError = require('../utils/httpError');
const { REFUND_WINDOW_DAYS } = require('../config/constants');

const DAY_MS = 24 * 60 * 60 * 1000;

const refundDeadline = (sale) => new Date(new Date(sale.createdAt).getTime() + REFUND_WINDOW_DAYS * DAY_MS);

// Unidades ya solicitadas (pendientes) por producto, para no sobre-reembolsar.
async function pendingQtyMap(saleIds) {
  const rows = await Refund.aggregate([
    { $match: { venta: { $in: saleIds }, estado: 'pendiente' } },
    { $group: { _id: { venta: '$venta', producto: '$producto' }, qty: { $sum: '$cantidad' } } }
  ]);
  const map = new Map();
  rows.forEach((r) => map.set(`${r._id.venta}:${r._id.producto}`, r.qty));
  return map;
}

async function pendingQtyFor(saleId, productId) {
  const map = await pendingQtyMap([saleId]);
  return map.get(`${saleId}:${productId}`) || 0;
}

// Valida plazo de 90 días y cantidad reembolsable. `referenceDate` permite
// evaluar el plazo a la fecha en que el cliente hizo la solicitud.
function assertRefundable(sale, productId, cantidad, pendingQty = 0, referenceDate = new Date()) {
  const item = sale.items.find((i) => String(i.producto) === String(productId));
  if (!item) throw new HttpError(404, 'El producto no pertenece a esa venta.', { code: 'PRODUCTO_NO_EN_VENTA' });
  if (referenceDate > refundDeadline(sale)) {
    throw new HttpError(400, `El plazo de ${REFUND_WINDOW_DAYS} días para reembolsos ya venció.`, { code: 'PLAZO_VENCIDO' });
  }
  const available = item.cantidad - item.cantidadReembolsada - pendingQty;
  if (cantidad > available) {
    throw new HttpError(409, `Solo quedan ${Math.max(available, 0)} unidad(es) reembolsable(s) de este producto en la venta.`, {
      code: 'CANTIDAD_EXCEDIDA'
    });
  }
  return item;
}

// Agrega a cada venta la fecha límite y las unidades pendientes por ítem.
async function decorateSales(sales) {
  if (!sales.length) return [];
  const pending = await pendingQtyMap(sales.map((s) => s._id));
  return sales.map((sale) => ({
    ...sale,
    reembolsoHasta: refundDeadline(sale).toISOString(),
    items: sale.items.map((it) => ({ ...it, cantidadPendiente: pending.get(`${sale._id}:${it.producto}`) || 0 }))
  }));
}

module.exports = { refundDeadline, pendingQtyFor, assertRefundable, decorateSales };
