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
    window.localStorage.setItem('overload_v3',JSON.stringify({
      ui:{onboardingDone:true,haptics:false,keepAwake:false}
    }));
    window.alert=()=>{};
    window.confirm=()=>true;
    window.scrollTo=arg=>scrollCalls.push(arg);
  }
});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const read=()=>JSON.parse(dom.window.localStorage.getItem('overload_v3'));

await wait(80);
const w=dom.window;
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};

w.installRegressionFixturePlan();
let state=read();
const rid=state.routines[0].id;
const routineBefore=JSON.stringify(state.routines.find(r=>r.id===rid));
const sessionsBefore=JSON.stringify(state.sessions);

w.openRoutine(rid);
await wait(40);
state=read();
assert(state.activeWorkout,'fixture workout should start');
assert(state.activeWorkout.exercises.length>=4,'beta-flow regression needs a multi-exercise workout');

const cancel=w.document.querySelector('#workout .workout-cancel-btn');
assert(cancel,'active workout should render dedicated Cancel control');
assert.equal(cancel.textContent.trim(),'Cancel');
assert.match(cancel.className,/danger/);

function activeIndex(){
  return w.workoutActiveExerciseIndex(w.eval('state.activeWorkout'));
}
function activeName(index){
  const e=w.eval('state.activeWorkout.exercises')[index];
  return w.exById(e.exerciseId)?.name||'Exercise';
}
function assertOrientation(expectedIndex,label){
  const current=w.eval('state.activeWorkout');
  assert.equal(activeIndex(),expectedIndex,label+' active index');
  current.exercises.forEach((e,i)=>{
    if(i===expectedIndex)assert.equal(e.expanded,true,label+' next exercise should be expanded');
    else if(i<expectedIndex)assert.equal(e.expanded,false,label+' completed prior exercise should be collapsed');
  });
  const dock=w.document.getElementById('activeExerciseDock');
  assert(dock,label+' should render Now Training dock');
  assert.equal(Number(dock.dataset.exerciseIndex),expectedIndex,label+' dock index should match active exercise');
  assert(dock.textContent.toLowerCase().includes(activeName(expectedIndex).toLowerCase()),label+' dock should name current exercise');
  assert.match(dock.textContent,/Set\s+\d+\s+of\s+\d+/i,label+' dock should show current set position');
  const card=w.document.getElementById('workoutExercise-'+expectedIndex);
  assert(card?.classList.contains('active-exercise'),label+' card should be visually active');
  assert(!card?.classList.contains('collapsed'),label+' active card should stay expanded');
  assert(card?.querySelector('.workout-guidance'),label+' active card should use compact Coach guidance');
  assert(card?.querySelector('.workout-guidance-more'),label+' detailed guidance should remain available on demand');
}
function finishExercise(index){
  let current=w.eval('state.activeWorkout');
  const setCount=current.exercises[index].sets.length;
  for(let si=0;si<setCount;si++){
    current=w.eval('state.activeWorkout');
    if(!current.exercises[index].sets[si].done){
      w.toggleSet(index,si);
      w.stopRestTimer();
    }
  }
}

assertOrientation(0,'initial');
assert.match(w.document.getElementById('activeExerciseDock').textContent,/NOW TRAINING/i);

for(let index=0;index<3;index++){
  const next=index+1;
  scrollCalls.length=0;
  finishExercise(index);
  await wait(180);

  const current=w.eval('state.activeWorkout');
  assert.equal(w.exerciseSetProgress(current.exercises[index]).complete,true,'exercise '+index+' should be complete');
  const finishedCard=w.document.getElementById('workoutExercise-'+index);
  assert(finishedCard?.classList.contains('complete-block'),'finished exercise should be styled complete');
  assert(finishedCard?.classList.contains('collapsed'),'finished exercise should collapse automatically');

  assertOrientation(next,'after exercise '+(index+1));
  assert(scrollCalls.length>=1,'auto-advance should issue a deterministic scroll after exercise '+(index+1));
  const last=scrollCalls.at(-1);
  assert(last&&typeof last==='object'&&Number.isFinite(Number(last.top)),'auto-advance scroll should use an explicit offset-aware top target');

  const toast=w.document.getElementById('toast');
  if(toast)assert.match(toast.textContent,/Up next|Superset/i,'transition toast remains secondary confirmation');
}

state=read();
assert.equal(JSON.stringify(state.sessions),sessionsBefore,'live beta polish must not mutate completed history');
assert.equal(JSON.stringify(state.routines.find(r=>r.id===rid)),routineBefore,'orientation polish must not rewrite saved routine');
assert(state.activeWorkout,'workout should remain active during orientation regression');
assert.equal(state.activeWorkout.exercises.slice(0,3).every(e=>e.sets.every(s=>s.done)),true,'first three exercises should remain logged complete');

console.log('Swole Cat beta live-workout flow PASS: cancel control, sticky identity, compact guidance, collapse/expand, offset-aware auto-advance, and history immutability');
dom.window.close();
