# Swole Cat Brain: 308-Exercise Knowledge Audit

**Adjudication update (2026-10-13):** All 86 original priority flags now have documented desk-level classification decisions, with five additional specialized profiles reviewed. See [FLAG_ADJUDICATION.md](FLAG_ADJUDICATION.md), [91-entry resolution ledger](exercise-flag-resolution-91.json), and [review CSV](exercise-flag-resolution-91.csv). The full 308-record audit now contains a `proposed` classification overlay with corrected station requirements, movement roles, variable loading and side execution. **Original v0.88 catalog fields and muscle mappings remain untouched.** External coaching validation and all runtime implementation approvals are still required. The initial 86 remains a historical count, not the number of still-unclassified rows.


**Date:** 2026-10-13. **Source:** `src/data/exercises.js` and `src/js/02-muscle-history-analytics.js` on the v0.88 main baseline. **Status:** first-pass complete inventory, research-informed desk classification, **NOT** a final biomechanical peer review or installed Brain knowledge. This audit intentionally causes **no application behavior, version, Coach ranking, history or cloud changes**. Beta remains untouched.

## Files and how to use them

- [Full 308-record structured audit](exercise-knowledge-audit-308.json): stable catalog IDs; exact existing muscle metadata or mirrored fallback; equipment plus auxiliary tools; exercise role and reason; technique/systemic/axial-demand heuristic; loading/measurement/progression; candidate substitutes and relationship cautions; validation flags.
- [308-row review spreadsheet CSV](exercise-knowledge-audit-308.csv): one line per built-in exercise, designed for manual search, filters and editing. CSV is a **review artifact**, not an app import file.
- [Machine-readable coverage and warning counts](exercise-knowledge-audit-statistics.json): reconciliation summary.
- `scripts/verify-coach-brain-308-audit.mjs`: no-dependency integrity test, checks exact catalog name/ID/equipment/pattern alignment, 308 coverage, load direction, measurement, substitute mismatches and critical regressions. Runs in PR validation.

**The two data formats are intentionally redundant:** JSON stores structured evidence/flags and CSV supports human review. Do not import either into `src/data/coach-knowledge.js` until open issues are resolved, expert/user spot review is performed, and a separate approved runtime implementation passes full testing.

## Executive findings

| Dimension | Result | Interpretation |
|---|---:|---|
| Catalog entries / covered entries | 308 / 308 | Exact ID and name inventory, no unexplained omissions |
| Distinct catalog movement patterns | 40 | More than one movement may share one pattern; patterns do not guarantee mechanical equivalence |
| Catalog equipment categories | 11 | Does not capture required anchors, benches, platforms, attachments, machines |
| Explicit existing name-based muscle-map overrides | 34 | Existing targeted exceptions, preserved for comparison |
| Broad existing muscle-category/pattern fallbacks | 274 | **Not 274 errors**, but these assumptions must not be treated as per-exercise proof |
| Priority flags for human/specialist review | 86 | Flagged by semantic, equipment, unilateral, measurement, or specialty questions, not already expert-certified |
| Bodyweight-labeled exercises needing auxiliary setup | 18 (initial rule-based finding) | Not automatically suitable for "no equipment" |
| Metric types | 296 reps, 4 duration, 8 distance | Different logging semantics, progress and replacements |
| Effective load interpretations (audit inference) | 274 external, 31 bodyweight, 3 assistance | Some existing catalog entries omit `loadType`; infer cautiously and test against app runtime |

**Confidence definitions:** `family_heuristic` means an explainable category/movement assumption, not clinically or biomechanically validated. `priority_review` means a nontrivial exception or a question requiring manual verification. **No row is marked fully verified for runtime consumption.** The demand scores are qualitative software heuristics, not validated measured fatigue, risk or readiness.

### Typical category counts

- Barbell: 65; dumbbell: 55; machine: 62; cable: 62.
- Bodyweight: 34; Smith machine: 12; kettlebell: 8; landmine: 4.
- Sled: 3; trap bar: 2; plate: 1.

The distinction between *what provides resistance* and *what equipment is required* needs explicit treatment. An assisted pull-up uses a machine with a counterweight, an ab-wheel rollout requires the wheel, and a Nordic curl requires a secure ankle restraint even if the exercise is nominally bodyweight.

## High-priority manual review before runtime implementation

### A. Hidden equipment and incomplete catalog categories

