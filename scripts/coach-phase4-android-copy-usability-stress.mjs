// Phase 4 phone-width Android/WebView approximation and coaching language review.
// JSDOM checks real production markup, navigation and DOM state; it does NOT
// replace a human visual check on physical Android hardware.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const css=fs.readFileSync('src/styles/03-polish.css','utf8');
const widths=[320,360,390,430,480];
assert(css.includes('Phase 4: opt-in Training History Review'));
assert(css.includes('.coach-phase4-review .actions .btn'));
assert(css.includes('min-height:48px'));
assert(css.includes('@media(max-width:430px)'));
assert(css.includes('.coach-phase4-review .actions{grid-template-columns:minmax(0,1fr)}'));
assert(css.includes('.coach-phase4-review .coach-phase4-slot-list'));
assert(css.includes('overflow-wrap:anywhere'));
assert(css.includes('.coach-phase4-review .exercise-name'));
assert(css.includes('.coach-phase4-review .actions .btn:focus-visible'));

const evidence=[];
for(const width of widths){
 const dom=new JSDOM(html,{
  runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
  beforeParse(w){
   w.innerWidth=width;w.innerHeight=720;
   w.localStorage.setItem('overload_v3',JSON.stringify({ui:{
    onboardingDone:true,haptics:false,keepAwake:false}}));
   w.fetch=()=>Promise.reject(Error('Phone-width QA cannot use network'));
   w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
  }
 });
 try{
  await new Promise(resolve=>setTimeout(resolve,195));
  const w=dom.window,now=Date.now();
  if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
  const bench=w.allExercises().find(x=>x.name==='Barbell Bench Press');
  const row=w.allExercises().find(x=>x.name==='Barbell Row');
  assert(bench&&row);
  const longName='Upper and Lower Training Plan — Balanced Progressive Overload Across the Week <em>not HTML</em>';
  const routineName='Full Upper Body Strength and General Fitness With Extra Shoulder Emphasis';
  const program={id:'mobile-p',name:longName,frequency:3,
   trainingMode:'guided',routineIds:['mobile-a','mobile-b'],preferredDays:[1,3,5],nextIndex:0};
  const routines=[
   {id:'mobile-a',name:routineName,trainingMode:'guided',
    exercises:[{exerciseId:bench.id,sets:3,minReps:8,maxReps:12}]},
   {id:'mobile-b',name:'Lower B',trainingMode:'guided',
    exercises:[{exerciseId:row.id,sets:3,minReps:8,maxReps:12}]}
  ];
  const sessions=[27,20,13,6].map((days,i)=>({
   id:'m-'+i,programId:'mobile-p',routineId:i%2?'mobile-b':'mobile-a',
   routineName:i%2?'Lower B':routineName,status:'finished',
   date:new Date(now-days*86400000).toISOString(),
   exercises:[{exerciseId:i%2?row.id:bench.id,sets:[{
    done:true,type:'working',weight:95,reps:9,rir:2}]}]
  }));
  w.eval('state.routines='+JSON.stringify(routines)+
   ';state.programs=['+JSON.stringify(program)+'];state.sessions='+JSON.stringify(sessions)+';');
  const before=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})');
  const storageBefore=w.localStorage.getItem('overload_v3');
  assert(w.openCoachProgramAudit('mobile-p'));
  const body=w.document.getElementById('modalBody');
  const launch=[...body.querySelectorAll('button')].find(b=>b.textContent.trim()==='Review Training History');
  assert(launch,'Review Training History discoverability in Coach Audit at '+width+'px');
  launch.click();
  const review=body.querySelector('#coachPhase4Review');
  assert(review&&review.classList.contains('coach-phase4-review'),'Review modal root missing');
  assert(review.closest('#modalBody'),'Review must remain in scrollable modal');
  assert(review.querySelectorAll('.coach-phase4-slot').length===2,'Scannable routine rows missing');
  assert(review.querySelectorAll('.coach-phase4-slot b').length===2,'Logged counts missing');
  assert(review.querySelector('.coach-phase4-description'),'Readable explanation missing');
  assert(review.querySelector('.coach-phase4-suggestion'),'Evidence card missing');
  assert(review.textContent.includes('Training outside this Program'),'No honest logging caveat');
  assert(review.textContent.includes('Keep as is'),'Dismissing action missing');
  assert(review.textContent.includes('Review Program'),'Manual review action missing');
  assert(review.textContent.includes('Back to Program Audit'),'Back action missing');
  assert(!review.querySelector('em'),'Dynamic untrusted program names must remain plain text');
  assert(review.textContent.includes('<em>not HTML</em>'),'Escaped program title should remain visible');
  assert(!/You failed|You must|injury|overtraining|lazy|recovery diagnosis/i.test(review.textContent),
   'Coaching wording claims more than activity logs support');
  assert(!review.textContent.includes('…'),'Do not ellipsize user-visible coach text');
  const buttons=[...review.querySelectorAll('.actions .btn')];
  assert.equal(buttons.length,4,'Review card + footer should offer four explicit controls');
  for(const button of buttons){
   assert(button.textContent.trim().length>0,'Unlabeled review action');
   assert(!button.disabled,'Unexpected disabled action');
  }
  const dismissed=review.querySelector('.coach-phase4-suggestion [onclick*="coachPhase4ProgramReviewDismiss"]');
  assert(dismissed,'No reversible non-mutating opt-out');
  dismissed.click();
  assert(!body.querySelector('.coach-phase4-suggestion'),'Keep as is must dismiss current observation');
  assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})'),
   before,'Tap Keep as is modified personal workout state');
  const back=[...body.querySelectorAll('button')].find(b=>b.textContent.trim()==='Back to Program Audit');
  assert(back);back.click();
  assert(body.textContent.includes('PROGRAM AUDIT'),'Back must restore existing audit');
  const reopen=[...body.querySelectorAll('button')].find(b=>b.textContent.trim()==='Review Training History');
  assert(reopen);reopen.click();
  assert(body.querySelector('.coach-phase4-suggestion'),'Review should be available next time');
  assert.equal(w.localStorage.getItem('overload_v3'),storageBefore,
   'Navigating or dismissing reviews must not trigger persistence');
  evidence.push({width,slotRows:2,reviewActions:buttons.length,
   cardVisible:true,escapedLongName:true,nonDiagnosticCopy:true,
   modalScrollStructure:true,keepAsIsReversible:true,persistentDataUntouched:true});
 }finally{dom.window.close()}
}
fs.mkdirSync('/tmp/swole-cat-coach-phase4-mobile',{recursive:true});
fs.writeFileSync('/tmp/swole-cat-coach-phase4-mobile/android-width-qa.json',
 JSON.stringify({widths,evidence,notes:'JSDOM + CSS structural approximation; not real-device visual rendering'},null,2)+'\n');
console.log('COACH_PHASE4_ANDROID_WIDTH_PASS '+JSON.stringify(evidence));
