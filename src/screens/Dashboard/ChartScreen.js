import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';

import Button from '../../components/Button';
import ChartCard from '../../components/ChartCard';
import EmotionBarChart from '../../components/EmotionBarChart';
import EmotionCard from '../../components/EmotionCard';
import EmptyState from '../../components/EmptyState';
import Header from '../../components/Header';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import { ICONS } from '../../constants/icons';
import { getEmotionById, getScoreBand } from '../../data/emotions';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { HOME_ROUTES } from '../../navigation/routes';
import { getDashboard } from '../../services/dashboardService';

const CHART_EXPLANATION =
  'This chart is a snapshot, not a verdict. Lower scores are not something to fear or feel bad about — they simply show where you may benefit from more awareness, attention, or support. As you keep checking in, this picture will grow richer and more accurate.';

// Full chart view (roadmap section 7): the color-coded bar chart across all
// 12 emotions, plus the "What does this chart mean?" explainer and the
// "See Each Emotion in Detail" list, both referenced from the roadmap.
const ChartScreen = ({ navigation }) => {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isExplanationVisible, setIsExplanationVisible] = useState(false);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await getDashboard();
      setChartData(data.chart);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const goToEmotionDetail = (emotionId) => {
    navigation.navigate(HOME_ROUTES.EMOTION_DETAIL, { emotionId });
  };

  return (
    <ScreenWrapper scroll>
      <Header
        title="Your Chart"
        subtitle="A color-coded view of all 12 emotions"
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
      />

      {isLoading ? (
        <Loading skeleton skeletonRows={6} />
      ) : hasError || !chartData ? (
        <EmptyState
          icon={ICONS.ERROR}
          title="Couldn't load your chart"
          description="Something went wrong loading your results."
          actionLabel="Retry"
          onAction={loadDashboard}
        />
      ) : (
        <>
          <ChartCard title="All 12 Emotions" subtitle="Tap any bar to see the details.">
            <EmotionBarChart data={chartData} onBarPress={goToEmotionDetail} />
          </ChartCard>

          <Button
            label="What does this chart mean?"
            variant="outline"
            size="sm"
            className="mb-5 mt-4"
            onPress={() => setIsExplanationVisible(true)}
          />

          <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-textSecondary">
            See Each Emotion in Detail
          </Text>
          {chartData.map((item) => (
            <EmotionCard
              key={item.emotionId}
              icon={getEmotionById(item.emotionId).icon}
              name={item.name}
              score={item.score}
              bandColor={item.color}
              bandLabel={getScoreBand(item.score).label}
              onPress={() => goToEmotionDetail(item.emotionId)}
            />
          ))}
        </>
      )}

      <Modal visible={isExplanationVisible} onClose={() => setIsExplanationVisible(false)}>
        <Text className="mb-2 text-lg font-bold text-text">What does this chart mean?</Text>
        <Text className="mb-5 text-sm leading-5 text-textSecondary">{CHART_EXPLANATION}</Text>
        <Button label="Got it" onPress={() => setIsExplanationVisible(false)} />
      </Modal>
    </ScreenWrapper>
  );
};

export default ChartScreen;
