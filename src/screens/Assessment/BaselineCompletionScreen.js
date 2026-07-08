import ScreenWrapper from '../../layouts/ScreenWrapper';
import EmptyState from '../../components/EmptyState';

// Congratulations message + color-coded bar chart; built in Phase 3/4.
const BaselineCompletionScreen = () => (
  <ScreenWrapper>
    <EmptyState icon="🎉" title="Baseline Complete" description="Your progress chart is coming in Phase 3." />
  </ScreenWrapper>
);

export default BaselineCompletionScreen;
