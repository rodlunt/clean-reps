import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WorkoutContext = createContext();

const ROUTINES_KEY = '@routines';
const WORKOUT_HISTORY_KEY = '@workout_history';
const PERSONAL_BESTS_KEY = '@personal_bests';
const CURRENT_ROUTINE_KEY = '@current_routine';

export function WorkoutProvider({ children }) {
  const [routines, setRoutines] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [personalBests, setPersonalBests] = useState({});
  const [currentRoutine, setCurrentRoutine] = useState(null);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [routinesData, historyData, pbData, currentData] = await Promise.all([
        AsyncStorage.getItem(ROUTINES_KEY),
        AsyncStorage.getItem(WORKOUT_HISTORY_KEY),
        AsyncStorage.getItem(PERSONAL_BESTS_KEY),
        AsyncStorage.getItem(CURRENT_ROUTINE_KEY),
      ]);

      if (routinesData) setRoutines(JSON.parse(routinesData));
      if (historyData) setWorkoutHistory(JSON.parse(historyData));
      if (pbData) setPersonalBests(JSON.parse(pbData));
      if (currentData) setCurrentRoutine(JSON.parse(currentData));
    } catch (error) {
      console.error('Failed to load workout data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addRoutine = async (routine) => {
    return new Promise((resolve) => {
      setRoutines(prev => {
        const newRoutines = [...prev, routine];
        AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(newRoutines));
        resolve(routine);
        return newRoutines;
      });
    });
  };

  const updateRoutine = async (routineId, updates) => {
    return new Promise((resolve) => {
      setRoutines(prev => {
        const newRoutines = prev.map(r =>
          r.id === routineId ? { ...r, ...updates } : r
        );
        AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(newRoutines));
        resolve();
        return newRoutines;
      });
    });
  };

  const deleteRoutine = async (routineId) => {
    return new Promise((resolve) => {
      setRoutines(prev => {
        const newRoutines = prev.filter(r => r.id !== routineId);
        AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(newRoutines));
        resolve();
        return newRoutines;
      });
    });
  };

  const saveWorkoutSession = async (session) => {
    const newHistory = [...workoutHistory, session];
    setWorkoutHistory(newHistory);
    await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(newHistory));

    // Update personal bests
    await updatePersonalBests(session);

    return session;
  };

  const updatePersonalBests = async (session) => {
    const newPBs = { ...personalBests };

    session.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.weight > 0 && set.reps > 0) {
          // Epley formula: weight * (1 + reps/30)
          const estimated1RM = set.weight * (1 + set.reps / 30);

          if (!newPBs[exercise.exerciseId] || estimated1RM > newPBs[exercise.exerciseId].estimated1RM) {
            newPBs[exercise.exerciseId] = {
              exerciseId: exercise.exerciseId,
              estimated1RM: Math.round(estimated1RM * 10) / 10,
              date: session.date,
              weight: set.weight,
              reps: set.reps,
            };
          }
        }
      });
    });

    setPersonalBests(newPBs);
    await AsyncStorage.setItem(PERSONAL_BESTS_KEY, JSON.stringify(newPBs));
  };

  const setCurrentRoutineAndSave = async (routine) => {
    setCurrentRoutine(routine);
    if (routine) {
      await AsyncStorage.setItem(CURRENT_ROUTINE_KEY, JSON.stringify(routine));
    } else {
      await AsyncStorage.removeItem(CURRENT_ROUTINE_KEY);
    }
  };

  const startWorkout = (routineId, dayId) => {
    const routine = routines.find(r => r.id === routineId);
    const day = routine?.days.find(d => d.id === dayId);

    if (routine && day) {
      setActiveWorkout({
        routineId,
        dayId,
        routineName: routine.name,
        dayName: day.name,
        exercises: day.exercises.map(ex => ({
          exerciseId: ex.exerciseId,
          sets: Array(ex.sets).fill({ weight: 0, reps: 0 }),
          useBodyweight: ex.useBodyweight,
        })),
        startTime: Date.now(),
      });
    }
  };

  const endWorkout = async () => {
    if (activeWorkout) {
      const session = {
        id: Date.now().toString(),
        routineId: activeWorkout.routineId,
        dayId: activeWorkout.dayId,
        date: Date.now(),
        exercises: activeWorkout.exercises,
        duration: Date.now() - activeWorkout.startTime,
      };

      await saveWorkoutSession(session);
      setActiveWorkout(null);
      return session;
    }
    return null;
  };

  const updateActiveWorkoutSet = (exerciseIndex, setIndex, data) => {
    if (activeWorkout) {
      const newExercises = [...activeWorkout.exercises];
      newExercises[exerciseIndex].sets[setIndex] = {
        ...newExercises[exerciseIndex].sets[setIndex],
        ...data,
      };
      setActiveWorkout({ ...activeWorkout, exercises: newExercises });
    }
  };

  const value = {
    routines,
    workoutHistory,
    personalBests,
    currentRoutine,
    activeWorkout,
    isLoading,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    saveWorkoutSession,
    setCurrentRoutine: setCurrentRoutineAndSave,
    startWorkout,
    endWorkout,
    updateActiveWorkoutSet,
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}
