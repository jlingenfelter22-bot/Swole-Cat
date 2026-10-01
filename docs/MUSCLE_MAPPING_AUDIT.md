# Swolecat Muscle Mapping Audit

Version: v0.46.2

## Purpose

This audit verifies that every built-in Swolecat exercise resolves to muscle regions the front/back heat map can actually draw, and that representative compound/isolation movements produce sensible relative heat-map intensity when multiple exercises are combined.

The heat map is a training-involvement visualization, not an EMG display and not a measurement of soreness, damage, or recovery.

## Public evidence anchors

Swolecat uses public exercise-science references to validate movement families and major muscle involvement:

- American Council on Exercise (ACE) Exercise Library: https://www.acefitness.org/resources/everyone/exercise-library/
- ACE Chest Press: https://www.acefitness.org/resources/everyone/exercise-library/5/chest-press/
- ACE Romanian Deadlift: https://www.acefitness.org/resources/everyone/exercise-library/317/romanian-deadlift/
- ACE Seated Lat Pulldown: https://www.acefitness.org/resources/everyone/exercise-library/158/seated-lat-pulldown/
- ACE Goblet Squat: https://www.acefitness.org/resources/everyone/exercise-library/362/goblet-squat/
- ACE Farmer's Carry: https://www.acefitness.org/resources/everyone/exercise-library/359/farmer-s-carry/
- ACE Kettlebell Swing: https://www.acefitness.org/resources/everyone/exercise-library/391/swing/
- NSCA certification/program-design guidance on exercise selection by movement and involved muscle groups: https://www.nsca.com/globalassets/certification/certification-pdfs/certification-handbook.pdf
- Bench-press EMG study (pectoralis major, anterior deltoid, triceps): https://pubmed.ncbi.nlm.nih.gov/33049982/
- Deadlift-variant systematic review: https://pubmed.ncbi.nlm.nih.gov/32107499/

These sources are used as evidence anchors, not as a claim that EMG amplitude equals hypertrophy or that one source can specify exact fractional contribution for every exercise.

## Audit rules

- Every one of the 307 built-in exercises must resolve at least one primary heat-map muscle.
- Every primary and secondary muscle key must exist on the anatomical renderer.
- Compound movement patterns are checked separately from isolation patterns.
- Specific exercise overrides are used where a broad library category would be misleading.
- Primary muscles contribute 1.0 set-equivalent per completed working set.
- Secondary muscles contribute 0.5 set-equivalent per completed working set.
- 0 set-equivalents = untargeted; >0 and <3 = light; 3 to <6 = moderate; 6+ = high.
- Warm-up, drop, and failure sets do not silently count as standard working-set equivalents in the progression heat-map score.

## v0.46.2 corrections

- Squat and lunge patterns now treat both quads and glutes as primary, with adductors secondary.
- Hip-hinge hamstring movements now treat hamstrings and glutes as primary, with lower back secondary.
- Hip adduction no longer falsely marks glutes and quads as secondary targets.
- Conventional, rack/block, deficit, sumo, and trap-bar deadlift variants receive separate mappings.
- Kettlebell hinge, squat, press, carry, landmine, and sled movements no longer inherit the old generic Full Body fallback.
- Farmer/suitcase carries now distinguish bilateral grip/trap/core loading from unilateral anti-lateral-flexion demands.
- Bench/assisted/plate-loaded dips and diamond push-ups now include chest/anterior-deltoid assistance.
- Reverse curls move forearm involvement to primary rather than treating it as only secondary.
- Reverse hyperextensions, 45-degree back extensions, and glute-ham raises receive more specific posterior-chain mappings.

## Stress tests

CI builds synthetic sessions for:

- bench press alone
- flat + incline pressing
- row + pulldown
- squat + Romanian deadlift
- suitcase carry

The tests verify both muscle scores and the final light/moderate/high heat levels.
