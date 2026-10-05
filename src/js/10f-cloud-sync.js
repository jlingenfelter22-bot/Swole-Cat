// Phase 8.3 provider-neutral record-level multi-device sync.
// Local workout state always saves first. Sync metadata stays outside overload_v3.
const SWOLE_CAT_SYNC_STORAGE_KEY='swolecat_sync_v1';
const SWOLE_CAT_SYNC_META_VERSION=1;
const SWOLE_CAT_SYNC_DELETED_HASH='__deleted__';
const SWOLE_CAT_SYNC_PULL_LIMIT=500;
const SWOLE_CAT_SYNC_AUTO_DELAY_MS=1800;

let swoleCatSyncProvider=null;
let swoleCatSyncApplyingRemote=false;
let swoleCatSyncTimer=null;
let swoleCatSyncRunPromise=null;
let swoleCatSyncRerunRequested=false;
let swoleCatSyncStatus={status:'disabled',lastError:''};

function cloudSyncFreshMeta(accountId=''){
  return {
    version:SWOLE_CAT_SYNC_META_VERSION,
    enabled:false,
    accountId:String(accountId||''),
    deviceId:'',
    lastServerCursor:0,
    hashes:{},
    versions:{},
    pending:[],
    conflicts:[],
    lastSyncAt:null,
    lastError:'',
    bootstrapped:false
  };
}
function cloudSyncReadMeta(){
  try{
    const raw=swoleCatStorage.getItem(SWOLE_CAT_SYNC_STORAGE_KEY);
    if(!raw)return cloudSyncFreshMeta();
    const parsed=JSON.parse(raw);
    if(!parsed||typeof parsed!=='object')return cloudSyncFreshMeta();
    return {
      ...cloudSyncFreshMeta(parsed.accountId),
      ...parsed,
      version:SWOLE_CAT_SYNC_META_VERSION,
      enabled:!!parsed.enabled,
      accountId:String(parsed.accountId||''),
      deviceId:String(parsed.deviceId||''),
      lastServerCursor:Math.max(0,Number(parsed.lastServerCursor)||0),
      hashes:parsed.hashes&&typeof parsed.hashes==='object'&&!Array.isArray(parsed.hashes)?parsed.hashes:{},
      versions:parsed.versions&&typeof parsed.versions==='object'&&!Array.isArray(parsed.versions)?parsed.versions:{},
      pending:Array.isArray(parsed.pending)?parsed.pending:[],
      conflicts:Array.isArray(parsed.conflicts)?parsed.conflicts:[],
      lastSyncAt:parsed.lastSyncAt||null,
      lastError:String(parsed.lastError||''),
      bootstrapped:!!parsed.bootstrapped
    };
  }catch(error){
    return cloudSyncFreshMeta();
  }
}
let swoleCatSyncMeta=cloudSyncReadMeta();

