import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import Card from './Card';
import Icon from './Icon';
import { COLORS } from '../styles/colors';
import { ICONS } from '../constants/icons';

const BAND_TEXT_CLASS = {
  danger: 'text-danger',
  warning: 'text-warning',
  success: 'text-success',
};

/**
 * Represents a single emotion in a list/grid (dashboard "See Each Emotion
 * in Detail" list, roadmap group preview, etc.).
 */
const EmotionCard = ({ icon, name, score, bandColor = 'success', bandLabel, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${name}, score ${score} out of 10${bandLabel ? `, ${bandLabel}` : ''}`}>
      <Card className="mb-3 flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-background">
            <Icon name={icon} size={18} color={COLORS.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-text">{name}</Text>
            {bandLabel ? (
              <Text className={`text-xs font-medium ${BAND_TEXT_CLASS[bandColor] ?? BAND_TEXT_CLASS.success}`}>
                {bandLabel}
              </Text>
            ) : null}
          </View>
        </View>
        <Text className="mr-1 text-lg font-bold text-primary">{score}/10</Text>
        {onPress ? <Icon name={ICONS.CHEVRON_RIGHT} size={16} color={COLORS.gray400} /> : null}
      </Card>
    </TouchableOpacity>
  );
};

export default memo(EmotionCard);
