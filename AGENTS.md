# Swole Cat Developer / AI Agent Instructions

This repository contains the Swole Cat workout tracker, its Coach system, Android Testing and separate field Beta channels.

## Mandatory training-science checkpoint

**Before investigating, proposing, reviewing, testing or editing** workout behavior, exercise prescriptions, progression, Guided Progressive Overload, Strength Focus, Track Only, fatigue, deloads, RIR/RPE, history-informed suggestions, Coach programming, load/repetition/volume recommendations, sets, or rest targets:

1. Read [docs/TRAINING_SCIENCE_FOUNDATION.md](docs/TRAINING_SCIENCE_FOUNDATION.md) completely, [docs/EXERCISE_LOAD_BEHAVIOR.md](docs/EXERCISE_LOAD_BEHAVIOR.md) for loading semantics, and [docs/EXERCISE_INTELLIGENCE_FOUNDATION.md](docs/EXERCISE_INTELLIGENCE_FOUNDATION.md) for movement-family, time/distance measurement, goal-based suggested ranges, and further design limits. Phase 1 of the exercise intelligence model was implemented in Testing v0.84.0; later enhancements remain proposed. These references are required before touching workout load or progression.
2. Read [docs/COACH_SWOLECAT_EVIDENCE.md](docs/COACH_SWOLECAT_EVIDENCE.md) for implemented Coach contracts and previously researched workout intelligence.
3. Read [docs/ROADMAP.md](docs/ROADMAP.md) for approved modes and product scope, and [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md) for the current branch/release guardrails. Validate against the actual latest code and tests rather than treating documentation as proof of current implementation.
4. In a proposed behavioral change, distinguish established research from limited trials, expert coaching consensus, and product hypotheses. Identify affected goals/exercise types, user overrides, edge cases and non-regression tests.
5. Never hardcode a mandatory load jump, frequency, deload schedule, fatigue diagnosis or readiness score solely because a paper mentions a practice. A missed progression is not automatically overtraining or an indication to deload.
6. Do not silently alter existing user history or override user-defined targets. Preserve local-first behavior, compatible stored workouts, per-routine/program training modes and Track Only independence.
7. Require explicit user product approval before implementing training-behavior changes. Test experimental behavior in **Swole Cat Testing**; do not merge/publish to **Beta** without separate explicit approval.
8. Update the research document's dated log if meaningful new evidence changes a recommendation; provide source identifiers and limitations.

## Documentation does not equal runtime intelligence

This research is a **development reference** for agents and developers working with the repository. The installed app does not automatically import these Markdown files into Coach. Changing Coach's runtime knowledge or workout algorithms is a separate engineering decision and must not be inferred from documentation changes.

## Other operating rules

- Keep Testing and Beta package IDs, signing/update channels, and workout data isolated.
- Preserve existing successful UX unless the user requests a change.
- Research-only tasks are documentation-only. Do not bump package versions, modify runtime sources, publish APKs, or change active recommendation behavior for a documentation task.
- Never represent incomplete or synthetic test logs as clean training evidence. Also recognize that zero external weight can be legitimate for a bodyweight exercise.
- When a request references prior Swole Cat decisions, consult repository documents rather than guessing details.
