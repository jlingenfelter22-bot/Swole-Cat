# Coach Swolecat Evidence Rules

Version: v0.55.0

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


## v0.53.1 explicit-list routing correction

The presence of clearly resolved named exercises changes Coach's routing behavior.

- Two or more recognized exercise names are sufficient to classify the request as an explicit workout list, even when no set or rep counts are supplied.
- One recognized exercise plus explicit set/rep language or clear list/request language is also treated as explicit.
- Explicit workout lists skip target-muscle and session-duration follow-up questions.
- Missing set/repetition values use the current goal preset as defaults. Those defaults fill missing information only; they do not replace exercises the user named.
- Explicitly named exercise order is preserved.
- Coach must not substitute unrelated exercises simply because the request omitted muscle-group labels.
- Flexible forms such as “3 sets of bench press,” “bench press for 3 sets,” “3 × 8 bench press,” and plain exercise lists are accepted where the exercise names can be confidently resolved.

The microphone control is rendered inside the input field rather than beside it so the voice interaction is visible as part of the Coach composer.


## v0.53.2 explicit-draft refinement rule

An explicit user-authored workout remains user-authored throughout refinement.

- Refine requests on an explicit draft do not invoke the normal exercise-selection generator.
- "Add" appends only the requested resolved exercise.
- "A set" / "one set" resolves to exactly one set.
- Set/rep changes mutate only the named existing exercise.
- Remove/drop/skip deletes only the named existing exercise.
- Original exercise order and all unrelated per-exercise prescriptions are preserved.
- Target-muscle metadata is recalculated from the resulting explicit list for reporting only; it is not used to regenerate or fill the list.

Regression coverage includes the exact natural-language request: "can you also add a set of assisted pull-ups?" and asserts that no unrelated exercises are introduced.


## v0.54 Coach language brain

Coach now uses one shared exercise-language layer across initial workout creation, explicit-list parsing, refinement, voice transcript scoring, and locally learned aliases.

The language layer includes:
- canonical exercise names from the full Swole Cat catalog
- a broad curated gym-slang alias map
- common abbreviations such as DB, BB, RDL, OHP and CGBP
- normalization for common speech-recognition errors such as “Romanian dead left,” “preacher coral,” “Bulgarian split squad,” and “lat pull town”
- compact edit-distance and token-similarity scoring
- confidence tiers and score-gap checks to prevent a generic phrase from being treated as certain when several variants are plausible

High-confidence exact or repaired language may resolve automatically. Medium-confidence crowded matches are treated as ambiguous. The product rule is: do not silently substitute an unrelated exercise just to keep the conversation moving.

Examples:
- “Bulgarians” → Bulgarian Split Squat
- “RDLs” → Romanian Deadlift
- “rope pushdowns” → Rope Triceps Pushdown
- “Romanian dead left” → Romanian Deadlift
- “preacher coral” → Preacher Curl
- “shoulder press” → clarification when several shoulder-press variants remain plausible

## v0.54 speech-alternative scoring

The native speech-recognition layer requests several final alternatives. Coach scores those alternatives using:
- recognized exercise mentions
- ambiguity count
- workout command language
- sets/reps and structured lifting syntax
- target/equipment terms
- the amount of gym-language repair required

When two transcripts normalize to the same likely workout, the cleaner transcript is preferred.

This ranking improves transcription selection only. Workout programming remains deterministic after the text is selected.

## v0.54 locally learned vocabulary

A user may teach Coach a personal alias with natural wording such as:
“When I say spider boys I mean spider dumbbell curl.”

Learned aliases:
- map only to exercises that already exist in the current catalog
- are stored in local Swole Cat settings
- participate in the same confidence engine as built-in slang
- never change the underlying exercise definition

## v0.54 Coach Insights foundation

The first Coach Insight is descriptive training-history awareness on Home.

