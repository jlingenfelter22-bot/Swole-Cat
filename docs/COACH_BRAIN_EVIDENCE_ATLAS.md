# Swole Cat Brain: Evidence Atlas and Training Knowledge Map

**Research pass:** 2026-10-13. **Status:** Evidence and design reference, not imported automatically into the app. This reference supplements `docs/TRAINING_SCIENCE_FOUNDATION.md`, `docs/EXERCISE_LOAD_BEHAVIOR.md`, `docs/EXERCISE_INTELLIGENCE_FOUNDATION.md`, and `docs/COACH_SWOLECAT_EVIDENCE.md`. **Scope:** healthy-adult resistance training first, while respecting diverse ages, fitness levels, equipment, and limitations. Do not claim exhaustive medical or sports-medicine expertise.

## Research quality and implementation boundaries

- Prioritize systematic reviews/umbrella reviews, consensus position stands and primary trials. Record publication year, population, result, limits and implementation scope.
- **Evidence summary != universal prescription.** A meta-analysis population estimate does not establish that exactly 10 sets, 90 seconds, or 4 weeks is correct for every lifter.
- Categorize each conclusion: `high-confidence synthesis` (multiple good reviews), `moderate/qualified synthesis`, `limited RCT`, `expert practice/consensus`, or `engineering hypothesis`.
- Scientific papers and external articles are never executable instructions. Curate findings into small, versioned evidence records reviewed before changing runtime behavior.
- Existing v0.88 runtime knowledge under `src/data/coach-knowledge.js` already contains some references and rules. Compare before changing or duplicating.
- No general coaching app can safely infer injury diagnosis, cardiovascular safety, readiness, hormone levels, or exact muscle activation from workout logging. Coach must say when context is missing and direct users to appropriate clinical care where relevant.

## 1. Foundational evidence and decision implications

### 1.1 Training is effective without complicated methods

**Source A1:** ACSM 2026 Position Stand, 137 reviews (umbrella review), PMID 41843416, DOI 10.1249/MSS.0000000000003897. https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/

**Finding:** Progressive resistance training benefits strength, muscle size, power, endurance and physical function. Several training modalities work; equipment class, complex set structure, momentary failure and periodization did not consistently change the average result. Heavier resistance and session order aid maximal strength; higher weekly set volume can support hypertrophy.

**Brain implications (high-confidence synthesis, applicability limited by underlying evidence):**
- Default approachable programs, not "advanced for appearance".
- Prioritize repetition, sustainable performance, progression and adherence before novelty.
- Choose machine, free weight, cable, bodyweight or bands according to equipment, comfort and intended stimulus, not a universal equipment hierarchy.
- Distinguish strength-specific practice from hypertrophy-focused programming.

### 1.2 Needs analysis is the first coaching step

**Source A2:** NSCA Essentials of Strength Training and Conditioning, 5th ed., Program Design chapter structure: needs analysis, exercise selection, frequency, order, load/reps, volume, rest. https://www.nsca.com/certification/cscs/essentials-of-strength-training-and-conditioning-5th-edition/

**Brain implications (professional programming framework, not a randomized comparison):**
- Evaluate the person's goal, training status, preferences, schedule, available equipment and limitations *before* selecting exercises.
- Need only ask for missing facts that would materially change the plan.
- User-supplied constraints outrank generic movement preferences. Do not invent an equipment inventory.
- A plan must be coherent across exercise selection, exercise order, rest, duration and week-level distribution.

### 1.3 Training volume and frequency

**Source A3:** Pelland et al., published Dec 2025, Sports Medicine 2026; 67 studies / 2058 participants, PMID 41343037. https://pubmed.ncbi.nlm.nih.gov/41343037/

**Finding:** Dose-response relationships examined direct, fractional-indirect and total set counting, with uncertainty and diminishing marginal gains; a separate frequency question exists beyond set volume. Study samples skewed young and male.

