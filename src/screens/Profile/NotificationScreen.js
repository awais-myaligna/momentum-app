import { useCallback, useEffect, useState } from 'react';
import { Switch, Text } from 'react-native';

import EmptyState from '../../components/EmptyState';
import Header from '../../components/Header';
import Loading from '../../components/Loading';
import MenuRow from '../../components/MenuRow';
import { useToast } from '../../context/ToastContext';
import { ICONS } from '../../constants/icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { getProfile, updateProfile } from '../../services/profileService';
import { COLORS } from '../../styles/colors';

const NotificationScreen = ({ navigation }) => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await getProfile();
      setProfile(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleToggle = async (nextValue) => {
    setProfile((prev) => ({ ...prev, notificationsEnabled: nextValue }));
    setIsSaving(true);
    try {
      await updateProfile({ notificationsEnabled: nextValue });
    } catch (error) {
      setProfile((prev) => ({ ...prev, notificationsEnabled: !nextValue }));
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

      {isLoading ? (
        <Loading skeleton skeletonRows={2} />
      ) : hasError || !profile ? (
        <EmptyState
          icon={ICONS.ERROR}
          title="Couldn't load notifications"
          description="Something went wrong loading your preferences."
          actionLabel="Retry"
          onAction={loadProfile}
        />
      ) : (
        <>
          <MenuRow
            icon={ICONS.NOTIFICATIONS}
            label="Daily Check-In Reminders"
            subtitle={profile.notificationsEnabled ? 'On' : 'Off'}
            rightSlot={
              <Switch
                value={profile.notificationsEnabled}
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
