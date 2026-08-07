import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { createApiError, ERROR_TYPES } from '../utils/apiError';

export const AUTH_TOKEN_KEY = 'momentum_auth_token';
const BASE_URL = 'https://devapi.myaligna.com/api';
const REQUEST_TIMEOUT = 15000;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'x-api-key': '12345678',
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) =>
    Promise.reject(createApiError(ERROR_TYPES.UNKNOWN, 'Something went wrong while preparing your request.', error))
);

axiosInstance.interceptors.response.use(
  (response) => response.data,
  // (error) => {
  //   if (!error.response) {
  //     if (error.code === 'ECONNABORTED') {
  //       return Promise.reject(createApiError(ERROR_TYPES.TIMEOUT, undefined, error));
  //     }
  //     return Promise.reject(createApiError(ERROR_TYPES.OFFLINE, undefined, error));
  //   }

  //   const { status, data } = error.response;
  //   if (status === 401) {
  //     return Promise.reject(createApiError(ERROR_TYPES.UNAUTHORIZED, data?.message, error));
  //   }
  //   if (status >= 500) {
  //     return Promise.reject(createApiError(ERROR_TYPES.SERVER, data?.message, error));
  //   }
  //   return Promise.reject(createApiError(ERROR_TYPES.UNKNOWN, data?.message, error));
  // }
);

export default axiosInstance;
