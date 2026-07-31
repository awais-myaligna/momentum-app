import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/Splash/SplashScreen';
import AssessmentNavigator from './AssessmentNavigator';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import { ROOT_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

/**
 * Top-level flow gate: Splash while bootstrapping, then exactly one of
 * Onboarding / Auth / Assessment / Main based on AuthContext state.
 */
const RootNavigator = () => {
  const { isBootstrapping, isAuthenticated, hasOnboarded } = useAuth();
  // const isAuthenticated = false;
  // const hasOnboarded = false; // TODO: implement onboarding state — unrelated to auth, left as-is
  const hasCompletedBaseline = true;
  // const hasOnboarded = false;

  if (isBootstrapping) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!hasOnboarded ? (
        <Stack.Screen name={ROOT_ROUTES.ONBOARDING} component={OnboardingNavigator} />
      ) : !isAuthenticated ? (
        <Stack.Screen name={ROOT_ROUTES.AUTH} component={AuthNavigator} />
      ) : !hasCompletedBaseline ? (
        <Stack.Screen name={ROOT_ROUTES.ASSESSMENT} component={AssessmentNavigator} />
      ) : (
        <Stack.Screen name={ROOT_ROUTES.MAIN} component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
