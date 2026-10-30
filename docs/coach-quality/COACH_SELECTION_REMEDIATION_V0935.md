# Coach Programming Quality: Short-Day, Pull and Hinge Remediation

**Baseline:** Installed Testing v0.93.5, Android code 141. **Branch:** `quality/coach-selection-fatigue-shortdays-v0935`, draft PR #90, stacked on the separate 38-case audit in PR #89. **Beta:** untouched.

## Human-programming findings leading to change

The prior 38-request stress matrix showed 34 feasible programs. The 25-minute upper-body day inside a four-day upper/lower split was rejected even though a useful abbreviated session could be built. A 60-minute dumbbell-only PPL split allocated only 4 exercises/12 sets (~31 minutes) to Pull while Push and Legs each used 7 exercises/21 sets (~51–52 minutes). A 50-minute machine/cable-free upper/lower plan placed both Romanian and sumo deadlift movements in each lower-body session.

This pass improves actual exercise selection rather than equating higher exercise counts or filled minutes with quality. Its decisions are conservative and preserve explicit constraints and user choice.

## Targeted movement-selection rules

1. **Short programmed upper-body days (30 minutes or less):** Core slots are a meaningful chest press and back pull. Shoulder press, side delts and rear delts become optional for this short day and can be completed elsewhere in a longer program. This permits an actual 25-minute session without pretending it contains every upper-body isolation. It does not relax full-body or explicit multi-exercise requirements. Planner times remain approximate and include warm-up, rest and setup.
2. **Automatically selected hinge fatigue:** In a multi-day hypertrophy/general program, select one hinge family slot per lower-body day unless the user explicitly requires otherwise. This avoids automatically loading RDL and sumo deadlift together amid squats, lunges and hip thrusts. Strength-mode programming and user-authored required exercises still win; this is a stimulus/fatigue *heuristic*, not an injury-risk diagnosis.
3. **Dumbbell Pull where no vertical pull is actually available:** Determine equipment availability using the real exercise service and constraints; when all vertical pulls are excluded, allow an additional distinct neutral-grip biceps accessory alongside the normal supinated curl, horizontal row, lat isolation and rear-delt pattern when the time budget permits. Do **not** invent machines, bars or cable attachments, change fully equipped Pull days, or add exercises just to spend the clock budget. A neutral-grip curl complements elbow flexion but is **not** a replacement for vertical pulling; Coach should never imply it trains lats equivalently.
4. **General programmed Lower-body squat overlap:** Automatically select just one squat-family lift per **unprioritized**, hypertrophy/general upper/lower day. Keep a separate lunge/split-squat pattern, posterior-chain work and any available knee-flexion movement. This avoids prescribing Back Squat and Front Squat on the same ordinary lower day merely because the exercise-count budget has room. Glute- or quad-priority programs still permit two squat angles; strength programming and explicitly selected squats remain unchanged. The existing glute-focused two-day **Bodyweight Squat → Side-Lying Hip Abduction** optional recommendation still triggers. This is a planning/fatigue *heuristic*, not a prohibition on useful squat variation.
5. **Optional advice remains optional:** No new auto-apply behavior, no changes to saved workouts or personal cloud accounts. The person can still decline, replace, or specifically request movements even when the standard program heuristic would make a different choice.

## Verification and compatibility gates

The new `scripts/coach-v0935-selection-quality-stress.mjs` validates:
- A **25-minute** Upper A generated within the declared time with an actual chest press and back pull; companion Upper B retains shoulder pressing.
- Dumbbell-only Pull has five or more useful movements and two distinct biceps grip angles, without inventing equipment or hitting exactly 60 minutes.
- Each machine-free Lower day has at most one automatically selected hinge and at least one knee-dominant foundational movement.
- Strength-mode and normal gym PPL remain valid, and an explicit user request for two distinct hinges is respected.
- Determinism, equipment exclusions, optional suggestions, preview-to-saved-routine exercise IDs and no mutation of stored sessions/routines/programs remain intact.
- The prior 38-case edge audit, frozen Phase 1 baseline, Phase 2 weekly audit, Phase 3 recommendation tests and full historical app regression suite must also pass.
- General gym and machine-free upper/lower days have **at most one automatically chosen squat-family movement per day**, with meaningful unilateral knee-dominant work retained, correct time estimates, no prohibited equipment, and exact saved-routine parity. Focused glute/quad plans and explicitly required **double squats** are protected.

