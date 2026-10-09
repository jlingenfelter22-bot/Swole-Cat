# Swole Cat Current State

## Latest milestone: 2026-10-09 · Testing v0.87.8 Sleek Action Tray Polish

**Current signed Testing:** v0.87.8 / Android build **131**, on `main`, updater manifest and permanent signing identity verified.
- PR #52: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/52, squash merged at `627c836040e1be1de961d3be485001cd791f8706`.
- PR full validation PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38005935548; main full validation PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38006156361.
- Android signed build, certificate check and Testing updater publication PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38006156392.
- Release: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.8.
- `updates/testing.json`: enabled version `0.87.8`, versionCode `131`, package `com.jlingenfelter.swolecat.testing`, signed APK SHA-256 `9a2e0b7632fbba4c2d6bf9c1063106d11b59f728cdd5be3672789cf0a3dea81a`, original Testing certificate SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta unchanged:** v0.73.1 branch `beta` SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`. Never promote without explicit owner direction.

### Owner-approved direction

Android screenshot of v0.87.7 confirmed the full-width rail with raised central timer, solid concealed action pocket and compact controls was finally working visually. Owner requested *pure polish*: slim the visible −30, +30 and Skip faces further without shrinking real touch targets, sharpen them, shorten the lift just a little, and fill the empty left/right exposed pocket space with **restrained combination of A (technical engine-bay details) and C (minimal cyan/violet ambient glow)**. No extra buttons or gimmicky bright illustration. Preserve stealthy collapsed notch, whole-rail rigid shape, nav tab positions, all training/logging behavior and keyboard handling.

### v0.87.8 implementation

- Visual action key face height reduced from **34px to 32px** by `inset:5px 2px` pseudo-faces inside the existing **42px actual touch targets**. Low-profile sharply cut top corners, restrained border, less gradient bulk and tighter font weight/letter spacing.
- Expanded control shelf reduced from **53px to 49px** with adjusted padding. Same entire-rail lift is only **53px** instead of 57px. Original contour and 154px collapsed notch are unchanged.
- Left/right exposed *nav-owned* opaque pocket gains CSS-only side pseudo-elements, symmetrical subtle service-panel seams, micro vent hatches, very faint cyan on left and violet on right. They are noninteractive, opacity 0.46 normally, 0.28 on narrow screens, never part of the idle look, no added text or icons.
- No JS interaction changes, new controls, data changes, keyboard/scroll semantics changes, Beta changes or migration. `scripts/rest-tray-stress.mjs` extended to guard new visual sizes, lift height, subtle decorative details and no changes to rigid rail transform.
- All existing workout, Coach, keyboard, cloud and timer regressions green.

### Next real-phone acceptance

Install Testing v0.87.8 / build 131 via Settings > App & Updates. Expand rest after a set, evaluate visible button slenderness, the slightly reduced lift and the quiet side-bay etched cyan/violet details; confirm they are not too busy and the nav rail still lifts as one unchanged shape. Test button hits, collapse, scroll, keyboard and skip. Real Android visual acceptance is still pending; await screenshot/walkthrough and owner feedback before further design changes.

Older sections below are historical.


## Latest milestone: 2026-10-09 · Testing v0.87.7 Filled Action Pocket

**Latest signed Testing:** v0.87.7 / Android build **130**, published and verified in the Testing updater.
- Implementation PR #51: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/51; squash merged into `main` at `a92b621c7536169b83bce037907018929dcb7490`.
- Full PR validation PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37993571101; main validation PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37993817592.
- Signed Android build, certificate verification and release publication PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37993817611.
- Release: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.7.
- `updates/testing.json`: version `0.87.7`, versionCode `130`, package `com.jlingenfelter.swolecat.testing`; APK SHA-256 `7a52c0f6cf5a6e44b1dd4d7bd752caec380102886b749b6b8b3a5899b32e5622`; unchanged permanent Testing signing SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta still untouched:** v0.73.1, `beta` SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`. Require explicit owner approval for any promotion.

### Why the micro-pass shipped

User shared a real Android v0.87.6 screenshot in expanded timer state. The *entire full-width rail lifting rigidly without changing contour* was finally correct, but the area beneath was visibly transparent with the workout showing through; three buttons were overly chunky and forced more vertical lift than necessary. Owner asked for a properly filled dark hidden action pocket, smaller visually crisp clickable buttons, and a slightly shorter upward movement. Preserve the agreed idle stealth notch, fixed contour, exact same full-width rail movement, separate stationary nav tabs, no forced workout scroll when expanded.

### v0.87.7 implementation

- Added `#restDockPocket`, an aria-hidden and pointer-events-none **nav-owned full-width opaque backing** under the lifted rail. Its dark, theme-matched fill is solid hex (not transparency). It grows from the nav top using `scaleY` with the identical easing and duration as rail lift, covering the formerly see-through area in expanded mode. Hidden/retracted at idle.
- Removed the old negative-z-index `#restTimer.expanded::before` backing responsible for the apparently hollow/transparent rectangle. Maintained one unchanged SVG crest silhouette in both states, with an opaque fill while lifted.
- Shortened lift from `62px` to **57px**, action shelf from `59px` to **53px**. Three action buttons keep **42px real hit targets**, while their crisply beveled *visible faces* are **34px tall** inset within those targets. Smaller labels/gaps, same −30/+30/Skip action semantics.
- Rest countdown, collapsed width/height and nav-relative position, full-width rigid motion, keyboard avoidance, reduced-motion fallback, focus/scroll behavior, workout data/progression and Beta unchanged.
- `scripts/rest-tray-stress.mjs` checks opaque pocket semantics, fill, reveal from nav, 57px shared lift, compact 34px visible faces /42px targets, preserved SVG path and interactions. Full test suite passed.
- **Actual Android appearance pending:** tests do not guarantee aesthetically correct fill or alignment. Wait for owner's real-phone screenshot/video.

### Immediate next step

Install Testing v0.87.7 with Settings > App & Updates. Expand during a workout, confirm no workout content shows through the newly solid rail pocket, buttons are tighter and contained, full rail still rises rigidly, and collapse restores approved stealth idle appearance. Check −30/+30/Skip, nav tabs, keyboard and no unexpected scroll. Wait for feedback before another polish pass.

Older milestone sections below are historical.

## Latest milestone: 2026-10-09 · Testing v0.87.6 Whole-Rail Lift

**Latest signed Swole Cat Testing:** v0.87.6, Android build **129**, released through permanent Testing signing and updater feed.
- PR #50: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/50, squash-merged into `main` as `8fb0feb4e2e3a4b7da9fd9284589eb82649738e3`.
- Full PR regression PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37987273404 (initial failure was a CSS keyboard-hiding conflict, fixed before final successful run).
- Full main regression PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37987624116.
- Signed Android build and updater publication PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37987624164.
- Signed APK release: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.6.
- `updates/testing.json`: version `0.87.6`, versionCode `129`, package `com.jlingenfelter.swolecat.testing`, APK SHA-256 `48a2f2fed2df6846ee51ac354a8b934b568823043c05398d0b1d2216ce3463c5`, permanent Testing signing certificate SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta unchanged:** v0.73.1 on `beta`, SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`; no promotion without explicit owner approval.

### Owner's v0.87.5 feedback, clarified target

Owner provided actual Android screenshot showing expanded timer as an oversized crest with long sloping sides, and initially received a suggestion to protect Complete Set. Owner corrected the design intent: **covering Complete Set while actively expanding is fine and expected**. The real issue was the *shape morphing*. The desired motion is that the **entire full-width rail fixture** (left rail, raised center countdown, right rail) translates upward together, keeping EXACTLY the same line silhouette. Controls are revealed underneath the lifted contour; on collapse it slides down as one fixture. The five nav buttons themselves must remain stationary.

### v0.87.6 implementation

- Preserves the approved v0.87.4/5 stealth idle state, center countdown 154px wide (~35px tall), measured nav anchoring, fixed ~17px recess, and the nav-owned responsive single SVG housing.
- The original single full-width nav path and SVG viewBox are now **constant** across expansion. `nav.rest-rail-raised .rest-nav-housing` translates the complete rail upward using `--rest-rail-lift:62px`; `#restTimer.show.expanded` moves upward by **the identical CSS variable**, with identical duration/easing. Never redraw the path to make the center bump taller.
- `−30`, `+30`, `Skip` live in a fixed absolute shelf just below the countdown. This shelf reveals with a small fade as the whole rail lifts. It does not increase the timer's measured height or modify the SVG shape, unlike v0.87.5.
- Deliberate expansion no longer triggers workout auto-scroll. Temporary overlap with Complete Set is explicitly user-approved. Countdown remains visible on ordinary workout scroll, and the nav buttons remain stationary.
- Keyboard hiding takes priority over the new block layout, fixed after a failing regression run. Reduced-motion setting retains instant transitions. Timer math, workout logging, progression, cloud and signed update system unchanged.
- `scripts/rest-tray-stress.mjs` now checks whole-width rail lift and equal translations, absolutely positioned controls, exact same SVG path/viewBox in both states, no forced workout scroll, accessible buttons, keyboard and rest-stop behavior. Full PR and main validations passed.

### Next real-phone acceptance

Owner installs Swole Cat Testing v0.87.6 through Settings > App & Updates and opens rest timer during an active workout. Critically verify **left line + timer crest + right line all rise the same distance**, with no swelling, stretching or angled tent silhouette, and reveal the 3 controls beneath the unchanged shape. Collapse and watch all segments slide down as one unit. Check stationary nav tabs, keyboard handling and tap targets. Aesthetic and motion still need actual Android validation, no further design pass until owner feedback.

Older milestones below are historical.

## Latest milestone: 2026-10-09 · Testing v0.87.5 Sliding Rest Dock

**Latest signed Testing:** v0.87.5, Android build **128**, merged into `main`, signed APK and in-app Testing updater verified.
- Implementation PR #49: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/49; merged `68ba2c51f4cd4e0b566dbfe331904e53963db18f`.
- Full PR regression PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37979464907.
- Full main regression PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37979808037.
- Signed Android build + publication PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37979808085.
- Signed release: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.5
- `updates/testing.json`: enabled, `0.87.5`, build 128, package `com.jlingenfelter.swolecat.testing`, APK SHA-256 `8ed4613c2d29cd355c4c1789d2d20101bb23f8abbb3f8772a7949d685d638aab`, unchanged permanent Testing cert `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta untouched**: v0.73.1, branch SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`. Never promote without explicit owner approval.

### Owner's Android video feedback

Video file `1000004562.mp4`, ~96 seconds, reviewed frame-by-frame. User **loves** the v0.87.4 recessed, stealthy idle notch, but disliked (1) countdown disappearing during scroll because collision-aware passive hiding was too sensitive, and (2) clicking Expand turning the narrow built-in notch into a separate wide popup. Asked to leave countdown visible throughout workout scrolling and to **raise the existing same-shaped panel just enough to reveal −30/+30/Skip underneath**, then slide it back down to its recessed position. No new colors/shapes or larger width.

### v0.87.5 implementation

- Retains the nav-owned unified SVG housing from v0.87.4, narrow ~154px wide timer in BOTH collapsed and expanded states (146px on narrow screens). The nav crest remains active while expanded.
- The three existing adjustment/Skip actions remain a three-column row within the same footprint. CSS animates the action shelf's height over ~260ms. As it grows, the whole anchored timer moves upward. `followSlidingRestHousing()` redraws the **same SVG contour** against the live measured height across the animation, rather than replacing it with a different panel.
- Removed action-position-based scroll hiding, collision `rest-notch-obstructed` fades, and passive shifting. The timer stays pinned at a fixed recess near 17px as the user scrolls. Note design tradeoff: exceptionally tight scrolling positions may bring active content near the fixed countdown, so Android acceptance should verify Complete Set and nav hit targets remain usable; the old automatic disappearance is intentionally gone.
- Only deliberate expansion may invoke the existing workout focus clearance scroll on small screens. Keyboard concealment and reduced-motion behavior retained; the timer is still separate from the five navigation tabs.
- Existing timing, history, progression, cloud and Beta logic unchanged. `scripts/rest-tray-stress.mjs` validates scroll persistence, same-width expansion, shared housing geometry in both states, timing controls, keyboard accessibility and no unwanted passive scrolling. All regression suites green.

