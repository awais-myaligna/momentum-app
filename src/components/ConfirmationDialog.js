import { memo } from 'react';
import { Text, View } from 'react-native';

import Button from './Button';
import Modal from './Modal';

const ConfirmationDialog = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}) => {
  return (
    <Modal visible={visible} onClose={onCancel}>
      <Text className="mb-2 text-lg font-bold text-text">{title}</Text>
      {message ? <Text className="mb-5 text-sm text-textSecondary">{message}</Text> : null}
      <View className="flex-row">
        <View className="mr-2 flex-1">
          <Button label={cancelLabel} onPress={onCancel} variant="ghost" />
        </View>
        <View className="ml-2 flex-1">
          <Button label={confirmLabel} onPress={onConfirm} variant={destructive ? 'danger' : 'primary'} />
        </View>
      </View>
    </Modal>
  );
};

export default memo(ConfirmationDialog);
