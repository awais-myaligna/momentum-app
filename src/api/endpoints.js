// Centralized endpoint map. Not yet consumed by the mocked services, but
// kept ready so swapping mocks for the real Aligna backend only touches
// the services layer.
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  },
  EMOTIONS: {
    LIST: '/emotions',
    DETAIL: (emotionId) => `/emotions/${emotionId}`,
  },
  ASSESSMENT: {
    SUBMIT_BASELINE: '/assessment/baseline',
  },
  DASHBOARD: '/dashboard',
  CHECKIN: {
    TODAY: '/checkin/today',
    SUBMIT: '/checkin',
  },
  HISTORY: '/history',
  PROFILE: {
    GET: '/profile',
    UPDATE: '/profile',
  },
};
