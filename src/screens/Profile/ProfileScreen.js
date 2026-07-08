import EmptyState from '../../components/EmptyState';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ICONS } from '../../constants/icons';

// Profile summary + navigation into settings; built in Phase 5.
const ProfileScreen = () => (
  <ScreenWrapper>
    <EmptyState icon={ICONS.PROFILE} title="Profile" description="Your profile is coming in Phase 5." />
  </ScreenWrapper>
);

export default ProfileScreen;
