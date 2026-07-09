import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import EmptyState from '../../components/EmptyState';
import Header from '../../components/Header';
import Loading from '../../components/Loading';
import MenuRow from '../../components/MenuRow';
import { ICONS } from '../../constants/icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { PROFILE_ROUTES } from '../../navigation/routes';
import { getProfile } from '../../services/profileService';

// Reloads on focus so returning from Notifications/Language/Voice
// Preferences reflects any change made there.
const SettingsScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  return (
    <ScreenWrapper>
      <Header title="Settings" onBack={navigation.canGoBack() ? navigation.goBack : undefined} />

      {isLoading ? (
        <Loading skeleton skeletonRows={3} />
      ) : hasError || !profile ? (
        <EmptyState
          icon={ICONS.ERROR}
          title="Couldn't load settings"
          description="Something went wrong loading your preferences."
          actionLabel="Retry"
          onAction={loadProfile}
        />
      ) : (
        <>
          <MenuRow
            icon={ICONS.NOTIFICATIONS}
            label="Notifications"
            subtitle={profile.notificationsEnabled ? 'On' : 'Off'}
            onPress={() => navigation.navigate(PROFILE_ROUTES.NOTIFICATIONS)}
          />
          <MenuRow
            icon={ICONS.LANGUAGE}
            label="Language"
            subtitle={profile.language}
            onPress={() => navigation.navigate(PROFILE_ROUTES.LANGUAGE)}
          />
          <MenuRow
            icon={ICONS.VOICE}
            label="Voice Preferences"
            subtitle={profile.voice}
            onPress={() => navigation.navigate(PROFILE_ROUTES.VOICE_PREFERENCES)}
          />
        </>
      )}
    </ScreenWrapper>
  );
};

export default SettingsScreen;
