function coachExerciseReason(ex,request){
 const meta=exerciseMuscleMetadata(ex),targets=new Set(request.targetRegions);
 const primary=meta.primary.filter(x=>targets.has(x)).map(x=>MUSCLE_REGION_LABELS[x]||x);
 const secondary=meta.secondary.filter(x=>targets.has(x)).map(x=>MUSCLE_REGION_LABELS[x]||x);
 const bits=[];
 if((request.requiredExerciseIds||[]).includes(ex.id))bits.push('Requested by you');
 if(primary.length)bits.push('Primary: '+primary.join(', '));
 if(secondary.length)bits.push('Secondary: '+secondary.join(', '));
 bits.push(patternLabel(ex.pattern));
 const intelligence=typeof coachExerciseIntelligenceReason==='function'?coachExerciseIntelligenceReason(ex,request):'';
 if(intelligence)bits.push(intelligence);
 return bits.join(' · ');
}
function coachDraftRoutine(draft=coachBuildDraft,id=uid()){
 if(!draft)return null;
 const d=draft.defaults,r=draft.request,g=r.liftingGrammar||{};
 const firstWarmupId=g.warmupMode==='first_compound'
   ?draft.selectedIds.find(exerciseId=>COACH_COMPOUND_PATTERNS.has(exById(exerciseId)?.pattern))
   :null;
 const supersetMap=typeof coachTimeCompressionPlan==='function'
   ?coachTimeCompressionPlan(draft.selectedIds.map(exById).filter(Boolean),r)
   :{};
 return {
   id,name:coachWorkoutName(r),
   description:`Generated locally by Coach Swolecat from: "${r.prompt||r.targetLabels.join(' + ')}". Evidence rules: ACSM 2026 resistance-training position stand + NSCA program-design framework.`,
   trainingMode:d.trainingMode,
   exercises:draft.selectedIds.map(exerciseId=>{
     const ex=exById(exerciseId),explicit=draft.explicitConfigById?.[exerciseId];
     const p=typeof coachExercisePrescription==='function'?coachExercisePrescription(ex,r,d):d;
     return {
       exerciseId,sets:explicit?.sets||p.sets,minReps:explicit?.minReps||p.minReps,maxReps:explicit?.maxReps||p.maxReps,increment:state.settings.defaultIncrement,
       mode:'double',progressionStrategy:p.progressionStrategy||'double',adaptiveProgression:!!p.adaptiveProgression,setStructure:p.setStructure?cloneData(p.setStructure):null,
       trainingGoal:d.goal,resetPercent:7.5,restSeconds:p.restSeconds,
       autoWarmup:exerciseId===firstWarmupId,
       targetRIR:Number.isFinite(Number(p.targetRIR))?Number(p.targetRIR):null,
       targetRPE:Number.isFinite(Number(d.targetRPE))?Number(d.targetRPE):null,
       lastSetAmrap:!!g.lastSetAmrap,
       supersetGroup:supersetMap[exerciseId]||null
     };
   })
 };
}
function coachPreviewExercisePrescription(exerciseId,draft){
 const ex=exById(exerciseId),d=draft?.defaults||{},r=draft?.request||{},explicit=draft?.explicitConfigById?.[exerciseId];
 const p=typeof coachExercisePrescription==='function'?coachExercisePrescription(ex,r,d):d;
 const sets=explicit?.sets||p.sets,min=explicit?.minReps||p.minReps,max=explicit?.maxReps||p.maxReps;
 const structure=p.setStructure?.type==='top_backoff'
   ?` · top ${p.setStructure.topMinReps}–${p.setStructure.topMaxReps} + ${p.setStructure.backoffSets} backoff @ ${p.setStructure.backoffPercent}%`
   :'';
 return sets+' sets · '+min+(max!==min?'–'+max:'')+' reps · '+p.restSeconds+'s rest'+(Number.isFinite(Number(p.targetRIR))?' · '+p.targetRIR+' RIR':'')+structure;
}
function renderCoachPreview(){
 const draft=coachBuildDraft;if(!draft)return;
 const req=draft.request,d=draft.defaults,routine=coachDraftRoutine(draft,'preview');
 const equipment=req.allowedEquipment.length?req.allowedEquipment.join(', '):'Any available equipment';
 openModal('Coach Swolecat',`
   <div class="coach-builder">
    <div class="coach-console">
      <div class="eyebrow">QUICK BUILD // LOCAL ENGINE</div>
      <div class="coach-preview-head"><div><div class="exercise-name" style="font-size:1.16rem;margin-top:5px">${esc(routine.name)}</div><div class="mini" style="margin-top:5px">Built from audited Swolecat exercise metadata · local and offline.</div></div><span class="tag">${req.duration} min target</span></div>
      ${draft.lastRefinement?`<div class="mini" style="margin-top:8px"><b>Last change:</b> ${esc(draft.lastRefinement)}</div>`:''}
      <div class="coach-preview-meta"><span class="tag">${esc(coachGoalLabel(req.goal))}</span><span class="tag">${esc(equipment)}</span>${draft.explicitPrescription?'<span class="tag">Custom sets / reps</span>':'<span class="tag">Per-exercise prescription</span>'}${req.liftingGrammar?.warmupMode==='first_compound'?'<span class="tag">Warm-up first</span>':''}${Number.isFinite(Number(d.targetRIR))?`<span class="tag">Target ${d.targetRIR} RIR</span>`:''}${req.liftingGrammar?.lastSetAmrap?'<span class="tag">Last set AMRAP</span>':''}</div>
    </div>
    <div class="coach-exercise-list">
      ${draft.selectedIds.map((id,i)=>{const ex=exById(id);return `<div class="coach-exercise">
        <div class="coach-exercise-index">${String(i+1).padStart(2,'0')}</div>
        <div><div class="exercise-name">${esc(ex?.name||'Exercise')} ${preferenceBadgeHtml(id)}</div><div class="mini" style="margin-top:3px">${esc(coachExerciseReason(ex,req))}<br>${esc(coachPreviewExercisePrescription(id,draft))}</div></div>
        <div class="coach-exercise-actions"><button class="btn small secondary" onclick="coachSwapExercise(${i})">Swap</button><button class="btn small secondary" onclick="coachRemoveExercise(${i})">Remove</button></div>
      </div>`}).join('')}
    </div>
    <div class="coach-rationale"><b>Why this structure:</b> ${draft.explicitPrescription?'This is your exercise list. Coach preserves the exercises you named and only changes the list when you explicitly ask it to add, remove, swap, or modify something.':'Coach ranked the session from requested muscles, anatomical roles, weekly primary/secondary set-equivalents, recent movement overlap, exercise progression continuity, movement demand, equipment, target priority, and your exercise preferences.'} Swolecat does not invent a starting weight; your own history and progression engine handle load once the workout starts.${draft.intelligenceAudit&&typeof coachIntelligenceSummaryText==='function'?'<br><span class="mini">'+esc(coachIntelligenceSummaryText(draft))+'</span>':''}</div>
    ${coachRecentContextText(req)?`<div class="notice">${esc(coachRecentContextText(req))}</div>`:''}
    <div class="coach-console" style="margin-top:10px"><div class="eyebrow">REFINE // TALK TO COACH</div><div class="mini" style="margin:5px 0 9px">${draft.explicitPrescription?'Edit your exact list. Try “add 1 set of assisted pull-ups,” “make bench 4 sets of 6,” or “remove Bulgarian split squats.”':'Change the draft naturally. Try “make it 30 minutes,” “no barbells,” “more chest,” “strength focused,” “remove bench press,” or “add lateral raise.”'}</div><div class="home-coach-row"><div class="coach-voice-field"><input id="coachRefinePrompt" placeholder="${draft.explicitPrescription?'Add 1 set of assisted pull-ups...':'Make it 30 min, no barbells, more chest...'}" onkeydown="if(event.key==='Enter')coachApplyRefinement()">${coachVoiceButtonHtml('coachRefinePrompt')}</div><button class="btn" onclick="coachApplyRefinement()">Update</button></div></div>
    <div class="notice">Programming presets are evidence-backed practical defaults, not claims that one rep range or exercise is universally best. Completed logs inform weekly overlap, progression continuity, and movement demand, but Coach never treats them as a diagnosis of soreness, recovery, injury, or medical readiness.</div>
    <div class="actions"><button class="btn green" onclick="coachStartWorkoutNow()">Start Workout Now</button><button class="btn" onclick="coachSaveRoutine()">Save as Routine</button><button class="btn secondary" onclick="coachOpenAddToProgram()">Add to Program</button><button class="btn secondary" onclick="openCoachSwolecat(true)">New Request</button></div>
   </div>`);
}
function coachRemoveExercise(index){
 const id=coachBuildDraft?.selectedIds?.[index];if(!id)return;
 if(coachBuildDraft.selectedIds.length<=1){showToast('Keep at least one exercise');return}
 coachBuildDraft.request.excludedExerciseIds=[...new Set([...(coachBuildDraft.request.excludedExerciseIds||[]),id])];
 coachBuildDraft.request.requiredExerciseIds=(coachBuildDraft.request.requiredExerciseIds||[]).filter(x=>x!==id);
 if(coachBuildDraft.explicitConfigById)delete coachBuildDraft.explicitConfigById[id];
 coachBuildDraft.selectedIds.splice(index,1);
 coachBuildDraft.lastRefinement=`Removed ${exById(id)?.name||'exercise'}`;
 renderCoachPreview();
}
function coachSwapExercise(index){
 const draft=coachBuildDraft,currentId=draft?.selectedIds?.[index];if(!currentId)return;
 const current=exById(currentId),currentFamily=coachMovementFamily(current);
 const selectedOther=draft.selectedIds.filter((_,i)=>i!==index),coverage={},primaryCoverage={},patterns={},families={},targets=new Set(draft.request.targetRegions);
 selectedOther.forEach(id=>{
   const ex=exById(id);if(!ex)return;
   patterns[ex.pattern]=(patterns[ex.pattern]||0)+1;
   const family=coachMovementFamily(ex);families[family]=(families[family]||0)+1;
   const meta=exerciseMuscleMetadata(ex);
   meta.primary.filter(m=>targets.has(m)).forEach(m=>{coverage[m]=(coverage[m]||0)+1;primaryCoverage[m]=(primaryCoverage[m]||0)+1});
   meta.secondary.filter(m=>targets.has(m)).forEach(m=>coverage[m]=(coverage[m]||0)+.35);
 });
 const all=visibleExercises().filter(ex=>ex.id!==currentId&&!selectedOther.includes(ex.id));
 const rank=items=>items
   .map(ex=>({ex,score:coachDynamicCandidateScore(ex,draft.request,coverage,patterns,families,primaryCoverage,draft.selectedIds.length)}))
   .filter(x=>Number.isFinite(x.score))
   .sort((a,b)=>b.score-a.score||a.ex.name.localeCompare(b.ex.name))[0]?.ex;
 let replacement=rank(all.filter(ex=>coachMovementFamily(ex)===currentFamily));
 if(!replacement){
   const curMeta=exerciseMuscleMetadata(current),curPrimary=new Set(curMeta.primary.filter(m=>targets.has(m)));
   replacement=rank(all.filter(ex=>exerciseMuscleMetadata(ex).primary.some(m=>curPrimary.has(m))));
 }
 if(!replacement)replacement=rank(all);
 if(!replacement){showToast('No suitable replacement found');return}
 draft.request.excludedExerciseIds=[...new Set([...(draft.request.excludedExerciseIds||[]),currentId])];
 draft.request.requiredExerciseIds=(draft.request.requiredExerciseIds||[]).filter(id=>id!==currentId);
 if(draft.explicitConfigById){
   const config=draft.explicitConfigById[currentId];delete draft.explicitConfigById[currentId];
   if(config)draft.explicitConfigById[replacement.id]={...config,exerciseId:replacement.id};
 }
 draft.selectedIds[index]=replacement.id;
 draft.lastRefinement=`Swapped ${current?.name||'exercise'} for ${replacement.name}`;
 renderCoachPreview();
}
function coachPersistRoutine(draft=coachBuildDraft){
 if(!draft)return null;
 if(draft.savedRoutineId){
   const existing=state.routines.find(r=>r.id===draft.savedRoutineId);
   if(existing)return existing;
 }
 const routine=coachDraftRoutine(draft);if(!routine)return null;
 state.routines.push(routine);draft.savedRoutineId=routine.id;
 return routine;
}
function coachSaveRoutine(draft=coachBuildDraft){
 const routine=coachPersistRoutine(draft);if(!routine)return null;
 save();renderRoutines();renderHome();closeModal();showToast('Coach workout saved as a routine');
 return routine.id;
}
function coachAttachDraftToProgram(programId,draft=coachBuildDraft){
 const p=programById(programId);if(!p||!draft)return null;
 const routine=coachPersistRoutine(draft);if(!routine)return null;
 if(!p.routineIds.includes(routine.id))p.routineIds.push(routine.id);
 save();renderRoutines();renderPrograms();renderHome();
 return routine.id;
}
function coachCreateProgramFromDraft(draft=coachBuildDraft){
 if(!draft)return null;
 const routine=coachPersistRoutine(draft);if(!routine)return null;
 const p={id:uid(),name:`${routine.name} Program`,routineIds:[routine.id],frequency:3,preferredDays:[],trainingMode:'inherit',nextIndex:0};
 state.programs.push(p);if(!state.activeProgramId)state.activeProgramId=p.id;
 save();renderRoutines();renderPrograms();renderHome();closeModal();showToast('Coach workout added to a new program');
 return p.id;
}
function coachAddToProgram(programId){
 const p=programById(programId);if(!p)return;
 const routineId=coachAttachDraftToProgram(programId);
 if(!routineId)return;
 closeModal();showToast(`Added to ${p.name}`);
}
function coachOpenAddToProgram(){
 if(!coachBuildDraft)return;
 const programs=state.programs||[];
 openModal('Add Coach workout to program',`
   <div class="coach-console"><div class="eyebrow">PROGRAM HANDOFF</div><div class="coach-question">Where should this workout go?</div><div class="mini" style="margin-top:5px">Swolecat will save this generated workout as a normal routine, then add that routine to the selected program.</div></div>
   ${programs.length?`<div class="card" style="margin-top:10px">${programs.map(p=>`<div class="list-item"><div class="grow"><div class="exercise-name">${esc(p.name)}</div><div class="mini">${p.routineIds.length} workout${p.routineIds.length===1?'':'s'} · ${p.frequency}×/week</div></div><button class="btn small" onclick="coachAddToProgram('${p.id}')">Add</button></div>`).join('')}</div>`:''}
   <div class="actions"><button class="btn secondary" onclick="coachCreateProgramFromDraft()">Create New Program</button><button class="btn secondary" onclick="renderCoachPreview()">Back</button></div>
 `);
}
function coachActiveWorkoutFromDraft(draft=coachBuildDraft){
 const routine=coachDraftRoutine(draft,null);if(!routine)return null;
 const effectiveMode=normalizeTrainingMode(routine.trainingMode),now=new Date().toISOString();
 return {
   id:uid(),routineId:null,routineName:routine.name,trainingMode:effectiveMode,programId:null,startDate:now,status:'active',lastSavedAt:now,structureDirty:false,pausedAt:null,pausedDurationMs:0,focusExerciseIndex:0,focusSetIndex:0,deferredExerciseIndexes:[],
   exercises:routine.exercises.map((re,routineIndex)=>{
     const prev=previousExercise(re.exerciseId),config={trainingGoal:'general',resetPercent:7.5,...re,routineMode:effectiveMode,mode:re.mode==='range'?'double':re.mode};
     const rec=buildRecommendation(config,prev,re.exerciseId);
     return {exerciseId:re.exerciseId,routineIndex,config,targetOverride:null,supersetId:null,skipped:false,expanded:routineIndex===0,sets:activeSetsFromRoutineExercise(re,rec,exById(re.exerciseId)),notes:''};
   })
 };
}
function coachStartWorkoutNow(draft=coachBuildDraft){
 if(!draft)return false;
 if(state.activeWorkout){showToast('Finish or cancel your active workout first');return false}
 const active=coachActiveWorkoutFromDraft(draft);if(!active)return false;
 state.activeWorkout=active;saveActiveWorkout();updateActiveWorkoutChrome();requestWakeLock();haptic([20,35,20]);closeModal();renderWorkout();go('workout');showToast('Coach workout started');return true;
}
function coachContinueRequest(){
 const req=coachBuildDraft?.request;if(!req)return;
 if(!req.targetRegions.length){
   openModal('Coach Swolecat',`<div class="coach-console"><div class="eyebrow">ONE QUICK QUESTION</div><div class="coach-question">What are we training?</div><div class="coach-choice-grid">${['chest','back','shoulders','arms','legs','push','pull','full body'].map(k=>`<button class="btn secondary" onclick="coachAnswerTarget('${k}')">${esc(COACH_TARGET_GROUPS[k].label)}</button>`).join('')}</div></div>`);
   return;
 }
 if(!req.duration){
   openModal('Coach Swolecat',`<div class="coach-console"><div class="eyebrow">ONE QUICK QUESTION</div><div class="coach-question">How much time do we have?</div><div class="coach-choice-grid">${[30,45,60,75].map(m=>`<button class="btn secondary" onclick="coachAnswerDuration(${m})">${m} minutes</button>`).join('')}</div></div>`);
   return;
 }
 if(!coachGenerateWorkout(req)){alert('Coach Swolecat could not build a workout from that request with the available exercise/equipment filters. Try broadening the equipment or target muscles.');return}
 renderCoachPreview();
}
function coachAnswerTarget(key){
 const g=COACH_TARGET_GROUPS[key];if(!g||!coachBuildDraft)return;
 coachBuildDraft.request.targetKeys=[key];coachBuildDraft.request.targetLabels=[g.label];coachBuildDraft.request.targetRegions=[...g.regions];coachContinueRequest();
}
function coachAnswerDuration(minutes){
 if(!coachBuildDraft)return;coachBuildDraft.request.duration=Math.max(15,Math.min(120,Number(minutes)||45));coachContinueRequest();
}
function coachSubmitPrompt(){
 const input=document.getElementById('coachPrompt'),prompt=input?.value.trim()||'';
 if(!prompt){showToast('Tell Coach Swolecat what you want to train');return}
 const taught=coachTryTeachAlias(prompt);
 if(taught.handled){showToast(taught.message);return}
 if(typeof coachTryProgramAuditQuestion==='function'&&coachTryProgramAuditQuestion(prompt,{render:true}))return;
 if(typeof coachTryHistoryQuestion==='function'&&coachTryHistoryQuestion(prompt,{render:true}))return;
 const request=coachParsePrompt(prompt,coachPromptGoal),programIntent=coachParseProgramIntent(prompt),explicit=coachParseExplicitWorkout(prompt,request.goal);
 request.excludedExerciseIds=[...new Set([...(request.excludedExerciseIds||[]),...(explicit.excludedExerciseIds||[])])];
 if(explicit.signal&&explicit.ambiguities?.length){coachBeginExerciseClarification({prompt,request,programIntent,explicit});return}
 if(explicit.signal&&explicit.items.length){
   coachProgramBuildDraft=null;coachGenerateExplicitWorkout(request,explicit);renderCoachPreview();return;
 }
 if(programIntent.isProgram){
   request.programFocusRegions=[...programIntent.focusRegions];request.programFocusLabels=[...programIntent.focusLabels];
   coachBuildDraft=null;
   coachProgramBuildDraft={request,intent:programIntent,days:[],dayOverrides:[],createdAt:new Date().toISOString()};
   coachContinueProgramRequest();return;
 }
 coachProgramBuildDraft=null;
 coachBuildDraft={request,selectedIds:[],defaults:null,createdAt:new Date().toISOString()};
 coachContinueRequest();
}
function openCoachSwolecat(reset=false){
 if(reset){coachBuildDraft=null;coachProgramBuildDraft=null;coachPromptGoal='hypertrophy'}
 openModal('Coach Swolecat',`
  <div class="coach-builder">
   <div class="coach-console">
    <div class="eyebrow">QUICK BUILD // OFFLINE</div>
    <div class="exercise-name" style="font-size:1.17rem;margin-top:5px">What do you need?</div>
     <div class="mini" style="margin-top:5px">Build a workout or ask about your logged training history. Coach routes history questions without creating a workout.</div>
    <div class="coach-voice-field" style="margin-top:12px"><textarea id="coachPrompt" class="coach-prompt" placeholder="Build chest + back... or ask: what did I bench last time?"></textarea>${coachVoiceButtonHtml('coachPrompt')}</div>
    <div class="coach-example-row"><button class="coach-example" onclick="coachFillExample('Chest and back, 45 minutes, dumbbells and cables')">Chest + back</button><button class="coach-example" onclick="coachFillExample('3-day full body program, Monday Wednesday Friday, 45 minutes')">3-day plan</button><button class="coach-example" onclick="coachFillExample('Push pull legs program, 3 days, 60 minutes')">PPL</button></div>
   </div>
   <div><div class="mini" style="margin-bottom:6px">Primary goal</div><div class="picker-chips"><button class="chip active" data-coach-goal="hypertrophy" onclick="coachSetGoal('hypertrophy')">Muscle growth</button><button class="chip" data-coach-goal="strength" onclick="coachSetGoal('strength')">Strength</button><button class="chip" data-coach-goal="general" onclick="coachSetGoal('general')">General</button></div></div>
   <div class="actions"><button class="btn" onclick="coachSubmitPrompt()">Ask / Build</button><button class="btn secondary" onclick="closeModal()">Cancel</button></div>
   <div class="mini">Evidence rules are versioned locally. Current foundation: ACSM 2026 resistance-training position stand and NSCA program-design framework.</div>
  </div>`);
 coachSetGoal(coachPromptGoal);
}

