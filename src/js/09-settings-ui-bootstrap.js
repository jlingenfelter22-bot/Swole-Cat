function convertStoredUnits(fromUnit,toUnit){
 if(fromUnit===toUnit)return;
 const factor=fromUnit==='lb'&&toUnit==='kg'?0.45359237:
              fromUnit==='kg'&&toUnit==='lb'?2.2046226218:1;
 const cv=v=>Math.round((Number(v)||0)*factor*100)/100;
 state.settings.defaultIncrement=cv(state.settings.defaultIncrement);
 state.routines.forEach(r=>r.exercises.forEach(e=>{e.increment=cv(e.increment)}));
 state.sessions.forEach(s=>s.exercises.forEach(e=>e.sets.forEach(set=>{set.weight=cv(set.weight)})));
 state.sessions=[...state.sessions];
 (state.bodyweight||[]).forEach(x=>{x.value=cv(x.value)});
 if(state.activeWorkout){
   state.activeWorkout.exercises.forEach(e=>{
     e.config.increment=cv(e.config.increment);
     e.sets.forEach(set=>{set.weight=cv(set.weight)});
     if(e.targetOverride)e.targetOverride.weight=cv(e.targetOverride.weight);
   });
 }
}

function openSettings(){
 openModal('Settings & backup',`
 <div class="field"><label>Your name</label><input id="pName" value="${escAttr(state.profile.name||'')}" placeholder="Jake"></div>
 <div class="field"><label>Units</label><select id="pUnit"><option value="lb" ${state.profile.unit==='lb'?'selected':''}>Pounds (lb)</option><option value="kg" ${state.profile.unit==='kg'?'selected':''}>Kilograms (kg)</option></select><div class="native-note" style="margin-top:6px">Changing units converts your stored workout weights, bodyweight entries, and progression increments.</div></div>
 <div class="form-grid three">
   <div><label>Default sets</label><input type="number" id="dSets" value="${state.settings.defaultSets}"></div>
   <div><label>Min reps</label><input type="number" id="dMin" value="${state.settings.defaultMin}"></div>
   <div><label>Max reps</label><input type="number" id="dMax" value="${state.settings.defaultMax}"></div>
 </div>
 <div class="field"><label>Default weight jump</label><input type="number" step=".5" id="dInc" value="${state.settings.defaultIncrement}"></div>
 <div class="section-title"><h2>App feel</h2></div>
 <div class="card">
   <div class="setting-toggle"><div><b>Haptic feedback</b><div class="mini">Short vibrations for completed sets, PRs, and timers.</div></div><button id="hapticToggle" class="toggle ${state.ui?.haptics!==false?'on':''}" onclick="this.classList.toggle('on')"></button></div>
   <div class="setting-toggle" style="border-bottom:0"><div><b>Keep screen awake</b><div class="mini">Ask Android to keep the screen awake during an active workout when supported.</div></div><button id="awakeToggle" class="toggle ${state.ui?.keepAwake!==false?'on':''}" onclick="this.classList.toggle('on')"></button></div>
 </div>
 <div class="actions"><button class="btn" onclick="saveSettings()">Save settings</button></div>
 <div class="section-title"><h2>Coach behavior</h2></div>
 <div class="notice">The coach uses repeated logged performance, your optional RIR entries, and each exercise's selected goal. Stall and reset flags are intentionally conservative. They are suggestions, and manual session targets always remain available.</div>
 <div class="section-title"><h2>Cloud account</h2></div>
 ${cloudSettingsHtml()}\n <div class="section-title"><h2>Cloud backup</h2></div>\n ${cloudBackupSettingsHtml()}
 <div class="section-title"><h2>Data safety</h2></div>
 <div class="notice"><b>Progression rule:</b> Double progression is rep-driven. Add reps first, then one configured load step after every programmed working set reaches the top of its rep range. Optional RIR never blocks that earned load increase.<br><br><b>App:</b> ${isNativeApp()?'Android package':'Web / PWA'}<br><b>Version:</b> ${esc(APP_VERSION)}<br><b>Storage:</b> ${esc(storageHealthText())}<br><b>Data schema:</b> v${DATA_SCHEMA_VERSION}<br><b>Last exported backup:</b> ${state.meta?.lastBackupAt?new Date(state.meta.lastBackupAt).toLocaleString():'Never on this device'}</div>
 <div class="actions"><button class="btn secondary" onclick="exportBackup()">Export backup</button><label class="btn secondary" style="display:inline-block;margin:0">Import backup<input type="file" accept=".json,application/json" onchange="importBackup(this.files[0],this)" style="display:none"></label>${preImportSnapshotInfo()?'<button class="btn secondary" onclick="restorePreImportSnapshot()">Restore pre-import snapshot</button>':''}</div>
 <div class="native-note" style="margin-top:8px">Imports are validated before replacing your current state. A safety snapshot is created before every successful import so you can roll back if you picked the wrong file.</div>
 <div class="section-title"><h2>Exercise illustrations</h2></div>
 <div class="notice">Exercise thumbnail illustrations are provided by <a href="https://github.com/bryllim/workout-guide" target="_blank" rel="noopener">Workout Guide by Bryl Lim</a>, based in part on Everkinetic artwork, and are licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>. Swole Cat presents the licensed movement artwork as compact retro-futurist training-schematic thumbnails.</div>
 <div class="actions"><button class="btn danger" onclick="resetAll()">Erase all local data</button></div>
 `);
}
function saveSettings(){
 if(storageWriteBlocked){alert('Settings cannot be saved while local storage write protection is active. Restore a backup or resolve the storage issue first.');return}
 const before=cloneData(state);
 const oldUnit=state.profile.unit;
 const newUnit=document.getElementById('pUnit').value;
 state.profile.name=document.getElementById('pName').value.trim();
 state.settings.defaultSets=Math.max(1,+document.getElementById('dSets').value||3);
 state.settings.defaultMin=Math.max(1,+document.getElementById('dMin').value||8);
 state.settings.defaultMax=Math.max(state.settings.defaultMin,+document.getElementById('dMax').value||12);
 state.settings.defaultIncrement=Math.max(0,+document.getElementById('dInc').value||5);
 state.ui.haptics=document.getElementById('hapticToggle').classList.contains('on');
 state.ui.keepAwake=document.getElementById('awakeToggle').classList.contains('on');
 if(newUnit!==oldUnit)convertStoredUnits(oldUnit,newUnit);
 state.profile.unit=newUnit;
 if(!save()){
   state=normalizeState(before);
   alert('Settings were not saved because local storage failed: '+(lastStorageError||'unknown storage error'));
   return;
 }
 haptic(15);closeModal();renderHome();showToast(newUnit!==oldUnit?`Converted workout data to ${newUnit}`:'Settings saved');
}
async function exportBackup(){
 if(storageWriteBlocked){
   alert('Backup export is paused because Swole Cat could not safely read the primary local data. Import a known-good backup or resolve the storage issue first so an empty/recovered-looking file is not mistaken for your real history.');
   return;
 }
 try{
   const exportedAt=new Date().toISOString();
   const envelope=createBackupEnvelope(exportedAt);
   const json=JSON.stringify(envelope,null,2);
   const filename='swole-cat-backup-'+exportedAt.slice(0,10)+'.json';
   if(isNativeApp()&&nativePlatform()==='android'){
     const filesystem=capacitorPlugin('Filesystem');
     const share=capacitorPlugin('Share');
     if(filesystem?.writeFile&&share?.share){
       const saved=await filesystem.writeFile({path:filename,data:json,directory:'CACHE',encoding:'utf8'});
       const uri=saved?.uri;
       if(uri){
         let canShare=true;
         try{canShare=(await share.canShare?.())?.value!==false}catch(e){}
         if(canShare){
           await share.share({title:'Swole Cat backup',dialogTitle:'Save or share Swole Cat backup',files:[uri]});
           showToast('Backup ready to save or share');
           return;
         }
       }
     }
   }
   const blob=new Blob([json],{type:'application/json'});
   const a=document.createElement('a');
   a.href=URL.createObjectURL(blob);
   a.download=filename;
   a.click();
   setTimeout(()=>URL.revokeObjectURL(a.href),500);
   showToast('Backup exported');
 }catch(e){alert('Could not export backup: '+(e?.message||e))}
}
function importBackup(file,input=null){
 if(!file)return;
 const r=new FileReader();
 r.onerror=()=>{if(input)input.value='';alert('That backup file could not be read.');};
 r.onload=()=>{
   let candidate;
   try{candidate=parseBackupText(String(r.result||''))}
   catch(e){if(input)input.value='';alert('Backup not imported: '+(e?.message||e));return}
   if(!createPreImportSnapshot()){
     if(input)input.value='';
     alert('Import canceled because Swole Cat could not create the required safety snapshot. Free some device storage, then try again.');
     return;
   }
   const oldState=state,oldBlocked=storageWriteBlocked;
   try{
     state=candidate;
     storageWriteBlocked=false;
     recoverySnapshotWritten=false;
     if(!save())throw new Error(lastStorageError||'Local storage write failed.');
     closeModal();
     renderHome();populateMuscles();updateActiveWorkoutChrome();
     if(input)input.value='';
     alert('Backup imported successfully. Your pre-import snapshot is available in Settings if you need to roll back.');
   }catch(e){
     state=oldState;storageWriteBlocked=oldBlocked;
     if(input)input.value='';
     alert('Backup not imported: '+(e?.message||e));
   }
 };
 r.readAsText(file);
}
function resetAll(){closeModal();confirmAction('Erase all local data?','This permanently removes every workout, routine, custom exercise, favorite, bodyweight entry, setting, recovery snapshot, and pre-import snapshot stored by Swole Cat on this device.',()=>{
 try{swoleCatStorage.removeItem(LSKEY);swoleCatStorage.removeItem(RECOVERYKEY);swoleCatStorage.removeItem(IMPORTSNAPSHOTKEY)}catch(e){}
 storageWriteBlocked=false;recoveredFromSnapshot=false;startupStorageNotice='';lastStorageError='';recoverySnapshotWritten=false;
 state=freshState();save();renderHome();showToast('Local data erased');setTimeout(onboarding,250);
});}


