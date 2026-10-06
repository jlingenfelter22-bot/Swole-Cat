// Phase 8.2 provider-neutral cloud backup/restore.
// Cloud backup is disaster recovery only. It never participates in the live workout save path.
const SWOLE_CAT_CLOUD_BACKUP_RETENTION=2;
const SWOLE_CAT_CLOUD_BACKUP_MAX_BYTES=5000000;
const SWOLE_CAT_CLOUD_BACKUP_DEVICE_KEY='swolecat_cloud_backup_device_v1';
const SWOLE_CAT_CLOUD_AUTOMATION_KEY='swolecat-cloud-automation-v1';
const SWOLE_CAT_AUTO_BACKUP_INTERVAL_MS=24*60*60*1000;
const SWOLE_CAT_AUTO_BACKUP_CHECK_MS=30*60*1000;
let swoleCatCloudBackupProvider=null;
let swoleCatAutoBackupTimer=null;
let swoleCatAutoBackupInFlight=null;
let swoleCatCloudRestoreCandidate=null;
let swoleCatCloudBackupState={
  status:'idle',
  backups:[],
  lastError:'',
  lastSuccessfulBackupAt:null
};
function cloudAutomationPrefs(){
  let parsed=null;
  try{parsed=JSON.parse(swoleCatStorage.getItem(SWOLE_CAT_CLOUD_AUTOMATION_KEY)||'null')}catch(error){}
  return {
    autoSync:parsed?.autoSync!==false,
    autoBackup:parsed?.autoBackup!==false,
    lastCloudBackupAt:parsed?.lastCloudBackupAt||null
  };
}
function saveCloudAutomationPrefs(patch){
  const next={...cloudAutomationPrefs(),...patch};
  try{swoleCatStorage.setItem(SWOLE_CAT_CLOUD_AUTOMATION_KEY,JSON.stringify(next))}catch(error){}
  SwoleCatRuntime.events.dispatchEvent(new CustomEvent('cloudAutomation:changed',{detail:{...next}}));
  return next;
}
function cloudAutoBackupEnabled(){
  return cloudAutomationPrefs().autoBackup!==false;
}
function cloudAutoBackupDue(){
  const last=cloudAutomationPrefs().lastCloudBackupAt||swoleCatCloudBackupState.lastSuccessfulBackupAt||null;
  if(!last)return true;
  const time=Date.parse(last);
  return !Number.isFinite(time)||(Date.now()-time)>=SWOLE_CAT_AUTO_BACKUP_INTERVAL_MS;
}
function cloudAutomationSettingsHtml(){
  const prefs=cloudAutomationPrefs();
  return '<div class="card settings-toggle-card">'+
    '<div class="setting-toggle"><div><b>Automatic sync</b><div class="mini">Recommended. Queued changes sync after a short delay, when connectivity returns, and during periodic cloud checks.</div></div><button class="toggle '+(prefs.autoSync?'on':'')+'" onclick="cloudToggleAutomationFromUi(\'autoSync\',this)"></button></div>'+
    '<div class="setting-toggle" style="border-bottom:0"><div><b>Automatic cloud backup</b><div class="mini">Recommended. Creates a recovery snapshot about once a day while you use Swole Cat. Only the latest two cloud backups are kept.</div></div><button class="toggle '+(prefs.autoBackup?'on':'')+'" onclick="cloudToggleAutomationFromUi(\'autoBackup\',this)"></button></div>'+
    '</div>';
}
function cloudToggleAutomationFromUi(key,button){
  if(key!=='autoSync'&&key!=='autoBackup')return;
  const current=cloudAutomationPrefs();
  const next=saveCloudAutomationPrefs({[key]:!current[key]});
  button?.classList?.toggle('on',!!next[key]);
  if(key==='autoSync'&&next.autoSync){
    SwoleCatRuntime.getService('cloudSync')?.scheduleAuto?.('preference',300,true);
  }
  if(key==='autoBackup'&&next.autoBackup){
    cloudScheduleAutoBackup(500);
  }
  showToast(next[key]?(key==='autoSync'?'Automatic sync on':'Automatic cloud backup on'):(key==='autoSync'?'Automatic sync off':'Automatic cloud backup off'));
}