| Existing name | Audit finding | Proposed rule, pending approval |
|---|---|---|
| Ab Wheel | Catalog `bodyweight`, but requires a wheel | Filter out of zero-equipment plans unless wheel present |
| Nordic Hamstring Curl | Needs an anchored lower leg | Distinguish bodyweight resistance from anchor availability |
| Sliding Leg Curl | Needs sliders or compatible floor/towel | Ask or show a viable no-slider alternative |
| Banded Hip Abduction | Requires a band despite bodyweight label | Needs explicit resistance-band resource |
| Captain Chair Leg Raise | Requires a chair station | Do not recommend in a floor-only home workout |
| Hanging raises, pull-ups, dips, dead hang | Secure overhead bar or dip equipment may be required | Equipment inventory must represent station access |
| Landmine Row, T-Bar Row, Meadows Row | Existing broad categories understate bar/attachment needs | Correct attachment requirement metadata before selector adoption |
| Board Press, Rack/Block Pull, elevated variations | Rack/board/blocks/platform geometry changes setup | Require matching facilities and maintain separate load baselines |
| Loaded carries and sled work | Need walkable space, suitable surface and implements | Availability and time estimate must include travel/setup |

**Equipment group rule:** A selected `full gym` should not automatically claim *every* specialty station, band, slide board or sled is available. Offer alternatives where knowledge is uncertain.

### B. Primary-muscle and biomechanical classification

| Movement(s) | Observed issue | Open decision |
|---|---|---|
| Glute Ham Raise | Catalog `hinge`; primary hamstrings override; actual movement includes meaningful knee flexion | Represent compound knee-flexion / hip-extension roles separately |
| 45-Degree Back Extension | Current hamstring/hip-hinge mapping may not match a user doing lumbar extension | Differentiate technique/intended execution, never equate with isolated lumbar-extension machine |
| Assisted Dip, Plate Loaded Dip, Bench Dip, Diamond Push-Up | Several are coded as `elbow_extension` despite compound pressing involvement | Give Coach compound movement-role exception without rewriting history |
| Deadlift variations (rack, block, deficit, sumo, trap bar) | Load positions, ranges, grips and emphasis differ | Preserve exercise-specific strength history and constraints; avoid automatic interchangeability |
| Sled Drag versus Backward Sled Drag | Forward/backward direction changes muscle emphasis; general Sled Drag direction unspecified | Clarify orientation before assigning precise regional role |
| Overhead/behind-the-neck/landmine/push press | Press patterns vary skill, power intent, support, loading and contribution | Separate technical skill from programming sophistication |
| Reverse/neutral/supinated curls and overhead triceps variants | Grip/arm position changes intended emphasis | Treat regional rationale as qualified, not proven superiority |

Some entries can be used to train multiple regions depending on technique. The metadata should represent **dominant typical purpose, legitimate variations, and uncertainty**, not pretend one canonical activation map exists for every execution.

### C. Tracking and progression

- **Assistance:** Assisted Pull-Up, Assisted Chin-Up and Assisted Dip require decreasing counterweight for load-direction progression, with quality/comparable reps. Do not compute conventional external-load tonnage or standard e1RM from assist values.
- **Bodyweight vs added load:** Pull-Up and Weighted Pull-Up are different exercise IDs; weighted variants track **added load**, not total body mass.
- **Distance:** 8 movements including sleds and loaded carries. Distance should be compared with analogous surface, implement, direction and load. Carry distance alone is not proof of increased strength.
- **Duration:** Plank, RKC Plank, Side Plank, Dead Hang are timed, not rep exercises. A timed Dead Hang has no close same-measurement grip substitute in the catalog. Do not silently swap for a Farmer Carry as equivalent.
- **Per-side:** The current logging schema cannot represent every side-specific outcome. Audit flags unilateral/asymmetric work; don't claim per-side measurement is solved until a new app design passes migration and compatibility tests.
- **Technical power:** Olympic pulling and some ballistic variations need technique/speed-preserving prescriptions. Generic 8–12-rep failure protocols are inappropriate defaults for skill/power movement training.
- **Machine comparison:** Machine designs, pulleys, angles, counterweights and stack labels may vary. Coach must not overinterpret a load value across different machines.

### D. Exercise substitutes: three levels, not a synonym list

The JSON includes up to three **candidate** alternatives per movement with explicit cautions for changes to equipment, load direction/meaning, measurement, movement pattern or skill demand. A movement can be *related in purpose* but not an equivalent logged exercise.

Proposed classification on adoption:
1. **Same-family option:** comparable broad target/motion; may still use different equipment and load numbers.
2. **Related programming option:** useful for similar target but materially different mechanics or role (e.g. hip hinge vs isolated hamstring curl).
3. **Not interchangeable:** incomparable primary stimulus or measurement; show as a different choice, not a silent swap.

The audit includes deliberately curated special cases where a rigid exact-pattern search would produce a misleading match. For example, Sled Push and sled drags are related locomotion tools but not interchangeable for direction-specific stimulus. Dead Hang has no close matched timed-grip catalog substitute.

