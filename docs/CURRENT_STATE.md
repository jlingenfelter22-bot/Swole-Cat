# Swole Cat Current State

## Purpose

This is the **resume-first checkpoint** for Swole Cat.

If chat history, assistant context, or a development session is lost, read this file before making changes. It records the current working baseline, branch contract, cloud state, tested account behavior, and the next unfinished work.

Checkpoint date: **2026-10-04 (America/Chicago)**

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
- Functional code baseline before this docs-only checkpoint: `2e5bdb4199691a1839cbcb03e7cb3b4c14184d53`
- App version: **v0.67.6**
- Android version code: **89**
- Android app name: **Swole Cat Testing**
- Android package ID: `com.jlingenfelter.swolecat.testing`
- Purpose: cloud/account work, new features, architecture experiments, and risky development

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

For functional baseline `2e5bdb4199691a1839cbcb03e7cb3b4c14184d53`:

- Final pre-merge validation: run **594**, success
- Validate Swole Cat on `main`: run **595**, success
- Deploy Swole Cat to GitHub Pages: run **593**, success
- Build Swole Cat Testing Android: run **329**, success
- Android artifact: `Swole-Cat-Testing-Android-v0.67.6-signed`
- Android artifact digest: `sha256:53bb9378d7a9e4a7888089a82ef557435719836e04a0e06b1c52c8c82d2f0db0`
- Extracted APK SHA-256: `31d8f2df05d0b93d65a091912f1fca645061c799dbcb573dfaa88121f4e363f0`

The build verifies the generated Android application ID, visible app name, OAuth callback scheme, version metadata, and the full regression wall.

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

As verified after the first real Android login on 2026-10-03:
- Supabase Auth users: **1**
- Auth provider: **Google**
- Public Swole Cat application tables: **0**
- Workout/routine/history data uploaded by account creation: **0**

This is intentional. Phase 8.1 is identity-only.

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

Runtime services:
- `cloudConfig`
- `cloudAuthStorage`
- `identity`
- `identityProviderLoader`

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

Do not create these merely because account login works:
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

There are currently **zero public application tables** by design.

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

Remaining Phase 8.1 verification:
- install v0.67.6 over permanently signed v0.67.5 without uninstalling
- confirm the existing Google/Supabase session survives the in-place update
- verify sign-out keeps local workout data
- sign back in with the same Google account to verify recovery
- verify the delete-account Google re-auth and final deletion flow on real Android hardware
- confirm local workout data remains after cloud-account deletion
- then mark Phase 8.1 complete

### Then Phase 8.2: Cloud Backup

First actual user-owned Swole Cat cloud data.

Direction already locked:
- reuse the existing validated `swole-cat-backup` envelope
- cloud backup is disaster recovery, not multi-device merge
- private owner-only storage
- bounded retention, initially latest + previous
- metadata includes schema/app version, hash, timestamp, source device, size
- manual **Back Up Now**
- manual restore with preview/confirmation
- restore creates a local safety snapshot before replacing data
- cloud failure never blocks workouts
- RLS/security tests are mandatory before beta promotion

Do not jump directly to multi-device sync before proving backup.

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

> Resume Swole Cat from `docs/CURRENT_STATE.md`. Swole Cat Testing v0.67.6 implements the Phase 8.1 Google recovery/re-auth and authenticated cloud-account deletion lifecycle, and Android run 329 produced a permanently signed update APK. Next verify the v0.67.6 lifecycle on real Android hardware, then mark Phase 8.1 complete and begin Phase 8.2 Cloud Backup. Keep beta v0.66.1 frozen.
