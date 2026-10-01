# Coach Swolecat Evidence Rules

Version: v0.51.0

Coach Swolecat's first workout builder is deterministic and local. Natural-language parsing identifies user intent, but exercise/programming decisions come from explicit rules rather than freeform AI generation.

## Current evidence anchors

- ACSM 2026 resistance-training position stand / summary:
  https://www.acsm.org/wp-content/uploads/2026/03/Resistance-Training-Position-Stand-infographic.pdf
  https://acsm.org/science-spotlight-acsm-releases-new-position-stand-on-resistance-training/
- NSCA Essentials of Strength Training and Conditioning, 5th Edition program-design framework:
  https://www.nsca.com/certification/cscs/essentials-of-strength-training-and-conditioning-5th-edition/
- NSCA program-design material:
  https://www.nsca.com/certification/tsac-f/essentials-of-tactical-strength-training-and-conditioning-2nd-edition/excerpts/program-design-and-sample-training-approaches/

## Programming presets

These are implementation defaults, not claims that a single rep range is uniquely optimal.

### Muscle growth
- 3 working sets per selected exercise
- 8–12 rep target
- 90-second default rest
- Guided Overload mode
- Exercise count scaled to requested session duration

ACSM's 2026 summary emphasizes higher weekly volume (approximately 10 sets per muscle group) for hypertrophy. A single Quick Build session does not claim to satisfy a person's complete weekly volume target by itself.

### Strength
- 3 working sets per selected exercise
- 4–6 rep target
- 180-second default rest
- Strength Focus progression mode
- Compound movement patterns receive additional ranking weight

ACSM's 2026 summary emphasizes heavier loading for strength, and NSCA program-design guidance treats load/repetitions and rest intervals as goal-dependent variables. Swolecat does not invent a user's weight; load comes from the user's own history/progression flow or manual entry.

### General training
- 3 working sets
- 6–10 reps
- 120-second default rest
- Guided Overload mode

## Exercise ranking

Candidates are selected from Swolecat's audited exercise library using:
1. requested target muscles
2. primary versus secondary muscle involvement
3. explicit equipment restrictions
4. Hide / Avoid / Prefer / Favorite settings
5. movement-pattern diversity
6. prior exercise familiarity as a small tie-breaker
7. a small recent-exercise variety penalty when the same exercise was logged within the last week
8. compound-movement preference when Strength is requested
9. explicit user-requested exercises, which are pinned ahead of Coach ranking when they satisfy hard equipment/visibility constraints

Hidden exercises are excluded. Avoided exercises are strongly penalized but remain available if the request/equipment leaves no better option. Recent history is not converted into a fatigue, recovery, or readiness score. It is used only as lightweight context and to reduce accidental repetition when multiple similarly ranked exercises are available.

## User control

Generated workouts are previews. Users can swap or remove exercises before starting or saving. Start Workout Now creates a temporary active workout without silently adding a routine. Save as Routine is explicit.


## v0.51 conversational refinement

The conversational layer changes constraints on the same deterministic workout draft. It does not replace the programming engine with freeform model output.

Supported local refinements include:
- session duration
- muscle-growth, strength, or general-training goal
- allowed or excluded equipment
- added muscle emphasis
- target-muscle changes
- named exercise removal
- named exercise inclusion
- direct program handoff

When a user explicitly requests a compatible named exercise, that instruction outranks Coach's normal target/ranking preference. Hard exclusions still win, including Hidden exercises and explicit equipment constraints.

Manual Remove and Swap actions become persistent constraints on the current draft so a later refinement does not silently restore an exercise the user already rejected.

Recent muscle logs may be shown as historical context such as "Chest 1 day ago." This is descriptive training history only and must not be presented as a claim that a muscle is recovered, fatigued, injured, or ready to train.

## Program handoff

A generated workout remains a standard Swole Cat routine data structure. Adding it to a Program first persists that routine, then references its routine ID from the Program. No separate Coach-only program format is introduced.
