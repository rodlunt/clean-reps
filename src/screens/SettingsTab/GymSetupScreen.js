import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useGymProfile } from '../../context/GymProfileContext';
import { spacing, fontSize, borderRadius } from '../../theme';
import { COMMON_EQUIPMENT } from '../../data/starterRoutines';
import Button from '../../components/common/Button';

export default function GymSetupScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { addProfile, updateProfile, deleteProfile, gymProfiles } = useGymProfile();
  const editingProfile = route.params?.profile;

  const [gymName, setGymName] = useState(editingProfile?.name || '');
  const [selectedEquipment, setSelectedEquipment] = useState(
    editingProfile?.equipment || []
  );

  const toggleEquipment = (equipmentId) => {
    setSelectedEquipment(prev =>
      prev.includes(equipmentId)
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const selectAll = () => {
    setSelectedEquipment(COMMON_EQUIPMENT.map(e => e.id));
  };

  const selectNone = () => {
    setSelectedEquipment([]);
  };

  const handleSave = async () => {
    if (!gymName.trim()) {
      Alert.alert('Missing Name', 'Please enter a gym name.');
      return;
    }

    try {
      const profileData = {
        name: gymName.trim(),
        equipment: selectedEquipment,
      };

      if (editingProfile) {
        await updateProfile(editingProfile.id, profileData);
      } else {
        await addProfile(profileData);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save gym profile. Please try again.');
      console.error('Save gym error:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Gym',
      `Are you sure you want to delete "${editingProfile?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfile(editingProfile.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete gym profile. Please try again.');
              console.error('Delete gym error:', error);
            }
          },
        },
      ]
    );
  };

  const groupedEquipment = COMMON_EQUIPMENT.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const categoryLabels = {
    free_weights: 'Free Weights',
    benches: 'Benches',
    racks: 'Racks',
    machines: 'Machines',
    bodyweight: 'Bodyweight',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelText, { color: colors.error }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {editingProfile ? 'Edit Gym' : 'Add Gym'}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Text style={[styles.label, { color: colors.textSecondary }]}>Gym Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder="e.g., Home Gym, Planet Fitness"
          placeholderTextColor={colors.placeholder}
          value={gymName}
          onChangeText={setGymName}
        />

        <View style={styles.equipmentHeader}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Available Equipment</Text>
          <View style={styles.selectButtons}>
            <TouchableOpacity onPress={selectAll}>
              <Text style={[styles.selectButton, { color: colors.primary }]}>All</Text>
            </TouchableOpacity>
            <Text style={[styles.selectDivider, { color: colors.textSecondary }]}> | </Text>
            <TouchableOpacity onPress={selectNone}>
              <Text style={[styles.selectButton, { color: colors.primary }]}>None</Text>
            </TouchableOpacity>
          </View>
        </View>

        {Object.entries(groupedEquipment).map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, { color: colors.text }]}>
              {categoryLabels[category]}
            </Text>
            <View style={styles.equipmentGrid}>
              {items.map(equipment => (
                <TouchableOpacity
                  key={equipment.id}
                  style={[
                    styles.equipmentItem,
                    {
                      backgroundColor: selectedEquipment.includes(equipment.id)
                        ? colors.primary
                        : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => toggleEquipment(equipment.id)}
                >
                  <Text
                    style={[
                      styles.equipmentText,
                      {
                        color: selectedEquipment.includes(equipment.id)
                          ? '#FFFFFF'
                          : colors.text,
                      },
                    ]}
                  >
                    {equipment.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {editingProfile && (
          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: colors.error }]}
            onPress={handleDelete}
          >
            <Text style={[styles.deleteButtonText, { color: colors.error }]}>
              Delete Gym
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.spacer} />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    fontWeight: '500',
  },
  input: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  selectButtons: {
    flexDirection: 'row',
  },
  selectButton: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  selectDivider: {
    fontSize: fontSize.sm,
  },
  categorySection: {
    marginBottom: spacing.lg,
  },
  categoryTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  equipmentItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  equipmentText: {
    fontSize: fontSize.sm,
  },
  spacer: {
    height: 100,
  },
  deleteButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  deleteButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