### Next real-phone acceptance

Install Testing v0.87.5 / build 128 through Settings > App & Updates. Start a multi-set workout, complete a set and scroll up/down, verify countdown **remains visible without shifting or jumping**. Tap to expand: same narrow body should slide upward to reveal all three controls; tap to collapse: it should settle into the original stealthy resting spot. Verify usable touch targets, Complete Set and nav access, timer auto-end, keyboard hiding. Real Android video is final judge of smoothness; await owner feedback before more changes.

Older milestones below are archival.


## Latest milestone: 2026-10-09 · Testing v0.87.4 Unified Rest Dock Housing

**Signed Testing now:** v0.87.4, Android versionCode 127. Source merged into `main`. Signed APK release, permanent Testing identity and in-app update feed verified.
- PR #48: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/48, squash merge commit `551ce9802eb48d6e98810a4455ec97eb89072c57`.
- PR full regression PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37969150495.
- Main full regression PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37969468006.
- Signed Android Testing build, signature check and update publication PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37969467800.
- Release: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.4
- `updates/testing.json`: v0.87.4 / build 127, package `com.jlingenfelter.swolecat.testing`, APK SHA-256 `d12da094a1ecc7149bd6288c8323b36e382ae05d484b6f4ec9ce6ef383983431`, permanent Testing signing certificate SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta unchanged:** branch `beta` at `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`, v0.73.1. Never promote without explicit owner permission.

### Reason for v0.87.4

Owner evaluated v0.87.3 on an actual Android screenshot. Timer size, location, behavior and Complete Set clearance remained approved, but the panel's **construction still looked clunky**: separate angled wings, timer/nav outlines not actually sharing a silhouette, and a dark rectangular panel base visible over the navigation. Owner approved a *structural visual* fix rather than more glow or decoration.

### Implemented visual architecture

- The existing semantic five-tab `<nav>` now owns a **single responsive SVG housing** (`#restNavHousing` with a single continuous contour path and matching fill path). This shared shape follows the full top rail, smoothly rises around the centered countdown notch, and returns to the rail. Nav width, original notch width and existing recess are measured by `syncRestDockHousing()`, invoked through current rest seam synchronization/resize/scroll handling.
- The collapsed `#restTimer` keeps **exactly the v0.87.2/3 footprint**, width ~154px, min-height ~35px, unchanged bottom offset/recess, countdown text and single expand affordance. Its own opaque background, competing top/side borders, pseudo-element wings, and panel shadows are now suppressed only in collapsed state so the timer appears inside the one nav shell instead of pasted atop it.
- The original nav top highlight is suppressed while the one-piece housing is visible; default nav styling returns if timer is stopped, expanded, hidden for keyboard, or temporarily obscured by Complete Set collision avoidance. The new path remains decorative, noninteractive and aria-hidden. All nav tab actions stay unchanged.
- Expanded `−30`, `+30`, `Skip`, timer math, keyboard hiding, Smart Workout Focus, data/progression, and rest-target prescriptions unchanged.
- `scripts/rest-tray-stress.mjs` extended for single-contour geometry, zero legacy wing visibility, transparency of collapsed panel, nav state cleanup and accessibility. Full PR/main suite green.

### Next acceptance

User installs Testing v0.87.4 through Settings > App & Updates and sends a real-phone screenshot from the natural workout position. Evaluate whether nav/timer now share one surface and stroke, without stray wings/rectangle, and confirm Complete Set, timer expansion, keyboard and five nav tabs still behave correctly. No claim of visual perfection until that actual Android review. Await feedback before making further cosmetic changes.

Earlier sections below are historical, superseded by this Testing checkpoint.


## Latest milestone: 2026-10-09 · Testing v0.87.3 Rest-Notch Seam Polish

**Latest signed Testing:** v0.87.3, Android versionCode **126**, signed APK and updater manifest published and verified.
- PR #47: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/47, squash merged into `main` at `f90008226c4e9db3bc14f0f86ed477cf207da4e1`.
- Full PR validation PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37966245495.
- Main validation PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37966558650.
- Signed Android build, signature verification and Testing channel publication PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37966558602.
- Versioned release and signed APK: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.3.
- `updates/testing.json`: schema 1, enabled Testing, version `0.87.3`, build `126`, package `com.jlingenfelter.swolecat.testing`, APK SHA-256 `97274f6a1a1d27b1161035aaef5f68c9e25f0906b78106374cb7e4a3f0b6a340`, permanent Testing certificate SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta untouched:** v0.73.1 branch `beta` SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`; do not promote without explicit owner approval.

### Why v0.87.3 shipped

Owner approved v0.87.2 passive notch **size, location and behavior** after Android screenshot, but said the timer still appeared like a sticker: floating hooked side shoulders and a visible straight nav top rail behind it. They explicitly requested a highly polished visual blend, not another movement/resizing or any new training behavior.

### Implemented visual-only changes

- **No changes** to passive dimensions (~154px x 35px), recess position, collision avoidance, user-controlled expansion, countdown, time adjustments, workout viewport, keyboard handling or logging. No changes to training prescriptions, progress, data, cloud, signing.
- The navigation gets a temporary `rest-notch-integrated` CSS class only while the passive timer is visible and not obstructed, expanded, or hidden by keyboard. Its top border and highlight are interrupted cleanly at the 154px notch plus two 15px angled shoulder transitions. When timer stops, expands or is hidden, full normal nav rail returns.
- The timer's outlined sticker border and separate heavy neon glow were softened to match nav top ink and surface gradients; side hooks became short *angular* bevels that end exactly at the nav top and do not curl into the housing. These changes are in the final `v0.87.3 // CONTINUOUS REST NOTCH SEAM` block of `src/styles/03-polish.css`.
- The `scripts/rest-tray-stress.mjs` regression now tests notch/nav seam state on rest, expansion, collision, recovery, keyboard hide and stop, along with CSS contract that preserves exact v0.87.2 dimensions and working controls. All historical regression tests passed.

### Immediate next action

User updates Swole Cat Testing to v0.87.3 through Settings > App & Updates. Inspect resting timer in the exact comfortable workout viewport: whether the upper bar and notch now look like a single piece, without detached curved hooks or overbright sticker edges; check the expanded state, and confirm nav, keyboard, and Complete Set remain untouched. Await real-device screenshot/feedback before declaring aesthetic acceptance or building another pass.

Older milestones below are historical, this is authoritative Testing baseline.


## Latest milestone: 2026-10-09 · Testing v0.87.2 Recessed Rest Notch

**Latest signed Testing:** v0.87.2 / Android versionCode **125**, APK published and updater feed verified.
- PR #46 merged into `main` at `246de256b66c52868518553bd279bbe358a9b271`: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/46.
- Branch validation PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37953019259.
- Main validation PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37953366178.
- Signed Android build and release PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37953366078.
- GitHub Pages deploy PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37953366172.
- Release https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.2.
- `updates/testing.json`: enabled, version `0.87.2`, versionCode `125`, package `com.jlingenfelter.swolecat.testing`; APK SHA-256 `8ce83daa5e60b63ae91bf4e7e1cb6181922c656c8d0daec6e095c5f51b2603c0`, Testing signing certificate SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta unchanged:** branch `beta`, SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`, v0.73.1. No promotion without explicit owner instruction.

### Motivation and exact v0.87.2 decisions

User reviewed v0.87.1 on physical Android and said that despite smaller styling, the countdown still obscured the bottom of **Complete Set** in the natural workout viewport. The user approved trying a fundamentally different *recessed notch* instead of shrinking the same floating tray.

- Passive state now ~154px wide and ~35px tall, positioned partially **inside** the upper edge of bottom nav's visual housing, separate from `<nav>` and its five tabs. Existing angled, luminous cyan-violet cyber styling stays.
- The notch's allowed recess measures the center nav icon top rather than covering the center tab icon. It dynamically checks Complete Set's real screen position; when clear, it remains available without moving the workout. If physical space becomes impossible, the passive notch yields temporarily rather than covering Complete Set.
- Passive rest is no longer deducted from `focusWorkoutViewportAfterAdvance()` scroll clearance. The **user's chosen workout viewport wins**. Normal scroll events may reposition the notch within the available nav strip, not the workout.
- Only when the user *intentionally opens* the timer does it expand upward to the ~270px control tray and reserve screen clearance for `−30`, `+30`, `Skip`. The button and workout data logic are unchanged.
- Keyboard hiding, reduced motion, nav safe-area measurements and true countdown semantics retained.
- `scripts/rest-tray-stress.mjs` now checks nav attachment, no passive scrolling, no collision in near and impossible layouts, recovery after collision, expanded button clearance, keyboard and motion contracts. All regression checks passed.

### Next action

Owner installs Testing v0.87.2 via Settings > App & Updates and assesses the passive notch with Complete Set visible, nav icon hit targets, expand/collapse, keyboard and any situations where the timer temporarily yields. The desktop/DOM tests cannot prove real-device visual appearance. **Wait for feedback; don't start another redesign by assumption.**

Older sections below are historical and superseded by this latest Testing checkpoint.


## Latest milestone: 2026-10-09 · Testing v0.87.1 Compact Cyber Rest Timer

**Latest signed Swole Cat Testing:** v0.87.1 / Android versionCode 124, published and verified on the Testing channel.
- Owner-approved micro-pass after a real Android v0.87.0 screenshot showed the integrated rest timer remained too large and visually flat. User requested a significantly smaller resting state, sharper cyberpunk identity within current theme, and adjustments only after tapping to expand.
- PR #45: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/45 (merged at `8a95982ed79aec6cfb27a53433bd0588d9832565`).
- PR full validation PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37949119980; main full validation PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37949452767.
- Signed Android workflow PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37949452821.
- Published release: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.1.
- `updates/testing.json`: version `0.87.1`, versionCode `124`, package `com.jlingenfelter.swolecat.testing`, APK SHA-256 `2e2f592616792b8f5ab282810f42b18e73e044e64754b5ac0e95e43691d12ac9`, persistent Testing signing SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta untouched**: `beta` SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3` (v0.73.1). Do not promote without explicit owner instruction.

### Changes shipped in v0.87.1

- Resting state now ~188px wide and ~44px tall (172px variant for narrow devices). Only REST label, dynamic countdown, expand caret. Full-width tray and collapsed quick `+30` removed.
- Expanding creates an ~282px command pod (252px narrow) with existing `−30`, `+30`, `Skip`. Countdown math and logged set behavior unchanged.
- Dark nav-matched panel now includes asymmetric angular top corners, etched microtexture, subtle layered shadow/inner depth, violet-to-cyan luminous trim and a small status light. The short curved shoulder seams remain visually connected to the nav, but timer stays separate from the five semantic navigation tabs.
- Preserves compact/expanded accessibility, keyboard concealment, reduced-motion alternative, nav geometry alignment and Smart Workout Focus/Complete Set clearance.
- `scripts/rest-tray-stress.mjs` now tests collapsed-only countdown and expanded time controls, size/style guards and no regression. Superseded assertions in `scripts/beta-first-user-clarity-stress.mjs` and `scripts/focus-mode-qol-stress.mjs` updated to new owner-approved design. Entire suite and Android signing checks passed.

### Immediate next task

Owner updates **Swole Cat Testing** to 0.87.1 via Settings > App & Updates, evaluates real-phone visual size, sharp styling, closed countdown and expanded actions, and confirms no interference with workout Complete Set, nav tabs or number keyboard. Await screenshot/walkthrough and owner feedback before another change. Earlier headings below are historical and superseded.


## Latest milestone: 2026-10-08 · Testing v0.87.0 Rest Timer Navigation Tray

**Latest signed Swole Cat Testing:** v0.87.0, Android build 123, published and verified in the Testing in-app updater feed.
- Implementation: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/44, merged into `main` at `53d136dce6d365caf5d6286d6613a526d937e0c7`.
- PR validation PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37870200439; main validation PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37870364772.
- GitHub Pages PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37870364736.
- Signed Testing Android build, signature verification and channel publication PASS: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37870364765.
- Signed APK release: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.0
- `updates/testing.json`: v0.87.0, code 123, package `com.jlingenfelter.swolecat.testing`. APK SHA-256 `0cb09996b7eb515076394933d255d16286c11a03d2db3cf9b6f0bc7f8618f538`; original permanent Testing certificate SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta was not touched**. Branch `beta` remains `7ac10d9e8eecdf9570221d96250a16c2cc5459d3` (v0.73.1). No Beta promotion without explicit owner permission.

