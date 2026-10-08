const LSKEY='overload_v3';
const APP_VERSION='__SWOLE_CAT_VERSION__';
const DATA_SCHEMA_VERSION=1;
const BACKUP_FORMAT='swole-cat-backup';
const BACKUP_FORMAT_VERSION=1;
const RECOVERYKEY='overload_v3_recovery_v1';
const IMPORTSNAPSHOTKEY='overload_v3_pre_import_v1';
const MAX_RECOVERY_SNAPSHOT_CHARS=1500000;
let storageWriteBlocked=false,startupStorageNotice='',recoveredFromSnapshot=false,recoverySnapshotWritten=false,lastStorageError='';

function freshState(){
 return {
   schemaVersion:DATA_SCHEMA_VERSION,
   meta:{lastBackupAt:null,lastSavedAt:null,lastMigrationAt:null},
   profile:{name:'',unit:'lb'},
   customExercises:[],
   routines:[],
   programs:[],
   activeProgramId:null,
   sessions:[],
   activeWorkout:null,
   favorites:[],
   exercisePreferences:{},
   bodyweight:[],
   ui:{onboardingDone:false,haptics:true,keepAwake:true},
   settings:{defaultMin:8,defaultMax:12,defaultSets:3,defaultIncrement:5,coachAliases:{}}
 };
}
function isPlainObject(v){return !!v&&typeof v==='object'&&!Array.isArray(v)}
function cloneData(v){return JSON.parse(JSON.stringify(v))}
function migrateState(saved){
 if(!isPlainObject(saved))throw new Error('Workout data is not a valid object.');
 const out=cloneData(saved);
 const rawVersion=out.schemaVersion==null?0:Number(out.schemaVersion);
 if(!Number.isInteger(rawVersion)||rawVersion<0)throw new Error('Workout data has an invalid schema version.');
 if(rawVersion>DATA_SCHEMA_VERSION)throw new Error(`This data was created by a newer Swole Cat data format (v${rawVersion}). Update the app before opening it.`);
 let version=rawVersion;
 if(version<1){
   out.schemaVersion=1;
   out.meta=isPlainObject(out.meta)?out.meta:{};
   out.meta.lastMigrationAt=new Date().toISOString();
   version=1;
 }
 out.schemaVersion=DATA_SCHEMA_VERSION;
 return out;
}
function validateStateShape(saved){
 if(!isPlainObject(saved))throw new Error('Backup does not contain a Swole Cat data object.');
 const arrayKeys=['customExercises','routines','programs','sessions','favorites','bodyweight'];
 for(const key of arrayKeys){
   if(saved[key]!=null&&!Array.isArray(saved[key]))throw new Error(`Backup field "${key}" is invalid.`);
 }
 if(saved.profile!=null&&!isPlainObject(saved.profile))throw new Error('Backup profile is invalid.');
 if(saved.settings!=null&&!isPlainObject(saved.settings))throw new Error('Backup settings are invalid.');
 if(saved.ui!=null&&!isPlainObject(saved.ui))throw new Error('Backup UI settings are invalid.');
 if(saved.exercisePreferences!=null&&!isPlainObject(saved.exercisePreferences))throw new Error('Backup exercise preferences are invalid.');
 const recognized=['profile','routines','sessions','settings','customExercises','ui','schemaVersion'];
 if(!recognized.some(k=>Object.prototype.hasOwnProperty.call(saved,k)))throw new Error('This file does not look like a Swole Cat backup.');
 return true;
}
function normalizeState(saved){
 validateStateShape(saved);
 saved=migrateState(saved);
 const base=freshState(),merged=Object.assign(base,saved);
 merged.schemaVersion=DATA_SCHEMA_VERSION;
 merged.meta=Object.assign(base.meta,isPlainObject(saved.meta)?saved.meta:{});
 merged.profile=Object.assign(base.profile,isPlainObject(saved.profile)?saved.profile:{});
 merged.settings=Object.assign(base.settings,isPlainObject(saved.settings)?saved.settings:{});
 merged.settings.coachAliases=isPlainObject(merged.settings.coachAliases)?merged.settings.coachAliases:{};
 merged.ui=Object.assign(base.ui,isPlainObject(saved.ui)?saved.ui:{});
 merged.customExercises=Array.isArray(saved.customExercises)?saved.customExercises:[];
 merged.routines=Array.isArray(saved.routines)?saved.routines:[];
 merged.sessions=Array.isArray(saved.sessions)?saved.sessions:[];
 merged.favorites=Array.isArray(saved.favorites)?saved.favorites:[];
 merged.bodyweight=Array.isArray(saved.bodyweight)?saved.bodyweight:[];
 merged.exercisePreferences=isPlainObject(saved.exercisePreferences)?saved.exercisePreferences:{};
 Object.keys(merged.exercisePreferences).forEach(id=>{
   const v=merged.exercisePreferences[id];
   if(!['prefer','avoid','hide'].includes(v))delete merged.exercisePreferences[id];
 });
 merged.programs=Array.isArray(saved.programs)?saved.programs:[];
 merged.activeProgramId=saved.activeProgramId||null;
 merged.routines.forEach(r=>{if(!Array.isArray(r.exercises))r.exercises=[];r.trainingMode=normalizeTrainingMode(r.trainingMode);r.description=typeof r.description==='string'?r.description:'';r.archivedAt=typeof r.archivedAt==='string'&&r.archivedAt?r.archivedAt:null});
 merged.programs.forEach(p=>{
   p.trainingMode=normalizeProgramTrainingMode(p.trainingMode);
   p.deload=programDeloadConfig(p.deload);
   p.routineIds=Array.isArray(p.routineIds)?p.routineIds.filter(id=>merged.routines.some(r=>r.id===id)):[];
   p.frequency=Math.min(7,Math.max(1,Number(p.frequency)||3));
   p.preferredDays=Array.isArray(p.preferredDays)?p.preferredDays.filter(d=>Number.isInteger(d)&&d>=0&&d<=6):[];
   p.nextIndex=Math.max(0,Math.min(Math.max(0,p.routineIds.length-1),Number(p.nextIndex)||0));
 });
 if(merged.activeProgramId&&!merged.programs.some(p=>p.id===merged.activeProgramId))merged.activeProgramId=null;
 if((merged.routines?.length||0)||(merged.sessions?.length||0))merged.ui.onboardingDone=true;
 merged.sessions.forEach(session=>{
   if(!Array.isArray(session.exercises))session.exercises=[];
   session.exercises.forEach(e=>{
     if(!Array.isArray(e.sets))e.sets=[];
     e.sets.forEach(set=>{set.type=set.type||'working'});
   });
 });
 if(merged.activeWorkout){
   if(!isPlainObject(merged.activeWorkout))merged.activeWorkout=null;
   else{
     merged.activeWorkout.status='active';
     merged.activeWorkout.lastSavedAt=merged.activeWorkout.lastSavedAt||merged.activeWorkout.startDate||new Date().toISOString();
     merged.activeWorkout.structureDirty=!!merged.activeWorkout.structureDirty;
     merged.activeWorkout.structureNoticeSeen=typeof merged.activeWorkout.structureNoticeSeen==='boolean'?merged.activeWorkout.structureNoticeSeen:merged.activeWorkout.structureDirty;
     merged.activeWorkout.trainingMode=normalizeTrainingMode(merged.activeWorkout.trainingMode);
     merged.activeWorkout.pausedDurationMs=Math.max(0,Number(merged.activeWorkout.pausedDurationMs)||0);
     merged.activeWorkout.pausedAt=typeof merged.activeWorkout.pausedAt==='string'&&merged.activeWorkout.pausedAt?merged.activeWorkout.pausedAt:null;
     if(!Array.isArray(merged.activeWorkout.exercises))merged.activeWorkout.exercises=[];
     merged.activeWorkout.exercises.forEach(e=>{
       e.supersetId=e.supersetId||null;
       e.config=isPlainObject(e.config)?e.config:{};
       e.config.routineMode=normalizeTrainingMode(e.config.routineMode||merged.activeWorkout.trainingMode);
       e.skipped=!!e.skipped;
       if(!Array.isArray(e.sets))e.sets=[];
       e.sets.forEach(set=>{set.type=set.type||'working'});
     });
   }
 }
 return merged;
}
function writeRecoverySnapshot(raw){
 if(recoverySnapshotWritten||!raw||raw.length>MAX_RECOVERY_SNAPSHOT_CHARS)return false;
 try{
   swoleCatStorage.setItem(RECOVERYKEY,JSON.stringify({savedAt:new Date().toISOString(),raw}));
   recoverySnapshotWritten=true;
   return true;
 }catch(e){return false}
}
function readRecoverySnapshot(){
 try{
   const box=JSON.parse(swoleCatStorage.getItem(RECOVERYKEY)||'null');
   if(!box||typeof box.raw!=='string')return null;
   return {savedAt:box.savedAt||null,state:normalizeState(JSON.parse(box.raw))};
 }catch(e){return null}
}
function load(){
 let raw='';
 try{raw=swoleCatStorage.getItem(LSKEY)||''}
 catch(e){
   storageWriteBlocked=true;
   lastStorageError=e?.message||String(e);
   startupStorageNotice='Swole Cat cannot access local device storage in this browser session. Your data has not been changed. Check browser storage/privacy settings before logging more workouts.';
   return freshState();
 }
 if(!raw)return freshState();
 try{
   const normalized=normalizeState(JSON.parse(raw));
   writeRecoverySnapshot(raw);
   return normalized;
 }catch(primaryError){
   const message=primaryError?.message||String(primaryError);
   if(message.includes('newer Swole Cat data format')){
     storageWriteBlocked=true;
     startupStorageNotice=message+' The existing local data has been left untouched.';
     lastStorageError=message;
     return freshState();
   }
   const recovered=readRecoverySnapshot();
   if(recovered){
     recoveredFromSnapshot=true;
     recoverySnapshotWritten=true;
     startupStorageNotice=`Swole Cat recovered your workout data from a last-known-good device snapshot${recovered.savedAt?` from ${new Date(recovered.savedAt).toLocaleString()}`:''}. Review your recent history, then export a backup.`;
     return recovered.state;
   }
   storageWriteBlocked=true;
   startupStorageNotice='Swole Cat could not safely read the local workout data on this device. The unreadable data has not been overwritten. Import a backup or explicitly erase the unreadable data to start fresh.';
   lastStorageError=message;
   return freshState();
 }
}
let state=load();
let stateRevision=0,pendingStateSave=false,pendingStateSaveTimer=null,pendingStateSaveSyncRelevant=true;
SwoleCatRuntime.registerService('state',{
 read(){return cloneData(state)},
 revision(){return stateRevision},
 requestSave(){return save()}
});
const navigationRenderRevision={home:-1,routines:-1,exercises:-1,history:-1,analytics:-1};
let derivedSessionCacheSource=null,derivedSessionCacheLength=-1,derivedSessionCache=null;
let exerciseCatalogCacheSource=null,exerciseCatalogCacheLength=-1,exerciseCatalogCache=null;
let navigationRefreshFrame=null;

