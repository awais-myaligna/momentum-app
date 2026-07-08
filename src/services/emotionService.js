import { EMOTIONS, getEmotionById, getScoreBand } from '../data/emotions';
import { getGuidanceForScore } from '../data/emotionGuidance';
import { mockStore } from '../mocks/mockStore';
import { mockRequest } from '../utils/mockRequest';

export const getEmotions = () => mockRequest(EMOTIONS);

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
