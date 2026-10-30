# Coach v0.94 — Saved Program Editing: Owner Acceptance and Safety Contract

**Prepared:** October 14, 2026. **Status:** Development-only branch `feature/coach-v094-saved-program-edit` stacked on v0.93.1 interaction hardening. Physical Android signoff, merge and signed Testing release **not yet authorized/performed**.

## Problem demonstrated by physical Testing v0.93.0

The user built a 3-day Program with Coach, saved it, logged a session, and subsequently found no **Edit with Coach** action on the saved Program. Manual Edit and read-only Coach Audit existed but the conversational context disappeared. The same video showed a jumpy Android keyboard in the long preview, overly dense program review, and a Workout complete sheet opening at an old scroll offset. The v0.93.1 parent development PR treats the latter interaction issues separately.

## This checkpoint: conservative, inspectable contextual editing

- Program card and options menu visibly offer **Edit with Coach** alongside **Edit Manually** and **Coach Audit**.
- Editor opens with the **selected existing Program** and its saved routine/day snapshots, weekday schedule, progression mode, current nextIndex and exercise lists. There is **no new program intake**.
- The user can propose **precise, limited changes**: named-day time target, move an existing weekday to a free weekday, add/remove a named exercise in a specific day, substitute a named movement within the same movement pattern, or change the Program training mode. Multiple recognized clauses are all-or-nothing.
- A changed duration is clearly **a planning target, not a guarantee or automatic exercise-volume reduction**. A replacement reuses current sets/reps/rest but warns that they may need review. New named exercises use general-training defaults and never invent or migrate a previous weight. Limited saved-day equipment is checked before adding/replacing exercises.
- **Draft only until confirmed**: show summary of intended changes, compare every day, and offer distinct **Apply reviewed changes** and **Cancel · Keep original**. Invalid/unknown instructions do not silently regenerate routines.
- **Copy-on-write changed routines**: create new routine IDs when an actual routine's future blueprint changes; leave unchanged routine IDs stable. Another Program referencing the same original routine keeps its own original behavior. Same Program ID and nextIndex remain stable; historical completed sessions and logged sets are never modified or deleted. A copy can remain alongside an older standalone routine, by design for provenance.
- Before applying, revalidate exact original Program and routine snapshots and the signed-in cloud owner. Block conflicting/stale edits and edits while that Program has an active workout. Normal local save/sync infrastructure runs only after review and successful Apply.
- Scope deliberately **does not support** freeform comprehensive program reconstruction, injury rehabilitation, equipment downgrades that would invalidate unedited exercises, changing frequency/split, new week-level training-goal inference, auto-prescription of loads, or a scientifically validated new timing prediction. Unsupported input explains the limitation and points to manual editor/new program. Never claim these are implemented.

## Acceptance gates

1. Every saved Program (Coach-created or manual) has a recognizable Edit with Coach action; manual editing and audit remain distinct.
2. Opening editor alone, typing unrecognized instructions, discarding/canceling, or refusing a conflict **never writes any profile, Program, Routine, history, cloud account or session record**.
3. Scoped weekday targets preserve other days and existing sets; 45-minute label isn't misrepresented as 45 minutes of feasible work.
4. A shared original routine remains intact in a different Program after a scoped edit; changed day receives copy-on-write routine ID and unaffected days retain their exact IDs.
5. Original Program ID, activity/nextIndex, completed workout records and progression mode remain unchanged unless explicitly requested.
6. A move to a weekday already in the schedule is rejected. Unknown weekdays and multiple unspecified days are not silently guessed.
7. Invalid named exercise, unsupported movement pattern, and equipment-incompatible exercise edits are rejected without partial updates.
8. Multi-clause operations are transactional; a failed second clause rolls back the entire proposal.
9. A program/routine changed elsewhere while the editor is open is rejected as stale, rather than merged. Switching cloud owners in the middle of a draft blocks Apply.
10. Active program workouts cannot be edited underneath in-progress logging.
11. Automated JSDOM test verifies these structural/data invariants, **not physical keyboard behavior or real usability**. Confirm on native Android before signed Testing promotion.
12. No Supabase schema migration or Coach Memory synchronization introduced by this feature.

## Real Android walkthrough (owner review pending)

From Programs, find the saved 3-day PPL plan and tap **Edit with Coach**. Confirm it immediately shows saved schedule, exercises and progression mode rather than restarting intake. Request **Wednesday 45 minutes**; inspect the explicit target-only caveat and confirm Monday/Friday unchanged. Try **remove [named exercise] from Wednesday** and verify the visible proposed diff. Test **Cancel** with the saved plan unchanged. Reopen, modify, and **Apply**; then verify next-workout rotation, previous completed-session history and the other Program sharing that routine. Try an unknown request and a new equipment-incompatible exercise: neither should silently apply. Test Gboard open/dismiss, speech-to-text, long scrolling, and larger Android font size. No cross-account tests on live user data without a separate backup-first plan.

## Next logical checkpoint

After real-device review: refine exact language coverage for named exercise changes, allow safe multi-day structural edits without recreating history, and connect future **optional intake profile context** from PR #71 under the explicit-request > current draft > opted-in profile defaults precedence rule. Continue honoring `docs/TRAINING_SCIENCE_FOUNDATION.md`, `docs/COACH_SWOLECAT_EVIDENCE.md` and `docs/coach-brain/COACH_INTENT_CONTRACT.md`. Cloud Coach Memory remains deferred; no Beta release without separate approval.
