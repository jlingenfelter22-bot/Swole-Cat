import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const dom=new JSDOM(html,{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(window){
  window.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  window.alert=()=>{};window.confirm=()=>true;window.scrollTo=()=>{};
 }
});
await new Promise(resolve=>setTimeout(resolve,180));
const w=dom.window;
let modal='';
w.openModal=(title,html)=>{modal=html};
w.showToast=()=>{};
function start(prompt){
 w.eval('coachBuildDraft={request:coachParsePrompt('+JSON.stringify(prompt)+', "hypertrophy"),selectedIds:[],defaults:null,createdAt:"test"};');
 w.coachContinueRequest();
}
const req=p=>w.coachParsePrompt(p,'hypertrophy');
const cfg=p=>w.coachBrainResolveEquipment(p);
const d=()=>w.eval('coachBuildDraft');
const display=()=>d()?.selectedIds?.map(id=>w.exById(id)?.name);
const status=e=>w.coachBrainExerciseService().evaluateAvailability(e,d().request.brainEquipment.context).status;
const compare=p=>w.coachGenerateWorkout(p);

assert.equal(w.coachBrainNextQuickBuildQuestion(req('30 minute leg workout'))?.id,'equipment');
assert.equal(w.coachBrainNextQuickBuildQuestion(req('30 minute legs at a full gym')),null);
assert.equal(w.coachBrainNextQuickBuildQuestion(req('30 minute legs with dumbbells only')),null);
assert.equal(w.coachBrainNextQuickBuildQuestion(req('legs')),null,'duration first');
assert.equal(w.coachBrainNextQuickBuildQuestion(req('30 minute legs, bodyweight only')),null);
assert.equal(w.coachBrainExplicitEquipment(req('30 minute legs')),null);

start('Give me a leg workout');
assert.match(modal,/How much time do we have/,'time question for vague legs');
w.coachAnswerDuration(30);
assert.match(modal,/What equipment do you have access to today/,'equipment question after time');
assert.match(modal,/Gym \(common equipment\)/);
assert.match(modal,/Dumbbells \+ bodyweight/);
w.coachAnswerBrainEquipment('gym');
assert(d().selectedIds.length>=2,'30 minute gym legs has a plan');
assert.match(modal,/Start Workout Now/,'preview is visible');
assert.equal(d().request.duration,30);
assert.equal(d().request.brainEquipment.choice,'gym');
assert(d().brainComparison?.originalIds?.length>0,'legacy baseline comparison captured');
for(const id of d().selectedIds){
 const avail=w.coachBrainExerciseService().evaluateAvailability(id,w.coachBrainEquipmentConstraints(d().request));
 assert.equal(avail.status,'available',w.exById(id)?.name+' was not available');
}
const gymChoices=[...d().selectedIds];
const firstGym=display();
const previousGym=d().brainComparison.originalIds.map(id=>w.exById(id).name);
assert(firstGym.length<=3,'short leg session should not overload movement count');
assert(d().selectedIds.some(id=>w.exById(id).pattern==='knee_flexion'),
 'typical gym with common leg curl station should include knee-flexion hamstrings');
assert(d().selectedIds.filter(id=>w.exById(id).pattern==='hinge').length<=1,
 '30-minute gym legs should not stack multiple heavy hinge movements');
assert(firstGym.some(x=>/squat|leg press|lunge|extension/i.test(x)),JSON.stringify(firstGym));
assert(!firstGym.some(x=>/landmine|sled|ab wheel|power snatch/i.test(x)),'gym must not imply specialty stations');
const renderBefore=modal;
w.renderCoachPreview();assert.match(modal,/Gym \(common equipment\)/);
assert.match(modal,/common gym equipment/);

