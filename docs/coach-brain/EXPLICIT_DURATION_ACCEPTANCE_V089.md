# Coach Brain v0.89: Exact-Prescription Duration Acceptance

**Date:** 2026-10-13  
**Status:** Development branch only, pending green CI and owner-led real-device review.  
**Stack:** This work builds on v0.89 quality-remediation PR #62, which itself has not been released. Testing stays v0.88.0 (Android build 133); Beta stays v0.73.1.

## Motivation

The v0.89 Brain duration model estimated **generated** workouts and reduced automatically selected, non-explicit optional set counts to honor requested time. However, an **explicit user-authored** workout ("5 x 5 deadlift in 20 minutes") previously bypassed duration estimation entirely. Its preview therefore could not explain whether the requested clock target appeared plausible or potentially overlong.

This is a preview-honesty gap, not authorization to alter the user's planned workout.

## Changes on this branch

- Exact exercise lists now receive the existing deterministic engineering time estimate, using **the user's specific set and rep prescription**, exercise-specific default rest, warm-up allowance, bilateral/unilateral work and setup estimates. **No automatic trimming, substitution or set change occurs** on the explicit path.
- Exact-list preview exposes the estimate and its low/high range with an explicit reminder that prescribed exercises, sets and reps **were not shortened** to fit the clock. An estimate over the specified midpoint time warns the user; upper-range uncertainty is still displayed.
- No explicit time in the original prompt is **not** interpreted as a request for the generator's internal 45-minute planning default. The UI labels it **Custom exercise list**, with an untargeted planning estimate.
- An edit such as "make it 15 minutes" updates the displayed target for the existing explicit workout instead of being incorrectly routed to an unresolvable exercise-edit command. This **does not** change user sets/reps; duration is recalculated.
- Time estimates are recalculated after explicit workout edits and manual swap/removal before previews; the saved routine continues to use exact prescribed values.
- Initial CI exposed a separate genuine exact-edit parsing defect: a phrase such as `make deadlift 4 sets of 6` updated sets while leaving the previous rep target unchanged. The edit parser now recognizes the `N sets of M` grammar as both explicit dimensions; the regression requires the preview estimate and saved routine to show 4 sets of 6.
- Added regression checks to `scripts/coach-brain-quality-remediation-stress.mjs`, already called by `.github/workflows/validate.yml`. Tests cover 5 x 5 parsing, original save, time-only edit, explicit set edit, preview consistency, and an untimed explicit list, with synthetic data and an unchanged sessions/routines/programs assertion.

## Constraints and validation

Time remains an **engineering midpoint with a range**, not a measured workout or promise of finishing in a given number of minutes. This change does not enforce a cutoff or silently reduce requested rest, sets or repetitions. The app does not infer personal loading or diagnose readiness or recovery.

Research boundary: general strength-training specificity and autoregulation are supported by the 2026 ACSM position stand (PMID 41843416), but minute-level duration heuristics are **product assumptions**, not established outcomes from controlled training trials. The user's individual gym pace, warm-up, station availability and rest needs can exceed the shown range.

**CI result:** initial workflow run [38460441747](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38460441747) failed at the new regression for `4 sets of 6`, identifying a real parser defect. After fixing it, the full workflow [38460708958](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38460708958) **PASSED**. The separate real generated-workout review [38460708849](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38460708849) **PASSED**. These verify development CI, not real Android timings or owner acceptance. Do not mark passed until GitHub Actions confirms. No release, cloud change, Android signing, local account change or Beta merge has been performed.

## Next acceptance checkpoints

1. Verify new regression test and full v0.89 PR suite, then inspect generated 20-scenario matrix for unanticipated changes.
2. On Android Testing **only after explicit promotion approval**, check a literal 5 x 5 deadlift with 20-minute target, lower the target in chat, change sets, and verify the same values in saved workout and preview.
3. Time one or more actual sessions, including real warm-up sets, loading and gym waiting, and calibrate duration uncertainty without pretending measured user times have been collected automatically.
4. Separately review full-body equipment gaps, single-session upper-range overruns, and multi-day plan practicality; a green software suite is not field acceptance.
5. No automatic Beta promotion; all existing training history and Supabase cloud accounts remain untouched.
