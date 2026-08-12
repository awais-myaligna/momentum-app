import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import { ICONS } from '../../constants/icons';
import { getEmotionById } from '../../data/emotions';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { getHistory } from '../../services/historyService';
import { COLORS } from '../../styles/colors';

const BAND_TEXT_CLASS = {
  danger: 'text-danger',
  warning: 'text-warning',
  success: 'text-success',
};

const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

// Log of every completed baseline/daily check-in (roadmap section 9's
// ongoing reflection cycle), most recent first, via historyService.
const HistoryScreen = () => {
  const [history, setHistory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await getHistory();
      setHistory(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <ScreenWrapper scroll>
      <Text className="mb-4 mt-2 text-2xl font-bold text-text">History</Text>

      {isLoading ? (
        <Loading skeleton skeletonRows={6} />
      ) : hasError || !history ? (
        <EmptyState
          icon={ICONS.ERROR}
          title="Couldn't load your history"
          description="Something went wrong loading your check-ins."
          actionLabel="Retry"
          onAction={loadHistory}
        />
      ) : history.length === 0 ? (
        <EmptyState
          icon={ICONS.HISTORY}
          title="No check-ins yet"
          description="Your completed check-ins will show up here."
        />
      ) : (
        history.map((entry) => {
          const emotionIds = Object.keys(entry.scores);

          return (
            <Card key={entry.id} className="mb-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-base font-semibold text-text">
                    {entry.type === 'baseline' ? 'Baseline Check-In' : `Day ${entry.dayNumber}`}
                  </Text>
                  <Text className="mt-0.5 text-xs text-textSecondary">
                    {formatDate(entry.date)}
                  </Text>
                </View>
                <Text className={`text-lg font-bold ${BAND_TEXT_CLASS[entry.band]}`}>
                  {entry.averageScore}/10
                </Text>
              </View>

              <View className="mt-3 flex-row flex-wrap">
                {emotionIds.map((emotionId) => {
                  const emotion = getEmotionById(emotionId);
                  return (
                    <View
                      key={emotionId}
                      className="mb-2 mr-2 flex-row items-center rounded-full bg-gray100 px-3 py-1.5">
                      <Icon name={emotion.icon} size={13} color={COLORS.primary} />
                      <Text className="ml-1 text-xs font-medium text-text">
                        {emotion.name} {entry.scores[emotionId]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          );
        })
      )}
    </ScreenWrapper>
  );
};

export default HistoryScreen;