function derivedSessionData(){
 const source=state.sessions;
 if(derivedSessionCache&&derivedSessionCacheSource===source&&derivedSessionCacheLength===source.length)return derivedSessionCache;
 const sessionsDesc=source.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 const sessionsByDate=new Map(),historyByExercise=new Map(),previousByExercise=new Map(),loggedExerciseIds=new Set(),sessionsByProgram=new Map(),sessionsByRoutine=new Map();
 sessionsDesc.forEach(session=>{
   const dateKey=localDateKey(session.date);
   if(dateKey){
     if(!sessionsByDate.has(dateKey))sessionsByDate.set(dateKey,[]);
     sessionsByDate.get(dateKey).push(session);
   }
   if(session.programId){
     if(!sessionsByProgram.has(session.programId))sessionsByProgram.set(session.programId,[]);
     sessionsByProgram.get(session.programId).push(session);
   }
   if(session.routineId){
     if(!sessionsByRoutine.has(session.routineId))sessionsByRoutine.set(session.routineId,[]);
     sessionsByRoutine.get(session.routineId).push(session);
   }
   (session.exercises||[]).forEach(e=>{
     const working=progressionSets(e),all=completedSets(e);
     if(all.length)loggedExerciseIds.add(e.exerciseId);
     if(session.programPhase!=='deload'&&working.length&&!previousByExercise.has(e.exerciseId))previousByExercise.set(e.exerciseId,{date:session.date,...e});
     if(!working.length)return;
     if(!historyByExercise.has(e.exerciseId))historyByExercise.set(e.exerciseId,[]);
     historyByExercise.get(e.exerciseId).push({date:session.date,routineName:session.routineName,programId:session.programId||null,programPhase:session.programPhase||'normal',sets:working,allSets:all,notes:e.notes||''});
   });
 });
 historyByExercise.forEach(rows=>rows.sort((a,b)=>String(a.date).localeCompare(String(b.date))));
 derivedSessionCache={sessionsDesc,sessionsByDate,sessionsByProgram,sessionsByRoutine,historyByExercise,previousByExercise,loggedExerciseIds};
 derivedSessionCacheSource=source;
 derivedSessionCacheLength=source.length;
 return derivedSessionCache;
}

