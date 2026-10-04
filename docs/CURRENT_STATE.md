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
- Functional code baseline before this docs-only checkpoint: `12c3cfbfef1bbade89d1185ab2fc496410aea0d4`
- App version: **v0.68.0**
- Android version code: **90**
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

For functional baseline `12c3cfbfef1bbade89d1185ab2fc496410aea0d4`:

- Final pre-merge validation: run **608**, success
- Validate Swole Cat on `main`: run **609**, success
- Deploy Swole Cat to GitHub Pages: run **602**, success
- Build Swole Cat Testing Android: run **330**, success
- permanent Testing certificate verification: success
- Android artifact: `Swole-Cat-Testing-Android-v0.68.0-signed`
- Android artifact digest: `sha256:678233feb44c5e34cc8e051497c236407a47982c147ca762d6ba6bab7a0630c0`
- Extracted APK SHA-256: `c5bcc1fbb3f88590f472a96a7d8d52b9cde773a0838f62e7b6f8a5aa4e858828`

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

Remaining Phase 8.2 exit work:
- [ ] install the permanently signed v0.68.0 Testing APK over v0.67.6 without uninstalling
- [ ] confirm existing local workout data survives the update
- [x] sign in again after the Phase 8.1 account-deletion test
- [x] create the first real-device v0.68.0 cloud backup and verify matching private Storage object + metadata row
- [ ] create two more backups and verify only latest + previous remain
- [ ] change local data and restore the previous snapshot
- [ ] verify the pre-restore local rollback snapshot exists and can recover the replaced state
- [ ] verify local workout flow still works with cloud unavailable
- [ ] verify account deletion also clears backup objects/metadata while preserving local workout data
- [ ] then mark Phase 8.2 complete

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

> Resume Swole Cat from `docs/CURRENT_STATE.md`. Phase 8.1 is complete. Phase 8.2 Cloud Backup is merged on `main` as Swole Cat Testing v0.68.0. Branch validation 608, main validation 609, Pages 602, and signed Android build 330 are green. The live backend uses private owner-only `swole-cat-backups` Storage plus RLS-protected `backup_metadata`, exact canonical backup envelopes, SHA-256 verification, latest+previous retention, restore preview, and local rollback snapshots. Next perform real-device backup/restore/account-deletion verification before Phase 8.3. Keep beta v0.66.1 frozen.


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
