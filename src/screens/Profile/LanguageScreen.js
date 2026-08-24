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

// Roadmap section 12: Momentum delivers prompts and feedback in the user's
// chosen language.
const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese'];

// Reads/writes through AuthContext's `user` (populated at login/session
// restore) instead of calling Get Profile on every open — see
// EditProfileScreen for the same pattern.
const LanguageScreen = ({ navigation }) => {
  const { user, updateUser, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = async (language) => {
    if (language === user?.default_language || isSaving) return;
    setIsSaving(true);
    try {
      const { user: updatedUser } = await updateUserProfile({ default_language: language });
      await updateUser(updatedUser);
    } catch (error) {
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

      {!user ? (
        <EmptyState
          icon={ICONS.ERROR}
          title="Couldn't load languages"
          description="Something went wrong loading your preferences."
          actionLabel="Retry"
          onAction={refreshUser}
        />
      ) : (
        LANGUAGES.map((language) => (
          <MenuRow
            key={language}
            icon={ICONS.LANGUAGE}
            label={language}
            onPress={() => handleSelect(language)}
            rightSlot={
              language === user.default_language ? (
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
