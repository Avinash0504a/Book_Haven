import { axiosClient } from '../../../lib/axiosClient.js';

export const addressApi = {
  getAddresses: async () => {
    return await axiosClient.get('/addresses');
  },

  createAddress: async (data) => {
    return await axiosClient.post('/addresses', data);
  },

  updateAddress: async (id, data) => {
    return await axiosClient.patch(`/addresses/${id}`, data);
  },

  deleteAddress: async (id) => {
    return await axiosClient.delete(`/addresses/${id}`);
  }
};
