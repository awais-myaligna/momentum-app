// In-memory mock "backend" state for the current app session. Services read
// and write here so screens see consistent, stateful behavior (e.g. the
// dashboard reflects a submitted assessment) without a real API.
export const mockStore = {
  user: null,
  isAuthenticated: false,
  hasCompletedBaseline: false,
  baselineScores: {}, // emotionId -> score (1-10)
  history: [], // { id, date, dayNumber, scores: { emotionId: score }, type: 'baseline' | 'daily' }
  currentDay: 1,
  profile: {
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    language: 'English',
    voice: 'Female',
    notificationsEnabled: true,
  },
};

export const resetMockStore = () => {
  mockStore.user = null;
  mockStore.isAuthenticated = false;
  mockStore.hasCompletedBaseline = false;
  mockStore.baselineScores = {};
  mockStore.history = [];
  mockStore.currentDay = 1;
};
