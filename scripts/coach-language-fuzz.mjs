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
await wait(120);
const w=dom.window;
let checks=0;

function checkTarget(prompt,key){
  checks++;
  const req=w.coachParsePrompt(prompt,'hypertrophy');
  assert(req.targetKeys.includes(key),`target "${key}" not understood from "${prompt}" (got: ${req.targetKeys.join(', ')})`);
  return req;
}
function checkNoTarget(prompt){
  checks++;
  const req=w.coachParsePrompt(prompt,'hypertrophy');
  assert.equal(req.targetRegions.length,0,`vague phrase should not invent a target: "${prompt}" -> ${req.targetKeys.join(', ')}`);
}
function checkGoal(prompt,goal){
  checks++;
  assert.equal(w.coachParsePrompt(prompt,'hypertrophy').goal,goal,`goal parse failed: ${prompt}`);
}
function checkDuration(prompt,duration){
  checks++;
  assert.equal(w.coachParsePrompt(prompt,'hypertrophy').duration,duration,`duration parse failed: ${prompt}`);
}
function checkExercise(phrase,name){
  checks++;
  const out=w.coachUnderstandExercisePhrase(phrase);
  assert.equal(out.level,'high',`exercise phrase should resolve confidently: "${phrase}" (${out.level}, ${out.confidence})`);
  assert.equal(out.exercise?.name,name,`exercise phrase "${phrase}" resolved to ${out.exercise?.name||'nothing'}, expected ${name}`);
}

const targetCases=[
  ['hit my pecs','chest'],
  ['chesticles today','chest'],
  ['work my sholders','shoulders'],
  ['delts today','shoulders'],
  ['rear deltoid workout','rear delts'],
  ['posterior deltoid work','rear delts'],
  ['medial deltoid work','side delts'],
  ['lateral delts only','side delts'],
  ['anterior deltoid work','front delts'],
  ['guns today','arms'],
  ['gun show workout','arms'],
  ['buy ceps today','biceps'],
  ['bicepts workout','biceps'],
  ['bis and tris','biceps'],
  ['try ceps today','triceps'],
  ['forearms today','forearms'],
  ['my wings and upper back','lats'],
  ['latissimus work','lats'],
  ['trapezius workout','traps'],
  ['spine erecters','lower back'],
  ['erector spinae','lower back'],
  ['middle back workout','upper back'],
  ['quad muscles','quads'],
  ['quadricep workout','quads'],
  ['hammies today','hamstrings'],
  ['ham strings workout','hamstrings'],
  ['booty workout','glutes'],
  ['butt and hams','glutes'],
  ['calfs today','calves'],
  ['abdominals','abs'],
  ['love handles','obliques'],
  ['rhomboids today','upper back'],
  ['rectus abdominis','abs'],
  ['vastus medialis','quads'],
  ['biceps femoris','hamstrings'],
  ['soleus work','calves'],
  ['brachioradialis','forearms'],
  ['inner thighs','adductors'],
  ['hip adductors','adductors'],
  ['back of my shoulders','rear delts'],
  ['side of my shoulders','side delts'],
  ['front of my shoulders','front delts'],
  ['posterior chain','posterior chain'],
  ['wheels today','legs'],
  ['push day','push'],
  ['pull session','pull'],
  ['whole upper body','upper body'],
  ['lower body today','lower body'],
  ['full body','full body']
];
for(const [prompt,key] of targetCases)checkTarget(prompt,key);

// Compound/slang prompts should preserve all intended targets.
let req=checkTarget("chest n tri's, mostly chest",'chest');
assert(req.targetKeys.includes('triceps'),'tri\'s should normalize to triceps');
assert(req.priorityRegions.includes('chest'),'mostly chest should become priority');
checks+=2;

req=checkTarget("back + bi's, focus lats",'back');
assert(req.targetKeys.includes('biceps'),'bi\'s should normalize to biceps');
assert(req.targetKeys.includes('lats'),'lats should remain precise alongside generic back');
assert(req.priorityRegions.includes('lats'),'focus lats should become priority');
checks+=3;

