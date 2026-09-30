# Swole Cat Android

Swole Cat uses Capacitor so the PWA and Android app share the same HTML, CSS, JavaScript, workout logic, and local data model.

## Package

- App name: Swole Cat
- Current app version: `0.29.0`
- Android version code: `29`
- Android application ID: `com.jlingenfelter.swolecat`
- Capacitor: 8.5.2
- Minimum supported Android version is determined by Capacitor 8.
- Current build target: Android API 36.

The human-readable version lives in `package.json.version`. The Play-compatible Android integer version lives in `package.json.swoleCat.androidVersionCode`. The Android project is generated/synchronized and then patched from those values automatically.

## Build locally

Requirements:

- Node.js 22+
- Android Studio / Android SDK
- Java 21-compatible Android toolchain

From the repository root:

```bash
npm install
npm run android:debug
```

`android:debug` is cross-platform. It builds the web bundle, creates the Capacitor Android project when missing, syncs it, injects the app version, and runs the Gradle debug build.

The debug APK is written to:

`android/app/build/outputs/apk/debug/app-debug.apk`

## Continuous integration

`.github/workflows/android.yml` builds a versioned debug APK from `main` whenever Android/web packaging files change, and can also be run manually.

For v0.29.0 the artifact/file naming is:

- Artifact: `Swole-Cat-Android-v0.29.0-debug`
- APK: `swole-cat-v0.29.0-debug.apk`

The workflow verifies that the generated Android `versionName`, Android `versionCode`, and bundled app UI version all match the repository metadata before compiling.

## Web/Android bundle parity

Both GitHub Pages and Android now use `npm run build:web`. That means the installed PWA and APK are built from the same `www/` bundle instead of Pages serving raw repository files while Android uses generated output.

The build also injects the package version into:
- the Settings screen
- the PWA service-worker cache name

This makes it easier to identify exactly which build a tester is running and prevents old PWA caches from surviving a version bump.

## Existing PWA user migration

The Android WebView has its own local storage sandbox. Existing PWA data does not automatically appear in the Android app.

Migration path:

1. In the existing PWA, open Settings.
2. Export a Swole Cat backup.
3. Install/open the Android app.
4. Import that backup from Settings.
5. Confirm routines, history, programs, PRs, preferences, and bodyweight history look correct.
6. Keep the old PWA data until the Android import has been verified.

V29 backup validation and the pre-import rollback snapshot protect the migration.

## Real-device smoke test

Use [ANDROID_TEST_CHECKLIST.md](ANDROID_TEST_CHECKLIST.md) for the Phase 0 device test. Record the exact app version shown in Settings with any failure report.

## Release path

The current workflow creates a debug install for testing. Before a production/Play Store release, the remaining release work is:

- release keystore generation and secure GitHub Actions secret handling
- signed AAB generation
- Play Store metadata
- launcher/adaptive icon and splash polish
- native Android back-button integration if the smoke test shows the current web navigation is insufficient
- native share/export improvements
- native rest-timer notifications
- optional Health Connect support
