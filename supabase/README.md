# Supabase Infrastructure

Phase 8.1 intentionally uses **Supabase Auth only**.

There are no Swole Cat application-data tables in this phase.

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

The first Swole Cat-owned cloud rows should be introduced only when a real cloud capability needs them.

Expected order:
1. Phase 8.1: Auth identity only
2. Phase 8.2: bounded private backup metadata/storage
3. Phase 8.3: record-level sync tables and device records
4. Phase 8.4: cloud share-package lookup
5. Phase 8.5: server-verified Lifetime Pro entitlements

All future exposed tables must use least-privilege grants and Row Level Security before client access is enabled.

The service-role key must never be committed to this repository, bundled into the PWA, or packaged in the APK.

See `docs/CLOUD_ARCHITECTURE.md`.
