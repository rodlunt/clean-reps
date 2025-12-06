import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, fontSize, borderRadius } from '../../theme';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          APPEARANCE
        </Text>
        <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Dark Mode
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          UNITS
        </Text>
        <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Weight Unit
          </Text>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            kg
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          DATA
        </Text>
        <TouchableOpacity style={[styles.settingRow, { backgroundColor: colors.card }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Manage Gym Profiles
          </Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>
            {'>'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingRow, { backgroundColor: colors.card }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Export Data
          </Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>
            {'>'}
          </Text>
        </TouchableOpacity>
      </View>
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
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
  chevron: {
    fontSize: fontSize.lg,
  },
});
