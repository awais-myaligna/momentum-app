import { memo, useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import BottomButton from '../../components/BottomButton';
import Card from '../../components/Card';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { EMOTIONS } from '../../data/emotions';

const EmotionListItem = memo(({ emotion }) => (
  <Card className="mb-3 flex-row items-start" shadow={false}>
    <Text className="mr-3 text-2xl">{emotion.icon}</Text>
    <View className="flex-1">
      <Text className="text-base font-semibold text-text">{emotion.name}</Text>
      <Text className="mt-0.5 text-sm leading-5 text-textSecondary">{emotion.description}</Text>
    </View>
  </Card>
));
EmotionListItem.displayName = 'EmotionListItem';

const IntroductionScreen = () => {
  const { completeOnboarding } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const renderItem = useCallback(({ item }) => <EmotionListItem emotion={item} />, []);
  const keyExtractor = useCallback((item) => item.id, []);

  const handleContinue = async () => {
    setIsSubmitting(true);
    await completeOnboarding();
    setIsSubmitting(false);
  };

  return (
    <ScreenWrapper padded={false}>
      <View className="px-5 pt-2">
        <Header title="The 12 Core Emotions" subtitle="Momentum helps you track and reflect on these together." />
        <Text className="mb-4 text-sm leading-5 text-textSecondary">
          These emotions were selected because they represent key areas of emotional alignment, personal growth, and
          inner momentum, giving you a broader picture of how you&apos;re feeling and where you may need support.
        </Text>
      </View>

      <FlatList
        data={EMOTIONS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerClassName="px-5 pb-4"
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
      />

      <BottomButton label="Continue" onPress={handleContinue} loading={isSubmitting} />
    </ScreenWrapper>
  );
};

export default IntroductionScreen;
