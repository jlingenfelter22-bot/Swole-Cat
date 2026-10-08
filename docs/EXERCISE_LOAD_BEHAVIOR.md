# Exercise Loading Semantics: Assisted, Bodyweight, and External Resistance

**Exercise-intelligence expansion (Testing v0.84.0):** [EXERCISE_INTELLIGENCE_FOUNDATION.md](EXERCISE_INTELLIGENCE_FOUNDATION.md) tracks the implemented phase-one movement-family profiles, suggested rep ranges, real hold-time/distance measurements, and catalog-wide validation. Per-side logging, multi-measure activities, stopwatch integration, and advanced exercise-specific mechanics remain proposed rather than implemented.

**Implementation scope:** Testing v0.83.0 candidate. Supports workouts launched from routines and programs, plus relevant Strength Focus / Track Only / Guided modes.
**Research prerequisite:** [TRAINING_SCIENCE_FOUNDATION.md](TRAINING_SCIENCE_FOUNDATION.md). Not a recommendation to change a patient's medical rehabilitation equipment or loading.

## Why this matters

The numeric `weight` field does not always mean external resistance. The same amount can represent added resistance, a machine counterweight, or no external load at all. A progression system that always adds pounds is wrong for assisted pull-ups, chin-ups and dips and can distort PRs and trend displays.

## Three distinct loading types

| Type | Exercise examples | Input and progression | Analytics |
|---|---|---|---|
| `external` | Barbell lift, lat pulldown, **Weighted Pull-Up** / **Weighted Chin-Up** | Numeric **Weight / Added weight** is load used. Increasing it raises resistance. Guided double progression raises resistance after the rep target across all sets, subject to configured steps and guardrails. | Conventional load PR and estimated 1RM allowed for exercises where those metrics are meaningful. |
| `assistance` | **Assisted Pull-Up**, **Assisted Chin-Up**, **Assisted Dip** | Numeric **Assistance** is counterweight. First build reps; after every required set reaches the target at the same assistance, **reduce** assistance by the configured step. Floor is **zero**, never negative. | A lower counterweight with comparable reps can earn an **Assistance PR**. Do not treat the counterweight as external resistance volume or use it for estimated 1RM/strength decline. |
| `bodyweight` | Regular **Pull-Up**, **Chin-Up**, **Dip**, **Push-Up** | **Reps only**. No mandatory weight input and no invented external load after completing a rep range. User may select a harder named variation or weighted version when ready. | Track repetition PRs, training consistency, sets and optional effort, **not** artificial 1RM from bodyweight 0. |

**Library matching priority:** Explicit routine `loadType` (`external`, `assistance`, `bodyweight`) takes precedence. In automatic mode, recognize names indicating *weighted* first, *assisted* or *counterweight* second, then known `equipment: bodyweight` as reps-only; otherwise use external resistance. A loaded movement's title and routine override are stronger evidence than equipment alone. Explicit overrides are offered in the routine exercise's Progression settings, including for user-defined movements. History retains exercise ID and the original session config, rather than retroactively changing actual recorded weights.

**Example:** 64 lb assistance × 12 across three programmed sets with a configured 5 lb step suggests 59 lb assistance next time, with reps reset toward the lower end. At 24 lb assist the next step is 19 lb assist. At 3 lb assist the next step bottoms at 0, and at 0 assist no lower weight is suggested. For 0-added-weight regular Pull-Up, a 12-rep ceiling should suggest holding good-quality reps or deliberately choosing a weighted/advanced variation, never silently adding a 5 lb value to a reps-only movement.

## Scientific and data interpretation boundaries

- Less counterweight generally increases the portion of the person's weight they must lift, but machine friction/leverage, user weight, technique, use of bands, and range of motion vary. A 5 lb decrease in counterweight is not necessarily an exact 5 lb increase in actual muscular load.
- Do not calculate a normal external-weight volume or Epley estimated 1RM from assistance values. A `0` assistance entry can be meaningful (unassisted movement); a `0` external weight entry may be missing data or legitimate bodyweight/movement depending on type.
- Assistance PRs must require comparable repetitions, not simply lower counterweight with fewer reps. Higher machine assistance alone must **never** earn a load PR.
- Bodyweight movements track reps/effort; those provide a progression metric without assuming or fabricating a loaded barbell-equivalent weight.
- Weighted variants are distinct exercises: `0` **added** weight is permitted as a starting value, but the app should not infer total body mass or automatically enforce a weight jump without an appropriate positive external-load baseline.
- Loading type does not diagnose recovery and does not replace technique, effort, safe machine steps, or human judgment. Users can override suggested targets.
- Deload weeks remain factual activity and do not drive misleading strength/plateau judgments; temporary deload loading and reps do not rewrite underlying exercise settings.
- If an active exercise is substituted with a different movement, reset the old movement's explicit loading override to Automatic. For permanently saved substitutions, update the routine's loading interpretation as well.

## Regression contract

The testing suite `scripts/load-aware-progression-stress.mjs` checks built-in assisted/bodyweight/weighted identity, positive and zero assistance targets, all-set gating, Strength Focus/Track Only isolation, bodyweight reps-only controls, >10% added-weight guardrails, direction-aware PR evaluation (including historical recomputation), external-load volume exclusion, assisted progress display, routine override, and share/import compatibility.

## Follow-ups after field review

Possible future refinements: explicitly configured machine plate increments and per-equipment step presets; variable-band assistance without numeric counterweight; bodyweight + vest/belt equivalence, unilateral assistance and cable pulley ratios; form/ROM consistency, advanced bodyweight progressions. These are product hypotheses requiring additional design and approval, not silently enabled behavior.

**Release policy:** Testing first. Never promote to Beta without user approval.
