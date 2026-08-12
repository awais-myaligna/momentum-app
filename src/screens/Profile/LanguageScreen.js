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

// Roadmap section 12: Momentum delivers prompts and feedback in the user's
// chosen language.
const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese'];

const LanguageScreen = ({ navigation }) => {
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

  const handleSelect = async (language) => {
    if (language === profile.default_language || isSaving) return;
    const previous = profile.default_language;
    setProfile((prev) => ({ ...prev, default_language: language }));
    setIsSaving(true);
    try {
      await updateUserProfile({ default_language: language });
    } catch (error) {
      setProfile((prev) => ({ ...prev, default_language: previous }));
      showToast(error?.message || 'Could not save your language. Please try again.', {
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header title="Language" onBack={navigation.canGoBack() ? navigation.goBack : undefined} />

      {isLoading ? (
        <Loading skeleton skeletonRows={4} />
      ) : hasError || !profile ? (
        <EmptyState
          icon={ICONS.ERROR}
          title="Couldn't load languages"
          description="Something went wrong loading your preferences."
          actionLabel="Retry"
          onAction={loadProfile}
        />
      ) : (
        LANGUAGES.map((language) => (
          <MenuRow
            key={language}
            icon={ICONS.LANGUAGE}
            label={language}
            onPress={() => handleSelect(language)}
            rightSlot={
              language === profile.default_language ? (
                <Icon name={ICONS.COMPLETE} size={20} color={COLORS.primary} />
              ) : null
            }
          />
        ))
      )}
    </ScreenWrapper>
  );
};

export default LanguageScreen;
