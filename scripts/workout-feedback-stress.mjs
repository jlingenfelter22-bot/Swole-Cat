import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const css=fs.readFileSync('src/styles/03-polish.css','utf8');
const engine=fs.readFileSync('src/js/06-workout-engine.js','utf8');
const core=fs.readFileSync('src/js/01-core-runtime.js','utf8');

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

await wait(120);
const w=dom.window;
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
w.installRegressionFixturePlan();

let state=read();
const rid=state.routines[0].id;
w.openRoutine(rid);
await wait(50);
state=read();

assert.equal(state.activeWorkout.structureNoticeSeen,false,'fresh workouts should not begin with the structure notice consumed');
assert.equal(w.document.querySelector('#workout .workout-structure-note'),null,'persistent structure warning must stay retired');

// First structural change: toast overlays without taking workout layout space.
const initialWorking=w.workingSetIndexes(state.activeWorkout.exercises[0]).length;
w.addWorkoutSet(0,'working');
await wait(30);
state=read();
assert.equal(w.workingSetIndexes(state.activeWorkout.exercises[0]).length,initialWorking+1,'working set should still be added normally');
assert.equal(state.activeWorkout.structureDirty,true,'working-set change must retain structureDirty safety');
assert.equal(state.activeWorkout.structureNoticeSeen,true,'first structural edit should consume the one-time notice');
const notice=w.document.getElementById('workoutStructureNotice');
assert(notice,'first structural edit should render the floating structure notice');
assert.match(notice.textContent,/Workout modified/i);
assert.match(notice.textContent,/saved routine stays unchanged/i);
assert.equal(w.document.querySelector('#workout .workout-structure-note'),null,'structure notice must not return as in-flow layout content');
assert.match(css,/\.workout-structure-toast\{[\s\S]*position:fixed/i,'structure notice must be viewport overlay, not layout flow');
assert.match(css,/sc-structure-notice-countdown 5s linear forwards/i,'structure notice should visually count down its five-second lifetime');

// It should only happen once for this active workout.
w.dismissWorkoutStructureNotice();
await wait(220);
assert.equal(w.document.getElementById('workoutStructureNotice'),null,'notice should be dismissible');
w.addWorkoutSet(0,'working');
await wait(30);
assert.equal(w.document.getElementById('workoutStructureNotice'),null,'later structural edits in the same workout must not repeat the notice');

// Normal set advancement gets a small pulse/settle, not an exercise-card transition.
state=read();
const ei=state.activeWorkout.focusExerciseIndex;
const si=state.activeWorkout.focusSetIndex;
w.toggleSet(ei,si);w.stopRestTimer();
await wait(25);
state=read();
assert.equal(state.activeWorkout.focusExerciseIndex,ei,'non-final set should stay on the same exercise');
assert.notEqual(state.activeWorkout.focusSetIndex,si,'completion should advance to the next unfinished set');
assert(w.document.querySelector('#workout .focus-set-pill.current.set-advance-pulse'),'new active set pill should get the subtle advance pulse');
assert(w.document.querySelector('#workout .focus-set-card.set-advance-settle'),'new set card should get the subtle settle cue');
assert.equal(w.document.querySelector('#workout .focus-exercise-stage.workout-exercise-enter-forward'),null,'same-exercise set advancement should not use the full card transition');

// Complete the focused exercise and verify the incoming exercise transition.
for(;;){
  state=read();
  if(w.exerciseSetProgress(state.activeWorkout.exercises[ei]).complete)break;
  const activeSi=state.activeWorkout.focusSetIndex;
  w.toggleSet(ei,activeSi);w.stopRestTimer();
}
await wait(25);
state=read();
assert.notEqual(state.activeWorkout.focusExerciseIndex,ei,'final set should cross into the next unfinished exercise');
const nextEi=state.activeWorkout.focusExerciseIndex;
assert(w.document.querySelector('#workout .focus-exercise-stage.workout-exercise-enter-forward'),'automatic exercise advance should use the forward card cue in fallback mode');
assert.doesNotMatch(w.document.getElementById('toast')?.textContent||'',/^Up next:/i,'card transition should replace the redundant regular Up next toast');

// Manual navigation backward should reverse the spatial cue.
w.selectWorkoutExercise(0);
await wait(25);
assert(w.document.querySelector('#workout .focus-exercise-stage.workout-exercise-enter-back'),'manual navigation to an earlier exercise should use the backward card cue');

// The real browser path should prefer View Transitions when available.
assert.match(engine,/document\.startViewTransition/,'exercise motion should use the browser View Transitions API when available');
assert.match(css,/::view-transition-old\(workout-exercise-stage\)/,'CSS should animate the outgoing exercise snapshot');
assert.match(css,/::view-transition-new\(workout-exercise-stage\)/,'CSS should animate the incoming exercise snapshot');
assert.match(css,/sc-workout-card-in-forward 230ms/,'incoming card transition should stay brief');
assert.match(css,/sc-workout-card-out-forward 180ms/,'outgoing card transition should stay brief');

// Switch Exercise stays explicit but visually simplified into one line.
assert.match(css,/\.focus-nav-switch\{[\s\S]*white-space:nowrap/i,'Switch exercise must remain a one-line affordance');
assert.match(css,/\.focus-exercise-bottom-row \.focus-nav-switch\{[\s\S]*border:1px solid/i,'Switch exercise should remain a compact labeled pill in the lower action row');
assert.match(w.document.querySelector('#workout .focus-exercise-nav')?.textContent||'',/Switch exercise/i);

// Reduced motion must opt out of movement while preserving navigation.
w.matchMedia=()=>({matches:true});
const beforeReduced=w.eval('state.activeWorkout.focusExerciseIndex');
const targetReduced=beforeReduced===1?2:1;
w.selectWorkoutExercise(targetReduced);
await wait(25);
assert.equal(w.eval('state.activeWorkout.focusExerciseIndex'),targetReduced,'reduced-motion navigation must still change exercises');
assert.equal(w.document.querySelector('#workout .workout-exercise-enter-forward,#workout .workout-exercise-enter-back'),null,'reduced motion should suppress fallback exercise animation');

assert.match(core,/structureNoticeSeen:false/,'fresh workout model should explicitly reset the one-time notice');
assert.match(core,/workout:structure-changed/,'structure changes should use the runtime event boundary');

w.stopRestTimer();
w.dismissWorkoutStructureNotice();
dom.window.close();
console.log('Swole Cat workout feedback PASS: one-time overlay notice, explicit switch affordance, subtle set cue, directional exercise card transition, no redundant Up next toast, and reduced-motion safety');
