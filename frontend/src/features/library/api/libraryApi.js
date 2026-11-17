import { axiosClient } from '../../../lib/axiosClient.js';

export const libraryApi = {
  listLibrary: async () => {
    const res = await axiosClient.get('/library');
    return res;
  },

  readContent: async (bookId) => {
    const res = await axiosClient.get(`/library/${bookId}/content`);
    return res;
  },

  streamAudio: async (bookId) => {
    const res = await axiosClient.get(`/library/${bookId}/audio`, {
      responseType: 'blob'
    });
    return res;
  },

  downloadBook: async (bookId) => {
    const res = await axiosClient.get(`/library/${bookId}/download`, {
      responseType: 'blob'
    });
    return res;
  }
};
