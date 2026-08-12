import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

// Aggregate endpoint: all 12 emotions' latest scores + rollup average +
// current day counter (BACKEND_API_SPECIFICATION.md §B.4). Powers the home
// summary and the full chart screen.
export const getDashboard = async () => {
  const response = await api.get(ENDPOINTS.DASHBOARD);
  const data = response?.data;

  if (!data) {
    throw new Error(response?.message || 'Dashboard response missing data.');
  }

  return data;
};
