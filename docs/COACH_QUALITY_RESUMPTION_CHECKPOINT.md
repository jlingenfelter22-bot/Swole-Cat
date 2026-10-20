# Coach Swole Cat — Workout Quality Resumption (October 20, 2026)

**Current accepted phone baseline:** signed Testing v0.93.4 / Android versionCode 139. User reported the app "running like butter". Keep the visual UI/UX, performance optimizations, Beta app, Supabase accounts and existing workout records unchanged.

## Engineering priority order

1. **Duration fidelity without losing exercise coverage.** When a generated plan exceeds a user-specified clock window, prefer honest smaller automatic set prescriptions over deleting important movement families. Preserve required exercises and explicitly authored work. Recalculate time from sets, work pace, rest, warm-up, unilateral sides and transitions. Return infeasible rather than inventing a false promise when required work cannot fit.
2. **Whole-week distribution and deliberate muscle prioritization.** Audit per-day and across-week press, pull, knee-dominant leg and posterior-chain patterns, and all explicitly emphasized regions. Prioritize underrepresented regions *within* requested split and equipment; never silently redesign the user's split or promise a physiological target unsupported by evidence.
3. **Complex conversational instructions and contextual questions.** Support day-specific time/equipment/focus/availability, distinguish explicit exercise lists from vague plans, ask only missing equipment/goal/time questions, and preserve prior answers when refining the plan. Keep the fast whole-program parser optimization.
4. **Meaningful human review of sample plans.** Examine the actual exercises, order, sets/reps, time estimate and weekly distribution for short/long sessions, gym/bodyweight/dumbbell choices, 2–6-day splits and challenging focus combinations. Regression tests alone cannot judge coaching usefulness.

## First draft change: sets-first time compression

Development-only draft PR #83 `quality/coach-time-coverage-v0934`. In `src/js/04a2-coach-brain-duration.js`, Coach no longer immediately removes an optional exercise when an equipment-aware generated session overruns the requested duration. It progressively reduces automatically assigned set counts by one set per eligible exercise per pass (never below two) before removing optional movements. The original core-coverage preservation algorithm still governs any removal. Mandatory movements, explicit numbered sets and `5x5`/ `5×5` shorthand, and top/backoff structures cannot be automatically reduced. If even mandatory exercises exceed the deadline, Coach reports infeasible instead of inventing a plan.

This is a planning tradeoff, not an evidence-based claim that two sets are always ideal. Short sessions may have less volume than longer sessions; Coach must not claim otherwise. The original time estimator remains an engineering range, not observed minutes. No changes occur when the initial estimated session fits. Routine persistence and preview/time-row parity remain enforced.

New synthetic fixture `scripts/coach-time-coverage-priority-stress.mjs` checks that a four-exercise gym leg plan retains knee and posterior movements when feasible through fewer auto sets, preserves the original ordering and minimum sets, honors explicit work and impossible constraints, and keeps whole-week push/pull/knee/posterior roles for full-body, upper/lower and PPL programs. The complete existing app tests and synthetic performance benchmark must be green on the **final exact PR HEAD** before any merge, and never merge this feature without a future version-safe Testing release plan and owner's approval.

**Release boundary:** No APK, app version/signature/build mode changes, cloud/schema/account operations, UI restyling or Beta promotion in this draft. Further broad weekly-balance logic should be independently evaluated with a before/after human-review matrix before touching training selection.

## Next decision

After validating the draft duration/coverage pass, examine whether per-day equipment/time instructions and weekly coverage weights are actually being used in candidate exercise ranking, and quantify quality across 3–6-day splits. Require regression fixtures for user priorities, lower-back and posterior patterns, day-by-day time constraints, explicitly excluded movements and program preview vs saved routines. Ask for phone testing only after safe signing/versioning is approved.
