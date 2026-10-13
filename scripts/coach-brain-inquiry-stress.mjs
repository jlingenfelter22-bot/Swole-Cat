import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const dom=new JSDOM(html,{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(window){
  window.localStorage.setItem('overload_v3',JSON.stringify({
   ui:{onboardingDone:true,haptics:false,keepAwake:false},
   settings:{defaultMin:8,defaultMax:12,defaultSets:3,defaultIncrement:5,coachAliases:{}}
  }));
  window.alert=()=>{};window.confirm=()=>true;window.scrollTo=()=>{};
 }
});
await new Promise(r=>setTimeout(r,190));
const w=dom.window;
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};

const brain=w.SwoleCatRuntime.getService('brain');
assert(brain&&brain.version.startsWith('0.89'),'Brain must register as runtime service');
const request=w.coachParsePrompt('Build a 30-minute leg workout','hypertrophy');
const question=brain.nextQuestion(request);
assert.equal(question?.id,'equipment','unknown equipment needs a useful question');
assert(question.options.some(o=>o.id==='full_gym'));
assert(question.options.some(o=>o.id==='dumbbells'));
assert(question.options.some(o=>o.id==='bodyweight'));
assert(question.options.some(o=>o.id==='skip'));

const exact=w.coachParsePrompt('30 minute leg workout with dumbbells only','hypertrophy');
assert.equal(brain.nextQuestion(exact),null,'explicit equipment must skip repeat question');
const gym=w.coachParsePrompt('30 min legs at a full gym','hypertrophy');
assert.equal(brain.nextQuestion(gym),null,'full gym access in prompt should bypass question');
assert.equal(brain.nextQuestion({...request,targetRegions:[]}),null,'existing target question has priority');
assert.equal(brain.nextQuestion({...request,duration:0}),null,'existing duration question has priority');
assert.equal(brain.nextQuestion(request,{mode:'program'}),null,'program followup is a separate stage');

const original=JSON.stringify(request);
const onlyBodyweight=brain.applyEquipmentAnswer(request,'bodyweight');
assert(onlyBodyweight.ok);
assert.equal(JSON.stringify([...onlyBodyweight.request.allowedEquipment]),JSON.stringify(['bodyweight']));
assert.equal(brain.nextQuestion(onlyBodyweight.request),null);
const db=brain.applyEquipmentAnswer(request,'dumbbells');
assert(db.ok);
assert(db.request.allowedEquipment.includes('dumbbell')&&db.request.allowedEquipment.includes('bodyweight'));
assert.equal(brain.nextQuestion(db.request),null);
const gymAnswer=brain.applyEquipmentAnswer(request,'full_gym');
assert(gymAnswer.ok);
assert(!gymAnswer.request.allowedEquipment.includes('sled'),'full gym should not imply specialized sled');
assert(!gymAnswer.request.allowedEquipment.includes('landmine'),'full gym should not imply specialized landmine');
const skipped=brain.applyEquipmentAnswer(request,'skip');
assert(skipped.ok);
assert.equal(skipped.request.brainEquipmentAnswer,'skipped');
assert.match(brain.equipmentAssumptionText(skipped.request),/not specified/);
const custom=brain.applyEquipmentAnswer(request,'custom','I have dumbbells and cables');
assert(custom.ok);
assert(custom.request.allowedEquipment.includes('dumbbell')&&custom.request.allowedEquipment.includes('cable'));
const invalid=brain.applyEquipmentAnswer(request,'custom','my home');
assert.equal(invalid.ok,false,'unsupported free text must not silently pick arbitrary equipment');
assert.equal(brain.applyEquipmentAnswer(request,'bogus').ok,false);
assert.equal(JSON.stringify(request),original,'Brain decisions must not mutate original request');

let promptModal='';
w.openModal=(title,markup)=>{promptModal=markup;};
w.eval('coachBuildDraft={request:coachParsePrompt("30-minute legs", "hypertrophy"),selectedIds:[],defaults:null,createdAt:"fixture"}');
w.coachContinueRequest();
assert.match(promptModal,/What equipment are you working with today/);
assert.match(promptModal,/coachAnswerBrainEquipment/);
w.coachAnswerBrainEquipment('bodyweight');
assert(!/What equipment are you working with today/.test(promptModal),'equipment question must be asked once per request');
assert(w.eval('coachBuildDraft.request.allowedEquipment.every(x=>x===\"bodyweight\")'));
assert(w.eval('coachBuildDraft.selectedIds.length>0'),'selected bodyweight plan should generate');
assert(w.eval('coachBuildDraft.selectedIds.every(id=>exById(id).equipment===\"bodyweight\")'),'selection must respect equipment');

w.eval('coachBuildDraft={request:coachParsePrompt("30-minute legs", "hypertrophy"),selectedIds:[],defaults:null,createdAt:"fixture"}');
w.coachContinueRequest();
w.coachAnswerBrainEquipment('skip');
assert(w.eval('coachBuildDraft.selectedIds.length>0'),'skip must produce an editable plan');
assert.match(promptModal,/Equipment was not specified/,'skip disclaimer must appear in preview');

const explicit=w.coachParseExplicitWorkout('3 sets of bench press for 20 reps','hypertrophy');
assert(explicit.items.length>0,'existing exact workout route remains functional');
console.log('Brain equipment inquiry and integration PASS');
dom.window.close();