function cloudBackupSnapshot(){
  return {
    status:swoleCatCloudBackupState.status,
    backups:swoleCatCloudBackupState.backups.map(row=>({...row})),
    lastError:swoleCatCloudBackupState.lastError||'',
    lastSuccessfulBackupAt:swoleCatCloudBackupState.lastSuccessfulBackupAt||null
  };
}
function emitCloudBackupChange(){
  SwoleCatRuntime.events.dispatchEvent(new CustomEvent('cloudBackup:changed',{detail:cloudBackupSnapshot()}));
}
function setCloudBackupState(patch){
  swoleCatCloudBackupState={...swoleCatCloudBackupState,...patch};
  emitCloudBackupChange();
  return cloudBackupSnapshot();
}
function validateCloudBackupProvider(provider){
  if(!provider||typeof provider!=='object')throw new Error('Cloud backup provider is required.');
  for(const name of ['listBackups','uploadBackup','downloadBackup','deleteBackup']){
    if(typeof provider[name]!=='function')throw new Error('Cloud backup provider is missing '+name+'().');
  }
  return provider;
}
function cloudBackupIdentity(){
  return SwoleCatRuntime.getService('identity');
}
function cloudBackupUser(){
  const snapshot=cloudBackupIdentity()?.snapshot?.();
  return snapshot?.signedIn&&snapshot?.user?.id?snapshot.user:null;
}
function cloudBackupCanUse(){
  return !!(swoleCatCloudBackupProvider&&cloudBackupIdentity()?.canUseCloud?.()&&cloudBackupUser()?.id);
}
function cloudBackupPublicMetadata(row){
  if(!row||typeof row!=='object')return null;
  return {
    id:String(row.id||''),
    ownerId:String(row.owner_id||row.ownerId||''),
    objectPath:String(row.object_path||row.objectPath||''),
    backupFormat:String(row.backup_format||row.backupFormat||''),
    formatVersion:Number(row.format_version??row.formatVersion??0),
    schemaVersion:Number(row.schema_version??row.schemaVersion??0),
    appVersion:String(row.app_version||row.appVersion||''),
    exportedAt:String(row.exported_at||row.exportedAt||''),
    sha256:String(row.sha256||'').toLowerCase(),
    sizeBytes:Number(row.size_bytes??row.sizeBytes??0),
    sourceDevice:String(row.source_device||row.sourceDevice||''),
    createdAt:String(row.created_at||row.createdAt||'')
  };
}
function cloudBackupDeviceId(){
  let id='';
  try{id=String(swoleCatStorage.getItem(SWOLE_CAT_CLOUD_BACKUP_DEVICE_KEY)||'')}catch(error){}
  if(id)return id;
  const random=globalThis.crypto?.randomUUID?.()||('id_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2));
  id='install_'+String(random).replace(/[^a-zA-Z0-9_-]/g,'');
  try{swoleCatStorage.setItem(SWOLE_CAT_CLOUD_BACKUP_DEVICE_KEY,id)}catch(error){}
  return id;
}
async function cloudBackupSha256Hex(text){
  if(!globalThis.crypto?.subtle||typeof TextEncoder==='undefined')throw new Error('Secure backup hashing is unavailable on this device.');
  const bytes=new TextEncoder().encode(String(text||''));
  const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function cloudBackupByteLength(text){
  if(typeof TextEncoder!=='undefined')return new TextEncoder().encode(String(text||'')).byteLength;
  return new Blob([String(text||'')]).size;
}
function cloudBackupObjectPath(userId,exportedAt){
  const stamp=String(exportedAt||new Date().toISOString()).replace(/[:.]/g,'-');
  const nonce=String(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9_-]/g,'');
  return String(userId)+'/'+stamp+'-'+nonce+'.json';
}
async function registerCloudBackupProvider(provider){
  swoleCatCloudBackupProvider=validateCloudBackupProvider(provider);
  return cloudBackupSnapshot();
}
async function cloudListBackups(){
  const user=cloudBackupUser();
  if(!user||!swoleCatCloudBackupProvider){
    return setCloudBackupState({status:'idle',backups:[],lastError:''}).backups;
  }
  setCloudBackupState({status:'loading',lastError:''});
  try{
    const rows=await swoleCatCloudBackupProvider.listBackups({ownerId:user.id});
    const backups=(Array.isArray(rows)?rows:[]).map(cloudBackupPublicMetadata).filter(row=>row?.id&&row.objectPath);
    backups.sort((a,b)=>String(b.createdAt||b.exportedAt).localeCompare(String(a.createdAt||a.exportedAt)));
    setCloudBackupState({status:'ready',backups,lastError:''});
    return backups;
  }catch(error){
    setCloudBackupState({status:'error',lastError:error?.message||String(error)});
    throw error;
  }
}
async function cloudPruneBackups(ownerId,rows){
  const extras=(Array.isArray(rows)?rows:[]).slice(SWOLE_CAT_CLOUD_BACKUP_RETENTION);
  const failures=[];
  for(const row of extras){
    try{
      await swoleCatCloudBackupProvider.deleteBackup({
        ownerId,
        backupId:row.id,
        objectPath:row.objectPath
      });
    }catch(error){
      failures.push(error?.message||String(error));
    }
  }
  return failures;
}
async function cloudBackUpNow(){
  if(storageWriteBlocked)throw new Error('Cloud backup is paused because local storage is in write-protection mode.');
  const user=cloudBackupUser();
  if(!user||!cloudBackupCanUse())throw new Error('Sign in to your Swole Cat cloud account before backing up.');
  setCloudBackupState({status:'backing_up',lastError:''});
  try{
    const exportedAt=new Date().toISOString();
    const envelope=createBackupEnvelope(exportedAt,false);
    const json=JSON.stringify(envelope);
    const sizeBytes=cloudBackupByteLength(json);
    if(sizeBytes>SWOLE_CAT_CLOUD_BACKUP_MAX_BYTES)throw new Error('This backup is larger than the current 5 MB cloud-backup limit.');
    const sha256=await cloudBackupSha256Hex(json);
    const objectPath=cloudBackupObjectPath(user.id,exportedAt);
    const metadata={
      owner_id:user.id,
      object_path:objectPath,
      backup_format:BACKUP_FORMAT,
      format_version:BACKUP_FORMAT_VERSION,
      schema_version:DATA_SCHEMA_VERSION,
      app_version:APP_VERSION,
      exported_at:exportedAt,
      sha256,
      size_bytes:sizeBytes,
      source_device:cloudBackupDeviceId()
    };
    await swoleCatCloudBackupProvider.uploadBackup({ownerId:user.id,objectPath,json,metadata});
    state.meta=isPlainObject(state.meta)?state.meta:{};
    state.meta.lastBackupAt=exportedAt;
    const localTimestampSaved=save();
    const localWarning=localTimestampSaved?'':'Cloud backup saved, but the local backup timestamp could not be recorded.';
    const rows=await swoleCatCloudBackupProvider.listBackups({ownerId:user.id});
    const normalized=rows.map(cloudBackupPublicMetadata).filter(Boolean)
      .sort((a,b)=>String(b.createdAt||b.exportedAt).localeCompare(String(a.createdAt||a.exportedAt)));
    const pruneFailures=await cloudPruneBackups(user.id,normalized);
    const finalRows=pruneFailures.length
      ?normalized
      :(await swoleCatCloudBackupProvider.listBackups({ownerId:user.id}))
        .map(cloudBackupPublicMetadata).filter(Boolean)
        .sort((a,b)=>String(b.createdAt||b.exportedAt).localeCompare(String(a.createdAt||a.exportedAt)));
    const warning=[localWarning,pruneFailures.length?'An older cloud snapshot could not be pruned yet.':''].filter(Boolean).join(' ');
    setCloudBackupState({
      status:'ready',
      backups:finalRows,
      lastError:warning,
      lastSuccessfulBackupAt:exportedAt
    });
    return {ok:true,exportedAt,sha256,sizeBytes,warning};
  }catch(error){
    setCloudBackupState({status:'error',lastError:error?.message||String(error)});
    throw error;
  }
}
function cloudBackupSummary(stateValue){
  const candidate=stateValue||{};
  return {
    routines:Array.isArray(candidate.routines)?candidate.routines.length:0,
    programs:Array.isArray(candidate.programs)?candidate.programs.length:0,
    sessions:Array.isArray(candidate.sessions)?candidate.sessions.length:0,
    customExercises:Array.isArray(candidate.customExercises)?candidate.customExercises.length:0,
    bodyweight:Array.isArray(candidate.bodyweight)?candidate.bodyweight.length:0,
    activeWorkout:!!candidate.activeWorkout
  };
}
async function cloudPrepareRestore(backupId){
  const user=cloudBackupUser();
  if(!user||!cloudBackupCanUse())throw new Error('Sign in before restoring a cloud backup.');
  const row=cloudBackupSnapshot().backups.find(item=>item.id===String(backupId||''))
    ||(await cloudListBackups()).find(item=>item.id===String(backupId||''));
  if(!row)throw new Error('That cloud backup is no longer available.');
  setCloudBackupState({status:'downloading',lastError:''});
  try{
    const json=await swoleCatCloudBackupProvider.downloadBackup({
      ownerId:user.id,
      backupId:row.id,
      objectPath:row.objectPath
    });
    const sizeBytes=cloudBackupByteLength(json);
    if(row.sizeBytes&&sizeBytes!==row.sizeBytes)throw new Error('Cloud backup size verification failed.');
    const sha256=await cloudBackupSha256Hex(json);
    if(!row.sha256||sha256!==row.sha256)throw new Error('Cloud backup integrity check failed.');
    const parsedState=parseBackupText(json);
    swoleCatCloudRestoreCandidate={metadata:row,state:parsedState,summary:cloudBackupSummary(parsedState)};
    setCloudBackupState({status:'ready',lastError:''});
    return {
      metadata:{...row},
      summary:{...swoleCatCloudRestoreCandidate.summary}
    };
  }catch(error){
    swoleCatCloudRestoreCandidate=null;
    setCloudBackupState({status:'error',lastError:error?.message||String(error)});
    throw error;
  }
}
function cloudApplyPreparedRestore(){
  if(!swoleCatCloudRestoreCandidate?.state)throw new Error('No verified cloud backup is ready to restore.');
  if(!createPreImportSnapshot())throw new Error('Restore canceled because Swole Cat could not create the required local safety snapshot.');
  const oldState=state,oldBlocked=storageWriteBlocked;
  try{
    state=cloneData(swoleCatCloudRestoreCandidate.state);
    storageWriteBlocked=false;
    recoverySnapshotWritten=false;
    if(!save())throw new Error(lastStorageError||'Local storage write failed.');
    const restored={...swoleCatCloudRestoreCandidate.metadata};
    swoleCatCloudRestoreCandidate=null;
    renderHome();populateMuscles();updateActiveWorkoutChrome();
    return restored;
  }catch(error){
    state=oldState;
    storageWriteBlocked=oldBlocked;
    throw error;
  }
}
async function cloudMaybeAutoBackup(reason='scheduled'){
  if(swoleCatAutoBackupInFlight)return swoleCatAutoBackupInFlight;
  if(!cloudAutoBackupEnabled()||!cloudBackupCanUse()||storageWriteBlocked)return null;
  if(typeof navigator!=='undefined'&&navigator.onLine===false)return null;
  if(typeof document!=='undefined'&&document.visibilityState==='hidden')return null;
  if(!cloudAutoBackupDue())return null;

  swoleCatAutoBackupInFlight=cloudBackUpNow()
    .catch(error=>{
      setCloudBackupState({status:'error',lastError:error?.message||String(error)});
      return null;
    })
    .finally(()=>{swoleCatAutoBackupInFlight=null});
  return swoleCatAutoBackupInFlight;
}
function cloudScheduleAutoBackup(delay=8000){
  if(swoleCatAutoBackupTimer)clearTimeout(swoleCatAutoBackupTimer);
  swoleCatAutoBackupTimer=setTimeout(()=>{
    swoleCatAutoBackupTimer=null;
    cloudMaybeAutoBackup('scheduled');
  },Math.max(0,Number(delay)||0));
}

function cloudBackupSettingsHtml(){
  const identity=cloudBackupIdentity()?.snapshot?.();
  if(!identity?.configured){
    return '<div class="notice"><b>Cloud backup unavailable</b><br>This build is running local-only. Manual JSON export/import remains available below.</div>';
  }
  if(!identity?.signedIn){
    return '<div class="notice"><b>Cloud backup is optional.</b><br>Sign in to your cloud account above to keep private recovery snapshots. Local workouts continue to work normally without an account.</div>';
  }
  const backup=cloudBackupSnapshot();
  const automation=cloudAutomationPrefs();
  const latest=backup.backups[0];
  const latestText=latest?.exportedAt
    ?new Date(latest.exportedAt).toLocaleString()
    :(backup.status==='ready'?'No cloud backup yet':'Not checked this session');
  const errorText=backup.lastError?'<br><br><span class="mini">'+esc(backup.lastError)+'</span>':'';
  return '<div class="notice"><b>Private cloud recovery</b><br>Latest: '+esc(latestText)+'<br><span class="mini">Swole Cat keeps at most the latest two snapshots. Cloud backup is separate from multi-device sync.</span>'+errorText+'</div>'+
    '<div class="mini" style="margin-top:7px">Automatic backup: '+(automation.autoBackup?'On · about once a day':'Off')+'</div>'+
    '<div class="actions"><button class="btn" onclick="cloudBackUpNowFromUi()">Back Up Now</button><button class="btn secondary" onclick="cloudOpenRestorePickerFromUi()">Restore from Cloud</button></div>';
}
async function cloudBackUpNowFromUi(){
  try{
    showToast('Creating cloud backup…');
    const result=await cloudBackUpNow();
    showToast(result.warning?'Backup saved · cleanup pending':'Cloud backup saved');
    openSettings();
  }catch(error){
    alert('Could not create cloud backup: '+(error?.message||error));
  }
}
function cloudRestoreRowHtml(row,index){
  const when=row.exportedAt?new Date(row.exportedAt).toLocaleString():'Unknown time';
  const size=row.sizeBytes?Math.max(1,Math.round(row.sizeBytes/1024))+' KB':'Unknown size';
  const label=index===0?'Latest backup':'Previous backup';
  return '<div class="card" style="margin-bottom:10px"><b>'+esc(label)+'</b><div class="mini" style="margin-top:6px">'+esc(when)+' · app '+esc(row.appVersion||'unknown')+' · schema v'+esc(row.schemaVersion)+' · '+esc(size)+'</div><div class="actions"><button class="btn secondary" onclick="cloudPrepareRestoreFromUi(\''+escAttr(row.id)+'\')">Preview restore</button></div></div>';
}
async function cloudOpenRestorePickerFromUi(){
  try{
    const backups=await cloudListBackups();
    if(!backups.length){
      openModal('Restore from Cloud','<div class="notice"><b>No cloud backups yet.</b><br><br>Create your first recovery snapshot with Back Up Now.</div><div class="actions"><button class="btn secondary" onclick="openSettings()">Back</button></div>');
      return;
    }
    openModal('Restore from Cloud','<div class="notice">Choose a recovery snapshot to inspect. Nothing will replace your local workout data until you review the preview and confirm the restore.</div>'+backups.slice(0,SWOLE_CAT_CLOUD_BACKUP_RETENTION).map(cloudRestoreRowHtml).join('')+'<div class="actions"><button class="btn secondary" onclick="openSettings()">Cancel</button></div>');
  }catch(error){
    alert('Could not load cloud backups: '+(error?.message||error));
  }
}
async function cloudPrepareRestoreFromUi(backupId){
  try{
    showToast('Verifying cloud backup…');
    const preview=await cloudPrepareRestore(backupId);
    const meta=preview.metadata,summary=preview.summary;
    const when=meta.exportedAt?new Date(meta.exportedAt).toLocaleString():'Unknown time';
    openModal('Restore preview','<div class="notice"><b>Verified cloud backup</b><br>'+esc(when)+'<br><br>'+
      '<b>'+summary.sessions+'</b> workout sessions · <b>'+summary.routines+'</b> routines · <b>'+summary.programs+'</b> programs<br>'+
      '<b>'+summary.customExercises+'</b> custom exercises · <b>'+summary.bodyweight+'</b> bodyweight entries'+
      (summary.activeWorkout?'<br><br><span class="mini">This snapshot contains an active workout draft.</span>':'')+
      '<br><br><span class="mini">Restoring replaces the current local Swole Cat state on this device. A local pre-restore safety snapshot will be created first so you can roll back.</span></div>'+
      '<div class="actions"><button class="btn danger" onclick="cloudConfirmRestoreFromUi()">Restore this backup</button><button class="btn secondary" onclick="cloudOpenRestorePickerFromUi()">Cancel</button></div>');
  }catch(error){
    alert('Could not verify that cloud backup: '+(error?.message||error));
  }
}
function cloudConfirmRestoreFromUi(){
  try{
    cloudApplyPreparedRestore();
    closeModal();
    showToast('Cloud backup restored');
    setTimeout(()=>alert('Cloud backup restored successfully. Your pre-restore local snapshot is available in Settings if you need to roll back.'),80);
  }catch(error){
    alert('Cloud backup was not restored: '+(error?.message||error));
  }
}

const swoleCatCloudBackupService=SwoleCatRuntime.registerService('cloudBackup',{
  snapshot:cloudBackupSnapshot,
  registerProvider:registerCloudBackupProvider,
  canUse:cloudBackupCanUse,
  list:cloudListBackups,
  backUpNow:cloudBackUpNow,
  maybeAuto:cloudMaybeAutoBackup,
  scheduleAuto:cloudScheduleAutoBackup,
  prepareRestore:cloudPrepareRestore,
  applyPreparedRestore:cloudApplyPreparedRestore
});

SwoleCatRuntime.events.addEventListener('identity:changed',event=>{
  const detail=event?.detail;
  if(!detail?.signedIn){
    swoleCatCloudRestoreCandidate=null;
    setCloudBackupState({status:'idle',backups:[],lastError:''});
    return;
  }
});

SwoleCatRuntime.events.addEventListener('identity:changed',event=>{
  if(event?.detail?.signedIn)cloudScheduleAutoBackup(9000);
});
SwoleCatRuntime.events.addEventListener('cloudSync:changed',event=>{
  if(event?.detail?.status==='ready')cloudScheduleAutoBackup(1200);
});
window.addEventListener('online',()=>cloudScheduleAutoBackup(1200));
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible')cloudScheduleAutoBackup(2500);
});
setInterval(()=>cloudScheduleAutoBackup(250),SWOLE_CAT_AUTO_BACKUP_CHECK_MS);
