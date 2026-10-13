# Swole Cat Brain v0.89: Hands-on Review of Actual Generated Workouts

**Review date:** October 13, 2026  
**Code under review:** draft feature/brain-v089-duration-multiturn-programs (PR #60)  
**Matrix:** `scripts/coach-brain-human-review-matrix.mjs`  
**Evidence:** [full 20-scenario generated output](HUMAN_REVIEW_SCENARIOS_V089.json); GitHub Actions run [38454373855](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38454373855), success  
**Verdict:** **NOT APPROVED FOR LIVE TRAINING RECOMMENDATIONS YET.** This is the owner-requested qualitative acceptance audit and contains **no changes to Coach's runtime algorithms**. Full source CI passing demonstrates software regression stability, not training-plan quality.

## What was actually inspected

The test uses the **real bundled v0.89 draft app** to generate 13 one-off requests plus seven programs, comprising 28 actual program days. It captures exact exercise identity and order, movement patterns, equipment, primary muscles, actual Coach sets/reps/rest prescriptions, per-exercise work/rest/setup estimates, predicted time range, per-program week-level set-equivalent approximations and the earlier selector's choices. These are synthetic user requests and no real training records.

- **Singles:** 12 generated, one rejected (30-minute floor-only legs).
- **Program plans:** 7 generated, with 28 individual days.
- **Single-session midpoint overruns:** 3/12 generated (20-minute gym legs, 30-minute gym full body, 30-minute dumbbell full body).
- **Program-day midpoint overruns:** 7/28 (both upper days in each 35-minute upper/lower plan, plus all three days of the 30-minute dumbbell full-body program).
- **Upper-range potential overruns:** 10/12 generated singles and 27/28 program days. A conservative uncertainty interval can exceed a target even when midpoint fits. This is a risk indication, **not** a claim that all 27 workouts will run over time.
- **Data integrity:** No histories, saved routines or saved programs were written by the scenario harness.
- **CI:** 92 validation steps successful, including this scenario capture and all existing Coach/workout/cloud checks.

## Single-session audit

| Prompt / equipment | Real generated exercises | Model range (midpoint) | Reviewer outcome |
|---|---|---:|---|
| 30-min gym legs | Back Squat; Lying Leg Curl; DB Standing Calf Raise | 21–30 (25) min | **Conditional pass.** Clear knee/hamstring/calf roles. Squat preparation may exceed generic warm-up estimate |
| 45-min gym legs | Back Squat; Sumo Deadlift; Lying Leg Curl; Hip Thrust; Cable Hip Adduction; DB Calf Raise | 38–54 (44) | **Revise.** Six movements including squat, heavy deadlift and thrust is substantial overlapping hip-extension load |
| 30-min dumbbell legs | Bulgarian Split Squat; DB Romanian Deadlift; DB Calf Raise | 22–32 (25) | **Revise default.** Three roles fit midpoint, but Bulgarian split squat is not the most accessible unspecified-experience choice |
| 30-min floor-only legs | No workout generated | n/a | **Blocker.** Exercise catalog cannot satisfy a plausible basic no-equipment leg request despite squat/lunge variants being physically possible |
| 20-min gym legs | Back Squat; Lying Leg Curl; DB Calf Raise | 21–30 (25) | **Blocker for time fidelity.** Explicit 20-minute target missed by 5 minutes even after optional trimming |
| 30-min gym leg strength | Back Squat; Lying Leg Curl; DB Calf Raise | 25–36 (29) | **Qualified.** One skill/strength anchor, but machine/accessory defaults and preparatory sets need time/goal review |
| 45-min gym back | Barbell Row; Lat Pulldown; Deadlift; Cable Pullover; Barbell Shrug; Face Pull | 39–56 (45) | **Revise.** Barbell row and conventional deadlift compound loading plus four accessories is too ambitious at uncertain duration |
| 60-min advanced shoulders & arms | DB Shoulder Press; Cable Lateral Raise; Face Pull; Barbell Reverse Wrist Curl; Zottman Curl; Overhead Triceps Extension; Hammer Curl | 45–64 (52) | **Revise goal fit.** Multiple forearm/elbow-flexor variants vs one direct triceps exercise; specialization not proportional to stated shoulders-and-arms emphasis |
| 45-min home-dumbbell upper | DB Floor Press; DB Row; DB Shoulder Press; DB Lateral Raise; Bent-Over DB Reverse Fly | 34–48 (39) | **Conditional.** Good equipment fidelity and balanced push/pull/shoulders; upper range can exceed |
| 30-min gym chest | Barbell Bench; Incline Barbell Bench; Cable Fly | 22–31 (25) | **Conditional.** Coherent with time; monitor two press variations' setup |
| 30-min gym full body | Back Squat; Deadlift; Barbell Bench; Barbell Row | 29–41 (33) | **Blocker.** Over midpoint, four full-system demanding compounds, no room for normal squat/deadlift ramp-up |
| 30-min dumbbell full body | Bulgarian Split Squat; DB RDL; DB Floor Press; DB Row | 29–41 (33) | **Blocker.** Exceeds target; unilateral/hinge setup in a tightly packed session |
| 60-min upper-body strength | Barbell Bench; Barbell Row; DB Shoulder Press; Cable Lateral Raise; Face Pull | 40–57 (46) | **Conditional.** Reasonable estimated margin; strength-specific accessory prescription should still be reviewed |

**Interpretation:** The time model is better than fixed exercises per minute, but mandatory core-slot logic prevents the trimming pass from fitting short full-body sessions. It sometimes returns a workout flagged as overlong rather than asking whether to reduce sets, choose a faster movement, pair compatible accessories or extend the session. The current midpoint could still underestimate ramp-up sets for heavy squats and deadlifts. The broad interval is useful only if the UI clearly labels uncertainty.

## Multi-day program audit

| Program | Generated duration midpoints | Coverage and balance judgment |
|---|---|---|
| 3-day full body gym, 45 min | 40 / 40 / 40 | **Revise.** Squat+Deadlift on days A and B, Front Squat+RDL on C. All three days use meaningful hip-hinge loading plus knee-dominant squat/lunge; repeated heavy exposure and limited variation in loading distribution |
| 4-day upper/lower gym, 35 min | Upper 39 / Lower 32 / Upper 39 / Lower 32 | **Blocker for time.** Both upper sessions exceed the explicit 35-minute midpoint; lower A/B feature Sumo Deadlift repeatedly |
| 4-day upper/lower dumbbells, 35 min | Upper 39 / Lower 33 / Upper 39 / Lower 33 | **Blocker for time.** Both upper sessions exceed target, while both lower days repeat DB RDL+Goblet Squat. The split labels are present but duration is not satisfied |
| 5-day balanced gym, 45 min | 39 / 44 / 39 / 39 / 44 | **Needs review.** Coherent five-day structure, but Lower Body and Legs both use Sumo Deadlift plus direct hip extension, and predicted glute/adductor set-equivalents are high relative to some upper roles |
| 6-day Push/Pull/Legs gym, 60 min | 52 / 53 / 51 / 52 / 53 / 51 | **Needs specialist review.** Pull A/B contain two rows and two vertical pulls each. Estimated weekly upper-back 24 and lat 30 set-equivalents, along with repeated Sumo Deadlift on Legs A/B, indicate avoidable redundancy; high set-equivalents are *not* injury or readiness diagnoses |
| 3-day full body dumbbells, 30 min | 33 / 33 / 33 | **Blocker for time.** All three sessions exceed target and repeat DB Romanian Deadlift. C adds a technically demanding Renegade Row in a generic plan |
| 3-day full body floor-only, 30 min | 30 / 30 / 24 | **Blocker for truthful coverage.** Each day relies on Push-Up, Glute Bridge and core work, with **no true pulling or knee-dominant lower-body exercise**. Labeling this full-body without explaining impossible coverage misleads the user |

### What the current tests miss

The software tests correctly assert that Coach produces nonempty plans, uses expected equipment labels, preserves routine/history safety and follows broad slot coverage. They do **not** ensure:
- That each mandatory slot is satisfied with an actually distinct mechanical role for the user's goal and setup.
- That full-body actually includes credible pulling and knee-dominant work when equipment is constrained, or transparently says it cannot.
- That distinct training days distribute high-systemic-demand hinges and squats thoughtfully instead of automatically repeating them.
- That user-requested duration is feasible after realistic warmup, rest and equipment changes.
- That specialty requests have an appropriate proportion of accessory movements instead of defaulting to low-priority arms/forearm novelty.
- That nominal 6-day plans moderate unnecessary intra-session redundancy and clearly state assumptions and alternatives.

## Severity-ranked issues and proposed next work (NOT IMPLEMENTED)

**P0. Do not publish misleading or impossible plans.** A request for no-equipment legs should yield a useful basic floor workout **if catalog coverage supports it**, or a clear missing-coverage explanation without pretending three glute/core days are full-body. Curate basic floor-compatible knee-dominant and pulling options, but do not invent exercises absent from the catalog. In a no-equipment situation, true horizontal pulling may require an anchor/sturdy furniture and user confirmation. Give honest optional-equipment suggestions.

**P0. Honor explicit session time.** After initial candidate selection, budget preparatory sets for demanding compounds, actual working sets, rest, transition and both sides. If mandatory roles cannot fit, offer a clear choice to reduce planned sets, prioritize a subset, choose a simpler movement, change target minutes, or accept an overrun. Never silently shorten requested rest or unilaterally change exact user-specified sets.

**P1. Introduce whole-week redundancy and stress-distribution planning.** Within-session and across-week planning should distinguish heavy deadlift, RDL, squat and supported accessory stress; reduce duplicate high-demand hinge exposure without making medical recovery claims. Preserve continuity where user already logs a main lift.

**P1. Raise the quality of goal-specific selection.** Advanced shoulders+arms should balance biceps/triceps/deltoid roles; vague home legs should select approachable knee-dominant options first; Pull sessions should not use two nearly identical rows *and* two pulldowns without explicit benefit. A technical skill rating is not the same as programming sophistication.

**P1. Program-specific feasibility and truthful warnings.** Evaluate each day *before finalizing the split* and recompute weekly roles after trimming. When a day overruns, either generate suitable alternatives or ask the user. Week-level set-equivalents are approximate product heuristics.

**P2. Calibrate session-time estimates.** User-reported actual workout durations, available equipment and warmup sets can improve future estimates, but avoid telemetry or storing personal insights without explicit consent. Supersets need their own honest timing model.

## Approval gate / next QA

1. Owner reviews this concrete matrix and prioritizes fixes. Per `AGENTS.md`, **do not implement recommendation behavior changes on review authorization alone**.
2. Add adversarial quality regression fixtures for P0 and P1 cases, evaluating exercise roles, minute feasibility, duplicate movement families, and impossible-equipment explanation rather than just `selectedIds.length>0`.
3. Update the deterministic Brain selection/program rules in a separately approved Testing-only branch; re-run all 92+ CI steps and the same human-review matrix before release.
4. Conduct real Android usability review with actual session timing and onboarding equipment questions, followed by separate Testing promotion approval. **Beta is untouched until explicitly authorized.**

**No app version change, no APK, no cloud/account/data mutation. The research atlas and classifications remain preliminary review material until integrated through a separately approved change.**
