import { memo } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from './Button';

/**
 * Primary CTA pinned to the bottom of a screen (e.g. "Continue"). Pass
 * `validationMessage` to surface the roadmap's standard guardrail copy
 * ("Please complete this section before continuing.") when the user taps
 * Continue before finishing the required step.
 */
const BottomButton = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  validationMessage,
  className = '',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View className={`px-5 ${className}`} style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
      {validationMessage ? (
        <Text className="mb-2 text-center text-xs text-danger">{validationMessage}</Text>
      ) : null}
      <Button label={label} onPress={onPress} loading={loading} disabled={disabled} variant={variant} />
    </View>
  );
};

export default memo(BottomButton);
