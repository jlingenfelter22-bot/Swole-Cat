let sessionEditDraft=null;

function renderHistory(){
 const el=document.getElementById('historyList');
 const sessions=derivedSessionData().sessionsDesc;
 if(!sessions.length){el.innerHTML='<div class="empty"><div class="empty-illustration"><span class="empty-glyph empty-glyph-history" aria-hidden="true"></span></div><strong>No workout history yet</strong>Finish your first session and it will be saved here.</div>';return;}
 el.innerHTML=sessions.map((s,sessionIndex)=>`<div class="card history-entry">
   <div class="history-sequence"><span>${String(sessions.length-sessionIndex).padStart(2,'0')}</span><small>SESSION</small></div>
   <div class="history-entry-body">
   <div class="row"><div><div class="exercise-name">${esc(s.routineName)}</div><div class="mini">${new Date(s.date).toLocaleString()} · ${sessionSetCount(s)} working sets${sessionAllSetCount(s)!==sessionSetCount(s)?` · ${sessionAllSetCount(s)} total`:''}${s.durationMinutes!=null?` · ${s.durationMinutes} min`:''}</div></div></div>
   <div class="editor-summary"><span class="tag">${Math.round(sessionVolume(s)).toLocaleString()} ${state.profile.unit}×reps</span>${sessionPRCount(s)?`<span class="tag">🏆 ${sessionPRCount(s)} PR</span>`:''}</div>
   ${s.exercises.map(e=>{const ex=exById(e.exerciseId),sets=completedSets(e); return sets.length?`<table class="history-table"><tr><th colspan="3"><span class="exercise-link" onclick="openExerciseProgress('${e.exerciseId}')">${esc(ex?.name||'Exercise')}</span></th></tr>${sets.map((x,i)=>`<tr><td>${esc(setTypeLabel(setType(x)))} ${e.sets.slice(0,e.sets.indexOf(x)+1).filter(y=>setType(y)===setType(x)).length}</td><td>${x.weight} ${state.profile.unit}</td><td>${x.reps} reps${x.rir!==''&&x.rir!=null?` · ${x.rir} RIR`:''}</td></tr>`).join('')}</table>`:''}).join('')}
   <div class="history-card-actions">
     <button class="btn small" onclick="openHistoricalWorkoutRecap('${s.id}')">View Recap</button>
     <button class="btn small secondary" onclick="editCompletedWorkout('${s.id}')">Edit Workout</button>
     <button class="btn small danger" onclick="deleteSession('${s.id}')">Delete Workout</button>
   </div>
   </div>
 </div>`).join('');
}
function calculateHistoricalPR(prior,set){
 if(!prior.length)return '';
 const w=Number(set.weight)||0,r=Number(set.reps)||0;
 const maxWeight=Math.max(...prior.map(x=>Number(x.weight)||0));
 const sameWeightMax=Math.max(0,...prior.filter(x=>Number(x.weight)===w).map(x=>Number(x.reps)||0));
 const priorE1=Math.max(0,...prior.map(x=>estimated1RM(x.weight,x.reps)));
 const curE1=estimated1RM(w,r);
 if(w>maxWeight)return `Load PR: ${w} ${state.profile.unit}`;
 if(r>sameWeightMax)return `Rep PR: ${w} ${state.profile.unit} × ${r}`;
 if(curE1>priorE1*1.01)return 'Estimated strength PR';
 return '';
}
function rebuildAllPRs(){
 const priorByExercise={};
 state.sessions.forEach(s=>(s.exercises||[]).forEach(e=>(e.sets||[]).forEach(set=>set.pr='')));
 const chronological=state.sessions.slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
 chronological.forEach(session=>(session.exercises||[]).forEach(e=>{
   const prior=priorByExercise[e.exerciseId]||(priorByExercise[e.exerciseId]=[]);
   (e.sets||[]).forEach(set=>{
     if(!set.done||!isProgressionSet(set)||Number(set.reps)<=0)return;
     set.pr=calculateHistoricalPR(prior,set);
     prior.push({weight:Number(set.weight)||0,reps:Number(set.reps)||0,rir:set.rir});
   });
 }));
}
function editCompletedWorkout(id){
 const s=state.sessions.find(x=>x.id===id);if(!s)return;
 sessionEditDraft=JSON.parse(JSON.stringify(s));
 renderCompletedWorkoutEditor();
}
function renderCompletedWorkoutEditor(){
 const s=sessionEditDraft;if(!s)return;
 openModal('Edit completed workout',`
   <div class="notice">Fix weights, reps, RIR, set types, notes, or accidentally logged sets. Saving recalculates PR badges and future progression from the corrected history.</div>
   <div class="field" style="margin-top:12px"><label>Workout name</label><input id="sessionEditName" value="${escAttr(s.routineName||'Workout')}"></div>
   ${s.exercises.map((e,ei)=>{
     const ex=exById(e.exerciseId);
     return `<div class="history-edit-exercise">
       <div class="row"><div><div class="exercise-name">${esc(ex?.name||'Exercise')}</div><div class="mini">${esc(ex?.muscle||'')} · ${esc(ex?.equipment||'')}</div></div><button class="btn small secondary" onclick="addSessionDraftSet(${ei})">+ Set</button></div>
       ${(e.sets||[]).map((set,si)=>`<div class="history-edit-set">
         <div class="set-type-field"><label>Type</label><select id="sessType-${ei}-${si}">${setTypeOptions(setType(set))}</select></div>
         <div><label>Weight (${state.profile.unit})</label><input id="sessWeight-${ei}-${si}" type="number" step=".25" min="0" value="${Number(set.weight)||0}"></div>
         <div><label>Reps</label><input id="sessReps-${ei}-${si}" type="number" min="0" value="${Number(set.reps)||0}"></div>
         <div><label>RIR</label><select id="sessRir-${ei}-${si}"><option value="">—</option>${[0,1,2,3,4,5].map(v=>`<option value="${v}" ${String(set.rir)===String(v)?'selected':''}>${v}</option>`).join('')}</select></div>
         <button class="btn danger history-edit-remove" onclick="removeSessionDraftSet(${ei},${si})" aria-label="Remove set">×</button>
       </div>`).join('')||'<div class="empty">No sets logged.</div>'}
       <div class="field" style="margin-top:10px"><label>Exercise notes</label><textarea id="sessNotes-${ei}">${esc(e.notes||'')}</textarea></div>
     </div>`;
   }).join('')}
   <div class="actions"><button class="btn" onclick="saveCompletedWorkoutEdit()">Save Workout</button><button class="btn secondary" onclick="sessionEditDraft=null;closeModal()">Cancel</button></div>
 `);
}
function syncSessionEditDraft(){
 const s=sessionEditDraft;if(!s)return;
 const name=document.getElementById('sessionEditName');if(name)s.routineName=name.value.trim()||s.routineName||'Workout';
 s.exercises.forEach((e,ei)=>{
   (e.sets||[]).forEach((set,si)=>{
     const type=document.getElementById(`sessType-${ei}-${si}`);
     const weight=document.getElementById(`sessWeight-${ei}-${si}`);
     const reps=document.getElementById(`sessReps-${ei}-${si}`);
     const rir=document.getElementById(`sessRir-${ei}-${si}`);
     if(type)set.type=type.value;
     if(weight)set.weight=Math.max(0,Number(weight.value)||0);
     if(reps)set.reps=Math.max(0,Math.round(Number(reps.value)||0));
     if(rir)set.rir=rir.value===''?'':Number(rir.value);
     set.done=true;
   });
   const notes=document.getElementById(`sessNotes-${ei}`);if(notes)e.notes=notes.value;
 });
}
function addSessionDraftSet(ei){
 syncSessionEditDraft();
 const e=sessionEditDraft?.exercises?.[ei];if(!e)return;
 const last=e.sets?.at(-1);
 e.sets=e.sets||[];
 e.sets.push({weight:Number(last?.weight)||0,reps:Number(last?.reps)||0,rir:'',done:true,type:'working',pr:''});
 renderCompletedWorkoutEditor();
}
function removeSessionDraftSet(ei,si){
 syncSessionEditDraft();
 const e=sessionEditDraft?.exercises?.[ei];if(!e?.sets?.[si])return;
 e.sets.splice(si,1);
 renderCompletedWorkoutEditor();
}
function saveCompletedWorkoutEdit(){
 if(!sessionEditDraft)return;
 syncSessionEditDraft();
 state.sessions=state.sessions.map(s=>s.id===sessionEditDraft.id?sessionEditDraft:s);
 rebuildAllPRs();save();sessionEditDraft=null;closeModal();renderHistory();renderHome();
 if(document.getElementById('analytics')?.classList.contains('active'))renderAnalytics();
 showToast('Workout updated');
}
function deleteSession(id){
 const s=state.sessions.find(x=>x.id===id);if(!s)return;
 confirmAction('Delete workout?',`Delete "${s.routineName}" from ${new Date(s.date).toLocaleDateString()}? This removes the session from local history and recalculates your records.`,()=>{
   state.sessions=state.sessions.filter(x=>x.id!==id);
   rebuildAllPRs();save();renderHistory();renderHome();
   if(document.getElementById('analytics')?.classList.contains('active'))renderAnalytics();
   showToast('Workout deleted');
 });
}
function clearWorkoutHistory(){
 if(!state.sessions.length){showToast('Workout history is already empty');return}
 confirmAction('Clear all workout history?',`This permanently deletes all ${state.sessions.length} completed workouts on this device. Your routines and any active workout will stay intact.`,()=>{
   state.sessions=[];save();renderHistory();renderHome();
   if(document.getElementById('analytics')?.classList.contains('active'))renderAnalytics();
   showToast('Workout history cleared');
 });
}
