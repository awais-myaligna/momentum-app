import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { EMOTIONS } from '../data/emotions';
import { getBaselineProgress } from '../services/emotionService';

const AssessmentContext = createContext(null);

/**
 * Holds the wizard state for the baseline Emotional Compass Check-in: which
 * of the 12 emotions is currently active, and the scores collected so far.
 * Scoped to AssessmentNavigator so it resets naturally each time a new
 * baseline flow starts.
 *
 * Progress is backend-owned, not locally persisted: on mount this fetches
 * `GET /momentum/assessment/baseline/progress` and resumes at whichever
 * emotion the backend says is next, so leaving mid-assessment and coming
 * back later (same session, app restart, or a fresh login) always picks up
 * where the user left off instead of restarting from the first emotion.
 *
 * Scores are no longer picked by hand — after each conversation ends,
 * ConversationScreen.js sends the transcript to a backend AI judge
 * (`emotionService.scoreEmotionFromConversation`), which now also persists
 * the score as part of baseline progress, and the result lands here via
 * `applyScoreResult`.
 */
export const AssessmentProvider = ({ children }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [hasProgressError, setHasProgressError] = useState(false);
  const [isBaselineComplete, setIsBaselineComplete] = useState(false);

  const currentEmotion = EMOTIONS[currentIndex];
  const isLastEmotion = currentIndex === EMOTIONS.length - 1;
  const progress = (currentIndex + 1) / EMOTIONS.length;

  const loadProgress = useCallback(async () => {
    setIsLoadingProgress(true);
    setHasProgressError(false);
    try {
      const data = await getBaselineProgress();

      const completedAnswers = {};
      data.emotions.forEach((entry) => {
        if (entry.status === 'completed' && typeof entry.score === 'number') {
          completedAnswers[entry.emotionId] = entry.score;
        }
      });
      setAnswers(completedAnswers);

      if (data.completed) {
        // Nothing left to resume into — AssessmentNavigator syncs
        // AuthContext so RootNavigator routes away from this flow.
        setIsBaselineComplete(true);
      } else {
        // `nextEmotion` is null for brand-new users (no progress record
        // yet) — default to emotion 0 so the baseline starts cleanly.
        const nextId = data.nextEmotion?.id ?? null;
        const resumeIndex = nextId ? EMOTIONS.findIndex((emotion) => emotion.id === nextId) : 0;
        setCurrentIndex(resumeIndex >= 0 ? resumeIndex : 0);
      }
    } catch {
      setHasProgressError(true);
    } finally {
      setIsLoadingProgress(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Applies the result of scoreEmotionFromConversation (which both scores
  // and persists the emotion). The backend's `hasCompletedBaseline` /
  // `nextEmotion` — not a local index+1 guess — decide what happens next,
  // since the backend is the authoritative source of progress.
  const applyScoreResult = useCallback(
    (result) => {
      setAnswers((prev) => ({ ...prev, [result.emotionId]: result.score }));

      if (result.hasCompletedBaseline) {
        setIsBaselineComplete(true);
        return { done: true };
      }

      const nextId = result.nextEmotion?.id;
      const nextIndex = nextId ? EMOTIONS.findIndex((emotion) => emotion.id === nextId) : -1;
      setCurrentIndex((prev) => (nextIndex >= 0 ? nextIndex : Math.min(prev + 1, EMOTIONS.length - 1)));
      return { done: false };
    },
    []
  );

  const value = useMemo(
    () => ({
      emotions: EMOTIONS,
      currentIndex,
      currentEmotion,
      isLastEmotion,
      progress,
      answers,
      isLoadingProgress,
      hasProgressError,
      isBaselineComplete,
      loadProgress,
      applyScoreResult,
    }),
    [
      currentIndex,
      currentEmotion,
      isLastEmotion,
      progress,
      answers,
      isLoadingProgress,
      hasProgressError,
      isBaselineComplete,
      loadProgress,
      applyScoreResult,
    ]
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
