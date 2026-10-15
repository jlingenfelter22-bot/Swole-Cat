# Swole Cat | Functionality, Performance and Architecture Audit

**Checkpoint:** October 15, 2026. Baseline: signed Android **Testing v0.93.2 / versionCode 137**. Owner has accepted current Coach preview / keyboard **functionality**, and deliberately froze the **visual interface**. This is a *measurement and reliability* checkpoint before any major Coach capability expansion.

## Non-negotiable boundaries

- **No UI/UX visual changes:** do not alter component appearance, spacing, layout, animations, color, typography or interaction design as part of this audit without explicit user direction. Preserve the accepted v0.93.2 Coach keyboard experience.
- **No real data operations:** don't switch cloud accounts, reset WebView data, erase/rewrite workouts, merge identity-scoped records, touch Supabase tables or run destructive database migrations. Use *synthetic* workouts in isolated in-memory test state and backups in any later owner-approved device test.
- **No Beta updates:** Testing and Beta remain distinct and independently signed. Do not promote or change Beta without explicit approval.
- **No accidental re-release:** `.github/workflows/android.yml` publishes signed Testing artifacts from `main` when `scripts/**` changes. Keep audit instrumentation in an unmerged draft PR until deciding how to avoid overwriting an existing versioned signed Testing release. Do not bump the public version or republish a same-version APK just for benchmarks.
- Separate **correctness**, **synthetic CPU/DOM timing**, **physical WebView frame performance**, and **APK build-mode effects** in every report. CI success does not establish smoothness on Android.

## Phase A: repo audit findings (code inspection, not device timing)

| Area | Direct source evidence | Risk, hypothesis and required proof |
|---|---|---|
| Android package variant | `.github/workflows/android.yml` creates the user-installable permanently signed **`assembleDebug`** APK, signing it with the persistent Testing keystore. A distinct `release-android.yml` supports a release variant, but its keys are separate. | **High-priority experiment:** benchmark Android debug against an **optimized/release-like** app built with the *same Testing certificate*, package and isolated non-production state. Confirm actual `debuggable`, `minifyEnabled`, R8/shrinking, WebView debugging settings, update signing and deep links from real build artifacts. Never switch the Testing release pipeline based on guesswork. |
| History | `src/js/07-history-editor.js:renderHistory()` renders *every* completed session card via `sessions.map(...).join('')` into `historyList.innerHTML`. Multiple derived metrics are computed per card. | **Likely growth bottleneck** for hundreds or thousands of sessions. Measure cold History open, reload and scroll p95, nodes and allocation at 30/150/300/1000 sessions. Evaluate windowing or pagination only if supported by metrics, **without redesigning cards**. |
| Progress | `src/js/02-muscle-history-analytics.js:renderAnalyticsContent()` derives a number of metrics from whole session history, including progression, coverage, trends and exercise insights, then rebuilds main view markup. | **Potential CPU spike** for accumulated history. Measure total render, sub-computation timings and memory allocations at increasing fixture sizes. Cache indexes and move non-UI calculations out of the touch event hot path if necessary. |
| Workout display | `src/js/06-workout-engine.js:renderWorkout()` assembles a full focused exercise canvas and assigns its HTML via `workoutArea.innerHTML`; some set/structure actions rerender. | **Potential input/animation jank.** Measure set edit, Complete Set, next exercise, rest notch response and keyboard opening. Patch *only* the failing hot path, preserving focus, set completion, keyboard and autosave. |
| Local state | `src/js/01-core-runtime.js:save()` serializes the full state through `JSON.stringify(state)` and writes it to local WebView storage. Deferred writes exist (`scheduleStateSave(220)`). | **Possible cost over years of use.** Measure payload bytes, serialization + synchronous storage write p50/p95 with 30/150/300/1000 sessions. Assess IndexedDB storage or incremental records as a separate *backward-compatible, backup-first* project only if justified. |
| Existing optimizations | Cached `derivedSessionData()` and `exerciseCatalog()`, per-view revision checks, frame-queued navigation refreshes, local-only typing saves and sync hashing reuse. | **Keep existing wins**; repeat regression tests for cache invalidation and cloud safety with each optimization. |
| Bundle | `scripts/build-web.mjs` concatenates **36 JS/data modules** and **4 CSS layers** into a single unminified `www/app.js` and `www/app.css`. `performance-hardening-stress.mjs` enforces **1.5 MB JS / 300 KB CSS maximum**, but does not profile runtime. | Measure cold start, parse/compile cost and memory, and compare safe minification / lazy-loading prototypes, including offline PWA behavior and source map/debbuging requirements. Never promise benefits from bundle size alone. |
| CSS visual cost | `src/styles/03-polish.css` contains numerous gradients, shadows, masks, transitions and sticky panels. Prior work reduced some effects already. | GPU/rasterization cost is **not proven** by CSS size. On-device Perfetto/Android Studio traces should establish whether expensive paint/composite work is present before modifying accepted visuals. |
| Cloud | `src/js/10f-cloud-sync.js` schedules asynchronous background work, guards local-only state saves and maintains account conflict controls. | Observe sync/idle/foreground impact and verify no cross-account record contamination. Do not benchmark against the user's live cloud accounts or sacrifice integrity for speed. |

