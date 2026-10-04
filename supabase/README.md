# Supabase Infrastructure

Phase 8.1 used **Supabase Auth only** and is complete.

Phase 8.2 introduces the first Swole Cat-owned cloud data, strictly for private disaster-recovery backups.

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

Current Phase 8.2 infrastructure:
- private Storage bucket: `swole-cat-backups`
- public-schema metadata table: `backup_metadata`
- metadata table RLS: enabled
- Storage object RLS: owner-folder only
- retention target: latest + previous snapshot
- backup payload: canonical `swole-cat-backup` JSON envelope
- client credential: publishable key only
- privileged account cleanup: authenticated `delete-account` Edge Function

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
- Public application tables: 1 in Phase 8.2 (`backup_metadata`, RLS enabled)
- Client configuration: project URL + modern publishable key
- Secret/service-role credentials: never client-side
