import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useGymProfile } from '../../context/GymProfileContext';
import { useSettings } from '../../context/SettingsContext';
import { spacing, fontSize, borderRadius } from '../../theme';
import { shadowsLight, shadowsDark } from '../../theme/colors';
import Button from '../../components/common/Button';
import GradientCard from '../../components/common/GradientCard';

const GYM_PROMPT_DISMISSED_KEY = '@gym_setup_prompt_dismissed';

// Determine the next scheduled day based on workout history
const getNextScheduledDay = (routine, workoutHistory) => {
  if (!routine || !routine.days || routine.days.length === 0) return null;

  // Find the last completed session for this routine
  const routineSessions = workoutHistory
    .filter(s => s.routineId === routine.id)
    .sort((a, b) => b.date - a.date);

  if (routineSessions.length === 0) {
    // Never done this routine, start with day 1
    return { day: routine.days[0], index: 0, isScheduled: true };
  }

  const lastSession = routineSessions[0];
  const lastDayIndex = routine.days.findIndex(d => d.id === lastSession.dayId);

  // Next day is the one after the last completed
  const nextIndex = (lastDayIndex + 1) % routine.days.length;
  return {
    day: routine.days[nextIndex],
    index: nextIndex,
    isScheduled: true,
    lastCompletedIndex: lastDayIndex,
  };
};

// Check if user might be behind schedule (last workout > 3 days ago)
const isBehindSchedule = (routine, workoutHistory) => {
  const routineSessions = workoutHistory.filter(s => s.routineId === routine?.id);
  if (routineSessions.length === 0) return false;

  const lastSession = routineSessions.sort((a, b) => b.date - a.date)[0];
  const daysSinceLastWorkout = (Date.now() - lastSession.date) / (1000 * 60 * 60 * 24);
  return daysSinceLastWorkout > 3;
};

const calculateWeeklyVolume = (history) => {
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  let total = 0;
  history.forEach(session => {
    if (session.date >= oneWeekAgo) {
      session.exercises?.forEach(ex => {
        ex.sets?.forEach(set => {
          if (set.weight && set.reps) {
            total += parseFloat(set.weight) * parseInt(set.reps);
          }
        });
      });
    }
  });
  return Math.round(total);
};

