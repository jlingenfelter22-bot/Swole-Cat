# Coach Programming Quality: Short-Day, Pull and Hinge Remediation

**Baseline:** Installed Testing v0.93.5, Android code 141. **Branch:** `quality/coach-selection-fatigue-shortdays-v0935`, draft PR #90, stacked on the separate 38-case audit in PR #89. **Beta:** untouched.

## Human-programming findings leading to change

The prior 38-request stress matrix showed 34 feasible programs. The 25-minute upper-body day inside a four-day upper/lower split was rejected even though a useful abbreviated session could be built. A 60-minute dumbbell-only PPL split allocated only 4 exercises/12 sets (~31 minutes) to Pull while Push and Legs each used 7 exercises/21 sets (~51–52 minutes). A 50-minute machine/cable-free upper/lower plan placed both Romanian and sumo deadlift movements in each lower-body session.

This pass improves actual exercise selection rather than equating higher exercise counts or filled minutes with quality. Its decisions are conservative and preserve explicit constraints and user choice.

## Targeted movement-selection rules

1. **Short programmed upper-body days (30 minutes or less):** Core slots are a meaningful chest press and back pull. Shoulder press, side delts and rear delts become optional for this short day and can be completed elsewhere in a longer program. This permits an actual 25-minute session without pretending it contains every upper-body isolation. It does not relax full-body or explicit multi-exercise requirements. Planner times remain approximate and include warm-up, rest and setup.
2. **Automatically selected hinge fatigue:** In a multi-day hypertrophy/general program, select one hinge family slot per lower-body day unless the user explicitly requires otherwise. This avoids automatically loading RDL and sumo deadlift together amid squats, lunges and hip thrusts. Strength-mode programming and user-authored required exercises still win; this is a stimulus/fatigue *heuristic*, not an injury-risk diagnosis.
3. **Dumbbell Pull where no vertical pull is actually available:** Determine equipment availability using the real exercise service and constraints; when all vertical pulls are excluded, allow an additional distinct neutral-grip biceps accessory alongside the normal supinated curl, horizontal row, lat isolation and rear-delt pattern when the time budget permits. Do **not** invent machines, bars or cable attachments, change fully equipped Pull days, or add exercises just to spend the clock budget. A neutral-grip curl complements elbow flexion but is **not** a replacement for vertical pulling; Coach should never imply it trains lats equivalently.
4. **Optional advice remains optional:** No new auto-apply behavior, no changes to saved workouts or personal cloud accounts. The person can still decline, replace, or specifically request movements even when the standard program heuristic would make a different choice.

## Verification and compatibility gates

The new `scripts/coach-v0935-selection-quality-stress.mjs` validates:
- A **25-minute** Upper A generated within the declared time with an actual chest press and back pull; companion Upper B retains shoulder pressing.
- Dumbbell-only Pull has five or more useful movements and two distinct biceps grip angles, without inventing equipment or hitting exactly 60 minutes.
- Each machine-free Lower day has at most one automatically selected hinge and at least one knee-dominant foundational movement.
- Strength-mode and normal gym PPL remain valid, and an explicit user request for two distinct hinges is respected.
- Determinism, equipment exclusions, optional suggestions, preview-to-saved-routine exercise IDs and no mutation of stored sessions/routines/programs remain intact.
- The prior 38-case edge audit, frozen Phase 1 baseline, Phase 2 weekly audit, Phase 3 recommendation tests and full historical app regression suite must also pass.

The development PR includes evidence artifacts for the exact generated selections, workload and time estimate; device measurements and personal goals always override heuristics when requested.

## Release decision

**No release or merge is part of this engineering audit.** The branches are draft, preserving Testing v0.93.5/code 141 and stable Beta. A later Testing build requires an explicit release checkpoint, actual signed APK and the standard in-app updater. Do not automatically promote this to Beta.

This is a targeted improvement, not an assertion that every weekly volume distribution, training response, or injury situation is optimal. Continued human review should assess the actual sessions, not just audit score reductions.
