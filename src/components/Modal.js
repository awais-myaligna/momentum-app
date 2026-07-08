import { memo } from 'react';
import { Modal as RNModal, Pressable, View } from 'react-native';

/**
 * Generic centered modal shell. Compose it with any content; see
 * ConfirmationDialog for a ready-made confirm/cancel variant.
 */
const Modal = ({ visible, onClose, children, dismissOnBackdropPress = true }) => {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        className="flex-1 items-center justify-center bg-black/40 px-6"
        onPress={dismissOnBackdropPress ? onClose : undefined}>
        <Pressable onPress={(event) => event.stopPropagation()} className="w-full">
          <View className="rounded-2xl bg-white p-5">{children}</View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
};

export default memo(Modal);
