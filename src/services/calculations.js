/**
 * Calculate estimated 1RM using the Epley formula
 * Formula: weight * (1 + reps/30)
 *
 * @param {number} weight - Weight lifted
 * @param {number} reps - Number of repetitions
 * @returns {number} Estimated 1RM rounded to 1 decimal place
 */
export function calculateEstimated1RM(weight, reps) {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;

  const estimated = weight * (1 + reps / 30);
  return Math.round(estimated * 10) / 10;
}

/**
 * Calculate total volume for a workout session
 * Volume = sum of (weight * reps) for all sets
 *
 * @param {Array} exercises - Array of exercises with sets
 * @returns {number} Total volume
 */
export function calculateTotalVolume(exercises) {
  return exercises.reduce((total, exercise) => {
    const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
      return setTotal + (set.weight * set.reps);
    }, 0);
    return total + exerciseVolume;
  }, 0);
}

/**
 * Check if user should be nudged to progress
 * Returns true if user hit high end of rep range (12+ reps) in most sets
 *
 * @param {Array} previousSets - Array of sets from previous session
 * @param {number} targetReps - Target rep range high end (default 12)
 * @returns {boolean} Whether to show progression nudge
 */
export function shouldShowProgressionNudge(previousSets, targetReps = 12) {
  if (!previousSets || previousSets.length === 0) return false;

  const highRepSets = previousSets.filter(set => set.reps >= targetReps);
  return highRepSets.length >= previousSets.length * 0.75;
}

/**
 * Convert weight between kg and lbs
 *
 * @param {number} weight - Weight value
 * @param {string} from - Source unit ('kg' or 'lbs')
 * @param {string} to - Target unit ('kg' or 'lbs')
 * @returns {number} Converted weight rounded to 1 decimal
 */
export function convertWeight(weight, from, to) {
  if (from === to) return weight;

  if (from === 'kg' && to === 'lbs') {
    return Math.round(weight * 2.20462 * 10) / 10;
  }

  if (from === 'lbs' && to === 'kg') {
    return Math.round(weight / 2.20462 * 10) / 10;
  }

  return weight;
}

/**
 * Format duration in milliseconds to readable string
 *
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration (e.g., "45 min", "1h 15m")
 */
export function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}
