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

## Initial measured results (PR #79, GitHub Actions run 38692152281)

Baseline: [Synthetic Performance Baseline CI](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38692152281), Node 22 + jsdom 24 on a GitHub-hosted Linux runner, **three-repetition medians**. Measurements vary across runners and runs; do **not** read these numbers as Android touch response, frame time, FPS, or verified production performance.

| Synthetic history size | History DOM render | Progress DOM render | Cold history indexing | Whole-state save |
|---:|---:|---:|---:|---:|
| 30 sessions | 106.6 ms | 39.7 ms | 1.6 ms | 0.7 ms |
| 150 sessions | 228.4 ms | 71.2 ms | 7.2 ms | 1.9 ms |
| 300 sessions | 439.8 ms | 105.6 ms | 9.3 ms | 4.7 ms |
| 1,000 sessions | Not rendered | Not rendered | 35.8 ms | 11.4 ms |

Further reference figures (same CI): exercise catalog full render **198.2 ms** (30-history scenario) and **181.2 ms** (300-history scenario); focused workout canvas **7.2 / 4.8 ms**. Full 3-day Coach prompt handling plus generation **1,203.7 / 1,144.1 ms**, whereas **rerendering the already-computed Coach preview** was only **9.3 / 8.8 ms** respectively. These times are CPU and jsdom operations and do **not** include a real phone's compositor. Synthetic 1,000-session storage snapshot was **3,952,952 bytes**; built JS **1,122,166 bytes**, CSS **229,723 bytes**.

**Follow-up stage isolation:** [CI run 38692442211](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38692442211) repeated the synthetic benchmark with single-day Coach stage checks. With 30 / 300 sessions, end-to-end Coach prompt processing + generation took **763.6 / 746.4 ms**, preview rerender **6.6 / 5.4 ms**, isolated selection for one previously computed day **4.5 / 9.1 ms**, and isolated time budgeting for that day approximately **0.1 / 0.1 ms**. This strongly argues against a *single* preview render or *single* day-duration trim being the dominant cost, but does **not** identify which earlier NLP, feasibility, scoring, plan-level regeneration or repeated calls account for total elapsed time. Instrument call counts and inclusive/exclusive wall time across `coachSubmitPrompt` before optimizing. The absolute numbers varied significantly across runs, illustrating why they are **observational CI data, not Android performance gates**.

**High-value leads, not proven production root causes:**

1. **Coach planning computation (priority A).** Preview DOM rerender is a tiny fraction of end-to-end three-day generation on this synthetic test. Instrument planner sub-phases and rule/selection loops; measure on Android before changing algorithms or correctness.
2. **History full-list DOM render (priority A).** Roughly scales with completed-session count; rendering 300 cards took hundreds of milliseconds in jsdom. Isolate metric computation versus markup creation / DOM parse; compare Android long-history traces. Optimize without altering accepted card design.
3. **Full exercise catalog rebuild (priority B).** Generating the 308-item library is a measurable one-shot operation. Analyze repeat-search and filter changes, reuse/scheduling or smaller updates only if real navigation is janky.
4. **Progress analytics (priority B).** The 300-session scenario took ~106 ms in synthetic DOM; prioritize sub-computations and on-device data before changing behavior.
5. **Local storage / history indexes (monitor).** An entire synthetic 1,000-session save was ~11 ms in jsdom and indexes ~36 ms; currently a less compelling *initial* bottleneck than Coach generation and full-list rendering. Still important as data grows, especially slower devices and storage behavior.

The audit currently reports *baseline observations* rather than absolute perf regressions. We need repeatability on a stable CI runner, and a separate actual Android frame trace, before setting strict frame-time, memory, startup or jank release gates.

---

## First nonvisual performance optimization: Coach program parsing (draft, not released)

