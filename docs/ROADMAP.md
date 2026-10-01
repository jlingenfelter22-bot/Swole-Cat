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
- weekly/monthly muscle-group coverage
- training-frequency visualization
- recovery/fatigue features only if they can be presented responsibly and without pretending to know more than the recorded data supports

---

## Phase 6 — Coach Swole Cat / Quick Build

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

### Locked: Quick workout builder
The home screen should eventually include a fast **Build a Workout** entry point powered by Coach Swole Cat.

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

### Later optional intelligence
Once the local builder is proven, an optional AI-backed Coach layer can add more flexible natural-language understanding and programming discussion without replacing the deterministic training engine.

Potential later capabilities:
- multi-day program generation
- "build me a 3-day plan" conversations
- modify an existing routine from natural language
- adapt a workout to time/equipment changes
- explain why exercises were selected
- use recent workout history to avoid unintentionally repeating heavily trained muscles
- suggest substitutions using the existing preference/history system
- progressively refine a generated plan through conversation

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
- [ ] Coach Swole Cat / Quick Build workout generator
- [ ] Natural-language workout requests with concise follow-up questions
- [ ] Generate → preview → edit → start/save workflow
- [ ] Local deterministic workout-generation engine using muscle/equipment/history/preferences
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
