import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(window){
  window.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  window.alert=()=>{};window.confirm=()=>true;window.scrollTo=()=>{};
 }
});
const w=dom.window;
const wait=t=>new Promise(r=>setTimeout(r,t));
const read=()=>JSON.parse(w.localStorage.getItem('overload_v3'));
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
await wait(125);

assert.equal(w.exerciseLoadType('lib_32'),'assistance','assisted pull-up is a counterweight');
assert.equal(w.exerciseLoadType('lib_113'),'assistance','assisted chin-up is a counterweight');
assert.equal(w.exerciseLoadType('lib_233'),'assistance','assisted dip is a counterweight');
assert.equal(w.exerciseLoadType('lib_31'),'bodyweight','regular pull-up has no added load');
assert.equal(w.exerciseLoadType('lib_114'),'bodyweight','regular chin-up has no added load');
assert.equal(w.exerciseLoadType('lib_116'),'external','weighted pull-up logs added resistance');
assert.equal(w.exerciseLoadType('lib_117'),'external','weighted chin-up logs added resistance');
assert.equal(w.exerciseLoadType('lib_31',{loadType:'assistance'}),'assistance','explicit routine override works');

const config={
 sets:3,minReps:8,maxReps:12,increment:5,mode:'double',routineMode:'guided',
 trainingGoal:'general',adaptiveProgression:false,programGuided:true
};
const prev=(weight,reps,n=3)=>({sets:Array.from({length:n},()=>({
 done:true,type:'working',weight,reps,rir:2,pr:''
}))});
const guided=(id,weight,reps,n=3)=>w.buildRecommendation(config,prev(weight,reps,n),id);
let rec=guided('lib_32',64,9);
assert.equal(rec.status,'reps');
assert.deepEqual(Array.from(rec.targetReps),[10,10,10]);
assert.deepEqual(Array.from(rec.weights),[64,64,64]);
rec=guided('lib_32',64,12);
assert.equal(rec.status,'load');
assert.equal(rec.weight,59,'meeting all targets should decrease assistance');
assert.match(rec.headline,/Reduce assistance/);
assert.equal(guided('lib_32',24,12).weight,19);
assert.equal(guided('lib_32',3,12).weight,0,'do not allow negative assistance');
assert.equal(guided('lib_32',0,12).status,'hold','zero assistance cannot be reduced further');
assert.notEqual(guided('lib_32',64,12,2).status,'load','all sets must qualify');
assert.deepEqual(Array.from(w.buildRecommendation({...config,mode:'total'},prev(64,9),'lib_32').targetReps),[10,9,9],'assisted total-rep strategy advances the total, not every set');
assert.equal(w.buildRecommendation({...config,routineMode:'strength'},prev(64,8),'lib_32').weight,59,'Strength Focus also decreases machine assistance');
assert.equal(w.buildRecommendation({...config,routineMode:'track'},prev(64,12),'lib_32').status,'track','Track Only never forces progression');

rec=guided('lib_31',0,8);
assert.equal(rec.status,'reps');
assert.deepEqual(Array.from(rec.targetReps),[9,9,9]);
assert.deepEqual(Array.from(rec.weights),[0,0,0]);
assert.deepEqual(Array.from(w.buildRecommendation({...config,mode:'total'},prev(0,9),'lib_31').targetReps),[10,9,9],'bodyweight total-rep strategy remains intact');
rec=guided('lib_31',0,12);
assert.equal(rec.status,'hold','full bodyweight rep range should not invent an external load');
assert.equal(rec.weight,0);
rec=guided('lib_116',50,12);
assert.equal(rec.status,'load');
assert.equal(rec.weight,55,'weighted pull-up should increase added load');
assert.equal(guided('lib_116',20,12).status,'hold','oversized jump safeguards remain on for weighted pull-ups');

const pr=(weight,reps)=>({type:'working',done:true,weight,reps});
assert.match(w.loadAwarePR([pr(64,10)],pr(59,10),'lib_32'),/Less assistance PR/);
assert.equal(w.loadAwarePR([pr(64,10)],pr(69,10),'lib_32'),'','more assistance is not a heavier-load PR');
assert.equal(w.loadAwarePR([pr(64,10)],pr(59,6),'lib_32'),'','fewer reps at less assistance alone does not prove a PR');
assert.match(w.loadAwarePR([pr(64,10)],pr(64,11),'lib_32'),/Rep PR/);
assert.match(w.loadAwarePR([pr(0,8)],pr(0,9),'lib_31'),/Bodyweight rep PR/);
assert.match(w.loadAwarePR([pr(50,10)],pr(55,8),'lib_116'),/Load PR/);

