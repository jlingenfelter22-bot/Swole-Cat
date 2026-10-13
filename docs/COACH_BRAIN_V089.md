# Swole Cat Brain: v0.89 Architecture and Audit Charter

**Status:** Architecture proposal and non-behavioral development checkpoint, 2026-10-13. **This document is not a released feature or evidence that runtime recommendations changed.**

**Owner direction:** Build a powerful, local-first, deterministic "Swole Cat Brain" that owns shared training reasoning across Coach, programs, progression, analytics, and context-sensitive tips. Gemini may later serve as an *optional language interface*, but not the source of workout truth. Avoid monthly subscriptions, background inference costs, and needless training complexity. Test on the Testing channel; Beta stays frozen until owner approval.

## 1. Why a common Brain is necessary

The current app already has independent but overlapping capabilities:
- `04a` understands goals, schedule, equipment, target muscles, training experience and lifting syntax.
- `04b` selects exercises and applies coverage, preference, familiarity and movement-family ranking.
- `04b2` models weekly exposure, regional needs, mechanical demand, exercise continuity and single-session audits.
- `04b3` handles adaptive progression and longer-term exercise history.
- `04c` understands gym language and refines drafts.
- `04d` builds multi-day programs.
- `04f` edits saved routines from Coach.
- `04g` answers history questions.
- `04h` audits programs.
- Other modules provide exercise-load semantics, analytics, and Guided Progressive Overload.

These are useful foundations. They do **not** constitute a single, reusable source of training decisions. A new "Brain" must unify *decision inputs, evidence, constraints, result descriptions and explanations* while leaving specialized domains in their existing modules. Do not rewrite the app as one huge AI/coach function.

### Concrete observed shortcomings in v0.88

1. The parser recognizes `advanced` experience, but the ordinary selector has no explicit *desired programming sophistication* dimension. The top/backoff system uses experience, but this is not the same as asking for a technical/specialized bodybuilding workout.
2. In `coachGenericExerciseBias`, familiar staples get +18, while a regex of advanced/specialized named variations gets -22. This biases one against the other by 40 points even when the user asks for deliberate specialization.
3. Exercise technical demand currently estimates a heuristic cost, not a desired difficulty or skill-preparedness match. "Technical programming" must **not** equal "high-skill lift".
4. Default session exercise counts are partly duration divided by a constant, not a real warm-up + sets + rest + transition time feasibility calculation.
5. The current workout audit validates coverage, constraints and family caps and warns about high demand, but lacks a holistic quality rationale (coverage of stated *priority*, appropriate sophistication, plausible duration, equipment accessibility and exercise novelty vs continuity).
6. Coach's research documents are not automatically runtime knowledge. Relevant exercise knowledge needs versioned, reviewable, compact structured profiles and rules.

These are an audit baseline, not an assertion that all existing generated workouts are poor.

## 2. Product definition

The Brain is a **versioned deterministic reasoning service**. It makes recommendations using a coherent factual snapshot, explicit rules, user preferences, and qualified training evidence. The Brain does not own the user's workout records, authentication, cloud transport, UI components or timer. Those modules consume its read-only decisions.

```
User message / UI action / workout completion / history
                   |
                   v
          Context + intent adapters
                   |
                   v
   ┌─────────────────────────────────┐
   │       SWOLE CAT BRAIN           │
   │ training knowledge + profiles   │
   │ history/context interpretation  │
   │ hard constraints + soft ranking │
   │ plan & program reasoning        │
   │ independent validation          │
   │ explanation + useful insights   │
   └─────────────────────────────────┘
                   |
            Advice / Draft
                   |
      Coach | Programs | Workout UI
       History | Progress | Home
```

**Core rule:** one analysis of equivalent trustworthy facts must mean the same thing in every product surface. A history trend cannot be described as progressing in one tab and stalled in another because the screens have different private heuristics.

## 3. Brain components, separated by responsibility

Proposed domain modules (names indicative; adapt to existing numbered bundle order):

