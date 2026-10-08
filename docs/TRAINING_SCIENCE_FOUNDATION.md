# Swole Cat Training Science Foundation

**Status:** Canonical RESEARCH REFERENCE, not an approved algorithm or an app feature.
**Verified:** 2026-10-08.
**Scope:** All workout, program, Guided Progressive Overload, Strength Focus, Coach programming, fatigue-management, deload, and progression-related design and development.
**Owner intent:** A flexible, personal, science-informed workout tracker that prioritizes useful guidance, user control, and high-quality training history without pretending to diagnose physiological states.

> MANDATORY DEVELOPMENT REFERENCE: Read this file *before* proposing, editing, reviewing, or testing changes to workout/progression logic. Also review docs/COACH_SWOLECAT_EVIDENCE.md, docs/ROADMAP.md, the current code and tests. Cite the relevant study identifiers below in design notes. Do not silently convert research observations into mandatory product behavior.
>
> RESEARCH-ONLY CHECKPOINT: Creating this document must not change live workouts, algorithm defaults, app versions, training modes, data schema, APKs, or the Beta branch.

## 1. Core scientific model

**Progressive overload** means maintaining an appropriately challenging, progressively adaptable training stimulus as a person becomes more capable, not automatically forcing extra weight every session. Meaningful progression may use load, repetitions, appropriately managed hard-set volume, technique or range-of-motion improvements, and changes in achievable effort. These are not equivalent variables and not every one must increase together. The exact optimal progression rule is not determined by one study [1, 2, 3, 11].

**Strength and hypertrophy are distinct outcomes.** Strength depends on muscular and neural/skill adaptations. Hypertrophy is increased muscle size driven by longer-term training adaptations, including responses to mechanical loading. Heavier loads generally better target maximal 1-repetition strength, whereas muscle growth can occur over a broad load range with adequate effort and training volume [1, 2, 13]. A person's progress can be nonlinear. One session does not identify a reliable long-term trend.

**Specificity is foundational.** Training goals, movement type, equipment constraints, experience, tolerated workload, available loading increments, and schedule should influence a recommendation. Do not assume a universal "optimal" number of sets/reps, training days, weight increment, deload date, or preferred movement [1, 2, 4].

**Recovery matters, but is not directly observable from workout numbers.** Training imposes both adaptation stimuli and fatigue. Worse performance can reflect many factors, including technique, sleep, illness, equipment differences, under-fueling, scheduling, or ordinary variability. It is not a diagnosis of overtraining, under-recovery, injury, CNS fatigue, or a medically required deload [6, 7, 8].

## 2. Evidence map and implications

| Area | What the evidence supports | Certainty / limitation | Swole Cat design implication |
|---|---|---|---|
| Resistance training | Progressive resistance exercise improves strength and muscle size [1, 2]. | High confidence in broad benefit; exact "best program" differs. | Encourage sustainable, repeatable training; do not demand a PR every workout. |
| Strength specificity | Heavier loads, adequate rest and repeated practice generally favor maximal strength [1, 2, 12]. | Solid overall; individual responses vary. | Strength Focus deserves goal-specific logic, not a renaming of Guided Overload. |
| Load vs rep progression | Increasing reps and increasing load both yielded useful adaptations in an 8-week comparative trial [3]. | One trial, 43 trained participants; does not establish one perfect algorithm. | Rep-first / double progression is a valid practical strategy; fixed load increases are not obligatory. |
| Training volume | Weekly sets matter, with diminishing returns, and strength/hypertrophy responses differ [1, 4]. | Set counting depends on direct vs indirect contribution and effort. | Contextualize weekly sets; do not keep adding volume automatically. |
| Effort / RIR | Nearer-to-failure sets may better support hypertrophy, while strength is less clearly tied to proximity to failure [1, 5]. | Meta-regression uses estimated RIR, with imperfect fit. | Optional RIR/RPE context is valuable; training to failure is not mandatory. |
| Autoregulation | Performance-informed methods can be effective for strength [9]. | Comparisons heterogeneous; not proof of universal superiority or perfect readiness prediction. | Support user-adjustable hold/advance recommendations rather than rigid mandatory load jumps. |
| Periodization | Can benefit maximal strength in some contexts; not reliably required for hypertrophy [1, 10]. | Trained vs untrained populations and intervention durations vary. | Do not conflate periodization or deloads with the existence of progressive overload. |
| Deloading | Expert coaches use temporary reductions in training stress, often via lower set volume [6]. | Expert consensus, not experimental proof of an optimal timing or volume reduction. | Model deload as an optional adjustable tool, not a biological countdown. |
| Full-week cessation | A 2024 trial found similar hypertrophy but worse lower-body strength gains than continuous training [7]. | 39 subjects, short intervention and full cessation, not all deload formats. | Never assume a full week off produces superior gains. |
| Reduced-volume deload | An 8-week, 19-participant 2026 study reported similar hypertrophy and strength-endurance with limited deload weeks [8]. | Small, untrained sample, within-subject; not generalizable to all trained lifters. | Temporary reduced training need not destroy progress, but avoid promising benefit. |