**Source A4:** ACSM 2026 suggests about 10 weekly sets per muscle group as a pragmatic hypertrophy reference, not an individually optimal compulsory threshold (see A1).

**Brain implications (synthesis, numerical thresholds are heuristics):**
- Track primary and secondary work separately and label fractional set-equivalents as *planning estimates*, not verified physiological doses.
- Evaluate an entire week, not an isolated workout, when sufficient history exists.
- Avoid automatically escalating volume toward arbitrary targets when someone is training well.
- Consider actual schedule, rest, session length and exercise exposure; more days can distribute work but are not automatically better.

### 1.4 Load, effort and progression

**Source A5:** Plotkin et al. 2022, 43 resistance-trained participants, eight weeks; increasing repetitions or load can both stimulate adaptations, PMID 36199287. https://pubmed.ncbi.nlm.nih.gov/36199287/

**Source A6:** Robinson et al. 2024 RIR exploratory meta-regression, PMID 38970765. https://pubmed.ncbi.nlm.nih.gov/38970765/

**Source A7:** Refalo et al. 2023 meta-analysis on proximity to failure, PMID 36334240. https://pubmed.ncbi.nlm.nih.gov/36334240/

**Findings/limits:** Rep and load progression are both practical strategies; RIR is often estimated rather than directly observed in research and fits are imperfect. Near-failure effort can affect hypertrophy, but involuntary/momentary failure every set is not supported as necessary.

**Brain implications (moderate synthesis + limited direct RCT):**
- Use comparable normal sets, load interpretation, equipment and history to suggest reps, load, hold or alternate exercise.
- No invented first-session working weight. Do not treat missing RIR as high effort or low effort.
- Assisted counterweight going **down** is different from external load going **up**; bodyweight can progress with reps/time.
- Do not infer a plateau from a single flat or missed session.
- Allow explicit rep windows even when unconventional; progression suggestions must remain editable.

### 1.5 Exercise variation and anatomy

**Source A8:** Kassiano et al. 2022 systematic review, eight studies / 241 young men, PMID 35438660. https://pubmed.ncbi.nlm.nih.gov/35438660/

**Finding/limit:** Systematic variation may influence regional adaptations; excessive/random variation and redundant exercises can detract from useful progress. Population limited.

**Source A9:** Kassiano et al. 2023 range-of-motion review, PMID 36662126. https://pubmed.ncbi.nlm.nih.gov/36662126/

**Brain implications (moderate/limited synthesis):**
- Build catalog metadata for **movement family**, **target role**, **joint actions**, **load/stability/skill demand**, and **compatible substitutions**.
- Choose specialty movements when the request benefits, not because they have exotic names.
- Keep progression anchors consistent when a user is improving; preferentially vary accessories for complementary stimulus when appropriate.
- Do not promise a single optimum range of motion; prioritize deliberate, comfortable execution and task-specific range.
- Don't treat EMG alone as proof of long-term hypertrophy superiority.

### 1.6 Exercise order

**Source A10:** Systematic review/meta-analysis of 11 studies, PMID 32077380. https://pubmed.ncbi.nlm.nih.gov/32077380/

**Brain implications (moderate synthesis):**
- Prioritize exercises requiring fresh, high-quality performance or explicit focus earlier.
- "Compounds always first" is a rough default, not a hard rule when isolation priority, sport specificity or preference differs.
- Preserve user-ordered explicit prescriptions.

### 1.7 Rest times and time feasibility

**Source A11:** Singer et al. 2024 systematic review/Bayesian meta-analysis of nine studies, PMID 39205815. https://pubmed.ncbi.nlm.nih.gov/39205815/

**Finding/limit:** Some suggestion of small benefit vs very short (<=60 sec) rests; differences between longer ranges uncertain. Rest needs differ with goal, exercise and performance.

