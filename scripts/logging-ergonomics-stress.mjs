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
const w=dom.window,wait=t=>new Promise(resolve=>setTimeout(resolve,t)),read=()=>JSON.parse(w.localStorage.getItem('overload_v3'));
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
await wait(130);w.installRegressionFixturePlan();await wait(50);
let st=read(),rid=st.routines[0].id;
w.eval('state.activeWorkout=null;state.sessions=[];state.routines[0].exercises=[exerciseDefaultRoutineConfig("lib_307")];save()');
w.startRoutineFresh(rid);await wait(45);
st=read();
assert.equal(st.activeWorkout.exercises[0].sets[0].durationSeconds,0,'actual hold starts blank');
assert.equal(st.activeWorkout.exercises[0].sets[0].metricRecorded,false);
assert.match(w.document.querySelector('#workout .set-target')?.textContent||'',/20 sec/,'suggested goal is separate');
assert.equal(w.document.querySelector('input[aria-label="durationSeconds"]')?.value,'','timed actual input is visibly blank');
assert(!w.document.querySelector('#workout .focus-set-card input[aria-label="weight"]'),'bodyweight holds have no zero-weight field');
assert(!w.document.querySelector('#workout .focus-set-card input[aria-label="reps"]'),'timed holds have no rep field');
w.toggleSet(0,0);await wait(25);
assert.equal(read().activeWorkout.exercises[0].sets[0].done,false,'untouched suggested time cannot complete set');
assert.match(w.document.querySelector('#workout .hold-timer-action')?.textContent||'',/Start hold/);
w.toggleWorkoutHoldTimer(0,0);await wait(35);
assert.match(w.document.querySelector('#workout .hold-timer-action')?.textContent||'',/Stop/);
w.eval('workoutHoldClock.startedAt -= 6200');
w.toggleWorkoutHoldTimer(0,0);await wait(35);
st=read();
assert(st.activeWorkout.exercises[0].sets[0].durationSeconds>=6,'stopwatch writes measured elapsed time');
assert.equal(st.activeWorkout.exercises[0].sets[0].done,false,'stopwatch does not auto-complete set');
assert.equal(st.activeWorkout.exercises[0].sets[0].metricRecorded,true);
w.toggleSet(0,0);await wait(45);
st=read();
assert.equal(st.activeWorkout.exercises[0].sets[0].done,true);
assert.match(w.document.querySelector('#workout .focus-set-today')?.textContent||'',/Last set today:/,'completed hold is identified as same-session history');
assert(w.document.querySelector('#workout .repeat-previous-set'),'repeat previous set button appears');
w.repeatPreviousWorkoutSet(0,1);await wait(25);
st=read();
assert.equal(st.activeWorkout.exercises[0].sets[1].durationSeconds,st.activeWorkout.exercises[0].sets[0].durationSeconds,'repeat copies real logged seconds');
assert.equal(st.activeWorkout.exercises[0].sets[1].done,false,'repeat does not complete set');
assert.match(w.document.querySelector('#workout .focus-set-card input[aria-label="durationSeconds"]')?.value||'',/6/');
w.setWorkoutFocus(0,2);await wait(25);
w.toggleWorkoutHoldTimer(0,2);
w.eval('workoutHoldClock.startedAt -= 3600');
w.pauseActiveWorkout();await wait(40);
st=read();
assert(st.activeWorkout.exercises[0].sets[2].durationSeconds>=3,'pause persists elapsed real hold');
assert.equal(st.activeWorkout.exercises[0].sets[2].done,false,'pause never completes the unfinished hold');
assert(!w.eval('workoutHoldClock'),'no hold clock continues running while paused');
w.eval('state.activeWorkout=null;save()');

w.eval('state.routines[0].exercises=[exerciseDefaultRoutineConfig("lib_258")];save()');
w.startRoutineFresh(rid);await wait(35);
st=read();
assert.equal(st.activeWorkout.exercises[0].sets[0].distanceMeters,0,'carry actual starts blank');
assert.equal(st.activeWorkout.exercises[0].sets[0].weight,0,'unlogged carry weight is blank');
assert.equal(st.activeWorkout.exercises[0].sets[0].weightEntered,false);
assert.match(w.document.querySelector('#workout .set-target')?.textContent||'',/30 ft/,'friendly imperial carry distance preset');
assert.match(w.document.querySelector('#workout label')?.textContent||'',/Weight per hand|Target/);
const entries=w.document.querySelector('#workout .live-entry');
assert(entries?.classList.contains('is-metric')&&entries.classList.contains('is-loaded'),'loaded carry uses responsive stacked layout');
assert.equal(w.document.querySelector('#workout input[aria-label="distanceMeters"]')?.value,'','carry actual distance visibly blank');
w.toggleSet(0,0);assert.equal(read().activeWorkout.exercises[0].sets[0].done,false,'unrecorded carry cannot complete');
w.updateSet(0,0,'distanceMeters','40');w.toggleSet(0,0);
assert.equal(read().activeWorkout.exercises[0].sets[0].done,false,'carry requires explicit load entry');
w.updateSet(0,0,'weight','25');w.toggleSet(0,0);await wait(35);
st=read();
assert.equal(st.activeWorkout.exercises[0].sets[0].done,true);
assert(Math.abs(st.activeWorkout.exercises[0].sets[0].distanceMeters-12.192)<.02);
assert.match(w.document.querySelector('#workout .focus-set-today')?.textContent||'',/Last set today/);
w.repeatPreviousWorkoutSet(0,1);await wait(35);
st=read();
assert.equal(st.activeWorkout.exercises[0].sets[1].weight,25);
assert(Math.abs(st.activeWorkout.exercises[0].sets[1].distanceMeters-12.192)<.02);
assert.equal(st.activeWorkout.exercises[0].sets[1].weightEntered,true);

const loadedCarry=st.activeWorkout.exercises[0];
const session={id:'mixed-metrics',routineName:'Mixed training',date:new Date().toISOString(),
 status:'finished',exercises:[
  {exerciseId:'lib_31',config:{loadType:'bodyweight',measurementType:'reps'},sets:[{done:true,type:'working',weight:0,reps:10,rir:'',pr:''}]},
  {exerciseId:'lib_307',config:{loadType:'bodyweight',measurementType:'duration'},sets:[{done:true,type:'working',weight:0,reps:0,durationSeconds:35,rir:'',pr:''}]},
  {exerciseId:'lib_258',config:{loadType:'external',measurementType:'distance'},sets:[{done:true,type:'working',weight:25,weightEntered:true,reps:0,distanceMeters:12.192,rir:'',pr:''}]}
 ]};
const recap=w.workoutRecapHtml(session);
assert.match(recap,/Repetitions/,'repetitions have their own summary card');
assert.match(recap,/Hold seconds/,'timed holds have their own summary card');
assert.match(recap,/Distance \(ft\)/,'carries have their own summary card');
assert.match(recap,/Weight per hand/,'carry load meaning is explicit in recap');
assert.doesNotMatch(recap,/not meaningful for this session based on the logged weights/,'dismissive old volume message removed');
w.eval('state.activeWorkout=null;save()');

// Keyboard input hides the floating rest timer rather than covering the controls.
w.startRoutineFresh(rid);await wait(35);
w.eval('startRestTimer(95)');
const weightField=w.document.querySelector('#workout .focus-set-card input[aria-label="weight"]');
weightField.dispatchEvent(new w.FocusEvent('focusin',{bubbles:true}));
assert(w.document.documentElement.classList.contains('workout-keyboard-active'),'keyboard-focus state is visible to CSS');
weightField.dispatchEvent(new w.FocusEvent('focusout',{bubbles:true}));
await wait(110);
assert(!w.document.documentElement.classList.contains('workout-keyboard-active'),'keyboard-focus state clears');
w.eval('stopRestTimer();state.activeWorkout=null;save()');
console.log('PASS v0.85: blank real measurements, stopwatch, repeat previous set, carry validation, stacked UI, keyboard rest dock, natural feet, and mixed recap.');
dom.window.close();
