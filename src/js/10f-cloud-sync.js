// Phase 8.3 provider-neutral record-level multi-device sync.
// Local workout saves always remain authoritative on-device. Network I/O happens only
// through explicit sync operations in this first Phase 8.3 slice.
const SWOLE_CAT_SYNC_LOCAL_KEY='swolecat-sync-local-v1';
const SWOLE_CAT_SYNC_LOCAL_VERSION=1;
const SWOLE_CAT_SYNC_SCHEMA_VERSION=1;
const SWOLE_CAT_SYNC_PULL_LIMIT=500;
const SWOLE_CAT_SYNC_CAPTURE_DELAY_MS=850;

let swoleCatSyncProvider=null;
let swoleCatSyncCaptureTimer=null;
let swoleCatSyncApplyingRemote=false;
let swoleCatSyncInFlight=null;
let swoleCatSyncState={
  status:'idle',
  lastError:'',
  lastSyncAt:null,
  queued:0,
  conflicts:0
};

function syncIdentity(){
  return SwoleCatRuntime.getService('identity');
}
function syncIdentityUser(){
  const snapshot=syncIdentity()?.snapshot?.();
  return snapshot?.signedIn&&snapshot?.user?.id?snapshot.user:null;
}
function syncCanUse(){
  return !!(swoleCatSyncProvider&&syncIdentity()?.canUseCloud?.()&&syncIdentityUser()?.id);
}
function syncDefaultLocal(){
  return {
    version:SWOLE_CAT_SYNC_LOCAL_VERSION,
    deviceId:'',
    ownerId:null,
    lastCursor:0,
    manifest:{},
    queue:[],
    conflicts:{},
    lastSyncAt:null
  };
}
function syncLoadLocal(){
  let parsed=null;
  try{parsed=JSON.parse(swoleCatStorage.getItem(SWOLE_CAT_SYNC_LOCAL_KEY)||'null')}catch(error){}
  const base=syncDefaultLocal();
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return base;
  return {
    ...base,
    ...parsed,
    version:SWOLE_CAT_SYNC_LOCAL_VERSION,
    manifest:parsed.manifest&&typeof parsed.manifest==='object'&&!Array.isArray(parsed.manifest)?parsed.manifest:{},
    queue:Array.isArray(parsed.queue)?parsed.queue:[],
    conflicts:parsed.conflicts&&typeof parsed.conflicts==='object'&&!Array.isArray(parsed.conflicts)?parsed.conflicts:{}
  };
}
function syncSaveLocal(local){
  const next={...syncDefaultLocal(),...local,version:SWOLE_CAT_SYNC_LOCAL_VERSION};
  swoleCatStorage.setItem(SWOLE_CAT_SYNC_LOCAL_KEY,JSON.stringify(next));
  return next;
}
function syncDeviceId(local=syncLoadLocal()){
  if(local.deviceId)return local.deviceId;
  local.deviceId=globalThis.crypto?.randomUUID?.()||uid();
  syncSaveLocal(local);
  return local.deviceId;
}
function syncEnsureOwner(ownerId){
  const local=syncLoadLocal();
  syncDeviceId(local);
  if(String(local.ownerId||'')!==String(ownerId||'')){
    const hadOwner=!!local.ownerId;
    const deviceId=hadOwner
      ?(globalThis.crypto?.randomUUID?.()||uid())
      :local.deviceId;
    return syncSaveLocal({
      ...syncDefaultLocal(),
      deviceId,
      ownerId:String(ownerId||'')||null
    });
  }
  return local;
}
function syncPublicSnapshot(){
  const local=syncLoadLocal();
  return {
    status:swoleCatSyncState.status,
    lastError:swoleCatSyncState.lastError||'',
    lastSyncAt:local.lastSyncAt||swoleCatSyncState.lastSyncAt||null,
    queued:local.queue.length,
    conflicts:Object.keys(local.conflicts).length,
    deviceId:local.deviceId||''
  };
}
function syncEmitChange(){
  const detail=syncPublicSnapshot();
  swoleCatSyncState={...swoleCatSyncState,...detail};
  SwoleCatRuntime.events.dispatchEvent(new CustomEvent('cloudSync:changed',{detail}));
  return detail;
}
function syncSetState(patch){
  swoleCatSyncState={...swoleCatSyncState,...patch};
  return syncEmitChange();
}
function syncValidateProvider(provider){
  if(!provider||typeof provider!=='object')throw new Error('Cloud sync provider is required.');
  for(const name of ['registerDevice','pullChanges','getRecord','insertRecord','updateRecord']){
    if(typeof provider[name]!=='function')throw new Error('Cloud sync provider is missing '+name+'().');
  }
  return provider;
}
function registerCloudSyncProvider(provider){
  swoleCatSyncProvider=syncValidateProvider(provider);
  syncEmitChange();
  return syncPublicSnapshot();
}
function syncPlatform(){
  if(isNativeApp())return 'android';
  if(window.matchMedia?.('(display-mode: standalone)')?.matches)return 'pwa';
  return 'web';
}
function syncDeviceName(deviceId){
  const platform=syncPlatform()==='android'?'Android':syncPlatform()==='pwa'?'PWA':'Web';
  return 'Swole Cat '+platform+' · '+String(deviceId||'').slice(0,8);
}
function syncKey(type,id){
  return String(type)+':'+String(id);
}
function syncClone(v){return JSON.parse(JSON.stringify(v))}
function syncCanonical(value){
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(syncCanonical).join(',')+']';
  return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+syncCanonical(value[key])).join(',')+'}';
}
const SWOLE_CAT_SYNC_SHA256_K=[
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
];
function syncSha256HexText(text){
  if(typeof TextEncoder==='undefined')throw new Error('Sync text encoding is unavailable on this device.');
  const bytes=new TextEncoder().encode(String(text||''));
  const totalLength=Math.ceil((bytes.length+9)/64)*64;
  const data=new Uint8Array(totalLength);
  data.set(bytes);
  data[bytes.length]=0x80;

  const bitLength=bytes.length*8;
  const high=Math.floor(bitLength/0x100000000);
  const low=bitLength>>>0;
  data[totalLength-8]=(high>>>24)&255;
  data[totalLength-7]=(high>>>16)&255;
  data[totalLength-6]=(high>>>8)&255;
  data[totalLength-5]=high&255;
  data[totalLength-4]=(low>>>24)&255;
  data[totalLength-3]=(low>>>16)&255;
  data[totalLength-2]=(low>>>8)&255;
  data[totalLength-1]=low&255;

  const h=[
    0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,
    0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19
  ];
  const w=new Uint32Array(64);
  const rotr=(v,n)=>(v>>>n)|(v<<(32-n));

  for(let offset=0;offset<totalLength;offset+=64){
    for(let i=0;i<16;i++){
      const j=offset+i*4;
      w[i]=((data[j]<<24)|(data[j+1]<<16)|(data[j+2]<<8)|data[j+3])>>>0;
    }
    for(let i=16;i<64;i++){
      const x=w[i-15],y=w[i-2];
      const s0=(rotr(x,7)^rotr(x,18)^(x>>>3))>>>0;
      const s1=(rotr(y,17)^rotr(y,19)^(y>>>10))>>>0;
      w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;
    }

    let a=h[0],b=h[1],cc=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
    for(let i=0;i<64;i++){
      const S1=(rotr(e,6)^rotr(e,11)^rotr(e,25))>>>0;
      const ch=((e&f)^((~e)&g))>>>0;
      const t1=(hh+S1+ch+SWOLE_CAT_SYNC_SHA256_K[i]+w[i])>>>0;
      const S0=(rotr(a,2)^rotr(a,13)^rotr(a,22))>>>0;
      const maj=((a&b)^(a&cc)^(b&cc))>>>0;
      const t2=(S0+maj)>>>0;
      hh=g;g=f;f=e;e=(d+t1)>>>0;d=cc;cc=b;b=a;a=(t1+t2)>>>0;
    }
    h[0]=(h[0]+a)>>>0;h[1]=(h[1]+b)>>>0;h[2]=(h[2]+cc)>>>0;h[3]=(h[3]+d)>>>0;
    h[4]=(h[4]+e)>>>0;h[5]=(h[5]+f)>>>0;h[6]=(h[6]+g)>>>0;h[7]=(h[7]+hh)>>>0;
  }
  return h.map(v=>v.toString(16).padStart(8,'0')).join('');
}
function syncHashPayload(payload){
  return syncSha256HexText(syncCanonical(payload));
}
function syncProjectState(){
  const records=new Map();
  const put=(type,id,payload)=>records.set(syncKey(type,id),{type,id:String(id),payload:syncClone(payload)});

  put('profile','singleton',state.profile||{});
  put('settings','singleton',state.settings||{});
  put('favorites','singleton',{ids:[...(state.favorites||[])]});
  put('exercise_preferences','singleton',{value:{...(state.exercisePreferences||{})}});
  put('bodyweight','singleton',{entries:syncClone(state.bodyweight||[])});
  put('app_state','singleton',{activeProgramId:state.activeProgramId||null});

  (state.customExercises||[]).forEach(item=>item?.id&&put('custom_exercise',item.id,item));
  (state.routines||[]).forEach(item=>item?.id&&put('routine',item.id,item));
  (state.programs||[]).forEach(item=>item?.id&&put('program',item.id,item));
  (state.sessions||[]).forEach(item=>item?.id&&put('session',item.id,item));

  return records;
}
async function syncProjectionWithHashes(){
  const records=syncProjectState();
  const out=new Map();
  for(const [key,record] of records){
    out.set(key,{...record,hash:syncHashPayload(record.payload)});
  }
  return out;
}
function syncLocalTrainingIsFresh(){
  return !(state.routines?.length||state.programs?.length||state.sessions?.length||
    state.customExercises?.length||state.bodyweight?.length||state.favorites?.length||
    Object.keys(state.exercisePreferences||{}).length||state.profile?.name||state.activeWorkout);
}
function syncNormalizeRemoteRow(row){
  if(!row||typeof row!=='object')return null;
  return {
    ownerId:String(row.owner_id||row.ownerId||''),
    type:String(row.record_type||row.type||''),
    id:String(row.record_id||row.id||''),
    payload:row.payload_json===undefined?row.payload:row.payload_json,
    version:Number(row.record_version??row.version??0),
    changeSeq:Number(row.server_change_seq??row.changeSeq??0),
    sourceDeviceId:String(row.source_device_id||row.sourceDeviceId||''),
    clientUpdatedAt:row.client_updated_at||row.clientUpdatedAt||null,
    serverUpdatedAt:row.server_updated_at||row.serverUpdatedAt||null,
    deletedAt:row.deleted_at||row.deletedAt||null,
    schemaVersion:Number(row.schema_version??row.schemaVersion??1),
    lastMutationId:String(row.last_mutation_id||row.lastMutationId||'')
  };
}
function syncManifestEntry(remote,hash){
  return {
    hash:remote.deletedAt?null:hash,
    serverVersion:remote.version,
    changeSeq:remote.changeSeq,
    deleted:!!remote.deletedAt
  };
}
function syncReplaceById(list,id,payload){
  const arr=Array.isArray(list)?list:[];
  const index=arr.findIndex(item=>String(item?.id||'')===String(id));
  if(payload==null){
    return index>=0?arr.filter((_,i)=>i!==index):arr;
  }
  if(index<0)return [...arr,syncClone(payload)];
  return arr.map((item,i)=>i===index?syncClone(payload):item);
}
function syncApplyRemoteToState(remote){
  const deleted=!!remote.deletedAt;
  const payload=deleted?null:syncClone(remote.payload);
  switch(remote.type){
    case 'profile':
      state.profile=payload||freshState().profile;
      break;
    case 'settings':
      state.settings=payload||freshState().settings;
      break;
    case 'favorites':
      state.favorites=payload?.ids&&Array.isArray(payload.ids)?payload.ids:[];
      break;
    case 'exercise_preferences':
      state.exercisePreferences=payload?.value&&typeof payload.value==='object'?payload.value:{};
      break;
    case 'bodyweight':
      state.bodyweight=payload?.entries&&Array.isArray(payload.entries)?payload.entries:[];
      break;
    case 'app_state':
      state.activeProgramId=payload?.activeProgramId||null;
      break;
    case 'custom_exercise':
      state.customExercises=syncReplaceById(state.customExercises,remote.id,payload);
      break;
    case 'routine':
      state.routines=syncReplaceById(state.routines,remote.id,payload);
      break;
    case 'program':
      state.programs=syncReplaceById(state.programs,remote.id,payload);
      break;
    case 'session':
      state.sessions=syncReplaceById(state.sessions,remote.id,payload);
      break;
    default:
      return false;
  }
  return true;
}
function syncRecordLabel(type){
  return ({
    profile:'Profile',
    settings:'Training settings',
    favorites:'Favorites',
    exercise_preferences:'Exercise preferences',
    bodyweight:'Bodyweight',
    app_state:'Program state',
    custom_exercise:'Custom exercise',
    routine:'Routine',
    program:'Program',
    session:'Workout history'
  })[type]||type;
}
function syncQueueMutation(local,record,expectedVersion,deleted=false){
  const key=syncKey(record.type,record.id);
  const existing=local.queue.find(item=>item.key===key);
  const mutation={
    key,
    mutationId:existing?.mutationId||globalThis.crypto?.randomUUID?.()||uid(),
    type:record.type,
    id:record.id,
    payload:deleted?null:syncClone(record.payload),
    hash:deleted?null:record.hash,
    deleted:!!deleted,
    expectedVersion:expectedVersion==null?null:Number(expectedVersion),
    queuedAt:existing?.queuedAt||new Date().toISOString()
  };
  local.queue=[...local.queue.filter(item=>item.key!==key),mutation];
  return mutation;
}
async function syncCaptureLocalChanges(){
  if(swoleCatSyncApplyingRemote)return syncPublicSnapshot();
  const user=syncIdentityUser();
  if(!user?.id)return syncPublicSnapshot();
  const local=syncEnsureOwner(user.id);
  const projection=await syncProjectionWithHashes();

  for(const [key,record] of projection){
    if(local.conflicts[key])continue;
    const manifest=local.manifest[key];
    if(!manifest){
      syncQueueMutation(local,record,null,false);
      continue;
    }
    if(manifest.deleted||manifest.hash!==record.hash){
      syncQueueMutation(local,record,manifest.serverVersion,false);
    }else{
      local.queue=local.queue.filter(item=>item.key!==key);
    }
  }

  for(const [key,manifest] of Object.entries(local.manifest)){
    if(manifest?.deleted||projection.has(key)||local.conflicts[key])continue;
    const split=key.indexOf(':');
    if(split<1)continue;
    const record={type:key.slice(0,split),id:key.slice(split+1),payload:null,hash:null};
    syncQueueMutation(local,record,manifest.serverVersion,true);
  }

  // A record created and then deleted before its first successful sync has no
  // remote identity to tombstone. Drop that stale pending insert instead of
  // resurrecting something the user already removed.
  local.queue=local.queue.filter(item=>projection.has(item.key)||!!local.manifest[item.key]);

  syncSaveLocal(local);
  return syncEmitChange();
}
function syncScheduleCapture(){
  if(swoleCatSyncApplyingRemote)return;
  if(swoleCatSyncCaptureTimer)clearTimeout(swoleCatSyncCaptureTimer);
  swoleCatSyncCaptureTimer=setTimeout(()=>{
    swoleCatSyncCaptureTimer=null;
    syncCaptureLocalChanges().catch(error=>syncSetState({lastError:error?.message||String(error)}));
  },SWOLE_CAT_SYNC_CAPTURE_DELAY_MS);
}
async function syncRegisterCurrentDevice(ownerId,local){
  for(let attempt=0;attempt<2;attempt++){
    const deviceId=syncDeviceId(local);
    const result=await swoleCatSyncProvider.registerDevice({
      ownerId,
      device:{
        id:deviceId,
        device_name:syncDeviceName(deviceId),
        platform:syncPlatform(),
        app_version:APP_VERSION,
        last_seen_at:new Date().toISOString()
      }
    });
    if(!result?.collision)return deviceId;

    local.deviceId=globalThis.crypto?.randomUUID?.()||uid();
    syncSaveLocal(local);
  }
  throw new Error('Could not establish a unique sync identity for this installation.');
}
async function syncPullRemote(ownerId,local){
  const freshLocal=Number(local.lastCursor||0)===0&&
    Object.keys(local.manifest).length===0&&syncLocalTrainingIsFresh();
  let projection=null;
  let applied=0,conflictCount=0,changedState=false;
  let pageCount=0;

  while(pageCount<100){
    const rows=await swoleCatSyncProvider.pullChanges({
      ownerId,
      afterSeq:Number(local.lastCursor)||0,
      limit:SWOLE_CAT_SYNC_PULL_LIMIT
    });
    if(!Array.isArray(rows)||!rows.length)break;
    pageCount++;
    if(!projection)projection=await syncProjectionWithHashes();

    for(const raw of rows){
    const remote=syncNormalizeRemoteRow(raw);
    if(!remote?.type||!remote.id)continue;
    const key=syncKey(remote.type,remote.id);
    const localRecord=projection.get(key)||null;
    const manifest=local.manifest[key]||null;
    const remoteHash=remote.deletedAt?null:syncHashPayload(remote.payload);
    let localDirty=false;

    if(manifest){
      if(manifest.deleted)localDirty=!!localRecord;
      else localDirty=!localRecord||localRecord.hash!==manifest.hash;
    }else if(localRecord){
      localDirty=!freshLocal&&localRecord.hash!==remoteHash;
    }

    if(localDirty&&!(localRecord&&!remote.deletedAt&&localRecord.hash===remoteHash)){
      local.conflicts[key]={
        key,
        type:remote.type,
        id:remote.id,
        detectedAt:new Date().toISOString(),
        localPayload:localRecord?syncClone(localRecord.payload):null,
        localDeleted:!localRecord,
        remote
      };
      local.queue=local.queue.filter(item=>item.key!==key);
      conflictCount++;
    }else{
      if(syncApplyRemoteToState(remote))changedState=true;
      local.manifest[key]=syncManifestEntry(remote,remoteHash);
      delete local.conflicts[key];
      local.queue=local.queue.filter(item=>item.key!==key);
      applied++;
    }
      if(remote.changeSeq>Number(local.lastCursor||0))local.lastCursor=remote.changeSeq;
    }

    if(rows.length<SWOLE_CAT_SYNC_PULL_LIMIT)break;
  }

  if(pageCount>=100)throw new Error('Sync pull exceeded the safety page limit.');

  if(changedState){
    swoleCatSyncApplyingRemote=true;
    try{
      state=normalizeState(state);
      if(!save())throw new Error(lastStorageError||'Could not save synchronized data locally.');
      renderHome();
      populateMuscles();
      updateActiveWorkoutChrome();
    }finally{
      swoleCatSyncApplyingRemote=false;
    }
  }
  syncSaveLocal(local);
  syncEmitChange();
  return {applied,conflicts:conflictCount};
}
async function syncPushQueue(ownerId,local,deviceId){
  let pushed=0,conflicts=0;
  const queue=[...local.queue];
  for(const mutation of queue){
    let result;
    if(mutation.expectedVersion==null){
      result=await swoleCatSyncProvider.insertRecord({
        ownerId,deviceId,mutation,schemaVersion:SWOLE_CAT_SYNC_SCHEMA_VERSION
      });
    }else{
      result=await swoleCatSyncProvider.updateRecord({
        ownerId,deviceId,mutation,schemaVersion:SWOLE_CAT_SYNC_SCHEMA_VERSION
      });
    }

    if(result?.conflict){
      const remote=syncNormalizeRemoteRow(result.current);
      local.conflicts[mutation.key]={
        key:mutation.key,
        type:mutation.type,
        id:mutation.id,
        detectedAt:new Date().toISOString(),
        localPayload:mutation.deleted?null:syncClone(mutation.payload),
        localDeleted:mutation.deleted,
        remote
      };
      local.queue=local.queue.filter(item=>item.mutationId!==mutation.mutationId);
      conflicts++;
      syncSaveLocal(local);
      continue;
    }

    const remote=syncNormalizeRemoteRow(result?.row||result);
    if(!remote?.version)throw new Error('Sync server did not return the saved record version.');
    local.manifest[mutation.key]=syncManifestEntry(remote,mutation.hash);
    local.queue=local.queue.filter(item=>item.mutationId!==mutation.mutationId);
    if(remote.changeSeq>Number(local.lastCursor||0))local.lastCursor=remote.changeSeq;
    pushed++;
    syncSaveLocal(local);
  }
  syncEmitChange();
  return {pushed,conflicts};
}
async function cloudSyncNow(){
  if(swoleCatSyncInFlight)return swoleCatSyncInFlight;

  swoleCatSyncInFlight=(async()=>{
    if(storageWriteBlocked)throw new Error('Sync is paused while local storage write protection is active.');
    const user=syncIdentityUser();
    if(!user?.id||!syncCanUse())throw new Error('Sign in to your Swole Cat cloud account before syncing.');
    syncSetState({status:'syncing',lastError:''});
    const local=syncEnsureOwner(user.id);
    try{
      // Always pull first. Reading remote changes does not depend on this
      // installation's device row, so a browser-specific registration issue
      // must never block inbound cloud data from reaching the local app.
      await syncPullRemote(user.id,local);
      const deviceId=await syncRegisterCurrentDevice(user.id,syncEnsureOwner(user.id));
      await syncCaptureLocalChanges();
      const refreshed=syncEnsureOwner(user.id);
      const pushResult=await syncPushQueue(user.id,refreshed,deviceId);
      const afterPush=syncEnsureOwner(user.id);
      await syncPullRemote(user.id,afterPush);
      const finalLocal=syncEnsureOwner(user.id);
      finalLocal.lastSyncAt=new Date().toISOString();
      syncSaveLocal(finalLocal);
      syncSetState({
        status:Object.keys(finalLocal.conflicts).length?'conflict':'ready',
        lastError:'',
        lastSyncAt:finalLocal.lastSyncAt
      });
      return {...syncPublicSnapshot(),pushed:pushResult.pushed};
    }catch(error){
      syncSetState({status:'error',lastError:error?.message||String(error)});
      throw error;
    }
  })();

  try{
    return await swoleCatSyncInFlight;
  }finally{
    swoleCatSyncInFlight=null;
  }
}
function cloudSyncResetLocalMetadata(){
  const local=syncLoadLocal();
  const next=syncSaveLocal({
    ...syncDefaultLocal(),
    deviceId:local.deviceId||'',
    ownerId:local.ownerId||null
  });
  syncSetState({status:'idle',lastError:'',lastSyncAt:null});
  return next;
}

