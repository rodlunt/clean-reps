export const STARTER_ROUTINES = [
  {
    id: 'template_ppl',
    name: 'Push Pull Legs',
    description: '3-day split for balanced muscle growth',
    days: [
      {
        id: 'ppl_push',
        name: 'Push Day',
        exercises: [
          { exerciseId: 'bench-press', name: 'Bench Press', sets: 4 },
          { exerciseId: 'overhead-press', name: 'Overhead Press', sets: 3 },
          { exerciseId: 'incline-bench-press', name: 'Incline Bench Press', sets: 3 },
          { exerciseId: 'tricep-pushdown', name: 'Tricep Pushdown', sets: 3 },
          { exerciseId: 'lateral-raises', name: 'Lateral Raises', sets: 3 },
        ],
      },
      {
        id: 'ppl_pull',
        name: 'Pull Day',
        exercises: [
          { exerciseId: 'deadlift', name: 'Deadlift', sets: 4 },
          { exerciseId: 'pull-ups', name: 'Pull-ups', sets: 3 },
          { exerciseId: 'barbell-row', name: 'Barbell Row', sets: 3 },
          { exerciseId: 'face-pulls', name: 'Face Pulls', sets: 3 },
          { exerciseId: 'barbell-curl', name: 'Barbell Curl', sets: 3 },
        ],
      },
      {
        id: 'ppl_legs',
        name: 'Leg Day',
        exercises: [
          { exerciseId: 'squat', name: 'Squat', sets: 4 },
          { exerciseId: 'romanian-deadlift', name: 'Romanian Deadlift', sets: 3 },
          { exerciseId: 'leg-press', name: 'Leg Press', sets: 3 },
          { exerciseId: 'leg-curl', name: 'Leg Curl', sets: 3 },
          { exerciseId: 'calf-raises', name: 'Calf Raises', sets: 4 },
        ],
      },
    ],
  },
  {
    id: 'template_upper_lower',
    name: 'Upper Lower',
    description: '4-day split for strength and size',
    days: [
      {
        id: 'ul_upper1',
        name: 'Upper A',
        exercises: [
          { exerciseId: 'bench-press', name: 'Bench Press', sets: 4 },
          { exerciseId: 'barbell-row', name: 'Barbell Row', sets: 4 },
          { exerciseId: 'overhead-press', name: 'Overhead Press', sets: 3 },
          { exerciseId: 'pull-ups', name: 'Pull-ups', sets: 3 },
          { exerciseId: 'barbell-curl', name: 'Barbell Curl', sets: 2 },
          { exerciseId: 'tricep-pushdown', name: 'Tricep Pushdown', sets: 2 },
        ],
      },
      {
        id: 'ul_lower1',
        name: 'Lower A',
        exercises: [
          { exerciseId: 'squat', name: 'Squat', sets: 4 },
          { exerciseId: 'romanian-deadlift', name: 'Romanian Deadlift', sets: 3 },
          { exerciseId: 'leg-press', name: 'Leg Press', sets: 3 },
          { exerciseId: 'leg-curl', name: 'Leg Curl', sets: 3 },
          { exerciseId: 'calf-raises', name: 'Calf Raises', sets: 4 },
        ],
      },
      {
        id: 'ul_upper2',
        name: 'Upper B',
        exercises: [
          { exerciseId: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', sets: 4 },
          { exerciseId: 'cable-row', name: 'Cable Row', sets: 4 },
          { exerciseId: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', sets: 3 },
          { exerciseId: 'lat-pulldown', name: 'Lat Pulldown', sets: 3 },
          { exerciseId: 'hammer-curl', name: 'Hammer Curl', sets: 2 },
          { exerciseId: 'overhead-tricep-extension', name: 'Overhead Tricep Extension', sets: 2 },
        ],
      },
      {
        id: 'ul_lower2',
        name: 'Lower B',
        exercises: [
          { exerciseId: 'deadlift', name: 'Deadlift', sets: 4 },
          { exerciseId: 'front-squat', name: 'Front Squat', sets: 3 },
          { exerciseId: 'leg-extension', name: 'Leg Extension', sets: 3 },
          { exerciseId: 'leg-curl', name: 'Leg Curl', sets: 3 },
          { exerciseId: 'calf-raises', name: 'Calf Raises', sets: 4 },
        ],
      },
    ],
  },
  {
    id: 'template_fullbody',
    name: 'Full Body 3x',
    description: 'Great for beginners, 3 days per week',
    days: [
      {
        id: 'fb_day1',
        name: 'Day 1',
        exercises: [
          { exerciseId: 'squat', name: 'Squat', sets: 3 },
          { exerciseId: 'bench-press', name: 'Bench Press', sets: 3 },
          { exerciseId: 'barbell-row', name: 'Barbell Row', sets: 3 },
          { exerciseId: 'overhead-press', name: 'Overhead Press', sets: 2 },
          { exerciseId: 'barbell-curl', name: 'Barbell Curl', sets: 2 },
        ],
      },
      {
        id: 'fb_day2',
        name: 'Day 2',
        exercises: [
          { exerciseId: 'deadlift', name: 'Deadlift', sets: 3 },
          { exerciseId: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', sets: 3 },
          { exerciseId: 'pull-ups', name: 'Pull-ups', sets: 3 },
          { exerciseId: 'lateral-raises', name: 'Lateral Raises', sets: 2 },
          { exerciseId: 'tricep-pushdown', name: 'Tricep Pushdown', sets: 2 },
        ],
      },
      {
        id: 'fb_day3',
        name: 'Day 3',
        exercises: [
          { exerciseId: 'goblet-squat', name: 'Goblet Squat', sets: 3 },
          { exerciseId: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', sets: 3 },
          { exerciseId: 'cable-row', name: 'Cable Row', sets: 3 },
          { exerciseId: 'face-pulls', name: 'Face Pulls', sets: 2 },
          { exerciseId: 'hammer-curl', name: 'Hammer Curl', sets: 2 },
        ],
      },
    ],
  },
];

// Equipment list matching the exercise database
export const COMMON_EQUIPMENT = [
  // Free Weights
  { id: 'barbell', name: 'Barbell', category: 'free_weights' },
  { id: 'dumbbells', name: 'Dumbbells', category: 'free_weights' },
  { id: 'ez-bar', name: 'EZ Curl Bar', category: 'free_weights' },
  { id: 'kettlebell', name: 'Kettlebell', category: 'free_weights' },
  { id: 'trap-bar', name: 'Trap Bar / Hex Bar', category: 'free_weights' },
  { id: 'safety-squat-bar', name: 'Safety Squat Bar', category: 'free_weights' },
  { id: 'landmine', name: 'Landmine Attachment', category: 'free_weights' },
  { id: 'medicine-ball', name: 'Medicine Ball', category: 'free_weights' },
  // Benches
  { id: 'bench', name: 'Flat Bench', category: 'benches' },
  { id: 'incline-bench', name: 'Incline Bench', category: 'benches' },
  { id: 'decline-bench', name: 'Decline Bench', category: 'benches' },
  { id: 'preacher-bench', name: 'Preacher Bench', category: 'benches' },
  { id: 'ab-bench', name: 'Ab/Situp Bench', category: 'benches' },
  // Racks
  { id: 'squat-rack', name: 'Squat Rack', category: 'racks' },
  { id: 'smith-machine', name: 'Smith Machine', category: 'racks' },
  // Machines
  { id: 'cable-machine', name: 'Cable Machine', category: 'machines' },
  { id: 'lat-pulldown-machine', name: 'Lat Pulldown Machine', category: 'machines' },
  { id: 'chest-press-machine', name: 'Chest Press Machine', category: 'machines' },
  { id: 'pec-deck-machine', name: 'Pec Deck/Fly Machine', category: 'machines' },
  { id: 'shoulder-press-machine', name: 'Shoulder Press Machine', category: 'machines' },
  { id: 'leg-press-machine', name: 'Leg Press Machine', category: 'machines' },
  { id: 'hack-squat-machine', name: 'Hack Squat Machine', category: 'machines' },
  { id: 'leg-extension-machine', name: 'Leg Extension Machine', category: 'machines' },
  { id: 'leg-curl-machine', name: 'Leg Curl Machine', category: 'machines' },
  { id: 'calf-raise-machine', name: 'Calf Raise Machine', category: 'machines' },
  { id: 'hip-abductor-machine', name: 'Hip Abductor Machine', category: 'machines' },
  { id: 'hip-adductor-machine', name: 'Hip Adductor Machine', category: 'machines' },
  { id: 'assisted-pullup-machine', name: 'Assisted Pull-up Machine', category: 'machines' },
  { id: 'seated-row-machine', name: 'Seated Row Machine', category: 'machines' },
  { id: 'chest-supported-row', name: 'Chest-Supported Row', category: 'machines' },
  // Cardio
  { id: 'rowing-machine', name: 'Rowing Machine', category: 'cardio' },
  { id: 'treadmill', name: 'Treadmill', category: 'cardio' },
  { id: 'exercise-bike', name: 'Exercise Bike', category: 'cardio' },
  { id: 'elliptical', name: 'Elliptical', category: 'cardio' },
  { id: 'stair-climber', name: 'Stair Climber', category: 'cardio' },
  // Accessories
  { id: 'resistance-band-light', name: 'Resistance Band (Light)', category: 'accessories' },
  { id: 'resistance-band-medium', name: 'Resistance Band (Medium)', category: 'accessories' },
  { id: 'resistance-band-heavy', name: 'Resistance Band (Heavy)', category: 'accessories' },
  { id: 'foam-roller', name: 'Foam Roller', category: 'accessories' },
  { id: 'ab-wheel', name: 'Ab Wheel', category: 'accessories' },
  { id: 'battle-ropes', name: 'Battle Ropes', category: 'accessories' },
  { id: 'plyo-box', name: 'Plyo Box', category: 'accessories' },
  // Bodyweight
  { id: 'pull-up-bar', name: 'Pull-up Bar', category: 'bodyweight' },
  { id: 'dip-bars', name: 'Dip Bars', category: 'bodyweight' },
];

// Resistance band options for assisted exercises
export const RESISTANCE_BANDS = [
  { id: 'none', name: 'None', color: null },
  { id: 'light', name: 'Light', color: '#4ADE80' },
  { id: 'medium', name: 'Medium', color: '#FBBF24' },
  { id: 'heavy', name: 'Heavy', color: '#EF4444' },
];

// Exercises that can use resistance bands for assistance
export const BAND_ASSISTED_EXERCISES = [
  'pull-up', 'chin-up', 'wide-grip-pull-up', 'neutral-grip-pull-up',
  'dip', 'chest-dip', 'tricep-dip',
  'muscle-up', 'ring-muscle-up',
];
