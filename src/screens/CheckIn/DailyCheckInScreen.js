import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import BottomButton from '../../components/BottomButton';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ProgressBar from '../../components/ProgressBar';
import QuestionCard from '../../components/QuestionCard';
import ScoreSlider from '../../components/ScoreSlider';
import { useToast } from '../../context/ToastContext';
import { ICONS } from '../../constants/icons';
import { getEmotionById } from '../../data/emotions';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { getTodayCheckIn, submitDailyCheckIn } from '../../services/checkInService';
import { COLORS } from '../../styles/colors';

// Self-contained (no nested navigator, since this is a tab root): steps
// through the day's 4-emotion rotation locally, then shows an inline
// completion state rather than navigating anywhere (roadmap section 9).
const DailyCheckInScreen = () => {
  const { showToast } = useToast();
  const [checkIn, setCheckIn] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [draftScore, setDraftScore] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedDay, setCompletedDay] = useState(null);

  const loadCheckIn = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    setCurrentIndex(0);
    setAnswers({});
    setDraftScore(null);
    setShowValidation(false);
    try {
      const data = await getTodayCheckIn();
      setCheckIn(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCheckIn();
  }, [loadCheckIn]);

  const handleContinue = async () => {
    if (draftScore == null) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);

    const prompt = checkIn.prompts[currentIndex];
    const nextAnswers = { ...answers, [prompt.emotionId]: draftScore };
    setAnswers(nextAnswers);

    const isLastPrompt = currentIndex === checkIn.prompts.length - 1;

    if (!isLastPrompt) {
      setCurrentIndex((prev) => prev + 1);
      setDraftScore(null);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitDailyCheckIn(nextAnswers);
      setCompletedDay(checkIn.dayNumber);
    } catch (error) {
      showToast(error?.message || 'Could not save your check-in. Please try again.', {
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <Loading skeleton skeletonRows={5} />
      </ScreenWrapper>
    );
  }

  if (hasError || !checkIn) {
    return (
      <ScreenWrapper>
        <EmptyState
          icon={ICONS.ERROR}
          title="Couldn't load today's check-in"
          description="Something went wrong loading your questions."
          actionLabel="Retry"
          onAction={loadCheckIn}
        />
      </ScreenWrapper>
    );
  }

  if (completedDay != null) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center">
          <Icon name={ICONS.COMPLETE} size={56} color={COLORS.success} />
          <Text className="mt-4 text-center text-2xl font-bold text-text">Nice work!</Text>
          <Text className="mt-3 text-center text-base leading-6 text-textSecondary">
            Day {completedDay} is logged on your chart. We&apos;ll check in again tomorrow, or at
            your next session.
          </Text>
          <Text className="mt-4 text-center text-sm leading-5 text-textSecondary">
            If you miss a day, that&apos;s okay — just pick up where you left off.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const prompt = checkIn.prompts[currentIndex];
  const emotion = getEmotionById(prompt.emotionId);
  const isLastPrompt = currentIndex === checkIn.prompts.length - 1;

  return (
    <ScreenWrapper
      footer={
        <BottomButton
          label={isLastPrompt ? 'Finish Check-In' : 'Continue'}
          onPress={handleContinue}
          loading={isSubmitting}
          validationMessage={
            showValidation ? 'Please complete this section before continuing.' : undefined
          }
        />
      }>
      <View className="mb-6 mt-2">
        <Text className="mb-2 text-xs font-semibold text-textSecondary">
          Day {checkIn.dayNumber} &middot; {currentIndex + 1} of {checkIn.prompts.length}
        </Text>
        <ProgressBar progress={(currentIndex + 1) / checkIn.prompts.length} />
      </View>

      <View className="mb-6 flex-row items-center">
        <Icon name={emotion.icon} size={22} color={COLORS.primary} />
        <Text className="ml-2 text-2xl font-bold text-text">Today&apos;s Check-In</Text>
      </View>

      <QuestionCard emotionName={prompt.emotionName} question={prompt.question}>
        <ScoreSlider
          value={draftScore}
          onChange={setDraftScore}
          label={`Your ${prompt.emotionName.toLowerCase()} score`}
        />
      </QuestionCard>
    </ScreenWrapper>
  );
};

export default DailyCheckInScreen;
