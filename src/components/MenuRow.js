import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import Card from './Card';
import Icon from './Icon';
import { COLORS } from '../styles/colors';
import { ICONS } from '../constants/icons';

/**
 * Tappable row used throughout Profile/Settings (menu links, selectable
 * preference options). Mirrors EmotionCard's icon-bubble + label layout so
 * the two list styles read as one system.
 */
const MenuRow = ({ icon, label, subtitle, onPress, danger = false, rightSlot }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}>
      <Card className="mb-3 flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-background">
            <Icon name={icon} size={18} color={danger ? COLORS.danger : COLORS.primary} />
          </View>
          <View className="flex-1">
            <Text className={`text-base font-semibold ${danger ? 'text-danger' : 'text-text'}`}>
              {label}
            </Text>
            {subtitle ? <Text className="text-xs text-textSecondary">{subtitle}</Text> : null}
          </View>
        </View>
        {rightSlot !== undefined ? (
          rightSlot
        ) : onPress ? (
          <Icon name={ICONS.CHEVRON_RIGHT} size={16} color={COLORS.gray400} />
        ) : null}
      </Card>
    </TouchableOpacity>
  );
};

export default memo(MenuRow);
