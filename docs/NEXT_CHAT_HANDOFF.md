# Swole Cat - Next Chat Handoff

Last updated: 2026-10-09

This file is the canonical resume point for the next ChatGPT conversation. Read this first, then `docs/CURRENT_STATE.md` and `docs/ROADMAP.md` only if deeper evidence is needed.

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
