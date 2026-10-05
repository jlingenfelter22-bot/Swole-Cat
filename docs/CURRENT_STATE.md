# Swole Cat Current State

## Purpose

This is the **resume-first checkpoint** for Swole Cat.

If chat history, assistant context, or a development session is lost, read this file before making changes. It records the current working baseline, branch contract, cloud state, tested account behavior, and the next unfinished work.

Checkpoint date: **2026-10-05 (America/Chicago)**

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
- Functional code baseline before this docs-only checkpoint: `001a1c4c25e51beab7d97b5a45f79b9843962cc9`
- App version: **v0.69.0**
- Android version code: **91**
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

For functional baseline `001a1c4c25e51beab7d97b5a45f79b9843962cc9`:

- Final pre-merge validation: run **642**, success
- Validate Swole Cat on `main`: run **643**, success
- Deploy Swole Cat to GitHub Pages: run **612**, success
- Build Swole Cat Testing Android: run **331**, success
- permanent Testing certificate verification: success
- Android artifact: `Swole-Cat-Testing-Android-v0.69.0-signed`
- Android artifact digest: `sha256:dcc4e7357e67c9ed8e9c09edbe0a18e787db5e2bbc73033f38b3a6bf6283faba`
- Extracted APK SHA-256: `6082f95a5d7fc24d3ddb76458580ab571ac043abfa58d59b10dd3967332f62dc`

The build verifies the generated Android application ID, visible app name, OAuth callback scheme, version metadata, persistent Testing signature, the Phase 8.3 two-device sync battle test, and the full regression wall.

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
- [ ] verify edits propagate both directions
- verify same-record concurrent edits create a conflict instead of data loss
- verify conflict resolution
- verify tombstone deletion propagation
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

> Resume Swole Cat from `docs/CURRENT_STATE.md`. Phase 8.1 Identity and Phase 8.2 Cloud Backup are complete. Phase 8.3 manual record-level sync is merged on `main` as Swole Cat Testing v0.69.0. Branch validation 642, main validation 643, Pages 612, and permanently signed Android build 331 are green. Sync uses stable device identity, owner-private versioned records, change cursors, offline queueing, tombstones, explicit conflict handling, and manual Sync Now; active workouts remain local-only. Next perform real-device two-installation testing before automating sync. Keep beta v0.66.1 frozen.


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
