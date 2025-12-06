import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { WorkoutProvider } from './src/context/WorkoutContext';
import { GymProfileProvider } from './src/context/GymProfileContext';
import TabNavigator from './src/navigation/TabNavigator';

function AppContent() {
  const { isDark, colors } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <TabNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <GymProfileProvider>
          <WorkoutProvider>
            <AppContent />
          </WorkoutProvider>
        </GymProfileProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
