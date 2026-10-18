# Swole Cat - Next Chat Handoff

## ACTIVE PERFORMANCE WORK (October 18, 2026) — next steps while owner tests signed v0.93.3

- Owner requested that engineering proceed while he checks real-device **Testing v0.93.3 / code 138**. Personal trainer/client future concept remains parked and documented separately; **do not touch it for the active development phase**. Current visual UI/UX freeze remains.
- **Draft PR #80** https://github.com/jlingenfelter22-bot/Swole-Cat/pull/80: nonvisual Exercise Library initial 32-card rendering + automatic 32-card append on scroll; unchanged row HTML, search, filter, favorites. Both [full 97-step validation](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/39151646810) and [synthetic performance baseline](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/39151646858) PASSED on PR exact HEAD. Initial library rendering ~20–27 ms, compared with ~120–140 ms before (not physical Android FPS). **Do not merge/publish/republish same-version v0.93.3 by accident.**
- **Draft PR #81** https://github.com/jlingenfelter22-bot/Swole-Cat/pull/81: isolated, **read-only CI Android variant lab** completed successfully [run #39152331866](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/39152331866). From identical v0.93.3 JavaScript/CSS, built ephemeral debug / unsigned release-no-R8 / unsigned release-R8 wrappers without real signing secrets, release tags, APK uploads, manifest writes or private data access. Size bytes respectively **5,206,278 / 3,717,901 / 1,688,225**. DEX uncompressed bytes **9,364,024 / 7,582,320 / 1,450,012**. **R8 package ~67.6% smaller, but NOT proven 67.6% faster or any runtime speedup.** All web assets have identical SHA-256. Native plugin behavior, updater, secure storage and actual WebView jank must be tested before changing shipped build configuration. **Keep PR #81 draft/unmerged** and never install ephemeral/unsigned experiment APK over existing Testing installation. Report in `docs/ANDROID_BUILD_VARIANT_AUDIT.md` (draft branch) and PR body.
- Next priorities: obtain user's physical v0.93.3 results (Coach three-day response, History 24/48 scrolling, older recaps/edit and responsiveness), decide if any regression needs an urgent fix. After acceptance, consider **safely versioned signed Testing** candidate for PR #80 Exercise Library only if user approves; separately research R8/Capacitor native plugin keep rules, secure-storage/updater runtime validation and actual Android startup/frame traces before any build-mode change. Current Beta remains v0.73.1 untouched.
- **No current app release changed by PR #80 or PR #81**; published Testing still v0.93.3 and update feed unchanged. Nothing about trainer-client roadmap authorizes development today.

---


## PARKED FUTURE IDEA: Swole Cat for Trainers (captured Oct 15, 2026)

- Owner installed signed Testing **v0.93.3 (Android build 138)** and expects to test Coach/History speed shortly. **Immediate engineering focus remains real-device performance/functional acceptance, no UI redesign.** Beta unchanged.
- While speaking with his father, a working personal trainer, owner identified a **future trainer-focused branch or app**: a trainer can manage many **independent client profiles**, each with their own workouts, routines, programs, progress and history; a client links their own Swole Cat experience to that trainer and receives trainer-published future program changes, while sending permitted workout logs/results back. Support in-person switching of selected client as well as remote programs.
- Captured full vision, candidate phased MVP, professional product alternatives (Trainerize, TrueCoach, Everfit), unsolved separate app vs role design, sync authorization, client ownership, invitation/unlink safety, offline conflicts, privacy and permission boundaries in **[`docs/FUTURE_TRAINER_PLATFORM_CONCEPT.md`](FUTURE_TRAINER_PLATFORM_CONCEPT.md)**. Cross-linked in **`docs/ROADMAP.md`**.
- **Parked/not approved to build:** no new trainer architecture or Supabase schema changes, no separate Android APK, no UI/UX changes and no trainer development until personal app stability and owner explicitly prioritizes it. Preserve personal free-core model; trainer pricing is TBD.
- Files are documentation only; should **not trigger an Android Testing release**. Continue receiving owner feedback on installed v0.93.3.

---


## LATEST: Testing v0.93.3 SIGNED PUBLISHED — Android phone performance acceptance next (October 15, 2026)

