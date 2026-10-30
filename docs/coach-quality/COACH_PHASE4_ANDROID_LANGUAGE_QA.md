# Coach Phase 4 — Android-width usability & cautious coaching-language acceptance

**Status:** development on draft PR #93; Testing v0.93.6 (Android code 142) and Beta are unchanged until a separate signed Testing release. This review is **DOM/CSS automation**, not a claim of physically interacting with an Android phone.

## Goals and changes

The next Phase 4 acceptance stage takes the read-only evidence analysis (PR #91) and opt-in current-plan-versus-history review (PR #92), then improves its real-world usability.

1. **Small-screen readability:** At 320, 360, 390, 430 and 480 CSS px, show separate rows for Routine names and their completed counts; don't place long names and all counts in a single sentence. Keep evidence text and user-supplied names fully readable and wrap long words instead of clipping or adding ellipses.
2. **Usable Android touch actions:** In the review modal, actions have at least 48px high CSS targets; controls stack into one column at widths 430px or less, with a keyboard-focus outline. Review and option buttons remain within the scrollable modal structure rather than becoming fixed overlay controls.
3. **Causally careful copy:** A lower logged frequency means only that fewer sessions appear in the app's logs. Workouts done elsewhere, missing entries or changed availability might explain it. Uneven rotation may reflect preferences. A changed saved Routine or incomplete logs must not be described as a motivation problem, a muscle-growth diagnosis, or proof the original exercise selection is wrong.
4. **Fully optional, reversible suggestions:** `Review Program` / `Review Routine` only navigates to the existing manually saved editor. `Keep as is` temporarily hides one observation for this review but makes no modification; starting a new review reveals observations again. No automatic progression/weight changes, no cloud/account writes, no required changes.

## Test criteria and limitations

Run `scripts/coach-phase4-android-copy-usability-stress.mjs` through the normal full Validate workflow after building the actual web bundle. The script drives the review UI in five screen-sized JSDOM contexts, checks buttons and opening/dismissing/reopening, confirms escaped long dynamic titles, verifies localStorage and saved sessions/programs are byte-for-byte unchanged, and checks that production CSS contains full-width single-column 48px touch-target rules for small screens.

JSDOM does **not** calculate real browser layout, scroll physics, rendered line breaks, Android cutouts or virtual keyboard behavior. Passing this gate makes the review an **Android Testing candidate**, not a substitute for the owner's actual phone walkthrough.

The existing Phase 4 evidence and Program review contracts, frozen Coach generation/repair matrices, cloud/offline tests, and synthetic performance must also pass. Before Beta promotion, perform a real Android walkthrough of Program Options → Coach Audit → Review Training History for short history, long Routine names, schedule vs rotation vs within-session differences, and dismiss/back/reopen.

## Publishing boundaries

The next appropriate release is the existing signed **Swole Cat Testing** channel only; the Android OS install confirmation must remain normal. Preserve permanent Testing signing certificate, local workouts, cloud accounts, Beta package and updater. No automatic Beta promotion.
