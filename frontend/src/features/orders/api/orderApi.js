import { axiosClient } from '../../../lib/axiosClient.js';
import { toOrderView } from '../../../lib/contractMappers.js';

export const orderApi = {
  listOrders: async () => {
    const orders = await axiosClient.get('/orders');
    return Array.isArray(orders) ? orders.map(toOrderView) : orders;
  },

  getOrder: async (id) => {
    return toOrderView(await axiosClient.get(`/orders/${id}`));
  },

  buyAgain: async (id) => {
    return await axiosClient.post(`/orders/${id}/buy-again`);
  },

  getCancelPreview: async (id, items = []) => {
    const params = new URLSearchParams();
    if (items && items.length > 0) {
      items.forEach((item) => {
        params.append('items', `${item.orderItemId}:${item.quantity}`);
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return await axiosClient.get(`/orders/${id}/cancel-preview${query}`);
  },

  cancelOrder: async (id, { reason, note, items, refundMethod, bank, expectedRefund }) => {
    return toOrderView(
      await axiosClient.post(`/orders/${id}/cancel`, {
        reason,
        note,
        items,
        refundMethod,
        bank,
        expectedRefund
      })
    );
  }
};
