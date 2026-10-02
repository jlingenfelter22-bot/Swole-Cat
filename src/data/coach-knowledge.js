// Evidence-backed programming knowledge used by Coach Swolecat.
// Keep broad research principles separate from exercise-selection mechanics so
// evidence can evolve without coupling source citations to UI or workout state.
const COACH_EVIDENCE_MODEL=Object.freeze({
 version:'2026-10',
 sources:Object.freeze({
   acsm2026:Object.freeze({
     id:'acsm-2026-resistance-training',
     title:'ACSM Position Stand: Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults',
     year:2026,
     url:'https://pubmed.ncbi.nlm.nih.gov/41843416/'
   }),
   exerciseVariation2022:Object.freeze({
     id:'jsc-2022-exercise-variation',
     title:'Does Varying Resistance Exercises Promote Superior Muscle Hypertrophy and Strength Gains? A Systematic Review',
     year:2022,
     url:'https://pubmed.ncbi.nlm.nih.gov/35438660/'
   }),
   exerciseOrder2020:Object.freeze({
     id:'exercise-order-2020-meta',
     title:'What influence does resistance exercise order have on muscular strength gains and muscle hypertrophy? A systematic review and meta-analysis',
     year:2020,
     url:'https://pubmed.ncbi.nlm.nih.gov/32077380/'
   }),
   deadlift2020:Object.freeze({
     id:'deadlift-emg-2020-review',
     title:'Electromyographic activity in deadlift exercise and its variants. A systematic review',
     year:2020,
     url:'https://pubmed.ncbi.nlm.nih.gov/32107499/'
   }),
   lumbarSpecificity2013:Object.freeze({
     id:'lumbar-extensor-specificity-2013',
     title:'A review of the specificity of exercises designed for conditioning the lumbar extensors',
     year:2013,
     url:'https://pubmed.ncbi.nlm.nih.gov/24092889/'
   }),
   bicepsRegional2025:Object.freeze({
     id:'biceps-regional-curls-2025',
     title:'Distinct muscle growth and strength adaptations after preacher and incline biceps curls',
     year:2025,
     url:'https://pubmed.ncbi.nlm.nih.gov/39809454/'
   }),
   tricepsOverhead2023:Object.freeze({
     id:'triceps-overhead-2023',
     title:'Triceps brachii hypertrophy after overhead versus neutral-arm elbow extension training',
     year:2023,
     url:'https://pubmed.ncbi.nlm.nih.gov/35819335/'
   }),
   lateralRaise2025:Object.freeze({
     id:'lateral-raise-2025',
     title:'Dumbbell versus cable lateral raises for lateral deltoid hypertrophy',
     year:2025,
     url:'https://pubmed.ncbi.nlm.nih.gov/40692697/'
   }),
   deltoidActivation2020:Object.freeze({
     id:'deltoid-exercise-activation-2020',
     title:'Different Shoulder Exercises Affect the Activation of Deltoid Portions in Resistance-Trained Individuals',
     year:2020,
     url:'https://pubmed.ncbi.nlm.nih.gov/33312291/'
   }),
   muscleLength2025:Object.freeze({
     id:'muscle-length-regional-hypertrophy-2025',
     title:'Does Muscle Length Influence Regional Hypertrophy? A Systematic Review and Meta-Analysis',
     year:2025,
     url:'https://pubmed.ncbi.nlm.nih.gov/40570881/'
   }),
   unilateralBilateral2025:Object.freeze({
     id:'unilateral-bilateral-2025',
     title:'Comparison of Muscle Growth and Dynamic Strength Adaptations Induced by Unilateral and Bilateral Resistance Training: A Systematic Review and Meta-analysis',
     year:2025,
     url:'https://pubmed.ncbi.nlm.nih.gov/39794667/'
   }),
   volumeFrequencyDose2025:Object.freeze({
     id:'volume-frequency-dose-2025',
     title:'The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains',
     year:2025,
     url:'https://pubmed.ncbi.nlm.nih.gov/41343037/'
   }),
   proximityFailure2024:Object.freeze({
     id:'proximity-failure-meta-regression-2024',
     title:'Exploring the Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy',
     year:2024,
     url:'https://pubmed.ncbi.nlm.nih.gov/38970765/'
   }),
   overloadProgression2024:Object.freeze({
     id:'overload-progression-2024',
     title:'Effects of Resistance Training Overload Progression Protocols on Strength and Muscle Mass',
     year:2024,
     url:'https://pubmed.ncbi.nlm.nih.gov/38286426/'
   }),
   supersets2025:Object.freeze({
     id:'supersets-2025',
     title:'Superset Versus Traditional Resistance Training Prescriptions: A Systematic Review and Meta-analysis',
     year:2025,
     url:'https://pubmed.ncbi.nlm.nih.gov/39903375/'
   }),
   loadingSpectrum2023:Object.freeze({
     id:'loading-spectrum-network-2023',
     title:'Resistance training prescription for muscle strength and hypertrophy in healthy adults: a systematic review and Bayesian network meta-analysis',
     year:2023,
     url:'https://pubmed.ncbi.nlm.nih.gov/37414459/'
   })
 }),
 principles:Object.freeze({
   hypertrophyWeeklyVolumeReferenceSets:10,
   strengthHeavyLoadPercent1RM:80,
   strengthTypicalSetsPerExercise:[2,3],
   trainMajorMuscleGroupsPerWeek:2,
   exerciseVariation:'systematic-not-random',
   exerciseOrder:'put the highest-priority strength movement early',
   failure:'not-required-for-results',
   equipment:'machines-and-free-weights-can-both-work',
   unilateralBilateral:'hypertrophy-is-similar; strength-adaptation-is-specific-to-the-trained-mode',
   weeklyVolume:'use-direct-and-indirect-set-equivalents-as-a-planning-context-not-a-hard-ceiling',
   proximityToFailure:'closer-to-failure-can-support-hypertrophy-but-momentary-failure-is-not-required',
   overloadProgression:'repetition-and-load-progression-are-both-valid-tools',
   supersets:'use-compatible-pairings-for-time-efficiency; avoid-same-biomechanical-pairing-when-volume-quality-matters'
 })
});

