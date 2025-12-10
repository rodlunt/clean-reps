import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = '@settings_theme';

// Theme modes: 'light', 'dark', 'system'
export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', or 'system'
  const [isLoading, setIsLoading] = useState(true);

  // Compute actual dark/light based on mode and system preference
  const isDark = themeMode === 'system'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        // Handle legacy values ('dark'/'light' without 'system')
        if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system') {
          setThemeMode(savedTheme);
        }
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (mode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Legacy toggle for backwards compatibility
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const theme = {
    isDark,
    themeMode,
    colors: isDark ? colors.dark : colors.light,
    toggleTheme,
    setTheme,
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
