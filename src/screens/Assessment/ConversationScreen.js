import { useConversation } from '@elevenlabs/react-native';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import BottomButton from '../../components/BottomButton';
import Icon from '../../components/Icon';
import ProgressBar from '../../components/ProgressBar';
import QuestionCard from '../../components/QuestionCard';
import { ICONS } from '../../constants/icons';
import { useAssessment } from '../../context/AssessmentContext';
import { useToast } from '../../context/ToastContext';
import { BASELINE_QUESTIONS } from '../../data/questions';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ASSESSMENT_ROUTES } from '../../navigation/routes';
import { COLORS } from '../../styles/colors';

const AGENT_ID = process.env.EXPO_PUBLIC_AGENT_ID;

// The conversational, AI-guided question for the current emotion in the
// Emotional Compass Check-in (roadmap section 5). Backed by a short
// ElevenLabs Conversational AI voice turn (see AGENT_ID) that asks the
// reflective question aloud and talks it through with the user; the score
// itself is still confirmed by hand on EmotionRatingScreen next. Falls back
// to the plain written question if no agent is configured, or if the voice
// session fails to connect.
const ConversationScreen = ({ navigation }) => {
  const { currentEmotion, currentIndex, emotions, progress } = useAssessment();
  const { showToast } = useToast();
  const question = BASELINE_QUESTIONS[currentEmotion.id];
  const [transcript, setTranscript] = useState([]);
  const [useFallback, setUseFallback] = useState(!AGENT_ID);
  const startedForEmotion = useRef(null);

  const conversation = useConversation({
    onMessage: ({ message, source }) => {
      setTranscript((prev) => [...prev, { id: `${source}-${prev.length}`, message, source }]);
    },
    onError: () => {
      showToast("Voice check-in isn't available right now — continuing with text.", { type: 'error' });
      setUseFallback(true);
    },
  });

  useEffect(() => {
    if (!AGENT_ID || startedForEmotion.current === currentEmotion.id) return;
    startedForEmotion.current = currentEmotion.id;
    setTranscript([]);

    // startSession/endSession are synchronous (fire-and-forget); connection
    // outcomes surface asynchronously via the onError/onStatusChange
    // callbacks below, not via a returned promise.
    try {
      conversation.startSession({
        agentId: AGENT_ID,
        dynamicVariables: {
          emotionName: currentEmotion.name,
          question,
        },
      });
    } catch {
      setUseFallback(true);
    }

    return () => {
      try {
        conversation.endSession();
      } catch {
        // Already disconnected — nothing to clean up.
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEmotion.id]);

  useEffect(() => {
    if (conversation.status === 'error') {
      setUseFallback(true);
    }
  }, [conversation.status]);

  const handleContinue = () => {
    try {
      conversation.endSession();
    } catch {
      // Already disconnected — nothing to clean up.
    }
    navigation.replace(ASSESSMENT_ROUTES.EMOTION_RATING);
  };

  const isConnected = conversation.status === 'connected';
  const statusLabel = !isConnected ? 'Connecting…' : conversation.isSpeaking ? 'Speaking…' : 'Listening…';

  return (
    <ScreenWrapper footer={<BottomButton label="Continue" onPress={handleContinue} />}>
      <View className="mt-2 mb-6">
        <Text className="mb-2 text-xs font-semibold text-textSecondary">
          Step {currentIndex + 1} of {emotions.length}
        </Text>
        <ProgressBar progress={progress} />
      </View>

      <View className="mb-1 flex-row items-center">
        <Icon name={currentEmotion.icon} size={22} color={COLORS.primary} />
        <Text className="ml-2 text-2xl font-bold text-text">Let&apos;s check in</Text>
      </View>
      <Text className="mb-6 text-sm text-textSecondary">
        Take a moment to reflect. There are no right or wrong answers.
      </Text>

      {useFallback ? (
        <QuestionCard emotionName={currentEmotion.name} question={question} />
      ) : (
        <View className="rounded-2xl bg-white px-4 py-5">
          <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {currentEmotion.name}
          </Text>
          <View className="mb-3 mt-2 flex-row items-center">
            <Icon name={ICONS.VOICE} size={16} color={isConnected ? COLORS.primary : COLORS.gray500} />
            <Text className="ml-2 text-sm font-medium text-textSecondary">{statusLabel}</Text>
          </View>
          {transcript.length === 0 ? (
            <Text className="text-lg font-medium leading-6 text-text">{question}</Text>
          ) : (
            transcript.map((entry) => (
              <Text
                key={entry.id}
                className={`mb-2 text-sm leading-5 ${entry.source === 'user' ? 'text-text' : 'text-textSecondary'}`}>
                {entry.source === 'user' ? 'You: ' : 'Momentum: '}
                {entry.message}
              </Text>
            ))
          )}
        </View>
      )}
    </ScreenWrapper>
  );
};

export default ConversationScreen;
