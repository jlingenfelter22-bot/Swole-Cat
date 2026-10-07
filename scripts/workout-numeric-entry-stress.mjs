import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const css=fs.readFileSync('src/styles/03-polish.css','utf8');

const dom=new JSDOM(html,{
  runScripts:'dangerously',
  url:'https://swole-cat.test/',
  pretendToBeVisual:true,
  beforeParse(window){
    window.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
    window.alert=()=>{};
    window.confirm=()=>true;
    window.scrollTo=()=>{};
  }
});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const w=dom.window;
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};

await wait(120);
w.installRegressionFixturePlan();
const state=JSON.parse(w.localStorage.getItem('overload_v3'));
w.openRoutine(state.routines[0].id);
await wait(50);

const entry=w.document.querySelector('#workout .live-entry');
assert(entry,'active set should render live entry controls');
const fields=[...entry.querySelectorAll(':scope > .live-input-wrap')];
assert.equal(fields.length,3,'Weight, Reps, and RIR should remain three explicit controls');

const [weight,reps,rir]=fields;
assert(weight.classList.contains('numeric-entry'),'Weight should use the compact numeric entry layout');
assert(reps.classList.contains('numeric-entry'),'Reps should use the compact numeric entry layout');
assert(rir.classList.contains('rir-small'),'RIR should retain its selector-specific treatment');

assert.match(weight.querySelector(':scope > label')?.textContent||'',/^Weight \((lb|kg)\)$/i,'Weight label should be complete and include units');
assert.equal(reps.querySelector(':scope > label')?.textContent?.trim(),'Reps','Reps label should be complete');
assert(!weight.querySelector('.input-label-row'),'Weight should no longer share a row with its step controls');
assert(!reps.querySelector('.input-label-row'),'Reps should no longer share a row with its step controls');
assert(!weight.querySelector('.micro-step'),'Weight should retire the old side-by-side micro-step header');
assert(!reps.querySelector('.micro-step'),'Reps should retire the old side-by-side micro-step header');

for(const [name,field,aria] of [['Weight',weight,'weight'],['Reps',reps,'reps']]){
  const stepper=field.querySelector('.numeric-stepper');
  assert(stepper,name+' should render one compact value stepper row');
  const children=[...stepper.children];
  assert.equal(children.length,3,name+' stepper should contain decrement, value, increment');
  assert.equal(children[0].textContent.trim(),'−',name+' decrement should sit left of the value');
  assert.equal(children[1].getAttribute('aria-label'),aria,name+' value should stay in the middle');
  assert.equal(children[2].textContent.trim(),'+',name+' increment should sit right of the value');
  assert.match(children[0].getAttribute('aria-label')||'',new RegExp('decrease '+aria,'i'));
  assert.match(children[2].getAttribute('aria-label')||'',new RegExp('increase '+aria,'i'));
}
assert(rir.querySelector('select'),'RIR should remain a select control');
assert.equal(rir.querySelectorAll('.numeric-step-btn').length,0,'RIR should not gain meaningless step buttons');

assert.match(css,/\.numeric-entry>label\{[\s\S]*white-space:nowrap;[\s\S]*overflow:visible;[\s\S]*text-overflow:clip/i,'numeric labels should not ellipsize');
assert.match(css,/\.numeric-stepper\{[\s\S]*grid-template-columns:30px minmax\(0,1fr\) 30px/i,'wide layout should place the value between compact side buttons');
assert.match(css,/\.numeric-stepper \.direct-number\{[\s\S]*height:52px!important/i,'value input should retain the established 52px logging height');
assert.match(css,/\.numeric-step-btn\{[\s\S]*height:46px/i,'step buttons should remain large enough for gym use without adding a separate vertical row');
assert.match(css,/\.rir-small \.input-label-row\{[\s\S]*min-height:0/i,'RIR label row should shed the old stepper-alignment height');
assert.doesNotMatch(weight.textContent,/\.\.\./,'Weight control should not visibly rely on ellipsis copy');
assert.doesNotMatch(reps.textContent,/\.\.\./,'Reps control should not visibly rely on ellipsis copy');

w.stopRestTimer?.();
dom.window.close();
console.log('Swole Cat v0.72.3 numeric entry PASS: full Weight/Reps labels, compact [− value +] controls, unchanged RIR semantics, and no extra stepper row');
