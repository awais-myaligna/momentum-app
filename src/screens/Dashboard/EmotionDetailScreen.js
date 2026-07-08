import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';

import BottomButton from '../../components/BottomButton';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import Header from '../../components/Header';
import Loading from '../../components/Loading';
import { EMOTIONS } from '../../data/emotions';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ASSESSMENT_ROUTES } from '../../navigation/routes';
import { getEmotionDetails } from '../../services/emotionService';

const BAND_TEXT_CLASS = {
  danger: 'text-danger',
  warning: 'text-warning',
  success: 'text-success',
};

/**
 * Reused in two contexts, distinguished by `route.params.mode`:
 * - 'baseline': stepping through all 12 emotions right after the
 *   Emotional Compass Check-in, with Continue chaining to the next emotion.
 * - 'dashboard' (Phase 4): a single ad hoc lookup from Home, no chaining.
 */
const EmotionDetailScreen = ({ route, navigation }) => {
  const { emotionId, mode = 'dashboard' } = route.params ?? {};
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadDetail = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await getEmotionDetails(emotionId);
      setDetail(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [emotionId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleContinue = () => {
    const currentIndex = EMOTIONS.findIndex((emotion) => emotion.id === emotionId);
    const nextEmotion = EMOTIONS[currentIndex + 1];

    if (nextEmotion) {
      navigation.navigate(ASSESSMENT_ROUTES.EMOTION_DETAIL, { emotionId: nextEmotion.id, mode: 'baseline' });
    } else {
      navigation.navigate(ASSESSMENT_ROUTES.ROADMAP);
    }
  };

  return (
    <ScreenWrapper
      scroll
      footer={mode === 'baseline' ? <BottomButton label="Continue" onPress={handleContinue} /> : null}>
      <Header title="Emotion Detail" onBack={navigation.canGoBack() ? navigation.goBack : undefined} />

      {isLoading ? (
        <Loading skeleton skeletonRows={5} />
      ) : hasError || !detail ? (
        <EmptyState
          icon="⚠️"
          title="Couldn't load this emotion"
          description="Something went wrong loading these details."
          actionLabel="Retry"
          onAction={loadDetail}
        />
      ) : (
        <>
          <Card className="mb-4 items-center py-6">
            <Text className="text-5xl">{detail.icon}</Text>
            <Text className="mt-3 text-2xl font-bold text-text">{detail.name}</Text>
            <Text className={`mt-1 text-4xl font-bold ${BAND_TEXT_CLASS[detail.band]}`}>{detail.score}/10</Text>
            <Text className="mt-1 text-sm font-medium text-textSecondary">{detail.bandLabel}</Text>
          </Card>

          <Card className="mb-4">
            <Text className="mb-1 text-sm font-semibold uppercase tracking-wide text-textSecondary">
              Why it matters
            </Text>
            <Text className="text-sm leading-5 text-text">{detail.description}</Text>
          </Card>

          <Card>
            <Text className="mb-1 text-sm font-semibold uppercase tracking-wide text-textSecondary">
              For you, right now
            </Text>
            <Text className="text-sm leading-5 text-text">{detail.guidance}</Text>
          </Card>
        </>
      )}
    </ScreenWrapper>
  );
};

export default EmotionDetailScreen;
