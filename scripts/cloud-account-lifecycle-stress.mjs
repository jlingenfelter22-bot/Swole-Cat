import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const identitySource=fs.readFileSync('src/js/10b-cloud-identity.js','utf8');
const providerSource=fs.readFileSync('src/js/10c-supabase-auth-provider.js','utf8');
const deleteFunction=fs.readFileSync('supabase/functions/delete-account/index.ts','utf8');
const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');

assert.equal(pkg.version,'0.67.6');
assert.equal(pkg.swoleCat.androidVersionCode,89);

assert.match(identitySource,/reauthenticateWithGoogle/);
assert.match(identitySource,/deleteAccount/);
assert.match(identitySource,/Delete cloud account/);
assert.match(identitySource,/local training data on this device will stay exactly where they are/i);
assert.doesNotMatch(identitySource,/overload_v3/,'account lifecycle must stay outside workout state');

assert.match(providerSource,/SWOLE_CAT_CLOUD_REAUTH_PENDING_KEY/);
assert.match(providerSource,/SWOLE_CAT_CLOUD_REAUTH_VERIFIED_KEY/);
assert.match(providerSource,/SWOLE_CAT_CLOUD_REAUTH_MAX_AGE_MS=10\*60\*1000/);
assert.match(providerSource,/queryParams:\{prompt:'select_account'\}/);
assert.match(providerSource,/does not match the Swole Cat account you are trying to verify/);
assert.match(providerSource,/functions\.invoke\('delete-account',\{body:\{confirm:true\}\}\)/);
assert.match(providerSource,/requireFreshSwoleCatReauth/);
assert.match(providerSource,/scope:'local'/);

assert.match(deleteFunction,/SUPABASE_SERVICE_ROLE_KEY/);
assert.match(deleteFunction,/admin\.auth\.getUser\(token\)/);
assert.match(deleteFunction,/admin\.auth\.admin\.deleteUser\(user\.id, false\)/);
assert.match(deleteFunction,/body\.confirm !== true/);
assert.doesNotMatch(deleteFunction,/body\.userId|body\.user_id|body\.id/,'caller must never choose which user is deleted');

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const initial={
  ui:{onboardingDone:true,haptics:false,keepAwake:false},
  profile:{name:'Lifecycle Cat',unit:'lb'},
  routines:[{id:'r1',name:'Keep Me',exercises:[]}],
  sessions:[{id:'s1',date:'2026-10-04T00:00:00.000Z',exercises:[]}],
  settings:{defaultMin:8,defaultMax:12,defaultSets:3,defaultIncrement:5,coachAliases:{}}
};

const dom=new JSDOM(html,{
  runScripts:'dangerously',
  url:'https://swole-cat.test/',
  pretendToBeVisual:true,
  beforeParse(window){
    window.SWOLE_CAT_CLOUD_CONFIG={
      supabaseUrl:'https://example.supabase.co',
      supabasePublishableKey:'sb_publishable_test'
    };
    window.localStorage.setItem('overload_v3',JSON.stringify(initial));
    window.alert=()=>{};
    window.confirm=()=>true;
    window.scrollTo=()=>{};
  }
});

await wait(80);
const w=dom.window;
const identity=w.SwoleCatRuntime.getService('identity');
const before=w.localStorage.getItem('overload_v3');
let reauthCalls=0,deleteCalls=0;

const fakeProvider={
  async restoreSession(){
    return {user:{id:'user-123',email:'lifecycle@example.com',provider:'google'}};
  },
  async signInWithGoogle(){
    return {user:{id:'user-123',email:'lifecycle@example.com',provider:'google'}};
  },
  async reauthenticateWithGoogle(){
    reauthCalls++;
    return {redirecting:true};
  },
  async deleteAccount(){
    deleteCalls++;
    return {ok:true};
  },
  async signOut(){
    return {ok:true};
  }
};

await identity.registerProvider(fakeProvider);
assert.equal(identity.snapshot().signedIn,true);
assert.match(w.cloudSettingsHtml(),/Workout sync is intentionally OFF/i);
w.openCloudAccount();
assert.match(w.document.body.textContent,/Delete cloud account/i);

await identity.reauthenticateWithGoogle();
assert.equal(reauthCalls,1,'Google verification must be requested before the destructive UI step');
assert.equal(identity.snapshot().signedIn,true,'reauth redirect must not discard the current local account state');

await identity.deleteAccount();
assert.equal(deleteCalls,1);
assert.equal(identity.snapshot().signedIn,false);
assert.equal(w.localStorage.getItem('overload_v3'),before,'deleting the cloud account must not alter local workout data');

dom.window.close();
console.log('Swole Cat v0.67.6 Phase 8.1 account lifecycle PASS');