async function cloudSyncResolveConflict(key,choice){
  const user=syncIdentityUser();
  if(!user?.id)throw new Error('Sign in before resolving sync conflicts.');
  const local=syncEnsureOwner(user.id);
  const conflict=local.conflicts[key];
  if(!conflict)throw new Error('That sync conflict is no longer available.');
  const remote=syncNormalizeRemoteRow(conflict.remote);
  if(!remote)throw new Error('The cloud version of this conflict is unavailable.');

  if(choice==='cloud'){
    syncApplyRemoteToState(remote);
    const hash=remote.deletedAt?null:syncHashPayload(remote.payload);
    local.manifest[key]=syncManifestEntry(remote,hash);
    local.queue=local.queue.filter(item=>item.key!==key);
    delete local.conflicts[key];
    swoleCatSyncApplyingRemote=true;
    try{
      state=normalizeState(state);
      if(!save())throw new Error(lastStorageError||'Could not save the cloud version locally.');
      renderHome();populateMuscles();updateActiveWorkoutChrome();
    }finally{swoleCatSyncApplyingRemote=false}
    syncSaveLocal(local);
    syncEmitChange();
    return {ok:true,choice};
  }

  if(choice==='local'){
    local.manifest[key]=syncManifestEntry(
      remote,
      remote.deletedAt?null:syncHashPayload(remote.payload)
    );
    const split=key.indexOf(':');
    const type=key.slice(0,split),id=key.slice(split+1);
    if(conflict.localDeleted){
      syncQueueMutation(local,{type,id,payload:null,hash:null},remote.version,true);
    }else{
      const hash=syncHashPayload(conflict.localPayload);
      syncQueueMutation(local,{type,id,payload:conflict.localPayload,hash},remote.version,false);
    }
    delete local.conflicts[key];
    syncSaveLocal(local);
    syncEmitChange();
    return {ok:true,choice};
  }

  throw new Error('Choose either this device or the cloud version.');
}
function cloudSyncConflictHtml(conflict){
  const remote=syncNormalizeRemoteRow(conflict.remote);
  const label=syncRecordLabel(conflict.type);
  const key=escAttr(conflict.key);
  return '<div class="card" style="margin-bottom:10px"><b>'+esc(label)+'</b>'+
    '<div class="mini" style="margin-top:6px">Both this device and the cloud changed this record. Nothing has been overwritten.</div>'+
    '<div class="actions"><button class="btn" onclick="cloudSyncResolveConflictFromUi(\''+key+'\',\'local\')">Keep this device</button>'+
    '<button class="btn secondary" onclick="cloudSyncResolveConflictFromUi(\''+key+'\',\'cloud\')">Use cloud</button></div></div>';
}
function cloudSyncSettingsHtml(){
  const identity=syncIdentity()?.snapshot?.();
  if(!identity?.configured)return '<div class="notice"><b>Multi-device sync unavailable</b><br>This build is running local-only.</div>';
  if(!identity?.signedIn)return '<div class="notice"><b>Multi-device sync is optional.</b><br>Sign in above when you want to connect this installation. Workouts remain fully local while signed out.</div>';

  const local=syncEnsureOwner(identity.user.id);
  const conflictCount=Object.keys(local.conflicts).length;
  const last=local.lastSyncAt?new Date(local.lastSyncAt).toLocaleString():'Never';
  const queued=local.queue.length;
  const error=swoleCatSyncState.lastError?'<br><br><span class="mini">'+esc(swoleCatSyncState.lastError)+'</span>':'';
  return '<div class="notice"><b>Record-level sync</b><br>Last sync: '+esc(last)+
    '<br>Queued local changes: '+queued+
    '<br>Conflicts waiting: '+conflictCount+
    '<br><br><span class="mini">Active workouts stay local. Sync uses versioned records, not the whole app database, and ordinary workout saves never wait on the network.</span>'+error+'</div>'+
    '<div class="actions"><button class="btn" onclick="cloudSyncNowFromUi()">Sync Now</button>'+
    (conflictCount?'<button class="btn secondary" onclick="cloudSyncOpenConflictsFromUi()">Review conflicts</button>':'')+'</div>';
}
async function cloudSyncNowFromUi(){
  try{
    showToast('Syncing…');
    const result=await cloudSyncNow();
    showToast(result.conflicts?'Sync paused on conflict':'Sync complete');
    openSettings();
  }catch(error){
    alert('Could not sync right now: '+(error?.message||error));
  }
}
function cloudSyncOpenConflictsFromUi(){
  const user=syncIdentityUser();
  if(!user?.id)return;
  const local=syncEnsureOwner(user.id);
  const conflicts=Object.values(local.conflicts);
  openModal('Sync conflicts',
    conflicts.length
      ?'<div class="notice">Swole Cat never silently chooses between two edited versions. Pick which copy should win for each record.</div>'+conflicts.map(cloudSyncConflictHtml).join('')+'<div class="actions"><button class="btn secondary" onclick="openSettings()">Back</button></div>'
      :'<div class="notice">No sync conflicts are waiting.</div><div class="actions"><button class="btn secondary" onclick="openSettings()">Back</button></div>'
  );
}
async function cloudSyncResolveConflictFromUi(key,choice){
  try{
    await cloudSyncResolveConflict(key,choice);
    if(choice==='local')await cloudSyncNow();
    showToast(choice==='local'?'This device kept':'Cloud version applied');
    cloudSyncOpenConflictsFromUi();
  }catch(error){
    alert('Could not resolve that conflict: '+(error?.message||error));
  }
}

const swoleCatCloudSyncService=SwoleCatRuntime.registerService('cloudSync',{
  snapshot:syncPublicSnapshot,
  registerProvider:registerCloudSyncProvider,
  canUse:syncCanUse,
  captureLocalChanges:syncCaptureLocalChanges,
  syncNow:cloudSyncNow,
  resolveConflict:cloudSyncResolveConflict,
  resetLocalMetadata:cloudSyncResetLocalMetadata
});

SwoleCatRuntime.events.addEventListener('state:saved',()=>syncScheduleCapture());
SwoleCatRuntime.events.addEventListener('identity:changed',event=>{
  const detail=event?.detail;
  if(detail?.signedIn&&detail?.user?.id){
    syncEnsureOwner(detail.user.id);
  }
  syncEmitChange();
});
