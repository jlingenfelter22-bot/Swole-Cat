# Phase 4: Read-Only Adaptive Coaching Evidence Audit

**Baseline:** Testing v0.93.6 / Android code 142. **Development:** `quality/coach-phase4-readonly-evidence-v0936`, draft PR #91. **Beta:** unchanged. **Release:** none.

## Why this checkpoint exists

Swole Cat already has a large amount of training intelligence, so Coach must not create multiple incompatible progression models. Existing functionality includes:

- **v0.59 training context:** exercise / region use and historical program context.
- **v0.60 adaptive exercise progression:** externally loaded estimated-1RM trend heuristics, multi-week window, logged RIR, conservative progression holds, exercise-specific progression.
- **v0.62 history Q&A and insights:** previous sets, records, consistency, progress and training gaps.
- **v0.63 saved program audit:** planned vs actual completed sessions, adherence, broad muscle coverage and redundant program roles.
- **Guided Progressive Overload:** existing user-selected progression mode; it owns progression targets and must not be bypassed.

**Phase 4's first action is evidence eligibility, not new automatic program decisions.** The new `coachPhase4ReadOnlyAudit` is a read-only shadow interface with no UI/actions yet. It interprets a *subset* of existing signals only when the supporting logs are adequate, attaching evidence and a cautious description; it never writes anything back.

## Evidence acceptance rules

| Observation | Minimum evidence | What Coach may say | What Coach must not assume |
|---|---|---|---|
| Multi-week plateau review | At least **four distinct completed exposure days** spanning **ten days**, latest within **28 days**; existing adaptive classifier labels a plateau | “Recent logged external-load performance looks relatively flat; review your progression targets.” | Injury, poor recovery, need to deload, or failure to train hard |
| High-effort plateau review | Same, plus **actual logged RIR** satisfies v0.60 high-effort rule | “Logged effort has been high while the performance estimate has been flat.” | Treat missing RIR as zero RIR or prescribe a forced weight change |
| Repeated performance dip | **Five or more comparable exposure days**, with the last **two independent logged days** both at least ~6% below the *earlier* benchmark | “Two recent sessions were below earlier comparable performance; review context.” | One low workout proves a plateau, recovery deficit, or injury |
| Progressing external load | Four distinct exposures across ten days, recent within 28 days; v0.60 says progressing | “Recent estimated performance trends upward.” | Automatically accelerate Guided Progressive Overload |
| Repeated explicit skips | Same routine and exercise explicitly skipped on at least **three distinct days** out of at least four routine opportunities over the last 42 days, with other work completed, latest skip within 28 days | “Would you like to review whether this exercise still fits?” | Missing sets, interrupted workouts, or unlogged movements mean intentional avoidance |
| Sparse/stale/deload/future/mixed metrics | Any violating condition | **No positive longitudinal training claim.** | Borrow unsupported external-load 1RM comparisons from bodyweight, assisted pull-ups, duration, distance, or mixed metrics |

**These thresholds are conservative product acceptance rules, not experimentally validated universal hypertrophy thresholds.** Even identical logged numbers can reflect many things; RIR is subjective and optional. The v0.60 estimated-1RM trend is a useful *observed performance proxy*, not evidence of muscle growth, systemic fatigue, health or readiness.

### Privacy and user-agency contract

- The audit reads only the currently loaded local workout history and catalog; no network calls, cloud actions, records uploads, personal health inference, or automatic persistence.
- For any externally loaded exercise, **all recent raw profile exposures must have the same external-load and repetition measurement semantics and one distinct training date each**. A same-day duplicate or session-specific assistance/time override suppresses the trend rather than allowing v0.60's eight raw exposures to overcount it. This is intentionally conservative.
- A returned candidate contains `action:'review_only'` and `writesAllowed:false` (metadata), explanatory observation, limited evidence counts and confidence. There is **no automatic workout substitution, saved-program mutation, or progression override**.
- The output is capped to six observations by default and is not displayed to the user yet. User-visible copy/actions must pass separate human review and explicit opt-in testing.
- No modifications to users' training mode, weights, targets, program frequency, preferred movements, cloud sync, or Android update channels.
- The current module is loaded but dormant until explicitly called from a future, reviewed UI integration.

## Regression and synthetic data verification

`scripts/coach-phase4-readonly-evidence-stress.mjs` injects **disposable synthetic workouts into a test DOM only**; no real user information is used. It checks empty history; two exposures; four spaced high-RIR-effort and no-RIR flat exposures; stale history; duplicate same-day data **including an extra duplicate alongside four otherwise valid dates**; a mixed assistance/external session override; deload pollution; future dates; a single performance dip vs two consecutive dips; progressing loads; bodyweight/assistance exclusions; three explicit skips vs incomplete unlogged sets; and byte-for-byte unchanged routines, sessions, settings and localStorage after the audit.

The same CI run also executes previous Phase 1–3 frozen workout generation, the 38-program edge case matrix, the targeted squat/hinge/short-day gates, and the app's historical suite. The evidence JSON is uploaded for human review as artifact `coach-phase4-readonly-evidence`.

## Next Phase 4 checkpoints, not included here

1. **Human evidence review** of representative recommendations for novices, interrupted blocks, program switches, special set structures (top/backoff, RIR), time/distance and assisted movements.
2. **Planned-vs-actual weekly distribution** using the existing v0.63 program auditor, carefully distinguishing missed sessions or schedule changes from actual muscular development.
3. **One optional, explainable coaching suggestion at a time** integrated with workout history/Progress and existing Guided Progressive Overload. No independent load-target calculator, no diagnosis and no default automatic routine changes.
4. **Android usability and permanent Testing release** only after evidence QA, all regressions and explicit owner approval. Stable Beta remains unchanged.

This is an evidence foundation, not a full adaptive coach yet.
