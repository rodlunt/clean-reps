import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

import WorkoutStack from './WorkoutStack';
import RoutinesStack from './RoutinesStack';
import SettingsStack from './SettingsStack';
import { ProgressScreen } from '../screens/ProgressTab';

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused, color }) {
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.iconText, { color }]}>{name[0]}</Text>
    </View>
  );
}

export default function TabNavigator() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 8) + 4,
          height: 56 + Math.max(insets.bottom, 8) + 4,
          marginBottom: 2,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Workout"
        component={WorkoutStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="Workout" focused={focused} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Workout', { screen: 'WorkoutHome' });
          },
        })}
      />
      <Tab.Screen
        name="Routines"
        component={RoutinesStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="Routines" focused={focused} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Routines', { screen: 'RoutineList' });
          },
        })}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="Progress" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="Settings" focused={focused} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior
            e.preventDefault();
            // Reset to SettingsHome when tab is pressed
            navigation.navigate('Settings', {
              screen: 'SettingsHome',
            });
          },
        })}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
