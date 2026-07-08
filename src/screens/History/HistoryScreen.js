import EmptyState from '../../components/EmptyState';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ICONS } from '../../constants/icons';

// Log of past check-ins; built in Phase 5.
const HistoryScreen = () => (
  <ScreenWrapper>
    <EmptyState icon={ICONS.HISTORY} title="History" description="Your check-in history is coming in Phase 5." />
  </ScreenWrapper>
);

export default HistoryScreen;
