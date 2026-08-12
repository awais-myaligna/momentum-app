// Centralized endpoint map for the real Aligna backend
// (see BACKEND_API_SPECIFICATION.md). Every endpoint below lives under
// `/momentum/*` except the two that intentionally stay alongside the other
// auth endpoints: `/logout` and `/refresh-token`.
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    LOGOUT: '/logout',
    SEND_OTP: '/send-otp',
    VERIFY_OTP: '/verify-otp',
    RESET_PASSWORD: '/reset-password',
    REFRESH_TOKEN: '/refresh-token',
  },
  EMOTIONS: {
    LIST: '/momentum/emotions',
    DETAIL: (slug) => `/momentum/emotions/${slug}`,
  },
  ASSESSMENT: {
    SUBMIT_BASELINE: '/momentum/assessment/baseline',
    SCORE_EMOTION: '/momentum/assessment/emotion-score',
  },
  DASHBOARD: '/momentum/dashboard',
  CHECKIN: {
    TODAY: '/momentum/checkin/today',
    SUBMIT: '/momentum/checkin',
  },
  HISTORY: '/momentum/history',
  PROFILE: {
    GET: '/user/profile',
    UPDATE: '/user/profile',
  },
};
