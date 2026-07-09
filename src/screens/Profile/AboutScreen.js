import { Text, View } from 'react-native';

import Card from '../../components/Card';
import Header from '../../components/Header';
import Icon from '../../components/Icon';
import { ICONS } from '../../constants/icons';
import { EMOTIONS } from '../../data/emotions';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS } from '../../styles/colors';

// Static content drawn from the Momentum Roadmap's introduction (section 1)
// and overall purpose (section 16).
const AboutScreen = ({ navigation }) => {
  return (
    <ScreenWrapper scroll>
      <Header
        title="About Momentum"
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
      />

      <View className="mb-5 items-center">
        <Icon name={ICONS.BRAND} size={48} color={COLORS.primary} />
        <Text className="mt-3 text-center text-lg font-semibold text-text">
          Emotional Awareness Tracker for Personal Growth
        </Text>
      </View>

      <Card className="mb-4">
        <Text className="text-sm leading-5 text-text">
          Momentum helps you build emotional awareness over time. Rather than simply recording daily
          moods, it helps you understand patterns across 12 core emotional states and visualize how
          they change throughout your personal growth journey.
        </Text>
      </Card>

      <Card className="mb-4">
        <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-textSecondary">
          The 12 Core Emotions
        </Text>
        <View className="flex-row flex-wrap">
          {EMOTIONS.map((emotion) => (
            <View
              key={emotion.id}
              className="mb-2 mr-2 flex-row items-center rounded-full bg-gray100 px-3 py-1.5">
              <Icon name={emotion.icon} size={14} color={COLORS.primary} />
              <Text className="ml-1 text-xs font-medium text-text">{emotion.name}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card className="mb-4">
        <Text className="text-sm leading-5 text-text">
          Momentum is not about perfection. The goal is awareness, consistency, and growth — helping
          you see where you are, understand how you are changing, and take small steps toward
          becoming more emotionally aligned every day.
        </Text>
      </Card>

      <Text className="mb-2 text-center text-xs text-textSecondary">Momentum · Version 1.0.0</Text>
    </ScreenWrapper>
  );
};

export default AboutScreen;
