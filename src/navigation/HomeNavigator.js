import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ChartScreen from '../screens/Dashboard/ChartScreen';
import EmotionDetailScreen from '../screens/Dashboard/EmotionDetailScreen';
import HomeScreen from '../screens/Dashboard/HomeScreen';
import { HOME_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

const HomeNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={HOME_ROUTES.DASHBOARD} component={HomeScreen} />
    <Stack.Screen name={HOME_ROUTES.CHART} component={ChartScreen} />
    <Stack.Screen name={HOME_ROUTES.EMOTION_DETAIL} component={EmotionDetailScreen} />
  </Stack.Navigator>
);

export default HomeNavigator;
