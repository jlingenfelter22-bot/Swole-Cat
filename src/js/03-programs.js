const PROGRAM_DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
let programDraft=null;

/* Guided program phases are explicit, per-program and never inferred as a diagnosis. */
function programDeloadConfig(source){
 const d=source&&typeof source==='object'?source:{};
 return {enabled:d.enabled===true,intervalWeeks:Math.min(52,Math.max(2,Math.trunc(Number(d.intervalWeeks)||4))),
   decisions:d.decisions&&typeof d.decisions==='object'&&!Array.isArray(d.decisions)?{...d.decisions}:{},
   deferNext:d.deferNext===true,deferredFrom:typeof d.deferredFrom==='string'?d.deferredFrom:''};
}
function programWeekKey(value=new Date()){
 const d=new Date(value);if(!Number.isFinite(d.getTime()))return '';
 d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
function programDeloadContext(p,date=new Date()){
 const key=programWeekKey(date),deload=programDeloadConfig(p?.deload);
 const eligible=(state.sessions||[]).filter(s=>s.programId===p?.id&&(s.exercises||[]).some(e=>!e.skipped&&completedSets(e).length));
 const weeks=[...new Set(eligible.map(s=>s.programWeekKey||programWeekKey(s.date)).filter(Boolean))].sort();
 const weekIndex=weeks.filter(k=>k<=key).length+(weeks.includes(key)?0:1);
 const recorded=eligible.find(s=>(s.programWeekKey||programWeekKey(s.date))===key&&s.programPhase==='deload');
 const choice=deload.decisions[key];
 const enabled=p?.trainingMode==='guided'&&deload.enabled;
 const due=enabled&&(!weeks.includes(key)||recorded)&&(
   deload.deferNext&&deload.deferredFrom!==key||weekIndex%deload.intervalWeeks===0
 );
 const phase=enabled&&(choice==='deload'||recorded)?'deload':'normal';
 return {key,weekIndex,phase,due,needsReview:!!(due&&!choice&&!recorded),enabled,intervalWeeks:deload.intervalWeeks};
}
function programDeloadStatusHtml(p){
 const c=programDeloadContext(p);
 if(!c.enabled)return '';
 if(c.phase==='deload')return '<div class="program-deload-state is-deload">☾ DELOAD WEEK · Reduced training stress by choice</div>';
 if(c.needsReview)return '<div class="program-deload-state is-upcoming">☾ DELOAD DUE · Review before your next workout</div>';
 const at=((c.weekIndex-1)%c.intervalWeeks)+1;
 return '<div class="program-deload-state">TRAINING WEEK '+at+'/'+c.intervalWeeks+' · Deload every '+c.intervalWeeks+'th week</div>';
}
function reviewProgramDeload(p,index){
 const c=programDeloadContext(p);
 if(!c.needsReview)return false;
 openModal('Review your deload week',`
   <div class="program-deload-review"><div class="eyebrow">GUIDED PROGRESSIVE OVERLOAD · WEEK ${c.weekIndex}</div>
    <h3>Deload week is due</h3>
    <p>Your planned cycle has reached a lighter week. Deload workouts use fewer working sets, with conservative rep targets. Your normal progression baseline stays intact.</p>
    <div class="notice">This is optional and never a diagnosis of poor recovery. Choose what fits your training this week.</div>
    <div class="program-deload-choices">
     <button class="btn" onclick="chooseProgramDeload('${escAttr(p.id)}','deload',${index})">Begin deload week</button>
     <button class="btn secondary" onclick="chooseProgramDeload('${escAttr(p.id)}','defer',${index})">Train normally · Defer to next training week</button>
     <button class="btn secondary" onclick="chooseProgramDeload('${escAttr(p.id)}','skip',${index})">Skip this cycle's deload</button>
     <button class="btn secondary" onclick="closeModal()">Not now</button>
    </div>
   </div>`);
 return true;
}
function chooseProgramDeload(id,choice,index=null){
 const p=programById(id);if(!p||!['deload','defer','skip'].includes(choice))return;
 const context=programDeloadContext(p);if(!context.needsReview)return;
 p.deload=programDeloadConfig(p.deload);
 p.deload.decisions[context.key]=choice==='deload'?'deload':'normal';
 if(choice==='defer'){p.deload.deferNext=true;p.deload.deferredFrom=context.key}
 else {p.deload.deferNext=false;p.deload.deferredFrom=''}
 save();closeModal();renderPrograms();renderActiveProgramHome();
 startProgramWorkout(id,index);
}

function programById(id){return (state.programs||[]).find(p=>p.id===id)}
function activeProgram(){return programById(state.activeProgramId)}
function programRoutine(p,index){
 if(!p?.routineIds?.length)return null;
 const i=Math.max(0,Math.min(p.routineIds.length-1,Number(index)||0));
 return state.routines.find(r=>r.id===p.routineIds[i])||null;
}
function programNextRoutine(p){return programRoutine(p,p?.nextIndex||0)}

function programSessions(p){
 return derivedSessionData().sessionsByProgram.get(p.id)||[];
}
function programSlotLabel(index){return index<26?String.fromCharCode(65+index):String(index+1)}
function programDaysText(p){return p.preferredDays?.length?p.preferredDays.map(d=>PROGRAM_DAYS[d]).join(' / '):'Any days'}
function programRouteHtml(p){
 const next=Math.max(0,Math.min(Math.max(0,p.routineIds.length-1),Number(p.nextIndex)||0));
 return `<div class="program-route">${p.routineIds.map((id,i)=>{
   const r=state.routines.find(x=>x.id===id);
   return `<div class="program-step ${i===next?'next':''}"><span class="program-letter">${programSlotLabel(i)}</span><span>${esc(r?.name||'Missing routine')}</span></div>`;
 }).join('')}</div>`;
}
function openProgramCardMenu(id){
 const p=programById(id);if(!p)return;
 const isActive=state.activeProgramId===p.id;
 openModal('Program options',`
   <div class="routine-manage-summary">
     <div class="eyebrow">PROGRAM OPTIONS</div>
     <div class="routine-manage-title">${esc(p.name||'Program')}</div>
     <div class="mini">${p.routineIds.length} workout${p.routineIds.length===1?'':'s'} · ${p.frequency}×/week · ${esc(programDaysText(p))}</div>
   </div>
   <div class="routine-manage-actions">
     <button class="btn" onclick="closeModal();newProgram('${escAttr(p.id)}')">Edit Program</button>
     ${!isActive?`<button class="btn secondary" onclick="closeModal();activateProgram('${escAttr(p.id)}')">Set Active</button>`:''}
     <button class="btn secondary" onclick="closeModal();openCoachProgramAudit('${escAttr(p.id)}')">Coach Audit</button>
     <button class="btn secondary" onclick="closeModal();openProgramShare('${escAttr(p.id)}')">Share Program</button>
     <button class="btn danger" onclick="closeModal();deleteProgram('${escAttr(p.id)}')">Delete Program</button>
   </div>
 `);
}
function programCard(p){
 const isActive=state.activeProgramId===p.id,next=programNextRoutine(p),logs=programSessions(p),last=logs[0];
 return `<div class="card program-card ${isActive?'active-program':''}">
   <div class="program-card-head">
     <div class="grow"><div class="exercise-name">${esc(p.name)}</div><div class="mini">${p.routineIds.length} workout${p.routineIds.length===1?'':'s'} · ${p.frequency}×/week · ${esc(programDaysText(p))} · ${esc(programTrainingModeLabel(p.trainingMode))}</div></div>
     <button class="routine-manage-btn" onclick="openProgramCardMenu('${escAttr(p.id)}')" aria-label="Manage ${escAttr(p.name||'program')}">•••</button>
   </div>
   ${isActive?'<div class="program-status-row"><span class="tag">● ACTIVE</span></div>':''}
   ${programDeloadStatusHtml(p)}
   ${programRouteHtml(p)}
   <div class="program-card-meta">${next?`Next: <b>${esc(next.name)}</b>`:'Add a routine to start'}${last?` · Last: ${esc(last.routineName)} ${new Date(last.date).toLocaleDateString()}`:''} · ${logs.length} completed</div>
   <div class="program-card-actions">
     ${next?`<button class="btn small ${isActive?'green':''} program-start-btn" onclick="startProgramWorkout('${escAttr(p.id)}')">${state.activeWorkout?.programId===p.id?'Resume Program':'Start Next'}</button>`:''}
     <button class="btn small secondary program-edit-btn" onclick="newProgram('${escAttr(p.id)}')">Edit</button>
   </div>
 </div>`;
}
function renderPrograms(){
 const host=document.getElementById('programList');if(!host)return;
 host.innerHTML=state.programs.length?state.programs.map(programCard).join(''):`<div class="program-empty-compact"><div><b>No programs yet</b><div class="mini">When you want a multi-workout rotation, combine your saved routines into a program.</div></div><button class="btn small secondary" onclick="newProgram()">Create Program</button></div>`;
}
function renderActiveProgramHome(){
 const host=document.getElementById('activeProgramHome');if(!host)return;
 const p=activeProgram();
 if(!p){host.innerHTML='';return}
 const next=programNextRoutine(p),logs=programSessions(p),last=logs[0];
 host.innerHTML=`<div class="program-home">
   <div class="row">
    <div><div class="eyebrow">ACTIVE PROGRAM</div><div class="exercise-name" style="margin-top:5px">${esc(p.name)}</div><div class="mini" style="margin-top:4px">${p.frequency}×/week · ${esc(programDaysText(p))} · ${esc(programTrainingModeLabel(p.trainingMode))} · ${logs.length} program sessions</div></div>
    <span class="tag">PROGRAM</span>
   </div>
   ${programDeloadStatusHtml(p)}
   ${programRouteHtml(p)}
   <div class="row" style="margin-top:10px"><div><div class="mini">NEXT WORKOUT</div><b>${esc(next?.name||'No routine selected')}</b>${last?`<div class="mini" style="margin-top:3px">Last: ${esc(last.routineName)} · ${new Date(last.date).toLocaleDateString()}</div>`:''}</div>
   <div class="actions" style="margin:0">${next?`<button class="btn small green" onclick="startProgramWorkout('${p.id}')">${state.activeWorkout?.programId===p.id?'Resume':'Start Next'}</button>`:``}<button class="btn small secondary" onclick="openCoachProgramAudit('${p.id}')">Audit</button></div></div>
 </div>`;
}
function activateProgram(id){
 const p=programById(id);if(!p)return;
 state.activeProgramId=id;save();renderPrograms();renderActiveProgramHome();renderHome();showToast(`${p.name} is now active`);
}
function startProgramWorkout(programId,index=null){
 const p=programById(programId);if(!p||!p.routineIds.length){showToast('Add a routine to this program first');return}
 const targetIndex=index==null?Math.max(0,Math.min(p.routineIds.length-1,Number(p.nextIndex)||0)):Math.max(0,Math.min(p.routineIds.length-1,Number(index)||0));
 const rid=p.routineIds[targetIndex],r=state.routines.find(x=>x.id===rid);
 if(!r){showToast('That routine no longer exists');return}
 if(!state.activeWorkout&&reviewProgramDeload(p,targetIndex))return;
 if(state.activeProgramId!==programId){state.activeProgramId=programId;save()}
 if(state.activeWorkout?.routineId===rid&&!state.activeWorkout.programId){
   state.activeWorkout.programId=programId;
   state.activeWorkout.programWeekKey=programWeekKey(state.activeWorkout.startDate);
   state.activeWorkout.programWeekIndex=programDeloadContext(p,state.activeWorkout.startDate).weekIndex;
   state.activeWorkout.programPhase='normal';
   saveActiveWorkout();resumeActiveWorkout();showToast('Active workout attached to program');return;
 }
 openRoutine(rid,programId);
}
function advanceProgramAfterWorkout(session){
 const p=session?.programId?programById(session.programId):null;
 if(!p?.routineIds?.length)return;
 const idx=p.routineIds.indexOf(session.routineId);
 if(idx>=0)p.nextIndex=(idx+1)%p.routineIds.length;
}
function syncProgramDraftInputs(){
 if(!programDraft)return;
 const name=document.getElementById('programName'),freq=document.getElementById('programFrequency'),mode=document.getElementById('programTrainingMode');
 if(name)programDraft.name=name.value;
 if(freq)programDraft.frequency=Math.min(7,Math.max(1,Number(freq.value)||3));
 if(mode&&['','inherit','guided','strength','track'].includes(mode.value))programDraft.trainingMode=mode.value;
 programDraft.deload=programDeloadConfig(programDraft.deload);
 const enabled=document.getElementById('programDeloadEnabled');
 if(enabled)programDraft.deload.enabled=enabled.checked;
 const cadence=document.getElementById('programDeloadEvery');
 if(cadence){
  const custom=document.getElementById('programDeloadCustom');
  if(cadence.value==='custom'){
   const n=Number(custom?.value);
   if(Number.isInteger(n)&&n>=2&&n<=52)programDraft.deload.intervalWeeks=n;
  }else programDraft.deload.intervalWeeks=Math.min(52,Math.max(2,Number(cadence.value)||4));
 }
}
function changeProgramTrainingMode(value){
 syncProgramDraftInputs();
 programDraft.trainingMode=['inherit','guided','strength','track'].includes(value)?value:'';
 renderProgramEditor();
}
function toggleProgramDeload(){
 syncProgramDraftInputs();renderProgramEditor();
}
function changeProgramDeloadCadence(){
 const value=document.getElementById('programDeloadEvery')?.value;
 syncProgramDraftInputs();programDraft._customDeloadCadence=value==='custom';renderProgramEditor();
}
function newProgram(id=null){
 const existing=id?programById(id):null;
 if(!existing&&!activeRoutines().length){showToast('Create or restore a routine first');return}
 const nextId=existing?.routineIds?.[existing.nextIndex]||null;
 programDraft=existing?JSON.parse(JSON.stringify(existing)):{id:uid(),name:'',routineIds:[],frequency:3,preferredDays:[],trainingMode:'',nextIndex:0};
 if(existing)programDraft.trainingMode=normalizeProgramTrainingMode(programDraft.trainingMode);
 programDraft.deload=programDeloadConfig(programDraft.deload);
 programDraft._nextRoutineId=nextId;
 renderProgramEditor();
}
function renderProgramEditor(){
 if(!programDraft)return;
 const selected=programDraft.routineIds.map((id,i)=>({r:state.routines.find(x=>x.id===id),i})).filter(x=>x.r);
 const available=activeRoutines().filter(r=>!programDraft.routineIds.includes(r.id));
 const d=programDeloadConfig(programDraft.deload),guided=programDraft.trainingMode==='guided';
 const chosen=programDraft._customDeloadCadence?'custom':([3,4,5,6,7,8].includes(d.intervalWeeks)?String(d.intervalWeeks):'custom');
 openModal(programById(programDraft.id)?'Edit program':'New program',`
   <div class="field"><label>Program name</label><input id="programName" value="${escAttr(programDraft.name||'')}" placeholder="Full Body Program"></div>
   <div class="field"><label for="programTrainingMode">Program training mode · Required</label><select id="programTrainingMode" aria-label="Program training mode" onchange="changeProgramTrainingMode(this.value)">
    <option value="" ${!programDraft.trainingMode?'selected':''} disabled>Choose a training mode</option>
    <option value="inherit" ${programDraft.trainingMode==='inherit'?'selected':''}>Use each routine's mode</option>
    <option value="guided" ${guided?'selected':''}>Guided Progressive Overload</option>
    <option value="strength" ${programDraft.trainingMode==='strength'?'selected':''}>Strength Focus</option>
    <option value="track" ${programDraft.trainingMode==='track'?'selected':''}>Track Only / Standard Workout</option>
   </select>
   <div class="native-note" style="margin-top:6px">Select a training mode to continue. A program override applies only to workouts started through this program.</div>
   <div class="program-mode-validation" id="programModeValidation" role="status"></div></div>
   ${guided?`<div class="program-deload-config">
     <div class="eyebrow">GUIDED PROGRESSION · RECOVERY OPTIONS</div>
     <label class="program-deload-toggle"><input id="programDeloadEnabled" type="checkbox" ${d.enabled?'checked':''} onchange="toggleProgramDeload()">
       <span><b>Schedule deload weeks (optional)</b><small>Temporarily reduce training stress; normal progress is preserved.</small></span></label>
     ${d.enabled?`<div class="field"><label for="programDeloadEvery">Deload every Nth training week</label>
        <select id="programDeloadEvery" onchange="changeProgramDeloadCadence()">
        ${[3,4,5,6,7,8].map(n=>`<option value="${n}" ${chosen===String(n)?'selected':''}>Every ${n}th week</option>`).join('')}
        <option value="custom" ${chosen==='custom'?'selected':''}>Custom interval</option></select></div>
       ${chosen==='custom'?`<div class="field"><label>Custom training weeks (2–52)</label><input id="programDeloadCustom" type="number" min="2" max="52" value="${d.intervalWeeks}" onchange="syncProgramDraftInputs()"></div>`:''}
       <div class="program-deload-preview">Weeks 1–${d.intervalWeeks-1}: Normal training · Week ${d.intervalWeeks}: Deload · Then repeat</div>
       <div class="native-note">Four weeks is a suggested starting point, not a scientific requirement. You'll review and confirm each deload before it begins.</div>`:''}
    </div>`:''}
   <div class="form-grid">
     <div><label>Target days per week</label><input id="programFrequency" type="number" min="1" max="7" value="${programDraft.frequency||3}"></div>
     <div><label>Preferred days <span class="mini">(optional)</span></label><div class="day-picker">${PROGRAM_DAYS.map((d,i)=>`<button class="day-chip ${programDraft.preferredDays.includes(i)?'on':''}" onclick="toggleProgramDay(${i})">${d}</button>`).join('')}</div></div>
   </div>
   <div class="picker-section">Workout rotation</div>
   <div class="program-editor-list">
    ${selected.length?selected.map(({r,i})=>`<div class="program-editor-row">
      <div class="orderbox"><button class="orderbtn" onclick="moveProgramRoutine(${i},-1)" ${i===0?'disabled':''}>↑</button><button class="orderbtn" onclick="moveProgramRoutine(${i},1)" ${i===selected.length-1?'disabled':''}>↓</button></div>
      <div><div class="exercise-name"><span class="program-letter" style="display:inline-grid;margin-right:6px">${programSlotLabel(i)}</span>${esc(r.name)}</div><div class="mini">${r.exercises.length} exercises</div></div>
      <button class="btn small danger" onclick="removeProgramRoutine(${i})">Remove</button>
    </div>`).join(''):'<div class="empty">Add at least one routine below.</div>'}
   </div>
   ${available.length?`<div class="picker-section">Add routines</div><div class="card">${available.map(r=>`<div class="list-item"><div class="grow"><div class="exercise-name">${esc(r.name)}</div><div class="mini">${r.exercises.length} exercises</div></div><button class="btn small secondary" onclick="addProgramRoutine('${r.id}')">+ Add</button></div>`).join('')}</div>`:''}
   <div class="actions"><button class="btn" onclick="saveProgram()">Save Program</button><button class="btn secondary" onclick="programDraft=null;closeModal()">Cancel</button></div>
 `);
}

function toggleProgramDay(day){
 syncProgramDraftInputs();
 const i=programDraft.preferredDays.indexOf(day);
 if(i>=0)programDraft.preferredDays.splice(i,1);else programDraft.preferredDays.push(day);
 programDraft.preferredDays.sort((a,b)=>a-b);renderProgramEditor();
}
function moveProgramRoutine(index,dir){
 syncProgramDraftInputs();
 const ni=index+dir;if(ni<0||ni>=programDraft.routineIds.length)return;
 [programDraft.routineIds[index],programDraft.routineIds[ni]]=[programDraft.routineIds[ni],programDraft.routineIds[index]];
 renderProgramEditor();
}
function removeProgramRoutine(index){
 syncProgramDraftInputs();programDraft.routineIds.splice(index,1);renderProgramEditor();
}
function addProgramRoutine(routineId){
 syncProgramDraftInputs();if(!programDraft.routineIds.includes(routineId))programDraft.routineIds.push(routineId);renderProgramEditor();
}
function saveProgram(){
 if(!programDraft)return;syncProgramDraftInputs();
 const name=programDraft.name.trim()||'Untitled Program';
 if(!['inherit','guided','strength','track'].includes(programDraft.trainingMode)){
  const note=document.getElementById('programModeValidation');if(note)note.textContent='Choose a training mode before saving this program.';
  showToast('Choose a training mode');return;
 }
 if(!programDraft.routineIds.length){showToast('Add at least one routine');return}
 const existing=programById(programDraft.id);
 let nextIndex=0;
 const keepNext=programDraft._nextRoutineId;
 if(keepNext&&programDraft.routineIds.includes(keepNext))nextIndex=programDraft.routineIds.indexOf(keepNext);
 else if(existing)nextIndex=Math.min(Number(existing.nextIndex)||0,programDraft.routineIds.length-1);
 const deload=programDeloadConfig(programDraft.deload);
 if(programDraft.trainingMode!=='guided')deload.enabled=false;
 const saved={...existing,id:programDraft.id,name,routineIds:[...programDraft.routineIds],frequency:programDraft.frequency||3,preferredDays:[...programDraft.preferredDays],trainingMode:programDraft.trainingMode,nextIndex,deload};
 if(existing)state.programs=state.programs.map(p=>p.id===saved.id?saved:p);else state.programs.push(saved);
 if(!state.activeProgramId)state.activeProgramId=saved.id;
 programDraft=null;save();closeModal();renderPrograms();renderHome();showToast(existing?'Program updated':'Program created');
}
function deleteProgram(id){
 const p=programById(id);if(!p)return;
 if(state.activeWorkout?.programId===id){showToast('Finish or cancel the active program workout before deleting this program');return}
 confirmAction('Delete program?',`Delete "${p.name}"? Your routines and completed workout history will stay saved.`,()=>{
   state.programs=state.programs.filter(x=>x.id!==id);
   if(state.activeProgramId===id)state.activeProgramId=null;
   save();closeModal();renderPrograms();renderHome();showToast('Program deleted');
 });
}
