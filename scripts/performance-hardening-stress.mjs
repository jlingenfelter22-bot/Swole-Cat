import fs from 'node:fs';
import assert from 'node:assert/strict';

const core=fs.readFileSync('src/js/01-core-runtime.js','utf8');
const workout=fs.readFileSync('src/js/06-workout-engine.js','utf8');
const settings=fs.readFileSync('src/js/09-settings-ui-bootstrap.js','utf8');
const sync=fs.readFileSync('src/js/10f-cloud-sync.js','utf8');
const appJs=fs.readFileSync('www/app.js');
const appCss=fs.readFileSync('www/app.css');

new Function(core);
new Function(workout);
new Function(settings);
new Function(sync);

assert.match(core,/syncRelevant/,'state saves should carry cloud-sync relevance metadata');
assert.match(core,/scheduleStateSave\(delay=220,syncRelevant=true\)/,'deferred saves should preserve relevance metadata');
assert.match(workout,/saveActiveWorkout\(true,false\)/,'high-frequency set entry should remain local-only until a sync-relevant state change');
assert.match(workout,/updateNotes\(ei,v\).*saveActiveWorkout\(true,false\)/,'live workout notes should avoid re-hashing cloud history on each keystroke');

assert.doesNotMatch(settings,/const observer=new MutationObserver\(\(\)=>syncAppSelect\(select\)\)/,'each select must not allocate its own MutationObserver');
assert.match(settings,/appSelectPendingRoots/,'dynamic select enhancement should batch mutation roots');
assert.match(settings,/queueMicrotask/,'dynamic select enhancement should collapse each mutation burst');
assert.match(settings,/select\.isConnected/,'detached selects should not be enhanced');

assert.match(sync,/event\?\.detail\?\.syncRelevant===false/,'cloud sync should ignore explicitly local-only workout autosaves');
assert.match(sync,/SWOLE_CAT_SYNC_TEXT_ENCODER/,'sync hashing should reuse one TextEncoder');
assert.doesNotMatch(sync,/new TextEncoder\(\)\.encode/,'sync hashing should not allocate an encoder per record');

assert(appJs.length<1_500_000,'built JavaScript exceeded the 1.5 MB performance guardrail');
assert(appCss.length<300_000,'built CSS exceeded the 300 KB performance guardrail');

console.log('Swole Cat v0.75.0 performance hardening PASS: local-only workout autosaves, batched select enhancement, lower sync allocation churn, and bundle guardrails');
