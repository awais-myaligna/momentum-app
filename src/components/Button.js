import { memo } from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

import { COLORS } from '../styles/colors';

const VARIANT_CLASSES = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  outline: 'bg-transparent border border-primary',
  ghost: 'bg-transparent',
  danger: 'bg-danger',
};

const VARIANT_TEXT_CLASSES = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-primary',
  ghost: 'text-primary',
  danger: 'text-white',
};

const SIZE_CLASSES = {
  sm: 'py-2 px-4',
  md: 'py-3.5 px-5',
  lg: 'py-4 px-6',
};

const SIZE_TEXT_CLASSES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const SPINNER_COLOR = {
  primary: COLORS.white,
  secondary: COLORS.white,
  outline: COLORS.primary,
  ghost: COLORS.primary,
  danger: COLORS.white,
};

const Button = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon = null,
  className = '',
  testID,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      className={`flex-row items-center justify-center rounded-2xl ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${
        fullWidth ? 'w-full' : ''
      } ${isDisabled ? 'opacity-50' : ''} ${className}`}>
      {loading ? (
        <ActivityIndicator color={SPINNER_COLOR[variant]} />
      ) : (
        <>
          {icon}
          <Text className={`font-semibold ${SIZE_TEXT_CLASSES[size]} ${VARIANT_TEXT_CLASSES[variant]} ${icon ? 'ml-2' : ''}`}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default memo(Button);
