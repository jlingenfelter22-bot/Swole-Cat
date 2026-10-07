const SWOLE_CAT_UPDATE_MANIFESTS={
 testing:'https://raw.githubusercontent.com/jlingenfelter22-bot/Swole-Cat/main/updates/testing.json',
 beta:'https://raw.githubusercontent.com/jlingenfelter22-bot/Swole-Cat/beta/updates/beta.json'
};
const SWOLE_CAT_UPDATE_CHECK_KEY='swole_cat_update_check_v1';
const SWOLE_CAT_UPDATE_CHECK_INTERVAL=6*60*60*1000;

const appUpdaterState={
 status:'idle',
 error:'',
 native:null,
 release:null,
 downloaded:null,
 checkedAt:0
};

function appUpdaterPlugin(){
 return capacitorPlugin('SwoleCatUpdater');
}
function appUpdaterIsSupported(){
 return isNativeApp()&&nativePlatform()==='android'&&!!appUpdaterPlugin();
}
function appUpdaterManifestUrl(){
 const channel=appUpdaterState.native?.channel==='beta'?'beta':'testing';
 return SWOLE_CAT_UPDATE_MANIFESTS[channel]+'?ts='+Date.now();
}
function appUpdaterSnapshot(){
 return {
  ...appUpdaterState,
  updateAvailable:!!appUpdaterState.release?.available,
  activeWorkout:!!state.activeWorkout
 };
}
function appUpdaterChannelLabel(){
 const channel=appUpdaterState.native?.channel||'testing';
 return channel==='testing'?'Testing':'Beta';
}
function appUpdaterStatusText(){
 if(!appUpdaterIsSupported())return isNativeApp()?'Updater unavailable':'Web / PWA updates automatically';
 if(appUpdaterState.status==='checking')return 'Checking for updates…';
 if(appUpdaterState.status==='downloading')return 'Downloading and verifying…';
 if(appUpdaterState.status==='ready')return 'Verified update ready';
 if(appUpdaterState.status==='permission_required')return 'Android install permission required';
 if(appUpdaterState.status==='installer_started')return 'Android installer opened';
 if(appUpdaterState.status==='error')return 'Update check failed';
 if(appUpdaterState.release?.available)return 'Update available · v'+appUpdaterState.release.latestVersion;
 if(appUpdaterState.checkedAt)return 'Up to date';
 return 'Version '+APP_VERSION;
}
function appUpdateHubHtml(){
 return `
 <div class="card app-update-hub-card">
  <button type="button" class="cloud-hub-tile" onclick="openAppUpdates()">
   <span class="cloud-hub-kicker">APP</span>
   <b>App & updates</b>
   <span class="mini">${esc(appUpdaterStatusText())}</span>
   <span class="cloud-hub-arrow" aria-hidden="true">›</span>
  </button>
 </div>`;
}
function appUpdateErrorText(error){
 return String(error?.message||error||'Unknown updater error').replace(/^Error:\s*/,'');
}
async function loadAppUpdaterNativeStatus(){
 if(!appUpdaterIsSupported())return null;
 const plugin=appUpdaterPlugin();
 const native=await plugin.getStatus();
 appUpdaterState.native=native||null;
 return native;
}
async function checkForAppUpdate(options={}){
 const manual=options.manual!==false;
 if(!appUpdaterIsSupported()){
  appUpdaterState.status='unsupported';
  appUpdaterState.error='';
  if(manual)renderAppUpdatesModal();
  return null;
 }
 appUpdaterState.status='checking';
 appUpdaterState.error='';
 if(manual)renderAppUpdatesModal();
 try{
  await loadAppUpdaterNativeStatus();
  const release=await appUpdaterPlugin().checkForUpdate({manifestUrl:appUpdaterManifestUrl()});
  appUpdaterState.release=release||null;
  appUpdaterState.checkedAt=Date.now();
  appUpdaterState.status=release?.available?'available':'up_to_date';
  try{localStorage.setItem(SWOLE_CAT_UPDATE_CHECK_KEY,String(appUpdaterState.checkedAt))}catch(e){}
  if(manual)renderAppUpdatesModal();
  else if(release?.available&&!state.activeWorkout)showToast('Swole Cat '+appUpdaterChannelLabel()+' v'+release.latestVersion+' update available');
  return release;
 }catch(error){
  appUpdaterState.status='error';
  appUpdaterState.error=appUpdateErrorText(error);
  if(manual)renderAppUpdatesModal();
  return null;
 }
}
async function downloadAppUpdate(){
 if(state.activeWorkout){
  alert('Finish or cancel your active workout before downloading an app update. Your workout will not be interrupted by the updater.');
  return;
 }
 if(!appUpdaterState.release?.available){
  await checkForAppUpdate({manual:true});
  if(!appUpdaterState.release?.available)return;
 }
 appUpdaterState.status='downloading';
 appUpdaterState.error='';
 renderAppUpdatesModal();
 try{
  const downloaded=await appUpdaterPlugin().downloadUpdate({manifestUrl:appUpdaterManifestUrl()});
  appUpdaterState.downloaded=downloaded||null;
  await loadAppUpdaterNativeStatus();
  appUpdaterState.status=downloaded?.canRequestInstalls===false?'permission_required':'ready';
  renderAppUpdatesModal();
 }catch(error){
  appUpdaterState.status='error';
  appUpdaterState.error=appUpdateErrorText(error);
  renderAppUpdatesModal();
 }
}
async function openAppUpdateInstallPermission(){
 if(!appUpdaterIsSupported())return;
 try{
  await appUpdaterPlugin().openInstallPermission();
  showToast('Return here after Android allows installs from Swole Cat');
 }catch(error){
  appUpdaterState.status='error';
  appUpdaterState.error=appUpdateErrorText(error);
  renderAppUpdatesModal();
 }
}
async function refreshAppUpdateInstallPermission(){
 try{
  await loadAppUpdaterNativeStatus();
  appUpdaterState.status=appUpdaterState.native?.canRequestInstalls?'ready':'permission_required';
  renderAppUpdatesModal();
 }catch(error){
  appUpdaterState.status='error';
  appUpdaterState.error=appUpdateErrorText(error);
  renderAppUpdatesModal();
 }
}
async function installVerifiedAppUpdate(){
 if(state.activeWorkout){
  alert('Finish or cancel your active workout before installing an app update.');
  return;
 }
 if(!appUpdaterState.downloaded){
  await downloadAppUpdate();
  return;
 }
 try{
  await loadAppUpdaterNativeStatus();
  if(appUpdaterState.native?.canRequestInstalls===false){
   appUpdaterState.status='permission_required';
   renderAppUpdatesModal();
   return;
  }
  const result=await appUpdaterPlugin().installDownloadedUpdate();
  if(result?.status==='permission_required'){
   appUpdaterState.status='permission_required';
   renderAppUpdatesModal();
   return;
  }
  appUpdaterState.status='installer_started';
  renderAppUpdatesModal();
 }catch(error){
  appUpdaterState.status='error';
  appUpdaterState.error=appUpdateErrorText(error);
  renderAppUpdatesModal();
 }
}
function appUpdateActionHtml(){
 if(!appUpdaterIsSupported()){
  return '<div class="notice">In-app Android updates are available only in the installed Swole Cat Android app.</div>';
 }
 if(state.activeWorkout&&appUpdaterState.release?.available){
  return '<div class="notice"><b>Update waiting.</b><br>Finish or cancel the active workout first. Swole Cat never interrupts a workout with an app install.</div><div class="actions"><button class="btn secondary" onclick="checkForAppUpdate({manual:true})">Check again</button></div>';
 }
 if(appUpdaterState.status==='checking'){
  return '<div class="actions"><button class="btn secondary" disabled>Checking…</button></div>';
 }
 if(appUpdaterState.status==='downloading'){
  return '<div class="actions"><button class="btn secondary" disabled>Downloading & verifying…</button></div>';
 }
 if(appUpdaterState.status==='permission_required'){
  return '<div class="notice"><b>One Android permission is needed.</b><br>Android requires you to explicitly allow Swole Cat to request package installs. Swole Cat cannot bypass this approval.</div><div class="actions"><button class="btn" onclick="openAppUpdateInstallPermission()">Open Android settings</button><button class="btn secondary" onclick="refreshAppUpdateInstallPermission()">I allowed it</button></div>';
 }
 if(appUpdaterState.status==='ready'){
  return '<div class="notice update-ready"><b>Verified and ready.</b><br>The APK passed SHA-256, package-name, versionCode, and signing-certificate checks. Android will still ask you to approve the update.</div><div class="actions"><button class="btn" onclick="installVerifiedAppUpdate()">Install update</button></div>';
 }
 if(appUpdaterState.status==='installer_started'){
  return '<div class="notice update-ready"><b>Handed to Android.</b><br>Use Android\'s installer screen to approve the update. Swole Cat does not install silently.</div>';
 }
 if(appUpdaterState.release?.available){
  return '<div class="actions"><button class="btn" onclick="downloadAppUpdate()">Download & verify update</button><button class="btn secondary" onclick="checkForAppUpdate({manual:true})">Check again</button></div>';
 }
 return '<div class="actions"><button class="btn secondary" onclick="checkForAppUpdate({manual:true})">Check for updates</button></div>';
}
function renderAppUpdatesModal(){
 const native=appUpdaterState.native;
 const release=appUpdaterState.release;
 const installedVersion=native?.version||APP_VERSION;
 const installedCode=native?.versionCode??'—';
 const channel=native?.channel?appUpdaterChannelLabel():(isNativeApp()?'Android':'Web');
 const releaseHtml=release?.available?`
  <div class="app-update-release">
   <div class="eyebrow">UPDATE AVAILABLE</div>
   <h3>v${esc(release.latestVersion)} <span class="mini">Build ${esc(release.latestVersionCode)}</span></h3>
   <div class="mini">${esc(release.notes||'Testing release')}</div>
  </div>`:
  (appUpdaterState.checkedAt?'<div class="notice"><b>You are up to date.</b><br>No newer '+esc(channel)+' build is published.</div>':'');
 const errorHtml=appUpdaterState.error?'<div class="notice danger-note"><b>Updater error</b><br>'+esc(appUpdaterState.error)+'</div>':'';
 openModal('App & updates',`
  <div class="app-update-panel">
   <div class="card app-update-version-card">
    <div><span class="eyebrow">INSTALLED</span><b>Swole Cat ${esc(channel)}</b><span class="mini">Version ${esc(installedVersion)} · Build ${esc(installedCode)}</span></div>
    <span class="app-update-state">${esc(appUpdaterStatusText())}</span>
   </div>
   ${releaseHtml}
   ${errorHtml}
   ${appUpdateActionHtml()}
   <div class="native-note">Updates are never installed silently. Swole Cat verifies the package first, then Android controls the final install approval.</div>
   <div class="actions"><button class="btn secondary" onclick="openSettings()">Back to Settings</button></div>
  </div>
 `);
}
function openAppUpdates(){
 renderAppUpdatesModal();
 if(appUpdaterIsSupported()&&!appUpdaterState.checkedAt&&appUpdaterState.status!=='checking'){
  checkForAppUpdate({manual:true});
 }
}
async function maybeCheckForAppUpdate(){
 if(!appUpdaterIsSupported())return;
 let last=0;
 try{last=Number(localStorage.getItem(SWOLE_CAT_UPDATE_CHECK_KEY)||0)}catch(e){}
 if(Date.now()-last<SWOLE_CAT_UPDATE_CHECK_INTERVAL)return;
 await checkForAppUpdate({manual:false});
}

SwoleCatRuntime.registerService('appUpdater',{
 snapshot:appUpdaterSnapshot,
 check:options=>checkForAppUpdate(options),
 download:()=>downloadAppUpdate(),
 install:()=>installVerifiedAppUpdate()
});