## 3. The practical progression vocabulary

- **Load progression:** Increasing resistance while keeping an intended challenge and movement quality.
- **Repetition progression:** Increasing reps at the same weight, within a meaningful target range.
- **Double progression:** Build repetitions in a rep range at a given load; after acceptable performance across the required sets, propose a small load increase and work up through the range again. The exact threshold, confirmation policy, and increase size are product decisions to validate, not scientific laws.
- **Volume progression:** Increase effective working sets when appropriate for a goal, tolerance and recovery. Avoid interpreting every new set as superior.
- **Technique / range of motion:** Better quality at the same load/reps can represent meaningful improvement even if a numerical target does not change.
- **RIR (reps in reserve):** Self-reported estimate of how many more technically acceptable repetitions were possible. 0 RIR approximates momentary failure. Estimates are noisy and should remain optional, especially for beginners.
- **RPE:** Perceived exertion rating. RPE and RIR can inform effort but must not be equated mechanically without context.
- **Consolidation / hold:** Keeping the existing target to demonstrate repeatability or restore execution quality is legitimate progress management, not "failure."
- **Deload:** Temporary decrease in overall training stress, typically by reducing hard-set volume and/or effort; sometimes load, frequency or exercise complexity are adjusted. A deload is **not synonymous with skipping all training** [6].
- **Taper:** A different concept generally used to optimize performance ahead of an event, not automatically interchangeable with a deload [6, 8].
- **Plateau:** Observed limited progress across comparable exposures, not evidence by itself of fatigue or a need to deload.

### Illustrative double progression only

For 3 working sets in an 8–12 rep range at 100 lb, successive technically sound exposures might be 8/8/8, 9/9/8, 10/10/9, then 12/12/12. A *possible* next recommendation is a small increase to a reachable weight and reps again toward the bottom of the range. This is a teaching example, **not an instruction to hardcode 5 lb, require perfect 12/12/12, or raise weight without considering effort and equipment**. The old ACSM progression-model guidance discussed load changes of roughly 2–10% after exceeding targets; it is historical context, not a universal rule [11].

If a 5 lb jump is 25% of an isolation exercise's current weight but 2.5% of a heavier compound lift, the difference matters. Round intelligently to equipment the user actually owns; if the next available jump is unreasonable, consider rep progression, hold, or alternatives. Do not invent a precise new load when personal baseline evidence is missing.

## 4. Personalization requirements for future design work

These are **questions to resolve during design**, not newly approved feature requirements:

1. **User goals:** Strength, hypertrophy, general fitness, sport, or track-only. Program-level override versus routine-level inheritance must stay explicit.
2. **Experience and history:** Beginner, returning, experienced; history completeness and how long the person has actually performed the movement.
3. **Exercise characteristics:** Compound versus isolation, unilateral versus bilateral, bodyweight versus external-load movements, machine/cable/free-weight variation and grip/ROM variants.
4. **Weight granularity:** User-supported lb/kg, plate and dumbbell jumps, micro-loading availability; avoid hardcoding 5 lb for all movements.
5. **Set role:** Working versus warm-up, drop, top set, backoff, failed/incomplete or otherwise excluded from progression; make definitions consistent.
6. **Quality and effort:** Optional RIR/RPE and technique feedback, missing effort data, acceptable form, changed rest or rep tempo.
7. **Session comparability:** Prior records must be compared only when exercise identity, equipment, relevant execution, units and actual workload can reasonably be compared.
8. **Weekly exposure:** Training frequency, exercise distribution, usable weekly volume and overlap of muscle-group work.
9. **Recovery context:** Optionally ask how hard training feels, soreness, illness or sleep, but never imply inferred medical data from reps/weight alone. Do not require collecting health information to use the product.
10. **Accessibility / simplicity:** No forced questionnaires or burdensome logging. Guidance should be transparent, optional and easy to override.
11. **Data ownership:** Local-first operation, per-user history, independent routine/program shares and immutable historical meaning.

