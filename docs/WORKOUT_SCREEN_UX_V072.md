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


## v0.72.1 feedback polish

This follow-up pass comes from a second narrated real-device review of the v0.72.0 workout console.

### One-time structure-change notice
- the permanent in-flow `Today’s structure changed` block is removed
- the first structural edit in an active workout triggers a floating overlay notice
- the overlay does not move workout content or increase scroll distance
- copy: `Workout modified` + reminder that the saved routine stays unchanged unless updated at finish
- visible for about five seconds with a shrinking progress line
- tap/keyboard activation dismisses it immediately
- shown only once per active workout, regardless of how many later structural edits occur
- the final structure-update confirmation remains authoritative

### Switch Exercise visual refinement
- retain explicit `Switch exercise` wording for discoverability
- render it as a single-line, lightweight affordance rather than a cramped bordered pill
- keep the full exercise header tappable
- keep the form-help info control available but visually subordinate it

### Exercise transition language
- crossing from one exercise to another gets a short card-deck transition
- forward navigation moves the outgoing card slightly left and brings the next card from the right
- backward manual navigation reverses the direction
- normal duration target: about 180 ms out / 230 ms in
- prefer the browser View Transitions API when available
- fall back to a lightweight incoming transform/opacity animation
- do not animate expensive filters, blur, or large shadow effects
- remove the redundant regular `Up next: ...` toast for normal auto-advance

### Set transition language
- Set 1 → Set 2 → Set 3 remains an in-place update, not a card transition
- the newly active set pill gets a brief cyan pulse/ring
- the focused set card gets a tiny vertical/opacity settle
- the cue exists only to confirm the new active set and should not delay interaction

### Motion accessibility
- respect `prefers-reduced-motion: reduce`
- navigation and state changes must remain instant and fully functional when motion is disabled
