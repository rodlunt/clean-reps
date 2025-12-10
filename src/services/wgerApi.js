import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://wger.de/api/v2';
const CACHE_KEY = 'wger_exercise_images';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Direct WGER exercise base IDs for accurate image matching
// These IDs correspond to specific exercises in the WGER database
const WGER_EXERCISE_BASE_IDS = {
  'bench-press': 192,
  'incline-bench-press': 163,
  'dumbbell-bench-press': 97,
  'dumbbell-flyes': 145,
  'push-ups': 4,
  'squat': 111,
  'deadlift': 105,
  'romanian-deadlift': 116,
  'leg-press': 110,
  'leg-extension': 113,
  'leg-curl': 114,
  'lunges': 112,
  'pull-ups': 107,
  'chin-ups': 181,
  'lat-pulldown': 122,
  'barbell-row': 109,
  'dumbbell-row': 106,
  'overhead-press': 119,
  'dumbbell-shoulder-press': 123,
  'lateral-raises': 148,
  'barbell-curl': 74,
  'dumbbell-curl': 81,
  'hammer-curl': 301,
  'tricep-pushdown': 92,
  'dips': 83,
  'calf-raises': 103,
  'plank': 238,
  'crunches': 91,
  'hip-thrust': 171,
  'kettlebell-swing': 249,
  'shrugs': 187,
  'face-pulls': 670,
  'cable-row': 108,
};

// Map our exercise names to wger search terms (fallback for exercises without direct IDs)
const EXERCISE_NAME_MAP = {
  'bench-press': 'bench press barbell',
  'incline-bench-press': 'incline bench press',
  'decline-bench-press': 'decline bench press',
  'dumbbell-bench-press': 'dumbbell bench press flat',
  'incline-dumbbell-press': 'incline dumbbell press',
  'decline-dumbbell-press': 'decline dumbbell press',
  'dumbbell-flyes': 'dumbbell fly',
  'incline-dumbbell-flyes': 'incline dumbbell fly',
  'push-ups': 'push up',
  'cable-crossover': 'cable fly crossover',
  'machine-chest-press': 'machine chest press',
  'pec-deck-fly': 'pec deck butterfly',
  'squat': 'barbell squat',
  'front-squat': 'front squat barbell',
  'goblet-squat': 'goblet squat dumbbell',
  'leg-press': 'leg press machine',
  'hack-squat': 'hack squat machine',
  'leg-extension': 'leg extension machine',
  'lunges': 'lunge bodyweight',
  'dumbbell-lunges': 'lunge dumbbell',
  'deadlift': 'deadlift barbell',
  'romanian-deadlift': 'romanian deadlift stiff leg',
  'dumbbell-romanian-deadlift': 'romanian deadlift dumbbell',
  'leg-curl': 'leg curl lying',
  'pull-ups': 'pull up',
  'chin-ups': 'chin up',
  'assisted-pull-ups': 'assisted pull up',
  'lat-pulldown': 'lat pulldown cable',
  'machine-lat-pulldown': 'lat pulldown machine',
  'barbell-row': 'bent over barbell row',
  'dumbbell-row': 'one arm dumbbell row',
  'cable-row': 'seated cable row',
  't-bar-row': 't-bar row',
  'face-pulls': 'face pull cable',
  'overhead-press': 'military press overhead',
  'dumbbell-shoulder-press': 'dumbbell shoulder press seated',
  'machine-shoulder-press': 'machine shoulder press',
  'lateral-raises': 'lateral raise dumbbell',
  'front-raises': 'front raise dumbbell',
  'reverse-flyes': 'reverse fly rear delt',
  'barbell-curl': 'barbell bicep curl',
  'dumbbell-curl': 'dumbbell bicep curl',
  'hammer-curl': 'hammer curl dumbbell',
  'preacher-curl': 'preacher curl',
  'dumbbell-preacher-curl': 'preacher curl dumbbell',
  'ez-bar-curl': 'ez bar curl bicep',
  'cable-curl': 'cable bicep curl',
  'tricep-pushdown': 'tricep pushdown cable',
  'skull-crushers': 'skull crusher lying tricep',
  'overhead-tricep-extension': 'overhead tricep extension',
  'dips': 'dip parallel bars tricep',
  'close-grip-bench-press': 'close grip bench press',
  'calf-raises': 'standing calf raise',
  'seated-calf-raises': 'seated calf raise machine',
  'hip-thrust': 'barbell hip thrust glute',
  'glute-bridge': 'glute bridge',
  'hip-abduction': 'hip abduction machine',
  'hip-adduction': 'hip adduction machine',
  'cable-kickback': 'cable glute kickback',
  'plank': 'plank core',
  'crunches': 'crunch abdominal',
  'decline-situps': 'decline sit up',
  'decline-crunches': 'decline crunch',
  'decline-russian-twist': 'russian twist decline',
  'hanging-leg-raises': 'hanging leg raise',
  'cable-crunch': 'cable crunch kneeling',
  'russian-twist': 'russian twist',
  'shrugs': 'dumbbell shrug',
  'barbell-shrugs': 'barbell shrug',
  'wrist-curls': 'wrist curl forearm',
  'farmers-walk': 'farmer walk carry',
  'kettlebell-swing': 'kettlebell swing',
  'kettlebell-goblet-squat': 'goblet squat kettlebell',
  'smith-machine-bench-press': 'smith machine bench press',
  'smith-machine-incline-press': 'smith machine incline press',
  'smith-machine-squat': 'smith machine squat',
  'smith-machine-shoulder-press': 'smith machine shoulder press',
};

