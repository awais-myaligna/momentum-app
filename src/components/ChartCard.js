import { memo } from 'react';
import { Text, View } from 'react-native';

import Card from './Card';

/**
 * Structural chrome for chart screens: title, optional subtitle/legend, and
 * a slot for the actual chart (BarChart/TrendChart) rendered by the caller.
 */
const ChartCard = ({ title, subtitle, legend = null, footer = null, children, className = '' }) => {
  return (
    <Card className={className}>
      {title ? <Text className="text-base font-semibold text-text">{title}</Text> : null}
      {subtitle ? <Text className="mt-0.5 text-sm text-textSecondary">{subtitle}</Text> : null}
      {legend ? <View className="mt-3">{legend}</View> : null}
      <View className="mt-4">{children}</View>
      {footer ? <View className="mt-4">{footer}</View> : null}
    </Card>
  );
};

export default memo(ChartCard);
