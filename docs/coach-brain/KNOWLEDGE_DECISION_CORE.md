# Swole Cat Brain v0.89: Read-only Exercise Knowledge Decision Core

**Status:** Development proposal, not an app release. Branch `feature/brain-v089-knowledge-decision-core`, PR #58. This layer **registers a runtime service but is not called by the current Coach workout generator, exercise picker, progression or history**. No source catalog metadata or stored workout data is altered. The current release remains v0.88.0 Testing. The Beta branch remains v0.73.1.

**Dependency:** PR #57 is the corrected 308-row research/desk-adjudication source. PR #55 is the broader Brain architecture charter. PR #56 is a separate equipment-question UI draft, not bundled here, and must be reconciled intentionally before adoption.

## Implemented boundaries

`src/data/coach-brain-exercise-profiles.js`: compact local knowledge profiles for **exactly 308** built-in exercise IDs derived from the `proposed` fields in `docs/coach-brain/exercise-knowledge-audit-308.json`. Does not store personal history, owner IDs, equipment preferences or secrets.

`src/js/04a0-coach-brain-knowledge.js`: isolated synchronous module registering `SwoleCatRuntime.getService('brainKnowledge')`. Exposes:

- `getProfile(id)`: immutable desk-reviewed candidate profile (or null for unknown/custom exercise).
- `describeExercise(id,context)`: structured muscle target, mechanical role, training purpose, measurement, load meaning, technical demands, review level, side-tracking and equipment/caution summary.
- `evaluateAvailability(id,context)`: returns `available`, `unconfirmed`, `unavailable` or `unknown_exercise` with explicitly missing requirements, clarification codes, assumptions and explicit exclusion precedence.
- `suggestSubstitutes(id,context,options)`: catalog-wide candidate search, matching measurement and primary-target overlap, exact corrected role by default. A caller can explicitly opt into *related, non-equivalent* roles or unconfirmed equipment. Returns no candidate by default when availability is uncertain, honors exercise exclusion, never silently substitutes or transfers training history.

## Equipment context contract

```js
const brain = SwoleCatRuntime.getService('brainKnowledge');

// Complete equipment inventory explicitly provided by user
brain.evaluateAvailability('lib_94', {
  equipment: {
    available: ['barbell','plates','anchored_landmine','stable_braced_stance'],
    unavailable: [],
    complete: true
  }
});

// Partial, conservatively assumed home-dumbbell inventory
brain.suggestSubstitutes('lib_0', {
  equipment: {
    available: ['dumbbells','bodyweight','exercise_space','bench'],
    complete: true
  }
});
```

The service has three *optional* quick presets:
- `floor_only` assumes bodyweight plus ordinary exercise floor space. It **does not** assume bars, dip stations, sliders, bands, weighted gear, or an ab wheel.
- `home_dumbbells` assumes dumbbells, bodyweight, ordinary floor space. It **does not** assume an adjustable bench or specialty stations.
- `standard_gym` assumes common barbell, plates, dumbbells, bench, cable and floor access. It **does not** guarantee specialty attachments, a sled, a specific machine, overhead station or dedicated power-lift setup.

Preset-derived availability is explicitly labeled as **assumed**, not verified ownership. `complete` means no other equipment exists, and missing requirements are unavailable. Without a complete inventory, missing requirements remain *unconfirmed*, not impossible. Explicit `unavailable` and `excludedExerciseIds` always override presets.

Some capabilities represent clarifications rather than hardware (`drag_direction_to_confirm`, `pelvic_restraint_status_unknown`, `assistance_mechanism_unknown`); absence triggers a follow-up requirement. Specialty capability alternatives such as a landmine-or-T-bar anchor are handled as groups. Standard parallel-bar Dips are never considered satisfied by a lone bench, even if Bench Dip itself is feasible.

**No equipment inventory is persisted or inferred from another Google account.** Every request receives its own context, so A/B account changes cannot share state through the Brain service.

## Substitution safety contract

1. Candidate must have the **same measurement** as the original (`reps`, `duration`, `distance`). Dead Hang has no same-measurement, same-role alternative in this catalog.
2. Candidate must share a primary target and normally the same corrected mechanical `role`. Broader related roles require `includeRelated:true`; this is a product/engineering scope decision, not proven interchangeability.
3. Machine assistance, external load, weighted bodyweight and ordinary bodyweight cannot inherit one another's numerical PRs. If load policies differ, explain that values are not transferable.
4. No automatic history, set or routine changes. Every suggestion sets `historyTransferAllowed:false` and `automaticSwapAllowed:false`.
5. Where a side-execution or skill/power mismatch exists, disclose it. The audit still lacks independent per-side PR data.
6. `includeUnconfirmed:true` only surfaces an option marked as unconfirmed for the caller to ask about; it never approves automatic selection.

The numeric candidate rank is a **bounded engineering similarity heuristic** that prioritizes corrected role, shared muscle targets, same loading meaning and comparable technical demand. It is not a proven measure of muscle activation, injury risk or workout efficacy. Sorting uses stable IDs/names. Additional human review is needed before applying ranks to live workout selection.

## Test matrix / status

`scripts/coach-brain-knowledge-stress.mjs` tests all 308 profiles against the exact audit, bodyweight with auxiliary gear, real/partial/complete equipment inventory, specialty landmine restrictions, machine mechanism clarification, sled direction, explicit exclusion precedence, substitution honesty, duration/reps separation and A→B→A independent contexts. No DOM, network, Supabase or real user data is required.

`.github/workflows/validate.yml` also checks modular source registration, builds the production bundle, runs the audit integrity test, and runs the full existing workout/cloud/Coach regressions.

Before enabling Coach to *use* these profiles:
- Review representative chosen simple/advanced workouts for training quality, equipment and time feasibility.
- Resolve interaction with PR #56's questions, including saved per-owner equipment preferences, Skip/Other options, and a clear fallback.
- Validate on real low-end Android devices for startup/bundle size and ordinary Coach latency.
- Review unknown machines and technical lifts; don't treat desk decisions as verified prescriptions.
- Add a separate Testing-only feature gate, side-by-side compare v0.88 vs revised generated plans and perform human acceptance.
- Preserve local data, tracking modes and user overrides; Beta promotion requires express authorization.

## Research and uncertainty

Training-specific decisions refer to the existing [2026 ACSM overview of reviews](https://pubmed.ncbi.nlm.nih.gov/41843416/), [exercise-variation systematic review](https://pubmed.ncbi.nlm.nih.gov/35438660/), and [Swole Cat training-science foundation](../TRAINING_SCIENCE_FOUNDATION.md). Mechanical exceptions refer to the [flag adjudication notes](FLAG_ADJUDICATION.md). These sources support broad programming principles, not proof that every detail of all 308 exercise profiles is objectively correct. This service may not diagnose fatigue, readiness, injury or overtraining.

**No version bump, no APK, no cloud action, no Beta changes.**