function homeSuggestedRoutine(){
 const active=activeRoutines();if(!active.length)return null;
 const byId=new Map(active.map(r=>[r.id,r]));
 const recent=state.sessions.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).find(s=>byId.has(s.routineId));
 return recent?byId.get(recent.routineId):active[0];
}
function homeCoachBuildPrompt(){
 const input=document.getElementById('homeCoachPrompt'),prompt=input?.value.trim()||'';
 if(!prompt){showToast('Ask Coach something or tell it what you want to build');return}
 const taught=coachTryTeachAlias(prompt);
 if(taught.handled){showToast(taught.message);return}
 if(typeof coachTryProgramAuditQuestion==='function'&&coachTryProgramAuditQuestion(prompt,{render:true}))return;
 if(typeof coachTryHistoryQuestion==='function'&&coachTryHistoryQuestion(prompt,{render:true}))return;
 const request=coachParsePrompt(prompt,coachPromptGoal),programIntent=coachParseProgramIntent(prompt),explicit=coachParseExplicitWorkout(prompt,request.goal);
 request.excludedExerciseIds=[...new Set([...(request.excludedExerciseIds||[]),...(explicit.excludedExerciseIds||[])])];
 if(explicit.signal&&explicit.ambiguities?.length){coachBeginExerciseClarification({prompt,request,programIntent,explicit});return}
 if(explicit.signal&&explicit.items.length){
   coachProgramBuildDraft=null;coachGenerateExplicitWorkout(request,explicit);renderCoachPreview();return;
 }
 if(programIntent.isProgram){
   request.programFocusRegions=[...programIntent.focusRegions];request.programFocusLabels=[...programIntent.focusLabels];
   coachBuildDraft=null;
   coachProgramBuildDraft={request,intent:programIntent,days:[],dayOverrides:[],createdAt:new Date().toISOString()};
   coachContinueProgramRequest();return;
 }
 coachProgramBuildDraft=null;
 coachBuildDraft={request,selectedIds:[],defaults:null,createdAt:new Date().toISOString()};
 coachContinueRequest();
}
function homeCoachExample(text){
 const input=document.getElementById('homeCoachPrompt');if(input){input.value=text;input.focus()}
}
function homeCoachLauncherHtml({embedded=false}={}){
 return `<div class="${embedded?'home-new-user':''}">
   ${embedded?'':`<div class="home-coach-head"><div><div class="home-coach-title">Coach Swolecat</div><div class="mini">Need something different today?</div></div><span class="tag">QUICK BUILD</span></div>`}
   <div class="home-coach-row"><div class="coach-voice-field"><input id="homeCoachPrompt" placeholder="Build something or ask about your training..." onkeydown="if(event.key==='Enter')homeCoachBuildPrompt()">${coachVoiceButtonHtml('homeCoachPrompt')}</div><button class="btn" onclick="homeCoachBuildPrompt()">Go</button></div>
    <div class="home-coach-chips"><button class="home-coach-chip" onclick="homeCoachExample('30 minute leg workout')">30m legs</button><button class="home-coach-chip" onclick="homeCoachExample('What did I bench last time?')">Last bench?</button><button class="home-coach-chip" onclick="homeCoachExample('What am I progressing on?')">My trends</button><button class="home-coach-chip" onclick="homeCoachExample('Audit my program')">Audit program</button></div>
 </div>`;
}
function homeQuickActionsHtml(){
 return `<button class="home-route-btn" onclick="go('routines')"><b>Saved workouts</b><span>Routines and programs</span></button><button class="home-route-btn" onclick="newRoutine()"><b>Build manually</b><span>Choose every exercise yourself</span></button>`;
}
const COACH_INSIGHT_GROUPS=[
 {key:'lower body',label:'Lower body',regions:['quads','hamstrings','glutes','adductors','calves']},
 {key:'push',label:'Push muscles',regions:['chest','front_delts','side_delts','triceps']},
 {key:'pull',label:'Pull muscles',regions:['lats','upper_back','rear_delts','biceps']}
];
function coachSessionGroupScore(session,group){
 const scores=sessionMuscleScores(session);
 return group.regions.reduce((n,region)=>n+(Number(scores[region])||0),0);
}
function coachHistoryInsight(){
 if(typeof coachDeepHistoryInsight==='function')return coachDeepHistoryInsight();
 if(state.activeWorkout||activeProgram()||state.sessions.length<3)return null;
 const sessions=state.sessions.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 const now=Date.now(),recent=sessions.filter(s=>{
   const t=new Date(s.date).getTime();return Number.isFinite(t)&&now-t<=14*86400000;
 });
 if(recent.length<3)return null;
 const candidates=[];
 COACH_INSIGHT_GROUPS.forEach(group=>{
   const recentScore=recent.reduce((n,session)=>n+coachSessionGroupScore(session,group),0);
   if(recentScore>0)return;
   const last=sessions.find(session=>coachSessionGroupScore(session,group)>0);
   const lastMs=last?new Date(last.date).getTime():NaN;
   const oldestMs=new Date(sessions.at(-1)?.date||0).getTime();
   const days=Number.isFinite(lastMs)?Math.floor((now-lastMs)/86400000):Number.isFinite(oldestMs)?Math.floor((now-oldestMs)/86400000):0;
   if(days<14)return;
   const otherWork=recent.reduce((n,session)=>n+COACH_INSIGHT_GROUPS.filter(g=>g.key!==group.key).reduce((x,g)=>x+coachSessionGroupScore(session,g),0),0);
   if(otherWork<=0)return;
   candidates.push({
     group,days,workouts:recent.length,
     text:last
       ?`You’ve logged ${recent.length} workouts in the last two weeks, but no ${group.label.toLowerCase()} work in about ${days} days.`
       :`You’ve logged ${recent.length} workouts in the last two weeks without any ${group.label.toLowerCase()} work yet.`
   });
 });
 return candidates.sort((a,b)=>b.days-a.days)[0]||null;
}
function coachBuildFromInsight(targetKey){
 const group=COACH_TARGET_GROUPS[targetKey];if(!group)return;
 const request=coachParsePrompt(`${group.label} workout, 45 minutes`,coachPromptGoal);
 request.duration=45;request.targetLabels=[group.label];request.targetRegions=[...group.regions];
 coachProgramBuildDraft=null;
 if(!coachGenerateWorkout(request)){showToast('Coach could not build that workout');return}
 renderCoachPreview();
}
function coachInsightHtml(){
 if(typeof coachDeepInsightHtml==='function')return coachDeepInsightHtml();
 const insight=coachHistoryInsight();if(!insight)return '';
 return `<div class="home-signal-card" style="margin-top:8px"><div class="grow"><div class="eyebrow">COACH INSIGHT</div><div class="signal-copy"><b>${esc(insight.group.label)} hasn’t shown up lately.</b> ${esc(insight.text)} <span class="mini">That’s a log observation, not a recovery warning.</span></div></div><button class="btn small secondary" onclick="coachBuildFromInsight('${escAttr(insight.group.key)}')">Build ${esc(insight.group.label)}</button></div>`;
}
function renderHome(){
 const primary=document.getElementById('homePrimary'),coach=document.getElementById('homeCoachLauncher'),quick=document.getElementById('homeQuickActions'),signal=document.getElementById('homeTelemetry'),latest=document.getElementById('homeLatest');
 if(!primary)return;
 const name=state.profile.name?.trim(),active=state.activeWorkout,p=activeProgram(),next=p?programNextRoutine(p):null,suggested=homeSuggestedRoutine();
 const sessionData=state.sessions.length?derivedSessionData():null;

 if(active){
   const ac=activeWorkoutCounts(active),saved=active.lastSavedAt?new Date(active.lastSavedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):'just now';
   primary.innerHTML=`<div class="eyebrow"><span class="active-pulse"></span>WORKOUT IN PROGRESS</div><h1>Resume ${esc(active.routineName||'Workout')}</h1><div class="muted">${ac.done} of ${ac.total} sets complete · autosaved ${esc(saved)}</div><div class="home-primary-progress progress-bar"><div style="width:${ac.pct}%"></div></div><div class="actions"><button class="btn green" onclick="resumeActiveWorkout()">Resume Workout</button></div>`;
   coach.innerHTML='';quick.innerHTML='';
 }else if(p&&next){
   const logs=programSessions(p),last=logs[0];
   primary.innerHTML=`<div class="eyebrow">UP NEXT · ${esc(p.name)}</div><h1>${esc(next.name)}</h1><div class="muted">${next.exercises.length} exercise${next.exercises.length===1?'':'s'} · ${esc(trainingModeLabel(normalizeProgramTrainingMode(p.trainingMode)==='inherit'?next.trainingMode:p.trainingMode))}${last?` · last program session ${new Date(last.date).toLocaleDateString()}`:''}</div><div class="actions"><button class="btn green" onclick="startProgramWorkout('${p.id}')">Start Next Workout</button><button class="btn secondary" onclick="go('routines')">View Program</button></div>`;
   coach.innerHTML=`<div class="home-coach-launcher">${homeCoachLauncherHtml()}</div>`;quick.innerHTML=homeQuickActionsHtml();
 }else if(suggested){
   const last=sessionData?.sessionsByRoutine.get(suggested.id)?.[0];
   primary.innerHTML=`<div class="eyebrow">READY TO TRAIN${name?` · ${esc(name)}`:''}</div><h1>${esc(suggested.name)}</h1><div class="muted">${suggested.exercises.length} exercise${suggested.exercises.length===1?'':'s'} · ${esc(trainingModeLabel(suggested.trainingMode))}${last?` · last trained ${new Date(last.date).toLocaleDateString()}`:''}</div><div class="actions"><button class="btn green" onclick="openRoutine('${suggested.id}')">Start Workout</button><button class="btn secondary" onclick="go('routines')">Choose Another</button></div>`;
   coach.innerHTML=`<div class="home-coach-launcher">${homeCoachLauncherHtml()}</div>`;quick.innerHTML=homeQuickActionsHtml();
 }else{
   primary.innerHTML=`<div class="eyebrow">COACH SWOLECAT · QUICK BUILD</div><h1>What are we training today?</h1><div class="muted">Tell Swolecat the muscles, time, equipment, or goal. Or build the workout manually if you already know exactly what you want.</div>${homeCoachLauncherHtml({embedded:true})}`;
   coach.innerHTML='';quick.innerHTML=`<button class="home-route-btn" onclick="newRoutine()"><b>Build manually</b><span>Choose every exercise yourself</span></button><button class="home-route-btn" onclick="go('routines')"><b>Saved workouts</b><span>Nothing saved yet — manage them here later</span></button>`;
 }

 if(!state.sessions.length){
   signal.innerHTML='';latest.innerHTML='';
 }else{
   const weekStart=startOfWeek(),weekSessions=(sessionData?.sessionsDesc||[]).filter(s=>new Date(s.date)>=weekStart);
   const weekSets=weekSessions.reduce((n,s)=>n+sessionSetCount(s),0),weekPrs=weekSessions.reduce((n,s)=>n+sessionPRCount(s),0);
   signal.innerHTML=`<div class="home-signal-card" onclick="go('analytics')"><div><div class="eyebrow">THIS WEEK</div><div class="signal-copy"><b>${weekSessions.length} workout${weekSessions.length===1?'':'s'}</b> · ${weekSets} working sets · ${weekPrs} PR${weekPrs===1?'':'s'}</div></div><span class="tag">PROGRESS ›</span></div>`+coachInsightHtml();
   const last=sessionData.sessionsDesc[0],sets=sessionSetCount(last),prs=sessionPRCount(last);
   latest.innerHTML=`<div class="home-latest" onclick="openHistoricalWorkoutRecap('${last.id}')"><div class="row"><div><div class="eyebrow">LAST WORKOUT</div><div class="home-latest-title">${esc(last.routineName)}</div><div class="home-latest-meta">${new Date(last.date).toLocaleDateString()} · ${sets} working sets${last.durationMinutes!=null?` · ${last.durationMinutes} min`:''}${prs?` · ${prs} PR${prs===1?'':'s'}`:''}</div></div><span class="tag">RECAP ›</span></div></div>`;
 }
 updateActiveWorkoutChrome();
}
