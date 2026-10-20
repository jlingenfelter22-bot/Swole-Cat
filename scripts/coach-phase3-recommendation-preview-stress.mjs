// Preview acceptance flow. No real account, network, APK or cloud writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({
    ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.fetch=()=>Promise.reject(Error('No network in recommendation preview smoke tests'));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
 }
});
try{
 await new Promise(r=>setTimeout(r,190));
 const w=dom.window;
 const state=()=>w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})');
 const unchanged=state();
 const byName=name=>{const ex=w.allExercises().find(x=>x.name===name);assert(ex,name);return ex};
 const newProgram=()=>{
  const p=w.coachParsePrompt('3 day full body program 45 minutes','hypertrophy');
  const config=w.coachBrainApplyEquipmentChoice(p,'gym');
  assert(config.ok);
  const draft=w.coachGenerateProgram(config.request,
   w.coachParseProgramIntent('3 day full body program 45 minutes'),null);
  assert(draft&&draft.days.length===3,'fixture generates real three-day plan');
  return draft;
 };
 const current=()=>w.eval('coachProgramBuildDraft');
 const proposals=()=>w.coachProposeProjectedWeekRepair(current()).changes;
 const count=(day)=>day.selectedIds.length;
 const swapIndex=()=>proposals().findIndex(c=>c.kind==='swap'&&
  c.removedName==='Overhead Press'&&c.addedName==='Lat Pulldown'&&c.dayIndex===1);
 const curlIndex=()=>proposals().findIndex(c=>c.kind==='add'&&
  c.addedName==='Seated Leg Curl');
 const initial=newProgram(),initialJson=JSON.stringify(initial);
 w.renderCoachProgramPreview();
 assert(w.document.body.innerHTML.includes('Review suggestions'),'opt-in is visible');
 assert(!w.document.body.innerHTML.includes('Use Recommendation'),
  'Proposals should not be expanded/auto-applied by default');
 assert.equal(JSON.stringify(initial),initialJson,'simply opening preview changed data');
 assert.equal(state(),unchanged,'simply opening preview wrote saved state');
 assert(w.coachProgramShowRecommendations());
 assert.equal(JSON.stringify(initial.days.map(d=>d.selectedIds)),
  JSON.stringify(JSON.parse(initialJson).days.map(d=>d.selectedIds)),
  'reviewing recommendations changed exercise IDs');
 assert(w.document.body.innerHTML.includes('Keep Original'),'decline action absent');
 assert(w.document.body.innerHTML.includes('Try Another Swap'),'manual alternative absent');
 assert(w.document.body.innerHTML.includes('Use Recommendation'),'accept action absent');
 assert(swapIndex()>=0&&curlIndex()>=0,'real week should show both distinct recommendations');
 const declineIndex=swapIndex();
 assert(w.coachProgramKeepRecommendation(declineIndex),'keep original failed');
 assert(current().days[1].selectedIds.includes(byName('Overhead Press').id),
  'declining original press replacement changed selection');
 assert(!proposals().some(c=>c.dayIndex===1),
  'declined day must not receive another recommendation');
 assert.equal(state(),unchanged,'declining should not save user data');

 newProgram();
 assert(w.coachProgramShowRecommendations());
 const index=swapIndex();assert(index>=0);
 const beforeMiddle=[...current().days[1].selectedIds];
 assert(w.coachProgramUseRecommendation(index),'accept press-to-pull choice');
 let accepted=current();
 assert.equal(count(accepted.days[1]),beforeMiddle.length,'accept swap inflated day');
 assert(!accepted.days[1].selectedIds.includes(byName('Overhead Press').id));
 assert(accepted.days[1].selectedIds.includes(byName('Lat Pulldown').id));
 assert(accepted.days[0].selectedIds.includes(byName('Dumbbell Shoulder Press').id));
 assert(accepted.days[2].selectedIds.includes(byName('Arnold Press').id));
 assert.equal(accepted.days[1].brainTime.estimateMinutes,41,'day B time changed');
 assert(!proposals().some(c=>c.dayIndex===1),
  'user accepted a choice, but coach attempted another edit to the same day');
 assert.equal(state(),unchanged,'acceptance must only touch unsaved draft');

 const extra=curlIndex();
 assert(extra>=0,'expected remaining safe knee flexion suggestion');
 assert(w.coachProgramUseRecommendation(extra),'accept two-set accessory');
 accepted=current();
 const dayA=accepted.days[0];
 assert(dayA.selectedIds.includes(byName('Seated Leg Curl').id));
 assert.equal(dayA.brainSetCounts[byName('Seated Leg Curl').id].sets,2);
 assert.equal(dayA.brainTime.estimateMinutes,48,'original approximate time did not recalc');
 assert.equal(state(),unchanged,'acceptance wrote saved program without Save');

 // Both acceptances must persist across the existing draft regeneration path.
 assert(w.coachProgramRegenerateWithOverrides(),'draft regeneration failed');
 const regenerated=current();
 assert(regenerated.days[1].selectedIds.includes(byName('Lat Pulldown').id),
  'accepted lat pulldown lost on draft regeneration');
 assert(!regenerated.days[1].selectedIds.includes(byName('Overhead Press').id),
  'rejected overhead press resurrected on draft regeneration');
 assert(regenerated.days[0].selectedIds.includes(byName('Seated Leg Curl').id),
  'accepted leg curl lost on draft regeneration');
 assert.equal(regenerated.days[0].brainSetCounts[byName('Seated Leg Curl').id]?.sets,2,
  'accepted two-set prescription lost on draft regeneration');
 assert.equal(state(),unchanged,'regeneration mutated saved state');

 // Preview exact accepted draft, then save only after explicit test action.
 const snapshot=regenerated.days.map(day=>({
  label:day.label,ids:[...day.selectedIds],
  sets:day.selectedIds.map(id=>day.brainSetCounts?.[id]?.sets||
    w.coachExercisePrescription(w.exById(id),day.request,day.defaults).sets)
 }));
 const program=w.coachPersistGeneratedProgram(regenerated);
 assert(program?.routineIds?.length===3);
 for(let i=0;i<3;i++){
  const saved=w.eval('state.routines').find(r=>r.id===program.routineIds[i]);
  assert(saved,'saved routine missing');
  assert.deepEqual(saved.exercises.map(x=>x.exerciseId),snapshot[i].ids,'saved exercise IDs diverged');
  assert.deepEqual(saved.exercises.map(x=>x.sets),snapshot[i].sets,'saved sets diverged');
 }
 assert.equal(w.eval('state.sessions.length'),JSON.parse(unchanged).sessions.length,
  'saving program touched training history');
 console.log('COACH_RECOMMENDATION_PREVIEW_PASS '+JSON.stringify({
  reviewOptIn:true,keepOriginal:true,explicitAcceptance:true,
  acceptanceIsDraftOnly:true,manualEditProtected:true,regenerationRetainsChoices:true,
  previewSaveParity:true,generatedDays:3,
  acceptedDayB:'Overhead Press -> Lat Pulldown',
  acceptedDayA:'2 sets Seated Leg Curl',
  originalSessionCount:JSON.parse(unchanged).sessions.length
 }));
}finally{dom.window.close()}
