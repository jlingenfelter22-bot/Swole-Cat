# Swole Cat Product Roadmap

This document is the canonical product roadmap for Swole Cat. Features listed as **Locked** are intended product direction unless a later technical or product decision explicitly replaces them.

## Product Principles

1. **Local-first stays valuable.** Core workout tracking should remain usable without an account or network connection.
2. **A routine is a blueprint.** Workout history, weights, reps, progression, notes, and personal stats belong to the individual user, even when a routine is shared.
3. **Training logic is configurable per routine/program.** Swole Cat began as a progressive-overload tracker, but it should support multiple ways of training without forcing every routine through the same progression algorithm.
4. **History should become more useful over time.** Completing a workout should create a durable, visual record that can be revisited from the calendar/history.
5. **Social features should enhance training, not turn Swole Cat into a generic social network.**
6. **Visual identity should evolve without sacrificing usability.** Swole Cat should preserve the clean information architecture, sizing, readability, and fast workout flow while developing a distinctive dark retro-futurist/cyberpunk visual identity.
7. **Fitness should not be gatekept by friction.** Core fitness functionality should not be gatekept behind ads, intrusive monetization, or a maze of in-app purchases. Swole Cat should prioritize helping someone open the app, build or start a workout, train, and leave with useful history and guidance.

---

## Phase 0 — Android Packaging and Release Foundation

**Status: In progress through v0.43.0**

Goal: turn the hardened PWA into a reliable Android app while keeping one maintainable web codebase.

- [x] Capacitor Android packaging
- [x] Automated debug APK build through GitHub Actions
- [x] Test packaged Android app on real devices
- [x] Fix Android back-button navigation and native app lifecycle persistence in v0.42.0
- [x] Finish Android keyboard, safe-area/status-bar, native backup export/share, file-import reuse, and device-storage write verification in v0.43.0
- [x] Finalize launcher icon and splash/launch experience (baseline Swole Cat branding; visual identity can evolve in Phase 3)
- [x] Add explicit app versioning
- [x] Create signed release APK/AAB workflow (pipeline code complete; first signed build requires one-time private keystore secrets)
- [x] Document release/update process

**Exit criteria:** Swole Cat can be installed as a polished Android app and updated without creating a second codebase.

---

## Phase 1 — Routine and Program Editing Fundamentals

**Status: Complete through v0.32.0**

**Priority: Very high**

Goal: remove basic friction from managing routines before adding more advanced training logic.

### Locked: Full routine editing
- [x] Rename an existing routine/program
- [x] Edit routine description/notes
- [x] Reorder exercises
- [x] Add/remove exercises after creation
- [x] Edit exercise targets without rebuilding the routine
- [x] Duplicate a routine
- [x] Archive/delete routine with clear safeguards
- [x] Preserve existing workout history when a routine is edited

### Locked: Training mode selector

**Status: Initial implementation complete in v0.31.0.** Routines have their own mode, and programs can either respect each routine or override the mode for program-launched workouts.

Every routine/program should have a configurable training mode. The first version should support:

1. **Guided Progressive Overload**
   - Existing Swole Cat progression behavior
   - Uses recent performance to recommend when to increase load/reps
   - Keeps the progressive-overload experience that originally defined the app

2. **Strength-Focused Progression**
   - Designed for users primarily trying to increase strength/load
   - Allows lower-rep target ranges, heavier loading, longer rest assumptions, and progression rules appropriate to strength-oriented training
   - Exact recommendation logic should be researched and specified before implementation rather than hardcoded from assumptions

3. **Track Only / Standard Workout**
   - No forced progression recommendation
   - User logs sets, reps, weight, RPE/RIR/notes as desired
   - Swole Cat still records history, PRs, volume, and analytics

### Architecture requirement
- Training mode belongs to the **routine/program**, not globally to the user
- A user can have different modes on different routines
- Changing a routine's mode must not rewrite historical workout data
- Exercise-level overrides may be added later if useful

---

## Phase 2 — Training Engine and Smarter Progression

**Status: Core mode-aware engine complete in v0.31.0. Advanced progression research remains an expansion area.**

**Priority: High**

Goal: expand Swole Cat from a single progressive-overload workflow into a flexible training tracker while keeping recommendations understandable.

### Locked: Mode-aware progression engine
- [x] Separate progression logic from UI so different mode algorithms can coexist
- [x] Guided Progressive Overload rules
- [x] Strength-focused load-priority progression rules (initial implementation)
- [x] Track-only mode that never pressures the user to increase load
- [x] Clear explanation of why a recommendation was made
- [x] Allow user to accept, ignore, or manually override recommendations
- [x] Preserve manual changes as part of workout history

### Research/spec work before implementation
The strength and progression systems should be based on established training concepts rather than treating “strength” and “progressive overload” as scientifically unrelated ideas. Product modes are different **workflows and recommendation strategies**, while progressive overload remains a broad training principle.

Areas to evaluate:
- rep-range progression
- double progression
- load jumps
- percentage-based progression
- RPE/RIR-based progression
- deload/stall handling
- warm-up versus working sets
- exercise-specific progression behavior

---

## Phase 3 — Visual Identity Refresh

**Status: Visual identity passes complete through v0.36.0. UI Tuning Pass 1 completed in v0.37.0 from a real-device screen-recording review, including Android system-bar integration, bottom-dock integration, and schematic exercise artwork. UI Tuning Pass 2 completed in v0.38.0 with app-owned selectors and responsive Settings toggles. UI Tuning Pass 3 completed in v0.39.0 with removal of the persistent install control from the header. UI Tuning Pass 4 completed in v0.40.0 with a single contextual pause/resume icon control, true paused-time tracking, and a recognizable gear settings icon. Additional user-directed sizing and micro-UI adjustments remain iterative. Performance Pass 1 completed in v0.41.0, removing redundant navigation saves, batching continuous-input autosaves, caching unchanged heavy views, reducing Android paint cost, and adding performance regression coverage. Android Behavior Pass 1 completed in v0.42.0 with native Back navigation, layered transient-UI dismissal, protected double-back root exit, and explicit native app-state persistence/wake-lock handling. Android Behavior Pass 2 completed in v0.43.0 with native keyboard resizing, dynamic viewport/safe-area handling, explicit status-bar styling, Android share-sheet backup export, reusable file imports, and startup storage-write verification.**

**Priority: High**

Goal: give Swole Cat a distinctive, premium visual identity without changing the underlying layout, information hierarchy, touch-target sizing, or fast workout flow that already works well.

### Locked: Dark retro-futurist / cyberpunk visual direction
The intended style is a restrained, polished blend of:
- dark-mode foundation
- sleek futuristic surfaces
- subtle 1980s retro-future influence
- cyberpunk-inspired accents
- selective neon/glow treatment
- high-contrast typography and data visualization
- premium motion and interaction feedback
- a recognizable Swole Cat visual language

The visual direction should feel **futuristic and energetic, not noisy or gimmicky**. Readability and fast gym use always win over decoration.

### Locked: Preserve the existing UX structure
This phase is a **fresh layer of paint**, not a ground-up interface redesign.

