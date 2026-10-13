# v0.89 Coach Brain: Quality Remediation and Before/After Acceptance

**Reviewed:** October 13, 2026. **Status:** Draft development, **not a Testing APK release**. Companion review PR #61; engineering PR #62. User approved remediation of time-limit fidelity, floor-only coverage, weekly distribution and deliberate muscle priorities. **No cloud accounts, workout histories or Beta builds altered.**

## Baselines and reproducible evidence

- **Before:** [original human-review outputs](HUMAN_REVIEW_SCENARIOS_V089.json), GitHub Actions 38454373855.
- **After:** [regenerated 20-scenario matrix](QUALITY_REMEDIATION_SCENARIOS_V089.json), GitHub Actions [38457817270](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38457817270).
- **Hard gates:** `scripts/coach-brain-quality-remediation-stress.mjs`, integrated into `.github/workflows/validate.yml`.
- Time estimates are **software planning estimates**, not stopwatch-confirmed workout lengths. A midpoint <= target is not a promise that upper-range runs will always fit. They still require actual Android-user acceptance.

| Measured property | Before | After | Meaning |
|---|---:|---:|---|
| Single-session requests generated | 12 / 13 | 13 / 13 | The previously impossible 30-minute floor-only legs workout is now supported |
| Generated single-session midpoint overrun | 3 / 12 | 0 / 13 | The estimated midpoint meets the supplied time in all generated singles |
| Multi-day programs generated | 7 / 7 | 6 / 7 | One formerly misleading floor-only 3-day full-body program is **refused** for missing real pull work, rather than falsely labeled comprehensive |
| Multi-day workout days in generated programs | 28 | 25 | Three invalid floor-only days no longer marketed as complete |
| Generated program days with midpoint overrun | 7 / 28 | 0 / 25 | Same explicit time is respected in the program midpoint model |

### P0. Duration truthfulness

The Brain now includes additional preparation allowance for demanding barbell movements and conservatively reduces *generated* optional working sets, rather than taking away user-authored exercises, explicit set counts, or rest. Actual saved routine/program sets match the time estimate. If a set of non-negotiable roles cannot fit, Coach rejects the plan and explains that a simpler request or longer duration is needed. Never assume exact real-world gym pace.

**Concrete examples:** 20-minute gym legs estimates **19 minutes**, Back Squat / Lying Leg Curl / DB calf raise, **2 working sets each**. 30-minute gym full body estimates **29 minutes** by using a manageable mix of 2–3 working sets per role. The time range often extends beyond the requested minute value; Coach still provides that uncertainty rather than promising exact session length.

### P0. Floor-only coverage and honest refusal

Two real built-in movements were added with permanent distinct IDs:

- `lib_308` **Bodyweight Squat**, bodyweight reps-only, knee-dominant quads and glutes, exercise space required.
- `lib_309` **Bodyweight Reverse Lunge**, bodyweight reps-only, unilateral knee/hip work, exercise space required and no invented left/right tracking.

This increases the **development catalog from 308 to 310**. The original 308-row research audit and IDs remain unchanged. New movement metadata, equipment and measurement profiles are in [FLOOR_COVERAGE_ADDITIONS_V089.json](FLOOR_COVERAGE_ADDITIONS_V089.json), with corresponding compiled local Brain profiles.

A 30-minute no-equipment leg workout now generates **Bodyweight Squat, Glute Bridge and Single Leg Calf Raise** (25-minute midpoint). No Nordic fixture, leg machine or external weight is assumed.

A true floor-only full-body workout has no confirmed safe pulling exercise in the present catalog. Such a request is **rejected with an equipment explanation**. A confirmed pull-up bar or other equipment can unlock pulling options. There is no fabricated back-training movement or silently incomplete full-body program.

### P1. Whole-week stress and exercise variation

Full-body programming now considers alternative posterior-chain roles on later days instead of mechanically repeating deadlifts. Three-day gym full-body now rotates an RDL on one day with hip thrust/bridge on later days, along with changing squat/lunge and press/row variants.

Six-day PPL now avoids heavy deadlifts on pull days when they were not explicitly requested and caps redundant row and vertical-pull duplicates within pull days. Explicit named exercises still override normal scoring where equipment and exclusion constraints permit; none of these heuristics diagnose soreness, recovery, overtraining or injury.

### P1. Deliberate muscle emphasis and level-appropriate complexity

For vague gym workouts, Coach no longer promotes the two new floor-only movement IDs ahead of loaded alternatives solely because their names are simple. They remain available when requested or when equipment truly is constrained.

A 60-minute advanced shoulders-and-arms request now includes both direct biceps work and **two distinct triceps angles** (Overhead Triceps Extension and Rope Triceps Pushdown), without unrequested reverse wrist curls. Shoulder pressing, lateral and rear-deltoid work remain represented. *Advanced programming sophistication is not automatically a mandate for technical Olympic lifts.*

## Unchanged safety invariants

- Assisted weight is not added weight, regular bodyweight movements have no invented loading, timed/distance logging stays metric-aware, and no exercise substitutions transfer history/PRs.
- Existing sessions, routines, user overrides and Supabase Google accounts are untouched.
- Strictly **development branch only** until CI and Android owner acceptance, no Beta promotion.
- 310-catalog regression explicitly verifies the original 308 plus two separately classified new IDs, including no migration of existing IDs.
- Existing original exercise-audit study references remain the [2026 ACSM resistance training position stand](https://pubmed.ncbi.nlm.nih.gov/41843416/) and project research foundation; these new ranking/time rules are **product engineering heuristics** to be field-tested, not scientifically precise laws.

## Next engineering follow-up: custom-workout duration honesty

Draft [PR #63](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/63) extends this remediation to **explicit user-authored** workout lists, whose original v0.89 preview omitted time estimates entirely. It estimates the actual custom sets/reps without trimming any, distinguishes a genuine user-requested minute limit from the default 45-minute prescription preset, and allows time-only refinement without changing the explicit list. Regression coverage is included in the existing quality-remediation test script. Scope, scientific limitations and sign-off gates are saved in [EXPLICIT_DURATION_ACCEPTANCE_V089.md](EXPLICIT_DURATION_ACCEPTANCE_V089.md). **No Android or Beta release was made; CI confirmation is a separate gate.**

## Remaining real-world acceptance

1. Review 20-minute and 30-minute actual phone workouts with measured durations including warm-up sets, equipment wait times and unilateral transitions.
2. Confirm new Bodyweight Squat/Reverse Lunge tracking and availability on Android; check beginner explanations.
3. Verify program preview uses adjusted sets, is legible, and shows any estimated time uncertainty.
4. Test unusual prompts and user overrides, e.g. an explicit 5×5 heavy deadlift in 20 minutes (should not silently downgrade a requested set count).
5. No owner-accepted APK has been released yet. Testing remains v0.88.0, Beta remains v0.73.1.

**This engineering checkpoint is not equivalent to final real-device human acceptance.**
