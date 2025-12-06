import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { spacing, fontSize, borderRadius } from '../../theme';

export default function ProgressScreen() {
  const { colors } = useTheme();
  const { workoutHistory } = useWorkout();
  const [activeTab, setActiveTab] = useState('history');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Progress</Text>

      <View style={[styles.segmentedControl, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[
            styles.segment,
            activeTab === 'history' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'history' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segment,
            activeTab === 'charts' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('charts')}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'charts' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Charts
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'history' ? (
          workoutHistory.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No workout history yet. Complete a workout to see it here.
              </Text>
            </View>
          ) : (
            workoutHistory.map(session => (
              <View
                key={session.id}
                style={[styles.historyCard, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.historyDate, { color: colors.text }]}>
                  {new Date(session.date).toLocaleDateString()}
                </Text>
                <Text style={[styles.historyInfo, { color: colors.textSecondary }]}>
                  {session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''}
                </Text>
              </View>
            ))
          )
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Charts coming soon. Track your estimated 1RM over time.
            </Text>
          </View>
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
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  segmentText: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  historyCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  historyDate: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  historyInfo: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
