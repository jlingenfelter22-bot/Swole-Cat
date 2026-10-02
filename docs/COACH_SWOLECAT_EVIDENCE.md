# Coach Swolecat Evidence Rules

Version: v0.62.0

Coach Swolecat's first workout builder is deterministic and local. Natural-language parsing identifies user intent, but exercise/programming decisions come from explicit rules rather than freeform AI generation.

## Current evidence anchors

- ACSM 2026 resistance-training position stand / summary:
  https://www.acsm.org/wp-content/uploads/2026/03/Resistance-Training-Position-Stand-infographic.pdf
  https://acsm.org/science-spotlight-acsm-releases-new-position-stand-on-resistance-training/
- NSCA Essentials of Strength Training and Conditioning, 5th Edition program-design framework:
  https://www.nsca.com/certification/cscs/essentials-of-strength-training-and-conditioning-5th-edition/
- NSCA program-design material:
  https://www.nsca.com/certification/tsac-f/essentials-of-tactical-strength-training-and-conditioning-2nd-edition/excerpts/program-design-and-sample-training-approaches/

- ACSM 2026 position stand (PubMed record):
  https://pubmed.ncbi.nlm.nih.gov/41843416/
- Systematic review on deliberate versus redundant exercise variation:
  https://pubmed.ncbi.nlm.nih.gov/35438660/
- Systematic review/meta-analysis on exercise order:
  https://pubmed.ncbi.nlm.nih.gov/32077380/
- Systematic review of deadlift-variant muscle activity:
  https://pubmed.ncbi.nlm.nih.gov/32107499/
- Review of lumbar-extensor exercise specificity:
  https://pubmed.ncbi.nlm.nih.gov/24092889/

- Regional biceps hypertrophy from preacher versus incline curls:
  https://pubmed.ncbi.nlm.nih.gov/39809454/
- Triceps hypertrophy with overhead versus neutral-arm elbow extension:
  https://pubmed.ncbi.nlm.nih.gov/35819335/
- Cable versus dumbbell lateral-raise hypertrophy:
  https://pubmed.ncbi.nlm.nih.gov/40692697/
- Deltoid-region activation across common shoulder exercises:
  https://pubmed.ncbi.nlm.nih.gov/33312291/
- Systematic review/meta-analysis of muscle length and regional hypertrophy:
  https://pubmed.ncbi.nlm.nih.gov/40570881/

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


## v0.57 evidence-backed regional programming

Coach now keeps broad exercise-science principles in a dedicated `src/data/coach-knowledge.js` knowledge layer instead of burying every programming assumption inside the selector. The knowledge layer records evidence sources and stable high-level principles that can be audited or revised independently as the literature changes.

The implementation intentionally uses the phrase **evidence-backed**, not “scientifically proven exercise,” because the literature supports programming principles more strongly than it supports one universally best movement.

### Back-region model

“Back” is no longer treated as only lats + upper back.

A generic **Back** request now represents:
- lats
- upper/mid-back pulling musculature
- lumbar/spinal erectors
- trapezius

Coach also understands these as first-class targets:
- Upper Back / mid back
- Lower Back
- lumbar extensors
- spinal erectors / erector spinae
- Lats
- Traps / trapezius

A full hypertrophy-oriented Back session reserves distinct roles for:
1. horizontal pulling / upper-back work
2. vertical pulling / lat work
3. direct lumbar/spinal-erector work
4. additional lat isolation when session length allows
5. trapezius-focused work when session length allows
6. rear-delt/scapular accessory work when session length allows

This role system prevents one row variation from masquerading as complete back development while still retaining movement-family caps so several nearly identical rows or pullovers do not crowd the session.

### Lower-back versus posterior-chain logic

Coach distinguishes **direct lumbar extension** from **hip-hinge posterior-chain work**.

For hypertrophy/general lower-back requests:
- a direct back-extension pattern is preferred when compatible equipment exists
- one complementary posterior-chain hinge may be added
- Romanian deadlifts are treated primarily as hamstring/glute hip hinges with meaningful erector involvement, not mislabeled as a pure lumbar-isolation exercise
- squats can involve the spinal extensors but are not used as the default direct lower-back slot