function exerciseCatalog(){
 const source=state.customExercises;
 if(exerciseCatalogCache&&exerciseCatalogCacheSource===source&&exerciseCatalogCacheLength===source.length)return exerciseCatalogCache;
 const list=[...LIBRARY,...source],byId=new Map(list.map(ex=>[ex.id,ex]));
 exerciseCatalogCache={list,byId};
 exerciseCatalogCacheSource=source;
 exerciseCatalogCacheLength=source.length;
 return exerciseCatalogCache;
}
function queueNavigationRefresh(id){
 if(!Object.prototype.hasOwnProperty.call(navigationRenderRevision,id))return;
 if(navigationRenderRevision[id]===stateRevision)return;
 if(navigationRefreshFrame)cancelAnimationFrame(navigationRefreshFrame);
 navigationRefreshFrame=requestAnimationFrame(()=>{
   navigationRefreshFrame=null;
   if(activeViewId()===id)renderNavigationView(id);
 });
}
function scheduleStateSave(delay=220,syncRelevant=true){
 if(storageWriteBlocked)return false;
 if(!pendingStateSave)pendingStateSaveSyncRelevant=!!syncRelevant;
 else pendingStateSaveSyncRelevant=pendingStateSaveSyncRelevant||!!syncRelevant;
 pendingStateSave=true;
 if(pendingStateSaveTimer)clearTimeout(pendingStateSaveTimer);
 pendingStateSaveTimer=setTimeout(()=>flushPendingStateSave(),delay);
 return true;
}
function flushPendingStateSave(){
 if(pendingStateSaveTimer){clearTimeout(pendingStateSaveTimer);pendingStateSaveTimer=null}
 if(!pendingStateSave)return true;
 const syncRelevant=pendingStateSaveSyncRelevant;
 pendingStateSave=false;
 pendingStateSaveSyncRelevant=true;
 return save({syncRelevant});
}
function renderNavigationView(id){
 if(!Object.prototype.hasOwnProperty.call(navigationRenderRevision,id))return;
 if(navigationRenderRevision[id]===stateRevision)return;
 if(id==='home')renderHome();
 if(id==='routines')renderRoutines();
 if(id==='exercises')renderExercises();
 if(id==='history')renderHistory();
 if(id==='analytics')renderAnalytics();
 navigationRenderRevision[id]=stateRevision;
}

