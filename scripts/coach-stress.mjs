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
await wait(120);
const w=dom.window;
let total=0;

function selectedExercises(draft){return draft.selectedIds.map(id=>w.exById(id)).filter(Boolean)}
function primaryCount(exercises,regions){
  const target=new Set(regions);
  return exercises.filter(ex=>w.exerciseMuscleMetadata(ex).primary.some(r=>target.has(r))).length;
}
function assertCoreCoverage(req,draft){
  const exercises=selectedExercises(draft);
  const plan=w.coachCoveragePlan(req,exercises.length);
  const pool=w.visibleExercises();
  for(const slot of plan.core){
    const candidateExists=pool.some(ex=>w.coachExerciseAllowedByConstraints(ex,req)&&slot.match(ex));
    if(candidateExists)assert(exercises.some(slot.match),`missing core role "${slot.label}" for: ${req.prompt}`);
  }
}
function assertFamilyCaps(req,draft){
  const exercises=selectedExercises(draft),counts={};
  for(const ex of exercises){
    const family=w.coachMovementFamily(ex);
    counts[family]=(counts[family]||0)+1;
  }
  for(const [family,n] of Object.entries(counts)){
    const cap=w.coachFamilyCap(family,req,exercises.length);
    assert(n<=cap,`family ${family} exceeded cap ${cap} in: ${req.prompt}`);
  }
}
function run(prompt,{goal='hypertrophy',expectKeys=[],allowNull=false}={}){
  total++;
  const req=w.coachParsePrompt(prompt,goal);
  for(const key of expectKeys)assert(req.targetKeys.includes(key),`expected target "${key}" from: ${prompt}; got ${req.targetKeys.join(', ')}`);
  if(!req.targetRegions.length){
    assert(allowNull,`no target regions parsed from: ${prompt}`);
    return {req,draft:null,exercises:[]};
  }
  const draft=w.coachGenerateWorkout(req);
  if(!draft){
    assert(allowNull,`Coach failed to generate: ${prompt}`);
    return {req,draft:null,exercises:[]};
  }
  const exercises=selectedExercises(draft);
  assert(exercises.length>0,`empty workout: ${prompt}`);
  assert.equal(new Set(draft.selectedIds).size,draft.selectedIds.length,`duplicate exercise IDs: ${prompt}`);
  for(const ex of exercises){
    assert(w.coachExerciseAllowedByConstraints(ex,req),`constraint violation by ${ex.name}: ${prompt}`);
    const meta=w.exerciseMuscleMetadata(ex);
    assert(meta.primary.some(r=>req.targetRegions.includes(r))||meta.secondary.some(r=>req.targetRegions.includes(r)),
      `off-target exercise ${ex.name}: ${prompt}`);
  }
  assertCoreCoverage(req,draft);
  assertFamilyCaps(req,draft);
  return {req,draft,exercises};
}

const targetAliases=[
  ['chest','chest'],['pecs','chest'],['back','back'],['upper back','upper back'],['lower back','lower back'],
  ['spinal erectors','lower back'],['lats','lats'],['traps','traps'],['shoulders','shoulders'],['delts','shoulders'],
  ['arms','arms'],['biceps','biceps'],['bis','biceps'],['triceps','triceps'],['tris','triceps'],['forearms','forearms'],
  ['legs','legs'],['quads','quads'],['hamstrings','hamstrings'],['hams','hamstrings'],['glutes','glutes'],
  ['calves','calves'],['adductors','adductors'],['front delts','front delts'],['side delts','side delts'],['rear delts','rear delts'],
  ['abs','abs'],['obliques','obliques'],['posterior chain','posterior chain'],['push','push'],['pull','pull'],['upper body','upper body'],
  ['lower body','lower body'],['full body','full body'],['core','core']
];
const goalWords=[['hypertrophy','hypertrophy'],['strength','strength'],['general fitness','general']];
const durations=[30,45,60];

for(const [phrase,key] of targetAliases){
  for(const [goalWord,goal] of goalWords){
    for(const duration of durations){
      run(`${duration} minute ${goalWord} ${phrase} workout`,{goal,expectKeys:[key]});
    }
  }
}

const beginnerPrompts=[
  ['Um, I just wanna work on my back today','back'],
  ['Can you give me something for my arms?','arms'],
  ['I need a good leg day','legs'],
  ['I kinda want shoulders today','shoulders'],
  ['Can you make me a chest workout?','chest'],
  ['I want to work my lower back','lower back'],
  ['Give me a workout for my whole upper body','upper body'],
  ['I want to hit my butt and hams','hamstrings'],
  ['Can we do abs today?','abs'],
  ['I want a pull day','pull'],
  ['I need something for my delts','shoulders'],
  ['Can I work my pecs?','chest']
];
for(const [prompt,key] of beginnerPrompts)run(prompt,{expectKeys:[key]});

