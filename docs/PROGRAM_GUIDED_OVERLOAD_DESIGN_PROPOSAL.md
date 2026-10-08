# Program-Based Guided Progressive Overload: Design Proposal

**Status: DRAFT / NOT APPROVED FOR IMPLEMENTATION**
**Design discussion:** 2026-10-08
**Scope:** Multi-workout Programs and program-launched workouts. Existing standalone routines and Track Only behavior remain unchanged unless separately approved.
**Research:** [TRAINING_SCIENCE_FOUNDATION.md](TRAINING_SCIENCE_FOUNDATION.md), [COACH_SWOLECAT_EVIDENCE.md](COACH_SWOLECAT_EVIDENCE.md).
**Important:** No runtime/algorithm/default/schema/version change is authorized by this document.

## Product goals from owner feedback

1. Program training mode must require an **explicit decision** when creating a new program: Use each routine's mode, Guided Progressive Overload, Strength Focus, or Track Only / Standard Workout. No preselected mode in the new-program editor. Show a visible prompt and refuse save until a valid choice is made.
2. Maintain existing Routine/Program toggle; keep single routines independent.
3. When the user selects Guided Progressive Overload for a program, expose relevant personalized training-block and deload options, but do not overwhelm them with advanced requirements.
4. Deloads are **conspicuous**, explained ahead of time, opt-in/confirmable or deferrable, and evident on program cards, launch controls, active workout, history and progression/analytics.
5. Deload loads/sets/reps are deliberately reduced training stress, **not observed strength loss**. Do not pollute normal progression targets, plateaus, PR interpretation or strength estimates with deliberate deload performance.
6. Preserve real workouts, histories, user overrides, offline operation, share/import compatibility and program-level settings.

## What code currently implements (v0.81.0)

- `src/js/03-programs.js`: New program draft defaults `trainingMode: 'inherit'` and renders that as first selected choice, with frequency, optional preferred days and ordered routines. Saves `id, name, routineIds, frequency, preferredDays, trainingMode, nextIndex`. After completing a program workout, `nextIndex` rotates. No program training-week/deload phase.
- `src/js/06-workout-engine.js`: Routine/program modes `guided, strength, track`. Guided rep-first double progression suggests +1 rep per working set and configurable weight increase after every required set reaches the rep ceiling. It uses recent previous performance by exercise, not a deload-aware program training-phase baseline.
- Workout session stores `programId` and `trainingMode`, but not deload phase or planned-block identity. Existing coach/performance/PR paths rely on recorded sets.
- `src/js/01-core-runtime.js`: Saved program normalization defaults missing/invalid mode to inherit. Retain this behavior for **legacy import compatibility**; a blank "choose" value should exist in the unsaved new-program draft/UI only.
- `src/js/05b-sharing.js`: Program sharing includes frequency/mode and routines; future deload *template preferences* could be added with versioned compatibility, but never serialize another user's training progress or personal baselines.

**Architectural caution:** A cosmetic 'deload' banner alone will not solve this. The entire history/progression/Coach pipeline must recognize intentional low-stress sessions.

## Proposed program-creation UX

1. **Program name**
2. **Program training mode: Select a training mode** (blank, required for new program only)
   - Use each routine's mode
   - Guided Progressive Overload
   - Strength Focus
   - Track Only / Standard Workout
   - Explain each choice in one sentence and show validation in place, not only a toast.
3. **Target workout days/week** and optional preferred weekdays.
4. **Workout rotation** with explicitly ordered routines.
5. On selection of **Guided Progressive Overload**, reveal optional **Progression and Recovery** panel:
   - Rep ranges / chosen routine targets; avoid overwriting set structures silently.
   - Increment strategy: existing exercise-specific steps, equipment-aware steps, or manual choice.
   - Optional effort context (RIR) without requiring RIR logging.
   - **Deload preference**: Plan periodic / Remind me, decide then / No automatic schedule.
   - Interval: **after N training weeks** with selectable N (e.g., 3, 4, 5, 6, custom), and **1 deload week** as an editable duration. Preview "Train for 3 weeks, deload in week 4."
   - Deload intensity template: suggested modest working-set volume reduction, effort farther from failure, optionally lighter load. Preview actual sets and weights before confirming. Show these as customizable *coaching heuristics*, not medically/scientifically mandatory percentages.
