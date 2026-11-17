import { axiosClient } from '../../../lib/axiosClient.js';

export const writersApi = {
  listAuthors: async () => {
    const res = await axiosClient.get('/authors');
    return res;
  },

  getAuthor: async (slug, pincode) => {
    const res = await axiosClient.get(`/authors/${slug}`, {
      params: pincode ? { pincode } : undefined
    });
    return res;
  },

  listFollowing: async () => {
    const res = await axiosClient.get('/following');
    return res;
  },

  followAuthor: async (authorSlug) => {
    const res = await axiosClient.post('/following', { authorSlug });
    return res;
  },

  unfollowAuthor: async (slug) => {
    const res = await axiosClient.delete(`/following/${slug}`);
    return res;
  }
};
