import { Text, View } from 'react-native';

import BottomButton from '../../components/BottomButton';
import ProgressBar from '../../components/ProgressBar';
import QuestionCard from '../../components/QuestionCard';
import { useAssessment } from '../../context/AssessmentContext';
import { BASELINE_QUESTIONS } from '../../data/questions';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ASSESSMENT_ROUTES } from '../../navigation/routes';

// The conversational, AI-guided question for the current emotion in the
// Emotional Compass Check-in (roadmap section 5). Voice prompts are
// pre-recorded per the roadmap's Voice Prompt Strategy appendix; audio
// assets can be wired into QuestionCard's `audioSource` prop once recorded.
const ConversationScreen = ({ navigation }) => {
  const { currentEmotion, currentIndex, emotions, progress } = useAssessment();
  const question = BASELINE_QUESTIONS[currentEmotion.id];

  return (
    <ScreenWrapper footer={<BottomButton label="Continue" onPress={() => navigation.replace(ASSESSMENT_ROUTES.EMOTION_RATING)} />}>
      <View className="mt-2 mb-6">
        <Text className="mb-2 text-xs font-semibold text-textSecondary">
          Step {currentIndex + 1} of {emotions.length}
        </Text>
        <ProgressBar progress={progress} />
      </View>

      <Text className="mb-1 text-2xl font-bold text-text">{currentEmotion.icon} Let&apos;s check in</Text>
      <Text className="mb-6 text-sm text-textSecondary">
        Take a moment to reflect. There are no right or wrong answers.
      </Text>

      <QuestionCard emotionName={currentEmotion.name} question={question} />
    </ScreenWrapper>
  );
};

export default ConversationScreen;
