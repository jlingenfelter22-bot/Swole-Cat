import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const routines=fs.readFileSync('src/js/05-exercises-routines.js','utf8');
const programs=fs.readFileSync('src/js/03-programs.js','utf8');
const css=fs.readFileSync('src/styles/02-views.css','utf8');

new Function(routines);
new Function(programs);

assert.match(html,/class="routine-view-switch"/,'Routines screen should expose a segmented Routines/Programs switch');
assert.match(html,/id="routineViewRoutines"/,'Routines tab should exist');
assert.match(html,/id="routineViewPrograms"/,'Programs tab should exist');

const renderStart=routines.indexOf('function renderRoutines(){');
const renderEnd=routines.indexOf('\nlet routinePickerSelection=',renderStart);
assert(renderStart>=0&&renderEnd>renderStart,'renderRoutines should exist');
const render=routines.slice(renderStart,renderEnd);
assert.match(render,/routine-start-btn/,'Routine cards should keep Start/Resume prominent');
assert.match(render,/routine-edit-btn/,'Routine cards should keep Edit directly available');
assert.match(render,/openRoutineCardMenu/,'Routine cards should expose overflow management');
assert.doesNotMatch(render,/openRoutineShare\(/,'Routine cards should not expose Share directly');
assert.doesNotMatch(render,/archiveRoutine\(/,'Routine cards should not expose Archive directly');

const programStart=programs.indexOf('function programCard(p){');
const programEnd=programs.indexOf('\nfunction renderPrograms()',programStart);
assert(programStart>=0&&programEnd>programStart,'programCard should exist');
const programCard=programs.slice(programStart,programEnd);
assert.match(programCard,/program-start-btn/,'Program cards should keep Start Next/Resume prominent');
assert.match(programCard,/program-edit-btn/,'Program cards should keep Edit directly available');
assert.match(programCard,/openProgramCardMenu/,'Program cards should expose overflow management');
assert.doesNotMatch(programCard,/openProgramShare\(/,'Program cards should not expose Share directly');
assert.doesNotMatch(programCard,/openCoachProgramAudit\(/,'Program cards should not expose Coach Audit directly');
assert.doesNotMatch(programCard,/deleteProgram\(/,'Program cards should not expose Delete directly');
assert.doesNotMatch(programCard,/activateProgram\(/,'Program cards should not expose Set Active directly');

assert.match(routines,/function openRoutineCardMenu/,'Routine overflow menu should exist');
assert.match(routines,/Share Routine/,'Routine overflow should preserve sharing');
assert.match(routines,/Archive Routine/,'Routine overflow should preserve archive');
assert.match(programs,/function openProgramCardMenu/,'Program overflow menu should exist');
assert.match(programs,/Coach Audit/,'Program overflow should preserve Coach Audit');
assert.match(programs,/Share Program/,'Program overflow should preserve sharing');
assert.match(programs,/Delete Program/,'Program overflow should preserve delete');

assert.match(css,/\.routine-view-switch/,'Segmented navigation should be styled');
assert.match(css,/\.routine-view-tab\{[^}]*min-height:43px[^}]*background:rgba\(8,14,24,\.72\)/s,
  'Segmented tabs should have a stronger tappable inactive surface');
assert.match(css,/\.routine-view-tab\.active\{[^}]*border-color:rgba\(34,211,238,\.72\)[^}]*box-shadow:/s,
  'Selected Routines/Programs tab should have strong active contrast');
assert.match(css,/\.routine-view-tab\.active span\{[^}]*background:rgba\(34,211,238,\.10\)/s,
  'Selected count pill should reinforce the active state');
assert.match(css,/\.routine-card-actions/,'Routine action hierarchy should be styled');
assert.match(css,/\.program-card-actions/,'Program action hierarchy should be styled');
assert.match(css,/\.routine-manage-btn/,'Overflow control should be styled consistently');

console.log('Swole Cat v0.78.1 Routines hierarchy PASS: segmented view, Start/Edit priority, overflow management');
