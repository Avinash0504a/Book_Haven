import { axiosClient } from '../../../lib/axiosClient.js';

export const walletApi = {
  getWallet: async () => {
    const res = await axiosClient.get('/wallet');
    return res;
  },

  topUpWallet: async ({ amount, paymentMethod, payment }) => {
    const res = await axiosClient.post('/wallet/topup', {
      amount,
      paymentMethod,
      payment
    });
    return res;
  },

  getPointsHistory: async () => {
    const res = await axiosClient.get('/auth/points-history');
    return res;
  }
};
