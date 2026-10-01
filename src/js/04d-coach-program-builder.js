function coachProgramName(request,intent){
 const goal=request.goal==='strength'?'Strength':request.goal==='general'?'Training':'Growth';
 return `Coach · ${intent.frequency}-Day ${coachProgramSplitLabel(intent.split||coachDefaultProgramSplit(intent.frequency))} · ${goal}`;
}
function coachCloneRequest(request){
 return {
   ...request,
   targetKeys:[...(request.targetKeys||[])],targetLabels:[...(request.targetLabels||[])],targetRegions:[...(request.targetRegions||[])],
   allowedEquipment:[...(request.allowedEquipment||[])],excludedEquipment:[...(request.excludedEquipment||[])],
   priorityRegions:[...(request.priorityRegions||[])],excludedExerciseIds:[...(request.excludedExerciseIds||[])],
   requiredExerciseIds:[...(request.requiredExerciseIds||[])]
 };
}
function coachGenerateProgram(request,intent,previous=null){
 const frequency=Math.max(2,Math.min(6,Number(intent.frequency)||0));if(!frequency)return null;
 const split=intent.split||coachDefaultProgramSplit(frequency),slots=coachProgramSlots(frequency,split);
 const req=coachCloneRequest({...request,duration:request.duration||45});
 req.programFocusRegions=[...new Set(intent.focusRegions||request.programFocusRegions||[])];
 req.programFocusLabels=[...new Set(intent.focusLabels||request.programFocusLabels||[])];
 const defaults=coachProgrammingDefaults(req.goal,req.duration),usage={},dayOverrides=previous?.dayOverrides||[];
 const days=slots.map((key,index)=>{
   const group=COACH_TARGET_GROUPS[key],override=dayOverrides[index]||{excludedExerciseIds:[],requiredExerciseIds:[]};
   const targetRegions=[...(group?.regions||[])],targetSet=new Set(targetRegions);
   const dayReq=coachCloneRequest(req);
   dayReq.targetKeys=[key];dayReq.targetLabels=[group?.label||'Workout'];dayReq.targetRegions=targetRegions;
   dayReq.priorityRegions=req.programFocusRegions.filter(region=>targetSet.has(region));
   dayReq.excludedExerciseIds=[...new Set([...(req.excludedExerciseIds||[]),...(override.excludedExerciseIds||[])])];
   dayReq.requiredExerciseIds=[...new Set(override.requiredExerciseIds||[])];
   dayReq.programExerciseUsage=usage;
   const selected=coachSelectExercises(dayReq,defaults.exerciseCount);
   selected.forEach(ex=>usage[ex.id]=(usage[ex.id]||0)+1);
   return {
     key,label:coachProgramDayDisplayLabel(key,index,slots),request:dayReq,
     defaults:{...defaults},selectedIds:selected.map(ex=>ex.id)
   };
 });
 if(days.some(day=>!day.selectedIds.length))return null;
 coachProgramBuildDraft={
   request:req,
   intent:{...intent,frequency,split,preferredDays:[...(intent.preferredDays||[])]},
   slots,days,dayOverrides:slots.map((_,i)=>({
     excludedExerciseIds:[...(dayOverrides[i]?.excludedExerciseIds||[])],
     requiredExerciseIds:[...(dayOverrides[i]?.requiredExerciseIds||[])]
   })),
   createdAt:previous?.createdAt||new Date().toISOString(),
   lastRefinement:previous?.lastRefinement||''
 };
 return coachProgramBuildDraft;
}
function coachProgramWeeklyCoverage(draft=coachProgramBuildDraft){
 const scores={};if(!draft)return scores;
 draft.days.forEach(day=>{
   day.selectedIds.forEach(id=>{
     const ex=exById(id),meta=exerciseMuscleMetadata(ex),sets=day.defaults.sets;
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
 return {
   id,name:`${coachProgramName(r,draft.intent)} · ${day.label}`,
   description:`Generated locally by Coach Swolecat as part of a ${draft.intent.frequency}-day ${coachProgramSplitLabel(draft.intent.split)} program. Evidence rules: ACSM 2026 resistance-training position stand + NSCA program-design framework.`,
   trainingMode:d.trainingMode,
   exercises:day.selectedIds.map(exerciseId=>({
     exerciseId,sets:d.sets,minReps:d.minReps,maxReps:d.maxReps,increment:state.settings.defaultIncrement,
     mode:'double',trainingGoal:d.goal,resetPercent:7.5,restSeconds:d.restSeconds
   }))
 };
}
function renderCoachProgramPreview(){
 const draft=coachProgramBuildDraft;if(!draft)return;
 const req=draft.request,intent=draft.intent,coverage=coachProgramCoverageText(draft);
 const equipment=req.allowedEquipment.length?req.allowedEquipment.join(', '):'Any available equipment';
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
      <div class="row"><div><div class="eyebrow">DAY ${di+1}</div><div class="exercise-name" style="margin-top:4px">${esc(day.label)}</div><div class="mini">${day.selectedIds.length} exercises · ${day.defaults.sets} sets each · ${day.defaults.minReps}–${day.defaults.maxReps} reps · ${day.defaults.restSeconds}s rest</div></div>${intent.preferredDays?.[di]!=null?`<span class="tag">${PROGRAM_DAYS[intent.preferredDays[di]]}</span>`:''}</div>
      <div style="margin-top:9px">${day.selectedIds.map((id,ei)=>{const ex=exById(id);return `<div class="list-item"><div class="grow"><div class="exercise-name">${esc(ex?.name||'Exercise')} ${preferenceBadgeHtml(id)}</div><div class="mini">${esc(coachExerciseReason(ex,day.request))}</div></div><div class="actions" style="margin:0"><button class="btn small secondary" onclick="coachProgramSwapExercise(${di},${ei})">Swap</button><button class="btn small secondary" onclick="coachProgramRemoveExercise(${di},${ei})">Remove</button></div></div>`}).join('')}</div>
    </div>`).join('')}
   </div>
   ${coverage?`<div class="coach-rationale"><b>Planned weekly set-equivalents:</b> ${esc(coverage)}.<br><span class="mini">Primary involvement counts as 1.0 set and secondary involvement as 0.5. This is a planning aid, not a claim about muscle damage or recovery.</span></div>`:''}
   <div class="coach-console"><div class="eyebrow">REFINE // TALK TO COACH</div><div class="mini" style="margin:5px 0 9px">Try “make it 4 days,” “upper/lower,” “35 minutes,” “dumbbells only,” “more shoulders,” or “Monday Tuesday Thursday Saturday.”</div><div class="home-coach-row"><div class="coach-voice-field"><input id="coachProgramRefinePrompt" placeholder="4 days, upper/lower, 40 min, more shoulders..." onkeydown="if(event.key==='Enter')coachApplyProgramRefinement()">${coachVoiceButtonHtml('coachProgramRefinePrompt')}</div><button class="btn" onclick="coachApplyProgramRefinement()">Update</button></div></div>
   <div class="notice">Coach distributes work across the week using your requested frequency, split, equipment, goal, exercise preferences, and a light recent-exercise variety signal. Weekly volume is balanced pragmatically around the time available. The plan does not estimate recovery or medical readiness.</div>
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
 if(equipment.allowed.length){req.allowedEquipment=[...equipment.allowed];req.excludedEquipment=req.excludedEquipment.filter(x=>!equipment.allowed.includes(x));changed=true}
 if(equipment.excluded.length){req.excludedEquipment=[...new Set([...req.excludedEquipment,...equipment.excluded])];req.allowedEquipment=req.allowedEquipment.filter(x=>!equipment.excluded.includes(x));changed=true}
 if(/\bbalanced\b|\bno (?:special )?focus\b|\bevenly\b/.test(raw.toLowerCase())){
   intent.focusRegions=[];intent.focusLabels=[];changed=true;
 }else if(program.focusRegions.length){
   intent.focusRegions=[...new Set(program.focusRegions)];intent.focusLabels=[...new Set(program.focusLabels)];changed=true;
 }
 if(!changed)return {ok:false,message:'I did not find a program change there. Try “4 days,” “upper/lower,” “35 minutes,” “dumbbells only,” or “more shoulders.”'};
 if(intent.preferredDays.length&&intent.preferredDays.length!==intent.frequency)intent.preferredDays=[];
 const previous=structureChanged?null:{...draft,dayOverrides:draft.dayOverrides};
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
 if(!coachGenerateProgram(draft.request,draft.intent,draft)){showToast('Coach could not build every workout with those constraints');return}
 renderCoachProgramPreview();
}
function coachAnswerProgramFrequency(days){
 if(!coachProgramBuildDraft)return;
 coachProgramBuildDraft.intent.frequency=Math.max(2,Math.min(6,Number(days)||3));
 if(!coachProgramBuildDraft.intent.split)coachProgramBuildDraft.intent.split=coachDefaultProgramSplit(coachProgramBuildDraft.intent.frequency);
 coachContinueProgramRequest();
}