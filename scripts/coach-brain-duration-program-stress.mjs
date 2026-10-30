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
await new Promise(r=>setTimeout(r,170));
const w=dom.window;let modal='';
w.openModal=(title,html)=>{modal=html};w.showToast=()=>{};
const draft=()=>w.eval('coachBuildDraft');
const program=()=>w.eval('coachProgramBuildDraft');
const wNames=()=>draft()?.selectedIds?.map(id=>w.exById(id)?.name);

function start(prompt){
 w.eval('coachBuildDraft={request:coachParsePrompt('+JSON.stringify(prompt)+',"hypertrophy"),selectedIds:[],defaults:null,createdAt:"test"};');
 w.coachContinueRequest();
}
function startProgram(prompt){
 w.eval('coachProgramBuildDraft={request:coachParsePrompt('+JSON.stringify(prompt)+',"hypertrophy"),intent:coachParseProgramIntent('+JSON.stringify(prompt)+'),days:[],dayOverrides:[],interactiveBrainFlow:true,createdAt:"test"};');
 w.coachContinueProgramRequest();
}
const req=(prompt)=>w.coachParsePrompt(prompt,'hypertrophy');

assert.deepEqual(Array.from(w.coachBrainSplitEditClauses('make it 45 minutes, no squats and more glutes')),
 ['make it 45 minutes','no squats','more glutes']);
assert.deepEqual(Array.from(w.coachBrainSplitEditClauses('use dumbbells, cables and a barbell')),
 ['use dumbbells, cables and a barbell'],'comma-separated gear should remain one instruction');
assert.deepEqual(Array.from(w.coachBrainSplitEditClauses('no squats, and more glutes')),
 ['no squats','and more glutes'].map(x=>x.replace(/^and /,''))); // preposition handling

// Estimation semantics: real per-exercise rest + sets + bilateral/unilateral and setup.
const baseReq=req('30 minute legs at a full gym');
baseReq.brainEquipment=w.coachBrainExplicitEquipment(baseReq);
const defaults=w.coachProgrammingDefaults('hypertrophy',30);
const squat=w.exById('lib_12'),curl=w.exById('lib_19');
assert(squat&&curl);
const t1=w.coachBrainSessionTimeEstimate([squat,curl],baseReq,defaults);
assert(t1.warmupMinutes>=3);
assert(t1.estimateMinutes>=10&&t1.estimateMinutes<=50);
assert(t1.upperMinutes>t1.estimateMinutes&&t1.lowerMinutes<t1.estimateMinutes);
assert.equal(t1.rows.length,2);
const t2=w.coachBrainSessionTimeEstimate([squat,curl],baseReq,defaults,
 {explicitConfigById:{[squat.id]:{sets:6}}});
assert(t2.estimateMinutes>t1.estimateMinutes,'additional sets add real rest and work');
const uni=w.exById('lib_120');
if(uni){
 const u=w.coachBrainSessionTimeEstimate([uni],baseReq,defaults);
 assert(u.rows[0].totalSeconds>0);
}
const timed=w.coachBrainSessionTimeEstimate(['lib_307'],baseReq,defaults);
const distance=w.coachBrainSessionTimeEstimate(['lib_174'],baseReq,defaults);
assert.equal(timed.rows[0].metric,'duration','dead hang uses audited timed metric');
assert.equal(distance.rows[0].metric,'distance','sled uses audited distance metric');
assert(timed.rows[0].estimatedMetricDuration,'timed duration is a disclosed approximation');
const empty=w.coachBrainSessionTimeEstimate([],baseReq,defaults);
assert.equal(empty.estimateMinutes,0);

// The Brain can remove optional work to improve feasibility, but not the user's exact requested lift.
const trio=[w.exById('lib_12'),w.exById('lib_19'),w.exById('lib_21'),w.exById('lib_16')].filter(Boolean);
const longRequest={...baseReq,duration:15,requiredExerciseIds:[trio[0].id]};
const trimmed=w.coachBrainTrimToTime(trio,longRequest,defaults);
assert(trimmed.exercises.some(ex=>ex.id===trio[0].id),'user-specified primary lift cannot disappear');
assert(trimmed.exercises.length<=trio.length);
assert(trimmed.time.estimateMinutes>0);
assert(trio.every(ex=>w.exById(ex.id)),'source remains intact');