Preserve unless testing shows a real UX problem:
- current screen hierarchy
- major navigation patterns
- card sizing and information density
- large touch targets
- quick scanning during a workout
- responsive/mobile-first behavior

### Design-system work
- [x] Define color tokens, surfaces, borders, glow levels, text hierarchy, and state colors
- [x] Standardize cards, buttons, inputs, pills, tabs, modals, dialogs, and progress indicators
- [x] Define icon style
- [x] Define typography scale
- [x] Define motion/transition rules
- [x] Define data-visualization styling for charts, progress, PRs, and future heat maps
- [x] Make visual states accessible and distinguishable without relying only on color
- [x] Keep effects performant on Android devices

### Why this phase comes here
The visual system should be established before building the workout-completion recap, muscle heat maps, richer history screens, sharing surfaces, and social/group UI. That avoids styling each major new feature twice.

---

### Performance guardrails

Performance is an ongoing product requirement, not a one-time cleanup.

- [x] Remove redundant synchronous persistence from ordinary navigation
- [x] Batch rapid weight/reps/notes autosaves while preserving flush-on-navigation/background safety
- [x] Reuse already-rendered heavy views until persisted state changes
- [x] Use instant top-level navigation rather than animated page scrolling
- [x] Add offscreen rendering containment for long exercise/history lists
- [x] Reduce expensive Android navigation-bar paint effects
- [x] Add automated performance-behavior regression coverage
- [ ] Repeat device profiling before major feature milestones and store releases


## Performance Hardening — Iterative

**Status: Performance Pass 1 complete in v0.41.0.**

Performance is treated as an ongoing product requirement, not a one-time cleanup.

- [x] Nonblocking top-level navigation
- [x] Reuse already-rendered navigation views and refresh stale views after the tap paints
- [x] Batch continuous workout input persistence instead of writing local storage on every keystroke
- [x] Flush pending edits safely when the app backgrounds or unloads
- [x] Cache derived session/history lookups used across Exercise, Progress, and coaching screens
- [x] Cache exercise catalog lookups
- [x] Use offscreen rendering containment for long Exercise and History lists
- [x] Remove native bottom-dock blur cost
- [x] Shorten interaction motion timing for a sharper response
- [x] Expand/collapse workout exercises without rebuilding the full workout DOM
- [x] Update weight/rep micro-step controls without rebuilding the full workout DOM
- [x] Remove duplicate persistence work when completing a set
- [ ] Repeat performance profiling after muscle heat maps and richer history are implemented
- [ ] Repeat performance profiling before signed/public release

**Performance principle:** visual response should happen before expensive persistence or derived-data work whenever safety allows. Workout data durability must remain protected during app backgrounding and shutdown.

---

## Phase 4 — Workout Completion Experience

**Priority: High**

Goal: finishing a workout should feel rewarding and produce a useful summary, not simply close the session.

### Locked: Post-workout completion summary
When the user taps **Finish Workout**, show a polished recap including:
- [x] Routine/workout name
- [x] Completion date and time
- [x] Workout duration
- [x] Exercises completed
- [x] Working sets completed
- [x] Total reps
- [x] Total training volume where meaningful
- [x] Personal records hit
- [x] Muscle groups trained (current exercise-category metadata; richer primary/secondary mapping follows in Phase 5)
- [x] Notable progression versus prior sessions
- [x] Front/back muscle heat map

The summary should use the refreshed Swole Cat visual system and feel like a premium completion moment.

**v0.44.0:** Workout Recap Foundation implements the non-heat-map recap experience using existing session/exercise metadata and actual prior workout history.

**v0.45.0:** Structured muscle metadata + front/back heat-map foundation completes the Phase 4 recap. Heat intensity is based on transparent primary/secondary set-equivalent weighting and explicitly does not claim muscle damage or recovery state.

**v0.46.0:** Heat Map Visual Redesign introduced a clearer involvement scale and Swolecat framing, but real-device review showed the hand-built body still read too much like a segmented mannequin.

**v0.46.1:** Anatomical heat-map hotfix replaces the hand-built body with granular front/back anatomical SVG path data adapted from the Apache-2.0 `body-muscles` project. Swolecat keeps its own scoring, colors, legend, and cyberpunk presentation while using a substantially more recognizable anatomical base.

**v0.46.2:** Muscle-map data audit checks all 307 built-in exercises for drawable primary/secondary muscle coverage, corrects compound/full-body/deadlift/carry/adduction edge cases, and adds synthetic push/pull/leg/posterior-chain/carry stress tests for heat-map aggregation and intensity.

---

## Phase 5 — Muscle Mapping, Heat Maps, and Rich History

**Priority: High**

Goal: make workout history visual and genuinely useful.

### Locked: Exercise muscle metadata

**Status: Initial structured resolver complete in v0.45.0.** Built-in exercises resolve primary/secondary muscle regions and movement family from the existing muscle + movement-pattern taxonomy; custom exercises persist resolved metadata for portability.

Each exercise should support structured metadata such as:
- primary muscle groups
- secondary muscle groups
- movement family
- optional weighting/intensity contribution for visualization

### Locked: Muscle heat map
- [x] Polished Swolecat front-body muscle illustration
- [x] Polished Swolecat back-body muscle illustration
- [x] Highlight muscles trained in the completed workout
- [x] Differentiate primary versus secondary involvement
- [x] Use intensity levels to communicate relative involvement without pretending to measure physiological muscle damage
- [x] Match the Swole Cat visual system

### Locked: Historical workout recap
From the calendar/history, tapping a completed workout should reopen a durable recap containing:
- [x] all exercises performed
- [x] actual sets/reps/weight
- [x] duration
- [x] total volume
- [x] PRs
- [x] notes
- [x] muscle groups
- [x] front/back heat map
- [x] comparison to prior performance when useful

**v0.47.0:** Historical Workout Recaps reuses the durable completion recap from both History and the Progress calendar, adds exact completed set rows and exercise notes, and computes progression only against sessions that occurred before the historical workout being viewed.

### Later extension
- [x] weekly/monthly muscle-group coverage
- [x] training-frequency visualization

**v0.48.0:** Muscle Coverage + Frequency adds this-week and month-to-date muscle coverage using the same audited primary/secondary set-equivalent engine as the session heat map, upgrades the existing workload comparison to that same model, and adds an 8-week per-muscle session-frequency strip.
- recovery/fatigue guidance deferred to a later advanced-guidance phase after the core product is mature; if added, it must remain conservative and based on recorded training rather than pretending to measure readiness

---

## Phase 6 — Coach Swole Cat / Quick Build

**Status: In progress through v0.64.0**

### Product intent: useful, not bloated
Coach Swole Cat should reinforce the core product philosophy rather than turn the app into a noisy AI product.

The experience should remain:
- ad-free
- free of manipulative upgrade prompts during training
- fast to open and use
- useful offline wherever practical
- focused on helping the user train, not maximizing time spent in the app
- understandable without requiring a subscription just to access basic workout generation or logging

The goal is not to create an endlessly conversational fitness assistant. The goal is to make evidence-backed workout creation dramatically faster while keeping the user in control.


**Priority: Medium-high**

Goal: let a user create a useful workout or full routine in seconds without manually searching through the exercise library.

