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
    LIST: '/momentum/emotions',
    DETAIL: (emotionId) => `/emotions/${emotionId}`,
  },
  ASSESSMENT: {
    SUBMIT_BASELINE: '/assessment/baseline',
    SCORE_EMOTION: '/assessment/emotion-score',
  },
  DASHBOARD: '/dashboard',
  CHECKIN: {
    TODAY: '/checkin/today',
    SUBMIT: '/checkin',
  },
  HISTORY: '/history',
  PROFILE: {
    GET: '/user/profile',
    UPDATE: '/user/profile',
  },
};
