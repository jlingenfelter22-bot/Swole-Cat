
// Saved-program Coach editor acceptance: proposals must not rewrite live plans
// until Apply, and changed routines must be copy-on-write with history intact.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
 }
});
await new Promise(resolve=>setTimeout(resolve,180));
const w=dom.window,doc=w.document,body=doc.getElementById('modalBody');
let lastToast='',modal='';
w.showToast=t=>{lastToast=String(t)};
w.openModal=(title,html)=>{modal=html;body.innerHTML=html};
const exA=w.exById('lib_12'),exB=w.exById('lib_19'),exC=w.exById('lib_21');
assert(exA&&exB&&exC,'baseline catalog should have tested exercises');
const config=ex=>({exerciseId:ex.id,sets:3,minReps:8,maxReps:12,
 restSeconds:90,trainingGoal:'general',mode:'double',progressionStrategy:'double'});
const a={id:'saved_edit_monday',name:'Monday Push',trainingMode:'track',description:'',
 exercises:[config(exA),config(exB)]};
const b={id:'saved_edit_wednesday',name:'Wednesday Pull',trainingMode:'track',description:'',
 exercises:[config(exA),config(exB)]};
const c={id:'saved_edit_friday',name:'Friday Legs',trainingMode:'track',description:'',
 exercises:[config(exC),config(exB)]};
const program={id:'saved_edit_program',name:'Existing 3-day split',
 routineIds:[a.id,b.id,c.id],frequency:3,preferredDays:[1,3,5],
 trainingMode:'guided',nextIndex:1,deload:{enabled:false,intervalWeeks:4},
 coachPlannedDays:[
  {label:'Monday Push',weekday:1,durationMinutes:60,equipmentLabel:'Gym'},
  {label:'Wednesday Pull',weekday:3,durationMinutes:60,equipmentLabel:'Gym'},
  {label:'Friday Legs',weekday:5,durationMinutes:60,equipmentLabel:'Gym'}
 ]};
const other={id:'saved_edit_other',name:'Other program using Wed',routineIds:[b.id],
 frequency:1,preferredDays:[3],trainingMode:'track',nextIndex:0};
const session={id:'old_session',programId:program.id,routineId:b.id,
 status:'finished',date:'2026-10-12T16:00:00.000Z',startDate:'2026-10-12T15:00:00.000Z',
 exercises:[{exerciseId:exA.id,sets:[{done:true,weight:75,reps:8,type:'working'}]}]};
w.eval('state.routines='+JSON.stringify([a,b,c])+';state.programs='+JSON.stringify([program,other])+
 ';state.sessions='+JSON.stringify([session])+';state.activeProgramId='+JSON.stringify(program.id)+';');
const baseline=w.eval('JSON.stringify({routines:state.routines,programs:state.programs,sessions:state.sessions})');
assert.match(w.programCard(program),/Edit with Coach/,'saved program card has visible Coach action');
assert.match(w.eval('openProgramCardMenu.toString()'),/Edit with Coach/,'saved program menu has the same entry');
assert.equal(w.coachOpenSavedProgramEditor(program.id),true);
assert(body.querySelector('.coach-saved-editor'));
assert(body.querySelector('button[onclick="coachApplySavedProgramEdits()"][disabled]'),
 'there is no Apply until the user proposes a change');
assert.equal(body.querySelectorAll('.coach-program-day-details').length,3);
function send(input){
 const box=doc.getElementById('coachSavedProgramPrompt');assert(box);
 box.value=input;
 w.coachSubmitSavedProgramEdit();
}
send('Wednesday 45 minutes');
let draft=w.eval('coachSavedProgramEditDraft');
assert.equal(draft.program.coachPlannedDays[1].durationMinutes,45);
assert.equal(draft.program.coachPlannedDays[0].durationMinutes,60);
assert.equal(draft.program.coachPlannedDays[2].durationMinutes,60);
assert.equal(JSON.stringify(draft.routines[1].exercises),JSON.stringify(b.exercises),'time target does not pretend to change working sets');
assert.match(body.textContent,/time target is now 45 min/i);
assert.equal(w.eval('JSON.stringify({routines:state.routines,programs:state.programs,sessions:state.sessions})'),baseline,
 'proposals cannot mutate the live state');
