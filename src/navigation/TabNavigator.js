import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

import { HomeScreen } from '../screens/WorkoutTab';
import { RoutineListScreen } from '../screens/RoutinesTab';
import { ProgressScreen } from '../screens/ProgressTab';
import { SettingsScreen } from '../screens/SettingsTab';

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

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
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
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="Workout" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Routines"
        component={RoutineListScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="Routines" focused={focused} color={color} />
          ),
        }}
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
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="Settings" focused={focused} color={color} />
          ),
        }}
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
