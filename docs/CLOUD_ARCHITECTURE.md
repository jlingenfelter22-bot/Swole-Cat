# Swole Cat Cloud Architecture

## Status

- Phase: 8.0
- Decision date: 2026-10-02
- Initial provider: **Supabase**
- Supabase organization: **SWOLE CAT**
- Supabase project: **Swole Cat** (`tpdmcuhsvmffpycgwhqb`, `us-east-2`)
- Initial hosting tier: **Free**
- Initial monthly infrastructure target: **$0**
- Current field beta: v0.66.1 remains local-only and unaffected
- Development branch: `main`

This document is the canonical cloud architecture contract for Swole Cat. It should be updated before a future cloud implementation intentionally breaks one of these boundaries.

## 1. Decision

Use **Supabase** for the first Swole Cat account, cloud-backup, sync, entitlement, and cloud-sharing implementation.

The decision is based on the combination of:
- hosted Postgres
- integrated authentication
- Postgres Row Level Security
- object storage
- Edge Functions for the small number of privileged server operations
- a usable free tier for lab and early beta work
- straightforward relational modeling for future groups and shared Programs
- the ability to keep Swole Cat's workout model independent from the provider

As of 2026-10-02, Supabase documents the Free tier as including 50,000 monthly active users, a 500 MB database per project, 1 GB object storage, 5 GB uncached egress plus 5 GB cached egress, 500,000 Edge Function invocations, 2 million Realtime messages, and 200 peak Realtime connections.

Official references:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://supabase.com/docs/guides/database/postgres/row-level-security

Provider pricing is external and can change. Re-check it before a public cloud launch.

## 2. Why not the main alternatives

### Firebase

Firebase has a strong free tier and mature authentication. Firestore currently includes free daily read/write quotas and 1 GiB of data storage.

It is not the first choice for Swole Cat because:
- Swole Cat already owns its offline/local state model and does not need Firestore to become the canonical client database.
- future groups, membership, entitlements, shared Programs, and privacy rules map naturally to relational data
- server functions require a billing-enabled Blaze project even when usage may fall inside no-cost quotas
- keeping the domain model in portable SQL/JSON boundaries gives us a cleaner backend exit path

Official references:
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/firestore/pricing
- https://firebase.google.com/docs/functions/quotas

### Cloudflare Workers + D1

Cloudflare is the strongest low-cost alternative. D1 currently offers 5 GB storage on the free plan, 5 million rows read per day, and 100,000 rows written per day. Workers Free currently allows 100,000 requests per day. The paid Workers plan starts at a lower monthly floor than Supabase Pro.

It is not the first choice because Swole Cat would need substantially more custom identity, authorization, API, purchase-verification, and data-access plumbing. That increases security and maintenance risk for a solo-developed product.

Cloudflare remains a legitimate migration target if backend economics later dominate the tradeoff.

Official references:
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/workers/platform/pricing/

### Appwrite and other hosted BaaS providers

These remain valid alternatives but do not currently beat Supabase on the combined fit of relational modeling, authorization, developer ergonomics, provider maturity, and migration flexibility for this app.

## 3. Zero-cost operating rule

Cloud development begins at **$0/month**.

Do not upgrade merely because Phase 8 begins.

During lab/private-beta cloud work:
- use the Supabase Free plan
- do not enable paid add-ons
- do not add a billing-dependent feature unless it is explicitly required
- avoid Realtime subscriptions until a feature actually needs them
- avoid unnecessary Storage usage
- avoid per-set or per-keystroke server requests
- batch and debounce sync traffic
- keep the workout path fully local

Supabase Free projects can be paused after a low-activity period. That is acceptable during lab/private beta because local workouts remain fully functional and queued sync can retry after the backend is available again.

Supabase documents that paid projects are not subject to free-project inactivity pausing. It also documents automatic daily database backups for Pro and higher plans, while Free projects should maintain their own export strategy.

### Upgrade triggers

Consider moving from Free to Pro only when one or more of these becomes true:
1. paying cloud users create a real uptime expectation
2. automatic provider-side daily backups become operationally necessary
3. free-project pausing becomes user-visible friction
4. database, egress, auth, function, or connection usage approaches a free limit
5. support/reliability requirements justify the cost
6. a public launch makes the Free tier operationally inappropriate

As of the decision date, Supabase Pro begins at $25/month. Re-check pricing before upgrading.

## 4. Swole Cat remains local-first

The current canonical device state remains `overload_v3`.

Network state must not replace local state in the live workout path.

The required shape remains:

```text
Workout / Routine / Program / Coach domains
                 |
                 v
          local Swole Cat state
                 |
         local durable save
                 |
        state:saved runtime event
                 |
                 v
          optional sync adapter
                 |
          queued / debounced
                 |
                 v
              cloud
```

