# Swole Cat

Swole Cat is a local-first workout tracker built around progressive training, flexible routine tracking, and a growing Android experience. It runs as an installable PWA and is packaged for Android with Capacitor.

## Live PWA

https://jlingenfelter22-bot.github.io/Swole-Cat/

## Android

The Android app shares the same HTML, CSS, JavaScript, workout logic, and `overload_v3` data model as the PWA.

- Capacitor 8.5.2
- Android application ID: `com.jlingenfelter.swolecat`
- Android API 36 build target
- Automated debug APK builds through GitHub Actions
- Existing PWA users migrate by exporting a Swole Cat backup and importing it on first Android launch

See [docs/ANDROID.md](docs/ANDROID.md) for build and migration details.

## Product Roadmap

The canonical feature roadmap, implementation order, and locked long-term product direction live in [docs/ROADMAP.md](docs/ROADMAP.md).

## Data

Workout data is local to the device. Export backups periodically, especially before clearing browser/app storage or moving between the PWA and Android app.

## Development

The web app remains intentionally lightweight and framework-free. Source code is modularized by domain under `src/`, then assembled into the production `www/app.js` + `www/app.css` bundle used by both GitHub Pages and Capacitor. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the source layout and future sync/cloud boundaries.

```bash
npm install
npm run build:web
```

For Android:

```bash
npm run android:debug
```
