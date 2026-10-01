# Swole Cat Architecture

Swole Cat is a local-first web application packaged for Android with Capacitor. Beginning with v0.56, the source is organized by domain while the production build remains intentionally small and framework-free.

## Source layout

```text
index.html                    # Small application shell only
src/
  styles/
    app.css                   # Swole Cat design system and view styles
  js/
    00-runtime.js             # Cross-domain service/event boundary
    01-core-runtime.js        # State, persistence, navigation, native behavior
    02-muscle-history-analytics.js
    03-programs.js
    04-coach.js
    05-exercises-routines.js
    06-workout-engine.js
    07-history-editor.js
    08-exercise-tools.js
    09-settings-ui-bootstrap.js
scripts/
  build-web.mjs               # Deterministic source -> production bundle
```

The numbered JavaScript files preserve the established execution order while isolating changes by product domain. This is a compatibility-first migration from the former single-file application, not a rewrite.

## Production build

`npm run build:web` produces the deployable `www/` bundle:

```text
www/
  index.html
  app.css
  app.js
  sw.js
  manifest.webmanifest
  assets/
  icons...
```

Source JavaScript is concatenated in an explicit order into `app.js`. Source CSS is emitted as `app.css`. The source shell's development references are replaced by the production assets during the build.

This gives us two useful properties:

1. Engineers work in smaller domain files with a much smaller blast radius.
2. PWA and Android users still load a compact production bundle instead of many runtime files.

The same build output is consumed by GitHub Pages and Capacitor so there is only one production web artifact path.

## Local-first data boundary

The current canonical local state remains `overload_v3`. v0.56 does not change the persisted data model, which keeps upgrades safe for existing users.

Future account/cloud work should not move workout-domain code directly onto network APIs. Instead, synchronization should be layered around the existing local state model:

```text
Workout / Routine / Program domains
              |
              v
       Local state + storage
              |
       -------------------
       |                 |
       v                 v
 Local-only mode    Optional sync adapter
                         |
                         v
                 Cloud/API transport
```

The app must remain usable when offline. Cloud sync should be optional infrastructure around local state, not a requirement for core workout behavior.

## Runtime service boundary

`src/js/00-runtime.js` establishes `window.SwoleCatRuntime` with a small service registry and event target. Existing application behavior remains untouched, while new infrastructure can register isolated services without importing network/account concerns into the workout engine.

Expected future services include:

- identity/account session
- sync queue and conflict resolution
- routine sharing transport
- group/program collaboration
- telemetry only if explicitly added with appropriate privacy controls

New services should expose narrow interfaces and communicate through domain data or runtime events rather than mutating unrelated UI modules directly.

## Future cloud rules

When account and sync phases begin:

- Local state remains authoritative while offline.
- Every synchronized record needs a stable ID and updated timestamp/version.
- Sync writes should be queueable and retry-safe.
- Conflicts should be resolved explicitly by record/domain rather than overwriting the entire app state.
- Shared routine/program templates must remain separate from each member's private performance history.
- Network failures must never block starting, logging, or finishing a workout.
- Authentication state must not be mixed into workout progression logic.
- Import/export backups remain supported independently of cloud accounts.

## Testing rule

Architecture changes are not considered complete unless the same production bundle passes the full regression suite.

CI currently:

1. Builds `www/` from the modular source.
2. Syntax-checks the bundled application and service worker.
3. Verifies the modular source/production boundary.
4. Creates an inline DOM test fixture from the production `app.js` and `app.css`.
5. Runs the full historical Swole Cat smoke/regression suite against that bundled code.
6. Android builds consume the same `www/` output.

This prevents the modular source tree and the shipped app from drifting apart.

## Dependency policy

Swole Cat remains vanilla HTML/CSS/JavaScript for now. A framework migration is not required to gain modularity. A bundler/framework should only be introduced later if it solves a concrete product or engineering need that the current deterministic build cannot handle cleanly.