### Why v0.87 exists and what changed

After approving v0.86 Smart Workout Focus on a real Android screenshot, the owner highlighted the old rest timer as a disconnected floating pill. The approved design direction is **a separate tray visually emerging from the existing bottom navigation shell**, *not* an additional navigation tab or a timer built inside nav. Yellow markup on user screenshot showed the suggested shoulders/silhouette, not a literal yellow theme.

- Rest timer stays outside semantic `<nav>`, which retains all five original app tabs.
- The compact tray has rounded shoulder seams, dark cyan/violet/nav panel language, a sliding emerge/retract treatment, and a visible `Rest` countdown + quick `+30` action.
- Opening the tray expands *upward* with existing `−30`, `+30` and `Skip` actions. No rest prescription/progression changes and no new pause algorithm were introduced.
- Dock positioning measures the actual Android nav geometry including inset: CSS variables `--rest-nav-offset`, `--rest-nav-center`, `--rest-nav-width` updated on timer start/viewport resize.
- Existing keyboard focus hiding and reduced-motion support preserved. `aria-expanded`, `aria-hidden`, and keyboard tab order reflect collapsed/expanded state.
- Smart Workout Focus takes visible tray height into account before positioning the Complete Set button. Opening the expanded tray will make a minimal extra scroll when necessary rather than obscuring the primary action.
- New `scripts/rest-tray-stress.mjs` verifies dock alignment, semantic nav separation, countdown adjustments, expand/collapse accessibility, short-device Complete Set clearance, keyboard hiding and animation fallback. All established regression checks passed.

### Immediate next device acceptance

Install Testing v0.87.0 / Android build 123 using Settings > App & Updates. Start a workout and complete a set. Visually assess whether the compact rest tray actually *flows out of* the existing nav, how smoothly it rises, legibility, tab tap-target clearance, timer and quick add, expansion and Skip, and Complete Set accessibility. Try opening the number keyboard during rest to verify it hides and reappears. Test a shorter screen and with reduced motion if useful. Adjust only after owner walkthrough; automated DOM checks do not prove the aesthetic result on device.

Earlier milestones remain historical; this is the authoritative Testing baseline.


## Latest milestone: 2026-10-08 · Testing v0.86.0 Smart Workout Focus

**Latest signed Testing:** v0.86.0 / Android build 122, signed APK published and updater feed verified.
- Approved implementation PR #43: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/43 (squash merged).
- PR full validation passed: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37868479708; main validation passed: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37868679554.
- Signed Android build/signing and release publication: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37868679589 (success).
- Release and signed APK: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.86.0
- `updates/testing.json` enabled for v0.86.0, build 122, package `com.jlingenfelter.swolecat.testing`, APK SHA-256 `21645a2920a235ec6c0df1528756f0a6cd855f27bac6e3cae587220e01093183`, persistent Testing signing cert SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta untouched:** `beta` remains at v0.73.1, commit `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`; no promotion without explicit user approval.

### Why this pass shipped

User likes v0.85.0's one-tap **Repeat Previous Set Values**, but on physical Android, revealing its full-width row after Set 1 caused Complete Set to require scrolling. The user supplied a screenshot of a comfortable viewport where the sticky exercise header, Coach Target, set rail, numeric inputs, Repeat and Complete Set fit together with the earlier session overview scrolled offscreen. User specifically rejected a cryptic side-by-side "Repeat" button and approved viewport-focused navigation.

### v0.86.0 implementation

- Keep **both full-width Repeat Previous Set Values and Complete Set controls** unchanged and vertically separated, with explanatory Repeat wording.
- After completing a set or moving to a different exercise after work has been logged, measure the actual sticky exercise header, Android viewport, primary action and bottom navigation, then scroll only the minimum amount necessary to keep the action visible. Normal renders, tapping Repeat, and intentional manual scrolling do not force another auto-position. Reduce Motion uses instant movement.
- Overall workout completion counts and a thin progress indicator now live within the existing sticky exercise navigator, rather than requiring the user to keep the top overview in frame. The header's new **Session note** shortcut opens the full Coach note without toggling exercise navigation.
- New `scripts/workout-viewport-focus-stress.mjs` covers startup, after-first-set focus, unchanged Repeat semantics, no redundant positioning, accessible progress, and modal access. All historical regression tests passed.
- No changes to workout progression, logged history, cloud, signing, or Beta.

### Next real-device acceptance

Install v0.86.0 via the Testing in-app updater. Use a multi-set routine: start with the session overview visible; complete Set 1; verify Swole Cat automatically scrolls into the compact screenshot-like composition, with Repeat and Complete Set both visible and tappable; continue across further sets and an exercise transition; try manual upward scrolling, Session note access, smaller screen / keyboard and stopwatch/carry layouts. Evaluate feel and avoid claiming perfect zero-scroll across every viewport until Android testing confirms. **Do not implement additional changes until feedback.**

Earlier milestones below are historical records; this block is the authoritative latest Testing baseline.


## Latest milestone: 2026-10-08 · Testing v0.85.0 measurement logging UX

