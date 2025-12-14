import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image, ActivityIndicator, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useExercises } from '../../context/ExerciseContext';
import { useSettings } from '../../context/SettingsContext';
import { spacing, fontSize, borderRadius } from '../../theme';
import { shadowsLight, shadowsDark } from '../../theme/colors';
import WeightRoller from '../../components/common/WeightRoller';
import RepsRoller from '../../components/common/RepsRoller';

// Demo exercises for quick start without routine
const DEMO_EXERCISES = [
  { id: 'bench-press', exerciseId: 'bench-press', name: 'Bench Press', sets: 3 },
  { id: 'squat', exerciseId: 'squat', name: 'Squat', sets: 3 },
  { id: 'deadlift', exerciseId: 'deadlift', name: 'Deadlift', sets: 3 },
];

const calculate1RM = (weight, reps) => {
  if (!weight || !reps || reps <= 0) return 0;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
};

export default function ActiveWorkoutScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const shadows = isDark ? shadowsDark : shadowsLight;
  const { workoutHistory, saveWorkoutSession, personalBests } = useWorkout();
  const { getExerciseById, exerciseImages, getExerciseImage, refreshExerciseImage, loadingImages } = useExercises();
  const { units, displayWeight, toStorageWeight } = useSettings();
  const routine = route.params?.routine;
  const day = route.params?.day;
  const [startTime] = useState(Date.now());
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [fetchingImage, setFetchingImage] = useState(false);

  // Get exercises from routine day or use demo exercises
  const exercises = useMemo(() => {
    if (day?.exercises && day.exercises.length > 0) {
      return day.exercises.map(ex => ({
        id: ex.exerciseId || ex.id,
        exerciseId: ex.exerciseId || ex.id,
        name: ex.name,
        sets: ex.sets || 3,
      }));
    }
    return DEMO_EXERCISES;
  }, [day]);

  // Get previous session data for this routine/day
  const previousSession = useMemo(() => {
    if (!routine || !day) return null;
    const sessions = workoutHistory
      .filter(s => s.routineId === routine.id && s.dayId === day.id)
      .sort((a, b) => b.date - a.date);
    return sessions[0] || null;
  }, [workoutHistory, routine, day]);

  // Get previous values for an exercise
  const getPreviousValues = (exerciseId, exerciseName) => {
    if (!previousSession) return null;
    const prevEx = previousSession.exercises?.find(
      e => e.exerciseId === exerciseId || e.name === exerciseName
    );
    return prevEx?.sets || null;
  };

  // Check if user is ready for progression (hit high end of rep range - 12+ reps consistently)
  const checkProgressionReady = (exerciseId, exerciseName) => {
    const prevSets = getPreviousValues(exerciseId, exerciseName);
    if (!prevSets || prevSets.length === 0) return false;
    // Ready to level up if at least 2/3 of sets hit 12+ reps
    const highRepSets = prevSets.filter(s => s.reps >= 12).length;
    return highRepSets >= Math.ceil(prevSets.length * 0.66);
  };

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutData, setWorkoutData] = useState(
    exercises.map(ex => ({
      exerciseId: ex.id,
      name: ex.name,
      sets: Array(ex.sets).fill(null).map(() => ({ weight: '', reps: '' })),
    }))
  );

  const currentExercise = workoutData[currentExerciseIndex];

  // Throbbing animation for progression nudge
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isProgressionReady = currentExercise ? checkProgressionReady(currentExercise.exerciseId, currentExercise.name) : false;

  useEffect(() => {
    if (!currentExercise) return;
    const isReady = checkProgressionReady(currentExercise.exerciseId, currentExercise.name);
    if (isReady) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [currentExerciseIndex, currentExercise]);

  const previousValues = currentExercise ? getPreviousValues(currentExercise.exerciseId, currentExercise.name) : null;

  // Get full exercise data from database
  const exerciseData = currentExercise ? getExerciseById(currentExercise.exerciseId) : null;

  // Get exercise image from wger.de
  const currentExerciseId = currentExercise?.exerciseId;
  const exerciseImageUrl = exerciseImages[currentExerciseId];
  const isRefreshingImage = loadingImages[currentExerciseId];

  // Fetch image when modal opens or exercise changes
  useEffect(() => {
    if (showImageModal && currentExerciseId && exerciseImageUrl === undefined) {
      setFetchingImage(true);
      getExerciseImage(currentExerciseId).finally(() => {
        setFetchingImage(false);
      });
    }
  }, [showImageModal, currentExerciseId, exerciseImageUrl, getExerciseImage]);

  // Handle refresh image
  const handleRefreshImage = async () => {
    if (currentExerciseId && !isRefreshingImage) {
      await refreshExerciseImage(currentExerciseId);
    }
  };

  // Early return if no exercise data
  if (!currentExercise) {
    return (
      <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <Text>No exercises found</Text>
      </View>
    );
  }

  // Calculate current best 1RM for this exercise from entered data
  const currentBest1RM = useMemo(() => {
    let best = 0;
    currentExercise.sets.forEach(set => {
      if (set.weight && set.reps) {
        const rm = calculate1RM(parseFloat(set.weight), parseInt(set.reps));
        if (rm > best) best = rm;
      }
    });
    return best;
  }, [currentExercise.sets]);

  // Get stored PR for this exercise
  const storedPR = personalBests[currentExercise.exerciseId] || personalBests[currentExercise.name];

  const updateSet = (setIndex, field, value) => {
    const newData = [...workoutData];
    const newSets = [...newData[currentExerciseIndex].sets];
    newSets[setIndex] = { ...newSets[setIndex], [field]: value };
    newData[currentExerciseIndex].sets = newSets;
    setWorkoutData(newData);
  };

  const goNext = () => {
    if (currentExerciseIndex < workoutData.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const goPrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const finishWorkout = async () => {
    // Calculate summary
    let totalSets = 0;
    let totalVolume = 0;
    let newPRs = 0;

    workoutData.forEach(ex => {
      let exerciseBest1RM = 0;
      ex.sets.forEach(set => {
        if (set.weight && set.reps) {
          totalSets++;
          // Convert display weight to kg for storage
          const weightInKg = toStorageWeight(parseFloat(set.weight));
          const reps = parseInt(set.reps);
          totalVolume += weightInKg * reps;
          const rm = calculate1RM(weightInKg, reps);
          if (rm > exerciseBest1RM) exerciseBest1RM = rm;
        }
      });
      // Check if this beats the stored PR
      const storedPR = personalBests[ex.exerciseId] || personalBests[ex.name];
      if (exerciseBest1RM > 0 && (!storedPR || exerciseBest1RM > storedPR.estimated1RM)) {
        newPRs++;
      }
    });

    // Save workout session (weights stored in kg)
    const session = {
      id: Date.now().toString(),
      routineId: routine?.id || null,
      dayId: day?.id || null,
      date: Date.now(),
      duration: Date.now() - startTime,
      exercises: workoutData.map(ex => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        sets: ex.sets.filter(s => s.weight && s.reps).map(s => ({
          weight: toStorageWeight(parseFloat(s.weight)),
          reps: parseInt(s.reps),
        })),
      })),
    };

    await saveWorkoutSession(session);

    navigation.replace('WorkoutSummary', {
      exerciseCount: workoutData.length,
      totalSets,
      totalVolume: Math.round(totalVolume),
      newPRs,
      duration: session.duration,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {routine && day && (
          <Text style={[styles.routineInfo, { color: colors.primary }]}>
            {routine.name} - {day.name}
          </Text>
        )}
        <Text style={[styles.exerciseNumber, { color: colors.textSecondary }]}>
          Exercise {currentExerciseIndex + 1} of {workoutData.length}
        </Text>
        <TouchableOpacity onPress={() => setShowImageModal(true)}>
          <Text style={[styles.exerciseName, { color: colors.text }]}>
            {currentExercise.name}
          </Text>
          <Text style={[styles.tapToView, { color: colors.textSecondary }]}>
            Tap to view exercise
          </Text>
        </TouchableOpacity>
        {(currentBest1RM > 0 || storedPR) && (
          <Text style={[styles.oneRM, { color: colors.primary }]}>
            Est. 1RM: {currentBest1RM > 0 ? `${displayWeight(currentBest1RM)}${units}` : '-'}
            {storedPR && ` (PR: ${displayWeight(storedPR.estimated1RM)}${units})`}
          </Text>
        )}
      </View>

      <ScrollView style={styles.setsContainer} showsVerticalScrollIndicator={false}>
        {isProgressionReady && (
          <Animated.View
            style={[
              styles.progressionHint,
              { backgroundColor: colors.primary + '20', transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Text style={[styles.progressionHintText, { color: colors.primary }]}>
              Ready to level up? Try adding weight!
            </Text>
          </Animated.View>
        )}
        {currentExercise.sets.map((set, index) => {
          const prevSet = previousValues?.[index];
          const shouldPulse = isProgressionReady && index === 0 && !set.weight;
          return (
            <Animated.View
              key={index}
              style={[
                styles.setRow,
                { backgroundColor: colors.card },
                shadows.sm,
                shouldPulse && { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <Text style={[styles.setLabel, { color: colors.textSecondary }]}>
                Set {index + 1}
              </Text>
              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <WeightRoller
                    value={set.weight}
                    onChange={(value) => updateSet(index, 'weight', value)}
                    placeholder={prevSet?.weight ? `${displayWeight(prevSet.weight)}` : null}
                  />
                  {prevSet?.weight && !set.weight && (
                    <Text style={[styles.prevHint, { color: colors.textSecondary }]}>prev</Text>
                  )}
                </View>
                <Text style={[styles.inputSeparator, { color: colors.textSecondary }]}>x</Text>
                <View style={styles.inputWrapper}>
                  <RepsRoller
                    value={set.reps}
                    onChange={(value) => updateSet(index, 'reps', value)}
                    placeholder={prevSet?.reps ? `${prevSet.reps}` : null}
                  />
                  {prevSet?.reps && !set.reps && (
                    <Text style={[styles.prevHint, { color: colors.textSecondary }]}>prev</Text>
                  )}
                </View>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.card, opacity: currentExerciseIndex === 0 ? 0.5 : 1 }, shadows.sm]}
          onPress={goPrevious}
          disabled={currentExerciseIndex === 0}
        >
          <Text style={[styles.navButtonText, { color: colors.text }]}>Previous</Text>
        </TouchableOpacity>

        {currentExerciseIndex === workoutData.length - 1 ? (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.primary }, shadows.md]}
            onPress={finishWorkout}
          >
            <Text style={[styles.navButtonText, { color: '#FFFFFF' }]}>Finish</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.primary }, shadows.md]}
            onPress={goNext}
          >
            <Text style={[styles.navButtonText, { color: '#FFFFFF' }]}>Next</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.cancelText, { color: colors.error }]}>Cancel Workout</Text>
      </TouchableOpacity>

      {/* Exercise Image Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <TouchableOpacity
          style={styles.imageModalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageModal(false)}
        >
          <View style={[styles.imageModalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.imageModalTitle, { color: colors.text }]}>
              {currentExercise.name}
            </Text>

            {fetchingImage ? (
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.placeholderText, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                  Loading image...
                </Text>
              </View>
            ) : exerciseImageUrl ? (
              <View style={styles.imageContainer}>
                {(imageLoading || isRefreshingImage) && (
                  <ActivityIndicator
                    size="large"
                    color={colors.primary}
                    style={styles.imageLoader}
                  />
                )}
                <Image
                  source={{ uri: exerciseImageUrl }}
                  style={[styles.exerciseImage, isRefreshingImage && { opacity: 0.5 }]}
                  resizeMode="contain"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                />
                <TouchableOpacity
                  style={[styles.refreshButton, { backgroundColor: colors.background }]}
                  onPress={handleRefreshImage}
                  disabled={isRefreshingImage}
                >
                  <Text style={[styles.refreshButtonText, { color: colors.primary }]}>
                    {isRefreshingImage ? 'Refreshing...' : 'Wrong image? Tap to refresh'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.background }]}>
                <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                  No image available
                </Text>
              </View>
            )}

            {exerciseData && (
              <View style={styles.exerciseDetails}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Primary: {exerciseData.primaryMuscles?.join(', ') || '-'}
                </Text>
                {exerciseData.secondaryMuscles?.length > 0 && (
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Secondary: {exerciseData.secondaryMuscles.join(', ')}
                  </Text>
                )}
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Equipment: {exerciseData.equipment?.join(', ') || '-'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowImageModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  routineInfo: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  exerciseNumber: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  exerciseName: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  oneRM: {
    fontSize: fontSize.sm,
    fontWeight: '300',
    marginTop: spacing.xs,
  },
  setsContainer: {
    flex: 1,
  },
  progressionHint: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  progressionHintText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  setLabel: {
    fontSize: fontSize.md,
    fontWeight: '500',
    width: 60,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    alignItems: 'center',
  },
  input: {
    width: 70,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  prevHint: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  inputSeparator: {
    marginHorizontal: spacing.sm,
    fontSize: fontSize.lg,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: fontSize.md,
  },
  tapToView: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  imageModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  imageModalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    position: 'absolute',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: fontSize.md,
  },
  exerciseDetails: {
    width: '100%',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    textTransform: 'capitalize',
  },
  closeButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  refreshButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  refreshButtonText: {
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
});
