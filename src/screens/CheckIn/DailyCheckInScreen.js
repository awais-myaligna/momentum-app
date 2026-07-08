import ScreenWrapper from '../../layouts/ScreenWrapper';
import EmptyState from '../../components/EmptyState';

// Rotating 4-emotion daily reflection cycle; built in Phase 5.
const DailyCheckInScreen = () => (
  <ScreenWrapper>
    <EmptyState icon="🗓️" title="Daily Check-In" description="Your daily reflection is coming in Phase 5." />
  </ScreenWrapper>
);

export default DailyCheckInScreen;
