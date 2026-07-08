import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { EMOTIONS } from '../data/emotions';

const AssessmentContext = createContext(null);

/**
 * Holds the wizard state for the baseline Emotional Compass Check-in: which
 * of the 12 emotions is currently active, the in-progress (unconfirmed)
 * score, and the confirmed answers collected so far. Scoped to
 * AssessmentNavigator so it resets naturally each time a new baseline flow
 * starts.
 */
export const AssessmentProvider = ({ children }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [draftScore, setDraftScore] = useState(null);

  const currentEmotion = EMOTIONS[currentIndex];
  const isLastEmotion = currentIndex === EMOTIONS.length - 1;
  const progress = (currentIndex + 1) / EMOTIONS.length;

  // Returns the updated answers map synchronously so the caller can decide
  // whether to submit immediately (on the last emotion) without waiting on
  // React's state update batching.
  const confirmCurrentScore = useCallback(() => {
    if (draftScore == null) return null;
    const nextAnswers = { ...answers, [currentEmotion.id]: draftScore };
    setAnswers(nextAnswers);
    return nextAnswers;
  }, [answers, currentEmotion, draftScore]);

  const advanceToNextEmotion = useCallback(() => {
    setDraftScore(null);
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
      draftScore,
      setDraftScore,
      confirmCurrentScore,
      advanceToNextEmotion,
    }),
    [currentIndex, currentEmotion, isLastEmotion, progress, answers, draftScore, confirmCurrentScore, advanceToNextEmotion]
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
