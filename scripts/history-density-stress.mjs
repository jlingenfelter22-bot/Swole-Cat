import fs from 'node:fs';
import assert from 'node:assert/strict';

const history=fs.readFileSync('src/js/07-history-editor.js','utf8');
const css=fs.readFileSync('src/styles/02-views.css','utf8');
const html=fs.readFileSync('index.html','utf8');

new Function(history);

const renderStart=history.indexOf('function renderHistory(){');
const renderEnd=history.indexOf('\nfunction calculateHistoricalPR',renderStart);
assert(renderStart>=0&&renderEnd>renderStart,'renderHistory should exist');
const render=history.slice(renderStart,renderEnd);

assert.doesNotMatch(render,/history-table/,'History feed must not render full set tables');
assert.doesNotMatch(render,/Delete Workout/,'Delete must not live directly on every History card');
assert.match(render,/history-metrics/,'History cards should expose compact summary metrics');
assert.match(render,/historyMuscleSummaryHtml/,'History cards should expose compact muscle context');
assert.match(render,/historyExerciseSummary/,'History cards should expose compact exercise context');
assert.match(render,/View Recap/,'View Recap should remain the primary History action');
assert.match(render,/history-edit-btn/,'Edit should remain available as a secondary action');
assert.match(render,/openHistorySessionMenu/,'Each session should expose a compact manage menu');

assert.match(history,/function openHistorySessionMenu/,'History should have a per-session options surface');
assert.match(history,/Delete Workout/,'Delete should remain available inside session options');
assert.match(history,/function openHistoryOptions/,'History should have a global management surface');
assert.match(history,/Clear All Workout History/,'Clear-all should remain available behind management');

assert.match(html,/onclick="openHistoryOptions\(\)">Manage<\/button>/,'History header should use neutral Manage instead of a destructive clear button');
assert.doesNotMatch(html,/onclick="clearWorkoutHistory\(\)">Clear History<\/button>/,'Clear History must not remain in the primary header path');

assert.match(css,/\/\* HISTORY \/\/ compact session timeline \*\//,'History should use the compact timeline visual treatment');
assert.match(css,/\.history-metrics/,'History should style compact metrics');
assert.match(css,/\.history-manage-btn/,'History should style the overflow/manage control');
assert.match(css,/\.history-recap-btn/,'View Recap should have explicit primary emphasis');
assert.match(css,/\.history-edit-btn/,'Edit should have explicit secondary emphasis');

console.log('Swole Cat v0.77.0 History density PASS: compact timeline, recap-first detail, demoted destructive actions, preserved management');
