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
Completed in v0.35.0:
- Home becomes a command dashboard with live local training telemetry
- Routines / Programs becomes a program matrix with stronger rotation hierarchy
- Exercise Library becomes a movement database with pure UI vector movement sigils
- Active Workout becomes a training console with clearer session/target/set hierarchy
- Progress becomes a telemetry surface for records, workload, consistency, and trends
- History becomes a chronological session log with a stronger timeline structure

The screen pass changes composition and hierarchy without changing the underlying workout workflows.

### Pass 3 — Final cohesion and restraint
Completed in v0.36.0:
- unified motion timing and touch feedback
- reduced redundant glow and shadow effects
- UI-native empty states and personal-record markers
- stronger muted-text contrast and keyboard focus treatment
- color-independent patterns/shapes for charts and trend states
- Android touch-device rendering restraint
- off-screen paint containment for long Exercise and History lists
- accessible toast live-region and modal dialog semantics
- dark system color-scheme integration
- final reduction of decorative visual noise

The broad visual system is now considered established. Further visual work should be specific user-directed sizing, spacing, density, or component adjustments rather than another global redesign pass.

## Non-negotiable usability rules

- workout logging must remain faster than the visual styling is impressive
- text remains readable in a gym
- buttons remain obviously tappable
- numeric workout inputs stay visually dominant during a set
- destructive actions stay clearly different from normal actions
- charts remain interpretable without needing color vision
- local-first behavior and workout flow must not depend on visual assets loading


## UI tuning passes

### Tuning Pass 1 — Recorded device review
Completed in v0.37.0 from the September 30 device screen-recording review:

- Android header now consumes Capacitor System Bars safe-area insets so Swole Cat chrome does not collide with status icons
- native fallback clearance protects first paint on WebViews that briefly report a zero top inset
- bottom navigation now sits inside a full-width dock that paints through the Android navigation safe area instead of floating above it
- recognizable exercise movement artwork returned to the Exercise Library
- movement artwork is presented as a restrained Swole Cat training schematic with cyan figure treatment, magenta chromatic detail, grid/crosshair framing, and no mascot/cat thumbnail badge
- top header controls use the same vector/technical icon language as the bottom navigation
- existing HUD details, screen compositions, workout flow, and visual identity remain intact

Further tuning should be based on the next real-device review and should target specific sizing, spacing, density, or component placement issues rather than changing the established visual direction.


### Tuning Pass 2 — Custom selectors and settings controls
Completed in v0.38.0 from direct device screenshots:

- all native HTML select controls are enhanced into a reusable Swole Cat selector component
- Android no longer shows the default gray platform option popup for app-owned dropdown fields
- custom selector uses a branded in-app option sheet with current selection state, large touch targets, and keyboard/escape behavior
- original select elements remain as hidden state sources so existing save logic and workout behavior remain unchanged
- dynamic modal fields such as Program Training Mode and Routine Training Mode are enhanced automatically
- active-workout Set Type uses a compact variant so workout cards do not become oversized
- Settings Haptic Feedback and Keep Screen Awake rows use a fixed switch column so switches cannot be squeezed beyond the card edge
- toggle knobs are clipped safely inside their switch track at narrow Android widths


### Tuning Pass 3 — Header cleanup
Completed in v0.39.0 from direct device review:

- active workout shortcut now uses a fixed Resume label instead of rendering a changing done/total set count inside the header pill
- workout progress remains available in the Resume control title and accessibility label
- persistent PWA install/download button was removed from the app header
- install support remains in code for a future web-only placement rather than competing with Android header space
- Settings remains the only secondary header control beside Resume
- narrow-screen header rules keep Resume readable while Settings collapses to icon-only