6. Save Program requires a training-mode selection and at least one routine. New program setup must not require users to answer an extensive questionnaire.

**Existing program edits and imported/legacy programs** retain valid persisted modes; user should not be forced through migration. Invalid historical values normalize safely, and legacy missing deload fields mean "not configured" rather than silently triggering a deload.

## Deload scheduling semantics: decision still pending

**Explicit owner example:** 3 normal training weeks followed by a deload week; user also described 3 full passes through program routines. These can differ.

- **Recommended initial unit: training weeks**, not number of completed rotation passes. A 3-routine program can be completed more than once per calendar week.
- Program should identify an anchored training-block week, training schedule and actual completed sessions; missed days/weeks should not cause a silent deload by the mere passage of time. Instead show "Adjust schedule", "Keep current training week", "Begin deload", and "Defer".
- The *exact default* is not scientifically established. Deloads every ~4–6 weeks are common coaching practice (Bell et al. 2023), but studies do not establish a universally optimal interval. If product chooses a suggested preset, label it an editable starting point, not proven optimum. Three working weeks + fourth deload week should be available.
- Clarify what counts as completing a week, an uncompleted routine, reordered routines, travel/sick weeks, missed workouts, workout cancellation, multi-week pause and edits mid-block.
- An optional **completed-rotations** interval may be a future advanced mode if user confirms demand.

## Deload lifecycle and visible communication

Suggested high-level phases: `normal -> deload_upcoming -> deload_pending_confirmation -> deload_active -> normal`, with optional `deferred` and `skipped` records.

- **Ahead of time:** "Deload week is coming up. Your next workouts will intentionally have fewer hard sets / lower effort. Review plan."
- **Activation:** Clear **Deload Week** label, distinct color plus text/icon (not color alone), original versus deload targets, manual confirm/defer.
- **Active workout:** Header badge, explicit "lighter by design", modifiable sets/reps/weight, ability to skip deload for a session. No false "failed target" feedback.
- **History/Progress:** Distinct Deload tag and workout volume; calendar and charts annotate deload intervals; recap explains intentional workload reduction.
- **After deload:** "Back to normal training" with recovery-friendly recommendations based on **pre-deload eligible sessions**, not artificially lowered deload numbers.
- **On program switch:** Phase anchored to that program; starting a standalone routine must not accidentally inherit the selected program phase.

## Core progression decision separation

Maintain two related but different streams:

1. **Factual activity history:** Every genuine saved session shows actual weights, reps, sets, volume and attendance. Deload sessions count as training activity and should not be deleted/hid.
2. **Eligibility-filtered performance evidence:** Adaptive progression targets, plateau/decline detection, projected strength trends and reset suggestions must exclude *planned deload work* as evidence of decreased capacity. Optionally annotate chart gaps rather than connecting them misleadingly.

Proposed program-aware session metadata: `programId`, `programBlockId`, `programWeekIndex`, `programPhase: normal|deload`, `deloadPlanId`, `plannedVsActualTargets`, `phaseChosenByUser`. Names not finalized. Save phase onto active workout at launch and the finished session, so editing a workout or changing program settings later does not rewrite history.

**Suggested baseline policy:** Find the most recent *comparable and eligible normal working-set exposure* for the exercise. For program-based recommendations, prefer same-program context and check exercise identity/config/role; consider broader personal history for initial loading but never use a deliberately easy deload session as the next load/reps baseline. This avoids cross-program contamination when an exercise is shared by multiple programs.

