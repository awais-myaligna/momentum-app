import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import BottomButton from '../../components/BottomButton';
import Button from '../../components/Button';
import ChartCard from '../../components/ChartCard';
import EmotionBarChart from '../../components/EmotionBarChart';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import { useAssessment } from '../../context/AssessmentContext';
import { ICONS } from '../../constants/icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ASSESSMENT_ROUTES } from '../../navigation/routes';
import { getDashboard } from '../../services/dashboardService';
import { COLORS } from '../../styles/colors';

const CHART_EXPLANATION =
  'This baseline chart is only a starting point. Lower scores are not something to fear or feel bad about — they simply show where you may benefit from more awareness, attention, or support. As you keep checking in, this picture will grow richer and more accurate.';

const BaselineCompletionScreen = ({ navigation }) => {
  const { emotions } = useAssessment();
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

  const goToEmotionDetails = () => {
    navigation.navigate(ASSESSMENT_ROUTES.EMOTION_DETAIL, { emotionId: emotions[0].id, mode: 'baseline' });
  };

  return (
    <ScreenWrapper
      scroll
      footer={<BottomButton label="Continue" onPress={() => navigation.navigate(ASSESSMENT_ROUTES.ROADMAP)} />}>
      <View className="mt-4 mb-6 items-center">
        <Icon name={ICONS.CELEBRATION} size={56} color={COLORS.primary} />
        <Text className="mt-4 text-center text-2xl font-bold text-text">
          Congratulations! You&apos;ve successfully begun your progress chart.
        </Text>
      </View>

      <ChartCard title="Your Baseline" subtitle="A color-coded snapshot of all 12 emotions right now.">
        {isLoading ? (
          <Loading skeleton skeletonRows={4} />
        ) : hasError ? (
          <EmptyState
            icon={ICONS.ERROR}
            title="Couldn't load your chart"
            description="Something went wrong loading your results."
            actionLabel="Retry"
            onAction={loadDashboard}
          />
        ) : (
          <EmotionBarChart data={chartData} />
        )}
      </ChartCard>

      <View className="mt-4 flex-row">
        <View className="mr-2 flex-1">
          <Button label="What does this mean?" variant="outline" size="sm" onPress={() => setIsExplanationVisible(true)} />
        </View>
        <View className="ml-2 flex-1">
          <Button label="See Each Emotion" variant="outline" size="sm" onPress={goToEmotionDetails} />
        </View>
      </View>

      <Modal visible={isExplanationVisible} onClose={() => setIsExplanationVisible(false)}>
        <Text className="mb-2 text-lg font-bold text-text">What does this chart mean?</Text>
        <Text className="mb-5 text-sm leading-5 text-textSecondary">{CHART_EXPLANATION}</Text>
        <Button label="Got it" onPress={() => setIsExplanationVisible(false)} />
      </Modal>

    </ScreenWrapper>
  );
};

export default BaselineCompletionScreen;
