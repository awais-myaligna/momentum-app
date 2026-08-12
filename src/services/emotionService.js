import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { getScoreBand } from '../data/emotions';
import { getGuidanceForScore } from '../data/emotionGuidance';

// Real Aligna backend integration — returns the 12 core emotions with
// display metadata (id, slug, name, icon, description, sortOrder), sorted
// by sortOrder to match the fixed assessment/daily-rotation order.
export const getEmotions = async () => {
  const response = await api.get(ENDPOINTS.EMOTIONS.LIST);
  const emotions = response?.data;

  if (!Array.isArray(emotions)) {
    throw new Error(response?.message || 'Emotions response missing data.');
  }

  return [...emotions].sort((a, b) => a.sortOrder - b.sortOrder);
};

// Called once per emotion, right after the user taps Continue on
// ConversationScreen — `transcript` is that emotion's full exchange (both
// `source: 'user'` and `source: 'ai'` turns, in order). Runs the transcript
// through the backend's AI judge (BACKEND_API_SPECIFICATION.md §B.1) and
// resolves to `{ emotionId, score }`. Stateless on the backend — nothing is
// persisted until submitAssessment/submitDailyCheckIn.
export const scoreEmotionFromConversation = async (emotionId, transcript, checkInType = 'baseline') => {
  const response = await api.post(ENDPOINTS.ASSESSMENT.SCORE_EMOTION, {
    emotionId,
    checkInType,
    transcript,
  });
  const data = response?.data;

  if (!data || typeof data.score !== 'number') {
    throw new Error(response?.message || 'Emotion score response missing data.');
  }

  return data;
};

// Fired once, right after the 12th emotion's score comes back from
// scoreEmotionFromConversation. Resolves to
// `{ scores, hasCompletedBaseline, currentDay }` (§B.2).
export const submitAssessment = async (scores) => {
  const response = await api.post(ENDPOINTS.ASSESSMENT.SUBMIT_BASELINE, { scores });
  const data = response?.data;

  if (!data) {
    throw new Error(response?.message || 'Baseline submission response missing data.');
  }

  return data;
};

// One emotion's metadata plus the current user's latest score, band, and
// guidance (§B.3). `guidance` can be omitted by the backend — falls back to
// the bundled copy in that case.
export const getEmotionDetails = async (emotionId) => {
  const response = await api.get(ENDPOINTS.EMOTIONS.DETAIL(emotionId));
  const detail = response?.data;

  if (!detail) {
    throw new Error(response?.message || 'Emotion detail response missing data.');
  }

  if (detail.guidance) {
    return detail;
  }

  const band = getScoreBand(detail.score ?? 0);
  return { ...detail, guidance: getGuidanceForScore(emotionId, band.key) };
};
