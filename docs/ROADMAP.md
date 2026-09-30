# Swole Cat Product Roadmap

This document is the canonical product roadmap for Swole Cat. Features listed as **Locked** are intended product direction unless a later technical or product decision explicitly replaces them.

## Product Principles

1. **Local-first stays valuable.** Core workout tracking should remain usable without an account or network connection.
2. **A routine is a blueprint.** Workout history, weights, reps, progression, notes, and personal stats belong to the individual user, even when a routine is shared.
3. **Training logic is configurable per routine/program.** Swole Cat began as a progressive-overload tracker, but it should support multiple ways of training without forcing every routine through the same progression algorithm.
4. **History should become more useful over time.** Completing a workout should create a durable, visual record that can be revisited from the calendar/history.
5. **Social features should enhance training, not turn Swole Cat into a generic social network.**
6. **Visual identity should evolve without sacrificing usability.** Swole Cat should preserve the clean information architecture, sizing, readability, and fast workout flow while developing a distinctive dark retro-futurist/cyberpunk visual identity.

---

## Phase 0 — Android Packaging and Release Foundation

**Status: In progress**

Goal: turn the hardened PWA into a reliable Android app while keeping one maintainable web codebase.

- [x] Capacitor Android packaging
- [x] Automated debug APK build through GitHub Actions
- [x] Test packaged Android app on real devices
- [ ] Fix Android-specific navigation, keyboard, back-button, safe-area, status-bar, file import/export, and storage issues
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

**Status: Visual Pass 2 complete in v0.35.0. The core identity now has screen-specific composition across Home, Routines/Programs, Exercise Library, Active Workout, Progress, and History. Pass 3 final cohesion, sizing, restraint, performance, and accessibility polish remains.**

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
- [ ] Keep effects performant on Android devices

### Why this phase comes here
The visual system should be established before building the workout-completion recap, muscle heat maps, richer history screens, sharing surfaces, and social/group UI. That avoids styling each major new feature twice.

---

## Phase 4 — Workout Completion Experience

**Priority: High**

Goal: finishing a workout should feel rewarding and produce a useful summary, not simply close the session.

### Locked: Post-workout completion summary
When the user taps **Finish Workout**, show a polished recap including:
- [ ] Routine/workout name
- [ ] Completion date and time
- [ ] Workout duration
- [ ] Exercises completed
- [ ] Working sets completed
- [ ] Total reps
- [ ] Total training volume where meaningful
- [ ] Personal records hit
- [ ] Muscle groups trained
- [ ] Notable progression versus prior sessions
- [ ] Front/back muscle heat map

The summary should use the refreshed Swole Cat visual system and feel like a premium completion moment.

---

## Phase 5 — Muscle Mapping, Heat Maps, and Rich History

**Priority: High**

Goal: make workout history visual and genuinely useful.

### Locked: Exercise muscle metadata
Each exercise should support structured metadata such as:
- primary muscle groups
- secondary muscle groups
- movement family
- optional weighting/intensity contribution for visualization

### Locked: Muscle heat map
- [ ] Professional front-body illustration
- [ ] Professional back-body illustration
- [ ] Highlight muscles trained in the completed workout
- [ ] Differentiate primary versus secondary involvement
- [ ] Use intensity levels to communicate relative involvement without pretending to measure physiological muscle damage
- [ ] Match the Swole Cat visual system

### Locked: Historical workout recap
From the calendar/history, tapping a completed workout should reopen a durable recap containing:
- [ ] all exercises performed
- [ ] actual sets/reps/weight
- [ ] duration
- [ ] total volume
- [ ] PRs
- [ ] notes
- [ ] muscle groups
- [ ] front/back heat map
- [ ] comparison to prior performance when useful

### Later extension
- weekly/monthly muscle-group coverage
- training-frequency visualization
- recovery/fatigue features only if they can be presented responsibly and without pretending to know more than the recorded data supports

---

## Phase 6 — Routine Sharing Without Accounts

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

## Phase 7 — Accounts, Cloud Backup, and Multi-Device Sync

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

## Phase 8 — Shared Programs and Workout Groups

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

## Phase 9 — Group Progress Dashboard

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

## Phase 10 — Live Group Workouts

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

## Phase 11 — Future Intelligence and Expansion

These are intentionally later because they depend on the data model and core experience being stable.

Possible directions:
- personalized programming suggestions
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
10. Routine sharing without accounts
11. Accounts + cloud backup/sync
12. Shared group routines
13. Group progress dashboard + privacy
14. Live group workout synchronization

This order is deliberate. Routine editing and the training-mode data model should be settled before deeper analytics. The visual system should be established before major new screens and visualizations are built. Muscle metadata should exist before heat maps. Simple routine sharing should be proven before building accounts. Accounts and sync should exist before group or live features.

---

# Locked Feature Register

The following product ideas are explicitly retained on the roadmap:

- [x] Rename/edit existing routines and programs
- [x] Choose training mode per routine/program
- [x] Guided progressive-overload mode
- [x] Strength-focused progression mode
- [x] Track-only / standard workout mode
- [ ] Dark retro-futurist / cyberpunk visual identity refresh
- [x] Preserve current layout, sizing, readability, and workout flow during the visual refresh
- [ ] Standardized Swole Cat design system
- [ ] Post-workout stats/completion screen
- [ ] Muscle groups targeted summary
- [ ] Front/back muscle heat map
- [ ] Detailed historical workout recap from calendar/history
- [ ] Routine sharing/import
- [ ] Optional Swole Cat accounts
- [ ] Cloud backup and multi-device sync
- [ ] Shared workout groups/programs
- [ ] Independent stats for every member on a shared program
- [ ] Group progress visibility
- [ ] Privacy controls for shared stats
- [ ] Live group workout sessions
