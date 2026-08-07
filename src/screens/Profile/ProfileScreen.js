import { useState } from 'react';
import { Text, View } from 'react-native';

import Avatar from '../../components/Avatar';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import MenuRow from '../../components/MenuRow';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ICONS } from '../../constants/icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { PROFILE_ROUTES } from '../../navigation/routes';

// Profile tab root: identity summary plus the top-level menu into
// Settings/About/Help, and sign out.
const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      showToast(error?.message || 'Could not sign out. Please try again.', { type: 'error' });
    } finally {
      setIsLoggingOut(false);
      setIsLogoutVisible(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <View className="mb-6 mt-2 items-center">
        <Avatar
          name={user?.name}
          uri={
            user?.avatar ||
            user?.avatar_url ||
            user?.avatarUrl ||
            user?.profile_picture ||
            user?.image ||
            user?.photo
          }
          size="xl"
        />
        <Text className="mt-3 text-xl font-bold text-text">{user?.name}</Text>
        <Text className="mt-0.5 text-sm text-textSecondary">{user?.email}</Text>
      </View>

      <MenuRow
        icon={ICONS.EDIT}
        label="Edit Profile"
        onPress={() => navigation.navigate(PROFILE_ROUTES.EDIT)}
      />
      <MenuRow
        icon={ICONS.SETTINGS}
        label="Settings"
        subtitle="Notifications, language, voice"
        onPress={() => navigation.navigate(PROFILE_ROUTES.SETTINGS)}
      />
      <MenuRow
        icon={ICONS.ABOUT}
        label="About Momentum"
        onPress={() => navigation.navigate(PROFILE_ROUTES.ABOUT)}
      />
      <MenuRow
        icon={ICONS.HELP}
        label="Help & Support"
        onPress={() => navigation.navigate(PROFILE_ROUTES.HELP)}
      />

      <View className="mt-2">
        <MenuRow
          icon={ICONS.LOGOUT}
          label="Log Out"
          danger
          onPress={() => setIsLogoutVisible(true)}
        />
      </View>

      <ConfirmationDialog
        visible={isLogoutVisible}
        title="Log Out"
        message="You'll need to sign back in to continue your emotional journey."
        confirmLabel="Log Out"
        destructive
        loading={isLoggingOut}
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutVisible(false)}
      />
    </ScreenWrapper>
  );
};

export default ProfileScreen;