const advancedPrompts=[
  ['60 minute hypertrophy posterior chain, no barbells','posterior chain'],
  ['45 minute lats and upper back, cables','lats'],
  ['60 minute strength back workout','back'],
  ['45 minute hams and glutes hypertrophy','hamstrings'],
  ['60 minute delts and tris, 2 RIR, 90 seconds rest','shoulders'],
  ['45 minute pecs and bis, dumbbells','chest'],
  ['60 minute lower back and hamstrings, emphasize lower back','lower back'],
  ['45 minute pull workout, prioritize lats','pull'],
  ['60 minute legs, mostly quads','legs'],
  ['45 minute shoulders and arms, shoulder-focused','shoulders']
];
for(const [prompt,key] of advancedPrompts)run(prompt,{expectKeys:[key]});

const equipmentCases=[
  '45 minute chest workout, dumbbells only',
  '45 minute shoulders workout, cables only',
  '45 minute arms workout, cables only',
  '45 minute legs workout, machines only',
  '45 minute back workout, no barbells',
  '45 minute biceps workout, dumbbells only',
  '45 minute triceps workout, cables only',
  '45 minute quads workout, machines only',
  '45 minute hamstrings workout, machines only',
  '45 minute lats workout, cables only',
  '45 minute traps workout, dumbbells only',
  '45 minute core workout, bodyweight'
];
for(const prompt of equipmentCases)run(prompt);

const shoulderPriority=run('60 minute shoulder and arm workout, focus more on shoulders',{expectKeys:['shoulders','arms']});
assert(shoulderPriority.req.priorityRegions.includes('side_delts'),'shoulder emphasis should create priority regions');
assert(
  primaryCount(shoulderPriority.exercises,['front_delts','side_delts','rear_delts'])>
  primaryCount(shoulderPriority.exercises,['biceps','triceps','forearms']),
  'shoulder-emphasis workout should allocate more direct exercises to shoulders than arms'
);

const armPriority=run('60 minute shoulders and arms, mostly arms',{expectKeys:['shoulders','arms']});
assert(armPriority.req.priorityRegions.includes('biceps'),'arm emphasis should create biceps priority');
assert(
  primaryCount(armPriority.exercises,['biceps','triceps','forearms'])>
  primaryCount(armPriority.exercises,['front_delts','side_delts','rear_delts']),
  'arm-emphasis workout should allocate more direct exercises to arms than shoulders'
);

const chestPriority=run('60 minute chest and back, chest emphasis',{expectKeys:['chest','back']});
assert(chestPriority.req.priorityRegions.includes('chest'),'chest emphasis should survive initial parsing');
assert(primaryCount(chestPriority.exercises,['chest'])>=2,'chest emphasis should receive multiple direct chest exercises');

const fullArms=run('60 minute full arm workout',{expectKeys:['arms']});
const armFamilies=fullArms.exercises.map(ex=>w.coachMovementFamily(ex));
assert(armFamilies.filter(x=>x==='biceps_curl').length>=2,'full arms should include complementary direct elbow-flexion work');
assert(armFamilies.filter(x=>x==='triceps_extension').length>=2,'full arms should include complementary direct triceps-extension work');
assert(fullArms.exercises.some(ex=>/hammer/i.test(ex.name)),'full arms should include a neutral-grip elbow-flexion role');
assert(fullArms.exercises.some(ex=>/overhead/i.test(ex.name)&&ex.pattern==='elbow_extension'),'full arms should include overhead triceps work when available');

const shoulders=run('60 minute complete shoulder workout',{expectKeys:['shoulders']});
assert(shoulders.exercises.some(ex=>ex.pattern==='vertical_press'),'shoulders need a press role');
assert(shoulders.exercises.some(ex=>ex.pattern==='lateral_raise'),'shoulders need direct lateral-delt work');
assert(shoulders.exercises.some(ex=>ex.pattern==='rear_delt'),'shoulders need direct rear-delt work');

const legs=run('60 minute complete leg workout',{expectKeys:['legs']});
assert(legs.exercises.some(ex=>['squat','lunge'].includes(ex.pattern)),'legs need knee-dominant work');
assert(legs.exercises.some(ex=>ex.pattern==='hinge'),'legs need a hip-hinge role');
assert(legs.exercises.some(ex=>ex.pattern==='knee_flexion'),'legs need knee-flexion hamstring work');
assert(legs.exercises.some(ex=>ex.pattern==='calf_raise'),'legs need calf work');

for(const prompt of [
  'I want to work out',
  'make me something good',
  'I have 45 minutes',
  'give me a workout today',
  'not sure what I want'
]){
  run(prompt,{allowNull:true});
}

console.log(`Coach Swolecat stress matrix PASS: ${total} prompt cases + targeted priority/coverage assertions`);
dom.window.close();
