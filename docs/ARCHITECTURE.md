# Swole Cat Architecture

Swole Cat is a local-first web application packaged for Android with Capacitor. Beginning with v0.56, the source is organized by domain while the production build remains intentionally small and framework-free.

## Source layout

```text
index.html                    # Small application shell only
src/
  data/
    exercises.js              # Canonical exercise catalog
    anatomy.js                # Front/back muscle-map geometry
  styles/
    00-base.css               # Base layout, typography, core components
    01-design-system.css      # Retro-future identity and shared controls
    02-views.css              # Home, routines, exercises, workout, progress, history
    03-polish.css             # Native/touch polish, selectors, Coach, performance
  js/
    00-runtime.js             # Cross-domain service/event boundary
    01-core-runtime.js        # State, persistence, navigation, native behavior
    02-muscle-history-analytics.js
    03-programs.js
    04a-coach-input-intent.js
    04b-coach-programming.js
    04c-coach-language-refinement.js
    04d-coach-program-builder.js
    04e-coach-ui.js
    05-exercises-routines.js
    06-workout-engine.js
    07-history-editor.js
    08-exercise-tools.js
    10a-cloud-config.js         # Phase 8.1 build/runtime cloud configuration boundary
    10b-cloud-identity.js       # Provider-neutral optional-account shell
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

`src/js/00-runtime.js` establishes `window.SwoleCatRuntime` with a small service registry and event target. Device persistence is already routed through the registered `storage` service, and the core exposes a narrow `state` service for snapshot reads/revision/save requests. Existing application behavior remains local-first while new infrastructure can register isolated services without importing network/account concerns into the workout engine. Persisted changes emit `state:saved`, and completed startup emits `app:ready`, giving a future sync queue explicit hooks without coupling it to workout-domain functions.

Current Phase 8.1 services include:

- `cloudConfig`: disabled-by-default provider configuration
- `cloudAuthStorage`: auth-only namespaced storage, separate from workout state
- `identity`: provider-neutral account/session state

The identity shell performs no sync and makes no provider network calls by itself. A configured provider adapter must be registered explicitly.

Expected later services include:

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

## Cloud implementation contract

Phase 8.0 selected Supabase as the first hosted backend while preserving the local-first boundary above.

The provider-specific implementation, sync record model, backup strategy, conflict policy, security rules, zero-cost operating plan, and provider exit strategy are defined in `docs/CLOUD_ARCHITECTURE.md`.

Workout-domain modules must not import or call Supabase directly. Cloud work belongs behind runtime services so the backend can be replaced without rewriting training logic.

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

- `src/js/04g-coach-history-insights.js` owns v0.62 local training-history Q&A, trend summaries, consistency/recency analysis, and ranked Coach insights.

- `src/js/04h-coach-program-auditor.js` owns v0.63 whole-Program auditing, planned-vs-actual analysis, long-term findings, and opt-in review handoffs.
