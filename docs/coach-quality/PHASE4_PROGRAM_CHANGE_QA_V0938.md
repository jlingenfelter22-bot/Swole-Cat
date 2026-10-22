# Coach Phase 4, v0.93.8 Program History Crossover QA

**Prepared:** October 22, 2026
**Base:** released Android Testing v0.93.8 / versionCode 144
**Status:** development-only regression checkpoint, not physical-device approval.
**Branch:** quality/coach-phase4-history-crossover-qa-v0938. No Coach runtime, training, UX, storage, cloud, updater, version, signing key, or Beta changes.

## Why this is next

The October 21 Android walkthrough led to v0.93.8's clearer Coach Audit, prevention of false full-body redundancy alerts, and conservative treatment of sparse workout data (PR #94). Phase 4's optional Review Training History compares today's saved Program to sessions logged earlier. People can reorganize Routine order, remove a Routine, change exercises, edit frequency, or use the same Routine in multiple Programs.

Coach must not claim poor exercise selection or inadequate muscle development based on incomparable records. A saved Program is a current plan, not necessarily a dated historical prescription.

## Non-mutating regression cases

The new scripts/coach-phase4-history-crossover-stress.mjs runs in Validate Swole Cat with disposable JSDOM state.

| Situation | Expected boundary |
| --- | --- |
| Two Programs share Routine IDs | Count only sessions attributed to the selected Program |
| Reordered Routine IDs | History stays keyed by Routine ID, not today's day order |
| Removed Routine | Old sessions for a removed slot are not presented as a missing current slot |
| Material exercise list change | Existing 60% comparable-exercise-ID gate refuses outdated within-session comparisons |
| Deload, future, stale, and empty logs | Exclude from completed-session comparison |
| Weekly frequency or prescribed sets changed without dated snapshots | Record ambiguous result as observation only; do not certify the historic target |
| Opening, dismissing and reopening review | Optional, non-persistent, with no saved data or localStorage mutations |

Test evidence: GitHub Actions artifact named coach-phase4-program-crossover. Synthetic CI is NOT a real Android screenshot, a training physiology validation or a historic-plan-provenance proof.

## Explicit known limitation

The data model does not provide a dated immutable snapshot of all earlier weekly frequency or Routine target configurations. A current four-day plan does not prove that someone missed four-day targets during weeks when their plan may have been two days. Likewise, adding new sets today does not demonstrate inadequate performance last month.

The current Phase 4 review has careful language and a structural overlap gate, but exact historical intent attribution remains unresolved. The test logs this scenario and does not falsely certify it as safe. A future design should consider effective-dated plan snapshots or conservative post-edit evidence windows, with owner approval and no retroactive history rewriting.

## Physical Android Testing v0.93.8 acceptance

Install the signed Testing update in place via Settings > App & Updates, not by uninstalling. Do not switch cloud accounts, erase history, or attempt data recovery during this check. If making actual Program edits, take a backup first.

1. Open Program Options > Coach Audit. Review Training History should be visible directly below the Program summary.
2. Audit Full Body A/B/C with intentionally repeated bench, row and leg patterns across days. No cross-day redundancy alarm.
3. Open Training History. Check Routine counts, neutral sparse-history messaging and no invented logged-volume comparison.
4. Expand Why Coach noticed, Show more and weekly set-equivalent details. Check word wrapping, reachability, scrolling and Back / Done on the actual phone.
5. Dismiss with Keep as is, reopen the review and verify it reappears. No workout or Program change should occur.
6. Supply screenshots or silent walkthrough of any incorrect exercise warning, confusing evidence claim, overlapping buttons or scroll problem.

## Release and data guardrails

- Follow AGENTS.md, TRAINING_SCIENCE_FOUNDATION.md, EXERCISE_LOAD_BEHAVIOR.md, EXERCISE_INTELLIGENCE_FOUNDATION.md and COACH_SWOLECAT_EVIDENCE.md.
- ACSM 2026 and Pelland et al. 2026 support context-sensitive resistance training, not an exact universal individual set-equivalence cutoff.
- No changes to training prescriptions, Guided Overload, Strength Focus, Track Only, saved workouts, Supabase, account switching or UI design in this checkpoint.
- Do not merge or ship another Testing release until tests and a separate release decision. Beta remains v0.73.1 without separate approval.
