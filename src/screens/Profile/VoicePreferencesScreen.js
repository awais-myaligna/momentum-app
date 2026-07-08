import EmptyState from '../../components/EmptyState';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ICONS } from '../../constants/icons';

const VoicePreferencesScreen = () => (
  <ScreenWrapper>
    <EmptyState
      icon={ICONS.VOICE}
      title="Voice Preferences"
      description="Voice and agent gender preferences are coming in Phase 5."
    />
  </ScreenWrapper>
);

export default VoicePreferencesScreen;
