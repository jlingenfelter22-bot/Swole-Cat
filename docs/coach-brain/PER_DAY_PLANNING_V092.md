# Coach v0.92 — Per-Day Time, Equipment and Emphasis

**Date:** October 13, 2026. **Status:** Development branch only. This is not an Android release. Builds on owner-approved Coach intent contract, v0.90 program intake and v0.91 whole-week preview review.

## Owner problem and solution

A real training week can differ by day: *Monday has 30 minutes at a gym; Wednesday has 45 minutes with dumbbells; Friday has 75 minutes at a gym*. Coach should not flatten that into one session template. Nor should equipment named for one day become a global assumption, or a single day's focus override the entire week.

### Behaviors

- Parse **weekday-scoped directives** such as `Monday 30 minutes`, `Wednesday 45 minutes with dumbbells`, and `Friday 75 minutes at the gym`. Explicit per-day emphasis (`Friday more shoulders`) applies to that day only.
- Keep the day name and the saved preferred-day mapping separate from per-slot overrides. The weekday directive follows its weekday even when a routine's position changes; a manual Day 2 adjustment stays attached to Day 2.
- If all selected weekdays have specified durations, **do not ask for a redundant global duration**. When only some times are supplied, request a common default for unspecified sessions.
- If all weekdays have explicit equipment choices, Coach may build without asking a global equipment question. If only some are specified and no shared choice was given, ask for remaining workouts; never assume one gym mention grants access every day.
- **Incompatible focus clarification:** When a weekday-specific muscle priority cannot fit that day's split (e.g. Friday **more shoulders** but Friday is **Legs** in PPL), Coach pauses and asks whether to change the split or remove that extra emphasis. It must not quietly ignore the request, relocate it, or promote it to a whole-week preference.
- Each day gets independent exercise selection, time trimming, equipment checks, rest/prescription defaults, and emphasis within its already selected muscle group. Respect the weekly plan's chosen split.
- Preview shows **Adjust day** on each day card. The accessible editor exposes duration 15–120 minutes, shared/gym/dumbbell/bodyweight/custom equipment, and optional additional focus limited to that day. Failed validation keeps prior draft intact.
- Preview shows honest day-specific time ranges; generated routine descriptions and an optional `coachPlannedDays` Program metadata field retain planning context, without changing existing session histories or workout load semantics.
- Single-weekday refinements `Wednesday 55 minutes` must not reduce a three-day program to one-day or turn 55 minutes into the entire week's default. Explicit shared changes and explicit different splits still follow previous v0.90/v0.91 rules.

### Scientific/product boundaries

The programming guidance is anchored in the 2026 ACSM resistance training position stand (PMID 41843416), NSCA needs analysis and the repo's `TRAINING_SCIENCE_FOUNDATION.md` / `COACH_SWOLECAT_EVIDENCE.md`. Varying duration and equipment between sessions is **owner-approved product behavior**, not an experimentally validated optimization algorithm. Timing estimates are modelled ranges, not stopwatch calibration. Recommendations are non-diagnostic and never infer injury, fatigue, recovery, physiological readiness or ideal weekly volume.

Training modes, optional Guided deloads, user sets/reps and bodyweight/assisted load semantics remain unchanged.

### Acceptance gates

1. Real user prompt routing (not just direct builder calls) preserves distinct 30/45/75-minute day limits.
2. Partial time information causes a question, rather than silently assigning the first mentioned day duration to the entire week.
3. Day-specific gym/dumbbell/gym equipment is honored and every generated exercise is available in that day's verified equipment context.
4. The narrow modal editor permits valid one-day changes and rejects invalid equipment without mutation; rest of the week, user's calendar and previous sessions remain unchanged.
5. Natural-language day emphasis outside the chosen muscle group triggers a helpful clarification without rewriting the split or spreading that priority across other days.
6. Preview, estimated day times, saved routines and `coachPlannedDays` must agree.
7. CI plus qualitative generated-session review and actual Android small-screen review before any signed Testing promotion. No Beta/cloud account changes.

### Deferred

Full understanding of *unstructured* equipment descriptions beyond recognized categories; advanced multi-clause resolution involving multiple weekdays with mixed global directives; dynamic rest-day/weekly readiness predictions; real stopwatch feedback calibration. Do not claim these are implemented.
