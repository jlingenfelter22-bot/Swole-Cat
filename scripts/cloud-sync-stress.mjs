import fs from 'node:fs';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {TextEncoder} from 'node:util';
import {JSDOM} from 'jsdom';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const syncSource=fs.readFileSync('src/js/10f-cloud-sync.js','utf8');
const providerSource=fs.readFileSync('src/js/10g-supabase-sync-provider.js','utf8');
const migrationSource=fs.readFileSync('supabase/migrations/20261005_phase_8_3_sync_foundation.sql','utf8');
const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');

assert.equal(pkg.version,'0.69.0');
assert.equal(pkg.swoleCat.androidVersionCode,91);

assert.match(syncSource,/SWOLE_CAT_SYNC_LOCAL_KEY='swolecat-sync-local-v1'/);
assert.match(syncSource,/state:saved/);
assert.match(syncSource,/syncScheduleCapture/);
assert.match(syncSource,/syncProjectState/);
assert.doesNotMatch(syncSource,/put\('active_workout'/,'active workout must stay local-only in the first sync pass');
assert.match(syncSource,/record-level sync/i);
assert.match(syncSource,/syncPullRemote/);
assert.match(syncSource,/syncPushQueue/);
assert.match(syncSource,/syncResolveConflict/);
assert.match(syncSource,/deleted/);
assert.doesNotMatch(syncSource,/service_role|SUPABASE_SERVICE_ROLE_KEY/);

assert.match(providerSource,/\.gt\('server_change_seq'/);
assert.match(providerSource,/\.eq\('record_version',mutation\.expectedVersion\)/);
assert.match(providerSource,/last_mutation_id/);
assert.match(providerSource,/23505/);
assert.doesNotMatch(providerSource,/service_role|SUPABASE_SERVICE_ROLE_KEY/);

assert.match(migrationSource,/alter table public\.devices enable row level security/i);
assert.match(migrationSource,/alter table public\.sync_records enable row level security/i);
assert.match(migrationSource,/server_change_seq/);
assert.match(migrationSource,/record_version/);
assert.match(migrationSource,/last_mutation_id/);
assert.match(migrationSource,/revoke all on table public\.sync_records from anon, authenticated/i);
assert.match(migrationSource,/grant update \(\s*payload_json/);
assert.doesNotMatch(migrationSource,/grant all on table public\.sync_records to authenticated/i);
assert.doesNotMatch(migrationSource,/grant truncate[^;]*authenticated/i);

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function baseState(name=''){
  return {
    schemaVersion:1,
    meta:{lastBackupAt:null,lastSavedAt:null,lastMigrationAt:null},
    profile:{name,unit:'lb'},
    customExercises:[],
    routines:[],
    programs:[],
    activeProgramId:null,
    sessions:[],
    activeWorkout:null,
    favorites:[],
    exercisePreferences:{},
    bodyweight:[],
    ui:{onboardingDone:true,haptics:false,keepAwake:false},
    settings:{defaultMin:8,defaultMax:12,defaultSets:3,defaultIncrement:5,coachAliases:{}}
  };
}

async function makeApp(initial){
  const dom=new JSDOM(html,{
    runScripts:'dangerously',
    url:'https://swole-cat.test/',
    pretendToBeVisual:true,
    beforeParse(window){
      Object.defineProperty(window,'crypto',{value:webcrypto,configurable:true});
      window.TextEncoder=TextEncoder;
      window.SWOLE_CAT_CLOUD_CONFIG={
        supabaseUrl:'https://example.supabase.co',
        supabasePublishableKey:'sb_publishable_test'
      };
      window.localStorage.setItem('overload_v3',JSON.stringify(initial));
      window.alert=()=>{};
      window.confirm=()=>true;
      window.scrollTo=()=>{};
      window.fetch=async()=>{throw new Error('Unexpected real network call');};
    }
  });
  await wait(120);
  const w=dom.window;
  if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
  const identity=w.SwoleCatRuntime.getService('identity');
  const sync=w.SwoleCatRuntime.getService('cloudSync');
  assert(identity,'identity service missing');
  assert(sync,'cloudSync service missing');

  await identity.registerProvider({
    async restoreSession(){return {user:{id:'sync-user-1',email:'sync@example.com',provider:'google'}};},
    async signInWithGoogle(){return {user:{id:'sync-user-1',email:'sync@example.com',provider:'google'}};},
    async reauthenticateWithGoogle(){return {redirecting:true};},
    async deleteAccount(){return {ok:true};},
    async signOut(){return {ok:true};}
  });
  assert.equal(identity.snapshot().signedIn,true);
  return {dom,w,identity,sync};
}

const backend={
  devices:new Map(),
  records:new Map(),
  seq:0,
  fail:false
};
const recordKey=(owner,type,id)=>owner+'|'+type+'|'+id;

function backendProvider(){
  return {
    async registerDevice({ownerId,device}){
      if(backend.fail)throw new Error('offline');
      backend.devices.set(device.id,{...device,owner_id:ownerId});
      return backend.devices.get(device.id);
    },
    async pullChanges({ownerId,afterSeq,limit=500}){
      if(backend.fail)throw new Error('offline');
      return [...backend.records.values()]
        .filter(row=>row.owner_id===ownerId&&row.server_change_seq>afterSeq)
        .sort((a,b)=>a.server_change_seq-b.server_change_seq)
        .slice(0,limit)
        .map(row=>structuredClone(row));
    },
    async getRecord({ownerId,type,id}){
      if(backend.fail)throw new Error('offline');
      const row=backend.records.get(recordKey(ownerId,type,id));
      return row?structuredClone(row):null;
    },
    async insertRecord({ownerId,deviceId,mutation,schemaVersion}){
      if(backend.fail)throw new Error('offline');
      const key=recordKey(ownerId,mutation.type,mutation.id);
      const existing=backend.records.get(key);
      if(existing){
        if(existing.last_mutation_id===mutation.mutationId)return {row:structuredClone(existing),idempotent:true};
        return {conflict:true,current:structuredClone(existing)};
      }
      const row={
        owner_id:ownerId,
        record_type:mutation.type,
        record_id:mutation.id,
        payload_json:mutation.deleted?null:structuredClone(mutation.payload),
        record_version:1,
        server_change_seq:++backend.seq,
        source_device_id:deviceId,
        client_updated_at:new Date().toISOString(),
        server_updated_at:new Date().toISOString(),
        deleted_at:mutation.deleted?new Date().toISOString():null,
        schema_version:schemaVersion,
        last_mutation_id:mutation.mutationId
      };
      backend.records.set(key,row);
      return {row:structuredClone(row)};
    },
    async updateRecord({ownerId,deviceId,mutation,schemaVersion}){
      if(backend.fail)throw new Error('offline');
      const key=recordKey(ownerId,mutation.type,mutation.id);
      const existing=backend.records.get(key);
      if(existing?.last_mutation_id===mutation.mutationId)return {row:structuredClone(existing),idempotent:true};
      if(!existing||existing.record_version!==mutation.expectedVersion){
        return {conflict:true,current:existing?structuredClone(existing):null};
      }
      const row={
        ...existing,
        payload_json:mutation.deleted?null:structuredClone(mutation.payload),
        record_version:existing.record_version+1,
        server_change_seq:++backend.seq,
        source_device_id:deviceId,
        client_updated_at:new Date().toISOString(),
        server_updated_at:new Date().toISOString(),
        deleted_at:mutation.deleted?new Date().toISOString():null,
        schema_version:schemaVersion,
        last_mutation_id:mutation.mutationId
      };
      backend.records.set(key,row);
      return {row:structuredClone(row)};
    }
  };
}

const stateA=baseState('Device A');
stateA.routines=[{id:'routine-1',name:'Shared Push',description:'',trainingMode:'progressive',archivedAt:null,exercises:[]}];
stateA.sessions=[{id:'session-1',date:'2026-10-05T12:00:00.000Z',routineName:'Shared Push',exercises:[]}];

const a=await makeApp(stateA);
await a.sync.registerProvider(backendProvider());
let result=await a.sync.syncNow();
assert.equal(result.conflicts,0);
assert(backend.devices.size===1,'Device A should register itself');
assert([...backend.records.values()].some(row=>row.record_type==='routine'&&row.record_id==='routine-1'));
assert([...backend.records.values()].some(row=>row.record_type==='session'&&row.record_id==='session-1'));
assert(![...backend.records.values()].some(row=>row.record_type==='active_workout'),'active workouts must not sync');

const localA=JSON.parse(a.w.localStorage.getItem('swolecat-sync-local-v1'));
assert.equal(localA.queue.length,0);
assert(localA.lastCursor>0);

const b=await makeApp(baseState(''));
await b.sync.registerProvider(backendProvider());
result=await b.sync.syncNow();
assert.equal(result.conflicts,0,'fresh Device B should adopt cloud data without fake conflicts');

let bState=JSON.parse(b.w.localStorage.getItem('overload_v3'));
assert.equal(bState.profile.name,'Device A');
assert.equal(bState.routines.find(r=>r.id==='routine-1').name,'Shared Push');
assert.equal(bState.sessions.length,1);
assert.equal(backend.devices.size,2,'Device B should register separately');

b.w.eval("state.routines.find(r=>r.id==='routine-1').name='Edited on B';save()");
await b.sync.captureLocalChanges();
assert(b.sync.snapshot().queued>0);
await b.sync.syncNow();
const remoteAfterB=backend.records.get(recordKey('sync-user-1','routine','routine-1'));
assert.equal(remoteAfterB.record_version,2);
assert.equal(remoteAfterB.payload_json.name,'Edited on B');

a.w.eval("state.routines.find(r=>r.id==='routine-1').name='Edited on A';save()");
await a.sync.captureLocalChanges();
await a.sync.syncNow();
assert.equal(a.sync.snapshot().conflicts,1,'same-record concurrent edit must surface a conflict');

let aState=JSON.parse(a.w.localStorage.getItem('overload_v3'));
assert.equal(aState.routines.find(r=>r.id==='routine-1').name,'Edited on A','conflict must not silently overwrite local state');

let aSyncLocal=JSON.parse(a.w.localStorage.getItem('swolecat-sync-local-v1'));
const conflictKey=Object.keys(aSyncLocal.conflicts)[0];
assert.equal(conflictKey,'routine:routine-1');
await a.sync.resolveConflict(conflictKey,'cloud');
aState=JSON.parse(a.w.localStorage.getItem('overload_v3'));
assert.equal(aState.routines.find(r=>r.id==='routine-1').name,'Edited on B');
assert.equal(a.sync.snapshot().conflicts,0);

b.w.eval("state.routines=state.routines.filter(r=>r.id!=='routine-1');save()");
await b.sync.captureLocalChanges();
await b.sync.syncNow();
const tombstone=backend.records.get(recordKey('sync-user-1','routine','routine-1'));
assert(tombstone.deleted_at,'deletion must become a tombstone');
assert.equal(tombstone.payload_json,null);

await a.sync.syncNow();
aState=JSON.parse(a.w.localStorage.getItem('overload_v3'));
assert(!aState.routines.some(r=>r.id==='routine-1'),'remote tombstone must remove an unchanged local record');

a.w.eval("state.activeWorkout={id:'local-workout-only',routineName:'Local only',exercises:[]};save()");
await a.sync.captureLocalChanges();
await a.sync.syncNow();
assert(![...backend.records.values()].some(row=>row.record_type==='active_workout'),'active workout remains device-local even after explicit sync');

b.w.eval("state.profile.name='Offline B';save()");
await b.sync.captureLocalChanges();
const beforeOffline=JSON.parse(b.w.localStorage.getItem('overload_v3'));
assert(b.sync.snapshot().queued>0);
backend.fail=true;
await assert.rejects(()=>b.sync.syncNow(),/offline/);
const afterOffline=JSON.parse(b.w.localStorage.getItem('overload_v3'));
assert.equal(afterOffline.profile.name,'Offline B');
assert.deepEqual(afterOffline,beforeOffline,'failed cloud sync must never mutate local workout state');
assert(b.sync.snapshot().queued>0,'queued local changes must survive a failed sync');
backend.fail=false;

await b.sync.syncNow();
assert.equal(b.sync.snapshot().queued,0);
assert.equal(backend.records.get(recordKey('sync-user-1','profile','singleton')).payload_json.name,'Offline B');

a.dom.window.close();
b.dom.window.close();
console.log('Swole Cat v0.69.0 record-level multi-device sync PASS');
