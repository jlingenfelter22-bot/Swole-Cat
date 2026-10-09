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
const housingStyle=css.slice(css.indexOf('/* v0.87.4 // UNIFIED REST DOCK HOUSING'));
const slidingStyle=css.slice(css.indexOf('/* v0.87.5 // SLIDING REST DOCK'));
const liftStyle=css.slice(css.indexOf('/* v0.87.6 // RIGID WHOLE-RAIL LIFT'));
const pocketStyle=css.slice(css.indexOf('/* v0.87.7 // SOLID COMPACT UNDER-RAIL ACTION POCKET'));
assert(liftStyle.startsWith('/* v0.87.6'),'the rigid full-width rail remains the underlying mechanism');
assert(pocketStyle.startsWith('/* v0.87.7'),'the solid compact pocket must be the final rest visual style');
assert.match(pocketStyle,/:root\{--rest-rail-lift:57px\}/,
 'shorten the lift from 62px to 57px without affecting the resting geometry');
assert.match(pocketStyle,/nav \.rest-dock-pocket\{[\s\S]*?top:calc\(-1 \* var\(--rest-rail-lift\)\);[\s\S]*?height:var\(--rest-rail-lift\)/,
 'the solid pocket connects the lifted line back to nav edge across its full width');
assert.match(pocketStyle,/background:linear-gradient\(180deg,#0a1525 0%,#080f1b 56%,#060c16 100%\)/,
 'backing gradient uses only opaque colors and cannot show the workout underneath');
assert.match(pocketStyle,/transform:scaleY\(0\);[\s\S]*?transform-origin:center bottom/,
 'pocket reveals from the nav edge without changing the lifted rail shape');
assert.match(pocketStyle,/nav\.rest-notch-integrated\.rest-rail-raised \.rest-dock-pocket\{[\s\S]*?transform:scaleY\(1\)/,
 'the opaque pocket fully covers the revealed area while expanded');
assert.match(pocketStyle,/#restTimer\.resttimer\.expanded::before,[\s\S]*?content:none!important/,
 'old negative-z-index backing that caused a see-through rectangle is disabled');
assert.match(pocketStyle,/#restTimer\.resttimer \.rest-actions button\{[\s\S]*?height:42px!important/,
 'each compact button retains a 42px touch target');
assert.match(pocketStyle,/#restTimer\.resttimer \.rest-actions button::before\{[\s\S]*?inset:4px 1px/,
 'visible sharp button surface is 34px tall within its larger touch target');
assert.match(pocketStyle,/#restTimer\.resttimer\.expanded \.rest-actions\{[\s\S]*?height:53px!important/,
 'control shelf is tighter than its original 59px height');
assert.match(pocketStyle,/@media\(prefers-reduced-motion:reduce\)/,
 'pocket reveal respects reduced motion');
assert.match(liftStyle,/nav\.rest-notch-integrated\.rest-rail-raised \.rest-nav-housing\{[\s\S]*?translate3d\(0,calc\(-1 \* var\(--rest-rail-lift\)\),0\)/,
 'the entire full-width nav rail, not the center only, moves upward');
assert.match(liftStyle,/#restTimer\.resttimer\.show\.expanded\{[\s\S]*?translate3d\(-50%,calc\(-1 \* var\(--rest-rail-lift\)\),0\)/,
 'the timer and entire rail use the exact same translation distance');
assert.match(liftStyle,/#restTimer\.resttimer\.expanded,[\s\S]*?height:35px!important/,
 'expanding may not increase the main timer height and morph the contour');
assert.match(liftStyle,/#restTimer\.resttimer \.rest-actions,[\s\S]*?position:absolute!important/,
 'three controls reveal under the rail without changing the crest geometry');
assert.match(liftStyle,/#restTimer\.resttimer\.expanded::before\{[\s\S]*?height:59px/,
 'a clean under-rail backing may appear without changing the rail shape');
assert.match(liftStyle,/@media\(prefers-reduced-motion:reduce\)/,
 'rail lift honors reduced-motion settings');
assert(slidingStyle.startsWith('/* v0.87.5'),'sliding dock rules must be the final visual override');
assert.match(slidingStyle,/#restTimer\.resttimer\.expanded,[\s\S]*?width:154px!important/,
 'expanded timer must retain identical narrow width instead of becoming a wide panel');
assert.match(slidingStyle,/#restTimer\.resttimer\.expanded \.rest-actions\{[\s\S]*?max-height:60px/,
 'expanded controls are unveiled below countdown by animated shelf height');
assert.match(slidingStyle,/max-height 260ms cubic-bezier/,
 'rest controls move with a measured upward slide');
assert.match(slidingStyle,/#restTimer\.resttimer \.rest-actions button\{[\s\S]*?min-height:44px/,
 'all three action targets remain tall enough for touch');
assert(notchStyle.startsWith('/* v0.87.2'),'v0.87.2 recessed position remains authoritative');
assert(housingStyle.startsWith('/* v0.87.4'),'single-contour housing is the final visual style');
assert.match(housingStyle,/nav \.rest-nav-housing\{/,'the nav owns the shared housing silhouette');
assert.match(housingStyle,/nav \.rest-nav-housing-contour\{/,'one stroke follows the full nav and crest outline');
assert.match(housingStyle,/#restTimer\.resttimer:not\(\.expanded\)\{[\s\S]*?background:transparent!important/,
 'the countdown panel no longer paints a separate rectangular background');
assert.match(housingStyle,/#restTimer\.resttimer:not\(\.expanded\)::before,[\s\S]*?content:none!important/,
 'old decorative hooked wings must be removed from the final style');
assert.match(housingStyle,/nav\.rest-notch-integrated::before\{[\s\S]*?content:none!important/,
 'the old straight nav rail cannot show through the new crest');
assert.match(housingStyle,/html\.workout-keyboard-active nav \.rest-nav-housing/,
 'keyboard visibility still reverts to ordinary navigation');
const housing=w.document.getElementById('restNavHousing');
const pocket=w.document.getElementById('restDockPocket');
assert(pocket,'solid pocket element is mounted inside the nav');
assert.equal(pocket.parentElement,nav,'opaque surface belongs to nav housing, not a separate floating timer');
assert.equal(pocket.getAttribute('aria-hidden'),'true','solid backing is decorative, not a sixth tab');
const housingFill=w.document.getElementById('restNavHousingFill');
const housingContour=w.document.getElementById('restNavHousingContour');
assert(housing&&housingFill&&housingContour,'nav contains one decorative contour and its matching fill');
assert.equal(housing.getAttribute('aria-hidden'),'true','housing must remain decorative and unfocusable');
assert.match(notchStyle,/#restTimer\.resttimer:not\(\.expanded\)\{[\s\S]*?width:154px!important/,
 'passive notch narrows to 154px');
assert.match(notchStyle,/#restTimer\.resttimer:not\(\.expanded\)\{[\s\S]*?min-height:35px!important/,
 'passive notch shrinks to ~35px');
assert.match(slidingStyle,/#restTimer\.resttimer\.expanded,[\s\S]*?width:154px!important/,
 'the original large expanded width is overridden by the fixed narrow housing');
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
Object.defineProperty(tray,'offsetHeight',{configurable:true,get:()=>35});
await wait(45);
w.syncRestNotchClearance();
assert.equal(tray.classList.contains('rest-notch-obstructed'),false,'default notch must fit below the Complete Set button');
assert.equal(tray.style.getPropertyValue('--rest-notch-recess'),'17px','notch recesses into the nav without reaching its icons');
assert(nav.classList.contains('rest-notch-integrated'),'visible collapsed timer opens the nav seam');
assert.match(housingContour.getAttribute('d')||'',/^M 0 18 L /,'contour starts on the nav top and rises to the original notch');
assert.match(housingContour.getAttribute('d')||'',/ C /,'notch shoulders are continuous curved segments, not detached wings');
assert.equal(housing.getAttribute('viewBox'),'0 0 378 25','SVG contour precisely follows the measured nav width and recess');
assert(housingFill.getAttribute('d').includes('Z'),'a single filled silhouette sits behind the countdown');
const shapeAtRest=housingContour.getAttribute('d');
const countBefore=scrolls.length;
actionBottom=675; // 28px clearance, less than the previous floating tray height
w.syncRestNotchClearance();
assert.equal(tray.classList.contains('rest-notch-obstructed'),false,'passive notch fits without moving Complete Set');
assert.equal(scrolls.length,countBefore,'passive timer must never force a workout scroll');
actionBottom=696; // scrolling used to hide the timer here; now the timer remains pinned
w.dispatchEvent(new w.Event('scroll'));
await wait(50);
assert(!tray.classList.contains('rest-notch-obstructed'),'passive countdown no longer disappears while scrolling');
assert(tray.classList.contains('show'),'timer remains visible in workout even at tight scroll positions');
assert(nav.classList.contains('rest-notch-integrated'),'housing never pops out during a workout scroll');
assert.equal(tray.style.getPropertyValue('--rest-notch-recess'),'17px','scroll does not reposition the recessed notch');
assert.equal(housingContour.getAttribute('d'),shapeAtRest,'nav contour does not shift on scroll');
assert.equal(scrolls.length,countBefore,'timer never scrolls the workout for passive information');
actionBottom=650;
w.syncRestNotchClearance();
assert(nav.classList.contains('rest-notch-integrated'),'normal scroll recovery requires no visibility transition');
// Expansion is deliberately overlaid above the workout, without moving it.
w.toggleRestTimerExpanded();
await wait(55);
assert.equal(scrolls.length,countBefore,'raising the whole rail does not auto-scroll the workout');
assert(tray.classList.contains('expanded'),'tap expands the controls');
assert(nav.classList.contains('rest-notch-integrated'),'full-width rail remains connected');
assert(nav.classList.contains('rest-rail-raised'),'the entire full-width rail gets the lifted state');
assert(pocket.isConnected,'opaque pocket remains mounted during expansion');
assert.equal(housing.getAttribute('viewBox'),'0 0 378 25','the housing viewBox does not morph or get taller');
assert.equal(housingContour.getAttribute('d'),shapeAtRest,'the full-width contour path remains pixel-identical');
assert.equal(action.getAttribute('aria-expanded'),'true');
assert.equal(w.document.querySelectorAll('.rest-actions button').length,3,'the three compact controls stay intact');
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
assert(!nav.classList.contains('rest-rail-raised'),'rail returns to original resting position on collapse');
assert.equal(housingContour.getAttribute('d'),shapeAtRest,'the same rail shape is preserved throughout collapse');
assert.equal(scrolls.length,countBefore,'collapsing the rail does not shift workout scroll');
assert.equal(action.getAttribute('aria-expanded'),'false');
assert(buttons.every(b=>b.tabIndex===-1),'collapsed actions leave keyboard tab order');
assert(!nav.classList.contains('rest-rail-raised'),'solid pocket is retracted into nav in collapsed state');
assert.equal(housing.getAttribute('viewBox'),'0 0 378 25','collapse slides housing back to original resting size');

w.dispatchEvent(new w.Event('resize'));
await wait(45);
assert.equal(root.style.getPropertyValue('--rest-nav-offset'),'97px','device resize updates nav alignment');

assert.match(css,/#restTimer\.resttimer\{[\s\S]*?bottom:calc\(var\(--rest-nav-offset,82px\) - 1px\)/,
 'tray uses measured nav top instead of floating bottom offset');
assert.match(slidingStyle,/#restTimer\.resttimer\.expanded,[\s\S]*?bottom:calc\(var\(--rest-nav-offset,82px\) - var\(--rest-notch-recess,17px\)\)!important/,
 'expanded tray retains the same recessed base as collapsed countdown');
assert.match(css,/#restTimer\.resttimer\.show\{[\s\S]*?transform:translate\(-50%,0\)!important/,
 'tray slides up into place');
assert.match(housingStyle,/#restTimer\.resttimer:not\(\.expanded\)::before,[\s\S]*?display:none!important/,
 'there must be no legacy hook pseudo-elements in the final silhouette');
assert.match(css,/html\.workout-keyboard-active #restTimer\.resttimer\.show,[\s\S]*?display:none!important/,
 'typing must hide tray entirely');
assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\s*#restTimer\.resttimer/,
 'reduced motion uses an immediate display');

root.classList.add('workout-keyboard-active');
w.syncRestNotchSeam();
assert(!nav.classList.contains('rest-notch-integrated'),'hidden-for-keyboard timer should not leave a cutout in nav');
assert(!nav.classList.contains('rest-rail-raised'),'keyboard concealment removes any lifted rail state');
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
console.log('PASS v0.87.7: fully opaque nav pocket, compact 34px visible/42px touch buttons, 57px rigid rail lift, unchanged idle geometry and interactions.');
