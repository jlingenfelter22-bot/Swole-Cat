import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const home=fs.readFileSync('src/js/04e-coach-ui.js','utf8');
const insights=fs.readFileSync('src/js/04g-coach-history-insights.js','utf8');
const css=fs.readFileSync('src/styles/02-views.css','utf8');

const primary=html.indexOf('id="homePrimary"');
const telemetry=html.indexOf('id="homeTelemetry"');
const coach=html.indexOf('id="homeCoachLauncher"');
const latest=html.indexOf('id="homeLatest"');
const quick=html.indexOf('id="homeQuickActions"');
assert(primary>=0&&telemetry>primary&&coach>telemetry&&latest>coach&&quick>latest,
  'Home DOM should read Train -> Progress -> Coach -> Intelligence/Recap -> Shortcuts');

assert.match(home,/function homeWeekSummaryHtml/,'Home should have a compact weekly progress strip');
assert.match(home,/signal\.innerHTML=homeWeekSummaryHtml/,'weekly progress should be rendered as the compact strip');
assert.doesNotMatch(home,/homeWeekSummaryHtml\([^\n]+\)\+coachInsightHtml/,
  'weekly progress and Coach insight should not stack in one telemetry surface');
assert.match(home,/latest\.innerHTML=insight\|\|/,'Home should show one secondary intelligence surface at a time');
assert.match(home,/signal\.innerHTML=homeActiveWorkoutSummaryHtml\(active,ac\)/,
  'active workouts should use the Home telemetry area for live workout context');
assert.match(home,/latest\.innerHTML=homeActiveWorkoutNowHtml\(active\)/,
  'active workouts should show the current movement instead of leaving Home blank');
assert.match(home,/coach\.innerHTML='';/,
  'active workouts should still suppress unrelated Coach content');
assert.match(home,/quick\.innerHTML=homeActiveWorkoutPulseHtml\(active\)/,
  'active workouts should use the lower Home slot for Session Pulse instead of normal shortcuts');
assert.match(home,/function homeActiveWorkoutSummaryHtml/,'active Home should expose elapsed, set, and exercise progress');
assert.match(home,/function homeActiveWorkoutNowHtml/,'active Home should expose current workout position');
assert.match(home,/function homeActiveWorkoutPulseHtml/,'active Home should fill the remaining space with live session context');
assert.match(home,/reps logged/,'Session Pulse should include live rep count');
assert.match(home,/PR\$\{prs===1\?'':'s'\} hit/,'Session Pulse should include live PR count');
assert.match(home,/home-active-route-item/,'Session Pulse should include an exercise progress rail');
assert.match(home,/homeActiveRestText/,'Session Pulse should support a live rest countdown');
assert.match(home,/btn secondary home-coach-go/,'Coach action should remain visually secondary to Start Workout');
assert.match(home,/home-hero-primary/,'training CTA should have dedicated primary emphasis');
assert.match(insights,/home-smart-card home-coach-insight/,'deep Coach insights should use the restrained Home surface');

assert.match(css,/\.home-week-strip/,'Home should style the compact weekly strip');
assert.match(css,/\.home-smart-card/,'Home should use a restrained secondary intelligence surface');
assert.match(css,/\.home-hero-primary/,'Home should visually prioritize the training CTA');
assert.match(css,/\.home-coach-go/,'Home should visually demote the Coach submit action');
assert.match(css,/\.home-active-pulse/,'active Home should style Session Pulse');
assert.match(css,/\.home-active-route/,'active Home should style the exercise route');
assert.match(css,/\.home-coach-chips\{[^}]*flex-wrap:nowrap[^}]*overflow-x:auto/,
  'Coach suggestion chips should remain compact instead of expanding Home vertically');

console.log('Swole Cat v0.76.2 Home hierarchy PASS: train-first hero, compact progress, secondary Coach, single smart surface, compact shortcuts');