function cloudSyncPersistMeta(){
  try{
    swoleCatStorage.setItem(SWOLE_CAT_SYNC_STORAGE_KEY,JSON.stringify(swoleCatSyncMeta));
    return true;
  }catch(error){
    swoleCatSyncMeta.lastError=error?.message||String(error);
    return false;
  }
}
function cloudSyncSnapshot(){
  return {
    status:swoleCatSyncStatus.status,
    enabled:!!swoleCatSyncMeta.enabled,
    accountId:swoleCatSyncMeta.accountId||'',
    deviceId:swoleCatSyncMeta.deviceId||'',
    lastServerCursor:Number(swoleCatSyncMeta.lastServerCursor)||0,
    pendingCount:swoleCatSyncMeta.pending.length,
    conflictCount:swoleCatSyncMeta.conflicts.length,
    lastSyncAt:swoleCatSyncMeta.lastSyncAt||null,
    lastError:swoleCatSyncStatus.lastError||swoleCatSyncMeta.lastError||'',
    bootstrapped:!!swoleCatSyncMeta.bootstrapped
  };
}
function cloudSyncEmit(){
  SwoleCatRuntime.events.dispatchEvent(new CustomEvent('sync:changed',{detail:cloudSyncSnapshot()}));
}
function cloudSyncSetStatus(status,lastError=''){
  swoleCatSyncStatus={status,lastError:String(lastError||'')};
  if(lastError)swoleCatSyncMeta.lastError=String(lastError);
  cloudSyncPersistMeta();
  cloudSyncEmit();
  return cloudSyncSnapshot();
}
function cloudSyncIdentityUser(){
  const identity=SwoleCatRuntime.getService('identity');
  const snapshot=identity?.snapshot?.();
  return snapshot?.signedIn&&snapshot?.user?.id?snapshot.user:null;
}
function cloudSyncCanUse(){
  const identity=SwoleCatRuntime.getService('identity');
  return !!(swoleCatSyncProvider&&identity?.canUseCloud?.()&&cloudSyncIdentityUser()?.id);
}
function cloudSyncValidateProvider(provider){
  if(!provider||typeof provider!=='object')throw new Error('Cloud sync provider is required.');
  for(const name of ['registerDevice','pullChanges','insertRecord','updateRecord','getRecord']){
    if(typeof provider[name]!=='function')throw new Error('Cloud sync provider is missing '+name+'().');
  }
  return provider;
}
function cloudSyncUuid(){
  if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();
  const bytes=new Uint8Array(16);
  if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(bytes);
  else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);
  bytes[6]=(bytes[6]&15)|64;
  bytes[8]=(bytes[8]&63)|128;
  const hex=[...bytes].map(v=>v.toString(16).padStart(2,'0')).join('');
  return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
}
function cloudSyncEnsureAccount(){
  const user=cloudSyncIdentityUser();
  if(!user?.id)throw new Error('Sign in to your Swole Cat cloud account before using multi-device sync.');
  if(swoleCatSyncMeta.accountId&&swoleCatSyncMeta.accountId!==user.id){
    swoleCatSyncMeta=cloudSyncFreshMeta(user.id);
  }else if(!swoleCatSyncMeta.accountId){
    swoleCatSyncMeta.accountId=user.id;
  }
  if(!swoleCatSyncMeta.deviceId)swoleCatSyncMeta.deviceId=cloudSyncUuid();
  cloudSyncPersistMeta();
  return user;
}
function cloudSyncDeviceDescriptor(){
  const native=isNativeApp();
  return {
    id:swoleCatSyncMeta.deviceId,
    ownerId:swoleCatSyncMeta.accountId,
    deviceName:(native?'Swole Cat Testing · Android':'Swole Cat · Web/PWA'),
    platform:native?'android':'web',
    appVersion:APP_VERSION
  };
}
function cloudSyncRecordKey(type,id){
  return String(type||'')+':'+encodeURIComponent(String(id||''));
}
function cloudSyncParseKey(key){
  const i=String(key||'').indexOf(':');
  if(i<1)return {type:'',id:''};
  return {type:key.slice(0,i),id:decodeURIComponent(key.slice(i+1))};
}
function cloudSyncCanonical(value){
  if(Array.isArray(value))return '['+value.map(cloudSyncCanonical).join(',')+']';
  if(value&&typeof value==='object'){
    return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+cloudSyncCanonical(value[k])).join(',')+'}';
  }
  return JSON.stringify(value);
}
function cloudSyncFingerprint(value){
  const text=cloudSyncCanonical(value);
  let h1=2166136261>>>0,h2=2246822519>>>0;
  for(let i=0;i<text.length;i++){
    const code=text.charCodeAt(i);
    h1=Math.imul(h1^code,16777619)>>>0;
    h2=Math.imul(h2^code,3266489917)>>>0;
  }
  return h1.toString(16).padStart(8,'0')+h2.toString(16).padStart(8,'0');
}
function cloudSyncProjectState(sourceState=state){
  const map=new Map();
  const clientUpdatedAt=sourceState?.meta?.lastSavedAt||new Date().toISOString();
  const add=(type,id,payload)=>{
    if(!id||payload==null)return;
    const record={type:String(type),id:String(id),payload:cloneData(payload),clientUpdatedAt};
    record.key=cloudSyncRecordKey(record.type,record.id);
    record.hash=cloudSyncFingerprint(record.payload);
    map.set(record.key,record);
  };

  for(const row of sourceState.routines||[])add('routine',row.id,row);
  for(const row of sourceState.programs||[])add('program',row.id,row);
  for(const row of sourceState.sessions||[])add('session',row.id,row);
  for(const row of sourceState.customExercises||[])add('custom_exercise',row.id,row);
  if(sourceState.activeWorkout)add('active_workout','active',sourceState.activeWorkout);
  add('profile','profile',sourceState.profile||{});
  add('settings','settings',sourceState.settings||{});
  add('favorites','favorites',Array.isArray(sourceState.favorites)?sourceState.favorites:[]);
  add('exercise_preferences','exercise_preferences',sourceState.exercisePreferences||{});
  for(const row of sourceState.bodyweight||[]){
    if(row?.date)add('bodyweight',row.date,row);
  }
  add('app_state','app_state',{activeProgramId:sourceState.activeProgramId||null});
  return map;
}
function cloudSyncHasMeaningfulLocalData(sourceState=state){
  const base=freshState();
  return !!(
    (sourceState.routines?.length||0)||
    (sourceState.programs?.length||0)||
    (sourceState.sessions?.length||0)||
    (sourceState.customExercises?.length||0)||
    (sourceState.bodyweight?.length||0)||
    (sourceState.favorites?.length||0)||
    Object.keys(sourceState.exercisePreferences||{}).length||
    sourceState.activeWorkout||
    sourceState.activeProgramId||
    String(sourceState.profile?.name||'').trim()||
    cloudSyncFingerprint(sourceState.settings||{})!==cloudSyncFingerprint(base.settings||{})
  );
}
function cloudSyncNormalizeRemote(row){
  if(!row||typeof row!=='object')return null;
  const type=String(row.record_type||row.type||'');
  const id=String(row.record_id||row.id||'');
  if(!type||!id)return null;
  return {
    key:cloudSyncRecordKey(type,id),
    type,
    id,
    payload:row.payload_json??row.payload??null,
    recordVersion:Number(row.record_version??row.recordVersion??0),
    serverChangeSeq:Number(row.server_change_seq??row.serverChangeSeq??0),
    sourceDeviceId:String(row.source_device_id||row.sourceDeviceId||''),
    clientUpdatedAt:String(row.client_updated_at||row.clientUpdatedAt||''),
    serverUpdatedAt:String(row.server_updated_at||row.serverUpdatedAt||''),
    deletedAt:row.deleted_at||row.deletedAt||null
  };
}
function cloudSyncRemoteHash(row){
  return row?.deletedAt?SWOLE_CAT_SYNC_DELETED_HASH:cloudSyncFingerprint(row?.payload);
}
function cloudSyncUpsertById(list,id,payload){
  const rows=Array.isArray(list)?list:[];
  const index=rows.findIndex(row=>String(row?.id||'')===String(id));
  if(index>=0)rows[index]=cloneData(payload);
  else rows.push(cloneData(payload));
  return rows;
}
function cloudSyncRemoveById(list,id){
  return (Array.isArray(list)?list:[]).filter(row=>String(row?.id||'')!==String(id));
}
function cloudSyncApplyRecordToDraft(draft,record){
  const deleted=!!record.deletedAt;
  const payload=record.payload;
  if(record.type==='routine'){
    draft.routines=deleted?cloudSyncRemoveById(draft.routines,record.id):cloudSyncUpsertById(draft.routines,record.id,payload);
  }else if(record.type==='program'){
    draft.programs=deleted?cloudSyncRemoveById(draft.programs,record.id):cloudSyncUpsertById(draft.programs,record.id,payload);
  }else if(record.type==='session'){
    draft.sessions=deleted?cloudSyncRemoveById(draft.sessions,record.id):cloudSyncUpsertById(draft.sessions,record.id,payload);
  }else if(record.type==='custom_exercise'){
    draft.customExercises=deleted?cloudSyncRemoveById(draft.customExercises,record.id):cloudSyncUpsertById(draft.customExercises,record.id,payload);
  }else if(record.type==='active_workout'){
    draft.activeWorkout=deleted?null:cloneData(payload);
  }else if(record.type==='profile'&&!deleted){
    draft.profile={...draft.profile,...cloneData(payload)};
  }else if(record.type==='settings'&&!deleted){
    draft.settings={...draft.settings,...cloneData(payload)};
  }else if(record.type==='favorites'){
    draft.favorites=deleted?[]:(Array.isArray(payload)?cloneData(payload):[]);
  }else if(record.type==='exercise_preferences'){
    draft.exercisePreferences=deleted?{}:(payload&&typeof payload==='object'?cloneData(payload):{});
  }else if(record.type==='bodyweight'){
    draft.bodyweight=Array.isArray(draft.bodyweight)?draft.bodyweight:[];
    const index=draft.bodyweight.findIndex(row=>String(row?.date||'')===record.id);
    if(deleted){
      if(index>=0)draft.bodyweight.splice(index,1);
    }else if(index>=0){
      draft.bodyweight[index]=cloneData(payload);
    }else{
      draft.bodyweight.push(cloneData(payload));
    }
    draft.bodyweight.sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||'')));
  }else if(record.type==='app_state'){
    draft.activeProgramId=deleted?null:(payload?.activeProgramId||null);
  }
  if(draft.activeProgramId&&!draft.programs.some(p=>p.id===draft.activeProgramId))draft.activeProgramId=null;
  return draft;
}
function cloudSyncCommitDraft(draft){
  const oldState=state;
  try{
    swoleCatSyncApplyingRemote=true;
    state=normalizeState(draft);
    if(!save())throw new Error(lastStorageError||'Local storage write failed while applying sync.');
    renderHome();
    populateMuscles();
    updateActiveWorkoutChrome();
    const current=activeViewId?.();
    if(current)queueNavigationRefresh(current);
    return true;
  }catch(error){
    state=oldState;
    throw error;
  }finally{
    swoleCatSyncApplyingRemote=false;
  }
}
function cloudSyncConflictForKey(key){
  return swoleCatSyncMeta.conflicts.find(row=>row.key===key)||null;
}
function cloudSyncUpsertConflict(conflict){
  const index=swoleCatSyncMeta.conflicts.findIndex(row=>row.key===conflict.key);
  if(index>=0)swoleCatSyncMeta.conflicts[index]=conflict;
  else swoleCatSyncMeta.conflicts.push(conflict);
}
function cloudSyncRemovePendingKey(key){
  swoleCatSyncMeta.pending=swoleCatSyncMeta.pending.filter(row=>row.key!==key);
}
function cloudSyncQueueLocalChanges(){
  if(!swoleCatSyncMeta.enabled)return [];
  const projection=cloudSyncProjectState();
  const conflictKeys=new Set(swoleCatSyncMeta.conflicts.map(row=>row.key));
  const pendingByKey=new Map(swoleCatSyncMeta.pending.map(row=>[row.key,row]));
  const currentKeys=new Set(projection.keys());

  for(const record of projection.values()){
    if(conflictKeys.has(record.key))continue;
    const serverHash=swoleCatSyncMeta.hashes[record.key];
    const existing=pendingByKey.get(record.key);
    if(serverHash===record.hash){
      if(existing){
        pendingByKey.delete(record.key);
        cloudSyncRemovePendingKey(record.key);
      }
      continue;
    }
    if(existing&&existing.hash===record.hash&&!existing.deleted)continue;
    const pending={
      key:record.key,
      type:record.type,
      id:record.id,
      payload:record.payload,
      deleted:false,
      hash:record.hash,
      baseVersion:Number(swoleCatSyncMeta.versions[record.key])||0,
      clientUpdatedAt:record.clientUpdatedAt||new Date().toISOString()
    };
    pendingByKey.set(record.key,pending);
  }

  const knownKeys=new Set([...Object.keys(swoleCatSyncMeta.hashes),...pendingByKey.keys()]);
  for(const key of knownKeys){
    if(currentKeys.has(key)||conflictKeys.has(key))continue;
    if(swoleCatSyncMeta.hashes[key]===SWOLE_CAT_SYNC_DELETED_HASH){
      if(pendingByKey.get(key)?.deleted)continue;
      pendingByKey.delete(key);
      continue;
    }
    const parsed=cloudSyncParseKey(key);
    if(!parsed.type||!parsed.id)continue;
    const existing=pendingByKey.get(key);
    if(existing?.deleted)continue;
    const baseVersion=Number(swoleCatSyncMeta.versions[key])||0;
    if(existing&&baseVersion<=0){
      // A record created and deleted locally before ever reaching the server
      // should disappear from the queue instead of creating a meaningless tombstone.
      pendingByKey.delete(key);
      continue;
    }
    pendingByKey.set(key,{
      key,
      type:parsed.type,
      id:parsed.id,
      payload:null,
      deleted:true,
      hash:SWOLE_CAT_SYNC_DELETED_HASH,
      baseVersion,
      clientUpdatedAt:state?.meta?.lastSavedAt||new Date().toISOString()
    });
  }

  swoleCatSyncMeta.pending=[...pendingByKey.values()];
  cloudSyncPersistMeta();
  cloudSyncEmit();
  return swoleCatSyncMeta.pending;
}
async function cloudSyncPullAll(afterSeq){
  const all=[];
  let cursor=Math.max(0,Number(afterSeq)||0);
  for(let page=0;page<40;page++){
    const rows=await swoleCatSyncProvider.pullChanges({
      ownerId:swoleCatSyncMeta.accountId,
      afterSeq:cursor,
      limit:SWOLE_CAT_SYNC_PULL_LIMIT
    });
    const normalized=(Array.isArray(rows)?rows:[]).map(cloudSyncNormalizeRemote).filter(Boolean)
      .sort((a,b)=>a.serverChangeSeq-b.serverChangeSeq);
    if(!normalized.length)break;
    all.push(...normalized);
    cursor=Math.max(cursor,...normalized.map(row=>row.serverChangeSeq));
    if(normalized.length<SWOLE_CAT_SYNC_PULL_LIMIT)break;
  }
  return all;
}
function cloudSyncCreateConflict(localRecord,remoteRecord,reason='version_conflict'){
  return {
    key:remoteRecord.key,
    type:remoteRecord.type,
    id:remoteRecord.id,
    reason,
    localPayload:cloneData(localRecord?.payload??null),
    localHash:localRecord?.hash||cloudSyncFingerprint(localRecord?.payload??null),
    localDeleted:!!localRecord?.deleted,
    remote:cloneData(remoteRecord),
    detectedAt:new Date().toISOString()
  };
}
function cloudSyncApplyIncoming(records){
  const normalized=(records||[]).map(cloudSyncNormalizeRemote).filter(Boolean)
    .sort((a,b)=>a.serverChangeSeq-b.serverChangeSeq);
  if(!normalized.length)return false;

  let draft=cloneData(state),changed=false;
  const pendingByKey=new Map(swoleCatSyncMeta.pending.map(row=>[row.key,row]));

  for(const remote of normalized){
    swoleCatSyncMeta.lastServerCursor=Math.max(swoleCatSyncMeta.lastServerCursor,remote.serverChangeSeq);
    const remoteHash=cloudSyncRemoteHash(remote);
    const knownVersion=Number(swoleCatSyncMeta.versions[remote.key])||0;
    const pending=pendingByKey.get(remote.key);
    const existingConflict=cloudSyncConflictForKey(remote.key);

    if(existingConflict){
      existingConflict.remote=cloneData(remote);
      existingConflict.detectedAt=new Date().toISOString();
      swoleCatSyncMeta.versions[remote.key]=remote.recordVersion;
      swoleCatSyncMeta.hashes[remote.key]=remoteHash;
      continue;
    }
    if(pending){
      if(remote.sourceDeviceId===swoleCatSyncMeta.deviceId&&remote.recordVersion>=pending.baseVersion){
        swoleCatSyncMeta.versions[remote.key]=remote.recordVersion;
        swoleCatSyncMeta.hashes[remote.key]=remoteHash;
        continue;
      }
      cloudSyncUpsertConflict(cloudSyncCreateConflict(pending,remote));
      cloudSyncRemovePendingKey(remote.key);
      pendingByKey.delete(remote.key);
      swoleCatSyncMeta.versions[remote.key]=remote.recordVersion;
      swoleCatSyncMeta.hashes[remote.key]=remoteHash;
      continue;
    }
    if(remote.recordVersion<=knownVersion)continue;
    cloudSyncApplyRecordToDraft(draft,remote);
    changed=true;
    swoleCatSyncMeta.versions[remote.key]=remote.recordVersion;
    swoleCatSyncMeta.hashes[remote.key]=remoteHash;
  }

  if(changed)cloudSyncCommitDraft(draft);
  cloudSyncPersistMeta();
  return changed;
}
async function cloudSyncBootstrap(remoteRows){
  const remote=(remoteRows||[]).map(cloudSyncNormalizeRemote).filter(Boolean)
    .sort((a,b)=>a.serverChangeSeq-b.serverChangeSeq);
  const localProjection=cloudSyncProjectState();
  const meaningful=cloudSyncHasMeaningfulLocalData();

  swoleCatSyncMeta.hashes={};
  swoleCatSyncMeta.versions={};
  swoleCatSyncMeta.pending=[];
  swoleCatSyncMeta.conflicts=[];
  swoleCatSyncMeta.lastServerCursor=0;

  if(!remote.length){
    swoleCatSyncMeta.bootstrapped=true;
    cloudSyncPersistMeta();
    cloudSyncQueueLocalChanges();
    return;
  }

  if(!meaningful){
    let draft=cloneData(state);
    for(const row of remote){
      cloudSyncApplyRecordToDraft(draft,row);
      swoleCatSyncMeta.hashes[row.key]=cloudSyncRemoteHash(row);
      swoleCatSyncMeta.versions[row.key]=row.recordVersion;
      swoleCatSyncMeta.lastServerCursor=Math.max(swoleCatSyncMeta.lastServerCursor,row.serverChangeSeq);
    }
    createPreImportSnapshot();
    cloudSyncCommitDraft(draft);
    swoleCatSyncMeta.bootstrapped=true;
    cloudSyncPersistMeta();
    return;
  }

  let draft=cloneData(state),draftChanged=false;
  const seen=new Set();
  for(const row of remote){
    seen.add(row.key);
    const local=localProjection.get(row.key);
    const remoteHash=cloudSyncRemoteHash(row);
    swoleCatSyncMeta.hashes[row.key]=remoteHash;
    swoleCatSyncMeta.versions[row.key]=row.recordVersion;
    swoleCatSyncMeta.lastServerCursor=Math.max(swoleCatSyncMeta.lastServerCursor,row.serverChangeSeq);

    if(!local){
      cloudSyncApplyRecordToDraft(draft,row);
      draftChanged=true;
      continue;
    }
    if(!row.deletedAt&&local.hash===remoteHash)continue;
    cloudSyncUpsertConflict(cloudSyncCreateConflict(local,row,'bootstrap_conflict'));
  }

  for(const local of localProjection.values()){
    if(seen.has(local.key)||cloudSyncConflictForKey(local.key))continue;
    swoleCatSyncMeta.pending.push({
      key:local.key,type:local.type,id:local.id,payload:local.payload,deleted:false,hash:local.hash,
      baseVersion:0,clientUpdatedAt:local.clientUpdatedAt
    });
  }
  if(draftChanged){
    createPreImportSnapshot();
    cloudSyncCommitDraft(draft);
  }
  swoleCatSyncMeta.bootstrapped=true;
  cloudSyncPersistMeta();
}
async function cloudSyncRegisterDevice(){
  const user=cloudSyncEnsureAccount();
  return swoleCatSyncProvider.registerDevice(cloudSyncDeviceDescriptor());
}
async function cloudSyncPushPending(){
  const queue=[...swoleCatSyncMeta.pending];
  for(const pending of queue){
    if(cloudSyncConflictForKey(pending.key))continue;
    let result;
    if((Number(pending.baseVersion)||0)<=0){
      result=await swoleCatSyncProvider.insertRecord({
        ownerId:swoleCatSyncMeta.accountId,
        deviceId:swoleCatSyncMeta.deviceId,
        type:pending.type,
        id:pending.id,
        payload:pending.deleted?null:pending.payload,
        deletedAt:pending.deleted?(pending.clientUpdatedAt||new Date().toISOString()):null,
        clientUpdatedAt:pending.clientUpdatedAt||new Date().toISOString()
      });
    }else{
      result=await swoleCatSyncProvider.updateRecord({
        ownerId:swoleCatSyncMeta.accountId,
        deviceId:swoleCatSyncMeta.deviceId,
        type:pending.type,
        id:pending.id,
        payload:pending.deleted?null:pending.payload,
        deletedAt:pending.deleted?(pending.clientUpdatedAt||new Date().toISOString()):null,
        clientUpdatedAt:pending.clientUpdatedAt||new Date().toISOString(),
        expectedVersion:Number(pending.baseVersion)
      });
    }

    if(result?.conflict){
      const remote=cloudSyncNormalizeRemote(result.record);
      if(remote){
        cloudSyncUpsertConflict(cloudSyncCreateConflict(pending,remote));
        swoleCatSyncMeta.versions[pending.key]=remote.recordVersion;
        swoleCatSyncMeta.hashes[pending.key]=cloudSyncRemoteHash(remote);
        swoleCatSyncMeta.lastServerCursor=Math.max(swoleCatSyncMeta.lastServerCursor,remote.serverChangeSeq);
        cloudSyncRemovePendingKey(pending.key);
      }else{
        // The record disappeared between our conditional write and conflict lookup.
        // Keep the local change queued and retry it as a fresh insert next pass.
        pending.baseVersion=0;
        swoleCatSyncRerunRequested=true;
      }
      cloudSyncPersistMeta();
      continue;
    }
    const remote=cloudSyncNormalizeRemote(result?.record||result);
    if(!remote)throw new Error('Sync server did not return the saved record.');
    swoleCatSyncMeta.versions[pending.key]=remote.recordVersion;
    swoleCatSyncMeta.hashes[pending.key]=cloudSyncRemoteHash(remote);
    swoleCatSyncMeta.lastServerCursor=Math.max(swoleCatSyncMeta.lastServerCursor,remote.serverChangeSeq);
    cloudSyncRemovePendingKey(pending.key);
    cloudSyncPersistMeta();
  }
}
async function cloudSyncEnable(){
  if(!cloudSyncCanUse())throw new Error('Sign in before enabling multi-device sync.');
  cloudSyncEnsureAccount();
  swoleCatSyncMeta.enabled=true;
  cloudSyncSetStatus('syncing','');
  try{
    await cloudSyncRegisterDevice();
    const remote=await cloudSyncPullAll(0);
    await cloudSyncBootstrap(remote);
    await cloudSyncPushPending();
    swoleCatSyncMeta.lastSyncAt=new Date().toISOString();
    swoleCatSyncMeta.lastError='';
    cloudSyncSetStatus(swoleCatSyncMeta.conflicts.length?'conflict':'ready','');
    return cloudSyncSnapshot();
  }catch(error){
    cloudSyncSetStatus('error',error?.message||String(error));
    throw error;
  }
}
function cloudSyncDisable(){
  swoleCatSyncMeta.enabled=false;
  if(swoleCatSyncTimer){clearTimeout(swoleCatSyncTimer);swoleCatSyncTimer=null}
  cloudSyncSetStatus('disabled','');
  return cloudSyncSnapshot();
}
async function cloudSyncNow(){
  if(swoleCatSyncRunPromise){
    // Never satisfy a new sync request with work that began before the request.
    // Wait for the older pass to release its lock, then guarantee a fresh pass.
    swoleCatSyncRerunRequested=true;
    const olderRun=swoleCatSyncRunPromise;
    try{await olderRun}catch(error){}
    if(!swoleCatSyncMeta.enabled)throw new Error('Multi-device sync is not enabled on this device.');
    if(!cloudSyncCanUse())throw new Error('Sign in before syncing.');
    return cloudSyncNow();
  }
  if(!swoleCatSyncMeta.enabled)throw new Error('Multi-device sync is not enabled on this device.');
  if(!cloudSyncCanUse())throw new Error('Sign in before syncing.');
  if(swoleCatSyncTimer){clearTimeout(swoleCatSyncTimer);swoleCatSyncTimer=null}
  cloudSyncRunPromise=(async()=>{
    cloudSyncSetStatus('syncing','');
    try{
      cloudSyncEnsureAccount();
      await cloudSyncRegisterDevice();
      let passes=0;
      do{
        swoleCatSyncRerunRequested=false;
        passes++;
        cloudSyncQueueLocalChanges();
        const incoming=await cloudSyncPullAll(swoleCatSyncMeta.lastServerCursor);
        cloudSyncApplyIncoming(incoming);
        // Capture saves that occurred while the pull was in flight.
        cloudSyncQueueLocalChanges();
        await cloudSyncPushPending();
      }while(
        swoleCatSyncRerunRequested&&
        swoleCatSyncMeta.enabled&&
        cloudSyncCanUse()&&
        passes<6
      );
      if(swoleCatSyncRerunRequested)cloudSyncSchedule(150);
      swoleCatSyncMeta.lastSyncAt=new Date().toISOString();
      swoleCatSyncMeta.lastError='';
      cloudSyncSetStatus(swoleCatSyncMeta.conflicts.length?'conflict':'ready','');
      return cloudSyncSnapshot();
    }catch(error){
      cloudSyncSetStatus('error',error?.message||String(error));
      throw error;
    }finally{
      swoleCatSyncRunPromise=null;
    }
  })();
  return swoleCatSyncRunPromise;
}
function cloudSyncSchedule(delay=SWOLE_CAT_SYNC_AUTO_DELAY_MS){
  if(!swoleCatSyncMeta.enabled||!cloudSyncIdentityUser()?.id)return;
  if(swoleCatSyncTimer)clearTimeout(swoleCatSyncTimer);
  swoleCatSyncTimer=setTimeout(()=>{
    swoleCatSyncTimer=null;
    if(navigator.onLine===false)return;
    cloudSyncNow().catch(()=>{});
  },Math.max(100,Number(delay)||SWOLE_CAT_SYNC_AUTO_DELAY_MS));
}
function cloudSyncResolveConflict(key,choice){
  const conflict=cloudSyncConflictForKey(key);
  if(!conflict)throw new Error('That sync conflict is no longer available.');
  if(choice==='cloud'){
    const draft=cloneData(state);
    cloudSyncApplyRecordToDraft(draft,conflict.remote);
    cloudSyncCommitDraft(draft);
    swoleCatSyncMeta.hashes[key]=cloudSyncRemoteHash(conflict.remote);
    swoleCatSyncMeta.versions[key]=Number(conflict.remote.recordVersion)||0;
    cloudSyncRemovePendingKey(key);
  }else if(choice==='local'){
    const projection=cloudSyncProjectState();
    const local=projection.get(key);
    if(!local&&!conflict.localDeleted)throw new Error('The local record is no longer available.');
    const parsed=cloudSyncParseKey(key);
    swoleCatSyncMeta.pending=swoleCatSyncMeta.pending.filter(row=>row.key!==key);
    swoleCatSyncMeta.pending.push({
      key,
      type:parsed.type,
      id:parsed.id,
      payload:local?.payload??null,
      deleted:!local||!!conflict.localDeleted,
      hash:local?.hash||SWOLE_CAT_SYNC_DELETED_HASH,
      baseVersion:Number(conflict.remote.recordVersion)||0,
      clientUpdatedAt:state?.meta?.lastSavedAt||new Date().toISOString()
    });
  }else{
    throw new Error('Choose either the local or cloud version.');
  }
  swoleCatSyncMeta.conflicts=swoleCatSyncMeta.conflicts.filter(row=>row.key!==key);
  cloudSyncPersistMeta();
  cloudSyncSetStatus(swoleCatSyncMeta.conflicts.length?'conflict':'ready','');
  cloudSyncSchedule(150);
  return cloudSyncSnapshot();
}
function cloudSyncConflictLabel(conflict){
  const labels={
    routine:'Routine',
    program:'Program',
    session:'Workout history',
    custom_exercise:'Custom exercise',
    active_workout:'Active workout',
    profile:'Profile',
    settings:'Training settings',
    favorites:'Favorites',
    exercise_preferences:'Exercise preferences',
    bodyweight:'Bodyweight entry',
    app_state:'Program state'
  };
  const base=labels[conflict?.type]||'Record';
  const localName=conflict?.localPayload?.name||conflict?.localPayload?.routineName||'';
  const cloudName=conflict?.remote?.payload?.name||conflict?.remote?.payload?.routineName||'';
  return base+(localName||cloudName?' · '+String(localName||cloudName):'');
}
async function cloudSyncRegisterProvider(provider){
  swoleCatSyncProvider=cloudSyncValidateProvider(provider);
  cloudSyncEmit();
  const user=cloudSyncIdentityUser();
  if(user?.id&&swoleCatSyncMeta.enabled&&swoleCatSyncMeta.accountId===user.id)cloudSyncSchedule(500);
  return cloudSyncSnapshot();
}
function cloudSyncSettingsHtml(){
  const identity=SwoleCatRuntime.getService('identity')?.snapshot?.();
  if(!identity?.configured){
    return '<div class="notice"><b>Multi-device sync unavailable</b><br>This build is running local-only.</div>';
  }
  if(!identity?.signedIn){
    return '<div class="notice"><b>Multi-device sync is optional.</b><br>Sign in above before enabling it. Workouts remain fully local while signed out.</div>';
  }
  const info=cloudSyncSnapshot();
  if(!info.enabled){
    return '<div class="notice"><b>Sync is off on this device.</b><br>Your workout data stays local unless you explicitly enable multi-device sync.<br><br><span class="mini">Enabling sync creates owner-private record copies for your account. Existing data on another device is merged by record identity; conflicting edits are never silently overwritten.</span></div>'+
      '<div class="actions"><button class="btn" onclick="cloudEnableSyncFromUi()">Enable Multi-device Sync</button></div>';
  }
  const status=info.status==='syncing'?'Syncing…':info.conflictCount?'Needs review':info.status==='error'?'Sync issue':'Up to date';
  const last=info.lastSyncAt?new Date(info.lastSyncAt).toLocaleString():'Not completed yet';
  return '<div class="notice"><b>'+esc(status)+'</b><br>Last sync: '+esc(last)+
    '<br><span class="mini">Device '+esc((info.deviceId||'').slice(0,8))+' · '+info.pendingCount+' queued · '+info.conflictCount+' conflicts</span>'+
    (info.lastError?'<br><br><span class="mini">'+esc(info.lastError)+'</span>':'')+'</div>'+
    '<div class="actions"><button class="btn" onclick="cloudSyncNowFromUi()">Sync Now</button>'+
    (info.conflictCount?'<button class="btn secondary" onclick="cloudOpenSyncConflicts()">Review Conflicts</button>':'')+
    '<button class="btn secondary" onclick="cloudDisableSyncFromUi()">Disable on This Device</button></div>';
}
async function cloudEnableSyncFromUi(){
  try{
    showToast('Enabling multi-device sync…');
    const result=await cloudSyncEnable();
    showToast(result.conflictCount?'Sync enabled · review conflicts':'Multi-device sync enabled');
    openSettings();
  }catch(error){
    alert('Could not enable multi-device sync: '+(error?.message||error));
  }
}
async function cloudSyncNowFromUi(){
  try{
    showToast('Syncing…');
    const result=await cloudSyncNow();
    showToast(result.conflictCount?'Sync finished · review conflicts':'Sync complete');
    openSettings();
  }catch(error){
    alert('Could not sync: '+(error?.message||error));
  }
}
function cloudDisableSyncFromUi(){
  cloudSyncDisable();
  showToast('Sync disabled on this device');
  openSettings();
}
function cloudOpenSyncConflicts(){
  const conflicts=[...swoleCatSyncMeta.conflicts];
  if(!conflicts.length){
    openModal('Sync conflicts','<div class="notice">There are no sync conflicts waiting for review.</div><div class="actions"><button class="btn secondary" onclick="openSettings()">Back</button></div>');
    return;
  }
  const rows=conflicts.map(conflict=>{
    const token=encodeURIComponent(conflict.key);
    const warning=conflict.type==='active_workout'?'<div class="mini" style="margin-top:6px">Active workouts are never merged set-by-set. Choose one complete version.</div>':'';
    return '<div class="card" style="margin-bottom:10px"><b>'+esc(cloudSyncConflictLabel(conflict))+'</b>'+
      '<div class="mini" style="margin-top:6px">This device and cloud both changed this record. Swole Cat kept both until you choose.</div>'+warning+
      '<div class="actions"><button class="btn" onclick="cloudResolveSyncConflictFromUi(\''+token+'\',\'local\')">Keep This Device</button>'+
      '<button class="btn secondary" onclick="cloudResolveSyncConflictFromUi(\''+token+'\',\'cloud\')">Use Cloud</button></div></div>';
  }).join('');
  openModal('Review sync conflicts','<div class="notice">Nothing here is overwritten automatically. Resolve each record explicitly.</div>'+rows+'<div class="actions"><button class="btn secondary" onclick="openSettings()">Done</button></div>');
}
function cloudResolveSyncConflictFromUi(encodedKey,choice){
  try{
    cloudSyncResolveConflict(decodeURIComponent(encodedKey),choice);
    showToast(choice==='local'?'Keeping this device version':'Using cloud version');
    cloudOpenSyncConflicts();
  }catch(error){
    alert('Could not resolve that conflict: '+(error?.message||error));
  }
}