// Quick-build preview exposes estimate, and multi-instruction edits are atomic.
start('30 minute leg workout');
assert.match(modal,/equipment do you have access/i);
w.coachAnswerBrainEquipment('gym');
assert(draft()?.brainTime);
assert.match(modal,/Estimated time:/);
assert.equal(draft().brainTime.rows.length,draft().selectedIds.length);
const before=JSON.stringify(draft().selectedIds);
const updates=w.coachRefineDraftText('make it 45 minutes, no squats and more glutes');
assert.equal(updates.ok,true,updates.message);
assert.equal(draft().request.duration,45);
assert(draft().request.excludedMovementPatterns.includes('squat'));
assert(draft().request.priorityRegions.includes('glutes'));
assert(draft().selectedIds.every(id=>w.exById(id).pattern!=='squat'));
assert(draft().brainTime);
const after=JSON.stringify(draft().selectedIds);
const rejected=w.coachRefineDraftText('make it 50 minutes, remove quantum teleportation');
assert.equal(rejected.ok,false);
assert.equal(JSON.stringify(draft().selectedIds),after,'partial edits must roll back');
assert.equal(draft().request.duration,45,'duration rollback must be complete');

// Every new vague request gets a fresh time/equipment dialogue even after the earlier draft.
start('leg workout');
assert.match(modal,/How much time do we have/);
w.coachAnswerDuration(30);
assert.match(modal,/equipment do you have access/i);

// v0.90: a vague three-day "split" is a planning conversation, not full body by default.
const originalSessions=w.eval('JSON.stringify(state.sessions)');
startProgram('3-day split');
assert.match(modal,/What kind of split did you have in mind/);
assert.equal(program().intent.split,'','do not select full body without consent');
assert.equal(program().days.length,0,'program should not be generated yet');
assert(!w.coachGenerateProgram(program().request,{...program().intent,split:'custom',customSlots:[]},program()),
 'incomplete custom body-part split cannot silently generate full-body days');

w.coachAnswerProgramSplit('custom');
assert.match(modal,/What should Day 1 focus on/);
w.coachAnswerProgramCustomDay('arms');
assert.match(modal,/Day 2 focus/);
w.coachAnswerProgramCustomDay('back');
assert.match(modal,/Day 3 focus/);
w.coachAnswerProgramCustomDay('legs');
assert.match(modal,/How much time do you have per workout/);
w.coachAnswerProgramDuration(60);
assert.match(modal,/what equipment do you have/i);
w.coachAnswerProgramBrainEquipment('gym');
assert.match(modal,/Which days work best/);
w.coachToggleProgramScheduleDay(1);
w.coachToggleProgramScheduleDay(3);
w.coachToggleProgramScheduleDay(5);
assert.match(modal,/What is your primary goal/);
w.coachAnswerProgramGoal('hypertrophy');
assert.match(modal,/How would you like to track progression/);
w.coachAnswerProgramTrainingMode('guided');
assert.match(modal,/optional deload weeks/);
w.coachAnswerProgramDeload(4);
assert.deepEqual(Array.from(program().slots),['arms','back','legs']);
assert.deepEqual(Array.from(program().intent.preferredDays),[1,3,5]);
assert.equal(program().intent.trainingMode,'guided');
assert.equal(program().intent.deload.enabled,true);
assert.equal(program().intent.deload.intervalWeeks,4);
assert.equal(program().days.length,3);
assert.match(modal,/PROGRAM BUILD/);
assert.match(modal,/Custom Body-Part Split/);
assert(program().days[0].request.priorityRegions.includes('biceps')&&program().days[0].request.priorityRegions.includes('triceps'),
 'unspecified custom Arms day should prioritize biceps/triceps');
const firstArms=w.exerciseMuscleMetadata(w.exById(program().days[0].selectedIds[0])).primary;
assert(firstArms.includes('biceps')||firstArms.includes('triceps'),'wrist-curl accessories should not be first in a general Arms day');
console.log('COACH_V091_REVIEW '+JSON.stringify({scenario:'Custom Arms/Back/Legs',split:program().intent.split,days:program().days.map(d=>({label:d.label,exercises:d.selectedIds.map(id=>w.exById(id)?.name),minutes:d.brainTime?.estimateMinutes,range:[d.brainTime?.lowerMinutes,d.brainTime?.upperMinutes]})),review:w.coachBrainProgramWeekReview(program()).notes}));
const savedCustom=w.coachPersistGeneratedProgram();
assert.equal(savedCustom.trainingMode,'guided','generated program must save explicit training mode');
assert.equal(savedCustom.deload.enabled,true,'generated program must save selected deload cadence');
assert.equal(savedCustom.deload.intervalWeeks,4);
assert.deepEqual(Array.from(savedCustom.preferredDays),[1,3,5]);
assert.equal(w.eval('JSON.stringify(state.sessions)'),originalSessions,'intake never modifies history');

