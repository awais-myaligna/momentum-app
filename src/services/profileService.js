import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

// Real Aligna backend integration, used by Edit Profile, Settings,
// Language, Voice Preferences, and Notifications (BACKEND_API_SPECIFICATION.md
// §A.2). Response envelope is `{ success, message, data: { user } }`.
export const getUserProfile = async () => {
  const response = await api.get(ENDPOINTS.PROFILE.GET);
  const user = response?.data?.user;

  if (!user) {
    throw new Error(response?.message || 'Profile response missing user data.');
  }

  return user;
};

// Partial update — only send the fields that changed.
export const updateUserProfile = async (updates) => {
  const response = await api.put(ENDPOINTS.PROFILE.UPDATE, updates);
  const user = response?.data?.user;

  if (!user) {
    throw new Error(response?.message || 'Profile update response missing user data.');
  }

  return { message: response.message, user };
};
