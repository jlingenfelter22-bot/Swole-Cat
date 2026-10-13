// Audit-only verification. This file does not alter app data, Coach behavior or packaged builds.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const src=fs.readFileSync('src/data/exercises.js','utf8');
const catalog=JSON.parse(src.match(/const LIBRARY=(\[[\s\S]*?\]);/)[1]);
const doc=JSON.parse(fs.readFileSync('docs/coach-brain/exercise-knowledge-audit-308.json','utf8'));
const stats=JSON.parse(fs.readFileSync('docs/coach-brain/exercise-knowledge-audit-statistics.json','utf8'));
const csv=fs.readFileSync('docs/coach-brain/exercise-knowledge-audit-308.csv','utf8');
const records=doc.records;
assert.equal(doc.runtime,false,'audit cannot advertise itself as live Brain intelligence');
assert.equal(records.length,308,'308 entries required');
assert.equal(catalog.length,308,'catalog coverage has changed; re-audit before releasing');
assert.equal(new Set(records.map(x=>x.id)).size,308,'no duplicate IDs');
assert.equal(csv.trimEnd().split('\n').length,309,'CSV header and 308 records required');

const byId=new Map(records.map(x=>[x.id,x]));
const validMuscles=new Set(['chest','front_delts','side_delts','rear_delts','biceps','triceps','forearms','upper_back','lats','traps','lower_back','core','obliques','glutes','quads','hamstrings','adductors','calves','tibialis']);
const measurements=new Set(['reps','duration','distance']);
const loads=new Set(['bodyweight','external','assistance']);
for(const e of catalog){
 const p=byId.get(e.id);
 assert(p,'missing '+e.id);
 assert.equal(p.name,e.name,'name drift '+e.id);
 assert.equal(p.catalog.pattern,e.pattern,'pattern drift '+e.name);
 assert.equal(p.catalog.muscle,e.muscle,'muscle-category drift '+e.name);
 assert.equal(p.catalog.equipment,e.equipment,'equipment drift '+e.name);
 assert.equal(p.catalog.loadType,e.loadType||null,'load flag drift '+e.name);
 assert.equal(p.catalog.measurementType,e.measurementType||'reps','measurement drift '+e.name);
 assert(p.role.whyChoose.length>=15,'no reason for '+e.name);
 assert(p.progression.method.length>=20,'no progression for '+e.name);
 assert(p.requiredEquipment.includes(e.equipment),'no base equipment for '+e.name);
 assert(p.muscleMap.primary.length>0,'no primary muscles for '+e.name);
 assert(p.muscleMap.primary.every(m=>validMuscles.has(m)),'unrecognized primary muscle '+e.name);
 assert(p.muscleMap.secondary.every(m=>validMuscles.has(m)),'unrecognized secondary muscle '+e.name);
 assert(p.muscleMap.primary.every(m=>!p.muscleMap.secondary.includes(m)),'overlap of primary and secondary '+e.name);
 assert(measurements.has(p.progression.measurement),'unknown measurement '+e.name);
 assert(loads.has(p.progression.loadType),'unknown loading '+e.name);
 assert(p.demands.technical>=1&&p.demands.technical<=4,'out-of-range technical '+e.name);
 assert(p.demands.systemic>=1&&p.demands.systemic<=4,'out-of-range systemic '+e.name);
 assert(p.demands.axial>=0&&p.demands.axial<=4,'out-of-range axial '+e.name);
 assert(p.similarExerciseIds.every(id=>id!==e.id&&byId.has(id)),'invalid alternate '+e.name);
 assert.equal(new Set(p.similarExerciseIds).size,p.similarExerciseIds.length,'duplicate alternate '+e.name);
 assert(p.similarExerciseIds.length<=3,'too many alternates '+e.name);
 assert.equal(p.similarExerciseIds.length,p.similarExerciseAssessments.length,'no substitute cautions '+e.name);
 for(const sub of p.similarExerciseAssessments){
   const other=byId.get(sub.id);
   assert(other,'substitution missing '+e.name);
   if(other.progression.measurement!==p.progression.measurement)assert(sub.cautions.includes('measurement_mismatch'),'unmarked metric mismatch');
   if(other.progression.loadType!==p.progression.loadType)assert(sub.cautions.includes('load_direction_or_meaning_differs'),'unmarked load mismatch');
 }
}
const key=name=>records.find(x=>x.name===name);
assert.equal(key('Dead Hang').progression.measurement,'duration');
assert.equal(key('Plank').progression.measurement,'duration');
assert.equal(key('Dumbbell Farmer Carry').progression.measurement,'distance');
assert.equal(key('Sled Push').progression.measurement,'distance');
assert.equal(key('Assisted Pull-Up').progression.loadType,'assistance');
assert.equal(key('Weighted Pull-Up').progression.loadType,'external');
assert.equal(key('Pull-Up').progression.loadType,'bodyweight');
assert(key('Banded Hip Abduction').requiredEquipment.includes('resistance band'));
assert(key('Nordic Hamstring Curl').requiredEquipment.some(x=>x.includes('ankle')));
assert(key('Meadows Row').requiredEquipment.some(x=>x.includes('landmine')));
assert(key('Dead Hang').similarExerciseIds.length===0,'no falsely equivalent timed grip substitute');
assert(key('Glute Ham Raise').review.flags.includes('hybrid_knee_flexion_and_hip_extension'));
assert.equal(stats.count,308);
assert.equal(stats.explicitMuscleOverrides+stats.fallbackMuscleRules,308);
assert.equal(Object.values(stats.byEquipment).reduce((a,b)=>a+b,0),308);
assert.equal(Object.values(stats.byMeasurement).reduce((a,b)=>a+b,0),308);
assert.equal(Object.values(stats.byLoad).reduce((a,b)=>a+b,0),308);