let activeAppSelect=null,activeAppSelectTrigger=null;

function appSelectFieldLabel(select){
 const aria=select?.getAttribute('aria-label');
 if(aria)return aria;
 const field=select?.closest('.field,.live-input-wrap,.set-type-field');
 const label=field?.querySelector('label');
 if(label?.textContent?.trim())return label.textContent.trim();
 const parentLabel=select?.parentElement?.querySelector(':scope > label');
 return parentLabel?.textContent?.trim()||'Choose an option';
}
function selectedOptionLabel(select){
 const option=select?.options?.[select.selectedIndex];
 return option?.textContent?.trim()||'Choose';
}
function syncAppSelect(select){
 if(!select?.dataset?.appSelectReady)return;
 const wrap=select.closest('.app-select-wrap');
 const trigger=wrap?.querySelector('.app-select-trigger');
 if(!trigger)return;
 trigger.querySelector('.app-select-value').textContent=selectedOptionLabel(select);
 trigger.disabled=!!select.disabled;
 trigger.setAttribute('aria-label',appSelectFieldLabel(select)+': '+selectedOptionLabel(select));
 const type=String(select.value||'').toLowerCase();
 wrap.dataset.value=type;
 trigger.dataset.value=type;
}
function enhanceAppSelect(select){
 if(!select||select.dataset.appSelectReady==='1')return;
 select.dataset.appSelectReady='1';
 const wrap=document.createElement('div');
 wrap.className='app-select-wrap'+(select.classList.contains('set-type-select')?' app-select-compact':'');
 const trigger=document.createElement('button');
 trigger.type='button';
 trigger.className='app-select-trigger';
 trigger.setAttribute('aria-haspopup','listbox');
 trigger.innerHTML='<span class="app-select-value"></span><span class="app-select-chevron" aria-hidden="true"></span>';
 select.parentNode.insertBefore(wrap,select);
 wrap.appendChild(select);
 wrap.appendChild(trigger);
 select.classList.add('app-select-source');
 trigger.addEventListener('click',()=>openAppSelect(select,trigger));
 select.addEventListener('change',()=>syncAppSelect(select));
 const observer=new MutationObserver(()=>syncAppSelect(select));
 observer.observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected']});
 syncAppSelect(select);
}
function enhanceAppSelects(root=document){
 if(root?.matches?.('select'))enhanceAppSelect(root);
 root?.querySelectorAll?.('select').forEach(enhanceAppSelect);
}
function openAppSelect(select,trigger){
 if(!select||select.disabled)return;
 activeAppSelect=select;activeAppSelectTrigger=trigger;
 const overlay=document.getElementById('appSelectOverlay');
 const title=document.getElementById('appSelectTitle');
 const list=document.getElementById('appSelectOptions');
 title.textContent=appSelectFieldLabel(select);
 list.innerHTML='';
 Array.from(select.options).forEach((option,index)=>{
   const btn=document.createElement('button');
   btn.type='button';
   btn.className='app-select-option'+(index===select.selectedIndex?' selected':'');
   btn.disabled=option.disabled;
   btn.setAttribute('role','option');
   btn.setAttribute('aria-selected',index===select.selectedIndex?'true':'false');
   const text=document.createElement('span');
   text.className='app-select-option-text';
   text.textContent=option.textContent;
   const mark=document.createElement('span');
   mark.className='app-select-option-mark';
   mark.setAttribute('aria-hidden','true');
   mark.innerHTML='<svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-9"/></svg>';
   btn.append(text,mark);
   btn.addEventListener('click',()=>chooseAppSelect(index));
   list.appendChild(btn);
 });
 overlay.classList.add('open');
 document.body.classList.add('app-select-open');
 requestAnimationFrame(()=>list.querySelector('.selected')?.scrollIntoView({block:'nearest'}));
}
function chooseAppSelect(index){
 const select=activeAppSelect;if(!select)return;
 const option=select.options[index];if(!option||option.disabled)return;
 select.selectedIndex=index;
 syncAppSelect(select);
 select.dispatchEvent(new Event('change',{bubbles:true}));
 closeAppSelect();
}
function closeAppSelect(){
 const overlay=document.getElementById('appSelectOverlay');
 overlay?.classList.remove('open');
 document.body.classList.remove('app-select-open');
 const trigger=activeAppSelectTrigger;
 activeAppSelect=null;activeAppSelectTrigger=null;
 if(trigger&&document.contains(trigger))setTimeout(()=>trigger.focus(),0);
}
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&document.getElementById('appSelectOverlay')?.classList.contains('open')){
   e.preventDefault();closeAppSelect();
 }
});
const appSelectObserver=new MutationObserver(records=>{
 records.forEach(record=>record.addedNodes.forEach(node=>{
   if(node.nodeType===1)enhanceAppSelects(node);
 }));
});
appSelectObserver.observe(document.body,{childList:true,subtree:true});

