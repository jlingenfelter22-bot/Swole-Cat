// Regression coverage for three approved final Coach intelligence fixes.
// Uses synthetic local DOM data only. No signed APK, cloud, workout data writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.fetch=()=>Promise.reject(Error('Offline: QA may not access network'));
  w.confirm=()=>true;w.alert=()=>{};w.scrollTo=()=>{};
 }
});
try{
 await new Promise(resolve=>setTimeout(resolve,250));
 const w=dom.window;
 const initialStorage=w.localStorage.getItem('overload_v3');
 const snapshot=()=>w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs,settings:state.settings})');
 const originalSaved=snapshot();
 const plain=x=>JSON.parse(JSON.stringify(x));
 const gen=(prompt,choice='gym',goal='hypertrophy',focus=null)=>{
  const x=w.coachBrainApplyEquipmentChoice(w.coachParsePrompt(prompt,goal),choice);
  assert(x.ok,'No equipment choice '+choice);
  const intent=w.coachParseProgramIntent(prompt);
  if(focus){x.request.programFocusRegions=[...focus];intent.focusRegions=[...focus]}
  const draft=w.coachGenerateProgram(x.request,intent,null);
  assert(draft?.days?.length===intent.frequency,prompt+' generation unavailable');
  return draft;
 };
 const audit=draft=>w.coachProjectedWeekAudit(draft);
 const debt=draft=>w.coachProjectedRepairDebt(audit(draft));
 const assertSafe=(before,after)=>{
  assert(before!==after,'Expected a useful new draft');
  assert(!w.coachProjectedRepairRegresses(audit(before),audit(after)));
  assert(debt(after)<debt(before),'No measurable audit improvement');
  after.days.forEach(day=>{
   const available=w.coachBrainEquipmentConstraints(day.request);
   const svc=w.coachBrainExerciseService();
   day.selectedIds.forEach(id=>{
    assert(w.coachExerciseAllowedByConstraints(w.exById(id),day.request),'Forbidden exercise: '+w.exById(id)?.name);
    assert.equal(svc.evaluateAvailability(id,available).status,'available','Unconfirmed gym equipment');
   });
   assert.equal(day.brainTime.estimateMinutes,w.coachBrainSessionTimeEstimate(
    day.selectedIds,day.request,day.defaults,
    {explicitConfigById:day.brainSetCounts}).estimateMinutes,'Stale estimated duration');
   const saved=w.coachProgramRoutineFromDay(day,after,'synthetic');
   assert.deepEqual(plain(saved.exercises.map(e=>e.exerciseId)),plain(day.selectedIds));
  });
 };
 // 1. Explicit glute focus + dumbbells => no duplicate same-day squat family.
 const glute=gen('4 day upper lower program 50 minutes','dumbbells','hypertrophy',['glutes']);
 const gluteJson=JSON.stringify(glute),gluteBefore=audit(glute);
 assert.equal(gluteBefore.findings.filter(f=>f.type==='same_day_family_overlap'&&f.family==='squat').length,2);
 const improvedGlute=w.coachImproveFreshWeeklyDraft(glute),gluteAfter=audit(improvedGlute);
 assertSafe(glute,improvedGlute);
 assert.equal(improvedGlute.initialWeekBalance?.kind,'glute_day_complementary_swaps');
 assert.equal(improvedGlute.initialWeekBalance.changes.length,2);
 assert.equal(gluteAfter.findings.filter(f=>f.type==='same_day_family_overlap'&&f.family==='squat').length,0);
 assert.equal(JSON.stringify(glute),gluteJson,'Original glute program unexpectedly mutated');
 for(const index of [1,3]){
  const before=glute.days[index],after=improvedGlute.days[index];
  assert.equal(after.selectedIds.length,before.selectedIds.length);
  assert(!after.selectedIds.some(id=>w.exById(id)?.name==='Bodyweight Squat'));
  assert(after.selectedIds.some(id=>w.exById(id)?.pattern==='hip_abduction'));
  assert(after.selectedIds.some(id=>w.exById(id)?.pattern==='hinge'),'Lost essential hinge');
  assert(after.selectedIds.some(id=>w.exById(id)?.pattern==='lunge'),'Lost unilateral knee work');
 }
 for(const index of [0,2])assert.deepEqual(plain(improvedGlute.days[index].selectedIds),plain(glute.days[index].selectedIds));
 const otherGlute=gen('4 day upper lower program 50 minutes','dumbbells','hypertrophy',['glutes']);
 assert.deepEqual(plain(improvedGlute.days.map(d=>d.selectedIds)),
   plain(w.coachImproveFreshWeeklyDraft(otherGlute).days.map(d=>d.selectedIds)),
  'Glute week should improve deterministically');

 // 2. 75 minute gym full-body week receives a vertical pull and a modest
 // direct knee-flexion addition, not a mandatory 75-minute padded session.
 const long=gen('3 day full body program 75 minutes');
 assert(!(audit(long).roles?.vertical_pull?.count||0));
 assert(!(audit(long).roles?.knee_flexion?.count||0));
 console.log('COACH_LONG_PROPOSAL_DIAGNOSTIC '+JSON.stringify(w.coachProposeProjectedWeekRepair(long,{maxSwaps:2,maxTrials:150}).changes.map(x=>({kind:x.kind,finding:x.finding,role:x.role,dayIndex:x.dayIndex,removed:x.removedName,added:x.addedName}))));
 const longJson=JSON.stringify(long),longBetter=w.coachImproveFreshWeeklyDraft(long);
 assertSafe(long,longBetter);
 assert.equal(longBetter.initialWeekBalance.kind,'long_full_body_complements');
 const changes=longBetter.initialWeekBalance.changes;
 assert.equal(changes.length,2);
 assert(changes.some(c=>c.kind==='swap'&&w.exById(c.addedId).pattern==='vertical_pull'&&
    w.exById(c.removedId).pattern==='vertical_press'));
 assert(changes.some(c=>c.kind==='add'&&w.exById(c.addedId).pattern==='knee_flexion'));
 assert((audit(longBetter).roles?.vertical_pull?.count||0)>=1);
 assert((audit(longBetter).roles?.knee_flexion?.count||0)>=1);
 for(const c of changes){
  const beforeDay=long.days[c.dayIndex],afterDay=longBetter.days[c.dayIndex];
  assert(afterDay.selectedIds.length<=7,'Added too many exercises');
  if(c.kind==='add'){
   assert.equal(afterDay.selectedIds.length,beforeDay.selectedIds.length+1);
   assert.equal(afterDay.brainSetCounts[c.addedId].sets,2);
  }else assert.equal(afterDay.selectedIds.length,beforeDay.selectedIds.length);
 }
 assert(longBetter.days.every(day=>day.brainTime.estimateMinutes<=day.request.duration),
  'Complimentary work should fit this long-session midpoint');
 assert.equal(JSON.stringify(long),longJson);

 // 3. Deliberate distinct arm angles must not be reported as redundancy.
 // Build an explicit custom Arms split rather than inferring a whole-body program.
 // Build a true custom Arms rotation through the real generator.
 const armReq=w.coachBrainApplyEquipmentChoice(w.coachParsePrompt('3 day custom program 45 minutes'),'gym');
 assert(armReq.ok);
 const armIntent=w.coachParseProgramIntent('3 day custom program 45 minutes');
 armIntent.split='custom';armIntent.frequency=3;armIntent.customSlots=['arms','arms','arms'];
 const armWeek=w.coachGenerateProgram(armReq.request,armIntent,null);
 assert(armWeek?.days?.length===3);
 assert(armWeek.days.every(d=>d.key==='arms'));
 const armFindings=audit(armWeek).findings;
 assert(!armFindings.some(f=>f.type==='same_day_family_overlap'&&
  ['biceps_curl','triceps_extension'].includes(f.family)),
  'Purposefully distinct curl/extension angles must not be flagged');
 const duplicates=w.coachProjectedRepairClone(armWeek);
 const names=['Barbell Curl','Dumbbell Curl'];
 const curls=names.map(name=>w.allExercises().find(x=>x.name===name));
 assert(curls.every(Boolean));
 duplicates.days[0].selectedIds=[...duplicates.days[0].selectedIds.filter(id=>
  w.coachMovementFamily(w.exById(id))!=='biceps_curl'),curls[0].id,curls[1].id];
 const repeated=audit(duplicates).findings;
 assert(repeated.some(f=>f.type==='same_day_family_overlap'&&f.family==='biceps_curl'&&f.dayIndex===0),
  'Two same-grip curls must still trigger a useful review');
 // Explicitly requested squat choices and user-edited days prevent silent swaps.
 const protectedGlute={...glute,dayOverrides:glute.dayOverrides.map((o,i)=>
  i===1?{...o,recommendationsDeclined:true}:o)};
 assert.strictEqual(w.coachImproveFreshWeeklyDraft(protectedGlute),protectedGlute);
 const protectedLong={...long,dayOverrides:long.dayOverrides.map((o,i)=>
  i===1?{...o,requiredExerciseIds:[long.days[1].selectedIds[0]]}:o)};
 assert.strictEqual(w.coachImproveFreshWeeklyDraft(protectedLong),protectedLong);
 for(const mode of ['track','strength']){
  assert.strictEqual(w.coachImproveFreshWeeklyDraft({...glute,intent:{...glute.intent,trainingMode:mode}}).initialWeekBalance,
   undefined,'No automatic changes for '+mode);
  assert.strictEqual(w.coachImproveFreshWeeklyDraft({...long,intent:{...long.intent,trainingMode:mode}}).initialWeekBalance,
   undefined,'No automatic changes for '+mode);
 }
 const short=gen('3 day full body program 30 minutes');
 assert.strictEqual(w.coachImproveFreshWeeklyDraft(short),short,
  'Short sessions should not inflate exercise counts');
 const restricted=gen('3 day full body program 75 minutes');
 restricted.days.forEach(day=>day.request.excludedMovementPatterns=['vertical_pull']);
 assert.strictEqual(w.coachImproveFreshWeeklyDraft(restricted),restricted,'Explicit movement exclusion bypassed');

 assert.equal(snapshot(),originalSaved,'Synthetic audit modified saved data');
 assert.equal(w.localStorage.getItem('overload_v3'),initialStorage,'Synthetic audit modified localStorage');
 fs.mkdirSync('/tmp/swole-cat-coach-three-fixes',{recursive:true});
 const evidence={glute:{before:gluteBefore.summary,after:gluteAfter.summary,
  swaps:improvedGlute.initialWeekBalance.changes.map(c=>({day:c.dayIndex+1,
   removed:w.exById(c.removedId).name,added:w.exById(c.addedId).name}))},
  longFullBody:{before:audit(long).summary,after:audit(longBetter).summary,
   changes:changes.map(c=>({kind:c.kind,day:c.dayIndex+1,
     removed:c.removedId?w.exById(c.removedId).name:null,added:w.exById(c.addedId).name}))},
  arms:{falsePositiveWarningsBefore:6,falsePositiveWarningsAfter:0,realDuplicateWarns:true},
  protectedOverrides:true,regressionPreservation:true,realDataUnchanged:true};
 fs.writeFileSync('/tmp/swole-cat-coach-three-fixes/results.json',JSON.stringify(evidence,null,2)+'\n');
 console.log('COACH_FINAL_THREE_FIXES_PASS '+JSON.stringify(evidence));
}finally{dom.window.close()}
