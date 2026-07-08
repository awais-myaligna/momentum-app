import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import BottomButton from '../../components/BottomButton';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import Header from '../../components/Header';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import { ICONS } from '../../constants/icons';
import { EMOTIONS } from '../../data/emotions';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ASSESSMENT_ROUTES } from '../../navigation/routes';
import { getEmotionDetails } from '../../services/emotionService';
import { COLORS } from '../../styles/colors';

const BAND_TEXT_CLASS = {
  danger: 'text-danger',
  warning: 'text-warning',
  success: 'text-success',
};

const BAND_BG_CLASS = {
  danger: 'bg-danger/10',
  warning: 'bg-warning/10',
  success: 'bg-success/10',
};

const BAND_ICON_COLOR = {
  danger: COLORS.danger,
  warning: COLORS.warning,
  success: COLORS.success,
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
          icon={ICONS.ERROR}
          title="Couldn't load this emotion"
          description="Something went wrong loading these details."
          actionLabel="Retry"
          onAction={loadDetail}
        />
      ) : (
        <>
          <Card className="mb-4 items-center py-6">
            <View className={`h-16 w-16 items-center justify-center rounded-full ${BAND_BG_CLASS[detail.band]}`}>
              <Icon name={detail.icon} size={30} color={BAND_ICON_COLOR[detail.band]} />
            </View>
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
