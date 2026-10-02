import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const now=Date.now();
const isoDaysAgo=d=>new Date(now-d*86400000).toISOString();
const sets=(weight,reps=8,count=3,rir=2)=>Array.from({length:count},()=>({weight,reps,done:true,rir,type:'working',pr:''}));
const sessions=[
  {
    id:'hist_chest_1',routineName:'Chest A',status:'finished',date:isoDaysAgo(6),durationMinutes:55,
    exercises:[
      {exerciseId:'lib_0',sets:sets(100,8,3,2),skipped:false},
      {exerciseId:'lib_3',sets:sets(40,10,3,2),skipped:false},
      {exerciseId:'lib_5',sets:sets(25,12,3,1),skipped:false}
    ]
  },
  {
    id:'hist_hinge',routineName:'Posterior Chain',status:'finished',date:isoDaysAgo(2),
    exercises:[
      {exerciseId:'lib_16',sets:sets(185,5,3,2),skipped:false},
      {exerciseId:'lib_17',sets:sets(135,8,3,2),skipped:false}
    ]
  },
  {
    id:'hist_chest_2',routineName:'Chest B',status:'finished',date:isoDaysAgo(3),durationMinutes:50,
    exercises:[
      {exerciseId:'lib_0',sets:sets(105,8,3,2),skipped:false},
      {exerciseId:'lib_3',sets:sets(42.5,10,3,2),skipped:false},
      {exerciseId:'lib_5',sets:sets(27.5,12,3,1),skipped:false}
    ]
  }
];

const dom=new JSDOM(html,{
  runScripts:'dangerously',
  url:'https://swole-cat.test/',
  pretendToBeVisual:true,
  beforeParse(window){
    window.localStorage.setItem('overload_v3',JSON.stringify({
      ui:{onboardingDone:true,haptics:false,keepAwake:false},
      sessions
    }));
    window.alert=()=>{};
    window.confirm=()=>true;
    window.scrollTo=()=>{};
  }
});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await wait(150);
const w=dom.window;

function exercises(draft){return draft.selectedIds.map(id=>w.exById(id)).filter(Boolean)}
function directCount(rows,regions){
  const r=new Set(regions);
  return rows.filter(ex=>w.exerciseMuscleMetadata(ex).primary.some(x=>r.has(x))).length;
}

let req=w.coachParsePrompt('60 minute chest and arms workout','hypertrophy');
req.referenceDate=new Date(now).toISOString();
let context=w.coachTrainingContext(req);
assert(context.currentLedger.chest>=18,'seeded recent chest work should populate weekly chest ledger');
assert.equal(context.currentLedger.biceps||0,0,'seeded fixture should leave biceps untrained');
assert.equal(context.historyDepth,'emerging','three saved sessions should create emerging history depth');

let draft=w.coachGenerateWorkout(req);
assert(draft?.intelligenceAudit?.pass,'history-aware workout should pass internal intelligence audit');
let rows=exercises(draft);
assert(
  directCount(rows,['biceps','triceps','forearms'])>directCount(rows,['chest']),
  'when chest already has substantial weekly work, discretionary mixed-session slots should favor underrepresented arms'
);

const bench=w.exById('lib_0');
const benchProfile=w.coachExerciseHistoryProfile(bench.id,now);
assert.equal(benchProfile.trend,'up','seeded bench should register as progressing');
assert(w.coachExerciseContinuityAdjustment(bench,req,context)>0,'progressing familiar movement should receive continuity preference');
const chestDraft=w.coachGenerateWorkout({...w.coachParsePrompt('45 minute chest workout','hypertrophy'),referenceDate:new Date(now).toISOString()});
assert(chestDraft.selectedIds.includes('lib_0'),'progressing staple bench should be retained when it still fits the request');

const deadlift=w.exById('lib_16'),backExtension=w.exById('lib_285');
assert(
  w.coachDemandAdjustment(deadlift,req,context)<w.coachDemandAdjustment(backExtension,req,context),
  'recent heavy hinge work should make another high-demand hinge less attractive than lower-cost direct lumbar work'
);