function save(options={}){
 if(storageWriteBlocked)return false;
 const syncRelevant=options?.syncRelevant!==false;
 if(pendingStateSaveTimer){clearTimeout(pendingStateSaveTimer);pendingStateSaveTimer=null}
 pendingStateSave=false;
 pendingStateSaveSyncRelevant=true;
 try{
   if(!recoverySnapshotWritten){
     const previous=swoleCatStorage.getItem(LSKEY);
     if(previous)writeRecoverySnapshot(previous);
   }
   state.schemaVersion=DATA_SCHEMA_VERSION;
   state.meta=isPlainObject(state.meta)?state.meta:{};
   state.meta.lastSavedAt=new Date().toISOString();
   const serialized=JSON.stringify(state);
   swoleCatStorage.setItem(LSKEY,serialized);
   stateRevision++;
   lastStorageError='';
   SwoleCatRuntime.events.dispatchEvent(new CustomEvent('state:saved',{detail:{revision:stateRevision,savedAt:state.meta.lastSavedAt,syncRelevant}}));
   return true;
 }catch(e){
   lastStorageError=e?.message||String(e);
   try{showToast('Could not save locally');}catch(_){}
   return false;
 }
}
function parseBackupText(text){
 let parsed;
 try{parsed=JSON.parse(text)}catch(e){throw new Error('The selected file is not valid JSON.')}
 let payload=parsed;
 if(isPlainObject(parsed)&&Object.prototype.hasOwnProperty.call(parsed,'format')){
   if(parsed.format!==BACKUP_FORMAT)throw new Error('This is not a Swole Cat backup.');
   if(Number(parsed.formatVersion||1)>BACKUP_FORMAT_VERSION)throw new Error('This backup format is newer than this version of Swole Cat.');
   payload=parsed.state;
 }
 return normalizeState(payload);
}
function createBackupEnvelope(exportedAt=new Date().toISOString(),recordLocal=true){
 state.schemaVersion=DATA_SCHEMA_VERSION;
 state.meta=isPlainObject(state.meta)?state.meta:{};
 if(recordLocal){
   state.meta.lastBackupAt=exportedAt;
   save();
 }
 return {format:BACKUP_FORMAT,formatVersion:BACKUP_FORMAT_VERSION,exportedAt,schemaVersion:DATA_SCHEMA_VERSION,state:cloneData(state)};
}
function createPreImportSnapshot(){
 try{
   const raw=swoleCatStorage.getItem(LSKEY);
   if(!raw)return true;
   swoleCatStorage.setItem(IMPORTSNAPSHOTKEY,JSON.stringify({savedAt:new Date().toISOString(),raw}));
   return true;
 }catch(e){
   lastStorageError=e?.message||String(e);
   return false;
 }
}
function preImportSnapshotInfo(){
 try{
   const box=JSON.parse(swoleCatStorage.getItem(IMPORTSNAPSHOTKEY)||'null');
   return box&&typeof box.raw==='string'?box:null;
 }catch(e){return null}
}
function restorePreImportSnapshot(){
 const box=preImportSnapshotInfo();
 if(!box){showToast('No pre-import snapshot available');return}
 confirmAction('Restore pre-import snapshot?',`This restores the local Swole Cat data saved before your last successful import${box.savedAt?` on ${new Date(box.savedAt).toLocaleString()}`:''}. Your current local state will be replaced.`,()=>{
   try{
     const restored=normalizeState(JSON.parse(box.raw));
     const current=state;
     state=restored;storageWriteBlocked=false;
     if(!save()){state=current;throw new Error(lastStorageError||'Local storage write failed.')}
     closeModal();renderHome();showToast('Pre-import snapshot restored');
   }catch(e){alert('Could not restore that snapshot: '+(e?.message||e))}
 });
}
function storageHealthText(){
 if(storageWriteBlocked)return 'Write protection active · unreadable local data preserved';
 if(lastStorageError)return 'Last local save failed: '+lastStorageError;
 return 'Local storage writable';
}
function clearUnreadableLocalData(){
 confirmAction('Erase unreadable local data?','Only use this if you do not have a backup you want to restore. The unreadable local Swole Cat record will be permanently replaced with a fresh empty state.',()=>{
   try{
     swoleCatStorage.removeItem(LSKEY);
     swoleCatStorage.removeItem(RECOVERYKEY);
     swoleCatStorage.removeItem(IMPORTSNAPSHOTKEY);
   }catch(e){}
   SwoleCatRuntime.getService('cloudSync')?.resetLocalMetadata?.();
   storageWriteBlocked=false;recoveredFromSnapshot=false;startupStorageNotice='';lastStorageError='';recoverySnapshotWritten=false;
   state=freshState();save();renderHome();populateMuscles();updateActiveWorkoutChrome();showToast('Started with fresh local data');setTimeout(onboarding,180);
 });
}
function openStartupStorageNotice(){
 if(!startupStorageNotice)return;
 if(storageWriteBlocked){
   openModal('Local data needs attention',`
     <div class="notice"><b>Swole Cat stopped before overwriting anything.</b><br><br>${esc(startupStorageNotice)}${lastStorageError?`<br><br><span class="mini">Details: ${esc(lastStorageError)}</span>`:''}</div>
     <div class="actions">
       <label class="btn" style="display:inline-block;margin:0">Import backup<input type="file" accept=".json,application/json" onchange="importBackup(this.files[0],this)" style="display:none"></label>
       <button class="btn secondary" onclick="closeModal();openSettings()">Open data safety</button>
       <button class="btn danger" onclick="clearUnreadableLocalData()">Erase & start fresh</button>
     </div>
   `);
 }else if(recoveredFromSnapshot){
   openModal('Workout data recovered',`
     <div class="notice">${esc(startupStorageNotice)}</div>
     <div class="actions"><button class="btn" onclick="exportBackup();closeModal()">Export a backup now</button><button class="btn secondary" onclick="closeModal()">Review first</button></div>
   `);
 }
}