**Latest signed Swole Cat Testing:** v0.85.0, Android versionCode 121, published and verified.
- Implementation: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/42 (merged).
- Full source validation, **all 86 checks passed**: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37841888691.
- Signed Android Testing release: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.85.0
- Android signing and manifest workflow: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37842236981 (success).
- APK: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/download/testing-v0.85.0/swole-cat-testing-v0.85.0-signed.apk
- `updates/testing.json`: v0.85.0, code 121, package `com.jlingenfelter.swolecat.testing`. APK SHA-256 `7271944042cf670ebad4b31c7dac71c11cea4a7a44266e33fd2f85870d3d4fd7`, certificate SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta untouched**, branch SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`. No Beta promotion without explicit owner instruction.

### What shipped after the user's 82-second silent walkthrough

- **Targets are not results.** New timed/distance sets start with blank actual values, while the suggested goal stays separate. Completing a set requires an actually entered/timed duration or distance.
- Added an optional **Start/Stop hold stopwatch**. It does not auto-complete a set; Stop saves measured seconds immediately. If the workout is paused, backgrounded or the set is left, elapsed time is captured and the set stays incomplete. Manual time entry remains available.
- Full-width stacked, responsive numeric controls for loaded carries and timed holds. Unweighted movements no longer occupy input space with a redundant zero-weight field. Keyboard focus hides the floating rest timer until the user finishes typing.
- **Prior set today** is labeled separately from **last workout**, with a one-tap Repeat Previous Set action. First exposures have human wording instead of "No comparable prior set."
- Default imperial carry goals use natural units, for example 30 ft instead of the raw 32.8 ft conversion. Suggested recovery/rest durations are shorter for newly created hold/carry routine exercises; existing explicitly saved values remain intact.
- Loaded carry fields explain load meaning ("Weight per hand" for dumbbells/farmer carries, working hand for suitcase carries, total bar or sled load when applicable). Empty load is not silently interpreted as an explicitly logged zero.
- Mixed-workout recaps independently show total reps, hold seconds and distance. They no longer use misleading dismissal of a timed/distance workout because external weight-times-reps volume is zero. Historical "Total reps" naming remains compatible; long guidance labels wrap rather than truncate.
- Saved routines, existing workout history, guided program/deload phases, load direction and weight-autofill behavior preserved.
- New `scripts/logging-ergonomics-stress.mjs` verifies targets versus actual values, stopwatch Start/Stop and pause, carry entry guard, same-session repeat, responsive field selection, keyboard state and mixed-metric recap. Old v0.84 and v0.83 tests updated only where semantics and labels intentionally changed.

### What remains to verify and refine

- Test all changes on a physical Android phone in a real workout: hold start/stop while hands busy, rest overlay + keyboard, loaded carry labels, mixed recap and set editing.
- Future elective improvements: combined time+distance in one set, timed interval/haptic cues, unilateral per-side tracking, additional exercise-specific rest presets, equipment-based microincrements. Do not claim these exist today.
- No Beta promotion without owner approval.

This section is the current authoritative baseline; earlier milestone sections below remain as historical record.


## Latest milestone: 2026-10-08 · Testing v0.84.0 movement intelligence

**Latest signed Swole Cat Testing:** v0.84.0, Android versionCode 120. Signature, release APK and in-app updater manifest verified.
- Implementation PR: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/41 (merged).
- Signed Testing release: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.84.0
- Signed APK: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/download/testing-v0.84.0/swole-cat-testing-v0.84.0-signed.apk
- Full source validation: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37834876971 (success, includes 308-profile and metric end-to-end tests).
- Android signed release and updater publication: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37835229873 (success).
- Testing update manifest `updates/testing.json`: v0.84.0, code 120, package `com.jlingenfelter.swolecat.testing`, SHA-256 `a9c10814d12c75a4d652c48d59685f0922681df53f8b5b9efea9da1fc37f9cc9`, persistent signing cert `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta untouched**, branch SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`. Do not promote without explicit owner approval.

### Phase 1 exercise intelligence shipped in Testing

- One deterministic, offline movement profile resolver for **308 built-in exercises**, combining movement family, equipment, training goal, exercise-specific metadata and optional explicit routine overrides.
- Introduced named **Dead Hang** and proper `durationSeconds` sets for Dead Hang/Plank/RKC Plank/Side Plank; `distanceMeters` sets for carries and sled moves. Distance displayed in ft for lb preference and meters for kg preference; stored as canonical meters. Regular reps/bodyweight, weighted pullups and assisted counterweight progress from v0.83 preserved.
- Guided timed/distance recommendations and records, Track Only independence, user-editable goals and ranges. Routine editor, active set UI, recap, History, exercise progress, substitutes, sharing/imports all interpret these measurements rather than inventing reps.
- Legacy rep-based Plank logs continue to mean reps and remain editable. Old user workout history is not rewritten; weight-first-session autosave/autofill fixed and tested.
- Verified all built-in profiles have valid safe measurement classifications, and Dead Hang anatomy participates in 308-exercise heatmap audit.
- Full existing regression suite succeeded, including v0.83 assisted/bodyweight, v0.82 guided deload, Coach, sharing, active workouts and longstanding weight-autofill testing.
- Canonical design reference: [EXERCISE_INTELLIGENCE_FOUNDATION.md](EXERCISE_INTELLIGENCE_FOUNDATION.md), alongside [EXERCISE_LOAD_BEHAVIOR.md](EXERCISE_LOAD_BEHAVIOR.md) and [TRAINING_SCIENCE_FOUNDATION.md](TRAINING_SCIENCE_FOUNDATION.md).

### Next work requiring field review / new approval

1. Android Testing hands-on walkthrough: Dead Hang seconds only, Plank duration, Farmer Carry distance and weight, Pull-Up reps only, assisted/weighted Pull-Up, customizable exercise measurement.
2. Check actual performance, text wrapping and comfort of these numeric inputs on phone; validate progress/history editing and continuing partially complete workouts.
3. Potential additional features **not yet implemented**: start/stop timer for holds, simultaneous distance plus duration, per-side reps, machine equipment steps, extended individual movement exception audit, and profile-specific estimates beyond family heuristics.
4. Keep Testing and Beta isolated. Beta promotion only when explicitly requested.

Historical milestones below may include older version numbers. This block is the authoritative current baseline.


## Latest milestone: 2026-10-08 · Testing v0.83.0 exercise-aware loading

**Current live Testing build:** v0.83.0, Android versionCode 119, signed Android prerelease and in-app updater manifest published and verified.
- Implementation: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/39
- Signed APK: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.83.0
- Final PR validation: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37820731332 (success).
- Signed Android workflow: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37821092893 (certificate verification, release and manifest publication succeeded).
- Testing manifest: `updates/testing.json` v0.83.0, versionCode 119.
- Beta branch remains unchanged and must not be promoted without explicit owner approval.

### New functionality and correctness safeguards

- Library identifies assisted pull-up, assisted chin-up, assisted dip as **assistance**, ordinary pull-up/chin-up/dip/push-up as **bodyweight reps only**, and weighted pull-ups/chin-ups/push-ups as **external added resistance**. Name/equipment fallback handles additional movements.
- Assisted counterweight targets move **down** by a configurable increment after eligible reps across all required sets. Decreases are bounded at 0. Regular bodyweight movements advance reps only; weighted variants can progress external weight upward subject to existing percentage safeguards.
- Routine exercise progression editor offers an explicit override `loadType`: automatic, external, assistance, bodyweight. Routine shares/imports retain this choice and units convert load steps.
- Live set inputs and coaching labels respect loading types; unweighted bodyweight movements show reps-only. Active substitutions reset old loading overrides so assistance cannot silently transfer to a different movement.
- PR/history rebuild recognizes comparable reductions in assistance and bodyweight repetition records. Assisted counterweights do not count as external load volume or estimated-1RM strength. Exercise progress labels and charts distinguish least assistance / reps from ordinary lifting strength.
- Guided/Strength/Track and per-exercise Double / Total Reps / Manual progression mode distinctions are preserved; deload phase isolation from v0.82.0 remains.
- Automated coverage: `scripts/load-aware-progression-stress.mjs` plus full established regression matrix.

**Permanent development reference:** [EXERCISE_LOAD_BEHAVIOR.md](EXERCISE_LOAD_BEHAVIOR.md), cross-linked from [TRAINING_SCIENCE_FOUNDATION.md](TRAINING_SCIENCE_FOUNDATION.md), [ROADMAP.md](ROADMAP.md), and [../AGENTS.md](../AGENTS.md).

### Next checks

Have the user review Testing v0.83.0 on an actual Android device, particularly 64→59 and 24→19 lb assistance progression, reps-only bodyweight sessions, weighted pull-ups, overriding unusual equipment, and returning to normal training after deloads. Use representative **actual** logs (not synthetic volume) when assessing progress indicators. Avoid changing Beta until instructed.


## Latest completed work: 2026-10-08 · Guided Progressive Overload v0.82.0

**Current Swole Cat Testing release:** v0.82.0 / Android versionCode 118, signed permanent Testing identity, APK and in-app update manifest **published successfully**.
- Implementation PR: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/38
- Signed Testing release: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.82.0
- Update feed: `updates/testing.json`, currently v0.82.0
- Android build workflow: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37817808542 (success; signed certificate and manifest checks passed)
- Final reviewed source PR validation: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37817531763 (success; includes new v0.82 regression suite)
- Field **Beta was not touched or promoted**. Its branch remains intentionally independent.

### What shipped in Testing

- New Program training mode is an explicit required selection for manual program creation; existing and imported programs remain compatible.
- Guided Progressive Overload program mode exclusively exposes optional scheduled deloads, off by default. When enabled, every 4th training week is the editable suggested preset (weeks 1–3 normal; week 4 deload), with 3–8 week presets or custom 2–52 weeks.
- Training weeks are based on distinct Monday-start weeks with completed program workout activity, not completed routine rotations or elapsed calendar time alone. The person can begin, defer, skip or postpone the deload decision.
- Deloads intentionally reduce working-set volume and target controlled minimum-range reps. The workout, history, recap, calendar and Progress identify deliberate deloads; saved routines remain unchanged.
- Saved program phase + week metadata preserves historical meaning. Deload workouts remain factual activity but do not set the next normal progression baseline or contribute to Coach adaptive strength-drop/plateau signals.
- Guided program mode holds automatic load increases over 10% of an existing positive external load as a conservative product safeguard (not a proven universal prescription). Zero/missing weighted logs do not establish positive load progression.
- Program sharing includes deload preference and interval, not the sender's personal schedule decisions or workout data.
- Training logic reference: `docs/TRAINING_SCIENCE_FOUNDATION.md`. Full implementation reference: `docs/PROGRAM_GUIDED_OVERLOAD_DESIGN_PROPOSAL.md`.

### Next work, not yet completed

1. Have the user update **Swole Cat Testing** on a real Android phone and inspect a new Guided program, opt-in/default-off settings, three-weeks-then-week-four explanation, deload review choices and visual labels.
2. Validate resume after an authentic deload session with representative working loads, including lb/kg and different equipment; inspect exercise Progress and Coach after completion.
3. Decide further personalization and training-week edge cases: partial/missed weeks, late-start calendars, scheduled deferral, user-preferred load micro-increments, and future deload support for Strength Focus. Consider refinement based on field experience, with no physiological diagnosis claims.
4. Continue testing on `main` and promote to Beta **only on the user's explicit instruction**.

This is the latest checkpoint. Historical paragraphs further below describe earlier milestones and may be outdated; do not rely on their old version numbers when resuming.


## Purpose

This is the **resume-first checkpoint** for Swole Cat.

If chat history, assistant context, or a development session is lost, read this file before making changes. It records the current working baseline, branch contract, cloud state, tested account behavior, and the next unfinished work.

**Training research archive added 2026-10-08:** Before planning or changing workout/strength/progression/deload logic, read [TRAINING_SCIENCE_FOUNDATION.md](TRAINING_SCIENCE_FOUNDATION.md), then [COACH_SWOLECAT_EVIDENCE.md](COACH_SWOLECAT_EVIDENCE.md) and [../AGENTS.md](../AGENTS.md). This is a documentation-only foundation, not a new runtime training algorithm or updated Android build. Note: this file's older release snapshot must be reconciled with current Git refs/releases before acting.

Checkpoint date: **2026-10-06 (America/Chicago)**

## 1. Branches and safe development model

### Field beta

- Branch: `beta`
- Frozen milestone branch: `beta-v0.66.1`
- Exact commit: `99c258f4fc8c0254a533867901f50a8a216f2b28`
- App version: **v0.66.1**
- Android app name: **Swole Cat**
- Android package ID: `com.jlingenfelter.swolecat`
- Purpose: real workouts and external field testing
- Rule: do not advance casually. Only deliberate beta hotfixes or promoted milestones move `beta`.
- `beta-v0.66.1` is immutable and must never be repurposed.

### Experimental development

- Branch: `main`
- Current app source merge: `b116cd08bca04408187044abc6eba7c95386aa51`
- Current Testing release manifest commit: `fa5340cd3a95bdc3bdcba32eb3e9148aed908e6d`
- App version: **v0.73.1**
- Android version code: **104**
- Android app name: **Swole Cat Testing**
- Android package ID: `com.jlingenfelter.swolecat.testing`
- Purpose: current Testing build for cloud/account work, sharing, new features, architecture experiments, and risky development

The different Android package IDs are intentional. Android gives each package its own app sandbox, so Swole Cat and Swole Cat Testing can be installed simultaneously without sharing:
- `overload_v3`
- workout history
- routines/programs
- active workouts
- auth/session state
- settings
- other local app data

Do not change the `main` package ID back to `com.jlingenfelter.swolecat` while the field beta is installed and in use.

## 2. Latest green development gate

Current Testing baseline: **v0.73.1 / Android versionCode 104**

Updater foundation:
- PR #16: **v0.73.0 Testing in-app updater foundation**
- v0.73.0 app source merge: `3fa2ba063daf2ebcbde2ff035ff77d141b9b2871`
- Android generator fix: `8ce8659da188205ee451c8865da873d6a5866caa`
- build-script syntax hardening: `b9a6e3433c6f4fda63790aa02e4f05b332221d8b`
- updater PR final validation run 738: PASS, all 76 validation steps
- v0.73.0 signed Testing build run 344: PASS
- v0.73.0 Testing artifact ID: `11451167705`
- v0.73.0 direct APK SHA-256: `8c8461a21b7f6620da3bfab4927edfa48b0a2e274ff139bf6b725cbe51310dea`
- v0.73.0 is the **manual baseline APK** for the real-device N -> N+1 updater proof

Proof target:
- PR #17: **v0.73.1 Testing updater proof release**
- v0.73.1 source merge: `b116cd08bca04408187044abc6eba7c95386aa51`
- PR validation run 743: PASS, all 76 validation steps
- main validation run 744: PASS, all 76 validation steps
- Pages run 664: PASS
- signed Testing Android build run 345: PASS
- v0.73.1 artifact ID: `11450429897`
- public Testing release tag: `testing-v0.73.1`
- public Testing APK SHA-256: `233ff8b207a6b4529c0e054d9f03c26fd551c40a0648c31c101ba7dd9a0712d4`
- Testing manifest commit: `fa5340cd3a95bdc3bdcba32eb3e9148aed908e6d`
- Testing manifest currently advertises v0.73.1 / build 104
- permanent Testing certificate verification: PASS
- beta branch remains untouched at v0.66.1

Updater behavior now implemented in Testing:
- Settings -> App & updates
- installed version/build/channel display
- passive update checks at most every six hours
- user-triggered download and install only
- no install/download while an active workout exists
- public Testing feed independent of Swole Cat login
- HTTPS host pinning for manifest and release APK locations
- SHA-256 verification before installation
- downloaded APK package-name and versionCode verification
- downloaded APK signing certificate must match the installed app signing identity
- downgrade/reinstall rejection through the normal updater
- one-time Android unknown-source approval flow when required
- PackageInstaller handoff with USER_ACTION_REQUIRED on Android 12+
- Android owns the final install approval UI; Swole Cat does not install silently
- ordinary Testing publication never writes or advances a Beta manifest

Immediate real-device proof:
1. install the preserved signed v0.73.0 Testing baseline manually over the current Testing app
2. confirm routines/history/settings/auth/local data remain intact
3. Settings -> App & updates
4. confirm installed v0.73.0 / build 103 and offered v0.73.1 / build 104
5. tap Download & verify update
6. if Android asks, enable Allow from this source for Swole Cat Testing
7. return and continue install
8. approve Android's standard update confirmation
9. reopen Swole Cat Testing
10. confirm installed v0.73.1 / build 104 and all local/cloud state survived
11. confirm App & updates now reports Up to date

Do not promote Beta until this real-device proof succeeds.

## 3. Phase 8 cloud architecture

Phase 8.0 is complete and documented in `docs/CLOUD_ARCHITECTURE.md`.

Locked architecture:
- Supabase is the initial backend.
- Start at **$0/month** on Supabase Free.
- Swole Cat remains local-first.
- An account is optional.
- Core workout behavior never requires network access.
- Cloud is a replaceable runtime adapter, not the workout domain model.
- Cloud backup and multi-device sync are separate systems.
- Do not upload the entire `overload_v3` blob on every set/save.
- Record-level sync comes later and must be versioned, queueable, retry-safe, and conflict-aware.
- `SWOLECAT1` remains the canonical Routine/Program sharing payload.
- No realtime dependency is required for normal workouts.
- Service-role or other server secrets must never ship in the PWA/APK.

## 4. Live Supabase project

Organization:
- **SWOLE CAT**
- Plan: Free

Project:
- Name: **Swole Cat**
- Project ref: `tpdmcuhsvmffpycgwhqb`
- Region: `us-east-2`
- URL: `https://tpdmcuhsvmffpycgwhqb.supabase.co`

Client builds use the Supabase **publishable** key. The Google client secret stays in Supabase and is not committed to the app.

Current Phase 8 backend state before v0.68.0 real-device testing:
- Supabase Auth users: **0** after the completed Phase 8.1 account-deletion test
- Public Swole Cat application tables: **1**, `backup_metadata`
- `backup_metadata` rows: **0**
- Private `swole-cat-backups` Storage objects: **0**
- Supabase security advisor findings after Phase 8.2 provisioning: **0**

Phase 8.1 was identity-only. Phase 8.2 deliberately adds the first user-owned cloud data surface for private disaster-recovery backups.

## 5. Google OAuth status

Google OAuth has been configured by the project owner and is working.

### Web/PWA

Working end-to-end:
1. Swole Cat PWA starts Google OAuth.
2. Google authenticates.
3. Google returns through Supabase.
4. Supabase returns to the PWA.
5. Swole Cat restores the signed-in identity.

### Android Testing

