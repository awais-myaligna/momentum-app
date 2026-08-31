import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { createApiError, ERROR_TYPES } from '../utils/apiError';

export const AUTH_TOKEN_KEY = 'momentum_auth_token';

// Global 401 handler — registered by AuthContext on mount so that any
// expired/revoked token detected anywhere in the app triggers a full logout
// without every individual service/screen needing to handle it themselves.
let _onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  _onUnauthorized = fn;
};
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

// Dev-only request/response logging — every call through this instance
// passes through here, so nothing per-service is needed. Stripped in
// production builds via the __DEV__ guard.
const logRequest = (config) => {
  if (!__DEV__) return;
  const fullPath = `${config.baseURL || ''}${config.url}`;
  // eslint-disable-next-line no-console
  console.log(`[API →] ${config.method?.toUpperCase()} ${fullPath}`, {
    payload: config.data,
    params: config.params,
  });
};

const logResponse = (response) => {
  if (!__DEV__) return;
  const fullPath = `${response.config?.baseURL || ''}${response.config?.url}`;
  // eslint-disable-next-line no-console
  console.log(`[API ✓] ${response.config?.method?.toUpperCase()} ${fullPath} (${response.status})`, response.data);
};

const logError = (error) => {
  if (!__DEV__) return;
  const fullPath = `${error.config?.baseURL || ''}${error.config?.url}`;
  // eslint-disable-next-line no-console
  console.log(
    `[API ✗] ${error.config?.method?.toUpperCase()} ${fullPath} (${error.response?.status ?? 'no response'})`,
    error.response?.data ?? error.message
  );
};

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    logRequest(config);
    return config;
  },
  (error) =>
    Promise.reject(createApiError(ERROR_TYPES.UNKNOWN, 'Something went wrong while preparing your request.', error))
);

axiosInstance.interceptors.response.use(
  (response) => {
    logResponse(response);
    return response.data;
  },
  (error) => {
    logError(error);

    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(createApiError(ERROR_TYPES.TIMEOUT, undefined, error));
      }
      return Promise.reject(createApiError(ERROR_TYPES.OFFLINE, undefined, error));
    }

    // Backend envelope: { success: false, message, code, errors? } — surface
    // the real message/code so callers (services/screens) show what the
    // backend actually said instead of Axios's generic status-code text.
    const { status, data } = error.response;
    const extra = { code: data?.code, errors: data?.errors };
    if (status === 401) {
      // Notify AuthContext (or any registered handler) so the session is
      // cleared immediately — the user is redirected to login rather than
      // left in a broken "authenticated but all APIs failing" state.
      _onUnauthorized?.();
      return Promise.reject(createApiError(ERROR_TYPES.UNAUTHORIZED, data?.message, error, extra));
    }
    if (status >= 500) {
      return Promise.reject(createApiError(ERROR_TYPES.SERVER, data?.message, error, extra));
    }
    return Promise.reject(createApiError(ERROR_TYPES.UNKNOWN, data?.message, error, extra));
  }
);

export default axiosInstance;
