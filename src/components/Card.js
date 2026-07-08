import { memo } from 'react';
import { View } from 'react-native';

// Shadow/elevation cannot be expressed with Tailwind classes in RN, so it's
// one of the documented inline-style exceptions.
const SHADOW_STYLE = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};

const Card = ({ children, className = '', shadow = true, style }) => {
  return (
    <View
      className={`rounded-2xl bg-white p-4 ${className}`}
      style={shadow ? [SHADOW_STYLE, style] : style}>
      {children}
    </View>
  );
};

export default memo(Card);
