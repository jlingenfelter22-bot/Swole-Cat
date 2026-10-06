import fs from 'node:fs';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {TextEncoder} from 'node:util';
import {JSDOM} from 'jsdom';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const cloudSource=fs.readFileSync('src/js/10d-cloud-backup.js','utf8');
const providerSource=fs.readFileSync('src/js/10e-supabase-backup-provider.js','utf8');
const migrationSource=fs.readFileSync('supabase/migrations/20261004150339_phase_8_2_cloud_backup.sql','utf8');
const deleteFunction=fs.readFileSync('supabase/functions/delete-account/index.ts','utf8');
const settingsSource=fs.readFileSync('src/js/09-settings-ui-bootstrap.js','utf8');
const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');

assert.equal(pkg.version,'0.70.1');
assert.equal(pkg.swoleCat.androidVersionCode,97);
assert.match(cloudSource,/SWOLE_CAT_CLOUD_AUTOMATION_KEY='swolecat-cloud-automation-v1'/);
assert.match(cloudSource,/SWOLE_CAT_AUTO_BACKUP_INTERVAL_MS=24\*60\*60\*1000/);
assert.match(cloudSource,/autoBackup:parsed\?\.autoBackup!==false/);
assert.match(cloudSource,/cloudMaybeAutoBackup/);
assert.match(cloudSource,/setInterval\(\(\)=>cloudScheduleAutoBackup\(250\),SWOLE_CAT_AUTO_BACKUP_CHECK_MS\)/);
assert.match(settingsSource,/cloudAutomationSettingsHtml\(\)/,'Cloud settings should expose automatic cloud controls');

assert.match(cloudSource,/SWOLE_CAT_CLOUD_BACKUP_RETENTION=2/);
assert.match(cloudSource,/SWOLE_CAT_CLOUD_BACKUP_MAX_BYTES=5000000/);
assert.match(cloudSource,/cloudBackupSha256Hex/);
assert.match(cloudSource,/parseBackupText\(json\)/);
assert.match(cloudSource,/createPreImportSnapshot\(\)/);
assert.match(cloudSource,/cloudApplyPreparedRestore/);
assert.match(cloudSource,/Cloud backup is separate from multi-device sync/i);
assert.doesNotMatch(cloudSource,/service_role|SUPABASE_SERVICE_ROLE_KEY/);

assert.match(providerSource,/SWOLE_CAT_SUPABASE_BACKUP_BUCKET='swole-cat-backups'/);
assert.match(providerSource,/\.from\('backup_metadata'\)/);
assert.match(providerSource,/\.upload\(objectPath,blob/);
assert.match(providerSource,/\.download\(objectPath\)/);
assert.match(providerSource,/\.remove\(\[objectPath\]\)/);
assert.doesNotMatch(providerSource,/service_role|SUPABASE_SERVICE_ROLE_KEY|overload_v3/);

assert.match(migrationSource,/alter table public\.backup_metadata enable row level security/i);
assert.match(migrationSource,/to authenticated[\s\S]*auth\.uid\(\)/i);
assert.match(migrationSource,/swole-cat-backups/);
assert.match(migrationSource,/false,\s*5000000/);
assert.match(migrationSource,/backup objects select own/);
assert.match(migrationSource,/backup objects insert own/);
assert.match(migrationSource,/backup objects delete own/);
assert.doesNotMatch(migrationSource,/grant[^;]+to anon/i);

assert.match(deleteFunction,/deleteUserCloudBackups/);
assert.match(deleteFunction,/\.from\(SWOLE_CAT_BACKUP_BUCKET\)[\s\S]*\.remove\(paths\)/);
assert(deleteFunction.indexOf('await deleteUserCloudBackups') < deleteFunction.indexOf('admin.auth.admin.deleteUser'),'backup cleanup must happen before Auth deletion');
assert.match(settingsSource,/Cloud backup/);
assert.match(settingsSource,/cloudBackupSettingsHtml\(\)/);

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const initial={
  schemaVersion:1,
  meta:{lastBackupAt:null,lastSavedAt:null,lastMigrationAt:null},
  profile:{name:'Backup Cat',unit:'lb'},
  customExercises:[],
  routines:[{id:'r1',name:'Snapshot One',description:'',trainingMode:'progressive',archivedAt:null,exercises:[]}],
  programs:[],
  activeProgramId:null,
  sessions:[{id:'s1',date:'2026-10-04T10:00:00.000Z',routineName:'Snapshot One',exercises:[]}],
  activeWorkout:null,
  favorites:[],
  exercisePreferences:{},
  bodyweight:[],
  ui:{onboardingDone:true,haptics:false,keepAwake:false},
  settings:{defaultMin:8,defaultMax:12,defaultSets:3,defaultIncrement:5,coachAliases:{}}
};

let hiddenFetchCalls=0;
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
    window.fetch=async()=>{hiddenFetchCalls++;throw new Error('Unexpected hidden network call');};
    window.alert=()=>{};
    window.confirm=()=>true;
    window.scrollTo=()=>{};
  }
});

await wait(100);
const w=dom.window;
const identity=w.SwoleCatRuntime.getService('identity');
const cloud=w.SwoleCatRuntime.getService('cloudBackup');
assert(identity,'identity service must exist');
assert(cloud,'cloudBackup service must exist');
assert.equal(hiddenFetchCalls,0,'cloud backup must not wake the network before explicit use');

