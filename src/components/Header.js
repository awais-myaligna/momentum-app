import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import Icon from './Icon';
import { ICONS } from '../constants/icons';
import { COLORS } from '../styles/colors';

/**
 * Custom in-content header used on screens that hide the native React
 * Navigation header for full design control (see ScreenWrapper usage).
 */
const Header = ({ title, subtitle, onBack, rightSlot = null, className = '' }) => {
  return (
    <View className={`mb-4 flex-row items-center justify-between ${className}`}>
      <View className="flex-1 flex-row items-center">
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white">
            <Icon name={ICONS.BACK} size={18} color={COLORS.text} />
          </TouchableOpacity>
        ) : null}
        <View className="flex-1">
          <Text className="text-xl font-bold text-text" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 text-sm text-textSecondary" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightSlot}
    </View>
  );
};

export default memo(Header);
