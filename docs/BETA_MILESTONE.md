# Swole Cat Field Beta Milestone

## Milestone identity

The first Swole Cat outside beta is frozen at:

- Version: **v0.66.1**
- Android versionCode: **82**
- Baseline commit: `99c258f4fc8c0254a533867901f50a8a216f2b28`
- Field branch: `beta`
- Frozen snapshot branch: `beta-v0.66.1`
- Development branch: `main`

This baseline includes the v0.66 local Routine/Program sharing system and the v0.66.1 optimization/dead-code hardening pass.

## Branch contract

### `beta`

`beta` represents the build currently trusted for real-world beta use.

Normal feature development does **not** land here.

Advance `beta` only when:
- a current field-beta issue needs a deliberate hotfix, or
- a later lab build has been explicitly promoted to a new beta milestone after validation.

Every beta advancement should have:
- a clear version bump
- a documented reason
- the full validation wall passing
- GitHub Pages passing when relevant
- Android build passing
- a matching tester-facing release artifact

### `beta-v0.66.1`

This branch is the immutable snapshot of the original outside-beta milestone.

Do not:
- develop on it
- merge into it
- force-move it
- reuse it for a later beta

Its purpose is recovery, comparison, and reproducibility.

### `main`

`main` is the lab.

Use it for:
- new features
- experiments
- architecture work
- UI changes
- Coach development
- cloud/account prototypes
- risky or incomplete work

Work on `main` may be ahead of the field beta for extended periods. That is expected.

## Field-beta operating model

The current v0.66.1 beta should remain in use long enough to generate real-world evidence instead of being replaced continuously.

While testers use the beta, development can continue independently on `main`.

Beta feedback should be treated as field evidence. Useful categories include:
- crashes or launch failures
- save/resume reliability
- workout state loss
- progression recommendations
- set logging friction
- Focus Mode navigation
- timer behavior
- Routine/Program sharing
- import behavior
- custom-exercise behavior
- lb/kg handling
- History and PR accuracy
- performance or sluggishness on real devices
- battery/keyboard/Android lifecycle issues
- confusing UI moments
- unexpected data changes

## Hotfix rule

A beta hotfix should be surgical.

Preferred flow:
1. Reproduce the beta issue against `beta`.
2. Fix the smallest possible surface.
3. Add a regression test for the bug when practical.
4. Run the complete validation wall.
5. Build Android successfully.
6. Advance `beta` only after the fix is green.
7. Preserve `beta-v0.66.1`.
8. Ensure the fix is also present on `main` so the development line does not regress.

Do not use the field beta as a place to trial broad refactors.

## Promotion to a future beta

When lab work is mature enough for the next field milestone:
1. choose the exact green commit on `main`
2. assign the next beta version
3. run the full regression/build gates
4. create a frozen snapshot branch for that milestone
5. advance `beta` to that exact commit
6. publish/update the tester-facing release
7. document the milestone here and in `docs/ROADMAP.md`

## Product-data principle

The field beta remains local-first. New lab work must not silently change the current beta's storage, sharing, progression, or privacy assumptions.

If a future feature requires migration or schema changes, beta promotion should include explicit migration testing against realistic v0.66.1 data.

## Current status

**v0.66.1 is the locked first outside-beta baseline.**

The app can now remain in real-world use while Swole Cat development continues separately in the lab on `main`.
