# Clean Reps

A modern, minimalist workout tracking app built with React Native and Expo. Track your workouts, create custom routines, and monitor your progress with a clean, intuitive interface.

## Features

- **Workout Tracking** - Log sets, reps, and weights during your workouts with an intuitive interface
- **Custom Routines** - Create personalized workout routines with multiple days and exercises
- **Gym Profiles** - Set up different gym profiles with available equipment to filter exercises accordingly
- **Progress Tracking** - View your workout history and personal bests over time
- **Exercise Database** - Access a comprehensive database of exercises with muscle group targeting
- **Theme Support** - Choose between light mode, dark mode, or follow your device settings
- **Unit Preferences** - Switch between kg and lbs based on your preference
- **Data Export** - Export your workout data for backup or analysis

## Screenshots

<!-- Add screenshots here -->

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7
- **State Management**: React Context API
- **Storage**: AsyncStorage for local data persistence
- **Styling**: React Native StyleSheet with custom theming

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator, or Expo Go app on your device

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/clean-reps.git
   cd clean-reps
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npx expo start
   ```

4. Run on your preferred platform:
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan the QR code with Expo Go on your device

### Building for Production

Create a development build using EAS:

```bash
npx eas-cli build --profile development --platform android
```

Or for iOS:

```bash
npx eas-cli build --profile development --platform ios
```

## Project Structure

```text
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Button, Card, Input, etc.)
│   └── AnimatedSplashScreen.js
├── context/            # React Context providers
│   ├── ThemeContext.js
│   ├── WorkoutContext.js
│   ├── ExerciseContext.js
│   ├── GymProfileContext.js
│   └── SettingsContext.js
├── data/               # Static data and exercise database
├── navigation/         # Navigation configuration
│   ├── TabNavigator.js
│   └── *Stack.js       # Stack navigators
├── screens/            # App screens organized by tab
│   ├── WorkoutTab/
│   ├── RoutinesTab/
│   ├── ProgressTab/
│   └── SettingsTab/
├── services/           # API and utility services
│   ├── storage.js
│   ├── calculations.js
│   └── wgerApi.js
└── theme/              # Theme configuration
    ├── colors.js
    ├── spacing.js
    └── index.js
```

## Configuration

The app can be configured through the following files:

- `app.json` - Expo configuration (app name, icons, splash screen)
- `src/theme/colors.js` - Color palette for light and dark themes
- `src/theme/spacing.js` - Spacing and sizing constants

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Exercise data sourced from [wger Workout Manager](https://wger.de/)
- Icons and design inspiration from modern fitness apps
