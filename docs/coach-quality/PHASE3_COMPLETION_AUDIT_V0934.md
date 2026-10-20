# Coach Swole Cat: Phase 3 programming repair completion audit

**Checkpoint:** October 20, 2026. **Status:** validated shadow engineering work, **not** live activation or release authorization.
**Stack:** Phase 1 PR #86, Phase 2 PR #87, Phase 3 draft PR #88. Branch `quality/coach-phase3-bounded-week-repair-v0934`. Signed Testing v0.93.4 remains the accepted on-device baseline.

## Objective and result

Coach's provisional whole-week audit now feeds a bounded **shadow-only** repair proposal engine, `coachProposeProjectedWeekRepair(draft)`, that can:
1. Replace a later duplicate or optional lower-value movement with a complementary, eligible exercise when a finding is concretely resolved.
2. Resolve glute-priority dumbbell squat redundancy only when a focus-specific, compatible alternate movement is available.
3. When no safe swap exists, cautiously propose a **two-set accessory** to complete an equipment-feasible weekly role/explicit priority, **only** for multi-day, non-strength, non-beginner, non-explicit-set-count plans with a conservative approximate time margin.
4. Run an independent Phase 2 audit on every temporary candidate before it becomes a *proposal*.

Neither original workout generation nor any persisted program, routine, session, account or cloud data is modified. The shadow results are not shown to customers and are **not** passed to program saving by the production app.

## Verified real generated programming, before vs. proposed

All 12 frozen Phase 1 scenarios execute without any change to actual generated IDs, order, sets or baseline timings (44 training days across 11 generated scenarios; the limited bodyweight full-body case remains intentionally infeasible). The synthetic evaluator returned:

| Frozen scenario | Shadow proposal | Heuristic findings debt |
| --- | --- | --- |
| 3-day full-body, gym, about 45 min/day | Add 2 sets of lat pulldown on one compatible day and 2 sets of seated leg curl on another. Core compound choices remain. | 32 -> 16 |
| 4-day upper/lower, gym | Add 2 sets of lat pulldown on an upper day with equipment and approximate duration tolerance. | 8 -> 0 |
| 4-day glute-priority upper/lower, dumbbells | Replace the later **Bodyweight Squat** on each lower day with **Side-Lying Hip Abduction**. Retain goblet squat and remaining lower-body work. | 10 -> 0 |
| 3-day full-body, dumbbells | Add 2 sets of crunches to one day, retaining every existing selected movement. | 16 -> 8 |

Other feasible frozen programs intentionally remain unchanged. In particular, the two-day full-body program still has some optional whole-week gaps, but no safe bounded change met the current criteria. The bodyweight-only three-day case remains infeasible, rather than inventing equipment access.

These debt values are **internal prioritization heuristics**, not validated scientific fitness scores. A lower value means fewer algorithmic findings, not guaranteed better hypertrophy, recovery, safety or adherence.

## Adversarial programming tests

- Redundant squat plus missing vertical pulling: proposes Goblet Squat -> Lat Pulldown while retaining the leading squat.
- Redundant squat plus otherwise unfilled hamstring knee-flexion: proposes Goblet Squat -> Seated Leg Curl.
- Direct triceps focus on an already pressing-heavy day: proposes Cable Fly -> Rope Triceps Pushdown rather than treating only indirect triceps loading as adequate.
- Explicit required squat: not removed.
- Narrow arms-only plan: no fabricated full-body obligation.
- Bodyweight-limited lower plan: no fictional cable/machine exercise.
- User instruction `exactly 5 exercises` or `3 working sets`: no automatic added accessory.
- Explicit exclusion of vertical pulls: no excluded vertical pull added.
- Repeated invocation: fixed inputs produce the same proposals.

## Safety and engineering checks

