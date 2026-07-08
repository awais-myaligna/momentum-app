import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { COLORS } from '../styles/colors';
import DailyCheckInScreen from '../screens/CheckIn/DailyCheckInScreen';
import HistoryScreen from '../screens/History/HistoryScreen';
import HomeNavigator from './HomeNavigator';
import ProfileNavigator from './ProfileNavigator';
import { MAIN_TAB_ROUTES } from './routes';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  [MAIN_TAB_ROUTES.HOME]: '🏠',
  [MAIN_TAB_ROUTES.CHECK_IN]: '🗓️',
  [MAIN_TAB_ROUTES.HISTORY]: '📜',
  [MAIN_TAB_ROUTES.PROFILE]: '👤',
};

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray500,
      tabBarStyle: { borderTopColor: COLORS.border, height: 60, paddingBottom: 8, paddingTop: 8 },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{TAB_ICONS[route.name]}</Text>,
    })}>
    <Tab.Screen name={MAIN_TAB_ROUTES.HOME} component={HomeNavigator} options={{ title: 'Home' }} />
    <Tab.Screen name={MAIN_TAB_ROUTES.CHECK_IN} component={DailyCheckInScreen} options={{ title: 'Check-In' }} />
    <Tab.Screen name={MAIN_TAB_ROUTES.HISTORY} component={HistoryScreen} options={{ title: 'History' }} />
    <Tab.Screen name={MAIN_TAB_ROUTES.PROFILE} component={ProfileNavigator} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);

export default MainTabNavigator;