**v0.49.0: Coach Swolecat Quick Build Foundation** — Initial local deterministic builder: natural-language target/time/equipment parsing, concise missing-info follow-ups, evidence-versioned hypertrophy/strength/general presets, audited muscle matching, preference-aware exercise ranking, movement-pattern balancing, preview/swap/remove controls, temporary Start Now workouts, and explicit Save as Routine.

**v0.50.0: Adaptive Home Launchpad** — Rebuilds Home around the user's next action instead of duplicating navigation. Active workouts become Resume-first, active programs surface the next workout, saved-routine users get a direct Start action, and brand-new users land on Coach Swolecat with Build Manually as the alternate path. Zero-value telemetry and generic empty-state clutter are hidden until training history exists. The generic 3-day starter is retired from the product and onboarding.

**v0.50.1: Adaptive Routines Priority** — The Routines tab now prioritizes actual content: existing Programs render first when present; when no Programs exist, Workout Routines move to the top and the empty Programs state becomes a compact secondary creation prompt below them.

**v0.50.2: Save Completed Workout as Routine** — Completed workout recaps can now create a reusable routine after the fact. This is especially useful for temporary Coach Swolecat Quick Build sessions started without saving first. Exercise order and original programming config are preserved when available, completed-set counts are respected, historical sessions remain unchanged, existing-routine sessions use a clear “Save Copy” action, and duplicate saves from the same completed session are guarded.

**v0.50.3: First-Time Weight Autofill** — When an exercise has no previously logged history, the first positive working-set weight entered during a workout is copied once into the remaining empty working sets for that exercise. Existing weights, completed sets, warm-up/drop/failure sets, and exercises with prior history are never overwritten. Typed values now commit only after the active weight field is finished, preventing partial multi-digit entries from seeding other sets.

**v0.50.4: Multi-Digit Weight Autofill Hotfix** — First-time weight propagation no longer relies on a short typing debounce. While the source weight field has focus, partial values such as `1` or `10` cannot seed the remaining sets. Leaving the field commits the final value, so entering `100` fills eligible blank working sets with `100`. The increment/decrement controls retain their immediate autofill behavior.

**v0.51.0: Conversational Coach Refinement + Program Handoff** — Coach Swolecat now keeps the generated workout as a live local draft that can be refined in natural language instead of forcing a new request. Users can change session duration, training goal, equipment constraints, muscle emphasis, and named exercises with commands such as “make it 30 minutes,” “no barbells,” “more chest,” “strength focused,” “remove bench press,” or “add lateral raises.” Explicit exercise requests override Coach ranking when they satisfy hard equipment/visibility constraints. Manual Remove/Swap choices persist through later refinements. Recent exercise history is used only as a light variety signal and recent target-muscle context, never as a recovery/readiness diagnosis. Generated workouts can now be saved directly into an existing Program or used to create a new Program.

**v0.52.0: Multi-Day Program Builder** — Coach Swolecat can now build complete 2–6 day Programs from natural-language requests such as “3-day PPL, Monday/Wednesday/Friday, 45 minutes” or “4-day upper/lower, dumbbells only.” Explicit frequency, weekdays, split, goal, time, equipment, and muscle-emphasis instructions are parsed into a weekly plan. When the user does not request a split, Coach uses transparent frequency-based defaults: 2–3 days favor full-body distribution, 4 days favors upper/lower, 5 days uses upper/lower plus push/pull/legs, and 6 days uses push/pull/legs twice. These are practical defaults rather than claims of universal superiority. Exercise selection balances target coverage across each session, lightly discourages repeating the same exact exercise across the week when alternatives are available, respects Favorite/Prefer/Avoid/Hidden settings, and preserves manual per-day Remove/Swap choices. The preview exposes approximate weekly primary/secondary set-equivalents, supports whole-program conversational refinement, and saves each day as a standard Swole Cat Routine inside one standard Program.

**v0.53.0: Voice Dictation + Exact Workout Prescriptions** — Coach Swolecat now supports microphone dictation on Android and compatible browsers. Tapping the mic transcribes speech into the visible Coach input so the user can review or edit what was heard before building. The Android app uses native speech recognition with permission handling; browser/PWA builds fall back to the Web Speech API where available. Coach also recognizes explicit exercise prescriptions such as “3 sets bench press for 8, 3 sets pull-ups for 9, 2 sets barbell curls for 12, 3 sets squats for 8” and preserves the requested exercise order, set count, and per-exercise rep targets when previewing, saving, or starting the workout. Common spoken gym aliases such as “bench,” “pull ups,” “squats,” and “curls” resolve to canonical library exercises. Mixed prescriptions show Custom sets / reps rather than a misleading single global target.

**v0.53.1: Explicit Exercise Routing + Mic Visibility Hotfix** — Named exercises now outrank the generic Coach questionnaire. A request such as “bench press, squat, dumbbell curls” is treated as an explicit workout list even when the user omits sets, reps, target muscles, or session duration; missing prescription values receive normal Coach defaults without asking irrelevant “what are we training?” or “how much time?” questions. More flexible language such as “bench press for three sets” is supported. Coach preserves the named exercise list instead of substituting generated movements. The microphone control is now visually embedded inside every Coach text field with a high-contrast cyan treatment so the voice affordance is obvious on mobile.

**v0.53.2: Surgical Explicit-Workout Refinement Hotfix** — Once a Coach workout is created from an explicit user-authored exercise list, the Refine flow now stays in list-edit mode instead of falling back to the workout generator. Commands such as “can you also add a set of assisted pull-ups?”, “make bench press 4 sets of 6 reps,” and “remove Bulgarian split squats” edit only the named exercise/configuration. Existing exercises, order, and custom set/rep prescriptions remain intact. Explicit refinements never inject unrelated exercises through target-muscle regeneration.

**v0.54.0: Coach Brain + Insights Foundation** — Coach Swolecat now uses a shared gym-language interpretation layer instead of a small exact-alias table. The resolver includes expanded lifting slang, common abbreviations, speech-mistake normalization, fuzzy string/token matching, confidence scoring, and ambiguity detection across the full exercise catalog. High-confidence slang and known speech errors resolve directly; crowded medium-confidence matches trigger a specific exercise clarification instead of silently guessing. Native Android and browser speech flows can score multiple recognition alternatives and prefer the transcript that requires the least repair while matching the strongest gym-language structure. Users can teach local aliases with phrases such as “when I say spider boys I mean spider dumbbell curl,” and those aliases persist only in local Swole Cat state. Coach also gains the first non-chat Insight: when sufficient recent history exists and a major training area has been absent for roughly two weeks while other training continued, Home can surface that descriptive observation with a one-tap Coach build. Insights are suppressed during active workouts and active Programs and never claim recovery, injury, readiness, or a requirement to train a muscle.

