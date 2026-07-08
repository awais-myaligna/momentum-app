import EmptyState from '../../components/EmptyState';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ICONS } from '../../constants/icons';

const NotificationScreen = () => (
  <ScreenWrapper>
    <EmptyState
      icon={ICONS.NOTIFICATIONS}
      title="Notifications"
      description="Notification preferences are coming in Phase 5."
    />
  </ScreenWrapper>
);

export default NotificationScreen;
