import { useConversation } from '@elevenlabs/react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import BottomButton from '../../components/BottomButton';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import ProgressBar from '../../components/ProgressBar';
import { ICONS } from '../../constants/icons';
import { useAssessment } from '../../context/AssessmentContext';
import { useToast } from '../../context/ToastContext';
import { BASELINE_QUESTIONS } from '../../data/questions';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ASSESSMENT_ROUTES } from '../../navigation/routes';
import { scoreEmotionFromConversation, submitAssessment } from '../../services/emotionService';
import { COLORS } from '../../styles/colors';

const AGENT_ID = process.env.EXPO_PUBLIC_AGENT_ID;

// The conversational, AI-guided question for the current emotion in the
// Emotional Compass Check-in (roadmap section 5), backed by a short
// ElevenLabs Conversational AI voice turn (see AGENT_ID) that asks the
// reflective question aloud and talks it through with the user.
//
// Scoring happens AFTER the conversation, not during it: the agent's only
// job is to hold the conversation (and flag a crisis moment via
// flag_needs_support if needed) — it no longer assigns a score itself.
// When the user taps Continue, the full transcript for this emotion is
// sent to the backend (see emotionService.scoreEmotionFromConversation /
// API_DOCUMENTATION.md §3.9), which runs it through an AI judge and
// returns the 1–10 score. This replaced an earlier design where the
// ElevenLabs agent called a record_emotion_score tool mid-conversation —
// that proved unreliable to get calling consistently, and debugging a
// tool call that may or may not have happened deep inside a live voice
// session was much harder than debugging one ordinary REST call with a
// transcript you can log and replay.
//
// Modes:
//  - 'voice'    — normal mic-on session (default when AGENT_ID is set).
//  - 'textChat' — mic muted, same agent/session, typed input (fallback
//                 per TOOLS_AND_APIS.md §2.1, used when a voice session
//                 fails to connect).
//  - 'unavailable' — no AGENT_ID configured, or both the voice and text
//                 connection attempts failed; offers Retry only.
const ConversationScreen = ({ navigation }) => {
  const { currentEmotion, currentIndex, emotions, isLastEmotion, progress, recordScore, advanceToNextEmotion } =
    useAssessment();
  const { showToast } = useToast();
  const question = BASELINE_QUESTIONS[currentEmotion.id];

  const [transcript, setTranscript] = useState([]);
  const [mode, setMode] = useState(AGENT_ID ? 'voice' : 'unavailable');
  const [needsSupport, setNeedsSupport] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const startedForEmotion = useRef(null);
  const attemptRef = useRef(AGENT_ID ? 'voice' : 'failed');
  const answersRef = useRef({});

  const getDynamicVariables = () => ({
    emotionId: currentEmotion.id,
    emotionName: currentEmotion.name,
    question,
    checkInType: 'baseline',
    stepPosition: `${currentIndex + 1} of ${emotions.length}`,
  });

  // Registered with useConversation below. Crisis detection still needs to
  // happen live, in-conversation — waiting until the transcript reaches
  // the backend after the user taps Continue would delay the agent's
  // caring redirect by an entire network round trip.
  const clientTools = useMemo(
    () => ({
      // Deliberately does not end the session or navigate right away —
      // that would cut the agent off mid-sentence during its brief, caring
      // redirect. It finishes speaking; the footer button below switches
      // to "Get Support" so the user (not this handler) decides when to
      // leave the conversation.
      flag_needs_support: () => {
        setNeedsSupport(true);
      },
    }),
    []
  );

  const conversation = useConversation({
    clientTools,
    micMuted: mode === 'textChat',
    onMessage: ({ message, source }) => {
      setTranscript((prev) => [...prev, { id: `${source}-${prev.length}`, message, source }]);
    },
    onError: () => {
      if (attemptRef.current === 'voice') {
        attemptRef.current = 'text';
        setMode('textChat');
        showToast("Voice check-in isn't available right now — continuing by text.", { type: 'error' });
        try {
          conversation.startSession({ agentId: AGENT_ID, dynamicVariables: getDynamicVariables() });
        } catch {
          attemptRef.current = 'failed';
          setMode('unavailable');
        }
      } else {
        attemptRef.current = 'failed';
        setMode('unavailable');
      }
    },
  });

  const startForCurrentEmotion = () => {
    if (!AGENT_ID) {
      setMode('unavailable');
      return;
    }
    setTranscript([]);
    setNeedsSupport(false);
    setShowValidation(false);
    setInputText('');
    attemptRef.current = 'voice';
    setMode('voice');
    try {
      conversation.startSession({ agentId: AGENT_ID, dynamicVariables: getDynamicVariables() });
    } catch {
      attemptRef.current = 'failed';
      setMode('unavailable');
    }
  };

  useEffect(() => {
    if (startedForEmotion.current === currentEmotion.id) return;
    startedForEmotion.current = currentEmotion.id;
    startForCurrentEmotion();

    return () => {
      try {
        conversation.endSession();
      } catch {
        // Already disconnected — nothing to clean up.
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEmotion.id]);

  const handleRetry = () => {
    startForCurrentEmotion();
  };

  const handleSendText = () => {
    const text = inputText.trim();
    if (!text || conversation.status !== 'connected') return;
    conversation.sendUserMessage(text);
    setInputText('');
  };

  const handleContinue = async () => {
    if (needsSupport) {
      try {
        conversation.endSession();
      } catch {
        // Already disconnected — nothing to clean up.
      }
      navigation.replace(ASSESSMENT_ROUTES.SUPPORT);
      return;
    }

    const hasUserResponse = transcript.some((entry) => entry.source === 'user');
    if (!hasUserResponse) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);

    // The transcript captured so far is already all the backend needs, so
    // it's safe to end the live session now — unlike the score, which
    // used to depend on the agent calling a tool on this exact session,
    // scoring now happens from this already-captured transcript
    // independently of whether the session is still connected. If the
    // scoring call below fails, the transcript is still in local state and
    // Continue can simply be tapped again to retry it.
    try {
      conversation.endSession();
    } catch {
      // Already disconnected — nothing to clean up.
    }

    setIsProcessing(true);
    try {
      const { score } = await scoreEmotionFromConversation(currentEmotion.id, transcript);
      answersRef.current = recordScore(currentEmotion.id, score);
    } catch (error) {
      showToast(error?.message || "Couldn't score that check-in. Please try again.", { type: 'error' });
      setIsProcessing(false);
      return;
    }

    if (!isLastEmotion) {
      advanceToNextEmotion();
      navigation.replace(ASSESSMENT_ROUTES.CONVERSATION);
      setIsProcessing(false);
      return;
    }

    try {
      await submitAssessment(answersRef.current);
      navigation.replace(ASSESSMENT_ROUTES.BASELINE_COMPLETION);
    } catch (error) {
      showToast(error?.message || 'Could not save your check-in. Please try again.', { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const isConnected = conversation.status === 'connected';
  const statusLabel = !isConnected ? 'Connecting…' : conversation.isSpeaking ? 'Speaking…' : 'Listening…';
  const continueLabel = needsSupport ? 'Get Support' : isLastEmotion ? 'Finish Check-In' : 'Continue';

  return (
    <ScreenWrapper
      footer={
        mode === 'unavailable' ? (
          <BottomButton label="Retry" onPress={handleRetry} />
        ) : (
          <BottomButton
            label={continueLabel}
            onPress={handleContinue}
            loading={isProcessing}
            validationMessage={showValidation ? 'Share a bit about how you’re feeling before continuing.' : undefined}
          />
        )
      }>
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

      {mode === 'unavailable' ? (
        <EmptyState
          icon={ICONS.ERROR}
          title="Check-in isn't available right now"
          description="We couldn't connect to your voice guide. Check your connection and try again."
          actionLabel="Retry"
          onAction={handleRetry}
        />
      ) : (
        <View className="rounded-2xl bg-white px-4 py-5">
          <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {currentEmotion.name}
          </Text>
          <View className="mb-3 mt-2 flex-row items-center">
            <Icon
              name={mode === 'textChat' ? ICONS.CONVERSATION : ICONS.VOICE}
              size={16}
              color={isConnected ? COLORS.primary : COLORS.gray500}
            />
            <Text className="ml-2 text-sm font-medium text-textSecondary">
              {mode === 'textChat' && isConnected ? 'Type your answer below' : statusLabel}
            </Text>
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

          {needsSupport ? (
            <View className="mt-4 rounded-xl border border-border bg-gray100 px-3 py-3">
              <Text className="text-sm leading-5 text-text">
                It sounds like this might be a heavy moment. When you&apos;re ready, tap &quot;Get Support&quot; below
                for real resources.
              </Text>
            </View>
          ) : null}

          {mode === 'textChat' ? (
            <View className="mt-4 flex-row items-center">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSendText}
                editable={isConnected}
                placeholder="Type your answer…"
                placeholderTextColor={COLORS.gray500}
                returnKeyType="send"
                className="mr-2 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm text-text"
              />
              <TouchableOpacity
                onPress={handleSendText}
                disabled={!isConnected || !inputText.trim()}
                accessibilityRole="button"
                accessibilityLabel="Send">
                <Icon name={ICONS.SEND} size={22} color={isConnected && inputText.trim() ? COLORS.primary : COLORS.gray400} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </ScreenWrapper>
  );
};

export default ConversationScreen;
