# v0.89 Brain Quality Pass: Duration, Multi-Instruction Chat and Multi-Day Programs

**Status:** Development and QA only. Draft PR #60, October 13, 2026. Stacked on #59 (which includes the 308-profile audit and knowledge service in #57 and #58). **No release, package bump, cloud mutation, account changes or Beta promotion.**

## Goals fulfilled in the development branch

### A. Session duration estimates from actual prescriptions

`src/js/04a2-coach-brain-duration.js` calculates a rough planning duration from:
- Per-exercise **sets**, average prescribed reps, coach rest interval between working sets, and whether a movement is unilateral (both sides).
- Disclosed general warm-up allowance of 3 or 5 minutes depending on selection.
- Estimated first-station and transition/setup time, with modest additional loading setup for compound lifts.
- The audited exercise measurement type (reps, seconds, or distance) where present. For time/distance when the coaching draft does not expose a true seconds/meters prescription, the calculator uses an **explicitly approximate 40- or 45-second work estimate**, not a false precise calculation.
- An estimated midpoint plus broad low/high duration range. It is not a timer observation.

For **Brain-confirmed** quick-build and program drafts only, an optional-exercise pruning pass attempts to approach the available time while retaining the required exercise roles and explicitly requested exercises. It does *not* reduce prescribed rest to unsafe values or change the user's requested sets. A still-overlong session is **flagged**, not inaccurately labeled as feasible.

Previews surface the estimate and uncertainty, including sessions likely to exceed the target. Re-compute when a generated workout is refined, and compute estimates independently per program day.

**Limitations to address in a later pass:** superset-specific realistic concurrent timing; fatigue-adjusted reps; gym-floor wait times; exercise-specific warmup sets; actual measured/user-reported set durations; custom metric targets; paused/tempo sets; endurance and power programs. Never claim minute-level precision from this estimator.

### B. Multi-instruction chat with rollback

`coachBrainSplitEditClauses` separates distinct commands at conjunctions or punctuation *only when the next clause is an identifiable instruction*, preserving typical equipment lists such as "dumbbells, cables and barbell." The existing Coach parsers interpret individual recognized clauses.

Examples:
- "Make it 45 minutes, no squats and more glutes."
- "4 days, 35 minutes and no squats."
- "Actually just dumbbells, no lunges."

All recognized clauses must complete successfully. If a later actionable clause cannot be understood or produces no valid workout/program, the original in-memory draft is restored, with no partial change. Explicit custom sets and user-authored workout prescriptions retain their existing routes.

**Limits:** This is a deterministic language parser, not free-form LLM understanding. It does not fully model an arbitrary set of nested conditions, multi-exercise pronouns, unrelated declarative clauses, compound conditional grammar or every possible negation. Where parsing cannot identify an action, Coach should not claim to have fulfilled it. Further intent stress testing remains necessary.

### C. Program questions and equipment-aware days

Interactive Coach-created programs now request missing information in this order:

1. **Days per week** (only if frequency was not supplied).
2. **Time available per workout** (only if missing).
3. **Equipment available for the program** (only if missing), with gym, dumbbells, floor-only, custom and skip options.
4. Generate individually vetted days and show each day's estimated time and constraints.

The user's answers apply to the entire program until changed in program-chat refinement. A *new* vague program asks anew. A request like "3-day full body program, 45 minutes, dumbbells only" skips known questions. A request like "3-day program" asks time and equipment.

Existing direct/legacy program builder calls are not implicitly opted into new equipment constraints. The UI sets `interactiveBrainFlow:true` only when opening a new conversational program request. This avoids altering unrelated program-generation tests and saved state. No user profile is persisted across accounts.

### D. Verification

Automated script: `scripts/coach-brain-duration-program-stress.mjs` in GitHub CI.
- Duration rises with added sets and rest; includes warm-up and setup.
- Timed Dead Hang and distance-based Sled Push remain distinct from reps.
- Optional trim protects explicitly named movements and core roles.
- Natural multi-clause changes succeed together, or a failed recognized clause leaves the original draft untouched.
- "Leg workout" asks time and equipment; a fresh request repeats the question.
- "Build me a workout program" asks frequency, duration, equipment.
- A fully specified 3-day dumbbell program skips redundant questions.
- Program multiple edits maintain equipment choices and pattern exclusions.
- No writes to cloud, historical sessions or persisted owner data.

Older Coach, exercise-loading, history, Android packaging and cloud/account regression tests remain mandatory. Actual phone testing and human evaluation of workload plausibility are still outstanding.

## Release boundaries

- **Testing remains v0.88.0 (current installed app); Beta stays v0.73.1.**
- This entire stack is in draft PRs, with no merge to `main`, no published APK and no new Android updater artifact.
- A final source PR integration plan should reconcile #57, #58, #59, and #60 and eliminate overlapping older UI draft #56 before a Testing build.
- Advance only after explicit owner decision and real-device guided acceptance. Cloud and saved user records must not be touched.