The development PR includes evidence artifacts for the exact generated selections, workload and time estimate; device measurements and personal goals always override heuristics when requested.

## Validated generated workouts and remaining review

[Full code-head validation run #39505165628](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/39505165628) **passed all 110 CI steps**, including the frozen Phase 1-3 quality matrix, the 38-case real-world audit and targeted controls. Actual generated examples from `COACH_SELECTION_QUALITY_EXAMPLES`:

| Scenario | Prior QA finding | Exact generated result in targeted tests |
|---|---|---|
| Four-day upper/lower with Upper A limited to 25 minutes | Program previously rejected despite workable short session | **Upper A:** Barbell Bench Press, Barbell Row; planned **~21 minutes**. A separate longer Upper B retains Dumbbell Shoulder Press, lateral delts and rear delts |
| Dumbbell-only PPL, 60-minute requested Pull | Pull had 4 exercises / 12 sets / ~31 minutes | **Pull:** Dumbbell Row, Dumbbell Pullover, Bent Over Dumbbell Reverse Fly, Dumbbell Curl, **Hammer Curl**: **5 exercises / 15 sets / ~38 minutes**. Push/Legs remain full. No invented vertical-pull equipment and no artificial 60-minute filler |
| Machine-free four-day upper/lower | First corrected double hinges, then found two automatic squats per lower day | **Lower A:** Back Squat, Romanian Deadlift, Bulgarian Split Squat, Hip Thrust, Side-Lying Hip Abduction, Dumbbell Standing Calf Raise. **Lower B:** Front Squat, Dumbbell Romanian Deadlift, Barbell Reverse Lunge, Barbell Glute Bridge, Side-Lying Hip Abduction, Single Leg Calf Raise. Each day keeps **one squat, one hinge, one unilateral knee-dominant movement**, glute work and calves; no machines/cables |
| General four-day gym upper/lower, 50-minute target | Avoid doubling squat variations simply because the time budget allows | **Lower A:** Back Squat, Romanian Deadlift, Bulgarian Split Squat, Lying Leg Curl, Hip Thrust, Dumbbell Standing Calf Raise (~47 min). **Lower B:** Front Squat, Cable Pull-Through, Barbell Reverse Lunge, Seated Leg Curl, Barbell Glute Bridge, Single Leg Calf Raise (~46 min). Hamstrings receive both hip-hinge and knee-flexion patterns across the week |

The expanded 38-case matrix now reports **35 feasible requests**, three intentionally equipment-infeasible or contradictory requests, zero loose planned-duration anomalies and **zero** instances of the *original* PPL raw-set imbalance / automatic double-hinge review flags. These flags are a limited screen, not a scientific claim of overall optimal programming.

**Final refinement result:** A general multi-day Lower day no longer automatically piles two squat-family variations on top of unilateral knee-dominant work and a hinge. The glute-priority golden-program paths remain unchanged. A trainee may still explicitly choose two squats or favor greater quad/glute specialization, and Coach must not override that preference. Where hamstring curl equipment is unavailable, one hinge can provide posterior-chain work without pretending knee-flexion isolation is supplied. The 25-minute day intentionally covers only chest pushing/back pulling; its other muscle groups are allocated to the companion longer session. Dumbbell Hammer Curl is a different direct biceps angle, not a replacement for absent vertical pulling.

### Final lower-body overlap regression (October 20)

The new `coach-v0935-selection-quality-stress.mjs` quality gate now checks **nine acceptance conditions**, including generic + machine-free Lower days, preserved glute-priority recommendations, strength/PPL compatibility and explicitly required dual squats. [Full validation run #39509444563](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/39509444563) passed **110 workflow steps** and [synthetic performance #39509444535](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/39509444535) passed. The full 38-case edge suite also remains green: **35 feasible**, **3 equipment/contradiction rejects**, **zero** duration-overage or editorial flags in the current defined screens. This is an automated planning review, not observed human fatigue or training results.

## Release decision

**No release or merge is part of this engineering audit.** The branches are draft, preserving Testing v0.93.5/code 141 and stable Beta. A later Testing build requires an explicit release checkpoint, actual signed APK and the standard in-app updater. Do not automatically promote this to Beta.

This is a targeted improvement, not an assertion that every weekly volume distribution, training response, or injury situation is optimal. Continued human review should assess the actual sessions, not just audit score reductions.
