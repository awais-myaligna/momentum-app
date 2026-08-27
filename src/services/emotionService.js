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
// through the backend's AI judge and resolves to
// `{ emotionId, score, completedEmotions, totalEmotions, hasCompletedBaseline, nextEmotion, currentDay? }`
// (BACKEND_BASELINE_ASSESSMENT_REQUIREMENTS.md §1). For `checkInType:
// 'baseline'`, the score is now also persisted as part of the user's
// baseline progress — the emotion is only considered complete once this
// call resolves, so a failure here leaves the user free to retry the same
// emotion rather than silently losing the answer.
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

// Resolves the user's saved baseline progress so the assessment can resume
// from the correct emotion instead of restarting from the first one
// (BACKEND_BASELINE_ASSESSMENT_REQUIREMENTS.md §2). Backend is the source
// of truth — this is called every time the baseline flow is entered/resumed,
// not read from local storage. Resolves to
// `{ completed, totalEmotions, completedEmotions, nextEmotion, emotions }`.
export const getBaselineProgress = async () => {
  const response = await api.get(ENDPOINTS.ASSESSMENT.BASELINE_PROGRESS);
  const data = response?.data;

  if (!data || !Array.isArray(data.emotions)) {
    throw new Error(response?.message || 'Baseline progress response missing data.');
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
