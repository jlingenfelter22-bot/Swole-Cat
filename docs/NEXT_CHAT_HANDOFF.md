# Swole Cat - Next Chat Handoff

Last updated: 2026-10-06

This file is the canonical resume point for the next ChatGPT conversation. Read this first, then `docs/CURRENT_STATE.md` and `docs/ROADMAP.md` only if deeper evidence is needed.

## Immediate resume instruction

Do not begin a new cloud phase by default.

The next product task is:

**Settings cleanup and reorganization.**

The user wants to review the Settings screen, clean up all settings, decide where each setting belongs, improve grouping/order/labels, and make the Settings menu feel intentional and easy to scan.

This task has NOT started yet. The current chat intentionally stopped before making any Settings changes so the next chat can begin cleanly from this checkpoint.

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
`0.69.4`

Android versionCode:
`95`

Current stable cloud/sync baseline commit:
`f513c1efac50594de46c9eecb8d6cbcc0c7dfd03`
Hotfix title:
`Hotfix v0.69.4 prevent cloud API caching in PWA`

The documentation-only commits after that hotfix record the completed real-device validation and roadmap closure.

Important branches:
- `main`: experimental Testing
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

**"Swole Cat is currently on Testing v0.69.4 / Android code 95. Phases 8.1 Identity, 8.2 Cloud Backup, and 8.3 Multi-device Sync are complete and real-device validated. The destructive account-deletion exit test left Supabase at zero Auth users/devices/sync rows/backups while all local workout data remained intact. Do not expand cloud scope. The next task, not yet started, is Settings cleanup and reorganization: inventory every current setting, clean up section grouping/order/labels, and then implement the polished Settings structure."**