Working end-to-end on a real Android phone:
1. Swole Cat Testing opens OAuth in the system browser.
2. Google authenticates.
3. Google returns through Supabase.
4. Supabase redirects to the Android custom scheme.
5. Android opens Swole Cat Testing.
6. Swole Cat exchanges the PKCE code for a Supabase session.
7. The user appears signed in inside the Testing app.

Testing callback:
`com.jlingenfelter.swolecat.testing://auth/callback`

Field-beta/future normal-app callback reserved in Supabase:
`com.jlingenfelter.swolecat://auth/callback`

Do not replace one with the other. Both can remain in Supabase's allowed Redirect URLs.

## 6. Identity implementation

Current cloud modules:
- `src/js/10a-cloud-config.js`
- `src/js/10b-cloud-identity.js`
- `src/js/10c-supabase-auth-provider.js`
- `src/js/10d-cloud-backup.js`
- `src/js/10e-supabase-backup-provider.js`

Runtime services:
- `cloudConfig`
- `cloudAuthStorage`
- `identity`
- `identityProviderLoader`
- `cloudBackup`

Important behavior:
- local-only mode can explicitly disable cloud
- signed-out/local-only workouts do not synchronize workout data
- Supabase JS is pinned and lazy-loaded
- auth state stays outside `overload_v3`
- Google sign-in/sign-out does not mutate workout state
- sign-out is local to the current session/device
- Android handles both warm `appUrlOpen` and cold-start `getLaunchUrl`
- Android OAuth uses PKCE
- official Capacitor Browser plugin is used for browser handoff

## 7. What is intentionally NOT in the cloud yet

Phase 8.2 intentionally adds only `backup_metadata` plus private backup Storage objects.

Do not create these yet:
- profile table
- device table
- routine table
- Program table
- session/workout table
- active-workout table
- Coach table/history
- analytics table
- bodyweight table
- favorites/settings shadow tables
- sync records
- realtime subscriptions

There is currently **one** public Swole Cat application table, `backup_metadata`, with RLS enabled. It exists only to index private recovery snapshots.

## 7.1 Permanent Testing APK signing

The Testing channel is now configured to require one persistent Testing-only signing identity.

- package: `com.jlingenfelter.swolecat.testing`
- certificate SHA-256: `D5:3F:27:7C:5B:92:31:1D:78:E9:EB:3B:DB:69:2A:D4:89:73:47:97:F2:43:08:27:40:02:13:F3:8B:7C:EE:53`
- private key material belongs only in GitHub Actions repository secrets and the owner's private backup
- the Android workflow hard-fails if signing secrets are unavailable
- production / Play Store signing remains a separate future identity

Because earlier Testing APKs used ephemeral GitHub runner debug certificates, one uninstall/reinstall is required when moving to the first permanently signed Testing APK. Updates after that should install in place.

The four required GitHub Actions repository secrets are installed. **v0.67.5 is the first verified permanently signed Testing build.**

Verification:
- Validate run **586**: success
- Pages run **591**: success
- Android Testing run **328**: success
- permanent certificate verification: success
- Android artifact: `Swole-Cat-Testing-Android-v0.67.5-signed`
- artifact digest: `sha256:ed367501ab74ae87904c075614c711473b7b7c96387ce29f7ba69b3ec3d6a2ea`
- extracted APK SHA-256: `d780662334feadac506e324640610856d857783529bed7828166dacbe9ed7890`

One final uninstall of the old ephemeral-signed Testing app is required before installing v0.67.5. After v0.67.5 is installed, future Testing APKs signed with the same key should update in place.

Canonical instructions: `docs/TESTING_SIGNING.md`.

## 8. Next unfinished work

### Immediate next step: real-device verification of Phase 8.1 lifecycle

Phase 8.1 implementation is complete in **v0.67.6**:
- Google-only recovery uses the same Google identity, with no separate Swole Cat password
- destructive account deletion requires a fresh Google verification
- re-auth must return the same Supabase user identity
- failed/cancelled re-auth preserves the existing signed-in session
- a fresh verification is valid for only 10 minutes
- cloud-account deletion runs through the authenticated `delete-account` Supabase Edge Function
- the function derives the user from the caller JWT and does not accept a client-selected user ID
- service-role credentials remain server-side only
- deleting or signing out never mutates `overload_v3`
- Android auth/session material remains Keystore-backed
- the v0.67.6 regression wall passed, including lifecycle and local-data preservation coverage

Real-device verification completed on 2026-10-04:
- [x] installed v0.67.6 directly over permanently signed v0.67.5 without uninstalling
- [x] existing Google/Supabase session survived the in-place update and remained signed in

Additional real-device verification completed on 2026-10-04:
- [x] sign-out preserved existing routines and workout history
- [x] a test workout completed while signed out remained saved locally
- [x] signing back in with the same Google account restored the cloud identity
- [x] local workout data remained unchanged after recovery/sign-in

Final real-device Phase 8.1 verification completed on 2026-10-04:
- [x] destructive delete flow required Google verification
- [x] final permanent-delete confirmation completed successfully
- [x] cloud account disappeared from Swole Cat after deletion
- [x] local workout/routine/history data remained unchanged after deletion
- [x] Supabase backend verification showed 0 Auth users after deletion
- [x] Supabase still had 0 public Swole Cat application tables

**Phase 8.1 is complete.**

### Immediate next step: real-device verification of Phase 8.2 Cloud Backup v0.68.0

Phase 8.2 implementation is now merged to `main` and the full v0.68.0 build wall is green:
- private owner-only `swole-cat-backups` Storage bucket
- RLS-protected `backup_metadata` table
- exact existing `swole-cat-backup` envelope uploaded, no second format
- SHA-256 + byte-size integrity verification
- latest + previous bounded retention
- manual **Back Up Now**
- manual **Restore from Cloud** with snapshot preview
- existing pre-import local safety snapshot before replacement
- cloud failure remains non-blocking and backup traffic is user initiated
- account deletion removes backup objects/metadata before deleting Auth identity
- backend security advisor reports zero security findings after provisioning

Current backend state immediately after infrastructure provisioning:
- Supabase Auth users: 0 (the Phase 8.1 test account was deleted)
- public Swole Cat application tables: 1 (`backup_metadata`)
- `backup_metadata` rows: 0
- private backup bucket objects: 0

Automated Phase 8.2 verification:
- [x] branch validation run 608 passed, including v0.68.0 cloud backup/restore stress coverage
- [x] main validation run 609 passed
- [x] Pages run 602 passed
- [x] Android Testing run 330 passed with the persistent Testing signature
- [x] Supabase security advisor reports zero findings

Phase 8.2 real-device verification:
- [x] permanently signed v0.68.0 Testing build installed and used without resetting the existing local training state
- [x] sign in again after the Phase 8.1 account-deletion test
- [x] create the first real-device v0.68.0 cloud backup and verify matching private Storage object + metadata row
- [x] create two more backups and verify only latest + previous remain
- [x] change local data and restore the previous snapshot
- [x] verify the pre-restore local rollback snapshot is created and exposed in Settings
- [x] verify the pre-restore local rollback snapshot can recover the replaced state
- [x] verify local workout flow still works with cloud unavailable
- [x] reconnect and delete the cloud account while live backups are attached
- [x] verify account deletion clears Auth, backup metadata, and private backup Storage objects
- [x] re-run the Supabase security advisor after the final destructive test with zero findings

Final backend state after the destructive Phase 8.2 test on 2026-10-05:
- Supabase Auth users: **0**
- `backup_metadata` rows: **0**
- private `swole-cat-backups` Storage objects: **0**
- Supabase security advisor findings: **0**

**Phase 8.2 is complete.**

### Immediate next step: validate Phase 8.3 Multi-device Sync v0.69.0

Phase 8.3 foundation now exists on `phase-8.3-multidevice-sync`:
- Swole Cat Testing version: **v0.69.0**, Android version code **91**
- stable per-installation sync identity stored outside `overload_v3`
- provider-neutral `cloudSync` runtime service
- Supabase `devices` registry with owner-only RLS
- Supabase `sync_records` with owner-only RLS
- server-managed record versions and monotonically increasing change sequence
- local pending queue survives cloud/network failure
- local saves may queue changes but do not initiate network traffic
- explicit **Sync Now** performs pull → merge/conflict detection → push → final pull
- optimistic concurrency prevents silent same-record overwrites
- tombstones propagate deletions
- explicit conflict UI supports **Keep this device** or **Use cloud**
- active workouts intentionally remain local-only in this first pass
- no Realtime subscriptions and no per-set network writes
- client grants were hardened to least-privilege column access; authenticated clients no longer have TRUNCATE/trigger/table-wide mutation privileges
- Supabase security advisor reports zero findings

Current server state before real-device sync testing:
- Auth users: 0
- device rows: 0
- sync record rows: 0
- backup metadata rows: 0
- backup Storage objects: 0

Automated Phase 8.3 verification:
- [x] branch validation run 642 passed, including the two-device sync battle test
- [x] main validation run 643 passed
- [x] Pages run 612 passed
- [x] Android Testing run 331 passed with the persistent Testing signature
- [x] Supabase security advisor reports zero findings

Remaining Phase 8.3 real-device work:
- [x] install the permanently signed v0.69.0 Testing APK over v0.68.0 without uninstalling
- [ ] confirm existing local workout data remains unchanged after the update
- [x] sign in and seed Device A
- [x] connect a second installation/device to the same Google account
- [x] verify clean pull onto a fresh device without duplicate sync records
- [x] verify Device B renders the synced routine/history correctly after the pull
- [x] verify edits propagate both directions
  - [x] Device B -> Device A
  - [x] Device A -> Device B
- [x] verify same-record concurrent edits create a conflict instead of data loss
- [x] verify conflict resolution
- [x] verify tombstone deletion propagation
- verify queued offline changes survive reconnect/restart
- then decide when to promote manual sync into automatic background-safe batching

Do not introduce realtime/per-set network writes just because sync exists.

## 9. Phase 8 sequence after identity

1. Phase 8.1: identity and account security
2. Phase 8.2: cloud backup/restore
3. Phase 8.3: record-level multi-device sync
4. Phase 8.4: cloud short codes/share links resolving to canonical `SWOLECAT1`
5. Phase 8.5: server-verified Google Play Lifetime Pro entitlement
6. Phase 9: shared Programs and workout groups

## 10. Monetization contract

Locked product philosophy:
- free core workout app
- no ads
- no required recurring subscription
- target **Swole Cat Pro at $7.99 one-time lifetime**
- Lifetime Pro stays lifetime for the buyer
- cloud/connected convenience is the natural Pro value
- do not cripple ordinary workout tracking to force purchase
- costly future hosted AI can be priced separately if real per-use economics require it
- keep infrastructure lean enough for lifetime economics

Canonical details: `docs/PRODUCT_PHILOSOPHY.md`.

## 11. Sharing contract

Routine/Program sharing is already implemented locally.

Canonical format:
- `SWOLECAT1`

Future cloud sharing must only provide delivery/indexing:
- short code or URL
- lookup stored package
- return canonical `SWOLECAT1`
- existing importer validates/previews/imports it

Cloud sharing must not expose private workout history.

Canonical details: `docs/SHARING_ARCHITECTURE.md`.

## 12. Rules when resuming development

Before changing code:
1. Read this file.
2. Read `docs/CLOUD_ARCHITECTURE.md` for Phase 8 work.
3. Confirm `main`, `beta`, and `beta-v0.66.1` refs.
4. Never develop directly on the frozen beta snapshot.
5. Keep Swole Cat Testing package identity separate from the field beta.
6. Keep `overload_v3` local-first.
7. Do not add cloud rows/data without a specific product requirement.
8. Run the full regression wall after architecture/auth/storage changes.
9. Verify Android build output, not just source configuration.
10. Only promote to `beta` deliberately after real-device testing.

## 13. Resume sentence

If context is lost, the safest continuation is:

> Resume Swole Cat from `docs/CURRENT_STATE.md`. Phase 8.1 Identity and Phase 8.2 Cloud Backup are complete. Phase 8.3 manual record-level sync is on `main` as Swole Cat Testing v0.69.2. Bidirectional real-device propagation is verified between Android Device A and Web/PWA Device B. v0.69.1 fixed duplicate device registration and v0.69.2 fixed the PWA pull stall. Branch validation 655, main validation 656, Pages 621, and signed Android build 333 are green. Next verify deliberate concurrent conflicts, tombstones, and offline queued changes before automating sync. Keep beta v0.66.1 frozen.


