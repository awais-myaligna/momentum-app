import EmptyState from '../../components/EmptyState';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ICONS } from '../../constants/icons';

const HelpScreen = () => (
  <ScreenWrapper>
    <EmptyState icon={ICONS.HELP} title="Help" description="Help & support content is coming in Phase 5." />
  </ScreenWrapper>
);

export default HelpScreen;
