import ScreenWrapper from '../../layouts/ScreenWrapper';
import EmptyState from '../../components/EmptyState';

// ScoreSlider-based 1-10 rating step for each emotion; built in Phase 3.
const EmotionRatingScreen = () => (
  <ScreenWrapper>
    <EmptyState icon="🎚️" title="Rate This Emotion" description="Emotion rating is coming in Phase 3." />
  </ScreenWrapper>
);

export default EmotionRatingScreen;
