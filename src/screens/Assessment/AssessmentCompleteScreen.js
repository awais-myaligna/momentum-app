import { useState } from 'react';
import { Text, View } from 'react-native';

import BottomButton from '../../components/BottomButton';
import { useAuth } from '../../context/AuthContext';
import ScreenWrapper from '../../layouts/ScreenWrapper';

// Final screen of the baseline flow (roadmap section 14). Continuing here
// calls AuthContext.completeBaseline(), which is what flips RootNavigator
// from the Assessment flow into the Main tabs.
const AssessmentCompleteScreen = () => {
  const { completeBaseline } = useAuth();
  const [isFinishing, setIsFinishing] = useState(false);

  const handleDone = () => {
    setIsFinishing(true);
    completeBaseline();
  };

  return (
    <ScreenWrapper footer={<BottomButton label="Go to My Dashboard" onPress={handleDone} loading={isFinishing} />}>
      <View className="flex-1 items-center justify-center">
        <Text className="text-5xl">✅</Text>
        <Text className="mt-4 text-center text-2xl font-bold text-text">You&apos;re All Set</Text>
        <Text className="mt-3 text-center text-base leading-6 text-textSecondary">
          Thank you! We&apos;ll check in again tomorrow, or at your next session, to begin your daily reflections.
        </Text>
        <Text className="mt-4 text-center text-sm leading-5 text-textSecondary">
          Daily check-ins only take a couple of minutes, but they can have a meaningful impact on your emotional
          awareness and growth. If you miss a day, that&apos;s okay — just pick up where you left off.
        </Text>
      </View>
    </ScreenWrapper>
  );
};

export default AssessmentCompleteScreen;
