import * as SecureStore from 'expo-secure-store';

import api, { AUTH_TOKEN_KEY } from '../api/axios';

const normalizeUser = (user, fallback = {}) => ({
  id: user?.id || fallback.id || '',
  name: user?.name || user?.full_name || fallback.name || '',
  email: user?.email || fallback.email || '',
});

export const login = async ({ email, password }) => {
  const response = await api.post('/login', { email, password });
  const data = response?.data;

  if (!data?.user || !data?.token) {
    throw new Error(response?.message || 'Login response missing user or token.');
  }

  const normalizedUser = normalizeUser(data.user, {
    name: data.user?.first_name ? `${data.user.first_name} ${data.user.last_name || ''}`.trim() : '',
    email: data.user?.email || email,
  });

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token);

  return {
    user: normalizedUser,
    token: data.token,
    hasCompletedBaseline: Boolean(data.hasCompletedBaseline),
    message: response?.message,
  };
};

export const register = async (payload) => {
  const response = await api.post('/register', payload);
  const data = response?.data;

  const token = data?.token || data?.auth?.access_token;
  if (!data?.user || !token) {
    throw new Error(response?.message || 'Register response missing user or token.');
  }

  const normalizedUser = normalizeUser(data.user, {
    name: payload?.first_name ? `${payload.first_name} ${payload.last_name || ''}`.trim() : payload?.name || '',
    email: payload?.email || '',
  });

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);

  return {
    user: normalizedUser,
    token,
    hasCompletedBaseline: Boolean(data.hasCompletedBaseline),
    message: response?.message,
  };
};

export const logout = async () => {
  try {
    await api.post('/logout');
  } finally {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  }
  return { success: true };
};

export const getStoredToken = () => SecureStore.getItemAsync(AUTH_TOKEN_KEY);
