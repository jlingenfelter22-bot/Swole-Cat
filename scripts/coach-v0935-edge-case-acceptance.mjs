// Coach whole-week edge-case acceptance. Synthetic Android WebView DOM, no cloud or accounts.
// The assertions separate genuine hard user constraints from optional programming advice.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.fetch=()=>Promise.reject(Error('Edge-case audit may not contact a network'));
  w.confirm=()=>true;w.alert=()=>{};w.scrollTo=()=>{};
 }
});
const evidence=[],anomalies=[];
try{
 await new Promise(r=>setTimeout(r,200));
 const w=dom.window;
 const saved=()=>w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})');
 const initialSaved=saved();
 const ex=id=>w.exById(id);
 const exName=name=>{const row=w.allExercises().find(x=>x.name===name);assert(row,'Missing '+name);return row};
 const plain=o=>JSON.parse(JSON.stringify(o));
 const equip=(prompt,choice,goal='hypertrophy')=>{
  const req=w.coachParsePrompt(prompt,goal);
  const assigned=w.coachBrainApplyEquipmentChoice(req,choice);
  assert(assigned.ok,'Unknown equipment '+choice);
  return assigned.request;
 };
 function generate(prompt,choice='gym',goal='hypertrophy',opts={}){
  const req=equip(prompt,choice,goal),intent=w.coachParseProgramIntent(prompt);
  if(opts.focus){
   intent.focusRegions=[...opts.focus];
   req.programFocusRegions=[...opts.focus];
  }
  if(opts.excludedPatterns)req.excludedMovementPatterns=[...opts.excludedPatterns];
  if(opts.excludedEquipment)req.excludedEquipment=[...opts.excludedEquipment];
  if(opts.allowedEquipment)req.allowedEquipment=[...opts.allowedEquipment];
  if(opts.dayPlans)intent.dayPlans=opts.dayPlans.map(x=>({...x}));
  if(opts.preferredDays)intent.preferredDays=[...opts.preferredDays];
  if(opts.customSlots){intent.split='custom';intent.customSlots=[...opts.customSlots];}
  return {draft:w.coachGenerateProgram(req,intent,null),req,intent};
 }
 const cases=[
  ['2day_full_gym_30','2 day full body program 30 minutes','gym'],
  ['2day_full_gym_45','2 day full body program 45 minutes','gym'],
  ['2day_full_gym_75','2 day full body program 75 minutes','gym'],
  ['3day_full_gym_30','3 day full body program 30 minutes','gym'],
  ['3day_full_gym_45','3 day full body program 45 minutes','gym'],
  ['3day_full_gym_75','3 day full body program 75 minutes','gym'],
  ['3day_full_dumbbells_45','3 day full body program 45 minutes','dumbbells'],
  ['3day_full_dumbbells_75','3 day full body program 75 minutes','dumbbells'],
  ['3day_full_bodyweight_45','3 day full body program 45 minutes','bodyweight'],
  ['3day_ppl_gym_45','3 day push pull legs program 45 minutes','gym'],
  ['3day_ppl_gym_60','3 day push pull legs program 60 minutes','gym'],
  ['3day_ppl_dumbbells_60','3 day push pull legs program 60 minutes','dumbbells'],
  ['4day_upper_lower_gym_30','4 day upper lower program 30 minutes','gym'],
  ['4day_upper_lower_gym_45','4 day upper lower program 45 minutes','gym'],
  ['4day_upper_lower_gym_75','4 day upper lower program 75 minutes','gym'],
  ['4day_upper_lower_dumbbells_45','4 day upper lower program 45 minutes','dumbbells'],
  ['4day_upper_lower_glutes','4 day upper lower program 50 minutes','dumbbells','hypertrophy',{focus:['glutes']}],
  ['4day_upper_lower_shoulders','4 day upper lower program 50 minutes','gym','hypertrophy',{focus:['side_delts','rear_delts']}],
  ['4day_upper_lower_exclude_vertical','4 day upper lower program 45 minutes','gym','hypertrophy',{excludedPatterns:['vertical_pull']}],
  ['4day_upper_lower_exclude_squat','4 day upper lower program 50 minutes','gym','hypertrophy',{excludedPatterns:['squat']}],
  ['4day_upper_lower_no_machines','4 day upper lower program 50 minutes','gym','hypertrophy',{excludedEquipment:['machine','cable']}],
  ['5day_balanced_gym_45','5 day balanced program 45 minutes','gym'],
  ['5day_balanced_gym_75','5 day balanced program 75 minutes','gym'],
  ['5day_balanced_dumbbells_50','5 day balanced program 50 minutes','dumbbells'],
  ['6day_ppl_hypertrophy','6 day push pull legs program 60 minutes','gym'],
  ['6day_ppl_strength','6 day push pull legs strength program 60 minutes','gym','strength'],
  ['6day_ppl_no_vertical','6 day push pull legs program 60 minutes','gym','hypertrophy',{excludedPatterns:['vertical_pull']}],
  ['3day_full_gym_exact_count','3 day full body program 45 minutes exactly 5 exercises','gym'],
  ['3day_full_gym_explicit_sets','3 day full body program 45 minutes 3 working sets','gym'],
  ['3day_full_early_late','3 day full body program 45 minutes','gym','hypertrophy',{preferredDays:[1,3,5]}],
  ['3day_full_mixed_equipment','3 day full body program 60 minutes','gym','hypertrophy',{
    dayPlans:[{equipmentKey:'dumbbells'},{equipmentKey:'gym'},{equipmentKey:'bodyweight'}]}]
 ];
 let generated=0;
 for(const [name,prompt,choice,goal,opts] of cases){
  const first=generate(prompt,choice,goal||'hypertrophy',opts||{});
  if(!first.draft){
   evidence.push({id:name,generated:false,reason:'infeasible_or_ambiguous_request'});
   continue;
  }
  generated++;
  const draft=first.draft;
  const snapshot=JSON.stringify(draft);
  const count=draft.days.length;
  assert.equal(count,first.intent.frequency,name+' day count changed without asking');
  const audit=w.coachProjectedWeekAudit(draft);
  const before=w.coachProposeProjectedWeekRepair(draft);
  const after=w.coachProposeProjectedWeekRepair(draft);
  assert.deepEqual(plain(before.changes),plain(after.changes),name+' nondeterministic proposal');
  assert.equal(JSON.stringify(draft),snapshot,name+' proposal changed original draft');
  assert(before.changes.length<=2,name+' proposed more than two changes');
  assert(before.changes.every(c=>c.optional&&c.editable&&c.requiresUserAcceptance),name+' nonoptional change');
  if(before.applied){
   assert(w.coachProjectedRepairDebt(before.after)<w.coachProjectedRepairDebt(before.before),name+' not an improvement');
   assert(!w.coachProjectedRepairRegresses(before.before,before.after),name+' regression in priority/major muscles');
   assert(before.changes.every(c=>c.estimateAfter!=null),name+' missing revised duration');
  }
  for(const day of draft.days){
   assert(day.selectedIds.length>0,name+' empty generated day');
   assert(day.selectedIds.length<=8,name+' unexpectedly long exercise list');
   assert.equal(new Set(day.selectedIds).size,day.selectedIds.length,name+' duplicate exercise');
   for(const id of day.selectedIds){
    assert(ex(id),name+' unknown movement');
    assert(w.coachExerciseAllowedByConstraints(ex(id),day.request),name+' selected an excluded movement '+ex(id).name);
    if(day.request.brainEquipment){
     const availability=w.coachBrainExerciseService().evaluateAvailability(id,w.coachBrainEquipmentConstraints(day.request));
     assert.equal(availability.status,'available',name+' infeasible '+ex(id).name+' '+availability.status);
    }
   }
   assert(Number.isFinite(day.brainTime?.estimateMinutes),name+' missing duration estimate');
   const savedRoutine=w.coachProgramRoutineFromDay(day,draft,'synthetic');
   assert.deepEqual(plain(savedRoutine.exercises.map(x=>x.exerciseId)),plain(day.selectedIds),name+' draft-to-routine mismatch');
   assert.equal(savedRoutine.exercises.length,day.selectedIds.length);
  }
  if(opts?.excludedPatterns){
   assert(!before.changes.some(c=>opts.excludedPatterns.includes(ex(c.addedId)?.pattern)),name+' proposed excluded pattern');
  }
  if(opts?.excludedEquipment){
   for(const c of before.changes){
    const d=draft.days[c.dayIndex];
    assert(w.coachExerciseAllowedByConstraints(ex(c.addedId),d.request),name+' proposed excluded equipment');
   }
  }
  if(/exactly 5 exercises/.test(prompt)||/3 working sets/.test(prompt)){
   assert(!before.changes.some(c=>c.kind==='add'),name+' ignored explicit volume/count');
  }
  const second=generate(prompt,choice,goal||'hypertrophy',opts||{});
  if(second.draft)assert.deepEqual(plain(second.draft.days.map(d=>d.selectedIds)),
     plain(draft.days.map(d=>d.selectedIds)),name+' repeat generator drift');
  const unresolved=before.after?.findings?.filter(f=>f.type==='missing_weekly_role').map(f=>f.role)||[];
  const longDay=draft.days.filter(d=>d.brainTime.estimateMinutes>d.request.duration+Math.max(8,Math.ceil(d.request.duration*.2))).map(d=>d.label);
  if(longDay.length)anomalies.push({id:name,type:'estimated_time_over_20_percent_tolerance',days:longDay});
  evidence.push({id:name,generated:true,days:count,changes:before.changes.map(c=>({
    kind:c.kind,day:c.dayIndex,from:c.removedName,to:c.addedName})),
    debtBefore:w.coachProjectedRepairDebt(before.before),
    debtAfter:w.coachProjectedRepairDebt(before.after),
    unresolvedRoles:unresolved,
    maxDayEstimatedMinutes:Math.max(...draft.days.map(d=>d.brainTime.estimateMinutes))});
 }
 assert(generated>=22,'Insufficient feasible programs for quality coverage: '+generated);
 // Negative constraints and protected manual choices.
 const baseline=generate('3 day full body program 45 minutes','gym').draft;
 assert(baseline);
 const originalJson=JSON.stringify(baseline);
 const declined=w.coachProjectedRepairClone(baseline);
 declined.dayOverrides=declined.days.map((_,i)=>({
   excludedExerciseIds:[],requiredExerciseIds:[],recommendationsDeclined:i===1}));
 assert(!w.coachProposeProjectedWeekRepair(declined).changes.some(c=>c.dayIndex===1),
  'Declined day should never be redrafted by Coach');
 const protectedPress=exName('Overhead Press').id;
 const required=w.coachProjectedRepairClone(baseline);
 required.dayOverrides=required.days.map((_,i)=>({
  excludedExerciseIds:[],requiredExerciseIds:i===1?[protectedPress]:[]}));
 required.days[1].request={...required.days[1].request,requiredExerciseIds:[protectedPress]};
 assert(!w.coachProposeProjectedWeekRepair(required).changes.some(c=>c.removedId===protectedPress),
   'A user explicitly selecting Overhead Press cannot be overridden');
 const optOut={...baseline,recommendationsDisabled:true};
 assert(!w.coachProposeProjectedWeekRepair(optOut).applied,'Opt out ignored');
 // Test a user-led change remains authoritatively bound to their own day.
 assert.equal(JSON.stringify(baseline),originalJson,'Negative checks mutated baseline');
 assert.equal(saved(),initialSaved,'Audit changed saved workouts, cloud metadata or routines');
 fs.mkdirSync('/tmp/swole-cat-coach-edge-case',{recursive:true});
 fs.writeFileSync('/tmp/swole-cat-coach-edge-case/weekly-edge-case-matrix.json',
  JSON.stringify({version:'0.93.5',scenarioCount:cases.length,generated,
   rows:evidence,anomalies,allOriginalStateUnchanged:true},null,2)+'\n');
 console.log('COACH_EDGE_CASE_MATRIX '+JSON.stringify(evidence));
 console.log('COACH_EDGE_CASE_ANOMALIES '+JSON.stringify(anomalies));
 console.log('COACH_EDGE_CASE_PASS '+JSON.stringify({
  scenarios:cases.length,generated,unchangedUserState:true,deterministic:true,
  explicitConstraints:true,optionalOnly:true,protectedUserChoices:true,
  durationAnomalyCount:anomalies.length}));
}finally{dom.window.close()}
