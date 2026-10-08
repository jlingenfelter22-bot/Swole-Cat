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
const w=dom.window,wait=t=>new Promise(r=>setTimeout(r,t));
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
await wait(120);
w.installRegressionFixturePlan();
await wait(35);
const read=()=>JSON.parse(w.localStorage.getItem('overload_v3'));
const total=w.exerciseCatalog().list.filter(e=>!e.custom);
assert.equal(total.length,308,'308 built-in exercises including Dead Hang');
for(const ex of total){
 const m=w.exerciseMovementProfile(ex.id);
 assert(['duration','distance','reps'].includes(m.measurement),'catalog exercise has safe measurement');
 assert(['bodyweight','assistance','external'].includes(m.loadType),'catalog exercise has load semantics');
 assert(m.min>0&&m.max>=m.min,'catalog has usable measurement bounds');
}
assert.equal(w.exerciseMeasurementType('lib_307'),'duration','Dead Hang is seconds');
assert.equal(w.exerciseMeasurementType('lib_57'),'duration','Plank is seconds');
assert.equal(w.exerciseMeasurementType('lib_275'),'duration','RKC Plank is seconds');
assert.equal(w.exerciseMeasurementType('lib_258'),'distance','Dumbbell Farmer Carry is distance');
assert.equal(w.exerciseMeasurementType('lib_174'),'distance','Sled Push is distance');
assert.equal(w.exerciseMeasurementType('lib_31'),'reps','Pull-Up remains reps');
assert.deepEqual(Array.from(w.exerciseMovementProfile('lib_0',null,'strength').suggestedReps),[3,6],'bench strength defaults');
assert.deepEqual(Array.from(w.exerciseMovementProfile('lib_37',null,'hypertrophy').suggestedReps),[12,20],'lateral raise hypertrophy defaults');
assert.equal(w.exerciseDefaultRoutineConfig('lib_37',{defaultMin:8,defaultMax:12,defaultSets:3,defaultIncrement:5}).minReps,12);
assert.equal(w.exerciseDefaultRoutineConfig('lib_0',{defaultMin:15,defaultMax:20,defaultSets:3,defaultIncrement:5}).maxReps,20,'custom global rep defaults honored');

let st=read(),rid=st.routines[0].id;
w.eval('state.routines[0].exercises=[exerciseDefaultRoutineConfig("lib_307")];state.routines[0].trainingMode="guided";state.activeWorkout=null;state.sessions=[];save()');
w.startRoutineFresh(rid);await wait(45);
st=read();
assert.equal(st.activeWorkout.exercises[0].sets[0].reps,0,'timed hold must not fabricate repetitions');
assert.equal(st.activeWorkout.exercises[0].sets[0].durationSeconds,20);
assert(w.document.querySelector('#workout input[aria-label="durationSeconds"]'),'hold shows seconds input');
assert(!w.document.querySelector('#workout input[aria-label="reps"]'),'hold must not show reps input');
assert(!w.document.querySelector('#workout input[aria-label="weight"]'),'bodyweight hold must not show weight');
w.updateSet(0,0,'durationSeconds','35');
w.toggleSet(0,0);await wait(30);
st=read();assert.equal(st.activeWorkout.exercises[0].sets[0].durationSeconds,35);
assert.equal(st.activeWorkout.exercises[0].sets[0].done,true);
w.finalizeWorkout(false);await wait(45);
st=read();const holdSession=st.sessions.at(-1);
assert.equal(holdSession.exercises[0].sets[0].durationSeconds,35,'seconds persist to immutable session');
assert.equal(w.sessionVolume(holdSession),0,'timed bodyweight does not invent external volume');
assert.match(w.workoutRecapHtml(holdSession),/35 sec/,'recap displays seconds');
assert.doesNotMatch(w.workoutRecapHtml(holdSession),/0 total reps/,'recap must not call timed hold zero reps');
w.openExerciseProgress('lib_307');
assert.match(w.document.getElementById('modalBody').textContent,/Best hold|hold time/i,'hold progress chart is time-based');
w.startRoutineFresh(rid);await wait(30);
st=read();
assert.equal(st.activeWorkout.exercises[0].sets[0].durationSeconds,40,'next hold target adds seconds');
w.eval('state.activeWorkout=null;save()');

