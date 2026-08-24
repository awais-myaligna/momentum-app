import { useState } from 'react';

import EmptyState from '../../components/EmptyState';
import Header from '../../components/Header';
import Icon from '../../components/Icon';
import MenuRow from '../../components/MenuRow';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ICONS } from '../../constants/icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { updateUserProfile } from '../../services/profileService';
import { COLORS } from '../../styles/colors';

// Roadmap section 12: prompts/feedback use the preferred voice and agent
// gender selected in the user's profile.
const VOICES = ['Female', 'Male'];

// Reads/writes through AuthContext's `user` instead of calling Get Profile
// on every open — see EditProfileScreen for the same pattern.
const VoicePreferencesScreen = ({ navigation }) => {
  const { user, updateUser, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = async (voice) => {
    if (voice === user?.voice_gender || isSaving) return;
    setIsSaving(true);
    try {
      const { user: updatedUser } = await updateUserProfile({ voice_gender: voice });
      await updateUser(updatedUser);
    } catch (error) {
      showToast(error?.message || 'Could not save your voice preference. Please try again.', {
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header
        title="Voice Preferences"
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
      />

      {!user ? (
        <EmptyState
          icon={ICONS.ERROR}
          title="Couldn't load voice preferences"
          description="Something went wrong loading your preferences."
          actionLabel="Retry"
          onAction={refreshUser}
        />
      ) : (
        VOICES.map((voice) => (
          <MenuRow
            key={voice}
            icon={ICONS.VOICE}
            label={voice}
            onPress={() => handleSelect(voice)}
            rightSlot={
              voice === user.voice_gender ? (
                <Icon name={ICONS.COMPLETE} size={20} color={COLORS.primary} />
              ) : null
            }
          />
        ))
      )}
    </ScreenWrapper>
  );
};

export default VoicePreferencesScreen;
