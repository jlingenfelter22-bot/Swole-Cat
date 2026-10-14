# Coach v0.93.2, Android floating composer field-review remediation

**Evidence:** Owner-recorded screen capture of signed Testing v0.93.1, October 14, 2026, approx. 44 seconds. Physical Android feedback, *not* a new code acceptance signoff. Never publish notification content from the owner's recording.

## Observed defects

1. The floating **Ask Coach / Refine This Plan** bar overlaps workout content and is visually disconnected from the top of the sheet. At the beginning and near 40s, portions of a workout-day disclosure peek out above the floating bar, while the Coach modal title/header is no longer present in that area.
2. With Gboard opening around the first third of the video, tapping the composer alters which part of the program is on screen and the sheet/keyboard transition is visibly unstable. Reopening/closing shows similar repositioning instead of preserving the reading context. The owner explicitly wants the floating concept preserved but reliably docked, with the keyboard entering smoothly.
3. The old CSS uses a single scrollable **.sheet** containing the header and sticky input, plus an **@media(max-height:540px)** rule that turns sticky into relative exactly when Android keyboard opening makes the viewport small. The root CSS sheet also responds to both dvh and a JavaScript-driven viewport variable, while Android is already using native keyboard resize. These are credible mechanisms; their exact contribution cannot be conclusively apportioned from video alone.

## Engineering change

- Scope to `.modal-mode-coach-program`, leaving regular app/workout dialogs and saved-program editor untouched.
- Keep the **sheet header fixed in its own flex row**, independently of the long program scroll; the **modal body becomes the only scrolling region**. The floating composer is sticky at the **top of that scrolling body**, directly against the header. This closes the visual gap and prevents the workout disclosure from occupying the space above the composer.
- Bottom-anchor the Coach sheet and use **one CSS dynamic viewport height** with safe-top allowance. Continue native Capacitor Keyboard resize. Do not introduce arbitrary scrollIntoView, programmatic recentering, synthetic easing, or repeated keyboard-driven scroll resets.
- Remove the short-height fallback that silently demoted the sticky composer. Keep it sticky even when the keyboard is open.
- Update JSDOM/source contract to check the stationary header, dedicated scrolling body, single viewport contract and no keyboard breakpoint demotion. JSDOM does not prove real device IME transitions.

## Required next phone acceptance

On a **separately approved signed Testing** candidate:

1. Open a new three-day Coach preview, scroll halfway through day one, tap the floating input. Verify the Coach modal header remains visible above a connected floating bar, with no exercise labels visible between header and composer.
2. Tap the field repeatedly with Gboard in and out, including while scrolled near the bottom. The **same exercise/section** should stay in view when the keyboard toggles, except when it physically cannot fit in the reduced viewport. No noticeable repeated scroll pulses, jerks or automatic snap to the top.
3. Scroll with keyboard open, dismiss using Android Back, reopen, and type a short message. Verify the bar remains reachable and never covers the input or action buttons.
4. Expand a long day, swap one exercise on a disposable draft, and verify Save Program/Save + Start Day 1 remain reachable at the bottom. Verify saved-program editing/Cancel, ordinary workout inputs and completed recap scrolling remain unchanged.
5. Record any remaining glitch with exact clock/step and open/closed keyboard state. If possible test large font and landscape.

## Boundaries

**Development-only PR.** No app version bump, signed APK, testing.json, Beta, production user-account changes, cloud schema or data writes. Existing Testing v0.93.1 remains released. Continue broader Coach editing only after real-device interaction is acceptable.