### Data quality guards

- **Do not interpret every 0-lb entry as the same thing.** It may mean a legitimate bodyweight exercise, an external-weight value not entered yet, or intentionally synthetic test data.
- Missing, partial, canceled, skipped, warm-up and test exposures must not be silently treated as equivalent to a validated working-set performance.
- Never allow a null/empty weight to become a persuasive "0 lb personal best" through coercion.
- Preserve historical records even if an exposure is excluded from a progression recommendation.
- Explain the evidence used when recommending a hold, advance, or recovery adjustment; allow manual override.
- Treat unusual durations, incomplete data and zero-weight logs cautiously. Testing data in Swole Cat Testing may intentionally include synthetic sessions.
- Respect side-specific loads, unit conversions, exercise substitutions and varying equipment load increments.

## 5. Fatigue, stalls, and deload research: decision boundaries

**Confirmed from research:** Coaches use deloads to reduce training stress; there is no validated universal calendar for everyone, and there are few direct intervention trials. Expert practice often places them every approximately 4–8 weeks, but that is practice, *not* a biological deadline [6]. A full week off and a lower-volume training week are not equivalent [7, 8].

**Do not turn into an automatic rule:** "Two missed targets = deload," "Week five = deload," "A plateau is overtraining," "RIR fell so CNS is fatigued," "Everybody must reduce weights 50%," or "deloading guarantees more gains."

**Future decision-support options to investigate, not approve yet:**
- Optional planned deload weeks with manual confirmation.
- Recovery-review prompts after *persistent*, comparable performance declines, especially when the user also reports unusual difficulty or fatigue.
- Reduced set count, lower effort target, reduced load or adjusted training frequency, selectable rather than one imposed template.
- Preservation of progression baselines when exiting a deload, without misinterpreting deliberately easy sets as a strength decline.
- Wording such as "Review recovery / Consider a lighter week" rather than diagnostic statements.
- Explicit differentiation among planned deload, voluntary light session, time off for illness/travel, and a true performance regression.

**Decision-making uncertainty:** A fixed deload protocol has not been demonstrated to maximize outcomes for every population. Controlled studies are small/short or examine different types of deload. Do not claim physiological readiness can be measured accurately from app logs alone [6, 7, 8].

## 6. Research-driven change protocol: mandatory for future workout/progression work

Before touching code, the developer or AI assistant must:

1. Read **this entire document**, plus docs/COACH_SWOLECAT_EVIDENCE.md, docs/ROADMAP.md and the current relevant implementation/tests.
2. Define the affected behavior and its original purpose; distinguish **current implemented behavior** from **proposed research-informed behavior**.
3. Name the user's goal, personalization dimensions, and whether the change affects Guided Progressive Overload, Strength Focus, Track Only, Coach suggestions or shared programs.
4. Link at least one applicable study/review below and identify whether its support is **strong synthesis**, **limited direct experiment**, **expert consensus**, or **product hypothesis**.
5. State explicitly which implementation details are **engineering/product choices** rather than laboratory-proven numbers (thresholds, weight jumps, lookback counts, "deload every X weeks").
6. Give a plain-language recommendation explanation and a reversible user override path; preserve existing user workouts and histories.
7. Specify tests: all sets and partial sets, missing/0/bodyweight load, unilateral work, lb/kg conversion, nonstandard plates, warm-up/top/backoff, skipped or canceled session, repeated plateau, one bad day, scheduled deload, no RIR history, Track Only independence, per-routine versus per-program mode, and cloud/local data durability.
8. Get explicit product approval before changing behavior, especially existing progression rules or introducing automatic holds/deloads. Run in Testing first. Never advance Beta without separate approval.
9. Add a dated revision note to this document when new meaningful evidence changes assumptions, and update any tests/research mapping before shipping.

Research MUST guide decisions, but **the citation of a study is not itself authorization to implement a feature**.

## 7. Integration boundaries

