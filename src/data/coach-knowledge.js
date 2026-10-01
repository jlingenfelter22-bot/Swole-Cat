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
   equipment:'machines-and-free-weights-can-both-work'
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
