# Coach Brain v0.89: Contextual Quick Build and Editable Workout Conversation

**Checkpoint:** 2026-10-13, draft PR #59. **Status:** Testing-only development candidate, no release. Version remains 0.88.0 in installed Testing, Beta unchanged at 0.73.1. Requires PR #57 audit and PR #58 exercise-knowledge service. PR #56 was an earlier independent equipment-question prototype and **has not** been merged into this work.

## User-approved behavior

A brand-new vague single-session workout request should **ask the user again** rather than reuse unconfirmed equipment from an earlier request:

1. If target missing, ask what muscles the user wants to train.
2. If duration missing, ask how much time they have (30, 45, 60, 75 min).
3. If equipment missing, ask what is available **today**: common gym, dumbbells and bodyweight, bodyweight only, custom equipment, or skip.
4. If target, time and equipment are already explicitly provided, **don't repeat** those questions. Follow-up edits to the **same draft** do not re-ask answered questions.
5. Generate only from exercises whose audited supplemental equipment requirements are compatible with the explicit or disclosed-assumption inventory. Reject hidden or excluded exercise IDs, excluded patterns and disallowed equipment categories.
6. Show a preview allowing Start, Save, Add to Program, manual Remove/Swap and continued natural-language refinements.
7. When equipment cannot support a viable balanced plan, say so and offer **Change equipment**, not imaginary tools or unsupported movements.

This question policy applies to the interactive single-session Quick Build. Explicit user-authored sets/reps and multi-day programs retain their established routes. Broader program equipment dialogues require a separate acceptance pass to avoid legacy behavior regression.

## Examples and expected flow

| Prompt | Coach action |
|---|---|
| "Give me a leg workout" | Ask time, then today's equipment |
| "Give me a 30-minute leg workout" | Skip known time, ask today's equipment |
| "30 minutes of legs with dumbbells only" | Generate with dumbbells-only candidates; do not presume a bench or machines |
| "30 minutes at a full gym" | Assume common gym classes only, labeling that as an assumption. No automatic sled, landmine, pull-up station or specialty machine |
| "30-minute bodyweight-only legs" | Never invent quad equipment. If current 308 catalog lacks a balanced floor-only plan, explain the limitation and allow new equipment choice |
| "Something other than squats" | Exclude squat-pattern variations from **this draft**, regenerate, preserve restriction through subsequent edits |
| "No lunges" | Exclude lunge-family choices from draft |
| "Bring squats back" | Clear the squat-family exclusion |
| "Actually just dumbbells" | Recompute this draft's equipment context; remove unsupported equipment choices |
| "Swap X for Y" | Resolve named movements; preserve request-level exclusions, generated exercises and independent histories |

### Known quality improvements

The first Brain-connected 30-minute gym-leg draft returned Back Squat, Sumo Deadlift, Hip Thrust and a calf raise. These were individually valid exercises but stacked several high-demand lower-body choices and underweighted direct knee flexion for a time-limited session. In response:

- The **short-session Brain-only policy** (duration <= 30 min, single requested legs/lower-body focus) limits the main draft to ~3 complementary movement roles instead of forcing four exercises.
- Where a normal gym setup can plausibly support an ordinary leg-curl station, a knee-flexion hamstring movement becomes a viable candidate. The preset marks common stations as *assumed*, not confirmed. It does **not** unlock all specialized machines.
- Where only dumbbells are available, a hinge may fulfill posterior leg work without asserting that the user owns a leg-curl station.
- A session with **no knee-dominant quads** or **no posterior leg work of either knee flexion or hinge** is rejected as unbalanced, not marketed as an all-leg workout.

These are product engineering rules for the 30-minute quick-build use case, not evidence of one universally best three-movement training plan. The model has **not yet implemented a full set-by-set setup/rest/unilateral-time feasibility simulator**. Preserve that as a separate Brain planning milestone.

### Equipment policy and caution

The read-only Brain service maintains `available`, `unconfirmed`, and `unavailable` distinctions, along with explicit hard constraints and source assumptions. In a vague request, each new draft asks again. A full gym is **not** a claim that it contains every machine, dip station or bar accessory. Specialty requirements such as an ab wheel, Nordic anchor, resistance band, a landmine mount, carry space, or sled track must be confirmed if used.

The first screen offers a Skip option, deliberately selecting conservative floor-compatible options and explaining the assumption. No new persistent equipment preferences or cross-owner caches are created. Equipment decisions are stored only in the current in-memory draft. Auth/cloud/workout data are never modified by clarification alone.

### Editing and substitution

The existing Coach refinement engine still handles equipment, target, set, goal and required-exercise edits. v0.89 adds broad-pattern intent such as "other than squats" and reconnects equipment choices after changes. A Brain-derived Swap tries verified-compatible same-role exercises and may fall back to related muscle-target options. It does not auto-transfer set-load histories, PRs or incompatible explicit reps/duration prescriptions between dissimilar movements. Users can manually swap or reject suggestions.

**Known limitations to tackle next:** conversational multi-part intent and negation ambiguities, exact vs broad squat exclusions, conflict explanations when user asks for an impossible explicit substitute, equipment-inventory questions for the multi-day program builder, quantifiable session time feasibility, side-specific logging gaps, and ranked recommendation quality with human lifter review.

## Safety, tests and rollout

- Tests: `scripts/coach-brain-conversation-stress.mjs`, original Coach stress suite, exercise intelligence tests, full v0.88 histories/cloud/account ownership regression suite. CI evaluates runtime source order, 308 audit parity and event-flow behavior in JSDOM.
- Per-draft `brainComparison` records original-selection IDs versus Brain-constrained selection IDs to support review. It is transient in-memory only.
- Never interpret a missing machine, a long rest, or an unconfirmed exercise as proof of injury or fitness capacity.
- Do not turn desk-level exercise knowledge into medical expertise or numerical injury-risk predictions.
- Never change past training records, backup snapshots, user cloud accounts, or account-switch ownership as part of this work.
- **Do not merge or publish as an Android APK before explicit owner acceptance in Testing. Beta promotion remains separately gated.**
