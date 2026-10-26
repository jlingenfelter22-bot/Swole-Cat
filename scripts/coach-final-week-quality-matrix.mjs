// Final Coach quality audit: executable 2-6 day program matrix against
// CURRENT proposed generator and user-protected first-draft behavior.
// Read-only synthetic fixture. Not evidence of live Android or real human gains.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({
   ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.fetch=()=>Promise.reject(Error('Offline matrix: no network'));
  w.confirm=()=>true;w.alert=()=>{};w.scrollTo=()=>{};
 }
});
const day=ms=>Math.round(Number(ms)*10)/10;
const data=[];
try{
 await new Promise(resolve=>setTimeout(resolve,250));
 const w=dom.window,brain=w.SwoleCatRuntime.getService('brainKnowledge');
 const savedBefore=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs,settings:state.settings})');
 const storageBefore=w.localStorage.getItem('overload_v3');
 const frozen=JSON.parse(fs.readFileSync('docs/coach-quality/phase1-baseline-v0934.json','utf8'));
 assert.equal(frozen.scenarios.length,12,'Stable baseline must have 12 scenarios');
 const baselineInputs={
  '2day_general_full_gym':{prompt:'2 day full body program 45 minutes',equipment:'gym',goal:'general'},
  '3day_full_gym':{prompt:'3 day full body program 45 minutes',equipment:'gym'},
  '3day_ppl_gym':{prompt:'3 day push pull legs program 60 minutes',equipment:'gym'},
  '4day_upper_lower_gym':{prompt:'4 day upper lower program 45 minutes',equipment:'gym'},
  '4day_upper_lower_dumbbells':{prompt:'4 day upper lower program 45 minutes',equipment:'dumbbells'},
  '4day_shoulder_priority_gym':{prompt:'4 day upper lower program 50 minutes',equipment:'gym',focus:['side_delts','rear_delts']},
  '4day_glute_priority_dumbbells':{prompt:'4 day upper lower program 50 minutes',equipment:'dumbbells',focus:['glutes']},
  '5day_balanced_gym':{prompt:'5 day balanced program 45 minutes',equipment:'gym'},
  '6day_ppl_gym':{prompt:'6 day push pull legs program 60 minutes',equipment:'gym'},
  '6day_ppl_strength':{prompt:'6 day push pull legs strength program 60 minutes',equipment:'gym',goal:'strength'},
  '3day_full_bodyweight_limit':{prompt:'3 day full body program 30 minutes',equipment:'bodyweight'},
  '3day_full_dumbbells':{prompt:'3 day full body program 45 minutes',equipment:'dumbbells'}
 };
 const specs=[...frozen.scenarios.map(x=>({id:x.id,...baselineInputs[x.id],expectGenerated:x.generated})),
  {id:'3day_full_30_gym',prompt:'3 day full body program 30 minutes',equipment:'gym'},
  {id:'3day_full_75_gym',prompt:'3 day full body program 75 minutes',equipment:'gym'},
  {id:'4day_upper_lower_35_gym',prompt:'4 day upper lower program 35 minutes',equipment:'gym'},
  {id:'3day_full_strength_gym',prompt:'3 day full body strength program 60 minutes',equipment:'gym',goal:'strength'},
  {id:'3day_full_vertical_pull_excluded',prompt:'3 day full body program 45 minutes',equipment:'gym',excludedMovementPatterns:['vertical_pull']},
  {id:'3day_full_gym_named_shoulder',prompt:'3 day full body program 45 minutes with overhead press',equipment:'gym'},
  {id:'3day_custom_arms_only',prompt:'3 day custom program 45 minutes',equipment:'gym',slots:['arms','arms','arms']},
  {id:'5day_mixed_equipment',prompt:'5 day balanced program 45 minutes',equipment:'gym',
    dayEquipment:['gym','dumbbells','gym','dumbbells','gym']}
 ];
 const plain=x=>JSON.parse(JSON.stringify(x));
 let comparisons=0;
 for(const c of specs){
  const raw=w.coachParsePrompt(c.prompt,c.goal||'hypertrophy');
  const e=w.coachBrainApplyEquipmentChoice(raw,c.equipment);
  assert(e.ok,'No equipment configuration for '+c.id);
  const request=e.request,intent=w.coachParseProgramIntent(c.prompt);
  if(c.focus?.length){
   request.programFocusRegions=[...c.focus];intent.focusRegions=[...c.focus];
  }
  if(c.slots?.length){
   intent.split='custom';intent.frequency=c.slots.length;intent.customSlots=[...c.slots];
  }
  if(c.excludedMovementPatterns){
   request.excludedMovementPatterns=[...new Set([...(request.excludedMovementPatterns||[]),...c.excludedMovementPatterns])];
  }
  if(c.dayEquipment){
   intent.dayPlans=c.dayEquipment.map(equipmentKey=>({equipmentKey}));
  }
  const before=w.coachGenerateProgram(request,intent,null);
  if(c.expectGenerated===false){
   assert(!before,'Previously infeasible baseline must remain infeasible: '+c.id);
   data.push({id:c.id,status:'infeasible',reason:'full_body_scope_not_feasible_with_available_equipment'});
   continue;
  }
  assert(before?.days?.length===intent.frequency,
   'Generated day count disagrees with requested frequency for '+c.id);
  const unchanged=JSON.stringify(before);
  const beforeAudit=w.coachProjectedWeekAudit(before);
  assert(beforeAudit.ready,'Week audit rejected supported plan '+c.id);
  assert(!beforeAudit.findings.some(f=>['equipment_violation','unknown_exercise','required_exercise_absent'].includes(f.type)),
   'Hard constraint issue before preview in '+c.id);
  // Do not use freshly regenerated scripts' shadow suggestions as proof that
  // those suggestions were accepted; only explicit initial-draft path is tested.
  const actual=w.coachImproveFreshWeeklyDraft(before);
  const afterAudit=w.coachProjectedWeekAudit(actual);
  assert(!afterAudit.findings.some(f=>['equipment_violation','unknown_exercise','required_exercise_absent'].includes(f.type)),
   'First-draft adjustment introduced a hard constraint violation '+c.id);
  assert.equal(JSON.stringify(before),unchanged,'Audit/optimizer mutated its input: '+c.id);
  assert(!w.coachProjectedRepairRegresses(beforeAudit,afterAudit),
    'First-draft balance introduced a critical issue '+c.id);
  if(actual!==before){
   assert(actual.initialWeekBalance,'No documented reason for draft change '+c.id);
   assert(w.coachProjectedRepairDebt(afterAudit)<w.coachProjectedRepairDebt(beforeAudit));
   assert(['3day_full_gym','3day_full_75_gym','4day_glute_priority_dumbbells'].includes(c.id),
    'Unexpected automatic case '+c.id);
   comparisons++;
  }
  const dims={primary:{},secondary:{},patterns:{},names:[]},days=[];
  for(const d of actual.days){
   const selected=d.selectedIds.map(id=>w.exById(id));
   assert(selected.every(Boolean),'Unknown exercise '+c.id);
   assert.equal(new Set(d.selectedIds).size,d.selectedIds.length,'Repeated exact exercise on one day: '+c.id);
   const service=w.coachBrainExerciseService(),context=w.coachBrainEquipmentConstraints(d.request);
   const familyCounts={};
   const rows=[];
   for(const ex of selected){
    assert(w.coachExerciseAllowedByConstraints(ex,d.request),
     'Selected explicitly forbidden exercise '+ex.name+' in '+c.id);
    assert.equal(service.evaluateAvailability(ex.id,context).status,'available',
     'Exercise not confirmed available '+ex.name+' in '+c.id);
    const sets=Number(d.brainSetCounts?.[ex.id]?.sets||w.coachExercisePrescription(ex,d.request,d.defaults).sets);
    const meta=w.exerciseMuscleMetadata(ex);
    for(const muscle of meta.primary)dims.primary[muscle]=(dims.primary[muscle]||0)+sets;
    for(const muscle of meta.secondary)dims.secondary[muscle]=(dims.secondary[muscle]||0)+sets*.5;
    dims.patterns[ex.pattern]=(dims.patterns[ex.pattern]||0)+1;
    const family=w.coachMovementFamily(ex);
    familyCounts[family]=(familyCounts[family]||0)+1;
    rows.push({name:ex.name,id:ex.id,pattern:ex.pattern,family,sets,equipment:ex.equipment});
   }
   const estimates=w.coachBrainSessionTimeEstimate(d.selectedIds,d.request,d.defaults,
    {explicitConfigById:d.brainSetCounts});
   assert.equal(estimates.estimateMinutes,d.brainTime.estimateMinutes,
    'Estimated time differs from displayed preview for '+c.id);
   const saved=w.coachProgramRoutineFromDay(d,actual,'audit-'+c.id);
   assert.deepEqual(plain(saved.exercises.map(x=>x.exerciseId)),plain(d.selectedIds),
    'Preview/save mismatch '+c.id);
   days.push({name:d.label,key:d.key,equipment:d.request.brainEquipment?.choice||null,
    target:d.request.duration||null,time:{lower:estimates.lowerMinutes,
     midpoint:estimates.estimateMinutes,upper:estimates.upperMinutes},
    duplicatedFamilies:Object.entries(familyCounts).filter(([,n])=>n>1).map(([k,n])=>({family:k,count:n})),
    exercises:rows});
  }
  const findings=afterAudit.findings.map(f=>({
   type:f.type,priority:f.priority||null,severity:f.severity,
   region:f.region||null,role:f.role||null,dayIndex:f.dayIndex??null,
   example:f.title||''}));
  const priority=afterAudit.priorities.map(x=>({region:x.region,status:x.status,
   available:x.availability,primarySets:x.primarySets,secondaryEquivalent:x.secondaryEquivalent}));
  const result={id:c.id,split:intent.split,goal:request.goal,equipment:c.equipment,
   requestedDays:intent.frequency,generatedDays:actual.days.length,
   initialBalance:actual.initialWeekBalance||null,days,roles:Object.fromEntries(
     Object.entries(afterAudit.roles).map(([key,value])=>[key,value.count])),
   regionTotals:Object.fromEntries(Object.keys(dims.primary).concat(Object.keys(dims.secondary))
     .filter((x,i,a)=>a.indexOf(x)===i).map(k=>[k,{
      primary:dims.primary[k]||0,secondaryEquivalent:dims.secondary[k]||0
   }])),
   priority,findings,estimatedRangeIsNotHardDeadline:true};
  // Effective constraints include day-specific equipment and exclusions.
  if(c.excludedMovementPatterns?.length)
   assert(!actual.days.some(d=>d.selectedIds.some(id=>c.excludedMovementPatterns.includes(w.exById(id).pattern))),
    'Excluded pattern appeared: '+c.id);
  if(c.dayEquipment)assert.deepEqual(plain(days.map(d=>d.equipment)),c.dayEquipment,
   'Per-day equipment restrictions drifted: '+c.id);
  data.push(result);
  console.log('COACH_FINAL_WEEK_ROW '+JSON.stringify(result));
 }
 assert.equal(comparisons,3,
  'Unexpected count of eligible first-draft balancing cases: '+comparisons);

 // Exercise the real multi-step intake handoff, not only the pure optimizer.
 // The latest new-program draft must present the corrected weekly selection.
 const fromIntake=w.coachBrainApplyEquipmentChoice(
  w.coachParsePrompt('3 day full body program 45 minutes','hypertrophy'),'gym');
 assert(fromIntake.ok);
 const intakeIntent=w.coachParseProgramIntent('3 day full body program 45 minutes');
 intakeIntent.trainingMode='guided';
 intakeIntent.deload={enabled:false,intervalWeeks:4};
 intakeIntent.preferredDays=[1,3,5];
 const blankDraft={
  request:fromIntake.request,intent:intakeIntent,days:[],
  intake:{scheduleAnswered:true,goalAnswered:true,deloadAnswered:true},
  interactiveBrainFlow:false
 };
 w.eval('coachProgramBuildDraft='+JSON.stringify(blankDraft)+';');
 w.coachContinueProgramRequest();
 const intakeResult=w.eval('coachProgramBuildDraft');
 assert.equal(intakeResult.days?.length,3,'Actual intake did not create three days');
 assert.equal(intakeResult.initialWeekBalance?.kind,'optional_vertical_pull_swap',
  'Live intake path did not apply its documented fresh-draft balancing step');
 assert(intakeResult.days[1].selectedIds.some(id=>w.exById(id)?.pattern==='vertical_pull'),
  'Intake preview is missing the intended complementary vertical pull');
 assert(w.document.querySelector('.coach-program-day-card'),
  'Real intake did not render an editable program preview');
 console.log('COACH_FINAL_INTAKE_HANDOFF_PASS '+JSON.stringify({
  days:intakeResult.days.length,
  improvement:intakeResult.initialWeekBalance.kind,
  previewRendered:true,historyUnchanged:true
 }));
 assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs,settings:state.settings})'),
  savedBefore,'Audit mutated saved routines, sessions or settings');
 assert.equal(w.localStorage.getItem('overload_v3'),storageBefore,
  'Audit unexpectedly wrote localStorage');
 const report={source:'first-draft-PR98-plus-read-only-matrix',date:'2026-10-26',
  baselineSize:12,additionalCases:specs.length-12,totalCases:specs.length,
  firstDraftBalanceApplied:comparisons,unsafeHardConstraintFindings:0,
  savedDataUnchanged:true,notPhysicalAndroidAcceptance:true,
  methodology:'Planning-role audit with primary/secondary estimates and bounded initial-draft QA; exercise names available for human review; time ranges are approximate',
  results:data};
 fs.mkdirSync('/tmp/swole-cat-coach-final-week-matrix',{recursive:true});
 fs.writeFileSync('/tmp/swole-cat-coach-final-week-matrix/report.json',JSON.stringify(report,null,2)+'\n');
 console.log('COACH_FINAL_WEEK_SUMMARY '+JSON.stringify({
  scenarios:specs.length,generated:data.filter(x=>x.status!=='infeasible').length,
  knownInfeasible:data.filter(x=>x.status==='infeasible').length,
  swappedOnFreshDraft:comparisons,savedDataUnchanged:true,
  subjectiveCoachingReviewStillRequired:true
 }));
} finally {dom.window.close()}
