let sessionEditDraft=null;

function historySessionDateParts(session){
 const d=new Date(session?.date||0);
 if(!Number.isFinite(d.getTime()))return {date:'Unknown date',time:''};
 return {
   date:d.toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'}),
   time:d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})
 };
}
function historyExerciseSummary(session){
 const names=(session?.exercises||[])
   .filter(e=>!e.skipped&&completedSets(e).length)
   .map(e=>exById(e.exerciseId)?.name||'Exercise');
 if(!names.length)return 'No completed exercises';
 const shown=names.slice(0,3);
 return shown.join(' · ')+(names.length>shown.length?` · +${names.length-shown.length} more`:'');
}
function historyMuscleSummaryHtml(session){
 const muscles=sessionMuscleGroups(session);
 if(!muscles.length)return '';
 const shown=muscles.slice(0,4),more=muscles.length-shown.length;
 return `<div class="history-muscle-row">${shown.map(m=>`<span>${esc(m)}</span>`).join('')}${more>0?`<span class="history-muscle-more">+${more}</span>`:''}</div>`;
}
function openHistorySessionMenu(id){
 const s=state.sessions.find(x=>x.id===id);if(!s)return;
 const when=historySessionDateParts(s);
 openModal('Workout options',`
   <div class="history-manage-summary">
     <div class="eyebrow">SESSION OPTIONS</div>
     <div class="history-manage-title">${esc(s.routineName||'Workout')}</div>
     <div class="mini">${esc(when.date)}${when.time?` · ${esc(when.time)}`:''}</div>
   </div>
   <div class="history-manage-actions">
     <button class="btn" onclick="closeModal();openHistoricalWorkoutRecap('${escAttr(s.id)}')">View Recap</button>
     <button class="btn secondary" onclick="closeModal();editCompletedWorkout('${escAttr(s.id)}')">Edit Workout</button>
     <button class="btn danger" onclick="closeModal();deleteSession('${escAttr(s.id)}')">Delete Workout</button>
   </div>
 `);
}
function openHistoryOptions(){
 openModal('History options',`
   <div class="notice">History is your permanent local record of completed workouts. Clearing it recalculates records and progression history.</div>
   <div class="history-manage-actions" style="margin-top:12px">
     <button class="btn danger" onclick="closeModal();clearWorkoutHistory()">Clear All Workout History</button>
     <button class="btn secondary" onclick="closeModal()">Cancel</button>
   </div>
 `);
}
function renderHistory(){
 const el=document.getElementById('historyList');
 const sessions=derivedSessionData().sessionsDesc;
 if(!sessions.length){el.innerHTML='<div class="empty"><div class="empty-illustration"><span class="empty-glyph empty-glyph-history" aria-hidden="true"></span></div><strong>No workout history yet</strong>Finish your first session and it will be saved here.</div>';return;}
 el.innerHTML=sessions.map((s,sessionIndex)=>{
   const when=historySessionDateParts(s);
   const workingSets=sessionSetCount(s),allSets=sessionAllSetCount(s),volume=Math.round(sessionVolume(s)),prs=sessionPRCount(s);
   const exercises=sessionCompletedExerciseCount(s),totalReps=sessionTotalReps(s);
   return `<article class="card history-entry">
     <div class="history-sequence"><small>SESSION</small><span>${String(sessions.length-sessionIndex).padStart(2,'0')}</span></div>
     <div class="history-entry-body">
       <div class="history-entry-head">
         <div class="history-entry-heading">
           <div class="history-entry-date">${esc(when.date)}${when.time?` <span>· ${esc(when.time)}</span>`:''}</div>
           <div class="history-entry-title">${esc(s.routineName||'Workout')}</div>
           ${s.programPhase==='deload'?'<div class="history-deload-label">☾ DELOAD WEEK · Training stress reduced intentionally</div>':''}
           <div class="history-entry-exercises">${exercises} exercise${exercises===1?'':'s'} · ${esc(historyExerciseSummary(s))}</div>
         </div>
         <button class="history-manage-btn" onclick="openHistorySessionMenu('${escAttr(s.id)}')" aria-label="Manage ${escAttr(s.routineName||'workout')}">•••</button>
       </div>

       <div class="history-metrics" aria-label="Workout summary">
         <span><b>${s.durationMinutes!=null?Math.max(0,Number(s.durationMinutes)||0):'—'}</b><small>min</small></span>
         <span><b>${workingSets}</b><small>working sets</small></span>
         <span><b>${volume>0?volume.toLocaleString():'—'}</b><small>${volume>0?esc(state.profile.unit)+' × reps':'volume'}</small></span>
         <span class="${prs?'has-pr':''}"><b>${prs}</b><small>PR${prs===1?'':'s'}</small></span>
       </div>

       ${historyMuscleSummaryHtml(s)}
       <div class="history-entry-submeta">${totalReps} total reps${allSets!==workingSets?` · ${allSets} total completed sets`:''}</div>

       <div class="history-card-actions">
         <button class="btn small history-recap-btn" onclick="openHistoricalWorkoutRecap('${escAttr(s.id)}')">View Recap</button>
         <button class="btn small secondary history-edit-btn" onclick="editCompletedWorkout('${escAttr(s.id)}')">Edit</button>
       </div>
     </div>
   </article>`;
 }).join('');
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
