import ScreenWrapper from '../../layouts/ScreenWrapper';
import EmptyState from '../../components/EmptyState';

const VoicePreferencesScreen = () => (
  <ScreenWrapper>
    <EmptyState icon="🎙️" title="Voice Preferences" description="Voice and agent gender preferences are coming in Phase 5." />
  </ScreenWrapper>
);

export default VoicePreferencesScreen;
