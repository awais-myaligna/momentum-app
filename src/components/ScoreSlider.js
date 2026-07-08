import { memo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const SCORE_VALUES = Array.from({ length: 10 }, (_, index) => index + 1);

/**
 * 1-10 emotion rating control. Presented as selectable pills rather than a
 * native slider so it stays fully accessible and dependency-free while still
 * matching the roadmap's "respond with a number from 1 to 10" flow.
 */
const ScoreSlider = ({ value, onChange, label }) => {
  return (
    <View>
      {label ? <Text className="mb-3 text-sm font-medium text-textSecondary">{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="pr-1">
        {SCORE_VALUES.map((score) => {
          const isSelected = value === score;
          return (
            <TouchableOpacity
              key={score}
              onPress={() => onChange(score)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Rate ${score} out of 10`}
              className={`mr-2 h-12 w-12 items-center justify-center rounded-full border ${
                isSelected ? 'border-primary bg-primary' : 'border-border bg-white'
              }`}>
              <Text className={`text-base font-semibold ${isSelected ? 'text-white' : 'text-text'}`}>{score}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default memo(ScoreSlider);
