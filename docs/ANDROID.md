# Swole Cat Android

Swole Cat uses Capacitor so the PWA and Android app share the same HTML, CSS, JavaScript, workout logic, and local data model.

## Package

- App name: Swole Cat
- Current app version: `0.43.0`
- Android version code: `43`
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

For v0.43.0 the artifact/file naming is:

- Artifact: `Swole-Cat-Android-v0.43.0-debug`
- APK: `swole-cat-v0.43.0-debug.apk`

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

## Launcher icon and splash

Android launcher and splash resources are generated from `resources/logo.svg` using `@capacitor/assets`.

The current baseline branding uses:
- Swole Cat cat/barbell mark
- dark `#0b0d12` icon background
- dark launch/splash background

These assets are intentionally production-clean but not treated as the final Phase 3 retro-futurist visual identity. Future visual refresh work can replace the source logo while keeping the same generation pipeline.

## Real-device smoke test

Use [ANDROID_TEST_CHECKLIST.md](ANDROID_TEST_CHECKLIST.md) for the Phase 0 device test. Record the exact app version shown in Settings with any failure report.

## Release path

The repository now contains a manual signed release workflow that produces both APK and AAB files after the private signing secrets are configured.

See [RELEASING.md](RELEASING.md) for the one-time keystore setup and release procedure.

Remaining Android product polish includes:

- launcher/adaptive icon and splash polish
- native Android back-button integration only if deeper testing shows the current navigation is insufficient
- native share/export improvements
- native rest-timer notifications
- optional Health Connect support


## Android Back behavior

v0.43.0 installs the Capacitor App plugin and handles Android Back inside Swole Cat.

Back behavior is intentionally layered:

1. Close an open app selector.
2. Close an open modal or confirmation surface.
3. Dismiss a focused form field.
4. Navigate to the previous in-app screen.
5. Fall back to Home when no prior screen is available.
6. At Home, require a second Back press within two seconds before exiting the app.

The App lifecycle listener also flushes pending workout edits before backgrounding, releases the wake lock while inactive, and restores workout chrome/wake-lock behavior when the app becomes active again.


## Android Behavior Pass 2

- v0.43.0 uses Capacitor Keyboard native resize behavior so focused controls stay usable when the software keyboard opens.
- visualViewport updates drive a dynamic app viewport height, and modal sheets respect safe-area and keyboard space.
- The bottom navigation temporarily hides while the keyboard is open to preserve working space.
- Capacitor StatusBar explicitly uses light icons on the Swole Cat dark background and coordinates edge-to-edge rendering with CSS safe-area insets.
- Android backup export writes the validated backup envelope to app cache and opens the native Android share sheet, allowing normal system save/share behavior.
- Browser/PWA export remains as a fallback.
- File inputs reset after import attempts so the same backup can be selected again without reopening Settings.
- Startup verifies that the app can write and read its local storage sandbox before additional training data is logged.
- Native app backgrounding continues to flush pending workout changes through the v0.42 lifecycle handler.

Core workout data remains local-first and continues to use the existing validated storage schema. v0.43.0 does not introduce a storage-engine migration.