| Audit dimension | Evidence and disposition |
| --- | --- |
| Determinism and bounded search | Fixed-order candidate ranking and tie-breakers, max two changes, one per day, hard cap on trial evaluation. Synthetic equality assertions pass. |
| Hard user constraints | Required exercises, per-day equipment, excluded patterns/equipment, split and targeted focus are tested. A hard conflict causes a no-op rather than an invented solution. |
| Core and major-muscle coverage | Original per-day core match slots must survive swaps. Independent whole-week re-audit blocks any new major feasible omission or loss of an existing user priority. |
| History and continuity | Preferential/positively progressing movements are protected from marginal swaps. Historical sessions are read only and the dedicated PR #84 longitudinal work stays separate. |
| Working sets and approximate time | Existing prescribed sets remain unchanged. Added accessory receives only two planning sets and must fit a conservative rough duration margin. Updated `brainTime` rows are recomputed. |
| Preview-to-save parity | Proposed-day saved-routine conversion is tested against the exact proposal exercise sequence and timing estimates. Not activated in the live UI. |
| State isolation and network | All scripted fixtures use synthetic state and reject network calls; saved routines, workouts and programs must stay byte-identical before and after inspection. |
| Catalog coverage | Phase 1 audit covers all 310 built-in exercises and equipment/profile metadata without generating 310 separate progression algorithms. |
| Original version and build boundaries | No versionCode, app version, signing key, Android APK, Testing/Beta release, cloud account, migration, persistent user-history rewrite, CSS or visual redesign. |
| Regression and synthetic performance | Exact-head base code validation and performance workflows green on commit `3c3c51ee94877b6455c94cab0beeb2289d8da447`, including the locked baseline, Phase 2 audit and new Phase 3 stress matrix. |

## Human-review judgment

The proposed repairs are **plausible, complementary improvements**, not proof of globally optimal programs. The gym full-body additions preserve the major press/pull/knee/posterior-chain structure while restoring otherwise absent weekly roles, without forcing full-body movement coverage in every session. The glute-dumbbell changes trade a redundant second squat for lateral hip work that supports the user-emphasized target. The triceps case uses actual elbow-extension work rather than a press-like substitution. No automatic program changes are currently enabled.

**Remaining limitations:**
- Some optional roles intentionally remain absent when there is no compatible safe adjustment within the user's equipment/time/split context. This is not automatically a defective program.
- Only 12 locked real generator scenarios plus synthetic adversarial fixtures have been exercised. More human-reviewed prompts, equipment combinations, abilities and realistic constraints are needed before user-facing rollout.
- Time allowances are engineering estimates, not hard cutoffs or measured elapsed time; scheduling and exercise setup can vary.
- The training-history integration in PR #84 is separate and should be reviewed before any longitudinal adaptive exercise changes.
- The suggested additions are *proposals only*. Before production activation, ensure their acceptance, explanatory copy, preview-to-save duration/feasibility semantics, and manual override behavior are reviewed end-to-end on an Android device.
- Phase 1, Phase 2 and Phase 3 are stacked draft PRs. Integrate them in dependency order only after approval and exact-head checks; do not merge unreviewed strict time-compression PR #83 by accident.

## Gate decision

**Phase 3 shadow engine and tests: engineering-complete for review.** The observed programming improvements, negative-case behavior and independent regression checks satisfy the limited shadow milestone. **Customer-facing activation and any signed Testing release: NOT APPROVED by this audit.**

Next owner decision: review the attached before/after CI artifacts and a small additional human-selected program matrix; only then separately authorize a version-safe Testing build with explicit activation of the audited policy. Beta stays untouched until subsequently requested.

### Evidence

- [Phase 1 PR #86](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/86)
- [Phase 2 PR #87](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/87)
- [Phase 3 PR #88](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/88)
- [Validate Swole Cat workflow run](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/39465027797)
- [Synthetic Performance workflow run](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/39465027867)
- Workflow artifact: `coach-phase3-swap-repair-proposals` (30-day retention).
