import { memo } from 'react';
import { BarChart } from 'react-native-gifted-charts';

import { COLORS } from '../styles/colors';

const BAND_COLOR = {
  danger: COLORS.danger,
  warning: COLORS.warning,
  success: COLORS.success,
};

/**
 * Color-coded bar chart of all 12 emotions (red = low, yellow/orange = mid,
 * green = high), per the Momentum roadmap's baseline chart spec.
 * `data` is [{ emotionId, name, score, color }] from dashboardService.
 */
const EmotionBarChart = ({ data, onBarPress, height = 220 }) => {
  const barData = data.map((item) => ({
    value: item.score,
    label: item.name.slice(0, 3),
    frontColor: BAND_COLOR[item.color] ?? COLORS.primary,
    onPress: onBarPress ? () => onBarPress(item.emotionId) : undefined,
  }));

  return (
    <BarChart
      data={barData}
      height={height}
      maxValue={10}
      noOfSections={5}
      barWidth={16}
      spacing={14}
      barBorderRadius={4}
      yAxisThickness={0}
      xAxisThickness={1}
      xAxisColor={COLORS.border}
      yAxisTextStyle={{ color: COLORS.textSecondary, fontSize: 10 }}
      xAxisLabelTextStyle={{ color: COLORS.textSecondary, fontSize: 9 }}
      rulesColor={COLORS.gray200}
      rulesType="solid"
      isAnimated
      animationDuration={500}
    />
  );
};

export default memo(EmotionBarChart);
