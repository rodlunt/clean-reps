import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GymProfileContext = createContext();

const GYM_PROFILES_KEY = '@gym_profiles';
const ACTIVE_PROFILE_KEY = '@active_gym_profile';

export function GymProfileProvider({ children }) {
  const [gymProfiles, setGymProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profilesData, activeData] = await Promise.all([
        AsyncStorage.getItem(GYM_PROFILES_KEY),
        AsyncStorage.getItem(ACTIVE_PROFILE_KEY),
      ]);

      if (profilesData) {
        setGymProfiles(JSON.parse(profilesData));
      }
      if (activeData) {
        setActiveProfileId(activeData);
      }
    } catch (error) {
      console.error('Failed to load gym profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfiles = async (profiles) => {
    setGymProfiles(profiles);
    await AsyncStorage.setItem(GYM_PROFILES_KEY, JSON.stringify(profiles));
  };

  const addProfile = async (profile) => {
    const newProfile = {
      ...profile,
      id: Date.now().toString(),
    };
    const newProfiles = [...gymProfiles, newProfile];
    await saveProfiles(newProfiles);

    // If this is the first profile, set it as active
    if (gymProfiles.length === 0) {
      await setActiveProfile(newProfile.id);
    }

    return newProfile;
  };

  const updateProfile = async (profileId, updates) => {
    const newProfiles = gymProfiles.map(p =>
      p.id === profileId ? { ...p, ...updates } : p
    );
    await saveProfiles(newProfiles);
  };

  const deleteProfile = async (profileId) => {
    const newProfiles = gymProfiles.filter(p => p.id !== profileId);
    await saveProfiles(newProfiles);

    // If the deleted profile was active, clear active or set to first available
    if (activeProfileId === profileId) {
      const newActiveId = newProfiles.length > 0 ? newProfiles[0].id : null;
      await setActiveProfile(newActiveId);
    }
  };

  const setActiveProfile = async (profileId) => {
    setActiveProfileId(profileId);
    if (profileId) {
      await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
    } else {
      await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  };

  const getActiveProfile = () => {
    return gymProfiles.find(p => p.id === activeProfileId) || null;
  };

  const getProfileById = (id) => {
    if (id === 'all') return { id: 'all', name: 'All', equipment: [] };
    return gymProfiles.find(p => p.id === id) || null;
  };

  const value = {
    gymProfiles,
    activeProfileId,
    isLoading,
    addProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
    getActiveProfile,
    getProfileById,
  };

  return (
    <GymProfileContext.Provider value={value}>
      {children}
    </GymProfileContext.Provider>
  );
}

export function useGymProfile() {
  const context = useContext(GymProfileContext);
  if (context === undefined) {
    throw new Error('useGymProfile must be used within a GymProfileProvider');
  }
  return context;
}
