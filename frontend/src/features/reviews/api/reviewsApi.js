import { axiosClient } from '../../../lib/axiosClient.js';

export const reviewsApi = {
  listReviews: async (bookId) => {
    const res = await axiosClient.get(`/products/${bookId}/reviews`);
    return res;
  },

  createReview: async (bookId, { rating, body }) => {
    const res = await axiosClient.post(`/products/${bookId}/reviews`, {
      rating,
      body
    });
    return res;
  }
};
