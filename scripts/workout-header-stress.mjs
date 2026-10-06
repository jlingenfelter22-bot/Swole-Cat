import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const css=fs.readFileSync('src/styles/03-polish.css','utf8');
const engine=fs.readFileSync('src/js/06-workout-engine.js','utf8');

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

const rid=JSON.parse(w.localStorage.getItem('overload_v3')).routines[0].id;
w.openRoutine(rid);
await wait(50);

let nav=w.document.querySelector('#workout .focus-exercise-nav');
let summary=nav?.querySelector(':scope > summary');
assert(nav&&summary,'active workout should render the exercise switch header');

const titleLine=summary.querySelector('.focus-exercise-title-line');
const name=titleLine?.querySelector('.focus-exercise-name');
const help=titleLine?.querySelector('.focus-howto-inline');
assert(titleLine&&name&&help,'exercise title and How To control should share one inline title line');
assert.equal(help.previousElementSibling,name,'How To control should immediately follow the exercise name in DOM flow');
assert.equal(help.closest('summary'),summary,'How To control should live inside the stable summary instead of the expanding shell');
assert.equal(w.document.querySelector('#workout .focus-howto-btn'),null,'old absolutely positioned How To control should be retired');

const bottom=summary.querySelector('.focus-exercise-bottom-row');
const meta=bottom?.querySelector('.focus-exercise-meta');
const switchPill=bottom?.querySelector('.focus-nav-switch');
assert(bottom&&meta&&switchPill,'header lower row should pair metadata with the Switch exercise action');
assert.equal(switchPill.textContent.trim(),'Switch exercise','Switch exercise should remain explicit');
assert.doesNotMatch(summary.textContent,/⌄|⌃/,'exercise header should not render a dropdown chevron');

assert.match(css,/\.focus-exercise-name\{[\s\S]*white-space:normal/i,'exercise names should wrap naturally for long titles');
assert.match(css,/\.focus-howto-inline\{[\s\S]*display:inline-flex/i,'How To control should participate in inline title flow');
assert.match(css,/\.focus-exercise-bottom-row\{[\s\S]*display:flex/i,'metadata and switch pill should share a stable lower row');
assert.match(css,/\.focus-exercise-bottom-row \.focus-nav-switch\{[\s\S]*position:static/i,'Switch exercise should be layout-driven instead of absolutely positioned');
assert.match(css,/\.focus-exercise-bottom-row \.focus-nav-switch\{[\s\S]*border-radius:999px/i,'Switch exercise should use the compact pill treatment');
assert.match(css,/\.focus-exercise-nav>summary:after\{[\s\S]*content:none/i,'legacy summary chevron must stay disabled');

// Help must not toggle the exercise list.
assert.equal(nav.open,false,'switcher should start closed');
help.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
await wait(10);
assert.equal(nav.open,false,'tapping How To must not open or close the exercise switcher');
assert(w.document.getElementById('modal')?.classList.contains('open'),'tapping How To should open the form-help modal');
w.closeModal();

// The rest of the summary remains the forgiving switch target.
summary.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
await wait(10);
assert.equal(nav.open,true,'tapping the exercise header should still open the switcher');
assert(summary.contains(help),'opening the switcher must not relocate the How To control');
assert(summary.contains(switchPill),'opening the switcher must not relocate the Switch exercise label');

// Long names should stay content-driven rather than requiring pixel calculations.
const currentId=w.eval('state.activeWorkout.exercises[state.activeWorkout.focusExerciseIndex].exerciseId');
const currentEx=w.exById(currentId);
const originalName=currentEx.name;
currentEx.name='Single-Leg Romanian Deadlift Machine With Extended Setup';
w.renderWorkout();
await wait(10);
nav=w.document.querySelector('#workout .focus-exercise-nav');
summary=nav.querySelector(':scope > summary');
assert.match(summary.querySelector('.focus-exercise-name').textContent,/Single-Leg Romanian Deadlift Machine/);
assert(summary.querySelector('.focus-exercise-title-line .focus-howto-inline'),'long exercise names must retain inline How To placement');
currentEx.name=originalName;

assert.doesNotMatch(engine,/focus-nav-switch[^\n]*⌄/,'workout markup should not reintroduce the chevron');
assert.match(engine,/event\.preventDefault\(\);event\.stopPropagation\(\);openFocusedExerciseHowTo/,'How To must consume the nested header interaction');

dom.window.close();
console.log('Swole Cat v0.72.2 exercise header PASS: inline How To, no chevron, lower-right switch pill, stable open state, forgiving header target, and long-name-safe layout');