**Profiling evidence:** [pre-change CI run 38696266821](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38696266821) measured `coachParseExplicitWorkout()` **~1,136–1,150 ms** inclusive for a natural-language, three-day PPL brief with weekday-specific times and equipment. By comparison, actual three-day `coachGenerateProgram()` took **46–61 ms**, and preview DOM render **~11–12 ms**. The expensive parser searched the entire fuzzy exercise-name catalog for day/time/equipment chunks despite a program-wide request.

**Nonvisual fix in draft PR #79:** preserve exact matching, aliases, explicitly negated exercise IDs and all standalone exercise prescriptions; skip the fuzzy-approximate fallback specifically when `programIntent.isProgram` and the prompt **doesn't** contain indicators of an explicit movement/prescription list (`include`, `add`, `exercises`, `sets`, `reps`, etc.). Apply equally to main modal `coachSubmitPrompt()` and Home `homeCoachBuildPrompt()`. Exercise lists within program requests and non-program prompts continue to use fuzzy matching, including typo clarification. Existing program selection, durations, week review, schedule, progression and cloud flows are unchanged. New test `scripts/coach-program-parse-fastpath-stress.mjs` checks the boundary and no saved-data mutation.

**After change:** [post-change CI 38696932123](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38696932123) with the same synthetic prompt recorded `coachParseExplicitWorkout()` **17–21 ms**, and end-to-end Coach program **~52–62 ms median**. Compare with earlier `coach_program_generate` **~1.16–1.18 seconds** on pre-change CI run 38696266821. This is an **order-of-magnitude improvement in synthetic JS/DOM processing**, but CI runner variation, JavaScript warm-up and lack of real Android tracing prohibit claiming a guaranteed phone-level speedup. Check hardware after safe release approval.

**History root-cause isolation:** on pre-change CI 38696266821 at 300 sessions, full `renderHistory` was ~460 ms, **markup construction ~80 ms** and **DOM parsing ~388 ms**. This justifies evaluating windowing/incremental update approaches in a *separate* opt-in performance pass, **without changing card design or existing interactions**. No History production changes were made in the first optimization.

**Release boundary:** this branch remains draft/unmerged until the exact-head full functionality regression and a version-safe Testing publication plan are reviewed. No Beta change, cloud data write, APK publication, UI redesign or live data performance test has occurred.

---

## Second nonvisual performance optimization: History progressive DOM rendering (draft, not released)

**Source-backed root cause:** before change, `src/js/07-history-editor.js:renderHistory()` concatenated the HTML for every session card, then assigned it to `historyList.innerHTML` in a single synchronous DOM operation. Synthetic CI run [38696266821](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38696266821) measured ~**460 ms** for an initial 300-session History render (~80 ms markup computation; ~388 ms DOM parsing).

**Change:** preserve the **exact existing History card HTML and inline actions**, but render only the **newest 24 sessions** initially. Older workouts append in **24-card batches** when the window scroll nears the bottom of History. No extra visible controls, loading placeholders, changed CSS, or card redesigns. Keep original descending session order and overall lifetime sequence numbers (latest of 300 remains 300, oldest remains 01). Appends don't replace already-visible DOM, which prevents focus and scroll position resets. `renderHistory()` preserves the number of previously revealed cards on edit/delete refreshes. When history is empty, retain original empty-state copy. The scroll listener is passive and coalesced to one animation frame; it does nothing when History is inactive. Data source remains the same `derivedSessionData().sessionsDesc`, without storage, backup, cloud or account changes.

**Benchmark evidence:** after change, [CI run 38757877040](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38757877040) measured **~26.3 ms** median for initial 24 History cards when **300 sessions** exist, versus ~460 ms previously to paint all 300: approximately **94% less initial DOM CPU time** in jsdom. *Not apples-to-apples for total work*: if you scroll all the way through older workouts, additional card batches still need to be appended (the synthetic test measured **~246 ms** combined to append the remaining 276). The improvement is lower **time-to-first-visible-history**, not elimination of the work of displaying all sessions. 30-session initial History measured ~36 ms, and jsdom timings vary between runner jobs. No Android frame-time measurements have been made.

