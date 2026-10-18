# Android Build Variants — Controlled Engineering Audit

**Status:** Lab-only / not a Testing or Beta release. October 18, 2026.

## Current known facts
- The installed Testing v0.93.3 (versionCode 138) is built via `.github/workflows/android.yml` with Gradle `assembleDebug` and the established permanent Testing signing key. The update mechanism expects that same package ID, a strictly higher versionCode, and the matching signing certificate.
- Even though the APK is permanently signed for updating, it is a **debug build variant**. Debug vs release can alter Android framework flags, native bytecode optimization, component/resource shrinking and logging, but it does **not automatically optimize the WebView JavaScript event/render loops** that generated our earlier CPU/DOM findings.
- The application uses Capacitor; `npm run android:prepare` generates `android/` from the dependency version and synchronized Web assets. This is why there is no checked-in `android/app/build.gradle` file in the source repository.

## Non-shipping experiment
`.github/workflows/android-build-variant-comparison.yml` runs in its own ephemeral Linux CI workspace on pull requests:

1. Generate the identical Android project / WebView JS and CSS assets as usual, with **no live credentials or production signing keys**.
2. Build `assembleDebug` and the generated default `assembleRelease` with minification off.
3. Modify **only the generated CI copy of Gradle** to switch `release { minifyEnabled true }`; rebuild to compare an R8/minified release-like Android wrapper.
4. Compare APK package bytes, DEX uncompressed size, bundled Web assets and app.js/app.css SHA-256 identity, recording structured JSON. Never upload, tag, distribute, install, or sign the experiment APKs. Workflow permits `contents:read` only and uploads **JSON measurements**.
5. If R8 compile errors or plugin keep-rule warnings occur, fail the experiment and diagnose without affecting Testing or Beta.

This is **package analysis, not a runtime benchmark**. Size reductions alone cannot substantiate startup, FPS, memory usage or smoothness improvements. Optimized variants, if promising, still require a **carefully signed, owner-approved Testing-only future release** and Android phone tests with safe, backed-up data. No current build configuration or APK is changed.

## Acceptance and next actions
- Ensure lab workflow completes. Record exact binary and native DEX deltas, and any R8 warnings. Confirm that the **same Web JS/CSS** is packaged to isolate build-wrapper changes.
- Analyze Android runtime implications, plugin method preservation, network/callback flow, secure storage and updater compatibility. Do not assume passing the compiler proves native plugins function correctly after R8.
- For a future controlled on-device build, preserve `com.jlingenfelter.swolecat.testing`, original Testing signature and increasing versionCode. Do not install an unsigned or CI ephemeral-key APK over an existing Testing app, and never uninstall/clear real records to test.
- **Never modify Beta** to trial this.
- Continue awaiting the owner's v0.93.3 on-phone Coach/History acceptance; if jank remains, prioritize measured JavaScript/DOM hot paths over a costly native migration.
- A separate [draft PR #80](https://github.com/jlingenfelter22-bot/Swole-Cat/pull/80) already validates the Exercise Library rendering optimization but is not in any signed APK yet.
- Future trainer/client product is documented and parked, not part of this performance experiment.