1. **Brain Knowledge.** Audited exercise profiles and movement-family rules: movement patterns, prime/secondary targets, region roles, exercise variants, unilateral/bilateral, technical skill, stability, setup/time cost, plausible equipment, loading semantics, measurement type, strength/hypertrophy applicability, substitutions, and contraindication *constraints* only when supplied by the user. Distinguish verified catalog metadata from approximate heuristics. Do not build hundreds of distinct algorithms.
2. **Brain Context.** Snapshot of *this account's* user goals, preferred and avoided exercises, known/unknown equipment, recent completed workouts, active programs, comparable performance, effort information where present, frequency, time available, current user overrides and input completeness. No cross-owner access. Unknown is not false.
3. **Brain Intent.** Interpret requests into structured intent, preserving the user's actual instructions. Separate training **goal**, **experience**, **programming sophistication**, **movement skill complexity**, **specialization**, **novelty**, and **constraints**. The word "technical" may mean advanced exercise variety, rigorous programming, or execution technique; ask or expose a clear choice only when resolving it materially changes the plan.
4. **Brain Planner.** First satisfy equipment, exclusions, explicit exercises, limited session time and other hard constraints. Then rank feasible combinations by requested regional roles, specificity, weekly context, movement diversity, progression continuity, acceptable demand and useful specialization. Never add complexity merely for its own sake.
5. **Brain Auditor.** Independently check whether the plan fulfills the request, fits constraints/time and has redundant or conflicting work. Grade with specific findings, not only a boolean. Surface a missing piece or feasible substitute. An audit never silently rewrites user-authored prescriptions.
6. **Brain Insights.** Generate event-triggered suggestions from verified observations (e.g. consistent progression, repeated skipped slot, equipment mismatch, useful next-set target). Prefer one relevant action over repeated cards. Never diagnose recovery, overtraining, injury, hormonal states, readiness or psychological motivation from workout logs.
7. **Brain Explanation.** Explain *which known facts* drove a suggestion, what is inferred rather than observed, and a straightforward option to keep, swap, adjust or dismiss. Do not show artificial confidence percentages.

Each component should be unit-testable without the DOM, Android, Supabase or a network connection. Cache by state revision when useful; avoid heavy rescoring on every keystroke.

## 4. Shared contracts, proposed

### BrainContext

- `schemaVersion`, `createdAt`, ephemeral `ownerScope`, relevant data revision.
- `request`: goal, targets and priorities, program vs session, duration, preferred training style, desired sophistication, laterality, hard and soft instructions.
- `person`: explicit/unknown training experience; equipment known vs unknown; selected units; exercise preferences; stated movement restrictions; training history **only if present and comparable**.
- `training`: completed sets and sessions, actual historical program coverage, planned weekly work, relevant performance trajectories, explicit effort/RIR, existing prescriptions, missing-data flags.
- `environment`: equipment availability with provenance (`explicit`, `saved preference`, `unknown`); transition/setup constraints when known.
- `dataQuality`: counts of eligible exposures, stale/conflicted/partial observations, whether conclusions are possible.

Do not serialize a cross-account universal "lifter profile"; build context from currently selected owner's local state. Browser/device cloud services enforce owner isolation independently.

### BrainDecision

- `kind`: `workout_plan`, `program_plan`, `progression`, `history_insight`, `live_tip`, `program_audit`, or `clarification`.
- `recommendation`: references existing exercises/programs/routines and **does not** mutate records.
- `reasons`: brief text grounded in input/metadata/history.
- `evidence`: versioned references and evidence kind (`evidence_synthesis`, `direct_trial`, `consensus`, `product_heuristic`).
- `observations`: what was actually logged vs what was estimated.
- `uncertainty`: `known`, `limited`, or `insufficient_data`, plus why.
- `alternatives`: compatible swaps and user overrides.
- `guardrails`: feasibility/conflict/warning details.
- `dismissKey` and `sourceRevision` for tips, to prevent spam and stale repeated advice.

No freeform model may directly write exercises, weights, routine settings or historical records.

## 5. The most important conceptual distinction

**Training experience ≠ programming sophistication ≠ technical exercise demand.**