class WgerApiService {
  constructor() {
    this.imageCache = {};
    this.loadCache();
  }

  async loadCache() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          this.imageCache = data;
        }
      }
    } catch (error) {
      console.log('Failed to load image cache:', error);
    }
  }

  async saveCache() {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        data: this.imageCache,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.log('Failed to save image cache:', error);
    }
  }

  async searchExercise(searchTerm) {
    try {
      // Search for exercise by name (English = language 2)
      const response = await fetch(
        `${BASE_URL}/exercise/?language=2&limit=20&search=${encodeURIComponent(searchTerm)}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.log('Exercise search failed:', error);
      return [];
    }
  }

  async getExerciseImages(exerciseBaseId) {
    try {
      const response = await fetch(
        `${BASE_URL}/exerciseimage/?exercise_base=${exerciseBaseId}&is_main=True`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.log('Image fetch failed:', error);
      return [];
    }
  }

  async getImageForExercise(exerciseId) {
    // Check cache first
    if (this.imageCache[exerciseId]) {
      return this.imageCache[exerciseId];
    }

    try {
      let exerciseBaseId = null;

      // First, check if we have a direct WGER exercise base ID mapping
      if (WGER_EXERCISE_BASE_IDS[exerciseId]) {
        exerciseBaseId = WGER_EXERCISE_BASE_IDS[exerciseId];
      } else {
        // Fall back to search
        const searchTerm = EXERCISE_NAME_MAP[exerciseId] || exerciseId.replace(/-/g, ' ');
        const exercises = await this.searchExercise(searchTerm);

        if (exercises.length === 0) {
          this.imageCache[exerciseId] = null;
          return null;
        }

        // Get the exercise base ID from the first result
        exerciseBaseId = exercises[0].exercise_base;
      }

      // Fetch images for this exercise
      const images = await this.getExerciseImages(exerciseBaseId);

      if (images.length > 0) {
        const imageUrl = images[0].image;
        this.imageCache[exerciseId] = imageUrl;
        this.saveCache();
        return imageUrl;
      }

      // If no main image, try getting any image
      const allImagesResponse = await fetch(
        `${BASE_URL}/exerciseimage/?exercise_base=${exerciseBaseId}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (allImagesResponse.ok) {
        const allImagesData = await allImagesResponse.json();
        if (allImagesData.results && allImagesData.results.length > 0) {
          const imageUrl = allImagesData.results[0].image;
          this.imageCache[exerciseId] = imageUrl;
          this.saveCache();
          return imageUrl;
        }
      }

      this.imageCache[exerciseId] = null;
      return null;
    } catch (error) {
      console.log('Failed to get image for exercise:', exerciseId, error);
      this.imageCache[exerciseId] = null;
      return null;
    }
  }

  // Batch fetch images for multiple exercises
  async getImagesForExercises(exerciseIds) {
    const results = {};

    // Check cache first and identify missing
    const missing = [];
    for (const id of exerciseIds) {
      if (this.imageCache[id] !== undefined) {
        results[id] = this.imageCache[id];
      } else {
        missing.push(id);
      }
    }

    // Fetch missing images (limit concurrent requests)
    const batchSize = 3;
    for (let i = 0; i < missing.length; i += batchSize) {
      const batch = missing.slice(i, i + batchSize);
      const promises = batch.map(id => this.getImageForExercise(id));
      const batchResults = await Promise.all(promises);

      batch.forEach((id, index) => {
        results[id] = batchResults[index];
      });
    }

    return results;
  }

  clearCache() {
    this.imageCache = {};
    AsyncStorage.removeItem(CACHE_KEY);
  }
}

export const wgerApi = new WgerApiService();
export default wgerApi;
