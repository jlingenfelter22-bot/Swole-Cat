# Coach v0.93.5: Real-World Edge-Case Acceptance Audit

**Checkpoint:** October 20, 2026. **Branch:** `quality/coach-edge-case-acceptance-v0935` / draft PR #89. **Installed Testing:** 0.93.5, Android code 141. **Beta:** unchanged.

## Objective

Determine whether whole-week exercise allocation, time planning and the optional recommendation UI remain reliable outside the original 12 golden test scenarios. Exercise recommendations must improve the *whole week* where possible, never take ownership away from the trainee, and avoid equipment or muscle-focus mistakes. This work is an audit and regression gate; it does not change the live exercise catalog, generated plans, saved routines, cloud data, or the Testing/Beta channels.

## Automated matrix and evidence

The expanded acceptance script `scripts/coach-v0935-edge-case-acceptance.mjs` runs **31 distinct realistic requests** plus override/opt-out adversarial checks. [First completed, successful full CI run #39498863243](https://github.com/jlingenfelter22-bot/Swole-Cat/actions/runs/39498863243) passed the dedicated edge-case gate and the overall 108-step validation workflow. A second run on the enhanced evidence-only commit captures full per-day exercise names/patterns/sets/times for seven representative weeks.

**Initial outcome:** 29 requests produce full valid programs; two intentionally constrained configurations did not yield a viable full-body plan. No program was fabricated, and saved user state was byte-for-byte unchanged. **Zero** original generated days exceeded the audit's *loose* duration-review threshold (requested duration plus the greater of eight minutes or 20%). This does not prove measured gym-session timing or forbid a user-accepted optional accessory from exceeding the exact target by a few minutes. Candidate additions already have their own stricter approximate-time budget tests.

Validated:
- Two through six weekly sessions, general full-body, push/pull/legs, upper/lower and balanced distribution, including explicit strength-mode programming.
- Thirty-, forty-five-, fifty-, sixty- and seventy-five-minute requests; workouts may be shorter than the full allowance. **Coach must never invent filler solely to use the clock.**
- Full gym, dumbbell and bodyweight constraints; missing equipment, machine/cable exclusions, squat and vertical-pull exclusions; day-specific heterogeneous equipment and preferred weekdays.
- Explicit "exactly 5 exercises" and "3 working sets" protect against unsolicited additions.
- Explicit shoulder and glute focus; 4-day glute-priority redundant squat replacement with hip abduction. Specialty plans are not required to look like generic full-body plans.
- Strict bound of at most two recommendations; suggestions are optional, user-editable, require affirmative acceptance, and improve the independent weekly quality audit without introducing critical role/priority regressions.
- Deterministic original exercises and recommendations; no duplicates/unknown exercises, preserved equipment constraints, preview-to-routine exercise IDs, required exercises, manual day declinations, and user-wide opt-out.
- All saved sessions, routines and programs remain unchanged by generator trials or recommendation viewing.

## Specific human-review findings and limitations

1. **Two-day full-body, 30–45 minutes:** No safe swap passed the bounded whole-week improvement rules, and the review still records *optional* vertical pulling, direct hamstring knee-flexion, calves and core variety gaps. A two-day program can still train posterior chain and back via compound hinges and rows. We **must not imply complete direct-muscle coverage**, or add filler at the cost of foundational lifts. Those gaps are visible in the weekly review; they are not automatically a failure.
2. **Two-day full-body, 75 minutes:** Longer time permits more baseline work, including core, but some optional roles (vertical pull, knee flexion, calves) remain. Longer requested duration does not mean Coach should inject random extra movements.
3. **Three-day full-body, 45 minutes:** Existing validated example remains **Day B overhead press → lat pulldown** without increasing Day B's exercise count. An independent modest two-set seated leg curl suggestion on Day A fills knee-flexion. Direct calf and core variety remain optional gaps rather than blanket mandates.
4. **Three-day full-body, 30 minutes:** Coach finds two small optional additions for vertical pull and knee flexion, subject to its separate conservative time margin. Actual on-device setup/rest may run longer, so the duration presented is approximate, not a guarantee.
5. **Three-day full-body, 75 minutes:** Coach may replace an existing cable crunch with vertical pulling when other days already cover core. Keep a full-week lens: changing the *distribution* can be preferable to adding time. The seven-program export supports detailed human inspection.
6. **Four-day upper/lower, glute priority, dumbbells:** A repeated bodyweight squat slot can be replaced with a glute-abduction accessory without deleting foundational squat/hinge/glute work.
7. **Six-day PPL strength:** No optional volume inflation or safety-driven substitutions were forced.
8. **Two infeasible requests:** Three-day full-body with bodyweight-only constraints and a mixed-equipment full-body week containing a bodyweight-only day could not satisfy core equipment-feasible session roles under this generator. The correct behavior is to request workable equipment/split adjustments rather than fabricate unavailable vertical/horizontal-pull options. A *user-facing* message should be reviewed on an actual Android session; the generator's null result is not itself proof that the UI explanation is adequate.
9. **Human judgment still matters:** The numeric "weekly quality debt" is an internal heuristic, not a peer-reviewed hypertrophy outcome. The tests do not prove optimal weekly frequency, recoverability, injury suitability, real rest/setup logistics or preference satisfaction for every trainee.

## Release / next-decision gate

**Edge-case stress and static/mobile DOM validation: automated acceptance successful on the baseline run, with expanded exact-program evidence queued for final human inspection.** The project must not claim that all possible requests are feasible or that every muscle gets dedicated isolation work within short sessions.

This branch changes only the additional acceptance script and CI workflow (plus this audit report). There is **no production behavior change to ship**, so **do not issue an unnecessary new Testing APK**. A later production implementation improvement can be developed on a new branch if human acceptance identifies a justified rule change. No Beta promotion without explicit authorization.

Artifacts: GitHub Actions `coach-v0935-edge-case-acceptance` contains the 31-case matrix, unresolved role findings and selected human-review prescriptions.
