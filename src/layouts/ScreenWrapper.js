import { StatusBar } from 'expo-status-bar';
import { ImageBackground, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import backgroundImage from '../assets/images/background.png';

/**
 * Every screen renders inside ScreenWrapper: it owns the safe area, the app
 * background image, the status bar style, and optional scrolling so
 * individual screens never re-implement this shell.
 */
const ScreenWrapper = ({
  children,
  scroll = false,
  background = backgroundImage,
  statusBarStyle = 'dark',
  padded = true,
  className = '',
  contentClassName = '',
  footer = null,
}) => {
  const insets = useSafeAreaInsets();
  const paddingClass = padded ? 'px-5 pb-6' : '';
  // The SafeAreaView below excludes the bottom edge because BottomButton
  // (passed as `footer`) reserves the bottom inset itself. When there's no
  // footer, nothing else accounts for it, so add it here — otherwise
  // trailing content renders under the Android system nav bar / iOS home
  // indicator.
  const bottomInsetStyle = footer ? undefined : { paddingBottom: insets.bottom };

  return (
    <ImageBackground source={background} resizeMode="cover" className={`flex-1 bg-background ${className}`}>
      <StatusBar style={statusBarStyle} />
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName={`flex-grow ${paddingClass} ${contentClassName}`}
            contentContainerStyle={bottomInsetStyle}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View className={`flex-1 ${paddingClass} ${contentClassName}`} style={bottomInsetStyle}>
            {children}
          </View>
        )}
        {/* Rendered outside the padded content area since BottomButton (and
            similar fixed CTAs) manage their own horizontal padding and
            safe-area bottom inset. */}
        {footer}
      </SafeAreaView>
    </ImageBackground>
  );
};

export default ScreenWrapper;
