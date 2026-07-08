import ScreenWrapper from '../../layouts/ScreenWrapper';
import EmptyState from '../../components/EmptyState';

// Log of past check-ins; built in Phase 5.
const HistoryScreen = () => (
  <ScreenWrapper>
    <EmptyState icon="📜" title="History" description="Your check-in history is coming in Phase 5." />
  </ScreenWrapper>
);

export default HistoryScreen;
