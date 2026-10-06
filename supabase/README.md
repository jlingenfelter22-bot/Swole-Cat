# Supabase Infrastructure

Phase 8.1 used **Supabase Auth only** and is complete.

Phase 8.2 introduced the first Swole Cat-owned cloud data for private disaster-recovery backups. Phase 8.3 added owner-scoped record sync. Phase 8.4 adds short-lived plan sharing.

That is deliberate. Creating an account should not automatically create shadow copies of:
- profile data
- routines
- Programs
- workout sessions
- active workouts
- bodyweight
- favorites
- Coach data
- analytics
- settings
- device records

Current cloud infrastructure:
- private Storage bucket: `swole-cat-backups`
- public-schema metadata table: `backup_metadata`
- metadata table RLS: enabled
- Storage object RLS: owner-folder only
- retention target: latest + previous snapshot
- backup payload: canonical `swole-cat-backup` JSON envelope
- client credential: publishable key only
- privileged account cleanup: authenticated `delete-account` Edge Function
- record-level sync tables: `devices` + `sync_records`
- short-lived plan shares: `plan_shares`
- plan share retention: 7 days, max 25 active shares per account
- raw share codes are never stored; only SHA-256 hashes are persisted
- plan sharing transport: `plan-share` Edge Function
- direct anon/authenticated access to `plan_shares` is revoked and explicitly denied by RLS

The applied database migration is tracked at `supabase/migrations/20261004150339_phase_8_2_cloud_backup.sql`.

Expected order:
1. Phase 8.1: Auth identity only
2. Phase 8.2: bounded private backup metadata/storage
3. Phase 8.3: record-level sync tables and device records
4. Phase 8.4: cloud share-package lookup
5. Phase 8.5: server-verified Lifetime Pro entitlements

All future exposed tables must use least-privilege grants and Row Level Security before client access is enabled.

The service-role key must never be committed to this repository, bundled into the PWA, or packaged in the APK.

See `docs/CLOUD_ARCHITECTURE.md`.


## Live Phase 8 project

- Organization: `SWOLE CAT`
- Project: `Swole Cat`
- Project ref: `tpdmcuhsvmffpycgwhqb`
- Region: `us-east-2`
- Tier: Free
- Public application tables: `backup_metadata`, `devices`, `sync_records`, and `plan_shares`, all RLS enabled
- Client configuration: project URL + modern publishable key
- Secret/service-role credentials: never client-side


## Phase 8.4 live sharing

Version target: Swole Cat Testing v0.71.0.

Behavior:
- signed-in senders create a short code like `SC-XXXX-XXXX-XXXX-XXXX`
- recipients may resolve/import the code without creating a cloud account
- only the existing routine/program blueprint envelope is uploaded
- workout history, PRs, bodyweight, profile data, analytics, active workout state, and Program rotation progress are excluded
- each share expires after 7 days
- each account is capped at 25 active shares; older rows are pruned as new shares are created
- expired rows are pruned during create/resolve traffic
- the usable code is returned once and only its SHA-256 hash is stored
- the legacy `SWOLECAT1` self-contained package remains available as an offline fallback

Tracked migrations:
- `20261006153500_phase_8_4_cloud_plan_sharing.sql`
- `20261006155300_phase_8_4_plan_shares_explicit_deny.sql`

Edge Function:
- `plan-share`
- JWT verification is disabled at the gateway because anonymous recipients must be able to resolve a bearer-style share code
- the function itself requires and verifies a valid user JWT for the `create` action
- `resolve` is public-by-secret and returns only the matching unexpired plan blueprint