let wakeLock=null,confirmCallback=null,toastTimer=null;
function haptic(pattern=20){
 if(state.ui?.haptics!==false && navigator.vibrate)navigator.vibrate(pattern);
}
function showToast(msg){
 const el=document.getElementById('toast');if(!el)return;
 el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>el.classList.remove('show'),1700);
}
function muscleChip(muscle){
 return `<span class="muscle-chip"><span class="muscle-dot"></span>${categoryIcon(muscle)} ${esc(muscle||'Other')}</span>`;
}
async function requestWakeLock(){
 if(state.ui?.keepAwake===false||!('wakeLock' in navigator))return;
 try{wakeLock=await navigator.wakeLock.request('screen');}catch(e){}
}
async function releaseWakeLock(){
 try{if(wakeLock)await wakeLock.release();}catch(e){} wakeLock=null;
}
function confirmAction(title,message,callback){
 confirmCallback=callback;
 openModal(title,`<div class="notice">${esc(message)}</div><div class="actions"><button class="btn danger" onclick="runConfirmedAction()">Confirm</button><button class="btn secondary" onclick="closeModal();confirmCallback=null">Cancel</button></div>`);
}
function runConfirmedAction(){
 const fn=confirmCallback;confirmCallback=null;closeModal();if(fn)fn();
}
function isNativeApp(){
 try{return !!window.Capacitor?.isNativePlatform?.()}catch(e){return false}
}
function nativePlatform(){
 try{return window.Capacitor?.getPlatform?.()||'web'}catch(e){return 'web'}
}
let appNavigationStack=['home'],nativeBackExitArmedUntil=0,nativeBehaviorReady=false;
function capacitorPlugin(name){
 try{return window.Capacitor?.Plugins?.[name]||null}catch(e){return null}
}
function syncViewportMetrics(){
 const h=Math.max(0,Math.round(window.visualViewport?.height||window.innerHeight||0));
 if(h)document.documentElement.style.setProperty('--sc-viewport-height',h+'px');
}
function scrollFocusedFieldIntoView(){
 const active=document.activeElement;
 if(active&&/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)){
   setTimeout(()=>{try{active.scrollIntoView({block:'center',behavior:'smooth'})}catch(e){}},60);
 }
}
async function configureNativeUi(){
 syncViewportMetrics();
 if(!isNativeApp()||nativePlatform()!=='android')return;
 const statusBar=capacitorPlugin('StatusBar');
 const keyboard=capacitorPlugin('Keyboard');
 try{await statusBar?.setStyle?.({style:'LIGHT'})}catch(e){}
 try{await statusBar?.setBackgroundColor?.({color:'#0b0e14'})}catch(e){}
 try{await statusBar?.setOverlaysWebView?.({overlay:true})}catch(e){}
 try{await keyboard?.setResizeMode?.({mode:'native'})}catch(e){}
 try{
   await keyboard?.addListener?.('keyboardWillShow',info=>{
     const height=Math.max(0,Number(info?.keyboardHeight)||0);
     document.documentElement.style.setProperty('--sc-keyboard-height',height+'px');
     document.body.classList.add('keyboard-open');
     scrollFocusedFieldIntoView();
   });
   await keyboard?.addListener?.('keyboardWillHide',()=>{
     document.documentElement.style.setProperty('--sc-keyboard-height','0px');
     document.body.classList.remove('keyboard-open');
   });
 }catch(e){}
}
function verifyDeviceStorageWritable(){
 if(storageWriteBlocked)return false;
 try{
   const key='__swole_cat_storage_probe__';
   swoleCatStorage.setItem(key,'ok');
   if(swoleCatStorage.getItem(key)!=='ok')throw new Error('Local storage probe could not be verified.');
   swoleCatStorage.removeItem(key);
   return true;
 }catch(e){
   storageWriteBlocked=true;
   lastStorageError=e?.message||String(e);
   startupStorageNotice='Swole Cat cannot safely write to its local device storage. Existing data has not been intentionally replaced. Free device storage or check app storage settings before logging more workouts.';
   return false;
 }
}
function recordAppNavigation(id,{history=true,replaceHistory=false,resetHistory=false}={}){
 if(resetHistory){appNavigationStack=[id];return}
 if(replaceHistory){
   if(appNavigationStack.length)appNavigationStack[appNavigationStack.length-1]=id;
   else appNavigationStack=[id];
   return;
 }
 if(!history)return;
 if(appNavigationStack[appNavigationStack.length-1]!==id)appNavigationStack.push(id);
 if(appNavigationStack.length>30)appNavigationStack=appNavigationStack.slice(-30);
}
function closeTransientUiForBack(){
 const selectOverlay=document.getElementById('appSelectOverlay');
 if(selectOverlay?.classList.contains('open')){closeAppSelect();return true}
 const modal=document.getElementById('modal');
 if(modal?.classList.contains('open')){
   confirmCallback=null;
   closeModal();
   return true;
 }
 const active=document.activeElement;
 if(active&&active!==document.body&&/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)){
   try{active.blur()}catch(e){}
   return true;
 }
 return false;
}
function navigateBackInApp(){
 const current=activeViewId();
 while(appNavigationStack.length>1&&appNavigationStack[appNavigationStack.length-1]===current)appNavigationStack.pop();
 const previous=appNavigationStack[appNavigationStack.length-1];
 if(previous&&previous!==current){
   go(previous,{history:false});
   return true;
 }
 if(current!=='home'){
   appNavigationStack=['home'];
   go('home',{history:false});
   return true;
 }
 return false;
}
function handleNativeBackButton(){
 if(closeTransientUiForBack())return;
 if(navigateBackInApp()){nativeBackExitArmedUntil=0;return}
 const appPlugin=capacitorPlugin('App');
 const now=Date.now();
 if(now<nativeBackExitArmedUntil){
   nativeBackExitArmedUntil=0;
   try{appPlugin?.exitApp?.()}catch(e){}
   return;
 }
 nativeBackExitArmedUntil=now+2000;
 showToast('Press back again to exit Swole Cat');
}
async function installNativeBehaviorHandlers(){
 if(nativeBehaviorReady||!isNativeApp()||nativePlatform()!=='android')return;
 const appPlugin=capacitorPlugin('App');
 if(!appPlugin?.addListener)return;
 nativeBehaviorReady=true;
 try{
   await appPlugin.addListener('backButton',()=>handleNativeBackButton());
   await appPlugin.addListener('appStateChange',({isActive})=>{
     if(!isActive){
       if(pendingStateSave)flushPendingStateSave();
       else if(state.activeWorkout)saveActiveWorkout();
       releaseWakeLock();
       nativeBackExitArmedUntil=0;
     }else{
       nativeBackExitArmedUntil=0;
       if(state.activeWorkout&&!state.activeWorkout.pausedAt)requestWakeLock();
       updateActiveWorkoutChrome();
     }
   });
 }catch(e){nativeBehaviorReady=false}
}
async function onboarding(){
 openModal('Welcome to Swole Cat',`
 <div class="onboard-hero"><div class="onboard-logo">🐱</div><div class="eyebrow">${isNativeApp()?'ANDROID · LOCAL. FAST. YOURS.':'LOCAL. FAST. YOURS.'}</div><h1 style="font-size:1.8rem;margin:7px 0">Train, log, progress.</h1><div class="muted">No account, no subscription, no cloud workout profile. Your training data stays on this device.</div></div>
 ${isNativeApp()?'<div class="notice"><b>Already use the Swole Cat PWA?</b><br>Android app storage is separate from the browser version. Export a backup from the PWA first, then import it here to bring over your routines, workouts, programs, PRs, preferences, and bodyweight history.</div>':''}
 <div class="onboard-step"><div class="num">1</div><div><b>Choose your path</b><div class="mini">Tell Coach Swolecat what you want to train, or build a workout manually if you already know exactly what you want.</div></div></div>
 <div class="onboard-step"><div class="num">2</div><div><b>Log what actually happened</b><div class="mini">Weight, reps, optional RIR, substitutions, rest timing, and notes.</div></div></div>
 <div class="onboard-step"><div class="num">3</div><div><b>Come back with context</b><div class="mini">Your previous numbers, workout recaps, muscle coverage, and progression history stay ready for the next session.</div></div></div>
 <div class="field"><label>Your name (optional)</label><input id="onName" value="${escAttr(state.profile.name||'')}" placeholder="Jake"></div>
 <div class="field"><label>Units</label><select id="onUnit"><option value="lb" ${state.profile.unit==='lb'?'selected':''}>Pounds (lb)</option><option value="kg" ${state.profile.unit==='kg'?'selected':''}>Kilograms (kg)</option></select></div>
 <div class="actions">
   ${isNativeApp()?'<label class="btn secondary" style="display:inline-block;margin:0">Import existing Swole Cat backup<input type="file" accept=".json,application/json" onchange="importBackup(this.files[0],this)" style="display:none"></label>':''}
   <button class="btn" onclick="finishOnboarding()">Enter Swolecat</button>
 </div>
 `);
}
function finishOnboarding(){
 state.profile.name=document.getElementById('onName').value.trim();
 state.profile.unit=document.getElementById('onUnit').value;
 state.ui.onboardingDone=true;save();closeModal();
 renderHome();showToast('You’re ready to train.');
}

