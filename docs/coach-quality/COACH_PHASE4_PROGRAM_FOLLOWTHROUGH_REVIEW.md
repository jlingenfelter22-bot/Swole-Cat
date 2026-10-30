# Coach Phase 4 — Opt-in Planned vs Completed Training Review

**Checkpoint:** October 21, 2026. **Branch:** `quality/coach-phase4-program-review-v0936`, draft PR #92. **Testing:** v0.93.6 / Android versionCode 142. **Beta:** unchanged. **Release:** none.

## Goal

Give Coach useful evidence about how saved Programs actually play out without inventing a new progression algorithm, interpreting every skipped day as poor programming, or changing any data. A user's Program Audit now has a deliberate **Review Training History** action. Nothing new runs as an unsolicited home-screen recommendation.

This is checkpoint 2 on top of draft Phase 4 PR #91's read-only evidence-eligibility layer. PR #92 contains the Phase 4 checkpoint 1 commits as ancestry; do not merge both independently without reconciling overlapping work.

## User experience

**Program Options → Coach Audit → Review Training History** shows a simple session count and actual-per-week estimate (only once enough observation time exists), plus a logged count for each saved Routine. Coach shows **at most one optional coaching observation at a time**, ranked by explanation type.

The observation has **Review Program** or **Review Routine** (opens the existing manual editor/review) and **Keep as is** (hides this observation for the current review only). Opening the editor is not accepting a program change—users still must intentionally save edits. Dismissals are **ephemeral, not synced, not stored**, and reset on a new review. Coach provides a clear explanation of uncertainty and tells users that historic plans may have changed.

### Explanation hierarchy

| Class | Signal and evidence | Coach's interpretation | User-controlled next step |
|---|---|---|---|
| 1. Scheduling | At least 21 days from first recent completed Program session and ≥3 completed sessions; weekly rate under 65% of saved target | The number of completed sessions differs from today's saved frequency goal; not evidence that the exercise list is wrong | **Review Program** frequency or scheduling preferences manually |
| 2. Routine rotation | ≥6 completed correctly attributed sessions, ≥2 saved routines and strong imbalance in their logged counts | One routine appears much less frequently, even if overall session frequency is on track; not proof that its exercises are undesirable | **Review Program** rotation manually |
| 3. Recorded execution | ≥3 comparable sessions from the *same* routine, spread across ≥10 days, with ≥60% exercise-ID overlap to today's routine. At least 2 sessions and ≥50% of those sessions show fewer than 45% of the currently planned set-equivalents in a group | The current saved exercise allocation and what was recorded in completed workouts differ. The routine may have been edited or logs may be incomplete | **Review Routine** and workout history |
| 4. Program design | A broad training area absent from today's saved Program, with ≥2 saved routines, ≥3 programmed sessions a week and ≥2 areas represented | Potentially intentional structural omission, independent of attendance | **Review Program** manually |

**All thresholds are conservative product heuristics, not validated individual muscle-growth or motivation predictors.** The group “set-equivalent” measure is borrowed unchanged from the existing v0.63 Program Audit and is not a claim about exact muscle hypertrophy or effective training dose. Only logs explicitly associated with the given Program and one of its current Routine IDs enter the comparison.

## Hard boundaries

- **Never compare expected planned weekly set equivalents directly with total actual logged sets to diagnose exercise selection.** Fewer sessions alone can fully explain low actual weekly totals. The new review first separates schedule from routine/within-session evidence.
- **No invented weekday-to-Routine mapping.** Preferred days are availability preferences; no inference that “Upper A is Monday” or “Leg Day was skipped on Friday.”
- **History is incomplete evidence.** A session without working sets, deload workouts, future dates, unrelated Programs and sessions from routines not in the current Program are excluded from completion comparisons. Historical changes to Routine content cannot be fully reconstructed, so within-session comparisons are conservatively suppressed if less than 60% of today's exercise IDs appear.
- **No mental-health, physical-health, fatigue, recovery, injury, adherence motivation, or effort diagnosis.** Also no assumptions about intentional skipping from missing recorded sets.
- **No override of Guided Progressive Overload** or previously accepted/declined Coach workout recommendations. The interface neither computes nor applies new weight/rep targets.
- **No background sync, account changes, server activity or persistent dismissals.** Training data is read from the currently loaded local history; only explicit UI navigation and ephemeral display state change.
- **Small, mobile-friendly optional controls.** Keep the existing Program Audit available, with a Back to Program Audit and Done action.

## Synthetic validation

New `scripts/coach-phase4-program-review-stress.mjs` creates disposable, program-attributed workouts in JSDOM and verifies:

- Empty Program and new Program with fewer than three weeks of evidence cannot be labeled “missed sessions.”
- Real 3/week attendance shortage is labeled a schedule issue, not a flawed exercise selection.
- Seven recent Upper A completions and one Lower B completion (with an overall weekly count on target) is a **routine-rotation** issue.
- Completed Upper A sessions with logged presses but repeatedly no completed rows are a **recorded execution** difference, after verifying that the current Routine structurally resembles the logs.
- Empty/unlogged working sets are not called deliberate avoidance. A materially changed Routine version suppresses outdated plan-versus-log judgments.
- Deload-only windows, logs from another Program, future/incomplete history and unknown routine slots do not contaminate conclusions.
- Review is only visible after deliberate Program Audit action; visible candidate can be dismissed, a new review resets that dismissal, and a manual review action navigates without saving.
- Recommendations have `action:review_only`, `writesAllowed:false`; byte-for-byte sessions/routines/programs/settings and localStorage remain unchanged.

The CI also retains the previous 17-scenario Phase 4 evidence tests, Phase 1–3 whole-week generation golden tests, 38-scenario Coach constraints, Android phone-width recommendation tests, historical workout and cloud-safety regressions, and synthetic performance checks.

## Next checkpoint

This is a **review interface**, not an autonomous coaching intervention. Before any signed Testing release, inspect the real Android flow for overflow, readability, scroll retention and expectations around “Keep as is.” Expand human validation to program edits during the observation period and user-requested multi-program crossover, then validate that wording never overclaims causality. No Beta promotion is authorized.
