import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';

const TEAL = '#14B8A6';

import { ThemeProvider } from './src/context/ThemeContext';
import { WorkoutProvider } from './src/context/WorkoutContext';
import { GymProfileProvider } from './src/context/GymProfileContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { ExerciseProvider } from './src/context/ExerciseContext';
import TabNavigator from './src/navigation/TabNavigator';
import AnimatedSplashScreen from './src/components/AnimatedSplashScreen';

// Hide native splash immediately - we use our own animated splash
SplashScreen.hideAsync();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Set up Android navigation bar to auto-hide (sticky immersive mode)
  useEffect(() => {
    const setupNavigationBar = async () => {
      if (Platform.OS === 'android' && !showSplash) {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('overlay-swipe');
          await NavigationBar.setBackgroundColorAsync('#000000');
        } catch (error) {
          // Silently fail if navigation bar API not available
        }
      }
    };
    setupNavigationBar();
  }, [showSplash]);

  // Show animated splash
  if (showSplash) {
    return <AnimatedSplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return (
    <View style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SettingsProvider>
            <ExerciseProvider>
              <GymProfileProvider>
                <WorkoutProvider>
                  <NavigationContainer>
                    <StatusBar style="light" />
                    <TabNavigator />
                  </NavigationContainer>
                </WorkoutProvider>
              </GymProfileProvider>
            </ExerciseProvider>
          </SettingsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TEAL,
  },
});