// Already specified aspects should NOT be asked again.
startProgram('3-day push pull legs Monday Wednesday Friday 60 minutes at a full gym for muscle growth');
assert.match(modal,/How would you like to track progression/);
assert.doesNotMatch(modal,/What kind of split/);
assert.doesNotMatch(modal,/Which days work/);
w.coachAnswerProgramTrainingMode('track');
assert.equal(program().days.length,3);
assert.deepEqual(Array.from(program().slots),['push','pull','legs']);
console.log('COACH_V091_REVIEW '+JSON.stringify({scenario:'Three-day PPL',split:program().intent.split,days:program().days.map(d=>({label:d.label,exercises:d.selectedIds.map(id=>w.exById(id)?.name)})),review:w.coachBrainProgramWeekReview(program()).notes}));
const savedTrack=w.coachPersistGeneratedProgram();
assert.equal(savedTrack.trainingMode,'track');
assert.equal(savedTrack.deload.enabled,false);

// Detailed requests must honor explicit progression/deload settings without more questions.
startProgram('3-day push pull legs Monday Wednesday Friday 60 minutes at a full gym for muscle growth, guided progressive overload, deload every 6 weeks');
assert.equal(program().days.length,3,'fully specified program should open preview directly');
assert.equal(program().intent.trainingMode,'guided');
assert.equal(program().intent.deload.intervalWeeks,6);
assert.match(modal,/PROGRAM BUILD/);
const modeRefinement=w.coachRefineProgramText('switch to track only');
assert(modeRefinement.ok,JSON.stringify(modeRefinement));
assert.equal(program().intent.trainingMode,'track');
assert.equal(program().intent.deload.enabled,false,'Track Only may not inherit scheduled Guided deloads');

// Freeform setup may answer split, clock, equipment, weekdays, goal, mode and deload at once.
startProgram('3-day split');
const nativeGetter=w.document.getElementById.bind(w.document);
w.document.getElementById=id=>id==='coachProgramAnswer'
 ?{value:'PPL, 45 minutes, full gym, Monday Wednesday Friday, build muscle, guided progressive overload, deload every 4 weeks'}
 :nativeGetter(id);
w.coachSubmitProgramAnswer();
w.document.getElementById=nativeGetter;
assert.equal(program().days.length,3,'multi-detail answer should open the program preview');
assert.deepEqual(Array.from(program().slots),['push','pull','legs']);
assert.equal(program().request.duration,45);
assert.deepEqual(Array.from(program().intent.preferredDays),[1,3,5]);
assert.equal(program().intent.trainingMode,'guided');
assert.equal(program().intent.deload.intervalWeeks,4);
assert.match(modal,/PROGRAM BUILD/);

// A weekday-only response may NOT override an explicitly chosen four-day frequency.
startProgram('4-day upper lower split 45 minutes at a full gym for muscle growth guided progressive overload no deload');
w.document.getElementById=id=>id==='coachProgramAnswer'?{value:'Monday Wednesday Friday'}:nativeGetter(id);
w.coachSubmitProgramAnswer();
w.document.getElementById=nativeGetter;
assert.equal(program().intent.frequency,4,'three named days are not explicit permission to change four-day frequency');
assert.match(modal,/Which days work best/,'request the missing fourth day');

// Full body is allowed when explicitly requested, but does not bypass mode setup.
startProgram('3-day full body program, 45 minutes, dumbbells only');
assert.match(modal,/Which days work/);
w.coachUseFlexibleProgramSchedule();
w.coachAnswerProgramGoal('general');
w.coachAnswerProgramTrainingMode('track');
assert.equal(program().days.length,3);
assert(program().slots.every(key=>key==='full body'));

