# v0.89 Exercise Classification Adjudication, research-only

**Date:** 2026-10-13. **Scope:** All 86 initially prioritized audit flags, plus five newly discovered specialty profiles, with revised side-execution metadata across the 308-row catalog. **Status:** desk-level classification decisions recorded, **not** independent medical, clinical, or 308-study verification, and **not live Coach behavior**.

## Outputs

- [308-row audited master](exercise-knowledge-audit-308.json), source fields deliberately preserved alongside a `proposed` classification layer. Compact JSON to stay below GitHub API file-size limits.
- [Human-readable 308-row CSV](exercise-knowledge-audit-308.csv), now with proposed equipment capabilities, movement role, load semantics and side execution.
- [91-entry resolution ledger](exercise-flag-resolution-91.json), which lists each flagged exercise's original finding, case-specific decision, equipment, progression meaning, remaining user context and research identifiers.
- [Resolution ledger CSV](exercise-flag-resolution-91.csv) for focused review.
- [Statistics](exercise-knowledge-audit-statistics.json) distinguishing original flag count, additional findings and decisions.

The existing `catalog` and `muscleMap` fields **remain snapshots of v0.88**, including existing weaknesses. The `proposed` objects are corrected recommendations for the future Brain, not changes already applied in runtime. **This distinction is essential** for avoiding accidental misrepresentation of v0.88, stored workout histories and current progression rules.

## Resolution categories and actual decisions

### 1. Equipment availability is not the same as resistance source

"Bodyweight" alone does not mean "zero equipment." Pull-ups and dead hangs require a secure overhead anchor; bench dips and decline crunches require support; a Nordic curl needs an ankle restraint; a sliding curl needs sliders/a suitable surface; Ab Wheel needs a wheel; Banded Hip Abduction needs a band; a captain's-chair raise needs a chair station. Weighted Push-Up needs safely secured added load.

`Meadows Row` is especially misleading in the live catalog because it is labeled **dumbbell** but conventionally uses an anchored barbell. Proposed capability: `barbell + plates + anchored_landmine + stable_braced_stance`. Landmine Row and T-Bar Row also require a compatible anchor or dedicated station. This fixes future availability reasoning *without changing the existing exercise ID/equipment in the current app*.

A glute-ham developer and an angled Roman-chair bench are **supports**, not evidence of an externally loaded machine stack. The proposed resistance policy is bodyweight-first with optional added weight for these support movements. A Nordic Curl Machine's actual assistance/resistance type must be identified before treating its numeric log as standard external load.

**Runtime gate:** A "full gym" preset does not imply every specialty station. The eventual equipment ontology needs separate capabilities and user-confirmed inventory, not an automatic catalog label replacement.

### 2. Mechanical roles that needed correction

| Movement | Proposed Brain classification | Rationale / caveat |
|---|---|---|
| Glute Ham Raise | Combined knee flexion and hip extension | NSCA technique description includes knee and hip motions; not a simple RDL hinge |
| 45-Degree Back Extension | Supported hip extension with variable lumbar involvement | Do not claim isolation from exercise name alone |
| Roman Chair Back Extension | Supported hip/trunk extension | Pelvis and technique determine specificity, not guaranteed lumbar isolation |
| Seated Back Extension Machine | Machine trunk extension, pelvic-restraint dependent | Ask/confirm machine type before making specific lumbar claims |
| Assisted Dip, Plate Loaded Dip, Bench Dip | Compound dip press | Triceps emphasis plus chest/front-shoulder contribution, not an isolation pushdown |
| Diamond Push-Up | Close-hand compound horizontal press | Not a single-joint triceps exercise |
| Pallof Press | Anti-rotation | A woodchop is a related core alternative but cannot replace the precise role automatically |
| Renegade Row | Horizontal row + anti-rotation | Unlike an ordinary heavy supported row |
| Side Plank | Isometric anti-lateral flexion | Do not call it dynamic side bending |
| Push Press | Leg-drive overhead power press | Different intent and loading compared with a strict overhead press |
| Kettlebell Swing | Ballistic hip hinge/power | Quality and skill, not high-rep grinding to failure |
| Sled Drag | Direction unspecified | Without a selected drag direction, do not assert backward-drag quadriceps specificity |
| Backward Sled Drag | Explicit backward locomotion, knee-extension emphasis | Surface and load comparisons remain setup-dependent |

These are **proposed distinctions**, not claims that a single anatomical mapping captures every execution. For example, changes in trunk movement and pelvic restraint alter back-extension stimulus, so the Brain must preserve uncertainty.

### 3. Per-side and bilateral training

Every original unilateral flag now has a documented side-execution decision. The whole proposed catalog additionally distinguishes movements that the first flag sweep missed, including walking/reverse lunges, cable kickbacks, side-lying/cable hip abduction, hip adduction, woodchops, side planks and side bends. Some are alternating, some one-side-at-a-time; B-stance movements are offset-stance.