Rules:
- starting a workout never requires the backend
- logging a set never requires the backend
- finishing a workout never requires the backend
- losing connectivity never loses local work
- sign-out does not erase local workout data
- cloud errors show cloud status, not workout-blocking errors
- manual JSON export/import remains supported even for Pro users

## 5. Provider isolation

Supabase must sit behind Swole Cat runtime services.

Workout, routine, Program, history, progression, Coach, and analytics modules must not call Supabase directly.

Expected services:
- `identity`
- `cloudBackup`
- `sync`
- `entitlements`
- `sharingTransport`

Provider-specific source should be isolated in dedicated cloud modules.

The runtime contract should use ordinary Swole Cat data structures so a future backend can replace Supabase without rewriting training behavior.

## 5.1 Live Phase 8.1 project boundary

The lab backend is now provisioned:

- organization: `SWOLE CAT`
- project: `Swole Cat`
- project ref: `tpdmcuhsvmffpycgwhqb`
- region: `us-east-2`
- API URL: `https://tpdmcuhsvmffpycgwhqb.supabase.co`
- client credential: modern Supabase publishable key only
- public application tables at provisioning: **0**
- security advisor findings at provisioning: **0**

The publishable key is a client credential and may ship in the PWA/APK. Service-role and secret keys must never ship in the client or be committed to the repository.

No Swole Cat application table should be added until a specific Phase 8 capability needs it.

## 6. Authentication

### Phase 8.1 minimum-data rule

The first account implementation is **Auth-only**.

Creating/signing into a Swole Cat account does not create Swole Cat-owned profile, device, workout, settings, analytics, or sync rows merely for bookkeeping.

Until a real cloud capability needs application data:
- Supabase Auth is the only remote account record
- the app stores no cloud sync metadata for signed-out/local-only users
- the app performs no workout-data upload
- device identity remains unregistered remotely
- local workout state remains `overload_v3`

This deliberately avoids shadow data and keeps early cloud cost and privacy surface minimal.

### Initial production-facing method

Start with **Google sign-in** for early cloud testing.

**v0.67.1:** Web/PWA Google OAuth is connected through a provider-neutral identity loader. Supabase JS is pinned to 2.117.2 and lazy-loaded only when the user initiates account sign-in or when namespaced auth state exists and a prior session needs restoration. Signed-out workout usage does not load the SDK.

**v0.67.2:** Android uses the same Supabase PKCE Google OAuth flow through the system browser and returns via `com.jlingenfelter.swolecat://auth/callback`. The generated Android manifest is patched during `android:prepare`, and the Capacitor App API handles both warm `appUrlOpen` events and cold-start launch URLs. The official Capacitor Browser plugin is pinned for browser handoff/close. Android secure Keystore-backed auth storage remains required before public production use.

Reason:
- Android users already have a Google identity available
- Supabase supports Google OAuth
- this avoids depending on Supabase's built-in email sender as the primary production account flow

Supabase currently documents a built-in auth-email limit of 2 emails per hour per project. That is suitable for development, not a public signup flow.

Email/password or magic-link login can be added later after Swole Cat configures its own transactional email provider.

### Auth storage

Authentication tokens must not be mixed into `overload_v3`.

Before public production release, Android auth session secrets should use a Keystore-backed secure-storage adapter rather than ordinary workout localStorage.

### Account behavior

Accounts remain optional.

Signing in should add:
- cloud backup
- sync
- restore
- connected sharing
- future group features

Signing out should:
- end the cloud session
- stop sync
- leave local workout data intact

Deleting an account should delete cloud-owned account data but must not silently erase local workout history. Local erasure remains a separate explicit action.

## 7. Cloud backup and sync are different systems

Do not confuse backup with synchronization.

### Cloud backup

Purpose: disaster recovery.

Use the existing:
- format: `swole-cat-backup`
- backup format versioning
- schema migration/validation pipeline

The cloud copy should therefore be restorable through the same trusted validation path as a manual JSON backup.

Recommended implementation:
- private per-user backup objects
- metadata row with schema version, app version, hash, timestamp, source device, and size
- retain a small bounded set, initially latest + previous
- prune older snapshots
- manual `Back Up Now`
- automatic backup after meaningful milestones can be added later

A restore must always preview/confirm before replacing local state and should create the existing pre-import safety snapshot first.

### Multi-device sync

Purpose: keep one user's current data coherent across devices.

Do not upload and overwrite the entire `overload_v3` blob on every save.

Instead, project local state into individual sync records.

## 8. Sync record model

Recommended conceptual record:

