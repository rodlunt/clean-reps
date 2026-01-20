# Clean Reps - Project Memory

## Code Standards

### Markdown Linting

- Always check markdown files with the markdownlint extension before committing
- Comply with [CommonMark](https://commonmark.org/) and markdownlint standards
- Key rules to follow:
  - MD001: Heading levels should increment by one
  - MD009: No trailing spaces
  - MD010: No hard tabs (use spaces)
  - MD012: No multiple consecutive blank lines
  - MD022: Headings should be surrounded by blank lines
  - **MD032: Lists should be surrounded by blank lines** (common issue)
  - **MD041: First line should be a top-level heading** (common issue)

### Code Commenting Standards

- All code files must use industry-standard commenting for future code review
- **Class Documentation** (required for all classes):

  ```javascript
  /**
   * @summary Brief description of what the class does
   * @description Detailed explanation of class purpose and behavior
   * @author rodlunt {@link https://github.com/rodlunt}
   * @since 1.0.0
   * @version 1.0.0
   * @class
   */
  ```

- **JavaScript/TypeScript** (JSDoc + TSDoc hybrid):
  - Use JSDoc comments for functions, classes, and modules
  - Required tags for classes: `@summary`, `@author`, `@since`, `@version`, `@class`
  - Required tags for methods: `@param`, `@returns`, `@throws`
  - Optional tags: `@example`, `@remarks`, `@see`, `@deprecated`
  - Add inline comments for complex logic
- **General Guidelines**:
  - Comments should explain "why", not "what"
  - Keep comments up-to-date when code changes
  - Use TODO/FIXME/NOTE prefixes for action items
  - Document any non-obvious business logic or workarounds

## Build Configuration

### Version Tracking

- **Current versionName**: 1.0.5
- **Current versionCode**: 7
- **IMPORTANT**: Always increment `versionCode` before each Play Store release

### Version History

| versionName | versionCode | Date       |
|-------------|-------------|------------|
| 1.0.0       | 1           | Initial    |
| 1.0.2       | 2           | Previous   |
| 1.0.3       | 5           | 2024-12-21 |
| 1.0.4       | 6           | 2025-01-19 |
| 1.0.5       | 7           | 2025-01-20 |

## Build Preferences

1. **AAB Naming**: Include version code in filename (e.g., `cleanreps-1.0.5-vc7.aab`)
2. **versionCode Location**: `android/app/build.gradle` line ~95
3. **versionName Location**: `app.json` → `expo.version`

## Release Checklist

- [ ] Increment `versionCode` in `android/app/build.gradle`
- [ ] Update `version` in `app.json`
- [ ] Run `npx expo prebuild --clean --platform android`
- [ ] Build: `cd android && ./gradlew bundleRelease`
- [ ] Rename AAB with version code
- [ ] Upload to Play Console

## Key Paths

- **Release AAB**: `android/app/build/outputs/bundle/release/app-release.aab`
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Keystore**: `android/app/release.keystore`

## Keystore Configuration

- **File**: `android/app/release.keystore`
- **Alias**: `cleanreps`
- **Password**: `Cr3ps_Gym_2025_SecureKey`
- **SHA1**: `B3:B0:A0:59:20:6A:79:F7:92:CB:3A:E7:9A:A4:84:2E:1B:0D:67:9E`

**IMPORTANT**: After `npx expo prebuild --clean`, restore backups and signing config.

## Build Backups

Backups stored in `.build-backup/` (gitignored):

- `.build-backup/release.keystore` - signing key
- `.build-backup/local.properties` - SDK path

Restore after prebuild --clean:

```bash
cp d:/GymApp/.build-backup/release.keystore d:/GymApp/android/app/
cp d:/GymApp/.build-backup/local.properties d:/GymApp/android/
```

## SDK Info

- Expo SDK: 53
- React Native: 0.79.6
- Target SDK: 35
- Min SDK: 24
