import { useState } from 'react';
import { Text, View } from 'react-native';

import BottomButton from '../../components/BottomButton';
import ProgressBar from '../../components/ProgressBar';
import ScoreSlider from '../../components/ScoreSlider';
import { useAssessment } from '../../context/AssessmentContext';
import { useToast } from '../../context/ToastContext';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ASSESSMENT_ROUTES } from '../../navigation/routes';
import { submitAssessment } from '../../services/emotionService';

const EmotionRatingScreen = ({ navigation }) => {
  const {
    currentEmotion,
    currentIndex,
    emotions,
    progress,
    isLastEmotion,
    draftScore,
    setDraftScore,
    confirmCurrentScore,
    advanceToNextEmotion,
  } = useAssessment();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const handleContinue = async () => {
    if (draftScore == null) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);

    const updatedAnswers = confirmCurrentScore();

    if (!isLastEmotion) {
      advanceToNextEmotion();
      navigation.replace(ASSESSMENT_ROUTES.CONVERSATION);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAssessment(updatedAnswers);
      navigation.replace(ASSESSMENT_ROUTES.BASELINE_COMPLETION);
    } catch (error) {
      showToast(error?.message || 'Could not save your check-in. Please try again.', { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper
      footer={
        <BottomButton
          label={isLastEmotion ? 'Finish Check-In' : 'Continue'}
          onPress={handleContinue}
          loading={isSubmitting}
          validationMessage={showValidation ? 'Please complete this section before continuing.' : undefined}
        />
      }>
      <View className="mt-2 mb-6">
        <Text className="mb-2 text-xs font-semibold text-textSecondary">
          Step {currentIndex + 1} of {emotions.length}
        </Text>
        <ProgressBar progress={progress} />
      </View>

      <Text className="mb-1 text-2xl font-bold text-text">
        {currentEmotion.icon} Rate {currentEmotion.name}
      </Text>
      <Text className="mb-8 text-sm text-textSecondary">
        On a scale of 1 to 10, where 1 is very low and 10 is very high.
      </Text>

      <ScoreSlider value={draftScore} onChange={setDraftScore} label={`Your ${currentEmotion.name.toLowerCase()} score`} />
    </ScreenWrapper>
  );
};

export default EmotionRatingScreen;
