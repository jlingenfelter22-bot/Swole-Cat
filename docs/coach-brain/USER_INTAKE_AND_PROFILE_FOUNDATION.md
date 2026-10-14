# User Training Intake → Coach Swole Cat: Shared Profile Foundation

**Decision checkpoint:** 2026-10-14. **Status:** Design contract / owner direction; **NOT implemented in the app.** No change to onboarding, saved state, workout programming, live Supabase records, Testing v0.93.0 or Beta. Future implementation requires acceptance tests and owner review.

## Why this is a prerequisite for deeper Coach intelligence

The currently shipped first-launch `onboarding()` in `src/js/01-core-runtime.js` gives an introduction and collects only **optional name** and **lb/kg units**. `state.profile` initially contains `{name:'',unit:'lb'}`. There is **no structured exercise experience, main goal, muscle-priority, availability or limitation intake** that Coach can use. Coach can already recognize explicit beginner/intermediate/advanced phrases and training context in an individual request, but does not own a consented durable training profile.

The user intends a richer first-run intake soon. Build the **contract first** so v0.94 Coach quality improvements and subsequent first-run UX share the same meaning, instead of implementing incompatible sets of questions.

### Product objectives

1. Help a genuinely new lifter explain their goal, familiarity, available time/equipment, and movement preferences **once**, without a mandatory questionnaire that prevents starting a free workout.
2. Give Coach trusted *starting context* while retaining the user's current request as the top authority. Avoid quietly reusing old constraints that may no longer apply.
3. Separate lifelong/person-level preferences from current-session availability, temporary requests, clinician advice, and completed-training **observations**.
4. Keep training recommendations local-first, explain assumptions, never diagnose an injury or infer medical readiness.
5. Permit viewing/updating/skipping the intake later in Settings, independent of paid Pro or cloud sign-in.

## Intake questions: value, safety and source-of-truth

| Field / user-friendly question | Type and defaults | Planned effect | Follow-up rule |
| --- | --- | --- | --- |
| Main goal: `What do you want from training?` | `hypertrophy / strength / general` or `unspecified`; no choice preselected | Suggest Coach programming goal | If omitted or later changed, ask when it changes the plan |
| Second priorities: `Anything else important?` | Optional ordered selections; e.g. secondary strength + muscle growth, not another implicit main goal | Break ties and explain tradeoffs | Clarify contradictory/competing requests rather than flattening |
| Experience: `How familiar are you with resistance training?` | `new / some / experienced / prefer_not_to_say`, plus optional training-duration band; no numeric score | Scale complexity and *suggested* starting prescription, when implemented | Do not equate years with ability; ask when complex exercise selection matters |
| Focus: `Any muscle areas you'd like more attention on?` | Optional `COACH_TARGET_GROUPS` selections; empty = no known preference | Treat as *priorities*, not exclusivity | Shoulder focus must never automatically exclude chest/legs |
| Typical availability: `How many days and how long can you usually train?` | Optional training-frequency range, common duration 15–120 min, preferred weekdays if supplied | Prepopulate program draft questions | Never claim these constraints are true for every future workout |
| Equipment: `What do you usually have available?` | Optional known preset or accurately declared pieces | Suggest/offer equipment choices at workout creation | Home equipment does not prove the user has it today; ask or expose assumption |
| Movement restrictions: `Are there any exercises or movements you'd like Coach to avoid?` | Completely optional **movement-level** restrictions and exercise names | Use hard exclusions **only if verified/current/consented**, otherwise ask | Do not solicit diagnoses, infer safe treatment, or silently substitute medical advice |
| Other preferences: `What do you like or dislike in a workout?` | Optional preferences (e.g. exercise favorites/exclusions, not a duplicate of exercise library preferences) | Ranking tie-breakers, never forced prescriptions | Explicit current instructions win |

**Avoid collecting by default:** date of birth, exact body weight, body-fat targets, medical diagnoses, detailed injury histories, pain severity scores, medications or other sensitive health details merely to generate a first workout. There is no scientific or product justification for demanding them during basic onboarding.