req=w.coachParsePrompt('shoulder-heavy arms workout','hypertrophy');checks+=2;
assert.equal(req.goal,'hypertrophy','shoulder-heavy must not silently become a strength request');
assert(req.priorityRegions.includes('front_delts')||req.priorityRegions.includes('side_delts'),'shoulder-heavy should create shoulder priority');

req=w.coachParsePrompt('go heavy on back','hypertrophy');checks++;
assert.equal(req.goal,'strength','go heavy should still express strength intent');

// Human time phrasing and number words.
[
  ['forty five minute chest workout',45],
  ['twenty five minutes arms',25],
  ['ninety minute full body',90],
  ['half hour back workout',30],
  ['an hour shoulders',60],
  ['one hour and a half legs',90],
  ['quick pull workout',30],
  ['not much time, give me chest',30]
].forEach(([p,d])=>checkDuration(p,d));

// Goal phrasing.
[
  ['I want to get bigger arms','hypertrophy'],
  ['build muscle on my chest','hypertrophy'],
  ['gain muscle legs','hypertrophy'],
  ['add size to my delts','hypertrophy'],
  ['hyper trophy back workout','hypertrophy'],
  ['I want to get strong on back','strength'],
  ['build strength legs','strength'],
  ['heavy push workout','strength'],
  ['powerlifting pull workout','strength'],
  ['just exercise full body','general'],
  ['stay active upper body','general'],
  ['general training legs','general']
].forEach(([p,g])=>checkGoal(p,g));

// Program/frequency/schedule phrasing.
const programCases=[
  ['three day full body program',3,'full_body',[ ]],
  ['three times a week full body plan',3,'full_body',[ ]],
  ['twice a week upper lower program',2,'upper_lower',[ ]],
  ['4x a week upper/lower',4,'upper_lower',[ ]],
  ['M/W/F full body program',3,'full_body',[1,3,5]],
  ['Tue/Thu upper lower plan',2,'upper_lower',[2,4]],
  ['six day PPL',6,'ppl',[ ]]
];
for(const [prompt,frequency,split,days] of programCases){
  checks++;
  const intent=w.coachParseProgramIntent(prompt);
  assert.equal(intent.frequency,frequency,`program frequency failed: ${prompt}`);
  assert.equal(intent.split,split,`program split failed: ${prompt}`);
  if(days.length)assert.equal(JSON.stringify(Array.from(intent.preferredDays)),JSON.stringify(days),`program weekdays failed: ${prompt}`);
}

// Equipment language.
const equipmentCases=[
  ['dumbells only chest','dumbbell','allowed'],
  ['dbs only arms','dumbbell','allowed'],
  ['cables only back','cable','allowed'],
  ['machines only legs','machine','allowed'],
  ['no barbel chest','barbell','excluded'],
  ['without cables arms','cable','excluded'],
  ['no equipment full body','bodyweight','allowed']
];
for(const [prompt,equipment,kind] of equipmentCases){
  checks++;
  const parsed=w.coachParseEquipment(prompt);
  assert(parsed[kind].includes(equipment),`${kind} equipment "${equipment}" not parsed from "${prompt}"`);
}
checks++;
let equipment=w.coachParseEquipment('no free weights, machines and cables');
for(const e of ['barbell','dumbbell','kettlebell','trap bar'])assert(equipment.excluded.includes(e),`no free weights should exclude ${e}`);
assert(equipment.allowed.includes('machine')&&equipment.allowed.includes('cable'),'machines/cables should remain allowed');

// Negative muscle intent must never become a positive request.
req=w.coachParsePrompt('back and arms, no chest','hypertrophy');checks++;
assert(req.targetKeys.includes('back')&&req.targetKeys.includes('arms'),'positive targets lost around a negative target');
assert(req.excludedTargetRegions.includes('chest')&&!req.targetRegions.includes('chest'),'no chest must be a hard exclusion');

