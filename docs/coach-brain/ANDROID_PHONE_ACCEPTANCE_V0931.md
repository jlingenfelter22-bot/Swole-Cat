# Swole Cat Testing v0.93.1: Owner Android Coach Phone Acceptance

**Status:** Automated CI passed on preceding draft PR #75. Physical Android inspection NOT yet performed. This document is a practical field-testing script, not a claim of phone acceptance.

## Installation and safety

- Candidate is **Testing only**, package `com.jlingenfelter.swolecat.testing`, permanently signed with the unchanged Testing certificate. Intended version: **0.93.1**, Android versionCode **136**.
- Update the installed **Swole Cat Testing** app *in place* using its in-app updater or the versioned signed Testing APK. Android may prompt to allow installation and confirm Update. **Do not uninstall**, clear storage, sign out, switch Google accounts or change Beta.
- Check existing local routines/workout history are present after updating. Avoid testing mutations on important real programs, and use a disposable test-only program if saving is needed.
- If update/signature installation fails, do not force-install or remove the existing app. Record the exact installer message.

## Core Android walk-through

### 1. Keyboard and vertical position (must pass on hardware)
1. On the Coach home view, tap the prompt field. Observe whether the Gboard/IME opens without sudden scroll jumps or unexpectedly recentering the full modal.
2. Enter `Help me build a 3-day split`. Verify Coach asks for split/goal rather than assuming Full Body. Open the optional guidance. At regular font size, choice cards are legible and tappable.
3. Type `Build a 3-day push pull legs program: Monday 30 minutes at the gym, Wednesday 45 minutes with dumbbells only, Friday 75 minutes at the gym, for muscle growth, Track Only.`
4. Confirm the actual **Ask Coach / Refine** composer appears **before** the three-day exercise breakdown. Tap the input, type, hide/reopen keyboard, scroll, then dictate via mic if available. The input must stay reachable without blocking day controls or jumping to the middle of long content. Try both Gboard suggestions and the Android Back key.
5. Scroll the long generated plan with day one expanded and days two and three collapsed. Open Wednesday, close it, then reopen keyboard. Verify no giant repositioning, unscrollable areas, hidden action buttons, or accidental tap-throughs.
6. Optional device-size check: landscape orientation or a larger system display/font setting. No clipped wording, unusable prompts, or fixed controls obscuring content.

### 2. Day edits and preview recovery
1. Tap **Adjust day** for Wednesday; check 45 min/dumbbells prefilled and other-equipment field hidden.
2. Enter invalid custom equipment. Apply should explain the problem and leave current plan untouched.
3. Choose dumbbells again, change Wednesday to 55 min, apply. Only Wednesday changes.
4. Use the visible Ask Coach composer: `Wednesday 50 minutes`. Monday stays 30, Friday stays 75, Track Only stays selected.
5. Verify **Save Program** and **Save + Start Day 1** remain separately understandable and tappable. Avoid saving a disposable program unless intentionally doing the optional edit test.

### 3. Modal recap scroll reset
1. Only if a throwaway workout can be safely completed, finish it normally, scroll the completion recap to its bottom, close it, then open a different long modal or another recap.
2. The newly opened modal/recap should begin at its **top**, not retain the previous scroll offset.

### 4. Saved Program, Edit with Coach
1. In Programs, choose an existing *test-only* program. Both the card and menu should visibly offer **Edit with Coach**.
2. Open it; verify it already knows the program's schedule, day names and exercises and does NOT restart first-time intake.
3. Propose `Wednesday 45 minutes`. Verify the review shows *unsaved proposed changes* and that Monday/Friday remain untouched. Cancel; reopen and confirm no change saved.
4. On a disposable program only, propose a scoped change and use **Apply reviewed changes**. Confirm unrelated program days, the next day index and all completed workout history remain intact.
5. Verify an active workout in the program blocks editing. Do not switch cloud accounts to test account-switch protection on your actual phone.

## Result recording

Mark **PASS/FAIL/NOT TESTED** for: installation & history; keyboard open/close; visible refinement composer; long-list scroll; day edit; save controls; recap reset; saved-program review/cancel/apply; voice dictation.

For each failure: record phone model, Android version if known, keyboard app, portrait/landscape, app version, steps to reproduce and whether the keyboard was open. Screen recording with spoken feedback is ideal. Be careful not to expose account identifiers or private workout history.

## Signoff gates

- [ ] Candidate branch and release PR CI passed
- [ ] Permanently signed APK and same package/cert verified by Android workflow
- [ ] Release asset and updates/testing.json digest agree
- [ ] In-place user installation reported
- [ ] Actual device keyboard, modal, touch, scroll, voice behavior reviewed
- [ ] Actual device owner acceptance or follow-up defect list recorded
- [ ] **Beta remains untouched**; full-program conversational redesign remains postponed
