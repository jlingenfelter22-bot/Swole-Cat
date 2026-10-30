# Future Product Branch — Swole Cat for Trainers
**Status:** IDEA CAPTURED / PARKED FOR LATER DISCOVERY (2026-10-15)
**Origin:** Discussion with the owner's father, a working personal trainer who manages multiple clients.
**Not approved for implementation or architecture changes yet.** Current immediate priority remains Android Testing v0.93.3 acceptance, performance, reliability, existing Coach/workout functionality and preservation of the personal-use app.

## Product vision
Expand the Swole Cat ecosystem beyond the **individual's personal workout tracker** into an optional **personal-trainer and client platform**. A trainer manages a roster of distinct people, each with their own routines, programs, scheduled workouts, logs, measurements/progress and preferences. Each client uses a linked Swole Cat experience on their own device. With permission and a live cloud connection, the trainer assigns, edits and publishes training changes; the client receives updated future workouts and logs their results. The trainer can switch between clients during face-to-face sessions or manage them remotely, without mixing anyone's records.

The owner's intended concept includes **two differentiated experiences**:
1. **Swole Cat (Personal)** — existing independent workout logger, training programs, progression, history and Coach intelligence, preserved as the free-core individual product.
2. **Swole Cat for Trainers** (working name, could become distinct app or account role) — trainer-centered dashboard for client roster and individual workspaces; linked client-side view in the existing Swole Cat app or a companion client app. **Separate APKs vs roles/shared infrastructure is an OPEN DECISION** after technical and customer discovery, not a requirement to fork today.

## Core workflows / behavior envisioned
- **Trainer account and client roster:** add/invite a client, manage their individual profile and goals, select one client at a time, search/filter roster, optionally use the trainer device during in-person sessions.
- **Client linking with opt-in:** trainer shares invitation/code or private link; client explicitly accepts and can see which trainer has access. Relationship is scoped to permitted data and can be revoked.
- **Distinct client workspaces:** each client's training history, workout programs, saved routines, logged sets, PRs, check-ins and workout preferences stay logically and securely separated from every other client and from the trainer's personal workouts.
- **Trainer programming:** create reusable templates; clone/adapt per client; assign multi-day/week plans; use Swole Cat's existing exercise library, duration estimation, progression rules and Coach intelligence as foundations, subject to professional review.
- **Publish updates:** trainer revises a client's future workouts, reviews changes, then deliberately publishes; client app receives the assigned plan and new versions when online, with sensible offline support and pending-change notices.
- **Client completion and feedback:** clients record sets, effort, progress and notes; trainer reviews completed workouts and progress, spots missed sessions, reviews adherence and adjusts future programs. In-person logging could be delegated to the trainer for the selected client where explicitly permitted.
- **Bi-directional consistency:** show who changed what, which program version the client is on, last sync state, conflicting edits, and whether a new assignment is pending or accepted. Never overwrite a session already completed just because a trainer edited a template.
- **Relationship end:** on disconnect, preserve client ownership of their historical logs and offer clear choices for continued use; stop trainer access and future syncing under appropriate authorization. Avoid accidental deletion on removal.

## Early candidate MVP (only after main app stabilizes)
1. Trainer identity plus a securely isolated small client roster.
2. Explicit invite/accept/unlink flow; client accounts need no secondary manually copied spreadsheet.
3. Assign and version a workout/routine/program from trainer to selected client.
4. Client can follow program and log workouts from their own device (offline logging + reliable later sync).
5. Trainer sees authorized client-specific logs and can publish the next plan revision.
6. Safe disconnection, client data export/retention and auditable change history.

**Later optional features, NOT MVP promises:** messaging, session appointments, measurements/check-ins, trainer exercise notes/video demos, group programs, business metrics/payments, Coach-generated draft programs needing trainer approval, multi-trainer studios, pricing plans.

## Critical architectural / data-safety requirements
- **Never share one mutable 'active local workout state' among different clients.** Every read/write should be scoped to an authenticated trainer/client relationship and a specific client workspace. In-person client switching cannot leak progress, equipment settings, PRs, local cached workouts, or cloud queues.
- Use **server-enforced authorization and row-level policies**, not simply a hidden profile selector in the UI. Trainer access must be limited to actively authorized client resources; a client cannot view another client.
- Keep clear **roles** (trainer vs client), **data ownership**, **consent**, **revocation**, and **visibility scopes**. Trainer-assigned template, client-customized active workout and immutable completed log should be separate concepts.
- Define source-of-truth rules: versioned published plan vs local offline progress, safe merge/replay rules, no cross-client conflict merges, in-progress workout preservation, account unlink and trainer handoff. Reuse lessons from existing Swole Cat cloud account-switch safeguards.
- Prepare proper authentication, invitation expiry, access auditing, backup/export and incident recovery. Protect private fitness/health information; review applicable US/state privacy obligations with qualified counsel if this becomes a commercial product. Do not assume all exercise data triggers HIPAA, and do not assume HIPAA can never apply.
- No unconsented remote 'push overwrite' of individual logs or active workouts; client can review what a trainer assigned or changed.
- **Pricing and business model unresolved.** Existing personal app's free-core/no-subscriptions vision is not permission to assume free professional cloud hosting or impose subscriptions on personal users. Decide trainer economics only after demand/cost research.
- **Platform architecture open:** existing shared JS/Capacitor services may be reused; a native trainer dashboard or dedicated app can be evaluated later. Avoid premature native rewrite based only on this idea.

## Market reality / research pointers (October 2026)
This category **already exists** (not only spreadsheets). Examples to study for workflows, UX and business model—not claims of novelty:
- [ABC Trainerize](https://www.trainerize.com/features/) — trainer-managed clients, assigned programs, workout logs, messaging, progress and other coaching features.
- [TrueCoach](https://truecoach.co/personal-training-software/) — trainer program builder, assignable workouts, coaching dashboard, client tracking and workout logging.
- [Everfit](https://help.everfit.io/en/collections/1649397-manage-clients) — client lists, assigned programs, history and trainer-client settings.

**Differentiation hypothesis worth testing:** a lightweight, fast, respectful-of-data-ownership, excellent-workout-logging platform with strong Coach-assisted program drafting, intuitive offline sync and a professional-friendly client manager, without the complexity of enterprise business software. This is an idea to validate with trainers, not a proven competitive advantage.

## When to revisit
Only after current personal app functionality, account-safety, backups/sync, Android smoothness and Coach quality reach a stable accepted baseline, and owner explicitly chooses to prioritize a trainer product. Suggested discovery: interview the owner's father and ~3–5 working trainers to walk through a real week of planning, in-person sessions, client data, assignments and changes, determine the minimum must-have workflows, assess willingness to pay, and prototype permission boundaries before building.

**Current implementation effect:** NONE. Do not touch current Android Testing/Beta releases, UI styling, Supabase schemas/accounts or real workout records because of this parked concept. Refer back to this file when the owner wants to explore the trainer branch.
