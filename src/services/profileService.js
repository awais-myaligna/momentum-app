import { mockStore } from '../mocks/mockStore';
import { mockRequest } from '../utils/mockRequest';

export const getProfile = () => mockRequest({ ...mockStore.profile });

export const updateProfile = (updates) => {
  mockStore.profile = { ...mockStore.profile, ...updates };
  return mockRequest({ ...mockStore.profile }, { delay: 400 });
};
