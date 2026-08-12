import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

// Returns the current day's 4-emotion rotation with that rotation's
// questions (BACKEND_API_SPECIFICATION.md §B.5). `alreadyCheckedInToday` is
// used by DailyCheckInScreen to show a completed state instead of the form.
export const getTodayCheckIn = async () => {
  const response = await api.get(ENDPOINTS.CHECKIN.TODAY);
  const data = response?.data;

  if (!data || !Array.isArray(data.prompts)) {
    throw new Error(response?.message || "Today's check-in response missing data.");
  }

  return data;
};

// Submits the day's 4 scores, advances to the next day (§B.6). Resolves to
// `{ nextDay }`.
export const submitDailyCheckIn = async (scores) => {
  const response = await api.post(ENDPOINTS.CHECKIN.SUBMIT, { scores });
  const data = response?.data;

  if (!data) {
    throw new Error(response?.message || 'Check-in submission response missing data.');
  }

  return data;
};
