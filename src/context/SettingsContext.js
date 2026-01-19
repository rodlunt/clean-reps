import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsContext = createContext();

const UNITS_STORAGE_KEY = '@settings_units';
const FILTER_BY_GYM_KEY = '@settings_filter_by_gym';
const TARGET_REP_MAX_KEY = '@settings_target_rep_max';
const WEIGHT_INCREMENT_KEY = '@settings_weight_increment';

/**
 * @summary Provides app-wide settings including units and exercise filtering preferences
 * @description Context provider that manages user preferences like weight units (kg/lbs)
 * and whether to filter exercises based on available gym equipment
 * @author rodlunt {@link https://github.com/rodlunt}
 * @since 1.0.0
 * @version 1.0.4
 * @class
 */
export function SettingsProvider({ children }) {
  const [units, setUnits] = useState('kg'); // 'kg' or 'lbs'
  const [filterByGymEquipment, setFilterByGymEquipment] = useState(true); // Filter exercises by gym equipment
  const [targetRepMax, setTargetRepMax] = useState(12); // Target rep range max for progression suggestions
  const [weightIncrement, setWeightIncrement] = useState(2.5); // Weight increment for progression (in kg)
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [savedUnits, savedFilter, savedRepMax, savedIncrement] = await Promise.all([
        AsyncStorage.getItem(UNITS_STORAGE_KEY),
        AsyncStorage.getItem(FILTER_BY_GYM_KEY),
        AsyncStorage.getItem(TARGET_REP_MAX_KEY),
        AsyncStorage.getItem(WEIGHT_INCREMENT_KEY),
      ]);
      if (savedUnits !== null) {
        setUnits(savedUnits);
      }
      if (savedFilter !== null) {
        setFilterByGymEquipment(savedFilter === 'true');
      }
      if (savedRepMax !== null) {
        setTargetRepMax(parseInt(savedRepMax, 10));
      }
      if (savedIncrement !== null) {
        setWeightIncrement(parseFloat(savedIncrement));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUnits = async () => {
    const newUnits = units === 'kg' ? 'lbs' : 'kg';
    setUnits(newUnits);
    try {
      await AsyncStorage.setItem(UNITS_STORAGE_KEY, newUnits);
    } catch (error) {
      console.error('Failed to save units preference:', error);
    }
  };

  /**
   * Toggle the filter by gym equipment setting
   * @returns {Promise<void>}
   */
  const toggleFilterByGymEquipment = async () => {
    const newValue = !filterByGymEquipment;
    setFilterByGymEquipment(newValue);
    try {
      await AsyncStorage.setItem(FILTER_BY_GYM_KEY, newValue.toString());
    } catch (error) {
      console.error('Failed to save filter preference:', error);
    }
  };

  /**
   * Update the target rep max for progression suggestions
   * @param {number} value - New target rep max
   * @returns {Promise<void>}
   */
  const updateTargetRepMax = async (value) => {
    setTargetRepMax(value);
    try {
      await AsyncStorage.setItem(TARGET_REP_MAX_KEY, value.toString());
    } catch (error) {
      console.error('Failed to save target rep max:', error);
    }
  };

  /**
   * Update the weight increment for progression suggestions
   * @param {number} value - New weight increment (in kg)
   * @returns {Promise<void>}
   */
  const updateWeightIncrement = async (value) => {
    setWeightIncrement(value);
    try {
      await AsyncStorage.setItem(WEIGHT_INCREMENT_KEY, value.toString());
    } catch (error) {
      console.error('Failed to save weight increment:', error);
    }
  };

  // Conversion helpers
  const kgToLbs = (kg) => Math.round(kg * 2.20462 * 10) / 10;
  const lbsToKg = (lbs) => Math.round(lbs / 2.20462 * 10) / 10;

  const formatWeight = (weightInKg) => {
    if (units === 'lbs') {
      return `${kgToLbs(weightInKg)} lbs`;
    }
    return `${weightInKg} kg`;
  };

  const displayWeight = (weightInKg) => {
    if (units === 'lbs') {
      return kgToLbs(weightInKg);
    }
    return weightInKg;
  };

  const toStorageWeight = (displayValue) => {
    // Convert display value back to kg for storage
    if (units === 'lbs') {
      return lbsToKg(displayValue);
    }
    return displayValue;
  };

  const value = {
    units,
    toggleUnits,
    filterByGymEquipment,
    toggleFilterByGymEquipment,
    targetRepMax,
    updateTargetRepMax,
    weightIncrement,
    updateWeightIncrement,
    formatWeight,
    displayWeight,
    toStorageWeight,
    kgToLbs,
    lbsToKg,
    isLoading,
  };

  if (isLoading) {
    return null;
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
