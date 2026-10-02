import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const now=Date.now();
const isoDaysAgo=d=>new Date(now-d*86400000).toISOString();
const working=(weight,reps,count=3,rir=2,roles=[])=>Array.from({length:count},(_,i)=>({
  weight,reps,done:true,rir,type:'working',pr:'',role:roles[i]||'working'
}));

const sessions=[];
for(let week=7;week>=0;week--){
  const index=7-week;
  sessions.push({
    id:'bench_'+index,routineName:'Bench Block',status:'finished',date:isoDaysAgo(week*7+1),
    exercises:[{exerciseId:'lib_0',sets:working(135+index*5,6,3,2),skipped:false}]
  });
}
for(let week=5;week>=0;week--){
  sessions.push({
    id:'curl_flat_'+week,routineName:'Arms Block',status:'finished',date:isoDaysAgo(week*7+2),
    exercises:[{exerciseId:'lib_41',sets:working(60,10,3,1),skipped:false}]
  });
}
for(let week=4;week>=0;week--){
  const weights=[225,230,235,235,215];
  const index=4-week;
  sessions.push({
    id:'deadlift_dip_'+week,routineName:'Deadlift Block',status:'finished',date:isoDaysAgo(week*7+3),
    exercises:[{exerciseId:'lib_16',sets:working(weights[index],5,3,1),skipped:false}]
  });
}

const dom=new JSDOM(html,{
  runScripts:'dangerously',
  url:'https://swole-cat.test/',
  pretendToBeVisual:true,
  beforeParse(window){
    window.localStorage.setItem('overload_v3',JSON.stringify({
      ui:{onboardingDone:true,haptics:false,keepAwake:false},
      settings:{defaultMin:8,defaultMax:12,defaultSets:3,defaultIncrement:5,coachAliases:{}},
      profile:{name:'Test',unit:'lb'},
      sessions
    }));
    window.alert=()=>{};window.confirm=()=>true;window.scrollTo=()=>{};
  }
});
await new Promise(r=>setTimeout(r,160));
const w=dom.window;

const bench=w.exById('lib_0'),curl=w.exById('lib_41'),deadlift=w.exById('lib_16');
assert(bench&&curl&&deadlift,'seed exercises must exist');

const benchProfile=w.coachMultiWeekExerciseProfile('lib_0',now);
assert.equal(benchProfile.status,'progressing','steadily rising bench block should classify as progressing');
assert(benchProfile.exposures>=8,'bench block should preserve eight exposures');
assert(benchProfile.changePct>.1,'bench multi-week change should reflect meaningful progression');

const curlProfile=w.coachMultiWeekExerciseProfile('lib_41',now);
assert.equal(curlProfile.status,'plateau_high_effort','flat repeated curls at 1 RIR should classify as high-effort plateau');
assert(curlProfile.highEffort,'plateau should retain logged high-effort context');

const deadliftProfile=w.coachMultiWeekExerciseProfile('lib_16',now);
assert.equal(deadliftProfile.status,'performance_dip','meaningful latest deadlift drop should be descriptive performance dip');

let strengthReq={...w.coachParsePrompt('60 minute strength chest workout','strength'),referenceDate:new Date(now).toISOString()};
let defaults=w.coachProgrammingDefaults('strength',60);
let benchPrescription=w.coachExercisePrescription(bench,strengthReq,defaults);
assert.equal(benchPrescription.progressionStrategy,'top_backoff','established strength compound should graduate to top/backoff progression');
assert.equal(benchPrescription.setStructure?.type,'top_backoff');
assert(benchPrescription.setStructure.backoffSets>=2,'automatic top/backoff plan should include meaningful backoff volume');

let benchRoutine={
  exerciseId:'lib_0',
  sets:benchPrescription.sets,
  minReps:benchPrescription.minReps,
  maxReps:benchPrescription.maxReps,
  increment:5,
  mode:'double',
  routineMode:'strength',
  trainingGoal:'strength',
  targetRIR:benchPrescription.targetRIR,
  progressionStrategy:benchPrescription.progressionStrategy,
  adaptiveProgression:true,
  setStructure:benchPrescription.setStructure
};
let benchPrev=w.previousExercise('lib_0');
let benchRec=w.buildRecommendation(benchRoutine,benchPrev,'lib_0');
assert(['load','reps','hold'].includes(benchRec.status),'top/backoff recommendation should produce a concrete next action');
assert.equal(benchRec.weights.length,benchPrescription.sets,'top/backoff recommendation should target every programmed working set');
assert(benchRec.weights.slice(1).every(x=>x<=benchRec.weights[0]),'backoff loads must not exceed the top-set load');

let activeSets=w.activeSetsFromRoutineExercise(benchRoutine,benchRec,bench);
let work=activeSets.filter(s=>s.type==='working');
assert.equal(work[0].role,'top','first working set should materialize as top set');
assert(work.slice(1).every(s=>s.role==='backoff'),'remaining working sets should materialize as backoff sets');

