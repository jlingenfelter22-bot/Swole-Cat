# Swole Cat Sharing Architecture

This document defines the canonical Routine/Program sharing contract introduced in v0.66.0 and the rules future cloud/account work must preserve.

## Status

- Introduced: v0.66.0
- Canonical payload prefix: `SWOLECAT1`
- Current payload format: `swole-cat-share`
- Current format version: `1`
- Current delivery modes: native Android share sheet, web/native share fallback, copy/paste
- Current dependency model: fully local, no account or server required

## Core architectural decision

`SWOLECAT1` is the canonical portable blueprint package for Swole Cat Routine and Program sharing.

It is intentionally separate from full backup/migration data. A share package describes **what to train**, not **a person's training history or identity**.

Future accounts, cloud links, short codes, group features, or trainer sharing should reuse this package wherever the intent is to transfer a Routine or Program blueprint.

Do not create a second Routine/Program serialization model just because a backend exists.

## Delivery layer versus payload layer

There are two distinct layers:

### Payload layer

The payload contains the complete portable Routine or Program blueprint.

Today, that payload is encoded directly into a self-contained string:

`SWOLECAT1.<checksum>.<encoded-payload>`

The receiving app can reconstruct the shared plan from the payload alone.

### Delivery layer

The delivery layer is how the payload reaches another device.

Current delivery:
- Android native share sheet
- platform/web share fallback
- copied text/code

Future delivery may include:
- short code, for example `A7F4K2`
- share URL
- authenticated user-to-user send
- trainer/team library
- group template assignment

Those future mechanisms should resolve to the canonical payload and then pass it through the existing universal importer.

Example future flow:

`A7F4K2` -> backend lookup -> stored `SWOLECAT1` payload -> existing decode/validate/preview/import pipeline

A URL follows the same rule:

share URL -> backend lookup -> stored `SWOLECAT1` payload -> existing importer

The backend is therefore an indexing, storage, permission, and delivery layer. It does not need a separate blueprint representation.

## Payload types

### Routine package

A Routine package contains:
- Routine name
- Routine description/notes
- Routine training mode
- ordered exercise blueprint
- sets
- rep ranges
- weight increment
- progression mode/strategy
- adaptive progression flag
- top-set/backoff structure when present
- training goal
- reset percentage
- rest duration
- target RIR when present
- superset grouping
- supported warm-up/AMRAP blueprint flags
- any required custom-exercise definitions
- source unit system needed for safe lb/kg conversion

It does not carry the sender's local Routine ID.

### Program package

A Program package contains:
- Program name
- target weekly frequency
- preferred training days
- Program training-mode behavior
- ordered references to bundled Routine blueprints
- every unique Routine blueprint required to reconstruct the Program
- any required custom-exercise definitions

It deliberately does **not** carry the sender's `nextIndex` or current place in the rotation. A recipient starts an imported Program at Day 1.

## Identity and ID remapping

Sender-local IDs are never authoritative on the receiving device.

On import:
- Program receives a fresh local ID
- every imported Routine receives a fresh local ID
- Program references are rewritten to those fresh Routine IDs
- custom exercises receive safe local IDs
- superset groups receive fresh local IDs
- exact matching custom-exercise definitions may be reused instead of duplicated

This prevents one person's local object graph from colliding with another person's data.

## Unit handling

The payload records the sender's unit system.

On import:
- rep counts and percentages remain unchanged
- weight-based progression increments are converted between lb and kg when sender and recipient units differ
- the recipient's local unit preference remains authoritative

Do not silently copy a numeric weight increment across unit systems without conversion.

## Privacy boundary

Routine/Program sharing is a blueprint-sharing feature, not a personal-data transfer feature.

The canonical share payload must not include:
- completed workout history
- PR history
- bodyweight
- body measurements
- user profile/name
- account identity
- active workout state
- workout notes/history tied to completed sessions
- personal analytics
- Coach conversation/history
- sender Program progress / current rotation position
- local preferences unrelated to the shared blueprint

If Swole Cat later supports full backup, device migration, or explicit personal-data transfer, that must remain a separate format and a separately selected user action.

## Import pipeline

The universal importer is the canonical ingestion path.

The intended order is:
1. Resolve delivery input into a `SWOLECAT1` payload.
2. Decode.
3. Verify checksum/integrity.
4. Verify payload format/version.
5. Validate Routine/Program structure and exercise references.
6. Resolve or reconstruct custom exercises.
7. Convert unit-sensitive fields.
8. Build a preview.
9. Require explicit user confirmation.
10. Create fresh local IDs.
11. Save the independent local copy.

Short codes, links, account sends, and group templates should feed this same path rather than bypassing validation/preview logic.

## Versioning and compatibility

The prefix and package version exist so format evolution can be explicit.

Rules:
- old apps must reject newer unsupported payload versions cleanly
- new apps should continue to import older supported versions through a documented migration path
- breaking payload changes require a format-version bump
- adding a cloud backend alone does **not** require a new payload version
- delivery metadata should not be mixed into the blueprint payload unless it is required to reconstruct the training blueprint

## Future short-code design

When a backend is introduced, a human-friendly code should map to a stored canonical payload.

Recommended conceptual model:
- server generates opaque short code
- record stores canonical payload plus minimal metadata such as creation time, owner, permissions, expiry/revocation state if needed
- recipient enters code or opens URL
- app/backend resolves code to payload
- existing importer handles validation and preview
- recipient receives an independent copy unless they explicitly join a future shared-template/group mode

This keeps local direct sharing and cloud sharing compatible.

## Future accounts and cloud sync

Accounts/cloud sync solve a different problem from blueprint sharing.

Cloud sync may eventually synchronize a user's own:
- profile
- routines
- programs
- workout history
- active workout state
- settings
- analytics inputs

That sync model should not redefine the portable sharing package. Sharing remains an explicit blueprint transfer; sync remains continuity of one user's own data.

## Future shared programs/groups

A future shared Program/group may maintain a server-side shared blueprint while each member keeps independent performance records.

The v0.66.0 model is the foundation:
- shared structure is the blueprint
- user performance remains independent
- no member's weights, reps, PRs, progression, or history overwrite another member's data

If live/shared templates later need stable remote identifiers, those identifiers belong to the collaborative layer. They should not replace local IDs inside an imported independent copy.

## Security and trust boundaries

A share payload is untrusted input.

Future work must continue to:
- enforce maximum payload sizes
- validate every field
- reject unknown/incompatible versions
- reject malformed references
- avoid executing payload content
- sanitize displayed text
- require explicit user confirmation before saving
- preserve the privacy boundary above

A server-hosted payload is still untrusted input and must go through the same validation path.

## Implementation references

Current implementation:
- `src/js/05b-sharing.js`
- `scripts/sharing-stress.mjs`

Current product roadmap:
- Phase 7, Routine Sharing Without Accounts
- Phase 8, Accounts, Cloud Backup, and Multi-Device Sync
- Phase 9, Shared Programs and Workout Groups

Before modifying sharing architecture, update this document and the relevant roadmap phase in the same change.
