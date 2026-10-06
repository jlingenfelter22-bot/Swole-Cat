import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const scrollCalls=[];
const dom=new JSDOM(html,{
  runScripts:'dangerously',
  url:'https://swole-cat.test/',
  pretendToBeVisual:true,
  beforeParse(window){
    window.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
    window.alert=()=>{};
    window.confirm=()=>true;
    window.scrollTo=arg=>scrollCalls.push(arg);
  }
});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const read=()=>JSON.parse(dom.window.localStorage.getItem('overload_v3'));

await wait(100);
const w=dom.window;
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};

w.installRegressionFixturePlan();
let state=read();
const rid=state.routines[0].id;
const routineBefore=JSON.stringify(state.routines.find(r=>r.id===rid));
const sessionsBefore=JSON.stringify(state.sessions);

w.openRoutine(rid);
await wait(50);
state=read();
assert(state.activeWorkout,'fixture workout should start');
assert(state.activeWorkout.exercises.length>=4,'beta-flow regression needs a multi-exercise workout');
assert.equal(state.activeWorkout.focusExerciseIndex,0,'fresh workout should focus exercise one');
assert.equal(state.activeWorkout.focusSetIndex,0,'fresh workout should focus set one');

assert.equal(w.document.querySelector('#workout .workout-cancel-btn'),null,'destructive Cancel should not occupy the normal workout surface');
assert(w.document.querySelector('#workout .focus-session-strip'),'active workout should use the compact session strip');

function focusState(){
  return w.eval('({ei:state.activeWorkout.focusExerciseIndex,si:state.activeWorkout.focusSetIndex})');
}
function assertFocus(ei,si,label){
  const focus=focusState();
  assert.equal(focus.ei,ei,label+' exercise focus');
  assert.equal(focus.si,si,label+' set focus');
  assert.equal(w.document.querySelectorAll('#workout .focus-exercise-canvas').length,1,label+' should render one exercise canvas');
  assert.equal(w.document.querySelectorAll('#workout .focus-set-card').length,1,label+' should render one primary set card');
  const nav=w.document.querySelector('#workout .focus-exercise-nav');
  assert(nav,label+' should render exercise navigator');
  const ex=w.eval('state.activeWorkout.exercises')[ei];
  const name=w.exById(ex.exerciseId)?.name||'Exercise';
  assert(nav.textContent.toLowerCase().includes(name.toLowerCase()),label+' navigator should identify focused exercise');
  const setCard=w.document.querySelector('#workout .focus-set-card');
  assert.equal(Number(setCard?.dataset.setIndex),si,label+' primary card should match focused set');
  assert(w.document.querySelector('#workout .focus-set-rail'),label+' should retain compact access to all sets');
}

assertFocus(0,0,'initial');
assert.equal(w.document.getElementById('activeExerciseDock'),null,'retired scroll-era Now Training dock should not render');

// Set 1 -> Set 2 in the same physical Focus Mode canvas.
scrollCalls.length=0;
w.toggleSet(0,0);w.stopRestTimer();
await wait(60);
state=read();
assert.equal(state.activeWorkout.exercises[0].sets[0].done,true,'set one should log complete');
assertFocus(0,1,'after set one');
assert.equal(scrollCalls.length,0,'normal set advancement should not require scroll navigation');

// Finish the remaining sets of exercise one. The canvas should become exercise two.
for(;;){
  state=read();
  if(w.exerciseSetProgress(state.activeWorkout.exercises[0]).complete)break;
  const si=state.activeWorkout.focusSetIndex;
  w.toggleSet(0,si);w.stopRestTimer();
}
await wait(70);
state=read();
assert.equal(w.exerciseSetProgress(state.activeWorkout.exercises[0]).complete,true,'exercise one should complete');
assert.equal(state.activeWorkout.focusExerciseIndex,1,'completed exercise should advance to exercise two');
assertFocus(1,state.activeWorkout.focusSetIndex,'after exercise one');

// Manual Next defers, it does not skip.
const deferredIndex=state.activeWorkout.focusExerciseIndex;
const deferredName=w.exById(state.activeWorkout.exercises[deferredIndex].exerciseId)?.name||'Exercise';
w.deferFocusedExercise();
await wait(40);
state=read();
assert.notEqual(state.activeWorkout.focusExerciseIndex,deferredIndex,'Next Exercise should advance focus');
assert(state.activeWorkout.deferredExerciseIndexes.includes(deferredIndex),'unfinished exercise should become pending');
assert.equal(state.activeWorkout.exercises[deferredIndex].skipped,false,'defer must not mark exercise skipped');
assert(w.document.querySelector('#workout .focus-nav-row.pending'),'navigator should expose pending state');

// Jumping directly back removes Pending and restores the exact movement.
w.selectWorkoutExercise(deferredIndex);
await wait(40);
state=read();
assert.equal(state.activeWorkout.focusExerciseIndex,deferredIndex,'navigator jump should restore deferred exercise');
assert(!state.activeWorkout.deferredExerciseIndexes.includes(deferredIndex),'restored exercise should leave pending list');
assert(w.document.querySelector('#workout .focus-exercise-actions'),'focused exercise should expose gym-first actions');
const visibleActions=[...w.document.querySelectorAll('#workout .focus-exercise-actions button')].map(b=>b.textContent.trim());
assert(visibleActions.some(x=>/Substitute/i.test(x)),'Substitute should stay directly visible');
assert(visibleActions.some(x=>/More/i.test(x)),'More should stay directly visible');
assert(!visibleActions.some(x=>/Next Exercise/i.test(x)),'redundant Next Exercise should not occupy the normal workout surface');
assert(w.document.querySelector('#workout .focus-nav-add'),'exercise switcher should own Add Exercise');
assert(w.document.querySelector('#workout .focus-set-add'),'set rail should own Add Set');

state=read();
assert.equal(JSON.stringify(state.sessions),sessionsBefore,'Focus Mode navigation must not mutate completed history');
assert.equal(JSON.stringify(state.routines.find(r=>r.id===rid)),routineBefore,'Focus Mode navigation must not rewrite saved routine');
assert(state.activeWorkout,'workout should remain active throughout navigation');

console.log('Swole Cat live workout flow PASS: compact session chrome, automatic exercise advance, switcher navigation, set rail actions, pending/defer integrity, and history integrity');
dom.window.close();
