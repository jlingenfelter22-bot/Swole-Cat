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
console.log('Coach Brain 308-exercise audit integrity PASS',JSON.stringify({count:records.length,flagged:stats.priorityReview,explicit:stats.explicitMuscleOverrides,heuristic:stats.fallbackMuscleRules}));
