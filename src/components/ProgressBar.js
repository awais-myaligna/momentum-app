import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { COLORS } from '../styles/colors';

const COLOR_MAP = {
  primary: COLORS.primary,
  success: COLORS.success,
  warning: COLORS.warning,
  danger: COLORS.danger,
};

/**
 * `progress` is 0-1. Width is animated with Reanimated, which requires an
 * inline style rather than a Tailwind width class.
 */
const ProgressBar = ({ progress = 0, color = 'primary', height = 8, className = '' }) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(1, progress)) * 100, { duration: 400 });
  }, [progress, width]);

  const animatedStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View
      className={`w-full overflow-hidden rounded-full bg-gray200 ${className}`}
      style={{ height }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
      <Animated.View
        style={[{ height, backgroundColor: COLOR_MAP[color] ?? COLOR_MAP.primary }, animatedStyle]}
        className="rounded-full"
      />
    </View>
  );
};

export default ProgressBar;
