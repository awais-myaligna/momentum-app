import { memo } from 'react';
import { Image, Text, View } from 'react-native';

const SIZE_MAP = {
  sm: 32,
  md: 48,
  lg: 72,
  xl: 96,
};

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

const Avatar = ({ uri, name, size = 'md', className = '' }) => {
  const dimension = SIZE_MAP[size] ?? SIZE_MAP.md;
  const sizeStyle = { width: dimension, height: dimension, borderRadius: dimension / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={sizeStyle}
        className={className}
        accessibilityLabel={name ? `${name}'s avatar` : 'User avatar'}
      />
    );
  }

  return (
    <View
      style={sizeStyle}
      className={`items-center justify-center bg-secondary ${className}`}
      accessibilityLabel={name ? `${name}'s avatar` : 'User avatar'}>
      <Text className="font-semibold text-white" style={{ fontSize: dimension / 2.6 }}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

export default memo(Avatar);
