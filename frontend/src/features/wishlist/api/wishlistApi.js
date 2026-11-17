import { axiosClient } from '../../../lib/axiosClient.js';

export const wishlistApi = {
  listWishlist: async (pincode) => {
    const res = await axiosClient.get('/wishlist', {
      params: pincode ? { pincode } : undefined
    });
    return res;
  },

  addWishlistItem: async (bookId) => {
    const res = await axiosClient.post('/wishlist', { bookId });
    return res;
  },

  removeWishlistItem: async (bookId) => {
    const res = await axiosClient.delete(`/wishlist/${bookId}`);
    return res;
  }
};
