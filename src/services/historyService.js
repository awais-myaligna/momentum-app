import { mockStore } from '../mocks/mockStore';
import { mockRequest } from '../utils/mockRequest';

export const getHistory = () => {
  const sorted = [...mockStore.history].sort((a, b) => new Date(b.date) - new Date(a.date));
  return mockRequest(sorted);
};