**Restrictions are not a diagnosis.** A person can say "avoid overhead pressing" or "I'm unsure about this movement"; Coach can honor an explicit exclusion or ask for clarification. For reported injury, pain or limitations that may need clinical assessment, show a neutral safety boundary and recommend appropriate medical guidance for clinical decisions. Do **not** generate a "safe injury rehabilitation program," prescribe pain thresholds, or assume an unrelated body part is medically safe to overload.

## Planned normalized context, not a live data migration

These are conceptual types for a future versioned **training-preferences** service, **not** keys to write into the current `state.profile` yet:

```ts
type TrainingProfileV1 = {
  version: 1;
  createdAt: string;
  updatedAt: string;
  consent: { durableCoachContext: boolean; sensitiveLimitations: false };
  goals: {
    primary: 'hypertrophy' | 'strength' | 'general' | null;
    secondary: Array<'hypertrophy' | 'strength' | 'general'>;
    emphasisRegions: string[];           // validated against Coach region taxonomy
  };
  training: {
    experience: 'new' | 'some' | 'experienced' | null;
    experienceDurationBand: '<6mo' | '6-24mo' | '2-5yr' | '5yr+' | null;
    typicalDaysPerWeek: number | null;   // validated 2–6 for existing multi-day Coach
    typicalDurationMinutes: number | null;
    preferredWeekdays: number[];         // explicit only; 0–6
  };
  environment: {
    usualEquipment: string[];            // known items only, never invented
    unverifiedForCurrentSession: true;   // always requires confirmation/visibility
  };
  preferences: {
    likedExerciseIds: string[];
    excludedExerciseIds: string[];
    excludedMovementPatterns: string[];
  };
  provenance: {
    explicitFields: string[];
    lastConfirmedAt: string | null;
    source: 'onboarding' | 'settings';
  };
};
type WorkoutRequestContext = {
  explicitCurrentRequest: object;        // highest authority
  acceptedProfileDefaults: object;      // provenance visible, can be dismissed
  missingCriticalFacts: string[];       // ask only as needed
};
```

Sensitive limitation notes (if a later explicit feature is approved) should **not** be casually attached to this profile object. First decide retention/permission UX and physical data placement. In particular, `src/js/10f-cloud-sync.js` currently publishes **the entire `state.profile` as a singleton**. Adding injury information there would silently expand data uploaded to Supabase for signed-in users. This is **not approved** and must be tested against the protected account-switch behavior first.

## Coach context precedence — the critical contract

1. **Current user's explicit statement** (including constraints, excludes and "only this time") wins.
2. **Earlier choices in the current unsaved draft** are preserved except where the user precisely modifies them.
3. **Persisted onboarding/preferences**, when opted in and relevant, can supply *proposed defaults*, not unannounced hard facts. Display "Using your usual 45-minute workouts" and an obvious way to adjust. Reconfirm equipment/limitations when they could materially affect feasibility or safety.
4. **Observed historical behavior** is context only; a past gym session, frequent exercise or skipped lift does not become an equipment/goal/exclusion preference without consent.
5. **General coaching heuristics** apply only after the above; unknown remains unknown rather than an invented fact.

Examples:

- Profile = experienced / home dumbbells; prompt = "I am at a full gym today, 30-minute pull" → use **today's gym** and 30 minutes; retain profile unchanged.
- Profile = muscle growth; prompt = "Today I want a short strength workout" → honor temporary strength request, **do not overwrite stored goal**.
- Profile = 4 days/wk; prompt = "Build me a three-day plan" → three days, no suggestion to force four.
- Profile = shoulders priority; prompt = "Legs only today" → Legs only, not a hidden shoulder superset.
- Profile = "avoid overhead pressing"; prompt = "Add overhead presses" → ask whether the previous exclusion should apply to this request; do not silently delete restriction.
- Profile = unspecified limitations; prompt mentions new pain → no auto-diagnosis; clarify movements to avoid or suggest professional assessment.
- Profile skipped → existing v0.93 Coach free/offline flow and all training modes operate as before.

