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
    window.alert=()=>{};
    window.confirm=()=>true;
    window.scrollTo=()=>{};
    window.fetch=()=>Promise.reject(new Error('offline form-guide test'));
  }
});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const read=()=>JSON.parse(dom.window.localStorage.getItem('overload_v3'));

await wait(100);
const w=dom.window;
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};

w.installRegressionFixturePlan();
let state=read();
const rid=state.routines[0].id;
w.openRoutine(rid);
await wait(50);
state=read();

const activeBefore=JSON.stringify(state.activeWorkout);
const routineBefore=JSON.stringify(state.routines.find(r=>r.id===rid));
const historyBefore=JSON.stringify(state.sessions);

// Exercise switcher is obvious but the entire summary remains the disclosure target.
const shell=w.document.querySelector('#workout .focus-exercise-nav-shell');
const nav=w.document.querySelector('#workout .focus-exercise-nav');
const summary=nav?.querySelector('summary');
const switchCue=w.document.querySelector('#workout .focus-nav-switch');
const howTo=w.document.querySelector('#workout .focus-howto-btn');
assert(shell&&nav&&summary,'focused exercise should render the navigator shell and tappable header');
assert(switchCue,'exercise navigator should render a dedicated switch affordance');
assert.match(switchCue.textContent,/Switch/i,'wide layouts should label the exercise switch action');
assert(howTo,'focused exercise should expose one-tap form help');
assert.match(howTo.getAttribute('aria-label')||'',/How to do/i,'form-help control should be self-describing');
assert.match(html,/\.focus-howto-btn\{[\s\S]*?width:42px;[\s\S]*?height:42px;/i,'form-help icon should retain a gym-friendly touch target');
assert.match(html,/#workout \.focus-howto-btn\{[\s\S]*?top:36px;/i,'form-help icon should stay anchored to the fixed exercise header when the list expands');

// Opening the exercise list must not alter workout data.
summary.click();
await wait(10);
assert.equal(nav.open,true,'tapping the focused exercise header should open the exercise list');
let live=read();
assert.equal(JSON.stringify(live.activeWorkout),activeBefore,'opening the exercise switcher must not mutate active workout state');
summary.click();
assert.equal(nav.open,false,'tapping the header again should close the exercise list');

// How To opens as an overlay without navigation or workout mutation.
const focusBefore=w.eval('({ei:state.activeWorkout.focusExerciseIndex,si:state.activeWorkout.focusSetIndex,pending:[...(state.activeWorkout.deferredExerciseIndexes||[])]})');
w.openFocusedExerciseHowTo(focusBefore.ei);
await wait(25);
const modal=w.document.getElementById('modal');
assert(modal?.classList.contains('open'),'How To should open the existing overlay sheet');
assert(modal?.classList.contains('modal-mode-focus-howto'),'How To should opt into its dedicated modal layout');
assert.match(w.document.getElementById('modalTitle')?.textContent||'',/How to/i,'form overlay should clearly identify itself');
assert(w.document.getElementById('exerciseFormGuide'),'How To overlay should reuse the existing exercise form-guide host');
assert(w.document.querySelector('.focus-howto-scroll'),'How To content should live in its own scroll region');
assert(w.document.querySelector('.focus-howto-footer'),'How To should render a dedicated docked footer');
assert.match(w.document.getElementById('modalBody')?.textContent||'',/Back to workout/i,'overlay should offer an explicit return-to-workout action');
assert.match(html,/\.modal-mode-focus-howto \.sheet\{[\s\S]*?overflow:hidden;/i,'How To sheet should keep modal chrome fixed instead of scrolling the footer');
assert.match(html,/\.focus-howto-scroll\{[\s\S]*?overflow:auto;/i,'form-guide content should own the scrolling region');
assert.equal(w.document.querySelector('#workout .view.active'),null,'How To should not navigate by creating another active app view');
const focusDuring=w.eval('({ei:state.activeWorkout.focusExerciseIndex,si:state.activeWorkout.focusSetIndex,pending:[...(state.activeWorkout.deferredExerciseIndexes||[])]})');
assert.deepEqual(focusDuring,focusBefore,'opening How To must preserve exact Focus Mode state');
w.closeModal();
await wait(10);
assert(!w.document.getElementById('modal')?.classList.contains('open'),'closing How To should return directly to workout');
assert(!w.document.getElementById('modal')?.classList.contains('modal-mode-focus-howto'),'closing How To should clear its modal-only layout class');
const focusAfter=w.eval('({ei:state.activeWorkout.focusExerciseIndex,si:state.activeWorkout.focusSetIndex,pending:[...(state.activeWorkout.deferredExerciseIndexes||[])]})');
assert.deepEqual(focusAfter,focusBefore,'closing How To must preserve exact Focus Mode state');

// The rest timer docks against the measured bottom navigation and stays usable.
w.startRestTimer(90);
const timer=w.document.getElementById('restTimer');
assert(timer.classList.contains('show'),'rest timer should appear while work remains');
const dockHeight=w.document.documentElement.style.getPropertyValue('--rest-nav-height');
assert(dockHeight&&parseFloat(dockHeight)>=58,'rest timer should measure and dock to the real bottom-nav height');
assert.match(html,/bottom:calc\(var\(--rest-nav-height,68px\) - 1px\)/i,'rest timer should be visually anchored to the nav edge');
assert(timer.querySelector('.rest-quick-add'),'docked timer should preserve one-tap +30');
w.toggleRestTimerExpanded();
assert(timer.classList.contains('expanded'),'docked timer should still expand to full controls');
w.toggleRestTimerExpanded();
assert(!timer.classList.contains('expanded'),'timer controls should collapse back into the dock');
w.stopRestTimer();
assert(!timer.classList.contains('show'),'rest timer should retract when stopped');

// QoL surfaces cannot rewrite workout/routine/history data.
live=read();
assert.equal(JSON.stringify(live.activeWorkout),activeBefore,'QoL overlays and timer must not rewrite active workout data');
assert.equal(JSON.stringify(live.routines.find(r=>r.id===rid)),routineBefore,'QoL surfaces must not rewrite saved routine');
assert.equal(JSON.stringify(live.sessions),historyBefore,'QoL surfaces must not rewrite completed history');

console.log('Swole Cat v0.65.2 Focus Mode visual stability PASS: fixed How To anchor, docked form footer, nav timer, and exact state preservation');
dom.window.close();
