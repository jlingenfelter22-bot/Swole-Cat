# Coach whole-week first-draft balance, October 26, 2026

**Development draft only, baseline Testing v0.93.9 (Android versionCode 145).** Owner gave go-ahead to prioritize the remaining Coach intelligence workout-quality issues. No APK/version bump, cloud account work, saved workout changes, signing, updater or Beta promotion.

## Current implementation and problem

The existing program generator chooses each day sequentially. The Phase 2 whole-week auditor then notices gaps, and the Phase 3 shadow engine proposes user-optional exercise swaps. In the frozen `3day_full_gym` scenario, all three days have pressing and rows but no vertical pulling; day B uses overhead pressing while both adjacent full-body days already provide vertical pressing. The Phase 3 engine already proposes a vetted midweek **Overhead Press -> Lat Pulldown** swap.

A useful first-draft preview should not require opening a hidden recommendation merely to see a reasonable complementary weekly exercise. This is a quality heuristic, **not a claim that vertical pulling is obligatory for everyone or that overhead pressing is ineffective**.

## Implemented narrow behavior

- During the first completed **Coach intake** of a new unsaved Program, only for exactly three **full-body** days at a known **gym**, Coach may use the existing Phase 3 bounded swap evaluator to trade a middle-day optional vertical press for a verified available vertical pull.
- The changed day must retain its chest press and other required coverage, and the days on either side must retain vertical pressing; existing audit score must improve without a new critical gap.
- No additional exercises or automatic sets; only one swap, keeping session-time estimation refreshed and within existing rough planning tolerance.
- No changes at all when users specify shoulder priority, a shoulder press in the request, explicitly required exercises, manually accepted or excluded movements, day-level overrides, declined suggestions, Track Only or Strength Focus. Skip all 2-, 4-, 5-, 6-day plans, PPL, custom days, home-only or dumbbell-only equipment and unknown equipment.
- Normal Coach generation itself remains unchanged for direct program generation and for later edits/refinements. The improvement is confined to `coachContinueProgramRequest`'s fresh intake preview. Existing optional recommendations continue as optional for other issues such as knee-flexion variety.
- One short rationale is displayed in the existing preview; manual Swap/Remove can override it before saving.

## Evidence and scope

Research reference: **Currier et al. (2026) ACSM resistance-training overview**, PMID 41843416; **Pelland et al. (2026) training dose-response review**, PMID 41343037; **exercise-variation systematic review (2022)**, PMID 35438660. Broad evidence supports coherent weekly programming, goal-specific selection and useful movement variety. It does **not** define mandatory movement-family quotas or prove a universal vertical-pull requirement. The numerical repair debt score, conservative 3-day scope and week-level swap predicate are **engineering decisions**, not experimental treatment findings.

## Non-regression gates

`scripts/coach-weekly-first-draft-balance-stress.mjs` verifies the exact middle-day movement change, better weekly-audit findings, duplicate-free selection, preservation of chest pressing and other days, original-draft and localStorage immutability, deterministic reruns, recalculated time, preview-to-Routine parity, explicit required lifts, declined swaps, Focus/Strength/Track only choices, and non-gym/no-split/no-priority eligibility. The full existing frozen generator baseline remains stable; the new behavior affects only the new-program interactive intake handoff, not saved workouts or other callers.

**Still to validate:** actual Android presentation, responsiveness and diverse human judgments about the generated weekly exercises, including users who want higher shoulder-press frequency. This phase does not solve every full-body, PPL or equipment-limited week, and it does not automatically add hamstring-curl sets. A wider optimizer is deferred until representative before/after human-quality review demonstrates benefit.

**Release policy:** separate signed Testing approval, exact-head green CI and Synthetic Performance, fresh Android version/versionCode, in-place update. Never promote Beta without separate owner instruction.
