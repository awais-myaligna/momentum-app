import { ConversationProvider } from '@elevenlabs/react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';

import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { ICONS } from '../constants/icons';
import { AssessmentProvider, useAssessment } from '../context/AssessmentContext';
import { useAuth } from '../context/AuthContext';
import ScreenWrapper from '../layouts/ScreenWrapper';
import AssessmentCompleteScreen from '../screens/Assessment/AssessmentCompleteScreen';
import BaselineCompletionScreen from '../screens/Assessment/BaselineCompletionScreen';
import ConversationScreen from '../screens/Assessment/ConversationScreen';
import EmotionalRoadmapScreen from '../screens/Assessment/EmotionalRoadmapScreen';
import SupportResourcesScreen from '../screens/Assessment/SupportResourcesScreen';
import EmotionDetailScreen from '../screens/Dashboard/EmotionDetailScreen';
import { ASSESSMENT_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

// Gates the assessment stack behind AssessmentProvider's backend progress
// fetch: no screen mounts (and no ElevenLabs session starts) until we know
// which emotion to resume from, so the user never briefly sees — or starts
// a voice session for — the wrong emotion.
const AssessmentGate = () => {
  const { isLoadingProgress, hasProgressError, loadProgress, isBaselineComplete } = useAssessment();
  const { completeBaseline } = useAuth();

  useEffect(() => {
    // Edge case: the backend already has all 12 emotions recorded (e.g. the
    // last one was completed just before the app closed, before this
    // device's cached completion flag caught up). Sync AuthContext so
    // RootNavigator routes away from the assessment flow instead of
    // starting a 13th conversation with nothing left to score.
    if (isBaselineComplete) {
      completeBaseline();
    }
  }, [isBaselineComplete, completeBaseline]);

  if (isLoadingProgress || isBaselineComplete) {
    return (
      <ScreenWrapper>
        <Loading fullScreen label="Loading your check-in…" />
      </ScreenWrapper>
    );
  }

  if (hasProgressError) {
    return (
      <ScreenWrapper>
        <EmptyState
          icon={ICONS.ERROR}
          title="Couldn't load your check-in"
          description="Something went wrong loading your progress."
          actionLabel="Retry"
          onAction={loadProgress}
        />
      </ScreenWrapper>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ASSESSMENT_ROUTES.CONVERSATION} component={ConversationScreen} />
      <Stack.Screen name={ASSESSMENT_ROUTES.SUPPORT} component={SupportResourcesScreen} />
      <Stack.Screen name={ASSESSMENT_ROUTES.BASELINE_COMPLETION} component={BaselineCompletionScreen} />
      <Stack.Screen name={ASSESSMENT_ROUTES.EMOTION_DETAIL} component={EmotionDetailScreen} />
      <Stack.Screen name={ASSESSMENT_ROUTES.ROADMAP} component={EmotionalRoadmapScreen} />
      <Stack.Screen name={ASSESSMENT_ROUTES.COMPLETE} component={AssessmentCompleteScreen} />
    </Stack.Navigator>
  );
};

// Covers the full baseline Emotional Compass Check-in: one conversational
// voice turn per emotion (scored and persisted via
// emotionService.scoreEmotionFromConversation — see ConversationScreen.js),
// repeated for all 12 emotions and resumable from wherever the backend says
// the user left off (see AssessmentContext), then the completion message,
// chart, per-emotion review, and roadmap explainer.
const AssessmentNavigator = () => (
  <AssessmentProvider>
    <ConversationProvider>
      <AssessmentGate />
    </ConversationProvider>
  </AssessmentProvider>
);

export default AssessmentNavigator;
