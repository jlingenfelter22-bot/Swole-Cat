import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync('sw.js','utf8');
const built=fs.existsSync('www/sw.js')?fs.readFileSync('www/sw.js','utf8'):source;

for(const [label,text] of [['source',source],['built',built]]){
  assert.match(text,/const isSameOrigin=u\.origin===self\.location\.origin/,`${label}: service worker must detect same-origin requests`);
  assert.match(text,/if\(!isSameOrigin\)\{[\s\S]*fetch\(e\.request,\{cache:'no-store'\}\)/,`${label}: cross-origin traffic must bypass the cache`);
  assert.match(text,/if\(e\.request\.method!=='GET'\)\{[\s\S]*fetch\(e\.request\)/,`${label}: mutating requests must bypass the app-shell cache`);

  const externalGuard=text.indexOf('if(!isSameOrigin)');
  const genericCache=text.lastIndexOf('e.respondWith(caches.match(e.request)');
  assert(externalGuard>=0&&genericCache>externalGuard,`${label}: external traffic must be excluded before generic cache lookup`);

  const formSource=text.indexOf("u.hostname==='exercise-dataset.com'");
  const workoutArt=text.indexOf("u.hostname==='raw.githubusercontent.com'");
  assert(formSource>=0&&workoutArt>=0&&formSource<externalGuard&&workoutArt<externalGuard,`${label}: only explicit exercise media exceptions may precede the external bypass`);
}

console.log('Swole Cat v0.69.4 service-worker cloud cache boundary PASS');