// Explicit upper/lower program can be refined after required intake.
startProgram('3-day upper lower plan');
assert.match(modal,/How much time do you have per workout/);
w.coachAnswerProgramDuration(60);
assert.match(modal,/what equipment do you have/i);
w.coachAnswerProgramBrainEquipment('gym');
w.coachUseFlexibleProgramSchedule();
w.coachAnswerProgramGoal('hypertrophy');
w.coachAnswerProgramTrainingMode('guided');
w.coachAnswerProgramDeload(0);
assert.equal(program().intent.deload.enabled,false);
const multiple=w.coachRefineProgramText('4 days, 35 minutes and no squats');
assert(multiple.ok,JSON.stringify(multiple));
assert.equal(program().intent.frequency,4);
assert.equal(program().request.duration,35);
assert(program().request.excludedMovementPatterns.includes('squat'));
assert(program().days.every(day=>day.selectedIds.every(id=>w.exById(id).pattern!=='squat')));
assert(program().days.every(day=>day.brainTime));
assert(program().interactiveBrainFlow);
const beforeBad=program().request.duration,daysBefore=program().days.map(d=>d.selectedIds.join(','));
const fail=w.coachRefineProgramText('50 minutes, remove quantum teleportation');
assert(!fail.ok,'unsupported second clause must reject transaction');
assert.equal(program().request.duration,beforeBad);
assert.deepEqual(program().days.map(d=>d.selectedIds.join(',')),daysBefore);

// New vague program asks split, even if earlier program selected another split.
startProgram('4-day workout plan 45 minutes');
assert.match(modal,/What kind of split did you have in mind/);
w.coachAnswerProgramSplit('upper_lower');
assert.match(modal,/what equipment do you have/i);
assert.equal(w.eval('JSON.stringify(state.sessions)'),originalSessions,'tests must never change workout history');

// "I don't know" asks for goal/context, then offers explicit choices rather
// than silently selecting three Full Body days or auto-generating a routine.
startProgram('help me build a 3-day split');
assert.match(modal,/What kind of split did you have in mind/);
w.coachAskForSplitRecommendation();
assert.match(modal,/main thing you want out of this program/i);
assert.equal(program().intent.split,'');
w.coachAnswerProgramGoal('strength');
assert.match(modal,/A few ways to organize your week/);
assert.match(modal,/None of these splits is universally best/);
assert.equal(program().days.length,0,'advice cannot create workouts');
w.coachAnswerProgramSplit('ppl');
assert.equal(program().intent.split,'ppl');
assert.match(modal,/How much time do you have per workout/);
assert.equal(program().days.length,0);
// The same "help me choose" intention can be stated through freeform input.
startProgram('3-day split for strength');
const recommendationGetter=w.document.getElementById.bind(w.document);
w.document.getElementById=id=>id==='coachProgramAnswer'?{value:'recommend something'}:recommendationGetter(id);
w.coachSubmitProgramAnswer();
w.document.getElementById=recommendationGetter;
assert.match(modal,/A few ways to organize your week/);
assert.equal(program().intent.split,'');

// A 2-day PPL request cannot secretly drop Legs (or other day): negotiate explicitly.
startProgram('2-day push pull legs program Monday Wednesday 45 minutes at a full gym for muscle growth track only');
assert.match(modal,/needs three distinct sessions/i);
assert.equal(program().days.length,0,'incompatible PPL frequency is not generated');
w.coachAnswerProgramSplit('upper_lower');
assert.deepEqual(Array.from(program().slots),['upper body','lower body']);
assert.equal(program().intent.frequency,2,'coach preserves requested frequency unless user changes it');

startProgram('2-day program');
assert.match(modal,/What kind of split did you have in mind/);
assert.doesNotMatch(modal,/onclick="coachAnswerProgramSplit\('ppl'\)"/);
assert.match(modal,/PPL needs at least 3 training days/);

// Preview refinements also protect the user's explicit weekly frequency.
startProgram('4-day upper lower program Monday Tuesday Thursday Friday 45 minutes at a full gym for muscle growth track only');
assert.equal(program().days.length,4);
const fourDayIds=program().days.map(d=>d.selectedIds.join(','));
const fourDaySchedule=JSON.stringify(program().intent.preferredDays);
const badWeekdays=w.coachRefineProgramText('Monday Wednesday Friday');
assert.equal(badWeekdays.ok,false,'three weekdays cannot override a four-day program');
assert.match(badWeekdays.message,/will not silently change/i);
assert.equal(program().intent.frequency,4);
assert.equal(JSON.stringify(program().intent.preferredDays),fourDaySchedule);
assert.deepEqual(program().days.map(d=>d.selectedIds.join(',')),fourDayIds);

