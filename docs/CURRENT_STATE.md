# Swole Cat Current State

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
