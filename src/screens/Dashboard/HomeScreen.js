import ScreenWrapper from '../../layouts/ScreenWrapper';
import EmptyState from '../../components/EmptyState';

// Main dashboard (chart summary, quick actions); built in Phase 4.
const HomeScreen = () => (
  <ScreenWrapper>
    <EmptyState icon="🏠" title="Home" description="Your dashboard is coming in Phase 4." />
  </ScreenWrapper>
);

export default HomeScreen;
