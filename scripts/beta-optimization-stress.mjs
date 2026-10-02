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
  window.alert=()=>{};window.confirm=()=>true;window.scrollTo=()=>{};
 }
});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await wait(100);
const w=dom.window;
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};

w.installRegressionFixturePlan();
let pid=w.eval('state.programs[0].id');
w.startProgramWorkout(pid);

const sessionCacheBefore=w.derivedSessionData();
const catalogBefore=w.exerciseCatalog();
w.updateSet(0,0,'weight','100');
w.updateSet(0,0,'reps','8');
w.flushPendingStateSave();
assert.strictEqual(w.derivedSessionData(),sessionCacheBefore,'active-workout saves must not rebuild completed-history indexes');
assert.strictEqual(w.exerciseCatalog(),catalogBefore,'active-workout saves must not rebuild the exercise catalog');

w.toggleSet(0,0);
w.stopRestTimer();
w.finalizeWorkout(false);
const sessionCacheAfterFinish=w.derivedSessionData();
assert.notStrictEqual(sessionCacheAfterFinish,sessionCacheBefore,'finishing a workout must invalidate completed-history indexes');
assert.equal(sessionCacheAfterFinish.sessionsDesc.length,1,'newly finished workout should appear in indexed history');
assert.strictEqual(w.programSessions(w.programById(pid)),sessionCacheAfterFinish.sessionsByProgram.get(pid),'Program history should reuse the indexed Program session list');

const cachedAfterFinish=w.derivedSessionData();
w.eval("state.profile.name='Optimization Test'");
w.save();
assert.strictEqual(w.derivedSessionData(),cachedAfterFinish,'unrelated profile saves must not rebuild completed-history indexes');

const catalogStable=w.exerciseCatalog();
w.eval(`state.customExercises=[...state.customExercises,{id:uid(),name:'Optimization Cable Move',muscle:'Chest',equipment:'cable',pattern:'chest_fly',primaryMuscles:['chest'],secondaryMuscles:[],movementFamily:'chest_fly',custom:true}]`);
w.save();
const catalogAfterCustom=w.exerciseCatalog();
assert.notStrictEqual(catalogAfterCustom,catalogStable,'custom-exercise changes must rebuild the exercise catalog');
assert(w.exById(w.eval("state.customExercises.at(-1).id")),'rebuilt exercise catalog should contain the new custom movement');
w.eval("state.profile.name='Optimization Test 2'");
w.save();
assert.strictEqual(w.exerciseCatalog(),catalogAfterCustom,'unrelated saves must keep the exercise catalog cache hot');

w.startProgramWorkout(pid);
const oldFocus=w.eval('state.activeWorkout.focusExerciseIndex');
const candidate=w.allExercises().find(ex=>!w.eval('state.activeWorkout.exercises').some(row=>row.exerciseId===ex.id));
assert(candidate,'fixture should leave an exercise available to add');
w.addExerciseToWorkout(candidate.id,false);
const focusState=w.eval('({focusExerciseIndex:state.activeWorkout.focusExerciseIndex,focusSetIndex:state.activeWorkout.focusSetIndex,lastIndex:state.activeWorkout.exercises.length-1,lastId:state.activeWorkout.exercises.at(-1).exerciseId,deferred:[...state.activeWorkout.deferredExerciseIndexes],structureDirty:state.activeWorkout.structureDirty})');
assert.equal(focusState.focusExerciseIndex,focusState.lastIndex,'Add Exercise should focus the newly added movement in Focus Mode');
assert.equal(focusState.lastId,candidate.id,'new Focus Mode exercise should be the requested movement');
assert.equal(focusState.focusSetIndex,0,'newly added movement should start on its first set');
assert.equal(focusState.structureDirty,true,'today-only added exercise should still mark structure dirty');
if(oldFocus>=0)assert(focusState.deferred.includes(oldFocus),'unfinished prior focus should remain pending rather than being lost');

for(const retired of ['installApp','updateInstallButton','fmtWeight','activeExerciseDockHtml','toggleExercisePanel','openExercisePanel','scrollToWorkoutExercise']){
 assert.equal(typeof w[retired],'undefined',retired+' should not ship after the final Focus Mode cleanup');
}
assert(!html.includes('beforeinstallprompt'),'retired custom PWA install-prompt listener should not ship');
assert(!html.includes('active-exercise-dock'),'retired pre-Focus sticky dock CSS/markup should not ship');

dom.window.close();
console.log('Swole Cat v0.66.1 beta optimization PASS: hot caches survive workout saves, history indexes invalidate correctly, Focus Mode add-exercise targets the real canvas, and retired UI paths are gone');
