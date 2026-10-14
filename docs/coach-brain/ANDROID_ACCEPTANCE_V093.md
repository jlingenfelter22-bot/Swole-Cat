# Coach v0.93: Android Preview & Conversational UX Acceptance

**Prepared:** October 14, 2026. **Status:** Development-only mobile UX/DOM validation. **Not a real Android signoff and not permission to publish an APK.** Stacked on v0.90 guided intake, v0.91 whole-week review, v0.92 per-day planning.

## Why this checkpoint

CI established that programming intents, equipment, duration and draft safety work, but a long Coach dialog or a crowded generated Program preview may still be uncomfortable on an Android screen. Mobile layout quality and real input behavior are independent acceptance gates.

### Scoped corrections

- Keep the descriptive **Help me choose a split** cards one per row at widths up to 430 CSS pixels, with readable explanations rather than compressed two-column buttons. Short setup choices remain compact.
- Give each Program day a responsive header with an identifiable **Adjust day** action. At narrow widths, program exercise names use available width and **Swap** / **Remove** controls sit in two clearly identifiable touch-friendly controls below the name, instead of crushing the name.
- Make the generated Program save/start actions full-width on narrow screens, maintaining the distinction between **Save Program** and **Save + Start Day 1**.
- Day editor: label controls; use numeric 16px text input and 48px minimum input height to reduce mobile keyboard scaling; show and focus **Other equipment** only after the user selects **Other equipment**. Disabled/hidden otherwise. Separate **Apply to Day X** and **Cancel** controls remain accessible.
- When equipment is specified for all days individually, the header says **Equipment varies by day** instead of falsely implying that equipment is missing from the plan.
- Preserve on-device manual selection, existing signed Testing/Beta packages, history, cloud ownership and optional Pro roadmap decisions.

## Automated acceptance (JSDOM: structural, not visual)

The new script `scripts/coach-mobile-program-acceptance.mjs`, wired into `.github/workflows/validate.yml`, checks:

1. Vague "3-day split" displays a **Help me choose** button; the user must choose and Coach doesn't create an unsolicited plan. Rich suggestion cards have a single-column mobile class.
2. An end-to-end three-day Monday gym / Wednesday dumbbells / Friday gym prompt produces three Program cards with visible day-specific lengths and equipment. Every generated exercise keeps its name and both visible **Swap** / **Remove** actions. The whole-week review and distinct Save/Start buttons remain present.
3. **Adjust Wednesday** exposes a labeled editor with the correct time and selected equipment. Custom-equipment field is initially hidden/disabled, revealed by the equipment dropdown, then hidden/disabled again when switching back.
4. Invalid custom-equipment edits do not mutate the draft. A valid 55-minute update changes **only** Wednesday and returns to the full preview. A follow-up "Wednesday 50 minutes" updates the same day without changing the chosen split or Track Only.
5. CSS has explicit 320–430px responsive contracts for one-column rich choices, full-width save actions, 44px minimum Swap/Remove touch areas, 48px day editor inputs and correctly handled dynamic modal viewport height.
6. No preview actions write to sessions, routines or programs. Tests use synthetic local-only data; no account sign-in or remote API calls.

**Limitation:** JSDOM does not perform browser text layout, measure physical touch targets, position a software keyboard or emulate Android WebView exactly. Automated passing must never be called physical Android acceptance.

## Real Android acceptance (owner/device pending)

On an **approved, permanently signed Testing candidate**, not Beta:

1. **Intake:** Open Coach. Ask `Help me build a 3-day split`. Tap **Help me choose**, select a goal. Verify full split descriptions are readable, not squeezed, and that Back/Next/Cancel do not invent a workout.
2. **Daily variations:** Enter `Build a 3-day Push/Pull/Legs program: Monday 30 minutes at a full gym, Wednesday 45 minutes with dumbbells only, Friday 75 minutes at a full gym. Muscle growth, Track Only.` Check three day cards, weekday badges, realistic time ranges, actual equipment-compatible exercises, and whole-week review.
3. **Phone ergonomics:** Review at your normal Android font/display size (and larger font if convenient). Check a long exercise name, Swap/Remove buttons, scroll, sheet dismissal, narrow dialogs, orientation/keyboard opening and voice input return. No clipped words or unreachable buttons.
4. **Day editor:** Tap **Adjust day** for Wednesday; the custom gear field should be absent. Choose **Other equipment** to reveal it; type unusable equipment and ensure a clear failure with the original day untouched. Choose dumbbells again; change Wednesday to 55 minutes and apply; confirm Monday and Friday unchanged.
5. **Refine:** Type or dictate `Wednesday 50 minutes`. Confirm only Wednesday changes. Ask for `Friday more shoulders` and confirm the PPL Legs conflict is explained rather than silently applied elsewhere. Choose cancel/keep split.
6. **Save gate:** Confirm **Save Program** differs visibly from **Save + Start Day 1**. On an isolated **test-only draft**, optionally save and inspect the saved routine/day values. Do not switch Google accounts, erase data, or experiment on Beta.
7. **Training duration:** If personally convenient, perform a real session, note measured warm-up/work/rest/transition time, and compare with Coach's reported estimate and range. Lack of a stopwatch comparison is not proof of accuracy.

### Signoff record

| Gate | Result |
|---|---|
| Prior v0.92 whole-program behavioral regression | Passed on draft PR #68 before this pass |
| v0.93 narrow-phone DOM + source responsive guard | Await newest CI result |
| Native Android signed install/update and display/keyboard interaction | Not performed |
| Human review of actual workout duration versus predicted time | Not performed |
| Owner approves publishing to signed Testing | Not requested / not approved |
| Beta release approval | Not approved |

## Decisions and references

Follow `docs/coach-brain/COACH_INTENT_CONTRACT.md`, `docs/coach-brain/PER_DAY_PLANNING_V092.md` and `docs/TRAINING_SCIENCE_FOUNDATION.md`. No change to programming algorithms, prescription defaults, training modes, historical sessions, cloud data or account architecture. The product's proposed Cloud Coach Memory remains deferred in `docs/ROADMAP.md`.
