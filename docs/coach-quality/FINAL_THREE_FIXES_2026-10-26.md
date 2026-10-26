# Coach final three programming-quality corrections — development candidate

**Date:** 2026-10-26  
**Owner approval:** Explicit approval in the active Swole Cat conversation to correct the three ranked gaps from the 20-program whole-week audit.  
**Baseline:** Testing **v0.93.9** accepted app UX; these runtime changes are **not yet installed or released**.  
**Branch / PR:** `fix/coach-final-three-quality-gaps-v0939` / draft [#100](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/100); stacked on audit [#99](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/99) and first-draft quality [#98](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/98).

## Evidence and boundaries

The ACSM 2026 overview of reviews (Currier et al., PMID 41843416) and Pelland et al. 2026 set/frequency dose-response meta-regressions (PMID 41343037) support purposeful resistance programming with individual preferences and adequate exposure, but **not universal movement quotas**. All three changes are **test-driven product/coaching heuristics**, not lab-proven optimal prescriptions, validated health outcomes, or mandatory exercise prescriptions.

Program history, progressions, sets/reps, training modes, equipment constraints, user selections, cloud accounts and saved routines do not change. Only **new, first-completed, unedited Coach intake previews** may take the narrow exercise-selection adjustments; all preview exercises remain editable. Whole-week audit language is observational; no physiological diagnosis is inferred.

## 1. Correct glute-focused dumbbell lower-day redundancy

- Specific case: four-day **Upper/Lower**, dumbbells-only training equipment, explicit glute emphasis.
- Existing Phase 3 optional repair evaluator had already established two safe **Bodyweight Squat → Side-Lying Hip Abduction** swaps, one on each lower day; this patch may automatically use **only these two validated swaps together** in the first unsaved preview.
- Keep the existing unilateral leg movement, hinge, Goblet Squat and Glute Bridge. Maintain number of exercises and saved sets. Reject any different proposal, stale estimate, required/declined user choice, equipment mismatch or worsening audit.
- Other glute requests, other equipment and saved plan changes are not swept into a generic automatic rule.

## 2. Use genuine optional complementarity on longer full-body gym days

- Specific case: three-day full-body gym, roughly **65–90 minutes**, user has not required a shoulder press, excluded movement types, specified exact exercise/set counts, edited days or chosen Strength Focus/Track Only.
- An existing general optional repair suggestion for the 75-minute test removed Day A's useful Cable Crunch. Although feasible by strict muscle group counts, it produced a less deliberate session.
- Instead, only if the independent cross-day audit agrees, change **Day B Overhead Press → a compatible vertical pull** and append one **two-set hamstring knee-flexion accessory** to Day B. Day A and Day C preserve their original movement lists, including shoulder pressing and core work.
- Day B retains chest pressing, rowing, knee-dominant leg work and posterior-chain work; only choose available/confirmed equipment and a distinct movement family, with recalculated session estimates. Reject entirely if either movement cannot be safely included within the estimated midpoint target or full-week audit would regress.
- Do not pad an appointment to an exact number of minutes. Thirty-minute and ordinary shorter sessions are unaffected. Other possible missing accessories remain optional.

## 3. Stop mistaking deliberate complementary arm angles for redundant exercises

- On explicit custom **Arms**, **Biceps** or **Triceps** days, two curls are not automatically redundant if one is neutral/hammer and the other supinated. Likewise, overhead vs non-overhead triceps extensions can fulfill different deliberate roles.
- Suppress only those narrow specific `same_day_family_overlap` warnings. Two curls with the same grip orientation or otherwise undifferentiated same-family movements still receive the existing review reminder. Different-day exercise repetition remains independent.

## Tests and release guard

- `scripts/coach-final-three-fixes-stress.mjs`: both glute days change as expected without altering user data; initial 75-minute week retains Day A/C while Day B gets one swap plus a two-set knee curl; the intentionally varied arms week has no false positive but same-grip repeats are still flagged; equipment, manual selection, Track Only, strength, short sessions, and explicit exclusions remain protected.
- `scripts/coach-final-week-quality-matrix.mjs`: full 12 frozen + 8 adversarial program fixtures, with changes only in the three specifically eligible scenarios (3-day 45-minute full gym, 4-day glute-focused dumbbells and 3-day 75-minute full gym). The original frozen **direct generator** remains unchanged for historic regression.
- Complete existing Coach, cloud safety, Android UI smoke-test and synthetic performance checks required at exact head before merge consideration.
- **No version bump, signed Testing APK or Beta release from this draft.** Testing release requires monotonic version/versionCode, approved main merge and real-device acceptance. Beta requires separate explicit authorization.