For strength-focused full-back requests:
- conventional Deadlift is the normal general strength anchor when equipment allows
- specialized Rack Pull, Block Pull, and Deficit Deadlift variants remain available but are de-prioritized unless the user explicitly requests them
- the high-priority strength hinge is ordered before accessory back work

Deadlift-variant EMG evidence is used only as anatomical/contextual support. EMG amplitude is not treated as a direct guarantee of hypertrophy or as proof that one lift is universally superior.

### Pull and Upper Body remain distinct

A Push/Pull/Legs **Pull** workout remains an upper pulling session by default. It does not automatically receive lumbar-loading work merely because a generic Back workout now includes the spinal erectors.

Likewise, an **Upper Body** session uses upper-back/lat coverage rather than forcing a deadlift or back-extension slot into every upper-body day.

This distinction keeps weekly programming practical and prevents unnecessary posterior-chain fatigue from being introduced by a semantic expansion.

### Evidence rules retained

The 2026 ACSM position stand remains the primary general prescription anchor:
- progressive resistance training improves strength, hypertrophy, and physical performance
- heavier loading (approximately >=80% 1RM) supports maximal-strength development
- approximately 2–3 sets per exercise is a supported strength prescription
- higher weekly set volume (approximately >=10 sets per muscle group) supports hypertrophy
- advanced techniques and training to momentary failure are not mandatory for results

Systematic-review evidence on exercise variation supports deliberate anatomical/biomechanical variation while cautioning against redundant or random exercise rotation. Coach therefore uses different movement roles to broaden coverage but continues to suppress duplicate movement families.

Exercise-order evidence is applied as a priority rule: the movement most important to the requested strength goal should appear early. Hypertrophy does not require compounds to precede isolations for growth, so ordering remains practical rather than dogmatic.

### Safety / scope

These rules program resistance training for healthy adults. They do not diagnose or treat low-back pain, determine injury status, or infer that a user is medically ready for loaded lumbar exercise. User exclusions, equipment constraints, and explicit exercise choices continue to override Coach ranking where appropriate.


## v0.58 target priority, complete regional roles, and stress validation

Coach now distinguishes **minimum requested coverage** from **emphasis allocation**.

A mixed request such as:
- “shoulders and arms, more shoulders”
- “chest and back, chest emphasis”
- “legs, mostly quads”
- “pull day, prioritize lats”

first reserves the minimum programming roles needed to keep every explicitly requested area represented. Remaining discretionary exercise slots are then preferentially allocated to the emphasized target. This prevents an emphasis from erasing secondary requested areas while also preventing a 50/50 workout when the user clearly asked for one area to dominate.

Priority language is recognized during the initial request and during later refinement. Supported forms include language such as:
- more shoulders
- focus more on shoulders
- shoulder-focused
- shoulder emphasis
- mostly arms
- prioritize lats
- biased toward chest
- delt dominant

Common gym vocabulary is also normalized at the target level, including examples such as pecs, delts, bis, tris, hams, spinal erectors, and posterior chain.

### Complete shoulder role model

A generic Shoulders request reserves three distinct roles:
1. anterior-delt / pressing work
2. direct lateral-delt abduction
3. posterior-delt / rear-delt work

The engine does not allow pressing alone to stand in for a complete shoulder session.

This is an anatomical programming rule rather than a claim that one exercise is universally best. Shoulder-press and lateral-raise research is used as contextual support for distinct deltoid-region demands. EMG findings are not treated as direct proof of long-term hypertrophy.

### Complete arm role model

A generic full Arms request now guarantees direct biceps and direct triceps work, then uses complementary joint/arm positions when session duration permits.

For a full arm session, Coach can reserve:
- a conventional/supinated elbow-flexion role
- a neutral-grip elbow-flexion role
- a non-overhead triceps-extension role
- an overhead triceps-extension role
- direct forearm flexor/extensor work when session length permits