```text
sync_records
  owner_id
  record_type
  record_id
  payload_json
  record_version
  server_change_seq
  source_device_id
  client_updated_at
  server_updated_at
  deleted_at
```

Primary identity:
`(owner_id, record_type, record_id)`

Candidate record types:
- `routine`
- `program`
- `session`
- `custom_exercise`
- `active_workout`
- `profile`
- `settings`
- `ui_preferences`
- `favorites`
- `exercise_preferences`
- `bodyweight`
- `app_state`

Large arrays with naturally stable IDs should sync as individual records. Small singleton domains can sync as one record.

The existing local object model should not be rewritten solely to match the database.

## 9. Local sync metadata

Keep sync machinery outside the workout state in a separate local record such as `swolecat_sync_v1`.

It can contain:
- device ID
- account ID
- last server cursor
- last synced record hashes
- server versions by record
- pending queue
- conflict metadata
- last successful sync timestamp

Benefits:
- manual backup format stays clean
- local-only users do not accumulate cloud metadata
- provider migration is easier
- sync bugs cannot silently mutate training data merely by changing metadata

## 10. Change detection and network behavior

The existing `state:saved` event is the sync trigger, not a command to immediately hit the network.

Flow:
1. local save succeeds
2. sync adapter reads a state snapshot
3. adapter projects it into sync records
4. compare canonical hashes against last synced manifest
5. enqueue changed/new/deleted records
6. debounce/batch network push
7. retain queue on failure
8. retry when online/app-ready/background-safe point is reached

Do not send a network request for every keystroke, weight change, rep change, timer tick, or UI navigation.

Useful sync moments:
- shortly after a burst of local changes
- workout finish
- app background
- app startup
- explicit Sync Now
- after connectivity returns

## 11. Versioning and conflicts

Every remote record has a server-controlled version.

Client pushes include the last version they observed.

If the server version has advanced:
- do not silently overwrite it
- return a conflict
- preserve both sides until resolution

Initial conflict policy:
- ordinary no-conflict changes auto-merge by record identity
- independent new sessions/routines/programs coexist
- singleton settings may use a clearly documented latest-edit policy where loss is low-risk
- meaningful Routine/Program/session conflicts are surfaced for user choice
- deletions use tombstones so a deleted record does not reappear from another device
- active workouts are conservative: do not attempt unsafe live set-by-set merging between devices

The first multi-device release does not need collaborative simultaneous editing.

## 12. Pull cursor

Use a monotonically increasing server change sequence rather than relying only on client timestamps.

Client stores the last received sequence and requests records with a higher sequence.

This avoids missing updates because of:
- device clock drift
- equal timestamp precision
- timezone differences

## 13. Database/service boundaries

Recommended initial tables/services:

### Phase 8.1
No Swole Cat-owned application-data tables. Supabase Auth only.

### `devices` (Phase 8.3)
Registered installations only when multi-device sync actually needs them.

### `sync_records` (Phase 8.3)
Private user-owned record stream described above.

### `backup_metadata` (Phase 8.2)
Metadata for bounded cloud recovery snapshots.

### private backup storage
Existing full backup envelopes, accessible only to the owner.

### `entitlements` (Phase 8.5)
Server-written paid entitlement state. Client may read its own entitlement, never grant itself Pro.

### `shared_packages` (Phase 8.4)
Cloud delivery records that map a short code/link to a canonical `SWOLECAT1` package.

Future group tables should be normalized separately rather than mixed into `sync_records`.

## 14. Row Level Security

RLS is mandatory on every user-data table exposed to the client.

Default posture:
- unauthenticated users receive no access to private user tables
- authenticated users can only access rows owned by `auth.uid()`
- entitlement writes are not granted to normal authenticated clients
- service-role credentials never ship in the PWA or APK
- shared payload resolution exposes only the explicit blueprint-sharing surface
- every RLS policy receives automated database tests before cloud beta promotion

The public client key is not a privacy boundary. RLS is.

## 15. Privileged server operations

Use Edge Functions or tightly scoped database RPC for operations that must not trust the client.

Examples:
- Google Play purchase verification
- writing Lifetime Pro entitlement
- account deletion orchestration
- secure short-code creation/rotation if needed
- administrative maintenance

Do not route ordinary personal sync traffic through an Edge Function if RLS-protected database access can do the job safely.

That keeps latency, function usage, and cost down.

## 16. Lifetime Pro architecture

The client must never be able to grant itself Pro by writing a local boolean to the cloud.

Conceptual entitlement:

```text
entitlements
  user_id
  entitlement = "pro_lifetime"
  source = "google_play"
  product_id
  purchase_reference
  verified_at
  revoked_at
```

Purchase verification occurs server-side.