// Whole-week planning review is read-only and reflects CURRENT preview exercises,
// not a stale generated baseline. Intentional narrow splits receive *choices*, not edits.
const fullLibrary=w.allExercises();
const choose=(predicate,label)=>{
 const ex=fullLibrary.find(predicate);
 assert(ex,'Missing sample exercise: '+label);return ex.id;
};
const arm=choose(x=>w.exerciseMuscleMetadata(x).primary.includes('biceps'),'biceps');
const row=choose(x=>x.pattern==='horizontal_pull','horizontal pull');
const squatDay=choose(x=>x.pattern==='squat','squat');
const press=choose(x=>w.exerciseMuscleMetadata(x).primary.includes('chest')&&x.pattern==='horizontal_press','chest press');
const posterior=choose(x=>x.pattern==='hinge','hinge');
const fakeDay=(key,ids)=>({
 key,label:w.COACH_TARGET_GROUPS?.[key]?.label||key,
 selectedIds:[...ids],brainSetCounts:Object.fromEntries(ids.map(id=>[id,{sets:3}])),
 request:{goal:'hypertrophy',targetRegions:[],targetKeys:[],allowedEquipment:[],excludedEquipment:[],excludedExerciseIds:[],requiredExerciseIds:[]},defaults:w.coachProgrammingDefaults('hypertrophy',60)
});
const samplePlan={
 intent:{frequency:3,split:'custom',customSlots:['arms','back','legs']},
 request:{programFocusRegions:[]},
 days:[fakeDay('arms',[arm]),fakeDay('back',[row]),fakeDay('legs',[squatDay,posterior])]
};
const historyBefore=w.eval('JSON.stringify(state.sessions)');
const unbalanced=w.coachBrainProgramWeekReview(samplePlan);
assert.equal(unbalanced.roles.press,0);
assert(unbalanced.notes.some(n=>n.key==='movement_coverage'),JSON.stringify(unbalanced.notes));
assert(unbalanced.notes.some(n=>n.key==='chest_direct'));
assert.match(w.coachBrainProgramWeekReviewHtml(samplePlan),/no primary chest exercise/i);
const initialSlots=JSON.stringify(samplePlan.intent.customSlots);
samplePlan.days[0].selectedIds.push(press);
const afterAdded=w.coachBrainProgramWeekReview(samplePlan);
assert(afterAdded.roles.press>0,'manual preview change affects week audit immediately');
assert(!afterAdded.notes.some(n=>n.key==='chest_direct'));
assert(!afterAdded.notes.some(n=>n.key==='movement_coverage'&&n.text.includes('pressing')));
assert.equal(JSON.stringify(samplePlan.intent.customSlots),initialSlots,'audit never changes chosen split');
assert.equal(w.eval('JSON.stringify(state.sessions)'),historyBefore,'audit must not touch past workouts');
samplePlan.request.programFocusRegions=['calves'];
const focusGap=w.coachBrainProgramWeekReview(samplePlan);
assert(focusGap.notes.some(n=>n.key==='focus_gap'),'state absence is explained, not silently filled');
assert.equal(w.eval('JSON.stringify(state.sessions)'),historyBefore);
const regularPlan={
 intent:{frequency:3,split:'ppl'},
 request:{programFocusRegions:[]},
 days:[fakeDay('push',[press]),fakeDay('pull',[row]),fakeDay('legs',[squatDay,posterior])]
};
assert.equal(w.coachBrainProgramWeekReview(regularPlan).notes.length,0,'adequate major roles should not invent a warning');
startProgram('3-day push pull legs Monday Wednesday Friday 60 minutes at a full gym for muscle growth track only');
assert.match(modal,/WHOLE-WEEK REVIEW/,'rendered preview includes live whole-week analysis');


// v0.92: weekday-scoped instructions must not become global plan defaults.
const variedPrompt='3-day push pull legs, at a full gym, Monday 30 minutes, Wednesday 45 minutes, Friday 75 minutes, for muscle growth, track only';
const parsedDayIntent=w.coachParseProgramIntent(variedPrompt);
assert.equal(parsedDayIntent.weekdayPlans[1].duration,30);
assert.equal(parsedDayIntent.weekdayPlans[3].duration,45);
assert.equal(parsedDayIntent.weekdayPlans[5].duration,75);
const originalGetter=w.document.getElementById.bind(w.document);
w.document.getElementById=id=>id==='coachPrompt'?{value:variedPrompt}:originalGetter(id);
w.coachSubmitPrompt();
w.document.getElementById=originalGetter;
assert.equal(program().days.length,3,'complete day-level program should not require a fake shared time');
assert.equal(program().request.duration,0,'weekday 30 min cannot silently become the global program limit');
assert.deepEqual(Array.from(program().days.map(d=>d.request.duration)),[30,45,75]);
assert.match(modal,/settings vary by day/);
assert.match(modal,/Adjust day/);
assert.match(modal,/WHOLE-WEEK REVIEW/);
assert.equal(program().intent.trainingMode,'track');
assert.deepEqual(Array.from(program().intent.preferredDays),[1,3,5]);

