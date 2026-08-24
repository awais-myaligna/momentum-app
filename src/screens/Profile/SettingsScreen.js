import EmptyState from '../../components/EmptyState';
import Header from '../../components/Header';
import MenuRow from '../../components/MenuRow';
import { useAuth } from '../../context/AuthContext';
import { ICONS } from '../../constants/icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { PROFILE_ROUTES } from '../../navigation/routes';

// Reads straight from AuthContext's `user` — updated in place by
// Notifications/Language/Voice Preferences on save, so this stays in sync
// without a Get Profile call of its own or a focus-triggered refetch.
const SettingsScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();

  return (
    <ScreenWrapper>
      <Header title="Settings" onBack={navigation.canGoBack() ? navigation.goBack : undefined} />

      {!user ? (
        <EmptyState
          icon={ICONS.ERROR}
          title="Couldn't load settings"
          description="Something went wrong loading your preferences."
          actionLabel="Retry"
          onAction={refreshUser}
        />
      ) : (
        <>
          <MenuRow
            icon={ICONS.NOTIFICATIONS}
            label="Notifications"
            subtitle={user.notifications_enabled ? 'On' : 'Off'}
            onPress={() => navigation.navigate(PROFILE_ROUTES.NOTIFICATIONS)}
          />
          <MenuRow
            icon={ICONS.LANGUAGE}
            label="Language"
            subtitle={user.default_language}
            onPress={() => navigation.navigate(PROFILE_ROUTES.LANGUAGE)}
          />
          <MenuRow
            icon={ICONS.VOICE}
            label="Voice Preferences"
            subtitle={user.voice_gender}
            onPress={() => navigation.navigate(PROFILE_ROUTES.VOICE_PREFERENCES)}
          />
        </>
      )}
    </ScreenWrapper>
  );
};

export default SettingsScreen;
