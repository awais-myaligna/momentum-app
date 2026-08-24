import { useState } from 'react';
import { Switch, Text } from 'react-native';

import EmptyState from '../../components/EmptyState';
import Header from '../../components/Header';
import MenuRow from '../../components/MenuRow';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ICONS } from '../../constants/icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { updateUserProfile } from '../../services/profileService';
import { COLORS } from '../../styles/colors';

// Reads/writes through AuthContext's `user` instead of calling Get Profile
// on every open — see EditProfileScreen for the same pattern.
const NotificationScreen = ({ navigation }) => {
  const { user, updateUser, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (nextValue) => {
    setIsSaving(true);
    try {
      const { user: updatedUser } = await updateUserProfile({ notifications_enabled: nextValue });
      await updateUser(updatedUser);
    } catch (error) {
      showToast(error?.message || 'Could not save your preference. Please try again.', {
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header
        title="Notifications"
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
      />

      {!user ? (
        <EmptyState
          icon={ICONS.ERROR}
          title="Couldn't load notifications"
          description="Something went wrong loading your preferences."
          actionLabel="Retry"
          onAction={refreshUser}
        />
      ) : (
        <>
          <MenuRow
            icon={ICONS.NOTIFICATIONS}
            label="Daily Check-In Reminders"
            subtitle={user.notifications_enabled ? 'On' : 'Off'}
            rightSlot={
              <Switch
                value={user.notifications_enabled}
                onValueChange={handleToggle}
                disabled={isSaving}
                trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            }
          />
          <Text className="px-1 text-xs leading-5 text-textSecondary">
            When enabled, Momentum will send a gentle reminder if you haven&apos;t completed your
            daily reflection yet. If you miss a day, that&apos;s okay — you can simply pick up where
            you left off.
          </Text>
        </>
      )}
    </ScreenWrapper>
  );
};

export default NotificationScreen;
