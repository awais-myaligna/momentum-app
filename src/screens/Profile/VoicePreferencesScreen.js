import { useCallback, useEffect, useState } from 'react';

import EmptyState from '../../components/EmptyState';
import Header from '../../components/Header';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import MenuRow from '../../components/MenuRow';
import { useToast } from '../../context/ToastContext';
import { ICONS } from '../../constants/icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { getUserProfile, updateUserProfile } from '../../services/profileService';
import { COLORS } from '../../styles/colors';

// Roadmap section 12: prompts/feedback use the preferred voice and agent
// gender selected in the user's profile.
const VOICES = ['Female', 'Male'];

const VoicePreferencesScreen = ({ navigation }) => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await getUserProfile();
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

  const handleSelect = async (voice) => {
    if (voice === profile.voice_gender || isSaving) return;
    const previous = profile.voice_gender;
    setProfile((prev) => ({ ...prev, voice_gender: voice }));
    setIsSaving(true);
    try {
      await updateUserProfile({ voice_gender: voice });
    } catch (error) {
      setProfile((prev) => ({ ...prev, voice_gender: previous }));
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

      {isLoading ? (
        <Loading skeleton skeletonRows={2} />
      ) : hasError || !profile ? (
        <EmptyState
          icon={ICONS.ERROR}
          title="Couldn't load voice preferences"
          description="Something went wrong loading your preferences."
          actionLabel="Retry"
          onAction={loadProfile}
        />
      ) : (
        VOICES.map((voice) => (
          <MenuRow
            key={voice}
            icon={ICONS.VOICE}
            label={voice}
            onPress={() => handleSelect(voice)}
            rightSlot={
              voice === profile.voice_gender ? (
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
