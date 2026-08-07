import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { getEmotionById, getScoreBand } from '../data/emotions';
import { getGuidanceForScore } from '../data/emotionGuidance';
import { mockStore } from '../mocks/mockStore';
import { mockRequest } from '../utils/mockRequest';

// Real Aligna backend integration — returns the 12 core emotions with
// display metadata (id, name, icon, description, sortOrder), sorted by
// sortOrder to match the fixed assessment/daily-rotation order.
export const getEmotions = async () => {
  const response = await api.get(ENDPOINTS.EMOTIONS.LIST);
  const emotions = response?.data;
  console.log('getEmotions response:', response);

  if (!Array.isArray(emotions)) {
    throw new Error(response?.message || 'Emotions response missing data.');
  }

  return [...emotions].sort((a, b) => a.sortOrder - b.sortOrder);
};

// Light keyword scan over the user's own turns only (never the agent's) —
// a stand-in "AI judge" until the real backend endpoint exists. Not a real
// sentiment/LLM model; it exists purely so the AI-judged check-in flow
// (ConversationScreen.js) is testable end to end today. Swap the body of
// scoreEmotionFromConversation below for a real
// `api.post(ENDPOINTS.ASSESSMENT.SCORE_EMOTION, { emotionId, transcript })`
// call once the backend endpoint ships (see API_DOCUMENTATION.md §3.9) —
// the function's signature and return shape already match that contract.
const POSITIVE_WORDS = [
  'great', 'good', 'happy', 'confident', 'strong', 'excited', 'grateful', 'calm', 'hopeful',
  'proud', 'positive', 'love', 'joy', 'energized', 'motivated', 'peaceful', 'content', 'clear', 'focused',
];
const NEGATIVE_WORDS = [
  'bad', 'sad', 'anxious', 'worried', 'stressed', 'tired', 'down', 'low', 'struggling', 'hopeless',
  'angry', 'frustrated', 'confused', 'overwhelmed', 'negative', 'hard', 'difficult', 'hate', 'scared', 'afraid',
];

const estimateScoreFromTranscript = (transcript) => {
  const userText = transcript
    .filter((entry) => entry.source === 'user')
    .map((entry) => entry.message.toLowerCase())
    .join(' ');
  if (!userText.trim()) return 5;

  let hits = 0;
  POSITIVE_WORDS.forEach((word) => {
    if (userText.includes(word)) hits += 1;
  });
  NEGATIVE_WORDS.forEach((word) => {
    if (userText.includes(word)) hits -= 1;
  });

  return Math.min(10, Math.max(1, Math.round(6 + hits)));
};

// Called once per emotion, right after the user taps Continue on
// ConversationScreen — `transcript` is that emotion's full exchange
// (both `source: 'user'` and `source: 'ai'` turns, in order). Resolves to
// `{ emotionId, score }`.
export const scoreEmotionFromConversation = (emotionId, transcript) => {
  const score = estimateScoreFromTranscript(transcript);
  return mockRequest({ emotionId, score }, { delay: 700 });
};

export const submitAssessment = (answers) => {
  mockStore.baselineScores = { ...answers };
  mockStore.hasCompletedBaseline = true;
  mockStore.history.push({
    id: `entry-baseline-${Date.now()}`,
    date: new Date().toISOString(),
    dayNumber: 0,
    scores: { ...answers },
    type: 'baseline',
  });

  return mockRequest({ scores: mockStore.baselineScores }, { delay: 900 });
};

export const getEmotionDetails = (emotionId) => {
  const emotion = getEmotionById(emotionId);
  if (!emotion) {
    return Promise.reject(new Error(`Unknown emotion: ${emotionId}`));
  }

  const score = mockStore.baselineScores[emotionId] ?? 0;
  const band = getScoreBand(score);

  return mockRequest({
    ...emotion,
    score,
    band: band.color,
    bandLabel: band.label,
    guidance: getGuidanceForScore(emotionId, band.key),
  });
};
