// v0.93 Coach mobile acceptance, simulated DOM (NOT physical Android/WebView).
// Run with the existing /tmp/swole-cat-test.html CI fixture and jsdom@24.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
 }
});
await new Promise(resolve=>setTimeout(resolve,200));
const w=dom.window,doc=w.document;
const body=doc.getElementById('modalBody');
assert(body,'real modal host must exist');
let modal='',toast='';
w.openModal=(title,html)=>{modal=html;body.innerHTML=html;};
w.showToast=message=>{toast=message};
const draft=()=>w.eval('coachProgramBuildDraft');
const before=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})');

function prompt(text){
 body.innerHTML='<textarea id="coachPrompt"></textarea>';
 doc.getElementById('coachPrompt').value=text;
 w.coachSubmitPrompt();
}
function snapshot(label){
 return {label,dayCount:body.querySelectorAll('.coach-program-day-card').length,
  splitGuidance:body.querySelectorAll('.coach-split-guidance .btn').length,
  editor:!!body.querySelector('.coach-day-editor'),
  controls:body.querySelectorAll('button').length};
}
// A short/ambiguous request needs a real tap target for optional guidance.
prompt('Help me build a 3-day split');
assert.match(modal,/What kind of split did you have in mind/i);
assert(body.querySelector('button[onclick="coachAskForSplitRecommendation()"]'),'recommendation must be a tappable button');
assert.equal(draft().days.length,0);
w.coachAskForSplitRecommendation();
assert.match(modal,/main thing you want out of this program/i);
w.coachAnswerProgramGoal('hypertrophy');
assert(body.querySelector('.coach-choice-grid.coach-split-guidance'),'detailed guidance uses mobile-specific stack');
assert.equal(body.querySelectorAll('.coach-split-guidance button').length,4);
assert(body.querySelectorAll('.coach-split-guidance .mini').length>=4,'explanations must remain visible and legible');
assert.equal(draft().days.length,0,'suggesting a split never silently creates a workout');
const guidance=snapshot('opt-in split guidance');

const mixed='3-day push pull legs Monday 30 minutes at the gym, Wednesday 45 minutes with dumbbells only, Friday 75 minutes at the gym, for muscle growth, track only';
prompt(mixed);
assert.equal(draft().days.length,3,'three workouts generated');
assert.equal(body.querySelectorAll('.coach-program-day-card').length,3);
assert.equal(body.querySelectorAll('.coach-program-day-card .coach-program-day-head').length,3);
assert.equal(body.querySelectorAll('.coach-program-day-card button[aria-label^="Adjust"]').length,3);
assert.match(body.textContent,/Equipment varies by day/i,'the overview must not claim shared access is missing when every day has settings');
assert.deepEqual(Array.from(draft().days.map(day=>day.request.duration)),[30,45,75]);
assert.equal(body.querySelectorAll('button[onclick="coachSaveGeneratedProgram()"]').length,1);
assert.equal(body.querySelectorAll('button[onclick="coachStartProgramFirstWorkout()"]').length,1);
assert(body.querySelector('[role="region"][aria-label="Coach whole-week review"]'),'review is accessible and rendered');
const names=Array.from(body.querySelectorAll('.coach-program-exercise-row .exercise-name'));
assert(names.length>=8,'generated exercises remain visible');
assert(names.every(el=>el.textContent.trim().length>1),'names are not replaced with ellipsis');
const actions=body.querySelectorAll('.coach-program-exercise-row .coach-program-exercise-actions');
assert.equal(actions.length,names.length,'each exercise has local actions');
assert([...actions].every(x=>x.querySelectorAll('button').length===2));
assert([...actions].every(x=>[...x.querySelectorAll('button')].every(b=>['Swap','Remove'].includes(b.textContent.trim()))));
assert.equal(body.querySelectorAll('.coach-program-day-details').length,3,'each day can collapse a long exercise list');
assert.equal(body.querySelectorAll('.coach-program-day-details[open]').length,1,'only the first day is expanded initially');
const composer=body.querySelector('.coach-program-composer');
assert(composer?.querySelector('input#coachProgramRefinePrompt'),'Coach composer is available in the preview');
assert.equal(body.querySelectorAll('#coachProgramRefinePrompt').length,1,'no duplicated Coach input in a long program');
assert(composer.compareDocumentPosition(body.querySelector('.coach-exercise-list'))&w.Node.DOCUMENT_POSITION_FOLLOWING,
 'Talk to Coach must appear BEFORE the long day/exercise breakdown');