const fakeIdentity={
  async restoreSession(){return {user:{id:'user-123',email:'backup@example.com',provider:'google'}};},
  async signInWithGoogle(){return {user:{id:'user-123',email:'backup@example.com',provider:'google'}};},
  async reauthenticateWithGoogle(){return {redirecting:true};},
  async deleteAccount(){return {ok:true};},
  async signOut(){return {ok:true};}
};
await identity.registerProvider(fakeIdentity);
assert.equal(identity.snapshot().signedIn,true);

let seq=0;
let rows=[];
const objects=new Map();
const uploadedFormats=[];
const fakeBackupProvider={
  async listBackups(){
    return rows.map(row=>({...row}));
  },
  async uploadBackup({objectPath,json,metadata}){
    const parsed=JSON.parse(json);
    uploadedFormats.push({format:parsed.format,formatVersion:parsed.formatVersion});
    objects.set(objectPath,json);
    seq++;
    rows.push({
      id:'backup-'+seq,
      ...metadata,
      created_at:new Date(Date.UTC(2026,9,4,15,0,seq)).toISOString()
    });
    return rows.at(-1);
  },
  async downloadBackup({objectPath}){
    if(!objects.has(objectPath))throw new Error('missing object');
    return objects.get(objectPath);
  },
  async deleteBackup({backupId,objectPath}){
    objects.delete(objectPath);
    rows=rows.filter(row=>row.id!==backupId);
    return {ok:true};
  }
};
const lastBackupBeforeFailure=JSON.parse(w.localStorage.getItem('overload_v3')).meta?.lastBackupAt||null;
await cloud.registerProvider({
  ...fakeBackupProvider,
  async uploadBackup(){throw new Error('upload failed');}
});
await assert.rejects(()=>cloud.backUpNow(),/upload failed/);
assert.equal(JSON.parse(w.localStorage.getItem('overload_v3')).meta?.lastBackupAt||null,lastBackupBeforeFailure,'failed upload must not claim a successful local backup timestamp');

await cloud.registerProvider(fakeBackupProvider);
assert.equal(hiddenFetchCalls,0,'registering backup transport must not trigger hidden traffic');

const first=await cloud.backUpNow();
assert.equal(uploadedFormats[0].format,'swole-cat-backup');
assert.equal(uploadedFormats[0].formatVersion,1);
assert.equal(first.sha256.length,64);
assert(first.sizeBytes>0);
assert(w.localStorage.getItem('swolecat_cloud_backup_device_v1'),'cloud backup should create a non-secret local installation id only after explicit backup');

w.eval("state.routines[0].name='Snapshot Two';save()");
await cloud.backUpNow();

w.eval("state.routines[0].name='Snapshot Three';save()");
await cloud.backUpNow();

let listed=await cloud.list();
assert.equal(listed.length,2,'retention must keep only latest + previous metadata');
assert.equal(objects.size,2,'retention must prune the oldest storage object too');
assert(listed.every(row=>row.objectPath.startsWith('user-123/')),'all stored objects must live under the signed-in user folder');

w.eval("state.routines[0].name='Current Local';state.sessions.push({id:'s2',date:'2026-10-04T11:00:00.000Z',routineName:'Current Local',exercises:[]});save()");
const beforeRestoreRaw=w.localStorage.getItem('overload_v3');
const previous=listed[1];
const preview=await cloud.prepareRestore(previous.id);
assert.equal(preview.summary.routines,1);
assert.equal(preview.summary.sessions,1,'previous snapshot should predate the extra local session');
cloud.applyPreparedRestore();

let restored=JSON.parse(w.localStorage.getItem('overload_v3'));
assert.equal(restored.routines[0].name,'Snapshot Two','restore must apply the selected verified snapshot');
assert.equal(restored.sessions.length,1);

const safety=w.preImportSnapshotInfo();
assert(safety&&typeof safety.raw==='string','cloud restore must create the normal local safety snapshot first');
const safetyState=JSON.parse(safety.raw);
assert.equal(safetyState.routines[0].name,'Current Local');
assert.equal(safetyState.sessions.length,2,'pre-restore safety snapshot must preserve the replaced local state');

listed=await cloud.list();
const latest=listed[0];
objects.set(latest.objectPath,objects.get(latest.objectPath)+' ');
await assert.rejects(
  ()=>cloud.prepareRestore(latest.id),
  /size verification failed|integrity check failed/i,
  'tampered cloud data must never reach the restore step'
);

const localBeforeFailure=w.localStorage.getItem('overload_v3');
await cloud.registerProvider({
  ...fakeBackupProvider,
  async listBackups(){throw new Error('cloud offline');}
});
await assert.rejects(()=>cloud.list(),/cloud offline/);
assert.equal(w.localStorage.getItem('overload_v3'),localBeforeFailure,'cloud failure must not mutate or block local workout data');

await identity.signOut();
assert.equal(identity.snapshot().signedIn,false);
await assert.rejects(()=>cloud.backUpNow(),/Sign in/i);
assert.equal(w.localStorage.getItem('overload_v3'),localBeforeFailure,'signed-out cloud backup attempts must leave local data untouched');

dom.window.close();
console.log('Swole Cat v0.69.4 cloud backup and restore PASS');