**No shared PR or progression baseline should silently transfer when an exercise ID changes.** Preserve existing routine/history identity and ask user to confirm significant substitutions.

## Demand model: scope and caution

For all 308 rows, the audit records `technical` (coordination/skill), `systemic` (rough multi-joint workload) and `axial` (approximate trunk/spine-support demand) on bounded **qualitative** scales. They are derived from movement family, support and name-specific exceptions.

They are **not** injury likelihood, CNS fatigue, medical risk, predicted recovery time or measured energy expenditure. A score of 3 instead of 2 does not prove a physiological difference. Some machine geometry and individual technique may reverse the heuristic ordering.

Before Coach uses scores to filter or recommend anything, test representative beginner, intermediate and advanced examples, physically accessible substitutions, movement-specific familiarity, and all specialty exceptions. Sophisticated programming should not automatically select movements with a high technical score.

## Research framework

Studies inform **decision principles**, not direct 308-row proof:

1. **ACSM 2026**: Currier et al. *Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults*, overview of 137 reviews, PMID 41843416, DOI 10.1249/MSS.0000000000003897. https://pubmed.ncbi.nlm.nih.gov/41843416/ . High-level evidence for progressive resistance work, goal-specific loading, flexible exercise selection and no consistent benefit from needless training complexity.
2. **NSCA, Essentials of Strength Training and Conditioning 5th ed.**, chapter 18, program design: needs analysis, exercise selection, frequency, order, loading, volume, rest. https://www.nsca.com/certification/cscs/essentials-of-strength-training-and-conditioning-5th-edition/ . Professional programming framework.
3. **Kassiano et al. 2022**, *Does Varying Resistance Exercises Promote Superior Muscle Hypertrophy and Strength Gains?* systematic review, PMID 35438660. https://pubmed.ncbi.nlm.nih.gov/35438660/ . Eight studies of 241 young men; deliberate rather than random variation, but limited generalizability.
4. **Kassiano et al. 2025**, unilateral/bilateral strength and hypertrophy systematic review, PMID 39794667. https://pubmed.ncbi.nlm.nih.gov/39794667/ . Goal-specific strength adaptations, no universal unilateral superiority.
5. **Steele et al. 2013**, lumbar extensor exercise specificity review, PMID 24092889. https://pubmed.ncbi.nlm.nih.gov/24092889/ . Compound extensions and isolated lumbar-extension devices are not mechanically identical; exercise design matters.
6. **Plotkin et al. 2022**, load-versus-repetition progression trial, PMID 36199287. https://pubmed.ncbi.nlm.nih.gov/36199287/ . Small training experiment, neither progression path universally mandatory.
7. Existing project foundations for bodyweight/assistance, deload uncertainty, per-family exercise ranges and known tracking limits: [TRAINING_SCIENCE_FOUNDATION](../TRAINING_SCIENCE_FOUNDATION.md), [EXERCISE_LOAD_BEHAVIOR](../EXERCISE_LOAD_BEHAVIOR.md), [EXERCISE_INTELLIGENCE_FOUNDATION](../EXERCISE_INTELLIGENCE_FOUNDATION.md).

**Anatomical caveat:** The assigned primary/secondary labels mirror the *existing Swole Cat muscle map* to expose discrepancies. They are not the result of 308 separate muscle activation studies. Confirm notable variants against exercise technique literature and qualified coaching review before introducing any automatic ranking or regional-coverage claims.

## Required sign-off before integration

- [x] Inventory all 308 entries by stable ID and exact catalog fields.
- [x] Capture existing muscle mapping, required setup, intended movement roles, named-variation notes, demand estimates and supported progression type.
- [x] Produce candidate alternatives with explicit metric/loading and equipment cautions.
- [x] Record uncertainty and a priority-review queue instead of claiming every row fully verified.
- [x] Add a repeatable audit integrity check.
- [ ] Human/coach specialist adjudication of `priority_review` records, including flagged high-skill/machine/assistance/per-side and hidden-equipment cases.
- [ ] Resolve review issues, expand exercise-specific movement profiles and confirm exercises' real practical setups before runtime activation.
- [ ] Compare current app runtime's effective load/measurement resolver to all audit inferences; test machine and bodyweight edge cases.
- [ ] Have user inspect sample simple and advanced workout recommendations; independently review feasibility, equipment access, reasonable progression, and explanations.
- [ ] Owner expressly approves a **separate** Brain runtime rollout to Testing only, followed by full CI and Android acceptance.
- [ ] Owner separately approves any Beta promotion.

**Approval gate:** Do not merge this draft audit into live Swole Cat intelligence as though it were a validated knowledge model. It is a complete 308-row inventory and preliminary review, with unresolved expert verification deliberately tracked.
