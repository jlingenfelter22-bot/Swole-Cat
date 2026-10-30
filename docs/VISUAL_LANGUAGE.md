# Swole Cat Visual Language

This document defines the semantic color system for Swole Cat. Color should communicate meaning first and decorate second.

| Signal | Token | Meaning | Primary uses |
| --- | --- | --- | --- |
| Cyan | `--signal-info` | Information, navigation, data, neutral selection | Progress, exercise library, general selection, system/data surfaces |
| Violet | `--signal-plan` / `--signal-coach` | Planning, creation, intelligence | Routines/programs, Coach Swolecat, build/edit intelligence |
| Green | `--signal-active` | Active, completed, successful | Active workout, resume/start state, completed sets, success |
| Pink | `--signal-pr` / `--signal-history` | Achievement and historical record | PRs, records, History identity |
| Orange | `--signal-warning` | Warning or cautionary special state | Pause state, drop-set/warning language |
| Red | `--signal-danger` | Destructive or failure state | Delete, destructive actions, failure set language |
| Yellow | `--signal-superset` | Linked exercise flow | Supersets only in workout-linkage UI |

## Protected superset language

Superset linkage is yellow throughout the app. This includes superset badges, notes, member accents, round/order indicators, the live superset flow, and its active step. Do not recolor supersets to pink, violet, cyan, or green.

Green may appear inside a yellow superset flow only to indicate that an individual superset step is already completed.

## Interaction hierarchy

Primary planning/build actions use the normal violet primary button. Start, Resume, Complete, and other positive active-workout actions use green. Secondary actions remain neutral. Destructive actions use red and should not compete visually with the primary path.

## Screen identity

Routines/Programs use violet planning language. Exercise Library and Progress use cyan information/data language. History uses pink record language. Home stays neutral/informational until a workout is active, at which point active session surfaces use green.

## Achievement language

PRs and record achievements are pink. They must not use the yellow superset language. A favorite star may remain gold as an icon convention, but it is not a workout-state surface and should not be used as a superset substitute.

## Restraint

Semantic colors should be concentrated on borders, small accents, state labels, icons, and primary controls. Neutral surfaces should remain neutral so state colors retain meaning. Avoid adding glow solely for decoration when geometry, contrast, or typography can establish hierarchy.