// A partially specified week must ask how long unspecified sessions take.
const partialPrompt='3-day push pull legs, at a full gym, Monday 30 minutes, Wednesday 45 minutes, Friday flexible, for muscle growth';
w.document.getElementById=id=>id==='coachPrompt'?{value:partialPrompt}:originalGetter(id);
w.coachSubmitPrompt();w.document.getElementById=originalGetter;
assert.match(modal,/How much time do you have per workout/i);
assert.equal(program().request.duration,0);
w.coachAnswerProgramDuration(60);
assert.match(modal,/How would you like to track progression/);
w.coachAnswerProgramTrainingMode('track');
assert.deepEqual(Array.from(program().days.map(d=>d.request.duration)),[30,45,60]);

// Distinct equipment by weekday, with NO implied full-week machine access.
const scopedPrompt='3-day push pull legs Monday 30 minutes at the gym, Wednesday 45 minutes with dumbbells only, Friday 75 minutes at the gym, for muscle growth, track only';
w.document.getElementById=id=>id==='coachPrompt'?{value:scopedPrompt}:originalGetter(id);
w.coachSubmitPrompt();w.document.getElementById=originalGetter;
assert.equal(program().days.length,3);
assert.equal(program().request.brainEquipment,null,'equipment scoped to weekdays cannot be elevated to global gym access');
assert.equal(program().request.scopedEquipmentOnly,true);
assert.deepEqual(Array.from(program().days.map(d=>d.request.brainEquipment?.choice)),['gym','dumbbells','gym']);
assert.deepEqual(Array.from(program().days.map(d=>d.request.duration)),[30,45,75]);
assert(program().days[1].selectedIds.every(id=>w.coachBrainExerciseService().evaluateAvailability(id,w.coachBrainEquipmentConstraints(program().days[1].request)).status==='available'));
assert(program().days.every(d=>d.brainTime?.targetMinutes===d.request.duration),'each day needs its own correct time target');
// A 75-minute budget is an upper limit, not a request for two competing heavy
// lifts or volume padding. The generated hypertrophy Legs day should be sound.
const fridayEx=program().days[2].selectedIds.map(id=>w.exById(id)).filter(Boolean);
const fridayNames=fridayEx.map(ex=>ex.name);
assert(fridayEx.some(ex=>['squat','lunge','knee_extension'].includes(ex.pattern)),'Legs needs a knee-dominant option');
assert(fridayEx.some(ex=>['hinge','knee_flexion','hip_extension'].includes(ex.pattern)),'Legs needs posterior coverage');
assert(!(['Back Squat','Sumo Deadlift'].every(name=>fridayNames.includes(name))),
 'Generic 75-minute muscle-growth leg programming must not stack max-demand squat and sumo deadlift just to fill time');
assert(program().days[2].brainTime.estimateMinutes<=75,'budget is a cap, not a forced target');
// Explicitly requested heavy hinge remains eligible; quality heuristics are
// *preferences*, not prohibitions applied to a user-authored exercise choice.
const namedHeavy=w.allExercises().find(ex=>ex.name==='Sumo Deadlift');
assert(namedHeavy);
const legReq=program().days[2].request;
const scoredAuto=w.coachDynamicCandidateScore(namedHeavy,legReq,{}, {squat:1}, {}, {},7);
const scoredPinned=w.coachDynamicCandidateScore(namedHeavy,{...legReq,requiredExerciseIds:[namedHeavy.id]}, {}, {squat:1}, {}, {},7);
assert(scoredPinned>scoredAuto+150,'explicit deadlift request must bypass the generated-plan workload penalty');
console.log('COACH_V092_MIXED '+JSON.stringify({days:program().days.map(d=>({
 label:d.label,time:d.request.duration,estimate:d.brainTime?.estimateMinutes,
 range:[d.brainTime?.lowerMinutes,d.brainTime?.upperMinutes],
 equipment:d.request.brainEquipment?.label,
 exercises:d.selectedIds.map(id=>w.exById(id)?.name)
}))}));

