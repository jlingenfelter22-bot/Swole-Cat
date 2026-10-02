import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const dom=new JSDOM(html,{
  runScripts:'dangerously',
  url:'https://swole-cat.test/',
  pretendToBeVisual:true,
  beforeParse(window){
    window.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
    window.alert=()=>{};
    window.confirm=()=>true;
    window.scrollTo=()=>{};
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
const historyBefore=JSON.stringify(state.sessions);
w.openRoutine(rid);
await wait(50);
state=read();

// Only one exercise and one set are foregrounded.
assert.equal(w.document.querySelectorAll('#workout .focus-exercise-canvas').length,1);
assert.equal(w.document.querySelectorAll('#workout .focus-set-card').length,1);
assert.equal(w.document.querySelectorAll('#workout .focus-nav-row').length,state.activeWorkout.exercises.length,'navigator should expose every exercise');

// Defer exercise 0 and verify it becomes Pending without becoming Skipped.
w.deferFocusedExercise();
state=read();
assert(state.activeWorkout.deferredExerciseIndexes.includes(0),'defer should record exercise zero as pending');
assert.equal(state.activeWorkout.exercises[0].skipped,false,'defer is not skip');
assert.equal(state.activeWorkout.focusExerciseIndex,1,'defer should move to next unfinished exercise');

// Finish should reconcile pending/unfinished work instead of silently saving.
w.finishWorkout();
await wait(30);
const modalText=w.document.body.textContent;
assert.match(modalText,/Unfinished workout/i,'finish should open unfinished-work review');
assert.match(modalText,/Do It Now/i,'unfinished review should offer Do It Now');
assert.match(modalText,/Skip Exercise/i,'unfinished review should offer explicit Skip');
assert.match(modalText,/Finish Anyway/i,'unfinished review should allow explicit incomplete save');

// Do It Now restores the pending exercise.
w.focusUnfinishedWorkoutExercise(0);
await wait(30);
state=read();
assert.equal(state.activeWorkout.focusExerciseIndex,0,'Do It Now should focus pending exercise');
assert(!state.activeWorkout.deferredExerciseIndexes.includes(0),'restored exercise should no longer be pending');

// Defer it again, then explicitly skip from the unfinished review.
w.deferFocusedExercise();
w.finishWorkout();
await wait(20);
w.skipUnfinishedWorkoutExercise(0);
state=read();
assert.equal(state.activeWorkout.exercises[0].skipped,true,'Skip Exercise should be explicit and session-only');
assert(!state.activeWorkout.deferredExerciseIndexes.includes(0),'skipped exercise should leave pending state');
w.closeModal();

// Set rail lets users return to completed/prior sets without rendering a stack.
const ei=state.activeWorkout.focusExerciseIndex;
const si=state.activeWorkout.focusSetIndex;
w.toggleSet(ei,si);w.stopRestTimer();
await wait(30);
state=read();
if(state.activeWorkout.focusExerciseIndex===ei){
  const rail=[...w.document.querySelectorAll('#workout .focus-set-pill')];
  assert(rail.length===state.activeWorkout.exercises[ei].sets.length,'set rail should represent every set');
  assert.equal(w.document.querySelectorAll('#workout .focus-set-card').length,1,'set progression should still render exactly one set card');
}

// Secondary controls stay available without being permanently expanded.
assert.equal(typeof w.openFocusedSetOptions,'function');
assert.equal(typeof w.openFocusedExerciseMore,'function');
assert.equal(typeof w.workoutNumberFocus,'function');
assert.equal(typeof w.bindWorkoutKeyboardAnchor,'function');

// Navigation cannot rewrite the saved routine or old history.
state=read();
assert.equal(JSON.stringify(state.routines.find(r=>r.id===rid)),routineBefore,'Focus Mode session navigation must preserve saved routine');
assert.equal(JSON.stringify(state.sessions),historyBefore,'Focus Mode session navigation must preserve completed history');

console.log('Swole Cat v0.65 Focus Mode PASS: single canvas, pending/defer vs skip, unfinished-work reconciliation, set rail, secondary controls, and data integrity');
dom.window.close();