// Vague requests ask equipment afresh, even after previous question was answered.
start('Give me a 30 minute leg workout');
assert.match(modal,/What equipment do you have access to today/);
w.coachAnswerBrainEquipment('dumbbells');
if(d()?.selectedIds?.length){
 assert.equal(d().request.brainEquipment.choice,'dumbbells');
 assert(display().every(x=>!/(?:Barbell|Cable|Leg Press|Machine|Smith)/i.test(x)));
 for(const id of d().selectedIds)assert.equal(w.coachBrainExerciseService().evaluateAvailability(id,w.coachBrainEquipmentConstraints(d().request)).status,'available');
}else{
 assert.match(modal,/I couldn't build a balanced workout/);
}

// If no good bodyweight quad movement exists in catalog, Coach must not fake it.
start('30 minute leg workout');
w.coachAnswerBrainEquipment('bodyweight');
if(d()?.selectedIds?.length){
 assert(display().every(x=>w.exById(d().selectedIds[display().indexOf(x)])?.equipment==='bodyweight'));
 for(const id of d().selectedIds)assert.equal(w.coachBrainExerciseService().evaluateAvailability(id,w.coachBrainEquipmentConstraints(d().request)).status,'available');
}else assert.match(modal,/I couldn't build a balanced workout/);

// User can opt to skip the question, but not receive imaginary specialty equipment.
start('30 minute leg workout');
w.coachAnswerBrainEquipment('skip');
if(d()?.selectedIds?.length){
 assert.match(modal,/Equipment was skipped/);
 for(const id of d().selectedIds)assert.equal(w.coachBrainExerciseService().evaluateAvailability(id,w.coachBrainEquipmentConstraints(d().request)).status,'available');
}else assert.match(modal,/I couldn't build a balanced workout/);

// Explicit equipment skips needless questioning and does not leak from last request.
start('30 min chest workout with dumbbells only');
assert(!/What equipment do you have access to today/.test(modal));
assert(d()?.selectedIds?.length>0);
assert(d().request.brainEquipment);
assert(display().every(x=>!/(?:Barbell|Cable|Machine|Smith)/i.test(x)));
start('30 min chest workout with full gym equipment');
assert(!/What equipment do you have access to today/.test(modal));
assert(d().request.brainEquipment.choice==='gym');

// Multi-turn conversation should honor squat avoidance across subsequent changes.
start('30 minute legs at a full gym');
assert(d().selectedIds.length>0);
const n1=display().join(', ');
const avoid=w.coachRefineDraftText('do something different other than squats');
assert.equal(avoid.ok,true,JSON.stringify(avoid));
assert(d().request.excludedMovementPatterns.includes('squat'));
assert(d().selectedIds.every(id=>w.exById(id).pattern!=='squat'),'squat family remained: '+display());
const noSquatIds=[...d().selectedIds];
const time=w.coachRefineDraftText('make it 45 minutes');
assert.equal(time.ok,true,JSON.stringify(time));
assert(d().request.excludedMovementPatterns.includes('squat'));
assert(d().selectedIds.every(id=>w.exById(id).pattern!=='squat'));
const reallow=w.coachRefineDraftText('bring squats back');
assert(reallow.ok);
assert(!d().request.excludedMovementPatterns.includes('squat'));
const removeLunge=w.coachRefineDraftText('no lunges');
assert(removeLunge.ok);
assert(d().selectedIds.every(id=>w.exById(id).pattern!=='lunge'));
assert(d().request.excludedMovementPatterns.includes('lunge'));
assert.equal(d().request.brainEquipment.choice,'gym','follow-up should not re-ask equipment');
assert(d().brainComparison);

// A clear equipment change during conversation must revise the equipment constraints.
const swapped=w.coachRefineDraftText('actually just dumbbells');
assert(swapped.ok);
assert(d().request.allowedEquipment.includes('dumbbell'));
assert(!d().request.allowedEquipment.includes('barbell'));
assert(d().request.brainEquipment.choice==='explicit');
for(const id of d().selectedIds)assert.equal(w.coachBrainExerciseService().evaluateAvailability(id,w.coachBrainEquipmentConstraints(d().request)).status,'available');
const idsNow=[...d().selectedIds];
w.renderCoachPreview();
assert.match(modal,/REFINE \/\/ TALK TO COACH/);

// Preview Swap stays within known equipment; old external weight/rep targets are not copied across incompatible modes.
w.coachSwapExercise(0);
for(const id of d().selectedIds)assert.equal(w.coachBrainExerciseService().evaluateAvailability(id,w.coachBrainEquipmentConstraints(d().request)).status,'available');
assert(d().selectedIds.every(id=>!d().request.excludedExerciseIds.includes(id)));

// Do not accidentally mutate other accounts or persist equipment between fresh requests.
const ctxA={equipment:{available:['barbell','plates','bench'],complete:true}};
const ctxB={equipment:{available:['bodyweight','exercise_space'],complete:true}};
assert.equal(w.coachBrainExerciseService().evaluateAvailability('lib_0',ctxA).status,'available');
assert.equal(w.coachBrainExerciseService().evaluateAvailability('lib_0',ctxB).status,'unavailable');
assert.equal(w.coachBrainExerciseService().evaluateAvailability('lib_0',ctxA).status,'available');

console.log('Brain conversation and equipment-aware preview PASS',JSON.stringify({gym:firstGym,legacyGym:previousGym,afterNoSquats:noSquatIds.map(id=>w.exById(id)?.name),newIds:idsNow.length,legacyBaseline:gymChoices.length}));
dom.window.close();
