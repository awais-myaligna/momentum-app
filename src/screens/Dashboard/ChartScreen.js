import ScreenWrapper from '../../layouts/ScreenWrapper';
import EmptyState from '../../components/EmptyState';

// Bar/trend charts across the 12 emotions; built in Phase 4.
const ChartScreen = () => (
  <ScreenWrapper>
    <EmptyState icon="📊" title="Your Chart" description="Emotional trend charts are coming in Phase 4." />
  </ScreenWrapper>
);

export default ChartScreen;
