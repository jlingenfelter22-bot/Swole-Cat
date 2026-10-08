import fs from 'node:fs';
import assert from 'node:assert/strict';

const base=fs.readFileSync('src/styles/00-base.css','utf8');
const system=fs.readFileSync('src/styles/01-design-system.css','utf8');
const views=fs.readFileSync('src/styles/02-views.css','utf8');
const polish=fs.readFileSync('src/styles/03-polish.css','utf8');
const visualDoc=fs.readFileSync('docs/VISUAL_LANGUAGE.md','utf8');
const css=[base,system,views,polish].join('\n');

const expectedTokens=[
  ['--signal-info','#22d3ee'],
  ['--signal-plan','#a855f7'],
  ['--signal-coach','#a855f7'],
  ['--signal-active','#35e98a'],
  ['--signal-pr','#ff4fa3'],
  ['--signal-history','#f472b6'],
  ['--signal-warning','#f59e0b'],
  ['--signal-danger','#fb7185'],
  ['--signal-superset','#facc15']
];
for(const [token,value] of expectedTokens){
  assert(system.includes(token+':'+value+';'), 'semantic token '+token+' should remain '+value);
}

assert.match(polish,/#routines\{--screen-accent:var\(--signal-plan\)/,
  'Routines should use planning violet');
assert.match(polish,/#history\{--screen-accent:var\(--signal-history\)/,
  'History should use record/history pink');
assert.match(polish,/#analytics\{--screen-accent:var\(--signal-info\)/,
  'Progress should use information cyan');
assert.match(polish,/#routines \.routine-view-tab\.active\{[\s\S]*var\(--signal-plan\)/,
  'Routines/Programs segmented selection should use planning violet');

assert.match(polish,/\.navbtn\[data-go="routines"\]\.active\{--nav-accent:var\(--signal-plan\)\}/,
  'Routines nav should inherit planning identity');
assert.match(polish,/\.navbtn\[data-go="history"\]\.active\{--nav-accent:var\(--signal-history\)\}/,
  'History nav should inherit history identity');

assert.match(polish,/\.home-coach-launcher,[\s\S]*var\(--signal-coach\)/,
  'Coach surfaces should use Coach/planning violet');
assert.match(polish,/#home \.home-active-stats,[\s\S]*var\(--signal-active\)/,
  'Active workout surfaces should use success green');
assert.match(polish,/\.btn\.danger,[\s\S]*var\(--signal-danger\)/,
  'Destructive actions should use danger red');
assert.match(polish,/workout-context-control\[data-state="resume"\][\s\S]*var\(--signal-active\)/,
  'Resume header state should use active green');
assert.match(polish,/workout-context-control\[data-state="pause"\][\s\S]*var\(--signal-warning\)/,
  'Pause header state should use warning orange');

assert.match(base,/\.superset-badge\{[^}]*signal-superset/s,
  'Base superset badge should use protected yellow token');
assert.match(base,/\.superset-note\{[^}]*signal-superset/s,
  'Base superset note should use protected yellow token');
assert.match(polish,/SUPERSETS: protected yellow semantic language/,
  'Final polish should explicitly protect yellow superset language');
assert.match(polish,/#workout \.superset-flow\{[^}]*signal-superset/s,
  'Live superset flow should use protected yellow token');

const supersetLines=css.split('\n').filter(line=>/superset/i.test(line));
assert(!supersetLines.some(line=>/(244,114,182|ff2e88|f472b6|signal-pr)/i.test(line)),
  'Superset styling must not drift into pink/PR language');

assert.match(base,/\.pr-banner\{[^}]*signal-pr/s,'PR banner should use PR pink token');
assert.match(base,/\.summary-pr\{[^}]*signal-pr/s,'PR summary should use PR pink token');
const prLines=css.split('\n').filter(line=>/(pr-banner|summary-pr|pr-glyph|pr-tag|inline-pr)/i.test(line));
assert(!prLines.some(line=>/(251,191,36|fbbf24|facc15|signal-superset)/i.test(line)),
  'PR styling must not reuse yellow/superset language');

assert.match(visualDoc,/Superset linkage is yellow throughout the app/,'visual-language documentation should protect yellow supersets');
assert.match(visualDoc,/PRs and record achievements are pink/,'visual-language documentation should keep PRs distinct from supersets');

console.log('Swole Cat v0.80.0 visual language PASS: semantic colors consistent, supersets protected yellow, PRs distinct pink');
