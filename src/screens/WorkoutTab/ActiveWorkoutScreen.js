import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image, ActivityIndicator, Animated, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useExercises } from '../../context/ExerciseContext';
import { useSettings } from '../../context/SettingsContext';
import { spacing, fontSize, borderRadius } from '../../theme';
import { shadowsLight, shadowsDark } from '../../theme/colors';
import { RESISTANCE_BANDS, BAND_ASSISTED_EXERCISES } from '../../data/starterRoutines';
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
  const { getExerciseById, exerciseImages, getExerciseImage } = useExercises();
  const { units, displayWeight, toStorageWeight, targetRepMax, weightIncrement } = useSettings();
  const routine = route.params?.routine;
  const day = route.params?.day;
  const [startTime] = useState(Date.now());
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [fetchingImage, setFetchingImage] = useState(false);

  // Session modal state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapExerciseIndex, setSwapExerciseIndex] = useState(null);
  const { exercises: allExercises } = useExercises();

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

  /**
   * Get previous values for an exercise from the last time it was performed
   * Searches ALL workout history, not just same routine/day
   * @param {string} exerciseId - The exercise ID to search for
   * @param {string} exerciseName - The exercise name (fallback match)
   * @returns {Array|null} Previous sets array or null if not found
   */
  const getPreviousValues = useCallback((exerciseId, exerciseName) => {
    if (!workoutHistory || workoutHistory.length === 0) return null;

    // Sort all sessions by date descending (most recent first)
    const sortedSessions = [...workoutHistory].sort((a, b) => b.date - a.date);

    // Find the most recent session containing this exercise
    for (const session of sortedSessions) {
      const matchingExercise = session.exercises?.find(
        e => e.exerciseId === exerciseId || e.name === exerciseName
      );
      if (matchingExercise?.sets?.length > 0) {
        return matchingExercise.sets;
      }
    }
    return null;
  }, [workoutHistory]);

  /**
   * Check if user is ready for progression based on target rep max setting
   * @param {string} exerciseId - Exercise ID to check
   * @param {string} exerciseName - Exercise name (fallback)
   * @returns {{ ready: boolean, suggestedWeight: number|null, previousWeight: number|null }}
   */
  const checkProgressionReady = (exerciseId, exerciseName) => {
    const prevSets = getPreviousValues(exerciseId, exerciseName);
    if (!prevSets || prevSets.length === 0) return { ready: false, suggestedWeight: null, previousWeight: null };

    // Ready to level up if at least 2/3 of sets hit target rep max
    const highRepSets = prevSets.filter(s => s.reps >= targetRepMax).length;
    const ready = highRepSets >= Math.ceil(prevSets.length * 0.66);

    // Calculate suggested new weight if ready
    let suggestedWeight = null;
    let previousWeight = null;
    if (ready && prevSets.length > 0) {
      // Use the weight from the first set as the base
      previousWeight = parseFloat(prevSets[0].weight) || 0;
      suggestedWeight = previousWeight + weightIncrement;
    }

    return { ready, suggestedWeight, previousWeight };
  };

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const [workoutData, setWorkoutData] = useState(
    exercises.map(ex => ({
      exerciseId: ex.id,
      name: ex.name,
      sets: Array(ex.sets).fill(null).map(() => ({ weight: '', reps: '' })),
      supersetGroup: null, // null = not in superset, number = superset group ID
      notes: '', // Per-exercise notes (e.g., "narrow grip", "pause at bottom")
    }))
  );
  const [nextSupersetId, setNextSupersetId] = useState(1); // For generating unique superset IDs

  const currentExercise = workoutData[currentExerciseIndex];

  // Check if current exercise supports resistance bands
  const isBandAssistedExercise = useMemo(() => {
    if (!currentExercise) return false;
    const exerciseId = currentExercise.exerciseId?.toLowerCase() || '';
    const exerciseName = currentExercise.name?.toLowerCase() || '';
    return BAND_ASSISTED_EXERCISES.some(id =>
      exerciseId.includes(id) || exerciseName.includes(id.replace(/-/g, ' '))
    );
  }, [currentExercise]);

  // Throbbing animation for progression nudge
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Check progression status with suggested weight
  const progressionStatus = currentExercise
    ? checkProgressionReady(currentExercise.exerciseId, currentExercise.name)
    : { ready: false, suggestedWeight: null, previousWeight: null };
  const isProgressionReady = progressionStatus.ready;

  useEffect(() => {
    if (!currentExercise) return;
    const { ready } = checkProgressionReady(currentExercise.exerciseId, currentExercise.name);
    if (ready) {
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

  // Get exercise image
  const currentExerciseId = currentExercise?.exerciseId;
  const exerciseImageUrl = exerciseImages[currentExerciseId];

  // Fetch image when modal opens or exercise changes
  useEffect(() => {
    if (showImageModal && currentExerciseId && exerciseImageUrl === undefined) {
      setFetchingImage(true);
      getExerciseImage(currentExerciseId).finally(() => {
        setFetchingImage(false);
      });
    }
  }, [showImageModal, currentExerciseId, exerciseImageUrl, getExerciseImage]);

  // Early return if no exercise data
  if (!currentExercise) {
    return (
      <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <Text>No exercises found</Text>
      </View>
    );
  }

  // Calculate current best 1RM for this exercise from entered data
  // Convert entered weight to kg for consistent calculation with stored PRs
  const currentBest1RM = useMemo(() => {
    if (!currentExercise) return 0;
    let best = 0;
    currentExercise.sets.forEach(set => {
      if (set.weight && set.reps) {
        const weightInKg = toStorageWeight(parseFloat(set.weight));
        const rm = calculate1RM(weightInKg, parseInt(set.reps));
        if (rm > best) best = rm;
      }
    });
    return best;
  }, [currentExercise?.sets, toStorageWeight]);

  // Get stored PR for this exercise
  const storedPR = currentExercise
    ? (personalBests[currentExercise.exerciseId] || personalBests[currentExercise.name])
    : null;

  // Check if current exercise uses dumbbells (weight shown is per arm)
  const isDumbbellExercise = exerciseData?.equipment?.includes('dumbbells') || false;

  /**
   * Scroll to a specific set row when input is focused
   * @param {number} setIndex - Index of the set row to scroll to
   */
  const scrollToSet = (setIndex) => {
    // Calculate approximate Y position of the set row
    // Each set row is approximately 80px tall with margins
    const yOffset = setIndex * 90;
    scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
  };

  const updateSet = (setIndex, field, value) => {
    const newData = [...workoutData];
    const newSets = [...newData[currentExerciseIndex].sets];
    newSets[setIndex] = { ...newSets[setIndex], [field]: value };
    newData[currentExerciseIndex].sets = newSets;
    setWorkoutData(newData);
  };

  /**
   * Update notes for current exercise
   * @param {string} notes - The notes text
   */
  const updateNotes = (notes) => {
    const newData = [...workoutData];
    newData[currentExerciseIndex].notes = notes;
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

  /**
   * Delete an exercise from the current session
   * @param {number} index - Index of exercise to delete
   */
  const deleteExercise = (index) => {
    if (workoutData.length <= 1) return; // Don't delete last exercise
    const newData = workoutData.filter((_, i) => i !== index);
    setWorkoutData(newData);
    // Adjust current index if needed
    if (currentExerciseIndex >= newData.length) {
      setCurrentExerciseIndex(newData.length - 1);
    } else if (currentExerciseIndex > index) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  /**
   * Update number of sets for an exercise
   * @param {number} exerciseIndex - Index of exercise to update
   * @param {number} newSetCount - New number of sets
   */
  const updateExerciseSets = (exerciseIndex, newSetCount) => {
    if (newSetCount < 1 || newSetCount > 10) return;
    const newData = [...workoutData];
    const currentSets = newData[exerciseIndex].sets;

    if (newSetCount > currentSets.length) {
      // Add more sets
      const setsToAdd = newSetCount - currentSets.length;
      for (let i = 0; i < setsToAdd; i++) {
        currentSets.push({ weight: '', reps: '' });
      }
    } else {
      // Remove sets from end
      newData[exerciseIndex].sets = currentSets.slice(0, newSetCount);
    }
    setWorkoutData(newData);
  };

  /**
   * Swap an exercise with another from the exercise library
   * @param {number} index - Index of exercise to swap
   * @param {object} newExercise - New exercise object
   */
  const swapExercise = (index, newExercise) => {
    const newData = [...workoutData];
    const currentSetCount = newData[index].sets.length;
    newData[index] = {
      exerciseId: newExercise.id,
      name: newExercise.name,
      sets: Array(currentSetCount).fill(null).map(() => ({ weight: '', reps: '' })),
    };
    setWorkoutData(newData);
    setShowSwapModal(false);
    setSwapExerciseIndex(null);
  };

  /**
   * Open swap modal for a specific exercise
   * @param {number} index - Index of exercise to swap
   */
  const openSwapModal = (index) => {
    setSwapExerciseIndex(index);
    setShowSwapModal(true);
  };

  /**
   * Jump to a specific exercise from session modal
   * @param {number} index - Index of exercise to jump to
   */
  const jumpToExercise = (index) => {
    setCurrentExerciseIndex(index);
    setShowSessionModal(false);
  };

  /**
   * Link two adjacent exercises into a superset
   * @param {number} index - Index of first exercise to link
   */
  const linkSuperset = (index) => {
    if (index >= workoutData.length - 1) return;

    const newData = [...workoutData];
    const firstExercise = newData[index];
    const secondExercise = newData[index + 1];

    // Determine the superset group ID to use
    let groupId;
    if (firstExercise.supersetGroup !== null) {
      groupId = firstExercise.supersetGroup;
    } else if (secondExercise.supersetGroup !== null) {
      groupId = secondExercise.supersetGroup;
    } else {
      groupId = nextSupersetId;
      setNextSupersetId(nextSupersetId + 1);
    }

    newData[index].supersetGroup = groupId;
    newData[index + 1].supersetGroup = groupId;
    setWorkoutData(newData);
  };

  /**
   * Unlink an exercise from its superset
   * @param {number} index - Index of exercise to unlink
   */
  const unlinkSuperset = (index) => {
    const newData = [...workoutData];
    const exercise = newData[index];
    if (exercise.supersetGroup === null) return;

    const groupId = exercise.supersetGroup;
    newData[index].supersetGroup = null;

    // Check if any other exercises remain in the superset
    const remainingInGroup = newData.filter(ex => ex.supersetGroup === groupId);
    if (remainingInGroup.length === 1) {
      // Only one left, remove it from superset too
      const lastIndex = newData.findIndex(ex => ex.supersetGroup === groupId);
      if (lastIndex !== -1) {
        newData[lastIndex].supersetGroup = null;
      }
    }
    setWorkoutData(newData);
  };

  /**
   * Get all exercises in the same superset as the given index
   * @param {number} index - Index of exercise
   * @returns {Array} Array of indices in the same superset
   */
  const getSupersetExercises = (index) => {
    const exercise = workoutData[index];
    if (!exercise || exercise.supersetGroup === null) return [index];

    return workoutData
      .map((ex, i) => ex.supersetGroup === exercise.supersetGroup ? i : -1)
      .filter(i => i !== -1);
  };

  /**
   * Get the next exercise index in a superset rotation
   * Handles exercises with different set counts by skipping exercises that don't have the target set
   * @param {number} currentIndex - Current exercise index
   * @param {number} currentSetIndex - Current set index
   * @returns {{ nextExerciseIndex: number, nextSetIndex: number }}
   */
  const getNextSupersetPosition = (currentIndex, currentSetIndex) => {
    const supersetIndices = getSupersetExercises(currentIndex);

    if (supersetIndices.length <= 1) {
      // Not in a superset, move to next set
      return { nextExerciseIndex: currentIndex, nextSetIndex: currentSetIndex + 1 };
    }

    // Find position in superset
    const posInSuperset = supersetIndices.indexOf(currentIndex);

    // Try to find the next exercise in superset that has this set
    for (let i = 1; i <= supersetIndices.length; i++) {
      const nextPos = (posInSuperset + i) % supersetIndices.length;
      const nextExerciseIdx = supersetIndices[nextPos];
      const nextExercise = workoutData[nextExerciseIdx];

      // If we've wrapped around, we're on the next set
      const targetSetIndex = nextPos <= posInSuperset ? currentSetIndex + 1 : currentSetIndex;

      // Check if this exercise has the target set
      if (nextExercise.sets.length > targetSetIndex) {
        return { nextExerciseIndex: nextExerciseIdx, nextSetIndex: targetSetIndex };
      }
    }

    // All exercises in superset are done, stay on current exercise's next set (if any)
    return { nextExerciseIndex: currentIndex, nextSetIndex: currentSetIndex + 1 };
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
        {routine && day && (
          <Text style={[styles.routineInfo, { color: colors.primary }]}>
            {routine.name} - {day.name}
          </Text>
        )}
        <TouchableOpacity onPress={() => setShowSessionModal(true)}>
          <Text style={[styles.exerciseNumber, { color: colors.textSecondary }]}>
            Exercise {currentExerciseIndex + 1} of {workoutData.length} ▼
          </Text>
        </TouchableOpacity>
        <View style={styles.exerciseHeaderRow}>
          <TouchableOpacity style={styles.exerciseNameTouchable} onPress={() => setShowImageModal(true)}>
            <Text style={[styles.exerciseName, { color: colors.text }]}>
              {currentExercise.name}
            </Text>
            <Text style={[styles.tapToView, { color: colors.textSecondary }]}>
              Tap to view exercise
            </Text>
          </TouchableOpacity>
          {currentExercise.supersetGroup !== null && (
            <TouchableOpacity
              style={[styles.supersetUnlinkButton, { borderColor: colors.border }]}
              onPress={() => unlinkSuperset(currentExerciseIndex)}
            >
              <Text style={[styles.supersetUnlinkIcon, { color: colors.textSecondary }]}>🔗</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Show superset partner exercises */}
        {currentExercise.supersetGroup !== null && (
          <View style={[styles.supersetPartners, { backgroundColor: ('#D97706') + '15' }]}>
            <Text style={[styles.supersetPartnersLabel, { color: '#D97706' }]}>
              Superset with:
            </Text>
            <Text style={[styles.supersetPartnersText, { color: colors.textSecondary }]}>
              {getSupersetExercises(currentExerciseIndex)
                .filter(i => i !== currentExerciseIndex)
                .map(i => workoutData[i].name)
                .join(', ')}
            </Text>
          </View>
        )}
        {(currentBest1RM > 0 || storedPR) && (
          <Text style={[styles.oneRM, { color: colors.primary }]}>
            Est. 1RM: {currentBest1RM > 0 ? `${displayWeight(currentBest1RM)}${units}` : '-'}
            {isDumbbellExercise && ' (per arm)'}
            {storedPR && ` (PR: ${displayWeight(storedPR.estimated1RM)}${units})`}
          </Text>
        )}
        {/* Exercise notes input */}
        <TextInput
          style={[styles.notesInput, {
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: currentExercise.notes ? colors.primary : colors.border,
          }]}
          placeholder="Add notes (e.g., narrow grip, pause at bottom)"
          placeholderTextColor={colors.placeholder}
          value={currentExercise.notes}
          onChangeText={updateNotes}
          multiline={false}
        />
      </View>

      <ScrollView
          ref={scrollViewRef}
          style={styles.setsContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
        {isProgressionReady && (
          <Animated.View
            style={[
              styles.progressionHint,
              { backgroundColor: colors.primary + '20', transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Text style={[styles.progressionHintText, { color: colors.primary }]}>
              {progressionStatus.suggestedWeight
                ? `Great job hitting ${targetRepMax} reps! Try ${displayWeight(progressionStatus.suggestedWeight)}${units} next`
                : 'Ready to level up? Try adding weight!'}
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
                    onFocus={() => scrollToSet(index)}
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
                    onFocus={() => scrollToSet(index)}
                    onComplete={() => {
                      // Auto-advance using superset logic
                      const { nextExerciseIndex, nextSetIndex } = getNextSupersetPosition(currentExerciseIndex, index);

                      if (nextExerciseIndex !== currentExerciseIndex) {
                        // Move to different exercise in superset
                        setCurrentExerciseIndex(nextExerciseIndex);
                        // Scroll to the same set in the next exercise
                        setTimeout(() => scrollToSet(nextSetIndex), 100);
                      } else if (nextSetIndex < currentExercise.sets.length) {
                        // Stay on same exercise, move to next set
                        scrollToSet(nextSetIndex);
                      }
                    }}
                  />
                  {prevSet?.reps && !set.reps && (
                    <Text style={[styles.prevHint, { color: colors.textSecondary }]}>prev</Text>
                  )}
                </View>
              </View>
              {isBandAssistedExercise && (
                <View style={styles.bandRow}>
                  <Text style={[styles.bandLabel, { color: colors.textSecondary }]}>Band:</Text>
                  <View style={styles.bandOptions}>
                    {RESISTANCE_BANDS.map(band => {
                      const isSelected = set.band === band.id || (!set.band && band.id === 'none');
                      return (
                        <TouchableOpacity
                          key={band.id}
                          style={[
                            styles.bandOption,
                            {
                              backgroundColor: isSelected
                                ? (band.color || colors.primary)
                                : colors.background,
                              borderColor: band.color || colors.border,
                            }
                          ]}
                          onPress={() => updateSet(index, 'band', band.id)}
                        >
                          <Text style={[
                            styles.bandOptionText,
                            { color: isSelected ? '#FFFFFF' : (band.color || colors.text) }
                          ]}>
                            {band.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </Animated.View>
          );
        })}
        <TouchableOpacity
          style={[styles.addSetButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
          onPress={() => updateExerciseSets(currentExerciseIndex, currentExercise.sets.length + 1)}
        >
          <Text style={[styles.addSetButtonText, { color: colors.primary }]}>+ Add Set</Text>
        </TouchableOpacity>

        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButtonSmall, { backgroundColor: colors.card, opacity: currentExerciseIndex === 0 ? 0.5 : 1 }, shadows.sm]}
            onPress={goPrevious}
            disabled={currentExerciseIndex === 0}
          >
            <Text style={[styles.navButtonTextSmall, { color: colors.text }]}>Previous</Text>
          </TouchableOpacity>

          {currentExerciseIndex === workoutData.length - 1 ? (
            <TouchableOpacity
              style={[styles.navButtonSmall, { backgroundColor: colors.primary }, shadows.md]}
              onPress={finishWorkout}
            >
              <Text style={[styles.navButtonTextSmall, { color: '#FFFFFF' }]}>Finish</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButtonSmall, { backgroundColor: colors.primary }, shadows.md]}
              onPress={goNext}
            >
              <Text style={[styles.navButtonTextSmall, { color: '#FFFFFF' }]}>Next</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.cancelText, { color: colors.error }]}>Cancel Workout</Text>
        </TouchableOpacity>
      </ScrollView>

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
                {imageLoading && (
                  <ActivityIndicator
                    size="large"
                    color={colors.primary}
                    style={styles.imageLoader}
                  />
                )}
                <Image
                  source={{ uri: exerciseImageUrl }}
                  style={styles.exerciseImage}
                  resizeMode="contain"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                />
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

      {/* This Session Modal */}
      <Modal
        visible={showSessionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSessionModal(false)}
      >
        <View style={styles.sessionModalOverlay}>
          <View style={[styles.sessionModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.sessionModalTitle, { color: colors.text }]}>
              This Session
            </Text>
            <ScrollView style={styles.sessionExerciseList} showsVerticalScrollIndicator={false}>
              {workoutData.map((exercise, index) => {
                const completedSets = exercise.sets.filter(s => s.weight && s.reps).length;
                const isCurrentExercise = index === currentExerciseIndex;
                const isInSuperset = exercise.supersetGroup !== null;
                const nextExercise = workoutData[index + 1];
                const canLinkNext = index < workoutData.length - 1;
                const isLinkedToNext = canLinkNext && nextExercise?.supersetGroup !== null &&
                  nextExercise.supersetGroup === exercise.supersetGroup;

                return (
                  <React.Fragment key={index}>
                    <View
                      style={[
                        styles.sessionExerciseRow,
                        { backgroundColor: isCurrentExercise ? colors.primary + '20' : colors.background },
                        isCurrentExercise && { borderColor: colors.primary, borderWidth: 1 },
                        isInSuperset && !isCurrentExercise && { borderLeftWidth: 3, borderLeftColor: '#D97706' }
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.sessionExerciseInfo}
                        onPress={() => jumpToExercise(index)}
                      >
                        <Text style={[styles.sessionExerciseName, { color: colors.text }]}>
                          {exercise.name}
                        </Text>
                        <Text style={[styles.sessionExerciseSets, { color: colors.textSecondary }]}>
                          {completedSets}/{exercise.sets.length} sets
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.sessionExerciseActions}>
                        <TouchableOpacity
                          style={[styles.setCountButton, { backgroundColor: colors.background }]}
                          onPress={() => updateExerciseSets(index, exercise.sets.length - 1)}
                        >
                          <Text style={[styles.setCountButtonText, { color: colors.text }]}>−</Text>
                        </TouchableOpacity>
                        <Text style={[styles.setCountDisplay, { color: colors.text }]}>
                          {exercise.sets.length}
                        </Text>
                        <TouchableOpacity
                          style={[styles.setCountButton, { backgroundColor: colors.background }]}
                          onPress={() => updateExerciseSets(index, exercise.sets.length + 1)}
                        >
                          <Text style={[styles.setCountButtonText, { color: colors.text }]}>+</Text>
                        </TouchableOpacity>
                        {isInSuperset ? (
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: ('#D97706') + '20' }]}
                            onPress={() => unlinkSuperset(index)}
                          >
                            <Text style={[styles.actionButtonText, { color: '#D97706' }]}>Unlink</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                            onPress={() => openSwapModal(index)}
                          >
                            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Swap</Text>
                          </TouchableOpacity>
                        )}
                        {workoutData.length > 1 && (
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
                            onPress={() => deleteExercise(index)}
                          >
                            <Text style={[styles.actionButtonText, { color: colors.error }]}>X</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    {/* Link superset button between exercises */}
                    {canLinkNext && !isLinkedToNext && (
                      <TouchableOpacity
                        style={[styles.linkSupersetButton, { borderColor: colors.border }]}
                        onPress={() => linkSuperset(index)}
                      >
                        <Text style={[styles.linkSupersetText, { color: colors.textSecondary }]}>🔗</Text>
                      </TouchableOpacity>
                    )}
                    {/* Visual connector for linked supersets */}
                    {isLinkedToNext && (
                      <TouchableOpacity
                        style={styles.supersetConnector}
                        onPress={() => unlinkSuperset(index)}
                      >
                        <Text style={[styles.supersetConnectorText, { color: colors.textSecondary }]}>🔗</Text>
                      </TouchableOpacity>
                    )}
                  </React.Fragment>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary, marginTop: spacing.md }]}
              onPress={() => setShowSessionModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Swap Exercise Modal */}
      <Modal
        visible={showSwapModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSwapModal(false)}
      >
        <View style={styles.sessionModalOverlay}>
          <View style={[styles.sessionModalContent, { backgroundColor: colors.card, maxHeight: '80%' }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.sessionModalTitle, { color: colors.text }]}>
              Swap Exercise
            </Text>
            <Text style={[styles.swapSubtitle, { color: colors.textSecondary }]}>
              Replace: {swapExerciseIndex !== null ? workoutData[swapExerciseIndex]?.name : ''}
            </Text>
            <ScrollView style={styles.swapExerciseList} showsVerticalScrollIndicator={false}>
              {allExercises
                .filter(ex => !workoutData.some(w => w.exerciseId === ex.id))
                .slice(0, 50)
                .map((exercise) => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={[styles.swapExerciseRow, { backgroundColor: colors.background }]}
                    onPress={() => swapExercise(swapExerciseIndex, exercise)}
                  >
                    <Text style={[styles.swapExerciseName, { color: colors.text }]}>
                      {exercise.name}
                    </Text>
                    <Text style={[styles.swapExerciseMuscle, { color: colors.textSecondary }]}>
                      {exercise.primaryMuscles?.join(', ') || ''}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md }]}
              onPress={() => setShowSwapModal(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </View>
    </KeyboardAvoidingView>
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
    flexDirection: 'column',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  setLabel: {
    fontSize: fontSize.md,
    fontWeight: '500',
    marginBottom: spacing.xs,
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
  bandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  bandLabel: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  bandOptions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  bandOption: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  bandOptionText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
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
  navButtonSmall: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  navButtonTextSmall: {
    fontSize: fontSize.sm,
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
  notesInput: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: fontSize.sm,
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
  // Session Modal Styles
  sessionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sessionModalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sessionModalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  sessionExerciseList: {
    maxHeight: 400,
  },
  sessionExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  sessionExerciseInfo: {
    flex: 1,
  },
  sessionExerciseName: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  sessionExerciseSets: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  sessionExerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  setCountButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setCountButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  setCountDisplay: {
    fontSize: fontSize.md,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  // Swap Modal Styles
  swapSubtitle: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  swapExerciseList: {
    maxHeight: 350,
  },
  swapExerciseRow: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  swapExerciseName: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  swapExerciseMuscle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  addSetButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  addSetButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  // Superset styles
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  supersetBadge: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  linkSupersetButton: {
    paddingVertical: spacing.xs,
    marginVertical: spacing.xs,
    marginLeft: spacing.lg,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    paddingLeft: spacing.sm,
  },
  linkSupersetText: {
    fontSize: fontSize.xs,
  },
  supersetConnector: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: spacing.xs,
  },
  supersetConnectorText: {
    fontSize: fontSize.sm,
  },
  exerciseNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  supersetIndicator: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  supersetIndicatorText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  supersetPartners: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  supersetPartnersLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  supersetPartnersText: {
    fontSize: fontSize.xs,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseNameTouchable: {
    flex: 1,
  },
  supersetUnlinkButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginLeft: spacing.sm,
    borderWidth: 1,
  },
  supersetUnlinkIcon: {
    fontSize: fontSize.lg,
  },
});
