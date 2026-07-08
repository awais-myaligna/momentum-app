import { EMOTIONS, getScoreBand } from '../data/emotions';
import { mockStore } from '../mocks/mockStore';
import { mockRequest } from '../utils/mockRequest';

export const getDashboard = () => {
  const chart = EMOTIONS.map((emotion) => {
    const score = mockStore.baselineScores[emotion.id] ?? 0;
    const band = getScoreBand(score);
    return {
      emotionId: emotion.id,
      name: emotion.name,
      score,
      color: band.color,
    };
  });

  const average =
    chart.reduce((sum, item) => sum + item.score, 0) / (chart.length || 1);

  return mockRequest({
    hasCompletedBaseline: mockStore.hasCompletedBaseline,
    chart,
    averageScore: Math.round(average * 10) / 10,
    currentDay: mockStore.currentDay,
  });
};
