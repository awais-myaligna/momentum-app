import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

// Every completed check-in (baseline + daily), most recent first
// (BACKEND_API_SPECIFICATION.md §B.7). HistoryScreen doesn't page through
// results yet, so this fetches the first page (backend default: 20/page).
export const getHistory = async () => {
  const response = await api.get(ENDPOINTS.HISTORY);
  const data = response?.data;

  if (!Array.isArray(data)) {
    throw new Error(response?.message || 'History response missing data.');
  }

  return data;
};
