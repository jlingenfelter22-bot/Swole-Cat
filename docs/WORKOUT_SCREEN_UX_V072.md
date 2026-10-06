# Swole Cat v0.72.0 Workout Screen UX Pass

## Product goal

The active workout screen should behave like an instrument panel, not a scrolling page.

The normal logging path should fit within one phone viewport whenever practical:
1. understand session status
2. see/switch the active exercise
3. understand the target
4. choose/add a set
5. log weight/reps/RIR
6. complete the set

Scrolling remains an accessibility and edge-case fallback for supersets, large text, long notes, unusually many sets, and small screens. The design must never force tiny text or cramped tap targets just to technically eliminate scrolling.

## Locked hierarchy

### 1. Compact session strip
- replace the tall Session Active block with a thin status strip
- keep routine name, total set progress, percent, and elapsed time
- remove the permanent Cancel button from the primary surface
- preserve the slim progress bar
- session-level destructive/exception actions move under More

### 2. Exercise switcher is the navigation model
- the entire exercise header is tappable
- clearly label the affordance as Switch exercise
- show every exercise with completion/pending state
- add `+ Add exercise` as the final switcher row
- keep How To accessible beside the switch affordance
- remove permanent Next Exercise from the main action row
- automatic next-exercise progression remains after completing an exercise

### 3. Set rail owns set count changes
- current sets remain compact numbered pills
- append a dashed `+ Set` ghost pill
- tapping it adds a working set and focuses it immediately
- advanced set types remain under More/set options
- removing/reordering a set remains inside the focused set's options menu
- at least one working set is always protected

### 4. Primary exercise actions stay sparse
- Substitute stays visible
- More stays visible
- no replacement button is added merely to fill the old Next Exercise space

### 5. Exception actions live under More
Exercise controls:
- warm-up guide
- target override
- superset
- add working set fallback
- notes
- skip exercise

Workout controls:
- manage workout
- finish workout early
- cancel workout

Finish early must use the existing unfinished-work reconciliation rather than silently dropping incomplete work. Cancel keeps its existing destructive confirmation.

### 6. Finish Workout is contextual
- do not permanently render the large Finish Workout button
- while programmed work remains, Finish Workout lives under More as an early-exit action
- after all non-skipped programmed sets are complete, surface a prominent Finish Workout CTA
- retain structure-update review and post-workout recap behavior

## Data and safety constraints

- no workout history rewrite from navigation
- active-workout autosave remains local-first
- adding/removing working sets keeps `structureDirty` semantics
- saved routine changes still require explicit confirmation
- active workout remains excluded from cloud multi-device sync
- progression, supersets, timers, PR detection, keyboard anchoring, and Focus Mode behavior must remain intact

## Acceptance criteria

- no dedicated Cancel control on the normal workout surface
- no dedicated Next Exercise control on the normal workout surface
- no permanent bottom Add Exercise control
- no permanent bottom Finish Workout control while work remains
- exercise switcher contains Add Exercise
- set rail contains an Add Set affordance
- More exposes Finish Workout Early and Cancel Workout
- completing the final programmed set exposes Finish Workout prominently
- existing automatic exercise advance remains
- old unfinished-work review still protects early finish
- full production regression wall passes
