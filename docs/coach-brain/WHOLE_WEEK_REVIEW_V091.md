# Coach Brain v0.91: Opt-in Split Guidance + Whole-Week Draft Review

**Date:** October 13, 2026. **Status:** Draft development; synthetic CI/human Android acceptance pending. Branch stacks on v0.90 intake PR #66. No signed Testing/Beta promotion.

## Why

The owner approved an intent-first coach. The current interactive intake asks which split the lifter means; this pass handles the next two concerns: "I don't know what split to choose" and "Do the selected routines form a sensible whole week?" The existing saved Program auditor (v0.63) analyzes already saved routines and history, while this review operates on **unsaved draft exercise selections** before users commit anything. It is non-destructive and can be recalculated after Swap/Remove/refinement.

## Behavior and guarantees

- **Help me choose / recommend** is user-initiated. If the user's primary goal was not explicitly given, Coach asks it first. It then explains relative tradeoffs of PPL, Upper/Lower, Custom Body-Part and Full Body for the stated frequency. **It does not auto-select a split**, favor Full Body by default, or promise a superior training outcome.
- Whole-week draft review aggregates selected exercise movement patterns and audited muscle-region metadata. It identifies whether representative **press**, **pull**, **knee**, and **posterior-chain** patterns appear somewhere across the draft week.
- For custom body-part splits, it can flag no primary chest training as a **choice to consider**. An intentionally narrow program is not called medically unsafe or invalid. If the lifter selected a muscle focus but current exercises provide no planned contribution, surface that mismatch.
- A day whose selected exercises have no primary involvement with its declared target region receives a non-blocking review note.
- The preview includes an accessible "Whole-week review" section and explains that its role checks are planning observations, not prescriptions, fatigue/readiness diagnoses or mandatory weekly volume requirements.
- All advice uses **current exercise IDs and set counts**; it does not change split, exercise list, program mode, deload, history or other accounts. Existing preview edits trigger a new review upon rendering.
- Remain local-first. No external LLM, cloud calls, medical context or telemetry is introduced.

## Science and limitations

- **ACSM 2026 position stand (PMID 41843416):** General evidence supports effective resistance-training programs considering goal, weekly exposure and progressive overload, not a single universally superior split. General movement-pattern coverage here is a **product heuristic**, not a clinical or experimental threshold.
- **NSCA programming / needs-analysis principles:** Individual goals, equipment and availability inform exercise selection. A pattern observed to be missing is informative but does not mandate prescribing that pattern to every lifter.
- A chest-focused movement's primary metadata is only an approximation of trained tissue and does not prove gains. Selected sets are not a direct physiological dose measurement. Lack of a category can be an intentional restriction; do not automatically override it.
- Exercise-pattern review does **not** predict true recovery, injury risk, biological readiness, or ideal weekly sets.

## Acceptance matrix

- Vague "3-day split" → Coach asks split; "Help me choose" → if necessary asks goal, then displays informed choices; no program created without the user's selection.
- Explicit "3-day Full Body" → respects the full-body choice with no repeated split question.
- Custom Arms / Back / Legs with no chest press → explain pressing/chest choice; preserve every day and existing split.
- Introduce a chest press to draft → review updates and no longer claims primary chest/pressing is absent.
- Program with all four broad patterns represented → do not fabricate deficiencies.
- Specific missing priority region → explain without automatic exercise insertion.
- Full synthetic regression plus qualitative exercise-output review, narrow phone acceptance, no saved-history or Supabase writes, Beta unchanged.

## Remaining follow-ups, not yet implemented

- Full-day-equipment/time negotiation and nonuniform per-day durations.
- Rich multi-turn confidence model for out-of-vocabulary prompts and custom muscle-day instructions.
- Consent-based observed duration calibration and preference learning.
- Manual real-device accessibility and generated-workout human review before any release approval.