// Once built, a single-weekday edit updates only that day and preserves the 3-day split.
const priorPlan=program().days.map(d=>d.selectedIds.join(','));
const originalPreferred=JSON.stringify(program().intent.preferredDays);
const mid=w.coachRefineProgramText('Wednesday 55 minutes');
assert.equal(mid.ok,true,JSON.stringify(mid));
assert.deepEqual(Array.from(program().days.map(d=>d.request.duration)),[30,55,75]);
assert.equal(JSON.stringify(program().intent.preferredDays),originalPreferred);
assert.equal(program().request.duration,0);
assert.equal(program().intent.frequency,3);
assert.equal(program().intent.split,'ppl');

// Each day has an accessible editor; simulate the save without changing any other day.
w.coachEditProgramDay(1);
assert.match(modal,/Time available for this workout/);
assert.match(modal,/Equipment available for this workout/);
assert.match(modal,/Extra emphasis on this day/);
assert.match(modal,/aria-label="Minutes for this workout"/);
const fields={
 coachDayMinutes:{value:'60'},coachDayEquipment:{value:'gym'},
 coachDayCustomEquipment:{value:''},coachDayFocus:{value:'back'}
};
w.document.getElementById=id=>fields[id]||originalGetter(id);
assert.equal(w.coachSaveProgramDaySettings(1),true);
w.document.getElementById=originalGetter;
assert.deepEqual(Array.from(program().days.map(d=>d.request.duration)),[30,60,75]);
assert.deepEqual(Array.from(program().days.map(d=>d.request.brainEquipment?.choice)),['gym','gym','gym']);
assert(program().days[1].request.priorityRegions.includes('lats'));
assert.equal(program().days[0].selectedIds.join(','),priorPlan[0]);
assert.equal(JSON.stringify(program().intent.preferredDays),originalPreferred);
// A later spoken weekday correction wins over the earlier editor time, but
// preserves the editor's equipment choice and muscle emphasis.
const newerDayTime=w.coachRefineProgramText('Wednesday 55 minutes');
assert.equal(newerDayTime.ok,true,newerDayTime.message);
assert.deepEqual(Array.from(program().days.map(d=>d.request.duration)),[30,55,75]);
assert.equal(program().days[1].request.brainEquipment?.choice,'gym');
assert(program().days[1].request.priorityRegions.includes('lats'));
assert.equal(w.coachRefineProgramText('Wednesday 60 minutes').ok,true);
assert.deepEqual(Array.from(program().days.map(d=>d.request.duration)),[30,60,75]);
assert.equal(JSON.stringify(program().intent.preferredDays),originalPreferred);

// Invalid custom equipment is rejected atomically; nothing is silently replaced.
const beforeInvalid=JSON.stringify(program().days.map(d=>({ids:d.selectedIds,duration:d.request.duration})));
const beforePrefs=JSON.stringify(program().intent.dayPlans);
w.document.getElementById=id=>({
 coachDayMinutes:{value:'40'},coachDayEquipment:{value:'custom'},
 coachDayCustomEquipment:{value:'quantum equipment'},coachDayFocus:{value:'none'}
}[id]||originalGetter(id));
assert.equal(w.coachSaveProgramDaySettings(0),false);
w.document.getElementById=originalGetter;
assert.equal(JSON.stringify(program().days.map(d=>({ids:d.selectedIds,duration:d.request.duration}))),beforeInvalid);
assert.equal(JSON.stringify(program().intent.dayPlans),beforePrefs);

// Weekday-only equipment must never be reset to unrestricted shared gear.
w.coachEditProgramDay(0);
assert.doesNotMatch(modal,/Use shared program equipment/);
const beforeInherited=JSON.stringify(program().days.map(d=>d.selectedIds));
w.document.getElementById=id=>({
 coachDayMinutes:{value:'75'},coachDayEquipment:{value:'inherit'},
 coachDayCustomEquipment:{value:''},coachDayFocus:{value:'none'}
}[id]||originalGetter(id));
assert.equal(w.coachSaveProgramDaySettings(0),false,'inheriting a nonexistent shared equipment list is unsafe');
w.document.getElementById=originalGetter;
assert.equal(JSON.stringify(program().days.map(d=>d.selectedIds)),beforeInherited);

