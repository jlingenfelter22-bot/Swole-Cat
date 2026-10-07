# Swole Cat Update Distribution Contract

Last updated: 2026-10-06

## Purpose

Swole Cat uses two independent Android applications during development:

- **Swole Cat Testing** — active development and device testing
- **Swole Cat** — controlled beta/stable channel used by external testers and real workouts

The update system must preserve that separation permanently.

## 1. Channel contract

### Testing

- source branch: `main`
- Android package: `com.jlingenfelter.swolecat.testing`
- app name: `Swole Cat Testing`
- signing identity: persistent Testing signing key
- update channel: `testing`
- purpose: all active development work
- a new signed Testing release may advance the Testing update feed after validation/build succeeds
- Testing releases must never advance the Beta update feed

### Beta

- source branch/checkpoint: `beta`
- Android package: `com.jlingenfelter.swolecat`
- app name: `Swole Cat`
- signing identity: permanent release/beta signing key
- update channel: `beta`
- purpose: controlled external testing / real workouts
- Beta must move only after the user explicitly says to promote a tested build
- merges/builds on `main` must never implicitly publish a Beta update

## 2. One-time beta bootstrap

The current field beta is v0.66.1 and predates the new in-app updater.

Before the next Beta promotion:

1. implement and validate the updater completely in Swole Cat Testing
2. prove an in-place Testing update from one signed Testing version to the next
3. choose the tested `main` commit to become the new Beta baseline
4. build that code as `com.jlingenfelter.swolecat` with the permanent release/beta key
5. publish it as the new Beta channel baseline with the updater already included
6. existing beta testers perform one final manual/fresh-install migration if their old installed beta cannot accept the new signing identity
7. before uninstalling an old beta, protect local data with cloud sync/backup or an exported local backup
8. after the new baseline is installed, future Beta updates use the in-app updater

The signing identity used for the new Beta baseline must remain permanent. Future Android updates require the same package identity and compatible signing certificate.

## 3. Update discovery

Updates do not require a Swole Cat cloud account.

Use two public channel manifests:

- `testing`
- `beta`

Each manifest should contain at minimum:

- channel
- version name
- Android versionCode
- APK download URL
- APK SHA-256
- package ID
- signing-certificate fingerprint or expected release identity
- release notes
- publish timestamp
- minimum supported updater version if needed later
- optional required/recommended flag

The installed app compares Android `versionCode`; the semantic version is primarily user-facing.

## 4. Hosting

Preferred initial implementation:

- signed APKs: versioned GitHub Release assets
- channel metadata: tiny public static JSON manifests published with Swole Cat's release infrastructure / GitHub Pages

Rationale:

- no account required
- no Supabase auth dependency
- no database migration needed
- GitHub already builds and stores signed artifacts
- explicit promotion can control Beta independently
- easy to audit which binary a manifest points to

Supabase remains the user-data/cloud platform, not the update authority.

## 5. In-app UX

Settings gains an **App & Updates** area.

At minimum show:

- installed version
- installed Android build/versionCode
- channel: Testing or Beta
- update status
- `Check for updates`

When an update exists:

- version/build
- concise release notes
- `Download & Update`

Normal update flow:

1. check channel manifest
2. compare installed versionCode
3. refuse wrong package/channel
4. download APK to app cache
5. verify SHA-256
6. verify expected package/signing identity where available
7. hand the APK to Android's package installer
8. Android obtains any required user approval
9. install over the existing app
10. reopen/return with existing app data intact

## 6. Android installer behavior

Use Android's supported package-installation APIs rather than trying to silently bypass platform security.

The application may require the `REQUEST_INSTALL_PACKAGES` capability and Android may require the user to enable **Allow from this source** for Swole Cat / Swole Cat Testing.

The first in-app update may therefore require a one-time Android settings approval. After that, ordinary update flows should be substantially simpler, although Android may still present installation confirmation depending on OS/device policy.

Do not promise silent unattended installs.

## 7. Safety rules

- never install an APK whose SHA-256 does not match the manifest
- never install a Beta APK into Testing or a Testing APK into Beta
- never allow versionCode downgrade through the normal updater
- never change Beta signing identity after the new baseline is established
- never publish a Beta manifest from ordinary `main` builds
- never interrupt an active workout with an installation flow
- if an update is discovered during an active workout, show at most a passive indicator and defer the actionable prompt until the workout ends
- local workout tracking must continue normally if update checks fail or the device is offline

## 8. Testing publication

The Testing updater is the rehearsal environment for the entire release path.

Acceptance test:

1. install signed Testing version N
2. publish signed Testing version N+1 to the Testing feed
3. version N detects N+1
4. Settings shows the correct release
5. download succeeds
6. hash verification succeeds
7. Android installer accepts the update
8. app package remains `com.jlingenfelter.swolecat.testing`
9. local routines/history/settings/auth survive
10. active-workout recovery remains intact
11. test a bad hash/wrong package/offline path and confirm update is rejected safely

Do not promote the updater to Beta until this works on the user's real Android device.

## 9. Beta promotion

Beta promotion is a deliberate release operation, never a side effect of development.

When the user explicitly says to push the current tested version to Beta:

1. identify the exact tested `main` commit
2. update/promote the `beta` branch/checkpoint to that approved source
3. build with Beta app identity and permanent Beta/release signing key
4. run full validation
5. verify package/version/signing metadata
6. publish the signed Beta APK
7. update the `beta` channel manifest only after all gates pass
8. beta testers receive the in-app update prompt

Until step 7, installed beta applications must continue reporting themselves up to date.

## 10. Future store distribution

If Swole Cat later ships through Google Play or another managed app store, reevaluate the updater.

A store-managed build should normally use that store's supported in-app update/update-delivery mechanism rather than a parallel sideload installer. The current updater is specifically for the direct-distribution/testing model.
