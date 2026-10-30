// Targeted human-programming-quality regressions discovered by 38-case audit.
// These are bounded selection priorities, not advice to add arbitrary sets.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.fetch=()=>Promise.reject(Error('No network during quality regressions'));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
 }
});
try{
 await new Promise(resolve=>setTimeout(resolve,210));
 const w=dom.window,plain=o=>JSON.parse(JSON.stringify(o));
 const saved=()=>w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})');
 const before=saved(),examples=[];
 function program(prompt,choice='gym',goal='hypertrophy',opts={}){
  const parsed=w.coachParsePrompt(prompt,goal);
  const equip=w.coachBrainApplyEquipmentChoice(parsed,choice);
  assert(equip.ok);
  const intent=w.coachParseProgramIntent(prompt);
  if(opts.dayPlans)intent.dayPlans=opts.dayPlans;
  if(opts.excludedEquipment)equip.request.excludedEquipment=opts.excludedEquipment;
  return w.coachGenerateProgram(equip.request,intent,null);
 }
 function verify(draft,label){
  assert(draft,label+' rejected feasible program');
  const original=JSON.stringify(draft);
  const repairs=w.coachProposeProjectedWeekRepair(draft);
  assert.equal(original,JSON.stringify(draft),label+' altered draft during suggestion review');
  assert(repairs.changes.every(c=>c.optional===true&&c.requiresUserAcceptance===true));
  for(const day of draft.days){
   assert(day.selectedIds.length,'empty '+day.label);
   assert(day.brainTime.estimateMinutes<=day.request.duration,
     label+' exceeds planned target without consent: '+day.label);
   for(const id of day.selectedIds){
    assert(w.coachExerciseAllowedByConstraints(w.exById(id),day.request));
    assert.equal(w.coachBrainExerciseService().evaluateAvailability(id,
      w.coachBrainEquipmentConstraints(day.request)).status,'available');
   }
   const savedRoutine=w.coachProgramRoutineFromDay(day,draft,'synthetic');
   assert.deepEqual(plain(savedRoutine.exercises.map(x=>x.exerciseId)),
    plain(day.selectedIds),label+' preview/save diverged');
  }
 }
 const short=program('4 day upper lower program 60 minutes','gym','hypertrophy',{
  dayPlans:[{duration:25},{duration:45},{duration:60},{duration:60}]
 });
 verify(short,'one_25_min_upper_body_day');
 assert.equal(short.days.length,4);
 const first=short.days[0],secondUpper=short.days[2];
 assert.equal(first.request.duration,25);
 assert.equal(first.brainTime.estimateMinutes<=25,true);
 assert(first.selectedIds.length>=2&&first.selectedIds.length<=4);
 const pat=first.selectedIds.map(id=>w.exById(id)?.pattern);
 assert(pat.some(p=>['horizontal_press','incline_press'].includes(p)),
  'short upper day needs a meaningful chest press');
 assert(pat.some(p=>['horizontal_pull','vertical_pull'].includes(p)),
  'short upper day needs meaningful back pull');
 assert(secondUpper.selectedIds.some(id=>w.exById(id).pattern==='vertical_press'),
  'companion longer upper day should retain shoulder press');
 examples.push({id:'one_25_min_upper_day',shortDay:{
  estimated:first.brainTime.estimateMinutes,items:first.selectedIds.map(id=>w.exById(id).name)},
  laterUpper:secondUpper.selectedIds.map(id=>w.exById(id).name)});
 const dumbbells=program('3 day push pull legs program 60 minutes','dumbbells');
 verify(dumbbells,'dumbbell_only_ppl');
 const pull=dumbbells.days.find(d=>d.key==='pull');assert(pull);
 const pullNames=pull.selectedIds.map(id=>w.exById(id).name);
 const curls=pull.selectedIds.map(id=>w.exById(id)).filter(ex=>ex.pattern==='elbow_flexion');
 assert(curls.length>=2,'Pull day needs a useful second elbow-flexor angle when vertical pulls are infeasible');
 assert(curls.some(ex=>/\bhammer|cross.body|rope hammer/i.test(ex.name)),
  'At least one direct curl needs a neutral grip, not a duplicated supinated curl');
 assert(curls.some(ex=>!/\bhammer|cross.body|rope hammer|reverse|zottman/i.test(ex.name)),
  'Also preserve a supinated curl on constrained Pull day');
 assert(!pull.selectedIds.some(id=>w.exById(id).pattern==='vertical_pull'),
  'Must not invent dumbbell-only pull-up or cable pulley access');
 assert(pull.selectedIds.length>=5,'Expected a purposeful fifth Pull movement');
 assert(pull.brainTime.estimateMinutes<60,'Do not pad this Pull day to its clock target');
 examples.push({id:'dumbbell_ppl',pull:{
  estimated:pull.brainTime.estimateMinutes,names:pullNames,
  workingSets:pull.selectedIds.reduce((sum,id)=>sum+(pull.brainSetCounts?.[id]?.sets||
    w.coachExercisePrescription(w.exById(id),pull.request,pull.defaults).sets),0)}});
 // General (non-specialized) lower days should allocate the primary knee
 // pattern once, then combine it with complementary lunge, hinge or glutes.
 // A second squat is not automatically "more quad coverage."
 const general=program('4 day upper lower program 50 minutes','gym');
 verify(general,'general_upper_lower_50');
 for(const day of general.days.filter(d=>d.key==='lower body')){
  const squats=day.selectedIds.map(id=>w.exById(id)).filter(ex=>ex.pattern==='squat');
  assert(squats.length<=1,'Generic lower day stacks redundant squat variations '+day.label);
  assert(day.selectedIds.some(id=>w.exById(id).pattern==='lunge'),
   'Generic lower day should retain useful unilateral knee-dominant work');
 }
 examples.push({id:'general_upper_lower_50',legs:general.days.filter(d=>d.key==='lower body')
  .map(d=>({day:d.label,estimated:d.brainTime.estimateMinutes,
   exercises:d.selectedIds.map(id=>w.exById(id).name)}))});
 const noMachines=program('4 day upper lower program 50 minutes','gym','hypertrophy',{
  excludedEquipment:['machine','cable']});
 verify(noMachines,'machine_free_upper_lower');
 for(const day of noMachines.days.filter(d=>d.key==='lower body')){
  const hinges=day.selectedIds.map(id=>w.exById(id)).filter(ex=>ex?.pattern==='hinge');
  assert(hinges.length<=1,'Avoid automatically piling RDL and sumo deadlift on '+day.label);
  const patterns=day.selectedIds.map(id=>w.exById(id).pattern);
  assert(patterns.filter(p=>p==='squat').length<=1,
   'Avoid repeated squat-family movements on general machine-free Lower '+day.label);
  assert(patterns.some(p=>p==='squat'||p==='lunge'),
   'No foundational knee-dominant lower-body pattern');
  assert(patterns.includes('lunge'),
   'Protect complementary unilateral work in machine-free Lower '+day.label);
 }
 examples.push({id:'machine_free_upper_lower',legs:noMachines.days.filter(d=>d.key==='lower body')
  .map(d=>({day:d.label,exercises:d.selectedIds.map(id=>w.exById(id).name)}))});
 // Original approved glute-priority upper/lower must still prioritize glutes
 // and preserve Coach's optional squat -> hip abduction recommendation path.
 const gluteParsed=w.coachBrainApplyEquipmentChoice(
  w.coachParsePrompt('4 day upper lower program 50 minutes','hypertrophy'),'dumbbells');
 assert(gluteParsed.ok);
 const gluteIntent=w.coachParseProgramIntent('4 day upper lower program 50 minutes');
 gluteIntent.focusRegions=['glutes'];
 gluteParsed.request.programFocusRegions=['glutes'];
 const gluteFocus=w.coachGenerateProgram(gluteParsed.request,gluteIntent,null);
 verify(gluteFocus,'glute_priority_upper_lower');
 const gluteProposals=w.coachProposeProjectedWeekRepair(gluteFocus);
 assert(gluteProposals.changes.some(change=>change.removedName==='Bodyweight Squat'&&
  change.addedName==='Side-Lying Hip Abduction'),
  'Glute-focus approved swap must not disappear behind the general squat cap');
 examples.push({id:'glute_priority_preserved',changes:gluteProposals.changes.map(c=>({
  day:c.dayIndex,from:c.removedName,to:c.addedName}))});
 const strength=program('6 day push pull legs strength program 60 minutes','gym','strength');
 verify(strength,'strength_ppl_non_regression');
 const gymPpl=program('3 day push pull legs program 60 minutes','gym');
 verify(gymPpl,'full_gym_ppl_non_regression');
 assert(!gymPpl.days.find(d=>d.key==='pull').request.programPullNoVertical,
  'A real gym Pulldown must remain available');
 // Respect a deliberate two-hinge explicit request even when the automatic
 // planner would normally avoid stacking both in hypertrophy mode.
 const exName=n=>{const e=w.allExercises().find(x=>x.name===n);assert(e,n);return e};
 const requiredReq=w.coachBrainApplyEquipmentChoice(
  w.coachParsePrompt('90 minute legs workout','hypertrophy'),'gym').request;
 requiredReq.targetKeys=['legs'];requiredReq.targetLabels=['Legs'];
 requiredReq.targetRegions=plain(w.COACH_TARGET_GROUPS?.legs?.regions||requiredReq.targetRegions);
 requiredReq.duration=90;requiredReq.programExerciseUsage={};
 requiredReq.requiredExerciseIds=[exName('Romanian Deadlift').id,exName('Sumo Deadlift').id];
 const selected=w.coachSelectExercises(requiredReq,7);
 assert(selected.some(e=>e.name==='Romanian Deadlift')&&selected.some(e=>e.name==='Sumo Deadlift'),
  'User-authorized hinge combination must never be silently forbidden');
 // Explicitly selecting two squat movements is also the person's choice;
 // only *automatic* generic squat overlap is limited.
 const twoSquats=w.coachBrainApplyEquipmentChoice(
  w.coachParsePrompt('90 minute lower body workout','hypertrophy'),'gym').request;
 twoSquats.targetKeys=['lower body'];
 twoSquats.targetLabels=['Lower Body'];
 twoSquats.targetRegions=plain(w.COACH_TARGET_GROUPS?.['lower body']?.regions||
  twoSquats.targetRegions);
 twoSquats.duration=90;
 twoSquats.programExerciseUsage={};
 twoSquats.requiredExerciseIds=[exName('Back Squat').id,exName('Front Squat').id];
 const selectedSquats=w.coachSelectExercises(twoSquats,7);
 assert(selectedSquats.some(ex=>ex.name==='Back Squat')&&
  selectedSquats.some(ex=>ex.name==='Front Squat'),
  'A person explicitly requesting both squats cannot lose one because of an automatic cap');
 assert.equal(saved(),before,'Synthetic quality checks modified real persisted routines');
 fs.mkdirSync('/tmp/swole-cat-coach-selection',{recursive:true});
 fs.writeFileSync('/tmp/swole-cat-coach-selection/human-quality-repairs.json',
  JSON.stringify(examples,null,2)+'\n');
 console.log('COACH_SELECTION_QUALITY_EXAMPLES '+JSON.stringify(examples));
 console.log('COACH_SELECTION_QUALITY_PASS '+JSON.stringify({
  scenarios:9,shortUpperFeasible:true,meaningfulPullAngle:true,
  noAutomaticDoubleHinges:true,noAutomaticDoubleSquats:true,
  glutePriorityUnchanged:true,userRequestedDoubleHingeAllowed:true,
  userRequestedDoubleSquatAllowed:true,
  noArtificialTimePadding:true,previewSaveParity:true,noDataMutation:true
 }));
}finally{dom.window.close()}
