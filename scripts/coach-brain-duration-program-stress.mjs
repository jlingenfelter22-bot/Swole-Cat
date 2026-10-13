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

// Interactive program: frequency, then time, then equipment, exactly what was missing.
startProgram('build me a workout program');
assert.match(modal,/How many days per week/);
w.coachAnswerProgramFrequency(3);
assert.match(modal,/How much time per workout/);
w.coachAnswerProgramDuration(45);
assert.match(modal,/What equipment do you have for these workouts/);
w.coachAnswerProgramBrainEquipment('gym');
assert.equal(program().intent.frequency,3);
assert.equal(program().request.duration,45);
assert.equal(program().request.brainEquipment.choice,'gym');
assert.equal(program().days.length,3);
assert(program().days.every(d=>d.selectedIds.length>0&&d.brainTime?.estimateMinutes>0));
assert.match(modal,/PROGRAM BUILD/);
assert.match(modal,/about \d+ min/);

// Program with known details must not re-ask what was provided in the prompt.
startProgram('3-day full body program, 45 minutes, dumbbells only');
assert(!/What equipment do you have for these workouts/.test(modal));
assert(!/How much time per workout/.test(modal));
assert(program()?.days?.length===3);

// Multi-clause program followup should preserve original equipment answers.
startProgram('3-day upper lower plan');
assert.match(modal,/How much time per workout/);
w.coachAnswerProgramDuration(60);
w.coachAnswerProgramBrainEquipment('gym');
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

// Program dialog must ask equipment anew for a new vague program.
startProgram('4-day workout plan 45 minutes');
assert.match(modal,/What equipment do you have for these workouts/);

console.log('Brain duration + multi-turn + interactive program intake PASS',
 JSON.stringify({sampleMinutes:t1.estimateMinutes,programDays:3,historyUntouched:true,sourceExerciseCount:trio.length}));
dom.window.close();