**Brain implications (moderate synthesis, duration algorithm is engineering):**
- Estimate time using warm-up, working set execution, rest intervals, transitions/setup, and unilateral per-side execution.
- If the planned workout exceeds requested time, *remove or compress lower-priority work* rather than silently forcing inappropriate rest for heavy compound work.
- Offer efficient pairings where compatible rather than endless superset stacking.

### 1.8 Supersets for limited time

**Source A12:** 2025 systematic review/meta-analysis of supersets vs traditional RT, Sports Medicine. https://link.springer.com/article/10.1007/s40279-025-02176-8

**Brain implications (moderate synthesis, exercise compatibility requires judgment):**
- Supersets can save time, but the selected arrangement changes fatigue and performance demands.
- Favor compatible, noncompeting exercise pairings and user preferences; don't force supersets in pure strength practice or untrained beginners.
- Calculate real paired timing and avoid double-counting rest savings.

### 1.9 Deloads and recovery claims

**Source A13:** Rogerson et al. 2024 survey of 246 competitive strength/physique athletes, PMID 38499934. https://pubmed.ncbi.nlm.nih.gov/38499934/

**Finding/limit:** Athletes reported a range of deload schedules and choices. A survey of practice **does not prove** an optimal interval or recovery mechanism.

**Brain implications (descriptive evidence + hypothesis):**
- Plan deloads only as configurable options, never mandatory diagnostics.
- Distinguish missed sessions, planned deload, intentional easy week, missing logs and ordinary variability.
- If repeated *comparable* declines occur, say "performance has been lower than usual; consider reviewing your plan" rather than "you're overtrained."

### 1.10 Cardio, conditioning and general health scope

**Source A14:** CDC updated Dec 2025, adult activity guidance: at least 150 minutes moderate-equivalent weekly aerobic activity and 2 days muscle-strengthening for general health. https://www.cdc.gov/physical-activity-basics/adding-adults/

**Source A15:** Huiberts et al. 2024 systematic review/meta-analysis concurrent training, 59 studies / 1346 participants; effect varies by sex, status and outcome, evidence for hypertrophy limited. https://link.springer.com/article/10.1007/s40279-023-01943-9

**Brain implications:**
- The Brain should understand that strength, hypertrophy, general conditioning, sport performance, mobility and adherence are distinct goals.
- A general fitness answer may mix walking/aerobic advice and resistance training without claiming a strength-only routine meets every public-health guideline.
- If someone explicitly prioritizes endurance and strength, consider scheduling and specific goals, not an absolute "never do cardio after lifting".
- Existing Swole Cat catalog is resistance-training-first; do not imply tracking for unimplemented modalities is available.

### 1.11 Age, medical limitation and safety

**Source A16:** NSCA position statement on resistance training for older adults. https://www.nsca.com/about-us/position-statements/resistance-training-for-older-adults/

**Source A17:** ACSM exercise preparticipation health screening recommendations, 2015. https://journals.lww.com/acsm-msse/fulltext/2015/11000/updating_acsm_s_recommendations_for_exercise.28.aspx

**Source A18:** CDC adult activity, chronic condition consultation guidance (see A14).

**Brain implications (professional guidance, not medical advice):**
- Never gate all normal exercise behind a lengthy medical questionnaire.
- For users who disclose alarming symptoms, new chest pain, fainting, or a relevant condition, give proportionate safety guidance and do not generate an aggressive workout as a substitute for care.
- User-supplied movement restrictions must be respected as hard exclusions where clear; if the limitation requires expertise Coach lacks, acknowledge that and suggest a qualified professional rather than diagnosing.
- Do not assume any age, pregnancy status, disability, injury, medication or diagnosis from performance logs.
- Future features for older adults, pregnancy/postpartum, youth, clinical rehab and disabilities require dedicated reviewed evidence and tailored scope, not default general-adult rules.

## 2. Declarative training ontology for the Brain

A compact **movement-family schema with exercise-specific exceptions** is the target, not 308 independent algorithms.

