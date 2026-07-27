import * as SecureStore from 'expo-secure-store';

import api, { AUTH_TOKEN_KEY } from '../api/axios';

const normalizeUser = (user, fallback = {}) => ({
  id: user?.id || fallback.id || '',
  name: user?.name || user?.full_name || fallback.name || '',
  email: user?.email || fallback.email || '',
});

export const login = async ({ email, password }) => {
  const response = await api.post('/login', { email, password });
  const { user, token } = response || {};

  if (!user || !token) {
    throw new Error(response?.message || 'Login response missing user or token.');
  }

  const normalizedUser = normalizeUser(user, {
    name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
    email: user?.email || email,
  });

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);

  return {
    user: normalizedUser,
    token,
    hasCompletedBaseline: Boolean(user?.hasCompletedBaseline),
    message: response?.message,
  };
};

export const register = async (payload) => {
  const response = await api.post('/register', payload);
  const { user, token } = response || {};

  if (!user || !token) {
    throw new Error(response?.message || 'Register response missing user or token.');
  }

  const normalizedUser = normalizeUser(user, {
    name: payload?.first_name ? `${payload.first_name} ${payload.last_name || ''}`.trim() : payload?.name || '',
    email: payload?.email || '',
  });

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);

  return {
    user: normalizedUser,
    token,
    hasCompletedBaseline: Boolean(user?.hasCompletedBaseline),
    message: response?.message,
  };
};

export const sendOtp = async ({ email }) => {
  const response = await api.post('/send-otp', { email });
  return { message: response?.message };
};

export const verifyOtp = async ({ email, otp }) => {
  const response = await api.post('/verify-otp', { email, otp });
  const resetToken = response?.reset_token;

  if (!resetToken) {
    throw new Error(response?.message || 'OTP verification response missing reset token.');
  }

  return { message: response?.message, resetToken };
};

export const resetPassword = async ({ email, token, password, password_confirmation }) => {
  const response = await api.post('/reset-password', { email, token, password, password_confirmation });
  return { message: response?.message };
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
