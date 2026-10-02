const PROGRAM_DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
let programDraft=null;

function programById(id){return (state.programs||[]).find(p=>p.id===id)}
function activeProgram(){return programById(state.activeProgramId)}
function programRoutine(p,index){
 if(!p?.routineIds?.length)return null;
 const i=Math.max(0,Math.min(p.routineIds.length-1,Number(index)||0));
 return state.routines.find(r=>r.id===p.routineIds[i])||null;
}
function programNextRoutine(p){return programRoutine(p,p?.nextIndex||0)}
function programSessions(p){
 return state.sessions.filter(s=>s.programId===p.id).sort((a,b)=>b.date.localeCompare(a.date));
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
function programCard(p){
 const isActive=state.activeProgramId===p.id,next=programNextRoutine(p),logs=programSessions(p),last=logs[0];
 return `<div class="card program-card ${isActive?'active-program':''}">
   <div class="row">
     <div class="grow"><div class="exercise-name">${esc(p.name)}</div><div class="mini">${p.routineIds.length} workout${p.routineIds.length===1?'':'s'} · ${p.frequency}×/week · ${esc(programDaysText(p))} · ${esc(programTrainingModeLabel(p.trainingMode))}</div></div>
     ${isActive?'<span class="tag">● ACTIVE</span>':''}
   </div>
   ${programRouteHtml(p)}
   <div class="mini" style="margin-top:8px">${next?`Next: <b>${esc(next.name)}</b>`:'Add a routine to start'}${last?` · Last: ${esc(last.routineName)} ${new Date(last.date).toLocaleDateString()}`:''} · ${logs.length} completed</div>
   <div class="actions">
     ${next?`<button class="btn small ${isActive?'green':''}" onclick="startProgramWorkout('${p.id}')">${state.activeWorkout?.programId===p.id?'Resume Program Workout':'Start Next'}</button>`:''}
     ${!isActive?`<button class="btn small secondary" onclick="activateProgram('${p.id}')">Set Active</button>`:''}
      <button class="btn small secondary" onclick="openCoachProgramAudit('${p.id}')">Coach Audit</button>
     <button class="btn small secondary" onclick="openProgramShare('${p.id}')">Share</button>
     <button class="btn small secondary" onclick="newProgram('${p.id}')">Edit</button>
     <button class="btn small danger" onclick="deleteProgram('${p.id}')">Delete</button>
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
 if(state.activeProgramId!==programId){state.activeProgramId=programId;save()}
 if(state.activeWorkout?.routineId===rid&&!state.activeWorkout.programId){
   state.activeWorkout.programId=programId;saveActiveWorkout();resumeActiveWorkout();showToast('Active workout attached to program');return;
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
 if(mode)programDraft.trainingMode=normalizeProgramTrainingMode(mode.value);
}
function newProgram(id=null){
 const existing=id?programById(id):null;
 if(!existing&&!activeRoutines().length){showToast('Create or restore a routine first');return}
 const nextId=existing?.routineIds?.[existing.nextIndex]||null;
 programDraft=existing?JSON.parse(JSON.stringify(existing)):{id:uid(),name:'',routineIds:[],frequency:3,preferredDays:[],trainingMode:'inherit',nextIndex:0};
 programDraft.trainingMode=normalizeProgramTrainingMode(programDraft.trainingMode);
 programDraft._nextRoutineId=nextId;
 renderProgramEditor();
}
function renderProgramEditor(){
 if(!programDraft)return;
 const selected=programDraft.routineIds.map((id,i)=>({r:state.routines.find(x=>x.id===id),i})).filter(x=>x.r);
 const available=activeRoutines().filter(r=>!programDraft.routineIds.includes(r.id));
 openModal(programById(programDraft.id)?'Edit program':'New program',`
   <div class="field"><label>Program name</label><input id="programName" value="${escAttr(programDraft.name||'')}" placeholder="Full Body Program"></div>
   <div class="field"><label>Program training mode</label><select id="programTrainingMode"><option value="inherit" ${normalizeProgramTrainingMode(programDraft.trainingMode)==='inherit'?'selected':''}>Use each routine’s mode</option><option value="guided" ${programDraft.trainingMode==='guided'?'selected':''}>Guided Progressive Overload</option><option value="strength" ${programDraft.trainingMode==='strength'?'selected':''}>Strength Focus</option><option value="track" ${programDraft.trainingMode==='track'?'selected':''}>Track Only / Standard Workout</option></select><div class="native-note" style="margin-top:6px">A program override applies only when a workout is started through this program. Manual routine starts keep the routine’s own mode.</div></div>
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
 if(!programDraft.routineIds.length){showToast('Add at least one routine');return}
 const existing=programById(programDraft.id);
 let nextIndex=0;
 const keepNext=programDraft._nextRoutineId;
 if(keepNext&&programDraft.routineIds.includes(keepNext))nextIndex=programDraft.routineIds.indexOf(keepNext);
 else if(existing)nextIndex=Math.min(Number(existing.nextIndex)||0,programDraft.routineIds.length-1);
 const saved={id:programDraft.id,name,routineIds:[...programDraft.routineIds],frequency:programDraft.frequency||3,preferredDays:[...programDraft.preferredDays],trainingMode:normalizeProgramTrainingMode(programDraft.trainingMode),nextIndex};
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