### Phase 8.2 real-device checkpoint: first cloud backup

Verified on 2026-10-04 from Swole Cat Testing v0.68.0:
- authenticated user count: 1
- `backup_metadata` rows: 1
- private `swole-cat-backups` objects: 1
- backup format: `swole-cat-backup`
- format version: 1
- data schema version: 1
- app version recorded by backup: 0.68.0
- metadata size: 9,266 bytes
- Storage object size: 9,266 bytes
- metadata SHA-256: `d2e16a9e70c9569282ca1d56ea652644201cb8584d21d278ae59842260c5392c`
- Storage owner, metadata owner, and first object-path folder matched the same authenticated user
- MIME type: `application/json`

This confirms the first real Android **Back Up Now** reached private Supabase Storage and wrote the matching owner-scoped metadata record.


### Phase 8.2 real-device checkpoint: bounded retention

Verified on 2026-10-04 after three total manual cloud backups:
- `backup_metadata` rows: 2
- private `swole-cat-backups` Storage objects: 2
- original first backup was pruned from both metadata and Storage
- surviving backups are the two newest v0.68.0 snapshots
- both surviving objects are 9,296 bytes
- both surviving metadata rows and Storage objects share the same authenticated owner and source installation ID

This confirms the live Android retention path keeps exactly **latest + previous** instead of growing cloud storage indefinitely.


### Phase 8.2 real-device checkpoint: cloud restore + local safety snapshot

Verified on 2026-10-04 from Swole Cat Testing v0.68.0:
- latest local marker before restore: `Cloud Test 3`
- previous cloud backup selected for restore
- restore completed successfully
- local profile marker rolled back to `Cloud Test 2`, proving the previous cloud snapshot replaced local state
- Settings shows **Restore pre-import snapshot** after the cloud restore
- this confirms the required local safety snapshot was created before cloud state replacement

Remaining rollback verification: restore the pre-import snapshot and confirm the local profile marker returns to `Cloud Test 3`.


### Phase 8.2 real-device checkpoint: rollback recovery

Verified on 2026-10-04:
- after restoring the previous cloud snapshot, the local marker was `Cloud Test 2`
- **Restore pre-import snapshot** successfully restored the pre-restore local state
- the local marker returned to `Cloud Test 3`

This confirms the cloud-restore safety snapshot is not only created, but can successfully recover the local state that was replaced.


### Phase 8.2 real-device checkpoint: final offline + destructive cleanup

Verified on 2026-10-05:
- Swole Cat Testing remained usable offline and local workout changes saved successfully without cloud connectivity
- the device reconnected normally afterward
- the cloud account was deleted while the two retained backup snapshots were still attached
- post-delete backend verification showed 0 Supabase Auth users
- post-delete backend verification showed 0 `backup_metadata` rows
- post-delete backend verification showed 0 private `swole-cat-backups` Storage objects
- Supabase security advisor returned zero findings

This closes Phase 8.2. Cloud backup is now proven as a bounded, owner-private disaster-recovery layer that does not block local training.


### Phase 8.3 real-device checkpoint: Device A seed

Verified on 2026-10-05 from Swole Cat Testing v0.69.0:
- authenticated users: 1
- registered sync devices: 1
- registered device platform: Android
- registered device app version: 0.69.0
- sync records: 10
- tombstones: 0
- seeded record types:
  - profile: 1
  - settings: 1
  - favorites: 1
  - exercise_preferences: 1
  - bodyweight: 1
  - app_state: 1
  - routine: 1
  - session: 3
- all seeded records are version 1
- all seeded records use the same authenticated owner and source device
- active workout was not uploaded, as intentionally designed for the first sync pass

This confirms the first real Android **Sync Now** registered Device A and seeded the expected owner-scoped record set.


### Phase 8.3 real-device checkpoint: Device B fresh pull

Verified on 2026-10-05:
- registered sync devices: 2
- Device A: Android, app version 0.69.0
- Device B: Web/PWA, app version 0.69.0
- both devices belong to the same authenticated owner
- sync record rows remained at 10 after Device B Sync Now
- tombstones remained at 0
- no duplicate routine/session/profile/settings rows were created
- existing server records still show Device A as the source of the original seeded data

This confirms a fresh second installation can register independently and pull the existing cloud state without duplicating records.


### Phase 8.3 real-device checkpoint: Device B UI parity

Verified on 2026-10-05:
- Device B displayed the expected synced Swole Cat data after its first Sync Now
- the routine and workout-history data from Device A appeared correctly
- no duplicate cloud records were created during the pull

This confirms the fresh-device sync path works both at the backend-record level and in the actual Swole Cat UI.


### Phase 8.3 real-device incident: repeated Device B sync registration

Observed on 2026-10-05 during the first Device B -> Device A propagation test:
- Device B had already registered successfully and completed its initial fresh pull
- after editing the profile name and choosing **Sync Now** again, the Web/PWA showed `duplicate key value violates unique constraint "devices_pkey"`
- the profile edit had not reached the server; the cloud profile remained at its prior version
- no sync-record duplication or cloud data loss occurred

v0.69.1 hotfix:
- make **Sync Now** single-flight so repeated/double clicks share one operation
- make device registration idempotent after a `23505` primary-key race
- detect a device-ID collision with an incompatible installation platform and rotate to a fresh local device ID
- retry registration exactly once after collision rotation
- regression-test concurrent Sync Now calls and stale/copied device-ID collisions

Do not continue the Device B -> Device A propagation test on v0.69.0. Resume after v0.69.1 passes CI and is deployed.


### Phase 8.3 real-device checkpoint: Device B hotfix + conflict resolution

Verified on 2026-10-05:
- v0.69.0 Device B exposed a repeated-registration failure: `devices_pkey`
- v0.69.1 hotfix deployed to the live PWA
- Device B retained its queued local profile edit
- Device B showed one real profile conflict after refresh
- choosing **Keep this device** resolved the conflict without data loss
- the live cloud profile advanced to record version 2
- server change sequence advanced to 25
- the winning cloud profile value is `synced from b`
- the winning source device is the Web/PWA installation
- Device B registration now reports app version 0.69.1
- main validation run 652, Pages run 618, and signed Android Testing run 332 all passed

Next:
- install v0.69.1 over Android Device A
- Sync Now on Device A
- verify the profile edit from Device B appears on Android
- then reverse direction for Device A -> Device B


### Phase 8.3 real-device checkpoint: Device B -> Device A propagation

Verified on 2026-10-05 after both installations were updated to v0.69.1:
- Device B/Web had already won the profile conflict with `synced from b`
- Device A/Android ran **Sync Now**
- Android displayed `synced from b` after the pull
- Android device registration refreshed successfully on v0.69.1
- cloud profile remained version 2 with Device B as the source
- Android pulling the change did not rewrite the cloud winner or create a profile duplicate

This confirms real Device B -> Device A propagation works end-to-end after the v0.69.1 registration hotfix.


### Phase 8.3 real-device checkpoint: Device A -> Device B propagation

Verified on 2026-10-05:
- Device A/Android changed the profile marker to `Synced From A`
- Device A Sync Now advanced the cloud profile to record version 3 and server change sequence 26
- Android remained the cloud source of the winning profile
- Device B/Web on v0.69.1 initially stalled after device registration and did not request `sync_records`
- v0.69.2 removed async Web Crypto hashing from the record-sync hot path while preserving SHA-256 manifest compatibility
- v0.69.2 starts the remote pull before local projection hashing
- after refreshing Device B to v0.69.2 and running Sync Now, Device B displayed `Synced From A`
- Device B registered successfully as Web v0.69.2 without rewriting the cloud profile
- bidirectional real-device profile propagation is now verified both directions

v0.69.2 automated gates:
- branch validation run 655: success
- main validation run 656: success
- Pages run 621: success
- signed Android Testing run 333: success
- persistent Testing signature verification: success
- Android artifact: `Swole-Cat-Testing-Android-v0.69.2-signed`
- Android artifact digest: `sha256:9e3a5729557d30a0a6b89e680eb9ca2be61406073d0aecdcc562be1ba07bd1c6`
- extracted APK SHA-256: `71539febda264f3ebf3871d5d86ad980f63ee495224a8fbd65584dd210f9b032`

Next real-device tests:
- deliberate same-record concurrent edit conflict
- conflict resolution in both directions
- tombstone deletion propagation
- offline queued changes surviving reconnect/restart


### Phase 8.3 real-device checkpoint: deliberate same-record conflict

Verified on 2026-10-05 with both installations on v0.69.2:
- both devices first converged on profile value `Synced From A`
- Device A changed the profile locally to `Conflict A`
- Device B independently changed the same profile locally to `Conflict B`
- neither device pulled the other's edit before the concurrent changes were created
- Device A synced first
- cloud profile advanced to record version 4 and server change sequence 27
- cloud winner is `Conflict A`
- cloud source device is Android Device A
- Device B synced afterward
- Device B surfaced exactly 1 profile conflict
- Device B did not silently overwrite the cloud winner
- total sync-row count remained stable and no tombstone was created

This confirms optimistic concurrency detects a real same-record edit collision and preserves both sides for explicit user resolution.


### Phase 8.3 real-device checkpoint: Use cloud conflict resolution

Verified on 2026-10-05 with Device B on v0.69.2:
- Device B opened the waiting profile conflict
- Device B chose **Use cloud**
- Device B local profile changed from `Conflict B` to `Conflict A`
- conflict count returned to 0
- a clean follow-up Sync Now completed
- cloud profile remained record version 4 / server change sequence 27
- cloud profile remained `Conflict A`, sourced from Android Device A
- choosing **Use cloud** did not create a redundant profile write or bump the profile version

Additional normal Device B records were flushed during the later convergence sync:
- app_state advanced to version 2
- one routine, one program, and two sessions were newly seeded
- no tombstones existed afterward

This confirms explicit cloud-wins conflict resolution converges the losing device without rewriting the already-authoritative cloud record.


### CI infrastructure note for v0.69.3 hotfix

On 2026-10-05, GitHub Actions experienced a hosted-runner assignment incident while PR #7 was awaiting validation. Three validation attempts ended before checkout with no runner assigned and zero workflow steps executed. This note intentionally triggers a fresh PR synchronization run so v0.69.3 can receive a new workflow run ID once hosted runners recover.


### Phase 8.3 real-device checkpoint: v0.69.3 browser pull fix

Verified on 2026-10-05:
- Device A had already uploaded routine `Tombstone Test` as routine record version 1, server change sequence 38
- Device B on v0.69.2 repeatedly stalled after device registration and never requested `sync_records`
- v0.69.3 changed Sync Now ordering so inbound remote pull happens before device registration
- v0.69.3 removed representation-returning device registration writes
- branch validation run 662 passed
- PR #7 merged to main as `b25a9ef174523a86fdf558cdc57bc17c885d1272`
- main validation run 663 passed
- Pages run 626 passed
- signed Android Testing run 334 passed
- Device B hard-refreshed to v0.69.3 and Sync Now successfully pulled `Tombstone Test`
- Device B now registers as Web v0.69.3
- cloud routine remained a single live record at version 1 / sequence 38

This confirms the exact browser pull failure is fixed on the real two-device setup. Next complete the tombstone deletion half of the test.


### Phase 8.3 real-device checkpoint: tombstone deletion propagation

Verified on 2026-10-05:
- Device A on v0.69.3 deleted routine `Tombstone Test`
- cloud converted the existing routine record into a tombstone rather than hard-deleting it
- tombstone record remains present with:
  - record id `id_muvml0lvjmiac`
  - record version 3
  - server change sequence 40
  - null payload
  - non-null `deleted_at`
  - Android Device A as source
- Device B on v0.69.3 initially failed to remove the routine because the PWA service worker cached an earlier empty Supabase sync response
- v0.69.4 changed the service worker so non-whitelisted cross-origin/API traffic is network-only and cannot be served from the app-shell cache
- v0.69.4 added a dedicated service-worker cloud-cache boundary regression test
- branch validation run 665 passed
- PR #8 merged to main as `f513c1efac50594de46c9eecb8d6cbcc0c7dfd03`
- main validation run 666 passed
- Pages run 628 passed
- signed Android Testing run 335 passed
- Device B hard-refreshed to v0.69.4 and Sync Now removed `Tombstone Test` locally
- Device B now registers as Web v0.69.4
- cloud still retains exactly one tombstone record rather than deleting or resurrecting it

