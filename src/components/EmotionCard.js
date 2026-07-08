import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import Card from './Card';

const BAND_DOT_CLASS = {
  danger: 'bg-danger',
  warning: 'bg-warning',
  success: 'bg-success',
};

/**
 * Represents a single emotion in a list/grid (dashboard "See Each Emotion
 * in Detail" list, roadmap group preview, etc.).
 */
const EmotionCard = ({ name, score, bandColor = 'success', bandLabel, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${name}, score ${score} out of 10${bandLabel ? `, ${bandLabel}` : ''}`}>
      <Card className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className={`mr-3 h-3 w-3 rounded-full ${BAND_DOT_CLASS[bandColor] ?? BAND_DOT_CLASS.success}`} />
          <View>
            <Text className="text-base font-semibold text-text">{name}</Text>
            {bandLabel ? <Text className="text-xs text-textSecondary">{bandLabel}</Text> : null}
          </View>
        </View>
        <Text className="text-lg font-bold text-primary">{score}/10</Text>
      </Card>
    </TouchableOpacity>
  );
};

export default memo(EmotionCard);