The neutral-grip role is used to diversify elbow-flexor loading rather than to claim a uniquely superior “brachialis exercise.”

The overhead-triceps rule has direct hypertrophy evidence showing greater triceps growth in the overhead condition than a neutral-arm cable-extension condition in the cited trial. Coach still treats this as one useful evidence-supported programming option rather than a universal mandate for every user and every session.

Biceps exercise selection uses systematic variation rather than a claim of one best curl. Regional hypertrophy research comparing preacher and incline curls supports the idea that different curl positions can produce different regional adaptations. This is used to justify complementary roles, not random exercise rotation.

Forearms are now a first-class target and are included as part of the broader Arms region model.

### Complete leg role model

A generic Legs request now reserves:
1. knee-dominant quad work
2. hip-hinge / posterior-chain work
3. knee-flexion hamstring work
4. calf work

Glute- and adductor-focused work are added as session length allows.

This prevents one squat plus one hinge from being treated as complete lower-body programming.

Posterior Chain is also a first-class target and reserves hip-hinge, knee-flexion hamstring, and direct spinal-erector roles with glute emphasis when time allows.

### Broad mixed-session redundancy control

For multi-target workouts without a specific emphasis, discretionary slots prefer a **new movement family** when an appropriate alternative exists. This keeps broad sessions from using scarce exercise slots on a second curl, second triceps extension, or redundant row while another requested role remains available.

When the user explicitly emphasizes Arms, Biceps, or Triceps, the family cap permits a second complementary direct movement so the priority can be expressed intentionally.

### Automated prompt stress matrix

The production bundle is now tested through a permanent Coach prompt-stress harness in CI.

The current matrix executes 306 cases spanning:
- beginner conversational requests
- knowledgeable lifter shorthand
- 30 / 45 / 60 minute sessions
- hypertrophy, strength, and general training
- individual muscle groups
- broad regions
- Push / Pull / Legs
- Upper / Lower / Full Body
- Posterior Chain
- equipment-only and equipment-exclusion constraints
- mixed muscle groups
- explicit target emphasis
- vague prompts that should remain unresolved rather than inventing a target

For generated workouts the harness verifies:
- no duplicate exercise IDs
- equipment restrictions are respected
- selected exercises remain on-target
- required semantic coverage roles are present when compatible exercises exist
- movement-family caps are respected
- priority requests allocate discretionary work toward the emphasized target

Targeted assertions separately verify full Arms, complete Shoulders, complete Legs, shoulder-biased Shoulders + Arms, arm-biased Shoulders + Arms, and chest-emphasized Chest + Back behavior.

The stress matrix runs against the same bundled production application that GitHub Pages and Capacitor consume.


## v0.59 Swole Cat Intelligence: training-context programming

v0.59 moves Coach beyond isolated workout construction and adds a local training-context layer that reasons about the user's logged training before ranking exercises.

### Weekly muscle context

Coach builds a rolling current-7-day muscle ledger from completed working sets. Primary muscle work contributes one set-equivalent per completed working set and secondary muscle work contributes a fractional 0.5 set-equivalent. This mirrors a useful analytical convention in recent dose-response research that distinguishes direct and indirect resistance-training sets; it is an application model, not a claim that every indirect set is physiologically identical to exactly half of a direct set.

Coach also computes a four-window prior baseline using completed preceding 7-day windows. The current week is deliberately excluded from this baseline so current training is never compared against itself.

The weekly ledger influences discretionary exercise ranking:
- underrepresented requested regions receive additional priority
- already-high weekly exposure can reduce the priority of extra redundant work
- a user's recent historical baseline can inform whether this week is unusually light or unusually dense

The approximate 10-set hypertrophy reference from the 2026 ACSM position stand remains a reference point rather than a hard optimum or maximum. Dose-response evidence supports increasing hypertrophy with increasing weekly set volume on average, while the exact useful dose remains individual and context dependent.

### Exercise continuity and progression context

Coach reads the user's own history for candidate exercises and compares recent estimated 1RM performance. A familiar exercise that is progressing can receive a modest continuity preference when it still fits the requested target and constraints.

