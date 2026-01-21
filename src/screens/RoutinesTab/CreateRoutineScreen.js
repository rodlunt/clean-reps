import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, FlatList, Switch, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useExercises } from '../../context/ExerciseContext';
import { useGymProfile } from '../../context/GymProfileContext';
import { spacing, fontSize, borderRadius } from '../../theme';
import { shadowsLight, shadowsDark } from '../../theme/colors';

// Check if exercise is bodyweight-based
const isBodyweightExercise = (exercise) => {
  if (!exercise || !exercise.equipment) return false;
  const bwEquipment = ['body weight', 'bodyweight', 'body only'];
  return exercise.equipment.some(eq => bwEquipment.includes(eq.toLowerCase()));
};

export default function CreateRoutineScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const shadows = isDark ? shadowsDark : shadowsLight;
  const { addRoutine, updateRoutine, deleteRoutine, routines } = useWorkout();
  const { muscleGroups, filterExercises } = useExercises();
  const { gymProfiles, activeProfileId } = useGymProfile();

  const editRoutine = route.params?.editRoutine;
  const isEditing = !!editRoutine;

  const [routineName, setRoutineName] = useState(editRoutine?.name || '');
  const [selectedGymId, setSelectedGymId] = useState(editRoutine?.gymProfileId || activeProfileId || null);
  const [nextSupersetId, setNextSupersetId] = useState(1);
  const [days, setDays] = useState(
    editRoutine?.days?.map(d => ({
      id: d.id,
      name: d.name,
      exercises: d.exercises.map(ex => ({
        id: ex.id || Date.now().toString() + Math.random(),
        exerciseId: ex.exerciseId,
        name: ex.name,
        sets: ex.sets || 3,
        isBodyweight: ex.useBodyweight,
        useBodyweight: ex.useBodyweight || false,
        supersetGroup: ex.supersetGroup || null,
      })),
    })) || [{ id: '1', name: '', exercises: [] }]
  );

  // Exercise picker state
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [activeDayId, setActiveDayId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState(null);

  /**
   * Handle drag end to reorder exercises
   * @param {string} dayId - Day containing the exercises
   * @param {Object} param1 - Drag end params with reordered data
   */
  const onDragEnd = useCallback((dayId, { data }) => {
    setDays(prevDays => prevDays.map(d =>
      d.id === dayId ? { ...d, exercises: data } : d
    ));
  }, []);

  // Get equipment from selected gym profile
  const selectedGym = gymProfiles.find(g => g.id === selectedGymId);
  const availableEquipment = selectedGym?.equipment || [];

  // Filter exercises based on search, muscle, and equipment
  const filteredExercises = useMemo(() => {
    let filtered = filterExercises({
      query: searchQuery,
      muscle: selectedMuscle,
    });

    // Filter by gym equipment if a gym is selected
    if (availableEquipment.length > 0) {
      filtered = filtered.filter(ex =>
        ex.equipment.every(eq => availableEquipment.includes(eq) || eq === 'bodyweight')
      );
    }

    return filtered;
  }, [searchQuery, selectedMuscle, availableEquipment, filterExercises]);

  const addDay = () => {
    setDays([...days, { id: Date.now().toString(), name: '', exercises: [] }]);
  };

  const updateDayName = (dayId, name) => {
    setDays(days.map(d => (d.id === dayId ? { ...d, name } : d)));
  };

  const removeDay = (dayId) => {
    if (days.length > 1) {
      setDays(days.filter(d => d.id !== dayId));
    }
  };

  const openExercisePicker = (dayId) => {
    setActiveDayId(dayId);
    setSearchQuery('');
    setSelectedMuscle(null);
    setShowExercisePicker(true);
  };

  const selectExercise = (exercise) => {
    const isBW = isBodyweightExercise(exercise);
    setDays(days.map(d => {
      if (d.id === activeDayId) {
        // Check if exercise already exists
        if (d.exercises.some(ex => ex.exerciseId === exercise.id)) {
          return d;
        }
        return {
          ...d,
          exercises: [...d.exercises, {
            id: Date.now().toString(),
            exerciseId: exercise.id,
            name: exercise.name,
            sets: 3,
            isBodyweight: isBW,
            useBodyweight: isBW, // Default to bodyweight-only for BW exercises
          }],
        };
      }
      return d;
    }));
    setShowExercisePicker(false);
  };

  const toggleBodyweight = (dayId, exerciseId) => {
    setDays(days.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          exercises: d.exercises.map(ex =>
            ex.id === exerciseId ? { ...ex, useBodyweight: !ex.useBodyweight } : ex
          ),
        };
      }
      return d;
    }));
  };

  const updateExerciseSets = (dayId, exerciseId, sets) => {
    setDays(days.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          exercises: d.exercises.map(ex =>
            ex.id === exerciseId ? { ...ex, sets: parseInt(sets) || 3 } : ex
          ),
        };
      }
      return d;
    }));
  };

  const removeExercise = (dayId, exerciseId) => {
    setDays(days.map(d => {
      if (d.id === dayId) {
        const exerciseToRemove = d.exercises.find(ex => ex.id === exerciseId);
        const groupId = exerciseToRemove?.supersetGroup;

        // Get exercises without the removed one
        let newExercises = d.exercises.filter(ex => ex.id !== exerciseId);

        // If the removed exercise was in a superset, check if only one remains
        if (groupId !== null) {
          const remainingInGroup = newExercises.filter(ex => ex.supersetGroup === groupId);
          if (remainingInGroup.length === 1) {
            // Only one left, remove it from superset
            newExercises = newExercises.map(ex =>
              ex.supersetGroup === groupId ? { ...ex, supersetGroup: null } : ex
            );
          }
        }

        return { ...d, exercises: newExercises };
      }
      return d;
    }));
  };

  /**
   * Link two adjacent exercises as a superset
   * @param {string} dayId - Day containing the exercises
   * @param {number} exerciseIndex - Index of first exercise to link
   */
  const linkSuperset = (dayId, exerciseIndex) => {
    setDays(days.map(d => {
      if (d.id === dayId && exerciseIndex < d.exercises.length - 1) {
        const newExercises = [...d.exercises];
        const first = newExercises[exerciseIndex];
        const second = newExercises[exerciseIndex + 1];

        let groupId;
        if (first.supersetGroup !== null) {
          groupId = first.supersetGroup;
        } else if (second.supersetGroup !== null) {
          groupId = second.supersetGroup;
        } else {
          groupId = nextSupersetId;
          setNextSupersetId(prev => prev + 1);
        }

        newExercises[exerciseIndex] = { ...first, supersetGroup: groupId };
        newExercises[exerciseIndex + 1] = { ...second, supersetGroup: groupId };

        return { ...d, exercises: newExercises };
      }
      return d;
    }));
  };


  /**
   * Unlink an exercise from its superset
   * @param {string} dayId - Day containing the exercise
   * @param {string} exerciseId - Exercise to unlink
   */
  const unlinkSuperset = (dayId, exerciseId) => {
    setDays(days.map(d => {
      if (d.id === dayId) {
        const exercise = d.exercises.find(ex => ex.id === exerciseId);
        if (!exercise || exercise.supersetGroup === null) return d;

        const groupId = exercise.supersetGroup;
        let newExercises = d.exercises.map(ex =>
          ex.id === exerciseId ? { ...ex, supersetGroup: null } : ex
        );

        // Check if only one remains in the superset
        const remainingInGroup = newExercises.filter(ex => ex.supersetGroup === groupId);
        if (remainingInGroup.length === 1) {
          newExercises = newExercises.map(ex =>
            ex.supersetGroup === groupId ? { ...ex, supersetGroup: null } : ex
          );
        }

        return { ...d, exercises: newExercises };
      }
      return d;
    }));
  };

  const handleSave = async () => {
    if (!routineName.trim()) {
      Alert.alert('Missing Name', 'Please enter a routine name.');
      return;
    }

    // Check for duplicate routine names
    const trimmedName = routineName.trim().toLowerCase();
    const duplicateExists = routines.some(r =>
      r.name.toLowerCase() === trimmedName &&
      (!isEditing || r.id !== editRoutine.id)
    );

    if (duplicateExists) {
      Alert.alert(
        'Duplicate Name',
        'A routine with this name already exists. Please choose a different name.'
      );
      return;
    }

    try {
      const routine = {
        id: isEditing ? editRoutine.id : Date.now().toString(),
        name: routineName.trim(),
        gymProfileId: selectedGymId,
        days: days.map(d => ({
          id: d.id,
          name: d.name.trim() || `Day ${days.indexOf(d) + 1}`,
          exercises: d.exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            name: ex.name,
            sets: ex.sets,
            useBodyweight: ex.useBodyweight || false,
            supersetGroup: ex.supersetGroup,
          })),
        })),
      };

      if (isEditing) {
        await updateRoutine(editRoutine.id, routine);
      } else {
        await addRoutine(routine);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save routine. Please try again.');
      console.error('Save routine error:', error);
    }
  };

  const handleDelete = async () => {
    if (editRoutine) {
      try {
        await deleteRoutine(editRoutine.id);
        navigation.goBack();
      } catch (error) {
        Alert.alert('Error', 'Failed to delete routine. Please try again.');
        console.error('Delete routine error:', error);
      }
    }
  };

  const renderExerciseItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.exercisePickerItem, { borderBottomColor: colors.border }]}
      onPress={() => selectExercise(item)}
    >
      <View style={styles.exercisePickerInfo}>
        <Text style={[styles.exercisePickerName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.exercisePickerMuscle, { color: colors.textSecondary }]}>
          {item.primaryMuscles.join(', ')}
        </Text>
      </View>
      <Text style={[styles.exercisePickerDifficulty, { color: colors.primary }]}>
        {item.difficulty}
      </Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelText, { color: colors.error }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{isEditing ? 'Edit Routine' : 'New Routine'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Routine Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder="e.g., Push Pull Legs"
          placeholderTextColor={colors.placeholder}
          value={routineName}
          onChangeText={setRoutineName}
        />

        {gymProfiles.length > 0 && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Gym Profile (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gymPicker}>
              <TouchableOpacity
                style={[
                  styles.gymChip,
                  { backgroundColor: !selectedGymId ? colors.primary : colors.card },
                ]}
                onPress={() => setSelectedGymId(null)}
              >
                <Text style={[
                  styles.gymChipText,
                  { color: !selectedGymId ? '#FFFFFF' : colors.text },
                ]}>
                  All Equipment
                </Text>
              </TouchableOpacity>
              {gymProfiles.map(gym => (
                <TouchableOpacity
                  key={gym.id}
                  style={[
                    styles.gymChip,
                    { backgroundColor: selectedGymId === gym.id ? colors.primary : colors.card },
                  ]}
                  onPress={() => setSelectedGymId(gym.id)}
                >
                  <Text style={[
                    styles.gymChipText,
                    { color: selectedGymId === gym.id ? '#FFFFFF' : colors.text },
                  ]}>
                    {gym.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {days.map((day, dayIndex) => (
          <View key={day.id} style={[styles.dayCard, { backgroundColor: colors.card }, shadows.sm]}>
            <View style={styles.dayHeader}>
              <TextInput
                style={[styles.dayInput, { color: colors.text }]}
                placeholder={`Day ${dayIndex + 1}`}
                placeholderTextColor={colors.placeholder}
                value={day.name}
                onChangeText={(text) => updateDayName(day.id, text)}
              />
              {days.length > 1 && (
                <TouchableOpacity onPress={() => removeDay(day.id)}>
                  <Text style={[styles.removeText, { color: colors.error }]}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <DraggableFlatList
              data={day.exercises}
              keyExtractor={(item) => item.id}
              onDragEnd={(params) => onDragEnd(day.id, params)}
              scrollEnabled={false}
              renderItem={({ item: exercise, drag, isActive, getIndex }) => {
                const exerciseIndex = getIndex();
                const isInSuperset = exercise.supersetGroup !== null;
                const nextExercise = day.exercises[exerciseIndex + 1];
                const canLinkNext = exerciseIndex < day.exercises.length - 1;
                const isLinkedToNext = canLinkNext && nextExercise?.supersetGroup !== null &&
                  nextExercise.supersetGroup === exercise.supersetGroup;

                return (
                  <ScaleDecorator>
                    <View>
                      <TouchableOpacity
                        onLongPress={drag}
                        disabled={isActive}
                        delayLongPress={150}
                        style={[
                          styles.exerciseCard,
                          { backgroundColor: colors.background },
                          shadows.sm,
                          isInSuperset && styles.exerciseCardSuperset,
                          isActive && styles.exerciseCardDragging
                        ]}
                      >
                        {isInSuperset && (
                          <View style={styles.supersetHighlight} />
                        )}
                        <View style={styles.exerciseCardContent}>
                          <View style={styles.dragHandle}>
                            <Text style={[styles.dragHandleText, { color: colors.textSecondary }]}>☰</Text>
                          </View>
                          <View style={styles.exerciseInfo}>
                            <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
                              {exercise.name}
                            </Text>
                            {exercise.isBodyweight && (
                              <View style={styles.bodyweightToggle}>
                                <Text style={[styles.bodyweightLabel, { color: colors.textSecondary }]}>
                                  {exercise.useBodyweight ? 'BW only' : '+Weight'}
                                </Text>
                                <Switch
                                  value={!exercise.useBodyweight}
                                  onValueChange={() => toggleBodyweight(day.id, exercise.id)}
                                  trackColor={{ false: colors.border, true: colors.primary + '60' }}
                                  thumbColor={exercise.useBodyweight ? colors.card : colors.primary}
                                  style={styles.switch}
                                />
                              </View>
                            )}
                          </View>
                          <View style={styles.setsContainer}>
                            <TextInput
                              style={[styles.setsInput, { backgroundColor: colors.card, color: colors.text }]}
                              keyboardType="numeric"
                              value={exercise.sets.toString()}
                              onChangeText={(text) => updateExerciseSets(day.id, exercise.id, text)}
                            />
                            <Text style={[styles.setsLabel, { color: colors.textSecondary }]}>sets</Text>
                          </View>
                          <TouchableOpacity onPress={() => removeExercise(day.id, exercise.id)}>
                            <Text style={[styles.removeExText, { color: colors.error }]}>X</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                      {canLinkNext && !isLinkedToNext && (
                        <TouchableOpacity
                          style={styles.linkSupersetButton}
                          onPress={() => linkSuperset(day.id, exerciseIndex)}
                        >
                          <Text style={[styles.linkSupersetIcon, { color: colors.textSecondary }]}>🔗</Text>
                        </TouchableOpacity>
                      )}
                      {isLinkedToNext && (
                        <TouchableOpacity
                          style={styles.supersetConnector}
                          onPress={() => unlinkSuperset(day.id, exercise.id)}
                        >
                          <Text style={[styles.supersetConnectorText, { color: colors.textSecondary }]}>🔗</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </ScaleDecorator>
                );
              }}
            />

            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={() => openExercisePicker(day.id)}
            >
              <Text style={[styles.addExerciseText, { color: colors.primary }]}>+ Add Exercise</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.addDayButton, { borderColor: colors.primary }]}
          onPress={addDay}
        >
          <Text style={[styles.addDayText, { color: colors.primary }]}>+ Add Day</Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: colors.error }]}
            onPress={handleDelete}
          >
            <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete Routine</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal
        visible={showExercisePicker}
        animationType="slide"
        onRequestClose={() => setShowExercisePicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
              <Text style={[styles.modalCancel, { color: colors.error }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Exercise</Text>
            <View style={{ width: 50 }} />
          </View>

          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Search exercises..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.muscleFilter}
            contentContainerStyle={styles.muscleFilterContent}
          >
            <TouchableOpacity
              style={[
                styles.muscleChip,
                { backgroundColor: !selectedMuscle ? colors.primary : colors.card },
              ]}
              onPress={() => setSelectedMuscle(null)}
            >
              <Text style={[
                styles.muscleChipText,
                { color: !selectedMuscle ? '#FFFFFF' : colors.text },
              ]}>
                All
              </Text>
            </TouchableOpacity>
            {muscleGroups.map(muscle => (
              <TouchableOpacity
                key={muscle}
                style={[
                  styles.muscleChip,
                  { backgroundColor: selectedMuscle === muscle ? colors.primary : colors.card },
                ]}
                onPress={() => setSelectedMuscle(muscle)}
              >
                <Text style={[
                  styles.muscleChipText,
                  { color: selectedMuscle === muscle ? '#FFFFFF' : colors.text },
                ]}>
                  {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            renderItem={renderExerciseItem}
            style={styles.exerciseList}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No exercises found
              </Text>
            }
          />
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl + spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: fontSize.md,
  },
  saveText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  input: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  gymPicker: {
    marginBottom: spacing.lg,
  },
  gymChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  gymChipText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  dayCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dayInput: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    flex: 1,
  },
  removeText: {
    fontSize: fontSize.sm,
  },
  exerciseCard: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  exerciseCardSuperset: {
    // Container for superset highlight
  },
  exerciseCardDragging: {
    opacity: 0.9,
    transform: [{ scale: 1.02 }],
    zIndex: 999,
  },
  supersetHighlight: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#D97706',
    borderTopLeftRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
  },
  exerciseCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingLeft: spacing.sm,
  },
  dragHandle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  dragHandleText: {
    fontSize: fontSize.lg,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  bodyweightToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bodyweightLabel: {
    fontSize: fontSize.xs,
    marginRight: spacing.xs,
  },
  switch: {
    transform: [{ scale: 0.7 }],
    marginLeft: -8,
  },
  setsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  setsInput: {
    width: 40,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    textAlign: 'center',
    fontSize: fontSize.md,
  },
  setsLabel: {
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  removeExText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    padding: spacing.xs,
  },
  addExerciseButton: {
    paddingVertical: spacing.sm,
  },
  addExerciseText: {
    fontSize: fontSize.md,
  },
  addDayButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  addDayText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  deleteButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  deleteButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl + spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  modalCancel: {
    fontSize: fontSize.md,
  },
  searchInput: {
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: fontSize.md,
  },
  muscleFilter: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    maxHeight: 44,
  },
  muscleFilterContent: {
    paddingRight: spacing.xl,
  },
  muscleChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
  },
  muscleChipText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  exercisePickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  exercisePickerInfo: {
    flex: 1,
  },
  exercisePickerName: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  exercisePickerMuscle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  exercisePickerDifficulty: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.xl,
    fontSize: fontSize.md,
  },
  // Superset styles
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  supersetBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  supersetBadgeText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  unlinkButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  unlinkButtonText: {
    fontSize: fontSize.md,
  },
  linkSupersetButton: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  linkSupersetIcon: {
    fontSize: fontSize.lg,
    opacity: 0.4,
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
});
