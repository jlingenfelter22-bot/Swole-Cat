// Phase 3 shadow repair: synthetic, deterministic, immutable before/after trials.
// This is NOT a live generator roll-out, release, account, or cloud test.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.fetch=()=>Promise.reject(Error('Synthetic repair tests have no network'));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
 }
});
try{
 await new Promise(resolve=>setTimeout(resolve,190));
 const w=dom.window;
 const beforeStorage=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})');
 const baseline=JSON.parse(fs.readFileSync('docs/coach-quality/phase1-baseline-v0934.json','utf8'));
 const byName=name=>{const ex=w.allExercises().find(item=>item.name===name);assert(ex,name);return ex};
 const equip=(prompt,choice='gym',goal='hypertrophy')=>{
  const parsed=w.coachParsePrompt(prompt,goal),choiceResult=w.coachBrainApplyEquipmentChoice(parsed,choice);
  assert(choiceResult.ok,prompt+' '+choice);
  return choiceResult.request;
 };
 const makeDay=(key,names,request,label=key)=>{
  const ids=names.map(name=>byName(name).id);
  const defaults=w.coachProgrammingDefaults(request.goal,request.duration);
  const brainTime=w.coachBrainSessionTimeEstimate(ids,request,defaults);
  return {key,label,request,defaults,selectedIds:ids,brainTime,brainSetCounts:{},brainFeasible:true};
 };
 const makeWeek=(day,focus=[])=>({
  request:{programFocusRegions:[...focus]},intent:{split:'custom',focusRegions:[...focus]},
  days:[day],dayOverrides:[],slots:[day.key]
 });
 const inspect=(draft,label,{expectChange=false}={})=>{
  const snapshot=JSON.stringify(draft),beforeAudit=w.coachProjectedWeekAudit(draft);
  const result=w.coachProposeProjectedWeekRepair(draft);
  const again=w.coachProposeProjectedWeekRepair(draft);
  assert.deepEqual(JSON.parse(JSON.stringify(result.changes)),JSON.parse(JSON.stringify(again.changes)),label+' non-deterministic');
  assert.equal(JSON.stringify(draft),snapshot,label+' mutated original');
  assert(result.changes.length<=2,label+' exceeded budget');
  assert.equal(result.applied,result.changes.length>0);
  if(expectChange)assert(result.applied,label+' should find a safe improvement');
  if(result.applied){
   assert.notEqual(result.draft,draft,label+' must return cloned draft');
   assert(w.coachProjectedRepairDebt(result.after)<w.coachProjectedRepairDebt(beforeAudit),
    label+' increased quality debt');
   assert(!w.coachProjectedRepairRegresses(beforeAudit,result.after),
    label+' introduced a new critical gap');
   for(const change of result.changes){
    const beforeDay=draft.days[change.dayIndex],afterDay=result.draft.days[change.dayIndex];
    assert.equal(afterDay.selectedIds.length,beforeDay.selectedIds.length,label+' changed volume of exercises');
    assert(!afterDay.selectedIds.includes(change.removedId)&&afterDay.selectedIds.includes(change.addedId));
    assert(w.coachExerciseAllowedByConstraints(w.exById(change.addedId),afterDay.request));
    assert.equal(w.coachBrainExerciseService().evaluateAvailability(change.addedId,
     w.coachBrainEquipmentConstraints(afterDay.request)).status,'available');
    assert.deepEqual(JSON.parse(JSON.stringify(afterDay.brainTime)),
     JSON.parse(JSON.stringify(w.coachBrainSessionTimeEstimate(afterDay.selectedIds,
       afterDay.request,afterDay.defaults,{explicitConfigById:afterDay.brainSetCounts}))),
     label+' contains stale time estimate');
    const saved=w.coachProgramRoutineFromDay(afterDay,result.draft,'synthetic');
    assert.deepEqual(saved.exercises.map(x=>x.exerciseId),afterDay.selectedIds,
     label+' preview/save exercise mismatch');
   }
  }
  return {label,applied:result.applied,changes:result.changes,
   debtBefore:w.coachProjectedRepairDebt(beforeAudit),debtAfter:w.coachProjectedRepairDebt(result.after),
   trials:result.trials||0,reason:result.reason};
 };
 const results=[];
 const full=equip('60 minute full body workout','gym');
 const duplicate=makeWeek(makeDay('full body',
  ['Back Squat','Goblet Squat','Romanian Deadlift','Barbell Bench Press','Barbell Row'],full));
 const pre=w.coachProjectedWeekAudit(duplicate);
 assert(pre.findings.some(f=>f.type==='missing_weekly_role'&&f.role==='knee_flexion'));
 assert(pre.findings.some(f=>f.type==='same_day_family_overlap'&&f.family==='squat'));
 results.push(inspect(duplicate,'duplicate_squat_missing_knee_flexion',{expectChange:true}));
 console.log('COACH_PHASE3_ADVERSARIAL_DUPLICATE '+JSON.stringify(results.at(-1)));
 assert(results.at(-1).changes.some(c=>c.removedName==='Goblet Squat'&&
  w.exById(c.addedId)?.pattern==='knee_flexion'),
  'Replace redundant squat, not the required multi-pattern foundation');

 const push=equip('60 minute push workout','gym');
 const pushDay=makeDay('push',['Barbell Bench Press','Incline Dumbbell Press','Cable Fly',
  'Dumbbell Shoulder Press'],push);
 pushDay.request.priorityRegions=['triceps'];
 const pushing=makeWeek(pushDay,['triceps']);
 assert(w.coachProjectedWeekAudit(pushing).findings.some(f=>f.type==='priority_secondary_only'));
 results.push(inspect(pushing,'indirect_only_triceps_priority',{expectChange:true}));
 assert(results.at(-1).changes.some(c=>w.exerciseMuscleMetadata(w.exById(c.addedId)).primary.includes('triceps')),
  'Direct triceps priority must truly be direct');

 const required=equip('60 minute full body workout','gym');
 required.requiredExerciseIds=[byName('Goblet Squat').id];
 const protectedDay=makeDay('full body',
  ['Back Squat','Goblet Squat','Romanian Deadlift','Barbell Bench Press','Barbell Row'],required);
 results.push(inspect(makeWeek(protectedDay),'required_squat_not_replaced'));
 assert(!results.at(-1).changes.some(c=>c.removedName==='Goblet Squat'));
 const tinyBudget=w.coachProposeProjectedWeekRepair(duplicate,{maxTrials:0});
 assert.equal(tinyBudget.applied,false,'Budget zero must disable mutation');
 const narrow=equip('45 minute arm workout','gym');
 results.push(inspect(makeWeek(makeDay('arms',['Barbell Curl','Triceps Pushdown'],narrow)),
  'arms_specialty_no_invented_lower_gap'));
 assert.equal(results.at(-1).applied,false,'Narrow arms-only day should not attract full-body repair');
 const floor=equip('45 minute lower body workout','bodyweight');
 results.push(inspect(makeWeek(makeDay('lower body',['Bodyweight Squat','Glute Bridge'],floor)),
  'bodyweight_impossibility'));
 assert(!results.at(-1).changes.some(c=>w.exById(c.addedId).equipment==='cable'||
  w.exById(c.addedId).equipment==='machine'),'No invented equipment');

 const scenarioSpecs={
  '2day_general_full_gym':['2 day full body program 45 minutes','gym','general'],
  '3day_full_gym':['3 day full body program 45 minutes','gym'],
  '3day_ppl_gym':['3 day push pull legs program 60 minutes','gym'],
  '4day_upper_lower_gym':['4 day upper lower program 45 minutes','gym'],
  '4day_upper_lower_dumbbells':['4 day upper lower program 45 minutes','dumbbells'],
  '4day_shoulder_priority_gym':['4 day upper lower program 50 minutes','gym',null,['side_delts','rear_delts']],
  '4day_glute_priority_dumbbells':['4 day upper lower program 50 minutes','dumbbells',null,['glutes']],
  '5day_balanced_gym':['5 day balanced program 45 minutes','gym'],
  '6day_ppl_gym':['6 day push pull legs program 60 minutes','gym'],
  '6day_ppl_strength':['6 day push pull legs strength program 60 minutes','gym','strength'],
  '3day_full_bodyweight_limit':['3 day full body program 30 minutes','bodyweight'],
  '3day_full_dumbbells':['3 day full body program 45 minutes','dumbbells']
 };
 let generated=0;
 for(const scenario of baseline.scenarios){
  const [prompt,choice,goal,focus]=scenarioSpecs[scenario.id];assert(prompt);
  const request=equip(prompt,choice,goal||'hypertrophy');
  const intent=w.coachParseProgramIntent(prompt);
  if(focus){intent.focusRegions=[...focus];request.programFocusRegions=[...focus]}
  const draft=w.coachGenerateProgram(request,intent,null);
  assert.equal(!!draft,scenario.generated,'Phase 3 changed generator output for '+scenario.id);
  if(!draft){results.push({label:scenario.id,generated:false,reason:'baseline_unavailable'});continue}
  generated++;
  assert.deepEqual(JSON.parse(JSON.stringify(draft.days.map(d=>d.selectedIds))),
   scenario.days.map(d=>d.exercises.map(ex=>ex.id)),'Phase 1 original output changed: '+scenario.id);
  const report=inspect(draft,scenario.id);
  if(report.applied){
   const original=w.coachProjectedWeekAudit(draft);
   const suggested=w.coachProposeProjectedWeekRepair(draft);
   // Existing explicit day instructions and selected split must survive.
   assert.equal(suggested.draft.intent.split,draft.intent.split);
   for(let i=0;i<draft.days.length;i++){
    assert.equal(suggested.draft.days[i].key,draft.days[i].key);
    assert.deepEqual(suggested.draft.days[i].request.requiredExerciseIds,
     draft.days[i].request.requiredExerciseIds);
   }
   assert(!w.coachProjectedRepairRegresses(original,suggested.after));
  }
  results.push(report);
 }
 assert.equal(baseline.scenarios.length,12);
 assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})'),
  beforeStorage,'Any repair fixture must leave all saved state alone');
 fs.mkdirSync('/tmp/swole-cat-coach-phase3',{recursive:true});
 const report={version:'phase3-shadow-swap-first',baselineVersion:'0.93.4',generated,
  scenarioCount:12,changes:results.reduce((n,x)=>n+(x.changes?.length||0),0),results};
 fs.writeFileSync('/tmp/swole-cat-coach-phase3/repair-before-after.json',
  JSON.stringify(report,null,2)+'\n');
 console.log('COACH_PHASE3_MATRIX '+JSON.stringify(results.map(x=>({
  id:x.label,proposed:x.applied,changes:x.changes?.map(c=>c.removedName+' -> '+c.addedName)||[],
  debtBefore:x.debtBefore,debtAfter:x.debtAfter,reason:x.reason}))));
 console.log('COACH_PHASE3_PASS '+JSON.stringify({scenarios:12,generated,
  immutable:true,bounded:true,repairProposals:report.changes}));
}finally{dom.window.close()}
