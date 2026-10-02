import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const now=Date.now(),ago=d=>new Date(now-d*86400000).toISOString();
const sets=(w,r,rir=2)=>Array.from({length:3},()=>({weight:w,reps:r,rir,done:true,type:'working'}));
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,beforeParse(window){
 window.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false},settings:{defaultMin:8,defaultMax:12,defaultSets:3,defaultIncrement:5,coachAliases:{}},profile:{name:'Audit',unit:'lb'},routines:[],programs:[],sessions:[],exercisePreferences:{}}));
 window.alert=()=>{};window.confirm=()=>true;window.scrollTo=()=>{};
}});
await new Promise(r=>setTimeout(r,160));
const w=dom.window;if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
const read=()=>JSON.parse(w.localStorage.getItem('overload_v3'));
const get=name=>w.allExercises().find(x=>x.name===name);
const bench=get('Barbell Bench Press'),incline=get('Incline Dumbbell Press'),machine=get('Dumbbell Bench Press'),row=get('Seated Cable Row')||get('Cable Row'),squat=get('Back Squat');
assert(bench&&incline&&machine&&row&&squat);

const cfg=(exerciseId,min=8,max=10,goal='hypertrophy')=>({exerciseId,sets:3,minReps:min,maxReps:max,increment:5,mode:'double',progressionStrategy:'double',adaptiveProgression:true,setStructure:null,trainingGoal:goal,restSeconds:120});
const routines=[
 {id:'a',name:'Push A',trainingMode:'guided',exercises:[cfg(bench.id,6,8),cfg(machine.id),cfg(row.id)]},
 {id:'b',name:'Push B',trainingMode:'guided',exercises:[cfg(bench.id,6,8),cfg(incline.id),cfg(row.id)]},
 {id:'c',name:'Leg Day',trainingMode:'guided',exercises:[cfg(squat.id,5,5,'strength')]}
];
const program={id:'p',name:'Serious Program',routineIds:['a','b','c'],frequency:3,preferredDays:[1,2,5],trainingMode:'inherit',nextIndex:0};
w.eval('state.routines='+JSON.stringify(routines)+';state.programs=['+JSON.stringify(program)+'];state.activeProgramId="p";save()');

const sessions=[];
[27,20,13,6].forEach((d,i)=>sessions.push({id:'x'+i,programId:'p',routineId:i%2?'b':'a',routineName:i%2?'Push B':'Push A',status:'finished',date:ago(d),exercises:[{exerciseId:bench.id,sets:sets(185,6,1)},{exerciseId:row.id,sets:sets(120+i*10,8,2)},{exerciseId:i%2?incline.id:machine.id,sets:sets(90+i*5,8,2)}]}));
sessions.push({id:'x4',programId:'p',routineId:'a',routineName:'Push A',status:'finished',date:ago(2),exercises:[{exerciseId:bench.id,sets:sets(185,6,1)},{exerciseId:row.id,sets:sets(165,8,2)},{exerciseId:machine.id,sets:sets(110,8,2)}]});
sessions.push({id:'x5',programId:'p',routineId:'b',routineName:'Push B',status:'finished',date:ago(1),exercises:[{exerciseId:bench.id,sets:sets(185,6,1)},{exerciseId:row.id,sets:sets(175,8,2)},{exerciseId:incline.id,sets:sets(115,8,2)}]});
w.eval('state.sessions='+JSON.stringify(sessions)+';save()');

assert.equal(w.eval('COACH_PROGRAM_AUDIT_VERSION'),'0.63.0');
const before=JSON.stringify({programs:read().programs,routines:read().routines,sessions:read().sessions});
const audit=w.coachProgramAudit('p');
assert(audit);assert.equal(audit.routines.length,3);
assert(audit.coverageRows.find(x=>x.key==='lower body').plannedSets>0);
assert.equal(audit.coverageRows.find(x=>x.key==='lower body').actualSets,0);
for(const type of ['adherence','slot_gap','actual_coverage_gap','redundancy','distribution','plateau_high_effort','progressing'])assert(audit.findings.some(x=>x.type===type),'missing '+type);
const distribution=audit.findings.find(x=>x.type==='distribution'&&x.evidence==='actual_adjacent_sessions');
assert(distribution,'distribution must be supported by actual adjacent completed Program sessions rather than positional preferred-day assumptions');
assert.match(distribution.text,/completed Program days|on .* and .* on /i);
assert(!audit.findings.some(x=>/Push A \(Mon\).*Push B \(Tue\)/i.test(x.text)),'preferred weekdays must never be positionally assigned to routine slots');
assert.equal(JSON.stringify({programs:read().programs,routines:read().routines,sessions:read().sessions}),before);

assert.equal(w.coachProgramAuditIntent('audit my program').handled,true);
assert.equal(w.coachProgramAuditIntent('build me a 3 day program').handled,false);
assert.equal(w.coachTryProgramAuditQuestion('how is my program actually going?',{render:false}),true);
w.coachTryProgramAuditQuestion('audit my program',{render:true});
assert.match(w.document.getElementById('modalBody').textContent,/PROGRAM AUDIT/i);

const plateau=audit.findings.find(x=>x.type==='plateau_high_effort');
w.coachProgramAuditAction('p',plateau.id);
const routineSession=w.eval('coachRoutineSession?{routineId:coachRoutineSession.routineId,lastResponse:coachRoutineSession.lastResponse}:null');
assert.equal(routineSession.routineId,plateau.routineId);
assert.match(routineSession.lastResponse,/Program audit:/i);
assert.equal(JSON.stringify({programs:read().programs,routines:read().routines,sessions:read().sessions}),before);

w.eval('coachRoutineSession=null');w.renderPrograms();
assert.match(w.document.getElementById('programList').textContent,/Coach Audit/i);
console.log('Coach Swolecat v0.63 Program auditor PASS');
dom.window.close();
