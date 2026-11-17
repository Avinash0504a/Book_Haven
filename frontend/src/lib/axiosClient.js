import axios from 'axios';
import { getErrorMessage } from './errors.js';

let inMemoryToken = null;
let onAuthFailureCallback = null;

export function setAuthToken(token) {
  inMemoryToken = token;
}

export function getAuthToken() {
  return inMemoryToken;
}

export function clearAuthToken() {
  inMemoryToken = null;
}

export function setOnAuthFailure(callback) {
  onAuthFailureCallback = callback;
}

export const axiosClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor attaches in-memory token
axiosClient.interceptors.request.use((config) => {
  if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
});

// Response interceptor unwraps envelope and normalizes errors
axiosClient.interceptors.response.use(
  (response) => {
    // If response follows ApiResponse envelope { success, data, message, code }
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success) {
        return response.data.data !== undefined ? response.data.data : response.data;
      }
    }
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    const responseData = error.response?.data;

    if (status === 401) {
      clearAuthToken();
      if (typeof onAuthFailureCallback === 'function') {
        onAuthFailureCallback();
      }
    }

    const normalizedError = new Error();
    normalizedError.status = status;
    normalizedError.code = responseData?.code || 'UNKNOWN_ERROR';
    normalizedError.fieldErrors = responseData?.data?.fieldErrors || [];
    normalizedError.message = getErrorMessage(normalizedError);
    normalizedError.raw = error;

    return Promise.reject(normalizedError);
  }
);