req=w.coachParsePrompt("shoulders, don't train chest",'hypertrophy');checks++;
assert(req.targetKeys.includes('shoulders')&&!req.targetKeys.includes('chest'),'dont train chest must not become positive chest');
assert(req.excludedTargetRegions.includes('chest'));

req=w.coachParsePrompt('lower body but skip calves','hypertrophy');checks++;
assert(req.targetKeys.includes('lower body'),'lower-body request should remain');
assert(req.excludedTargetRegions.includes('calves')&&!req.targetRegions.includes('calves'),'skip calves should subtract calves from a broad target');
const noCalfDraft=w.coachGenerateWorkout({...req,duration:60});
assert(noCalfDraft,'full body minus calves should still generate');
for(const id of noCalfDraft.selectedIds){
  const meta=w.exerciseMuscleMetadata(w.exById(id));
  assert(![...meta.primary,...meta.secondary].includes('calves'),'hard excluded calves leaked into workout');
}

// Negative exercise language must not route excluded exercises as positive requests.
let explicit=w.coachParseExplicitWorkout('back workout, no barbell rows','hypertrophy');checks+=3;
assert(explicit.excludedExerciseIds.includes('lib_26'),'no barbell rows should exclude Barbell Row');
assert(!explicit.items.some(item=>item.exerciseId==='lib_26'),'excluded Barbell Row must not become a positive explicit item');
assert(!explicit.signal,'a generic back workout with only a negative exercise mention should stay in generated-workout mode');

explicit=w.coachParseExplicitWorkout("legs workout, don't include back squats",'hypertrophy');checks+=2;
assert(explicit.excludedExerciseIds.includes('lib_8'),'dont include back squats should exclude Back Squat');
assert(!w.coachParseTargetExclusions("legs workout, don't include back squats").keys.includes('back'),'Back Squat exclusion must not exclude the Back target');

explicit=w.coachParseExplicitWorkout('back workout, avoid chest supported rows','hypertrophy');checks+=2;
assert(explicit.excludedExerciseIds.includes('lib_29'),'avoid chest supported rows should exclude Chest Supported Row');
assert(!w.coachParseTargetExclusions('back workout, avoid chest supported rows').keys.includes('chest'),'Chest Supported Row exclusion must not exclude Chest');

// Experience/laterality natural language.
[
  ["I'm a newbie",'beginner'],
  ["I'm a rookie lifter",'beginner'],
  ["im brand new and dont know what im doing",'beginner'],
  ["new to the gym and just getting started",'beginner'],
  ["starting out with lifting",'beginner'],
  ["I've never lifted before",'beginner'],
  ["I'm a seasoned lifter",'advanced'],
  ["I've been training for years",'advanced'],
  ["I have some lifting experience",'intermediate']
].forEach(([p,level])=>{checks++;assert.equal(w.coachParseTrainingExperience(p),level,`experience parse failed: ${p}`)});

[
  ['one side at a time','unilateral'],
  ['alternate arms','unilateral'],
  ['both at once','bilateral'],
  ['both arms together','bilateral'],
  ['separately and together','mixed'],
  ['each arm individually and together','mixed']
].forEach(([p,type])=>{checks++;assert.equal(w.coachParseLateralityPreference(p),type,`laterality parse failed: ${p}`)});

// Effort/rest grammar with spoken numbers.
let grammar=w.coachParseLiftingGrammar('RPE eight, ninety seconds between sets');checks+=2;
assert.equal(grammar.targetRIR,2,'RPE eight should become 2 RIR');
assert.equal(grammar.restSeconds,90,'ninety seconds between sets should parse');

grammar=w.coachParseLiftingGrammar('leave two reps in the tank');checks++;
assert.equal(grammar.targetRIR,2);
grammar=w.coachParseLiftingGrammar('two reps shy of failure');checks++;
assert.equal(grammar.targetRIR,2);
grammar=w.coachParseLiftingGrammar('one minute rest');checks++;
assert.equal(grammar.restSeconds,60);

