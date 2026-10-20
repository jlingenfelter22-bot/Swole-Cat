# Coach Swole Cat — Whole-Week Quality Engine: implementation design

**Design checkpoint — October 20, 2026. Status: proposed, draft only.** This is an engineering blueprint following the owner-approved research direction, not production code, APK release authorization, a mandate to change user programs or a new UI design.

## Why this is our next move

A program is not good solely because each day passes a session-level audit. Five independently plausible days can together overuse one pattern, omit an important muscle or movement role, neglect a user priority, and randomly churn previously successful lifts. Coach needs a first-class *projected week*, evaluated and selectively repaired **before** the draft program is shown.

Retain the existing intelligent day generator as the candidate engine. Extend it with **weekly intent -> provisional days -> audit -> conservative swap-first repair -> final independent audit**. This is incremental, deterministic, low-risk and compatible with the current visual UI and fast Testing v0.93.4 baseline. Use a controlled human-review suite to establish whether outputs meaningfully improve over the present implementation.

## Research-informed policy (do not turn heuristics into scientific laws)

- [2026 ACSM resistance-training position stand](https://pubmed.ncbi.nlm.nih.gov/41843416/): progressive, consistent resistance training involving major muscle groups; goal, user practicality, and weekly training matter more than exotic equipment or overly complex prescriptions. It identifies ~10 weekly sets for hypertrophy as a useful reference, **not a mandatory quota for every Swole Cat anatomical subregion**.
- [Pelland et al., 2026 dose-response meta-regressions](https://pubmed.ncbi.nlm.nih.gov/41343037/): direct/indirect set distinction matters; fractional 0.5 credit for secondary involvement fit the model better than 0 or 1. Retain **1.0 primary / 0.5 secondary** for estimating exposure, but treat it as an approximate algorithmic ledger, **not an exact physiological dose**.
- [2024 full-body versus split meta-analysis](https://pubmed.ncbi.nlm.nih.gov/38595233/): do not force PPL, upper/lower or full body as inherently superior when comparable work is possible. Preserve explicit user-selected split.
- [2022 exercise-variation systematic review](https://pubmed.ncbi.nlm.nih.gov/35438660/): purposeful, complementary variation rather than excessive random rotation or redundant variations. Retain successful anchor exercises and introduce only needed variety.
- Individual exercise and muscle-region studies can inform **secondary tie-breakers** (e.g., knee flexion + hinge; vertical pull + row; lateral-delt direct work; straight-knee calf raise) but must not produce rigid scientific-sounding absolute rules or claims of guaranteed body changes.

## Non-negotiable behavior and product boundaries

1. **Hard constraints**: requested/excluded exercises and muscles, provided equipment on each day, abilities explicitly provided, day frequency, user split and named focus, saved user choices and already confirmed substitutions. Do not silently override. A specific requested exercise remains unless it is incompatible and Coach asks or explains.
2. **Soft preferences**: useful distribution of chest/lats/upper back/side-rear delts/quads/hamstrings/glutes/calves/core/biceps/triceps and other requested/support regions; reasonable pattern diversity and direct vs indirect credit; extra emphasis for chosen priority; moderate weekly set bands calibrated by goal/experience/history; continuity with successfully progressing movements. For narrow/specialist programs, out-of-scope regions are NOT automatically a deficit.
3. **Time**: duration is a **rough estimate and planning range**, not a hard fitness deadline. Don't shrink sets or exercises because a calculated midpoint is one minute over. A genuinely explicit hard stop (e.g. "I must leave at 6") can be separately modeled, honestly explained and never hidden.
4. **Training data**: read-only local completed sessions for coaching context; no live Supabase writes; no retroactive routine rewrite. Skip/warm-up/undone work is never falsely counted as completed. Insufficient history is **unknown**, not a defect.
5. **Presentation**: keep the accepted existing UI; one short plain-English Coach reason when a visible change is useful. Avoid more widgets, compulsory onboarding screens, score badges, or a fitness-science lecture.

## First work package: audit the actual catalog and capture a baseline

- Run a deterministic catalog audit over every selectable exercise: existence/validity of primary, secondary, `pattern`, equipment, laterality, canonical movement family, and useful role. Find alias inconsistencies, incorrectly mapped region contributions, inaccessible equipment-only roles, missing pattern metadata and unintended substitution links. Preserve IDs and data schema; do not create 300 independent exercise rules.
- Capture the **current unmodified generator's** complete 2–6-day outputs for a representative seeded scenario matrix, with exercises, order, sets/reps, equipment used, estimated duration range, weekly region exposure (primary and secondary separately), movement roles, user-focus satisfaction and unnecessary duplicates. Commit the before/after fixture so improvements can be evaluated, not merely asserted.
- Rank metadata errors by likely effect on training decisions. Correct critical catalog misclassifications with targeted tests before changing ranking weights.
- Use qualified human review of whether a session is coherent; passing code invariants is not proof of sound exercise selection.

## Architecture: small additions to existing Coach JavaScript

### 1. Build a projected weekly intent before generating the days

Suggested pure helper `coachBuildWeeklyIntent(request, intent, context)` in a small new `src/js/04d*-coach-*.js` module (loaded in the existing deterministic script order), or co-located beside `coachGenerateProgram` in `src/js/04d-coach-program-builder.js`.

Produces the *eligible* muscle families, preferred roles and meaningful priority regions for this user's **actual split**, goal, equipment and day-level constraints. It is not a global checklist of every body region. General hypertrophy may favor horizontal press, horizontal and vertical pulling, knee-dominant lower-body, hinge, knee-flexion and some side-delt/calf/core/directed arm work when feasible; strength favors requested lifts early and sufficient related practice. Support regions remain tracked and are raised when requested or truly absent. Use existing `COACH_TARGET_GROUPS`, `coachMovementFamily`, `exerciseMuscleMetadata`, `coachProgramEffectiveDayPlan`, and history context. Set bands represent preference, not `>=10` hard validation.

### 2. Generate provisional days with existing selector

Keep `coachSelectExercises`, `coachCoveragePlan`, `coachExercisePrescription`, `coachBrainSessionTimeEstimate`, equipment checks and the existing history/continuity logic. Keep carrying the `programMuscleUsage`, `programExerciseUsage` and hinge history into later days. Do not replace every per-day algorithm.

### 3. Produce a full-week audit with explicit evidence

Suggested `coachAuditProjectedWeek(draft, weeklyIntent)` returns only structured, **non-mutating** data:

- region sets split into `primary` and `secondary` with total set-equivalents available as `primary + 0.5*secondary`; avoid silently double-counting in separate displays;
- region `absent`, `secondary_only`, `represented`, or `potentially_overrepresented`, relative to in-scope goals and user's priorities, never universal physiology quotas;
- roles across the entire week (not each day): press, horizontal pull, vertical pull, knee-dominant, hip hinge, knee flexion, shoulder abduction, core/plantar flexion and requested specializations when equipment permits;
- exercise-family redundancy and heavy axial/systemic demand clustering **as cautious heuristics**, not injury/recovery diagnoses;
- user hard-constraint violations and focus misses (critical), major weekly omissions (quality), optional anatomical variety (optional);
- continuing anchor exercises that are progressing and should not be displaced merely to make the week look different.

### 4. Repair meaningful defects with swap-first deterministic search

Suggested `coachRepairProjectedWeek(draft, audit, weeklyIntent)`, with a small bounded pass count (e.g. two full audit+repair iterations, and at most one automatic swap per day per pass, subject to validation):

```text
weeklyIntent = buildWeeklyIntent(userRequest, split, equipmentByDay, history)
draft = generateDaysWithExistingSelector(weeklyIntent)
for pass in [1, 2]:
    audit = auditEntireWeek(draft, weeklyIntent)
    problems = prioritized(critical_and_quality_findings(audit))
    if problems.empty: break
    candidateSwaps = []
    for problem in problems:
        for eligibleDay in daysWithCompatibleRoleAndEquipment:
            for removable in nonRequiredNonPreferredRedundantExercises(eligibleDay):
                for replacement in catalogMatchingMissingRoleAndAllowedEquipment:
                    trial = replaceOnlyInProvisionalDraft(draft, eligibleDay, removable, replacement)
                    if hardConstraintsFail(trial): continue
                    if sessionCoherenceRegresses(trial): continue
                    score = qualityDelta(trial, draft, weeklyIntent)
                    if score > meaningfulImprovementThreshold:
                        candidateSwaps.add(trial, score)
    if candidateSwaps.empty: break
    draft = highestScoringStableSwap(candidateSwaps)
finalAudit = auditEntireWeek(draft, weeklyIntent)
return {draft, finalAudit, notesAboutAnyUnresolvedConstraints}
```

**Repair priority:** redundant family swap -> low-value accessory swap -> revisit *automatically* allocated sets only when warranted -> add an exercise only if session scope and time range are still sensible. Never change named sets or skip an explicit instruction. Prefer preserving a successful anchor over small theoretical coverage gains. Recompute actual day prescriptions, exercise order, `brainTime` rows and preview-to-saved-routine parity after any swap; no stale metadata or time estimate. A genuine unsatisfiable request must produce a clear limitation, not a fabricated complete week.

### 5. Integrate multiweek feedback carefully

After representative trials, the separate **draft [PR #84](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/84)** offers primary-vs-secondary completed-set exposure, multiweek muscle gaps, and focus checks. Evaluate it independently before building the next pass on top of it. Only with sufficient completed history can consistently underrepresented personally relevant regions influence selection modestly; don't swing the whole plan after one missed session, and don't claim the presence of a training adaptation, medical diagnosis or future gain. Gradually preserve productive anchors across 4–12 weeks while deliberately rebalancing when user goals or actual training change.

## Repository-specific integration and safe branching

- `src/js/04d-coach-program-builder.js`: owns program generation and `coachBrainProgramWeekReview`, currently builds days sequentially via `slots.map` and audits broad patterns after selection. Add the **projected-week audit/repair boundary** here.
- `src/js/04b-coach-programming.js`: existing exercise allowance, `coachMovementFamily`, family caps and candidate selector. Continue to reuse; do not duplicate scoring or bypass exclusions.
- `src/js/04b2-coach-intelligence.js`: current 7-day ledger, prior averages, continuity and universal `coachWeeklyReferenceSets`. Evolve universal numeric region target into goal-sensitive soft importance bands, not 10 sets for every small body part.
- `src/js/02-muscle-history-analytics.js` and existing metadata/profiles: source of muscle exposure; validate actual exercise data. Preserve 1/0.5 accounting and distinguish primary-only reporting.
- `src/js/04g-coach-history-insights.js` and `04h-coach-program-auditor.js`: research-informed historical review in draft PR #84, separate from initial candidate-generation changes.
- `src/js/04a2-coach-brain-duration.js`: **draft PR #83 is stale as a product direction**: strict midpoint-based sets-first compression needs review because the owner explicitly said time is only approximate. Do NOT automatically merge #83 into this program-quality work.
- `scripts/coach-brain-human-review-matrix.mjs`, program stress scripts, and `.github/workflows/validate.yml`: develop a seeded quality oracle and regressions before/after implementation. No React rewrite or design-system changes.

## Acceptance suite: prove usefulness, not just compilation

Baseline and revised outputs must use the **same** prompts, catalog, test history and equipment fixtures. Each scenario must log the full draft plus audit and human-readable reasons.

| Synthetic case | Required behavior |
| --- | --- |
| 2-day beginner full-body, limited gym | Both days practical and comprehensive; no barbell-only requirement or excessive accessory list |
| 3-day gym full-body, 45-ish min | Major press/pull/lower/posterior exposure across week; sensible pairings; time remains approximate |
| 3-day user-selected PPL | Respects PPL even though each region may appear only once; never force full-body onto a PPL day |
| 4-day upper/lower with redundant quad work | Prefer useful leg-curl/hinge coverage by replacing duplicate squat-family work, without adding time |
| 4-day shoulder-priority hypertrophy | Meaningful direct side-delt work and rear-delt/upper-back contributions; preserve leg/back work and existing good presses |
| 4-day glute-priority, dumbbells only | Prioritize genuine glute-primary movement compatible with equipment; don't count only token indirect exposure |
| 5-day mixed equipment and weekday limits | Obey each day's separate options and global exclusions, never selecting unavailable machines |
| 6-day PPL strength-priority bench | Keep bench as high-priority stable lift, early on appropriate days, while meeting rest/role constraints |
| Knee-flexion unavailable / bodyweight-only | Flag role infeasibility conservatively; offer closest legitimate alternative, never invent access to cable/leg-curl machine |
| Named mandatory lift + forbidden equipment | Explain contradictory request rather than silently ignoring constraints |
| Favorite/explicitly protected progressing lift | Do not replace just to optimize a marginal audit score |
| Narrow arms-only or upper-only program | Do not treat omitted lower-body areas as a generic failure unless user asks for full-body coverage |
| Recent completed logs include indirect triceps and squat glutes | Correct primary/secondary credit; don't falsely claim zero contribution |
| 1–2 training sessions, skipped sets or warmups | No confident multiweek neglected-muscle claim; never count unfinished work |
| Time midpoint 1–3 minutes beyond request | No automatic volume reduction solely to achieve exact minutes; retain plausible duration range |
| Repeated regeneration / save | Deterministic picks for fixed seed/context, bounded runtime and no unintended persisted state mutation |

Required instrumentation:
- hard constraints always satisfied; if infeasible, transparent explanations (no fabricated allowed exercise);
- zero critical in-scope major role omissions when a compatible feasible selection exists;
- explicit priorities appear as primary work when requested and equipment permits; secondary-only work flagged, not mislabeled;
- **demonstrable human-reviewed before/after improvement** in selected weekly programs, redundancy, and complementarity; avoid assigning a fake population-wide quality score;
- no excessive swap churn, no unconstrained search or exponential candidate explosion; benchmark program generation on representative 2–6-day plans;
- all existing exact-head Validate checks pass; new coverage/priority regression checks pass;
- no UI redesign, no interference with in-progress sessions, signed Testing installs, cloud accounts, workout history or Beta.

## Delivery gates

**Gate A — test/fixture baseline + catalog truth check.** No behavior changes yet. Human-review matrix and metadata audit documented.

**Gate B — pure weekly intent/audit + tests.** Add read-only primitives; compare current generated weeks. No automatic changes yet.

**Gate C — bounded swap-first repair + consistency verification.** Preserve user constraints and existing workout anchors. Review actual selected sessions, not just role-count statistics.

**Gate D — merge historical context + cautiously adapt across weeks.** Consider PR #84 with its own evidence gates; do not introduce automatic reprogramming of saved workouts.

**Gate E — signed Testing release only after owner approval, safe Android versionCode bump, full regression/synthetic performance, and careful in-place update.** Beta remains frozen until separately authorized. Human phone test follows the safe Testing build.

### Immediate next engineering action

Start **Gate A**: lock a baseline scenario corpus and run a catalog correctness/role-coverage audit on the current Testing v0.93.4 source. Then implement **Gate B** with pure weekly audit functions before any automatic repair. **Do not jump straight to adding more exercises, expanding UI or merging the stricter-time PR #83.**
