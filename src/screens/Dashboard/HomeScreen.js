import { useCallback, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import EmotionCard from '../../components/EmotionCard';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ProgressBar from '../../components/ProgressBar';
import { ICONS } from '../../constants/icons';
import { useAuth } from '../../context/AuthContext';
import { getEmotionById, getScoreBand } from '../../data/emotions';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { HOME_ROUTES, MAIN_TAB_ROUTES } from '../../navigation/routes';
import { getDashboard } from '../../services/dashboardService';
import { COLORS } from '../../styles/colors';

const BAND_TEXT_CLASS = {
  danger: 'text-danger',
  warning: 'text-warning',
  success: 'text-success',
};

const FOCUS_COUNT = 3;

// Main Home tab landing screen (roadmap section 7): a quick summary of the
// user's ongoing chart plus the lowest-scoring emotions to focus on today.
const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  // The Home tab stays mounted once visited (React Navigation doesn't
  // unmount inactive tab screens), so a mount-only fetch never sees a check-in
  // submitted afterwards from the Check-In tab. Track whether we've ever
  // loaded successfully so re-focusing refetches quietly in the background
  // instead of only fetching once for the screen's lifetime.
  const hasLoadedRef = useRef(false);

  const userName = user?.name || user?.first_name || 'User';
  const userAvatar =
    user?.avatar ||
    user?.avatar_url ||
    user?.avatarUrl ||
    user?.profile_picture ||
    user?.image ||
    user?.photo;

  const loadData = useCallback(async () => {
    const isFirstLoad = !hasLoadedRef.current;
    if (isFirstLoad) {
      setIsLoading(true);
    }
    setHasError(false);
    try {
      const dashboardData = await getDashboard();
      setDashboard(dashboardData);
      hasLoadedRef.current = true;
    } catch {
      setHasError(true);
    } finally {
      if (isFirstLoad) {
        setIsLoading(false);
      }
    }
  }, []);

  // Refetch every time this tab gains focus (first mount included) so stats
  // submitted from the Check-In tab show up immediately on switching back,
  // without requiring a manual pull-to-refresh or app reload.
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const goToEmotionDetail = (emotionId) => {
    navigation.navigate(HOME_ROUTES.EMOTION_DETAIL, { emotionId });
  };

  const averageBand = dashboard ? getScoreBand(dashboard.averageScore) : null;
  const focusEmotions = dashboard
    ? [...dashboard.chart].sort((a, b) => a.score - b.score).slice(0, FOCUS_COUNT)
    : [];

  return (
    <ScreenWrapper scroll>
      {isLoading ? (
        <Loading skeleton skeletonRows={6} />
      ) : hasError || !dashboard ? (
        <EmptyState
          icon={ICONS.ERROR}
          title="Couldn't load your dashboard"
          description="Something went wrong loading your data."
          actionLabel="Retry"
          onAction={loadData}
        />
      ) : (
        <>
          <View className="mb-5 mt-2 flex-row items-center justify-between">
            <View className="mr-3 flex-1">
              <Text className="text-sm text-textSecondary">Welcome,</Text>
              <Text className="text-2xl font-bold text-text" numberOfLines={1} ellipsizeMode="tail">
                {userName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate(MAIN_TAB_ROUTES.PROFILE)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Go to profile">
              <Avatar name={userName} uri={userAvatar} size="md" />
            </TouchableOpacity>
          </View>

          <Card className="mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-medium text-textSecondary">
                  Day {dashboard.currentDay}
                </Text>
                <Text className={`mt-1 text-4xl font-bold ${BAND_TEXT_CLASS[averageBand.color]}`}>
                  {dashboard.averageScore}
                  <Text className="text-lg text-textSecondary">/10</Text>
                </Text>
                <Text className="mt-1 text-xs font-medium text-textSecondary">
                  Average emotional alignment
                </Text>
                <ProgressBar
                  progress={dashboard.averageScore / 10}
                  color={averageBand.color}
                  className="mt-3"
                />
              </View>
              <Icon name={ICONS.TREND} size={36} color={COLORS.primary} />
            </View>
          </Card>

          <TouchableOpacity
            onPress={() => navigation.navigate(HOME_ROUTES.CHART)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="View your full emotional chart">
            <Card className="mb-5 flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center">
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-background">
                  <Icon name={ICONS.CHART} size={20} color={COLORS.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-text">View Your Chart</Text>
                  <Text className="text-xs text-textSecondary">
                    See all 12 emotions, color-coded
                  </Text>
                </View>
              </View>
              <Icon name={ICONS.CHEVRON_RIGHT} size={16} color={COLORS.gray400} />
            </Card>
          </TouchableOpacity>

          <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-textSecondary">
            Emotions to focus on
          </Text>
          {focusEmotions.map((item) => (
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
    </ScreenWrapper>
  );
};

export default HomeScreen;