This is intentionally a preference, not a rule that exercises must be kept forever. Exact recent repetition is penalized so continuity does not become automatic duplication.

Coach does not infer a user's strength from population norms and does not fabricate a starting weight. The existing workout/progression system and the user's own logged performance remain responsible for working-load behavior.

### Movement demand and recent overlap

Exercises now have an internal programming-demand profile that describes broad systemic demand, axial loading and technical demand. Recent high-demand sets and repeated demanding movement patterns can reduce the ranking of another similarly demanding exercise when lower-cost exercises can satisfy the same requested role.

Examples:
- recent heavy hinging can make another heavy hinge less attractive than a lower-cost direct lumbar movement
- supported/machine rows can carry a lower axial/systemic cost than unsupported free-weight rows
- high-demand stacking can produce an internal audit warning

This is **not** a recovery, soreness, fatigue, injury or readiness diagnosis. Completed logs are programming context only.

### Per-exercise prescriptions

Coach no longer needs every exercise in a generated workout to share one identical rep/rest/effort target.

Unless the user explicitly overrides these values, v0.59 can use different practical prescriptions by goal and exercise role:
- strength-oriented compound work uses lower repetition ranges and longer rest
- hypertrophy compounds use moderate repetition ranges with adequate rest
- smaller hypertrophy isolation work can use higher repetition ranges, shorter rest and closer-to-failure guidance
- general training remains more conservative

Explicit user language such as “90 seconds rest” or “2 RIR” always overrides automatic per-exercise defaults.

The 2026 ACSM position stand supports goal-specific loading and identifies heavier loading as advantageous for maximal strength. Failure is not treated as mandatory for strength or hypertrophy.

### Time-aware session compression

For short non-strength workouts, Coach can create compatible supersets instead of simply deleting useful movements.

Automatic pairing avoids:
- pairing two high-systemic-demand movements
- pairing identical movement families
- pairing exercises with the same primary target when this would create needless local competition

Antagonistic or relatively noncompeting pairings are preferred when available, such as chest/back or biceps/triceps.

Strength-focused short sessions do not receive automatic time-compression supersets because preserving performance and rest quality takes priority.

### Unilateral and bilateral training

Coach understands requests such as:
- unilateral
- each arm separately
- each leg separately
- both sides together
- individually and together

The evidence does not support claiming that unilateral training is inherently superior for hypertrophy. Recent systematic-review/meta-analysis evidence found no significant hypertrophy difference between unilateral and bilateral resistance training, while strength adaptations followed task specificity: bilateral training better improved bilateral strength and unilateral training better improved unilateral strength.

Therefore Coach:
- uses unilateral/bilateral work when the user explicitly requests it
- can intentionally mix both when requested
- does not automatically add one-arm or one-leg movements under the false premise that they produce more muscle growth

### Experience-aware complexity

Explicit beginner/novice language reduces unnecessary exercise count and favors repeatable, understandable programming. Intermediate and advanced language can preserve normal exercise breadth.

Coach does **not** infer that someone is a beginner merely because Swole Cat has little history for them; absence of app history is not evidence of training inexperience.

### Program-level context

When Coach builds a multi-day Program, earlier generated days contribute planned muscle set-equivalents and exercise usage to later days. This lets later sessions account for what the same generated week already contains instead of creating each day in isolation.

Generated Programs still remain editable, and weekly set-equivalent previews are descriptive planning estimates rather than measurements of biological stimulus.

### Internal workout intelligence audit

Before a generated workout is accepted, Coach runs an internal audit that checks:
- required semantic coverage roles
- equipment and user constraints
- movement-family redundancy caps
- projected weekly muscle set-equivalents
- recent-session context
- stacked high-demand movements
- short-session superset opportunities

A failed required-role/constraint audit prevents that draft from being accepted.

### v0.59 automated validation

