import EmptyState from '../../components/EmptyState';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ICONS } from '../../constants/icons';

const SettingsScreen = () => (
  <ScreenWrapper>
    <EmptyState icon={ICONS.SETTINGS} title="Settings" description="App settings are coming in Phase 5." />
  </ScreenWrapper>
);

export default SettingsScreen;