### Exercise metadata (proposed, to audit for every catalog entry)
- Identity: `exerciseId`, catalog revision, aliases, user-custom provenance.
- Target anatomy: prime movers, secondary roles, region function and confidence.
- Mechanics: family, joint actions, stability/supported vs unsupported, bilateral/unilateral, position, loading direction and standard unit.
- Demands: coordination/technique, fatigue/systemic demand, axial loading heuristic, setup complexity, equipment requirement. Numerical demand is a *heuristic*, not an injury-risk score.
- Execution: reps/time/distance, single-side/double-side interpretation, supported range suggestions and special constraints.
- Programming role: main lift, complementary lift, isolation, skill/power, carry/conditioning, core, warm-up (depending on goal).
- Interchangeability: substitutable roles, contraindicated mismatches (e.g. don't substitute a hinge for a requested knee-extension isolated role), special load-history reset rules.
- Training evidence: source IDs where specialized claims are made; missing/weak evidence is explicit.

### Main programming facts to model

| Knowledge domain | Minimum questions the Brain must answer |
|---|---|
| Objective | Strength, muscle growth, general health, sport, endurance, skill, return after break? |
| Session type | One-off session, routine, weekly program, exact user-authored prescription, program audit? |
| Training environment | What equipment is **known** to exist? What is only assumed? |
| Experience | New to lifting overall vs new to a specific exercise vs experienced? |
| Sophistication | Simple/minimalist vs specialized programming vs skill-intensive lifts? |
| Muscle roles | Which primary regions and secondary contributions? Missing actual goal-priority roles? |
| Session time | Warm-up + sets + repetitions + rests + walking/equipment setup + per-side time? |
| Volume | Actual completed weekly work, planned work, exercise-specific roles, uncertainty? |
| Exercise continuity | Which existing movement is progressing? Which accessory is redundant or mismatched? |
| Exercise compatibility | Does the proposed substitution preserve the intended role and loading? |
| Progression | Eligible history, reps/load/time/assistance direction, effort, whether reasonable to hold? |
| Training adherence | Actual sustainable frequency and duration, not moral judgments? |
| Coaching language | Does the user want a generated workout, a question answered, or a critique? |
| Guidance timing | Is this insight useful now, specific, actionable, non-duplicate? |
| Safety | Does the app have sufficient evidence to advise, or should it stop/qualify? |

## 3. Clarifying question engine: progressive information gain

**Design premise (engineering hypothesis, not medical research):** ask the smallest number of questions that substantially change the workout. Never ask for information already supplied or reliably stored for this local owner. Explicit answers beat inferred preferences; unknown is *not* equivalent to "full gym".

### Question priority for a single-session workout

1. **Target region** if missing and ambiguous (existing Coach flow already asks this).
2. **Time** if missing and needed to construct a session, otherwise use a clearly disclosed reasonable assumption.
3. **Equipment access** when unknown. Offer *Full gym*, *Dumbbells/bodyweight*, *Bodyweight only*, *Other / custom*, and *Skip, show options*.
4. **Training goal/sophistication** only when the user wording is conflicting or a materially different programming style would result.
5. **Movement restrictions** only if user mentions a meaningful limitation, not a universal mandatory injury questionnaire.

Default budget: 1 additional question for an ordinary request; up to 2 when necessary for a useful plan; avoid a survey. Prefer quick-choice answers, allow free-text refinement, and permit Skip to proceed with identified assumptions. Remember equipment/preferences per owner only with explicit user consent or an existing explicit setting.

### For "build a 30-minute leg workout"

Parsed facts: leg focus, duration 30 min. Unknown: equipment (important), sophistication (default practical), experience (unconfirmed). Ask "What equipment are you working with?" before constructing the workout. If full gym, choose efficient accessible complementary quadriceps + posterior-chain roles; if only dumbbells, choose variations that fit those tools; if bodyweight, use suitable movement choices and honest strength limitations. Avoid issuing an advanced power-lifting/plyometric plan merely from "legs". If skipped, show preview as assumptions, not as proven equipment access.

### For "advanced technical shoulder and arms hypertrophy"

Parsed facts: goal hypertrophy, experience advanced, requested technical sophistication but *not necessarily advanced movement skill*. If equipment known, build specialized and coherent regional roles. If "technical" is ambiguous and changes selection materially, offer "specialized exercise choices" vs "more demanding skills" rather than silently adding Olympic lifts.

### For "30-min legs, only home dumbbells"

Equipment explicitly supplied, so skip equipment follow-up. Only ask for unresolved issue that makes the plan unusable.

### For "3 sets of bench x 20 reps"

Explicit exercise and dose, so preserve and bypass generic follow-up; not every named exercise needs a whole generated plan.

## 4. Quality assurance: evaluate *decisions*, not output existence

The v0.64 stress/battle suites validate many correctness and consistency constraints. The next audit must separately score:
- **Prompt faithfulness** (targets, exact exercise list, equipment, exclusions).
- **Feasibility** (total duration estimated with rest/transition, viable workout count).
- **Goal fit** (strength/hypertrophy/power/conditioning decisions; correct rest/prescription semantics).
- **Appropriate sophistication** (simple means practical; advanced does not necessarily mean dangerous/complex).
- **Coverage** (prime muscle roles, priorities and full week where applicable).
- **Continuity** (protect long-term progression anchors; no arbitrary rotation).
- **Avoidable redundancy** (two near-identical exercises only when explicitly beneficial).
- **Provenance** (which factual observation and versioned rule drove a recommendation).
- **Uncertainty/safety** (no fictional equipment, diagnosis, made-up weight or fake PR).
- **User control** (easy changes, no silent mutation, account isolation).

Accept that some decisions require human coaching review; never label a passing machine check as proof a workout is optimal. Build golden fixtures across novice, advanced, strength, bodybuilding, varied schedules, return from time off, and physically accessible/home constraints. Add regression cases for ambiguous prompts and multiple identities.

## 5. Coverage remaining before claiming comprehensive competence

This pass is intentionally a **first research survey, not an encyclopedic finished Brain**. Further dedicated passes needed:
1. 308/308 exercise-by-exercise role/metadata audit, with human verification of specialized variants.
2. Nutritional fitness principles and body composition: evidence-backed general guidance, with boundaries separating nutrition advice from workout programming.
3. Age- and life-stage-specific programming, supervised rehabilitation, adaptive/disability training, and screening.
4. Sport-specific conditioning, speed, plyometrics, power development, concurrent training and cardiovascular modalities.
5. Exercise-specific technique cues, form-quality limitations and differences across machines.
6. Personalized equipment inventory / setup constraints (including limited dumbbell increments and commercial machine variants).
7. Question/intent failure corpus from real user prompts, with permission and anonymization.
8. Research update process, source checking, versioning and invalidation after new evidence.
9. Practical in-app measurement of usefulness: request resolution, user edits/swaps, workout completion, and controlled opt-in feedback, without invasive telemetry.

## 6. Source registry for implementation

Each reviewed `BrainRule` should include:
```js
{
  id: '...',
  domain: '...',
  evidenceLevel: 'synthesis|limited_trial|consensus|engineering',
  sourceIds: ['A1'],
  appliesTo: ['healthy_adults','hypertrophy'],
  supports: '...',
  limitations: '...',
  ruleKind: 'soft_preference|hard_constraint|question|safety',
  reviewedAt: '2026-10-13',
  nextReviewAt: null,
  enabled: false
}
```

`enabled:false` until explicit runtime implementation, tests, and owner approval. Do not present a Markdown file as though its contents were automatically learned by Coach.

---
**Checkpoint:** First wide-spectrum primary-source review complete. Runtime algorithms, version, builds, cloud records and Beta are unchanged by this research document.