This confirms real tombstone propagation works end-to-end after the v0.69.4 service-worker cache fix.


### Phase 8.3 real-device checkpoint: offline queue persistence

Verified on 2026-10-06:
- both Device A and Device B were on v0.69.4
- Device A was taken offline
- profile name changed locally to `Offline queue A`
- the local sync queue retained the pending change while offline
- offline Sync Now failed without losing local state or the queued mutation
- the queued change survived a force-close / app restart
- after connectivity returned, Device A Sync Now flushed the queued mutation
- Device B Sync Now received the change successfully with no conflict
- cloud profile is now:
  - record version 5
  - server change sequence 44
  - source Device A `5c1ebbd6-fc77-42ca-9bbf-3ea7212c4ab3`
  - payload name `Offline queue A`
  - non-deleted
- Device B checked in after the cloud update on Web v0.69.4

This confirms queued sync mutations survive offline operation and app restart, then flush and propagate correctly after reconnect.


### Phase 8.3 COMPLETE: Multi-device Sync exit criteria passed

Final real-device exit verification completed on 2026-10-06.

Passed:
- initial Device A cloud seed
- fresh Device B pull with no redundant writes
- bidirectional propagation A -> B and B -> A
- deliberate same-record concurrent conflict detection
- cloud-wins conflict resolution with no redundant rewrite
- browser pull stall fixed in v0.69.3
- tombstone deletion propagation fixed end-to-end in v0.69.4
- offline queued mutation survived failed offline sync and force-close/restart
- queued mutation flushed after reconnect and propagated to the other device
- account deletion cleanup removed all cloud-owned data:
  - auth users: 0
  - devices: 0
  - sync records: 0
  - backup metadata: 0
  - backup Storage objects: 0
- local workout state remained intact after cloud account deletion, including routines, workout history, and profile data

Current stable Testing baseline for this phase is v0.69.4, with service-worker cloud/API requests excluded from PWA caching.

Phase 8.3 is complete. Do not expand cloud scope by default. Next product work should return to Coach Swolecat intelligence, heat-map refinement, UI polish, and general performance/smoothing unless a new cloud requirement becomes necessary.


## Canonical next-chat handoff

Read `docs/NEXT_CHAT_HANDOFF.md` first when resuming development in a new conversation.

Immediate verification task: **real-device v0.71.0 short-share test** between the Testing app and a second installation. After that, continue the broader Settings cleanup/polish work. Do not begin another cloud phase by default.


## 2026-10-06 cloud/settings checkpoint

### v0.70.0 Settings cloud compaction
- main Settings now shows a compact two-tile cloud hub: Cloud account + Cloud settings
- Cloud backup, Multi-device sync, and Data safety moved into the Cloud settings submenu
- beta branch remained untouched

### v0.70.1 automatic cloud behavior
- automatic record sync defaults on for connected accounts
- local saves remain immediate and authoritative
- queued changes flush after a short debounce
- foreground/reconnect and periodic refresh pull remote changes
- automatic recovery backup defaults on and runs roughly daily while the app is in use
- only the latest two recovery backups are retained
- manual Sync Now and Back Up Now remain available
- compact Cloud settings tile surfaces live sync health
- merged to main as `f3ff2c8ce1cd8df99df67d370390c1b143aefa51`

### v0.71.0 Phase 8.4 short-lived plan sharing
User problem:
- the original `SWOLECAT1` code contains the entire Base64-encoded plan envelope
- full Programs can produce extremely long text messages that are easy to truncate/corrupt

New primary design:
- signed-in sender creates a short `SC-XXXX-XXXX-XXXX-XXXX` cloud ticket
- recipient can import it without a Swole Cat cloud account
- recipient still sees the existing safe preview before importing
- only the plan blueprint is shared
- no sessions, PRs, bodyweight, profile data, analytics, active workout, or Program progress is included
- cloud shares expire after 7 days
- each account is capped at 25 active shares
- expired/old rows are pruned during share traffic
- only the SHA-256 hash of the usable code is stored
- legacy `SWOLECAT1` remains available as Offline Code and stays import-compatible

Live Supabase:
- `public.plan_shares` created with RLS enabled
- direct anon/authenticated table access revoked
- explicit deny-all client RLS policy
- `plan-share` Edge Function deployed and ACTIVE
- function create action verifies sender JWT
- resolve action is public-by-secret so recipients do not need an account
- post-deploy Supabase security advisors: zero findings
- performance advisor only reports the two brand-new share indexes as unused, expected before real traffic

Automation:
- dedicated `scripts/cloud-sharing-stress.mjs`
- first complete v0.71.0 regression wall passed on PR #11 run 702
- final-head PR validation run 707 passed after the documentation/security-policy checkpoint

Testing still needed before calling Phase 8.4 real-device complete:
- generate a short code from Android Testing while signed in
- import it on the girlfriend/second installation
- verify recipient can be signed out
- verify imported Program/routine content and ordering
- verify Supabase row stores only code_hash and expires_at, not the usable code
- verify expired/not-found behavior when practical



## 2026-10-06 final v0.71.0 release checkpoint

Repository and deployment:
- PR #11 merged to `main`
- merge commit: `d28410f93efe1281bd29700d503ed4aff33f1de8`
- main validation run 709: PASS
- GitHub Pages deploy run 638: PASS
- signed Android Testing build run 338: PASS
- artifact: `Swole-Cat-Testing-Android-v0.71.0-signed`
- artifact ID: `11425967468`
- artifact digest: `sha256:3e4be0f7cec86e4d40f1145a36a87e7ac30e69a5bb195e4a7ca760d4adc6c934`
- beta branch remains frozen/untouched

Live Testing URLs:
- PWA / GitHub Pages: `https://jlingenfelter22-bot.github.io/Swole-Cat/`
- GitHub Actions Android build run: `https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37492161724`

Next real-device test:
1. update/install Swole Cat Testing v0.71.0
2. sender signs into cloud and shares a real Program or routine
3. recipient imports the short `SC-...` code, preferably signed out
4. verify routine/program structure and order
5. inspect `plan_shares` backend row for hash-only code storage and 7-day expiry
6. then mark Phase 8.4 real-device complete


## 2026-10-06 v0.72.0 workout-screen UX checkpoint

Source of the pass:
- user supplied a ~6.5 minute narrated real-device walkthrough of the active workout screen
- central UX goal: the active workout should behave like an instrument panel, not a scrolling document
- user specifically identified excess session-header height, permanent Finish/Add controls, unclear exercise switching, missing inline set-count controls, and redundant Next Exercise
- fresh-user evidence: the user's girlfriend did not immediately understand how to switch to another exercise, so discoverability was treated as a product bug rather than user error

Design rule:
- **zero-scroll normal path**, not **never scroll**
- common logging should fit in one viewport where practical
- large text, supersets, long notes/names, many sets, small devices, and accessibility settings may overflow gracefully
- never make important controls tiny merely to satisfy a no-scroll rule

Implementation:
- spec: `docs/WORKOUT_SCREEN_UX_V072.md`
- feature branch: `workout-screen-ux-v0.72.0`
- PR #12
- merged to `main` as `b0a26d7020bd01c7c42a6771c5b1ecddda73bc68`
- version: 0.72.0
- Android versionCode: 99
- branch validation run 712: PASS
- main validation run 713: PASS
- Pages run 641: PASS
- signed Android Testing run 339: PASS
- signed artifact ID: `11431691213`
- signed artifact digest: `sha256:93d3bc12ed7093320ef7fe82674e20d76275ab13858cf06ec7c23aa5a8d66b41`

Dedicated regression:
- `scripts/workout-screen-ux-stress.mjs`
- asserts compact session strip
- asserts no permanent Cancel / Next Exercise / Add Exercise footer / early Finish CTA on the normal surface
- asserts explicit Switch exercise affordance
- asserts Add Exercise lives inside the switcher
- asserts `+ Set` lives in the set rail and preserves structureDirty semantics
- asserts More contains early finish, cancel, Manage Workout, and working-set fallback
- asserts final completion reveals Finish Workout contextually

Real-device verification still needed:
1. install/update Swole Cat Testing v0.72.0 on the phone
2. confirm an ordinary three-set movement can be logged with little or no page scrolling
3. confirm the Switch exercise affordance is immediately understandable without instruction
4. open the switcher and verify Add Exercise feels naturally placed
5. add/remove working sets and verify the inline `+ Set` flow feels obvious
6. verify More feels organized rather than overloaded
7. verify Finish Workout Early opens the existing unfinished-work review when appropriate
8. complete the final programmed set and verify Finish Workout appears naturally
9. test keyboard entry, rest timer, long exercise names, 4-5+ sets, and a superset for graceful overflow
10. get another fresh-user read from the girlfriend if possible, especially exercise switching

Outstanding independent cloud check:
- the v0.71.0 real-device short-share sender/recipient test is still pending
- this does not block workout-screen UX iteration



## 2026-10-06 v0.72.1 workout feedback polish checkpoint

Source:
- second narrated real-device walkthrough after v0.72.0
- user confirmed the core workout hierarchy is now comfortable and asked for polish rather than another structural redesign
- user specifically called out the persistent structure-change warning, awkward Switch Exercise visual treatment, lack of clear exercise-boundary feedback, and desire for a subtle next-set confirmation

Implementation decisions:
- structure-change feedback is once per active workout, not once per exercise
- the warning is a fixed overlay with a five-second countdown line and can be dismissed early
- no permanent warning block is rendered inside the workout layout
- Switch Exercise retains explicit wording for discoverability but drops the bordered pill treatment
- exercise changes use a card-deck metaphor with short transform/opacity motion
- View Transitions API is preferred when available; lightweight incoming animation is the fallback
- normal set advancement does not use the card transition
- Set 1 → Set 2 → Set 3 gets a brief cyan pill pulse and tiny focused-card settle instead
- reduced-motion preference disables the motion layer while preserving all state changes

Release:
- version: 0.72.1
- Android versionCode: 100
- PR #13
- feature branch: `workout-feedback-v0.72.1`
- merged to `main`: `6016c8b29f9cd69084065193df82b9df55bf56ac`
- PR validation run 717: PASS, 73 steps
- main validation run 718: PASS, 73 steps
- Pages run 645: PASS
- signed Android Testing run 340: PASS
- artifact ID: `11439396486`
- artifact digest: `sha256:5464a49e6d59b1b5a64523e3595ecaf005754fa8e04b561856650ac158da92b9`

Regression:
- `scripts/workout-feedback-stress.mjs`
- verifies structure notice overlays rather than changing layout
- verifies it appears only once per workout
- verifies set advancement gets set-level feedback only
- verifies automatic and manual exercise changes get directional exercise-card feedback
- verifies the normal `Up next` toast is removed
- verifies Switch Exercise stays explicit and single-line
- verifies reduced-motion navigation remains functional without animation

Immediate phone feel test:
1. add a working set and verify the `Workout modified` notice is visible but does not move the workout screen
2. verify the notice disappears naturally and does not repeat on later structural edits
3. judge whether Switch Exercise now looks visually balanced on the phone
4. complete Set 1 and watch the Set 2 pill/card cue; it should register subconsciously, not feel animated
5. complete the final set of an exercise and judge the card transition timing/strength
6. manually switch forward and backward between exercises and confirm the direction helps orientation
7. if the card motion feels noticeable enough to slow the workout, shorten it rather than removing the model
8. test a superset to confirm exercise rotation still reads correctly
9. optionally enable Android Reduce Motion / equivalent accessibility setting and confirm instant navigation remains usable

Outstanding independent cloud check:
- v0.71.0 real-device short-share sender/recipient verification is still pending
- this does not block workout-screen polish



## 2026-10-06 v0.72.2 exercise-header checkpoint

Source:
- third narrated real-device walkthrough focused on the remaining awkward composition in the exercise header
- user wanted How To visually attached to the exercise it explains
- user wanted the dropdown chevron removed
- user wanted Switch Exercise in a properly composed pill on the lower-right instead of floating at the top
- user specifically observed the old How To control drifting when the exercise list opened

