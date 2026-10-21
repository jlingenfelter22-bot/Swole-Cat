// QA of actual user's v0.93.7 silent video: clarify audit hierarchy,
// don't treat repeated full-body presses/rows as an exercise problem, and
// avoid presenting low attendance as a muscular training deficit.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const css=fs.readFileSync('src/styles/03-polish.css','utf8');
for(const text of ['.coach-audit-refresh .coach-audit-primary','.coach-audit-coverage',
 '.coach-audit-findings-label','min-height:48px','@media(max-width:430px)'])
 assert(css.includes(text),'Audit responsive stylesheet missing '+text);
const results=[];
for(const width of [320,360,390,430,480]){
 const dom=new JSDOM(html,{url:'https://swole-cat.test/',runScripts:'dangerously',
  pretendToBeVisual:true,beforeParse(w){
   w.innerWidth=width;w.innerHeight=730;
   w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
   w.fetch=()=>Promise.reject(Error('Do not call network in Coach Audit acceptance'));
   w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
  }});
 try{
  await new Promise(resolve=>setTimeout(resolve,220));
  const w=dom.window;
  if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
  const byName=name=>{const x=w.allExercises().find(e=>e.name===name);assert(x,'Missing '+name);return x};
  const bench=byName('Barbell Bench Press'),row=byName('Barbell Row'),squat=byName('Back Squat'),
   dumbbell=byName('Dumbbell Bench Press');
  const movement=(ex,n=3)=>({exerciseId:ex.id,sets:n,minReps:8,maxReps:12,
   mode:'double',progressionStrategy:'double',trainingGoal:'general'});
  const routine=(id,name,exerciseList)=>({id,name,trainingMode:'guided',
   exercises:exerciseList.map(ex=>movement(ex))});
  const three=[
   routine('a','Full Body A',[bench,row,squat]),
   routine('b','Full Body B',[bench,row,squat]),
   routine('c','Full Body C',[bench,row,squat])
  ];
  const program={id:'p',name:'Full Body + Strength / Hypertrophy & Mobility — long title',
   routineIds:['a','b','c'],frequency:3,preferredDays:[1,3,5],trainingMode:'guided',nextIndex:0};
  const state=(routines,sessions=[],programOverride=program)=>{
   w.eval('state.routines='+JSON.stringify(routines)+';state.programs=['+
    JSON.stringify(programOverride)+'];state.sessions='+JSON.stringify(sessions)+';');
  };
  const logged=(ago,routineId,include=true)=>({
   id:'synthetic-'+ago+'-'+routineId,programId:'p',routineId,
   date:new Date(Date.now()-ago*86400000).toISOString(),status:'finished',
   exercises:include?[bench,row,squat].map(e=>({exerciseId:e.id,sets:[
    {weight:100,reps:8,done:true,type:'working',rir:2}
   ]})):[]
  });
  state(three);
  const before=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})');
  const store=w.localStorage.getItem('overload_v3');
  let audit=w.coachProgramAudit('p');
  assert(!audit.findings.some(x=>x.type==='redundancy'),
   'Three balanced full-body days may repeat pressing and rowing intentionally');
  assert(!audit.findings.some(x=>x.type==='actual_coverage_gap'));
  assert(!w.coachProgramAuditHasComparableCoverage(audit));
  assert(w.renderCoachProgramAudit(audit));
  const body=w.document.getElementById('modalBody');
  const hero=body.querySelector('.coach-audit-primary'),findings=body.querySelector('.coach-audit-findings-label');
  assert(hero&&findings&&body.querySelector('.coach-audit-status'));
  assert(body.querySelector('.coach-audit-refresh'),'Scoped mobile audit styling missing');
  assert(body.querySelector('.coach-audit-coverage').tagName==='DETAILS');
  assert(!body.querySelector('.coach-audit-coverage').open,'Coverage should be progressive disclosure');
  assert(body.textContent.includes('Program history'),'Neutral evidence status missing');
  assert(body.textContent.includes('not enough comparable history') ||
   body.textContent.includes('Not enough comparable'),'No small-history caution');
  assert(!/positive/i.test(body.querySelector('.coach-audit-status').textContent),
    'Insufficient history is a neutral status, not a positive finding');
  assert(body.textContent.includes('Logged —'),'Missing actual data must display dash, not misleading zeros');
  const ctas=[...body.querySelectorAll('button')].filter(x=>x.textContent.includes('Review Training History'));
  assert.equal(ctas.length,1,'Only one clear history entry point');
  assert(hero.compareDocumentPosition(findings)&w.Node.DOCUMENT_POSITION_FOLLOWING,
   'Primary history entrypoint must appear before findings');
  // A single actual session should not suddenly show a "coverage deficit" warning.
  state(three,[logged(5,'a')]); audit=w.coachProgramAudit('p');
  assert(!audit.findings.some(x=>x.type==='actual_coverage_gap'));
  assert(!w.coachProgramAuditHasComparableCoverage(audit));
  w.renderCoachProgramAudit(audit);
  const refreshed=w.document.querySelector('#modalBody');
  assert(refreshed.querySelector('.coach-audit-coverage').textContent.includes('Logged —'));
  // Six workouts over 27 days still below a saved 3/week target:
  // don't infer shortfalls simply because the actual raw rate is lower.
  state(three,[logged(27,'a'),logged(23,'b'),logged(18,'c'),
   logged(14,'a'),logged(9,'b'),logged(4,'c')]);
  audit=w.coachProgramAudit('p');
  assert(!w.coachProgramAuditHasComparableCoverage(audit));
  assert(!audit.findings.some(x=>x.type==='actual_coverage_gap'));
  // True same-Routine duplicates in an otherwise independent split still
  // deserve a gentle, *optional* exercise variety note.
  const pair=[routine('a','Push A',[bench,dumbbell,row]),
   routine('b','Pull B',[row,squat]),
   routine('c','Legs',[squat])];
  state(pair);
  const caution=w.coachProgramAudit('p');
  const sameDay=caution.findings.filter(x=>x.type==='redundancy');
  assert(sameDay.every(x=>x.routineId==='a'),
    'Same-pattern overlap only within a specific Routine, never other days');
  // Missing or unrelated Program sessions remain unchanged after viewing.
  assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})'),
   JSON.stringify({sessions:[],routines:pair,programs:[program]}));
  assert.equal(w.localStorage.getItem('overload_v3'),store);
  results.push({width,fullBodyRepeatedRolesNotWarned:true,
   noHistoryNeutral:true,insufficientWeeklyComparisonsHidden:true,
   onePrimaryHistoryAction:true,summaryFirst:true,optionalEvidenceDisclosure:true,
   persistenceUnchanged:true});
 }finally{dom.window.close()}
}
fs.mkdirSync('/tmp/swole-cat-coach-audit-polish',{recursive:true});
fs.writeFileSync('/tmp/swole-cat-coach-audit-polish/acceptance.json',
 JSON.stringify(results,null,2)+'\n');
console.log('COACH_AUDIT_UI_AND_FIDELITY_PASS '+JSON.stringify(results));
