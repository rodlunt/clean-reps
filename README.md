# Clean Reps

A no-nonsense workout tracker. No accounts, no subscriptions, no social features. Just log your lifts and get on with your day.

## Why I built this

I got tired of fitness apps that want to be everything - social networks, meal planners, AI coaches, motivation machines. I just needed to remember what weight I lifted last week.

Clean Reps does one thing: tracks your workouts. That's it.

## Features

**The basics**
- Log sets, reps, and weights
- Build routines that match how you train
- View your workout history

**Multiple gym setups**
- Set up different gym profiles (home gym, work gym, hotel, etc.)
- Equipment-based exercise filtering - only see exercises you can actually do

**Progress tracking**
- Personal records flagged automatically
- Estimated 1RM charts per exercise
- Weekly volume stats
- 4-week trend view

**Smart scheduling**
- Remembers where you're at in your routine
- Knows which day is next
- Skip ahead if you've missed sessions

**Works how you want**
- kg or lbs
- Dark mode
- Works completely offline

**What's NOT included**
- No accounts or sign-ups
- No subscriptions
- No ads
- No social features
- No data collection

## Tech Stack

- React Native + Expo SDK 52
- React Navigation v6
- AsyncStorage for local persistence
- Context API for state

## Getting Started

### Prerequisites

- Node.js 18+
- Android Studio (for Android builds)
- Xcode (for iOS, Mac only)

### Development

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

### Building APK/AAB locally

```bash
# Set JAVA_HOME to Android Studio's JDK
# Windows PowerShell:
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'

# Build debug APK
cd android && ./gradlew assembleDebug

# Build release APK (needs keystore setup)
cd android && ./gradlew assembleRelease

# Build AAB for Play Store
cd android && ./gradlew bundleRelease
```

Output locations:
- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### Release signing

Create `android/keystore.properties`:
```properties
storeFile=release.keystore
storePassword=your_password
keyAlias=your_alias
keyPassword=your_password
```

Generate a keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/release.keystore -alias your_alias -keyalg RSA -keysize 2048 -validity 9125
```

## Project Structure

```
src/
├── components/       # UI components
├── context/          # React Context (Theme, Workout, Settings, etc.)
├── data/             # Static data, starter routines
├── navigation/       # React Navigation setup
├── screens/          # App screens by tab
├── services/         # Storage, API, calculations
└── theme/            # Colors, spacing, typography
```

## E2E Testing

Uses Detox for end-to-end testing:

```bash
# Run tests on connected device
npm run test:e2e

# Run tests with debug build
npm run test:e2e:debug
```

## Privacy

All data stays on your device. No accounts, no servers, no analytics. See `store-listing/privacy-policy.md` for the full policy.

## License

MIT

## Acknowledgments

Exercise data from [wger Workout Manager](https://wger.de/)
