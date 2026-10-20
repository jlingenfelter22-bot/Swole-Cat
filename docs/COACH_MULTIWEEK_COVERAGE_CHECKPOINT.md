# Coach Swole Cat — Multiweek Muscle-Coverage Intelligence

**Status:** Draft engineering checkpoint (October 20, 2026), no APK or Beta release.

## Product intent
Coach should help lifters notice meaningful missed work across *completed training history*, such as "glutes have not appeared in recent workouts", while preserving the right to choose a specialized split. Do not prescribe an automatic universal weekly set target or conclude that everyone needs isolation movements for every region. Timings remain rough estimates; quality, goals and honest programming come first.

## Evidence and scope
- **History**: count only actual completed working/progression sets, not scheduled movements, warmups, skipped exercises or unfinished sets. Summarize each known muscle region separately as **primary-target work** and **secondary involvement**; a squat or hip hinge can genuinely contribute glutes even if there was no movement called a "glute workout".
- **Multiweek change**: compare the most recent 14 days against earlier logged training in a bounded six-week lookback, with at least four total sessions, two recent completed sessions and a history span of at least 21 days before flagging a missing *historically trained* region. For a saved program, a region explicitly represented by planned primary exercises also qualifies. Do not silently infer that a muscle with no history ever must be included.
- **Ask Coach**: questions like "Which muscles have I neglected in recent weeks?" or "Have I neglected glutes lately?" receive region-specific, transparent evidence. Specific muscle questions still give observed recent work when history is shallow; broad comparative gap warnings need history depth. Keep previous broad push/pull/lower-body Q&A behavior.
- **Program audit**: when there is enough completed Program history, flag up to three specific regions with zero primary *and* zero secondary logged involvement in the last two weeks despite earlier primary involvement or an existing saved Program's primary prescription. Use the existing Program Audit report/action, never auto change a saved routine or assume why a day was missed.
- **Generated whole-week preview**: report a user-requested *priority muscle* that receives only secondary work and no primary-target sets. This is an informed choice prompt, not an absolute training rule or automatic rewrite. The existing broad press/pull/knee/posterior roles and stated focus coverage remain intact.
- **Optional home insight**: a supported muscle-specific recent-absence candidate may appear as an existing Coach insight for people without an active Program. Do not turn this into a repeated notification or nag.

## Validation guardrails
Targeted regression additions in `scripts/coach-history-insights-stress.mjs` and `scripts/coach-program-auditor-stress.mjs` check positive and negative examples, the completed-vs-unfinished distinction, program gap closure when a real squat is logged, direct vs secondary training, explicit triceps priority, and no mutation of logged workouts/routines/programs. Require exact-head full Validate and synthetic performance CI pass before considering a merge. JavaScript test fixture is isolated from live Supabase accounts and the phone's data.

**Keep draft.** The existing Testing v0.93.4 signed APK (139) remains the accepted fast baseline; preserve visual design, cloud/account isolation, backup integrity and Beta. The earlier sets-first strict time-trimming PR #83 is **separate and needs to be reconciled with the user's explicit time-is-an-estimate direction**, not automatically merged as part of this quality feature. Future progress should emphasize repeated-rotation quality, clear prioritization, and genuine human review.
