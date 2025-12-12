import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { spacing, fontSize, borderRadius } from '../../theme';
import { shadowsLight, shadowsDark } from '../../theme/colors';
import { STARTER_ROUTINES } from '../../data/starterRoutines';

export default function RoutineListScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const shadows = isDark ? shadowsDark : shadowsLight;
  const { routines, addRoutine } = useWorkout();

  const useTemplate = async (template) => {
    const newRoutine = {
      ...template,
      id: Date.now().toString(),
      name: template.name,
    };
    await addRoutine(newRoutine);
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
            onPress={() => useTemplate(template)}
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
});