**v0.55.0: Workout Programming Intelligence + Lifting Grammar Foundation** — Coach now builds generic workouts from explicit coverage roles before filling remaining session time. Semantic targets such as singular “arm” are preserved, requested Arms reserves direct biceps and direct triceps isolation work, and multi-area sessions guarantee primary work for each requested area when compatible exercises exist. Exercise selection uses movement-family caps, stronger redundancy penalties, practical staple bias, session-breadth-aware exercise counts, and role-preserving swaps. Common duplicates such as multiple chest-supported row variants, cable + dumbbell pullovers, or press-style movements filling a direct triceps slot no longer crowd out requested muscles. Focused hypertrophy back sessions prefer normal row/vertical-pull/lat/rear-delt patterns instead of padding the session with rack pulls or Olympic pulls. Generated sessions are ordered with major compounds first and direct isolation work later. Coach also understands a first set of execution grammar: “warm me up first,” explicit rest times in either word order, RPE/RIR / “reps in the tank,” and “last set AMRAP.” Those instructions are carried into previews, saved Coach routines, and active workouts. Top-set/backoff programming remains a separate next step because it requires dedicated progression behavior rather than a cosmetic label.

**v0.55.1: Programming Intelligence Hardening** — Re-audited the v0.55 selector and parser against short multi-muscle sessions, Push/Pull role coverage, singular “arm” program emphasis, and literal punctuation handling in the gym-language resolver. Fixed the Coach regex-escape helper and made program focus use the same singular/plural muscle language as workout requests. Expanded regression coverage so 30-minute chest + arm + back sessions must still retain primary chest/back work plus direct biceps and direct triceps, Push/Pull days must retain their core movement roles, singular arm emphasis must expand to biceps + triceps, and regex punctuation must remain safe.

**v0.56.0: Modular Architecture + Sync-Ready Foundation** — The former all-in-one `index.html` application is reorganized into a small HTML shell, layered CSS source, static data modules, and ordered JavaScript domains for core/runtime, analytics, Programs, Coach, routines/exercises, the workout engine, history editing, exercise tools, and settings/bootstrap. Coach is further split into intent/input, programming, language/refinement, program-building, and UI modules so future intelligence work does not recreate a new monolith. The exercise catalog and anatomy geometry live in dedicated data modules. A deterministic build assembles these sources into the compact production `app.js` + `app.css` consumed by both GitHub Pages and Capacitor, preserving runtime efficiency and offline behavior. Device persistence is routed through a registered storage service, core state exposes a narrow service boundary, and `state:saved` / `app:ready` events create clean future hooks for optional sync, sharing, identity, and group infrastructure without wiring network concerns into workout logic. CI now builds and tests the production bundle itself, and explicitly guards the modular source boundaries.

**v0.57.0: Evidence-Backed Regional Programming** — Coach gains a dedicated, auditable programming-knowledge data layer anchored to the 2026 ACSM resistance-training position stand and supporting systematic reviews. Back is expanded from a simple lats/upper-back bucket into explicit full-back coverage across lats, upper/mid back, lumbar/spinal erectors, and traps. Upper Back, Lower Back/lumbar/spinal erectors, Lats, and Traps become first-class natural-language targets. Generic hypertrophy Back workouts reserve horizontal-pull, vertical-pull, direct spinal-erector, lat-isolation, trap, and scapular/rear-delt roles as time permits while retaining redundancy caps. Lower-back programming distinguishes direct lumbar-extension work from posterior-chain hinges, so RDLs and squats are not mislabeled as lumbar isolations. Strength-focused Back requests prefer the conventional Deadlift as the general hinge anchor while de-prioritizing specialized Rack Pull/Block Pull/Deficit variants unless explicitly requested. PPL Pull and Upper Body remain upper-pulling sessions by default so the broader Back definition does not force unnecessary lumbar fatigue into every split.

**v0.58.0: Target Priority + Complete Regional Programming + Prompt Stress Matrix** — Coach distinguishes minimum requested coverage from user emphasis so mixed requests such as “shoulders and arms, more shoulders” preserve direct work for both areas while spending discretionary slots on the priority target. Initial prompts and refinements recognize emphasis language such as more, mostly, focused, emphasis, prioritize, biased toward and dominant. Target vocabulary expands to pecs, delts, bis, tris, hams, forearms, spinal erectors and posterior chain. Complete Shoulders reserves press/anterior-delt, lateral-delt and rear-delt roles. Full Arms reserves complementary direct biceps and triceps roles, including neutral-grip elbow flexion and overhead triceps extension when appropriate, with direct forearm work as session length permits. Legs now reserve knee-dominant, hip-hinge, knee-flexion hamstring and calf roles, with glute/adductor work added as time permits. Posterior Chain becomes a first-class target. Broad multi-target sessions prefer novel movement families over redundant optional work unless the user explicitly emphasizes the repeated target. A permanent production-bundle stress harness now runs 306 Coach prompts across beginner/advanced language, goals, durations, equipment constraints, target combinations, emphasis and vague-input cases in CI.

**v0.59.0: Swole Cat Intelligence / Training-Context Programming** — Coach now reasons about the user's actual recent training before ranking exercises. Completed working sets build a rolling 7-day muscle ledger with primary and fractional secondary set-equivalents, while a separate four-window prior baseline excludes the current week. Requested muscles that are underrepresented relative to weekly context can receive more discretionary work, while already-dense exposure reduces redundant additions. Candidate ranking now considers exercise continuity/progression from the user's own history, recent high-demand movement overlap, systemic/axial/technical exercise demand, explicit training experience, and unilateral/bilateral preferences without claiming unilateral work is inherently superior for hypertrophy. Generated exercises can receive goal- and role-specific rep/rest/RIR prescriptions instead of one workout-wide prescription, while explicit user rest/effort instructions override automation. Short non-strength sessions can use compatible antagonist/noncompeting supersets to preserve useful coverage rather than simply deleting exercises. Multi-day Program generation carries planned muscle set-equivalents forward so later days account for earlier generated days. Every generated workout receives an internal intelligence audit for required coverage, constraints, redundancy, projected weekly context and high-demand stacking. A dedicated history-aware stress suite joins the existing 306-prompt matrix and validates weekly ledgers, baseline isolation, underrepresented-muscle allocation, progression continuity, demand-aware substitutions, beginner complexity, mixed unilateral/bilateral requests, time-compression supersets, per-exercise prescriptions and 90 target × goal × duration history-aware generation cases.

**v0.59.1: Coach Language Resilience + Prompt Hardening** — Audits and hardens the deterministic language layer across casual gym slang, common misspellings, speech-recognition substitutions, advanced anatomical terminology, word-number phrasing, goal/emphasis ambiguity, equipment constraints, program schedule shorthand and negative intent. Precise Front/Side/Rear Delt, Abs, Oblique and Adductor targets are preserved when the underlying metadata supports them, while broad terms such as Delts and Core remain broad. Muscle, equipment and exercise exclusions are separated from positive intent so phrases such as “no chest,” “no free weights,” “no barbell rows,” “don't include back squats,” and “avoid chest-supported rows” cannot invert the request or create false muscle exclusions. Ambiguous exercise matches continue to ask rather than guess. The standard Coach matrix expands to 360 prompt cases and a permanent language-resilience suite adds 432 checks, including 291 catalog-wide one-edit exercise-name mutations where high-confidence results must be correct or the intended exercise must remain in clarification candidates. The exercise-language index is cached by state revision to keep fuzzy parsing responsive without changing confidence behavior.