## Onboarding design and migration gates

- **First-run flow** should be progressive, ideally 2–3 short cards: (1) primary goal and optional secondary focus, (2) experience and schedule/time, (3) equipment and optional movement preferences, with concise explanations and **Skip for now**. Name/units can remain lightweight.
- No account creation, subscription, Pro paywall or forced injury disclosure before using the tracker. Optional profile completion may be offered later.
- **Returning users must not be sent back to onboarding** because the new data is missing. Current `state.ui.onboardingDone` already gates legacy onboarding, and the migration sets it true when historic routines/sessions exist. Use a separate status/consent marker for the new intake, not reuse/erase that flag.
- Provide an explicit Settings route to **view, update and clear coaching preferences**. Clearing preferences must not delete workouts, cloud accounts, exercise history or unrelated profile fields.
- Keep past and present account identities isolated; any future sync of non-sensitive preferences requires owner approval, profile field-level validation and RLS/owner-specific sync verification. Existing account-switch snapshot protections remain in force.
- Handle imported/older backups and PWA–Android asymmetry without treating missing profile data as malformed or erasing previously saved work.
- Ask how detailed movement restrictions should be stored/reviewed before building the UI; do not start by storing free-text medical information in the synced profile.

## Delivery stages and acceptance tests

**Stage A — now (design-only):** Document context schema, questions, precedences and privacy boundaries. No release, runtime change, state migration, Supabase update, or changed Coach prescription.

**Stage B — future owner-reviewed user intake:** Build small optional first-run screens and editable Settings profile; test skip, partial entry, invalid values, retained previous history, backup import and accessible narrow Android controls.

**Stage C — Coach v0.94 integration:** Normalize the accepted profile into a planning-context adapter (local-first). Only use verified/contextually relevant defaults; ask clarification where important, show assumptions, preserve explicit requests/modes and no cross-account leakage. Test empty/old/current/contradictory profiles and complex compound prompts.

**Stage D — field feedback:** Test real generated sessions and willingness of new lifters to complete or skip intake, compare measured time, inspect beginner workloads with expert human review and adjust. No unvalidated physiological scores.

Minimum non-regression matrix:

1. New install with all intake skipped → Coach workout works offline.
2. Returning v0.93 user with sessions → never forced to redo onboarding; all history intact.
3. "Gym today" overrides persisted "dumbbells usually"; profile itself unchanged.
4. Explicit "strength today" overrides profile muscle-growth goal without changing it.
5. Two goals marked → priority preserved; secondary goal is not ignored or treated as a prohibition.
6. Beginner novice with no equipment → ask only feasibility-critical questions, no invented expertise.
7. Profile movement avoidance vs a conflicting request → clarify instead of silently bypassing or silently applying it.
8. A program correction changes one day without mutating unrelated days, local profile or stored history.
9. Local delete/export/backup and foreign-account sign-in cannot leak or merge a prior owner's preferences.
10. Consent withdrawn → future requests do not receive profile context; session history and normal Coach remain intact.
11. Imported old state remains valid; schema migration is reversible via existing backup safeguards.
12. Synthetic CI passes **and** physical Android onboarding usability review is explicitly recorded.

## Science and product references

Review `docs/TRAINING_SCIENCE_FOUNDATION.md`, `docs/EXERCISE_LOAD_BEHAVIOR.md`, `docs/EXERCISE_INTELLIGENCE_FOUNDATION.md`, `docs/COACH_SWOLECAT_EVIDENCE.md`, and `docs/coach-brain/COACH_INTENT_CONTRACT.md` before implementing anything that changes prescription. This is a human-centered onboarding **product hypothesis**, not clinical screening or proof of a medically safe training plan. Avoid mandatory weekly volume, fixed deload prescriptions or readiness diagnosis from profile entries. Cloud Coach Memory stays separately **deferred** in `docs/ROADMAP.md`.
