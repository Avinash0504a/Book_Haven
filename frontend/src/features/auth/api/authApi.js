import { axiosClient } from '../../../lib/axiosClient.js';

export const authApi = {
  login: async ({ email, password }) => {
    return await axiosClient.post('/auth/login', { email, password });
  },

  register: async ({ fullName, email, password }) => {
    return await axiosClient.post('/auth/register', { fullName, email, password });
  },

  logout: async () => {
    return await axiosClient.post('/auth/logout');
  },

  getMe: async () => {
    return await axiosClient.get('/auth/me');
  },

  updateProfile: async ({ fullName }) => {
    return await axiosClient.patch('/auth/me', { fullName });
  }
};
