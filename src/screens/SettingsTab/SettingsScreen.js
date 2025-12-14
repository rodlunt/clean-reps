import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../context/ThemeContext';
import { useGymProfile } from '../../context/GymProfileContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useSettings } from '../../context/SettingsContext';
import { spacing, fontSize, borderRadius } from '../../theme';
import { shadowsLight, shadowsDark } from '../../theme/colors';

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, themeMode, setTheme } = useTheme();
  const shadows = isDark ? shadowsDark : shadowsLight;
  const { gymProfiles, activeProfileId, setActiveProfile } = useGymProfile();
  const { routines, workoutHistory, personalBests } = useWorkout();
  const { units, toggleUnits } = useSettings();
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async () => {
    setIsExporting(true);
    try {
      const exportPayload = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
        data: {
          gymProfiles,
          routines,
          workoutHistory,
          personalBests,
          settings: {
            units,
            isDark,
            activeProfileId,
          },
        },
      };

      const fileName = `workout-data-${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(exportPayload, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Export Workout Data',
        });
      } else {
        Alert.alert('Export Complete', `Data saved to: ${filePath}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            MY GYMS
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('GymSetup')}>
            <Text style={[styles.addLink, { color: colors.primary }]}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {gymProfiles.length === 0 ? (
          <TouchableOpacity
            style={[styles.emptyGymCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
            onPress={() => navigation.navigate('GymSetup')}
          >
            <Text style={[styles.emptyGymText, { color: colors.textSecondary }]}>
              No gyms set up yet
            </Text>
            <Text style={[styles.emptyGymSubtext, { color: colors.primary }]}>
              Tap to add your first gym
            </Text>
          </TouchableOpacity>
        ) : (
          gymProfiles.map(profile => (
            <TouchableOpacity
              key={profile.id}
              style={[
                styles.gymCard,
                { backgroundColor: colors.card },
                shadows.sm,
                activeProfileId === profile.id && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => setActiveProfile(profile.id)}
              onLongPress={() => navigation.navigate('GymSetup', { profile })}
            >
              <View style={styles.gymInfo}>
                <Text style={[styles.gymName, { color: colors.text }]}>
                  {profile.name}
                </Text>
                <Text style={[styles.gymEquipment, { color: colors.textSecondary }]}>
                  {profile.equipment?.length || 0} equipment items
                </Text>
              </View>
              {activeProfileId === profile.id && (
                <Text style={[styles.activeLabel, { color: colors.primary }]}>Active</Text>
              )}
            </TouchableOpacity>
          ))
        )}
        {gymProfiles.length > 0 && (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Tap to select • Long press to edit
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          APPEARANCE
        </Text>
        <View style={[styles.themeSelector, { backgroundColor: colors.card }, shadows.sm]}>
          {[
            { key: 'light', label: 'Light' },
            { key: 'dark', label: 'Dark' },
            { key: 'system', label: 'System' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.themeOption,
                themeMode === option.key && { backgroundColor: colors.primary },
              ]}
              onPress={() => setTheme(option.key)}
            >
              <Text style={[
                styles.themeOptionText,
                { color: themeMode === option.key ? '#FFFFFF' : colors.text },
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          UNITS
        </Text>
        <TouchableOpacity
          style={[styles.settingRow, { backgroundColor: colors.card }, shadows.sm]}
          onPress={toggleUnits}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Weight Unit
          </Text>
          <View style={styles.unitToggle}>
            <Text style={[
              styles.unitOption,
              { color: units === 'kg' ? colors.primary : colors.textSecondary }
            ]}>
              kg
            </Text>
            <Text style={[styles.unitSeparator, { color: colors.textSecondary }]}>/</Text>
            <Text style={[
              styles.unitOption,
              { color: units === 'lbs' ? colors.primary : colors.textSecondary }
            ]}>
              lbs
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          DATA
        </Text>
        <TouchableOpacity
          style={[styles.settingRow, { backgroundColor: colors.card }, shadows.sm]}
          onPress={exportData}
          disabled={isExporting}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Export Data
          </Text>
          {isExporting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>
              {'>'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  addLink: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  settingLabel: {
    fontSize: fontSize.md,
  },
  settingValue: {
    fontSize: fontSize.md,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitOption: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  unitSeparator: {
    fontSize: fontSize.md,
    marginHorizontal: spacing.xs,
  },
  chevron: {
    fontSize: fontSize.lg,
  },
  emptyGymCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyGymText: {
    fontSize: fontSize.md,
  },
  emptyGymSubtext: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  gymCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  gymInfo: {
    flex: 1,
  },
  gymName: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  gymEquipment: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  activeLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  hint: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  themeSelector: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  themeOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  themeOptionText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
