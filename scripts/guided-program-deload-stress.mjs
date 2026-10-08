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
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await wait(125);
const w=dom.window;
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
const read=()=>JSON.parse(w.localStorage.getItem('overload_v3'));

w.installRegressionFixturePlan();
await wait(50);
let st=read();
assert(st.programs.length>0&&st.routines.length>0,'fixture routines and programs');
const initialProgramCount=st.programs.length;
const routineId=st.routines[0].id;
const programId=st.programs[0].id;
const exerciseId=st.routines[0].exercises[0].exerciseId;
const normalSets=st.routines[0].exercises[0].sets;
const esc=x=>JSON.stringify(x);

// New program must not silently preselect 'inherit' and must require a user choice.
w.newProgram();
assert.equal(w.document.getElementById('programTrainingMode')?.value,'','new program mode must start unselected');
w.saveProgram();
assert.equal(read().programs.length,initialProgramCount,'unselected training mode must block save');
w.changeProgramTrainingMode('guided');
assert(w.document.getElementById('programDeloadEnabled'),'guided mode must display optional deload toggle');
assert.equal(w.document.getElementById('programDeloadEnabled').checked,false,'deload off by default');
w.document.getElementById('programDeloadEnabled').checked=true;
w.toggleProgramDeload();
assert.equal(w.document.getElementById('programDeloadEvery').value,'4','fourth week should be suggested preset');
assert.match(w.document.body.textContent,/Week 4: Deload/,'preview should explain when deload starts');
w.document.getElementById('programDeloadEvery').value='custom';
w.changeProgramDeloadCadence();
assert(w.document.getElementById('programDeloadCustom'),'custom interval must remain visible');
w.document.getElementById('programDeloadCustom').value='9';
w.eval('syncProgramDraftInputs()');
w.addProgramRoutine(routineId);
w.saveProgram();
st=read();
const created=st.programs.find(p=>p.id!==programId);
assert(created,'should save program after explicit mode choice');
assert.equal(created.trainingMode,'guided');
assert.equal(created.deload.enabled,true);
assert.equal(created.deload.intervalWeeks,9);

w.newProgram();
w.changeProgramTrainingMode('track');
assert(!w.document.getElementById('programDeloadEnabled'),'track mode must not show guided deload controls');
w.eval('programDraft=null;closeModal()');

const now=new Date();
const monday=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
monday.setDate(monday.getDate()-((monday.getDay()+6)%7));
const weekDate=offset=>{const d=new Date(monday);d.setDate(d.getDate()+offset*7+1);return d.toISOString()};
const weekAt=offset=>{const d=new Date(monday);d.setDate(d.getDate()+offset*7+1);return d};
const sample=(i)=>({
 id:'guided_week_'+i,programId,routineId,routineName:'Fixture Guided',
 trainingMode:'guided',programPhase:'normal',date:weekDate(i-3),status:'finished',
 exercises:[{exerciseId,skipped:false,sets:Array.from({length:3},()=>({done:true,type:'working',weight:100,reps:8+(i-1)*2,rir:2,pr:''}))}]
});
w.eval('state.sessions='+JSON.stringify([sample(1),sample(2),sample(3)])+';state.activeWorkout=null;'+
 'state.programs.find(p=>p.id==='+esc(programId)+').trainingMode="guided";'+
 'state.programs.find(p=>p.id==='+esc(programId)+').deload={enabled:true,intervalWeeks:4,decisions:{},deferNext:false,deferredFrom:""};save();');
assert.equal(w.programDeloadContext(w.eval('programById('+esc(programId)+')')).weekIndex,4);
assert.equal(w.programDeloadContext(w.eval('programById('+esc(programId)+')')).needsReview,true,'week four must be due');
w.startProgramWorkout(programId);
await wait(25);
assert.equal(read().activeWorkout,null,'due deload must require explicit user choice');
assert.match(w.document.getElementById('modalBody')?.textContent||'',/Deload week is due/);
w.chooseProgramDeload(programId,'deload',0);
await wait(100);
st=read();
assert(st.activeWorkout,'confirmation should launch program');
assert.equal(st.activeWorkout.programPhase,'deload','phase must be recorded on active workout');
assert.equal(st.activeWorkout.programWeekIndex,4,'active deload belongs to week four');
const working=st.activeWorkout.exercises[0].sets.filter(s=>s.type==='working');
assert.equal(working.length,Math.max(1,Math.ceil(normalSets/2)),'deload should reduce working sets without modifying saved routine');
assert.equal(st.routines.find(r=>r.id===routineId).exercises[0].sets,normalSets,'saved routine structure must not change');
assert.match(w.document.getElementById('workoutArea').textContent,/Deload week/i,'active screen must identify deload');
assert.equal(w.previousExercise(exerciseId,programId).sets[0].reps,12,'prior normal exposure remains baseline');

// Persist intentional deload performance without corrupting future strength comparisons.
w.eval('state.activeWorkout.exercises[0].sets.filter(s=>s.type==="working").forEach(s=>{s.done=true;s.weight=80;s.reps=8;s.rir=4});saveActiveWorkout()');
w.finalizeWorkout(false);
await wait(85);
st=read();
const done=st.sessions.at(-1);
assert.equal(done.programPhase,'deload','completed history must retain phase');
assert.equal(done.programWeekIndex,4);
assert.equal(w.previousExercise(exerciseId,programId).sets[0].reps,12,'deload repetitions must not become next progression baseline');
assert.equal(w.previousExercise(exerciseId,programId).sets[0].weight,100,'deload weight must not lower next normal target');
assert.equal(w.sessionProgressHighlights(done).length,0,'deload should not yield misleading normal progression callouts');
assert(!w.coachProgressionExposureRows(exerciseId).some(x=>x.programPhase==='deload'),'Coach adaptive analysis must exclude deload');
w.renderHistory();
assert.match(w.document.getElementById('historyList').textContent,/DELOAD WEEK/,'History must label saved deload');

const fifth=w.programDeloadContext(w.eval('programById('+esc(programId)+')'),weekAt(1));
assert.equal(fifth.weekIndex,5,'fifth training week should follow deload');
assert.equal(fifth.needsReview,false,'next normal week must not repeat deload due notice');

const share=w.decodeSwoleCatShare(w.createProgramShareCode(programId));
assert.equal(share.program.deload.enabled,true,'program share should include preference');
assert.equal(share.program.deload.intervalWeeks,4);
assert(!share.program.deload.decisions,'recipient must not inherit personal deload decisions');
const imported=w.importSharedEnvelope(share);
assert(imported.program,'sharing should import the whole program');
assert.equal(imported.program.deload.enabled,true);
assert.equal(Object.keys(imported.program.deload.decisions).length,0,'import starts with no training-week history');

// No scheduled deloads and other modes cannot trigger deload review.
w.eval('state.programs.find(p=>p.id==='+esc(programId)+').deload.enabled=false;save();');
assert.equal(w.programDeloadContext(w.eval('programById('+esc(programId)+')')).needsReview,false,'opt-out must disable due status');

console.log('Guided program v0.82 PASS: required mode, opt-in/custom cadence, week-four review, active deload, protected normal baseline, history, Coach, sharing, and opt-out.');
dom.window.close();
