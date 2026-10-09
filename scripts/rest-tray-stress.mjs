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
assert.equal(tray.querySelector('.rest-quick-add'),null,'collapsed state has no visible or focusable adjustment button');
assert.deepEqual([...tray.children].filter(el=>el.tagName==='BUTTON').map(el=>el.className),['rest-main'],
  'the only collapsed button is the timer/expand target');
const microStyle=css.slice(css.indexOf('/* v0.87.1 // COMPACT CYBER REST COMMAND POD'));
const notchStyle=css.slice(css.indexOf('/* v0.87.2 // Recessed rest notch'));
const seamStyle=css.slice(css.indexOf('/* v0.87.3 // CONTINUOUS REST NOTCH SEAM'));
assert(notchStyle.startsWith('/* v0.87.2'),'v0.87.2 recessed behavior is preserved');
assert(seamStyle.startsWith('/* v0.87.3'),'v0.87.3 visual integration is the latest style');
assert.match(seamStyle,/nav\.rest-notch-integrated\{\s*border-top-color:transparent!important/,
 'nav hides its original solid top border around the passive notch');
assert.match(seamStyle,/nav\.rest-notch-integrated::before\{[\s\S]*?calc\(50% - 92px\)/,
 'nav top line is split at the molded notch shoulders, not drawn behind it');
assert.match(seamStyle,/#restTimer\.resttimer:not\(\.expanded\)\{[\s\S]*?border-top:1px solid/,
 'notch and nav use a shared subtle seam weight');
assert.match(seamStyle,/#restTimer\.resttimer:not\(\.expanded\)::before,[\s\S]*?height:calc\(100% - var\(--rest-notch-recess,16px\)\)/,
 'bevel shoulders terminate at the nav upper edge instead of forming hooks');
assert.match(seamStyle,/#restTimer\.resttimer:not\(\.expanded\)::before\{[\s\S]*?linear-gradient\(130deg/,
 'left notch transition uses an angular bevel');
assert.match(seamStyle,/#restTimer\.resttimer:not\(\.expanded\)::after\{[\s\S]*?linear-gradient\(230deg/,
 'right notch transition mirrors the bevel');
assert.match(seamStyle,/html\.workout-keyboard-active nav\.rest-notch-integrated/,
 'nav top line restores when the timer is hidden during keyboard input');
assert.match(notchStyle,/#restTimer\.resttimer:not\(\.expanded\)\{[\s\S]*?width:154px!important/,
 'passive notch narrows to 154px');
assert.match(notchStyle,/#restTimer\.resttimer:not\(\.expanded\)\{[\s\S]*?min-height:35px!important/,
 'passive notch shrinks to ~35px');
assert.match(notchStyle,/#restTimer\.resttimer\.expanded\{[\s\S]*?width:270px!important/,
 'expanded tray stays wide enough for three actions');
assert.match(notchStyle, /--rest-notch-recess,16px/,'notch sinks into the top of nav instead of floating above it');
assert.match(microStyle,/rgba\(194,81,243,\.94\)/,'neon-magenta to cyan trim adds dimensionality');
assert.match(microStyle,/repeating-linear-gradient\(135deg/,'micro-etched panel texture avoids a flat face');
assert.match(microStyle,/#restTimer \.rest-main small::before/,'the rest label retains a small status light');
assert.equal(action.getAttribute('aria-expanded'),'false');
assert.equal(controls.getAttribute('aria-hidden'),'true');
assert(buttons.every(b=>b.tabIndex===-1),'hidden actions are not tabbable');

const originalNavRect=nav.getBoundingClientRect.bind(nav);
nav.getBoundingClientRect=()=>({left:11,right:389,top:703,bottom:789,width:378,height:86});
const glyph=nav.querySelector('[data-go="exercises"] .nav-glyph');
glyph.getBoundingClientRect=()=>({left:180,right:210,top:730,bottom:755,width:30,height:25});
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
const timerBefore=tray.querySelector('#restTimerText').textContent;
assert.equal(timerBefore,'1:30','collapsed rest timer remains countdown-only');
const primary=w.document.querySelector('#workout .focus-set-card .complete-set');
const focusHeader=w.document.querySelector('#workout .focus-exercise-nav-shell');
assert(primary&&focusHeader,'the actual Complete Set control is available');
let actionBottom=650;
primary.getBoundingClientRect=()=>({top:actionBottom-48,bottom:actionBottom,height:48});
focusHeader.getBoundingClientRect=()=>({top:220,bottom:307,height:87});
Object.defineProperty(tray,'offsetHeight',{configurable:true,get:()=>tray.classList.contains('expanded')?110:35});
await wait(45);
w.syncRestNotchClearance();
assert.equal(tray.classList.contains('rest-notch-obstructed'),false,'default notch must fit below the Complete Set button');
assert.equal(tray.style.getPropertyValue('--rest-notch-recess'),'17px','notch recesses into the nav without reaching its icons');
assert(nav.classList.contains('rest-notch-integrated'),'visible collapsed timer opens the nav seam');
const countBefore=scrolls.length;
actionBottom=675; // 28px clearance, less than the previous floating tray height
w.syncRestNotchClearance();
assert.equal(tray.classList.contains('rest-notch-obstructed'),false,'passive notch fits without moving Complete Set');
assert.equal(scrolls.length,countBefore,'passive timer must never force a workout scroll');
actionBottom=696; // impossible to display full countdown above the glyphs without obstructing the action
w.syncRestNotchClearance();
assert(tray.classList.contains('rest-notch-obstructed'),'critical collision hides the passive notch instead of overlaying Complete Set');
assert(!nav.classList.contains('rest-notch-integrated'),'hidden timer restores uninterrupted nav border');
actionBottom=650;
w.syncRestNotchClearance();
assert(!tray.classList.contains('rest-notch-obstructed'),'notch returns as soon as the primary action has clearance');
assert(nav.classList.contains('rest-notch-integrated'),'recovered timer restores seamless nav cutout');
assert.equal(scrolls.length,countBefore,'collision resolution never repositions the workout');
// An explicit expansion may take space and preserve Complete Set by scrolling.
w.toggleRestTimerExpanded();
await wait(55);
assert(scrolls.length>countBefore,'expanded tray triggers protective scroll when needed');
assert(scrolls[scrolls.length-1].top>=60,'expanded tray reserves enough height for controls');
// Continue expanded controls test.
assert(tray.classList.contains('expanded'),'tap opens expanded controls');
assert(!nav.classList.contains('rest-notch-integrated'),'expanded tray restores full-width nav top border');
assert.equal(action.getAttribute('aria-expanded'),'true');
assert.equal(controls.getAttribute('aria-hidden'),'false');
assert(buttons.every(b=>b.tabIndex===0),'expanded buttons become keyboard accessible');
assert.equal(tray.querySelectorAll('.rest-actions button').length,3,'existing -30/+30/Skip retained');
buttons[1].click();
assert.equal(w.document.getElementById('restTimerText').textContent,'2:00','expanded +30 adjusts time');
buttons[0].click();
assert.equal(w.document.getElementById('restTimerText').textContent,'1:30','expanded -30 adjusts time');

w.toggleRestTimerExpanded();
assert(!tray.classList.contains('expanded'),'second tap collapses');
await wait(45);
assert(nav.classList.contains('rest-notch-integrated'),'collapsing returns to the integrated notch seam');
assert.equal(action.getAttribute('aria-expanded'),'false');
assert(buttons.every(b=>b.tabIndex===-1),'collapsed actions leave keyboard tab order');

w.dispatchEvent(new w.Event('resize'));
await wait(45);
assert.equal(root.style.getPropertyValue('--rest-nav-offset'),'97px','device resize updates nav alignment');

assert.match(css,/#restTimer\.resttimer\{[\s\S]*?bottom:calc\(var\(--rest-nav-offset,82px\) - 1px\)/,
 'tray uses measured nav top instead of floating bottom offset');
assert.match(notchStyle,/#restTimer\.resttimer\.expanded\{[\s\S]*?bottom:calc\(var\(--rest-nav-offset,82px\) - 1px\)!important/,
 'expanded controls rise out of their recessed position to sit above nav');
assert.match(css,/#restTimer\.resttimer\.show\{[\s\S]*?transform:translate\(-50%,0\)!important/,
 'tray slides up into place');
assert.match(css,/#restTimer\.resttimer::before,[\s\S]*?#restTimer\.resttimer::after/,
 'rounded shoulders extend the nav outline');
assert.match(css,/html\.workout-keyboard-active #restTimer\.resttimer\.show,[\s\S]*?display:none!important/,
 'typing must hide tray entirely');
assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\s*#restTimer\.resttimer/,
 'reduced motion uses an immediate display');

root.classList.add('workout-keyboard-active');
w.syncRestNotchSeam();
assert(!nav.classList.contains('rest-notch-integrated'),'hidden-for-keyboard timer should not leave a cutout in nav');
assert.equal(w.getComputedStyle(tray).display,'none','visible tray hides when keyboard focus starts');
root.classList.remove('workout-keyboard-active');
w.syncRestNotchSeam();
assert(nav.classList.contains('rest-notch-integrated'),'restored countdown returns seam after keyboard dismissal');
w.stopRestTimer();
assert(!nav.classList.contains('rest-notch-integrated'),'stopped rest must leave nav edge whole');
assert(!tray.classList.contains('show'),'Skip/stop hides tray');
assert.equal(action.getAttribute('aria-expanded'),'false');
assert.equal(controls.getAttribute('aria-hidden'),'true');
assert.equal(w.document.getElementById('restTimerText').textContent,'1:30','stopped timer does not modify logged sets');
assert(scrolls.length>=countBefore,'timer keeps normal workout navigation behavior');
nav.getBoundingClientRect=originalNavRect;
dom.window.close();
console.log('PASS v0.87.3: continuous nav/notch seam, beveled shoulders, keyboard/collision/expanded cutout cleanup, no placement changes.');
