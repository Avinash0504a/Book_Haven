import { axiosClient } from '../../../lib/axiosClient.js';

export const catalogApi = {
  getBooks: async (params = {}) => {
    return await axiosClient.get('/products', { params });
  },

  getCategories: async () => {
    return await axiosClient.get('/categories');
  },

  getCategoryBooks: async (categoryId, params = {}) => {
    return await axiosClient.get(`/categories/${categoryId}/books`, { params });
  },

  getBrands: async () => {
    return await axiosClient.get('/brands');
  },

  getBrandBooks: async (brandId, params = {}) => {
    return await axiosClient.get(`/brands/${brandId}/books`, { params });
  },

  getRecommendations: async () => {
    return await axiosClient.get('/recommendations');
  },

  getBook: async (id, pincode) => {
    const params = pincode ? { pincode } : {};
    return await axiosClient.get(`/products/${id}`, { params });
  },

  getRelatedBooks: async (id) => {
    return await axiosClient.get(`/products/${id}/related`);
  },

  notifyMe: async (id) => {
    return await axiosClient.post(`/products/${id}/notify`);
  },

  estimateDelivery: async (pincode) => {
    return await axiosClient.get('/delivery/estimate', { params: { pincode } });
  }
};