// v0.89 desk-adjudication gate: exact 86 original cases and five discovered
// specialty cases. Their proposed overlay is NOT a runtime mutation.
const ledgerDoc=JSON.parse(fs.readFileSync('docs/coach-brain/exercise-flag-resolution-91.json','utf8'));
const ledger=ledgerDoc.items;
assert.equal(doc.reviewPass.initialPriorityCount,86);
assert.equal(ledgerDoc.initialPriorityIds.length,86);
assert.equal(doc.reviewPass.adjudicatedCount,91);
assert.equal(ledger.length,91);
assert.equal(stats.originalPriorityCount,86);
assert.equal(stats.deskResolvedPriorities,86);
assert.equal(stats.additionalFindingsAdjudicated,5);
assert.equal(stats.unadjudicatedPriorityCount,0);
assert.equal(stats.runtimeApprovedCount,0);
assert.equal(new Set(ledger.map(x=>x.id)).size,ledger.length);
for(const id of ledgerDoc.initialPriorityIds)assert(ledger.some(x=>x.id===id),'initial flag not reviewed: '+id);
for(const x of records){
 assert(x.proposed&&x.proposed.movementRole&&x.proposed.equipmentCapabilities.length,'missing proposed profile '+x.name);
 assert.equal(x.proposed.preciseLoadTransferToOtherExercise,false,'unsafe implicit load transfer '+x.name);
 assert.equal(x.proposed.sourceStatus,'desk_proposal_not_live');
 assert(x.proposed.primaryMuscles.length>0);
 if(x.proposed.sideExecution!=='usual_bilateral_or_unspecified')assert.equal(x.proposed.sideMetricAvailableInCurrentApp,false,'false side tracking claim '+x.name);
 for(const a of x.similarExerciseAssessments)assert.equal(a.historyTransferAllowed,false,'unsafe alternative transfer '+x.name);
}
for(const row of ledger){
 const x=byId.get(row.id);assert(x,'flagged movement missing');
 assert.equal(x.name,row.name);
 assert.equal(x.review.adjudication,'desk_resolved_in_flag_resolution_ledger');
 assert(row.decision.length>24,'missing case-level decision '+row.name);
 assert(row.equipmentCapabilities.length>=1,'missing equipment requirements '+row.name);
 assert(row.contextRequired.length>5,'missing uncertainty/context '+row.name);
 assert(row.sourceIds.every(id=>!!ledgerDoc.sources[id]),'source not registered '+row.name);
 assert.equal(row.historicalDataChanges,'none');
}
assert.deepEqual(key('Meadows Row').proposed.equipmentCapabilities,['barbell','plates','anchored_landmine','stable_braced_stance']);
assert.equal(key('Glute Ham Raise').proposed.movementRole,'combined_knee_flexion_and_hip_extension');
assert.equal(key('Glute Ham Raise').proposed.resistancePolicy,'bodyweight_default_optional_added_load');
assert.equal(key('Nordic Curl Machine').proposed.resistancePolicy,'unknown_until_machine_assist_or_external_type_confirmed');
assert.equal(key('Assisted Dip').proposed.movementRole,'compound_dip_press');
assert.equal(key('Diamond Push-Up').proposed.movementRole,'close_hand_horizontal_press');
assert.equal(key('Side Plank').proposed.movementRole,'isometric_anti_lateral_flexion');
assert.equal(key('Side Plank').proposed.sideExecution,'one_side_at_a_time');
assert.equal(key('Pallof Press').proposed.movementRole,'anti_rotation');
assert.equal(key('Sled Drag').proposed.movementRole,'sled_drag_direction_unspecified');
assert(key('Weighted Push-Up').proposed.equipmentCapabilities.includes('secure_added_load'));
assert(key('Ab Wheel').proposed.equipmentCapabilities.includes('ab_wheel'));
assert(key('Dead Hang').proposed.equipmentCapabilities.includes('secure_overhead_bar'));
assert.equal(key('Dead Hang').similarExerciseIds.length,0);
for(const n of ['Walking Lunge','Reverse Lunge','Barbell Reverse Lunge','Cable Kickback','Cable Hip Adduction','Side-Lying Hip Abduction','Dumbbell Side Bend','Cable Woodchop'])
 assert.notEqual(key(n).proposed.sideExecution,'usual_bilateral_or_unspecified','missed unilateral '+n);
assert.equal(fs.readFileSync('docs/coach-brain/exercise-flag-resolution-91.csv','utf8').trimEnd().split('\\n').length,92);
assert(fs.readFileSync('docs/coach-brain/exercise-knowledge-audit-308.csv','utf8').includes('proposed_role'),'CSV omitted corrected profile columns');
console.log('Coach Brain 308-exercise audit integrity PASS',JSON.stringify({count:records.length,flagged:stats.priorityReview,explicit:stats.explicitMuscleOverrides,heuristic:stats.fallbackMuscleRules}));
