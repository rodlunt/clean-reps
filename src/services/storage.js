import AsyncStorage from '@react-native-async-storage/async-storage';

export const Storage = {
  get: async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Failed to get ${key}:`, error);
      return null;
    }
  },

  set: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set ${key}:`, error);
      return false;
    }
  },

  remove: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
      return false;
    }
  },

  clear: async () => {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  },

  getAllKeys: async () => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  },
};

// Storage keys constants
export const STORAGE_KEYS = {
  GYM_PROFILES: '@gym_profiles',
  ROUTINES: '@routines',
  WORKOUT_HISTORY: '@workout_history',
  PERSONAL_BESTS: '@personal_bests',
  SETTINGS: '@settings',
  CURRENT_ROUTINE: '@current_routine',
};
