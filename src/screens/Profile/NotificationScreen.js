import ScreenWrapper from '../../layouts/ScreenWrapper';
import EmptyState from '../../components/EmptyState';

const NotificationScreen = () => (
  <ScreenWrapper>
    <EmptyState icon="🔔" title="Notifications" description="Notification preferences are coming in Phase 5." />
  </ScreenWrapper>
);

export default NotificationScreen;
