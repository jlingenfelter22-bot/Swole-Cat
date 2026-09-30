# Swole Cat Visual System

This document defines the visual identity used by Swole Cat beginning with v0.34.0.

The goal is a recognizable retro-futurist / cyberpunk interface that still works as a fast, readable workout tool. Decoration never wins over usability.

## Core direction

Swole Cat should feel like an optimistic 1980s vision of a future training terminal:

- deep black/navy foundation
- electric violet as the primary brand energy
- cyan for interaction, data, and navigation energy
- hot pink used sparingly for emphasis and branded detail
- green reserved for success, completion, and positive workout state
- thin schematic lines, grids, and HUD marks used as atmosphere rather than content
- angular geometry instead of generic rounded SaaS cards
- no AI mascot art or workout-character imagery in the core product UI

## Visual hierarchy

### Display layer
Used for:
- app brand
- screen headings
- section headings
- exercise names
- large metrics

Characteristics:
- condensed / technical feel where available
- strong weight
- controlled uppercase
- slightly expanded tracking on labels
- no illegible novelty font for body copy

### Body layer
Used for:
- instructions
- workout notes
- history details
- form inputs
- explanatory copy

Characteristics:
- native/system sans-serif
- high contrast
- readable at gym distance
- no decorative distortion

## Color roles

- **Violet**: primary actions, brand identity, selected/featured state
- **Cyan**: interactive energy, navigation, focus, data emphasis
- **Pink**: accent marks, PR/future branded emphasis, limited decorative energy
- **Green**: completed sets, successful state, positive confirmation
- **Red/Rose**: destructive actions only
- **Neutral blue-gray**: borders, muted controls, structural UI

Do not use green simply because it looks futuristic. Green means success/completion.

## Surface language

Primary panels use:
- dark blue-black surfaces
- asymmetric corner radii
- thin cool-gray/cyan borders
- occasional 1–2 px accent rails
- restrained ambient glow
- small technical edge marks

Avoid:
- large neon halos around every component
- heavy glass blur on every surface
- giant decorative imagery behind workout controls
- visual effects that lower text contrast

## Navigation

The bottom navigation is a signature Swole Cat component.

Rules:
- custom vector icons, not emoji or generic Unicode symbols
- five evenly sized command segments
- active segment gets a violet/cyan framed state plus a thin top energy rail
- icon and label must both communicate active state
- inactive states remain readable but subdued
- active state must not rely on color alone
- touch targets remain large enough for gym use

## Controls

Buttons:
- asymmetric angular radius
- primary uses violet energy treatment
- secondary uses dark technical surface
- green only for completion/success
- danger only for destructive actions

Inputs:
- dark recessed surface
- cyan focus outline
- no layout shift on focus
- clear keyboard/touch target sizing

Pills/tags:
- technical rectangular capsule rather than fully rounded bubble
- dense labels remain short and scannable

## Motion

Motion should communicate state, not decorate.

Allowed:
- short press compression
- subtle border/glow transitions
- progress animation
- modal entrance
- active-navigation transition

Avoid:
- continuous pulsing everywhere
- parallax
- large looping effects
- anything distracting during a working set

Respect `prefers-reduced-motion`.

## Pass structure

### Pass 1 — Core identity
Completed in v0.34.0:
- color/state system
- surface geometry
- typography hierarchy
- custom navigation icon system
- signature bottom command rail
- buttons, inputs, tags, progress geometry
- focus/accessibility states

### Pass 2 — Screen composition polish
Next:
- Home
- Routines / Programs
- Exercise Library
- Active Workout
- Progress
- History

Goal: apply the system intentionally to each screen, improve hierarchy, and remove remaining generic layouts without changing core workflow.

### Pass 3 — Final cohesion and restraint
Later:
- spacing consistency
- icon consistency
- animation timing
- micro-interactions
- density cleanup
- Android performance review
- accessibility/contrast review
- final removal of visual noise

## Non-negotiable usability rules

- workout logging must remain faster than the visual styling is impressive
- text remains readable in a gym
- buttons remain obviously tappable
- numeric workout inputs stay visually dominant during a set
- destructive actions stay clearly different from normal actions
- charts remain interpretable without needing color vision
- local-first behavior and workout flow must not depend on visual assets loading
