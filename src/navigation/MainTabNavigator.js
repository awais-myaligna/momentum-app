import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Icon from '../components/Icon';
import { COLORS } from '../styles/colors';
import DailyCheckInScreen from '../screens/CheckIn/DailyCheckInScreen';
import HistoryScreen from '../screens/History/HistoryScreen';
import HomeNavigator from './HomeNavigator';
import ProfileNavigator from './ProfileNavigator';
import { MAIN_TAB_ROUTES } from './routes';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  [MAIN_TAB_ROUTES.HOME]: { focused: 'home', unfocused: 'home-outline' },
  [MAIN_TAB_ROUTES.CHECK_IN]: { focused: 'calendar', unfocused: 'calendar-outline' },
  [MAIN_TAB_ROUTES.HISTORY]: { focused: 'time', unfocused: 'time-outline' },
  [MAIN_TAB_ROUTES.PROFILE]: { focused: 'person', unfocused: 'person-outline' },
};

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray500,
      tabBarStyle: { borderTopColor: COLORS.border, height: 60, paddingBottom: 8, paddingTop: 8 },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      tabBarIcon: ({ color, focused }) => (
        <Icon name={focused ? TAB_ICONS[route.name].focused : TAB_ICONS[route.name].unfocused} size={22} color={color} />
      ),
    })}>
    <Tab.Screen name={MAIN_TAB_ROUTES.HOME} component={HomeNavigator} options={{ title: 'Home' }} />
    <Tab.Screen name={MAIN_TAB_ROUTES.CHECK_IN} component={DailyCheckInScreen} options={{ title: 'Check-In' }} />
    <Tab.Screen name={MAIN_TAB_ROUTES.HISTORY} component={HistoryScreen} options={{ title: 'History' }} />
    <Tab.Screen name={MAIN_TAB_ROUTES.PROFILE} component={ProfileNavigator} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);

export default MainTabNavigator;