The existing 306-prompt language/programming stress matrix remains active. v0.59 adds a second history-aware stress suite covering:
- current-week muscle ledgers
- prior-week baseline isolation
- direct/indirect set-equivalent handling
- underrepresented-muscle allocation
- progressing-exercise continuity
- recent demanding-pattern de-prioritization
- explicit beginner behavior
- mixed unilateral/bilateral requests
- short-workout supersets
- strength-session superset suppression
- per-exercise hypertrophy/strength prescriptions
- explicit rest/RIR overrides
- program-wide planned muscle context
- a 90-case history-aware target × goal × duration generation matrix

### Safety and interpretation

Coach uses history to program training, not to diagnose the person.

It must not state or imply from workout logs alone that:
- a muscle is recovered
- the user is ready for a particular load
- soreness or fatigue is absent
- an injury exists
- a medical condition explains performance changes

The user retains control over exercise exclusions, preferences, workout edits and working weights.


## v0.59.1 language resilience and prompt hardening

v0.59.1 audits Coach Swolecat's local language layer so normal human phrasing, gym slang, common misspellings, speech-recognition mistakes and advanced anatomical terminology are less likely to be misread.

The goal is **not** to claim that every possible sentence is understood. The invariant is:
1. confidently understood language should resolve to the intended supported meaning
2. ambiguous exercise language should trigger clarification
3. vague language should remain unresolved rather than inventing a target
4. typo repair must never confidently resolve to the wrong exercise

### Target vocabulary

The normalizer now covers broad and precise vocabulary ranging from casual gym language to anatomical terms.

Examples include:
- pecs / pectorals / pectoralis -> chest
- delts -> shoulders
- front/anterior delts -> front delts
- side/lateral/medial delts -> side delts
- rear/posterior delts -> rear delts
- bis / biceps brachii -> biceps
- tris / triceps brachii -> triceps
- hammies / biceps femoris / semitendinosus / semimembranosus -> hamstrings
- quadriceps / rectus femoris / vastus muscles -> quads
- rhomboids -> upper back
- latissimus / wings -> lats
- trapezius -> traps
- spinal erectors / erector spinae -> lower back
- rectus abdominis -> abs
- obliques / love handles -> obliques
- gastrocnemius / soleus -> calves
- brachioradialis -> forearms
- hip adductors / inner thighs -> adductors
- gluteus terminology / booty / butt -> glutes
- guns -> arms
- wheels -> legs

Precise deltoid, abs, oblique and adductor targets remain distinct when the exercise metadata can support that distinction. Generic terms such as “delts” and “core” remain broad.

### Speech, typo and number-word normalization

Common input repairs include phrases such as:
- dumbell / dumb bell -> dumbbell
- barbel -> barbell
- Romanian dead left -> Romanian deadlift
- dead left -> deadlift
- lat pull town -> lat pulldown
- preacher coral -> preacher curl
- Bulgarian split squad -> Bulgarian split squat
- buy ceps / bicepts -> biceps
- try ceps / tricepts -> triceps
- hyper trophy -> hypertrophy

Spoken number words now support compound values such as twenty five, forty five and ninety so duration, rest and effort grammar can understand phrases such as:
- “forty five minute chest workout”
- “ninety seconds between sets”
- “RPE eight”
- “leave two reps in the tank”
- “two reps shy of failure”

### Goal, emphasis and schedule disambiguation

Coach distinguishes similar phrases by context:
- “heavy push workout” -> strength intent
- “shoulder-heavy arms workout” -> shoulder emphasis, not an accidental Strength-mode switch
- “go heavy” -> strength intent

Program language also accepts natural frequency and schedule phrasing such as:
- three times a week
- twice a week
- 4x a week
- M/W/F
- Tue/Thu

### Negative intent

Muscle, equipment and exercise exclusions are parsed separately from positive requests.

Examples:
- “back and arms, no chest”
- “lower body but skip calves”
- “no free weights”
- “back workout, no barbell rows”
- “legs, don't include back squats”
- “back workout, avoid chest-supported rows”

Exercise-name wording is protected from false muscle exclusions. “Back squat” must not become “exclude Back,” and “chest-supported row” must not become “exclude Chest.”

A high-confidence negative exercise mention is removed before explicit-exercise routing and added to Coach's normal exercise constraints instead.

