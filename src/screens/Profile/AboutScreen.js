import EmptyState from '../../components/EmptyState';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ICONS } from '../../constants/icons';

const AboutScreen = () => (
  <ScreenWrapper>
    <EmptyState icon={ICONS.ABOUT} title="About Momentum" description="About content is coming in Phase 5." />
  </ScreenWrapper>
);

export default AboutScreen;
