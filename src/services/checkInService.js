import { getGroupForDay, getQuestionRotationForDay } from '../data/dailyCheckInSchedule';
import { getEmotionById } from '../data/emotions';
import { getDailyQuestion } from '../data/questions';
import { mockStore } from '../mocks/mockStore';
import { mockRequest } from '../utils/mockRequest';

export const getTodayCheckIn = () => {
  const dayNumber = mockStore.currentDay;
  const group = getGroupForDay(dayNumber);
  const rotation = getQuestionRotationForDay(dayNumber);

  const prompts = group.map((emotionId) => ({
    emotionId,
    emotionName: getEmotionById(emotionId).name,
    question: getDailyQuestion(emotionId, rotation),
  }));

  return mockRequest({ dayNumber, prompts });
};

export const submitDailyCheckIn = (answers) => {
  const dayNumber = mockStore.currentDay;

  mockStore.baselineScores = { ...mockStore.baselineScores, ...answers };
  mockStore.history.push({
    id: `entry-day${dayNumber}-${Date.now()}`,
    date: new Date().toISOString(),
    dayNumber,
    scores: { ...answers },
    type: 'daily',
  });
  mockStore.currentDay += 1;

  return mockRequest({ success: true, nextDay: mockStore.currentDay }, { delay: 800 });
};
