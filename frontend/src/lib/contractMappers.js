import { formatDate } from './format.js';

// The backend sends money as JSON numbers (for example 0 for "0.00"). The screens compare and print
// two-decimal strings, so normalise once at the API boundary.
export function money(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
    return value;
  }
  return Number(value).toFixed(2);
}

// contracts/openapi.yaml, Order -> the flat view the order, checkout and confirmation screens read.
export function toOrderView(order) {
  if (!order || typeof order !== 'object') return order;
  return {
    ...order,
    subtotal: money(order.subtotal),
    shippingAmount: money(order.shippingAmount),
    grandTotal: money(order.totalAmount ?? order.grandTotal),
    pointsDiscountAmount: money(order.discountAmount ?? order.pointsDiscountAmount),
    pointsRedeemed: order.giftPointsUsed ?? order.pointsRedeemed,
    shippingAddress: order.address ?? order.shippingAddress,
    paymentMethod: order.payment?.method ?? order.paymentMethod,
    estimatedDeliveryDate: order.deliveryDate ? formatDate(order.deliveryDate) : order.estimatedDeliveryDate,
    items: (order.items || []).map((item) => ({
      ...item,
      authorName: item.author ?? item.authorName,
      unitPrice: money(item.unitPrice),
      lineTotal: money(item.lineTotal)
    }))
  };
}