### Ambiguity and learned language

The existing fuzzy exercise resolver remains confidence-based:
- high-confidence matches may resolve directly
- crowded medium-confidence matches ask the user which exercise they meant
- low-confidence input is not silently guessed

Users can still teach local aliases such as “when I say spider boys I mean spider dumbbell curl.” Learned aliases stay local to Swole Cat state.

### Validation

The standard Coach programming matrix now covers **360 prompt cases**.

A dedicated language-resilience suite adds **432 checks**, including **291 one-edit typo mutations across the exercise catalog**. For each mutated exercise name:
- a high-confidence result must be the correct exercise
- otherwise the correct exercise must remain available among clarification candidates

The language suite also checks:
- slang and anatomical terminology
- precise muscle-region requests
- misspellings and speech-style substitutions
- goal and target-emphasis ambiguity
- spoken durations / RPE / RIR / rest
- equipment inclusion and exclusion
- negative muscle and exercise intent
- program frequency and weekday shorthand
- beginner/advanced phrasing
- unilateral / bilateral / mixed phrasing
- false-positive guards for phrases such as single-arm row, chest-supported row and back squat
- vague prompts that must not invent a target

The separate v0.59 history-aware intelligence suite remains active with its 90 target × goal × duration cases and weekly/progression/laterality/prescription assertions.


## v0.60 adaptive progression and multi-week training intelligence

v0.60 extends Coach from session-level programming into exercise-specific progression across repeated exposures.

### Multi-week exercise profiles

For exercises with saved working-set history, Coach can inspect up to the most recent eight exposures and classify the observable performance pattern as:
- baseline / building
- progressing
- consolidating
- plateau watch
- high-effort plateau
- performance dip

The profile uses the user's own logged load, repetitions, estimated 1RM trend and optional RIR. It does not compare the user against population strength standards.

These labels are programming descriptions, not diagnoses. A flat or lower performance trend does not prove fatigue, poor recovery, overtraining, injury or a need to deload.

### Continuity before random exercise rotation

A movement that is progressing over multiple exposures receives a continuity preference when it still matches the user's requested muscles, equipment and programming role.

A flat movement is not automatically replaced. Coach first distinguishes:
- flat performance without enough effort context -> hold/retest
- repeated flat performance with high logged effort -> stop forcing another automatic progression step
- meaningful recent performance drop -> hold/review rather than automatically increasing load or reps

This keeps variation purposeful and prevents the programming engine from treating exercise novelty as progress.

### Exercise-specific progression strategy

Coach-generated exercises now carry an explicit progression strategy.

Current strategies:
- **Double progression:** rep-first progression through a range, then load
- **Load-first:** strength-oriented progression that prioritizes small load increases after the programmed minimum is established
- **Top + backoff:** an established weighted compound can use a heavier top set followed by lower-load backoff work

Isolation exercises normally remain on simple rep-first progression rather than receiving unnecessarily complex top/backoff structures.

Manual and pre-v0.60 routines do not silently opt into the new adaptive hold behavior. The adaptive layer is persisted explicitly on Coach-generated exercise configs.

### Top-set and backoff programming

Coach understands structured requests such as:
- "top set 3-5 reps then 3 backoff sets 6-8 reps"
- "one top set and two backoff sets"
- "backoff at 90 percent"

For appropriate weighted compounds, strength-oriented defaults can also select a top/backoff strategy after sufficient exercise history is available.

The default structure is practical, not a claim that top/backoff programming is universally superior:
- one primary top set
- two or more backoff sets where session structure permits
- strength top-set range roughly 3-5 reps
- strength backoff range roughly 5-8 reps
- default backoff load around 90% of the programmed top-set load

Explicit user instructions override these defaults.

Top/backoff roles are real workout data:
- active workout rows display **Top Set** and **Backoff**
- progression targets differ by role
- the structure survives Save as Routine and Program generation
- working-set edits keep the saved structure coherent

### Adaptive progression holds

