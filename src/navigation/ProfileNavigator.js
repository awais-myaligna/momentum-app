import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AboutScreen from '../screens/Profile/AboutScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import HelpScreen from '../screens/Profile/HelpScreen';
import LanguageScreen from '../screens/Profile/LanguageScreen';
import NotificationScreen from '../screens/Profile/NotificationScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SettingsScreen from '../screens/Profile/SettingsScreen';
import VoicePreferencesScreen from '../screens/Profile/VoicePreferencesScreen';
import { PROFILE_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

const ProfileNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={PROFILE_ROUTES.ROOT} component={ProfileScreen} />
    <Stack.Screen name={PROFILE_ROUTES.EDIT} component={EditProfileScreen} />
    <Stack.Screen name={PROFILE_ROUTES.SETTINGS} component={SettingsScreen} />
    <Stack.Screen name={PROFILE_ROUTES.NOTIFICATIONS} component={NotificationScreen} />
    <Stack.Screen name={PROFILE_ROUTES.LANGUAGE} component={LanguageScreen} />
    <Stack.Screen name={PROFILE_ROUTES.VOICE_PREFERENCES} component={VoicePreferencesScreen} />
    <Stack.Screen name={PROFILE_ROUTES.ABOUT} component={AboutScreen} />
    <Stack.Screen name={PROFILE_ROUTES.HELP} component={HelpScreen} />
  </Stack.Navigator>
);

export default ProfileNavigator;