function allExercises(){return exerciseCatalog().list;}
function exById(id){return exerciseCatalog().byId.get(id);}


function activeWorkoutCounts(w=state.activeWorkout){
 if(!w)return {total:0,done:0,pct:0,skipped:0,activeExercises:0};
 let total=0,done=0,skipped=0,activeExercises=0;
 for(const e of w.exercises||[]){
   if(e.skipped){skipped++;continue}
   activeExercises++;
   const sets=e.sets||[];
   total+=sets.length;
   for(const set of sets)if(set.done)done++;
 }
 return {total,done,pct:total?Math.round(done/total*100):0,skipped,activeExercises};
}
function markWorkoutStructureDirty(){
 if(!state.activeWorkout)return;
 const firstNotice=!state.activeWorkout.structureNoticeSeen;
 state.activeWorkout.structureDirty=true;
 state.activeWorkout.structureNoticeSeen=true;
 saveActiveWorkout();
 if(firstNotice){
   try{
     SwoleCatRuntime.events.dispatchEvent(new CustomEvent('workout:structure-changed',{detail:{workoutId:state.activeWorkout.id}}));
   }catch(e){}
 }
}
function saveActiveWorkout(defer=false,syncRelevant=true){
 if(state.activeWorkout){
   state.activeWorkout.status='active';
   state.activeWorkout.lastSavedAt=new Date().toISOString();
 }
 return defer?scheduleStateSave(220,syncRelevant):save({syncRelevant});
}
function saveActiveWorkoutWithoutExtendingPendingSave(delay=90,syncRelevant=false){
 if(state.activeWorkout){
   state.activeWorkout.status='active';
   state.activeWorkout.lastSavedAt=new Date().toISOString();
 }
 if(pendingStateSaveTimer){
   pendingStateSave=true;
   pendingStateSaveSyncRelevant=pendingStateSaveSyncRelevant||!!syncRelevant;
   return true;
 }
 return scheduleStateSave(delay,syncRelevant);
}
function workoutHeaderIcon(stateName){
 if(stateName==='pause'){
   return '<svg class="header-control-svg" data-icon="pause" viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="4" width="3.5" height="12" rx="1"/><rect x="11.5" y="4" width="3.5" height="12" rx="1"/></svg>';
 }
 return '<svg class="header-control-svg" data-icon="play" viewBox="0 0 20 20" aria-hidden="true"><path d="M6.2 4.2 15.2 10l-9 5.8z"/></svg>';
}
function activeViewId(){return document.querySelector('.view.active')?.id||'home'}
function updateActiveWorkoutChrome(){
 const btn=document.getElementById('resumeWorkoutBtn');
 if(!btn)return;
 if(!state.activeWorkout){
   btn.classList.remove('show');
   btn.removeAttribute('data-state');
   btn.removeAttribute('aria-label');
   btn.removeAttribute('title');
   btn.innerHTML='';
   return;
 }
 const counts=activeWorkoutCounts();
 const showPause=activeViewId()==='workout'&&!state.activeWorkout.pausedAt;
 const controlState=showPause?'pause':'resume';
 const verb=showPause?'Pause':'Resume';
 btn.dataset.state=controlState;
 btn.innerHTML=workoutHeaderIcon(controlState);
 btn.title=`${verb} ${state.activeWorkout.routineName} · ${counts.done} of ${counts.total} sets complete`;
 btn.setAttribute('aria-label',btn.title);
 btn.classList.add('show');
}
function pauseActiveWorkout(){
 const w=state.activeWorkout;
 if(!w){showToast('No active workout');return}
 if(!w.pausedAt)w.pausedAt=new Date().toISOString();
 saveActiveWorkout();
 stopRestTimer();
 releaseWakeLock();
 go('home',{replaceHistory:true});
 updateActiveWorkoutChrome();
 showToast('Workout paused');
}
function resumeActiveWorkout(){
 const w=state.activeWorkout;
 if(!w){showToast('No active workout');go('home');return}
 if(w.pausedAt){
   const pausedAt=new Date(w.pausedAt).getTime();
   if(Number.isFinite(pausedAt))w.pausedDurationMs=(Number(w.pausedDurationMs)||0)+Math.max(0,Date.now()-pausedAt);
   w.pausedAt=null;
 }
 saveActiveWorkout();
 requestWakeLock();
 renderWorkout();
 go('workout');
 updateActiveWorkoutChrome();
 showToast('Workout resumed');
}
function toggleActiveWorkoutControl(){
 if(!state.activeWorkout){showToast('No active workout');return}
 const shouldPause=activeViewId()==='workout'&&!state.activeWorkout.pausedAt;
 if(shouldPause)pauseActiveWorkout();
 else resumeActiveWorkout();
}
function activeSetsFromRoutineExercise(re,rec,ex){
 const working=Array.from({length:re.sets},(_,i)=>({
   weight:rec.weights?.[i]??rec.weight??0,
   reps:rec.targetReps?.[i]??re.minReps,
   done:false,rir:'',type:'working',pr:'',
   role:typeof coachAdaptiveSetRole==='function'?coachAdaptiveSetRole(re,i):'working',
   amrap:!!re.lastSetAmrap&&i===Math.max(0,re.sets-1)
 }));
 if(!re.autoWarmup||!ex||!COACH_COMPOUND_PATTERNS.has(ex.pattern))return working;
 const targetWeight=Number(rec.weights?.[0]??rec.weight??0);
 let warmups=warmupGuide(targetWeight,ex);
 if(!warmups.length&&ex.equipment!=='bodyweight'){
   warmups=[{weight:0,reps:8},{weight:0,reps:5}];
 }
 return [
   ...warmups.map(row=>({weight:row.weight,reps:row.reps,done:false,rir:'',type:'warmup',pr:'',amrap:false})),
   ...working
 ];
}
function startRoutineFresh(id,programId=null){
 const r=state.routines.find(x=>x.id===id); if(!r)return;
 const program=programId?programById(programId):null;
 const programMode=normalizeProgramTrainingMode(program?.trainingMode);
 const effectiveMode=programMode!=='inherit'?normalizeTrainingMode(programMode):normalizeTrainingMode(r.trainingMode);
 const now=new Date().toISOString();
 const weekContext=program?programDeloadContext(program,now):null;
 if(weekContext?.needsReview){reviewProgramDeload(program,Math.max(0,program.routineIds.indexOf(id)));return}
 const isDeload=effectiveMode==='guided'&&weekContext?.phase==='deload';
 const active={
   id:uid(),routineId:id,routineName:r.name,trainingMode:effectiveMode,programId:programId||null,
   programPhase:isDeload?'deload':'normal',programWeekKey:weekContext?.key||null,programWeekIndex:weekContext?.weekIndex||null,startDate:now,status:'active',lastSavedAt:now,structureDirty:false,structureNoticeSeen:false,pausedAt:null,pausedDurationMs:0,focusExerciseIndex:0,focusSetIndex:0,deferredExerciseIndexes:[],
   exercises:r.exercises.map((re,routineIndex)=>{
     const prev=previousExercise(re.exerciseId,programId);
     const mode=effectiveMode,normalConfig={trainingGoal:'general',resetPercent:7.5,...re,routineMode:mode,mode:re.mode==='range'?'double':re.mode};
     const reducedSets=isDeload?Math.max(1,Math.ceil((Number(re.sets)||1)/2)):Math.max(1,Number(re.sets)||1);
     const config=isDeload?{...normalConfig,sets:reducedSets,setStructure:null,adaptiveProgression:false}:normalConfig;
     const normalRec=buildRecommendation(normalConfig,prev,re.exerciseId);
     const priorWorking=progressionSets(prev);
     const rec=isDeload?{
       status:'deload',
       weights:Array.from({length:reducedSets},(_,i)=>Number(priorWorking[i]?.weight??priorWorking[0]?.weight??0)),
       targetReps:Array(reducedSets).fill(Math.max(1,Number(config.minReps)||8)),
       weight:Number(priorWorking[0]?.weight)||0,
       headline:'Deload · Fewer working sets',
       detail:'Lighter training stress by design. Performance from this week will not lower your normal progression baseline.'
     }:normalRec;
     return {exerciseId:re.exerciseId,routineIndex,config,targetOverride:null,supersetId:re.supersetGroup||null,skipped:false,expanded:routineIndex===0,sets:activeSetsFromRoutineExercise({...re,sets:reducedSets,setStructure:config.setStructure},rec,exById(re.exerciseId)),notes:''};
   })
 };
 state.activeWorkout=active;
 saveActiveWorkout();
 updateActiveWorkoutChrome();
 requestWakeLock();haptic([20,35,20]);renderWorkout();go('workout');showToast('Workout started');
}
function discardActiveAndStart(id,programId=null){
 const next=state.routines.find(x=>x.id===id);if(!next)return;
 const oldName=state.activeWorkout?.routineName||'current workout';
 closeModal();
 confirmAction('Discard active workout?',`This permanently deletes the active ${oldName} draft and starts ${next.name}. Completed history is not affected.`,()=>{
   state.activeWorkout=null;save();updateActiveWorkoutChrome();startRoutineFresh(id,programId);
 });
}

function go(id,options={}){
 haptic(8);
 const target=document.getElementById(id);if(!target)return;
 const previous=activeViewId();
 document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
 target.classList.add('active');
 if(previous!==id)recordAppNavigation(id,options);
 document.querySelectorAll('.navbtn').forEach(b=>{const on=b.dataset.go===id;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 // First visit needs content immediately. Revisits paint cached DOM first, then refresh
 // stale data on the next frame so taps are never blocked by rendering or storage.
 if(navigationRenderRevision[id]<0)renderNavigationView(id);
 else queueNavigationRefresh(id);
 updateActiveWorkoutChrome();
 window.scrollTo({top:0,behavior:'auto'});
}

