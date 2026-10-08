# Exercise Intelligence Foundation (design specification)

**Status:** Phase 1 implemented in Swole Cat Testing v0.84.0; remaining advanced measurement features and optimization are design proposals.
**Recorded:** 2026-10-08. **Target:** Field-test the implemented phase 1 on Android; require separate approval for additional behaviors and for any Beta promotion.
**Related:** [TRAINING_SCIENCE_FOUNDATION.md](TRAINING_SCIENCE_FOUNDATION.md), [EXERCISE_LOAD_BEHAVIOR.md](EXERCISE_LOAD_BEHAVIOR.md), [PROGRAM_GUIDED_OVERLOAD_DESIGN_PROPOSAL.md](PROGRAM_GUIDED_OVERLOAD_DESIGN_PROPOSAL.md).

## 1. Owner objective

**Every exercise in Swole Cat should resolve to an intelligent, explainable movement profile.** Guidance and tracking should understand what constitutes measurable progress for the movement, which values are meaningful, when added load is appropriate, and how its prescription changes with a person's goal, training history and equipment. Do not implement one generic "add 5 lb and one rep" rule for every exercise.

**Performance is a product requirement.** Achieve broad exercise coverage with small static metadata, shared movement-family profiles, a single deterministic resolver and fast lookups. Do not ship 307 individually handwritten code paths, network calls, LLM inference per set, or expensive recalculations while typing.

**Respect user autonomy.** Profiles propose defaults. The user's explicit sets, rep range, progression method, equipment configuration, load step and target always prevail within sensible validation constraints. Track Only continues to offer no automatic prescription. Do not rewrite historical records when exercise defaults change.

**v0.83.0 baseline:** Built-in library has **307** exercises with existing `id`, `name`, `muscle`, `equipment` and `pattern` fields. Several well-known assisted/bodyweight/weighted variants now contain explicit `loadType` metadata, and the runtime already supports an exercise-level `loadType` override, load-aware PRs, and exercise-specific UI. **This is the foundation, not 307 fully audited prescription profiles.** Verify the actual current library at implementation time.

## 2. Evidence limits that define intelligent behavior

