// Central route-name registry so screens/navigators never hardcode strings.
export const ROOT_ROUTES = {
  SPLASH: 'Splash',
  ONBOARDING: 'OnboardingFlow',
  AUTH: 'AuthFlow',
  ASSESSMENT: 'AssessmentFlow',
  MAIN: 'MainFlow',
};

export const ONBOARDING_ROUTES = {
  WELCOME: 'Onboarding',
  INTRODUCTION: 'Introduction',
};

export const AUTH_ROUTES = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  VERIFY_OTP: 'VerifyOtp',
  RESET_PASSWORD: 'ResetPassword',
};

export const ASSESSMENT_ROUTES = {
  CONVERSATION: 'Conversation',
  EMOTION_RATING: 'EmotionRating',
  BASELINE_COMPLETION: 'BaselineCompletion',
  EMOTION_DETAIL: 'AssessmentEmotionDetail',
  ROADMAP: 'EmotionalRoadmap',
  COMPLETE: 'AssessmentComplete',
};

export const MAIN_TAB_ROUTES = {
  HOME: 'HomeTab',
  CHECK_IN: 'CheckInTab',
  HISTORY: 'HistoryTab',
  PROFILE: 'ProfileTab',
};

export const HOME_ROUTES = {
  DASHBOARD: 'Dashboard',
  CHART: 'Chart',
  EMOTION_DETAIL: 'EmotionDetail',
};

export const PROFILE_ROUTES = {
  ROOT: 'ProfileRoot',
  SETTINGS: 'Settings',
  NOTIFICATIONS: 'Notifications',
  LANGUAGE: 'Language',
  VOICE_PREFERENCES: 'VoicePreferences',
  ABOUT: 'About',
  HELP: 'Help',
};
