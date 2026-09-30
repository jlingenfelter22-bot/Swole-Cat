# Swole Cat

A local-first workout tracker and progressive-overload app.

## Data

Workout history is stored locally on each device. The GitHub repository contains app code only, not workout history.

The web/PWA install and the packaged Android app use separate local storage sandboxes. To move an existing user from the PWA to Android, export a Swole Cat backup from the PWA and import it on the Android welcome screen. V29 backup validation and pre-import snapshots protect that migration.

## PWA

Open the GitHub Pages site in Chrome on Android and choose **Install app** or **Add to Home screen**.

Changes committed to `main` automatically redeploy through the GitHub Pages workflow.

## Android

Swole Cat now has a Capacitor 8 Android build pipeline.

### Local development

Requirements:

- Node.js 22+
- Android Studio / Android SDK 36

First-time setup:

```bash
npm install
npm run prepare:web
npx cap add android
npm run android:sync
npm run android:assets
npx cap open android
```

After normal web changes:

```bash
npm run android:sync
```

Build an installable debug APK:

```bash
npm run android:build:debug
```

The APK is written under:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### GitHub Actions APK

The **Build Swole Cat Android** workflow creates a fresh Capacitor Android project from the current web source, generates the native Swole Cat icon/splash assets, builds a signed debug APK, and uploads it as the `Swole-Cat-Android-Debug` workflow artifact.

The generated `android/` directory is intentionally not committed yet. The web app remains the source of truth, while CI generates a reproducible Android shell around it. Native Android code can be committed later when Swole Cat starts needing custom platform code that cannot be expressed through Capacitor configuration/plugins.

## Android package identity

- App name: **Swole Cat**
- Application ID: `app.swolecat.tracker`
- Capacitor major version: **8**
- Minimum Android SDK inherited from Capacitor 8: API 24

## Updating

Normal workout features continue to be built in `index.html` and are shared by the PWA and Android package.

For Android, a new APK build is produced after relevant changes. The eventual Play Store release can use the same codebase and an AAB/signing workflow.