Current conservative trigger:
- at least three logged workouts exist in the recent two-week window
- one major group (lower body, push, or pull) has no logged work in that window
- other major training work did occur
- the absent group was last logged roughly 14+ days ago, or the user's available history spans that long without the group

The insight may say that a training area “hasn’t shown up lately” and report the logged pattern. It may offer a one-tap Coach build for that area.

Guardrails:
- no insight during an active workout
- no neglect insight while an active structured Program is controlling the user's upcoming training
- no claim that a muscle is recovered, under-recovered, overtrained, injured, or physiologically ready
- no statement that the user must train the absent area
- the underlying observation comes only from logged Swole Cat history


## v0.55 workout-programming intelligence

Generic Coach workout generation now uses a two-stage programming process.

First, Coach creates a semantic coverage plan from what the user actually requested. Examples:
- Chest reserves a chest-press role and may add incline/fly roles when session length allows.
- Back reserves horizontal pulling and may add vertical pulling, lat isolation and rear-delt/upper-back work.
- Arms reserves a true direct biceps isolation and a true direct triceps isolation.
- Push, Pull, Legs, Upper Body, Lower Body and Full Body have their own coverage roles.

Only after core coverage roles are filled does the normal candidate ranker use the remaining session slots.

The generic ranker now also uses:
- normalized target keys, including singular "arm" -> Arms
- separate primary-muscle coverage instead of allowing secondary involvement to masquerade as direct work
- semantic movement families such as row, vertical pull, lat isolation, flat press, incline press, chest fly, biceps curl and triceps extension
- family caps that are stricter for multi-target workouts
- practical staple bias for generic workout generation
- penalties for unusually specialized variants when the user did not request them
- session-breadth-aware exercise-count caps so a single-muscle 60-minute session does not require eight near-duplicates
- upper-body back-day filters that prevent hypertrophy sessions from padding themselves with hinge/Olympic-pull variants when conventional back work is available

The Swap action first searches within the same movement family, then the same primary target role, before considering a broader replacement.

Regression fixture based on direct user feedback:
"I need a good 60 minute chest, arm, and back workout."

The test requires:
- Chest primary work
- Back primary work
- direct Biceps isolation
- direct Triceps isolation
- no stacked row variants
- no stacked cable/dumbbell pullover family
- distinct movement families where alternatives exist

A representative deterministic fixture currently produces:
Barbell Bench Press / Barbell Row / Incline Barbell Bench Press / Assisted Pull-Up / Cable Fly / Cable Pullover / Barbell Curl / Overhead Triceps Extension.

A focused hypertrophy Back fixture currently produces:
Barbell Row / Assisted Pull-Up / Chest Supported Row / Chin-Up / Cable Pullover / Face Pull.

Exact choices can change with user Prefer/Avoid/Favorite settings, equipment restrictions and training history; the coverage and redundancy rules are the invariant.

## v0.55 lifting-grammar foundation

Coach now parses and persists the first execution-level training instructions that map cleanly to the current workout data model.

Supported workout-level examples:
- "warm me up first"
- "include warm-up sets"
- "2 minutes rest"
- "rest 90 seconds"
- "2 RIR"
- "leave 3 reps in the tank"
- "RPE 8"
- "last set AMRAP"

Behavior:
- warm-up-first automatically adds a ramp to the first compound movement when a known working load exists; when load history is absent, blank editable warm-up rows are created rather than inventing a weight
- explicit rest time overrides the Coach preset
- RPE is translated into the equivalent RIR target for display (for example RPE 8 -> 2 RIR)
- target RIR remains guidance; actual logged RIR stays user-entered
- last-set-AMRAP marks the final working set without converting it to a non-progression set
- these settings persist when a Coach workout is saved as a normal Routine and later started

Not yet claimed:
- top-set/backoff load progression
- per-exercise RPE/RIR grammar
- automatic superset parsing from free text
- failure-set programming that interacts with progression

Those require dedicated set-structure/progression rules and should not be simulated by labels alone.