Do **not** treat a set counted as "10 reps" as proof of 10 reps on each side. No side-specific PR, symmetry judgment or progression decision is valid without actual per-side logs. Existing v0.88 workout entries are not rewritten. The 2025 unilateral vs bilateral meta-analysis informs specificity of adaptations but **does not** validate an app's side-count convention.

### 4. Technical/power lifts

Power Clean, Hang Power Clean, Clean Pull, High Pull, Power Snatch and Hang Power Snatch remain separate movement identities. Their catches, starting positions and emphasis differ. Coach must understand that "advanced workout" does not necessarily imply an Olympic movement, and must not automatically prescribe generalized 8-12 near-failure training for a skill/power lift. Push Press and Kettlebell Swing get analogous technique/quality-first caveats.

### 5. Alternative exercises

All alternatives in the audit remain **related training options, not equivalent histories or weights**. Up to three catalog candidates can be shown for comparison, but no automatic exercise-ID transfer, same PR baseline, compatible rep targets, or machine-weight assumption is approved.

A Dead Hang has no true same-metric, same-role timed-grip substitution in this catalog. Sled Push versus Sled Drag, and Pallof Press versus dynamic trunk rotation are intentionally related rather than interchangeable. Sparse substitute lists are **legitimate catalog limitations**, not data-quality errors to "fix" with incorrect replacements.

## Scientific grounding and limitations

The sources below support broad principles and a subset of specific mechanical classifications. **They do not independently validate all 308 detailed profiles**, nor do they imply numerical technical-demand scores are measured facts.

- **ACSM 2026**, Currier et al., overview of 137 systematic reviews, healthy-adult resistance training: https://pubmed.ncbi.nlm.nih.gov/41843416/ . Complex exercises are not consistently superior; goal specificity and progressive training matter.
- **Kassiano et al. 2022**, exercise variation review: https://pubmed.ncbi.nlm.nih.gov/35438660/ . Variation is deliberate and anatomy-informed, not arbitrary exercise swapping.
- **Kassiano et al. 2025**, unilateral/bilateral meta-analysis: https://pubmed.ncbi.nlm.nih.gov/39794667/ . Strength responses are task-specific; no established unilateral hypertrophy superiority.
- **NSCA glute-ham raise exercise technique**: https://www.nsca.com/education/articles/kinetic-select/glute-ham-raise/ . Knee flexion and hip extension contribute.
- **Steele et al. 2013**, lumbar extension specificity review: https://pubmed.ncbi.nlm.nih.gov/24092889/ . Pelvic restraint is relevant to isolated lumbar-specific adaptations.
- **Larivière et al. 2011**, Roman-chair trunk/hip fatigue and execution: https://pubmed.ncbi.nlm.nih.gov/20508534/ . Roman-chair work is not perfectly back-specific.
- **NSCA power clean technique**: https://www.nsca.com/education/articles/kinetic-select/power-clean/ .
- **NSCA clean variations**: https://dxpprod.nsca.com/education/articles/nsca-coach/clean-variations-progressions-and-application/ .
- **NSCA Nordic curl technique/progression**: https://www.nsca.com/education/articles/nsca-coach/exercise-progressions-for-resuming-strength-training-following-posterior-chain-muscle-injury/ .

## What is resolved, and what is still gated?

**Resolved at desk-classification level:** all 86 initial priority cases have a documented interpretation; five additional specialized cases have also been recorded, and other obviously per-side movements were corrected within the proposed 308-row overlay. Catalog mechanics, equipment and progression data are structured for future review.

**Not yet resolved by literature alone:** the user's actual equipment, machine type or cable ratios, execution style, precise side-by-side workout performance, unknown sled direction and ability to perform skilled lifts. These are *runtime/user-context requirements*, not arbitrary missing research fields.

**Not authorized:** changing `src/data/exercises.js`, muscle-heatmap mappings, progression calculations, stored data, Coach rankings, account records, APK version, Testing release or Beta. After approval, a separate small Testing integration must preserve the original catalog metadata for backwards compatibility and be reviewed with realistic workout requests.

## Non-regression validation required

1. Verify all 308 IDs/names/catalog fields against source; each proposed role and requirements nonempty.
2. Verify initial 86 IDs each have exactly one ledger entry; five additional entries are clearly separated.
3. Verify no current `catalog` or existing `muscleMap` is silently rewritten.
4. Validate load direction for three assisted movements, added load in weighted bodyweight variants and the variable load semantics of bench-based/GHD movements.
5. Test bodyweight-with-gear, landmine, technical lifts and every corrected movement classification.
6. Verify per-side flags and measurement types remain honest and explicit.
7. Preserve backup/history separation and no auto-substitution between non-equivalent exercise IDs.
8. Keep the full v0.88 regression suite green; no APK until owner specifically authorizes a later runtime rollout.
