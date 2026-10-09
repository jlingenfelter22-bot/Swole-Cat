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
const w=dom.window,wait=ms=>new Promise(r=>setTimeout(r,ms));
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
await wait(130);
w.installRegressionFixturePlan();await wait(40);
const rid=JSON.parse(w.localStorage.getItem('overload_v3')).routines[0].id;
w.startRoutineFresh(rid);await wait(35);

const nav=w.document.querySelector('nav'),tray=w.document.getElementById('restTimer');
const action=tray.querySelector('.rest-main'),controls=tray.querySelector('.rest-actions');
const buttons=[...controls.querySelectorAll('button')];
assert.equal(w.document.querySelectorAll('nav .navbtn').length,5,'timer must not become a sixth nav tab');
assert.equal(tray.closest('nav'),null,'rest tray must remain outside semantic nav');
assert(tray.querySelector('.rest-quick-add'),'collapsed +30 stays available');
assert.equal(action.getAttribute('aria-expanded'),'false');
assert.equal(controls.getAttribute('aria-hidden'),'true');
assert(buttons.every(b=>b.tabIndex===-1),'hidden actions are not tabbable');

const originalNavRect=nav.getBoundingClientRect.bind(nav);
nav.getBoundingClientRect=()=>({left:11,right:389,top:703,bottom:789,width:378,height:86});
Object.defineProperty(w,'innerHeight',{value:800,configurable:true});
w.syncRestTimerDock();
const root=w.document.documentElement;
assert.equal(root.style.getPropertyValue('--rest-nav-center'),'200px','tray centers on nav bounds');
assert.equal(root.style.getPropertyValue('--rest-nav-width'),'378px','tray respects nav width');
assert.equal(root.style.getPropertyValue('--rest-nav-offset'),'97px','tray is aligned to actual nav top, not a guessed inset');

w.startRestTimer(90);
assert(tray.classList.contains('show'),'rest starts visible');
assert(!tray.classList.contains('expanded'),'rest starts compact');
assert.equal(w.document.getElementById('restTimerText').textContent,'1:30');
assert.equal(action.getAttribute('aria-expanded'),'false');
w.adjustRestTimer(30);
assert.equal(w.document.getElementById('restTimerText').textContent,'2:00','collapsed +30 still adjusts timer');

const countBefore=scrolls.length;
w.toggleRestTimerExpanded();
await wait(35);
assert(tray.classList.contains('expanded'),'tap opens expanded controls');
assert.equal(action.getAttribute('aria-expanded'),'true');
assert.equal(controls.getAttribute('aria-hidden'),'false');
assert(buttons.every(b=>b.tabIndex===0),'expanded buttons become keyboard accessible');
assert.equal(tray.querySelectorAll('.rest-actions button').length,3,'existing -30/+30/Skip retained');
w.adjustRestTimer(-30);
assert.equal(w.document.getElementById('restTimerText').textContent,'1:30');

w.toggleRestTimerExpanded();
assert(!tray.classList.contains('expanded'),'second tap collapses');
assert.equal(action.getAttribute('aria-expanded'),'false');
assert(buttons.every(b=>b.tabIndex===-1),'collapsed actions leave keyboard tab order');

w.dispatchEvent(new w.Event('resize'));
assert.equal(root.style.getPropertyValue('--rest-nav-offset'),'97px','device resize updates nav alignment');

assert.match(css,/#restTimer\.resttimer\{[\s\S]*?bottom:calc\(var\(--rest-nav-offset,82px\) - 1px\)/,
 'tray uses measured nav top instead of floating bottom offset');
assert.match(css,/#restTimer\.resttimer\{[\s\S]*?border-radius:18px 18px 0 0!important/,
 'tray adopts a nav-connected open-bottom silhouette');
assert.match(css,/#restTimer\.resttimer\.show\{[\s\S]*?transform:translate\(-50%,0\)!important/,
 'tray slides up into place');
assert.match(css,/#restTimer\.resttimer::before,[\s\S]*?#restTimer\.resttimer::after/,
 'rounded shoulders extend the nav outline');
assert.match(css,/html\.workout-keyboard-active #restTimer\.resttimer\.show,[\s\S]*?display:none!important/,
 'typing must hide tray entirely');
assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\s*#restTimer\.resttimer/,
 'reduced motion uses an immediate display');

root.classList.add('workout-keyboard-active');
assert.equal(w.getComputedStyle(tray).display,'none','visible tray hides when keyboard focus starts');
root.classList.remove('workout-keyboard-active');
w.stopRestTimer();
assert(!tray.classList.contains('show'),'Skip/stop hides tray');
assert.equal(action.getAttribute('aria-expanded'),'false');
assert.equal(controls.getAttribute('aria-hidden'),'true');
assert.equal(w.document.getElementById('restTimerText').textContent,'1:30','stopped timer does not modify logged sets');
assert(scrolls.length>=countBefore,'timer keeps normal workout navigation behavior');
nav.getBoundingClientRect=originalNavRect;
dom.window.close();
console.log('PASS v0.87: nav geometry, separate sliding tray, accessible compact/expanded controls, +30/-30/Skip, keyboard and reduced motion.');
