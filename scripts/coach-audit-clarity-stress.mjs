// Coach Program Audit simplification gate, based on owner's 101-second
// October 26, 2026 Android walkthrough. DOM/CSS synthetic, not device UX.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const css=fs.readFileSync('src/styles/03-polish.css','utf8');
for(const token of ['.coach-audit-simple','.coach-audit-item-title',
 '.coach-phase4-slots','.coach-phase4-empty']){
 assert(css.includes(token),'Missing simple review styling '+token);
}
const results=[];
for(const width of [320,360,390,430,480]){
 const dom=new JSDOM(html,{
  url:'https://swole-cat.test/',runScripts:'dangerously',pretendToBeVisual:true,
  beforeParse(w){
   w.innerWidth=width;w.innerHeight=760;
   w.localStorage.setItem('overload_v3',
    JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
   w.fetch=()=>Promise.reject(Error('No network in Coach clarity test'));
   w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
  }
 });
 try{
  await new Promise(resolve=>setTimeout(resolve,220));
  const w=dom.window;
  if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
  const find=name=>{
   const x=w.allExercises().find(e=>e.name===name);
   assert(x,'Missing built-in '+name);return x.id;
  };
  const bench=find('Barbell Bench Press'),row=find('Barbell Row');
  const entry=exerciseId=>({exerciseId,sets:3,minReps:8,maxReps:12,mode:'double'});
  const routines=[
   {id:'a',name:'Workout A',trainingMode:'guided',
    exercises:[entry(bench),entry(row)]},
   {id:'b',name:'Workout B',trainingMode:'guided',
    exercises:[entry(bench),entry(row)]}
  ];
  const program={id:'p',name:'My Program <no markup> & Long Name',
   frequency:3,routineIds:['a','b'],trainingMode:'guided',nextIndex:0};
  w.eval('state.routines='+JSON.stringify(routines)+';state.programs=['+
   JSON.stringify(program)+'];state.sessions=[];');
  const oldState=w.eval('JSON.stringify({routines:state.routines,programs:state.programs,sessions:state.sessions})');
  const oldStore=w.localStorage.getItem('overload_v3');
  const audit=w.coachProgramAudit('p');
  assert(audit);
  // Check a dense-but-legitimate model of five optional observations. The
  // UI should not render five expanded cards in a row.
  audit.findings=Array.from({length:5},(_,i)=>({
   id:'synthetic-'+i,type:'suggestion',priority:60,action:'review_routine',
   routineId:'a',severity:'low',
   title:i===0?'Similar movements in Workout A':
    'Another idea '+(i+1)+' <untrusted> with a long label',
   text:'This is optional context, not a diagnosis or an automatic edit.'
  }));
  assert(w.renderCoachProgramAudit(audit));
  const body=w.document.getElementById('modalBody');
  assert(body.querySelector('.coach-audit-simple'));
  assert.equal(body.querySelectorAll('.coach-audit-item').length,5);
  assert.equal(body.querySelectorAll('.coach-audit-plan > .coach-audit-item').length,2,
   'At most two ideas are at the top level');
  const more=body.querySelector('.coach-audit-more');
  assert(more&&!more.open,'Extra ideas should be collapsed initially');
  assert.equal(more.querySelectorAll('.coach-audit-item').length,3);
  assert([...body.querySelectorAll('.coach-audit-item')].every(x=>!x.open));
  const history=body.querySelector('.coach-audit-primary');
  const plan=body.querySelector('.coach-audit-findings-label');
  assert(history&&plan&&history.compareDocumentPosition(plan)&w.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.equal(history.querySelectorAll('button').length,1);
  assert.equal(body.querySelectorAll('.coach-audit-footer button').length,1,
   'No unrelated Edit/Progress/Done footer stack');
  assert(body.querySelector('.coach-audit-coverage')?.tagName==='DETAILS');
  assert(!body.querySelector('.coach-audit-coverage').open);
  assert(!body.querySelector('.coach-audit-item .eyebrow'),
   'Do not label every idea with technical badge');
  assert(!body.querySelector('em'),
   'Untrusted dynamic names must be text');
  assert(body.textContent.includes('<no markup>'));
  assert(!body.innerHTML.includes('My Program <no markup>'));
  assert.equal(w.eval('JSON.stringify({routines:state.routines,programs:state.programs,sessions:state.sessions})'),oldState);
  assert.equal(w.localStorage.getItem('overload_v3'),oldStore);

  // Sparse/no Program history: no "lower body planned gap" pretending
  // to be a completed-training finding in the separate history view.
  assert(w.openCoachPhase4ProgramReview('p'));
  const review=body.querySelector('#coachPhase4Review');
  assert(review&&review.querySelector('.coach-phase4-head'));
  assert(review.querySelector('.coach-phase4-empty'));
  assert(!review.querySelector('.coach-phase4-suggestion'),
   'Structural plan-only concerns are not completed-training findings');
  assert.equal(review.querySelectorAll('.coach-phase4-footer button').length,1);
  assert(review.querySelector('.coach-phase4-slots')?.tagName==='DETAILS');
  assert(!review.querySelector('.coach-phase4-slots').open);
  assert(review.textContent.includes('Not enough logged workouts'));
  assert.equal(w.localStorage.getItem('overload_v3'),oldStore);
  assert.equal(w.eval('JSON.stringify({routines:state.routines,programs:state.programs,sessions:state.sessions})'),oldState);
  results.push({width,primaryIdeas:2,additionalIdeas:3,
   historyPlanGapSuppressed:true,footersSimplified:true,noDataChange:true});
 }finally{dom.window.close()}
}
fs.mkdirSync('/tmp/swole-cat-coach-clarity',{recursive:true});
fs.writeFileSync('/tmp/swole-cat-coach-clarity/acceptance.json',
 JSON.stringify(results,null,2)+'\n');
console.log('COACH_AUDIT_CLARITY_PASS '+JSON.stringify(results));
