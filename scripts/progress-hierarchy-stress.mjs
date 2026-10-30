import fs from 'node:fs';
import assert from 'node:assert/strict';

const analytics=fs.readFileSync('src/js/02-muscle-history-analytics.js','utf8');
const css=fs.readFileSync('src/styles/02-views.css','utf8');

new Function(analytics);

const start=analytics.indexOf('function renderAnalytics(){');
const end=analytics.indexOf('\nfunction logBodyweight(){',start);
assert(start>=0&&end>start,'renderAnalytics should exist');
const render=analytics.slice(start,end);

assert.match(analytics,/function progressVolumeTrend30/,'Progress should calculate a 30-day volume trend');
assert.match(analytics,/function openProgressMethodology/,'Progress should move methodology into contextual help');
assert.match(render,/YOUR TRAINING SIGNAL/,'Progress should lead with a motivating snapshot');
assert.match(render,/progress-snapshot-grid/,'Progress should expose compact top-level result metrics');
assert.match(render,/CONSISTENCY/,'Progress snapshot should surface consistency');
assert.match(render,/VOLUME · 30D/,'Progress snapshot should surface volume trend');

const snapshot=render.indexOf('YOUR TRAINING SIGNAL');
const consistency=render.indexOf('8-week consistency');
const strength=render.indexOf('Recent strength changes');
const prs=render.indexOf('Recent PRs');
const divider=render.indexOf('TRAINING DETAIL');
const calendar=render.indexOf('Training calendar');
const records=render.indexOf('Lifetime records');
const coverage=render.indexOf('Muscle coverage');
assert(snapshot>=0&&consistency>snapshot&&strength>consistency&&prs>strength,
  'Progress should order snapshot -> consistency -> strength -> PRs');
assert(divider>prs&&calendar>divider&&records>calendar&&coverage>records,
  'Detailed analytics should live below the results-first section');

assert.doesNotMatch(render,/Primary involvement contributes 1\.0 per working set/,
  'Workload methodology should not permanently occupy the main Progress screen');
assert.match(analytics,/Primary muscles contribute more than secondary muscles|Primary involvement contributes 1\.0/,
  'Methodology detail should remain available somewhere in Progress help');

assert.match(css,/\.progress-snapshot-grid\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/s,
  'Progress snapshot should use a phone-friendly 2x2 metric grid');
assert.match(css,/\.progress-primary-chart/,'Primary consistency chart should receive stronger hierarchy');
assert.match(css,/\.progress-inline-help/,'Detailed analytics should use compact contextual help controls');
assert.match(css,/\.progress-secondary-divider/,'Progress should visually separate results from training detail');

console.log('Swole Cat v0.79.0 Progress simplification PASS: results first, analysis second, explanation on demand');
