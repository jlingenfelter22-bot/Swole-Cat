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

await wait(120);
const w=dom.window;
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
w.installRegressionFixturePlan();

let state=read();
const rid=state.routines[0].id;
w.openRoutine(rid);
await wait(50);
state=read();

assert(state.activeWorkout,'fixture workout should be active');
assert(w.document.querySelector('#workout .focus-session-strip'),'normal workout surface should use compact session strip');
assert.equal(w.document.querySelector('#workout .focus-workout-top'),null,'old tall session header should be retired');
assert.equal(w.document.querySelector('#workout .workout-cancel-btn'),null,'Cancel must not occupy the normal workout surface');
assert.equal(w.document.querySelector('#workout .focus-workout-footer'),null,'old permanent Add/Finish footer should be retired while work remains');
assert.equal(w.document.querySelector('#workout .focus-workout-complete'),null,'Finish Workout should not be prominent before programmed work is complete');

const nav=w.document.querySelector('#workout .focus-exercise-nav');
assert(nav,'exercise switcher must render');
assert.match(nav.textContent,/Switch exercise/i,'exercise switcher should name its function');
assert.equal(w.document.querySelectorAll('#workout .focus-nav-row').length,state.activeWorkout.exercises.length,'switcher should list every exercise');
assert(w.document.querySelector('#workout .focus-nav-add'),'exercise switcher should end with Add exercise');
assert.equal(typeof w.openAddWorkoutExercise,'function','Add exercise switcher row should target the existing active-workout add flow');

const actions=[...w.document.querySelectorAll('#workout .focus-exercise-actions button')].map(b=>b.textContent.trim());
assert.deepEqual(actions.length,2,'primary exercise action row should stay intentionally sparse');
assert(actions.some(x=>/Substitute/i.test(x)),'Substitute should stay visible');
assert(actions.some(x=>/More/i.test(x)),'More should stay visible');
assert(!actions.some(x=>/Next Exercise/i.test(x)),'Next Exercise should not compete with the switcher/auto-advance model');

const ei=state.activeWorkout.focusExerciseIndex;
const beforeWorking=w.eval(`workingSetIndexes(state.activeWorkout.exercises[${ei}]).length`);
const addSet=w.document.querySelector('#workout .focus-set-add');
assert(addSet,'set rail should expose inline Add Set');
assert.match(addSet.textContent,/Set/i);
addSet.click();
await wait(30);
state=read();
const afterWorking=w.eval(`workingSetIndexes(state.activeWorkout.exercises[${ei}]).length`);
assert.equal(afterWorking,beforeWorking+1,'inline Add Set should append one working set');
assert.equal(state.activeWorkout.structureDirty,true,'changing working-set count should retain structure-dirty safeguards');
assert.equal(state.activeWorkout.focusExerciseIndex,ei,'adding a set should keep focus on the same exercise');
assert.equal(w.document.querySelectorAll('#workout .focus-set-pill').length,state.activeWorkout.exercises[ei].sets.length,'set rail should represent every real set separately from Add Set');

w.openFocusedExerciseMore(ei);
await wait(10);
const moreText=w.document.getElementById('modalBody')?.textContent||'';
assert.match(moreText,/EXERCISE/i,'More should separate exercise controls');
assert.match(moreText,/WORKOUT/i,'More should separate workout controls');
assert.match(moreText,/Finish workout early/i,'early finish should live under More while work remains');
assert.match(moreText,/Cancel workout/i,'Cancel workout should live under More');
assert.match(moreText,/Manage workout/i,'workout structure editor should stay available');
assert.match(moreText,/Working set/i,'advanced/fallback add-working-set route should remain available');
w.closeModal();

// Mark all programmed work complete and verify the contextual finish state.
w.eval(`
 state.activeWorkout.exercises.forEach(e=>{
   if(!e.skipped)e.sets.forEach(s=>{s.done=true});
 });
 saveActiveWorkout();
 renderWorkout();
`);
await wait(30);
assert.equal(w.workoutHasRemainingProgrammedWork(),false,'fixture should now have no remaining programmed work');
const finish=w.document.querySelector('#workout .focus-workout-complete .btn');
assert(finish,'Finish Workout should surface only after all programmed work is complete');
assert.match(finish.textContent,/Finish Workout/i);
assert.equal(w.document.querySelector('#workout .focus-workout-footer'),null,'legacy permanent footer should remain retired in completion state');

w.openFocusedExerciseMore(w.eval('state.activeWorkout.focusExerciseIndex'));
await wait(10);
assert.match(w.document.getElementById('modalBody')?.textContent||'',/Finish workout/i,'More should still offer Finish Workout in complete state');
assert.doesNotMatch(w.document.getElementById('modalBody')?.textContent||'',/Finish workout early/i,'complete state should no longer label finish as early');

dom.window.close();
console.log('Swole Cat v0.72.0 workout screen UX PASS: compact session strip, explicit switcher, Add Exercise in switcher, inline Add Set, sparse actions, contextual finish, and More-based exception actions');
