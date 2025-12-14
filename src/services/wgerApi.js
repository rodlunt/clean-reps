import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const CACHE_KEY = 'wger_exercise_images_v3';
const IMAGE_DIR = `${FileSystem.cacheDirectory}exercise-images/`;

// Hardcoded image URLs - verified working December 2024
const EXERCISE_IMAGE_URLS = {
  // Chest
  'bench-press': 'https://wger.de/media/exercise-images/192/Bench-press-1.png',
  'incline-bench-press': 'https://wger.de/media/exercise-images/41/Incline-bench-press-1.png',
  'decline-bench-press': 'https://wger.de/media/exercise-images/100/Decline-bench-press-1.png',
  'dumbbell-bench-press': 'https://wger.de/media/exercise-images/97/Dumbbell-bench-press-1.png',
  'incline-dumbbell-press': 'https://wger.de/media/exercise-images/16/Incline-press-1.png',
  'cable-crossover': 'https://wger.de/media/exercise-images/71/Cable-crossover-2.png',
  'pec-deck-fly': 'https://wger.de/media/exercise-images/98/Butterfly-machine-2.png',

  // Back
  'deadlift': 'https://wger.de/media/exercise-images/161/Dead-lifts-2.png',
  'chin-ups': 'https://wger.de/media/exercise-images/181/Chin-ups-2.png',
  'barbell-row': 'https://wger.de/media/exercise-images/109/Barbell-rear-delt-row-1.png',
  't-bar-row': 'https://wger.de/media/exercise-images/106/T-bar-row-1.png',
  'cable-row': 'https://wger.de/media/exercise-images/143/Cable-seated-rows-2.png',

  // Legs
  'squat': 'https://wger.de/media/exercise-images/111/Squats-1.png',
  'front-squat': 'https://wger.de/media/exercise-images/191/Front-squat-1-857x1024.png',
  'hack-squat': 'https://wger.de/media/exercise-images/130/Narrow-stance-hack-squats-1-1024x721.png',
  'lunges': 'https://wger.de/media/exercise-images/113/Walking-lunges-1.png',
  'dumbbell-lunges': 'https://wger.de/media/exercise-images/113/Walking-lunges-1.png',
  'leg-curl': 'https://wger.de/media/exercise-images/154/lying-leg-curl-machine-large-1.png',
  'romanian-deadlift': 'https://wger.de/media/exercise-images/116/Good-mornings-2.png',

  // Shoulders
  'overhead-press': 'https://wger.de/media/exercise-images/119/seated-barbell-shoulder-press-large-1.png',
  'dumbbell-shoulder-press': 'https://wger.de/media/exercise-images/123/dumbbell-shoulder-press-large-1.png',
  'lateral-raises': 'https://wger.de/media/exercise-images/148/lateral-dumbbell-raises-large-2.png',
  'machine-shoulder-press': 'https://wger.de/media/exercise-images/53/Shoulder-press-machine-2.png',

  // Arms - Biceps
  'barbell-curl': 'https://wger.de/media/exercise-images/74/Bicep-curls-1.png',
  'dumbbell-curl': 'https://wger.de/media/exercise-images/81/Biceps-curl-1.png',
  'hammer-curl': 'https://wger.de/media/exercise-images/86/Bicep-hammer-curl-1.png',
  'preacher-curl': 'https://wger.de/media/exercise-images/193/Preacher-curl-3-1.png',
  'ez-bar-curl': 'https://wger.de/media/exercise-images/129/Standing-biceps-curl-1.png',

  // Arms - Triceps
  'skull-crushers': 'https://wger.de/media/exercise-images/84/Lying-close-grip-triceps-press-to-chin-1.png',
  'dips': 'https://wger.de/media/exercise-images/83/Bench-dips-1.png',
  'close-grip-bench-press': 'https://wger.de/media/exercise-images/61/Close-grip-bench-press-1.png',

  // Core
  'crunches': 'https://wger.de/media/exercise-images/91/Crunches-1.png',
  'decline-crunches': 'https://wger.de/media/exercise-images/93/Decline-crunch-1.png',
  'hanging-leg-raises': 'https://wger.de/media/exercise-images/125/Leg-raises-2.png',

  // Other
  'shrugs': 'https://wger.de/media/exercise-images/151/Dumbbell-shrugs-2.png',
  'barbell-shrugs': 'https://wger.de/media/exercise-images/150/Barbell-shrugs-1.png',
};

class WgerApiService {
  constructor() {
    this.localPathCache = {}; // Maps exerciseId -> local file path
    this.initializeDirectory();
    this.loadCache();
  }

  async initializeDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
      }
    } catch (error) {
      console.log('Failed to create image directory:', error);
    }
  }

  async loadCache() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        this.localPathCache = JSON.parse(cached);
      }
    } catch (error) {
      console.log('Failed to load image cache:', error);
    }
  }

  async saveCache() {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(this.localPathCache));
    } catch (error) {
      console.log('Failed to save image cache:', error);
    }
  }

  getLocalPath(exerciseId) {
    const ext = EXERCISE_IMAGE_URLS[exerciseId]?.split('.').pop() || 'png';
    return `${IMAGE_DIR}${exerciseId}.${ext}`;
  }

  async getImageForExercise(exerciseId) {
    // Check if we have a local cached file
    if (this.localPathCache[exerciseId]) {
      const fileInfo = await FileSystem.getInfoAsync(this.localPathCache[exerciseId]);
      if (fileInfo.exists) {
        return this.localPathCache[exerciseId];
      }
    }

    // Check if we have a hardcoded URL for this exercise
    const remoteUrl = EXERCISE_IMAGE_URLS[exerciseId];
    if (!remoteUrl) {
      return null; // No image available for this exercise
    }

    // Download and cache locally
    try {
      const localPath = this.getLocalPath(exerciseId);
      const downloadResult = await FileSystem.downloadAsync(remoteUrl, localPath);

      if (downloadResult.status === 200) {
        this.localPathCache[exerciseId] = localPath;
        this.saveCache();
        return localPath;
      }
    } catch (error) {
      console.log('Failed to download image for:', exerciseId, error);
    }

    // Fallback to remote URL if download fails
    return remoteUrl;
  }

  // Batch fetch images for multiple exercises
  async getImagesForExercises(exerciseIds) {
    const results = {};

    for (const id of exerciseIds) {
      results[id] = await this.getImageForExercise(id);
    }

    return results;
  }

  async clearCache() {
    this.localPathCache = {};
    await AsyncStorage.removeItem(CACHE_KEY);

    // Delete cached image files
    try {
      const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(IMAGE_DIR, { idempotent: true });
        await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
      }
    } catch (error) {
      console.log('Failed to clear image cache:', error);
    }
  }

  // Clear cache for a specific exercise and re-fetch
  async refreshExerciseImage(exerciseId) {
    // Remove local file if exists
    const localPath = this.localPathCache[exerciseId];
    if (localPath) {
      try {
        await FileSystem.deleteAsync(localPath, { idempotent: true });
      } catch (error) {
        console.log('Failed to delete cached image:', error);
      }
    }

    // Remove from cache
    delete this.localPathCache[exerciseId];
    await this.saveCache();

    // Re-fetch the image
    return this.getImageForExercise(exerciseId);
  }
}

export const wgerApi = new WgerApiService();
export default wgerApi;
