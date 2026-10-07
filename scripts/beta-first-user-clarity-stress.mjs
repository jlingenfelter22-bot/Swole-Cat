import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const now=Date.now();
const isoDaysAgo=d=>new Date(now-d*86400000).toISOString();
const working=(weight,reps,rir=1,count=3)=>Array.from({length:count},()=>({weight,reps,rir,done:true,type:'working',pr:''}));

const plateauSessions=[22,15,8,1].map((days,i)=>({
  id:'ceiling_'+i,
  routineName:'Ceiling Test',
  status:'finished',
  date:isoDaysAgo(days),
  exercises:[{exerciseId:'lib_41',sets:working(60,15,1,3),skipped:false}]
}));

const scrollCalls=[];
const dom=new JSDOM(html,{
  runScripts:'dangerously',
  url:'https://swole-cat.test/',
  pretendToBeVisual:true,
  beforeParse(window){
    window.localStorage.setItem('overload_v3',JSON.stringify({
      ui:{onboardingDone:true,haptics:false,keepAwake:false},
      settings:{defaultMin:8,defaultMax:12,defaultSets:3,defaultIncrement:5,coachAliases:{}},
      profile:{name:'Beta Clarity Test',unit:'lb'},
      routines:[],
      sessions:plateauSessions
    }));
    window.alert=()=>{};
    window.confirm=()=>true;
    window.scrollTo=arg=>scrollCalls.push(arg);
  }
});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const w=dom.window;
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
await wait(160);

// 1) Narrow-phone set row keeps a dedicated RIR column.
assert.match(
  html,
  /grid-template-columns\s*:\s*minmax\(0,1\.16fr\)\s+minmax\(0,1fr\)\s+74px/i,
  'beta layout must reserve a readable RIR column instead of squeezing it into reps controls'
);

// 2) The programmed rep ceiling wins over adaptive hold and in-session overshoot.
const ceilingConfig={
  sets:3,minReps:10,maxReps:15,increment:5,mode:'double',
  routineMode:'guided',trainingGoal:'hypertrophy',targetRIR:2,
  adaptiveProgression:true,progressionStrategy:'double'
};
const ceilingProfile=w.coachMultiWeekExerciseProfile('lib_41',now);
assert.equal(ceilingProfile.status,'plateau_high_effort','fixture should create the adaptive-hold condition');
const ceilingPrev=w.previousExercise('lib_41');
const ceilingRec=w.buildRecommendation(ceilingConfig,ceilingPrev,'lib_41');
assert.equal(ceilingRec.status,'load','completed rep ceiling must graduate to load even when adaptive history is flat/high-effort');
assert.equal(ceilingRec.weight,65,'configured 5 lb increment should apply after ceiling completion');
assert.deepEqual(Array.from(ceilingRec.targetReps),[10,10,10],'load increase should reset reps to the bottom of the programmed range');

const nearCeilingConfig={...ceilingConfig,adaptiveProgression:false};
const nearCeilingPrev={sets:working(60,14,2,3)};
const currentExercise={
  exerciseId:'lib_41',
  config:nearCeilingConfig,
  sets:[
    {weight:60,reps:17,rir:3,done:true,type:'working',pr:''},
    {weight:60,reps:15,rir:'',done:false,type:'working',pr:''},
    {weight:60,reps:15,rir:'',done:false,type:'working',pr:''}
  ]
};
const cappedTarget=w.liveSetTarget(currentExercise,1,nearCeilingPrev);
assert(cappedTarget.reps<=15,'Coach-generated in-session target must never exceed the programmed max rep ceiling');