For Coach-generated adaptive routines using normal double progression, repeated high-effort flat performance or a meaningful performance dip can temporarily suppress the normal automatic rep/load increase.

The resulting recommendation is a **hold**, not an automatic exercise replacement or medical/recovery recommendation.

The user can still override the target at any time.

### No invented starting weights

Top/backoff programming does not create a population-based working weight.

If the user has no usable history for the exercise, Coach provides the set/rep structure but the working load remains 0 / user-selected until the user establishes their own baseline.

Once personal history exists, future targets can come from that history and the normal progression engine.

### Evidence interpretation

Evidence supports multiple viable forms of progressive overload. Research comparing load progression with repetition progression found both strategies can produce strength and hypertrophy adaptations, so Coach does not treat increasing weight every session as the only valid progression method.

Autoregulated resistance-training approaches also have evidence supporting their use for maximal-strength programming. Swole Cat uses this as support for incorporating the user's own performance and effort history, not as justification for claiming physiological readiness.

Periodization evidence is used conservatively. Periodized programming appears useful for maximal strength, particularly in trained lifters, while evidence does not justify claiming that periodization itself is necessary for hypertrophy.

Top-set/backoff structures are treated as a practical way to express heavy priority work plus subsequent volume. Swole Cat does not claim they are universally superior to straight sets.

Relevant sources are recorded in `src/data/coach-knowledge.js`, including:
- ACSM 2026 resistance-training position stand
- load versus repetition progression research
- autoregulated strength-training systematic review/meta-analysis
- periodization systematic review/meta-analysis

### v0.60 validation

A dedicated simulated training-block suite tests:
- eight-exposure progressing movement history
- repeated high-effort plateau history
- meaningful performance-dip history
- adaptive strategy assignment
- adaptive progression holds
- top/backoff recommendation generation
- role-specific active workout sets
- explicit top/backoff natural-language grammar
- persistence into generated routines
- compatibility with manual/legacy non-adaptive routines
- fresh exercises with no history remaining at zero suggested load

The v0.60 suite runs alongside the existing 360-prompt programming matrix, 432-check language-resilience suite and 90-case history-aware v0.59 intelligence matrix.

### Safety boundary

The adaptive progression engine can say:
- performance has been flat across recent exposures
- a movement has been progressing
- the last logged performance is below the recent block best
- hold the programmed target for another exposure
- the user's own history supports a next rep/load target

It must not infer from logs alone that:
- the user is recovered or unrecovered
- central nervous system fatigue exists
- soreness is absent
- the user is overtrained
- an injury explains performance
- a deload is medically necessary


## v0.60.1 adaptive progression audit hardening

The v0.60 follow-up audit tightens implementation behavior without expanding the product into recovery diagnosis or automatic deloading.

- Plateau classification is based on a recent four-exposure window, not the full training block, so earlier progress cannot hide a current stall.
- A plateau window must span at least 10 days. Several flat sessions clustered inside one week remain insufficient evidence for a multi-week plateau label.
- High-effort plateau and meaningful performance-dip holds apply to adaptive top-set/backoff progression as well as adaptive straight-set progression.
- Top/backoff routine editing uses role-specific fields and keeps top sets, backoff sets, role rep ranges, backoff percentage, and total working-set count coherent.
- Natural-language tests now include top/backoff variants such as “back down sets,” “lighter sets,” percentage backoffs, and percentage drops.
- These rules still describe logged training performance only. They do not infer fatigue, readiness, injury, overtraining, or a medical need to deload.


## v0.61 saved-routine conversational control

v0.61 applies Coach intelligence to an existing saved routine without regenerating it as a new workout.

### Mutation boundary
- Coach opens a cloned working copy of the selected routine.
- Natural-language changes affect that working copy only until **Save Changes** is explicitly chosen.
- Cancel discards the draft.
- Coach-local undo and redo operate on routine snapshots and do not touch workout history.
- Completed sessions are never rewritten when a routine changes.

