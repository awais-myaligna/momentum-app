import { ConversationProvider } from '@elevenlabs/react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AssessmentProvider } from '../context/AssessmentContext';
import AssessmentCompleteScreen from '../screens/Assessment/AssessmentCompleteScreen';
import BaselineCompletionScreen from '../screens/Assessment/BaselineCompletionScreen';
import ConversationScreen from '../screens/Assessment/ConversationScreen';
import EmotionalRoadmapScreen from '../screens/Assessment/EmotionalRoadmapScreen';
import SupportResourcesScreen from '../screens/Assessment/SupportResourcesScreen';
import EmotionDetailScreen from '../screens/Dashboard/EmotionDetailScreen';
import { ASSESSMENT_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

// Covers the full baseline Emotional Compass Check-in: one conversational
// voice turn per emotion (the agent judges and records its own score —
// see ConversationScreen.js), repeated for all 12 emotions, then the
// completion message, chart, per-emotion review, and roadmap explainer.
const AssessmentNavigator = () => (
  <AssessmentProvider>
    <ConversationProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={ASSESSMENT_ROUTES.CONVERSATION} component={ConversationScreen} />
        <Stack.Screen name={ASSESSMENT_ROUTES.SUPPORT} component={SupportResourcesScreen} />
        <Stack.Screen name={ASSESSMENT_ROUTES.BASELINE_COMPLETION} component={BaselineCompletionScreen} />
        <Stack.Screen name={ASSESSMENT_ROUTES.EMOTION_DETAIL} component={EmotionDetailScreen} />
        <Stack.Screen name={ASSESSMENT_ROUTES.ROADMAP} component={EmotionalRoadmapScreen} />
        <Stack.Screen name={ASSESSMENT_ROUTES.COMPLETE} component={AssessmentCompleteScreen} />
      </Stack.Navigator>
    </ConversationProvider>
  </AssessmentProvider>
);

export default AssessmentNavigator;