const beginner=w.coachGenerateWorkout({...w.coachParsePrompt("I'm a beginner, give me a 60 minute chest workout",'hypertrophy'),referenceDate:new Date(now).toISOString()});
assert.equal(beginner.request.experienceLevel,'beginner');
assert(beginner.selectedIds.length<=5,'beginner single-area workout should avoid unnecessary exercise count');

const mixed=w.coachGenerateWorkout({...w.coachParsePrompt('60 minute full arm workout, work each arm individually and together','hypertrophy'),referenceDate:new Date(now).toISOString()});
assert.equal(mixed.request.lateralityPreference,'mixed');
const mixedRows=exercises(mixed),laterality=new Set(mixedRows.map(w.coachExerciseLaterality));
assert(laterality.has('unilateral')&&laterality.has('bilateral'),'explicit mixed laterality request should contain both unilateral and bilateral arm work');

const quick=w.coachGenerateWorkout({...w.coachParsePrompt('quick chest and back hypertrophy workout','hypertrophy'),referenceDate:new Date(now).toISOString()});
assert(quick.intelligenceAudit.supersetGroups>=1,'short non-strength session should use at least one compatible time-efficient superset');
const quickRoutine=w.coachDraftRoutine(quick,'quick_test');
assert(quickRoutine.exercises.some(x=>x.supersetGroup),'time-compression plan should persist into the generated routine');

const quickStrength=w.coachGenerateWorkout({...w.coachParsePrompt('30 minute strength back workout','strength'),referenceDate:new Date(now).toISOString()});
assert.equal(quickStrength.intelligenceAudit.supersetGroups,0,'strength-focused short sessions should not receive automatic supersets');

const explicit=w.coachGenerateWorkout({...w.coachParsePrompt('45 minute shoulder workout, 90 seconds rest, 2 RIR','hypertrophy'),referenceDate:new Date(now).toISOString()});
for(const ex of exercises(explicit)){
  const p=w.coachExercisePrescription(ex,explicit.request,explicit.defaults);
  assert.equal(p.restSeconds,90,'explicit rest instruction must override automatic per-exercise rest');
  assert.equal(p.targetRIR,2,'explicit RIR instruction must override automatic per-exercise effort');
}

const autoArms=w.coachGenerateWorkout({...w.coachParsePrompt('60 minute arms hypertrophy workout','hypertrophy'),referenceDate:new Date(now).toISOString()});
for(const ex of exercises(autoArms)){
  const p=w.coachExercisePrescription(ex,autoArms.request,autoArms.defaults);
  if(['biceps_curl','triceps_extension'].includes(w.coachMovementFamily(ex))){
    assert(p.minReps>=10&&p.maxReps>=15,'hypertrophy arm isolation should receive an isolation-appropriate rep range');
    assert.equal(p.targetRIR,1,'hypertrophy arm isolation should default to a close-but-not-required-failure effort target');
  }
}

const programReq={...w.coachParsePrompt('4 day upper lower hypertrophy program, 45 minutes','hypertrophy'),referenceDate:new Date(now).toISOString()};
const intent=w.coachParseProgramIntent('4 day upper lower hypertrophy program, 45 minutes');
const program=w.coachGenerateProgram(programReq,intent);
assert(program&&program.days.length===4,'history-aware 4-day program should generate');
assert(Object.keys(program.days[2].request.programMuscleUsage||{}).length>0,'later program days should receive planned muscle usage from earlier days');

const targets=['chest','back','shoulders','arms','legs','push','pull','upper body','lower body','posterior chain'];
const goals=['hypertrophy','strength','general'];
const durations=[30,45,60];
let matrix=0;
for(const target of targets){
  for(const goal of goals){
    for(const duration of durations){
      const r={...w.coachParsePrompt(`${duration} minute ${goal} ${target} workout`,goal),referenceDate:new Date(now).toISOString()};
      const d=w.coachGenerateWorkout(r);
      assert(d,`history-aware matrix failed to generate: ${duration} ${goal} ${target}`);
      assert(d.intelligenceAudit?.pass,`intelligence audit failed: ${duration} ${goal} ${target}`);
      matrix++;
    }
  }
}

console.log(`Coach Swolecat v0.59 intelligence stress PASS: ${matrix} history-aware matrix cases + targeted weekly/progression/laterality/prescription checks`);
dom.window.close();
