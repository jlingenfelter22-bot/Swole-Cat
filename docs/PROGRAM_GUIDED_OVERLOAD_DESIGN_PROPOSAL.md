# Program-Based Guided Progressive Overload: Design Proposal

**Status: DESIGN SPECIFICATION IN PROGRESS / NOT APPROVED FOR IMPLEMENTATION**
**Design discussion:** 2026-10-08; deload opt-in and cadence confirmed in follow-up.
**Scope:** Multi-workout Programs and program-launched workouts. Existing standalone routines and Track Only behavior remain unchanged unless separately approved.
**Research:** [TRAINING_SCIENCE_FOUNDATION.md](TRAINING_SCIENCE_FOUNDATION.md), [COACH_SWOLECAT_EVIDENCE.md](COACH_SWOLECAT_EVIDENCE.md).
**Important:** No runtime/algorithm/default/schema/version change is authorized by this document.

## Product goals from owner feedback

1. Program training mode must require an **explicit decision** when creating a new program: Use each routine's mode, Guided Progressive Overload, Strength Focus, or Track Only / Standard Workout. No preselected mode in the new-program editor. Show a visible prompt and refuse save until a valid choice is made.
2. Maintain existing Routine/Program toggle; keep single routines independent.
3. When the user selects Guided Progressive Overload for a program, expose relevant personalized training-block and deload options, but do not overwhelm them with advanced requirements. **Confirmed:** Deloading is OFF by default and the user must explicitly opt in. Only the Guided Progressive Overload program mode reveals deload configuration; selecting another mode must not show or silently activate the guided-program deload scheduler.
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
   - **Schedule deload weeks** toggle, **OFF by default**. It is a voluntary opt-in for this guided program; an off choice saves `deload.enabled = false` (schema illustration, not implementation).
   - When OFF: hide all deload interval controls; keep Guided Progressive Overload fully functional with no calendar-based deload insertion.
   - When ON: show **Deload every Nth training week** with an editable **4-week preset**. This means weeks 1–3 are normal training and **week 4 is the deload week**. Repeat the cycle in weeks 5–8 (week 8 deload) unless the user changes, defers or stops it.
   - Offer explicit preset cycle lengths **3, 4, 5, 6, 7 and 8 weeks**, plus **Custom** for a user-chosen positive, sensible week count. Wording must be unambiguous: "Every 4th week = 3 normal weeks + week 4 deload," **not** "after 4 weeks, deload in week 5." Validate boundaries when designing the final input.
   - Deload duration: **one training week** in the initial product scope; ability to adjust interval remains personalized and saved per program. A longer deload is outside current user-confirmed scope, not ruled out forever.
   - Inline preview updates to match the selected cadence and shows both the next deload and subsequent repeat. No deload countdown or schedule appears at all for users who have not enabled it.
   - Schedule is a **configurable coaching tool**, not a scientifically proven four-week optimum. This four-week preset is a UX preference, while direct evidence does not establish one universally optimal frequency [Bell et al. 2023; deload practices survey 2024].
   - Entering a scheduled week must display a clear explanation and controls to review, defer or skip. Never silently change weight/sets/reps; exact confirmation workflow to be finalized before code.
   - Deload intensity template: suggested modest working-set volume reduction, effort farther from failure, optionally lighter load. Preview actual sets and weights before confirming. Show these as customizable *coaching heuristics*, not medically/scientifically mandatory percentages.
6. Save Program requires a training-mode selection and at least one routine. New program setup must not require users to answer an extensive questionnaire.

**Existing program edits and imported/legacy programs** retain valid persisted modes; user should not be forced through migration. Invalid historical values normalize safely, and legacy missing deload fields mean "not configured" rather than silently triggering a deload.

## Deload scheduling semantics: product direction CONFIRMED, edge cases still pending

**Owner decisions confirmed:** Schedule planned deloads by **training weeks**, never by completed routine rotations. Deload scheduling is **off unless the person opts in** when creating/editing a program that uses Guided Progressive Overload. If enabled, the proposed UI highlights a **four-week cycle** as its editable preset, not a physiological requirement.

- Interpret "every N weeks" precisely as **deload in every Nth week of the block**. A 4-week selection means three normal weeks and a deload week in week 4, then normal training in week 5. Choosing 3, 5, 6, 7, 8 or Custom shifts the same Nth-week boundary. Do not introduce off-by-one errors by calling this "N full normal weeks followed by a deload."
- Count anchored *training weeks* rather than rotation passes. A 3-routine program may be completed more than once during a week.
- Both the opted-in state and interval belong to the **specific program**, not the user globally. Another program may have another cadence or no deload; switching programs should not corrupt either plan.
- Program should track a block start/anchor and actual completed sessions. Missed days or an extended pause should not cause a silent deload by the mere passage of time. Offer contextual "Adjust schedule," "Keep current training week," "Review/Begin deload," and "Defer." Exact paused-week counting policy remains a design decision.
- Four weeks is a **user-requested suggested preset**, not a scientifically optimal schedule. The 2023 Delphi reflects coaching consensus commonly near 4–6 weeks, and a 2024 convenience survey of 246 competitive strength/physique athletes found an average frequency of 5.6 ± 2.3 weeks. Both describe coaching or athlete practice, not superior physiological outcomes for everyone.
- Clarify what counts as completing a week, an uncompleted routine, reordered routines, travel/sick weeks, missed workouts, workout cancellation, multi-week pause and edits mid-block.
- Rotation-based scheduling is **out of the initial scope**; consider only if newly requested.

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

**Resolved with owner:** Training **weeks**, not rotations; opt-in deload toggle initially **off**; show options only with **Guided Progressive Overload** program mode; editable interval **3–8 weeks plus custom**; **every fourth week** suggested preset when enabled (three normal weeks + week four deload). One deload week per cycle in initial scope.

**Still to confirm before implementation:**
1. Detailed definition of active training weeks when scheduled sessions are skipped, the user travels, or an entire calendar week is missed, and whether the program clock pauses or requests a reschedule.
2. Exact user confirmation flow before reduced-stress targets begin, including deferral, skip, and reminders. Must remain clearly visible, never silently transform weights/reps.
3. Should the next performance recommendation after a deload target a full return to pre-deload load, or optionally suggest a short ramp-up? Avoid universal assumptions.
4. Should globally valid PRs during a deload be recognized, while deload sets are excluded from *decline* analytics?
5. Whether other program modes will eventually support deloading is a separate future feature; not in this Guided Progressive Overload scope.

**Implementation gate:** Research and design only. No code change until the product owner reviews these choices and explicitly authorizes development in Testing. Beta requires separate approval.

## 2026-10-08 follow-up: confirmed deload settings

- **No deload by default.** A Guided Progressive Overload program is completely valid with scheduled deloading turned off.
- When toggled on, **four-week repeating cycle** is the *suggested, editable* preset, with weeks 1–3 normal and week 4 deload.
- **Preset frequencies:** every 3rd, 4th, 5th, 6th, 7th or 8th week; Custom allows additional cadence with validation.
- **Training week**, rather than completing the program rotation a particular number of times, is the chosen scheduling unit.
- **One week** is the intended deload duration in the initial scope.
- These settings belong to each Guided Progressive Overload program and are not shown for Strength Focus, Track Only or Use each routine's mode under the initial scope.
- **Science caveat:** Bell et al. (2023) expert Delphi and the 2024 athlete survey describe variable practices, not experimental proof of the best frequency. Default is UX convention, not a prescription.
- The owner is still discussing program behavior; **no implementation authorization or runtime algorithm change** is implied by documenting these choices.