**v0.60.0: Adaptive Progression + Multi-Week Training Intelligence** — Coach now evaluates an exercise across up to eight recent logged exposures instead of treating the last workout as the whole story. The adaptive layer classifies progressing, consolidating, plateau-watch, high-effort plateau, and performance-dip patterns from the user’s own load/rep/estimated-strength/RIR history without diagnosing recovery or fatigue. Progressing movements receive continuity preference; repeated high-effort plateaus and meaningful performance dips can hold a Coach-generated progression target instead of blindly forcing another rep or load jump. Coach-generated exercises persist an explicit progression strategy: rep-first double progression, load-first strength progression, or top-set/backoff programming for appropriate established weighted compounds. Top/backoff grammar such as “top set 3–5 then 3 backoff sets 6–8 at 90%” becomes real set structure, flows into live Top Set / Backoff rows, uses role-specific rep targets, and survives saved routines/programs and workout-structure edits. Fresh movements never receive invented population-based loads. Manual/legacy routines do not silently opt into adaptive holds. A simulated multi-week training-block regression suite validates progressing, plateau, performance-dip, top/backoff, adaptive-hold, persistence, and zero-starting-load behavior alongside all existing Coach stress suites.

**v0.60.1: Adaptive Progression Audit Hardening** — Re-audits v0.60 against the original Coach contract and closes four integration gaps. Plateau detection now evaluates the recent four-exposure window and requires that evidence to span real time, so earlier gains cannot hide a genuine recent stall and several clustered sessions cannot masquerade as a multi-week plateau. The same conservative adaptive hold now applies to top-set/backoff progression instead of only straight-set double progression. Saved top/backoff routines expose role-specific editor fields and keep top/backoff counts, rep ranges, percentages, and total working sets synchronized. Top/backoff language coverage is expanded for natural variants such as “back down sets,” “lighter sets,” percentage backoffs, and “drop 10 percent,” and those variants join permanent regression coverage.

### Locked: Quick workout builder
The home screen includes Coach Swolecat as the primary build path for new users and a secondary quick-build path for returning users when no workout is active.

A user should be able to type something naturally such as:
- "Give me a chest and back workout today."
- "Build me a 45-minute leg workout."
- "I only have dumbbells and cables."
- "Give me something quick for shoulders and arms."
- "Make me a strength-focused push workout."

Coach Swole Cat should then ask only for missing information that materially changes the workout, such as:
- target muscles or workout goal
- available time
- available equipment
- training mode / goal
- optional exercise dislikes, favorites, or limitations already stored in Swole Cat

### Locked: Evidence hierarchy
Coach Swole Cat should not invent programming rules or treat a single exercise as universally "best."

The recommendation engine should use a documented evidence hierarchy:
1. Current major position stands and consensus guidance from organizations such as ACSM and NSCA.
2. High-quality systematic reviews and meta-analyses of resistance-training variables.
3. Well-supported exercise-science principles encoded as explicit local rules.
4. Exercise-specific metadata and biomechanics used for contextual ranking, not as unsupported certainty.
5. User-specific history, equipment, preferences, and available time used to personalize within those evidence-backed boundaries.

The app should store the source/rationale behind major programming rules so they can be audited and updated as evidence changes.

For hypertrophy-oriented generation, the engine should reason about variables such as:
- weekly set volume per muscle group
- load/rep ranges that can produce hypertrophy
- proximity to failure / effort targets where supported
- rest intervals
- frequency across a multi-day plan
- exercise order and movement balance
- available range of motion
- exercise redundancy
- session-duration constraints

For strength-oriented generation, the engine should separately weight variables such as heavier loading, lower rep targets, exercise specificity, longer rest, and exercise order.

User-entered working weight remains user-controlled. When sufficient workout history exists, Swole Cat may prefill or suggest starting loads from the user's own prior performance and progression data rather than estimating a person's strength from population averages.

### Locked: Deterministic local builder first
The first version should **not require a cloud AI model**.

Swole Cat can build strong routines locally from structured data already in the app:
- primary/secondary muscle metadata
- movement family
- equipment requirements
- user Favorite / Prefer / Avoid / Hidden exercise settings
- recent training history
- routine training mode
- target duration
- reasonable exercise/set/rest-time estimates
- movement balance and duplicate-pattern avoidance

The builder should rank and assemble exercises using transparent rules so the workout remains fast, offline-capable, inexpensive, and predictable.

### Locked: Conversational Coach layer
The UX should still feel conversational even when the first engine is deterministic.

Coach Swole Cat can:
1. Parse the user's short request.
2. Ask one or two concise follow-up questions only when necessary.
3. Generate a preview workout.
4. Explain the broad structure in plain language.
5. Let the user swap/remove exercises before saving.
6. Offer:
   - **Start Workout Now**
   - **Save as Routine**
   - **Add to Program**

The user must always remain in control of the final workout.

### Locked next Coach sequence

The next Coach Swolecat work proceeds in this order so each layer builds on the prior one instead of fragmenting the training brain.

**v0.61.0 — Conversational Routine Control + Saved Routine Intelligence**

**Status: Complete**

Implementation checklist:
- [x] Create a saved-routine Coach session that edits a copy first and only persists explicit Coach mutations to the selected routine.
- [x] Add routine-context parsing for named exercises plus conversational references such as “that one,” “the second exercise,” “the last one,” and “before/after curls.”
- [x] Support surgical add, remove, swap, reorder, set-count, rep-range, rest-time, goal/mode, and routine-duration adjustments without regenerating unrelated exercises.
- [x] Add Coach-local undo / redo snapshots for saved-routine mutations.
- [x] Add routine-aware explanations for exercise role, muscle coverage, progression structure, redundancy, and why a movement is currently in the routine.
- [x] Make additions and substitutions routine-aware using current movement families, muscle coverage, preferences, and training history.
- [x] Preserve adaptive progression flags, progression strategies, top/backoff structures, supersets, history continuity, preferences, and user-authored configuration through Coach edits.
- [x] Add dedicated v0.61 regression coverage for references, surgical edits, undo/redo, explanations, preservation, and saved-routine persistence.
- [x] Run the full production validation, Pages deployment, and Android build before closing v0.61.
- [x] Record the completed v0.61 milestone and bump the app/version metadata only after all checks pass.

**Milestone record:** Saved routines now expose a **Coach Edit** path backed by a dedicated routine-control module. Coach works against a draft copy, understands named and ordinal/conversational references, performs minimal add/remove/swap/reorder/programming edits, can fit a routine toward a requested duration, explains exercise roles using current muscle/progression/history context, and supports local undo/redo before explicit save. Compatible adaptive progression and top/backoff configuration survive edits and substitutions. Completed workout history remains untouched. A dedicated production-bundle stress suite verifies surgical edits, conversational references, undo/redo, explanations, routine-aware target additions, duration fitting, progression preservation, explicit persistence, and cancel/discard behavior.

Locked behavior:
- Coach edits the existing routine instead of silently rebuilding it.
- The smallest sensible change wins unless the user explicitly asks for a rewrite or rebuild.
- Ambiguous references ask for clarification rather than guessing.
- Workout history remains separate from routine structure. Editing a routine never rewrites completed sessions.
- Existing progression intelligence remains authoritative unless the user explicitly changes that programming.

