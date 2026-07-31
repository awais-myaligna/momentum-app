import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { mockStore } from '../mocks/mockStore';
import { mockRequest } from '../utils/mockRequest';

export const getProfile = () => mockRequest({ ...mockStore.profile });

export const updateProfile = (updates) => {
  mockStore.profile = { ...mockStore.profile, ...updates };
  return mockRequest({ ...mockStore.profile }, { delay: 400 });
};

// Real Aligna backend integration, used by the Edit Profile screen.
export const getUserProfile = async () => {
  const response = await api.get(ENDPOINTS.PROFILE.GET);
  console.log("🚀 ~ getUserProfile ~ response:", response)
  const user = response?.user || response;

  if (!user) {
    throw new Error(response?.message || 'Profile response missing user data.');
  }

  return user;
};

export const updateUserProfile = async (updates) => {
  const response = await api.put(ENDPOINTS.PROFILE.UPDATE, updates);
  if (!response?.user) {
    throw new Error(response?.message || 'Profile update response missing user data.');
  }

  return { message: response.message, user: response.user };
};
