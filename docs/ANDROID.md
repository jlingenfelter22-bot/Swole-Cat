# Swole Cat Android

Swole Cat uses Capacitor so the PWA and Android app share the same HTML, CSS, JavaScript, workout logic, and local data model.

## Package

- App name: Swole Cat
- Android application ID: `com.jlingenfelter.swolecat`
- Capacitor: 8.5.2
- Minimum supported Android version is determined by Capacitor 8.
- Current build target: Android API 36.

## Build locally

Requirements:

- Node.js 22+
- Android Studio / Android SDK
- Java 21-compatible Android toolchain

Commands:

```bash
npm install
npm run build:web
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

The debug APK is written to:

`android/app/build/outputs/apk/debug/app-debug.apk`

## Continuous integration

`.github/workflows/android.yml` builds a debug APK from `main` whenever Android/web packaging files change, and can also be run manually.

The APK is uploaded as the GitHub Actions artifact:

`Swole-Cat-Android-debug`

## Existing PWA user migration

The Android WebView has its own local storage sandbox. Existing PWA data does not automatically appear in the Android app.

Migration path:

1. In the existing PWA, open Settings.
2. Export a Swole Cat backup.
3. Install/open the Android app.
4. Import that backup from Settings.
5. V29 backup validation and the pre-import rollback snapshot protect the migration.

Do not uninstall or clear the PWA until the Android import has been verified.

## Release path

The initial workflow creates an unsigned/debug install for testing. Before a Play Store release, add:

- release keystore handling through GitHub Actions secrets
- signed AAB generation
- Play Store metadata
- release/version-code automation
- native rest-timer notifications
- Android back-button integration
- native share/export
- optional Health Connect support