const swoleCatCloudSyncService=SwoleCatRuntime.registerService('sync',{
  snapshot:cloudSyncSnapshot,
  registerProvider:cloudSyncRegisterProvider,
  enable:cloudSyncEnable,
  disable:cloudSyncDisable,
  syncNow:cloudSyncNow,
  project:()=>cloudSyncProjectState(),
  resolveConflict:cloudSyncResolveConflict
});

SwoleCatRuntime.events.addEventListener('state:saved',()=>{
  if(swoleCatSyncApplyingRemote||!swoleCatSyncMeta.enabled)return;
  try{cloudSyncQueueLocalChanges()}catch(error){}
  if(swoleCatSyncRunPromise)swoleCatSyncRerunRequested=true;
  cloudSyncSchedule();
});
SwoleCatRuntime.events.addEventListener('identity:changed',event=>{
  const detail=event?.detail;
  if(!detail?.signedIn){
    if(swoleCatSyncTimer){clearTimeout(swoleCatSyncTimer);swoleCatSyncTimer=null}
    cloudSyncSetStatus(swoleCatSyncMeta.enabled?'signed_out':'disabled','');
    return;
  }
  if(swoleCatSyncMeta.accountId&&swoleCatSyncMeta.accountId!==detail.user?.id){
    swoleCatSyncMeta=cloudSyncFreshMeta(detail.user?.id||'');
    cloudSyncPersistMeta();
    cloudSyncSetStatus('disabled','');
    return;
  }
  if(swoleCatSyncMeta.enabled)cloudSyncSchedule(500);
});
window.addEventListener('online',()=>{if(swoleCatSyncMeta.enabled)cloudSyncSchedule(250)});
setTimeout(()=>{
  const user=cloudSyncIdentityUser();
  if(user?.id&&swoleCatSyncMeta.enabled&&(!swoleCatSyncMeta.accountId||swoleCatSyncMeta.accountId===user.id))cloudSyncSchedule(700);
},0);
