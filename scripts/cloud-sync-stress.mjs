import fs from 'node:fs';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {JSDOM} from 'jsdom';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const syncSource=fs.readFileSync('src/js/10f-cloud-sync.js','utf8');
const providerSource=fs.readFileSync('src/js/10g-supabase-sync-provider.js','utf8');
const migrationSource=fs.readFileSync('supabase/migrations/20261005145700_phase_8_3_sync_foundation.sql','utf8');
const settingsSource=fs.readFileSync('src/js/09-settings-ui-bootstrap.js','utf8');
const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');

assert.equal(pkg.version,'0.69.0');
assert.equal(pkg.swoleCat.androidVersionCode,91);

assert.match(syncSource,/SWOLE_CAT_SYNC_STORAGE_KEY='swolecat_sync_v1'/);
assert.match(syncSource,/state:saved/);
assert.match(syncSource,/lastServerCursor/);
assert.match(syncSource,/newer Swole Cat data format/);
assert.match(syncSource,/pending/);
assert.match(syncSource,/conflicts/);
assert.match(syncSource,/SWOLE_CAT_SYNC_DELETED_HASH/);
assert.match(syncSource,/Keep This Device/);
assert.match(syncSource,/Use Cloud/);
assert.match(syncSource,/active_workout/);
assert.doesNotMatch(syncSource,/service_role|SUPABASE_SERVICE_ROLE_KEY/);
assert.doesNotMatch(providerSource,/service_role|SUPABASE_SERVICE_ROLE_KEY/);

