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

// Acceptance: the exact 5x5 prescription must never be trimmed to satisfy a
// requested clock target. Preview and saved routine must match its real sets.
let previewHtml='';
w.openModal=(_title,html)=>{previewHtml=html};
const explicitPrompt='5 x 5 deadlift in 20 minutes';
const exactReq=w.coachParsePrompt(explicitPrompt,'strength');
const exactPrescription=w.coachParseExplicitWorkout(explicitPrompt,exactReq.goal);
assert.equal(exactPrescription.items.length,1,'named 5x5 exercise must parse explicitly');
assert.equal(exactPrescription.items[0].sets,5);
assert.equal(exactPrescription.items[0].minReps,5);
assert.equal(exactPrescription.items[0].maxReps,5);
const exact=w.coachGenerateExplicitWorkout(exactReq,exactPrescription);
assert(exact?.explicitPrescription,'exact user-authored list must bypass auto selection');
assert.equal(exact.explicitDurationRequested,true);
assert.equal(exact.brainTime.targetMinutes,20);
assert.equal(exact.brainTime.rows[0].sets,5);
assert.equal(exact.brainTime.rows[0].minReps,5);
assert.equal(exact.brainTime.rows[0].maxReps,5);
w.renderCoachPreview();
assert.match(previewHtml,/Estimated time:/);
assert.match(previewHtml,/chosen exercises, sets and reps have not been reduced/i);
assert.equal(w.coachDraftRoutine(exact,'exact-before-edit').exercises[0].sets,5);
assert.equal(w.coachDraftRoutine(exact,'exact-before-edit').exercises[0].maxReps,5);

const timeEdit=w.coachRefineDraftText('make it 15 minutes');
assert(timeEdit.ok,JSON.stringify(timeEdit));
assert.equal(exact.request.duration,15);
assert.equal(exact.brainTime.targetMinutes,15);
assert.equal(w.coachDraftRoutine(exact,'exact-after-time-edit').exercises[0].sets,5,
  'reducing the target time must not shorten user-authored sets');
const setEdit=w.coachRefineDraftText('make deadlift 4 sets of 6');
assert(setEdit.ok,JSON.stringify(setEdit));
assert.equal(exact.brainTime.rows[0].sets,4,'time breakdown must re-evaluate after edit');
assert.equal(exact.brainTime.rows[0].minReps,6);
assert.equal(exact.brainTime.rows[0].maxReps,6);
const changed=w.coachDraftRoutine(exact,'exact-after-set-edit').exercises[0];
assert.equal(changed.sets,4);
assert.equal(changed.minReps,6);
assert.equal(changed.maxReps,6);
w.renderCoachPreview();
assert.match(previewHtml,/15 min target/);
assert.match(previewHtml,/4 sets/);

const untimedPrompt='3 x 8 deadlift';
const untimedReq=w.coachParsePrompt(untimedPrompt,'strength');
assert.equal(untimedReq.duration,0);
const untimed=w.coachGenerateExplicitWorkout(untimedReq,w.coachParseExplicitWorkout(untimedPrompt,untimedReq.goal));
assert(untimed);
assert.equal(untimed.explicitDurationRequested,false);
assert.equal(untimed.brainTime.targetMinutes,0,'a 45-minute programming default is not a user deadline');
w.renderCoachPreview();
assert.match(previewHtml,/Custom exercise list/);
assert.doesNotMatch(previewHtml,/45 min target|requested 45\\b/);
assert.equal(w.coachDraftRoutine(untimed,'exact-untimed').exercises[0].sets,3);
console.log('BRAIN_EXPLICIT_DURATION_ACCEPTANCE '+JSON.stringify({
  saved5x5Preserved:true,retargetNoTrimming:true,editedSetsReestimated:true,untimedNotMisrepresented:true
}));

// Manual preview edits must invalidate stale time breakdowns. They are user
// selections, so re-estimate rather than silently re-trimming or replacing.
const manual=w.coachGenerateWorkout(request('45 minute back workout','gym'));
assert(manual&&manual.selectedIds.length>=4);
w.renderCoachPreview();
const firstEstimate=manual.brainTime.estimateMinutes;
const removedId=manual.selectedIds.at(-1);
w.coachRemoveExercise(manual.selectedIds.length-1);
assert(!manual.selectedIds.includes(removedId));
assert.equal(manual.brainTime.rows.length,manual.selectedIds.length);
assert.deepEqual(Array.from(manual.brainTime.rows.map(x=>x.id)),Array.from(manual.selectedIds),
  'removed exercise must not remain in duration breakdown');
assert(manual.brainTime.estimateMinutes<firstEstimate,'removing a movement must reduce estimated time');
assert(!Object.hasOwn(manual.brainSetCounts||{},removedId),'removed exercise must not retain hidden set override');
const afterRemoval=w.coachDraftRoutine(manual,'manual-removed');
assert.equal(afterRemoval.exercises.length,manual.selectedIds.length);
afterRemoval.exercises.forEach((e,i)=>assert.equal(e.sets,manual.brainTime.rows[i].sets));

const beforeSwap=manual.selectedIds[0],beforeSwapTime=manual.brainTime.estimateMinutes;
w.coachSwapExercise(0);
assert.notEqual(manual.selectedIds[0],beforeSwap,'swap should choose a different real catalog movement');
assert.deepEqual(Array.from(manual.brainTime.rows.map(x=>x.id)),Array.from(manual.selectedIds),
  'replaced movement must appear in duration breakdown, never the stale original');
const afterSwap=w.coachDraftRoutine(manual,'manual-swapped');
afterSwap.exercises.forEach((e,i)=>assert.equal(e.sets,manual.brainTime.rows[i].sets));
assert.equal(manual.brainTime.targetMinutes,45);
assert.match(previewHtml,/Estimated time:/);
assert.match(previewHtml,/Swapped/);
console.log('BRAIN_MANUAL_PREVIEW_ACCEPTANCE '+JSON.stringify({
  removed:removedId,swappedFrom:beforeSwap,swappedTo:manual.selectedIds[0],
  before:firstEstimate,afterRemove:beforeSwapTime,afterSwap:manual.brainTime.estimateMinutes,
  actualSavedSetsMatch:true
}));

const upperRisk=w.coachGenerateWorkout(request('20 minute leg workout','gym'));
assert(upperRisk?.brainTime?.upperMinutes>20);
w.renderCoachPreview();
assert.match(previewHtml,/Extra setup or slower sets could push this past your target/i,
  'show upper-range time risk even where midpoint meets limit');

assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})'),before);
console.log('BRAIN_QUALITY_SUMMARY '+JSON.stringify({cases:traces.length,passed:true,originalCatalogIntact:true,historyUntouched:true}));
dom.window.close();