const COACH_BACK_KNOWLEDGE=Object.freeze({
 full:Object.freeze({
   label:'Back',
   regions:Object.freeze(['lats','upper_back','lower_back','traps']),
   description:'Full-back coverage: vertical pulling/lats, horizontal pulling/upper back, lumbar-spinal erectors, and trapezius support.'
 }),
 upper:Object.freeze({
   label:'Upper Back',
   regions:Object.freeze(['upper_back','traps']),
   description:'Scapular retractors and trapezius-dominant upper-back work, with rear-deltoid work used as an accessory rather than a substitute.'
 }),
 lower:Object.freeze({
   label:'Lower Back',
   regions:Object.freeze(['lower_back']),
   description:'Lumbar/spinal-erector work. Direct lumbar-extension patterns are distinguished from hip hinges where the erectors often act strongly as stabilizers.'
 }),
 lats:Object.freeze({
   label:'Lats',
   regions:Object.freeze(['lats']),
   description:'Lat-focused shoulder adduction/extension using vertical pulls and complementary lat-isolation patterns.'
 }),
 traps:Object.freeze({
   label:'Traps',
   regions:Object.freeze(['traps']),
   description:'Trapezius-focused work. Shrug/elevation work complements, rather than replaces, rows and vertical pulls in a full-back session.'
 })
});


const COACH_SHOULDER_KNOWLEDGE=Object.freeze({
 regions:Object.freeze(['front_delts','side_delts','rear_delts']),
 roles:Object.freeze(['press','lateral_raise','rear_delt']),
 description:'A complete shoulder session covers anterior-deltoid pressing, direct lateral-deltoid abduction, and posterior-deltoid/scapular work instead of allowing pressing alone to stand in for all three regions.'
});

const COACH_ARM_KNOWLEDGE=Object.freeze({
 regions:Object.freeze(['biceps','triceps','forearms']),
 hypertrophyRoles:Object.freeze({
   biceps:Object.freeze(['supinated_curl','neutral_grip_curl']),
   triceps:Object.freeze(['overhead_extension','neutral_arm_extension']),
   forearms:Object.freeze(['direct_forearm_optional'])
 }),
 description:'A complete arm session guarantees direct elbow-flexor and elbow-extensor work, uses complementary joint/arm positions when session length permits, and can add direct forearm work without claiming that any single curl or extension is universally superior.'
});
