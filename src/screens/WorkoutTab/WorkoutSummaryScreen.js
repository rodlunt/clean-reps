import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { spacing, fontSize, borderRadius } from '../../theme';
import { shadowsLight, shadowsDark } from '../../theme/colors';
import Button from '../../components/common/Button';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_CONFETTI = 30;

const formatDuration = (ms) => {
  if (!ms) return '0 min';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
};

// Confetti particle component
const ConfettiParticle = ({ delay, color }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(Math.random() * SCREEN_WIDTH)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startX = Math.random() * SCREEN_WIDTH;
    translateX.setValue(startX);

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT + 50,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: startX + (Math.random() - 0.5) * 200,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 3000,
          delay: 1500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotate.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            })},
          ],
          opacity,
        },
      ]}
    />
  );
};

export default function WorkoutSummaryScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const shadows = isDark ? shadowsDark : shadowsLight;
  const { units, displayWeight } = useSettings();
  const { exerciseCount = 0, totalSets = 0, totalVolume = 0, newPRs = 0, duration = 0 } = route.params || {};

  // PR badge animation
  const prScale = useRef(new Animated.Value(0)).current;
  const prGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (newPRs > 0) {
      // Bounce in animation
      Animated.spring(prScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }).start();

      // Pulsing glow effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(prGlow, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(prGlow, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [newPRs]);

  // Generate confetti colors
  const confettiColors = [colors.primary, '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'];

  const handleDone = () => {
    navigation.popToTop();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Confetti celebration for PRs */}
      {newPRs > 0 && (
        <View style={styles.confettiContainer} pointerEvents="none">
          {Array.from({ length: NUM_CONFETTI }).map((_, index) => (
            <ConfettiParticle
              key={index}
              delay={index * 100}
              color={confettiColors[index % confettiColors.length]}
            />
          ))}
        </View>
      )}

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.primary }]}>Workout Complete</Text>

        {newPRs > 0 && (
          <Animated.View
            style={[
              styles.prBadge,
              {
                backgroundColor: colors.primary + '20',
                transform: [{ scale: prScale }],
                shadowColor: colors.primary,
                shadowOpacity: prGlow,
                shadowRadius: 20,
                elevation: 10,
              }
            ]}
          >
            <Text style={[styles.prText, { color: colors.primary }]}>
              {newPRs} New PR{newPRs > 1 ? 's' : ''}!
            </Text>
          </Animated.View>
        )}

        <View style={[styles.statsCard, { backgroundColor: colors.card }, shadows.md]}>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Duration</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatDuration(duration)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Exercises</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{exerciseCount}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sets Completed</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalSets}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Volume</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {displayWeight(totalVolume) > 1000 ? `${(displayWeight(totalVolume) / 1000).toFixed(1)}k` : Math.round(displayWeight(totalVolume))} {units}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Done" onPress={handleDone} size="large" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  statsCard: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  statLabel: {
    fontSize: fontSize.md,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: spacing.lg,
  },
  prBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  prText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
