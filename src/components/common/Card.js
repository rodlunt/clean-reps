import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius } from '../../theme';
import { shadowsLight, shadowsDark } from '../../theme/colors';

export default function Card({
  children,
  onPress,
  style,
  padding = 'medium',
  shadow = 'md',
}) {
  const { colors, isDark } = useTheme();

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return spacing.sm;
      case 'large':
        return spacing.lg;
      default:
        return spacing.md;
    }
  };

  const getShadow = () => {
    if (!shadow || shadow === 'none') return {};
    const shadowSet = isDark ? shadowsDark : shadowsLight;
    return shadowSet[shadow] || shadowSet.md;
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      padding: getPadding(),
    },
    getShadow(),
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
  },
});
