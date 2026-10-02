import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const now=new Date().toISOString();
const originalBench={
  exerciseId:'lib_0',sets:3,minReps:3,maxReps:5,increment:5,mode:'double',
  progressionStrategy:'top_backoff',adaptiveProgression:true,
  setStructure:{type:'top_backoff',topSets:1,backoffSets:2,backoffPercent:90,topMinReps:3,topMaxReps:5,backoffMinReps:6,backoffMaxReps:8},
  trainingGoal:'strength',resetPercent:7.5,restSeconds:180,targetRIR:2,supersetGroup:null
};
const row={exerciseId:'lib_28',sets:3,minReps:8,maxReps:12,increment:5,mode:'double',progressionStrategy:'double',adaptiveProgression:true,setStructure:null,trainingGoal:'hypertrophy',resetPercent:7.5,restSeconds:120,targetRIR:2,supersetGroup:null};
const curl={exerciseId:'lib_41',sets:3,minReps:10,maxReps:12,increment:5,mode:'double',progressionStrategy:'double',adaptiveProgression:true,setStructure:null,trainingGoal:'hypertrophy',resetPercent:7.5,restSeconds:75,targetRIR:1,supersetGroup:null};
const sessionHistory=[{
  id:'hist1',routineId:'r1',routineName:'Push Pull',status:'finished',date:now,
  exercises:[{exerciseId:'lib_0',sets:[{weight:185,reps:5,done:true,rir:2,type:'working',role:'top'}],notes:''}]
}];

const dom=new JSDOM(html,{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(window){
   window.localStorage.setItem('overload_v3',JSON.stringify({
     ui:{onboardingDone:true,haptics:false,keepAwake:false},
     settings:{defaultMin:8,defaultMax:12,defaultSets:3,defaultIncrement:5,coachAliases:{}},
     profile:{name:'Test',unit:'lb'},
     routines:[{id:'r1',name:'Push Pull',description:'test routine',trainingMode:'guided',exercises:[originalBench,row,curl]}],
     sessions:sessionHistory
   }));
   window.alert=()=>{};window.confirm=()=>true;window.scrollTo=()=>{};
 }
});
await new Promise(r=>setTimeout(r,160));
const w=dom.window;
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};

assert.equal(w.eval('COACH_ROUTINE_CONTROL_VERSION'),'0.61.0');
assert.equal(w.openCoachRoutineControl('r1'),true,'saved routine should open in Coach control');
let draft=w.eval('coachRoutineSession.working');
assert.notEqual(draft,w.eval("state.routines.find(r=>r.id==='r1')"),'Coach must edit a draft copy, not live state');

let result=w.coachRoutineApplyCommand('make the second exercise 4 sets of 8 to 10 reps');
assert(result.ok&&result.changed,'ordinal config edit should succeed');
draft=w.eval('coachRoutineSession.working');
assert.equal(draft.exercises[1].exerciseId,'lib_28');
assert.equal(draft.exercises[1].sets,4);
assert.equal(draft.exercises[1].minReps,8);
assert.equal(draft.exercises[1].maxReps,10);
assert.equal(draft.exercises[2].sets,3,'surgical edit must not touch unrelated curl config');

result=w.coachRoutineApplyCommand('move that before bench press');
assert(result.ok&&result.changed,'conversational reference should move last-touched exercise');
draft=w.eval('coachRoutineSession.working');
assert.equal(draft.exercises[0].exerciseId,'lib_28','that one should refer to the row just edited');
assert.equal(draft.exercises[1].exerciseId,'lib_0');

result=w.coachRoutineApplyCommand('undo');
assert(result.ok);
draft=w.eval('coachRoutineSession.working');
assert.equal(draft.exercises[0].exerciseId,'lib_0','undo should restore prior order');
result=w.coachRoutineApplyCommand('redo');
assert(result.ok);
draft=w.eval('coachRoutineSession.working');
assert.equal(draft.exercises[0].exerciseId,'lib_28','redo should restore moved order');

result=w.coachRoutineApplyCommand('why is that one here');
assert(result.ok&&!result.changed,'explanation should not mutate routine');
assert(/primarily here for/i.test(result.message),'exercise explanation should include role/muscle rationale');

result=w.coachRoutineApplyCommand('swap bench press for dumbbell bench press');
assert(result.ok&&result.changed,'named swap should work');
draft=w.eval('coachRoutineSession.working');
const dbBench=draft.exercises.find(x=>x.exerciseId==='lib_2');
assert(dbBench,'dumbbell bench should replace barbell bench');
assert.equal(dbBench.progressionStrategy,'top_backoff','compatible compound swap should preserve top/backoff progression');
assert.equal(dbBench.setStructure?.type,'top_backoff');
assert.equal(dbBench.adaptiveProgression,true);

const beforeAddCount=draft.exercises.length;
result=w.coachRoutineApplyCommand('add rear delts');
assert(result.ok&&result.changed,'target-based addition should choose a routine-aware movement');
draft=w.eval('coachRoutineSession.working');
assert.equal(draft.exercises.length,beforeAddCount+1);
const added=draft.exercises.at(-1),addedMeta=w.exerciseMuscleMetadata(w.exById(added.exerciseId));
assert(addedMeta.primary.includes('rear_delts')||addedMeta.secondary.includes('rear_delts'),'target-based add must actually serve rear delts');

const beforeHistory=JSON.stringify(w.eval('state.sessions'));
result=w.coachRoutineApplyCommand('make this 25 minute routine');
assert(result.ok&&result.changed,'duration request should be understood');
draft=w.eval('coachRoutineSession.working');
assert.equal(draft.targetDuration,25);
assert(w.coachRoutineEstimateMinutes(draft)<=w.coachRoutineEstimateMinutes({exercises:[originalBench,row,curl]})+5,'duration edit should not expand the routine');

assert.equal(w.coachRoutineSave(),true,'explicit save should persist draft');
const saved=w.eval("state.routines.find(r=>r.id==='r1')");
assert(saved,'routine must remain saved under original id');
assert.equal(saved.targetDuration,25);
assert.equal(JSON.stringify(w.eval('state.sessions')),beforeHistory,'routine edits must never rewrite completed history');
assert(saved.exercises.some(x=>x.exerciseId==='lib_2'),'saved routine should contain swapped movement');

w.openCoachRoutineControl('r1');
const initial=w.eval('coachRoutineSession.working.exercises.length');
result=w.coachRoutineApplyCommand('add face pull');
assert(result.ok&&result.changed);
assert.equal(w.eval('coachRoutineSession.working.exercises.length'),initial+1);
w.coachRoutineCancel();
assert.equal(w.eval("state.routines.find(r=>r.id==='r1').exercises.length"),saved.exercises.length,'cancel must discard unsaved Coach mutations');

console.log('Coach Swolecat v0.61 routine-control PASS: surgical edits, references, undo/redo, explanations, duration fitting, preservation, and explicit persistence');
dom.window.close();
