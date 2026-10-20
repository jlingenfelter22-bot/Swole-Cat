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
  assert.equal(result.recommendationOnly,true,'Coach proposals must not be silently accepted');
  assert.equal(result.requiresUserAcceptance,true,'Human acceptance is required');
  assert.equal(result.accepted,false,'No fixture may accept changes on a user\'s behalf');
  assert(result.changes.every(c=>c.optional===true&&c.editable===true&&
   c.requiresUserAcceptance===true),'Every suggestion must be optional and editable');
  if(expectChange)assert(result.applied,label+' should find a safe improvement');
  if(result.applied){
   assert.notEqual(result.draft,draft,label+' must return cloned draft');
   assert(w.coachProjectedRepairDebt(result.after)<w.coachProjectedRepairDebt(beforeAudit),
    label+' increased quality debt');
   assert(!w.coachProjectedRepairRegresses(beforeAudit,result.after),
    label+' introduced a new critical gap');
   for(const change of result.changes){
    const beforeDay=draft.days[change.dayIndex],afterDay=result.draft.days[change.dayIndex];
    if(change.kind==='add'){
     assert.equal(afterDay.selectedIds.length,beforeDay.selectedIds.length+1,label+' addition size');
     assert.deepEqual(afterDay.selectedIds.slice(0,-1),beforeDay.selectedIds,label+' shifted existing lifts');
     assert.equal(afterDay.brainSetCounts[change.addedId]?.sets,2,label+' added more than two sets');
     assert.equal(change.removedId,null,label+' removed an existing lift during addition');
     assert(afterDay.brainTime.estimateMinutes<=beforeDay.request.duration+
      Math.max(6,Math.ceil(beforeDay.request.duration*.15)),label+' exceeded loose duration tolerance');
    }else{
     assert.equal(change.kind,'swap');
     assert.equal(afterDay.selectedIds.length,beforeDay.selectedIds.length,label+' changed exercise count');
     assert(!afterDay.selectedIds.includes(change.removedId),label+' failed to remove swapped lift');
    }
    assert(afterDay.selectedIds.includes(change.addedId),label+' missing replacement');
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
  ['vertical_pull','knee_flexion'].includes(w.exById(c.addedId)?.pattern)),
  'Replace a later redundant squat with meaningful complementary work, keeping the leading squat');
 const hamstringFocus=equip('60 minute full body workout','gym');
 hamstringFocus.excludedMovementPatterns=['vertical_pull','calf_raise'];
 const hamstringWeek=makeWeek(makeDay('full body',
  ['Back Squat','Goblet Squat','Romanian Deadlift','Barbell Bench Press','Barbell Row'],hamstringFocus));
 results.push(inspect(hamstringWeek,'isolated_feasible_knee_flexion_gap',{expectChange:true}));
 assert(results.at(-1).changes.some(c=>c.removedName==='Goblet Squat'&&
  w.exById(c.addedId)?.pattern==='knee_flexion'),
  'With vertical pulling excluded, replace the duplicate squat with feasible knee-flexion work');

 const push=equip('60 minute push workout','gym');
 const pushDay=makeDay('push',['Barbell Bench Press','Incline Dumbbell Press','Cable Fly',
  'Dumbbell Shoulder Press'],push);
 pushDay.request.priorityRegions=['triceps'];
 const pushing=makeWeek(pushDay,['triceps']);
 assert(w.coachProjectedWeekAudit(pushing).findings.some(f=>f.type==='priority_secondary_only'));
 results.push(inspect(pushing,'indirect_only_triceps_priority',{expectChange:true}));
 assert(results.at(-1).changes.some(c=>w.exerciseMuscleMetadata(w.exById(c.addedId)).primary.includes('triceps')),
  'Direct triceps priority must truly be direct');
 assert(results.at(-1).changes.every(c=>!/push[ -]?up|dip|bench press/i.test(c.addedName)),
  'On a pressing-heavy day a triceps priority should use deliberate elbow-extension work');

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
 const humanReview=[];
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
  // Review evidence is intentionally emitted separately from test assertions:
  // exact before/after exercise lists, set counts, and planner minutes.
  const preview=w.coachProposeProjectedWeekRepair(draft);
  const dayRows=week=>week.days.map((day,dayIndex)=>({
   dayIndex,label:day.label,requestedMinutes:day.request.duration,
   estimateMinutes:day.brainTime?.estimateMinutes??null,
   lowerMinutes:day.brainTime?.lowerMinutes??null,
   upperMinutes:day.brainTime?.upperMinutes??null,
   exercises:day.selectedIds.map(id=>{
    const ex=w.exById(id),meta=w.exerciseMuscleMetadata(ex);
    return {id,name:ex.name,pattern:ex.pattern,
     sets:day.brainSetCounts?.[id]?.sets||w.coachExercisePrescription(ex,day.request,day.defaults).sets,
     primary:[...meta.primary],secondary:[...meta.secondary]};
   })
  }));
  humanReview.push({id:scenario.id,original:dayRows(draft),
   proposed:dayRows(preview.draft),changes:preview.changes,
   beforeFindings:preview.before.findings.map(f=>({type:f.type,role:f.role||null,region:f.region||null,title:f.title})),
   afterFindings:preview.after.findings.map(f=>({type:f.type,role:f.role||null,region:f.region||null,title:f.title})),
   verdict:'HUMAN_REVIEW_PENDING'});
  if(scenario.id==='4day_glute_priority_dumbbells'){
   const gluteSwaps=report.changes.filter(c=>c.kind==='swap'&&
    c.removedName==='Bodyweight Squat'&&w.exById(c.addedId)?.pattern==='hip_abduction');
   assert(gluteSwaps.length>=1,'Glute-priority dumbbell plan should replace a redundant squat with complementary abduction work when feasible');
   assert(report.debtAfter<report.debtBefore,'Actual glute-priority plan quality did not improve');
  }
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
   if(scenario.id==='3day_full_gym'){
    const pressSwap=report.changes.find(c=>c.kind==='swap'&&c.dayIndex===1&&
      c.removedName==='Overhead Press'&&w.exById(c.addedId)?.pattern==='vertical_pull');
    assert(pressSwap,'Day B must replace a repeated shoulder press with a real vertical pull');
    assert(report.changes.some(c=>c.kind==='add'&&
      w.exById(c.addedId)?.pattern==='knee_flexion'),
      'Remaining hamstring curl deficit should receive a modest two-set complement');
    assert.equal(report.changes.filter(c=>c.kind==='add').length,1,
      'Do not add a vertical pull when a safe cross-day press swap is available');
    const proposal=w.coachProposeProjectedWeekRepair(draft);
    const middle=proposal.draft.days[1];
    assert.equal(middle.selectedIds.length,draft.days[1].selectedIds.length,
      'Cross-day balance must not inflate Day B');
    assert.equal(proposal.draft.days[0].selectedIds.includes(byName('Dumbbell Shoulder Press').id),true,
      'Day A shoulder work must remain intact');
    assert.equal(proposal.draft.days[2].selectedIds.includes(byName('Arnold Press').id),true,
      'Day C shoulder work must remain intact');
    assert(middle.selectedIds.includes(byName('Decline Barbell Bench Press').id),
      'Day B must retain core chest pressing');
    const optedOut={...draft,recommendationsDisabled:true};
    assert.equal(w.coachProposeProjectedWeekRepair(optedOut).applied,false,
      'A user must be able to decline Coach\'s nonbinding suggestions');
    const edited=w.coachProjectedRepairClone(draft);
    edited.dayOverrides=edited.days.map((_,index)=>index===1
      ?{requiredExerciseIds:[byName('Overhead Press').id],excludedExerciseIds:[]}
      :{requiredExerciseIds:[],excludedExerciseIds:[]});
    edited.days[1].request={...edited.days[1].request,
      requiredExerciseIds:[byName('Overhead Press').id]};
    assert(!w.coachProposeProjectedWeekRepair(edited).changes.some(c=>
      c.dayIndex===1&&c.removedName==='Overhead Press'),
      'A user-specified overhead press must not be silently replaced');
    const swappedBack=w.coachProjectedRepairClone(draft);
    swappedBack.dayOverrides=swappedBack.days.map((_,index)=>index===1
      ?{excludedExerciseIds:[byName('Overhead Press').id],requiredExerciseIds:[]}
      :{excludedExerciseIds:[],requiredExerciseIds:[]});
    assert(!w.coachProposeProjectedWeekRepair(swappedBack).changes.some(c=>c.dayIndex===1),
      'Once a user manually swaps a day, Coach must not overwrite that day');
    const shoulderFocus=w.coachProjectedRepairClone(draft);
    shoulderFocus.request={...shoulderFocus.request,programFocusRegions:['side_delts']};
    shoulderFocus.intent={...shoulderFocus.intent,focusRegions:['side_delts']};
    assert(!w.coachProposeProjectedWeekRepair(shoulderFocus).changes.some(c=>
      c.removedName==='Overhead Press'),'Explicit shoulder specialization cannot lose shoulder pressing');
    const capped=w.coachProjectedRepairClone(draft);
    capped.days.forEach(day=>day.request={...day.request,prompt:day.request.prompt+' exactly 5 exercises'});
    assert(!w.coachProposeProjectedWeekRepair(capped).changes.some(c=>c.kind==='add'),
     'Explicit maximum exercise count must disable extra accessory exercises');
    const explicitSets=w.coachProjectedRepairClone(draft);
    explicitSets.days.forEach(day=>day.request={...day.request,prompt:day.request.prompt+' 3 working sets'});
    assert(!w.coachProposeProjectedWeekRepair(explicitSets).changes.some(c=>c.kind==='add'),
     'User-authored set prescriptions must not be overridden by automatic accessory volume');
    const excluded=w.coachProjectedRepairClone(draft);
    excluded.days.forEach(day=>day.request={...day.request,
      excludedMovementPatterns:[...(day.request.excludedMovementPatterns||[]),'vertical_pull']});
    assert(!w.coachProposeProjectedWeekRepair(excluded).changes.some(c=>
      w.exById(c.addedId)?.pattern==='vertical_pull'),
      'Explicit movement exclusions must survive repair');
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
 fs.writeFileSync('/tmp/swole-cat-coach-phase3/human-review-queue.json',
  JSON.stringify({version:'phase3-human-review-queue',scenarioCount:humanReview.length,
   scenarios:humanReview},null,2)+'\n');
 const sample=humanReview.find(x=>x.id==='3day_full_gym');
 assert(sample&&sample.proposed.length===3,'Must export full exact 3-day human review');
 console.log('COACH_PHASE3_HUMAN_REVIEW_THREEDAY '+JSON.stringify(sample));
 console.log('COACH_PHASE3_MATRIX '+JSON.stringify(results.map(x=>({
  id:x.label,proposed:x.applied,changes:x.changes?.map(c=>
   c.kind==='add'?'2 sets '+c.addedName:(c.removedName+' -> '+c.addedName))||[],
  debtBefore:x.debtBefore,debtAfter:x.debtAfter,reason:x.reason}))));
 console.log('COACH_PHASE3_PASS '+JSON.stringify({scenarios:12,generated,
  immutable:true,bounded:true,repairProposals:report.changes}));
}finally{dom.window.close()}
