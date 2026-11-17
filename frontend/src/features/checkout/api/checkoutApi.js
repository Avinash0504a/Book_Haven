import { axiosClient } from '../../../lib/axiosClient.js';
import { money, toOrderView } from '../../../lib/contractMappers.js';

export const checkoutApi = {
  validateCheckout: async () => {
    return await axiosClient.post('/checkout/validate');
  },

  listBanks: async () => {
    return await axiosClient.get('/checkout/banks');
  },

  applyPoints: async ({ points }) => {
    const result = await axiosClient.post('/checkout/apply-points', { points });
    return {
      ...result,
      discountAmount: money(result.discountAmount),
      payableAmount: money(result.payableAmount)
    };
  },

  createOrder: async ({ addressId, paymentMethod, giftPointsToUse = 0 }, idempotencyKey) => {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};
    return toOrderView(
      await axiosClient.post(
        '/checkout/order',
        { addressId, paymentMethod, giftPointsToUse },
        { headers }
      )
    );
  },

  confirmPayment: async ({ orderId, payment }) => {
    return toOrderView(await axiosClient.post('/checkout/confirm-payment', { orderId, payment }));
  },

  failPayment: async ({ orderId }) => {
    return toOrderView(await axiosClient.post('/checkout/fail-payment', { orderId }));
  }
};