**v0.62.0 — Training History Q&A + Deeper Coach Insights**

**Status: Complete**

Implementation checklist:
- [x] Add a deterministic history-question router before workout/program generation so Coach can distinguish “what did I bench last time?” from “build me a bench workout.”
- [x] Answer exercise-specific last-session questions with exact logged date, working-set load/reps, effort when available, and a direct history/progress handoff.
- [x] Answer exercise best/PR and progression questions from the user’s own logged history without inventing population standards.
- [x] Answer global questions about what is progressing, holding, stalled, or recently down using the v0.60 multi-week progression classifications.
- [x] Add consistency summaries across useful recent windows using completed-session history only.
- [x] Add muscle/movement recency questions such as “what haven’t I trained lately?” and “when did I last train legs/chest/back?”
- [x] Replace the single neglected-area Home insight with a ranked deeper-insight engine covering progression, stalls, neglected areas, and consistency signals.
- [x] Give actionable insights a safe handoff into exercise progress, workout generation, or Coach routine control without silently changing the user’s program.
- [x] Keep observations and interpretations explicitly separated; never infer soreness, fatigue, injury, recovery state, overtraining, or medical readiness from logs.
- [x] Add dedicated v0.62 regression coverage for question routing, exact-history answers, progression summaries, consistency, neglected areas, insights, and action handoffs.
- [x] Run the full production validation, Pages deployment, and Android build before closing v0.62.
- [x] Record the completed v0.62 milestone and bump app/version metadata only after all checks pass.

**Milestone record:** Coach’s main inputs now route clear history questions before workout generation. It can answer exact last-session exercise questions, heaviest logged working sets, exercise-specific multi-week trend/stall questions, global progressing/stalled summaries, recent training consistency, muscle-area recency, and broad neglected-area questions from completed local logs. The Home insight system now ranks high-effort plateaus, meaningful performance dips, neglected push/pull/lower-body areas, progressing exercises, and consistency signals instead of exposing only the original neglected-area rule. Insight actions hand off to exercise progress, Coach routine control, Analytics, or an opt-in generated workout. The implementation reuses the existing history, muscle-scoring, and v0.60 adaptive-progression layers rather than creating parallel analytics. During hardening, the parser was fixed for “stalled/stalling” wording and normalized apostrophe/pronoun forms such as “what haven’t I trained lately?” while preserving the original v0.54 Home insight display/action contract.

Locked behavior:
- Logged history is authoritative for historical answers.
- Coach says when there is not enough data instead of fabricating a trend.
- A history question never accidentally creates a workout.
- A workout request containing an exercise name still routes to workout creation unless it is clearly phrased as a question about past training.
- Insight actions are opt-in. Coach can suggest an action but does not rewrite routines or Programs automatically.

**v0.63.0 — Program Auditor + Long-Term Planning Intelligence**

**Status: Complete**

Implementation checklist:
- [x] Add a deterministic Program-audit engine that reads the saved Program, its ordered Routines, current exercise configuration, preferred schedule, and completed Program history.
- [x] Compare programmed frequency with actual completed Program frequency over a recent multi-week window without treating missed sessions as a recovery diagnosis.
- [x] Compare planned routine-slot rotation with what the user is actually completing and flag repeatedly skipped/underrepresented days without rewriting history.
- [x] Audit planned weekly primary/secondary muscle set-equivalents across all Program Routines and compare them with recent completed Program muscle coverage.
- [x] Detect meaningful cross-day movement-family redundancy while respecting intentionally repeated staples and exercise preferences.
- [x] Detect poor weekly distribution when heavily overlapping muscle work is clustered on adjacent preferred days or concentrated into one day despite a multi-day schedule.
- [x] Surface repeated exercise stalls/performance dips and clear progression opportunities using the existing v0.60 multi-week progression classifications.
- [x] Generate ranked, explainable Program findings with evidence, severity, affected Routine/exercise, and a minimal next action.
- [x] Let findings hand off into v0.61 Coach Routine Control, exercise Progress, Analytics, or Program editing without silently mutating the Program.
- [x] Add direct Coach language such as “audit my program,” “review my current plan,” and “how is my program actually going?” plus a visible Coach Audit action on saved Programs.
- [x] Preserve user exercise preferences, Routine configuration, Program order, completed workout history, and explicit Program choices unless the user chooses to edit them.
- [x] Add dedicated v0.63 regression coverage for adherence, slot completion, planned-vs-actual muscle coverage, redundancy, distribution, stalls, opportunities, ranking, handoffs, and no-mutation guarantees.
- [x] Run the full production validation, Pages deployment, and Android build before closing v0.63.
- [x] Record the completed v0.63 milestone and bump app/version metadata only after all checks pass.

Locked behavior:
- The auditor describes what the Program contains and what the logs show; it does not diagnose fatigue, soreness, injury, recovery, overtraining, or medical readiness.
- Low adherence is reported as a completion pattern, not blamed on the user and not treated as proof the Program is bad.
- Repeated compound staples are not automatically labeled redundant just because they recur across days. Redundancy requires meaningful same-family overlap without a distinct programming role.
- A stall is not automatically a reason to replace an exercise. Coach first surfaces the pattern and offers a minimal review path.
- Program-audit actions are opt-in. Auditing never silently saves Routine or Program changes.


**Milestone record:** Coach can now audit an entire saved Program against its ordered Routines and completed Program history. The auditor compares saved target frequency with recent completed frequency, checks rotation-slot representation, compares planned versus actual muscle set-equivalents, detects meaningful same-family redundancy without treating repeated staples as automatically bad, evaluates Program distribution from actual adjacent-day history and safe schedule-level evidence, and surfaces existing v0.60 progression stalls, dips, and positive continuity signals inside the Program context. Findings are ranked, explainable, and opt-in, with handoffs into Routine Control, exercise Progress, Program editing, and Analytics. A final semantic audit corrected an important assumption: preferred weekdays are availability preferences only, not positional Routine-to-day assignments, and regression coverage now permanently guards against inventing that mapping.

**v0.64.0 — Coach Battle-Hardening + 12-Week Longitudinal Simulation**

**Status: Complete**