assert(body.querySelector('details.coach-program-prompt-tips'),'long example prompts are hidden on demand');
assert(body.querySelector('details.coach-program-secondary'),'weekly planning notes use disclosure');
const preview=snapshot('mixed-gym-and-home preview');

// Editor for only Wednesday, without the user being asked to re-enter global gear.
w.coachEditProgramDay(1);
assert.equal(body.querySelectorAll('.coach-day-editor').length,1);
assert.equal(doc.getElementById('coachDayMinutes').value,'45');
const select=doc.getElementById('coachDayEquipment'),custom=doc.getElementById('coachDayCustomEquipment');
const block=doc.getElementById('coachDayCustomBlock');
assert.equal(select.value,'dumbbells');
assert(block.hidden&&custom.disabled,'custom equipment must not compete visually with standard choices');
assert.equal(doc.querySelectorAll('#coachDayMinutes').length,1);
assert.equal(doc.querySelectorAll('#coachDayEquipment').length,1);
assert.equal(doc.querySelectorAll('#coachDayFocus').length,1);
for(const field of ['coachDayMinutes','coachDayEquipment','coachDayFocus','coachDayCustomEquipment']){
 const el=doc.getElementById(field);
 assert(el.hasAttribute('aria-label')||doc.querySelector(`label[for="${field}"]`),'form control must be labeled: '+field);
}
select.value='custom';select.dispatchEvent(new w.Event('change',{bubbles:true}));
assert(!block.hidden&&!custom.disabled,'custom choice reveals its field');
custom.value='unrecognized quantum device';doc.getElementById('coachDayMinutes').value='55';
assert.equal(w.coachSaveProgramDaySettings(1),false,'unrecognized equipment is rejected');
assert.match(toast,/recognized|list some equipment|could not recognize/i);
assert.deepEqual(Array.from(draft().days.map(day=>day.request.duration)),[30,45,75],'failed edit does not touch plan');
select.value='dumbbells';select.dispatchEvent(new w.Event('change',{bubbles:true}));
assert(block.hidden&&custom.disabled,'switching back hides and disables field');
assert.equal(w.coachSaveProgramDaySettings(1),true,'valid one-day edit succeeds');
assert.deepEqual(Array.from(draft().days.map(day=>day.request.duration)),[30,55,75]);
assert.equal(body.querySelectorAll('.coach-program-day-card').length,3,'editor returns to full preview after apply');
assert.match(body.textContent,/about [0-9]+ min/,'day estimate remains visible');
const edited=snapshot('adjust day editor and live updated preview');

// Keyboard/IME path, using the same button as a tap; one-day correction must remain scoped.
const refine=doc.getElementById('coachProgramRefinePrompt');
refine.value='Wednesday 50 minutes';
w.coachApplyProgramRefinement();
assert.deepEqual(Array.from(draft().days.map(day=>day.request.duration)),[30,50,75]);
assert.equal(body.querySelectorAll('.coach-program-day-card').length,3);
assert.equal(draft().intent.trainingMode,'track');
assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})'),before,
 'preview, intake, changes and cancellation do not save workouts or touch history');