- Existing Coach-specific evidence and adaptive reasoning: **docs/COACH_SWOLECAT_EVIDENCE.md**.
- Training modes, long-term roadmap and product contract: **docs/ROADMAP.md**.
- Development checkpoints and safe branch strategy: **docs/CURRENT_STATE.md**.
- Architecture and workout data boundaries: **docs/ARCHITECTURE.md**.
- This document supplies the cross-cutting scientific basis across Coach, hand-built routines, program templates, and the general workout engine.
- This file is a **repository reference for developers and future AI sessions reading the repository**, not a runtime AI knowledge source. Creating it does not automatically make the installed app consume this material.

## 8. Verified reference library

Primary links below lead to the papers or their PubMed listings, not secondary influencer summaries.

1. **Currier et al. (2026), ACSM position stand:** "Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews." Overview of 137 systematic reviews, 30,000+ participants. DOI 10.1249/MSS.0000000000003897. https://pubmed.ncbi.nlm.nih.gov/41843416/
2. **Currier et al. (2023), BJSM network meta-analysis:** "Resistance training prescription for muscle strength and hypertrophy in healthy adults." 178 studies in strength network, 119 in hypertrophy network. DOI 10.1136/bjsports-2023-106807. https://pubmed.ncbi.nlm.nih.gov/37414459/
3. **Plotkin et al. (2022), PeerJ randomized trial:** "Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations." 43 resistance-trained adults, eight weeks. DOI 10.7717/peerj.14142. https://pubmed.ncbi.nlm.nih.gov/36199287/
4. **Pelland et al. (2026), Sports Medicine meta-regressions:** "The Resistance Training Dose Response: ... Weekly Volume and Frequency ..." 67 studies, 2,058 participants. DOI 10.1007/s40279-025-02344-w. https://pubmed.ncbi.nlm.nih.gov/41343037/
5. **Robinson et al. (2024), Sports Medicine meta-regressions:** "Exploring the Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy." Estimates RIR from source studies, exploratory. DOI 10.1007/s40279-024-02069-2. https://pubmed.ncbi.nlm.nih.gov/38970765/
6. **Bell et al. (2023), Sports Medicine - Open expert Delphi:** "Integrating Deloading into Strength and Physique Sports Training Programmes." Three Delphi rounds, consensus not causal proof. DOI 10.1186/s40798-023-00633-0. https://pmc.ncbi.nlm.nih.gov/articles/PMC10511399/
7. **Coleman et al. (2024), PeerJ randomized trial:** "Gaining more from doing less? The effects of a one-week deload period during supervised resistance training on muscular adaptations." 39 participants, full-week cessation versus continued training. DOI 10.7717/peerj.16777. https://pubmed.ncbi.nlm.nih.gov/38274324/
8. **Pancar et al. (2026), Scientific Reports experiment:** "Effects of deload periods in resistance training on muscle hypertrophy and strength endurance in untrained young men using a randomized within subject design." 19 untrained men; 8-week protocol; reduced-volume/frequency weeks. https://www.nature.com/articles/s41598-026-40612-5
9. **Huang et al. (2025), Journal of Exercise Science & Fitness network meta-analysis:** "Autoregulated resistance training for maximal strength enhancement." Methodological and intervention heterogeneity. DOI 10.1016/j.jesf.2025.07.006. https://pubmed.ncbi.nlm.nih.gov/40791980/
10. **Grgic et al. (2022), Sports Medicine systematic review/meta-analysis:** "Effects of Periodization on Strength and Muscle Hypertrophy in Volume-Equated Resistance Training Programs." 35 studies. https://pubmed.ncbi.nlm.nih.gov/35044672/
11. **ACSM (2009), historical progression-model recommendations:** Load increases of ~2–10% in specified conditions; do not apply mechanically. https://pubmed.ncbi.nlm.nih.gov/19204579/
12. **Schoenfeld et al. (2016), J Strength Cond Res RCT:** "Longer Interset Rest Periods Enhance Muscle Strength and Hypertrophy in Resistance-Trained Men." Small, eight-week comparison of 1- versus 3-minute rest. https://pubmed.ncbi.nlm.nih.gov/26605807/
13. **Review of resistance-exercise-induced skeletal muscle hypertrophy mechanisms (2022):** External and internal adaptations, not merely soreness or damage. https://pubmed.ncbi.nlm.nih.gov/35389932/

## 9. Change log

- **2026-10-08:** Research library verified and archived; core principles, scientific uncertainty, personalization requirements, data-quality rules, deload boundaries and pre-implementation review gate established. **Documentation only; no runtime/behavior/algorithm changes approved or made.**