### Supported routine controls
Coach can make focused changes such as:
- add or remove an exercise
- swap one exercise for another
- move an exercise before or after another movement
- change working-set count
- change rep range
- change rest time or explicit effort target
- change training goal/mode where requested
- fit a routine toward a requested session duration by trimming later/accessory volume conservatively rather than regenerating the workout

Conversational references can resolve ordinal/context language such as:
- “the second exercise”
- “the last one”
- “that one”
- “move that before curls”

Ambiguous references remain unresolved rather than being silently guessed.

### Routine-aware additions and explanations
When the user asks for a target rather than a named exercise, Coach ranks additions using the existing programming engine, including:
- current routine muscle coverage
- current movement families and redundancy
- exercise preferences
- the user’s own training history
- the active training goal

Coach explanations can describe primary/secondary muscle role, movement-family overlap, progression structure, and recent exercise-history status. These are programming explanations, not recovery or medical diagnoses.

### Progression preservation
Existing exercise configuration is preserved whenever compatible:
- adaptive progression opt-in
- progression strategy
- top/backoff structure
- set/rep/rest configuration
- superset grouping
- user-authored routine structure

A swap to an incompatible movement may drop a top/backoff structure rather than pretending that the old progression model still fits the replacement.

### v0.61 validation
The dedicated production-bundle regression suite verifies:
- draft-copy isolation before save
- ordinal and conversational references
- surgical set/rep edits
- reorder + undo + redo
- routine-aware explanations
- compatible top/backoff preservation through swaps
- target-based exercise additions
- duration fitting
- explicit save persistence
- completed-history immutability
- cancel/discard behavior

The full legacy Swole Cat regression suite continues to run alongside this v0.61 coverage.


## v0.62 training-history Q&A and deeper insights

v0.62 lets Coach answer questions about the user’s own completed Swole Cat history before falling through to workout/program generation.

### History-question routing

Coach distinguishes clear history questions from creation requests.

Examples handled as history:
- “what did I bench last time?”
- “what is my bench PR?”
- “how is my bench progressing?”
- “has my squat stalled?”
- “what exercises are stalled?”
- “what am I progressing on?”
- “how consistent have I been the last 4 weeks?”
- “when did I last train legs?”
- “what haven’t I trained lately?”

A creation request such as “bench press workout 45 minutes” still routes to workout creation.

### Historical answer sources

Historical answers reuse the same completed-session data structures used by History and Analytics.

Exercise answers can include:
- exact most-recent completed working sets
- date and routine name
- load, reps, and logged RIR where available
- heaviest logged working set
- multi-week status from the v0.60 adaptive progression profile

Global trend answers summarize only exercises with sufficient repeated history.

### Deeper Coach Insights

Home’s original neglected-area signal is now backed by a ranked insight engine.

Current candidate order favors:
1. high-effort multi-week plateaus
2. meaningful performance dips
3. broad neglected push/pull/lower-body coverage while other training continued
4. clearly progressing exercises
5. recent consistency summaries

The existing v0.54 neglected-area behavior remains compatible, including suppression during active workouts and active Programs.

### User-control handoffs

History answers and insights can offer opt-in actions such as:
- open exercise progress
- review a saved routine through v0.61 Coach routine control
- open Analytics
- build a workout for a neglected area

No insight silently changes a Routine or Program.

### Interpretation boundary

Coach can describe:
- progressing
- consolidating
- plateau-watch
- high-effort plateau
- recent performance dip
- recent training frequency
- time since an area last appeared in completed logs

Coach does not infer:
- soreness
- fatigue
- injury
- recovery state
- overtraining
- medical readiness
- a requirement to train an area today

### v0.62 validation

The dedicated production-bundle regression suite verifies:
- history-question routing versus workout creation
- exact last-exercise answers
- best/heaviest logged working-set answers
- exercise-specific progression and plateau summaries
- global progressing and stalled summaries
- consistency windows
- muscle-area recency
- neglected-area detection
- ranked Home insight priority
- safe action handoffs
- compatibility with the original v0.54 Home insight contract
- normalized phrasing such as stalled/stalling and apostrophe/pronoun variants

The full Swole Cat regression suite continues to run alongside v0.62 coverage.
