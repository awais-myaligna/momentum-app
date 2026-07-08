import { StatusBar } from 'expo-status-bar';
import { ImageBackground, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const paddingClass = padded ? 'px-5 pb-6' : '';

  return (
    <ImageBackground source={background} resizeMode="cover" className={`flex-1 bg-background ${className}`}>
      <StatusBar style={statusBarStyle} />
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName={`flex-grow ${paddingClass} ${contentClassName}`}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View className={`flex-1 ${paddingClass} ${contentClassName}`}>{children}</View>
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
