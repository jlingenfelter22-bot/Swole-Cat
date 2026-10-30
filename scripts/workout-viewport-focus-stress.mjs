import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const css=fs.readFileSync('src/styles/03-polish.css','utf8');
const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const scrolls=[];
const dom=new JSDOM(html,{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=args=>scrolls.push(args);
 }
});
const w=dom.window,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
if(w.HTMLElement){
 w.HTMLElement.prototype.scrollIntoView=()=>{};
 const original=w.HTMLElement.prototype.getBoundingClientRect;
 w.HTMLElement.prototype.getBoundingClientRect=function(){
  if(this.matches?.('header'))return {bottom:180,height:180,top:0};
  if(this.matches?.('nav'))return {top:710,height:70,bottom:780};
  if(this.matches?.('#workout .focus-exercise-nav-shell'))return {top:300,bottom:400,height:100};
  if(this.matches?.('#workout .complete-set'))return {top:745,bottom:790,height:45};
  return original.call(this);
 };
}
await wait(130);
w.installRegressionFixturePlan();
const state=()=>JSON.parse(w.localStorage.getItem('overload_v3'));
const rid=state().routines[0].id;
w.openRoutine(rid);
await wait(50);
const scrollCountAtStart=scrolls.length; // go('workout') legitimately resets to top.
let progress=w.document.querySelector('#workout .focus-exercise-overall-progress');
assert(progress,'the sticky exercise header must expose overall workout progress');
assert.equal(progress.getAttribute('aria-valuenow'),'0','a new workout starts with zero completed sets');
assert.equal(progress.querySelector('span')?.style.width,'0%');
assert.match(w.document.querySelector('#workout .focus-session-mini-count')?.textContent||'',/0\/\d+ sets/);
assert.match(css,/\.focus-exercise-overall-progress\{[\s\S]*position:absolute/,'progress track overlays the existing header without a new row');
assert.equal(scrolls.length,scrollCountAtStart,'the workout renderer must not add any focus scroll at startup');

w.updateSet(0,0,'reps','8');
w.toggleSet(0,0);
await wait(100);
assert.equal(state().activeWorkout.exercises[0].sets[0].done,true);
const repeat=w.document.querySelector('#workout .repeat-previous-set');
const complete=w.document.querySelector('#workout .focus-set-card .complete-set');
assert(repeat&&complete,'repeat values and complete set remain distinct, full-width controls');
assert.equal(repeat.textContent.trim(),'↻ Repeat previous set values','repeat button keeps its explanatory wording');
assert.equal(repeat.parentElement,complete.parentElement,'repeat remains in the original vertical set-card flow');
assert.match(css,/#workout \.repeat-previous-set\{\s*width:100%/,'repeat retains full width');
assert(scrolls.length>scrollCountAtStart,'advancing Set 1 must focus the workout without manual scrolling');
assert(scrolls[scrolls.length-1].top>=110,'scroll accounts for the sticky header and bottom dock');
assert.match(w.document.querySelector('#workout .focus-session-mini-count')?.textContent||'',/1\/\d+ sets/);
assert.equal(w.document.querySelector('#workout .focus-exercise-overall-progress')?.getAttribute('aria-valuenow'),'1');
const beforeRepeat=scrolls.length;
w.repeatPreviousWorkoutSet(0,1);
await wait(95);
assert.equal(scrolls.length,beforeRepeat,'copying values should not trigger a second, unnecessary auto-scroll');
assert.equal(state().activeWorkout.exercises[0].sets[1].done,false,'Repeat must never complete a set');

w.eval('workoutCoachSignal = () => ({level:"steady",text:"Stay controlled during this session."})');
w.renderWorkout();
await wait(35);
const noteLink=w.document.querySelector('#workout .focus-session-note-link');
assert(noteLink,'session note remains accessible from sticky header');
const nav=w.document.querySelector('#workout .focus-exercise-nav');
assert.equal(nav.open,false);
noteLink.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
await wait(15);
assert.equal(nav.open,false,'the note shortcut must not open exercise switching');
assert(w.document.querySelector('#modal')?.classList.contains('open'),'session note shortcut opens the full Coach note');
assert.match(w.document.querySelector('#modal')?.textContent||'',/Stay controlled during this session/);
w.closeModal();

// After the initial scroll, user scrolling or normal input renders must not be hijacked.
const beforeNormalRender=scrolls.length;
w.renderWorkout();
await wait(60);
assert.equal(scrolls.length,beforeNormalRender,'ordinary renders never force a scroll');
// If a set is already fully in view, avoid bouncing the viewport.
const oldRect=w.HTMLElement.prototype.getBoundingClientRect;
w.HTMLElement.prototype.getBoundingClientRect=function(){
 if(this.matches?.('#workout .focus-exercise-nav-shell'))return {top:186,bottom:280,height:94};
 if(this.matches?.('#workout .complete-set'))return {top:540,bottom:600,height:60};
 return oldRect.call(this);
};
w.focusWorkoutViewportAfterAdvance();
assert.equal(scrolls.length,beforeNormalRender,'already-visible controls must not trigger scroll jitter');
dom.window.close();
console.log('PASS v0.86: first-set smart focus, stable repeat button, accessible sticky progress and session note, no redundant scroll.');
