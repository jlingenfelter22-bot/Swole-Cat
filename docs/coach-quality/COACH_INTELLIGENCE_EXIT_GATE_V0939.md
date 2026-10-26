# Coach Swole Cat intelligence: completion gate for Testing v0.93.9

**October 26, 2026. Scope: core Coach intelligence, not UI redesign or Beta.**

## Actual shipped vs unfinished

This checklist reflects current runtime, not stale roadmap headings.

| Capability | Status in signed Testing v0.93.9 | Remaining quality gate |
| --- | --- | --- |
| Conversational intake, equipment, goal, time range | Implemented | Adversarial multi-turn human examples, do not invent unavailable equipment |
| Single-session exercise choice and required muscle roles | Implemented | Representative human exercise review, especially narrow days and lower-body variety |
| 2-6 day generation and split/day constraints | Implemented | Review whole-week examples as actual coherent routines rather than just metadata counts |
| Projected-week audit, direct vs indirect muscle and movement roles | Implemented (read-only) | Avoid overclaiming exact muscle dose; only flag roles in chosen split and feasible equipment |
| Bounded swap-first proposed repairs | Implemented, **opt-in in preview** | Prove exercise continuity, changed-duration estimate, exact save/regeneration parity, no forced changes |
| Multiweek history, session consistency and progression evidence | Implemented conservatively | Historical plan provenance and edited-template comparisons remain incomplete |
| Program vs logged Training Review | Implemented, owner accepted simplified Android v0.93.9 UI | Date-aware plan edits need conservative comparisons; clear enough history before an observation |
| Cloud memory of coach preferences | **Not implemented** | Future optional feature, not a core Coach blocker |
| Optional LLM-backed coach | **Not implemented** | Future optional enhancement, not a core Coach blocker |

## Work package active in this branch

1. Bring the seven existing unmerged Program cross-history regression cases forward to accepted v0.93.9, covering unrelated Programs sharing Routines, reordered/removed slots, edited exercise lists, excluded deload/blank/future/stale sessions and reversible read-only review.
2. Explicitly state in runtime evidence that **today's saved frequency is not a verified effective-dated historical training target**. A recent log rate is descriptive context, not proof of missed obligations or motivation. No date-stamped historical Program/Routine version exists for old sessions.
3. Keep the revised UI compact. No new page, cards, controls or notifications.
4. Keep all tests read-only and build on a separate branch; do not alter saved workouts, generated prescriptions, progression, cloud accounts, local storage schema, signing, updater or Beta.

## Remaining release-quality criteria

- **Whole-week quality:** qualified human review of at least the frozen 12 baseline scenarios from `docs/coach-quality/phase1-baseline-v0934.json`, plus deliberately adversarial constraints (unavailable knee flexion, shoulder/glute priority, explicit bench anchor, mixed equipment, 30 vs 75 minute rough budgets, specializations). Assess complementarity and user goals, not fake overall percent scores.
- **Protected choices:** explicit user lifts, forbidden equipment, saved exercise/sets, manual swaps and declined recommendations remain authoritative.
- **No false claims:** stale, deload, future, unfinished or low-information history never manufactures a stalled lift, missed muscle, schedule failure, or diagnosis. Primary and secondary involvement stay distinct.
- **Conservative historical comparisons:** without a trustworthy plan history snapshot, wording must identify comparisons against the **current** plan. Historical effective-date snapshots can be designed as a separate optional feature, with a storage/compatibility review before changing runtime data models.
- **Efficiency:** fixed 2-6 day fixture matrix must be deterministic; trial count bounded, time ranges estimated rather than treated as stopwatch deadlines; no noticeable Android rendering regression.
- **Approval:** exact-head Validate, Synthetic Performance, Android walkthrough of any visible behavior change, explicit owner approval for signed Testing publication. Beta needs separate owner approval.

## Critical closeout decisions

**Required before declaring core Coach intelligence complete:** Finish evidence/provenance regressions, inspect the actual exercise selections and proposed swaps in representative programs, fix any clear user-goal or equipment failures, and run the full regression matrix.

**Not a blocker for switching to other Swole Cat work:** A network LLM, Coach cloud memory, social trainer/client dashboards, exact time predictions, universal muscle-set quotas, automatic edits to saved user programs, or a retrospective history migration.

## Evidence boundaries

The app's weekly region ledger uses approximate primary=1, secondary=0.5 set-equivalents. This is a planning heuristic, not an individualized muscle-growth meter. ACSM 2026, dose-response research, and exercise-selection studies support useful weekly exposure and diverse movement roles but not a universal prescribed set count per muscle. Coaching should distinguish observation, preference, and evidence, remain local-first and user-controlled.

This checkpoint is a **development QA proposal**; neither shipping a new APK nor promoting to Beta is implied.