// CSS/layout contracts for 320–430 CSS px, Android small-screen viewport.
// JSDOM does not compute pixel layouts; physical phone remains a separate gate.
const css=fs.readFileSync('src/styles/03-polish.css','utf8');
const base=fs.readFileSync('src/styles/00-base.css','utf8');
assert(css.includes('@media(max-width:430px){')&&css.includes('.coach-choice-grid.coach-split-guidance{grid-template-columns:minmax(0,1fr)}'),'rich split guidance has one-column mobile layout');
assert(css.includes('.coach-program-exercise-row{flex-wrap:wrap'));
assert(css.includes('.coach-program-exercise-actions .btn{min-width:0;min-height:44px}'));
assert(css.includes('.coach-program-save-actions .btn{min-height:48px'));
assert(css.includes('.coach-day-editor .search{min-width:0;min-height:48px;font-size:16px}'));
assert(css.includes('.coach-day-custom-field[hidden]{display:none!important}'));
assert(/\.modal-mode-coach-program \.coach-program-composer(?:\{|,)/.test(css),'the Coach composer has a scoped sticky keyboard-safe container');
assert(css.includes('.modal-mode-coach-program .coach-program-composer{')&&css.includes('position:sticky;top:0;bottom:auto'),
 'generated plan has top-anchored Coach composer before the day breakdown');
assert(css.includes('.modal-mode-coach-program .sheet{')&&css.includes('height:calc(100dvh - max(var(--sc-safe-top,0px),24px) - 8px)'),
 'Coach sheet uses one keyboard-responsive height source and stays bottom-aligned');
assert(css.includes('.modal-mode-coach-program .sheet-head{')&&css.includes('flex:0 0 auto;'),
 'modal header stays in a stationary top rail');
assert(css.includes('.modal-mode-coach-program #modalBody{')&&css.includes('overflow-y:auto;')&&css.includes('overscroll-behavior-y:contain;'),
 'long workouts scroll in modal body, without pushing the header or dock away');
assert(!css.includes('.modal-mode-coach-program .coach-program-composer{position:relative;top:auto}'),
 'opening the keyboard must never demote the floating composer to a normal in-flow element');
assert(css.includes('margin:0 -18px 12px;')&&css.includes('position:sticky;top:0;bottom:auto'),
 'Coach bar docks flush below the header with no exposed scroll content gap');
assert(css.includes('.modal-mode-coach-saved .coach-program-composer')&&css.includes('position:sticky;bottom:-18px'),
 'saved program editor retains its bottom-anchored proposal input');
assert(css.includes('.native-app.keyboard-open .modal-mode-coach-program .sheet')&&css.includes('scroll-padding-bottom:16px'),'avoid double-counting IME padding');
const modalSource=fs.readFileSync('src/js/09-settings-ui-bootstrap.js','utf8');
assert(modalSource.includes('if(sheet)sheet.scrollTop=0;'),'newly opened Workout complete dialog cannot inherit Coach preview scroll');
const nativeSource=fs.readFileSync('src/js/01-core-runtime.js','utf8');
assert(nativeSource.includes("active.closest?.('.coach-program-composer')"),'avoid competing input centering animation during Android keyboard open');
assert(!nativeSource.includes("active.scrollIntoView({block:'center'"),'old Android centered smooth focus path cannot return');
const programSource=fs.readFileSync('src/js/03-programs.js','utf8');
const editorSource=fs.readFileSync('src/js/04d-coach-program-builder.js','utf8');
assert(programSource.includes('coachOpenSavedProgramEditor('),'saved Program card/menu routes to contextual Coach editor');
assert(editorSource.includes('function coachApplySavedProgramEdits()'),'contextual editor requires explicit reviewed apply');
assert(editorSource.includes('newRoutine.id=uid()'),'edited routines remain copy-on-write');
assert(editorSource.includes('ownerNow!==d.signedInOwnerId'),'edits cannot cross cloud-account changes');
assert(!programSource.includes('function openCoachSavedProgramWorkouts('),'do not regress to the separate day-only menu flow');
assert(base.includes('max-height:min(88dvh'),'modal handles Android dynamic viewport height');
console.log('COACH_MOBILE_DOM_ACCEPTANCE PASS '+JSON.stringify({
 emulatedCssWidths:[320,360,393,430],guidance,preview,edited,
 inputFontPx:16,minActionHeightPx:44,historyUntouched:true,
 physicalAndroidReviewed:false
}));
dom.window.close();
