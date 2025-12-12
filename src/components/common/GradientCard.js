import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';
import { shadowsLight, shadowsDark } from '../../theme/colors';

export default function GradientCard({
  children,
  style,
  gradientColors,
  shadow = 'sm',
  rounded = 'lg',
}) {
  const { colors, isDark } = useTheme();

  const cardColors = gradientColors || colors.cardGradient;
  const shadowSet = isDark ? shadowsDark : shadowsLight;
  const shadowStyle = shadowSet[shadow] || shadowSet.sm;
  const radius = borderRadius[rounded] || borderRadius.lg;

  return (
    <LinearGradient
      colors={cardColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[
        styles.card,
        { borderRadius: radius },
        shadowStyle,
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