- Owner approved next checkpoint for on-device acceptance of Coach and History optimizations; [PR #79](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/79) **merged** after exact-head [96/96 full CI](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38759510312) and [synthetic benchmark](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38759510281) both passed.
- Android signed workflow [38759979718](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38759979718) completed **SUCCESS**. [Published Testing v0.93.3 GitHub prerelease](https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.93.3) signed APK: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/download/testing-v0.93.3/swole-cat-testing-v0.93.3-signed.apk . Android **versionCode 138**, package `com.jlingenfelter.swolecat.testing`, expected original signer SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`. APK's GitHub asset SHA-256 `5d94aa6e36d1b85a39b6fa563f0af6dfcff2380650bebb1e004791a66cd4453b` matches live `updates/testing.json` URL/version/code/cert/digest. Check all passed. APK size 5,206,278 bytes; **non-forced update**. In-place update from v0.93.2 should preserve Testing local data. Do not uninstall/clear storage.
- Included nonvisual changes: eliminate needless Coach whole-program fuzzy catalog scanning (synthetic generation ~1.16 s → ~52–62 ms previously), and first History paint with 24 original cards and additional batches as user scrolls (~460 ms for 300 cards → ~26–28 ms first 24 cards in jsdom). Existing styling/cards, recaps, edits, programs, cloud account semantics unchanged. **Real Android performance not yet accepted; jsdom is not an FPS trace.**
- Beta app/branch remains independent at v0.73.1, branch `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`, untouched; no cloud/account/data migration.
- **NEXT:** User installs Testing v0.93.3 and tests: same detailed 3-day Coach prompt, compare response to 0.93.2, open History, scroll through boundaries at sessions 24/48/72, open old workout recap, Edit/Manage, back navigation, ensure scrolling doesn't jump or stall, and confirm stored history unchanged. No visual redesign. If History scroll batching janks, profile on Android and adjust scheduling/size without changing appearance. Next broader phase: further library/Progress performance and optimized Android build comparison, ONLY after owner feedback.

---


## SIGNED TESTING v0.93.3 RELEASE AUTHORIZED (October 15, 2026)

- After validating Coach parser and History progressive render benchmarks and all 96 prior tests on draft PR #79, owner explicitly agreed to the next checkpoint: **publish an in-place signed Testing Android build for device acceptance**. Testing version bumped **0.93.2 → 0.93.3**, Android **versionCode 137 → 138** in `package.json` on PR #79. User specifically does NOT want visual UI/UX changes.
- This release includes **only nonvisual Coach program language-parse fast path, History 24-card progressive on-scroll DOM rendering, synthetic non-production CPU/DOM profiling and regression tests**, plus version metadata and reports. No app UI CSS redesign or new Coach features.
- Require exact-head Validate + synthetic performance workflow **both successful before merge**; then run Android `.github/workflows/android.yml`, requiring original persistent Testing signer `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`, package `com.jlingenfelter.swolecat.testing`, v0.93.3/code 138, prerelease asset `swole-cat-testing-v0.93.3-signed.apk`, digest in `updates/testing.json` equal to actual release asset. Never clobber a prior version APK, delete accounts, uninstall or reset local storage. Beta remains unchanged.
- **Device acceptance pending**: after installing over existing Testing v0.93.2, create 3-day Coach plan and gauge responsiveness, open History with accumulated sessions, scroll through multiple 24-card boundaries, tap older Recap/Edit/Manage, ensure scroll/focus/visuals remain stable and original data preserved. Real Android compositor/FPS cannot be declared validated by jsdom. If phone feedback reports jank, adjust only nonvisual scroll batching.

---


## HISTORY RENDERING OPTIMIZATION, DEVELOPMENT-ONLY (October 15, 2026)

- User requested advancing next highest priority after Coach parser fix: optimize **History rendering** while honoring hard visual UI/UX freeze and no production/cloud/Beta changes.
- Draft [PR #79](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/79) now includes `src/js/07-history-editor.js` performance change (and existing Coach parser optimization): render newest **24 History cards** on opening (unchanged HTML/controls/sequence numbering), append next 24 when scrolled near bottom. Preserve visible depth across save/edit/delete, no observer-based visible UI, no new buttons/stylesheet. Passive window scroll handler with animation-frame coalescing; does no work when History view is inactive.
- Existing 300-session first History render ~460 ms in synthetic Node+jsdom [old CI #38696266821](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38696266821), now **~26 ms initial 24 cards** [benchmark #38757877040](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38757877040). Full append of remaining 276 cards still has cost (~246ms cumulatively), just spread across scroll; not a claim of phone FPS or total work elimination. New regression `scripts/history-progressive-render-stress.mjs` verifies 75 sessions accessible, sequence numbers, actions, scroll append, preservation of already rendered nodes/depth, empty view and synthetic deletion. Initial CI assertion bugs were test-side (30-card expectation after new 24-item window and ID-prefix false match) and have been fixed.
- Full validation CI must pass on the final HEAD before release action; **PR still draft/unmerged**, owner hasn't authorized a new Testing APK, and merging to `main` could spuriously republish unchanged v0.93.2 APK because Android workflow watches `scripts/**`. Beta v0.73.1 remains unchanged, Testing published v0.93.2 (build 137), cloud/account/history data untouched.
- Detailed report in `docs/PERFORMANCE_AUDIT_CHECKPOINT.md`. Next is final exact-HEAD CI, then safe release strategy and real Android scroll/frame validation only when owner approves. Longer-term large-history windowing can be explored if first batches still cause jank, without visual redesigns.

---


## PRIORITY PERFORMANCE FIX PREPARED (draft PR #79; October 15, 2026)

- Owner approved proceeding from v0.93.2 accepted Coach keyboard functionality to nonvisual performance/reliability improvements. **No UI/UX design changes.**
- Deep synthetic code profiling isolated a dominant multi-day Coach delay: `coachParseExplicitWorkout()` fuzzy scanned the exercise catalog for general weekday/time/equipment text, costing **~1.14–1.15 seconds** for a PPL request before actual program generation (~46–61 ms). History 300-session DOM insert (~388 ms) dominated HTML construction (~80 ms). See [pre-change CI 38696266821](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38696266821).
- In draft [PR #79](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/79) on `audit/functionality-performance-baseline-v0932`, optimized Coach `src/js/04c-coach-language-refinement.js` and `04e-coach-ui.js`: skip *fuzzy* matching when program-wide request is general (no explicitly named movement list), retaining exact matches/aliases, negative exclusions, and full fuzzy handling for standalone or explicitly requested exercise prescriptions. Both main and Home Coach entrypoints covered. Added targeted `scripts/coach-program-parse-fastpath-stress.mjs` to standard Validate workflow. Note an initial test mistakenly used a phrase with an exact alias and asserted fuzzy work; corrected to a truly typo-only phrase for meaningful coverage. Full tests on corrected HEAD still require green before any merge.
- [Post-change synthetic CI 38696932123](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38696932123) **PASS**, same program brief `coachParseExplicitWorkout` ~17–21 ms, full generated program median ~52–62 ms, down from previous median ~1.16–1.18s (runner-dependent, **not actual Android FPS/latency**). Use real Android evaluation after a safely versioned Testing release.
- The audit instrumentation now splits History HTML computation vs DOM parsing and profiles Coach stages; `docs/PERFORMANCE_AUDIT_CHECKPOINT.md` records evidence and limitations. Do not modify History UI/layout/interaction until separate profiling and owner approval.
- **Safety:** PR #79 remains **draft/unmerged**, no new APK, Testing stays v0.93.2 build 137, Beta v0.73.1 unchanged, cloud data/accounts untouched. CAUTION: `.github/workflows/android.yml` triggers signed Testing release on any `scripts/**` merge to main and can overwrite the *same version* APK if release version not bumped. Protect permanent Testing signing and in-place update integrity. Next: ensure final exact-head 94+ regression checks pass; then choose safe release gating/version bump if user authorizes, and continue Android profiling + History nonvisual efficiency work.

---


## ACTIVE AUDIT PHASE: Swole Cat functionality/performance architecture (October 15, 2026)

- v0.93.2 signed Testing (code 137) real-device Coach keyboard and preview **functionality accepted**; visuals **frozen** by explicit owner instruction. Do not interpret pending visual taste as functional regression or start a redesign. User explicitly authorized moving to comprehensive performance/reliability audit *before* advanced Coach expansion.
- Open **draft** [PR #79](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/79) on `audit/functionality-performance-baseline-v0932`, containing ONLY `scripts/performance-audit-baseline.mjs`, `.github/workflows/performance-baseline.yml`, `docs/PERFORMANCE_AUDIT_CHECKPOINT.md`, and this handoff. These create a reproducible, zero-network synthetic 30/150/300/1000 completed-session benchmark using the real app DOM and local storage, and clear source-backed risk inventory and physical Android profiling acceptance plan. No actual UI code, cloud/account data, Android package, Beta or signing changes.
- Audit scripts executed successfully in [baseline CI #38692442211](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38692442211) and generated artifact `synthetic-performance-baseline`. Observational GitHub Node/jsdom measurements: 300-session History DOM ~350–440ms depending on run, exercise-library DOM ~139–181ms, Progress ~73–106ms, focused workout canvas ~4–5ms. Full three-day Coach input+generation ~746–1204ms; existing-preview DOM rerender only ~5–9ms, one-day standalone exercise selection ~5–9ms and duration trim ~0.1ms; root cause of bulk end-to-end delay needs deeper instrumentation. With 1000 synthetic sessions: full local state ~3.95MB and whole-state save ~8–11ms on CI. Built combined JS 1,122,166 bytes and CSS 229,723 bytes. **NONE are Android FPS or proof of user-device performance.**
- High-priority code-backed concerns: full session list `innerHTML` regeneration in History; Coach submit/generation main-thread computation; exercise library full-list rerender; Progress recomputation; growing monolithic local WebView state. Existing derived-session caching and deferred saves are real wins. `.github/workflows/android.yml` signs an `assembleDebug` APK for users; carefully compare a test-isolated optimized variant **with correct persistent signing** and backups before changing any release workflow.
- **Do not merge PR #79 yet**: `.github/workflows/android.yml` publishes Testing from `main` changes under `scripts/**` and could overwrite same-version v0.93.2 APK when a benchmark script merges. No APK publication/version change currently authorized. Audit is ongoing; follow-up is deeper Coach sub-stage CPU analysis plus real-device Perfetto/Android Studio frame, heap, startup and keyboard trace on owner-approved isolated Testing setup. Full regression CI must stay green before any production action.
- Reference complete audit and prioritized measurement gates: `docs/PERFORMANCE_AUDIT_CHECKPOINT.md`. Beta remains independently signed v0.73.1, unchanged.

---


## CURRENT PRIORITY: Freeze visual design, audit functionality + performance (October 15, 2026)

- **User's real-device acceptance on signed Testing v0.93.2 (build 137): Coach floating input and Android keyboard functionality now work correctly.** Their qualifier "not perfect" refers **only to visual design/UI aesthetics**, not functional or keyboard failures. **Do not start another keyboard/UI polish pass based on that qualifier.**
- **Explicit visual-design freeze:** no changes to current UI appearance, layout, colors, animations, or UX styling until user requests them. Do not suggest cosmetic polish as the next task.
- **Next engineering phase:** comprehensive, measurement-driven **functionality + performance + architecture audit** before expanding Coach or adding major features. First gather a reproducible Android baseline and assess startup, screen navigation, 60Hz scrolling/jank, keyboard responsiveness, active workout/set entry, Coach generation, long history and Progress, memory and local storage size, background/cloud sync overhead, JavaScript main-thread stalls and unnecessary render work, and debug-vs-optimized build comparison. Record baselines, prioritize bottlenecks, implement nonvisual fixes only with performance regression checks and data integrity safeguards.
- **Release/data boundaries:** keep separate Testing and Beta applications; Beta remains v0.73.1 until owner explicitly approves promotion. No account switching, clearing storage, cloud data edits, migrations or history modifications to run benchmarks. Prefer synthetic/test fixtures or a safe test-only workspace. Do not change the signed release/update flow without authorization.
- **Status:** Phone UI functionality accepted by owner; **whole-app performance has not yet been measured or certified**. Audit is next, not already complete. Do not conflate 94 green correctness checks with Android frame-time/memory profiling.

---


## LATEST RELEASE: Signed Testing v0.93.2, Android code 137 (October 14, 2026)

- **Owner explicitly authorized Testing-only publication to verify floating Coach composer alignment and native Android Gboard smoothness.** [Release PR #78](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/78) merged using squash into `main` as `40e7b31a8f8c266e2ac19228e5b3f39cadbff8d3`. Contains validated dev PR #77's scoped Coach preview keyboard/scroll structure, title and prompt polish, and package version bump to 0.93.2 / code 137.
- Exact-head release PR automated [CI 38629960773](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38629960773) **PASS, all 94 steps**. Signed Android Testing [workflow 38630527904](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38630527904) **SUCCESS** with original Testing signing key and signing verification.
- **LIVE:** [Testing v0.93.2 GitHub prerelease](https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.93.2) and [signed in-place-update APK](https://github.com/jlingenfelter22-bot/Swole-Cat/releases/download/testing-v0.93.2/swole-cat-testing-v0.93.2-signed.apk). `updates/testing.json` is version `0.93.2`, versionCode `137`, package `com.jlingenfelter.swolecat.testing`, SHA-256 `fad0f6186bcea6b7f6e4763190d132e043193319f4cbdeb157c4d92aaa98214a`, signer cert SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`. Manifest URL and digest exactly match the actual GitHub release asset. Update is **optional**, not forced. User may install with existing in-app updater or directly over existing Testing APK; **do not uninstall, reset storage or switch cloud accounts**.
- **Beta remains v0.73.1, branch `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`, unchanged.** No Supabase/account/schema/cloud migration or historical workout modifications.
- **Next checkpoint: real-device owner acceptance**. Owner to reproduce original screen-video bug while scrolling through long Coach program preview and opening/closing Gboard repeatedly; verify header and floating input stay joined, exercise section doesn't jump upward, back/voice/focus behave normally, and scrolling is smooth. See `docs/coach-brain/ANDROID_FLOATING_COMPOSER_FIELD_REVIEW_V0932.md`. Automated success does not certify physical Android behavior. Hold broader Coach full-program conversational editing until on-device outcome reviewed.

---


## ACTIVE: Physical Android v0.93.1 Coach floating-bar feedback, v0.93.2 development-only correction (Oct 14, 2026)

- User's ~44-second real phone capture of Testing v0.93.1: floating Coach composer is a positive direction but looks disconnected from upper modal region; day exercise text peeks **above** the dock at the top, and opening/closing the Android software keyboard repositions the long workout content/jumps around. Keep floating experience, fix scroll/IME layout deliberately without visual patch animations.
- Current development branch `feature/coach-v0932-keyboard-dock-stability`: Coach preview only now uses a bottom-aligned, safe-top-aware single-`100dvh`-sized flex sheet with fixed normal-flow modal header and a **separately scrolling `#modalBody`**. Coach input remains sticky at the top of this inner scrollport, directly below modal header, no exposed overlay gap. Removed `@media(max-height:540px)` composer demotion that flipped sticky to relative when Gboard reduced viewport height; continue existing Android `resize:native` without JS scroll hacks. Saved-program editor and other modal modes untouched.
- `scripts/coach-mobile-program-acceptance.mjs` expanded to enforce viewport/header/body/sticky rules. Field analysis + follow-up hardware test: `docs/coach-brain/ANDROID_FLOATING_COMPOSER_FIELD_REVIEW_V0932.md`. **Real Android keyboard smoothness still requires a second owner recording**, not guaranteed by CSS contract or JSDOM.
- **No release permission inferred:** signed Testing remains v0.93.1 build 136, Beta v0.73.1 unchanged. Do not merge/publish APK without explicit owner go-ahead, CI pass and new signing/checksum verification. Full-program Coach conversation still postponed until on-device interaction accepted.

---


## CURRENT SIGNED TESTING — v0.93.1 / Android build 136 (Oct 14, 2026)

- Owner requested **physical Android validation first**, ahead of broader full-program conversational editing. This is a **Testing-only** release authorization. Release PR [#76](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/76) squash-merged into `main` as `8f4649824f6f11c5104e59ae4e39a0a69dddfa62`. Code is consolidated from development [PR #75](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/75), including parent #72/#73 and the safe top-of-list Coach refinement UI from #74. It uses #73's full guarded contextual saved-program draft editor, not #74's narrower routine picker.
- Release PR exact-head full validate **SUCCESS, all 94 workflow steps**, run [38601381548](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38601381548). Permanently signed Android Testing workflow **SUCCESS**, run [38601818071](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38601818071); main push validation triggered separately. No new signing key, no Beta push, no Supabase/account schema/data work.
- **LIVE SIGNED APK**: [v0.93.1 prerelease](https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.93.1), downloadable [signed Testing APK](https://github.com/jlingenfelter22-bot/Swole-Cat/releases/download/testing-v0.93.1/swole-cat-testing-v0.93.1-signed.apk). Android `versionCode=136`; same package `com.jlingenfelter.swolecat.testing`. SHA256 `c87ad62db8a97c2cc16c52766fdda74ceeeb6bcd37e90a96d043a66e826b2c66` matches release asset and `updates/testing.json`. Original Testing signer cert SHA256 remains `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`. Testing updater feed advanced correctly, not forced.
- **CURRENT NEXT ACTION**: owner updates existing installed Testing app *in place*, **never uninstall/clear storage or switch cloud accounts**, follows [Android phone acceptance checklist](coach-brain/ANDROID_PHONE_ACCEPTANCE_V0931.md). Focus: Gboard open/close and scroll jumping, composer located above day cards, tapping/scrolling through collapsed days, Wednesday-only update, summary scroll resets, saved-program Coach review/Cancel and guarded Apply on disposable data. Collect annotated screenshots/video and fix any true Android regressions.
- **PHYSICAL ANDROID ACCEPTANCE STILL PENDING**. Successful CI and signed release do not mean real hardware layout/IME works. Do **not** implement broader saved-program full-freeform conversation until owner feedback/signoff; do not promote any of these changes to Beta. Beta branch stays at `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`, v0.73.1. Optional intake design PR #71 remains separate. Cloud Coach Memory remains deferred.

---


## CURRENT DEVELOPMENT CHECKPOINT — Unified Coach phone UX + protected saved-program editing (Oct 14, 2026)

- Integration work is on `feature/coach-v094-consolidated-phone-ux`, based **directly on draft PR #73** (`feature/coach-v094-saved-program-edit`), which already includes parent PR #72. PR #74 was independently based on v0.93 main, **not** a descendant of #73; do not directly merge it over the more capable program editor.
- Consolidated priority from PR #74: **Talk to Coach now appears before** the generated program exercise-day breakdown. Program refinement remains one actual input, with sticky top placement (and short-viewport fall-back), compact optional prompt tips, one expanded day and the rest collapsed. Shared modal reset-to-top, nearest keyboard scroll, and optional method review already exist in #72/#73 and are preserved. Saved-program editing retains its *separate* bottom proposal input and explicit Apply/Cancel.
- Keep PR #73's contextual saved-program draft editor, not PR #74's simpler routine picker. Current editor supports named day time targets, move weekday, named exercise add/remove/same-pattern replacement, training-mode changes, multi-clause draft isolation, review-before-apply, copy-on-write for modified routines, original history preservation, stale snapshot guard, account-switch guard, and active-workout guard. Full freeform program redesign is **not** implemented.
- Strengthened `scripts/coach-mobile-program-acceptance.mjs` to verify above-list composer ordering, exactly one Coach input, scoped sticky mobile styling, shared Android/modal protections, and that saved-program editor safety entry points survived integration. Existing dedicated `scripts/coach-saved-program-edit-stress.mjs` tests scoped editing/copy-on-write/history/conflicts. Full CI on **integration exact HEAD** is mandatory; real Android Gboard/voice/screen-size validation remains pending and cannot be inferred from synthetic tests.
- **NO RELEASE AUTHORIZATION:** Signed Testing remains v0.93.0 / code 135, Beta v0.73.1 unchanged. No signed APK, no merging into main/beta, no account/Supabase/history writes. Optional first-run profile design PR #71 remains separate. Subsequent checkpoint: inspect CI, Android QA for sticky refinements and saved-editor review/cancel/apply, then determine whether a separate Testing candidate is warranted.

---


## CURRENT DEVELOPMENT — Owner Walkthrough Remediation (Oct 14, 2026)

- Owner approved moving ahead with the prioritized findings of the actual signed **Testing v0.93.0** Coach walkthrough and detailed research report. No explicit new signed release/Beta promotion authorization was given; **Testing remains signed v0.93.0 build 135**, **Beta v0.73.1 untouched**, no Supabase/account mutations.
- First stacked development PR [#72](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/72) branch `feature/coach-v0931-android-interaction`: Android IME input no longer triggers smooth centered autoscroll while WebView resizes; shared modal resets scroll to top on open, including Workout Complete; 3-day Coach preview begins with one day expanded, extra muscle/weekly rationale collapsed, sticky violet **Ask Coach** composer, clearer Coach/Home tonal emphasis. Full 94-step CI **PASS** [38592886190](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38592886190). Physical keyboard/layout acceptance still pending.
- Next stacked development PR [#73](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/73) branch `feature/coach-v094-saved-program-edit`: visible **Edit with Coach** on saved Program cards and options; open existing Program and cloned workout routines, propose narrow exact day/session changes without changing saved records; show before/after notes and untouched days; Apply after explicit review only. Scope supports day time *target* (not automatic training-volume trimming), weekday move, named exercise add/remove/same-pattern replacement and training mode. Copy-on-write changed routines keeps other Programs and old History intact, preserves same Program ID/nextIndex, compares original snapshots to reject stale edits, checks current cloud owner and blocks active-workout edits. Wider split rebuilding is **not implemented**; unknown commands explain limitations instead of guessing. Read `docs/coach-brain/SAVED_PROGRAM_EDIT_V094.md` for exact acceptance contract.
- New `scripts/coach-saved-program-edit-stress.mjs` runs through existing Coach duration/program CI, tests local proposal isolation, scoped edits, copy-on-write and original history, conflict and active-workout guards. At latest handoff check exact PR #73 HEAD CI; source was updated after an earlier green result, so **do not claim the newest HEAD green without checking**. Parent PR #72 validated and remains development-only.
- Intake/profile direction captured in separate design-only [#71](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/71), unmerged. New-user intake work and deeper Coach personalization follow the immediate Android UX and saved-program continuity passes; do not add injury/health notes directly into cloud-synced `state.profile`.
- **Next approval/checkpoint:** confirm full current v0.94 development CI, restore stacked PR #73 base to parent PR #72 branch after validation. Request **separate signed Testing candidate** approval for a real-device trial when ready; Beta promotion requires a different approval. During owner physical Android test: Gboard/open/close/speech keyboard behavior, summary opens at top, default collapsed days, anchored composer, saved Program → Edit with Coach → change Wednesday only → Cancel/Apply, subsequent history and progression. Do not infer real phone acceptance from JSDOM.

---


## CURRENT RELEASE: Signed Testing v0.93.0 · Owner's real Android Coach acceptance (October 14, 2026)

- The user authorized publishing a **Testing-only** candidate; no Beta authorization. Combined v0.90–v0.93 Coach release PR [#70](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/70) merged to `main` at `05f65acf2506408abfe493b93b0ec437d76145be`. Older development PR #66–#69 are superseded. Main contains conversational split intake, whole-week quality review, per-day duration/equipment/focus, and narrow-screen day editor.
- **SIGNED TESTING LIVE**: v0.93.0, Android versionCode **135**, package `com.jlingenfelter.swolecat.testing`. Prerelease https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.93.0; signed APK https://github.com/jlingenfelter22-bot/Swole-Cat/releases/download/testing-v0.93.0/swole-cat-testing-v0.93.0-signed.apk.
- Release PR full CI **94/94 PASS**: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38581996912. Main push full CI **94/94 PASS** https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38582524614. Permanently signed Testing Android build, manifest advance **PASS** https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38582524189.
- `updates/testing.json` live version **0.93.0**, code **135**, SHA-256 `9730aafc2b16b22f855a28e3e5d656076d40dff5ed5a4294af3599d312bfaf4c`, same original Testing certificate SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`. GitHub release asset digest matches manifest.
- **Beta untouched** branch SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`, Beta v0.73.1. No Supabase changes, no account switching, no data destruction, no Beta release.
- **IMMEDIATE NEXT:** user upgrades installed Testing in place via in-app updater or signed APK. Do not uninstall Testing, clear storage, change Google cloud accounts, or experiment on Beta. Review actual phone with `docs/coach-brain/ANDROID_ACCEPTANCE_V093.md`: ask for vague 3-day split and opt-in guidance, then mixed Monday/Wednesday/Friday gym/dumbbell PPL (30/45/75 min), inspect weekly review, adjust Wednesday to 55 min, keyboard/scroll/voice behavior, Swap/Remove, Save Program vs Save + Start. Review screenshots/video and fix observed usability problems before discussing Beta.
- **Android signoff remains PENDING** until user's actual device review; synthetic DOM checks do not establish physical rendering. Stopwatch-based duration calibration and deeper training quality follow afterward. Cloud Coach Memory is **deferred** in Phase 12 roadmap, not in this release.

---


## ACTIVE DEVELOPMENT CHECKPOINT: Coach v0.93 Mobile Acceptance (October 14, 2026)

- User explicitly authorized proceeding to the next Coach checkpoint after deferring Cloud Coach Memory in the Phase 12 roadmap. No APK release or Beta promotion approval was given.
- Draft PR [#69](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/69) branch `feature/coach-v093-mobile-acceptance` adds narrow-screen polish and acceptance tests on top of v0.92 [#68](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/68), v0.91 [#67](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/67), v0.90 [#66](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/66). Temporary PR #69 base `main` is solely to trigger existing full CI; restore base to `feature/coach-v092-per-day-planning` after green checks.
- Mobile UX: rich split recommendation cards one-column at <=430px, readable program exercise rows with Swap/Remove below title, better touch targets, stacked Save/Save+Start controls, 16px day-edit form inputs. Custom equipment remains hidden/disabled unless selected; correct overview label for equipment scoped by day. No Coach programming logic, cloud schema, auth, sync or saved history changes.
- Mobile DOM acceptance `scripts/coach-mobile-program-acceptance.mjs` is now a `validate.yml` CI gate; it renders actual modal HTML, checks labels, split advice, day card actions, custom gear disclosure, validation rollback, per-day refinements, save-button separation, CSS contracts and no history writes.
- **Important limit:** Synthetic JSDOM tests do **not** show Android WebView visuals, actual keyboard behavior, true hit target measurements, device scrolling or speech recognition. A physical Android owner review remains **PENDING** per `docs/coach-brain/ANDROID_ACCEPTANCE_V093.md`; do not conflate a green CI with device signoff.
- Latest signed Testing remains v0.89.0 code 134; separate Beta v0.73.1 unchanged; owner must separately approve any signed Testing release. Cloud Coach Memory remains deferred in `docs/ROADMAP.md`.

---


## OWNER DIRECTION: Cloud Coach Memory deferred; continue Coach quality (October 14, 2026)

- Explicit owner request: document **Cloud Coach Memory** in canonical future roadmap and **continue existing Coach engineering first**. Logged as **deferred** in `docs/ROADMAP.md` → Phase 12. Proposed optional Lifetime Pro value: private account-owned preferences, compact workout-history context and cross-device memory; preserve free/offline local Coach. No schema migrations, Supabase mutations, entitlements, new AI vendor, unlimited inference promise or added subscription.
- Continued qualitative review of v0.92's real generated 30/45/75-minute mixed-equipment week. Friday gym Legs originally included Back Squat + Sumo Deadlift even though a less demanding posterior-chain alternative exists. A narrowly scoped candidate-score heuristic now discourages this **for auto-generated hypertrophy/general programs up to 90 minutes**, without banning the combination or affecting strength plans/user-pinned exercises. Time budget is a cap, not an instruction to fill every minute. Added explicit scenario and user-override regression to `scripts/coach-brain-duration-program-stress.mjs`.
- Exact approval gate remains unchanged: all stacked PRs #66/#67/#68 development-only, latest signed Testing v0.89.0, Beta untouched. New reviewer/CI pass required on latest v0.92 HEAD; no physical Android acceptance or release has occurred.

---

## ACTIVE DEVELOPMENT CHECKPOINT: Per-Day Coach Planning v0.92 (October 13, 2026)

- User explicitly authorized proceeding to the next Coach quality pass after v0.91 (follow-up in same Swole Cat conversation). **Development only.** No APK publication authorization; signed Testing remains v0.89.0 (code 134), Beta remains v0.73.1. Do not touch Supabase or recovery history.
- Draft PR [#68](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/68), branch `feature/coach-v092-per-day-planning`, stacked on v0.91 [#67](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/67) and v0.90 [#66](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/66). PR #68's base is temporarily main solely for full Actions CI; retarget to #67 branch after its HEAD validates.
- v0.92 recognizes weekday-scoped time/equipment/focus directives (e.g. `Mon 30 min gym, Wed 45 min dumbbells, Fri 75 min gym`), asks for a common time/equipment when some days lack it, and builds independent exercise/time/equipment settings per day without assuming a weekday's gear/time applies globally.
- Program preview has accessible `Adjust day` editor (15–120 min, inherit/gym/dumbbells/bodyweight/custom gear, emphasis on that day's muscles), atomic validation/regeneration and per-day range review. Saved Program includes `coachPlannedDays` contextual metadata and per-day routine descriptions. No existing workout session changes.
- Day focus incompatible with slot (e.g. Friday Legs, more shoulders) triggers clarification, offering to keep split and remove emphasis or change split. Does not silently ignore or spread priorities globally.
- `scripts/coach-brain-duration-program-stress.mjs` tests full prompt routing, partial defaults, mixed gym/dumbbells/gym, weekday refinements, day editor, rollback, saved metadata, conflicts, and history non-mutation. Generated output logged as `COACH_V092_DAILY`.
- Initial full CI **PASS** https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38514095460. Later head(s) include the additional focus conflict; verify latest run's result and inspect logs before claiming green. Design and limitations: `docs/coach-brain/PER_DAY_PLANNING_V092.md`.
- Immediate next: confirm newest CI on HEAD, retarget #68 to #67 stacked base, run qualitative review and request real physical Android UX validation from owner before any signed Testing release. Next potential engineering step: human-reviewed time calibration, more sophisticated multi-week/cycle intent, nonuniform recovery day-spacing checks. No Beta release.

---

## ACTIVE DEVELOPMENT CHECKPOINT: Whole-Week Coach Review + Split Guidance v0.91 (October 13, 2026)

- Owner approved starting the next intent-first Coach improvements after v0.90. This is **development-only** and does not authorize publishing an APK. Signed Testing stays v0.89.0 build 134; Beta unchanged v0.73.1. Do not touch accounts, recovery, Supabase data, or workout history.
- Draft PR [#67](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/67) on `feature/coach-v091-whole-week-review`, stacked conceptually over v0.90 guided program-intake [PR #66](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/66). Its base may temporarily point to `main` to run required GitHub Actions CI. **Retarget to #66's feature branch after a green full run.**
- Program setup "Help me choose" and text "recommend something" now ask for the goal if missing and give **explicit opt-in split explanations**, without choosing Full Body or any other split automatically.
- Current generated Program preview displays **read-only whole-week review**, recalculated from selected exercise IDs on render. Checks presence of press, pull, knee and posterior movement families; choice-based notices for custom-split primary chest omission, requested priority-region gaps, or days with no primary involvement in named focus. Never overrides user selections or diagnoses fatigue/injury.
- New tests in `scripts/coach-brain-duration-program-stress.mjs`: vague split recommendation consent, focused Arms/Back/Legs weekly role flags, manual addition updates the review, no manufactured flags for represented roles, missing priority-region visibility and no session-history writes.
- Full design and scientific caveats: `docs/coach-brain/WHOLE_WEEK_REVIEW_V091.md`; owner-approved north star `docs/coach-brain/COACH_INTENT_CONTRACT.md`.
- **Next:** full CI on latest PR #67 SHA, inspect actual program output for false warnings, refine copy/decision thresholds if needed, then physical Android acceptance before any signed Testing release approval. No Beta promotion.

---

## ACTIVE DEVELOPMENT CHECKPOINT: Guided Coach Program Intake v0.90 (October 13, 2026)

- **Owner-confirmed north star** documented in [Coach Intent Contract](coach-brain/COACH_INTENT_CONTRACT.md): understand intent, separate knowns/unknowns, ask consequential questions only, evaluate week-long program quality, negotiate incompatible constraints, explain decisions, respect exact user choices and learn from consented real-world feedback. Priority after v0.90: intent confidence/clarification → full-program audit → per-day constraint negotiation → feedback/personalization. These are design principles and proposed follow-ups, not claims of already-shipped functionality. This agreement does not authorize a new Testing or Beta APK.


- User found a real v0.89.0 **program conversation defect**: "3-day split" gets treated as full-body by default and setup asks only frequency/time/equipment, not what each day should train, schedule, progression mode, or deloads. Owner explicitly requested a deeper conversational program intake with these decisions.
- Draft PR **#66** https://github.com/jlingenfelter22-bot/Swole-Cat/pull/66, head `feature/coach-program-guided-intake-v090` from signed v0.89.0 `main`. **Development-only.** Signed Testing v0.89.0, build 134 remains published; no new APK. Beta v0.73.1 unchanged, no cloud or workout-history mutation.
- Implemented: vague frequency -> **choose split** (PPL, Upper/Lower rotation, Custom Body-Part, explicit Full Body), optional custom target per day (e.g. Arms / Back / Legs), duration, equipment, weekdays or flexible, training goal, training mode (Guided / Strength / Track), optional Guided deload every 3–8 training weeks. If prompt already contains a detail, skip redundant question. **Each intake step also has a free-text/voice input:** a multi-detail response such as PPL, 45 minutes, gym, Mon/Wed/Fri, Guided and deload every 4 weeks fills several unanswered constraints at once. Never change an already chosen 4-day frequency because a reply lists only 3 weekdays. The home Coach 3-day example now opens this guided flow. Never infer "3-day split" means full body.
- Persistence uses existing per-program `trainingMode` + `deload` schema, preserving confirmation for actual deload weeks; no new database schema. Generated day exercise selection honors chosen `customSlots`. Existing direct generator without interactive intake remains backward-compatible. Chat program refinement recognizes an explicit progression-mode and deload change.
- Synthetic test `scripts/coach-brain-duration-program-stress.mjs` exercises an entire three-day custom intake and verifies saved weekdays, routines, mode/deload plus unchanged history; checks fully specified PPL skip and full-body intentional choice.
- Research/scoping `docs/coach-brain/PROGRAM_INTAKE_DESIGN_V090.md` explains scientific uncertainty and acceptance.
- CI: PR #66 requires its **latest commit** green full regression; the new conversational multi-detail test is in `scripts/coach-brain-duration-program-stress.mjs`. Prior complete workflows (e.g. 38475744307) green, but check last branch HEAD after latest text/voice fixture. Existing generated v0.89 review remains available but a new qualitative v0.90 review is still needed before a release. **Do not claim a phone release or Beta approval.**
- Next steps: inspect CI, fix actual regressions, review generated custom Arms/Back/Legs and other split quality, verify user-friendly phone layout and confirm time/planning semantics. Only then request user approval to promote the next signed Testing build (likely v0.90.0). Real Android owner acceptance remains open.

---


## CURRENT RESUME CHECKPOINT: v0.89.0 SIGNED TESTING RELEASE (October 13, 2026)

**Latest Testing: v0.89.0 / Android build 134, signed APK and in-app update live. Owner-approved Testing promotion complete.**
- User explicitly approved v0.89.0 release into Testing `main`. All Coach v0.89 engineering from PR #62, #63, #64 was integrated through **release PR #65** https://github.com/jlingenfelter22-bot/Swole-Cat/pull/65 (merged as `6fe9c089d579af7b6d174cd6db6ee375316a7c5c`). #62 recognized as merged; #63/#64 stacked drafts closed as integrated, no Beta merge.
- Signed Testing release workflow **PASS** https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38469988579; candidate full regression **PASS** https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38469539367; generated-workout review **PASS** https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38469539499. Main validate https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38469988653, verify result before asserting main CI success.
- APK release https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.89.0; direct download https://github.com/jlingenfelter22-bot/Swole-Cat/releases/download/testing-v0.89.0/swole-cat-testing-v0.89.0-signed.apk; `updates/testing.json` version 0.89.0, code 134, checksum `9b09502d0b41ed86a15b66cbef55fb818bd2268c3a57c14a1c17c55374045ace`; cert SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`; package `com.jlingenfelter.swolecat.testing`.
- What changed: Coach Brain equipment clarifications, multi-turn multi-clause parsing, realistic duration planning with explicit set/rep preservation, refusal of unsupported full-body floor-only pulling coverage, program-day balancing and muscle priorities, Swap/Remove preview time refresh and uncertainty notices.
- **Immediate next:** user installs Testing v0.89.0 **over existing Testing**, preferably using in-app updater. Do NOT uninstall, reset app data or switch cloud accounts to test Coach. User can send a narrated screen recording, screenshots, notes. Test exact `5 x 5 deadlift in 20 minutes`, follow-up `make it 15 minutes` (5×5 stays), `make deadlift 4 sets of 6`, generated 20-min gym legs Swap/Remove and preview consistency, 3-day 45-min gym full-body, floor-only limitations, real session times and physical-phone usability. Consult `docs/coach-brain/PRE_RELEASE_PHONE_ACCEPTANCE_V089.md`. Owner approval for broader beta launch remains **not given**. Phone validation not performed yet.
- **Safety:** No Supabase cloud data or identities changed during this development/release. Prior cross-account leak and unsupervised recovery strictly forbidden; v0.88.0 signout safeguard remains, separate Android acceptance pending. Beta still **v0.73.1** and SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`.
- After real-world feedback, run a focused bug-fix pass in Testing before requesting any Beta promotion. Never invent field measurements from engineering time estimates.

Older checkpoints below are archives.

---


Last updated: 2026-10-13

This file is the canonical resume point for the next ChatGPT conversation. Read this first, then `docs/CURRENT_STATE.md` and `docs/ROADMAP.md` only if deeper evidence is needed.

## LATEST DEVELOPMENT CHECKPOINT: Coach v0.89 PRE-RELEASE ACCEPTANCE (October 13, 2026)

**Pick up here in the next chat. This supersedes the older v0.89 draft handoff below.**

- **Current development stack:** PR #62 `feature/brain-v089-quality-remediation` (passes original 20-scenario test); PR #63 `feature/brain-v089-explicit-duration-acceptance` (full CI green, exact user-specified 5×5 and `4 sets of 6` preserved); and new draft **PR #64** https://github.com/jlingenfelter22-bot/Swole-Cat/pull/64 from `feature/brain-v089-preview-refresh-acceptance` (stacked atop #63).
- **New finding:** 13/13 singles and 25/25 generated program days met the *engineering midpoint* time; however, **11/13 singles** and **23/25 program days** had *upper time estimates* over requested target. These are uncertainty ranges, **not** observed real-world overruns. Original post-remediation 20-case fixture: `docs/coach-brain/QUALITY_REMEDIATION_SCENARIOS_V089.json`.
- **Implemented draft PR #64:** Fix generated session duration preview staying stale when user manually Swaps/Removes an exercise; recompute current exercise IDs/actual adjusted sets. Clean up removed/swapped automatic set overrides, without silently trimming the user's replacement. Preview now explains high-side time risks for singles and multi-day programs even when midpoint fits. Regression added to existing `scripts/coach-brain-quality-remediation-stress.mjs`.
- **New acceptance document:** `docs/coach-brain/PRE_RELEASE_PHONE_ACCEPTANCE_V089.md` includes precise on-phone validation flow for exact 5×5, time-only edits, 20-minute gym legs, manual Swap/Remove, three-day full-body and measured real sessions. This is **not** Android testing completion or permission to release.
- **Validation:** PR #64 full **94-step CI PASS**: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38463629529; separate **real generated-workout capture PASS**: https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38463629638. New assertions for Remove/Swap time rows, saved sets, single upper-range warning and program upper-range warning all passed. Documentation-only commits after those runs require a final head check before release review. PR #64 is draft, no merge or release. Real Android owner acceptance and measured workouts remain undone.
- **Release safety:** signed Testing is still v0.88.0/build 133, Beta remains v0.73.1. No account/data/cloud mutation or release. Owner approval needed for Testing promotion **after** CI and review; separate Beta approval. Do not claim real-device timing has been measured.

---

## ACTIVE DEVELOPMENT CHECKPOINT: Coach Brain v0.89 (October 13, 2026)

**THIS IS THE WORK TO RESUME IN THE NEXT CHAT, not the previous cloud account feature.**

- **Shipped apps remain unchanged:** signed Testing v0.88.0 (Android 133), Beta v0.73.1. No new signed APK, Testing updater update, cloud mutation or account changes in the Brain work.
- **Baseline review:** PR #61, `review/brain-v089-session-program-acceptance`, captured 20 real synthetic workout/program scenarios. Initial coach-quality acceptance was denied despite green CI because of session-time overruns, false floor-only coverage and poor week distribution.
- **Approved remediation:** PR #62, `feature/brain-v089-quality-remediation`, reran the same 20-scenario matrix (GitHub Actions 38457817270, successful). 13/13 generated single sessions met the engineering time midpoint; 25/25 generated program days met midpoint. A floor-only full-body program now *fails honestly* due to missing true pulling equipment, rather than being labeled comprehensive. Two floor-leg exercises were added with stable IDs `lib_308` and `lib_309`, keeping original 308 IDs intact. Quality remediation is still **development only**, not an Android release.
- **Follow-up explicit-list time gap:** draft PR #63, `feature/brain-v089-explicit-duration-acceptance`, is layered atop #62. Exact user-authored workouts (e.g. `5 x 5 deadlift in 20 minutes`) were not receiving the time estimate, so duration feasibility and saved-set fidelity were not visible in previews. This branch computes the engineering time from exact sets/reps without trimming them; displays the range and warns when the midpoint exceeds the requested time. An untimed exact list is no longer presented as a requested 45-minute target. An explicit "make it 15 minutes" edit changes only the target, not exercise counts. Preview estimates recalculate after edits, removal and swaps.
- **Tests:** `scripts/coach-brain-quality-remediation-stress.mjs` extended for an exact 5×5 user-authored list, time-only refinement, set edit and untimed preview; already invoked by `.github/workflows/validate.yml`. PR #63 is a **draft, not accepted**. See `docs/coach-brain/EXPLICIT_DURATION_ACCEPTANCE_V089.md`.
- **Validation completed:** Initial PR #63 CI [38460441747](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38460441747) failed the new 4-sets-of-6 assertion and exposed a real explicit-edit rep parsing bug (sets changed, reps did not). Parser corrected in the branch. **Full revalidation PASS** [38460708958](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38460708958); independent generated-workout review PASS [38460708849](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38460708849). No real Android validation, Testing promotion or owner acceptance yet.
- **Remaining development/acceptance:** Inspect realistic 20-case outputs, then Android Testing-only owner review of preview readability and actual session timing (warmups, rest, waiting, unilateral work). Neither the 20-scenario generator nor the duration model measures stopwatch workouts.
- **Nonnegotiables:** Preserve existing accounts, cloud records, workout history, custom set/rep prescriptions, per-exercise load semantics and Testing/Beta signing separation. No Beta promotion. Do not merge/publish without explicit approval and a green full suite. Real-phone review remains a separate gate.

Older shipped-version handoffs follow below.

---

## CURRENT RESUME CHECKPOINT (v0.88.0 supersedes older instructions)

- **Latest Testing:** v0.88.0 / Android build 133; signed APK + Testing updater published: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.88.0. PR #54 https://github.com/jlingenfelter22-bot/Swole-Cat/pull/54 merged into `main`; PR suite https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38413146562 PASS, main suite https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38413588809 PASS, Android signing https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38413588869 PASS. APK SHA-256 `e28302b7bc268119be1d493db3f56a59c4828a548fc71ceb1e72205d656b5bb9`; permanent cert unchanged.
- **User mandate:** safeguard Google cloud switches so **current account fully syncs BEFORE signout**, then active phone workspace is cleared and next account retrieves only its own data. Absolutely no cleanup/deletion/mutation of existing Supabase cloud accounts or historic records. Testing field only; Beta untouched v0.73.1 SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`.
- **Implemented:** `Sync & sign out` calls `cloudSync.prepareAccountExit` for final sync, verifies no unsynced queue/conflicts, blocks offline/unavailable cloud, storage failures and unfinished active workouts, snapshots old full workout state per owner into a verified persistent `swolecat-account-exit-snapshot-v1:<ownerId>`, then signs out. Once sign-out succeeds, `cloudSync.completeAccountExit` resets in-use `overload_v3`, sync metadata and generic recovery/pre-import snapshots (previous owner data backed up under its own safety key). Next sign-in pulls own cloud only. Provider logout failure leaves old owner signed in and local state intact. Prepared/signed-out markers conservatively support recovery after interruption; irregular OAuth changes fail closed.
- **Regression:** extended `scripts/cloud-sync-stress.mjs` A→B→A fixtures, offline/provider failures, unfinished workout, snapshot preservation and legacy recovery isolation. Adapted shell/backup signout tests to mock offline sync so no real Supabase SDK/network. Full validation green.
- **Known caveat:** Existing cloud data that crossed accounts in the original incident is intentionally left as-is; v0.88.0 prevents new crossover but does not retroactively unmerge or delete any record. Switching normally requires internet, storage and no unfinished active workout. Device-local owner safety snapshots are recovery-only, not an auto-restore source.
- **Immediate next:** ask user to install Testing update in place, export backup, validate Android sync-before-sign-out and clean account B rehydrate. Review screenshot/video. Later consider recoverable per-owner snapshot management UX and supervised cleanup of pre-existing crossover, only with separate explicit owner approval. Do not promote Beta.
- Earlier checkpoints below are archival.

---

## CURRENT RESUME CHECKPOINT (v0.87.9 supersedes older instructions)

- **Latest Testing:** v0.87.9 / Android build 132, signed APK and Testing updater published: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.9; PR #53 https://github.com/jlingenfelter22-bot/Swole-Cat/pull/53 merged into `main`. PR CI https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38161922914 PASS, main CI https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38162099922 PASS, signed Android https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38162099916 PASS. Testing SHA-256 APK `c1e0119ab329abb377b6cff28a7307687e06a848f7dcc2b7e0c166de6c737d89`; original Testing cert unchanged.
- **Critical user incident:** Real Android Testing user moved from secondary test Google account back to everyday main Google account after clearing local data and sync. Histories from both accounts mixed; Progress tab went blank (header still visible).
- **Confirmed cloud bug:** `syncEnsureOwner` previously cleared metadata on account switch but not actual local workout state, allowing old account data to sync into the new account. Erase while still signed into the old account could auto-sync and repopulate immediately. Read-only Supabase audit: 38 session IDs occurred under multiple owners, structural session rows intact; six backup metadata records. We have **not** modified the cloud DB, restored or deleted anything. Do not automatically clean up copied sessions.
- **Confirmed Progress bug:** analytics filtered `x.signal.stalled` even though `coachSignal()` intentionally returns null for assistance/bodyweight movements. Direct null guard fixed in v0.87.9. Non-destructive error fallback prevents blank screen for future unexpected analytics exceptions.
- **Safeguards shipped:** fail-closed guard on account switch when previous owner's local data still present; backup-first alert in Cloud settings; reset local metadata pauses auto-sync after erase until explicit Sync Now; owner checks mid-network pull and push. Tests added in existing `scripts/cloud-sync-stress.mjs`, full suite green. This is NOT yet automatic per-owner local partitioning and does not repair already copied cloud records.
- **Beta unchanged:** v0.73.1 branch SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`. No promotion without explicit user instruction.
- **Immediate follow-up:** user updates Testing and confirms Progress renders. Advise user to turn off automatic sync for now, export current local backup (Settings > Cloud settings > Data safety > Export backup), and preserve each cloud account unchanged. Ask before any record-level recovery. Review cloud backup histories/provenance, identify original sessions, separate accounts safely, and later implement account-partitioned local state with explicit switching.
- Earlier checkpoint headings below are archival.

---

## CURRENT RESUME CHECKPOINT (v0.87.8 supersedes older instructions)

- **Latest Testing:** v0.87.8 / Android build 131, signed permanent Testing APK and in-app updater live: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.8. PR #52 https://github.com/jlingenfelter22-bot/Swole-Cat/pull/52 merged into `main`, full tests passed. Beta remains v0.73.1 at SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`, untouched. Do not promote to Beta without explicit owner approval.
- **User's approved v0.87.8 design:** After screenshot of expanded v0.87.7 opaque whole-rail rest pocket, requested slimmer, sharper button faces with less bulk and tighter padding, a modestly shorter lift, and subtle *blend of A+C* in blank left/right spaces: etched tech-panel/mechanical vents plus minimal cyan/violet ambient accents. Not additional controls or brighter busy styling. Do NOT change the approved idle stealth timer, one rigid unchanged full-width rail shape, fixed nav tabs, scroll behavior or timer math.
- **Implemented:** pure CSS visual pass in `src/styles/03-polish.css`. Rail lift **57→53px**, shelf **53→49px**, visible button faces **34→32px** within unchanged **42px tap targets**, sharper asymmetric clipped corners and lower-weight text. Nav-owned `.rest-dock-pocket::before/::after` provide pointer-events-none low opacity mirrored technical lines/vents, left cyan and right violet, scaling back on narrow screens. No new images, control elements or JS changes. `scripts/rest-tray-stress.mjs` includes visual contract tests.
- **Verified:** PR full regression PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38005935548, main regression PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38006156361, Testing APK signed/published PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/38006156392. `updates/testing.json`: v0.87.8 build 131, package `com.jlingenfelter.swolecat.testing`, APK SHA-256 `9a2e0b7632fbba4c2d6bf9c1063106d11b59f728cdd5be3672789cf0a3dea81a`, Testing signing SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Next:** user installs via Settings > App & Updates and inspects real Android expanded timer and normal idle position. Assess tight visible button weight, real tap comfort, restrained side engine-bay style, minimal lift and seamless complete-rail translation. Await physical-device feedback before future polish. Older checkpoints below archival.

---

## CURRENT RESUME CHECKPOINT (v0.87.7 supersedes older instructions)

- **Latest Testing:** v0.87.7 / Android build 130, signed permanent Testing APK and in-app updater live: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.7. PR #51 https://github.com/jlingenfelter22-bot/Swole-Cat/pull/51 merged into `main` with full validations passing. Beta remains v0.73.1 (branch SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`), untouched.
- **User feedback:** Real Android v0.87.6 screenshot demonstrated the correct rigid lift of the *entire* full-width rail and unchanged raised center timer bump. Expanded area beneath it was hollow/see-through, and −30/+30/Skip controls looked oversized and chunky. User wanted a solid dark pocket, tighter sharp cyber buttons, and smaller rise, **not** another rail redesign. User permits temporary Complete Set overlap when intentionally expanded and does not want forced workout scrolling.
- **v0.87.7 solution:** Added `#restDockPocket` inside nav (decorative, fully opaque, click-through). Nav-owned backing scales from bottom to cover the whole revealed width during the rigid rail lift, exactly matching original timing and shape. Removed ineffective negative-z-index timer pseudo-backdrop. Rail lift shortened 62→57px; action shelf 59→53px; buttons keep 42px touch area but visually inset to 34px crisp beveled faces. Timer collapsed size/location, original SVG outline, stationary nav tabs, keyboard/scroll and workout logic unchanged.
- **Checks:** PR full PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37993571101; main PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37993817592; signed Android PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37993817611. Testing package `com.jlingenfelter.swolecat.testing`, APK SHA-256 `7a52c0f6cf5a6e44b1dd4d7bd752caec380102886b749b6b8b3a5899b32e5622`; original Testing signing certificate SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Next:** user installs Testing v0.87.7, shares screenshot of expanded pocket and possibly video of movement. Focus on truly opaque action backing, slim/sharp button look, whole-rail rigidity, restored idle state and nav/keyboard usability. Await physical-device acceptance. Do not promote to Beta without explicit instruction.
- Older checkpoint sections below are archival.

---

## CURRENT RESUME CHECKPOINT (v0.87.6 supersedes older instructions)

- **Latest Testing:** v0.87.6 / Android build 129, signed permanent Testing APK and in-app updater live: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.6. PR #50 https://github.com/jlingenfelter22-bot/Swole-Cat/pull/50 merged into `main` as `8fb0feb4e2e3a4b7da9fd9284589eb82649738e3`.
- **User's clarified design intent:** v0.87.5 expanded screenshot showed a tall crest with sloped sides and attached-looking controls. **Do not solve this by making room for Complete Set**; the user explicitly accepts deliberate expansion overlapping Complete Set. What they want is the **entire full-width bottom fixture**, with its left rail, timer bump and right rail, to translate upward in the SAME unchanged shape, reveal the three buttons *below*, then slide the entire rail back down upon collapse. The five nav tabs do not move.
- **v0.87.6 changes:** Fixed `#restTimer` height to ~35px in all states. The three buttons are absolutely positioned beneath the countdown, no longer expanding the timer box or changing nav SVG geometry. `nav.rest-rail-raised` and `#restTimer.show.expanded` use identical `--rest-rail-lift:62px` and matching 290ms easing. Nav SVG path/viewBox remain identical in both states, only entire rail translates. Resting visual and scroll persistence preserved. Removed expansion-triggered workout scrolling. Keyboard hiding CSS was corrected after CI found an override; reduced motion and timer logic unchanged.
- **Validated:** PR full PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37987273404, main full PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37987624116, signed Android PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37987624164. Manifest `updates/testing.json` says v0.87.6, build 129, APK SHA-256 `48a2f2fed2df6846ee51ac354a8b934b568823043c05398d0b1d2216ce3463c5`, permanent Testing cert `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta unchanged** v0.73.1 on `beta` SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`. Never promote without owner's explicit direction.
- **Immediate next action:** user installs Testing v0.87.6 and shares Android screenshot/video of expanding/collapsing rail. Assess same silhouette from left to right, all segments rising together, action reveal under lifted rail, stationary tab buttons and preservation of stealth idle state. Await real-device feedback before changes. Older checkpoints below archival.

---

## CURRENT RESUME CHECKPOINT (v0.87.5 supersedes older instructions)

- **Latest Testing:** v0.87.5, Android build 128, source `main`. PR #49 https://github.com/jlingenfelter22-bot/Swole-Cat/pull/49 merged after full validation. Signed Testing APK and updater live: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.5.
- **Driving feedback:** In ~96 sec real Android video `1000004562.mp4`, user **loves v0.87.4 passive stealth-rest shape**, but it sometimes disappears while scrolling and expansion becomes an entirely different much wider control panel. User approved keeping the notch visible during scrolling and letting the **same narrow shell slide upward to expose −30/+30/Skip**, then back down on collapse. No more visual redesign.
- **v0.87.5:** Removed scroll/action collision-based hiding and passive repositioning. Same 154px width in collapsed and expanded (146px small screens); three equal columns of ~44px touch buttons. CSS action shelf unfolds ~260ms while timer grows upward from fixed nav recess. `followSlidingRestHousing()` redraws one shared SVG nav contour against the changing measured height; notch and nav stay one continuous silhouette throughout. Auto protective scroll only when user intentionally expands, keyboard concealment and reduced-motion preserved.
- **Regression and build:** PR full PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37979464907, main PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37979808037, signed Android PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37979808085. Testing APK SHA-256 `8ed4613c2d29cd355c4c1789d2d20101bb23f8abbb3f8772a7949d685d638aab`; original permanent Testing signing certificate `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta:** remains v0.73.1 at SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`. Never promote without user's express approval.
- **Next:** user installs v0.87.5 using in-app update and tests continuous countdown visibility while scrolling, same-body upward slide to three controls and collapse, Complete Set and nav taps, keyboard handling. Because old collision hiding was removed at user request, visually verify unusual near-nav scroll positions do not create obstructions. Await real-phone feedback before another change. Earlier checkpoints below archival.

---

## CURRENT RESUME CHECKPOINT (v0.87.4 supersedes older instructions)

- **Latest Testing:** v0.87.4, Android versionCode 127 on `main`. PR #48 merged after green full regression suite: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/48. Signed permanent-identity Testing APK and in-app update feed live: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.4.
- **Why:** Owner approved v0.87.2 notch size/position/no-overlap, but v0.87.3 real Android screenshot still looked crudely assembled, with diagonal wings and timer's black base visible on the nav. Asked to implement a unified molded outline instead of extra decorations.
- **v0.87.4:** One decorative `#restNavHousing` SVG inside the existing nav, with one continuous contour and matching shared fill across the rail and the raised notch crest. Path generated from existing centered notch width and rest recess by `syncRestDockHousing()` on visible passive state and viewport updates. Collapsed timer becomes transparent with no own borders, shadows, or hooked pseudo-wings; text sits over the shared nav housing. No changes to approved 154px / ~35px footprint, bottom offset, Complete Set collision handling, tap to expand, 3 expanded controls, keyboard or workouts. Default nav restores in all non-passive states.
- **Validation:** PR full PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37969150495, main full PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37969468006, signed Android PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37969467800. Testing APK SHA-256 `d12da094a1ecc7149bd6288c8323b36e382ae05d484b6f4ec9ce6ef383983431`; permanent cert SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta:** v0.73.1 on branch SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`, untouched. Requires separate explicit owner permission to promote.
- **Next:** Have owner update Testing via in-app updater and report real Android visual result. Check seamless molded surface, no rectangle/wings, same Complete Set clearance, expanded timer and navigation controls. Await feedback, do not assume on-device visual approval from DOM tests. Older checkpoints below archival.

---

## CURRENT RESUME CHECKPOINT (v0.87.3 supersedes older instructions)

- **Current Testing:** v0.87.3 / Android build 126, `main`. PR #47 merged after successful complete regression suite https://github.com/jlingenfelter22-bot/Swole-Cat/pull/47. Signed APK and updater live: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.3.
- **User feedback:** v0.87.2 successfully fixed timer size, location and no-overlap with Complete Set on real Android, but showed a visual **sticker effect**, old curled side hooks, mismatched timer/nav borders and straight nav highlight passing behind the module. User explicitly approved **pure visual seam polish** preserving v0.87.2 positioning and all functionality.
- **v0.87.3:** Added state-aware nav class `rest-notch-integrated` for visible collapsed notch only, top rail is broken across the notch's width plus beveled shoulders. Removed full sticker-style border and heavy independent glow from passive timer, matched nav ink and background, replaced side hooks with short diagonal beveled ramps terminating at nav top. Nav rail restores during expanded controls, stopped rest, keyboard hiding, and obstructed fallback. Countdown, time controls, scroll protection, timer size and position unchanged.
- **Validation:** full PR run https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37966245495 PASS, main run https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37966558650 PASS, Testing APK signed and published by https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37966558602 PASS. Build 126. APK SHA-256 `97274f6a1a1d27b1161035aaef5f68c9e25f0906b78106374cb7e4a3f0b6a340`, permanent cert `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta:** v0.73.1 on `beta` at `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`. Untouched; do not promote without explicit user approval.
- **Next:** Have owner update Swole Cat Testing to 0.87.3 and share real phone screenshot. Judge seam continuity, whether timer finally feels recessed and molded into bar, and whether the approved positioning is still intact. Continue only after their feedback. Older v0.87.2/v0.87.1 checkpoints below are archival.

---

## CURRENT RESUME CHECKPOINT (v0.87.2 supersedes older instructions)

- **Current Testing:** v0.87.2, Android build 125, source `main`; PR #46 https://github.com/jlingenfelter22-bot/Swole-Cat/pull/46 merged and full validation passed. Signed APK released https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.2. Testing in-app updater manifest verified, signing identity unchanged.
- **User feedback driving this pass:** v0.87.1 rest timer was still intrusive and overlapped the lower Complete Set button at the exact desired natural workout scroll position. Owner explicitly approved trying a **recessed notch** mostly embedded into the nav visual housing, not another floating timer.
- **v0.87.2 changes:** collapsed timer ~154px wide and ~35px high, partially recessed into the top edge of bottom nav. It remains a separate overlay/component, not a sixth nav tab. Measures top of middle nav icon to avoid obscuring it. Passive countdown never forces workout scroll; notch checks Complete Set clearance and yields when available geometry makes no-overlap impossible. Expanded controls remain −30/+30/Skip, rise only after user tap and can invoke protective scroll. Retains cyber styling, keyboard hiding, reduced motion and nav alignment.
- **Validation:** PR regression PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37953019259, main PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37953366178; signed APK workflow PASS https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37953366078. Published Testing APK SHA-256 `8ce83daa5e60b63ae91bf4e7e1cb6181922c656c8d0daec6e095c5f51b2603c0`, persistent Testing certificate SHA-256 `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta:** v0.73.1 branch at SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`, untouched. Owner must separately approve any Beta update.
- **Next task:** owner updates Testing APK via Settings > App & Updates, screenshots passive timer with Complete Set in natural workout position, taps to expand, verifies buttons/keyboard/nav tab hitboxes. Await honest real-phone visual feedback. Do not claim final aesthetic acceptance from tests.
- Older checkpoint headings below are archival.

---

## CURRENT RESUME CHECKPOINT (v0.87.1 supersedes older instructions)

- **Current Testing:** v0.87.1 / Android build 124, `main`. PR #45 merged, full validation passed; signed APK released: https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.1. Testing updater `updates/testing.json` verified for v0.87.1, code 124.
- **Micro-pass decision:** user liked v0.87.0 nav-connected tray, but shared Android screenshot and said its resting state was far too large and visually boring. Explicitly approved a smaller, sharper cyberpunk timer: ~188px width/~44px height with only REST, countdown and expand cue; compact state removes quick +30. Tapping expands to ~282px panel showing −30, +30, Skip. Angular asymmetric corners, violet-cyan edge detail, fine technical texture and small illuminated status dot, in existing Swole Cat theme.
- Keep the separate-from-nav structure, 5 nav tabs, slide-out behavior, keyboard concealment, reduced-motion handling, and Complete Set clearance. `scripts/rest-tray-stress.mjs` tests new states. Two older tests had contradictory +30-in-collapsed expectations and were corrected to honor the new approved behavior.
- Signed Android release workflow https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/37949452821 completed successfully. Testing APK checksum `2e2f592616792b8f5ab282810f42b18e73e044e64754b5ac0e95e43691d12ac9`, original persistent Testing signing cert `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`.
- **Beta** stays v0.73.1 on branch SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`; never promote without user approval.
- **Immediate next task:** user updates on Android, checks the compact/expanded timer aesthetic against their screenshot and exercises +30, -30, Skip, keyboard concealment, and touch/scroll clearance. Wait for their feedback before another pass.
- Earlier "CURRENT RESUME CHECKPOINT" headings below are archival.

---

## CURRENT RESUME CHECKPOINT (supersedes older version instructions)

- **Current Testing:** v0.87.0 / Android versionCode 123, source `main`, signed Testing APK and in-app Testing update feed published. https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.87.0. PR #44: https://github.com/jlingenfelter22-bot/Swole-Cat/pull/44.
- **User-approved v0.87:** a sliding compact rest tray visually extends the bottom navigation without being part of nav or a sixth tab. Dark nav-matched panel, rounded shoulder seam, quick +30, expanded −30/+30/Skip, measured nav alignment, keyboard concealment, reduced motion, correct accessible states. Smart Workout Focus accounts for tray height so Complete Set is not covered.
- **PR validation and main validation successful; Android signed workflow successful.** APK SHA-256 `0cb09996b7eb515076394933d255d16286c11a03d2db3cf9b6f0bc7f8618f538`, Testing cert `d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`; release run 37870364765.
- **Field Beta:** still v0.73.1 at `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`, unchanged. Never promote Testing to Beta without explicit user approval.
- **Immediate next action:** Have owner update Testing to v0.87 via Settings > App & Updates, then review actual visual result from a real Android workout. Focus on whether the rest tray's silhouette appears integrated with the navigation, whether its slide motion and collapsed/expanded controls look/feel right, and whether it avoids covering Complete Set or keyboard inputs. Iterate only after feedback.
- **Last approved v0.86:** Smart Workout Focus with full-width Repeat previous set values and Complete Set, sticky workout progress and Session Note. User explicitly loved the real-phone result. Preserve it.
- **All older v0.86 and v0.72 instructions below are archival; do not mistake them for the active next task.**

---

## CURRENT RESUME CHECKPOINT (supersedes older v0.72 text below)

- **Swole Cat Testing:** v0.86.0, Android build 122, source `main`. Signed Testing APK and in-app update channel published and verified. https://github.com/jlingenfelter22-bot/Swole-Cat/releases/tag/testing-v0.86.0
- **Field Beta:** v0.73.1, `beta` branch SHA `7ac10d9e8eecdf9570221d96250a16c2cc5459d3`; separate signing/channel, still untouched by v0.74–v0.86 Testing passes. Only promote on explicit owner instruction.
- PR #43 implemented **Smart Workout Focus** after user reviewed v0.85 Android screenshot. Full-width "Repeat Previous Set Values" was explicitly kept, not replaced with ambiguous "Repeat" next to Complete Set. After a set advance, the screen now positions the sticky exercise header, Coach Target and set inputs/action together, while retaining user manual scroll. Sticky exercise header shows overall set progress with a thin bar and a **Session note** control for accessing complete Coach guidance.
- PR full validation and main validation both passed; signed Testing Android publication completed. Refer to `docs/CURRENT_STATE.md` top section for workflow links, cert/hash, implementation and limitations.
- **Immediate task:** user installs v0.86.0 using Settings → App & Updates, then reports real-device comfort of automatic scroll, visibility of Complete Set, clear Repeat wording, session progress + Coach note, subsequent set/exercise transitions, and keyboard/timed/carry edge cases. No further design/code changes until their impressions.
- **Older sections below are archival** and contain older versions and superseded "next task" instructions. Do not resume from v0.72.3 or assume Settings cleanup is the active task. Do not begin unrelated cloud phases.

---

## Immediate resume instruction

Do not begin a new cloud phase by default.

The next product task is:

**Testing in-app updates are now real-device proven. Do not change Beta until the user explicitly says to promote the tested checkpoint into a new Beta baseline.**

The user wants to review the Settings screen, clean up all settings, decide where each setting belongs, improve grouping/order/labels, and make the Settings menu feel intentional and easy to scan.

Settings cleanup has started: v0.70.0 compacted cloud/account controls into a two-tile hub, and v0.70.1 added automatic cloud behavior. The remaining Settings work is broader organization/polish after the v0.71.0 real-device sharing check.

After Settings cleanup, the broader near-term product priorities are:
1. Coach Swolecat intelligence and response quality
2. body heat-map refinement
3. general UI polish and cleanup
4. performance/smoothing passes

Do not expand cloud scope unless a concrete product need appears.

---

# Current repository state

Repository:
`jlingenfelter22-bot/Swole-Cat`

Main product/testing branch:
`main`

Current Testing version:
`0.72.3`

Android versionCode:
`102`

Current main merge:
`2184e0d4951053f775ddb1c7fa93f9fda3c54688`

Latest completed gates:
- PR #15 validation run 728: PASS, all 75 validation steps
- main validation run 729: PASS, all 75 validation steps
- Pages run 653: PASS
- signed Testing Android build run 342: PASS
- artifact ID: `11443243011`
- artifact name: `Swole-Cat-Testing-Android-v0.72.3-signed`
- artifact digest: `sha256:e0785c21b00c8e0f405596d478c8a16f64cb8d45359a4579f22b5566b733b750`

Live PWA:
`https://jlingenfelter22-bot.github.io/Swole-Cat/`

Important branches:
- `main`: experimental Testing, current v0.72.3
- `beta`: field beta used for real workouts
- `beta-v0.66.1`: frozen beta checkpoint

Frozen beta SHA:
`99c258f4fc8c0254a533867901f50a8a216f2b28`

Frozen beta package:
`com.jlingenfelter.swolecat`

Testing package:
`com.jlingenfelter.swolecat.testing`

Testing app name:
`Swole Cat Testing`

The Testing package intentionally installs alongside beta and uses a separate Android app sandbox/auth state.

---

# Permanent Testing signing

Testing builds use a persistent signing key stored only in GitHub Actions secrets.

Permanent Testing certificate SHA-256:
`D5:3F:27:7C:5B:92:31:1D:78:E9:EB:3B:DB:69:2A:D4:89:73:47:97:F2:43:08:27:40:02:13:F3:8B:7C:EE:53`

Lowercase workflow fingerprint:
`d53f277c5b92311d78e9eb3bdb692ad489734797f2430827400213f38b7cee53`

GitHub secrets:
- `SWOLE_CAT_TESTING_KEYSTORE_B64`
- `SWOLE_CAT_TESTING_STORE_PASSWORD`
- `SWOLE_CAT_TESTING_KEY_ALIAS`
- `SWOLE_CAT_TESTING_KEY_PASSWORD`

Never commit the JKS/keystore to the repo.

The Android workflow hard-fails when signing secrets are absent and verifies the exact certificate fingerprint with `apksigner`.

---

# Current product architecture and behavior

Swole Cat is a local-first workout tracker. Local workout use must never depend on cloud connectivity.

Canonical state key:
`overload_v3`

Canonical fresh state:
```js
{
  schemaVersion:1,
  meta:{lastBackupAt:null,lastSavedAt:null,lastMigrationAt:null},
  profile:{name:'',unit:'lb'},
  customExercises:[],
  routines:[],
  programs:[],
  activeProgramId:null,
  sessions:[],
  activeWorkout:null,
  favorites:[],
  exercisePreferences:{},
  bodyweight:[],
  ui:{onboardingDone:false,haptics:true,keepAwake:true},
  settings:{defaultMin:8,defaultMax:12,defaultSets:3,defaultIncrement:5,coachAliases:{}}
}
```

`save()` writes `overload_v3`, increments the state revision, and emits `state:saved`.

The app already includes:
- large exercise library, search, categories, favorites
- custom routines and programs
- rename/duplicate/delete/substitution flows
- active workout autosave/resume
- tap-to-type weight inputs
- rest timer pause/resume
- lb/kg
- custom app-styled selectors
- workout history, PRs, graphs, calendar
- completed-exercises filtering
- public/non-AI form resources
- collapsible exercise cards
- post-workout recap infrastructure
- muscle metadata and heat-map infrastructure
- Coach Swolecat local intelligence foundation
- sharing format `SWOLECAT1`
- Android native packaging and signed Testing builds

Progression behavior:
- Progressive Overload / double progression: add 1 rep to all working sets until top of range, then add one configured weight increment
- Strength Focus: add 5 lb per session
- Track Only: log without automatic progression

Active workout remains local-only in the first multi-device sync implementation.

---

# Product philosophy

Keep the app:
- fast
- local-first
- useful without an account
- free core
- no ads
- no bloated engagement mechanics
- no cloud dependency for normal workouts

Visual direction:
- dark
- high contrast
- cyberpunk / 80s-future
- readable under gym conditions
- quick/snappy interactions

The user does not want Swole Cat to become an overbuilt subscription-style fitness app.

---

# Supabase project

Project:
Swole Cat

Project ref:
`tpdmcuhsvmffpycgwhqb`

Region:
`us-east-2`

Project URL:
`https://tpdmcuhsvmffpycgwhqb.supabase.co`

Client uses the publishable key only.

Never expose service role credentials to the browser or Android client.

Google OAuth callbacks:
- Testing Android: `com.jlingenfelter.swolecat.testing://auth/callback`
- Beta/future production package: `com.jlingenfelter.swolecat://auth/callback`

For ANY future Supabase work, first read:
`skills://plugins/supabase/supabase/skill.md`

Then use the Supabase connector.

---

# Phase 8.1 - Identity/account lifecycle COMPLETE

Version:
`0.67.6`

Android code:
`89`

Implemented:
- Google OAuth PKCE
- system browser auth
- warm `appUrlOpen` handling
- cold `getLaunchUrl` handling
- Android secure auth storage
- Keystore-backed AES-256-GCM
- legacy plaintext auth migration only after verified secure write
- local workout state untouched by auth operations
- account deletion with fresh reauthentication and explicit confirmation

Important modules:
- `10a-cloud-config.js`
- `10b-cloud-identity.js`
- `10c-supabase-auth-provider.js`

Delete-account Edge Function:
- JWT verified
- service role only server-side
- caller determined from bearer token
- body requires `{confirm:true}`
- caller cannot submit a user id to choose who is deleted

Real-device Phase 8.1 checks passed:
- auth survives update
- local workout data survives sign out
- same Google account restores identity
- account deletion requires reauth
- cloud account deletion leaves local training data intact

---

# Phase 8.2 - Cloud Backup COMPLETE

Version:
`0.68.0`

Android code:
`90`

Cloud backup is disaster recovery, not sync.

Implemented:
- private Storage bucket `swole-cat-backups`
- owner-scoped RLS
- `public.backup_metadata`
- latest + previous retention
- manual Back Up Now
- Restore from Cloud
- restore preview
- restore size/SHA-256 validation
- local pre-import snapshot before destructive restore
- cloud failures never block normal workouts

Migration:
`supabase/migrations/20261004150339_phase_8_2_cloud_backup.sql`

Modules:
- `10d-cloud-backup.js`
- `10e-supabase-backup-provider.js`

Real-device backup tests passed:
- first backup produced metadata + private object
- retention capped correctly
- Previous backup restored correctly
- pre-import snapshot restored correctly
- offline workouts unaffected
- account deletion cleaned backup metadata + private Storage
- local data remained intact

---

# Phase 8.3 - Multi-device Sync COMPLETE

Current successful baseline:
`v0.69.4`
Android code:
`95`

Design:
- local-first
- record-level sync
- no Realtime
- no per-set network writes
- ordinary local saves queue metadata only
- explicit Sync Now performs network work
- active workout stays local-only
- conflicts never silently overwrite
- tombstones preserve deletions
- mutation ids provide idempotency

Current manual Sync Now order:
1. pull remote changes first
2. register/update current device
3. capture local projection
4. push queue
5. final pull

Inbound pull intentionally occurs before device registration so registration/browser issues can never block receiving remote data.

## Sync backend

Tables:
- `devices`
- `sync_records`
- `backup_metadata`

All exposed tables use RLS.

`sync_records` contains:
- owner_id
- record_type
- record_id
- payload_json
- record_version
- server_change_seq
- source_device_id
- client_updated_at
- server_updated_at
- deleted_at
- schema_version
- last_mutation_id

There is a unique partial idempotency index on:
`(owner_id,last_mutation_id)` where mutation id is not null.

Sequence:
`public.swolecat_sync_change_seq`

Server trigger:
`public.swolecat_sync_record_server_fields()`
- SECURITY INVOKER
- empty search_path
- immutable owner/type/id on update
- increments record_version
- increments server_change_seq
- updates server_updated_at

Authenticated grants are column-scoped and least-privilege.

No client service role.

Tracked repo migration:
`supabase/migrations/20261005_phase_8_3_sync_foundation.sql`

Important warning:
The Phase 8.3 live schema was created/modified through the Supabase connector, while the migration file was later tracked in the repo. Do not blindly reapply it against the live project. Reconcile migration bookkeeping first if that becomes necessary.

## Sync record projection

Synced:
- profile singleton
- settings singleton
- favorites singleton
- exercise_preferences singleton
- bodyweight singleton
- app_state singleton with activeProgramId
- custom exercises
- routines
- programs
- completed sessions

Not synced:
- `activeWorkout`

## Sync client modules

`src/js/10f-cloud-sync.js`
- provider-neutral runtime
- local sync metadata key `swolecat-sync-local-v1`
- separate from `overload_v3`
- stable install device id
- owner-aware device id rotation
- deterministic synchronous SHA-256 projection hashing
- queue capture on `state:saved`
- manual sync
- optimistic conflict detection
- explicit Keep this device / Use cloud resolution
- tombstones
- idempotent mutation ids
- created-then-deleted-before-first-sync cancellation
- metadata reset protection against accidental cloud mass tombstones

`src/js/10g-supabase-sync-provider.js`
- device registration
- paged pull by server_change_seq
- optimistic update by record_version
- inserts
- conflict reread
- primary-key collision handling

---

# Phase 8.3 chronology and fixes

## v0.69.0

Initial sync foundation.

Main merge commit:
`001a1c4c25e51beab7d97b5a45f79b9843962cc9`

First real-device checks:
- Device A seeded cloud successfully
- Device B fresh pull succeeded
- no active_workout cloud record
- no redundant writes on fresh B pull

Issue discovered:
Device B hit a duplicate devices primary-key problem during later sync.

## v0.69.1

Hotfix for device registration collision/single-flight behavior.

Main commit:
`64c4da8375e802976bbaf908eefd64aaf1d419d5`

Passed:
- Device B collision recovery
- B -> A propagation

Then a reverse propagation issue was found where Browser B registered but did not request sync_records.

## v0.69.2

Browser pull-stall hotfix.

Main commit:
`ea1fc6958ec6ba7c84b42f19d79bf48cb895f727`

Changes:
- removed async `crypto.subtle` dependency from record hashing
- synchronous pure-JS SHA-256 compatible with existing manifests
- pull request starts before local projection hashing
- no-change pulls avoid unnecessary hashing

Passed:
- A -> B propagation
- deliberate concurrent same-record conflict
- Use cloud conflict resolution with no redundant cloud rewrite

A later tombstone test exposed another browser stall.

## v0.69.3

Browser registration-stall hotfix.

Main merge:
`b25a9ef174523a86fdf558cdc57bc17c885d1272`

Changes:
- remote pull moved before device registration
- successful device UPDATE/INSERT no longer request a returned representation
- targeted regression added

Real-device pass:
- existing cloud routine `Tombstone Test` successfully pulled to Device B

## v0.69.4

Service-worker cloud cache hotfix.

Main merge:
`f513c1efac50594de46c9eecb8d6cbcc0c7dfd03`

Root cause:
The PWA service worker used generic `caches.match(e.request)` behavior for cross-origin GET requests. This allowed a previously empty Supabase sync response, such as "changes after sequence 38", to be cached and reused after later cloud changes existed.

Fix:
- non-whitelisted cross-origin/API requests are network-only
- mutating requests never participate in app-shell cache
- intentional exercise-media caching remains
- dedicated service-worker cache-boundary regression test added

Targeted validation and full regression wall passed.

Real-device result:
- Device B on v0.69.4 successfully received the existing tombstone
- `Tombstone Test` disappeared locally
- tombstone remained preserved server-side

---

# Real-device Phase 8.3 exit tests - all PASSED

## Bidirectional propagation

Passed:
- Device A -> Device B
- Device B -> Device A

No redundant cloud rewrites on pure pulls.

## Concurrent conflict

Both devices edited the same profile while converged.

Device A synced first.

Device B synced second.

Result:
- cloud winner remained Device A
- Device B surfaced one explicit profile conflict
- Device B did not silently overwrite cloud

## Conflict resolution

Device B chose:
`Use cloud`

Result:
- local B converged to cloud value
- conflict count returned to zero
- cloud record version did not bump unnecessarily

## Tombstone deletion

Routine:
`Tombstone Test`

Record id:
`id_muvml0lvjmiac`

Cloud tombstone at successful verification:
- record version 3
- server change sequence 40
- payload null
- deleted_at non-null
- source Device A

Device B v0.69.4 pulled the tombstone and removed the routine locally.

## Offline queue persistence

Both devices on v0.69.4.

Device A:
- synced cleanly
- went offline
- profile changed to `Offline queue A`
- queued local mutation
- offline Sync Now failed gracefully
- local state remained intact
- queue survived force-close/restart
- connection restored
- Sync Now flushed queue
- Device B then pulled the change

Verified cloud profile:
- record version 5
- server change sequence 44
- source Device A
- payload name `Offline queue A`
- no conflict
- no duplicate profile row

## Destructive account deletion exit test

A fresh cloud backup was created immediately before deletion so backup cleanup was included.

Pre-delete baseline:
- auth users: 1
- devices: 3
- sync_records: 19
- backup_metadata: 1
- backup Storage objects: 1

The cloud account was then deleted from the app.

Post-delete direct Supabase verification:
- auth users: 0
- devices: 0
- sync_records: 0
- backup_metadata: 0
- backup Storage objects: 0

User then confirmed local phone state remained intact:
- routines still present
- workout history/data still present
- profile/local state still present

This is the final Phase 8.3 exit criterion.

Phase 8.3 is COMPLETE.

---

# Current Supabase state after exit test

There is currently no Swole Cat cloud account in the test project for the user after the destructive exit test.

Verified counts immediately after deletion:
- auth users: 0
- devices: 0
- sync_records: 0
- backup_metadata: 0
- backup objects: 0

Local training data on the phone remains intact.

If a future test needs cloud identity again, signing in with Google will create a fresh Auth user/account context. Treat that as a new account and verify sync metadata ownership/reset behavior as appropriate.

---

# Current PWA/service-worker rule

Do not regress this.

The service worker may cache:
- Swole Cat app-shell assets
- explicitly whitelisted exercise/form media sources

The service worker must NOT cache:
- Supabase REST responses
- Supabase Auth traffic
- cloud backup API traffic
- sync API traffic
- arbitrary cross-origin API responses
- mutating requests

Regression script:
`scripts/service-worker-cache-stress.mjs`

Validation workflow includes this test.

---

# GitHub validation state around v0.69.4

v0.69.4 branch validation:
run 665
PASSED

v0.69.4 main validation:
run 666
PASSED

Pages:
run 628
PASSED

Signed Android Testing build:
run 335
PASSED

Signed artifact name:
`Swole-Cat-Testing-Android-v0.69.4-signed`

Artifact id:
`11379809678`

Artifact digest:
`sha256:7a473bafd05f1f5c2fee7a5608ef214ffd39f4d3d1af55072e9be4c72cf066ec`

---

# Known CI note

During the v0.69.3 hotfix, GitHub Actions had a hosted-runner assignment incident.

Three validation attempts were cancelled with:
- `runner_id: 0`
- zero workflow steps executed

A new fresh run later received a runner and passed.

Do not interpret those cancelled attempts as application test failures.

There is also an occasional JSDOM teardown warning around `enhanceAppSelect` reading `createElement` after teardown. Existing tests remain green and it has not been treated as a production failure.

---

# Security state

Client contains no service-role secret.

RLS is enabled on cloud-owned exposed tables.

Sync uses owner checks and least-privilege column grants.

Account deletion uses a server-side Edge Function with caller identity derived from the JWT.

Last known advisor situation before account deletion:
- no sync/data security finding
- one unrelated Auth warning about leaked-password protection being disabled
- app uses Google OAuth, not password auth

Do not weaken RLS or introduce SECURITY DEFINER as a shortcut.

---

# What NOT to do next

Do not:
- start Phase 9/group features
- add background sync just because it is possible
- rework account/cloud architecture without a concrete need
- reapply the Phase 8.3 migration blindly
- touch the frozen beta branch casually
- start Settings implementation in the old chat

---

# NEXT TASK - Settings cleanup and reorganization

This is the first task for the next chat.

User intent:
- clean up the Settings screen
- review every existing setting
- decide which section each setting belongs in
- improve section naming
- improve ordering
- reduce clutter
- make related settings live together
- make Settings feel polished and intentional
- preserve functionality while reorganizing presentation

The user specifically said:
"what we're going to work on next is actually just some settings, getting all the settings cleaned up and where they're located in the settings menu."

No Settings code changes have been made yet for this task.

Recommended first action in the next chat:
1. inspect the current Settings UI implementation and all settings controls
2. produce a complete inventory of every existing Settings item and current section/location
3. propose the cleaned-up section structure and ordering
4. confirm the intended organization with the user if there is a genuine product choice
5. then implement it in a dedicated version/pass with validation

Likely source areas to inspect first:
- `src/js/09-settings-ui-bootstrap.js`
- settings-related HTML/render helpers
- cloud/account settings sections
- sync/backup controls
- training/default progression settings
- UI/haptics/keep-awake controls
- units and general app preferences
- Coach aliases/settings if exposed

Do not assume the current section names are final.

---

# Broader near-term product work after Settings

Once Settings cleanup is complete, return to product polish rather than more cloud infrastructure.

Priority themes:
- Coach Swolecat intelligence
  - smarter workout selection
  - better exercise placement/reasoning
  - broader natural-language resilience
  - better explanation of why a movement belongs
- body heat map
  - refine visuals/mapping/readability
- UI polish
  - consistency
  - micro-interactions
  - clarity
  - spacing
  - cyberpunk/futuristic feel without sacrificing readability
- optimization
  - keep navigation and interactions fast/snappy
  - periodically rerun performance passes as features evolve

---

# User testing setup

The user actively tests:
- Android Testing app on phone
- PWA in browser as a second device
- beta build separately for real workouts

The user wants real-device behavior validated, not just mocked tests.

The user and girlfriend are intended real-world beta users.

When fixing bugs:
- reproduce from the actual observed behavior
- inspect cloud/backend evidence when relevant
- patch narrowly
- add a regression test
- validate before merge
- retest on the real devices
- log the pass in `docs/CURRENT_STATE.md`

---

# Communication / workflow preferences for this project

Be direct and implementation-focused.

Do not generate mockup images when the user is asking for app code changes.

Do not ask unnecessary clarifying questions.

Use the GitHub connector for repo changes.

For Supabase work, always read the Supabase skill first.

Do not promise background work unless an automation is actually created.

When the user says a real-device test passed, verify backend state when that is relevant before declaring the phase complete.

Maintain a clean checkpoint in project docs after major milestones.

---

# Resume sentence for the next chat

Use this as the starting point:

**"Swole Cat is currently targeting Testing v0.71.0 / Android code 98 on PR #11. v0.70.0 compacted cloud Settings and v0.70.1 added automatic debounced sync plus daily bounded cloud backup on main. Phase 8.4 short-lived plan sharing is implemented: signed-in senders get an SC-XXXX-XXXX-XXXX-XXXX code, recipients can resolve it without an account, shares expire after 7 days, accounts are capped at 25 active shares, only code hashes are stored, and legacy SWOLECAT1 remains the offline fallback. The plan_shares table and plan-share Edge Function are live with zero Supabase security advisor findings. Automated v0.71.0 regression runs 702, 703, and final-head run 707 passed; real-device share/import testing is the remaining Phase 8.4 exit check. Beta remains frozen unless explicitly promoted."**


## Latest authoritative checkpoint: 2026-10-06, v0.71.0 sharing

Treat this section as newer than earlier handoff text above.

Repository:
- PR #11: `v0.71.0 short-lived cloud routine and program sharing`
- branch: `cloud-sharing-v0.71.0`
- version target: 0.71.0
- Android versionCode: 98
- beta branch untouched

Live Supabase:
- table `plan_shares`, RLS enabled
- direct anon/authenticated grants revoked
- explicit deny-all client policy
- Edge Function `plan-share` ACTIVE
- raw share codes never stored
- 7-day expiration
- 25 active shares/account
- recipients may resolve without an account
- security advisor: zero findings after explicit deny policy

App behavior:
- connected signed-in sender uses short cloud code by default
- old giant `SWOLECAT1` package is generated only through Offline Code/fallback
- universal Import accepts both formats
- cloud result goes through the same existing preview/import safety path
- no private performance/history data is included

Next verification:
1. install/update Swole Cat Testing v0.71.0
2. sender signs in and shares a real Program/routine
3. recipient imports the short code, ideally while signed out
4. verify imported structure and backend plan_shares metadata/hash/expiry
5. then mark Phase 8.4 real-device complete
6. continue remaining Settings cleanup/polish


## Latest authoritative checkpoint: 2026-10-06, v0.72.0 workout console UX

Treat this section as newer than earlier handoff text above.

Why this pass happened:
- user supplied a narrated phone recording while using the active workout
- target experience is fast, obvious, one-screen logging wherever practical
- do not literally forbid scrolling if accessibility or unusual workout structure needs it
- the user's girlfriend previously struggled to discover exercise switching, which is treated as a discoverability defect

Locked v0.72.0 workout hierarchy:
1. compact session strip
2. obvious whole-header exercise switcher
3. Add Exercise at bottom of switcher
4. Coach target
5. set rail with inline `+ Set`
6. one focused set card
7. Complete Set
8. only Substitute + More as persistent secondary actions
9. early finish/cancel under More
10. contextual Finish Workout only after programmed work is complete

Do not re-add a permanent Next Exercise button unless real-user testing demonstrates a need. Automatic exercise progression remains, and manual switching through the explicit exercise switcher preserves pending/defer semantics.

Do not re-add permanent bottom Add Exercise / Finish Workout controls. Their relocation is intentional to reduce vertical chrome and action competition.

Files:
- design contract: `docs/WORKOUT_SCREEN_UX_V072.md`
- implementation: `src/js/06-workout-engine.js`
- visual tuning: `src/styles/03-polish.css`
- regression: `scripts/workout-screen-ux-stress.mjs`

Release:
- v0.72.0
- Android code 99
- PR #12
- merge: `b0a26d7020bd01c7c42a6771c5b1ecddda73bc68`
- PR validation 712 PASS
- main validation 713 PASS
- Pages 641 PASS
- Android build 339 PASS
- artifact ID `11431691213`

Immediate real-device UX checks:
- normal 3-set logging should require little/no page scroll on the user's phone
- Switch exercise must be obvious at first glance
- Add Exercise should feel naturally located inside the switcher
- `+ Set` should feel like the obvious way to extend a movement
- removing a set remains under set options to avoid clutter/mistaps
- More should feel organized, with exercise actions and workout actions visually separated
- final set should transition naturally into Finish Workout
- supersets, long names, many sets, keyboard, and accessibility should overflow gracefully rather than compressing dangerously

Still outstanding from v0.71.0:
- real-device short cloud-share test between signed-in sender and preferably signed-out recipient

Beta:
- still frozen at v0.66.1 unless explicitly promoted


## Latest authoritative checkpoint: 2026-10-06, v0.72.1 workout feedback polish

Treat this section as newer than earlier handoff text above.

Second real-device review feedback:
- v0.72.0 core layout was strongly approved
- user no longer wanted another structural rewrite
- remaining issues were feedback/orientation polish

Locked v0.72.1 behavior:
- `Today’s structure changed` is no longer a permanent in-flow block
- first structural edit shows one floating `Workout modified` notice per active workout
- overlay lasts about five seconds, includes a shrinking countdown line, and does not push layout
- later edits in the same workout do not repeat the notice
- Switch Exercise remains explicit but is a single-line lightweight affordance
- exercise changes use a subtle card-deck transition
- forward target enters from the right; backward navigation reverses it
- normal set progression stays in-place with only a brief active-set pulse and set-card settle
- regular auto-advance does not show an additional `Up next` toast
- superset-specific feedback remains
- reduced-motion preference disables workout movement without disabling navigation

Motion rule:
- the user should understand that something changed without feeling that the app stopped to animate
- current target is about 180 ms outgoing / 230 ms incoming for exercise transitions
- if the user consciously notices every transition or feels delayed, shorten timing/translation before considering removal
- do not add blur, expensive filter effects, or large animated shadows

Files:
- spec: `docs/WORKOUT_SCREEN_UX_V072.md`
- runtime: `src/js/01-core-runtime.js`
- workout behavior: `src/js/06-workout-engine.js`
- styling/motion: `src/styles/03-polish.css`
- regression: `scripts/workout-feedback-stress.mjs`

Release:
- v0.72.1
- Android code 100
- PR #13
- merge `6016c8b29f9cd69084065193df82b9df55bf56ac`
- PR validation 717 PASS, 73 steps
- main validation 718 PASS, 73 steps
- Pages 645 PASS
- Android build 340 PASS
- artifact ID `11439396486`
- artifact digest `sha256:5464a49e6d59b1b5a64523e3595ecaf005754fa8e04b561856650ac158da92b9`

Immediate real-device checks:
- add one set and judge the floating structure notice
- confirm later structural changes do not repeat it
- judge Switch Exercise visual balance
- complete Set 1 and verify Set 2 cue is subtle but clear
- complete an exercise and judge card transition timing/strength
- manually move backward and forward through exercises
- test superset rotation
- tune motion only if the phone feel calls for it

Still outstanding from v0.71.0:
- real-device short cloud-share sender/recipient test

Beta:
- still frozen at v0.66.1 unless explicitly promoted


## Latest authoritative checkpoint: 2026-10-06, v0.72.2 exercise header

Treat this section as newer than earlier handoff text above.

Third real-device review:
- core workout hierarchy and v0.72.1 motion/feedback were approved
- remaining feedback focused specifically on exercise-header composition

Locked v0.72.2 header:
- exercise title and How To `i` are one inline text-flow unit
- help immediately follows the exercise name and naturally follows wrapping
- do not add JS width/pixel calculations for title length
- How To stays inside the stable summary/title row and cannot drift when the switcher opens
- tapping How To must never toggle Switch Exercise
- no dropdown chevron
- lower row is metadata on the left + compact `Switch exercise` pill on the right
- the entire remaining header is still a large switch target
- no changes below the exercise header were part of this pass

Files:
- implementation: `src/js/06-workout-engine.js`
- styling: `src/styles/03-polish.css`
- dedicated regression: `scripts/workout-header-stress.mjs`
- design contract: `docs/WORKOUT_SCREEN_UX_V072.md`

Release:
- v0.72.2
- Android code 101
- PR #14
- merge `b24d27dca66b8e923cef7be3c8b7989ac1153790`
- final PR validation 723 PASS, 74 steps
- main validation 724 PASS, 74 steps
- Pages 649 PASS
- Android build 341 PASS
- artifact ID `11441549231`
- artifact digest `sha256:2711fccb0d23412623c330c7ff2733f1b45c49df07dd9feb31c6b0c9a85a68a7`

Immediate phone checks:
- short/medium/long exercise names
- inline help position
- help tap isolation
- open-switcher stability
- visual balance of metadata versus Switch Exercise pill
- whole-header switching remains easy

Still outstanding from v0.71.0:
- real-device short cloud-share sender/recipient test

Beta:
- still frozen at v0.66.1 unless explicitly promoted


## Latest authoritative checkpoint: 2026-10-06, v0.72.3 numeric entry readability

Treat this section as newer than earlier handoff text above.

Fourth real-device review:
- overall workout hierarchy/header/motion were approved
- remaining feedback focused on Weight/Reps labels being visually truncated beside their step controls
- constraint: fix readability without adding vertical height

Locked v0.72.3 numeric-entry layout:
- Weight/Reps labels render in full
- Weight includes active lb/kg unit; bodyweight can say Added weight
- each numeric field uses one horizontal row: `[ − | value | + ]`
- value input remains the large 52px logging target
- decrement/increment buttons sit directly beside the value they modify
- RIR remains a selector and does not gain step buttons
- old micro-step label header is retired
- new layout should be equal or shorter vertically than v0.72.2
- do not abbreviate labels or reintroduce ellipsis to save space

Files:
- implementation: `src/js/06-workout-engine.js`
- styling: `src/styles/03-polish.css`
- regression: `scripts/workout-numeric-entry-stress.mjs`
- design contract: `docs/WORKOUT_SCREEN_UX_V072.md`

Release:
- v0.72.3
- Android code 102
- PR #15
- merge `2184e0d4951053f775ddb1c7fa93f9fda3c54688`
- PR validation 728 PASS, 75 steps
- main validation 729 PASS, 75 steps
- Pages 653 PASS
- Android build 342 PASS
- artifact ID `11443243011`
- artifact digest `sha256:e0785c21b00c8e0f405596d478c8a16f64cb8d45359a4579f22b5566b733b750`

Immediate phone checks:
- full Weight (lb/kg) label
- full Reps label
- intuitive `− value +` association
- button tap comfort
- RIR balance
- compare set-card height against v0.72.2
- narrow-screen and Added weight cases

Still outstanding from v0.71.0:
- real-device short cloud-share sender/recipient test

Beta:
- still frozen at v0.66.1 unless explicitly promoted


## Latest authoritative checkpoint: 2026-10-06, update distribution

Canonical architecture: `docs/UPDATE_DISTRIBUTION.md`.

Locked rules:
- all development stays on `main` / Swole Cat Testing
- Testing and Beta are separate Android packages and separate update channels
- a Testing release must never automatically become a Beta release
- Beta moves only when the user explicitly says to promote the tested build
- build/prove the updater on Testing before changing Beta
- the current field beta v0.66.1 may require one final manual/fresh install
- the replacement Beta baseline must contain the updater and use the permanent Beta/release signing identity
- after that baseline, future Beta updates should be installed through the app with normal Android user approval
- updates do not require a Swole Cat cloud account
- preferred first implementation uses signed GitHub Release APK assets plus public Testing/Beta channel manifests
- validate SHA-256, package/channel, versionCode, and signing expectations before install
- never interrupt an active workout with an update install

Immediate next task:
**Implement the Testing updater and prove a real signed Testing version N -> N+1 in-app update before Beta promotion.**


## Latest updater handoff: proof-ready

The Testing updater is implemented. Do not rebuild it from scratch.

Real-device proof pair:
- install baseline v0.73.0 / build 103
- Testing feed target v0.73.1 / build 104
- baseline artifact ID `11451167705`
- target artifact ID `11450429897`
- baseline direct APK SHA-256 `8c8461a21b7f6620da3bfab4927edfa48b0a2e274ff139bf6b725cbe51310dea`

Next action is the real phone proof only:
v0.73.0 -> Settings -> App & updates -> v0.73.1.

Do not mark updater proof complete until the user confirms Android installed v0.73.1 in place and local data/auth survived.


## Latest authoritative updater status

Testing updater proof: **COMPLETE**

Real-device result:
- v0.73.0 / build 103 -> v0.73.1 / build 104
- initiated through Settings -> App & updates
- Android normal approval/install flow completed successfully
- user reported the update worked perfectly

Interpretation:
- Testing self-update is proven on the real phone
- manual APK handoff is no longer the normal Testing update path
- keep all ongoing development on Testing/main
- Beta remains frozen until explicit user promotion approval
- when approved, create a new Beta baseline containing the updater and signed permanently for `com.jlingenfelter.swolecat`
- expect the current v0.66.1 beta cohort may need one last manual/fresh-install migration before future in-app Beta updates begin

Do not silently promote Beta.



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

Do not regenerate or rotate the Beta signing identity after testers install the new baseline.


## Latest Beta release blocker

The v0.73.1 Beta baseline is promoted and 77/77 validated. Signed publication is blocked only because GitHub's `SWOLE_CAT_ANDROID_STORE_PASSWORD` secret does not match the permanent Beta keystore.

The local signing backup is valid and opens successfully with its generated store password. User must replace that one repository Actions secret with the exact generated value, then rerun `Build Signed Swole Cat Beta Android`.

Beta feed remains disabled; no tester-facing release exists yet.
