import EmptyState from '../../components/EmptyState';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ICONS } from '../../constants/icons';

// Rotating 4-emotion daily reflection cycle; built in Phase 5.
const DailyCheckInScreen = () => (
  <ScreenWrapper>
    <EmptyState
      icon={ICONS.CHECK_IN}
      title="Daily Check-In"
      description="Your daily reflection is coming in Phase 5."
    />
  </ScreenWrapper>
);

export default DailyCheckInScreen;
