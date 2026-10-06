import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function cloudKeys(window){
  const out=[];
  for(let i=0;i<window.localStorage.length;i++){
    const key=window.localStorage.key(i);
    if(key?.startsWith('swolecat_cloud_'))out.push(key);
  }
  return out.sort();
}
function workoutSnapshot(window){
  return JSON.parse(window.localStorage.getItem('overload_v3'));
}

async function localOnlyCase(){
  let fetchCalls=0;
  const dom=new JSDOM(html,{
    runScripts:'dangerously',
    url:'https://swole-cat.test/',
    pretendToBeVisual:true,
    beforeParse(window){
      window.SWOLE_CAT_CLOUD_CONFIG={disabled:true};
      window.localStorage.setItem('overload_v3',JSON.stringify({
        ui:{onboardingDone:true,haptics:false,keepAwake:false},
        routines:[],
        sessions:[]
      }));
      window.fetch=async()=>{fetchCalls++;throw new Error('Cloud network should not run');};
      window.alert=()=>{};
      window.confirm=()=>true;
      window.scrollTo=()=>{};
    }
  });
  await wait(80);
  const w=dom.window;
  const identity=w.SwoleCatRuntime.getService('identity');
  const config=w.SwoleCatRuntime.getService('cloudConfig');
  assert(identity,'identity service must exist');
  assert(config,'cloud config service must exist');
  assert.equal(config.configured(),false,'explicit local-only override must disable the configured lab backend');
  assert.equal(identity.snapshot().status,'local_only');
  assert.equal(identity.canUseCloud(),false);
  assert.deepEqual(cloudKeys(w),[],'local-only startup must not create cloud metadata');
  w.eval("state.profile.name='Local Cat';save()");
  await wait(20);
  assert.deepEqual(cloudKeys(w),[],'ordinary local saves must not create cloud metadata');
  assert.equal(fetchCalls,0,'local-only shell must make zero network calls');
  assert.equal(w.document.querySelector('script[data-swolecat-supabase]'),null,'local-only startup must not load Supabase JS');
  const settings=w.cloudSettingsHtml();
  assert.match(settings,/Local-only mode/);
  assert.match(settings,/Nothing is being sent/i);
  dom.window.close();
}

async function configuredShellCase(){
  let fetchCalls=0;
  const initial={
    ui:{onboardingDone:true,haptics:false,keepAwake:false},
    profile:{name:'Tester',unit:'lb'},
    routines:[],
    sessions:[{id:'local-session',date:'2026-10-02T12:00:00.000Z',exercises:[]}],
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
      window.fetch=async()=>{fetchCalls++;throw new Error('Identity shell itself must not fetch');};
      window.alert=()=>{};
      window.confirm=()=>true;
      window.scrollTo=()=>{};
    }
  });
  await wait(80);
  const w=dom.window;
  const identity=w.SwoleCatRuntime.getService('identity');
  const before=workoutSnapshot(w);
  assert.equal(identity.snapshot().configured,true);
  assert.equal(identity.snapshot().signedIn,false);
  assert.deepEqual(cloudKeys(w),[],'configured startup must still create no cloud storage before auth');
  let restored=0,signedIn=0,signedOut=0,loaderCalls=0;
  const fakeProvider={
    async restoreSession(){restored++;return {user:null};},
    async signInWithGoogle({authStorage}){
      signedIn++;
      await authStorage.setItem('fake-session','token');
      return {user:{id:'user-123',email:'tester@example.com',provider:'google'}};
    },
    async reauthenticateWithGoogle(){return {redirecting:true};},
    async deleteAccount({authStorage}){
      await authStorage.removeItem('fake-session');
      return {ok:true};
    },
    async signOut({authStorage}){
      signedOut++;
      await authStorage.removeItem('fake-session');
    }
  };
  w.SwoleCatRuntime.registerService('identityProviderLoader',{
    async ensureReady(){
      loaderCalls++;
      await identity.registerProvider(fakeProvider);
    }
  });
  assert.equal(identity.snapshot().providerReady,false,'configured shell should stay lazy before account use');
  assert.equal(fetchCalls,0,'configured signed-out startup should not perform hidden network work');
  assert.equal(w.document.querySelector('script[data-swolecat-supabase]'),null,'configured signed-out startup should not load Supabase JS');
  await identity.signInWithGoogle();
  assert.equal(loaderCalls,1,'sign-in should lazy-load the identity provider');
  assert.equal(restored,1,'provider registration should restore once');
  assert.equal(identity.snapshot().providerReady,true);
  assert.equal(signedIn,1);
  assert.equal(identity.snapshot().signedIn,true);
  assert.equal(identity.snapshot().user.email,'tester@example.com');
  assert.equal(identity.canUseCloud(),true);
  assert.deepEqual(cloudKeys(w),['swolecat_cloud_auth_v1:fake-session'],'only namespaced auth storage may appear after sign-in');
  assert.deepEqual(workoutSnapshot(w),before,'sign-in must not modify workout state');
  assert.equal(fetchCalls,0,'provider-neutral shell must not perform hidden network work');
  assert.match(w.cloudSettingsHtml(),/manual multi-device sync/i,'connected cloud copy should describe the current manual sync behavior without stale phase language');
  assert.equal(w.SwoleCatRuntime.getService('cloudSync').snapshot().queued,0,'sign-in alone must not queue workout sync records');
  await identity.signOut();
  assert.equal(signedOut,1);
  assert.equal(identity.snapshot().signedIn,false);
  assert.deepEqual(cloudKeys(w),[],'sign-out should remove provider auth material');
  assert.deepEqual(workoutSnapshot(w),before,'sign-out must leave workout data intact');
  dom.window.close();
}

await localOnlyCase();
await configuredShellCase();
console.log('Swole Cat v0.67.0 cloud shell boundaries PASS');