// A day-specific priority outside its actual split must be clarified, not ignored.
const conflictPrompt='3-day push pull legs at a full gym, Monday 30 minutes, Wednesday 45 minutes, Friday 75 minutes more shoulders, for muscle growth, track only';
w.document.getElementById=id=>id==='coachPrompt'?{value:conflictPrompt}:originalGetter;
w.coachSubmitPrompt();w.document.getElementById=originalGetter;
assert.match(modal,/day emphasis conflicts with your chosen split/i);
assert.match(modal,/Coach won.t quietly ignore or relocate that priority/i);
assert.equal(program().days.length,0,'cannot silently generate after contradictory priority');
assert.equal(program().request.programFocusRegions.includes('side_delts'),false,'Friday focus must not be global');
w.coachClearProgramDayFocus(2);
assert.equal(program().days.length,3);
assert.equal(program().intent.dayPlans[2].focusKey,'none');
assert.equal(program().intent.split,'ppl');

// Saved programs retain day-specific intent as metadata, not history mutations.
const savedConflict=w.coachPersistGeneratedProgram();
assert.equal(savedConflict.frequency,3);
const scopedSaved=(()=>{ 
 // Use a freshly regenerated mixed-equipment draft for persistence proof.
 const request=w.coachParsePrompt(scopedPrompt,'hypertrophy'),intent=w.coachParseProgramIntent(scopedPrompt);
 request.duration=0;request.scopedEquipmentOnly=true;request.allowedEquipment=[];request.brainEquipment=null;
 w.coachGenerateProgram(request,intent,{interactiveBrainFlow:true,dayOverrides:[],intake:{}});
 const d=program();
 const changes={...d.intent,dayPlans:[{}, {duration:60,equipmentKey:'gym',focusKey:'back'}, {}]};
 w.coachGenerateProgram(d.request,changes,d);
 return w.coachPersistGeneratedProgram();
})();
assert.deepEqual(Array.from(scopedSaved.coachPlannedDays.map(d=>d.durationMinutes)),[30,60,75]);
assert.equal(scopedSaved.coachPlannedDays[1].focusKey,'back');
assert.equal(scopedSaved.trainingMode,'track');
assert.equal(w.eval('JSON.stringify(state.sessions)'),historyBefore);
// Explicit whole-week changes must supersede earlier per-day overrides.
const allTime=w.coachRefineProgramText('make every workout 50 minutes');
assert.equal(allTime.ok,true,allTime.message);
assert.deepEqual(Array.from(program().days.map(d=>d.request.duration)),[50,50,50]);
const allGear=w.coachRefineProgramText('use a full gym for every workout');
assert.equal(allGear.ok,true,allGear.message);
assert.deepEqual(Array.from(program().days.map(d=>d.request.brainEquipment?.choice)),['gym','gym','gym']);
assert.equal(program().intent.dayPlans[1].focusKey,'back','global duration/equipment changes do not erase day muscle priority');
assert.equal(w.eval('JSON.stringify(state.sessions)'),historyBefore);
// Preset gym access on a specific day must not re-enable explicitly banned barbells.
const noBarbellPrompt='3-day push pull legs Monday 50 minutes at the gym, Wednesday 50 minutes with dumbbells only, Friday 65 minutes at the gym, no barbells, for muscle growth, track only';
w.document.getElementById=id=>id==='coachPrompt'?{value:noBarbellPrompt}:originalGetter;
w.coachSubmitPrompt();w.document.getElementById=originalGetter;
assert.equal(program().days.length,3);
assert(program().days.every(day=>day.request.excludedEquipment.includes('barbell')));
assert(program().days.every(day=>day.selectedIds.every(id=>w.exById(id)?.equipment!=='barbell')),
 'per-day gym preset must respect the user\'s global barbell ban');
assert.equal(w.eval('JSON.stringify(state.sessions)'),historyBefore);

console.log('COACH_V092_DAILY '+JSON.stringify({durations:scopedSaved.coachPlannedDays.map(d=>d.durationMinutes),equipment:scopedSaved.coachPlannedDays.map(d=>d.equipmentLabel)}));

console.log('Brain duration + multi-turn + interactive program intake PASS',
 JSON.stringify({sampleMinutes:t1.estimateMinutes,programDays:3,historyUntouched:true,sourceExerciseCount:trio.length}));
dom.window.close();
// Mobile DOM acceptance is part of this existing Coach regression CI step.
await import('./coach-mobile-program-acceptance.mjs');
// Saved Program editing is another Coach integration gate.
await import('./coach-saved-program-edit-stress.mjs');
