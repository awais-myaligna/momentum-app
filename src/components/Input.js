import { memo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { COLORS } from '../styles/colors';

/**
 * Controlled text input designed to pair with Formik's getFieldProps.
 * Pass `secureToggle` for password fields to add a show/hide affordance.
 */
const Input = ({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  error,
  touched,
  secureTextEntry = false,
  secureToggle = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  editable = true,
  leftIcon = null,
  className = '',
  testID,
}) => {
  const [isSecureVisible, setIsSecureVisible] = useState(false);
  const showError = Boolean(error && touched);
  const resolvedSecure = secureToggle ? !isSecureVisible && secureTextEntry : secureTextEntry;

  return (
    <View className={`mb-4 ${className}`}>
      {label ? <Text className="mb-1.5 text-sm font-medium text-text">{label}</Text> : null}
      <View
        className={`flex-row items-center rounded-xl border bg-white px-4 ${
          showError ? 'border-danger' : 'border-border'
        } ${!editable ? 'opacity-60' : ''}`}>
        {leftIcon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray500}
          secureTextEntry={resolvedSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          editable={editable}
          accessibilityLabel={label || placeholder}
          testID={testID}
          className={`flex-1 py-3.5 text-base text-text ${leftIcon ? 'ml-2' : ''}`}
          style={multiline ? { minHeight: 96, textAlignVertical: 'top' } : undefined}
        />
        {secureToggle ? (
          <TouchableOpacity
            onPress={() => setIsSecureVisible((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={isSecureVisible ? 'Hide password' : 'Show password'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text className="text-sm font-medium text-primary">{isSecureVisible ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {showError ? <Text className="mt-1 text-xs text-danger">{error}</Text> : null}
    </View>
  );
};

export default memo(Input);
