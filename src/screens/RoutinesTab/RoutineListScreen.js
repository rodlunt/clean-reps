import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useGymProfile } from '../../context/GymProfileContext';
import { useExercises } from '../../context/ExerciseContext';
import { useSettings } from '../../context/SettingsContext';
import { spacing, fontSize, borderRadius } from '../../theme';
import { shadowsLight, shadowsDark } from '../../theme/colors';
import { STARTER_ROUTINES } from '../../data/starterRoutines';

/**
 * @summary Screen for managing workout routines and starter templates
 * @description Displays user's custom routines and starter templates.
 * When adding a template, prompts for gym selection and auto-swaps
 * exercises based on available equipment.
 * @author rodlunt {@link https://github.com/rodlunt}
 * @since 1.0.0
 * @version 1.0.4
 * @class
 */
export default function RoutineListScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const shadows = isDark ? shadowsDark : shadowsLight;
  const { routines, addRoutine } = useWorkout();
  const { gymProfiles, activeProfileId } = useGymProfile();
  const { exercises, getExerciseById } = useExercises();
  const { filterByGymEquipment } = useSettings();

  const [showGymModal, setShowGymModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [swappedExercises, setSwappedExercises] = useState([]);

  /**
   * Find an alternative exercise with the same primary muscle that works with available equipment
   * @param {Object} exercise - The original exercise
   * @param {Array} availableEquipment - List of available equipment IDs
   * @returns {Object|null} - Alternative exercise or null if none found
   */
  const findAlternativeExercise = (exercise, availableEquipment) => {
    if (!exercise || !availableEquipment || availableEquipment.length === 0) return null;

    const primaryMuscle = exercise.primaryMuscles?.[0];
    if (!primaryMuscle) return null;

    // Find exercises that target the same primary muscle and work with available equipment
    const alternatives = exercises.filter(ex => {
      if (ex.id === exercise.id) return false; // Skip the same exercise
      if (!ex.primaryMuscles?.includes(primaryMuscle)) return false; // Must target same muscle
      // Check if all required equipment is available (or bodyweight)
      return ex.equipment.every(eq => availableEquipment.includes(eq) || eq === 'bodyweight');
    });

    // Prefer exercises with the same category (compound/isolation)
    const sameCategoryAlternatives = alternatives.filter(ex => ex.category === exercise.category);

    return sameCategoryAlternatives.length > 0 ? sameCategoryAlternatives[0] : alternatives[0] || null;
  };

  /**
   * Check if an exercise is available with the given equipment
   * @param {Object} exercise - The exercise to check
   * @param {Array} availableEquipment - List of available equipment IDs
   * @returns {boolean}
   */
  const isExerciseAvailable = (exercise, availableEquipment) => {
    if (!exercise || !availableEquipment || availableEquipment.length === 0) return true;
    return exercise.equipment.every(eq => availableEquipment.includes(eq) || eq === 'bodyweight');
  };

  /**
   * Process a template and swap out exercises that don't match gym equipment
   * @param {Object} template - The starter template
   * @param {Object} gymProfile - The selected gym profile
   * @returns {Object} - Processed template with swapped exercises
   */
  const processTemplateWithGym = (template, gymProfile) => {
    const availableEquipment = gymProfile?.equipment || [];
    const swaps = [];

    const processedDays = template.days.map(day => ({
      ...day,
      exercises: day.exercises.map(ex => {
        const fullExercise = getExerciseById(ex.exerciseId);
        if (!fullExercise || isExerciseAvailable(fullExercise, availableEquipment)) {
          return ex;
        }

        // Find alternative
        const alternative = findAlternativeExercise(fullExercise, availableEquipment);
        if (alternative) {
          swaps.push({
            original: ex.name,
            replacement: alternative.name,
            day: day.name,
          });
          return {
            ...ex,
            exerciseId: alternative.id,
            name: alternative.name,
          };
        }

        // No alternative found, keep original but mark for removal
        swaps.push({
          original: ex.name,
          replacement: null,
          day: day.name,
        });
        return null;
      }).filter(Boolean), // Remove exercises that couldn't be swapped
    }));

    return { processedDays, swaps };
  };

  /**
   * Handle template selection - shows gym modal if filtering enabled
   * @param {Object} template - The selected template
   */
  const handleTemplatePress = (template) => {
    if (filterByGymEquipment && gymProfiles.length > 0) {
      setSelectedTemplate(template);
      setShowGymModal(true);
    } else if (filterByGymEquipment && gymProfiles.length === 0) {
      // No gyms set up but filtering enabled - prompt to create one
      Alert.alert(
        'Gym Required',
        'To filter exercises by equipment, please set up a gym profile first.',
        [
          { text: 'Set Up Gym', onPress: () => navigation.navigate('Settings', { screen: 'GymSetup' }) },
          { text: 'Add Without Filter', onPress: () => useTemplate(template, null) },
        ]
      );
    } else {
      // Filtering disabled - just add the template
      useTemplate(template, null);
    }
  };

  /**
   * Add template with gym profile (handles swapping)
   * @param {Object} template - The template to add
   * @param {Object} gymProfile - The gym profile to use (or null)
   */
  const useTemplate = async (template, gymProfile) => {
    let finalDays = template.days;
    let swaps = [];

    if (gymProfile) {
      const result = processTemplateWithGym(template, gymProfile);
      finalDays = result.processedDays;
      swaps = result.swaps;
    }

    const newRoutine = {
      ...template,
      id: Date.now().toString(),
      name: template.name,
      gymProfileId: gymProfile?.id || null,
      days: finalDays,
    };

    await addRoutine(newRoutine);
    setShowGymModal(false);
    setSelectedTemplate(null);

    // Show swap summary if exercises were changed
    if (swaps.length > 0) {
      const swapMessages = swaps.map(s =>
        s.replacement
          ? `${s.original} -> ${s.replacement}`
          : `${s.original} (removed - no alternative)`
      ).join('\n');

      Alert.alert(
        'Exercises Adjusted',
        `Some exercises were swapped for your gym equipment:\n\n${swapMessages}`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Routines</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateRoutine')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {routines.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              MY ROUTINES
            </Text>
            {routines.map(routine => (
              <TouchableOpacity
                key={routine.id}
                style={[styles.routineCard, { backgroundColor: colors.card }, shadows.sm]}
                onPress={() => navigation.navigate('CreateRoutine', { editRoutine: routine })}
              >
                <Text style={[styles.routineName, { color: colors.text }]}>
                  {routine.name}
                </Text>
                <Text style={[styles.routineInfo, { color: colors.textSecondary }]}>
                  {routine.days.length} day{routine.days.length !== 1 ? 's' : ''} • Tap to edit
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: routines.length > 0 ? spacing.lg : 0 }]}>
          STARTER TEMPLATES
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Tap to add to your routines
        </Text>
        {STARTER_ROUTINES.map(template => (
          <TouchableOpacity
            key={template.id}
            style={[styles.templateCard, { backgroundColor: colors.card, borderColor: colors.primary }, shadows.sm]}
            onPress={() => handleTemplatePress(template)}
          >
            <View style={styles.templateHeader}>
              <Text style={[styles.routineName, { color: colors.text }]}>
                {template.name}
              </Text>
              <Text style={[styles.useButton, { color: colors.primary }]}>+ Add</Text>
            </View>
            <Text style={[styles.templateDesc, { color: colors.textSecondary }]}>
              {template.description}
            </Text>
            <Text style={[styles.routineInfo, { color: colors.textSecondary }]}>
              {template.days.length} day{template.days.length !== 1 ? 's' : ''} • {template.days.reduce((sum, d) => sum + d.exercises.length, 0)} exercises
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Gym Selection Modal */}
      <Modal
        visible={showGymModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGymModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Gym for {selectedTemplate?.name}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Exercises will be adjusted based on available equipment
            </Text>

            <ScrollView style={styles.gymList}>
              {gymProfiles.map(gym => (
                <TouchableOpacity
                  key={gym.id}
                  style={[
                    styles.gymOption,
                    { backgroundColor: colors.background },
                    activeProfileId === gym.id && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                  onPress={() => useTemplate(selectedTemplate, gym)}
                >
                  <Text style={[styles.gymOptionName, { color: colors.text }]}>
                    {gym.name}
                  </Text>
                  <Text style={[styles.gymOptionEquipment, { color: colors.textSecondary }]}>
                    {gym.equipment?.length || 0} equipment items
                  </Text>
                  {activeProfileId === gym.id && (
                    <Text style={[styles.activeGymLabel, { color: colors.primary }]}>Active</Text>
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.gymOption, styles.allEquipmentOption, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => useTemplate(selectedTemplate, null)}
              >
                <Text style={[styles.gymOptionName, { color: colors.text }]}>
                  All Equipment
                </Text>
                <Text style={[styles.gymOptionEquipment, { color: colors.textSecondary }]}>
                  Add without filtering exercises
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.border }]}
              onPress={() => {
                setShowGymModal(false);
                setSelectedTemplate(null);
              }}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  routineCard: {
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  templateCard: {
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateDesc: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  useButton: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  routineName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  routineInfo: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  gymList: {
    maxHeight: 300,
  },
  gymOption: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  allEquipmentOption: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  gymOptionName: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  gymOptionEquipment: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  activeGymLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
  },
  cancelButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
