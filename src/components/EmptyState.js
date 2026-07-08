import { memo } from 'react';
import { Text, View } from 'react-native';

import Button from './Button';

/**
 * Covers the empty/retry states referenced throughout the app (e.g. no
 * history yet, or a failed request the user can retry).
 */
const EmptyState = ({ icon = '🌤️', title, description, actionLabel, onAction }) => {
  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <Text className="mb-3 text-5xl">{icon}</Text>
      <Text className="mb-1 text-center text-lg font-semibold text-text">{title}</Text>
      {description ? (
        <Text className="mb-5 text-center text-sm text-textSecondary">{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="outline" fullWidth={false} />
      ) : null}
    </View>
  );
};

export default memo(EmptyState);
