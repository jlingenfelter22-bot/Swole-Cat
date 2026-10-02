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
const read=()=>JSON.parse(dom.window.localStorage.getItem('overload_v3'));

await wait(100);
const w=dom.window;
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};

w.installRegressionFixturePlan();
let state=read();
const program=state.programs[0];
const sourceRoutine=state.routines.find(r=>r.id===program.routineIds[0]);
assert(program&&sourceRoutine,'fixture must provide a program and routine');

w.eval(`
 const custom={id:uid(),name:'Beta Tester Cable Sweep',muscle:'Chest',equipment:'cable',pattern:'chest_fly',primaryMuscles:['chest'],secondaryMuscles:['front_delts'],movementFamily:'chest_fly',custom:true};
 state.customExercises.push(custom);
 state.routines.find(r=>r.id==='${sourceRoutine.id}').exercises.push({exerciseId:custom.id,sets:2,minReps:10,maxReps:15,increment:5,mode:'double',progressionStrategy:'double',adaptiveProgression:false,setStructure:null,trainingGoal:'hypertrophy',resetPercent:7.5,restSeconds:75,targetRIR:2,supersetGroup:null});
 save();
`);
state=read();

const routineCode=w.createRoutineShareCode(sourceRoutine.id);
assert.match(routineCode,/^SWOLECAT1\.[0-9a-f]{8}\.[A-Za-z0-9_-]+$/,'routine share code should be versioned and self-contained');
const routineEnvelope=w.decodeSwoleCatShare('Full message from a friend:\n'+routineCode+'\nHave fun');
assert.equal(routineEnvelope.kind,'routine');
assert.equal(routineEnvelope.format,'swole-cat-share');
assert(routineEnvelope.customExercises.some(ex=>ex.name==='Beta Tester Cable Sweep'),'custom exercises used by a shared routine must travel with it');
assert(!('sessions' in routineEnvelope),'share envelope must never contain completed workout history');
assert(!('profile' in routineEnvelope),'share envelope must never contain profile data');
assert(!('activeWorkout' in routineEnvelope),'share envelope must never contain active workout state');
assert(!('bodyweight' in routineEnvelope),'share envelope must never contain bodyweight');
assert(!routineEnvelope.routine.archivedAt,'archive state must not travel');
assert(!routineEnvelope.routine.sourceSessionId,'source-session linkage must not travel');

const damaged=routineCode.slice(0,-1)+(routineCode.endsWith('A')?'B':'A');
assert.throws(()=>w.decodeSwoleCatShare(damaged),/corrupted|decode|valid/i);

const programCode=w.createProgramShareCode(program.id);
const programEnvelope=w.decodeSwoleCatShare(programCode);
assert.equal(programEnvelope.kind,'program');
assert.equal(programEnvelope.program.routineKeys.length,program.routineIds.length,'program order must be preserved');
assert.equal(programEnvelope.routines.length,new Set(program.routineIds).size,'program should bundle each referenced routine blueprint once');
assert(!('nextIndex' in programEnvelope.program),'sender program progress must not travel');
assert(!('sessions' in programEnvelope),'program package must not include history');

const senderRoutineIds=[...program.routineIds];
const senderProgramId=program.id;
w.eval(`
 state.profile.unit='kg';
 state.customExercises=[];
 state.routines=[];
 state.programs=[];
 state.activeProgramId=null;
 state.sessions=[];
 state.activeWorkout=null;
 save();
`);
const imported=w.importSharedEnvelope(programEnvelope);
assert(imported.program,'program import should create a program');
assert.equal(imported.program.nextIndex,0,'imported program must start fresh at Day 1');
assert.equal(imported.routines.length,programEnvelope.routines.length,'every bundled routine should import');
assert(imported.program.routineIds.every(id=>imported.routines.some(r=>r.id===id)),'program must point at newly imported local routine IDs');
assert(imported.program.routineIds.every(id=>!senderRoutineIds.includes(id)),'sender routine IDs must never be reused on the receiver');
assert.notEqual(imported.program.id,senderProgramId,'sender program ID must never be reused');
assert(imported.routines.every(r=>r.archivedAt==null),'imported routines must be active local copies');
const importedCustom=w.eval("state.customExercises.find(ex=>ex.name==='Beta Tester Cable Sweep')");
assert(importedCustom,'required custom exercise should be reconstructed locally');
const importedCustomUse=w.eval(`state.routines.flatMap(r=>r.exercises).find(re=>re.exerciseId==='${importedCustom.id}')`);
assert(importedCustomUse,'imported routine should point at remapped custom exercise ID');
assert(Math.abs(Number(importedCustomUse.increment)-2.27)<0.011,'5 lb progression jump should convert to about 2.27 kg');
state=read();
assert.equal(state.sessions.length,0,'importing a plan must not create history');
assert.equal(state.activeWorkout,null,'importing a plan must not create an active workout');
assert.equal(state.activeProgramId,null,'importing a program must not silently make it active');

const customCountBefore=state.customExercises.length;
w.importSharedEnvelope(programEnvelope);
state=read();
assert.equal(state.customExercises.length,customCountBefore,'re-importing the same custom definition should reuse its exact local match');

w.openShareImport('message '+routineCode);
assert(w.document.getElementById('shareImportInput'),'universal importer should render one paste field');
w.document.getElementById('shareImportInput').value='message '+routineCode;
w.previewShareImport();
assert.match(w.document.getElementById('modalTitle').textContent,/Import preview/i);
assert.match(w.document.getElementById('modalBody').textContent,/Private data stays private/i);
w.closeModal();

assert.match(html,/onclick="openShareImport\(\)">Import</,'Routines screen should expose one universal Import action');
assert.match(html,/openRoutineShare\('/,'routine cards should expose Share');
assert.match(html,/openProgramShare\('/,'program cards should expose Share');
assert.match(html,/capacitorPlugin\('Share'\)/,'sharing should prefer the native Android share sheet');

dom.window.close();
console.log('Swole Cat v0.66.0 local sharing PASS: versioned routine/program codes, custom exercises, unit conversion, safe ID remap, preview, and private-data isolation');