Implementation checklist:
- [x] Build a deterministic persona matrix spanning beginner, intermediate, advanced, uncertain/vague, highly specific, strength-focused, hypertrophy-focused, and mixed-goal users.
- [x] Stress natural-language routing with clean prompts, slang, misspellings, shorthand, contradictory requests, underspecified requests, and expert lifting grammar without allowing history/audit questions to become workout builds or vice versa.
- [x] Simulate at least three months of completed training for multiple lifter archetypes instead of testing only isolated snapshots.
- [x] Check Coach at weeks 4, 8, and 12 so longitudinal behavior can be evaluated before and after enough evidence accumulates.
- [x] Include rapid beginner progression, slow intermediate progression, genuine multi-week stalls, temporary performance dips, inconsistent adherence, missed Program slots, and comeback/rebound patterns.
- [x] Exercise full-body, upper/lower, push-pull-legs, strength/top-backoff, and mixed hypertrophy programming across the simulation set.
- [x] Verify Coach does not call a short same-week cluster a plateau, does not erase a genuine recent stall because older weeks improved, and does not overreact to one poor session.
- [x] Verify adaptive recommendations remain coherent across repeated sessions and do not oscillate irrationally between hold/reset/progress after one contradictory exposure.
- [x] Verify history Q&A, deeper insights, Routine Control context, and Program Audit all agree on the same underlying synthetic history.
- [x] Verify low adherence and missed sessions remain descriptive completion-pattern findings rather than motivation, recovery, injury, or medical diagnoses.
- [x] Verify no battle-test scenario causes Coach to invent starting loads, completed workouts, schedule mappings, exercise history, or reasons for performance changes.
- [x] Add permanent regression assertions for every real reasoning/routing bug discovered during the campaign.
- [x] Emit a concise per-persona battle report inside CI so failures identify the lifter, week/checkpoint, prompt, expected behavior, and actual Coach output.
- [x] Run the full existing regression wall alongside the new battle suite before closing v0.64.
- [x] Record all discovered failure classes and fixes in the Coach evidence log before version bump/release.

Locked behavior:
- The battle harness must test the production bundle and production Coach functions, not a mocked replacement brain.
- Synthetic users may have deliberately messy histories, but assertions must distinguish bad data from bad Coach reasoning.
- One bad workout is not enough evidence for a multi-week stall, deload, or recovery conclusion.
- Strong progression should preserve useful continuity rather than constantly rotating exercises for novelty.
- Sparse or ambiguous evidence should produce uncertainty/clarification instead of fabricated certainty.
- Completed history remains immutable during audits and questions.
- Stress testing may expose product bugs; fixes are allowed, but the test must remain adversarial rather than being weakened to make Coach pass.


**Milestone record:** Coach’s production bundle now runs through an adversarial 12-week simulation lab rather than only isolated unit snapshots. The permanent battle harness covers vague beginners, experienced lifters, advanced strength users, slang/typos/shorthand, explicit prescriptions, full-body, upper/lower, PPL, top-set/backoff strength work, rapid beginner progression, slow intermediate progression, genuine high-effort stalls, one-session dips with rebound, messy adherence, skipped Program slots, same-week false-plateau traps, a multi-week comeback after time off, and recommendation-stability checks across neighboring weeks. Weeks 4, 8, and 12 are used as longitudinal checkpoints. Adaptive progression, History Q&A, deeper insights, and Program Audit are cross-checked against the same synthetic history so they cannot quietly disagree. The campaign permanently guards against invented starting loads, fabricated causes, false weekday mappings, history mutation, overreaction to one bad session, and irrational hold/progress oscillation. Every real reasoning bug discovered while building the harness remains encoded as regression coverage rather than being removed to make the suite pass.

## Today — Beta Readiness Live-Workout Polish

**Status: In progress**

Goal: make the core in-gym workout loop feel obvious, smooth, and orientation-safe before real-world beta testing with a first outside user.

Implementation order:
1. [x] **Fix the active-workout top bar / Cancel control.** Restore a properly sized, centered, readable Cancel button with a reliable mobile hit target and no clipping.
2. [x] **Add persistent active-exercise identity.** Keep the current exercise name and set position visible while the user is working inside that exercise.
3. [x] **Make auto-advance land predictably.** Completing the final set of Exercise A must advance to Exercise B with Exercise B’s identity immediately visible, never into an ambiguous middle-of-card scroll position.
4. [ ] **Compress Session Goal / Building Baseline guidance.** Preserve Coach intelligence while reducing the vertical space it consumes during live logging; detailed explanation remains available on demand.
5. [ ] **Tighten completed/active exercise card state.** Completed exercises should get out of the way and the newly active exercise should be expanded and visually dominant without deleting access to prior logged sets.
6. [ ] **Polish the transition and live-workout ergonomics.** Keep “Up next” as secondary confirmation, review spacing/tap targets around the live set controls, and remove any remaining orientation friction without adding extra confirmation steps.
7. [ ] **Regression-test the full workout flow and cut a fresh beta build.** Test multi-exercise auto-advance repeatedly, preserve workout/session data, run the full regression wall, Pages, and Android build, then provide the exact fresh APK for real-world beta use.

Locked behavior:
- Auto-advance remains automatic. Do not replace it with a required “Next Exercise” confirmation.
- The live workout UI prioritizes **what am I doing now?** and **what set am I on?** over explanatory Coach copy.
- Coach guidance remains available but must not push the active exercise identity out of view.
- Completed workout history and progression behavior must remain unchanged by this polish pass.
- The post-workout summary is not being redesigned in this pass unless a regression requires a surgical fix.
- Every completed step is checked off in this roadmap before moving on, so a new chat can reconstruct the exact beta-readiness state.

After v0.63, later optional Coach work can include richer lifting grammar, explicit user-provided readiness/recovery inputs, and optional cloud-language understanding for requests the deterministic parser cannot confidently interpret.

Implemented locally through v0.64.0:
- generate complete 2–6 day programs from natural-language frequency/split/schedule requests
- refine a whole generated program's frequency, split, weekdays, session duration, goal, equipment, and muscle emphasis
- preview approximate weekly primary/secondary set-equivalents
- preserve manual per-day exercise rejects during program regeneration
- persist generated days as normal Routines inside a normal Program
- adapt a generated workout to time/equipment changes
- refine goal and muscle emphasis conversationally
- add/remove named exercises while preserving user control
- explain broad exercise-selection rationale
- use recent workout history as a light variety/context signal
- progressively refine a generated plan through conversation
- add a generated workout directly to an existing or new Program
- guarantee requested-muscle coverage before filling extra exercise slots
- reserve direct biceps/triceps isolation when Arms is explicitly requested
- suppress redundant movement-family variants in multi-target workouts
- interpret warm-up-first, rest-time, RIR/RPE, reps-in-reserve, and last-set-AMRAP grammar
- preserve programming role when swapping a generated exercise
- open any saved routine in Coach Edit without converting it into a generated Coach-only format
- surgically add/remove/swap/reorder exercises and edit sets, reps, rest, goal/mode, or requested duration
- understand ordinal and conversational routine references and provide undo/redo before save
- explain exercise role, muscle coverage, progression structure, redundancy, and recent history context inside the current routine
- preserve compatible adaptive/top-backoff programming while leaving completed workout history unchanged
- route clear training-history questions through Coach without accidentally creating workouts
- answer exact last-session, best-set, progression, stall, consistency, recency, and neglected-area questions from completed local logs
- rank deeper Home insights across stalls, performance dips, neglected areas, progressing exercises, and consistency
- hand history insights into Progress, Analytics, generated workouts, or Coach routine review only when the user chooses the action
- audit complete saved Programs against completed Program history
- compare programmed frequency and rotation-slot representation with recent completion patterns
- compare planned weekly muscle set-equivalents with recent completed Program coverage
- detect explainable redundancy and distribution issues without inventing weekday-to-Routine mappings
- surface Program-level stalls, performance dips, and positive progression continuity from the existing adaptive engine
- hand Program findings into Routine Control, exercise Progress, Program editing, or Analytics without mutating the Program
- run a production-bundle 12-week Coach battle simulation across beginner, intermediate, advanced, messy, comeback, dip/rebound, and low-adherence lifters
- check longitudinal Coach behavior at weeks 4, 8, and 12 instead of only isolated snapshots
- cross-check adaptive progression, History Q&A, Program Audit, and deeper insights against the same synthetic history
- verify recommendations do not oscillate irrationally after one contradictory exposure
- permanently regression-test every reasoning/routing failure discovered during battle hardening

