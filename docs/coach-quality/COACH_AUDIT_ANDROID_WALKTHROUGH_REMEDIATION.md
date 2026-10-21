# Coach Program Audit — v0.93.7 Android Walkthrough Remediation

**Source of feedback:** Silent 99-second Android Testing v0.93.7 walkthrough, reviewed October 21, 2026.

**Scope:** Draft PR #94; an opt-in quality correction to the existing Program Audit. Installed Testing v0.93.7/code 143 is not changed, and stable Beta is not touched. The update is intentionally not merged while final quality checks run.

## Prioritized findings and changes

| Walkthrough finding | Root cause | Focused remediation |
|---|---|---|
| **Review Training History was buried** below the audit warnings | Phase 4 primary button added after all findings | **Prominent, single Review Training History action** directly under Program summary, before all observations |
| **Full-body press/row frequency looked like redundancy** | Audit grouped identical movement-family/rep roles across independent Routine days | A multi-day split can intentionally repeat bench presses and rows. **Cross-day repetitions alone never trigger redundancy.** Only two *distinct* similar exercises in the *same Routine* with similar roles can prompt an optional review; explicitly preferred/favorited movements are protected |
| **Plan 24.8 vs actual 8.3 / actual 0.0 appeared alarming** | Planned weekly set-equivalents were compared to fewer/missing completed weeks without a confidence gate; poor attendance could be labeled a muscle training deficit | **No coverage deficit warning solely from weekly planned-vs-actual totals.** Weekly totals are expandable context with units and primary/secondary scoring explained. If fewer than three weeks, fewer than 2 completions per Routine, or less than 75% of intended weekly sessions, logged numbers display **—**, never an unjustified 0.0 comparison |
| **Audit overwhelmed the screen** | Every card displayed its full paragraph and a small Review button | Show short headings and first three observations only; further observations behind **Show more**. Each card's supporting evidence is behind **Why Coach noticed**. Actions are full-width 48px minimum for Android and wrap without ellipses |
| **History forming appeared as "POSITIVE" finding** | Generic fallback status was rendered in normal issue list | Clear neutral **History context** summary. `history_depth`, `clear`, and `progressing` are not treated as problems in the list |

### Scientific and user-agency boundaries

These changes avoid overstating the meaning of logged data. Multiple weekly exposures of the same movement pattern are not, by themselves, evidence of bad programming. A low attendance rate cannot prove a muscle has received inadequate stimulus. Primary contribution counts as 1 set-equivalent and secondary as 0.5, *for planning context only*, not as a validated quantitative measure of hypertrophy or muscular development.

The existing optional Phase 4 Training History Review still distinguishes scheduling, routine rotation, actual within-session execution and planned structural gaps. Its opt-in Review or Keep as is actions remain unchanged. No automatic weight/rep increases, exercise removal, program edits, saves, account changes or sync operations are introduced.

### New acceptance proof

`scripts/coach-v0937-audit-hierarchy-fidelity-stress.mjs` tests at **320/360/390/430/480 CSS-pixel widths** using the actual app bundle in JSDOM:

- Three full-body days using the **same** barbell bench, barbell row and squat never trigger a redundancy warning.
- No completed sessions and a single completed session do not show unsupported "actual = 0" comparisons.
- Six completed sessions spread over four weeks of a saved 3/wk Program don't cause Coach to confuse missed workouts with defective muscle coverage.
- The Training History action precedes all findings; history context remains neutral; details are initially collapsed; long names are escaped and not silently used for user-data writes.
- Multiple related exercises *within one Routine* remain eligible for nonjudgmental human review.
- The entire pass remains read-only, leaving personal Program, Routine, workout history and localStorage unchanged.

The existing `scripts/coach-program-auditor-stress.mjs` is updated to explicitly reject `actual_coverage_gap` as a consequence of missed Program days. All preceding Phase 1–4, updater/cloud-safety, and historical UI tests continue running in CI.

### Device and release boundary

This is a simulated phone-width DOM/CSS audit, not a claim of new physical Android observation. A signed Testing update should only follow green full validation, a tested in-app update manifest, and the owner’s next Testing release decision. **Beta is not authorized for promotion.**