w.eval('state.routines[0].exercises=[exerciseDefaultRoutineConfig("lib_258")];save()');
w.startRoutineFresh(rid);await wait(35);
st=read();
assert.equal(st.activeWorkout.exercises[0].sets[0].distanceMeters,10);
assert.equal(st.activeWorkout.exercises[0].sets[0].reps,0,'farmer carry must not create fake rep target');
assert(w.document.querySelector('#workout input[aria-label="distanceMeters"]'),'carry shows distance');
assert(w.document.querySelector('#workout input[aria-label="weight"]'),'loaded carry still shows load');
w.updateSet(0,0,'distanceMeters','100');
w.updateSet(0,0,'weight','40');
w.toggleSet(0,0);await wait(30);
st=read();assert(Math.abs(st.activeWorkout.exercises[0].sets[0].distanceMeters-30.48)<.002,'100 ft is stored as meters');
w.finalizeWorkout(false);await wait(30);
st=read();const carry=st.sessions.at(-1);
assert.match(w.workoutRecapHtml(carry),/100 ft/,'carry recap displays user distance units');
assert.equal(w.sessionVolume(carry),0,'carry distance not mistaken for weight times reps');
assert.match(w.workoutRecapHtml(carry),/Distance|ft/);
assert.equal(w.exerciseMetrics('lib_258').bestE1,0,'no false estimated 1RM for carry');

w.eval('state.activeWorkout=null;save()');
w.eval('state.routines[0].exercises=[exerciseDefaultRoutineConfig("lib_57")];save()');
const legacy={id:'old-plank-legacy',routineId:rid,routineName:'Legacy plank',
 date:new Date(Date.now()-86400000).toISOString(),status:'finished',
 exercises:[{exerciseId:'lib_57',sets:[{weight:0,reps:10,done:true,type:'working',rir:'',pr:''}]}]};
w.eval('state.sessions.push('+JSON.stringify(legacy)+');rebuildAllPRs();save()');
st=read();
const old=st.sessions.find(x=>x.id==='old-plank-legacy');
assert.equal(old.exercises[0].sets[0].reps,10,'legacy rep data retained');
assert.equal(w.loggedExerciseMeasurement(old.exercises[0]),'reps','legacy reps are not silently seconds');
w.editCompletedWorkout('old-plank-legacy');
assert(w.document.getElementById('sessReps-0-0'),'legacy edit retains reps field');
assert(!w.document.getElementById('sessMetric-0-0'),'legacy edit must not silently reinterpret to seconds');
w.eval('sessionEditDraft=null;closeModal()');

const routineCode=w.createRoutineShareCode(rid),share=w.decodeSwoleCatShare(routineCode);
assert.equal(share.routine.exercises[0].measurementType,'auto');
assert.equal(share.routine.exercises[0].minDurationSeconds,20);
assert.equal(w.buildSharedPlanImport(share).routines[0].exercises[0].minDurationSeconds,20);

w.startRoutineFresh(rid);await wait(35);
w.swapWorkoutExercise(0,'lib_31',false);await wait(35);
assert(w.document.querySelector('#workout input[aria-label="reps"]'),'substituting to pull-ups restores reps');
assert(!w.document.querySelector('#workout input[aria-label="durationSeconds"]'),'no dead hang time leaks to pullups');
w.swapWorkoutExercise(0,'lib_307',false);await wait(35);
assert(w.document.querySelector('#workout input[aria-label="durationSeconds"]'),'substituting back restores timed input');
w.eval('state.activeWorkout=null;save()');

const cfg={...w.exerciseDefaultRoutineConfig('lib_307'),routineMode:'track',trainingGoal:'general'};
const oldSet={exerciseId:'lib_307',sets:[{weight:0,reps:0,durationSeconds:35,done:true,type:'working'}]};
const track=w.buildRecommendation(cfg,oldSet,'lib_307');
assert.equal(track.status,'track','Track Only never forces time progression');
assert.equal(track.targetValues[0],35);
assert.match(w.loadAwarePR([{weight:0,reps:0,durationSeconds:35}],{weight:0,reps:0,durationSeconds:40},'lib_307'),/Hold time PR/);
assert.match(w.loadAwarePR([{weight:40,reps:0,distanceMeters:10}],{weight:40,reps:0,distanceMeters:12},'lib_258'),/Distance PR/);

console.log('PASS: 308 profiles, real seconds/distance, UI, progression, history, legacy reps, sharing, Track Only, substitutions and metric records.');
dom.window.close();
