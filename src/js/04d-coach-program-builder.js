function coachProgramName(request,intent){
 const goal=request.goal==='strength'?'Strength':request.goal==='general'?'Training':'Growth';
 return `Coach · ${intent.frequency}-Day ${coachProgramSplitLabel(intent.split||coachDefaultProgramSplit(intent.frequency))} · ${goal}`;
}
function coachCloneRequest(request){
 return {
   ...request,
   targetKeys:[...(request.targetKeys||[])],targetLabels:[...(request.targetLabels||[])],targetRegions:[...(request.targetRegions||[])],
   allowedEquipment:[...(request.allowedEquipment||[])],excludedEquipment:[...(request.excludedEquipment||[])],
   priorityRegions:[...(request.priorityRegions||[])],priorityKeys:[...(request.priorityKeys||[])],
   experienceLevel:request.experienceLevel||'auto',lateralityPreference:request.lateralityPreference||'auto',
   excludedTargetKeys:[...(request.excludedTargetKeys||[])],excludedTargetRegions:[...(request.excludedTargetRegions||[])],
   excludedExerciseIds:[...(request.excludedExerciseIds||[])],requiredExerciseIds:[...(request.requiredExerciseIds||[])],
   excludedMovementPatterns:[...(request.excludedMovementPatterns||[])],brainEquipment:request.brainEquipment||null
 };
}
function coachGenerateProgram(request,intent,previous=null){
 const frequency=Math.max(2,Math.min(6,Number(intent.frequency)||0));if(!frequency)return null;
 const split=intent.split||coachDefaultProgramSplit(frequency),slots=coachProgramSlots(frequency,split);
 const req=coachCloneRequest({...request,duration:request.duration||45});
 req.programFocusRegions=[...new Set(intent.focusRegions||request.programFocusRegions||[])];
 req.programFocusLabels=[...new Set(intent.focusLabels||request.programFocusLabels||[])];
 const defaults=coachProgrammingDefaults(req.goal,req.duration),usage={},muscleUsage={},hingeHistory=[],dayOverrides=previous?.dayOverrides||[];
 const days=slots.map((key,index)=>{
   const group=COACH_TARGET_GROUPS[key],override=dayOverrides[index]||{excludedExerciseIds:[],requiredExerciseIds:[]};
   const excludedRegions=new Set(req.excludedTargetRegions||[]);
   const targetRegions=[...(group?.regions||[])].filter(region=>!excludedRegions.has(region)),targetSet=new Set(targetRegions);
   const dayReq=coachCloneRequest(req);
   dayReq.targetKeys=[key];dayReq.targetLabels=[group?.label||'Workout'];dayReq.targetRegions=targetRegions;
   dayReq.priorityRegions=req.programFocusRegions.filter(region=>targetSet.has(region));
   dayReq.excludedExerciseIds=[...new Set([...(req.excludedExerciseIds||[]),...(override.excludedExerciseIds||[])])];
   dayReq.requiredExerciseIds=[...new Set(override.requiredExerciseIds||[])];
   dayReq.programHingeHistory=[...hingeHistory];
   dayReq.programExerciseUsage=usage;
   dayReq.programMuscleUsage={...muscleUsage};
   const initial=coachSelectExercises(dayReq,defaults.exerciseCount);
   const durationPlan=coachBrainTrimToTime(initial,dayReq,defaults);
   const selected=durationPlan.exercises;
   selected.filter(ex=>ex.pattern==='hinge').forEach(ex=>hingeHistory.push(ex.id));
   selected.forEach(ex=>{
     usage[ex.id]=(usage[ex.id]||0)+1;
     const prescription=typeof coachExercisePrescription==='function'?coachExercisePrescription(ex,dayReq,defaults):defaults;
     const sets=Number(durationPlan.setCounts?.[ex.id]?.sets||prescription.sets||defaults.sets)||0,meta=exerciseMuscleMetadata(ex);
     meta.primary.forEach(region=>muscleUsage[region]=(muscleUsage[region]||0)+sets);
     meta.secondary.forEach(region=>muscleUsage[region]=(muscleUsage[region]||0)+sets*.5);
   });
   return {
     key,label:coachProgramDayDisplayLabel(key,index,slots),request:dayReq,
     defaults:{...defaults},selectedIds:selected.map(ex=>ex.id),brainTime:durationPlan.time,brainTimeRemoved:durationPlan.removed,brainSetCounts:durationPlan.setCounts,brainFeasible:durationPlan.feasible
   };
 });
 if(days.some(day=>!day.selectedIds.length||day.brainFeasible===false))return null;
 if(req.brainEquipment&&slots.some(key=>key==='full body'||key==='full_body')){
   const complete=days.every(day=>{
     const patterns=day.selectedIds.map(id=>exById(id)?.pattern);
     return patterns.some(p=>p==='horizontal_pull'||p==='vertical_pull')
       && patterns.some(p=>p==='horizontal_press'||p==='incline_press'||p==='vertical_press')
       && patterns.some(p=>p==='squat'||p==='lunge'||p==='knee_extension');
   });
   if(!complete)return null;
 }
 coachProgramBuildDraft={
   request:req,
   intent:{...intent,frequency,split,preferredDays:[...(intent.preferredDays||[])]},
   slots,days,dayOverrides:slots.map((_,i)=>({
     excludedExerciseIds:[...(dayOverrides[i]?.excludedExerciseIds||[])],
     requiredExerciseIds:[...(dayOverrides[i]?.requiredExerciseIds||[])]
   })),
   interactiveBrainFlow:!!previous?.interactiveBrainFlow,
   createdAt:previous?.createdAt||new Date().toISOString(),
   lastRefinement:previous?.lastRefinement||''
 };
 return coachProgramBuildDraft;
}
function coachProgramWeeklyCoverage(draft=coachProgramBuildDraft){
 const scores={};if(!draft)return scores;
 draft.days.forEach(day=>{
   day.selectedIds.forEach(id=>{
     const ex=exById(id),meta=exerciseMuscleMetadata(ex),sets=day.brainSetCounts?.[id]?.sets||coachExercisePrescription(ex,day.request,day.defaults).sets;
     meta.primary.forEach(m=>scores[m]=(scores[m]||0)+sets);
     meta.secondary.forEach(m=>scores[m]=(scores[m]||0)+sets*.5);
   });
 });
 return scores;
}
function coachProgramCoverageText(draft=coachProgramBuildDraft){
 const scores=coachProgramWeeklyCoverage(draft);
 const rows=Object.entries(scores).sort((a,b)=>b[1]-a[1]).slice(0,8);
 if(!rows.length)return '';
 return rows.map(([region,sets])=>`${MUSCLE_REGION_LABELS[region]||region} ${Number(sets.toFixed(1))}`).join(' · ');
}
function coachProgramScheduleText(draft=coachProgramBuildDraft){
 const days=draft?.intent?.preferredDays||[];
 return days.length?days.map(d=>PROGRAM_DAYS[d]).join(' / '):'Flexible training days';
}
function coachProgramRoutineFromDay(day,draft=coachProgramBuildDraft,id=uid()){
 const d=day.defaults,r=draft.request;
 const supersetMap=typeof coachTimeCompressionPlan==='function'?coachTimeCompressionPlan(day.selectedIds.map(exById).filter(Boolean),day.request):{};
 return {
   id,name:`${coachProgramName(r,draft.intent)} · ${day.label}`,
   description:`Generated locally by Coach Swolecat as part of a ${draft.intent.frequency}-day ${coachProgramSplitLabel(draft.intent.split)} program. Evidence rules: ACSM 2026 resistance-training position stand + NSCA program-design framework.`,
   trainingMode:d.trainingMode,
   exercises:day.selectedIds.map(exerciseId=>{
     const ex=exById(exerciseId),p=typeof coachExercisePrescription==='function'?coachExercisePrescription(ex,day.request,d):d;
     return {
       exerciseId,sets:day.brainSetCounts?.[exerciseId]?.sets||p.sets,minReps:p.minReps,maxReps:p.maxReps,increment:state.settings.defaultIncrement,
       mode:'double',progressionStrategy:p.progressionStrategy||'double',adaptiveProgression:!!p.adaptiveProgression,setStructure:p.setStructure?cloneData(p.setStructure):null,
       trainingGoal:d.goal,resetPercent:7.5,restSeconds:p.restSeconds,
       targetRIR:Number.isFinite(Number(p.targetRIR))?Number(p.targetRIR):null,
       supersetGroup:supersetMap[exerciseId]||null
     };
   })
 };
}
function renderCoachProgramPreview(){
 const draft=coachProgramBuildDraft;if(!draft)return;
 const req=draft.request,intent=draft.intent,coverage=coachProgramCoverageText(draft);
 const equipment=coachBrainResolveEquipment(req)?.label||(req.allowedEquipment.length?req.allowedEquipment.join(', '):'Equipment not specified');
 openModal('Coach Swolecat',`
  <div class="coach-builder">
   <div class="coach-console">
    <div class="eyebrow">PROGRAM BUILD // LOCAL ENGINE</div>
    <div class="coach-preview-head"><div><div class="exercise-name" style="font-size:1.16rem;margin-top:5px">${esc(coachProgramName(req,intent))}</div><div class="mini" style="margin-top:5px">${intent.frequency} workouts · ${esc(coachProgramScheduleText(draft))} · each workout targets about ${req.duration} minutes</div></div><span class="tag">${esc(coachProgramSplitLabel(intent.split))}</span></div>
    ${draft.lastRefinement?`<div class="mini" style="margin-top:8px"><b>Last change:</b> ${esc(draft.lastRefinement)}</div>`:''}
    <div class="coach-preview-meta"><span class="tag">${esc(coachGoalLabel(req.goal))}</span><span class="tag">${esc(equipment)}</span><span class="tag">${intent.frequency}×/week</span></div>
   </div>
   <div class="coach-exercise-list">
    ${draft.days.map((day,di)=>`<div class="card" style="margin:0">
      <div class="row"><div><div class="eyebrow">DAY ${di+1}</div><div class="exercise-name" style="margin-top:4px">${esc(day.label)}</div><div class="mini">${day.selectedIds.length} exercises · ${day.brainTime?`about ${day.brainTime.estimateMinutes} min (range ${day.brainTime.lowerMinutes}–${day.brainTime.upperMinutes})`:`${day.defaults.sets} sets each`} · ${day.defaults.minReps}–${day.defaults.maxReps} reps</div></div>${intent.preferredDays?.[di]!=null?`<span class="tag">${PROGRAM_DAYS[intent.preferredDays[di]]}</span>`:''}</div>
      <div style="margin-top:9px">${day.selectedIds.map((id,ei)=>{const ex=exById(id);return `<div class="list-item"><div class="grow"><div class="exercise-name">${esc(ex?.name||'Exercise')} ${preferenceBadgeHtml(id)}</div><div class="mini">${esc(coachExerciseReason(ex,day.request))} · ${day.brainSetCounts?.[id]?.sets||coachExercisePrescription(ex,day.request,day.defaults).sets} working sets</div></div><div class="actions" style="margin:0"><button class="btn small secondary" onclick="coachProgramSwapExercise(${di},${ei})">Swap</button><button class="btn small secondary" onclick="coachProgramRemoveExercise(${di},${ei})">Remove</button></div></div>`}).join('')}</div>
    </div>`).join('')}
   </div>
   ${coverage?`<div class="coach-rationale"><b>Planned weekly set-equivalents:</b> ${esc(coverage)}.<br><span class="mini">Primary involvement counts as 1.0 set and secondary involvement as 0.5. This is a planning aid, not a claim about muscle damage or recovery.</span></div>`:''}
   <div class="coach-console"><div class="eyebrow">REFINE // TALK TO COACH</div><div class="mini" style="margin:5px 0 9px">Try “4 days, upper/lower and 35 minutes,” “dumbbells only,” “no squats, more glutes,” or “Monday Tuesday Thursday Saturday.”</div><div class="home-coach-row"><div class="coach-voice-field"><input id="coachProgramRefinePrompt" placeholder="4 days, upper/lower, 40 min, more shoulders..." onkeydown="if(event.key==='Enter')coachApplyProgramRefinement()">${coachVoiceButtonHtml('coachProgramRefinePrompt')}</div><button class="btn" onclick="coachApplyProgramRefinement()">Update</button></div></div>
   ${coachBrainEquipmentPreviewNotice(req)?`<div class="notice">${esc(coachBrainEquipmentPreviewNotice(req))}</div>`:''}
   ${draft.days.some(day=>day.brainTime?.overTarget)?`<div class="notice">One or more days exceed your requested time at the estimated midpoint. Review the work or allow more time before saving.</div>`:draft.days.some(day=>day.brainTime&&day.brainTime.upperMinutes>day.brainTime.targetMinutes)?`<div class="notice">Some days could run past your target if warm-ups, equipment transitions or rest take longer. Each day's time range is a planning estimate, not a guaranteed finish time.</div>`:''}
   <div class="notice">Coach distributes work across the week using your requested frequency, split, equipment, goal, exercise preferences, completed training history, planned muscle set-equivalents from earlier program days, and progression continuity. Weekly workload is used as programming context only; the plan does not diagnose recovery or medical readiness.</div>
   <div class="actions"><button class="btn green" onclick="coachStartProgramFirstWorkout()">Save + Start Day 1</button><button class="btn" onclick="coachSaveGeneratedProgram()">Save Program</button><button class="btn secondary" onclick="openCoachSwolecat(true)">New Request</button></div>
  </div>`);
}
function coachProgramRegenerateWithOverrides(){
 const draft=coachProgramBuildDraft;if(!draft)return false;
 const previous={...draft,lastRefinement:draft.lastRefinement,dayOverrides:draft.dayOverrides};
 return !!coachGenerateProgram(draft.request,draft.intent,previous);
}
function coachProgramRemoveExercise(dayIndex,exerciseIndex){
 const draft=coachProgramBuildDraft,day=draft?.days?.[dayIndex],id=day?.selectedIds?.[exerciseIndex];if(!id)return;
 if(day.selectedIds.length<=1){showToast('Keep at least one exercise in the workout');return}
 const override=draft.dayOverrides[dayIndex]||(draft.dayOverrides[dayIndex]={excludedExerciseIds:[],requiredExerciseIds:[]});
 override.excludedExerciseIds=[...new Set([...(override.excludedExerciseIds||[]),id])];
 override.requiredExerciseIds=(override.requiredExerciseIds||[]).filter(x=>x!==id);
 draft.lastRefinement=`Removed ${exById(id)?.name||'exercise'} from ${day.label}`;
 coachProgramRegenerateWithOverrides();renderCoachProgramPreview();
}
function coachProgramSwapExercise(dayIndex,exerciseIndex){
 const draft=coachProgramBuildDraft,day=draft?.days?.[dayIndex],id=day?.selectedIds?.[exerciseIndex];if(!id)return;
 const override=draft.dayOverrides[dayIndex]||(draft.dayOverrides[dayIndex]={excludedExerciseIds:[],requiredExerciseIds:[]});
 override.excludedExerciseIds=[...new Set([...(override.excludedExerciseIds||[]),id])];
 override.requiredExerciseIds=(override.requiredExerciseIds||[]).filter(x=>x!==id);
 draft.lastRefinement=`Swapped ${exById(id)?.name||'exercise'} in ${day.label}`;
 coachProgramRegenerateWithOverrides();renderCoachProgramPreview();
}
function coachRefineProgramText(text){
 const draft=coachProgramBuildDraft,raw=String(text||'').trim();if(!draft||!raw)return {ok:false,message:'Tell Coach what you want changed.'};
 const req=coachCloneRequest(draft.request),intent={...draft.intent,preferredDays:[...(draft.intent.preferredDays||[])]};
 const clauses=coachBrainSplitEditClauses(raw);
 if(clauses.length>1){
   const previous=coachProgramBuildDraft;
   for(const clause of clauses){
     const result=coachRefineProgramText(clause);
     if(!result.ok){coachProgramBuildDraft=previous;return {ok:false,message:'No changes applied. '+result.message,failedClause:clause}}
   }
   coachProgramBuildDraft.lastRefinement=raw;
   return {ok:true,message:'Updated all '+clauses.length+' instructions.'};
 }
 const parsed=coachParsePrompt(raw,req.goal),program=coachParseProgramIntent(raw),goal=coachExplicitGoal(raw),equipment=coachParseEquipment(raw);
 let changed=false,structureChanged=false;
 if(parsed.duration){req.duration=parsed.duration;changed=true}
 if(goal&&goal!==req.goal){req.goal=goal;changed=true}
 if(program.frequency&&program.frequency!==intent.frequency){intent.frequency=program.frequency;changed=true;structureChanged=true}
 if(program.split&&program.split!==intent.split){intent.split=program.split;changed=true;structureChanged=true}
 if(program.preferredDays.length){
   intent.preferredDays=[...program.preferredDays];
   if(!program.frequency)intent.frequency=program.preferredDays.length;
   changed=true;structureChanged=true;
 }
 if(equipment.allowed.length){
   req.allowedEquipment=[...equipment.allowed];
   req.brainEquipment=coachBrainExplicitEquipment({...req,prompt:raw,allowedEquipment:equipment.allowed});
   req.excludedEquipment=req.excludedEquipment.filter(x=>!equipment.allowed.includes(x));changed=true;
 }
 if(/\\b(?:full|commercial|standard|well[- ]equipped)\\s+gym\\b/i.test(raw)){
   req.brainEquipment=coachBrainExplicitEquipment({...req,prompt:raw,allowedEquipment:[]});
   req.allowedEquipment=[...(req.brainEquipment?.allowed||[])];changed=true;
 }
 const natural=coachBrainApplyNaturalExerciseChange(req,raw);
 if(natural.changed){req.excludedMovementPatterns=natural.request.excludedMovementPatterns;changed=true;}
 if(equipment.excluded.length){req.excludedEquipment=[...new Set([...req.excludedEquipment,...equipment.excluded])];req.allowedEquipment=req.allowedEquipment.filter(x=>!equipment.excluded.includes(x));changed=true}
 if(/\bbalanced\b|\bno (?:special )?focus\b|\bevenly\b/.test(raw.toLowerCase())){
   intent.focusRegions=[];intent.focusLabels=[];changed=true;
 }else if(program.focusRegions.length){
   intent.focusRegions=[...new Set(program.focusRegions)];intent.focusLabels=[...new Set(program.focusLabels)];changed=true;
 }
 if(!changed)return {ok:false,message:'I did not find a program change. Try “4 days,” “35 minutes,” “dumbbells only,” “no squats,” or “more shoulders.”'};
 if(intent.preferredDays.length&&intent.preferredDays.length!==intent.frequency)intent.preferredDays=[];
 const previous=structureChanged?{...draft,dayOverrides:[]}: {...draft,dayOverrides:draft.dayOverrides};
 if(!coachGenerateProgram(req,intent,previous))return {ok:false,message:'Those constraints leave at least one workout without enough matching exercises. Broaden the equipment or split.'};
 coachProgramBuildDraft.lastRefinement=raw;
 return {ok:true,message:'Program updated.'};
}
function coachApplyProgramRefinement(){
 const input=document.getElementById('coachProgramRefinePrompt'),text=input?.value.trim()||'';
 if(!text){showToast('Tell Coach what you want changed');return}
 const result=coachRefineProgramText(text);
 if(!result.ok){showToast(result.message);return}
 renderCoachProgramPreview();
}
function coachPersistGeneratedProgram(draft=coachProgramBuildDraft){
 if(!draft)return null;
 if(draft.savedProgramId){
   const existing=programById(draft.savedProgramId);
   if(existing)return existing;
 }
 const routines=draft.days.map(day=>coachProgramRoutineFromDay(day,draft));
 state.routines.push(...routines);
 const p={
   id:uid(),name:coachProgramName(draft.request,draft.intent),routineIds:routines.map(r=>r.id),
   frequency:draft.intent.frequency,preferredDays:[...(draft.intent.preferredDays||[])],
   trainingMode:'inherit',nextIndex:0
 };
 state.programs.push(p);if(!state.activeProgramId)state.activeProgramId=p.id;
 draft.savedProgramId=p.id;draft.savedRoutineIds=[...p.routineIds];
 return p;
}
function coachSaveGeneratedProgram(){
 const p=coachPersistGeneratedProgram();if(!p)return null;
 save();renderRoutines();renderPrograms();renderHome();closeModal();showToast('Coach program saved');
 return p.id;
}
function coachStartProgramFirstWorkout(){
 const p=coachPersistGeneratedProgram();if(!p)return;
 save();renderRoutines();renderPrograms();renderHome();closeModal();
 state.activeProgramId=p.id;save();startProgramWorkout(p.id,0);showToast('Coach program saved · Day 1 ready');
}
function coachContinueProgramRequest(){
 const draft=coachProgramBuildDraft;if(!draft)return;
 if(!draft.intent.frequency){
   openModal('Coach Swolecat',`<div class="coach-console"><div class="eyebrow">ONE QUICK QUESTION</div><div class="coach-question">How many days per week can you train?</div><div class="coach-choice-grid">${[2,3,4,5,6].map(n=>`<button class="btn secondary" onclick="coachAnswerProgramFrequency(${n})">${n} days</button>`).join('')}</div></div>`);
   return;
 }
 if(draft.interactiveBrainFlow){
   const question=coachBrainProgramNeedsQuestion(draft.request);
   if(question==='duration'){
     openModal('Coach Swolecat',`<div class="coach-console"><div class="eyebrow">PROGRAM SETUP</div><div class="coach-question">How much time per workout?</div><div class="coach-choice-grid">${[30,45,60,75].map(m=>`<button class="btn secondary" onclick="coachAnswerProgramDuration(${m})">${m} minutes</button>`).join('')}</div></div>`);
     return;
   }
   if(question==='equipment'){
     openModal('Coach Swolecat',`<div class="coach-console"><div class="eyebrow">PROGRAM SETUP</div><div class="coach-question">What equipment do you have for these workouts?</div><div class="mini">You can change this later; Coach won't assume specialized machines or attachments.</div><div class="coach-choice-grid">${COACH_BRAIN_EQUIPMENT_CHOICES.map(c=>`<button class="btn secondary" onclick="coachAnswerProgramBrainEquipment('${c.key}')">${esc(c.label)}</button>`).join('')}</div></div>`);
     return;
   }
   if(!draft.request.brainEquipment)draft.request.brainEquipment=coachBrainExplicitEquipment(draft.request);
 }
 if(!coachGenerateProgram(draft.request,draft.intent,draft)){
   openModal('Coach Swolecat',`<div class="coach-console"><div class="eyebrow">ADJUST THE PROGRAM</div><div class="coach-question">Those equipment limits don't support every day yet.</div><div class="mini">Try different available equipment or a less demanding split. Coach won't invent exercises or machines. A floor-only full-body plan also needs a genuine pulling option, such as an available pull-up bar; otherwise choose a narrower workout goal.</div><div class="actions"><button class="btn" onclick="coachRetryProgramBrainEquipment()">Change equipment</button><button class="btn secondary" onclick="openCoachSwolecat(true)">New request</button></div></div>`);
   return;
 }
 renderCoachProgramPreview();
}
function coachAnswerProgramFrequency(days){
 if(!coachProgramBuildDraft)return;
 coachProgramBuildDraft.intent.frequency=Math.max(2,Math.min(6,Number(days)||3));
 if(!coachProgramBuildDraft.intent.split)coachProgramBuildDraft.intent.split=coachDefaultProgramSplit(coachProgramBuildDraft.intent.frequency);
 coachContinueProgramRequest();
}
function coachAnswerProgramDuration(minutes){
 if(!coachProgramBuildDraft)return;
 coachProgramBuildDraft.request.duration=Math.max(15,Math.min(120,Number(minutes)||45));
 coachContinueProgramRequest();
}
function coachRetryProgramBrainEquipment(){
 if(!coachProgramBuildDraft)return;
 coachProgramBuildDraft.request.brainEquipment=null;
 coachProgramBuildDraft.request.allowedEquipment=[];
 coachContinueProgramRequest();
}
function coachAnswerProgramBrainEquipment(key){
 if(!coachProgramBuildDraft)return;
 if(key==='custom'){
   openModal('Coach Swolecat',`<div class="coach-console"><div class="eyebrow">PROGRAM EQUIPMENT</div><div class="coach-question">What equipment is available?</div><input id="coachProgramBrainCustomEquipment" class="search" aria-label="Program equipment" placeholder="Dumbbells and cables..." onkeydown="if(event.key==='Enter')coachSubmitProgramBrainCustomEquipment()"><div class="actions"><button class="btn" onclick="coachSubmitProgramBrainCustomEquipment()">Continue</button><button class="btn secondary" onclick="coachRetryProgramBrainEquipment()">Back</button></div></div>`);
   return;
 }
 const result=coachBrainApplyEquipmentChoice(coachProgramBuildDraft.request,key);
 if(!result.ok){showToast(result.message);return}
 coachProgramBuildDraft.request=result.request;coachContinueProgramRequest();
}
function coachSubmitProgramBrainCustomEquipment(){
 if(!coachProgramBuildDraft)return;
 const text=document.getElementById('coachProgramBrainCustomEquipment')?.value||'';
 const result=coachBrainApplyEquipmentChoice(coachProgramBuildDraft.request,'custom',text);
 if(!result.ok){showToast(result.message);return}
 coachProgramBuildDraft.request=result.request;coachContinueProgramRequest();
}
