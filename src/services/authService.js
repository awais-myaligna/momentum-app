import * as SecureStore from 'expo-secure-store';

import { AUTH_TOKEN_KEY } from '../api/axios';
import { mockStore, resetMockStore } from '../mocks/mockStore';
import { mockRequest } from '../utils/mockRequest';

export const login = async ({ email, password }) => {
  const data = await mockRequest({
    token: `mock-jwt-${Date.now()}`,
    user: { id: 'user-1', name: mockStore.profile.name, email },
  });

  mockStore.user = data.user;
  mockStore.isAuthenticated = true;
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token);
  return data;
};

export const register = async ({ name, email, password }) => {
  const data = await mockRequest({
    token: `mock-jwt-${Date.now()}`,
    user: { id: 'user-1', name, email },
  });

  mockStore.user = data.user;
  mockStore.profile.name = name;
  mockStore.profile.email = email;
  mockStore.isAuthenticated = true;
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token);
  return data;
};

export const logout = async () => {
  await mockRequest({ success: true }, { delay: 300 });
  resetMockStore();
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  return { success: true };
};

export const getStoredToken = () => SecureStore.getItemAsync(AUTH_TOKEN_KEY);
