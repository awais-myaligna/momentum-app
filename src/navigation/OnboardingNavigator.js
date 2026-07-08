import { createNativeStackNavigator } from '@react-navigation/native-stack';

import IntroductionScreen from '../screens/Onboarding/IntroductionScreen';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import { ONBOARDING_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

const OnboardingNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ONBOARDING_ROUTES.WELCOME} component={OnboardingScreen} />
    <Stack.Screen name={ONBOARDING_ROUTES.INTRODUCTION} component={IntroductionScreen} />
  </Stack.Navigator>
);

export default OnboardingNavigator;