Implementation:
- version 0.72.2
- Android versionCode 101
- feature branch `workout-header-v0.72.2`
- PR #14
- merge `b24d27dca66b8e923cef7be3c8b7989ac1153790`
- PR validation run 722 exposed one stale legacy selector only
- stale Focus Mode regression was updated to the new intentional inline-help contract
- final PR validation run 723: PASS, 74 steps
- main validation run 724: PASS, 74 steps
- Pages run 649: PASS
- signed Android Testing build run 341: PASS
- artifact ID `11441549231`
- artifact digest `sha256:2711fccb0d23412623c330c7ff2733f1b45c49df07dd9feb31c6b0c9a85a68a7`

Dedicated regression:
- `scripts/workout-header-stress.mjs`
- verifies How To immediately follows the exercise name in DOM flow
- verifies help stays inside the stable summary/title row
- verifies the old absolute help control is absent
- verifies Switch Exercise lives beside metadata in the lower row
- forbids the legacy dropdown chevron
- verifies tapping How To does not toggle the switcher
- verifies the rest of the header still toggles the exercise list
- verifies opening the list does not relocate help/switch controls
- verifies long exercise names retain inline help placement

Immediate phone test:
1. inspect short names such as Back Squat and confirm the `i` sits naturally immediately after the title
2. inspect longer names such as Sumo Deadlift and calf-raise variants
3. find a genuinely long/wrapped exercise name and confirm the help control follows it naturally
4. tap `i` repeatedly and confirm only How To opens
5. open/close Switch Exercise and confirm the `i` never drops into the expanded list
6. judge whether the lower-right Switch Exercise pill feels visually balanced with metadata on the left
7. confirm tapping elsewhere on the exercise header remains an easy switch target
8. do not redesign the logging controls below the header unless new real-device feedback identifies a specific issue

Outstanding independent cloud check:
- v0.71.0 real-device short-share sender/recipient verification is still pending



## 2026-10-06 v0.72.3 numeric-entry checkpoint

Source:
- fourth narrated real-device walkthrough
- user approved the overall workout-screen flow and focused specifically on truncated Weight/Reps labels
- core constraint: improve readability without adding vertical height and preserve the one-screen workout goal

Implementation:
- full Weight (lb/kg) and Reps labels
- old label + micro-step header retired for Weight/Reps
- numeric row is now `[ − | value | + ]`
- decrement/increment buttons remain large enough for gym use
- central numeric input remains 52px tall
- RIR remains a selector
- RIR label area was compacted to match the new layout
- no changes to exercise header, set rail, target, Complete Set, or workout motion behavior

Release:
- version 0.72.3
- Android versionCode 102
- feature branch `numeric-entry-v0.72.3`
- PR #15
- merge `2184e0d4951053f775ddb1c7fa93f9fda3c54688`
- PR validation run 728: PASS, 75 steps
- main validation run 729: PASS, 75 steps
- Pages run 653: PASS
- signed Android Testing build run 342: PASS
- artifact ID `11443243011`
- artifact digest `sha256:e0785c21b00c8e0f405596d478c8a16f64cb8d45359a4579f22b5566b733b750`

Dedicated regression:
- `scripts/workout-numeric-entry-stress.mjs`
- verifies Weight/Reps remain explicit controls
- verifies full labels and active unit
- verifies decrement/value/increment DOM order
- verifies old micro-step header is absent
- verifies RIR remains a selector
- verifies numeric labels do not use ellipsis
- verifies the 52px value height is preserved
- verifies no separate vertical stepper row is introduced

Immediate phone test:
1. verify Weight (lb) is fully readable with no ellipsis
2. verify Reps is fully readable with no ellipsis
3. confirm the `− value +` relationship is immediately obvious for both
4. confirm buttons feel easy to hit during a workout
5. verify RIR still reads naturally beside them
6. compare the set-card height to v0.72.2; it should be equal or shorter
7. check narrow-screen behavior and bodyweight `Added weight` labeling
8. do not redesign other workout elements unless new phone feedback identifies a specific issue

Outstanding independent cloud check:
- v0.71.0 real-device short-share sender/recipient verification is still pending



## 2026-10-06 update-distribution architecture locked

Canonical contract:
- `docs/UPDATE_DISTRIBUTION.md`

Release model:
- `main` / Swole Cat Testing is the only place active development occurs
- Testing package: `com.jlingenfelter.swolecat.testing`
- Testing update channel may advance after validated signed Testing releases
- `beta` / Swole Cat moves only after explicit user approval to promote
- Beta package: `com.jlingenfelter.swolecat`
- ordinary `main` work must never advance the Beta update feed
- updater/distribution must not require a Swole Cat cloud account
- preferred initial distribution: versioned signed APKs on GitHub Releases + tiny public Testing/Beta channel manifests
- Supabase remains user-data/cloud infrastructure rather than update authority
- updater verifies versionCode/channel/package and APK SHA-256 before handing installation to Android
- Android may require one-time Allow from this source / install approval; silent install is not assumed
- active workouts must never be interrupted by the installation flow

One-time Beta bootstrap:
- implement and prove updater entirely on Testing first
- then create a new Beta baseline containing the updater and signed with the permanent Beta/release key
- current v0.66.1 beta testers may need one final manual/fresh-install migration
- protect tester local data with cloud sync/backup or export before any uninstall
- once the new Beta baseline is installed, future Beta releases should arrive through the in-app updater

Immediate next engineering task:
1. implement update manifest + native updater in Testing only
2. install Testing version N on the real Android phone
3. publish signed Testing N+1
4. prove in-app N -> N+1 update with local data/auth/workout state preserved
5. test bad hash, wrong package/channel, offline, and active-workout deferral
6. only then create/promote the new Beta baseline


## 2026-10-06 Testing updater proof-ready checkpoint

Status: **proof-ready, not yet real-device proven**

Testing updater implementation is present and automated.

Proof pair:
- baseline: Swole Cat Testing v0.73.0 / Android versionCode 103
- baseline signed workflow artifact ID: `11451167705`
- baseline release tag: `testing-v0.73.0`
- baseline direct APK SHA-256: `8c8461a21b7f6620da3bfab4927edfa48b0a2e274ff139bf6b725cbe51310dea`
- target: Swole Cat Testing v0.73.1 / Android versionCode 104
- target signed workflow artifact ID: `11450429897`
- target release tag: `testing-v0.73.1`
- Testing manifest currently points to v0.73.1

Updater behavior implemented:
- Settings -> App & updates
- passive update checks plus manual Check for updates
- explicit Download & verify action
- active workouts block update download/install
- updater validates Testing channel/package
- updater validates versionCode upgrade only
- updater validates APK SHA-256
- updater validates installed/candidate signing certificate
- updater validates release certificate declared by manifest
- updater uses Android PackageInstaller
- Android 12+ SessionParams explicitly requires user action
- unknown-source permission is surfaced through Android settings when needed
- no silent-install bypass

Dedicated regression:
- `scripts/app-updater-stress.mjs`
- updater foundation validation is green

Immediate real-device proof:
1. install v0.73.0 over the current Swole Cat Testing app
2. confirm local Testing routines/history/settings/auth remain present
3. Settings -> App & updates
4. confirm installed shows v0.73.0 build 103
5. Check for updates should discover v0.73.1 build 104
6. Download & verify update
7. if Android asks, enable Allow from this source for Swole Cat Testing
8. Install update
9. approve the normal Android update confirmation
10. reopen and confirm v0.73.1 build 104 plus all local data/auth remain intact
11. only after this succeeds mark core updater proof complete


## 2026-10-06 Testing updater real-device proof COMPLETE

User confirmed the real Android updater proof worked perfectly.

Proven path:
- starting app: Swole Cat Testing v0.73.0 / build 103
- update target: Swole Cat Testing v0.73.1 / build 104
- update was initiated from inside Swole Cat Testing
- Swole Cat discovered the published Testing update
- APK download/verification completed
- Android handled the required user approval/install flow
- update installed in place successfully
- resulting app remained Swole Cat Testing on the same Testing package/signing identity
- the user reported the flow worked perfectly

Conclusion:
- core Testing in-app updater is now real-device proven
- normal Testing development no longer requires manually handing the user a fresh APK for every release
- future Testing releases may advance the Testing update feed after validation/build succeeds
- no Beta promotion has been performed yet
- Beta must remain frozen until the user explicitly authorizes promotion

Next gated milestone:
- when explicitly approved by the user, create the new one-time Beta baseline from the selected tested Testing checkpoint
- include the proven updater in that Beta baseline
- use the permanent Beta/release signing identity
- current v0.66.1 beta testers may need one final manual/fresh install
- after that baseline, future Beta releases should use the in-app updater


## 2026-10-06 Beta baseline promotion checkpoint

Status: **Beta branch promoted and validated; signed baseline publication blocked only on missing permanent release secrets.**

Approved source:
- updater-proven Testing checkpoint: v0.73.1 / Android versionCode 104
- proven source commit: `b116cd08bca04408187044abc6eba7c95386aa51`

Beta promotion:
- PR #18 promoted the approved application checkpoint to `beta`
- Beta package: `com.jlingenfelter.swolecat`
- Beta app name: `Swole Cat`
- Beta updater feed: `updates/beta.json`
- Beta feed starts disabled and cannot publish until the signed release workflow succeeds
- updater now chooses Testing or Beta manifest from the native package channel
- Android OAuth redirect now derives from the actual package identity at build time
- PR #19 corrected only a malformed auth regression matcher
- current Beta branch commit after hotfix: `38ca71f05cd8c874aa321733291a45f80ad597eb`
- full Beta validation run 758: PASS, 77 steps

Signed Beta workflow:
- workflow: `Build Signed Swole Cat Beta Android`
- run 2 reached the signing-secret gate after Beta promotion/updater/auth regressions passed
- publication stopped safely because `SWOLE_CAT_ANDROID_KEYSTORE_B64` was not configured
- no Beta release asset was published
- `updates/beta.json` remains disabled
- no tester-facing update was exposed

Permanent Beta signing identity generated for the new fresh-install baseline:
- alias: `swolecat-beta`
- certificate SHA-256: `6942d0f5e2f809fd998e88c73b272b460145551e2bf6bbcd631c577f1d9defc8`
- sensitive keystore/password values must never be committed to the repository
- GitHub repository secrets required:
  - `SWOLE_CAT_ANDROID_KEYSTORE_B64`
  - `SWOLE_CAT_ANDROID_STORE_PASSWORD`
  - `SWOLE_CAT_ANDROID_KEY_ALIAS`
  - `SWOLE_CAT_ANDROID_KEY_PASSWORD`

Immediate next action:
1. user adds the four permanent Beta signing secrets from the generated secure backup
2. rerun/trigger the Beta signed build from `beta`
3. verify package/name/auth/updater/signature/hash
4. publish `beta-v0.73.1`
5. enable `updates/beta.json` only from the successful signed workflow
6. hand the fresh-install Beta APK to testers
7. perform one final fresh-install migration for the current v0.66.1 cohort
8. verify the new Beta baseline can later receive a Beta in-app update before calling the Beta updater fully proven


## 2026-10-07 Beta baseline signing blocker narrowed to one GitHub secret

Current Beta branch:
- app baseline: v0.73.1 / Android versionCode 104
- full Beta validation: PASS, 77/77
- latest validated Beta commit before publication checks: `a1190255885d2c9334f6acc79e6b1544e4d9f1d1`
- Beta update feed remains disabled
- no tester-facing Beta release has been published

Signing preflight result:
- keystore Base64 payload: accepted and decoded
- JKS structure: verified
- blocker: `SWOLE_CAT_ANDROID_STORE_PASSWORD` in GitHub does not unlock the permanent Beta keystore
- local backup keystore and its generated store password were independently verified with keytool
- user must replace only the GitHub Actions secret `SWOLE_CAT_ANDROID_STORE_PASSWORD` using the exact generated value from the secure signing backup
- after replacement, rerun signed Beta workflow and continue through alias/key-password, Gradle build, certificate verification, SHA-256, prerelease publication, and beta.json enablement