**PR handling:** Deload does not automatically imply weakness. Genuine workload is visible; never create "strength declined" notices from deload data. Whether an authentic exceptional PR during a deload counts as a global PR is a separate product decision. Do not simply erase or rewrite measured performance.

**Protect against zero weight and test data:** 0 external load can correctly mean bodyweight, but missing weight or synthetic test data is not a validated strength baseline. Set type (warm-up, working, drop, top/backoff), completion, exercise and units matter.

## Personalized progression behaviors (design hypotheses, not authorized changes)

- Keep simple double progression as an understandable baseline; differentiate progressive challenge from automatic weight increases.
- Make weight changes proportional to current load and available equipment; fixed 5 lb jumps may be unreasonable for small movements.
- RIR/RPE is useful **optional** context; missing RIR is unknown, not 0 RIR.
- Hold after isolated miss, repeated hard stalls may prompt review, and genuine repeated declines with user-reported fatigue may prompt "consider lighter week". Do not diagnose overtraining.
- Do not add sets automatically as a universal cure for plateaus; training volume has diminishing returns.
- Do not overwrite user-specific exercise rep ranges, rest or top/backoff structure in the name of progressing.
- User can accept, hold, edit or override; explain "why" in plain language.

## Edge cases to test before any release

New-program blank/required mode; legacy program opening/editing; imported/shared program including/without new settings; routine mode inheritance; Track Only unaffected; normal/deload boundaries at 1, 3, 4, 5+ days/week; three-routine program repeated twice in one week; missed/rest weeks; schedule deferral; incomplete, abandoned, edited, deleted workouts; app restart offline mid-deload; cloud sync between devices; program edits mid-block; switching active programs; starting routine outside program; changed unit lb/kg; changing weights during deload; accidental PR/plateau from deload; duplicate exercise in different routines/programs; different set types; no personal baseline; 0 lbs on bodyweight versus blank/unentered weight; coach autoregulation and adaptive reset; progression resumption after deload; no duplicate deload cycles after sync.

## Evidence and caveats

- ACSM 2026 position stand: progressive resistance exercise is useful; programming should suit goal and person. https://pubmed.ncbi.nlm.nih.gov/41843416/
- Bell et al. 2023 deload Delphi: consensus on practice; not proof of a universal optimal schedule. https://pmc.ncbi.nlm.nih.gov/articles/PMC10511399/
- Deload practice survey: competitive athlete average ~5.6 weeks, highly variable, not a causal intervention. https://pmc.ncbi.nlm.nih.gov/articles/PMC10948666/
- Coleman et al. 2024: full week off versus continuous training; no compelling reason to mandate full cessation. https://pubmed.ncbi.nlm.nih.gov/38274324/
- Pancar et al. 2026: small untrained experiment of reduced-volume/frequency deloads, not a universal prescription. https://pubmed.ncbi.nlm.nih.gov/41730991/

## Open decisions to confirm with product owner BEFORE coding

1. Should the first schedule measure **calendar/training weeks**, **completed rotations**, or offer both? Suggested initial choice: training weeks with confirmation/adjustment after missed sessions.
2. Does the app **suggest** deloads, or enter them automatically after advance notice with a Skip/Defer control? Recommended: explicit review/confirmation for phase changes.
3. Which preset should be highlighted, if any? Evidence does not justify claiming 3, 4, 5 or 6 weeks as universally optimal. No mandatory schedule.
4. Should deloading be available to Strength Focus later? Physiologically the concept is not limited to Guided Progressive Overload; defer cross-mode expansion for initial scoped implementation.
5. Should the next performance recommendation after a deload target a full return to pre-deload load, or optionally suggest a short ramp-up? Avoid universal assumptions.
6. Should globally valid PRs during a deload be recognized, while deload sets are excluded from *decline* analytics?

**Implementation gate:** Research and design only. No code change until the product owner reviews these choices and explicitly authorizes development in Testing. Beta requires separate approval.