const getRecentWorkouts = (history, days = 7) => {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return history.filter(s => s.date >= cutoff).length;
};

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const shadows = isDark ? shadowsDark : shadowsLight;
  const { routines, currentRoutine, setCurrentRoutine, workoutHistory, personalBests } = useWorkout();
  const { gymProfiles } = useGymProfile();
  const { units, displayWeight } = useSettings();
  const [showRoutinePicker, setShowRoutinePicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showGymPrompt, setShowGymPrompt] = useState(false);

  // Check if we should show gym setup prompt on first launch
  useEffect(() => {
    const checkGymPrompt = async () => {
      if (gymProfiles.length === 0) {
        const dismissed = await AsyncStorage.getItem(GYM_PROMPT_DISMISSED_KEY);
        if (!dismissed) {
          setShowGymPrompt(true);
        }
      } else {
        // Hide prompt when at least one gym profile exists
        setShowGymPrompt(false);
      }
    };
    checkGymPrompt();
  }, [gymProfiles]);

  const dismissGymPrompt = async () => {
    await AsyncStorage.setItem(GYM_PROMPT_DISMISSED_KEY, 'true');
    setShowGymPrompt(false);
  };

  const handleSetupGym = () => {
    setShowGymPrompt(false);
    navigation.navigate('Settings', { screen: 'GymSetup' });
  };

  const weeklyVolume = useMemo(() => calculateWeeklyVolume(workoutHistory), [workoutHistory]);
  const workoutsThisWeek = useMemo(() => getRecentWorkouts(workoutHistory, 7), [workoutHistory]);
  const pbCount = useMemo(() => Object.keys(personalBests).length, [personalBests]);

  // Next scheduled day tracking
  const nextScheduled = useMemo(() => getNextScheduledDay(currentRoutine, workoutHistory), [currentRoutine, workoutHistory]);
  const behindSchedule = useMemo(() => isBehindSchedule(currentRoutine, workoutHistory), [currentRoutine, workoutHistory]);

  // Get volume history for mini chart (last 4 weeks)
  const volumeHistory = useMemo(() => {
    const weeks = [];
    const now = Date.now();
    for (let i = 3; i >= 0; i--) {
      const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000;
      let volume = 0;
      workoutHistory.forEach(session => {
        if (session.date >= weekStart && session.date < weekEnd) {
          session.exercises?.forEach(ex => {
            ex.sets?.forEach(set => {
              if (set.weight && set.reps) {
                volume += parseFloat(set.weight) * parseInt(set.reps);
              }
            });
          });
        }
      });
      weeks.push(volume);
    }
    return weeks;
  }, [workoutHistory]);

  const handleStartWorkout = () => {
    if (routines.length === 0) {
      navigation.navigate('ActiveWorkout');
    } else if (!currentRoutine) {
      setShowRoutinePicker(true);
    } else {
      setShowDayPicker(true);
    }
  };

  const handleSelectRoutine = (routine) => {
    setCurrentRoutine(routine);
    setShowRoutinePicker(false);
    setShowDayPicker(true);
  };

  const handleSelectDay = (routine, day) => {
    setShowDayPicker(false);
    navigation.navigate('ActiveWorkout', { routine, day });
  };

  const handleQuickStart = () => {
    setShowDayPicker(false);
    setShowRoutinePicker(false);
    navigation.navigate('ActiveWorkout');
  };

  const maxVolume = Math.max(...volumeHistory, 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: colors.text }]}>Workout</Text>

      {/* First Launch Gym Setup Prompt */}
      {showGymPrompt && (
        <View style={[styles.gymPromptCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
          <Text style={[styles.gymPromptTitle, { color: colors.text }]}>
            Set up your gym?
          </Text>
          <Text style={[styles.gymPromptText, { color: colors.textSecondary }]}>
            Tell us what equipment you have access to for personalized exercise recommendations.
          </Text>
          <View style={styles.gymPromptButtons}>
            <TouchableOpacity
              style={[styles.gymPromptButton, { backgroundColor: colors.primary }]}
              onPress={handleSetupGym}
            >
              <Text style={styles.gymPromptButtonText}>Set Up Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.gymPromptLater}
              onPress={dismissGymPrompt}
            >
              <Text style={[styles.gymPromptLaterText, { color: colors.textSecondary }]}>Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Gym Profile Quick Access */}
      {!showGymPrompt && (
        <TouchableOpacity
          style={[styles.gymQuickAccess, { backgroundColor: colors.card }, shadows.sm]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={[styles.gymQuickLabel, { color: colors.textSecondary }]}>
            GYM PROFILE
          </Text>
          <Text style={[styles.gymQuickName, { color: colors.text }]}>
            {gymProfiles.length > 0
              ? gymProfiles.find(g => g.id === gymProfiles[0]?.id)?.name || 'Set up gym'
              : 'No gym set up'}
          </Text>
          <Text style={[styles.gymQuickHint, { color: colors.primary }]}>
            Tap to manage
          </Text>
        </TouchableOpacity>
      )}

      {/* Current Routine Card */}
      {currentRoutine ? (
        <GradientCard style={styles.routineCard} shadow="md">
          <TouchableOpacity onPress={() => setShowRoutinePicker(true)}>
            <Text style={[styles.routineLabel, { color: colors.textSecondary }]}>
              CURRENT ROUTINE
            </Text>
            <Text style={[styles.routineName, { color: colors.text }]}>
              {currentRoutine.name}
            </Text>
            {nextScheduled && (
              <View style={styles.nextDayContainer}>
                <Text style={[styles.nextDayLabel, { color: colors.textSecondary }]}>
                  Next up:
                </Text>
                <Text style={[styles.nextDayName, { color: colors.primary }]}>
                  {nextScheduled.day.name}
                </Text>
              </View>
            )}
            {behindSchedule && (
              <View style={[styles.behindBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.behindBadgeText, { color: colors.primary }]}>
                  Behind schedule? Tap "Start" to pick any day
                </Text>
              </View>
            )}
            <Text style={[styles.routineDays, { color: colors.textSecondary }]}>
              {currentRoutine.days?.length || 0} days • Tap to change routine
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearRoutineButton}
            onPress={() => setCurrentRoutine(null)}
          >
            <Text style={[styles.clearRoutineText, { color: colors.error }]}>
              Clear Routine
            </Text>
          </TouchableOpacity>
        </GradientCard>
      ) : routines.length > 0 ? (
        <TouchableOpacity
          style={[styles.routineCard, styles.emptyRoutineCard, { backgroundColor: colors.card, borderColor: colors.primary }, shadows.sm]}
          onPress={() => setShowRoutinePicker(true)}
        >
          <Text style={[styles.emptyRoutineText, { color: colors.textSecondary }]}>
            Select a routine to get started
          </Text>
          <Text style={[styles.tapHint, { color: colors.primary }]}>
            Tap to choose
          </Text>
        </TouchableOpacity>
      ) : (
        <GradientCard style={styles.routineCard} shadow="sm">
          <Text style={[styles.emptyRoutineText, { color: colors.textSecondary }]}>
            No routines yet
          </Text>
          <Text style={[styles.routineDays, { color: colors.textSecondary }]}>
            Go to Routines tab to create one
          </Text>
        </GradientCard>
      )}

      {/* Start Button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Start Workout"
          onPress={handleStartWorkout}
          size="large"
        />
      </View>

      {/* Stats Overview */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        THIS WEEK
      </Text>
      <View style={styles.statsRow}>
        <GradientCard style={styles.statCard} shadow="sm">
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {workoutsThisWeek}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Workouts
          </Text>
        </GradientCard>
        <GradientCard style={styles.statCard} shadow="sm">
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {displayWeight(weeklyVolume) > 1000 ? `${(displayWeight(weeklyVolume) / 1000).toFixed(1)}k` : Math.round(displayWeight(weeklyVolume))}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {units} Volume
          </Text>
        </GradientCard>
        <GradientCard style={styles.statCard} shadow="sm">
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {pbCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            PRs Set
          </Text>
        </GradientCard>
      </View>

      {/* Mini Volume Chart */}
      {workoutHistory.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: spacing.lg }]}>
            VOLUME TREND (4 WEEKS)
          </Text>
          <GradientCard style={styles.miniChart} shadow="sm">
            <View style={styles.chartBars}>
              {volumeHistory.map((vol, i) => (
                <View key={i} style={styles.chartBarWrapper}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: Math.max((vol / maxVolume) * 80, 4),
                        backgroundColor: i === 3 ? colors.primary : colors.border,
                      },
                    ]}
                  />
                  <Text style={[styles.chartBarLabel, { color: colors.textSecondary }]}>
                    {i === 3 ? 'This' : `${3 - i}w`}
                  </Text>
                </View>
              ))}
            </View>
          </GradientCard>
        </>
      )}

      {/* Routine Picker Modal */}
      <Modal
        visible={showRoutinePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoutinePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Routine
            </Text>
            <ScrollView style={styles.modalList}>
              {routines.map(routine => (
                <TouchableOpacity
                  key={routine.id}
                  style={[styles.modalItem, { backgroundColor: colors.card }]}
                  onPress={() => handleSelectRoutine(routine)}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>
                    {routine.name}
                  </Text>
                  <Text style={[styles.modalItemSub, { color: colors.textSecondary }]}>
                    {routine.days?.length || 0} days
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalActionButton, { backgroundColor: colors.card }]}
              onPress={() => setShowRoutinePicker(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.error }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Day Picker Modal */}
      <Modal
        visible={showDayPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDayPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {currentRoutine?.name || 'Select Day'}
            </Text>
            {nextScheduled && (
              <TouchableOpacity
                style={[styles.scheduledDayButton, { backgroundColor: colors.primary }]}
                onPress={() => handleSelectDay(currentRoutine, nextScheduled.day)}
              >
                <Text style={styles.scheduledDayButtonText}>
                  Start Scheduled: {nextScheduled.day.name}
                </Text>
              </TouchableOpacity>
            )}
            {behindSchedule && (
              <Text style={[styles.skipHint, { color: colors.textSecondary }]}>
                Or skip ahead to a different day:
              </Text>
            )}
            <ScrollView style={styles.modalList}>
              {currentRoutine?.days?.map((day) => {
                const isScheduled = nextScheduled?.day?.id === day.id;
                return (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.modalItem,
                      {
                        backgroundColor: isScheduled ? colors.primary + '20' : colors.card,
                        borderWidth: isScheduled ? 1 : 0,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => handleSelectDay(currentRoutine, day)}
                  >
                    <View style={styles.dayItemContent}>
                      <Text style={[
                        styles.modalItemText,
                        { color: isScheduled ? colors.primary : colors.text }
                      ]}>
                        {day.name}
                      </Text>
                      {isScheduled && (
                        <View style={[styles.scheduledBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.scheduledBadgeText}>Next</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.modalItemSub, { color: colors.textSecondary }]}>
                      {day.exercises?.length || 0} exercises
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: colors.card }]}
                onPress={handleQuickStart}
              >
                <Text style={[styles.modalSecondaryText, { color: colors.primary }]}>
                  Quick Start (Empty)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: colors.card }]}
                onPress={() => setShowDayPicker(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.error }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  routineCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  emptyRoutineCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  routineLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  routineName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  routineDays: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  nextDayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  nextDayLabel: {
    fontSize: fontSize.sm,
  },
  nextDayName: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  behindBadge: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  behindBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  emptyRoutineText: {
    fontSize: fontSize.md,
  },
  tapHint: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  buttonContainer: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  miniChart: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
  },
  chartBarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 30,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  chartBarLabel: {
    fontSize: fontSize.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(128,128,128,0.4)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  modalItemText: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  modalItemSub: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  modalActions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  modalActionButton: {
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  modalSecondaryText: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  modalCancelText: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  scheduledDayButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scheduledDayButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  skipHint: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  dayItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scheduledBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  scheduledBadgeText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  gymPromptCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  gymPromptTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  gymPromptText: {
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  gymPromptButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  gymPromptButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  gymPromptButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  gymPromptLater: {
    padding: spacing.sm,
  },
  gymPromptLaterText: {
    fontSize: fontSize.sm,
  },
  clearRoutineButton: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  clearRoutineText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  gymQuickAccess: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gymQuickLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  gymQuickName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    flex: 1,
    marginLeft: spacing.md,
  },
  gymQuickHint: {
    fontSize: fontSize.sm,
  },
});