// 3) Focus Mode keeps the core logging path obvious and moves secondary controls out of the primary card.
w.installRegressionFixturePlan();
let state=JSON.parse(w.localStorage.getItem('overload_v3'));
const rid=state.routines[0].id;
w.openRoutine(rid);
await wait(60);
assert.equal(w.document.querySelectorAll('#workout .focus-exercise-canvas').length,1,'Focus Mode should render one exercise canvas');
assert.equal(w.document.querySelectorAll('#workout .focus-set-card').length,1,'Focus Mode should render one primary set card');
const actionButtons=[...w.document.querySelectorAll('#workout .focus-exercise-actions button')].map(b=>b.textContent.trim());
assert(actionButtons.some(x=>/Substitute/i.test(x)),'Substitute should remain visible');
assert(actionButtons.some(x=>/More/i.test(x)),'secondary tools should be grouped under More');
assert(!actionButtons.some(x=>/Next Exercise/i.test(x)),'redundant Next Exercise should stay off the primary surface');
assert.match(w.document.querySelector('#workout .focus-exercise-nav')?.textContent||'',/Switch exercise/i,'exercise navigation should explicitly say Switch exercise');
assert(w.document.querySelector('#workout .focus-nav-add'),'Add Exercise should live inside the exercise switcher');
assert(w.document.querySelector('#workout .focus-set-add'),'Add Set should live directly in the set rail');
const firstEntry=w.document.querySelector('#workout .live-entry');
assert(firstEntry,'active workout should render the live set-entry row');
assert.equal(firstEntry.querySelectorAll('.live-input-wrap').length,3,'live set row should still expose Weight, Reps, and RIR as three explicit controls');
assert(firstEntry.querySelector('.rir-small'),'third live-entry control should remain the RIR control');
assert(w.document.querySelector('#workout .focus-set-options'),'set reorder/delete/type controls should move behind a secondary set-options control');

// 4) Rest timer is compact/expandable and disappears after the true final set.
let active=w.eval('state.activeWorkout');
const lastEi=active.exercises.length-1;
const lastSi=active.exercises[lastEi].sets.length-1;
w.eval(`state.activeWorkout.exercises.forEach((e,ei)=>{e.skipped=false;e.expanded=ei===${lastEi};e.sets.forEach((s,si)=>{s.done=!(ei===${lastEi}&&si===${lastSi})})});state.activeWorkout.focusExerciseIndex=${lastEi};state.activeWorkout.focusSetIndex=${lastSi};state.activeWorkout.deferredExerciseIndexes=[];saveActiveWorkout();renderWorkout();`);
await wait(30);
assert.equal(w.workoutHasRemainingProgrammedWork(),true,'fixture should have exactly one remaining programmed set');
w.startRestTimer(90);
const timer=w.document.getElementById('restTimer');
assert(timer.classList.contains('show'),'rest timer should appear while programmed work remains');
assert(!timer.classList.contains('expanded'),'rest timer should start in compact mode');
assert(timer.querySelector('.rest-quick-add'),'compact rest timer should retain one-tap +30 access');
w.toggleRestTimerExpanded();
assert(timer.classList.contains('expanded'),'rest controls should expand on demand');
w.toggleSet(lastEi,lastSi);
await wait(40);
assert.equal(w.workoutHasRemainingProgrammedWork(),false,'final set should leave no programmed work');
assert(!timer.classList.contains('show'),'rest timer must disappear immediately after the final programmed set');
assert.equal(w.eval('restLeft'),0,'final-set dismissal must clear the rest countdown state');

// 5) Front-deltoid anatomy is still semantically mapped and now sits on the shoulder cap.
assert.equal(w.anatomyScoreRegion('shoulder-front-left'),'front_delts');
assert.equal(w.anatomyScoreRegion('shoulder-front-right'),'front_delts');
const front=w.eval('SWOLECAT_ANATOMY_FRONT');
const left=front.find(x=>x.id==='shoulder-front-left');
const right=front.find(x=>x.id==='shoulder-front-right');
assert(left&&right,'front anatomy must contain bilateral anterior-delt shapes');
function pathCentroid(path){
  const nums=(String(path).match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
  const xs=[],ys=[];
  for(let i=0;i+1<nums.length;i+=2){xs.push(nums[i]);ys.push(nums[i+1])}
  return {x:xs.reduce((a,b)=>a+b,0)/xs.length,y:ys.reduce((a,b)=>a+b,0)/ys.length};
}
const lc=pathCentroid(left.path),rc=pathCentroid(right.path);
assert(lc.x>20.5&&lc.y>17,'left front delt should sit on the outside/front shoulder rather than near the neck');
assert(rc.x<11.2&&rc.y>17,'right front delt should sit on the outside/front shoulder rather than near the neck');

console.log('Swole Cat beta clarity PASS: RIR layout, rep ceiling, discoverable exercise switching, inline Add Set, compact final-aware timer, progressive disclosure, and front-delt anatomy');
w.stopRestTimer();
dom.window.close();
