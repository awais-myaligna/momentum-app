import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AssessmentCompleteScreen from '../screens/Assessment/AssessmentCompleteScreen';
import BaselineCompletionScreen from '../screens/Assessment/BaselineCompletionScreen';
import ConversationScreen from '../screens/Assessment/ConversationScreen';
import EmotionalRoadmapScreen from '../screens/Assessment/EmotionalRoadmapScreen';
import EmotionRatingScreen from '../screens/Assessment/EmotionRatingScreen';
import EmotionDetailScreen from '../screens/Dashboard/EmotionDetailScreen';
import { ASSESSMENT_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

// Covers the full baseline Emotional Compass Check-in: conversational
// question -> rating, repeated for all 12 emotions, then the completion
// message, chart, per-emotion review, and roadmap explainer.
const AssessmentNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ASSESSMENT_ROUTES.CONVERSATION} component={ConversationScreen} />
    <Stack.Screen name={ASSESSMENT_ROUTES.EMOTION_RATING} component={EmotionRatingScreen} />
    <Stack.Screen name={ASSESSMENT_ROUTES.BASELINE_COMPLETION} component={BaselineCompletionScreen} />
    <Stack.Screen name={ASSESSMENT_ROUTES.EMOTION_DETAIL} component={EmotionDetailScreen} />
    <Stack.Screen name={ASSESSMENT_ROUTES.ROADMAP} component={EmotionalRoadmapScreen} />
    <Stack.Screen name={ASSESSMENT_ROUTES.COMPLETE} component={AssessmentCompleteScreen} />
  </Stack.Navigator>
);

export default AssessmentNavigator;
