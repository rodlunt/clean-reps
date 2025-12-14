import React, { createContext, useContext, useState, useCallback } from 'react';
import exerciseData from '../data/exercises.json';
import wgerApi from '../services/wgerApi';

const ExerciseContext = createContext();

export function ExerciseProvider({ children }) {
  const exercises = exerciseData.exercises;
  const muscleGroups = exerciseData.muscleGroups;
  const equipmentList = exerciseData.equipmentList;

  // Image state
  const [exerciseImages, setExerciseImages] = useState({});
  const [loadingImages, setLoadingImages] = useState({});

  // Fetch image for a single exercise
  const getExerciseImage = useCallback(async (exerciseId) => {
    // Return cached image if available
    if (exerciseImages[exerciseId] !== undefined) {
      return exerciseImages[exerciseId];
    }

    // Don't fetch if already loading
    if (loadingImages[exerciseId]) {
      return null;
    }

    setLoadingImages(prev => ({ ...prev, [exerciseId]: true }));

    try {
      const imageUrl = await wgerApi.getImageForExercise(exerciseId);
      setExerciseImages(prev => ({ ...prev, [exerciseId]: imageUrl }));
      return imageUrl;
    } catch (error) {
      console.log('Failed to fetch image:', error);
      setExerciseImages(prev => ({ ...prev, [exerciseId]: null }));
      return null;
    } finally {
      setLoadingImages(prev => ({ ...prev, [exerciseId]: false }));
    }
  }, [exerciseImages, loadingImages]);

  // Prefetch images for multiple exercises
  const prefetchImages = useCallback(async (exerciseIds) => {
    const missing = exerciseIds.filter(id => exerciseImages[id] === undefined);
    if (missing.length === 0) return;

    const images = await wgerApi.getImagesForExercises(missing);
    setExerciseImages(prev => ({ ...prev, ...images }));
  }, [exerciseImages]);

  // Refresh a specific exercise image (clear cache and re-fetch)
  const refreshExerciseImage = useCallback(async (exerciseId) => {
    setLoadingImages(prev => ({ ...prev, [exerciseId]: true }));

    try {
      const imageUrl = await wgerApi.refreshExerciseImage(exerciseId);
      setExerciseImages(prev => ({ ...prev, [exerciseId]: imageUrl }));
      return imageUrl;
    } catch (error) {
      console.log('Failed to refresh image:', error);
      return null;
    } finally {
      setLoadingImages(prev => ({ ...prev, [exerciseId]: false }));
    }
  }, []);

  const getExerciseById = (id) => {
    return exercises.find(ex => ex.id === id);
  };

  const getExercisesByMuscle = (muscle) => {
    if (!muscle) return exercises;
    return exercises.filter(ex =>
      ex.primaryMuscles.includes(muscle) || ex.secondaryMuscles.includes(muscle)
    );
  };

  const getExercisesByEquipment = (equipmentIds) => {
    if (!equipmentIds || equipmentIds.length === 0) return exercises;
    return exercises.filter(ex =>
      ex.equipment.every(eq => equipmentIds.includes(eq) || eq === 'bodyweight')
    );
  };

  const searchExercises = (query) => {
    if (!query) return exercises;
    const lowerQuery = query.toLowerCase();
    return exercises.filter(ex =>
      ex.name.toLowerCase().includes(lowerQuery) ||
      ex.primaryMuscles.some(m => m.toLowerCase().includes(lowerQuery))
    );
  };

  const filterExercises = ({ query, muscle, equipment }) => {
    let filtered = exercises;

    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(lowerQuery)
      );
    }

    if (muscle) {
      filtered = filtered.filter(ex =>
        ex.primaryMuscles.includes(muscle) || ex.secondaryMuscles.includes(muscle)
      );
    }

    if (equipment && equipment.length > 0) {
      filtered = filtered.filter(ex =>
        ex.equipment.every(eq => equipment.includes(eq) || eq === 'bodyweight')
      );
    }

    return filtered;
  };

  const value = {
    exercises,
    muscleGroups,
    equipmentList,
    getExerciseById,
    getExercisesByMuscle,
    getExercisesByEquipment,
    searchExercises,
    filterExercises,
    // Image functions
    exerciseImages,
    loadingImages,
    getExerciseImage,
    prefetchImages,
    refreshExerciseImage,
  };

  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  );
}

export function useExercises() {
  const context = useContext(ExerciseContext);
  if (context === undefined) {
    throw new Error('useExercises must be used within an ExerciseProvider');
  }
  return context;
}
