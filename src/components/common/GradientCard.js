import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius, shadows } from '../../theme';

export default function GradientCard({
  children,
  style,
  gradientColors,
  shadow = 'sm',
  rounded = 'lg',
}) {
  const { colors } = useTheme();

  const cardColors = gradientColors || colors.cardGradient;
  const shadowStyle = shadows[shadow] || shadows.sm;
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
