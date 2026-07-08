import ScreenWrapper from '../../layouts/ScreenWrapper';
import EmptyState from '../../components/EmptyState';

// "Thank you! We'll check in again tomorrow..." message; built in Phase 3.
const AssessmentCompleteScreen = () => (
  <ScreenWrapper>
    <EmptyState icon="✅" title="You're All Set" description="This completion message is coming in Phase 3." />
  </ScreenWrapper>
);

export default AssessmentCompleteScreen;
