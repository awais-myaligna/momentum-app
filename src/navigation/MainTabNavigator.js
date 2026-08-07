import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const TAB_BAR_CONTENT_HEIGHT = 60;

const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray500,
        // react-navigation only auto-adds the safe-area bottom inset when
        // tabBarStyle.height is left unset — since we need a fixed content
        // height, add insets.bottom ourselves so the tab bar clears the
        // Android system nav bar / gesture inset instead of sitting behind it.
        tabBarStyle: {
          borderTopColor: COLORS.border,
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
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
};

export default MainTabNavigator;