const grammar=w.coachParseLiftingGrammar('top set 3-5 reps then 3 backoff sets 6-8 reps, backoff at 90%');
assert.equal(grammar.topBackoff?.enabled,true,'top/backoff language should parse');
assert.equal(grammar.topBackoff.topMinReps,3);
assert.equal(grammar.topBackoff.topMaxReps,5);
assert.equal(grammar.topBackoff.backoffSets,3);
assert.equal(grammar.topBackoff.backoffMinReps,6);
assert.equal(grammar.topBackoff.backoffMaxReps,8);
assert.equal(grammar.topBackoff.backoffPercent,90);

let explicitReq={...w.coachParsePrompt('45 minute hypertrophy chest workout, top set 6-8 reps then 2 backoff sets 8-10 reps at 90%','hypertrophy'),referenceDate:new Date(now).toISOString()};
let explicitP=w.coachExercisePrescription(bench,explicitReq,w.coachProgrammingDefaults('hypertrophy',45));
assert.equal(explicitP.progressionStrategy,'top_backoff','explicit top/backoff request should override normal hypertrophy double progression');
assert.equal(explicitP.setStructure.backoffSets,2);
assert.equal(explicitP.setStructure.topMinReps,6);
assert.equal(explicitP.setStructure.backoffMinReps,8);

let armReq={...w.coachParsePrompt('45 minute biceps hypertrophy workout','hypertrophy'),referenceDate:new Date(now).toISOString()};
let curlP=w.coachExercisePrescription(curl,armReq,w.coachProgrammingDefaults('hypertrophy',45));
assert.equal(curlP.progressionStrategy,'double','isolation work should retain rep-first double progression');
let curlConfig={
  ...curlP,sets:3,increment:5,mode:'double',routineMode:'guided',trainingGoal:'hypertrophy',
  adaptiveProgression:true
};
let curlRec=w.buildRecommendation(curlConfig,w.previousExercise('lib_41'),'lib_41');
assert.equal(curlRec.status,'adaptive_hold','high-effort multi-week plateau should suppress forced rep/load progression');
assert(/hold/i.test(curlRec.headline),'plateau recommendation should communicate a hold instead of forced progression');

let nonAdaptive={sets:3,minReps:8,maxReps:12,increment:5,mode:'double',routineMode:'guided',trainingGoal:'hypertrophy',targetRIR:1};
let legacyRec=w.buildRecommendation(nonAdaptive,w.previousExercise('lib_41'),'lib_41');
assert.notEqual(legacyRec.status,'adaptive_hold','manual/legacy routine without adaptive flag must keep its established progression behavior');

const decision=w.coachAdaptiveProgressionDecision(curl,armReq);
assert.equal(decision.action,'hold_or_small_reset','high-effort plateau should be recognized at the adaptive decision layer');

const freshPress=w.exById('lib_34');
const advancedReq={...w.coachParsePrompt('advanced strength shoulder workout, top set and 2 backoff sets','strength'),referenceDate:new Date(now).toISOString()};
const freshP=w.coachExercisePrescription(freshPress,advancedReq,w.coachProgrammingDefaults('strength',45));
const freshConfig={...freshP,increment:5,mode:'double',routineMode:'strength',trainingGoal:'strength'};
const freshRec=w.buildRecommendation(freshConfig,null,'lib_34');
assert.equal(freshRec.status,'baseline');
assert(freshRec.weights.every(x=>x===0),'Coach must never invent a starting load for a top/backoff movement without user history');

const generated=w.coachGenerateWorkout(strengthReq);
assert(generated?.intelligenceAudit?.pass,'v0.60 strength workout should still pass the existing intelligence audit');
const routine=w.coachDraftRoutine(generated,'adaptive_routine');
const generatedBench=routine.exercises.find(x=>x.exerciseId==='lib_0');
assert(generatedBench,'progressing bench should remain in generated strength chest workout');
assert.equal(generatedBench.progressionStrategy,'top_backoff','generated routine should persist adaptive strategy');
assert.equal(generatedBench.adaptiveProgression,true,'generated routine should opt into adaptive progression');
assert.equal(generatedBench.setStructure?.type,'top_backoff','generated routine should persist top/backoff structure');

const profileStatuses=['progressing','plateau_high_effort','performance_dip'];
for(const [id,expected] of [['lib_0',profileStatuses[0]],['lib_41',profileStatuses[1]],['lib_16',profileStatuses[2]]]){
  const p=w.coachMultiWeekExerciseProfile(id,now);
  assert.equal(p.status,expected,`multi-week status mismatch for ${id}`);
}

console.log('Coach Swolecat v0.60 adaptive progression PASS: multi-week trends, adaptive holds, top/backoff structure, and no invented starting loads');
dom.window.close();