**Regression coverage:** new `scripts/history-progressive-render-stress.mjs` checks initial 24 cards, all 75 historical sessions accessible via append, unchanged recap/edit/manage/metrics, correct sequence numbers and card DOM preservation, scroll-triggered append, no background append when History is inactive, preservation of loaded depth after a synthetic deleted session, and original empty state after clearing all. Existing `scripts/history-density-stress.mjs` continues to protect visual structure. Full code + baseline workflows must pass at final PR HEAD; no release/merge yet.

**Remaining physical-device proof:** repeat History navigation and scroll near 24-card boundaries on Android, including loading hundreds of sessions, leaving/returning to History, opening older-session recaps, and edit-refresh at depth. Verify that scroll position and existing visuals remain unchanged with the device compositor, and measure frame jank/p95 to ensure appending 24 cards does not itself cause noticeable scroll hitches. If observed, tune batch size or use an idle budget without changing UI.

---

## Third nonvisual optimization: Exercise Library bounded initial DOM (draft PR #80, October 18, 2026)

**Scope:** A separate draft branch based on published Testing v0.93.3. The owner asked to resume core performance engineering after parking the future trainer/client concept. The installed v0.93.3 physical-phone acceptance report is still pending; do not claim it passed. Visual appearance and library behavior remain frozen.

**Finding:** The Exercises screen previously rebuilt every `.list-item` for the full exercise catalog in a single `innerHTML` assignment, including schematic thumbnails and inline actions, on first open and on search/filter/favorite changes. Recent earlier synthetic Node+jsdom 30/300-history test runs measured whole-library renders around **120–140 ms** (separate runner runs show ~180–200 ms). This is not physical WebView FPS.

**Change (draft only):** the first render processes **32 matching exercise cards**. Additional rows append in 32-item chunks as window scrolling reaches the list's end. The full filtered/sorted collection is still retained in memory, so every result is accessible by scrolling; changing search or filters resets the rendered slice. Subsequent refreshes with identical filter parameters keep already-visible depth. Scroll work is passive, one-per-animation-frame and disabled when the Exercises view isn't active. **Row markup is identical** (thumbnail, labels, favorite/preference badge, edit/detail handlers) and there are no CSS, copy, graphics or layout changes.

**Preliminary measurement:** [draft benchmark CI #39151448359](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/39151448359) passed. At 30 synthetic sessions, first library render was **27.2 ms**; at 300 sessions it was **19.5 ms**, vs previous whole-catalog ~120–140 ms. Rendering the *rest* of the catalog still has cumulative cost: **~133–144 ms** for appended rows, spread over scroll activity. Different CI runs/runners vary; these are indicative CPU/DOM timings and cannot certify phone-level smoothness. A physical Android test must check scroll-batch hitching and search/filter responsiveness.

**Reliability checks:** `scripts/exercise-library-progressive-render-stress.mjs` validates initial 32 cards, full catalog reachability, unchanged sorted IDs/actions, append preserving DOM nodes, search result exhaustiveness, favorite/hidden filters, reset on query/filter changes, scroll only when active, empty state and unchanged training records. Added to the existing full validation workflow. Exact-branch-head CI completion required before considering any Testing release.

**Release discipline:** No version bump, no PR merge, no signed Android package, no Beta or cloud/account changes in this draft. Keep the future trainer/client proposal parked in `docs/FUTURE_TRAINER_PLATFORM_CONCEPT.md`. Benchmark the optimized Android build variant separately with controlled signing and migration considerations; do not flip the released debug build mode during this change.

---

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

**Audit status:** Phase A repository code inspection and Phase B baseline instrumentation **complete in draft PR #79**, including successful synthetic CPU/DOM benchmark CI. The exact-head full regression run is an independent requirement. **Phase C real Android profiling has not yet run**. This is a measurement-first initial audit, not completed production performance acceptance or a claim of measured Android FPS.