A lifter might request:
- A beginner-friendly, practical session (simple prescriptions, commonly available equipment, few movements).
- Experienced but minimalist strength training (a few familiar high-specificity movements, no novelty).
- Technical bodybuilding (specialized exercise selection, thoughtful resistance profiles and regions, advanced set strategies *only where useful*).
- Skill-intensive lifting (Olympic movements or advanced coordination; honor stated goal and skill, don't infer it from the word "technical").
- Time-constrained or low-equipment training (maximize feasibility and stimulus using available options).

Default ambiguous "30-minute legs" to an accessible, coherent, editable plan. Prefer settings and stated equipment; if equipment is unknown, don't claim the user has every machine. Offer common-equipment/bodyweight alternatives and ask a single clarifying question only when necessary to produce a usable session.

A user's explicitly chosen unusual set/rep plan is authoritative unless incompatible with a hard constraint or safety boundary.

## 6. Proposed decision policy

1. **Guard**: resolve owner and data validity; block cross-owner information, incompatible load/measurement types, missing exercise definitions and unsatisfied explicit exclusions.
2. **Parse**: extract positive and negative instructions, goals, target emphasis, experience, sophistication and equipment with ambiguity tracking. Preserve exact sets/reps and requested exercise order.
3. **Plan**: generate multiple internally evaluated candidate combinations, not only independent single-movement ranks; respect available time including warm-up, working sets, rests, transitions and unilateral sides.
4. **Score softly**: prioritize objective fit and consistency, adequate target coverage and intended emphasis; reduce redundant volume, unnecessary skill burden, inaccessible equipment, excessive novelty and recent repeated stress. Weight values are tunable product heuristics, not scientific constants.
5. **Audit independently**: detect empty/overlong/incoherent or unbalanced sessions, unnecessary variation and contradictions.
6. **Explain and offer control**: short rationale, editable substitutions, explicit start/save actions. Do not auto-apply consequential changes.
7. **Learn safely**: record only user-approved preferences and logged outcomes. Respect local-only modes and account boundaries. Do not silently adapt from discarded drafts or treat one bad session as overtraining.

Use training context cautiously. Weekly set-equivalents are approximations, not a physiological measurement. Strength, hypertrophy, exercise order and frequency have differing evidence and depend on user goals.

## 7. Proactive intelligence without nagging

Proposed trigger sources:
- After **completed** workout: summarize a real performance improvement, an optional next-session action, or a notable untrained region across a *sufficient* history window.
- During a workout: relevant, bounded operational guidance only (e.g. an optional past-set target or compatible substitution). Never interrupt live logging or automatically change active targets.
- At program review: compare *planned* work to actual attendance/exposures and role coverage, identify meaningful discrepancies with evidence/uncertainty.
- At explicit Coach request: provide detailed rationale and feasible alternatives, including why doing less is sometimes smarter.

A signal is emitted only with sufficient data, an actual user benefit, a stable decision key and a surface-specific display budget. The Home screen should remain focused on starting/resuming workouts.

"No tip" is a correct Brain output.

## 8. Research foundation and limits

Honor existing `docs/TRAINING_SCIENCE_FOUNDATION.md`, `docs/EXERCISE_LOAD_BEHAVIOR.md`, `docs/EXERCISE_INTELLIGENCE_FOUNDATION.md`, and `docs/COACH_SWOLECAT_EVIDENCE.md`.

Primary review:
- ACSM 2026 resistance training position stand, DOI `10.1249/MSS.0000000000003897`, and March 2026 ACSM summary: adherence, individualization and training goal matter; complex techniques are not always better.
- Kassiano et al. 2022 systematic review, PMID `35438660`: deliberate variation may help regional adaptation; excessive/random exercise changes can be counterproductive.
- Existing evidence reference library contains further specific studies of exercise order, load/reps, RIR, deloads and regional variation. Include the relevant study and limitations in any eventual changed recommendation.

Never assert exact universal best volume/reps, that increasing weight every session is mandatory, that soreness proves growth, or that a dip diagnoses recovery. Expert coaching heuristics and product scoring weights must be labeled as such.

## 9. Baseline evaluation plan (v0.89.0)

First create a reproducible benchmark that captures **v0.88 outputs before runtime changes**. Add deterministic fixtures and a *golden prompt* matrix spanning:

| Scenario | Required behavior |
|---|---|
| "30-minute legs" with unknown equipment | Coherent practical plan, short enough with rests/transitions, reasonable substitutions; no claim all equipment exists |
| "Beginner 30-minute full body with dumbbells only" | Limited exercise count, equipment hard limit, approachable movement complexity |
| "Advanced 60-minute technical shoulders + arms, side delts and triceps priority" | Meaningful specialization and priority coverage, not random power/Olympic moves |
| "Experienced minimalist heavy strength session" | Progression continuity and strength specificity, not forced novelty |
| "Quad focus; limit spinal loading" | Constrained compatible options; avoid heavy hinge/lumbar-demand stacking |
| "No cables; skip Bulgarian split squats" | Explicit exclusions preserved through refine, swap and program generation |
| "Please keep my squat progression, change accessories" | Main lift preserved with compatible settings, accessories can rotate |
| "Last week was bad; am I overtrained?" | Descriptive performance only, avoid medical/recovery diagnosis |
| "Do 3 x 20 bench" | Preserve explicit rep target despite non-default range |
| "I have no history, what weight should I use?" | No invented weight; initial logging and conservative user choice |
| Assisted pull-up, bodyweight hold, unilateral carry | Correct load direction, measurement unit and progress comparability |
| Account A → B → A | Absolutely no leakage of histories, preferences, suggestions or cached context across owners |

Tests must additionally cover conflicting constraints, slang/voice errors, novice vs advanced profiles, equipment gaps, goal selection, partial/skipped sessions, deload windows, duplicate tip suppression, long-term plateau/rebound and 12-week longitudinal personas. Check *outputs and explanations*, not only that the builder returned a nonempty plan.

A comparison suite should record coverage and priority satisfaction, exercise redundancy, feasibility and duration overrun, preference violations, inappropriate complexity, progression continuity, unsafe claims and changes vs v0.88. Report errors without disguising a heuristic as objective scientific truth.

Do not promise one universal score ("92% smart"). Present category metrics plus human review of sample plans. Owner reviews real Android examples before accepting changed behavior.

## 10. Incremental implementation order

**A. v0.89.0: audit and contracts.** This document, current-behavior snapshots, benchmarks and design decisions. No runtime changes, package bump, APK or cloud mutations required.

**B. Shared Brain context and facts.** Introduce isolated read-only service/module with stable input/output schemas, account-safe ephemeral caches, measurement semantics, uncertainty/provenance and test fixtures. Existing Coach functions remain as adapters until behavior parity is proven.

**C. Request intelligence and exercise planning.** Distinguish sophisticated programming from skilled movement selection. Add structured exercise variant metadata, practical equipment handling, complete-session time feasibility, candidate combination scoring and a stronger independent auditor. Implement behind Testing-only change gates and user approval.

**D. Unified progression/history/program advice.** Make `04b3`, `04g`, `04h` and existing workout/progress surfaces consume the same qualified facts rather than each independently interpreting trends. Keep current user modes and saved settings unchanged; require review for any behavioral divergence.

**E. Gentle proactive tips and explanations.** Bounded triggers, notification budget, explanations, opt-out, no silent history mutation; verify no workout UX slowdown.

**F. Optional Gemini adapter (future, explicitly deferred).** Structured language understanding or freeform wording through secured, metered backend. Deterministic Brain validates any parsed intent and independently approves all recommendations. Offline functionality never depends on AI. API keys never ship in APK. Decide privacy, cost and feature entitlement separately.

Work in small PRs, run the full regression wall and coach stress suites, keep versioned research and rationale logs, validate on actual Android before promoting any recommendation change.

## 11. Non-negotiable protections

- **Testing only** until an explicit promotion decision; the Beta branch remains v0.73.1.
- No automatic edits/deletes of Supabase records, cloud accounts, local histories, saved routines or progression baselines.
- Preserve v0.88 per-owner account isolation. Never cache a Brain context across a user switch without invalidating/recomputing it.
- Local-first, fast and usable offline. No hard dependency on Gemini, external APIs, subscriptions or telemetry.
- Protect Track Only, Guided Overload, Strength Focus, explicit workout prescriptions, assistance direction, bodyweight measurements and existing custom goals.
- The user can understand, change and override suggestions. Uncertainty must be reported where data is incomplete.
- No medical diagnosis or compulsory deload/recovery decisions.
