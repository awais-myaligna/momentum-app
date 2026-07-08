import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { ICONS } from '../../constants/icons';
import { COLORS } from '../../styles/colors';

// Shown while AuthContext bootstraps (checking stored session/onboarding flags).
const SplashScreen = () => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <ScreenWrapper>
      <View className="flex-1 items-center justify-center">
        <Animated.View style={animatedStyle} className="items-center">
          <Icon name={ICONS.BRAND} size={56} color={COLORS.primary} />
          <Text className="mt-4 text-3xl font-bold text-text">Momentum</Text>
          <Text className="mt-1 text-sm text-textSecondary">Emotional awareness, one day at a time</Text>
        </Animated.View>
        <View className="mt-10">
          <Loading />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default SplashScreen;