// Exercise-specific presentation and routine override.
w.installRegressionFixturePlan();
await wait(30);
let st=read(),rid=st.routines[0].id;
w.eval('state.sessions=[];state.routines[0].exercises[0].exerciseId="lib_31";'+
 'state.routines[0].exercises[0].mode="double";'+
 'state.routines[0].exercises[0].adaptiveProgression=false;'+
 'state.routines[0].exercises[0].loadType="auto";'+
 'state.routines[0].exercises[0].autoWarmup=false;save()');
w.openRoutine(rid);
await wait(60);
st=read();
assert.equal(st.activeWorkout.exercises[0].exerciseId,'lib_31');
assert.equal(st.activeWorkout.exercises[0].sets[0].weight,0);
assert.match(w.document.getElementById('workoutArea')?.textContent||'',/Bodyweight · reps only/);
assert.equal(w.document.querySelectorAll('#workout .focus-set-card input[aria-label="weight"]').length,0,'bodyweight set should not ask for weight');
w.eval('state.activeWorkout=null;save()');

// Explicit custom behavior on a selected exercise stays in the routine and share.
w.eval('state.routines[0].exercises[0].exerciseId="lib_32";save()');
w.editRoutineExerciseSettings(rid,0);
assert(w.document.getElementById('reLoadType'),'routine exposes loading behavior');
assert.equal(w.document.getElementById('reLoadType').value,'auto');
w.document.getElementById('reLoadType').value='assistance';
w.saveRoutineExerciseSettings(rid,0);
st=read();
assert.equal(st.routines[0].exercises[0].loadType,'assistance');
const share=w.decodeSwoleCatShare(w.createRoutineShareCode(rid));
assert.equal(share.routine.exercises[0].loadType,'assistance');
assert.equal(w.buildSharedPlanImport(share).routines[0].exercises[0].loadType,'assistance');
w.openRoutine(rid);
await wait(55);
assert.match(w.document.getElementById('workoutArea')?.textContent||'',/Assistance/);
assert.equal(w.document.querySelectorAll('#workout .focus-set-card input[aria-label="weight"]').length,1,'assistance still needs numeric counterweight input');
assert.match(w.document.querySelector('#workout .focus-set-card label')?.textContent||'',/Assistance/);
w.swapWorkoutExercise(0,'lib_31',false);
await wait(45);
st=read();
assert.equal(st.activeWorkout.exercises[0].config.loadType,'auto','substitutions must reset old assistance overrides');
assert.equal(w.document.querySelectorAll('#workout .focus-set-card input[aria-label="weight"]').length,0,'substitute to regular pull-up becomes reps only');
w.swapWorkoutExercise(0,'lib_116',true);
await wait(45);
st=read();
assert.equal(st.routines[0].exercises[0].exerciseId,'lib_116','permanent substitution saves selected weighted variation');
assert.equal(st.routines[0].exercises[0].loadType,'auto','saved substitution must clear stale assisted override');
assert.equal(w.document.querySelectorAll('#workout .focus-set-card input[aria-label="weight"]').length,1,'weighted pull-up must expose added resistance');


// Completed workouts are factual; assisted counterweight is not external-load volume
// or estimated-1RM data. Historical PR re-evaluation uses direction-aware rules.
w.eval('state.activeWorkout=null;state.sessions=['+
 JSON.stringify({
  id:'assist_previous',routineName:'Assisted',date:new Date(Date.now()-86400000).toISOString(),
  status:'finished',exercises:[{exerciseId:'lib_32',config:{loadType:'assistance'},sets:[pr(64,10)]}]
 })+','+
 JSON.stringify({
  id:'assist_current',routineName:'Assisted',date:new Date().toISOString(),
  status:'finished',exercises:[{exerciseId:'lib_32',config:{loadType:'assistance'},sets:[pr(59,10)]}]
 })+'];rebuildAllPRs();save()');
st=read();
assert.match(st.sessions[1].exercises[0].sets[0].pr,/Less assistance PR/);
assert.equal(w.sessionVolume(st.sessions[0]),0,'assistance counterweight must not count as resistance volume');
assert.equal(w.exerciseMetrics('lib_32').bestE1,0,'assistance weight must not produce a false strength estimate');
assert.equal(w.exerciseMetrics('lib_32').bestAssistance,59);
w.openExerciseProgress('lib_32');
assert.match(w.document.getElementById('modalBody')?.textContent||'',/Least assistance/);
assert.doesNotMatch(w.document.getElementById('modalBody')?.textContent||'',/Estimated strength/);
console.log('PASS: assistance decreases; bodyweight reps only; weighted loads increase; PRs, history, UI, sharing, and progression are load-aware');
dom.window.close();
