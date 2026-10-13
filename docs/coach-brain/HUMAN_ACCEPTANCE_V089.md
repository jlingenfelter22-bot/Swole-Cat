# Swole Cat Brain v0.89: Human Session and Program Acceptance Review

**Date:** 2026-10-13. **Status:** First human inspection completed. **Release decision: NOT ACCEPTED YET. No behavioral changes authorized or made here.**
**Baseline:** draft PR #60 and its unmerged v0.89 prerequisites. Testing installed version remains v0.88.0; Beta remains frozen at v0.73.1.

## Method and decision rules

We are reviewing **actual execution results** of the full deterministic Coach app in a JSDOM harness, not writing hypothetical workouts or claiming a pass just because a routine was generated. Source fixture: `scripts/coach-brain-human-review-matrix.mjs`. Each scenario captures the generated exercises, pattern/equipment, primary/secondary muscle roles, existing Coach sets/reps/rest, exact v0.89 estimated lower/middle/upper durations with work/rest/setup breakdown, the pre-Brain selection, and inferred program weekly set-equivalents.

### Scenario inventory

Single sessions: 20/30/45-minute gym legs, 30-minute dumbbell and bodyweight legs, 30-minute gym strength legs, 45-minute gym back, 60-minute advanced shoulders/arms, 45-minute dumbbell upper body, 30-minute chest, 30-minute full body (gym + home), 60-minute upper-body strength.

Multi-day: 3-day full-body 45-minute gym, 4-day upper/lower 35-minute gym, 4-day upper/lower 35-minute dumbbell, 5-day balanced 45-minute gym, 6-day push/pull/legs 60-minute gym, 3-day full-body 30-minute dumbbells, 3-day full-body 30-minute bodyweight.

### Human reviewer rubric

| Domain | Acceptance criteria | Red flags |
|---|---|---|
| Time feasibility | Middle estimate should normally fit target; clearly disclose upper uncertainty, setup assumptions and when user needs to remove work | 35-minute plan silently contains >40 minutes of planned rests/work; high-demand compound clusters; estimate uses inappropriate rep units |
| Target fidelity | Exercise roles cover the explicitly stated target and priorities; untrained regions are acknowledged | A "legs" workout contains only glutes/calves; "advanced shoulders/arms" is all compound presses |
| Within-session redundancy | Meaningful complementary patterns, rather than counting similar exercises as extra muscle coverage | Repeated high axial hinge and squat heavy lifts in 20–30 minutes; repeated exercises without distinct role |
| Program balance | Weekly muscles and patterns proportionate to the declared split/frequency; adequate rest/scheduling considerations when feasible | Full-body days omit push/pull or knee/hip roles; upper/lower plan's lower day is only calf work; six days all favor one region |
| Goal specificity | Strength prescriptions allow sufficient rest, skill practice; hypertrophy balanced by volume and accessory practicality | Power lifts treated as high-rep failure accessories or all strength sets squeezed into short session |
| Equipment honesty | Every proposed movement is available within declared inventory, with clearly qualified assumptions | Bodyweight floor-only plan includes pull-up bar, Nordic anchor or leg machine; standard gym assumes specialty landmine |
| User control | New chat asks for meaningful missing info, multi-part edits retain constraints, substitutions are revisable | Persistent restriction disappears; changes silently rewrite user history |
| Evidence and uncertainty | Treat weekly set equivalents as programming approximations, not proven biological doses; do not prescribe medical recovery diagnoses | Claims of optimum universal sets/time or fabricated readiness |

## Evidence and limits

References: `docs/TRAINING_SCIENCE_FOUNDATION.md`, `docs/EXERCISE_INTELLIGENCE_FOUNDATION.md`, `docs/EXERCISE_LOAD_BEHAVIOR.md`, `docs/COACH_SWOLECAT_EVIDENCE.md`, and the v0.89 308-exercise audit. Relevant published anchors: 2026 ACSM resistance training position stand DOI `10.1249/MSS.0000000000003897`; systematic exercise-variation review PMID `35438660`.

The first training-duration model is an **engineering estimate**, not clinical physiology or actual set stopwatch measurements. Human QA can identify obvious infeasibility and incoherent plans, but the user's real-device practice still determines actual timing and workout quality. Review logs contain synthetic test personas, not personal history.

## Findings

See **[human assessment, severity-ranked blockers, and specific recommendations](HUMAN_REVIEW_FINDINGS_V089.md)**, grounded in **[the captured 20 actual scenario outputs](HUMAN_REVIEW_SCENARIOS_V089.json)** and CI run [38454373855](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38454373855) (passed).

Key measured outcomes: 12/13 singles generated; one floor-only leg request rejected. 3/12 generated singles and 7/28 program days exceeded their requested time at the model midpoint. Floor-only full-body programs claimed whole-body intent while omitting pulling and knee-dominant work; several multi-day plans repeated demanding hinges or nearly identical row/pulldown slots. The draft generator **does not pass human coaching-quality acceptance** despite CI success.

Flagging or documenting training recommendations is **not permission to change Coach's live algorithm**; any subsequent fixes must be separately scoped and owner-approved, followed by Testing-only regression and real-device validation.
