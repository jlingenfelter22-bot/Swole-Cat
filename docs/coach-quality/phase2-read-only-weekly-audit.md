# Coach Phase 2 — Read-Only Whole-Week Quality Audit

**Checkpoint:** October 20, 2026. **Status:** draft development, no Android release, Beta, personal records, cloud writes or visible UI changes.

## Engineering result

New `coachProjectedWeekAudit(draft)` in `src/js/04d-coach-program-builder.js` reviews an already-generated multi-day program. It **does not edit the week or save anything**, and no existing generator, duration planner, workout logger or Coach preview render path invokes it automatically. It is a diagnostic service for the next deliberate exercise-selection quality pass.

Its output includes:
- each planned exercise, set count, exercise family and day scope;
- per-muscle `primary` planned set-equivalents and `secondary` already weighted at 0.5 each (display total = primary + weighted secondary). Neither is a precise biological stimulus estimate;
- whole-week movement-role counts, eligible day scopes and missing-role findings **only when an alternative is confirmed compatible with at least one matching day's equipment and exclusions**;
- explicitly prioritized regions classified as `specific_direct`, `broad_primary`, `secondary_only`, or `absent`, with equipment-compatible candidate examples where present;
- same-day exercise-family overlap where at least one movement is not explicitly required (a review note, not a prohibition on purposefully paired strength work);
- missing required exercise IDs and confirmed equipment conflicts as diagnostic **constraint** findings, without changing a user's selection.

### Scope logic

The requested day/split governs what is in scope. For example, `full body` and `upper body` support pulling checks, while `legs` and `lower body` support knee, posterior, knee-flexion and calf coverage. **Arms-only does not get a generic 'forgot legs' warning.**

Core roles: pressing, horizontal pulling, knee-dominant legs, posterior chain. These are **review** findings if absent and genuinely feasible, not automatic workouts additions. Optional complementary variety: vertical pulling, hamstring knee flexion, calf and core-focused work. These are **opportunity** findings and never a mandatory per-muscle quota. When an exercise is unavailable or requires unconfirmed equipment, the audit does **not** claim it could have been picked.

A custom split intentionally omitting a muscle is not automatically poor programming; explicit user priorities and actual split/scope take precedence. Strength programs may legitimately repeat movement families; the audit merely points them out for review.

### Muscle-priority distinctions

- `specific_direct`: requested region receives primary work on at least one genuinely focus-specific family. Example: a shoulder-priority week includes a lateral raise and rear-delt fly.
- `broad_primary`: region appears as a primary contributor but does not receive a specific movement focus. Example: squats train glutes, but if the *only* movement is squat, glute specialization may warrant closer review.
- `secondary_only`: the requested area was involved only secondarily. Example: bench pressing contributes triceps but not the same as deliberately choosing a triceps extension.
- `absent`: no chosen movements have primary or secondary exposure to that region.

These are *decision-support categories*, not a biological ranking or an instruction to maximize isolation work. A compound movement can legitimately meet the priority depending on user goal.

### Equipment/constraint safety

The auditor reuses `coachExerciseAllowedByConstraints`, the brain equipment inventory/checker, and the existing exercise library. It considers a movement feasible only with a confirmed `available` status and on a day whose split is compatible with that movement family. It does not silently assume a pull-up bar exists at home or a Nordic anchor is present. It does not automatically suggest an unavailable leg-curl machine for dumbbell-only training.

An explicitly excluded movement family cannot become a proposed alternative. Missing required exercise IDs remain a hard conflict *observation*, never silently ignored or deleted.

## Test package and observed baseline

- `scripts/coach-phase2-weekly-audit-stress.mjs` replays all **12** locked Phase 1 scenarios (`docs/coach-quality/phase1-baseline-v0934.json`, **11** generated programs, **44** days, one intentionally infeasible bodyweight-only full-body program).
- It asserts exact original exercise ID/order selection against the Phase 1 golden snapshot, no mutation of generated drafts or saved sessions/routines/programs, and a second identical audit produces exactly identical output.
- Positive cases: feasible missing gym full-body vertical pull / knee flexion / calves; glute-priority dumbbell leg days with two same-family squat overlaps, while actual Glute Bridge/RDL work is recognized; direct shoulder priority and well-covered PPL week remain correctly classified.
- Negative/edge cases: vertical pull is *not* reported as a fixable role if no verified equipment is available; arms specialization isn't called a failed full-body program; an explicit vertical-pull exclusion defeats feasibility; a named mandatory exercise absent from a synthetic day is reported as a constraint; secondary triceps from bench are not confused with direct triceps; squat-only glutes are distinguished from specific emphasis; warmup/skipped-set counts are not used because this is **a planned-week audit**, not history.
- The full diagnostic report is uploaded as `coach-phase2-weekly-diagnostics` GitHub Actions artifact (30-day retention). Phase 1 artifacts and exact locked baseline continue in CI.

**Important:** The audit is *only an initial quality-detection layer*. Passing tests means it describes fixtures consistently and respects certain constraints, not that exercise pairings are fully optimized or independently verified by a human coach. The prior 310-catalog audit flagged three desk/live metadata differences (Renegade Row, Push Press, Roman Chair Back Extension); they remain review-only and were not silently remapped.

## Next engineering gate (Phase 3)

With this stable diagnosis, perform **human review of the actual flagged plan days** and then implement a small bounded **swap-first week correction** that only replaces lower-value, nonrequired exercises where a feasible compatible movement meaningfully improves week quality. Candidate trials should preserve day scope, user priorities, experience/equipment, planned sets/rep/rest/supersets, anchor continuity and reasonable approximate duration. Rerun independent audit after any swap; recompute preview and saved-routine prescription parity. Keep a before/after snapshot to demonstrate real improvement over `phase1-baseline-v0934.json`; never overwrite the Phase 1 golden silently.

Phase 2 PR is stacked atop the still-unmerged [Phase 1 PR #86](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/86). Do not merge either into `main` without a version-safe signed Testing release plan (since merging `main` triggers a Testing build). Signed Testing v0.93.4/code 139 and Beta remain unchanged. Separate [history gap PR #84](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/84) remains available for a later controlled combination; strict-time fitting PR #83 must be revised to respect the owner's approximate-time principle.
