# Coach Swole Cat v0.90 development: Guided Program Intake

**Date:** October 13, 2026. **Status:** Development branch only; CI and actual Android Testing acceptance pending.  
**Owner feedback:** Asking for a "three-day split" should begin a program planning dialogue. It must **not** automatically become three full-body workouts. Frequency and estimated time are not enough to define a useful program.

## Approved user experience

An interactive program starts by collecting **only the missing information** and proceeds one step at a time:

1. **Frequency**, if missing: 2–6 days per week.
2. **Split**, if missing: Push/Pull/Legs; rotating Upper/Lower; explicit Full Body; or a Custom Body-Part Split.
3. **Custom day focus**, if chosen: select each day's target muscles from familiar groups such as Arms, Back, Legs, Chest, Shoulders, Push, Pull, Upper and Lower. These remain separate standard routines, not mislabeled full-body workouts. The user deliberately owns the split choice; Coach doesn't infer it from "3-day".
4. **Session duration**, if missing: 30/45/60/75/90 minutes, with the existing bounded duration estimator for each day.
5. **Equipment**, if missing: regular gym, dumbbells, floor-only, or explicitly described equipment. Respect actual availability and do not assume specialty apparatus.
6. **Preferred weekdays**, if missing: choose exactly as many days as the frequency, or deliberately leave the calendar flexible. Calendar selections are *preferred days*, not notifications or enforced attendance. If the prompt supplies all days (e.g. M/W/F), do not re-ask.
7. **Training goal**, if the user hasn't stated it: build muscle, build strength or general fitness. The goal informs exercise order, prescriptions and recovery assumptions. It's separate from tracking mode.
8. **Training mode**, if not stated: Guided Progressive Overload, Strength Focus or Track Only / Standard. Do not silently save `inherit` for newly built interactive programs.
9. **Deload preference** for Guided mode only: choose no scheduled deload or every 3–8 training weeks, with 4 as a suggested UI option but *not* a universally optimal recommendation. The existing engine requires a per-week user confirmation to begin a deload; do not infer readiness or injury.
10. **Preview, revise, save**: show each separate day, weekday preferences, chosen program mode/deload and available equipment. Saving writes normal routines plus the standard program object using its actual `trainingMode` and `deload` fields. The planning dialogue itself does not save user data.

All setup questions also offer a text/voice field. One natural-language reply can supply multiple details (for example: PPL, 45 minutes, full gym, Mon/Wed/Fri, build muscle, Guided overload, deload every 4 weeks). Coach parses those into its current ephemeral draft and skips questions already answered. A reply containing only three weekday names **cannot** silently change an already selected four-day frequency; it requests another day instead.

A fully specified request skips already answered questions. A three-day Full Body request still creates three full-body days *because the user chose that*. If only "three-day split" is provided, the first question is the split.

## Scientific and product boundaries

The 2026 ACSM position stand (PMID 41843416) and NSCA programming principles support goal-specific exercise prescription and balancing weekly patterns, but **no single split or deload interval is established as universally optimal**. This is owner-directed conversation and UX behavior, not an autonomous medical or fatigue judgment. Weekly set equivalents and minute estimates remain transparent engineering models rather than proof of fitness outcomes.

Retain the v0.89 exact workout path, equipment limits, user-set overrides, session history integrity, per-routine modes, and cloud account isolation. Existing manually created Programs and older direct `coachGenerateProgram` test fixtures must stay compatible. **No Beta merge or cloud mutation.**

## Acceptance and remaining quality concerns

The v0.90 targeted synthetic regression checks combined free-text reply, schedule-frequency safeguards, and walks the whole interactive custom sequence, selects Arms / Back / Legs, Mon/Wed/Fri, Guided mode and a four-week *optional* deload, and verifies saved program fields, per-day labels, and unchanged historical sessions. It separately checks a complete PPL prompt skips redundancies, explicit Full Body remains Full Body, Track Only has no deload, and program refinements preserve answered settings.

Still required before any release: full CI, realistic generated program review (including floor-only refusal), narrow Android screen flow, voice prompt recognition and owner signoff. Frequency choice is not an automatic weekly training recommendation. The user may decide to choose an uneven split; review weekly coverage honestly rather than silently replacing their selected muscle days.
