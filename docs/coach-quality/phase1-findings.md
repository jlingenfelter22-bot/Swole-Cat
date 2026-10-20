# Coach Whole-Week Quality — Phase 1 Baseline Findings

**Date:** October 20, 2026  
**Status:** Synthetic audit and repeatable *current-behavior* baseline complete; no production selection rules altered.  
**Source:** Accepted Testing v0.93.4 / Android versionCode 139 on `main`, exercised in isolated bundled DOM CI.  
**Workflow:** [Validation run #39452967221](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/39452967221) — **PASS, 100/100 steps** on initial Phase 1 PR head. A final head rerun is required after committing this frozen baseline/documentation.

## Evidence captured

- Full catalog audit: `scripts/coach-phase1-catalog-audit.mjs`; artifact `catalog-audit.json` from the CI run.
- Twelve deterministic whole-week scenarios: `scripts/coach-phase1-weekly-baseline.mjs`; artifacts `weekly-program-human-review.json` and `weekly-baseline-frozen.json`.
- Permanent golden capture: `docs/coach-quality/phase1-baseline-v0934.json` checks the **exact existing exercise IDs/order, planned working sets, time estimates and primary/secondary region exposure** before implementing improved selection. Baseline captured directly from a successful CI run rather than authored from guesses; repeat run in that job produced identical output.
- Artifacts are hosted by the PR's GitHub Actions workflow for 30 days; the frozen golden is retained in the repository.
- 12 scenario requests (11 programs generated, **one correctly rejected** due to bodyweight-only full-body pulling constraints). **44 individual programmed days** reviewed. This is synthetic functional evidence, not a clinical training study, user trial, or real stopwatch timing.
- CI asserts program generation did **not modify sessions/routines/programs**. All modeled selected exercises had status `available` under their chosen equipment preset. No cloud, account or Android process is exercised here.

## Full-catalog integrity

**310/310 original built-in entries** have unique IDs and complete structural metadata; **zero fatal** validation findings. The Brain profiles also cover 310 entries. Model-eligible availability by **common-gym / dumbbells+bodyweight / bodyweight-only** equipment presets is **183 / 53 / 16**, respectively. These numbers reflect the app's own capability assumptions, *not a warranty that a particular gym owns every machine*. A floor-only environment's inability to cover all pulling roles is a known equipment limitation, not a reason to invent a vertical-pull exercise.

The comparison between the *current live* muscle assignment and the *earlier desk-reviewed/proposed* Brain profile found **three discrepancies for human adjudication**:

| Exercise | Current live primary/secondary | Previous Brain desk proposal | Disposition |
| --- | --- | --- | --- |
| Renegade Row (`lib_93`) | Primary upper back/lats; secondary rear delts/biceps | Adds core/obliques as secondary | Review stabilizer credit: avoid assuming all stabilization equals a full working set for core |
| Push Press (`lib_123`) | Primary front/side delts; secondary triceps | Primary front delts/quads/glutes; secondary triceps/core | Review explosive leg drive vs primary target; neither position is automatically a verified physiology fact |
| Roman Chair Back Extension (`lib_285`) | Primary lower back; secondary glutes/hamstrings | Primary hamstrings/glutes; secondary lower back | Review exercise execution and back/hip-extension variants; don't overwrite a user's logged history |

**Do not automatically overwrite the live metadata using unapproved desk proposals.** These records are candidates for careful catalog assessment, not proven bugs or authorization to remap exercise IDs.

### Important limitation in current exposure accounting

The current runtime uses one primary set-equivalent for **each** listed primary muscle and 0.5 for each secondary muscle. This is a rough programming/visibility heuristic, **not a literal anatomical stimulus or scientifically exact workload**. E.g., counting every squat's glutes as a whole primary set contributes to apparently very high "glute volume" without necessarily reflecting the person's goal, technique or glute-specific selection. Phase 2 must distinguish *represented through compounds* from *priority-directed exercise selection*.

## Actual generated-week observations

### General three-day full-body gym, 45-minute planning preference

- **Day A:** Back Squat, Romanian Deadlift, Barbell Bench Press, Barbell Row, Dumbbell Shoulder Press.
- **Day B:** Bulgarian Split Squat, Decline Barbell Bench Press, Seated Cable Row, Overhead Press, Hip Thrust.
- **Day C:** Front Squat, Dumbbell Bench Press, Chest Supported Dumbbell Row, Arnold Press, Barbell Glute Bridge.
- Estimated typical time per day: **44 / 41 / 41 min**; these are approximate engineering estimates.
- Broad roles are present: pressing, rowing, knee-dominant movement and a posterior exercise. But **zero vertical pulls, zero knee-flexion movements and zero calf work across the week**. Direct hamstrings counted as **3 set-equivalents**, glutes **18**, chest **9**, with **no primary lower-back exercise**. This is not automatically "wrong" under time and personal preference; it shows a *coverage/diversity opportunity* that the whole-week review currently misses. Three similar vertical presses and three squat/lunge selections emphasize what day-by-day slots happen to choose.
- Good Phase 2 question: can **one** low-value repeat be replaced with a different major role while preserving the user's split, equipment, time range and useful strength anchors?

### Four-day dumbbell upper/lower with explicit glute priority

- Both lower-body days contain a **Goblet Squat and Bodyweight Squat** in the same session, with Bulgarian Split Squat (Day A) or Reverse Lunge (Day B), Dumbbell Romanian Deadlift, Glute Bridge and calf raise.
- The baseline flags two same-family squat repeats, once on each leg day. It reports **30 glute primary set-equivalents**, **6 hamstring primary**, and no knee-flexion role from the limited dumbbell-only repertoire.
- This is a concrete *redundancy finding*, not proof that the glutes actually experienced 30 physiologically identical hard sets. First check feasible equipment-appropriate alternatives: glute-priority hip-extension/hinge/lunge variation, not inventing a seated machine leg curl without one.

### Four-day gym upper/lower with shoulder priority

- The current generator already includes **direct side and rear deltoid work**, with Cable/Dumbbell Lateral Raise and Face Pull/Reverse Fly across upper days.
- Explicit priorities are **recognized** in this case. Keep this as a *positive regression fixture*: Phase 2 must not degrade a good shoulder specialization merely to create different-looking workouts.

### Six-day gym push/pull/legs

- The current generator includes horizontal and vertical pulling, pressing, knee-dominant legs, hinge, hamstring curls and calves distributed across six days.
- Existing split semantics and useful per-day slots often work. **Preserve them.** Phase 2 should correct demonstrated shortcomings without unnecessarily randomizing or rewriting every exercise.

### Dumbbell-only three-day full body, bodyweight-only full body

- Three-day dumbbell full-body includes major push, row, knee and hip patterns, but no vertical pulling, calf work or knee-flexion movement across its limited repertoire. Missing unsupported equipment is *not* an automatic algorithm failure.
- The bodyweight-only three-day full-body request is **correctly rejected as infeasible** under the existing coverage gate: no suitable confirmed pulling equipment. This is a valuable truthfulness test, not an error to fix by inventing a bodyweight row.

## Phase 2 engineering priorities, ranked

1. **Full-week roles before accepting per-day picks.** Read-only audit of major movement patterns across the whole rotation with **in-scope** expected roles based on split, goals and feasible equipment. Important repeated omissions should be visible in evidence, not rigid mandatory 10-sets-per-muscle alarms.
2. **Primary versus indirect coverage and explicit priority satisfaction.** User-requested glutes, side delts, lower back, hamstrings etc. get a deliberate selection evaluation. Properly credit squats/hinges, but do not count incidental exposure as identical to a focused movement.
3. **Avoid low-value redundant choices.** Detect repetitions such as Goblet Squat + Bodyweight Squat in the same limited-equipment day; first consider exchanging one for an actual complementary feasible movement, not just appending another exercise.
4. **Respect appropriate constraints and keep what is good.** Honor split, experience, day-specific equipment, protected exercises, user exclusions, continuity and direct shoulder priorities; no forced vertical pull when no equipment supports it.
5. **Bounded human-reviewed correction, not opaque perfection scoring.** Before implementing any repairs, run identical 12-case golden fixtures and manually assess which proposed swap improves usefulness, training stimulus and recovery compatibility. Recompute saved set prescriptions and time estimates afterward. Time remains a *range*, not an exact finishing promise.

## Release and quality gates

Phase 1 PR changes only **test scripts, a CI job, documentation and a frozen baseline file**. No app JavaScript, generated CSS, Android package identifiers, signing, version bumps, Supabase accounts, app data or Beta change. The earlier [draft PR #84](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/84) adds multiweek logged-history muscle-region intelligence and can be evaluated separately. [Draft PR #83](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/83) implements strict minute-driven set trimming and needs correction before any consideration of release under the owner's approximate-duration policy. [Draft design PR #85](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/85) provides Phase 2 architecture.

Next deliverable after approving Phase 1: a pure `auditProjectedWeek` research-informed function that operates on **the identical 12-case baseline**, grades missing *feasible in-scope roles* and direct/secondary muscle priorities, and returns clear reasons. **No autonomous exercise swaps or UI redesign until that audit is validated.**
