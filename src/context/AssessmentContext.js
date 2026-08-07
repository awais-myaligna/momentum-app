import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { EMOTIONS } from '../data/emotions';

const AssessmentContext = createContext(null);

/**
 * Holds the wizard state for the baseline Emotional Compass Check-in: which
 * of the 12 emotions is currently active, and the confirmed answers
 * collected so far. Scoped to AssessmentNavigator so it resets naturally
 * each time a new baseline flow starts.
 *
 * Scores are no longer picked by hand — after each conversation ends,
 * ConversationScreen.js sends the transcript to a backend AI judge
 * (`emotionService.scoreEmotionFromConversation`) and lands the result
 * here via `recordScore`.
 */
export const AssessmentProvider = ({ children }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const currentEmotion = EMOTIONS[currentIndex];
  const isLastEmotion = currentIndex === EMOTIONS.length - 1;
  const progress = (currentIndex + 1) / EMOTIONS.length;

  // Returns the updated answers map synchronously so the caller
  // (ConversationScreen's handleContinue, after the backend returns a
  // score) can hand it straight to the final baseline submission without
  // waiting on React's state update batching.
  const recordScore = useCallback((emotionId, score) => {
    const nextAnswers = { ...answers, [emotionId]: score };
    setAnswers(nextAnswers);
    return nextAnswers;
  }, [answers]);

  const advanceToNextEmotion = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, EMOTIONS.length - 1));
  }, []);

  const value = useMemo(
    () => ({
      emotions: EMOTIONS,
      currentIndex,
      currentEmotion,
      isLastEmotion,
      progress,
      answers,
      recordScore,
      advanceToNextEmotion,
    }),
    [currentIndex, currentEmotion, isLastEmotion, progress, answers, recordScore, advanceToNextEmotion]
  );

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
};

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};
