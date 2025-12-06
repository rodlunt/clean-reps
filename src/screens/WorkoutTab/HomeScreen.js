import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, fontSize } from '../../theme';
import Button from '../../components/common/Button';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();

  const handleStartWorkout = () => {
    // TODO: Navigate to active workout or show routine selection
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Workout</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Ready to train?
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Start Workout"
          onPress={handleStartWorkout}
          size="large"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    marginTop: spacing.xl,
  },
  subtitle: {
    fontSize: fontSize.lg,
    marginTop: spacing.sm,
  },
  buttonContainer: {
    marginTop: spacing.xl,
  },
});
