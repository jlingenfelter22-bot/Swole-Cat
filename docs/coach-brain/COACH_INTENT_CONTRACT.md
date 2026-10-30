# Coach Swole Cat: Owner-Approved Intent and Coaching Contract

**Approved direction:** October 13, 2026. **Scope:** product-behavior principles, acceptance criteria and proposed engineering priorities. This file is **not** itself a claim that all principles are implemented. Current active development: draft PR #66 for guided program intake; signed Testing is v0.89.0; Beta remains unchanged.

## North star

**Understand the goal. Identify what is known. Ask only what matters. Generate a feasible plan. Explain the tradeoffs. Learn from real feedback. Never silently override the person.**

The goal is a thoughtful coach who understands what a lifter intends, not an impressive-sounding prompt parser that invents missing details.

## Non-negotiable behavior

1. **Identify the actual job.** Distinguish a one-off workout, a multi-day/multi-week program, a saved-plan edit, a question about training history, and a request for coaching advice. A word such as "split" indicates a program and does not imply full-body.
2. **Extract facts, preferences and unknowns separately.** Explicitly stated details are constraints; past exercise history is context, not permission to assume the current person's equipment, availability, or goals. "Shoulder emphasis" is not "shoulders only." "Three days" is frequency, not exercise distribution.
3. **Detect high-impact ambiguity before committing.** Ask when alternative interpretations materially change exercise coverage, equipment eligibility, day structure, duration or progression behavior. "Three-day split" requires split clarification; "three-day full body" does not. Avoid guessing silently.
4. **Use progressive disclosure, not an interrogation.** Ask the most consequential missing question first. A user can answer multiple questions in free text/voice, skip optional preferences, or request a recommendation. Don't ask again for already supplied details. Explain a recommended default and obtain consent before adopting it if the choice changes the workout significantly.
5. **Build both the session and the week.** Check push, pull, knee, hinge, muscular emphasis, repeated demands and suitable distribution across days. Don't silently rewrite a custom split. Explain missing coverage and offer changes, then honor the user's decision.
6. **Negotiate incompatible constraints.** Equipment missing for genuine pulling, too many movements for the time budget, conflicting schedule vs frequency, restrictive exercise exclusions: explain the exact issue and suggest the smallest useful compromise. Do not fabricate equipment, feasible duration or exercise coverage.
7. **Respect the user's exact instructions.** Explicit sets/reps, exercise selection, exclusions, mode, preferred days and earlier choices survive later refinements unless explicitly changed. Treat a multi-clause request atomically where possible; show what's changed. Make generated estimates honest about uncertainty rather than guarantees.
8. **Work with training data responsibly.** Use history to support exercise continuity and explain progression, not to diagnose fatigue, pain or readiness or to invent starting loads. Never manipulate completed history or other accounts from coaching suggestions. Only retain personal preferences with clear consent and account isolation.
9. **Put the person in control.** Preview the interpreted plan and its assumptions; allow precise review, replace/remove, mode/deload edits and explicit Save or Start. Deload is optional, chosen by user, and reviewed before activation.
10. **Get smarter through evidence.** Favor useful logged-session feedback (time estimates, substitutions, completion) over fabricated personal inferences. Calibration and richer conversational understanding are proposed follow-ups, not implemented promises.

## Practical examples and expected outcomes

| Input | Expected behavior |
| --- | --- |
| "Build me a three-day split" | Ask which split, or offer to recommend one; do not generate three Full Body days without consent. |
| "3-day full body, M/W/F, 45 minutes, at a full gym" | Respect full-body and supplied days/duration/equipment; ask only remaining high-impact details. |
| "I want bigger shoulders and arms, three days, 45 minutes" | Preserve shoulder/arm **priority**, clarify weekly split; highlight limited chest/legs/back coverage instead of treating them as forbidden. |
| "45 minutes Mon, 30 Wed, 75 Sat" | Recognize per-day duration as an important need; if unsupported, explain honestly and flag for subsequent engineering rather than flatten to an arbitrary global duration. |
| "Upper body, 15 minutes, floor-only, mainly back" | State what can and cannot be trained with available equipment; offer an option or request a legitimate pulling setup. |
| "Swap Bulgarian split squats; they take me too long" | Revise the current plan and time estimate, preserve the rest of the user's program, request consent before retaining future preferences. |
| "Keep 5 × 5 deadlift, make it 15 minutes" | Never silently remove prescribed sets or reps to fake time fidelity; explain the scheduling tension. |
| "Actually Friday is shorter, and no barbells" | Apply both changes to applicable days and explain consequences without losing unrelated split/goal settings. |

## Engineering priorities following v0.90 program intake

**P1: Intent/ambiguity confidence and adaptive clarification.** Separate missing information from constraints and user-approved recommendations, including freeform correction and no redundant follow-ups.

**P2: Whole-program quality audit.** Explain coverage, redundant weekly demands, prioritization and potential omissions after user-chosen custom split, without silent substitution.

**P3: Constraint negotiation and per-day flexibility.** Schedule/time/equipment can vary by day. Model actual time ranges and conflicting limits.

**P4: Feedback loop and careful personalization.** Use real observed session duration, substitutions and user feedback. Consent, privacy and no extrapolated medical judgments.

**Later possibility:** Optional richer language understanding can be used to interpret phrasing, while the offline deterministic rules remain the authority for safety, feasibility, workout prescriptions, user overrides and mutations. No subscription or always-online requirement is authorized.

## Engineering acceptance gates

- Test vague, explicit, compound, contradictory, correction, follow-up and out-of-coverage prompts.
- Assert interpreted constraints, selected day slots, mode/deload, duration and saved records match preview. No guessing when high-impact unknowns remain.
- Assert no mutation of saved routines, sessions, cloud identities or other accounts merely by asking or previewing.
- Audit actual generated day-by-day exercises for balanced coverage relative to the user's priorities, not just compilation or unit tests.
- Human review on a physical narrow Android screen; measure some real session durations before claiming actual scheduling accuracy.
- Maintain separate signed Testing and Beta branches. Beta publication needs separate explicit owner authorization.

## Source of authority

Product direction explicitly approved in conversation on October 13, 2026. Training-science boundaries remain defined in `docs/TRAINING_SCIENCE_FOUNDATION.md`, `docs/EXERCISE_LOAD_BEHAVIOR.md`, `docs/EXERCISE_INTELLIGENCE_FOUNDATION.md`, and `docs/COACH_SWOLECAT_EVIDENCE.md`. UX priorities are hypotheses requiring tests; do not present them as validated physiological science.
