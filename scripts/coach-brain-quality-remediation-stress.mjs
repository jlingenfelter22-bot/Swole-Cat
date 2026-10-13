// Approved v0.89 quality remediation checks, synthetic only. No persistent writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
 }
});
await new Promise(r=>setTimeout(r,180));
const w=dom.window,brain=w.SwoleCatRuntime.getService('brainKnowledge'),traces=[];
assert.equal(w.eval('LIBRARY.length'),310);assert.equal(brain.count,310);
const before=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})');
function request(prompt,key,goal='hypertrophy'){
 let req=w.coachParsePrompt(prompt,goal);
 const x=w.coachBrainApplyEquipmentChoice(req,key);assert(x.ok);
 return x.request;
}
function sample(prompt,key,goal='hypertrophy'){
 const req=request(prompt,key,goal),ok=w.coachGenerateWorkout(req);
 const draft=ok?w.eval('coachBuildDraft'):null;
 const names=draft?.selectedIds.map(id=>w.exById(id).name)||[];
 const estimate=draft?.brainTime;
 const emitted=draft?w.coachDraftRoutine(draft,'fixture'):null;
 if(draft){
   assert(estimate.estimateMinutes<=req.duration,'workout exceeds target: '+prompt+' -> '+estimate.estimateMinutes);
   assert(draft.selectedIds.every(id=>brain.evaluateAvailability(id,w.coachBrainEquipmentConstraints(req)).status==='available'));
   for(const ex of emitted.exercises){
     assert.equal(ex.sets,draft.brainSetCounts?.[ex.exerciseId]?.sets||w.coachExercisePrescription(w.exById(ex.exerciseId),draft.request,draft.defaults).sets,
       'saved sets must match time-estimate and preview for '+w.exById(ex.exerciseId).name);
   }
 }
 const r={prompt,key,goal,ok:!!ok,minutes:estimate?.estimateMinutes,target:req.duration,names,sets:emitted?.exercises.map(e=>e.sets),over:estimate?.overTarget};
 traces.push(r);console.log('BRAIN_QUALITY_SCENARIO '+JSON.stringify(r));return {draft,req,r};
}
function weekly(prompt,key){
 const req=request(prompt,key),intent=w.coachParseProgramIntent(prompt);
 const result=w.coachGenerateProgram(req,intent,null);
 const draft=result?w.eval('coachProgramBuildDraft'):null;
 const days=draft?.days.map(day=>({
   name:day.label,names:day.selectedIds.map(id=>w.exById(id).name),patterns:day.selectedIds.map(id=>w.exById(id).pattern),
   mins:day.brainTime?.estimateMinutes,target:req.duration,sets:day.selectedIds.map(id=>day.brainSetCounts?.[id]?.sets||w.coachExercisePrescription(w.exById(id),day.request,day.defaults).sets)
 }))||[];
 const rec={prompt,key,ok:!!result,days};
 if(result){
   assert(days.every(day=>day.mins<=req.duration),'program day over target '+prompt);
   for(let i=0;i<draft.days.length;i++){
     const emitted=w.coachProgramRoutineFromDay(draft.days[i],draft,'review');
     emitted.exercises.forEach((x,j)=>assert.equal(x.sets,days[i].sets[j],'saved program sets not in sync'));
   }
 }
 traces.push(rec);console.log('BRAIN_QUALITY_SCENARIO '+JSON.stringify(rec));return {req,draft,rec};
}
assert(brain.getProfile('lib_308').load==='bodyweight');
assert(brain.getProfile('lib_309').load==='bodyweight');
const floorLegs=sample('30 minute leg workout','bodyweight');
assert(floorLegs.r.ok,'floor-only legs should now generate a genuine knee-dominant plan');
assert(floorLegs.r.names.includes('Bodyweight Squat'));
assert(floorLegs.r.names.some(n=>/Glute Bridge|Lunge/i.test(n)),'needs useful glute/posterior accessory');
const gym20=sample('20 minute leg workout','gym');
assert(gym20.r.ok,'short legs should be feasible through honest generated set-count adjustments');
sample('30 minute full body workout','gym');
sample('30 minute full body workout','dumbbells');
const impossibleFull=sample('30 minute full body workout','bodyweight');
assert(!impossibleFull.r.ok,'without pulling equipment cannot certify floor-only full-body coverage');
const shoulder=sample('60 minute advanced shoulders and arms workout','gym');
assert(shoulder.r.ok);
assert(!shoulder.r.names.some(n=>/Wrist Curl|Wrist Extension/i.test(n)),'unrequested wrist isolation should not outrank arms specialization');
assert(shoulder.draft.selectedIds.some(id=>w.exById(id).pattern==='elbow_extension'),'needs direct triceps');
const fullGym=weekly('3 day full body program 45 minutes','gym');
assert(fullGym.rec.ok);
const heavy=fullGym.rec.days.flatMap(d=>d.names).filter(n=>/^(Sumo |Trap Bar )?Deadlift$/.test(n));
assert(heavy.length<=1,'three-day program should not repeat heavy deadlifts indiscriminately');
const upperGym=weekly('4 day upper lower program 35 minutes','gym');
assert(upperGym.rec.ok);
const upperDumb=weekly('4 day upper lower program 35 minutes','dumbbells');
assert(upperDumb.rec.ok);
const ppl=weekly('6 day push pull legs program 60 minutes','gym');
assert(ppl.rec.ok);
for(const day of ppl.rec.days.filter(d=>/Pull/.test(d.name))){
 assert(day.patterns.filter(p=>p==='horizontal_pull').length<=1,'redundant rows in '+day.name);
 assert(day.patterns.filter(p=>p==='vertical_pull').length<=1,'redundant pulldowns in '+day.name);
}
const floorProgram=weekly('3 day full body program 30 minutes','bodyweight');
assert(!floorProgram.rec.ok,'full-body equipment gap must not yield misleading program');
assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})'),before);
console.log('BRAIN_QUALITY_SUMMARY '+JSON.stringify({cases:traces.length,passed:true,originalCatalogIntact:true,historyUntouched:true}));
dom.window.close();