// v0.60 top/backoff phrasing resilience.
grammar=w.coachParseLiftingGrammar('one top set for three to five, then two back down sets for six to eight, drop ten percent');checks+=6;
assert.equal(grammar.topBackoff?.enabled,true);
assert.equal(grammar.topBackoff.topMinReps,3);
assert.equal(grammar.topBackoff.topMaxReps,5);
assert.equal(grammar.topBackoff.backoffSets,2);
assert.equal(grammar.topBackoff.backoffMinReps,6);
assert.equal(grammar.topBackoff.backoffPercent,90);

grammar=w.coachParseLiftingGrammar('top set five reps then three lighter sets eight reps, eighty five percent backoffs');checks+=5;
assert.equal(grammar.topBackoff?.enabled,true);
assert.equal(grammar.topBackoff.topMinReps,5);
assert.equal(grammar.topBackoff.backoffSets,3);
assert.equal(grammar.topBackoff.backoffMinReps,8);
assert.equal(grammar.topBackoff.backoffPercent,85);

grammar=w.coachParseLiftingGrammar('no backoff sets');checks++;
assert.equal(grammar.topBackoff?.enabled,false);

// Exercise-name ASR/typo repair.
[
  ['romanian dead left','Romanian Deadlift'],
  ['dead left','Deadlift'],
  ['lat pull town','Lat Pulldown'],
  ['preacher coral','Preacher Curl'],
  ['bulgarian split squad','Bulgarian Split Squat'],
  ['dumbell lateral raise','Dumbbell Lateral Raise'],
  ['r d l','Romanian Deadlift'],
  ['o h p','Overhead Press'],
  ['assisted pull ups','Assisted Pull-Up'],
  ['rope push downs','Rope Triceps Pushdown']
].forEach(([p,n])=>checkExercise(p,n));

// Ambiguous/underspecified input should not be confidently hallucinated.
for(const prompt of [
  'I wanna get after it',
  'make me sweat',
  'give me something hard',
  'work the upper',
  'whatever is good today',
  'I have time to train'
])checkNoTarget(prompt);

checks++;
const ambiguous=w.coachUnderstandExercisePhrase('press');
assert.notEqual(ambiguous.level,'high','generic "press" should not silently resolve to one exercise');

// False-positive guards from exercise phrases that contain body-part words.
checks++;
assert(!w.coachParseTargets('single arm cable row').keys.includes('arms'),'single-arm exercise wording must not become Arms target');
checks++;
assert(!w.coachParseTargets('chest supported row').keys.includes('chest'),'chest-supported must not become Chest target');
checks++;
assert(!w.coachParseTargets('back squat').keys.includes('back'),'Back Squat must not become Back target');

// Catalog-wide one-edit typo fuzz. Long exercise names should remain recoverable,
// and no mutation may confidently resolve to the wrong exercise.
let mutationChecks=0;
function mutateExerciseName(name){
  const words=w.coachNormalizeGymText(name).split(' ').filter(Boolean);
  let index=words.findIndex(token=>token.length>=6);
  if(index<0)index=words.findIndex(token=>token.length>=5);
  if(index<0)return null;
  const token=words[index],cut=Math.max(1,Math.floor(token.length/2));
  words[index]=token.slice(0,cut)+token.slice(cut+1);
  return words.join(' ');
}
for(const ex of w.visibleExercises()){
  const typo=mutateExerciseName(ex.name);if(!typo)continue;
  const out=w.coachUnderstandExercisePhrase(typo);
  mutationChecks++;
  if(out.level==='high'){
    assert.equal(out.exercise?.id,ex.id,`confidently wrong typo resolution: "${typo}" -> ${out.exercise?.name}, expected ${ex.name}`);
  }else{
    assert(out.alternatives.some(row=>row.exercise.id===ex.id),`correct exercise missing from typo clarification candidates: "${typo}" (${ex.name})`);
  }
}
assert(mutationChecks>=250,'catalog typo fuzz should cover most exercise names');
checks+=mutationChecks;

console.log(`Coach Swolecat language-resilience PASS: ${checks} checks including ${mutationChecks} catalog typo mutations`);
dom.window.close();