function resetModalModeClasses(modal){
 if(!modal)return;
 Array.from(modal.classList).filter(cls=>cls.startsWith('modal-mode-')).forEach(cls=>modal.classList.remove(cls));
}
function openModal(title,body,modeClass=''){
 const modal=document.getElementById('modal');
 resetModalModeClasses(modal);
 if(modeClass)modal.classList.add(modeClass);
 document.getElementById('modalTitle').innerHTML=title;
 document.getElementById('modalBody').innerHTML=body;
 modal.classList.add('open');
 enhanceAppSelects(document.getElementById('modalBody'));
}
function closeModal(){
 closeAppSelect();
 const modal=document.getElementById('modal');
 modal.classList.remove('open');
 resetModalModeClasses(modal);
}
function uid(){return 'id_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function escAttr(s){return esc(s)}

document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='hidden'){
   if(pendingStateSave)flushPendingStateSave();
   else if(state.activeWorkout)saveActiveWorkout();
 }else if(state.activeWorkout)requestWakeLock();
});
window.addEventListener('pagehide',()=>{if(pendingStateSave)flushPendingStateSave();else if(state.activeWorkout)saveActiveWorkout()});
window.addEventListener('beforeunload',()=>{if(pendingStateSave)flushPendingStateSave();else if(state.activeWorkout)saveActiveWorkout()});
const sourceRuntimeMode=!!document.querySelector('script[src^="./src/"]');
if('serviceWorker' in navigator&&!isNativeApp()&&!sourceRuntimeMode){
 let swRefreshing=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
   if(swRefreshing)return;
   swRefreshing=true;
   window.location.reload();
 });
 window.addEventListener('load',async()=>{
   try{
     const reg=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
     await reg.update();
     if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
   }catch(e){}
 });
}
document.body.classList.toggle('native-app',isNativeApp());
document.documentElement.classList.toggle('native-app',isNativeApp());
syncViewportMetrics();
window.visualViewport?.addEventListener?.('resize',syncViewportMetrics,{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(syncViewportMetrics,120),{passive:true});
enhanceAppSelects(document);
verifyDeviceStorageWritable();
renderNavigationView('home');populateMuscles();updateActiveWorkoutChrome();
SwoleCatRuntime.events.dispatchEvent(new CustomEvent('app:ready',{detail:{version:APP_VERSION}}));
installNativeBehaviorHandlers();
configureNativeUi();
if(startupStorageNotice){
 setTimeout(openStartupStorageNotice,180);
} else if(state.activeWorkout){
 saveActiveWorkout();
 showToast('Active workout restored');
} else if(!state.ui?.onboardingDone){
 setTimeout(onboarding,180);
}