- The [2026 ACSM resistance-training position stand](https://pubmed.ncbi.nlm.nih.gov/41843416/) summarizes 137 systematic reviews and indicates that strength development benefits more from heavier loading (e.g. >=80% 1RM), while hypertrophy can be achieved across a broad range of loads and is particularly responsive to sufficient training volume. Many sophisticated training variables had no consistent effect across the available evidence. Prescribe flexibly, matching the goal, not a rigid exercise-wide repetition rule.
- [Schoenfeld et al. 2017](https://pubmed.ncbi.nlm.nih.gov/28834797/) and [Lopez et al. 2021/2022](https://pubmed.ncbi.nlm.nih.gov/35015560/) similarly support broad load ranges for hypertrophy, with an advantage of heavier loading for maximal 1RM strength. A 20-rep bench set is not scientifically invalid; it may simply be a less direct default for a *max-strength*-focused bench prescription.
- Reasonable rep presets for exercise families, rests, load steps and tempo cues are **starting heuristics**, not physiological laws, injury-prevention guarantees or diagnoses.
- Progress can reflect more reps, more useful resistance, less assistance, time/distance, better technique/range of motion, or a harder variation. Not all dimensions are automatically measurable; never invent measurements the user has not logged.
- No exercise-classification system can infer the mechanics of every custom machine or band. Offer manual override with understandable labels and provenance.

## 3. Lightweight profile architecture

Proposed deterministic resolution:

`explicit routine-exercise/user override` > `built-in exercise metadata` > `movement-family + equipment templates` > `safe general fallback`.

A small, auditable `ExerciseProfile` provides structured hints rather than embedded business logic:

| Profile field | Reason |
|---|---|
| `measurementType` | `reps`, `duration`, `distance`, `reps_each_side`, or explicitly configured variants. |
| `loadType` | Preserve v0.83.0 `external`, `assistance`, `bodyweight` semantics; future extensions must be compatible. |
| `loadMeaning` | Total bar weight, weight per dumbbell, plate loading per side, machine stack, bodyweight plus added load, assisted counterweight, or no numeric load. |
| `movementFamily` + `exerciseRole` | Squat/hinge/press/pull/curl/raise/carry/core/power etc.; broad multi-joint, isolation, skill/power or loaded conditioning. |
| `supportedProgressions` | Reps-then-load, load-first, reps-only, time/distance, variation or manual. Avoid offering incompatible modes. |
| `suggestedRepRangesByGoal` | Soft defaults for strength, hypertrophy, general and endurance, with a rationale and an unrestricted user editor. |
| `equipmentStep` | Suggested smallest practical load adjustment when known; user/machine setting wins. Never presume a common machine increment. |
| `effortAndRestHints` | Optional context by goal and movement; no automatic claim of overtraining or readiness. |
| `analyticsModel` | Which PRs and chart units are valid; comparable history boundaries; whether conventional estimated 1RM is meaningful. |
| `provenance` | Explicit library, user override, movement-family heuristic or fallback. Enables review of uncertain cases. |

**Store user-specific progression history separately.** The built-in profile describes the *movement*, not an individual's strength or training capacity. When users share routines/programs, share compatible profile overrides but not the sender's weight history, recovery decisions or personalized baselines.

**Performance targets (engineering goals, to validate on actual low-end Android):** Keep the common path entirely offline. Resolve/cache profiles by stable exercise ID + config revision, preferably O(1). A small family-template dictionary and compact per-exercise exceptions should have negligible startup and per-set costs; establish real before/after timing and memory budgets before implementing rather than claiming an unmeasured millisecond target. Recalculate only when an exercise/equipment/goal/config changes, not on every keystroke.

## 4. Context should choose targets, not just the exercise name

Resolve the proposed target from:

1. **Exercise mechanics**: loading direction, measurement unit, movement pattern, and meaningful PR metrics.
2. **Training objective**: Guided Progressive Overload, Strength Focus, Track Only, plus the configured strength/hypertrophy/general goal. Do not silently swap the selected mode.
3. **Individual baseline**: prior *eligible* normal sessions of the same exercise and comparable equipment configuration; actual completed working sets, logged reps and effort. Ignore warm-up/drop/unfinished sets and intentionally lighter deload sessions for ordinary load progression.
4. **User constraints**: saved rep range, available increment, preferred equipment, weekly frequency, session load overrides, planned deload state and recovery preference.
5. **Feasible progression**: choose an available, explainable next step. Never force a huge weight increase because a rep ceiling was reached; holding load, adding reps, or proposing a different variation can be valid.
6. **Uncertainty**: new movements with no usable baseline should prompt initial logging, not make up a weight; mixed equipment and unit changes need explicit comparison boundaries.

A sample UI rationale might say "All 3 sets reached 10 reps. Suggested next: 105 lb total barbell load, then aim for 6 reps" or "Assisted Pull-Up: reduce counterweight from 64 to 59 lb after qualifying sets" or "Pull-Up: stay reps-only; you reached the 12-rep ceiling, consider an optional weighted variation." These are **illustrative scenarios**, not general prescriptions.

## 5. Suggested starting presets by exercise family, never locked limits

The **same exercise** may need a different rep window for different goals. Illustrative hypertrophy/general starting suggestions below are not promises of superiority or enforcement rules:

| Family / example | Possible starting suggestion | Progression dimensions and special cases |
|---|---|---|
| Barbell bench/squat/row, other multi-joint external-load exercises | ~6–12 reps | Reps then load; total barbell weight; exercise difficulty and technique matter. A 15–20+ rep bench set can still be useful when explicitly chosen. |
| Overhead press / compound dumbbell presses | ~6–12 reps | Per-hand versus total weight must be labeled; small micro-increments when available. |
| Lateral raises, curls, triceps extensions | ~10–20 reps | Reps often increase before a practical machine/dumbbell step; do not force disproportionate jumps. |
| Leg extension, hamstring curls, calves | ~8–20 reps depending on goal | Machine stack jumps and user's rep goal determine cadence; avoid anatomy-based hard limits. |
| Unweighted pull-ups, push-ups, dips | ~5–15 reps | Log reps and effort, with optional harder/weighted variation, not fabricated external weight. |
| Assisted pull-ups/chin-ups/dips | ~6–15 reps | Counterweight decreases after qualifying work; floor zero; recognize machine differences. |
| Weighted pull-ups/chin-ups/dips | ~4–12 reps | Track **added** load independently of body mass; use compatible increments and rep targets. |
| Planks, isometric holds | Duration (e.g. 15–45 s) | Do not force a fictional rep field. Future schema/UI support required. |
| Carries and sled movements | Distance / duration, sometimes external load | Clarify sled loading and surface/friction; never equate different sled setups automatically. |
| Olympic lifts / speed and technical power movements | Lower-rep quality-focused sets (coach/person-defined) | Do not encourage grinding reps to fatigue or applying ordinary hypertrophy double progression indiscriminately. |
| Unilateral movements | Reps **per side**, appropriately represented | Distinguish per-hand weights, completed sides, and what constitutes a comparable PR. |
| Resistance bands or unusual assisted equipment | Band/assistance setting or manual target | Do not assume "20 lb band" behaves like 20 lb cable stack throughout ROM. |

**New measurement modes, per-side logging, duration/distance and power-specific progression require separate owner-reviewed app design, migration and tests.** Do not pretend they are supported by the current numeric weight/reps inputs until verified and implemented.

## 6. Interaction and algorithm contract

- Exercise pickers should surface simple suggested defaults where appropriate, with a short explanation ("Suggested for this movement and your goal") and a straightforward **Customize** path. Do not ask every user to fill a 15-field form for each exercise.
- The live workout should show only meaningful editable quantities (e.g. **Assistance** rather than **Weight**, **Reps** for unweighted moves, **Seconds** for a future timed-hold mode).
- Weighted bodyweight variants track additional load, not total bodyweight unless the user explicitly chooses another metric. A changing body weight may affect performance interpretation but does not redefine already logged external load.
- If the user chooses an atypical window such as 20-rep bench press, **honor it**. Optionally explain it is higher-repetition work, never block it or overwrite their chosen limits.
- Distinguish **recommendation** from **required** behavior. Preserve user override and Track Only.
- Exercise substitutions and routine shares must retain or recompute the correct effective load/measurement profile, never transfer incompatible settings implicitly.
- Existing history stays immutable and correctly interpretable. Version any meaningful semantic change in profile defaults, with clear upgrade/migration policy.
- Defer any attempt to diagnose pain, injury risk, CNS fatigue, endocrine status, or overtraining from rep data.

## 7. Coverage and testing gates before implementation release

1. Inventory every built-in exercise (currently 307) and any supported custom exercise. **Every catalog entry must resolve to exactly one effective profile**, with an explicit confidence/provenance tag and safe fallback.
2. Build a classification review matrix for all distinct equipment × movement pattern combinations; document exceptions and every manual override.
3. Regression-test load direction (external ↑, assistance ↓, bodyweight reps), per-exercise rep modes, equipment increments, unknown machines, unilateral, timed/distance future modes, and substitutions.
4. Validate suggested goal-based rep windows are advisory and never rewrite user-saved settings. Test that strength-oriented bench and hypertrophy-oriented bench can coexist.
5. Keep deload, normal progression, warm-up, Coach signals, history/PRs and share/import consistent with exercise profiles.
6. Record existing Testing benchmarks for navigation, workout launch, exercise switch and set input, plus comparable post-change timings on Android. Reject performance regressions; do not introduce per-set network or LLM calls.
7. Audit UI readability on narrow screens and accessibility for color-blind users. Labels must convey load direction independently of color.
8. Release **Testing only** after green regression and real-device feedback; Beta requires explicit owner approval.

## 8. Roadmap sequence proposed for next conversation

**Phase A: Catalog audit / reference specification.** Classify all 307 built-ins, document uncertain equipment and user overrides, define movement-family templates and distinct measurement systems.

**Phase B: Engine integration.** Resolve deterministic profiles and connect them to program/routine presets and Guided Progressive Overload without overriding established settings.

**Phase C: Input and analytics precision.** Add any missing time/distance/per-side models, if the owner agrees to scope, with history-safe migration and matched progress charts.

**Phase D: Stress + performance verification.** Full regressions, library-wide deterministic classification assertions, device walkthrough, and performance check before proposing Beta.

**Owner checkpoint:** Wait for review of Testing v0.83.0 and explicit instruction before implementing this next layer. **This document changes no runtime behavior or APK.**
