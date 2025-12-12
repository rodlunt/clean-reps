import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useSettings } from '../../context/SettingsContext';
import { spacing, fontSize, borderRadius } from '../../theme';
import { shadowsLight, shadowsDark } from '../../theme/colors';

const formatDuration = (ms) => {
  if (!ms) return '';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
};

const calculateVolume = (exercises) => {
  let total = 0;
  exercises?.forEach(ex => {
    ex.sets?.forEach(set => {
      if (set.weight && set.reps) {
        total += parseFloat(set.weight) * parseInt(set.reps);
      }
    });
  });
  return Math.round(total);
};

const calculate1RM = (weight, reps) => {
  if (!weight || !reps || reps <= 0) return 0;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
};

export default function ProgressScreen() {
  const { colors, isDark } = useTheme();
  const shadows = isDark ? shadowsDark : shadowsLight;
  const { workoutHistory, personalBests, routines } = useWorkout();
  const { units, displayWeight } = useSettings();
  const [activeTab, setActiveTab] = useState('history');
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Get unique exercises from workout history
  const exerciseList = useMemo(() => {
    const exercises = new Map();
    workoutHistory.forEach(session => {
      session.exercises?.forEach(ex => {
        if (ex.name && !exercises.has(ex.name)) {
          exercises.set(ex.name, ex.exerciseId || ex.name);
        }
      });
    });
    return Array.from(exercises.entries()).map(([name, id]) => ({ name, id }));
  }, [workoutHistory]);

  // Get 1RM history for selected exercise
  const exerciseHistory = useMemo(() => {
    if (!selectedExercise) return [];

    const history = [];
    workoutHistory.forEach(session => {
      session.exercises?.forEach(ex => {
        if (ex.name === selectedExercise.name || ex.exerciseId === selectedExercise.id) {
          let best1RM = 0;
          ex.sets?.forEach(set => {
            const rm = calculate1RM(parseFloat(set.weight), parseInt(set.reps));
            if (rm > best1RM) best1RM = rm;
          });
          if (best1RM > 0) {
            history.push({ date: session.date, value: best1RM });
          }
        }
      });
    });
    return history.sort((a, b) => a.date - b.date);
  }, [selectedExercise, workoutHistory]);

  const getRoutineName = (routineId) => {
    const routine = routines.find(r => r.id === routineId);
    return routine?.name || 'Workout';
  };

  const sortedHistory = useMemo(() => {
    return [...workoutHistory].sort((a, b) => b.date - a.date);
  }, [workoutHistory]);

  // Simple bar chart component
  const renderChart = () => {
    if (!selectedExercise) {
      return (
        <View style={[styles.emptyState, { backgroundColor: colors.card }, shadows.sm]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Select an exercise above to view your progress
          </Text>
        </View>
      );
    }

    if (exerciseHistory.length === 0) {
      return (
        <View style={[styles.emptyState, { backgroundColor: colors.card }, shadows.sm]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No data for {selectedExercise.name} yet
          </Text>
        </View>
      );
    }

    const maxValue = Math.max(...exerciseHistory.map(h => h.value));
    const chartWidth = Dimensions.get('window').width - spacing.lg * 2 - spacing.md * 2;
    const barWidth = Math.min(40, (chartWidth - 20) / exerciseHistory.length);

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.card }, shadows.sm]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Est. 1RM - {selectedExercise.name}
        </Text>
        <View style={styles.chartArea}>
          <View style={styles.yAxis}>
            <Text style={[styles.axisLabel, { color: colors.textSecondary }]}>{displayWeight(maxValue)}{units}</Text>
            <Text style={[styles.axisLabel, { color: colors.textSecondary }]}>{Math.round(displayWeight(maxValue / 2))}{units}</Text>
            <Text style={[styles.axisLabel, { color: colors.textSecondary }]}>0</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.barsContainer}>
            {exerciseHistory.map((point, index) => (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barColumn}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (point.value / maxValue) * 120,
                        width: barWidth,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                  {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
        {personalBests[selectedExercise.id] && (
          <View style={[styles.pbBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.pbText, { color: colors.primary }]}>
              PR: {displayWeight(personalBests[selectedExercise.id].estimated1RM)}{units}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Progress</Text>

      <View style={[styles.segmentedControl, { backgroundColor: colors.card }, shadows.sm]}>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'history' ? (
          sortedHistory.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No workout history yet. Complete a workout to see it here.
              </Text>
            </View>
          ) : (
            sortedHistory.map(session => {
              const volume = calculateVolume(session.exercises);
              const duration = formatDuration(session.duration);
              return (
                <View
                  key={session.id}
                  style={[styles.historyCard, { backgroundColor: colors.card }, shadows.sm]}
                >
                  <View style={styles.historyHeader}>
                    <Text style={[styles.historyDate, { color: colors.text }]}>
                      {new Date(session.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    {duration && (
                      <Text style={[styles.historyDuration, { color: colors.textSecondary }]}>
                        {duration}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.historyRoutine, { color: colors.primary }]}>
                    {getRoutineName(session.routineId)}
                  </Text>
                  <View style={styles.historyStats}>
                    <Text style={[styles.historyInfo, { color: colors.textSecondary }]}>
                      {session.exercises?.length || 0} exercises
                    </Text>
                    {volume > 0 && (
                      <Text style={[styles.historyInfo, { color: colors.textSecondary }]}>
                        {Math.round(displayWeight(volume)).toLocaleString()} {units} volume
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )
        ) : (
          <>
            {exerciseList.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.exercisePicker}
              >
                {exerciseList.map((ex) => (
                  <TouchableOpacity
                    key={ex.id}
                    style={[
                      styles.exerciseChip,
                      {
                        backgroundColor: selectedExercise?.id === ex.id ? colors.primary : colors.card,
                        borderColor: colors.border,
                      },
                      shadows.sm,
                    ]}
                    onPress={() => setSelectedExercise(ex)}
                  >
                    <Text
                      style={[
                        styles.exerciseChipText,
                        { color: selectedExercise?.id === ex.id ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {ex.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {renderChart()}
          </>
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
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  historyDuration: {
    fontSize: fontSize.sm,
  },
  historyRoutine: {
    fontSize: fontSize.md,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  historyStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  historyInfo: {
    fontSize: fontSize.sm,
  },
  exercisePicker: {
    marginBottom: spacing.md,
  },
  exerciseChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    borderWidth: 1,
  },
  exerciseChipText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  chartContainer: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  chartTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  chartArea: {
    flexDirection: 'row',
    height: 160,
  },
  yAxis: {
    width: 45,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: spacing.sm,
    paddingBottom: 20,
  },
  axisLabel: {
    fontSize: fontSize.xs,
  },
  barsContainer: {
    flex: 1,
  },
  barWrapper: {
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  barColumn: {
    height: 120,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: borderRadius.sm,
  },
  barLabel: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  pbBadge: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  pbText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