assert.match(providerSource,/schema_version:DATA_SCHEMA_VERSION/);
assert.match(providerSource,/\.gt\('server_change_seq'/);
assert.match(providerSource,/\.eq\('record_version',Number\(expectedVersion\)\|\|0\)/);
assert.match(providerSource,/String\(error\.code\|\|''\)==='23505'/);
assert.match(settingsSource,/Multi-device sync/);
assert.match(settingsSource,/cloudSyncSettingsHtml\(\)/);

assert.match(migrationSource,/create table if not exists public\.devices/i);
assert.match(migrationSource,/create table if not exists public\.sync_records/i);
assert.match(migrationSource,/alter table public\.devices enable row level security/i);
assert.match(migrationSource,/alter table public\.sync_records enable row level security/i);
assert.match(migrationSource,/server_change_seq bigint/i);
assert.match(migrationSource,/schema_version integer/i);
assert.match(migrationSource,/record_version bigint/i);
assert.match(migrationSource,/deleted_at timestamptz/i);
assert.match(migrationSource,/sync records select own/);
assert.match(migrationSource,/sync records insert own/);
assert.match(migrationSource,/sync records update own/);
assert.match(migrationSource,/new\.record_version := old\.record_version \+ 1/);
assert.match(migrationSource,/nextval\('public\.swolecat_sync_change_seq'\)/);
assert.doesNotMatch(migrationSource,/grant[^;]+delete[^;]+authenticated/i);
assert.doesNotMatch(migrationSource,/grant[^;]+to anon/i);

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const initial={
  schemaVersion:1,
  meta:{lastBackupAt:null,lastSavedAt:null,lastMigrationAt:null},
  profile:{name:'Device A',unit:'lb'},
  customExercises:[{id:'custom-1',name:'Custom Row',muscle:'Back',equipment:'Cable'}],
  routines:[{id:'r1',name:'Routine One',description:'',trainingMode:'progressive',archivedAt:null,exercises:[]}],
  programs:[],
  activeProgramId:null,
  sessions:[{id:'s1',date:'2026-10-05T12:00:00.000Z',routineName:'Routine One',exercises:[]}],
  activeWorkout:null,
  favorites:['custom-1'],
  exercisePreferences:{'custom-1':'prefer'},
  bodyweight:[{date:'2026-10-05T12:05:00.000Z',value:150}],
  ui:{onboardingDone:true,haptics:false,keepAwake:false},
  settings:{defaultMin:8,defaultMax:12,defaultSets:3,defaultIncrement:5,coachAliases:{}}
};

let online=false;
let hiddenFetchCalls=0;
const dom=new JSDOM(html,{
  runScripts:'dangerously',
  url:'https://swole-cat.test/',
  pretendToBeVisual:true,
  beforeParse(window){
    Object.defineProperty(window,'crypto',{value:webcrypto,configurable:true});
    Object.defineProperty(window.navigator,'onLine',{get:()=>online,configurable:true});
    window.__setOnline=value=>{online=!!value};
    window.SWOLE_CAT_CLOUD_CONFIG={
      supabaseUrl:'https://example.supabase.co',
      supabasePublishableKey:'sb_publishable_test'
    };
    window.localStorage.setItem('overload_v3',JSON.stringify(initial));
    window.fetch=async()=>{hiddenFetchCalls++;throw new Error('Unexpected hidden network call');};
    window.alert=()=>{};
    window.confirm=()=>true;
    window.scrollTo=()=>{};
  }
});

await wait(120);
const w=dom.window;
const identity=w.SwoleCatRuntime.getService('identity');
const sync=w.SwoleCatRuntime.getService('sync');
assert(identity,'identity service must exist');
assert(sync,'sync service must exist');
assert.equal(hiddenFetchCalls,0,'signed-out/local startup must not wake sync networking');

const fakeIdentity={
  async restoreSession(){return {user:{id:'user-sync',email:'sync@example.com',provider:'google'}};},
  async signInWithGoogle(){return {user:{id:'user-sync',email:'sync@example.com',provider:'google'}};},
  async reauthenticateWithGoogle(){return {redirecting:true};},
  async deleteAccount(){return {ok:true};},
  async signOut(){return {ok:true};}
};
await identity.registerProvider(fakeIdentity);
assert.equal(identity.snapshot().signedIn,true);
assert.equal(sync.snapshot().enabled,false);
assert.equal(hiddenFetchCalls,0,'signing in alone must not start workout sync traffic');

let seq=0;
let syncInsertCalls=0,syncUpdateCalls=0,syncPullCalls=0;
let loseNextUpdateAck=false;
const records=new Map();
const devices=new Map();
const keyOf=(type,id)=>type+'::'+id;
const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
const toRow=(change,version,sourceDeviceId)=>{
  seq++;
  return {
    owner_id:'user-sync',
    record_type:change.type,
    record_id:change.id,
    payload_json:clone(change.payload),
    schema_version:Number(change.schemaVersion)||1,
    record_version:version,
    server_change_seq:seq,
    source_device_id:sourceDeviceId,
    client_updated_at:change.clientUpdatedAt||new Date().toISOString(),
    server_updated_at:new Date(Date.UTC(2026,9,5,15,0,seq)).toISOString(),
    deleted_at:change.deletedAt||null
  };
};
const fakeSyncProvider={
  async registerDevice(device){
    devices.set(device.id,{...device,lastSeenAt:new Date().toISOString()});
    return clone(devices.get(device.id));
  },
  async pullChanges({afterSeq,limit}){
    syncPullCalls++;
    return [...records.values()]
      .filter(row=>row.server_change_seq>afterSeq)
      .sort((a,b)=>a.server_change_seq-b.server_change_seq)
      .slice(0,limit)
      .map(clone);
  },
  async getRecord({type,id}){
    return clone(records.get(keyOf(type,id))||null);
  },
  async insertRecord(change){
    syncInsertCalls++;
    const key=keyOf(change.type,change.id);
    if(records.has(key))return {conflict:true,record:clone(records.get(key))};
    const row=toRow(change,1,change.deviceId);
    records.set(key,row);
    return {conflict:false,record:clone(row)};
  },
  async updateRecord(change){
    syncUpdateCalls++;
    const key=keyOf(change.type,change.id);
    const current=records.get(key);
    if(!current||current.record_version!==change.expectedVersion){
      return {conflict:true,record:clone(current||null)};
    }
    const row=toRow(change,current.record_version+1,change.deviceId);
    records.set(key,row);
    if(loseNextUpdateAck){
      loseNextUpdateAck=false;
      throw new Error('simulated lost write acknowledgement');
    }
    return {conflict:false,record:clone(row)};
  }
};
const remoteWrite=(type,id,payload,{deleted=false,source='device-b',schemaVersion=1}={})=>{
  const key=keyOf(type,id);
  const current=records.get(key);
  const change={
    type,id,payload:deleted?null:clone(payload),
    schemaVersion,
    deletedAt:deleted?new Date().toISOString():null,
    clientUpdatedAt:new Date().toISOString()
  };
  const row=toRow(change,(current?.record_version||0)+1,source);
  records.set(key,row);
  return row;
};

await sync.registerProvider(fakeSyncProvider);
assert.equal(hiddenFetchCalls,0,'registering the sync transport must not start hidden traffic');

await sync.enable();
let info=sync.snapshot();
assert.equal(info.enabled,true);
assert.equal(info.conflictCount,0);
assert.equal(info.pendingCount,0);
assert.equal(devices.size,1,'enabling sync should register exactly one installation');
assert(records.has(keyOf('routine','r1')),'routine must seed as an individual sync record');
assert(records.has(keyOf('session','s1')),'session must seed as an individual sync record');
assert(records.has(keyOf('custom_exercise','custom-1')),'custom exercise must seed independently');
assert(records.has(keyOf('profile','profile')),'profile singleton must seed');
assert(records.has(keyOf('settings','settings')),'training settings singleton must seed');
assert(records.has(keyOf('bodyweight','2026-10-05T12:05:00.000Z')),'bodyweight timestamp must provide stable record identity');
assert(![...records.values()].some(row=>row.record_type==='ui_preferences'),'device-only UI preferences must not sync');
assert(w.localStorage.getItem('swolecat_sync_v1'),'sync metadata must live in its own local record');
assert.equal(JSON.parse(w.localStorage.getItem('overload_v3')).ui.haptics,false,'enabling sync must not rewrite device UI preferences');

w.eval("state.routines[0].name='Offline Local Edit';save()");
await wait(20);
info=sync.snapshot();
assert(info.pendingCount>=1,'offline local save must enter the durable sync queue');
assert.equal(records.get(keyOf('routine','r1')).payload_json.name,'Routine One','offline save must not require or mutate the server');
assert.equal(JSON.parse(w.localStorage.getItem('overload_v3')).routines[0].name,'Offline Local Edit','offline local save remains authoritative on device');

w.__setOnline(true);
await sync.syncNow();
info=sync.snapshot();
assert.equal(info.pendingCount,0);
assert.equal(syncUpdateCalls,1,'reconnecting must push the queued routine with one optimistic update');
assert.equal(records.get(keyOf('routine','r1')).payload_json.name,'Offline Local Edit','queued offline change must push after reconnect');
assert.equal(records.get(keyOf('routine','r1')).record_version,2);

w.eval("state.routines[0].name='Ack Can Get Lost';save()");
await wait(20);
loseNextUpdateAck=true;
await assert.rejects(()=>sync.syncNow(),/simulated lost write acknowledgement/);
assert.equal(sync.snapshot().pendingCount,1,'a lost response must leave the local change durably queued');
assert.equal(records.get(keyOf('routine','r1')).payload_json.name,'Ack Can Get Lost','the simulated server write must still have landed');
await sync.syncNow();
assert.equal(sync.snapshot().pendingCount,0,'the next pull should recognize this device\'s matching server write as the acknowledgement');
assert.equal(sync.snapshot().conflictCount,0,'an acknowledgement lost in transit must never become a false multi-device conflict');

remoteWrite('session','s-remote',{id:'s-remote',date:'2026-10-05T13:00:00.000Z',routineName:'Remote Session',exercises:[]});
await sync.syncNow();
let local=JSON.parse(w.localStorage.getItem('overload_v3'));
assert(local.sessions.some(row=>row.id==='s-remote'),'independent remote records must merge into local state');

w.__setOnline(false);
w.eval("state.routines[0].name='Device A Conflict';save()");
await wait(20);
remoteWrite('routine','r1',{...records.get(keyOf('routine','r1')).payload_json,name:'Device B Conflict'});
w.__setOnline(true);
await sync.syncNow();
info=sync.snapshot();
local=JSON.parse(w.localStorage.getItem('overload_v3'));
assert.equal(info.conflictCount,1,'same-record concurrent edits must surface a conflict');
assert.equal(local.routines[0].name,'Device A Conflict','remote conflict must not silently overwrite the local edit');

const conflictKey=JSON.parse(w.localStorage.getItem('swolecat_sync_v1')).conflicts[0].key;
sync.resolveConflict(conflictKey,'cloud');
local=JSON.parse(w.localStorage.getItem('overload_v3'));
assert.equal(local.routines[0].name,'Device B Conflict','Use Cloud must apply the preserved remote version');
assert.equal(sync.snapshot().conflictCount,0);

w.__setOnline(false);
w.eval("state.routines[0].name='Keep Device A';save()");
await wait(20);
remoteWrite('routine','r1',{...records.get(keyOf('routine','r1')).payload_json,name:'Device B Again'});
w.__setOnline(true);
await sync.syncNow();
assert.equal(sync.snapshot().conflictCount,1);
const conflictKey2=JSON.parse(w.localStorage.getItem('swolecat_sync_v1')).conflicts[0].key;
sync.resolveConflict(conflictKey2,'local');
await sync.syncNow();
assert.equal(records.get(keyOf('routine','r1')).payload_json.name,'Keep Device A','Keep This Device must push only against the reviewed remote version');
assert.equal(sync.snapshot().conflictCount,0);

w.__setOnline(false);
w.eval("state.sessions=state.sessions.filter(s=>s.id!=='s1');save()");
await wait(20);
assert(sync.snapshot().pendingCount>=1,'local deletion must queue a tombstone');
w.__setOnline(true);
await sync.syncNow();
const tombstone=records.get(keyOf('session','s1'));
assert(tombstone.deleted_at,'server record must retain a deletion tombstone');
assert.equal(tombstone.payload_json,null);

remoteWrite('custom_exercise','custom-1',null,{deleted:true});
await sync.syncNow();
local=JSON.parse(w.localStorage.getItem('overload_v3'));
assert(!local.customExercises.some(row=>row.id==='custom-1'),'remote tombstone must remove the corresponding local record');

remoteWrite('session','future-schema',{id:'future-schema',date:'2026-10-05T14:00:00.000Z',routineName:'Future Schema',exercises:[]},{schemaVersion:99});
const beforeFutureSchema=w.localStorage.getItem('overload_v3');
await assert.rejects(()=>sync.syncNow(),/newer Swole Cat data format/i);
assert.equal(w.localStorage.getItem('overload_v3'),beforeFutureSchema,'an incompatible future-schema record must never mutate local training data');
assert(!JSON.parse(w.localStorage.getItem('overload_v3')).sessions.some(row=>row.id==='future-schema'));
records.delete(keyOf('session','future-schema'));

const localBeforeSignOut=w.localStorage.getItem('overload_v3');
await identity.signOut();
assert.equal(identity.snapshot().signedIn,false);
await assert.rejects(()=>sync.syncNow(),/Sign in/i);
assert.equal(w.localStorage.getItem('overload_v3'),localBeforeSignOut,'signed-out sync failure must never mutate local workout state');

dom.window.close();
console.log('Swole Cat v0.69.0 multi-device sync PASS');