send('Tuesday 35 minutes');
assert.match(lastToast,/not part of this program/i);
assert.equal(w.eval('coachSavedProgramEditDraft').notes.length,1,'failed command leaves the draft unchanged');
send('move Wednesday to Thursday');
draft=w.eval('coachSavedProgramEditDraft');
assert.deepEqual(Array.from(draft.program.preferredDays),[1,4,5]);
assert.equal(draft.program.coachPlannedDays[1].weekday,4);
const midState=w.eval('JSON.stringify({routines:state.routines,programs:state.programs,sessions:state.sessions})');
assert.equal(midState,baseline,'weekday move remains a proposal');
send('remove '+exB.name+' from Thursday');
draft=w.eval('coachSavedProgramEditDraft');
assert.equal(draft.routines[1].exercises.length,1);
assert.equal(draft.routines[0].exercises.length,2,'other day remains untouched');
send('switch to Track Only');
assert.equal(w.eval('coachSavedProgramEditDraft.program.trainingMode'),'track');
send('remove quantum teleportation from Monday');
assert.match(lastToast,/not in this day|full name/i);
assert.equal(w.eval('coachSavedProgramEditDraft.routines[0].exercises.length'),2);
assert.equal(w.eval('JSON.stringify({routines:state.routines,programs:state.programs,sessions:state.sessions})'),baseline);

// Exactly one shared routine is rewritten by reference; never mutate the
// other Program's copy or a historical session.
assert.equal(w.coachApplySavedProgramEdits(),true,'explicit reviewed Apply succeeds');
const after=w.eval('({programs:state.programs,routines:state.routines,sessions:state.sessions})');
const edited=after.programs.find(p=>p.id===program.id),separate=after.programs.find(p=>p.id===other.id);
assert(edited&&separate);
assert.equal(edited.id,program.id,'program identity stable');
assert.equal(edited.nextIndex,1,'current next-workout progression stable');
assert.deepEqual(Array.from(edited.preferredDays),[1,4,5]);
assert.equal(edited.trainingMode,'track');
assert.equal(edited.routineIds[0],a.id,'untouched day keeps exact routine ID');
assert.notEqual(edited.routineIds[1],b.id,'modified day gets copy-on-write ID');
assert.equal(edited.routineIds[2],c.id,'untouched Friday keeps exact ID');
assert.equal(separate.routineIds[0],b.id,'other Program still references original routine');
assert.equal(after.routines.find(r=>r.id===b.id).exercises.length,2,
 'original shared routine is unmodified');
assert.equal(after.routines.find(r=>r.id===edited.routineIds[1]).exercises.length,1);
assert.equal(JSON.stringify(after.sessions),JSON.stringify([session]),
 'session history and logged loads remain bit-for-bit intact');

// Conflict between opening a draft and applying it is rejected, not merged.
assert.equal(w.coachOpenSavedProgramEditor(program.id),true);
send('Friday 45 minutes');
w.eval("state.programs.find(p=>p.id==='saved_edit_program').name='Changed elsewhere'");
assert.equal(w.coachApplySavedProgramEdits(),false);
assert.match(lastToast,/changed since Coach opened/i);

// Editing during an active workout must be denied.
w.eval("state.activeWorkout={programId:'saved_edit_program',routineId:'saved_edit_monday'}");
assert.equal(w.coachOpenSavedProgramEditor(program.id),false);
assert.match(lastToast,/Finish or cancel/i);

console.log('COACH_SAVED_PROGRAM_EDIT PASS '+JSON.stringify({
 visibleAction:true,reviewBeforeApply:true,scopeProtected:true,
 copyOnWrite:true,historyUnchanged:true,conflictRejected:true,
 activeWorkoutProtected:true,physicalAndroidReviewed:false
}));
dom.window.close();
