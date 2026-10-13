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

console.log('Brain duration + multi-turn + interactive program intake PASS',
 JSON.stringify({sampleMinutes:t1.estimateMinutes,programDays:3,historyUntouched:true,sourceExerciseCount:trio.length}));
dom.window.close();
