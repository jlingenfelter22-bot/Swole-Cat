# Coach Swolecat Evidence Rules

Version: v0.53.0

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


## v0.52 multi-day program rules

Coach can generate 2–6 day weekly Programs. Frequency is primarily a user constraint. The engine does not claim that one split or frequency is universally optimal.

Current default split mapping when the user does not explicitly choose one:
- 2 days: full body / full body
- 3 days: full body / full body / full body
- 4 days: upper / lower / upper / lower
- 5 days: upper / lower / push / pull / legs
- 6 days: push / pull / legs repeated twice

If the user explicitly asks for Full Body, Upper/Lower, or Push/Pull/Legs, that preference overrides the default structure. For frequencies that do not map perfectly onto a named split, Coach adds a balancing session rather than pretending the split fits perfectly.

The rationale for these defaults is pragmatic:
- ACSM's 2026 resistance-training position stand emphasizes consistency, goal-specific loading, and approximately 10 weekly sets per muscle group as a useful hypertrophy volume reference.
- NSCA program-design guidance treats frequency as dependent on training status, session volume/intensity, muscle groups trained, schedule, and recovery opportunity.
- NSCA materials describe nonconsecutive full-body training as a common 2–3 day structure and split routines such as upper/lower or push/pull structures as practical ways to distribute higher weekly training frequency.
- Frequency itself is not treated as a magic hypertrophy variable. Weekly volume, exercise selection, effort, and adherence remain important.

### Weekly distribution behavior

For every generated day:
1. The day's target regions come from the chosen split.
2. User-requested focus muscles receive additional ranking weight only on days where those muscles are relevant.
3. The normal preference system still applies.
4. The same exact exercise receives a light cross-program repetition penalty when comparable alternatives exist.
5. Strength-oriented plans use a smaller repetition penalty because exercise specificity and repeated practice may be desirable.
6. Manual Remove/Swap actions are stored as day-level exclusions so later regeneration does not silently restore rejected exercises.

### Weekly set-equivalent preview

The program preview reports approximate weekly set-equivalents using the same transparent convention as Swole Cat's muscle coverage tools:
- primary involvement = 1.0 set-equivalent
- secondary involvement = 0.5 set-equivalent

This is a programming visualization. It is not a physiological dose measurement, recovery score, or guarantee that a user has reached an optimal volume.

### Scheduling

Named weekdays are stored in the Program's existing preferred-days field. If a user changes frequency without supplying a matching number of weekdays, Coach clears the incompatible weekday assignment rather than inventing extra training days.

### Data architecture

Each generated workout is persisted as a normal Swole Cat Routine. Those routine IDs are then referenced by a normal Swole Cat Program. No Coach-only Program schema is introduced.


## v0.53 voice dictation

Voice input is an input convenience layer only. It does not change Coach's deterministic programming rules.

- Packaged Android builds use native speech recognition through the Capacitor community speech-recognition plugin.
- The app requests microphone/speech permission when needed.
- Browser/PWA builds use the Web Speech API when the browser exposes SpeechRecognition or webkitSpeechRecognition.
- The transcript is inserted into the visible Coach field first so the user can verify or edit it before building.
- Text entry always remains available when speech recognition is unsupported or denied.
- Speech availability and whether recognition runs fully on-device depend on the operating system/browser speech service. Core Coach workout generation remains local after text has been produced.

The first implementation intentionally uses final-result, one-shot dictation rather than a permanently open streaming microphone. This keeps the interaction simple and avoids treating partial recognition output as finalized workout instructions.

## v0.53 explicit workout prescriptions

Coach can distinguish an exact workout prescription from a general workout-generation request.

Supported forms include examples such as:
- "3 sets bench press for 8"
- "three sets of pull ups for nine"
- "2 sets barbell curls for 12"
- "3 x 8 squats"
- "3 sets bench, 3 sets pull ups, targeting 9 reps for each one"

For an explicit prescription:
1. Exercise order follows the user's request.
2. Requested set counts are preserved.
3. Per-exercise rep targets are preserved.
4. A global "reps each" target fills only exercises that did not already specify reps.
5. Common gym-language aliases map to canonical Swole Cat library exercises.
6. Starting the workout uses those exact sets and reps rather than replacing them with the normal Coach preset.
7. Saving the workout creates a normal Swole Cat Routine, so all normal history and progression infrastructure still applies.
8. Coach still does not invent the user's working weight.

If Coach cannot confidently resolve an exercise phrase, it should not silently substitute an unrelated movement.
