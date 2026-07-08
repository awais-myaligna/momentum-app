import { memo, useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { COLORS } from '../styles/colors';

const SkeletonBar = ({ width = '100%', height = 14, className = '' }) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width, height }, animatedStyle]}
      className={`rounded-lg bg-gray200 ${className}`}
    />
  );
};

/**
 * Loading supports two modes:
 * - `skeleton`: pulsing placeholder bars for content-shaped loading states
 * - default: centered spinner, optionally with a label
 */
const Loading = ({ label, skeleton = false, skeletonRows = 3, fullScreen = false }) => {
  if (skeleton) {
    return (
      <View className="w-full">
        {Array.from({ length: skeletonRows }).map((_, index) => (
          <SkeletonBar key={index} className="mb-3" width={index === skeletonRows - 1 ? '60%' : '100%'} />
        ))}
      </View>
    );
  }

  return (
    <View className={`items-center justify-center ${fullScreen ? 'flex-1' : 'py-8'}`}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      {label ? <Text className="mt-3 text-sm text-textSecondary">{label}</Text> : null}
    </View>
  );
};

export default memo(Loading);
