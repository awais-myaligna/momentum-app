import { Text, View } from 'react-native';

import BottomButton from '../../components/BottomButton';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import { ICONS } from '../../constants/icons';
import { DAILY_CHECKIN_GROUPS } from '../../data/dailyCheckInSchedule';
import { getEmotionById } from '../../data/emotions';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ASSESSMENT_ROUTES } from '../../navigation/routes';
import { COLORS } from '../../styles/colors';

const DAY_LABELS = ['Day 1', 'Day 2', 'Day 3'];

// GPS-analogy explainer of the ongoing daily reflection cycle (roadmap
// section 9): 4 emotions per day, rotating across a 3-day cycle so all 12
// are revisited every 3 days.
const EmotionalRoadmapScreen = ({ navigation }) => {
  return (
    <ScreenWrapper
      scroll
      footer={<BottomButton label="Continue" onPress={() => navigation.navigate(ASSESSMENT_ROUTES.COMPLETE)} />}>
      <View className="mt-4 mb-6 items-center">
        <Icon name={ICONS.ROADMAP} size={56} color={COLORS.primary} />
        <Text className="mt-4 text-center text-2xl font-bold text-text">Your Emotional Roadmap</Text>
        <Text className="mt-3 text-center text-sm leading-5 text-textSecondary">
          Just like a GPS, Momentum gives you a starting point, your baseline, and helps you navigate your emotional
          journey step by step.
        </Text>
      </View>

      <Text className="mb-3 text-sm leading-5 text-textSecondary">
        After your baseline, Momentum checks in on four emotions per day in a rotating 3-day cycle, so you can
        reflect consistently without feeling overwhelmed. Each time a group comes back around, you&apos;ll get a
        fresh question for deeper reflection.
      </Text>

      {DAILY_CHECKIN_GROUPS.map((group, index) => (
        <Card key={DAY_LABELS[index]} className="mb-3">
          <Text className="mb-2 text-sm font-semibold text-primary">{DAY_LABELS[index]}</Text>
          <View className="flex-row flex-wrap">
            {group.map((emotionId) => {
              const emotion = getEmotionById(emotionId);
              return (
                <View key={emotionId} className="mb-2 mr-2 flex-row items-center rounded-full bg-gray100 px-3 py-1.5">
                  <Icon name={emotion.icon} size={14} color={COLORS.primary} />
                  <Text className="ml-1 text-xs font-medium text-text">{emotion.name}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      ))}

      <Text className="mt-1 text-xs text-textSecondary">
        After Day 3, the cycle begins again with the first group, using a new set of reflective questions.
      </Text>
    </ScreenWrapper>
  );
};

export default EmotionalRoadmapScreen;