## Phase B: repeatable safe CPU/DOM baseline (implemented in this draft)

- `scripts/performance-audit-baseline.mjs` uses the **real bundled app code** and the existing realistic fixture routine under Node.js + jsdom, with fetch deliberately disabled.
- Generates temporary completed training sessions from known valid exercise objects. Measures history index **cold vs cached**, actual History DOM rendering, actual Progress rendering, and synchronous local saves at **30, 150 and 300 sessions**, plus indexing/saving at **1,000 sessions**.
- Writes machine-readable `performance-baseline.json` with each trial's elapsed wall time, bundle sizes, and serialized synthetic state bytes. The report is uploaded as a GitHub Actions artifact and tabulated in the workflow summary. *No production data; no network activity*.
- Workflows have runner noise, so first measurements are **observational, not thresholded pass/fail**. Use repeated comparisons with the same runner/setup and a meaningful sample count before adding threshold gates.
- **Limitation:** jsdom measures JavaScript and constructed DOM operations; **not** physical layout, paint, GPU load, frame pacing, Gboard, or low-end Android behavior. DOM fixture success is not device acceptance.

## Phase C: real Android acceptance and baseline capture (not yet performed)

Use an explicit owner-approved **testing-only, safely backed-up** workflow. Capture app version/build SHA, Android device and OS, display refresh setting, WebView and keyboard versions, device power/thermal state and background sync state. No app storage reset.

| User journey | Record |
|---|---|
| Cold launch, warm launch, Home and screen switches | first responsive action, startup p50/p95, frozen frames, WebView load / parse time |
| Workout: tap weight/reps, complete set, next movement, rest notch | tap-to-paint p50/p95, long JavaScript tasks, correctness/auto-save and actual focus |
| Coach: 3-day generation, refine, keyboard toggle, scroll | generation CPU time, total responsiveness, frame timeline, keyboard jank and unchanged program data |
| History & Progress with increasing **synthetic** data | open time, peak heap/DOM nodes, p95 frame time, scrolling dropped frames and back-navigation integrity |
| Offline, login, backup, signed updater, sync with safe test identities | request latency and interference, no duplicate records, safe owner isolation, restore/backup resilience |

**Targets to consider, not claimed results:** a 60 Hz display has ~16.7 ms/frame, but true budget is lower after platform work; track janky frames and ideally p95 tap-to-next-paint below 100 ms on the reference phone. Set device-specific goals only after observing baseline, then rerun with identical fixtures.

## Decision gates before more Coach features

1. Functionality gate: 94-step existing CI stays green, with targeted regression scenarios for keyboard, offline saves, program history, cloud identity/switch isolation, and signed updater.
2. Baseline gate: synthetics produced reproducibly with trend comparisons; Android critical-path traces captured and reviewed separately.
3. Optimization gate: only measured nonvisual changes are made, each with before/after evidence and unchanged data integrity. Avoid micro-optimizing a path without proven user impact.
4. Platform gate: benchmark current Capacitor WebView first, then compare a controlled **optimized Android build** that preserves installed-app signing, storage and update expectations. Consider native Compose/Svelte work only if specific bottlenecks persist despite focused optimization.
5. Owner's explicit approval gates any new Testing APK, Beta promotion, cloud migration, visual redesign, or major Coach feature expansion.

**Audit status:** Phase A code inspection complete; Phase B instrumentation proposed in draft PR pending CI runtime data; Phase C *not yet run*. No claim of measured Android FPS or fully completed audit.
