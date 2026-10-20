// Phone-sized Coach preview usability contract; scripted Android WebView
// approximation using the same modular app DOM and production CSS.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const css=fs.readFileSync('src/styles/03-polish.css','utf8');
const sizes=[320,360,390,430,480];
assert(css.includes('Coach program recommendation mobile usability'));
assert(css.includes('.modal-mode-coach-program .coach-program-suggestions .actions'));
assert(css.includes('min-height:48px'),'Touch targets should be at least 48 CSS pixels');
assert(css.includes('grid-template-columns:minmax(0,1fr)'),'Small-screen actions should stack');
assert(css.includes('overflow-wrap:anywhere'),'Long label should wrap, never ellipsize');
assert(css.includes('.modal-mode-coach-program #modalBody'),'Preview uses scrollable modal body');

const evidence=[];
for(const width of sizes){
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://swole-cat.test/',
   pretendToBeVisual:true,
   beforeParse(w){
    w.innerWidth=width;w.innerHeight=720;
    w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
    w.fetch=()=>Promise.reject(Error('No network allowed'));
    w.scrollTo=()=>{};w.confirm=()=>true;w.alert=()=>{};
   }});
 try{
  const w=dom.window;
  await new Promise(r=>setTimeout(r,190));
  const before=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})');
  const p=w.coachParsePrompt('3 day full body program 45 minutes','hypertrophy');
  const e=w.coachBrainApplyEquipmentChoice(p,'gym');assert(e.ok);
  const draft=w.coachGenerateProgram(e.request,w.coachParseProgramIntent('3 day full body program 45 minutes'),null);
  assert(draft,'Expected real generated program');
  w.renderCoachProgramPreview();
  assert.equal(w.document.querySelector('.coach-program-save-actions .btn')?.textContent?.trim(),'Save + Start Day 1');
  const initial=w.document.querySelector('.coach-program-suggestions');
  assert(initial,'Suggestion discovery must render inside scrollable preview');
  assert(initial.closest('#modalBody'),'Suggestions cannot float outside scrollport');
  const beforeIds=JSON.stringify(draft.days.map(d=>d.selectedIds));
  const discovery=Array.from(initial.querySelectorAll('button')).find(b=>b.textContent.trim()==='Review suggestions');
  assert(discovery,'Missing optional entrypoint');
  discovery.click();
  const panel=w.document.querySelector('.coach-program-suggestions');
  assert(panel&&panel.textContent.includes('YOUR CHOICE'));
  const cards=panel.querySelectorAll('.coach-program-suggestion');
  assert(cards.length>=2,'Expect complementary shoulder and hamstring suggestions');
  for(const card of cards){
   const buttons=[...card.querySelectorAll('button')];
   assert.equal(buttons.length,3,'Missing explicit accept, decline or alternate change');
   assert.equal(buttons[0].textContent.trim(),'Use Recommendation');
   assert.equal(buttons[1].textContent.trim(),'Keep Original');
   assert(['Try Another Swap','Adjust Day'].includes(buttons[2].textContent.trim()));
   assert(!/ellips|…/.test(card.textContent),'Never truncate an exercise name in a suggestion');
   assert(card.textContent.includes('Estimated day'),'Show realistic before/after estimates');
  }
  assert.equal(JSON.stringify(draft.days.map(d=>d.selectedIds)),beforeIds,'Opening suggestion changed exercise list');
  assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})'),before,
    'Viewing recommendations mutated persisted workout history');
  const hide=[...panel.querySelectorAll('button')].find(b=>b.textContent.trim()==='Hide recommendations');
  assert(hide);hide.click();
  assert(w.document.querySelector('.coach-program-suggestions')?.textContent?.includes('Review suggestions'),
    'Hiding should reset to discovery without rejecting saved choices');
  evidence.push({width,reviewCards:cards.length,acceptDeclineSwapVisible:true,
    mobileScrollport:true,savedDataUntouched:true,hiddenWithoutMutation:true});
 }finally{dom.window.close();}
}
fs.mkdirSync('/tmp/swole-cat-coach-mobile',{recursive:true});
fs.writeFileSync('/tmp/swole-cat-coach-mobile/phone-preview-audit.json',JSON.stringify(evidence,null,2)+'\n');
console.log('COACH_ANDROID_MOBILE_USABILITY_PASS '+JSON.stringify(evidence));
