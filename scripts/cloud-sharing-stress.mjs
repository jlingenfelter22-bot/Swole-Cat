import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const migration=fs.readFileSync('supabase/migrations/20261006153500_phase_8_4_cloud_plan_sharing.sql','utf8');
const edge=fs.readFileSync('supabase/functions/plan-share/index.ts','utf8');
const providerSource=fs.readFileSync('src/js/10h-supabase-sharing-provider.js','utf8');

assert.match(migration,/create table public\.plan_shares/i);
assert.match(migration,/code_hash text not null unique/i,'usable share code must not be stored directly');
assert.doesNotMatch(migration,/\bshare_code\s+text\b/i,'migration must not persist plaintext share codes');
assert.match(migration,/references auth\.users\(id\) on delete cascade/i);
assert.match(migration,/enable row level security/i);
assert.match(migration,/revoke all on table public\.plan_shares from anon, authenticated/i);
assert.match(migration,/grant all on table public\.plan_shares to service_role/i);
assert.match(migration,/interval '7 days 5 minutes'/i);

assert.match(edge,/SHARE_EXPIRY_MS = 7 \* 24 \* 60 \* 60 \* 1000/);
assert.match(edge,/SHARE_ACTIVE_CAP = 25/);
assert.match(edge,/CODE_BODY_LENGTH = 16/);
assert.match(edge,/cleanupExpired\(admin\)/);
assert.match(edge,/pruneOwnerToRoomForOne\(admin, user\.id\)/);
assert.match(edge,/sha256Hex\(normalizeCode\(code\)\)/,'server should store a hash of the usable code');
assert.match(edge,/admin\.auth\.getUser\(token\)/,'creating a cloud share must authenticate the sender');
assert.match(edge,/body\.action === "resolve"/,'recipient resolution must be a dedicated action');
assert.match(providerSource,/functions\.invoke\('plan-share'/,'client must use the controlled plan-share Edge Function');

const dom=new JSDOM(html,{
 runScripts:'dangerously',
 url:'https://swole-cat.test/',
 pretendToBeVisual:true,
 beforeParse(window){
  window.SWOLE_CAT_CLOUD_CONFIG={
   supabaseUrl:'https://example.supabase.co',
   supabasePublishableKey:'sb_publishable_test'
  };
  window.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  window.alert=()=>{};
  window.confirm=()=>true;
  window.scrollTo=()=>{};
  Object.defineProperty(window.navigator,'onLine',{value:true,configurable:true});
 }
});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const read=()=>JSON.parse(dom.window.localStorage.getItem('overload_v3'));

await wait(120);
const w=dom.window;
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
w.installRegressionFixturePlan();

let state=read();
const program=state.programs[0];
assert(program,'fixture must include a program');

const code='SC-7K4M-PQ2D-X9V7-R3HT';
const expiresAt='2026-10-13T15:35:00.000Z';
let storedEnvelope=null;
let createCalls=0;
let resolveCalls=0;

w.SwoleCatRuntime.registerService('identity',{
 snapshot(){return {configured:true,signedIn:true,user:{id:'sender-1',email:'sender@example.com'}}}
});
const sharing=w.SwoleCatRuntime.getService('planSharing');
assert(sharing,'planSharing service must exist');
sharing.registerProvider({
 async createShare({envelope}){
  createCalls++;
  storedEnvelope=envelope;
  return {code,expiresAt,kind:envelope.kind,name:envelope.program?.name||envelope.routine?.name};
 },
 async resolveShare({code:receivedCode}){
  resolveCalls++;
  assert.equal(receivedCode,code);
  return {envelope:storedEnvelope,expiresAt,kind:storedEnvelope.kind,name:storedEnvelope.program?.name||storedEnvelope.routine?.name};
 }
});

assert.equal(w.shareNormalizeCloudCode('text sc 7k4m pq2d x9v7 r3ht end'),code,'cloud code parser should tolerate spaces and surrounding message text');
assert.equal(sharing.canCreate(),true,'signed-in online sender should be able to create a cloud share');
assert.equal(sharing.canResolve(),true,'online recipient should be able to resolve a cloud share');

await w.openProgramShare(program.id);
await wait(20);
assert.equal(createCalls,1,'Share should create exactly one cloud ticket');
assert(storedEnvelope,'cloud provider should receive a plan envelope');
assert.equal(storedEnvelope.kind,'program');
assert(!('sessions' in storedEnvelope),'cloud share must exclude workout history');
assert(!('profile' in storedEnvelope),'cloud share must exclude profile data');
assert(!('activeWorkout' in storedEnvelope),'cloud share must exclude active workout state');
assert(!('bodyweight' in storedEnvelope),'cloud share must exclude bodyweight');
assert.equal(w.document.getElementById('shareCodeField')?.value,code,'primary Share UI should display only the short cloud code');
assert.doesNotMatch(w.document.getElementById('modalBody').textContent,/SWOLECAT1\./,'primary cloud share UI should not expose the legacy giant code');
assert.match(w.document.getElementById('modalBody').textContent,/7 days/i,'cloud Share UI should explain expiration');

w.openOfflineShareForDraft();
const offlineCode=w.document.getElementById('shareCodeField')?.value||'';
assert.match(offlineCode,/^SWOLECAT1\./,'offline fallback should preserve the legacy self-contained package');
assert(offlineCode.length>code.length*10,'offline package should remain clearly separate from the short cloud ticket');

await w.openProgramShare(program.id);
await wait(20);
w.SwoleCatRuntime.registerService('identity',{
 snapshot(){return {configured:true,signedIn:false,user:null}}
});
assert.equal(sharing.canCreate(),false,'signed-out recipient must not be able to create a cloud share');
assert.equal(sharing.canResolve(),true,'signed-out recipient should still be able to resolve a cloud share');

w.openShareImport('My friend sent '+code);
await w.previewShareImport();
await wait(10);
assert.equal(resolveCalls,1,'short code import should resolve through cloud exactly once');
assert.match(w.document.getElementById('modalTitle').textContent,/Import preview/i);
assert.match(w.document.getElementById('modalBody').textContent,/Cloud share/i);
assert.match(w.document.getElementById('modalBody').textContent,new RegExp(code.replaceAll('-','\\-')));
const beforePrograms=read().programs.length;
w.confirmSharedPlanImport();
assert.equal(read().programs.length,beforePrograms+1,'resolved cloud program should import as a fresh local copy');

w.openShareImport(offlineCode);
await w.previewShareImport();
assert.match(w.document.getElementById('modalTitle').textContent,/Import preview/i,'legacy offline packages must remain import-compatible');

dom.window.close();
console.log('Swole Cat v0.71.0 cloud sharing PASS: 7-day short codes, signed-in create, accountless resolve, hashed backend tickets, 25-share retention, and offline compatibility');
