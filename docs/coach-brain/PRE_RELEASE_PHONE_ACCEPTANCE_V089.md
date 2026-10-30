# Coach Brain v0.89: Pre-release Session & Program Acceptance Gate

**Prepared:** October 13, 2026. **Status:** Published to signed Android Testing v0.89.0 (build 134) on October 13, 2026. Automated CI passed; owner/device acceptance pending.  
**Baseline:** PR #62 quality remediation, PR #63 exact-list duration preview and PR #64 preview-accuracy follow-up. This full stack is now in signed Testing v0.89.0 through release PR #65; Beta remains v0.73.1 and untouched.

## Why this gate exists

GitHub Actions passing and synthetic JSDOM exercise generation are necessary, but not sufficient for claiming a sensible workout, an achievable time target or a usable Android preview. The existing model counts work, rest, initial general warm-up, limited compound preparation and station transitions. It has **not** been calibrated against real gym waiting time, individual ramp-up practices or stopwatch observations.

In the stored [20-scenario post-remediation matrix](QUALITY_REMEDIATION_SCENARIOS_V089.json), before the preview-only changes:

| Property | Observation |
| --- | ---: |
| Single workout generation | 13 of 13 |
| Single workout estimated midpoint exceeds target | 0 of 13 |
| **Single workout upper estimate exceeds target** | **11 of 13** |
| Multi-day plans generated | 6 of 7 |
| Generated multi-day sessions | 25 |
| Program-day estimated midpoint exceeds target | 0 of 25 |
| **Program-day upper estimate exceeds target** | **23 of 25** |
| Floor-only 3-day full-body | Rejected rather than falsely claiming complete pull/knee/push coverage |

**Interpretation:** The midpoint now respects requested time in those synthetic fixtures, but the high side often does not. An upper-range overrun is **possible**, not proof that the workout would actually take too long. We must not market midpoint success as stopwatch validation.

## Pre-release UI integrity remediation

- The generated workout preview used to retain its original `brainTime` after user-tapped **Remove** or **Swap**. The actual saved exercises could differ from the estimate, a trust defect.
- The preview now rebuilds the estimate from its **current selected exercise IDs and currently saved set counts**, after user changes. It never automatically trims a user-selected replacement just to make the number look better; if the estimate increases, Coach tells the user.
- A removed or swapped exercise cannot leave its old automatic set-count override applying to a future exercise. Exact user-authored sets stay owned by the explicit workout path from PR #63.
- **Single-session** previews now distinguish possible high-range overrun from midpoint overrun.
- **Multi-day** program previews now explicitly say some days may take longer even when their midpoints fit, because existing per-day upper ranges frequently exceed the requested limit.
- Synthetic regression tests assert exact preview row IDs and saved exercise set-count agreement after manual Remove/Swap, upper-range single-session warnings, and upper-range program notices. No account or historical data is touched by these changes.

## Owner-approved real-Android review, signed Testing v0.89.0

1. **Install in place through Testing's normal updater.** Do not uninstall, switch Google accounts, reset cloud/local data, delete sessions, modify Supabase or touch Beta. Verify the Testing package and permanent signature unchanged.
2. **Custom exact workout:** Request `5 x 5 deadlift in 20 minutes`. Inspect exact rep/set rows, reasonable warm-up/rest explanation, time estimate and warning. Say `make it 15 minutes`, verify all five sets of five remain. Say `make deadlift 4 sets of 6`, verify both the preview and saved routine show exactly four sets of six.
3. **Generated short workout:** Ask for a 20-minute gym legs session, inspect its actual two-set prescription, estimate and upper-range warning. Tap **Remove** on an optional move, then **Swap** on another. Verify estimate, exercise names and saved routine change together, with no hidden stale exercise.
4. **Whole-week plan:** Ask for a 3-day, 45-minute gym full-body program. Confirm three varied days, individually visible estimated ranges, understandable time uncertainty, sufficient push/pull/knee roles and exact saved set counts. Request a floor-only 3-day full-body plan and confirm a helpful equipment-related refusal rather than false comprehensive coverage.
5. **Actual exercise timing:** If personally convenient, measure warm-up, station setup, prescribed working sets, breaks, unilateral side transitions and any waiting for equipment for a 20- to 30-minute test workout. Compare observed duration to displayed midpoint and range. This requires intentional human observations, **not** fabricated app telemetry.
6. **Phone UX check:** Readability on a narrow viewport, scroll and modal state while keyboard opens, accessible names beyond color alone, no accidental workout start/save, and no unexpectedly changed log/history or Training Mode behavior.

## Signoff record (not yet obtained)

| Gate | Status |
| --- | --- |
| Developer regression + real-output capture | **PASS**, [release PR regression](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38469539367), [generated-output review](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38469539499) and [main validation](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38469988653) |
| Session and program estimate recalculates after user edits | **PASS in synthetic regression**, real phone pending |
| Upper-range uncertainty is visible | **PASS in synthetic regression**, real phone readability pending |
| Device Android workflow review | **Not performed** |
| Stopwatch comparison for real sessions | **Not performed** |
| Owner accepts v0.89 to signed Testing | **Approved and published**, [release](https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.89.0) and [signing workflow PASS](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38469988579) |
| Owner separately approves Beta | **Not approved** |

## Research and safeguards

General programming should remain specific to user goals, available equipment and exercise mechanics. See the project's [TRAINING_SCIENCE_FOUNDATION](../TRAINING_SCIENCE_FOUNDATION.md) and [EXERCISE_INTELLIGENCE_FOUNDATION](../EXERCISE_INTELLIGENCE_FOUNDATION.md), including the 2026 ACSM position stand (PMID 41843416). Minute estimates, warm-up allowances and high/low multipliers are **engineering heuristics**, not conclusions drawn from training science.

No change may silently remove explicitly prescribed sets, alter Track Only/Guided/Strength Focus modes, reclassify assisted weight as added load, transfer exercise history, access Supabase or promote signed releases during this gate. Preserve permanent Android signatures and isolated cloud owners.
