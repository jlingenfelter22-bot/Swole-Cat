# Coach Swole Cat — whole-week intelligence audit

**Date:** 2026-10-26  
**Baseline:** signed Android Testing v0.93.9; reviewed development branch includes [draft PR #98](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/98), not yet published to Testing.  
**Audit branch:** [draft PR #99](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/99), read-only instrumentation stacked on #98.  
**Method:** synthetic, deterministic generation and actual exercise inspection. This is neither a randomized training study nor physical Android field acceptance.

## Overall decision

**No critical exercise/equipment/data-integrity blocker surfaced in the 20-program matrix. Core Coach is in a credible quality state, but two specific selection weaknesses merit cleanup before promoting the proposed first-draft intelligence changes: repetitive same-day squat choices in glute-focused dumbbell lower days, and underuse of available session time for complementary movement choices in longer 3-day full-body gym plans.** A third low-priority issue is overly broad duplicate-family audit advice for explicitly chosen arm specialization.

The first-draft vertical-pull adjustment in PR #98 is helpful **in the one 45-minute gym fixture where it safely qualifies**. It should not be expanded indiscriminately to 30-minute sessions, Strength Focus, explicitly prioritized shoulders, saved Program edits or equipment-limited cases.

## Exact tested outcomes

20 deterministic whole-program scenarios, covering 2-, 3-, 4-, 5- and 6-day rotations, 30/35/45/50/60/75-minute prompts, general fitness, hypertrophy, strength, gym, dumbbells, bodyweight and mixed per-day equipment.

- **19 correctly generated**, with appropriate day count and requested split. The known limited-equipment 3-day bodyweight-only full-body case correctly declined to generate rather than invent access to a full gym.
- **0 hard constraints breached**: selected movements existed in the catalog and were confirmed available, forbidden movement patterns excluded, per-day mixed equipment respected and exact exercise IDs not duplicated inside a day.
- **0 saved sessions/Routines/Programs/settings and 0 localStorage changes** under the read-only audit and proposal checks. Preview-to-saved Routine exercise IDs and estimated-session timing parity verified in the synthetic fixture.
- **Whole-week draft improvement:** the 45-minute gym full-body week acquired **Lat Pulldown** on Day B in place of optional **Overhead Press**, retained a chest press on Day B and vertical shoulder pressing on other days; count/sets unchanged. Still no hamstring knee-flexion, calves or core in that week, which are optional, not universal failures.
- The 3-day gym PPL and both 6-day gym PPL variations covered core push/pull/knee/posterior roles with no weekly-audit findings. The 5-day balanced gym week similarly had no findings. The shoulder-priority 4-day week retained direct side and rear delt focus.
- Repeated arm isolation angles in an explicitly arm-only 3-day program were classified as same-family overlap; **the alert is not proof the selection is redundant**. Distinct curl angles and triceps extension orientations can deliberately coexist.

Each test result includes full exercise names, movement patterns, set counts, goal/focus, equipment by day, current primary and secondary muscle-region estimates, role counts, precise audit findings and rough time intervals. Machine-readable CI artifact: `coach-final-week-quality-matrix`, produced by `scripts/coach-final-week-quality-matrix.mjs`.

## Ranked findings for the next targeted pass

### P1 — Glute-focused dumbbell lower-day redundancy

On **4-day upper/lower with glutes emphasized, dumbbells available**, Lower A and Lower B both selected **Goblet Squat + Bodyweight Squat** in the same session, in addition to unilateral knee-dominant work and a dumbbell RDL. The full program does include specific glute exercises; that does not automatically justify two near-identical squats in one session. The same-family audit identified both days. Replace one redundant squat option with truly complementary feasible glute-specific work **if a safe candidate exists** and without inventing equipment, deleting priorities, or inflating estimated workload.

### P1 — Underused optional roles on longer full-body sessions

A **3-day gym full-body program requested at about 75 minutes** generated sessions with **46, 49 and 50 minute estimated midpoints**, yet omitted both vertical pulling and knee-flexion patterns across the week. It did use core work on two days. This is not a timed-session failure: the duration is a preference and some users want shorter workouts. It does show that the fresh-draft repair heuristic is narrower than the actual quality opportunity (it requires a specific proposed swap, and a larger session generated an additional essential squat). Consider a more general, bounded **scope-aware complementarity check** for underrepresented direct roles before generation finishes. Limit additions and preserve user choice; do not fill every free minute.

### P2 — Overly broad overlap warnings in a narrow arms split

In **3-day custom Arms A/B/C**, each day has two distinct biceps and two triceps movements, with targeted arm emphasis. The whole-week auditor reports repeated family entries (two per day). This may be deliberately complementary rather than wasteful. Prefer a warning only for nearly interchangeable movements with genuinely redundant roles and no explicit arm emphasis.

### P2 — Optional variety gaps elsewhere

- **2-day 45-minute full body:** press, row, knee and posterior chain covered; vertical pull, knee flexion, calf and core omitted (all currently advisory).
- **4-day upper/lower gym:** solid squat/hinge/knee-flexion/calf balance; vertical pull optional absent.
- **4-day dumbbell upper/lower:** no vertical pull or knee-flexion exercise, respecting realistic gear availability; noticeable repetition of goblet squat, RDL and bridge across lower days, but repeating an anchor movement can be legitimate.
- **3-day 30-minute full-body gym:** press, row, knee and posterior roles covered in 29-minute estimated sessions, absence of optional accessories not by itself a defect.
- **5-day mixed equipment:** all day-specific gym/dumbbell restrictions honored, but a gym-accessible vertical pull was omitted and the dumbbell-only Pull day repeated two different curls; review as optional, not automatic failure.

## Safeguards / interpretation

- Weekly exposure uses the existing **primary=1, secondary=0.5** planning ledger; it is not a medical signal or verified exact hypertrophy dose.
- Do not treat 1–10 minutes of estimated overrun or upper-range time creep as an error; time is approximate. Likewise do not pad a 75-minute session simply because it is under the requested target.
- Apparent repetition across **different days** can be intended continuity for strength and skill practice; no automatic churn of productive anchor lifts.
- User-explicit preferred/required exercises, equipment exclusions, protected manual swaps, Track Only/Strength modes, priorities, named presses, and declining suggested changes take precedence.
- Sparse, skipped, future or edited-program history must not generate confident recovery/undertraining conclusions. Separate [draft PR #97](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/97) has seven evidence and cross-Program tests; it is independent and not merged or published here.
- Existing frozen baseline and current generator tests validate structural behavior, **not subjective exercise quality**. Real-human workout judgment and signed Android first-run check remain pending for unpublished PR #98.

## Recommendation

Keep the accepted **v0.93.9 Android UI unchanged**. Do **not** merge #98 or #99 into main or bump Android Testing until a narrow P1 exercise-selection fix and its matching adversarial tests are reviewed. Treat P2 cases as optional later polishing, avoid a large optimizer rewrite, and preserve Beta v0.73.1. When exact-head CI and physical device review are accepted, a future signed Testing release requires a new monotonically increasing version/versionCode and explicit publication approval.

## Evidence

Development research references already reviewed:
- Currier et al., 2026 ACSM resistance-training review, PMID 41843416.
- Pelland et al., 2026 training dose-response meta-regressions, PMID 41343037.
- Exercise-variation systematic review, PMID 35438660.

These support coherent training with individual goals, useful weekly exposure and purposeful exercise variety. They do not establish hard per-exercise role quotas, scientifically exact time slots or a universal best split.
