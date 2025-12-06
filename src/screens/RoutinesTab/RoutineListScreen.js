import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { spacing, fontSize } from '../../theme';

export default function RoutineListScreen({ navigation }) {
  const { colors } = useTheme();
  const { routines } = useWorkout();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Routines</Text>
      <ScrollView style={styles.scrollView}>
        {routines.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No routines yet. Create your first routine to get started.
            </Text>
          </View>
        ) : (
          routines.map(routine => (
            <View
              key={routine.id}
              style={[styles.routineCard, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.routineName, { color: colors.text }]}>
                {routine.name}
              </Text>
              <Text style={[styles.routineInfo, { color: colors.textSecondary }]}>
                {routine.days.length} day{routine.days.length !== 1 ? 's' : ''}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
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
    marginBottom: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  routineCard: {
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  routineName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  routineInfo: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