The app may cache entitlement for UI/offline convenience, but the server remains authoritative for connected Pro services.

A lifetime purchase stays lifetime for that user.

## 17. Cloud sharing

Cloud sharing does not introduce a second plan format.

Required flow:

```text
short code / URL
      |
      v
shared package lookup
      |
      v
canonical SWOLECAT1 string
      |
      v
existing decode + checksum + validate + preview + import
```

The server stores/delivers the package. The current importer remains authoritative.

Recipients should be able to import a plan without receiving the sender's:
- sessions
- PRs
- bodyweight
- private profile data
- active workout
- progression history
- analytics
- Program rotation progress

## 18. Future groups

Group/collaboration data gets its own normalized relational model.

Expected future concepts:
- groups
- group_members
- shared_program_templates
- group_assignments
- member visibility/privacy settings
- optional live presence

A user's personal performance remains private user-owned data unless a specific visibility permission exposes a defined projection.

Never store a group's shared blueprint as if it were one member's private Routine record.

## 19. Free-tier data discipline

To stretch the free tier:
- no realtime subscriptions in Phase 8.1/8.2
- bounded backup retention
- batch sync changes
- pull by change cursor
- indexes on owner/type/id and change sequence
- no analytics event firehose
- no cloud copy of the 307 built-in exercise catalog
- store only user-created custom exercise definitions
- do not upload generated thumbnails or other static app assets per user
- do not duplicate `SWOLECAT1` payloads unnecessarily
- prune revoked/expired share packages according to a documented retention policy later
- monitor actual row size/egress before adding speculative optimization

## 20. Operational backups while on Free

Supabase documents automatic daily database backups for paid plans, not the Free plan.

During lab/private beta:
- local device data remains the primary resilience layer
- users retain manual Swole Cat export/import
- cloud backup is an additional copy, not the only copy
- maintain versioned SQL migrations in the repository
- periodically export the small cloud database during meaningful testing milestones

Before marketing cloud backup as a paid reliability feature at meaningful scale, reassess whether the project should be on a paid tier with provider backups.

## 21. Repository layout for implementation

Expected additions when Phase 8.1 begins:

```text
src/js/
  10a-cloud-config.js
  10b-cloud-identity.js
  10c-cloud-backup.js
  10d-cloud-sync.js
  10e-cloud-entitlements.js
  10f-cloud-sharing.js

supabase/
  migrations/
  tests/

scripts/
  cloud-architecture-stress.mjs
  cloud-sync-stress.mjs
```

Exact filenames can change. The boundary cannot.

## 22. Testing requirements

Cloud work is not complete because happy-path login works once.

Required automated coverage should include:
- local-only mode with no cloud configuration
- cloud unavailable at startup
- cloud disappears mid-workout
- queued changes survive restart
- duplicate retry is idempotent
- new local and remote records merge
- delete tombstones propagate
- two-device same-record conflict is not silently lost
- v0.66.1 backup data restores correctly
- sign-out leaves local data intact
- account deletion does not silently delete device history
- RLS prevents cross-user reads/writes
- normal client cannot write Pro entitlements
- malformed cloud share package still goes through normal importer validation
- lb/kg data remains correct through backup/sync
- active workout remains safe through app background/restart/network failure

The existing full production regression wall remains required.

## 23. Rollout order

### Phase 8.1
Identity shell only. Local app behavior must remain identical when signed out.

### Phase 8.2
Manual cloud backup and restore. No multi-device merge yet.

### Phase 8.3
Record-level multi-device sync with explicit conflict handling.

### Phase 8.4
Short share codes/URLs resolving to `SWOLECAT1`.

### Phase 8.5
Google Play Lifetime Pro verification and entitlement.

This order lets Swole Cat prove each cloud layer independently.

## 24. Provider exit strategy

Supabase is selected, not welded into the app.

Exit requirements:
- domain modules only talk to runtime services
- canonical local state remains Swole Cat-owned
- manual backup remains Swole Cat-owned JSON
- sharing payload remains `SWOLECAT1`
- sync projection is ordinary JSON records
- SQL migrations are version-controlled
- no feature should require proprietary Realtime semantics to function

If economics or reliability later favor Cloudflare, a self-hosted Postgres service, or another provider, replace the transport/service implementation rather than rewriting the workout product.

## 25. Current decision summary

**Use Supabase Free. Spend $0 during the lab/private cloud beta. Keep every workout local-first. Add cloud as an optional, replaceable adapter. Separate full backup from record-level sync. Do not use realtime or per-set network writes. Keep private data behind RLS. Reuse existing Swole Cat backup and sharing formats. Upgrade the backend only when real users, paid cloud expectations, or measured limits justify the cost.**
