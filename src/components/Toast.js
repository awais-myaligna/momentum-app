import { useEffect } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../styles/colors';

const TYPE_BG = {
  info: COLORS.text,
  success: COLORS.success,
  warning: COLORS.warning,
  error: COLORS.danger,
};

/**
 * Rendered once by ToastProvider; driven by useToast()'s showToast/hideToast.
 * Screens should call `const { showToast } = useToast()` rather than
 * importing this component directly.
 */
const Toast = ({ toast, onHide }) => {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-12);

  useEffect(() => {
    if (toast) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(-12, { duration: 150 });
    }
  }, [toast, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!toast) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[{ position: 'absolute', top: insets.top + 8, left: 16, right: 16 }, animatedStyle]}>
      <TouchableOpacity
        onPress={onHide}
        activeOpacity={0.9}
        accessibilityRole="alert"
        accessibilityLabel={toast.message}
        className="rounded-xl px-4 py-3"
        style={{ backgroundColor: TYPE_BG[toast.type] ?? TYPE_BG.info }}>
        <Text className="text-sm font-medium text-white">{toast.message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Toast;
