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

req=w.coachParsePrompt('full body but skip calves','hypertrophy');checks++;
assert(req.targetKeys.includes('full body'),'full-body request should remain');
assert(req.excludedTargetRegions.includes('calves')&&!req.targetRegions.includes('calves'),'skip calves should subtract calves from a broad target');
const noCalfDraft=w.coachGenerateWorkout({...req,duration:60});
assert(noCalfDraft,'full body minus calves should still generate');
for(const id of noCalfDraft.selectedIds){
  const meta=w.exerciseMuscleMetadata(w.exById(id));
  assert(![...meta.primary,...meta.secondary].includes('calves'),'hard excluded calves leaked into workout');
}

// Experience/laterality natural language.
[
  ["I'm a newbie",'beginner'],
  ["I'm a rookie lifter",'beginner'],
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

console.log(`Coach Swolecat language-resilience PASS: ${checks} curated language checks`);
dom.window.close();
