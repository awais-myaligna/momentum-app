import EmptyState from '../../components/EmptyState';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ICONS } from '../../constants/icons';

const LanguageScreen = () => (
  <ScreenWrapper>
    <EmptyState icon={ICONS.LANGUAGE} title="Language" description="Language preferences are coming in Phase 5." />
  </ScreenWrapper>
);

export default LanguageScreen;
