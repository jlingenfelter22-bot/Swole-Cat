// Coach whole-week improvement for *new* unsaved full-body drafts.
// Protected existing programs, overrides and training modes are never edited.
// Synthetic acceptance only, not Android workout-quality human review.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 url:'https://swole-cat.test/',runScripts:'dangerously',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',
   JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.fetch=()=>Promise.reject(Error('No network for Coach initial quality tests'));
  w.confirm=()=>true;w.alert=()=>{};w.scrollTo=()=>{};
 }
});
const outcomes=[];
try{
 await new Promise(resolve=>setTimeout(resolve,230));
 const w=dom.window;
 const originalStore=w.localStorage.getItem('overload_v3');
 const saved=()=>w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs,settings:state.settings})');
 const originalSaved=saved();
 const gen=(text,equipment='gym',goal='hypertrophy',focus=[])=>{
  const req=w.coachParsePrompt(text,goal);
  const resolved=w.coachBrainApplyEquipmentChoice(req,equipment);
  assert(resolved.ok,'Unrecognized equipment '+equipment);
  const intent=w.coachParseProgramIntent(text);
  if(focus.length){
   intent.focusRegions=[...focus];
   resolved.request.programFocusRegions=[...focus];
  }
  const draft=w.coachGenerateProgram(resolved.request,intent,null);
  assert(draft,'Generator cannot satisfy scenario '+text);
  return draft;
 };
 const three=gen('3 day full body program 45 minutes');
 const untouched=JSON.stringify(three),before=w.coachProjectedWeekAudit(three);
 assert.equal(before.roles?.vertical_pull?.count||0,0,
  'Locked v0.93.9 seed unexpectedly has vertical pulling already');
 assert(before.findings.some(f=>f.role==='vertical_pull'));
 const upgraded=w.coachImproveFreshProgramDraft(three);
 assert.notEqual(upgraded,three,'Fresh full-body week did not improve');
 assert.equal(JSON.stringify(three),untouched,'Original generated week was mutated');
 assert.equal(upgraded.days.length,3);
 assert.equal(upgraded.initialWeekBalance.kind,'optional_vertical_pull_swap');
 assert.equal(upgraded.initialWeekBalance.dayIndex,1);
 const swap=upgraded.initialWeekBalance;
 assert.equal(w.exById(swap.removedId)?.pattern,'vertical_press');
 assert.equal(w.exById(swap.addedId)?.pattern,'vertical_pull');
 const previous=three.days[1],improved=upgraded.days[1];
 assert.equal(previous.selectedIds.length,improved.selectedIds.length,
  'Automatic balance may not add workload');
 assert(improved.selectedIds.includes(swap.addedId)&&
  !improved.selectedIds.includes(swap.removedId));
 for(const n of [0,2]){
  assert.deepEqual(JSON.parse(JSON.stringify(upgraded.days[n].selectedIds)),
   JSON.parse(JSON.stringify(three.days[n].selectedIds)),
   'Other day was changed without need');
 }
 assert(upgraded.days.every(day=>day.selectedIds.some(id=>
  ['horizontal_press','incline_press','vertical_press','dip_press'].includes(w.exById(id)?.pattern))));
 assert(improved.selectedIds.some(id=>['horizontal_press','incline_press'].includes(w.exById(id)?.pattern)),
  'Middle full-body day lost its chest press');
 const after=w.coachProjectedWeekAudit(upgraded);
 assert(after.roles.vertical_pull.count>0,'Weekly vertical pull still absent');
 assert(w.coachProjectedRepairDebt(after)<w.coachProjectedRepairDebt(before));
 assert(!w.coachProjectedRepairRegresses(before,after));
 assert.deepEqual(JSON.parse(JSON.stringify(upgraded.days.map(d=>d.selectedIds))),
  JSON.parse(JSON.stringify(w.coachImproveFreshProgramDraft(three).days.map(d=>d.selectedIds))),
  'Same generated week must produce a deterministic balance choice');
 assert.deepEqual(JSON.parse(JSON.stringify(improved.brainTime)),
  JSON.parse(JSON.stringify(w.coachBrainSessionTimeEstimate(improved.selectedIds,
   improved.request,improved.defaults,{explicitConfigById:improved.brainSetCounts}))),
  'Time estimate must be recalculated on changed plan');
 assert(improved.brainTime.estimateMinutes<=
   Math.max(previous.brainTime.estimateMinutes+4,
    previous.request.duration+Math.max(8,Math.ceil(previous.request.duration*.2))),
  'A rough time budget was inflated substantially');
 const routine=w.coachProgramRoutineFromDay(improved,upgraded,'synthetic');
 assert.deepEqual(JSON.parse(JSON.stringify(routine.exercises.map(x=>x.exerciseId))),
  JSON.parse(JSON.stringify(improved.selectedIds)),
  'Preview-to-saved Routine IDs not consistent');
 outcomes.push({scenario:'three_day_general_hypertrophy_full_gym',
  change:'vertical press to vertical pull in middle day',unchangedDayCount:2,
  beforeDebt:w.coachProjectedRepairDebt(before),afterDebt:w.coachProjectedRepairDebt(after)});

 const noop=(id,draft)=>{const snapshot=JSON.stringify(draft);
  const result=w.coachImproveFreshProgramDraft(draft);
  assert.strictEqual(result,draft,id+' should not auto-edit');
  assert.equal(JSON.stringify(draft),snapshot,id+' mutated');
  outcomes.push({scenario:id,changed:false});
 };
 noop('three_day_ppl',gen('3 day push pull legs program 60 minutes'));
 noop('six_day_ppl_strength',gen('6 day push pull legs strength program 60 minutes','gym','strength'));
 noop('four_day_upper_lower_gym',gen('4 day upper lower program 45 minutes'));
 noop('three_day_full_dumbbells',gen('3 day full body program 45 minutes','dumbbells'));
 noop('three_day_full_priority',gen('3 day full body program 45 minutes','gym','hypertrophy',['side_delts']));
 const base=gen('3 day full body program 45 minutes');
 const protectedDay={...base,days:base.days.map((d,i)=>i===1?{...d,request:{
  ...d.request,requiredExerciseIds:[d.selectedIds.find(id=>w.exById(id)?.pattern==='vertical_press')]
 }}:d)};
 noop('named_exercise_required',protectedDay);
 const overridden={...base,dayOverrides:base.dayOverrides.map((o,i)=>i===1?
  {...o,recommendationsDeclined:true}:o)};
 noop('person_declined_recommendations',overridden);
 const manual={...base,dayOverrides:base.dayOverrides.map((o,i)=>i===1?
  {...o,requiredExerciseIds:[base.days[1].selectedIds[0]]}:o)};
 noop('person_accepted_manual_exercise',manual);
 noop('recommendations_disabled',{...base,recommendationsDisabled:true});
 noop('track_only_mode',{...base,intent:{...base.intent,trainingMode:'track'}});
 noop('strength_mode_selected',{...base,intent:{...base.intent,trainingMode:'strength'}});
 noop('explicit_overhead_press',{...base,request:{...base.request,
  prompt:'3 day full body program 45 minutes with overhead press'}});
 noop('explicit_shoulder_priority_in_prose',{...base,request:{...base.request,
  prompt:'3 day full body program 45 minutes, mainly shoulders'}});
 assert.equal(saved(),originalSaved,'Auto-quality draft touched workout/account/settings data');
 assert.equal(w.localStorage.getItem('overload_v3'),originalStore,
  'Auto-quality draft should never save anything to localStorage');
 const source=fs.readFileSync('src/js/04d-coach-program-builder.js','utf8');
 assert(source.includes('if(freshDraft)coachProgramBuildDraft=coachImproveFreshWeeklyDraft(coachProgramBuildDraft);'),
  'Must run only for the initial intake-generated draft, not edits');
 fs.mkdirSync('/tmp/swole-cat-coach-first-draft',{recursive:true});
 fs.writeFileSync('/tmp/swole-cat-coach-first-draft/acceptance.json',
  JSON.stringify({ownerApprovedDevelopment:true,readOnlySavedHistory:true,scenarios:outcomes},null,2)+'\n');
 console.log('COACH_FIRST_DRAFT_BALANCE_PASS '+JSON.stringify(outcomes));
}finally{dom.window.close()}