### Product/safety guardrails
- Recommendations should be framed as training suggestions, not medical advice.
- The builder should not claim to diagnose injury, recovery state, or physiological readiness from workout logs alone.
- User-selected limitations and exclusions must override recommendation ranking.
- Generated workouts should be editable before they are saved or started.
- Workout generation should reuse the same routine/workout data structures as manually created routines rather than creating a second incompatible system.

### Why this phase comes here
Coach Swole Cat becomes substantially better after exercise muscle metadata and richer history exist, because it can make choices from structured information instead of guessing. It does not require accounts or social infrastructure, so it should come before sharing, cloud sync, and group features.

---

## Phase 7 — Routine Sharing Without Accounts

**Priority: Medium-high**

Goal: make useful sharing available before a full cloud/account platform exists.

### Locked: Share a routine
- [ ] Share/export a routine as a portable Swole Cat payload
- [ ] Native Android share sheet
- [ ] Human-friendly share link/code if practical
- [ ] Preview before import
- [ ] **Add to My Routines** action
- [ ] Imported routine becomes the recipient's independent copy

### Data rule
Sharing a routine must never copy another person's private workout history unless the user explicitly exports that data for backup/migration.

---

## Phase 8 — Accounts, Cloud Backup, and Multi-Device Sync

**Priority: Medium**

Goal: add identity and cloud infrastructure only when it unlocks meaningful value.

### Locked: Optional Swole Cat accounts
- [ ] Account creation/sign-in
- [ ] Cloud backup
- [ ] Multi-device sync
- [ ] Account recovery
- [ ] Conflict-safe sync strategy
- [ ] Local-first/offline behavior remains supported

### Likely implementation direction
A hosted backend such as Supabase or an equivalent service can provide authentication, relational data, permissions, storage, and real-time features. Final provider should be chosen when this phase begins based on current cost, reliability, and platform needs.

---

## Phase 9 — Shared Programs and Workout Groups

**Priority: Medium / major feature**

Goal: let multiple people train from the same routine structure while preserving independent personal data.

### Locked: Workout groups
A user can create a group and invite a partner, roommate, friend, or training group.

The group can follow a shared routine/program, but each member owns:
- weights
- reps
- set completion
- progression
- notes
- PRs
- workout history
- personal/body metrics

### Locked: Shared-template architecture
The shared routine is a **blueprint**. User performance records reference that blueprint but remain separate.

Example:

Shared routine:
- Bench Press — 4 sets
- Incline Dumbbell Press — 3 sets
- Cable Fly — 3 sets

Individual performance:
- Jake: 185 x 8
- Partner: 95 x 10
- Friend: 155 x 7

No user's weights or progression should overwrite another user's data.

---

## Phase 10 — Group Progress Dashboard

**Priority: Later**

Goal: provide accountability and visibility without requiring live synchronization.

### Locked: Group progress
- [ ] Member list
- [ ] Today's/shared workout status
- [ ] Not started / in progress / completed state
- [ ] Weekly completion
- [ ] PR activity
- [ ] Optional volume/progression views
- [ ] Consistency/streak views where appropriate

### Locked: Privacy controls
Users should control what other group members can see, including options such as:
- completion status only
- workout performance
- PRs/progression
- hide body weight/body measurements
- fully private metrics

---

## Phase 11 — Live Group Workouts

**Priority: Long-term**

Goal: make training together feel connected when people are doing the same session at the same time.

### Locked: Live shared session
Potential live group view:
- member currently active
- current exercise
- set number / set completion
- workout completion state
- lightweight reactions/encouragement

The feature should remain training-focused. Full social-media feeds, public follower systems, or unrelated engagement mechanics are not required for the core vision.

---

## Phase 12 — Future Intelligence and Expansion

These are intentionally later because they depend on the data model and core experience being stable.

Possible directions:
- advanced Coach Swole Cat intelligence beyond the Phase 6 local builder
- program templates
- coach/trainer sharing
- intelligently suggested substitutions
- plate calculator
- supersets/circuits/drop sets
- advanced rest timer behavior
- wearable/health-platform integrations
- optional challenges between friends
- richer long-term progression analysis

These are not automatically committed features. Each should earn its place based on usefulness, complexity, privacy, and product fit.

---

# Implementation Order

The current intended sequence is:

1. Android stabilization and signed release
2. Routine editing, including **rename**
3. Per-routine **training mode selector**
4. Refactor/expand the progression engine
5. **Visual identity refresh / Swole Cat design system**
6. Post-workout completion summary
7. Exercise muscle metadata
8. Front/back muscle heat map
9. Rich calendar/history workout recaps
10. **Coach Swole Cat / Quick Build**
11. Routine sharing without accounts
12. Accounts + cloud backup/sync
13. Shared group routines
14. Group progress dashboard + privacy
15. Live group workout synchronization

This order is deliberate. Routine editing and the training-mode data model should be settled before deeper analytics. The visual system should be established before major new screens and visualizations are built. Muscle metadata should exist before heat maps and before Coach Swole Cat begins generating routines from structured exercise data. Coach Swole Cat should begin only after the exercise muscle-metadata and rich-history foundations are stable enough to support evidence-backed selection and personalization. The local quick-build engine should be proven before adding optional AI intelligence. Simple routine sharing should be proven before building accounts. Accounts and sync should exist before group or live features.

---

# Locked Feature Register

The following product ideas are explicitly retained on the roadmap:

- [x] Rename/edit existing routines and programs
- [x] Choose training mode per routine/program
- [x] Guided progressive-overload mode
- [x] Strength-focused progression mode
- [x] Track-only / standard workout mode
- [x] Dark retro-futurist / cyberpunk visual identity refresh
- [x] Preserve current layout, sizing, readability, and workout flow during the visual refresh
- [x] Standardized Swole Cat design system
- [ ] Post-workout stats/completion screen
- [ ] Muscle groups targeted summary
- [ ] Front/back muscle heat map
- [ ] Detailed historical workout recap from calendar/history
- [x] Coach Swole Cat / Quick Build workout generator foundation
- [x] Natural-language workout requests with concise follow-up questions
- [x] Generate → preview → edit → start/save workflow
- [x] Local deterministic workout-generation engine using muscle/equipment/history/preferences
- [ ] Optional later AI-backed conversational Coach layer
- [ ] Preserve an ad-free, no-paywall core workout experience
- [ ] Routine sharing/import
- [ ] Optional Swole Cat accounts
- [ ] Cloud backup and multi-device sync
- [ ] Shared workout groups/programs
- [ ] Independent stats for every member on a shared program
- [ ] Group progress visibility
- [ ] Privacy controls for shared stats
- [ ] Live group workout sessions
