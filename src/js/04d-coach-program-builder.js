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
// Day settings are planning instructions, not changes to logged workouts.
// Weekday settings follow their weekday; day index settings follow the slot.
function coachProgramEffectiveDayPlan(intent,index){
 const dayIndex=Math.max(0,Math.trunc(index)||0);
 const weekday=Array.isArray(intent?.preferredDays)&&intent.preferredDays.length===intent.frequency
  ?intent.preferredDays[dayIndex]:null;
 const byDay=intent?.dayPlans?.[dayIndex]||{};
 const byWeekday=weekday!=null?intent?.weekdayPlans?.[weekday]||{}:{};
 return {...byWeekday,...byDay};
}
function coachProgramConflictingFocus(intent){
 const days=coachProgramSlots(intent.frequency,intent.split,intent.customSlots);
 for(let i=0;i<days.length;i++){
  const plan=coachProgramEffectiveDayPlan(intent,i),focus=COACH_TARGET_GROUPS[plan.focusKey],group=COACH_TARGET_GROUPS[days[i]];
  if(focus&&group&&!focus.regions.some(region=>group.regions.includes(region)))
   return {index:i,dayKey:days[i],focusKey:plan.focusKey};
 }
 return null;
}
function coachProgramApplyWeekdayInstructions(intent,instructions){
 intent.weekdayPlans=Object.fromEntries(Object.entries(intent.weekdayPlans||{}).map(([day,plan])=>[day,{...plan}]));
 intent.dayPlans=(intent.dayPlans||[]).map(plan=>({...plan}));
 for(const [weekday,fields] of Object.entries(instructions||{})){
  intent.weekdayPlans[weekday]={...(intent.weekdayPlans[weekday]||{}),...fields};
  const i=(intent.preferredDays||[]).length===intent.frequency
   ?intent.preferredDays.indexOf(Number(weekday)):-1;
  // A newer explicit weekday correction beats an earlier manual slot override,
  // but changes only the fields the user mentioned.
  if(i>=0){
   const slot={...(intent.dayPlans[i]||{})};
   for(const field of Object.keys(fields))delete slot[field];
   intent.dayPlans[i]=slot;
  }
 }
}
function coachProgramClearDayField(intent,field){
 intent.dayPlans=(intent.dayPlans||[]).map(plan=>({...plan,[field]:null,...(field==='equipmentKey'?{equipmentText:''}:{})}));
 intent.weekdayPlans=Object.fromEntries(Object.entries(intent.weekdayPlans||{}).map(([key,plan])=>
  [key,{...plan,[field]:null,...(field==='equipmentKey'?{equipmentText:''}:{})}]));
}
function coachProgramExplicitAllDayRequest(text){
 return /\b(?:all|every|each)\s+(?:(?:of the|training|three|four|five|six|[2-6])\s+)?(?:workouts?|sessions?|days?)\b|\bper\s+(?:workout|session)\b/i.test(text);
}
function coachProgramAllDaysHaveEquipment(intent){
 if(!intent?.frequency)return false;
 return Array.from({length:intent.frequency},(_,i)=>!!coachProgramEffectiveDayPlan(intent,i).equipmentKey).every(Boolean);
}
function coachProgramAllDaysHaveTime(intent){
 if(!intent?.frequency)return false;
 return Array.from({length:intent.frequency},(_,i)=>Number(coachProgramEffectiveDayPlan(intent,i).duration)>0).every(Boolean);
}
function coachProgramDayPlanSummary(day){
 const p=day.dayPlan||{},out=[];
 if(p.duration)out.push(p.duration+' min');
 if(p.equipmentKey&&p.equipmentKey!=='inherit')out.push(day.request.brainEquipment?.label||p.equipmentKey);
 if(p.focusKey&&p.focusKey!=='none')out.push('More '+(COACH_TARGET_GROUPS[p.focusKey]?.label||p.focusKey));
 return out.join(' · ');
}
function coachGenerateProgram(request,intent,previous=null){
 const frequency=Math.max(2,Math.min(6,Number(intent.frequency)||0));if(!frequency)return null;
 const split=intent.split||coachDefaultProgramSplit(frequency),slots=coachProgramSlots(frequency,split,intent.customSlots);
 if(slots.length!==frequency||coachProgramConflictingFocus({...intent,frequency,split}))return null;
 const req=coachCloneRequest({...request,duration:request.duration|| (coachProgramAllDaysHaveTime(intent)?0:45)});
 req.programFocusRegions=[...new Set(intent.focusRegions||request.programFocusRegions||[])];
 req.programFocusLabels=[...new Set(intent.focusLabels||request.programFocusLabels||[])];
 const usage={},muscleUsage={},hingeHistory=[],dayOverrides=previous?.dayOverrides||[];
 const days=slots.map((key,index)=>{
   const group=COACH_TARGET_GROUPS[key],override=dayOverrides[index]||{excludedExerciseIds:[],requiredExerciseIds:[]};
   const excludedRegions=new Set(req.excludedTargetRegions||[]);
   const targetRegions=[...(group?.regions||[])].filter(region=>!excludedRegions.has(region)),targetSet=new Set(targetRegions);
   const plan=coachProgramEffectiveDayPlan(intent,index),dayReq=coachCloneRequest(req);
   dayReq.targetKeys=[key];dayReq.targetLabels=[group?.label||'Workout'];dayReq.targetRegions=targetRegions;
   if(Number(plan.duration)>0)dayReq.duration=Number(plan.duration);
   if(plan.equipmentKey&&plan.equipmentKey!=='inherit'){
     const result=coachBrainApplyEquipmentChoice(dayReq,plan.equipmentKey,plan.equipmentText||'');
     if(!result.ok)return {key,label:coachProgramDayDisplayLabel(key,index,slots),selectedIds:[],brainFeasible:false};
     Object.assign(dayReq,result.request);
     // Day-specific availability may expand from a preset, but it must never
     // negate a global explicit "no barbells/machines/etc." restriction.
     dayReq.excludedEquipment=[...new Set([...(req.excludedEquipment||[]),...(result.request.excludedEquipment||[])])];
     dayReq.allowedEquipment=dayReq.allowedEquipment.filter(key=>!dayReq.excludedEquipment.includes(key));
   }
   const defaults=coachProgrammingDefaults(dayReq.goal,dayReq.duration);
   // A generic custom "Arms" day should emphasize biceps/triceps before
   // optional forearm accessories. An explicit forearm emphasis always wins.
   const primaryArmFocus=split==='custom'&&key==='arms'&&!req.programFocusRegions.includes('forearms')
     ?['biceps','triceps']: [];
   dayReq.priorityRegions=[...new Set([...primaryArmFocus,...req.programFocusRegions.filter(region=>targetSet.has(region))])];
   if(plan.focusKey&&plan.focusKey!=='none'){
     const regions=COACH_TARGET_GROUPS[plan.focusKey]?.regions||[];
     dayReq.priorityRegions=[...new Set([...dayReq.priorityRegions,...regions.filter(region=>targetSet.has(region))])];
   }
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
     key,label:coachProgramDayDisplayLabel(key,index,slots),dayPlan:{...plan},request:dayReq,
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
   intent:{...intent,frequency,split,preferredDays:[...(intent.preferredDays||[])],customSlots:[...(intent.customSlots||[])],
     dayPlans:(intent.dayPlans||[]).map(p=>p?{...p}:{}),
     weekdayPlans:Object.fromEntries(Object.entries(intent.weekdayPlans||{}).map(([k,v])=>[k,{...v}]))},
  intake:{...(previous?.intake||{})},
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
// Phase 2: independent, read-only whole-week quality auditor. This diagnoses
// existing selections, never chooses/replaces exercises or modifies training.
// Muscle set-equivalents are planning heuristics, not biological measurements.
const COACH_PROJECTED_WEEK_ROLES={
 press:{label:'Pressing',patterns:['horizontal_press','incline_press','vertical_press','dip_press'],days:['full body','upper body','push','chest','shoulders'],priority:'core'},
 horizontal_pull:{label:'Horizontal pulling',patterns:['horizontal_pull'],days:['full body','upper body','pull','back','upper back','lats'],priority:'core'},
 vertical_pull:{label:'Vertical pulling',patterns:['vertical_pull'],days:['full body','upper body','pull','back','lats'],priority:'variety'},
 knee:{label:'Knee-dominant legs',patterns:['squat','lunge','knee_extension'],days:['full body','lower body','legs','quads','glutes'],priority:'core'},
 posterior:{label:'Posterior-chain legs',patterns:['hinge','knee_flexion','hip_extension','back_extension'],days:['full body','lower body','legs','hamstrings','glutes','posterior chain','lower back'],priority:'core'},
 knee_flexion:{label:'Hamstring knee flexion',patterns:['knee_flexion'],days:['full body','lower body','legs','hamstrings','posterior chain'],priority:'variety'},
 calves:{label:'Calf-focused work',patterns:['calf_raise'],days:['full body','lower body','legs','calves'],priority:'variety'},
 core:{label:'Core-focused work',patterns:['spinal_flexion','anti_extension','anti_rotation','rotation','lateral_flexion','hip_flexion_core'],days:['full body','core','abs','obliques'],priority:'variety'}
};
function coachProjectedWeekDayKey(day){
 return String(day?.key||'').trim().toLowerCase().replaceAll('_',' ');
}
function coachProjectedWeekRoleFitsDay(role,day){
 return !!COACH_PROJECTED_WEEK_ROLES[role]?.days.includes(coachProjectedWeekDayKey(day));
}
function coachProjectedWeekFeasible(day,match,{maxExamples=3}={}){
 const request=day?.request;
 if(!request?.brainEquipment)return {status:'unverified',examples:[]};
 const service=coachBrainExerciseService(),context=coachBrainEquipmentConstraints(request);
 if(!service||!context)return {status:'unverified',examples:[]};
 const examples=[];
 for(const ex of LIBRARY){
  if(!match(ex)||!coachExerciseAllowedByConstraints(ex,request))continue;
  if(service.evaluateAvailability(ex.id,context).status!=='available')continue;
  examples.push({id:ex.id,name:ex.name,day:day.label||coachProjectedWeekDayKey(day)});
  if(examples.length>=maxExamples)break;
 }
 return {status:examples.length?'feasible':'not_feasible',examples};
}
function coachProjectedWeekFocusSpecific(ex,region){
 const p=ex?.pattern;
 // A press-like push-up or dip can train triceps directly, but does not by
 // itself meet a requested isolation-style triceps priority when the week
 // already has pressing. Prefer a deliberate elbow-extension accessory.
 if(region==='triceps'&&/\b(?:push[ -]?up|dip|bench press|jm press|tate press)\b/i.test(ex?.name||''))return false;
 const matched={
  glutes:['hip_extension','hip_abduction','hinge'],
  hamstrings:['knee_flexion','hinge'],
  quads:['squat','lunge','knee_extension'],
  side_delts:['lateral_raise'],
  rear_delts:['rear_delt'],
  front_delts:['vertical_press','front_raise'],
  triceps:['elbow_extension'],
  biceps:['elbow_flexion'],
  lower_back:['back_extension'],
  lats:['vertical_pull','shoulder_extension','pullover'],
  upper_back:['horizontal_pull'],
  chest:['horizontal_press','incline_press','chest_fly'],
  calves:['calf_raise'],
  core:['anti_extension','spinal_flexion','anti_rotation','hip_flexion_core'],
  obliques:['anti_rotation','rotation','lateral_flexion'],
  adductors:['hip_adduction']
 }[region];
 return !matched||matched.includes(p);
}
function coachProjectedWeekAudit(draft=coachProgramBuildDraft){
 if(!draft?.days?.length)return {version:'phase2-read-only',ready:false,reason:'no_generated_week',findings:[],regions:{},roles:{},days:[]};
 const regions={},roles={},dayRows=[],findings=[],roleFeasibility={};
 const globalPriorities=[...new Set([...(draft.request?.programFocusRegions||[]),...(draft.intent?.focusRegions||[])])].filter(Boolean);
 const addRegion=(muscle,kind,sets,id)=>{
  const r=regions[muscle]||(regions[muscle]={primary:0,secondary:0,exerciseIds:[]});
  r[kind]+=sets;
  if(!r.exerciseIds.includes(id))r.exerciseIds.push(id);
 };
 const append=(type,severity,title,detail,extra={})=>{
  findings.push({type,severity,title,detail,...extra});
 };
 for(const [index,day] of draft.days.entries()){
  const byFamily={},exercises=[],required=new Set(day.request?.requiredExerciseIds||[]);
  const selected=new Set(day.selectedIds||[]);
  for(const id of selected){
   const ex=exById(id);if(!ex){
    append('unknown_exercise','constraint','Unknown planned exercise','The generated day references an exercise that is no longer in the library.',{dayIndex:index,exerciseId:id});
    continue;
   }
   const p=coachExercisePrescription(ex,day.request,day.defaults);
   const sets=Number(day.brainSetCounts?.[id]?.sets||p.sets)||0;
   const family=coachMovementFamily(ex),meta=exerciseMuscleMetadata(ex);
   const row={id,name:ex.name,pattern:ex.pattern,family,sets,
    primary:[...meta.primary],secondary:[...meta.secondary],required:required.has(id)};
   exercises.push(row);
   (byFamily[family]||(byFamily[family]=[])).push(row);
   for(const region of meta.primary)addRegion(region,'primary',sets,id);
   for(const region of meta.secondary)addRegion(region,'secondary',sets*.5,id);
   for(const [role,spec] of Object.entries(COACH_PROJECTED_WEEK_ROLES)){
    if(!spec.patterns.includes(ex.pattern))continue;
    const r=roles[role]||(roles[role]={label:spec.label,count:0,days:[]});
    r.count++;if(!r.days.includes(index))r.days.push(index);
   }
   if(day.request?.brainEquipment){
    const service=coachBrainExerciseService(),context=coachBrainEquipmentConstraints(day.request);
    const available=service?.evaluateAvailability(id,context).status;
    if(!coachExerciseAllowedByConstraints(ex,day.request)||available==='unavailable'){
     append('equipment_violation','constraint',ex.name+' conflicts with available equipment',
      'Check the equipment or explicit exclusions for '+(day.label||'day '+(index+1))+'.',
      {dayIndex:index,exerciseId:id});
    }else if(available!=='available'){
     append('equipment_unconfirmed','review',ex.name+' needs equipment confirmation',
      'Its equipment requirements are not confirmed for '+(day.label||'day '+(index+1))+'.',
      {dayIndex:index,exerciseId:id});
    }
   }
  }
  for(const id of required)if(!selected.has(id)){
   append('required_exercise_absent','constraint','A required exercise is missing',
    'A specifically requested exercise was not selected for '+(day.label||'day '+(index+1))+'.',
    {dayIndex:index,exerciseId:id});
  }
  for(const [family,items] of Object.entries(byFamily)){
   if(items.length<2)continue;
   if(items.every(row=>row.required))continue;
   // This is a *review opportunity* rather than an automatic duplication ban:
   // paired lifts of the same family can be an intentional strength strategy.
   append('same_day_family_overlap','review','Similar '+family.replaceAll('_',' ')+' movements on one day',
    (day.label||'Day '+(index+1))+' includes '+items.map(x=>x.name).join(' and ')+
      '. Review whether both serve different purposes before replacing one.',
    {dayIndex:index,family,exerciseIds:items.map(x=>x.id)});
  }
  dayRows.push({index,label:day.label||'Day '+(index+1),key:coachProjectedWeekDayKey(day),
   exercises,requiredIds:[...required]});
 }
 // An explicitly chosen narrow split never inherits an imaginary full-body
 // obligation. Judge only roles belonging to one or more actual day scopes.
 for(const [role,spec] of Object.entries(COACH_PROJECTED_WEEK_ROLES)){
  const eligibleDays=draft.days.filter(day=>coachProjectedWeekRoleFitsDay(role,day));
  if(!eligibleDays.length)continue;
  const existing=roles[role]?.count||0;
  if(existing)continue;
  let examples=[],unknown=false;
  for(const day of eligibleDays){
   const result=coachProjectedWeekFeasible(day,ex=>spec.patterns.includes(ex.pattern));
   if(result.status==='unverified')unknown=true;
   examples.push(...result.examples);
  }
  const status=examples.length?'feasible':unknown?'unverified':'not_feasible';
  roleFeasibility[role]={status,examples:examples.slice(0,3),eligibleDayCount:eligibleDays.length};
  if(status!=='feasible')continue;
  const isCore=spec.priority==='core';
  append('missing_weekly_role',isCore?'review':'opportunity',
   spec.label+' is absent from this planned week',
   'There is an equipment-compatible '+spec.label.toLowerCase()+' exercise available on a matching day, '+
   'but none was selected. '+(isCore?'Review whether the week needs this major movement role.':
   'This is an optional variety/coverage consideration, not mandatory for every plan.'),
   {role,examples:examples.slice(0,3),priority:isCore?'core':'optional'});
 }
 // Major-region absence is evaluated only for regions that belong to the
 // chosen day/split and are supported by the confirmed available catalog.
 // This complements, rather than replaces, movement roles. A vertical shoulder
 // press is "pressing" but does not automatically cover the chest.
 const majorRegions=['chest','lats','upper_back','quads','hamstrings','glutes'];
 const regionFeasibility={};
 for(const region of majorRegions){
  const dayOptions=draft.days.filter(day=>{
   const allowed=day.request?.targetRegions||COACH_TARGET_GROUPS[coachProjectedWeekDayKey(day)]?.regions||[];
   return allowed.includes(region);
  });
  if(!dayOptions.length)continue;
  const row=regions[region];
  if((Number(row?.primary)||0)+(Number(row?.secondary)||0)>0)continue;
  const examples=[];let unverified=false;
  for(const day of dayOptions){
   const possible=coachProjectedWeekFeasible(day,ex=>exerciseMuscleMetadata(ex).primary.includes(region));
   if(possible.status==='unverified')unverified=true;
   examples.push(...possible.examples);
  }
  const status=examples.length?'feasible':unverified?'unverified':'not_feasible';
  regionFeasibility[region]={status,examples:examples.slice(0,3)};
  if(status!=='feasible')continue;
  append('missing_major_muscle','review',
   (MUSCLE_REGION_LABELS[region]||region)+' has no planned set contribution',
   'This muscle group belongs to the chosen weekly split and has a compatible primary-target exercise, '+
   'but no planned primary or secondary exposure. Review whether to represent it without losing the requested priorities.',
   {region,examples:examples.slice(0,3)});
 }

 // The explicit target is distinct from broad muscle involvement. Squats
 // legitimately involve glutes, but may not satisfy a request to emphasize
 // glutes if there is no deliberate hip-extension/hinge option anywhere.
 const priorityAudit=[];
 const priorityRequests=[...new Set([...globalPriorities,...draft.days.flatMap(day=>day.request?.priorityRegions||[])])];
 for(const region of priorityRequests){
  const global=globalPriorities.includes(region);
  const applicable=draft.days.filter(day=>global
   ?(COACH_TARGET_GROUPS[coachProjectedWeekDayKey(day)]?.regions||[]).includes(region)
   :(day.request?.priorityRegions||[]).includes(region));
  const relevant=applicable.length?applicable:global?draft.days:[];
  const rows=relevant.flatMap(day=>dayRows[draft.days.indexOf(day)]?.exercises||[]);
  const direct=rows.filter(row=>row.primary.includes(region));
  const secondary=rows.filter(row=>row.secondary.includes(region));
  const specific=direct.filter(row=>coachProjectedWeekFocusSpecific(exById(row.id),region));
  const label=MUSCLE_REGION_LABELS[region]||region.replaceAll('_',' ');
  const examples=[];
  let unverified=false;
  for(const day of relevant){
   const r=coachProjectedWeekFeasible(day,ex=>
    exerciseMuscleMetadata(ex).primary.includes(region)&&coachProjectedWeekFocusSpecific(ex,region));
   if(r.status==='unverified')unverified=true;
   examples.push(...r.examples);
  }
  const availability=examples.length?'feasible':unverified?'unverified':'not_feasible';
  const status=specific.length?'specific_direct':direct.length?'broad_primary':secondary.length?'secondary_only':'absent';
  priorityAudit.push({region,label,status,primarySets:direct.reduce((n,x)=>n+x.sets,0),
   secondaryEquivalent:secondary.reduce((n,x)=>n+x.sets*.5,0),
   specificSets:specific.reduce((n,x)=>n+x.sets,0),availability,examples:examples.slice(0,3)});
  if(status==='specific_direct')continue;
  const suffix=availability==='feasible'?' A compatible focus-specific option exists.':
   availability==='not_feasible'?' A compatible focus-specific option was not confirmed with this equipment.':
   ' Available focus-specific equipment cannot be verified.';
  append('priority_'+status,availability==='feasible'?'review':'constraint',
   'Requested '+label+' emphasis is '+(status==='absent'?'absent':status==='secondary_only'?'indirect only':'broad rather than specifically targeted'),
   'The user explicitly prioritized '+label.toLowerCase()+', but this week does not contain focus-specific direct exercise selection.'+suffix,
   {region,status,availability,examples:examples.slice(0,3)});
 }
 const totals=Object.fromEntries(Object.entries(regions).map(([key,r])=>[key,{
  ...r,totalEstimate:r.primary+r.secondary
 }]));
 return {version:'phase2-read-only',ready:true,split:draft.intent?.split||null,
  days:dayRows,regions:totals,roles,roleFeasibility,regionFeasibility,priorities:priorityAudit,
  findings,summary:{
   constraintFindings:findings.filter(f=>f.severity==='constraint').length,
   reviewFindings:findings.filter(f=>f.severity==='review').length,
   optionalFindings:findings.filter(f=>f.severity==='opportunity').length
  },methodology:'Completed plans are estimates; primary=1 set, secondary=0.5 set-equivalents. No compulsory regional quotas, diagnosis or automatic exercise changes.'};
}


// Phase 3 shadow evaluator: propose bounded, evidence-scored, swap-first repairs.
// Deliberately NOT wired into live generation until before/after human review.
// Every candidate is audited in a cloned provisional week; saved user data and
// the caller's draft are immutable. A failed search is a valid no-op.
function coachProjectedRepairFindingKey(f){
 return [f.type,f.role||'',f.region||'',f.dayIndex??'',f.family||''].join(':');
}
function coachProjectedRepairDebt(audit){
 const weights={missing_major_muscle:18,missing_weekly_role:0,
  priority_absent:26,priority_secondary_only:23,priority_broad_primary:12,
  same_day_family_overlap:5};
 return (audit?.findings||[]).reduce((score,f)=>{
  if(f.type==='missing_weekly_role')return score+(f.priority==='core'?17:8);
  if(f.type.startsWith('priority_')&&f.availability!=='feasible')return score;
  return score+(weights[f.type]||0);
 },0);
}
function coachProjectedRepairDeficits(audit){
 return (audit?.findings||[]).filter(f=>
  (f.type==='missing_weekly_role'&&f.examples?.length)||
  (f.type==='missing_major_muscle'&&f.examples?.length)||
  (['priority_absent','priority_secondary_only','priority_broad_primary'].includes(f.type)
    &&f.availability==='feasible'&&f.examples?.length)||
  (f.type==='same_day_family_overlap'&&Number.isInteger(f.dayIndex))
 ).sort((a,b)=>{
  const rank=f=>f.type==='priority_absent'?0:f.type==='priority_secondary_only'?1:
   f.type==='missing_major_muscle'?2:f.type==='missing_weekly_role'&&f.priority==='core'?3:
   f.type==='priority_broad_primary'?4:5;
  return rank(a)-rank(b)||coachProjectedRepairFindingKey(a).localeCompare(coachProjectedRepairFindingKey(b));
 });
}
function coachProjectedRepairProtected(ex,day,index){
 if(!ex)return true;
 if((day.request?.requiredExerciseIds||[]).includes(ex.id))return true;
 // User preference and successfully advancing history trump a marginal score.
 if(typeof preferenceRank==='function'&&preferenceRank(ex.id)>0)return true;
 if(typeof coachExerciseHistoryProfile==='function'&&coachExerciseHistoryProfile(ex.id)?.trend==='up')return true;
 if(day.request?.goal==='strength'&&index===0)return true;
 return false;
}
// A vertical shoulder press is valuable, but three near-identical full-body days
// need not repeat it when a verified vertical pull is entirely absent that week.
// Retain shoulder pressing on days before AND after the proposal and retain this
// day's chest press. User focus, explicit replacements and strength always win.
function coachProjectedRepairCrossDayOverlap(draft,finding,dayIndex,removed){
 const day=draft?.days?.[dayIndex],days=draft?.days||[];
 if(finding.type!=='missing_weekly_role'||finding.role!=='vertical_pull'||
    removed?.pattern!=='vertical_press'||days.length<3||
    dayIndex===0||dayIndex===days.length-1||
    coachProjectedWeekDayKey(day)!=='full body'||
    day.request?.goal==='strength'||day.request?.allowCoachExerciseSwaps===false)return false;
 const focus=[...(day.request?.priorityRegions||[]),
  ...(draft.request?.programFocusRegions||[]),...(draft.intent?.focusRegions||[])];
 if(focus.some(r=>['front_delts','side_delts','rear_delts','shoulders'].includes(r)))return false;
 if(!day.selectedIds.some(id=>['horizontal_press','incline_press'].includes(exById(id)?.pattern)))return false;
 const hasPress=entry=>entry.selectedIds.some(id=>exById(id)?.pattern==='vertical_press');
 return days.slice(0,dayIndex).some(hasPress)&&days.slice(dayIndex+1).some(hasPress);
}

function coachProjectedRepairClone(draft){
 return {...draft,days:draft.days.map(day=>({...day,
  selectedIds:[...(day.selectedIds||[])],
  brainSetCounts:Object.fromEntries(Object.entries(day.brainSetCounts||{}).map(([id,config])=>[id,{...config}]))
 }))};
}
function coachProjectedRepairPreservesDay(original,trial){
 const old=original.selectedIds.map(exById).filter(Boolean);
 const next=trial.selectedIds.map(exById).filter(Boolean);
 if(old.length!==next.length||new Set(trial.selectedIds).size!==next.length)return false;
 if(!(original.request?.requiredExerciseIds||[]).every(id=>trial.selectedIds.includes(id)))return false;
 const core=coachCoveragePlan(original.request,old.length).core;
 if(core.some(slot=>old.some(slot.match)&&!next.some(slot.match)))return false;
 // A new exercise must contribute to this specific day, not an unrelated body
 // part merely because it improves a coarse week-wide numeric score.
 const targets=new Set(original.request?.targetRegions||[]);
 const replacement=next.find(ex=>!original.selectedIds.includes(ex.id));
 if(!replacement||!exerciseMuscleMetadata(replacement).primary.some(r=>targets.has(r)))return false;
 if(!original.brainTime)return true;
 const oldEstimate=Number(original.brainTime.estimateMinutes)||0;
 const newEstimate=Number(trial.brainTime?.estimateMinutes)||0;
 const planned=Number(original.request?.duration)||0;
 // Approximate planning range, not a strict one-minute clock. Do not
 // materially inflate an already full session to fix an optional gap.
 return !!newEstimate&&newEstimate<=Math.max(oldEstimate+4,planned+Math.max(8,Math.ceil(planned*.2)));
}
function coachProjectedRepairRegresses(before,after){
 if((after?.summary?.constraintFindings||0)>(before?.summary?.constraintFindings||0))return true;
 const original=new Set((before.findings||[]).map(coachProjectedRepairFindingKey));
 if((after.findings||[]).some(f=>
  ((f.type==='missing_weekly_role'&&f.priority==='core')||
   f.type==='missing_major_muscle'||f.type==='equipment_violation'||
   f.type==='required_exercise_absent')&&!original.has(coachProjectedRepairFindingKey(f))))return true;
 const priorityRank={specific_direct:3,broad_primary:2,secondary_only:1,absent:0};
 for(const prior of before.priorities||[]){
  const next=(after.priorities||[]).find(p=>p.region===prior.region);
  if(!next||(priorityRank[next.status]??0)<(priorityRank[prior.status]??0))return true;
 }
 return false;
}

// Optional follow-up only after a complete swap search finds no safe improvement.
// This does not authorize arbitrary exercise additions or exact-clock trimming.
function coachProjectedRepairTrySmallAddition(draft,audit,repairedDays,trialBudget){
 if(draft.days.length<3||trialBudget<=0)return {best:null,trials:0};
 const service=typeof coachBrainExerciseService==='function'?coachBrainExerciseService():null;
 if(!service)return {best:null,trials:0};
 const allowed=new Set(['vertical_pull','knee_flexion','calf_raise','lateral_raise',
  'rear_delt','elbow_extension','elbow_flexion','anti_extension','anti_rotation',
  'rotation','spinal_flexion','hip_extension','hip_abduction','chest_fly']);
 let best=null,trials=0;
 for(const finding of coachProjectedRepairDeficits(audit)){
  for(let dayIndex=0;dayIndex<draft.days.length;dayIndex++){
   const day=draft.days[dayIndex],req=day.request;
   if(repairedDays.has(dayIndex)||!req?.brainEquipment||req.goal==='strength'||
      draft.dayOverrides?.[dayIndex]?.excludedExerciseIds?.length||
      draft.dayOverrides?.[dayIndex]?.requiredExerciseIds?.length||
      req.experienceLevel==='beginner'||day.selectedIds.length>=7||
      !Number(req.duration)||!day.brainTime||
      /\b\d{1,2}\s*(?:working\s*)?sets?\b/i.test(String(req.prompt||''))||
      /\b(?:exactly|only|no more than|max(?:imum)?)\s+\d+\s+exercises?\b/i.test(String(req.prompt||'')))continue;
   if(finding.type==='missing_weekly_role'&&!coachProjectedWeekRoleFitsDay(finding.role,day))continue;
   if(finding.type==='missing_major_muscle'&&!(req.targetRegions||[]).includes(finding.region))continue;
   if(finding.type.startsWith('priority_')&&!(req.priorityRegions||[]).includes(finding.region)
      &&!(draft.request?.programFocusRegions||[]).includes(finding.region)
      &&!(draft.intent?.focusRegions||[]).includes(finding.region))continue;
   const context=coachBrainEquipmentConstraints(req);
   if(!context)continue;
   const patternFits=ex=>{
    if(!allowed.has(ex.pattern))return false;
    if(finding.type==='missing_weekly_role')
     return COACH_PROJECTED_WEEK_ROLES[finding.role]?.patterns.includes(ex.pattern);
    if(!exerciseMuscleMetadata(ex).primary.includes(finding.region))return false;
    return finding.type==='missing_major_muscle'||coachProjectedWeekFocusSpecific(ex,finding.region);
   };
   const targets=new Set(req.targetRegions||[]);
   const removedFamilies=new Set((day.brainTimeRemoved||[]).map(id=>coachMovementFamily(exById(id))));
   const existingFamilies=new Set(day.selectedIds.map(id=>coachMovementFamily(exById(id))));
   const possibilities=LIBRARY.filter(ex=>patternFits(ex)&&!day.selectedIds.includes(ex.id)
       &&exerciseMuscleMetadata(ex).primary.some(region=>targets.has(region))
       &&coachExerciseAllowedByConstraints(ex,req)
       &&!existingFamilies.has(coachMovementFamily(ex))
       &&!removedFamilies.has(coachMovementFamily(ex))
       &&service.evaluateAvailability(ex.id,context).status==='available'
       &&Number.isFinite(coachCandidateBaseScore(ex,req)))
    .sort((a,b)=>coachCandidateBaseScore(b,req)-coachCandidateBaseScore(a,req)
       ||a.name.localeCompare(b.name)||String(a.id).localeCompare(String(b.id))).slice(0,5);
   for(const ex of possibilities){
    if(trials>=trialBudget)break;
    trials++;
    const trial=coachProjectedRepairClone(draft),next=trial.days[dayIndex];
    next.selectedIds.push(ex.id);
    next.brainSetCounts[ex.id]={sets:2}; // modest *new* accessory, no alteration to existing sets
    next.brainTime=coachBrainSessionTimeEstimate(next.selectedIds,next.request,next.defaults,
      {explicitConfigById:next.brainSetCounts});
    const timeBefore=Number(day.brainTime.estimateMinutes)||0,timeAfter=Number(next.brainTime.estimateMinutes)||0;
    const target=Number(req.duration),margin=Math.max(6,Math.ceil(target*.15));
    if(!timeAfter||timeAfter>target+margin||timeAfter>timeBefore+7)continue;
    const nextAudit=coachProjectedWeekAudit(trial);
    if(coachProjectedRepairRegresses(audit,nextAudit))continue;
    const improvement=coachProjectedRepairDebt(audit)-coachProjectedRepairDebt(nextAudit);
    const resolved=!nextAudit.findings.some(f=>coachProjectedRepairFindingKey(f)===
      coachProjectedRepairFindingKey(finding));
    if(!resolved||improvement<8)continue;
    const candidate={kind:'add',trial,audit:nextAudit,dayIndex,replacement:ex,
       removed:null,finding,improvement,score:improvement,
       exerciseRank:coachCandidateBaseScore(ex,req),timeBefore,timeAfter};
    if(!best||candidate.score>best.score||
      (candidate.score===best.score&&candidate.exerciseRank>best.exerciseRank)||
      (candidate.score===best.score&&candidate.exerciseRank===best.exerciseRank&&
       [candidate.dayIndex,candidate.replacement.id].join(':').localeCompare(
       [best.dayIndex,best.replacement.id].join(':'))<0))best=candidate;
   }
   if(trials>=trialBudget)break;
  }
  if(trials>=trialBudget)break;
 }
 return {best,trials};
}

function coachProposeProjectedWeekRepair(draft=coachProgramBuildDraft,{maxSwaps=2,maxTrials=120}={}){
 const before=coachProjectedWeekAudit(draft);
 const response={version:'phase3-shadow-swap-first',applied:false,changes:[],
  recommendationOnly:true,requiresUserAcceptance:true,accepted:false,
  before,after:before,draft,reason:'no_meaningful_safe_swap'};
 if(!before.ready||!draft?.days?.length)return {...response,reason:'no_generated_week'};
 if(draft.recommendationsDisabled===true||draft.request?.recommendationsDisabled===true)
  return {...response,reason:'user_declined_recommendations'};
 // Never autonomously "repair" hard conflicts or unknown equipment.
 if(before.findings.some(f=>f.severity==='constraint'&&
   ['equipment_violation','required_exercise_absent','unknown_exercise'].includes(f.type)))
  return {...response,reason:'hard_constraint_requires_user'};
 const limit=Math.max(0,Math.min(2,Math.floor(Number(maxSwaps)||0)));
 const trialLimit=Math.max(0,Math.min(150,Math.floor(Number(maxTrials)||0)));
 if(!limit||!trialLimit)return {...response,reason:'disabled_by_budget'};
 let working=coachProjectedRepairClone(draft),audit=before,trialCount=0;
 const repairedDays=new Set(),changes=[];
 const service=typeof coachBrainExerciseService==='function'?coachBrainExerciseService():null;
 for(let pass=0;pass<limit;pass++){
  let best=null;
  for(const finding of coachProjectedRepairDeficits(audit)){
   for(let dayIndex=0;dayIndex<working.days.length;dayIndex++){
    if(repairedDays.has(dayIndex))continue;
    // Do not silently revisit a day the person has already changed manually.
    const override=working.dayOverrides?.[dayIndex];
    if(override?.excludedExerciseIds?.length||override?.requiredExerciseIds?.length)continue;
    const day=working.days[dayIndex];
    if(day.request?.allowCoachExerciseSwaps===false)continue;
    if(finding.type==='missing_weekly_role'&&!coachProjectedWeekRoleFitsDay(finding.role,day))continue;
    if(finding.type==='same_day_family_overlap'&&finding.dayIndex!==dayIndex)continue;
    if(finding.type==='missing_major_muscle'&&!(day.request?.targetRegions||[]).includes(finding.region))continue;
    if(finding.type.startsWith('priority_')&&!(day.request?.priorityRegions||[]).includes(finding.region)
       &&!(working.request?.programFocusRegions||[]).includes(finding.region)
       &&!(working.intent?.focusRegions||[]).includes(finding.region))continue;
    if(!day.request?.brainEquipment||!service)continue;
    const context=coachBrainEquipmentConstraints(day.request);
    if(!context)continue;
    const matches=ex=>{
     if(finding.type==='missing_weekly_role')
      return COACH_PROJECTED_WEEK_ROLES[finding.role]?.patterns.includes(ex.pattern);
     if(finding.type==='same_day_family_overlap'){
      if(day.request?.goal==='strength')return false;
      const priority=new Set([...(day.request?.priorityRegions||[]),
        ...(working.request?.programFocusRegions||[]),...(working.intent?.focusRegions||[])]);
      const accessoryPatterns=new Set(['hip_abduction','knee_flexion','calf_raise','back_extension',
        'lateral_raise','rear_delt','elbow_extension','elbow_flexion','anti_extension','hip_adduction']);
      return accessoryPatterns.has(ex.pattern)&&exerciseMuscleMetadata(ex).primary.some(region=>
       priority.has(region)&&coachProjectedWeekFocusSpecific(ex,region));
     }
     const primary=exerciseMuscleMetadata(ex).primary.includes(finding.region);
     return primary&&(finding.type==='missing_major_muscle'||
      coachProjectedWeekFocusSpecific(ex,finding.region));
    };
    const replacements=LIBRARY.filter(ex=>matches(ex)&&!day.selectedIds.includes(ex.id)
     &&coachExerciseAllowedByConstraints(ex,day.request)
     &&service.evaluateAvailability(ex.id,context).status==='available'
     &&Number.isFinite(coachCandidateBaseScore(ex,day.request)))
     .sort((a,b)=>coachCandidateBaseScore(b,day.request)-coachCandidateBaseScore(a,day.request)
        ||a.name.localeCompare(b.name)||String(a.id).localeCompare(String(b.id))).slice(0,6);
    const families=day.selectedIds.map(id=>coachMovementFamily(exById(id)));
    for(let removedIndex=day.selectedIds.length-1;removedIndex>=0;removedIndex--){
     const removed=exById(day.selectedIds[removedIndex]);
     if(coachProjectedRepairProtected(removed,day,removedIndex))continue;
     const sameFamily=families.filter(f=>f===coachMovementFamily(removed)).length>1;
     const compound=COACH_COMPOUND_PATTERNS.has(removed.pattern);
     // Retain the first foundational movement when a family is repeated.
     if(sameFamily&&families.indexOf(coachMovementFamily(removed))===removedIndex)continue;
     // Unique foundational compounds stay. A narrow exception exists for a
     // *cross-day* repeated optional shoulder press in full-body programming:
     // preserve that day's chest press and presses on both surrounding days.
     const crossDay=coachProjectedRepairCrossDayOverlap(working,finding,dayIndex,removed);
     if(compound&&!sameFamily&&!crossDay)continue;
     for(const replacement of replacements){
      if(trialCount>=trialLimit)break;
      if(coachMovementFamily(replacement)===coachMovementFamily(removed))continue;
      if(day.selectedIds.some(id=>id!==removed.id&&
         coachMovementFamily(exById(id))===coachMovementFamily(replacement)))continue;
      trialCount++;
      const trial=coachProjectedRepairClone(working);
      const next=trial.days[dayIndex];
      next.selectedIds[removedIndex]=replacement.id;
      delete next.brainSetCounts[removed.id];
      if(day.brainTime)next.brainTime=coachBrainSessionTimeEstimate(
       next.selectedIds,next.request,next.defaults,{explicitConfigById:next.brainSetCounts});
      if(!coachProjectedRepairPreservesDay(day,next))continue;
      const nextAudit=coachProjectedWeekAudit(trial);
      if(coachProjectedRepairRegresses(audit,nextAudit))continue;
      const improvement=coachProjectedRepairDebt(audit)-coachProjectedRepairDebt(nextAudit);
      const resolved=!nextAudit.findings.some(f=>coachProjectedRepairFindingKey(f)===
       coachProjectedRepairFindingKey(finding));
      // No speculative churn: actually resolve the finding we targeted and
      // improve the whole-week score by a meaningful amount.
      if(!resolved||improvement<(finding.type==='same_day_family_overlap'?5:6))continue;
      const candidate={trial,audit:nextAudit,dayIndex,removed,replacement,
       finding,improvement,score:improvement+(sameFamily?2:0)-(compound&&!crossDay?2:0),
       crossDayOverlap:crossDay,
       exerciseRank:coachCandidateBaseScore(replacement,day.request),
       timeBefore:day.brainTime?.estimateMinutes??null,timeAfter:next.brainTime?.estimateMinutes??null};
      // First prefer actual weekly debt reduction; when tied choose the
      // existing Coach selector's more appropriate exercise, not lowest ID.
      if(!best||candidate.score>best.score||
       (candidate.score===best.score&&candidate.exerciseRank>best.exerciseRank)||
       (candidate.score===best.score&&candidate.exerciseRank===best.exerciseRank&&
        [candidate.dayIndex,candidate.removed.id,candidate.replacement.id].join(':')
          .localeCompare([best.dayIndex,best.removed.id,best.replacement.id].join(':'))<0))best=candidate;
     }
     if(trialCount>=trialLimit)break;
    }
    if(trialCount>=trialLimit)break;
   }
   if(trialCount>=trialLimit)break;
  }
  // Swap-first: only consider a modest two-set accessory after exhausting swaps.
  if(!best&&trialCount<trialLimit){
   const added=coachProjectedRepairTrySmallAddition(working,audit,repairedDays,trialLimit-trialCount);
   trialCount+=added.trials;
   if(added.best)best=added.best;
  }
  if(!best)break;
  working=best.trial;audit=best.audit;
  repairedDays.add(best.dayIndex);
  changes.push({kind:best.kind||'swap',dayIndex:best.dayIndex,day:working.days[best.dayIndex].label,
   removedId:best.removed?.id||null,removedName:best.removed?.name||null,
   addedId:best.replacement.id,addedName:best.replacement.name,
   finding:best.finding.type,role:best.finding.role||null,region:best.finding.region||null,
   improvement:best.improvement,estimateBefore:best.timeBefore,estimateAfter:best.timeAfter,
   reason:best.crossDayOverlap
    ?'Optional weekly-balance suggestion: trade one repeated shoulder press for vertical pulling. Keep the original or swap this exercise as you prefer.'
    :(best.kind==='add'?'Optional two-set accessory suggestion to address ':'Optional exercise swap to address ')+
      best.finding.title.toLowerCase(),
   optional:true,editable:true,requiresUserAcceptance:true});
  if(trialCount>=trialLimit)break;
 }
 return {...response,applied:changes.length>0,changes,after:audit,
  draft:changes.length?working:draft,reason:changes.length?'proposed_for_human_review':
   trialCount>=trialLimit?'trial_budget_exhausted':'no_meaningful_safe_swap',trials:trialCount};
}

// Planning-only quality review of the *current* generated preview.
// No automatic plan changes, physiological "readiness" claims, or storage writes.
function coachBrainProgramWeekReview(draft=coachProgramBuildDraft){
 if(!draft?.days?.length)return {notes:[],roles:{},primary:{},focus:[]};
 const roleSpecs={
  press:new Set(['horizontal_press','incline_press','vertical_press','dip_press']),
  pull:new Set(['horizontal_pull','vertical_pull']),
  knee:new Set(['squat','lunge','knee_extension']),
  posterior:new Set(['hinge','knee_flexion','hip_extension','back_extension'])
 };
 const roles={press:0,pull:0,knee:0,posterior:0},primary={},notes=[],dayRoles=[];
 const scores=coachProgramWeeklyCoverage(draft);
 const focusRegions=[...new Set((draft.request?.programFocusRegions||draft.intent?.focusRegions||[]).filter(Boolean))];
 const focus=focusRegions.filter(m=>Number(scores[m]||0)>0).map(m=>({region:m,sets:Number((scores[m]||0).toFixed(1))}));
 draft.days.forEach((day,idx)=>{
  const dayPrimary=new Set(),dayPatterns=new Set();
  for(const id of day.selectedIds||[]){
   const ex=exById(id);if(!ex)continue;
   const meta=exerciseMuscleMetadata(ex);
   for(const m of meta.primary){dayPrimary.add(m);primary[m]=(primary[m]||0)+1}
   dayPatterns.add(ex.pattern);
   for(const [role,patterns] of Object.entries(roleSpecs)){
    if(patterns.has(ex.pattern))roles[role]++;
   }
  }
  const requested=day.request?.targetRegions||COACH_TARGET_GROUPS[day.key]?.regions||[];
  if(requested.length&&day.selectedIds?.length&&!requested.some(m=>dayPrimary.has(m))){
   notes.push({key:'day_focus_'+idx,kind:'review',text:`Day ${idx+1} (${day.label}) has no primary exercise for its chosen focus. Review the exercise selection or broaden available equipment.`});
  }
  dayRoles.push({label:day.label,patterns:[...dayPatterns]});
 });
 // A total lack of a broad movement role is worth surfacing even when a
 // deliberate body-part split is narrower than general whole-body programming.
 const missed=[];
 if(!roles.press)missed.push('pressing');
 if(!roles.pull)missed.push('rowing or pulldown');
 if(!roles.knee)missed.push('knee-dominant leg');
 if(!roles.posterior)missed.push('posterior-chain');
 if(missed.length){
  notes.push({key:'movement_coverage',kind:'choice',text:`This week has no ${missed.join(', ')} movement selected. That may fit a deliberately narrow split, but consider whether you want broader coverage.`});
 }
 // Separate chest-specific underrepresentation from shoulder pressing. Only
 // mention it for a self-chosen custom split, not every targeted session.
 if(draft.intent?.split==='custom'&&!primary.chest){
  notes.push({key:'chest_direct',kind:'choice',text:'Your custom split includes no primary chest exercise. If chest growth matters to you, consider adding direct chest work while keeping your preferred day structure.'});
 }
 if(focusRegions.length){
  const unserved=focusRegions.filter(m=>(scores[m]||0)===0);
  if(unserved.length){
   const labels=unserved.slice(0,3).map(m=>MUSCLE_REGION_LABELS[m]||m);
   notes.push({key:'focus_gap',kind:'review',text:`Your requested emphasis includes ${labels.join(', ')}, but those regions have no planned set contribution. Consider an exercise change if that emphasis is important.`});
  }
 }
 return {notes:notes.slice(0,4),roles,primary,focus,dayRoles,scores};
}
function coachBrainProgramWeekReviewHtml(draft=coachProgramBuildDraft){
 const review=coachBrainProgramWeekReview(draft);
 if(!draft?.days?.length)return '';
 const roles=[['press','Press'],['pull','Pull'],['knee','Knee'],['posterior','Posterior']]
  .map(([key,name])=>`${name}: ${review.roles[key]>0?'present':'not selected'}`).join(' · ');
 return `<div class="coach-rationale" id="coachProgramWeekReview" role="region" aria-label="Coach whole-week review">
  <div class="eyebrow">WHOLE-WEEK REVIEW // YOUR CHOICES</div>
  <div class="mini" style="margin:6px 0 9px">${esc(roles)}</div>
  ${review.notes.length?review.notes.map(n=>`<div class="mini" style="margin:7px 0">• ${esc(n.text)}</div>`).join(''):'<div class="mini">Your selected week has the major push, pull, knee and posterior patterns represented. Review its exact exercises and time ranges before saving.</div>'}
  <div class="mini" style="margin-top:8px">Planning observations, not diagnoses or mandatory training targets. Coach never changes your chosen split based on this review.</div>
 </div>`;
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
   description:`Generated locally by Coach Swolecat as part of a ${draft.intent.frequency}-day ${coachProgramSplitLabel(draft.intent.split)} program. Planned session: ${day.request.duration} min, ${day.request.brainEquipment?.label||'equipment not specified'}. Evidence rules: ACSM 2026 resistance-training position stand + NSCA program-design framework.`,
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
 const varied= draft.days.some((day,di)=>day.request.duration!==draft.days[0]?.request.duration||day.request.brainEquipment?.choice!==draft.days[0]?.request.brainEquipment?.choice);
 const equipment=coachBrainResolveEquipment(req)?.label||(req.allowedEquipment.length?req.allowedEquipment.join(', '):draft.days.every(day=>day.request.brainEquipment)?'Equipment varies by day':'Equipment not specified');
 openModal('Coach Swolecat',`
  <div class="coach-builder">
   <div class="coach-console">
    <div class="eyebrow">PROGRAM BUILD // LOCAL ENGINE</div>
    <div class="coach-preview-head"><div class="coach-preview-heading"><div class="exercise-name" style="font-size:1.16rem;margin-top:5px">${esc(coachProgramName(req,intent))}</div><div class="mini" style="margin-top:5px">${intent.frequency} workouts · ${esc(coachProgramScheduleText(draft))} · ${varied?'session settings vary by day':`each workout targets about ${draft.days[0]?.request.duration||req.duration} minutes`}</div></div><span class="tag">${esc(coachProgramSplitLabel(intent.split))}</span></div>
    ${draft.lastRefinement?`<div class="mini" style="margin-top:8px"><b>Last change:</b> ${esc(draft.lastRefinement)}</div>`:''}
    <div class="coach-preview-meta"><span class="tag">${esc(coachGoalLabel(req.goal))}</span><span class="tag">${esc(equipment)}</span><span class="tag">${intent.frequency}×/week</span><span class="tag">${esc(programTrainingModeLabel(intent.trainingMode||'inherit'))}</span></div>
     ${intent.trainingMode==='guided'?`<div class="mini" style="margin-top:9px">Deloads: ${intent.deload?.enabled?`every ${intent.deload.intervalWeeks}th training week, subject to your confirmation`:'not scheduled (you can add these later)'}</div>`:''}
   </div>
   <div class="coach-console coach-program-composer"><div class="eyebrow">ASK COACH // REFINE THIS PLAN</div><details class="coach-program-prompt-tips"><summary>Ideas for changes</summary><div class="mini" style="margin:5px 0 9px">Try “4 days, upper/lower and 35 minutes,” “dumbbells only,” “no squats, more glutes,” or “Monday Tuesday Thursday Saturday.”</div></details><div class="home-coach-row"><div class="coach-voice-field"><input id="coachProgramRefinePrompt" aria-label="Describe changes to this Coach program" placeholder="Tell Coach what to change" onkeydown="if(event.key==='Enter')coachApplyProgramRefinement()">${coachVoiceButtonHtml('coachProgramRefinePrompt')}</div><button class="btn" onclick="coachApplyProgramRefinement()">Update</button></div></div>
   <div class="coach-exercise-list">
    ${draft.days.map((day,di)=>`<div class="card coach-program-day-card" style="margin:0">
      <div class="row coach-program-day-head"><div class="coach-program-day-summary"><div class="eyebrow">DAY ${di+1}</div><div class="exercise-name" style="margin-top:4px">${esc(day.label)}</div><div class="mini">${day.selectedIds.length} exercises · ${day.brainTime?`about ${day.brainTime.estimateMinutes} min (range ${day.brainTime.lowerMinutes}–${day.brainTime.upperMinutes})`:`${day.defaults.sets} sets each`} · ${day.defaults.minReps}–${day.defaults.maxReps} reps</div><button class="btn small secondary" style="margin-top:7px" onclick="coachEditProgramDay(${di})" aria-label="Adjust ${esc(day.label)} time equipment and focus">Adjust day</button>${coachProgramDayPlanSummary(day)?`<div class="mini" style="margin-top:5px">${esc(coachProgramDayPlanSummary(day))}</div>`:''}</div>${intent.preferredDays?.[di]!=null?`<span class="tag">${PROGRAM_DAYS[intent.preferredDays[di]]}</span>`:''}</div>
      <details class="coach-program-day-details" ${di===0?'open':''}><summary>Review ${day.selectedIds.length} exercises and make changes</summary><div style="margin-top:9px">${day.selectedIds.map((id,ei)=>{const ex=exById(id);return `<div class="list-item coach-program-exercise-row"><div class="grow"><div class="exercise-name">${esc(ex?.name||'Exercise')} ${preferenceBadgeHtml(id)}</div><div class="mini">${esc(coachExerciseReason(ex,day.request))} · ${day.brainSetCounts?.[id]?.sets||coachExercisePrescription(ex,day.request,day.defaults).sets} working sets</div></div><div class="actions coach-program-exercise-actions" style="margin:0"><button class="btn small secondary" onclick="coachProgramSwapExercise(${di},${ei})">Swap</button><button class="btn small secondary" onclick="coachProgramRemoveExercise(${di},${ei})">Remove</button></div></div>`}).join('')}</div></details>
    </div>`).join('')}
   </div>
   ${coverage?`<details class="coach-program-secondary"><summary>Weekly muscle distribution</summary><div class="coach-rationale"><b>Planned weekly set-equivalents:</b> ${esc(coverage)}.<br><span class="mini">Primary involvement counts as 1.0 set and secondary involvement as 0.5. This is a planning aid, not a claim about muscle damage or recovery.</span></div></details>`:''}
   <details class="coach-program-secondary"><summary>Whole-week coaching review</summary>${coachBrainProgramWeekReviewHtml(draft)}</details>
   ${coachBrainEquipmentPreviewNotice(req)?`<div class="notice">${esc(coachBrainEquipmentPreviewNotice(req))}</div>`:''}
   ${draft.days.some(day=>day.brainTime?.overTarget)?`<div class="notice">One or more days exceed your requested time at the estimated midpoint. Review the work or allow more time before saving.</div>`:draft.days.some(day=>day.brainTime&&day.brainTime.upperMinutes>day.brainTime.targetMinutes)?`<div class="notice">Some days could run past your target if warm-ups, equipment transitions or rest take longer. Each day's time range is a planning estimate, not a guaranteed finish time.</div>`:''}
   <details class="coach-program-secondary"><summary>Why Coach chose this plan</summary><div class="notice">Coach distributes work across the week using your requested frequency, split, equipment, goal, exercise preferences, completed training history, planned muscle set-equivalents from earlier program days, and progression continuity. Weekly workload is used as programming context only; the plan does not diagnose recovery or medical readiness.</div></details>
   <div class="actions coach-program-save-actions"><button class="btn green" onclick="coachStartProgramFirstWorkout()">Save + Start Day 1</button><button class="btn" onclick="coachSaveGeneratedProgram()">Save Program</button><button class="btn secondary" onclick="openCoachSwolecat(true)">New Request</button></div>
  </div>`, 'modal-mode-coach-program');
}
// Dedicated day editor keeps controls accessible on narrow Android screens.
// It changes the unsaved draft only after successful feasibility regeneration.
function coachEditProgramDay(index){
 const draft=coachProgramBuildDraft,day=draft?.days?.[index];if(!day)return;
 const plan=coachProgramEffectiveDayPlan(draft.intent,index);
 const key=plan.equipmentKey||'inherit';
 const equipmentChoices=[...(draft.request.brainEquipment||coachBrainExplicitEquipment(draft.request)?[['inherit','Use shared program equipment']]:[]),['gym','Gym (common equipment)'],
  ['dumbbells','Dumbbells + bodyweight'],['bodyweight','Bodyweight only'],['custom','Other equipment']];
 const focusChoices=[['none','Keep the usual day focus'],...['chest','back','shoulders','arms','biceps','triceps','quads','hamstrings','glutes','calves','core']
  .filter(k=>(COACH_TARGET_GROUPS[k]?.regions||[]).some(m=>day.request.targetRegions.includes(m)))
  .map(k=>[k,'More '+COACH_TARGET_GROUPS[k].label])];
 const focus=plan.focusKey||'none';
 openModal('Coach Swolecat',`<div class="coach-builder coach-day-editor">
   <div class="coach-console">
    <div class="eyebrow">PROGRAM DAY ${index+1} // ADJUST</div>
    <div class="exercise-name" style="font-size:1.1rem">${esc(day.label)}</div>
    <div class="mini" style="margin-top:7px">Adjust only this session. Your chosen split, other days and previous workout history stay the same.</div>
   </div>
   <label for="coachDayMinutes">Time available for this workout (15–120 minutes)</label>
   <input id="coachDayMinutes" class="search" type="number" min="15" max="120" step="1" value="${plan.duration||day.request.duration}" aria-label="Minutes for this workout">
   <label for="coachDayEquipment">Equipment available for this workout</label>
   <select id="coachDayEquipment" class="search" aria-label="Equipment for this workout" onchange="coachToggleProgramDayCustomEquipment()">${equipmentChoices.map(([id,label])=>`<option value="${id}"${key===id?' selected':''}>${esc(label)}</option>`).join('')}</select>
   <div class="coach-day-custom-field" id="coachDayCustomBlock" ${key==='custom'?'':'hidden'}>
    <label for="coachDayCustomEquipment">Other equipment</label>
    <input id="coachDayCustomEquipment" class="search" aria-label="Other equipment for this workout" maxlength="160" placeholder="Dumbbells and cables..." value="${escAttr(plan.equipmentText||'')}" ${key==='custom'?'':'disabled'}>
   </div>
   <label for="coachDayFocus">Extra emphasis on this day</label>
   <select id="coachDayFocus" class="search" aria-label="Extra focus for this workout">${focusChoices.map(([id,label])=>`<option value="${id}"${focus===id?' selected':''}>${esc(label)}</option>`).join('')}</select>
   <div class="mini">Only muscle groups already within ${esc(day.label)} are offered; change the split separately if you want a different day type.</div>
   <div class="actions"><button class="btn" onclick="coachSaveProgramDaySettings(${index})">Apply to Day ${index+1}</button><button class="btn secondary" onclick="renderCoachProgramPreview()">Cancel</button></div>
  </div>`);
}
function coachToggleProgramDayCustomEquipment(){
 const custom=document.getElementById('coachDayEquipment')?.value==='custom';
 const wrap=document.getElementById('coachDayCustomBlock');
 const input=document.getElementById('coachDayCustomEquipment');
 if(wrap)wrap.hidden=!custom;
 if(input){
  input.disabled=!custom;
  if(custom)input.focus();
 }
}
function coachSaveProgramDaySettings(index){
 const draft=coachProgramBuildDraft,day=draft?.days?.[index];if(!day)return false;
 const minutes=Number(document.getElementById('coachDayMinutes')?.value);
 const equipmentKey=document.getElementById('coachDayEquipment')?.value||'inherit';
 const equipmentText=(document.getElementById('coachDayCustomEquipment')?.value||'').trim();
 const focusKey=document.getElementById('coachDayFocus')?.value||'none';
 if(!Number.isInteger(minutes)||minutes<15||minutes>120){showToast('Choose 15–120 minutes for this day');return false}
 if(!['inherit','gym','dumbbells','bodyweight','custom'].includes(equipmentKey)){showToast('Choose a valid equipment option');return false}
 if(equipmentKey==='inherit'&&!draft.request.brainEquipment&&!coachBrainExplicitEquipment(draft.request)){
  showToast('No shared equipment is set. Choose what is available for this workout.');return false;
 }
 if(equipmentKey==='custom'){
  const check=coachBrainApplyEquipmentChoice(day.request,'custom',equipmentText);
  if(!check.ok){showToast(check.message);return false}
 }
 if(focusKey!=='none'&&!(COACH_TARGET_GROUPS[focusKey]?.regions||[]).some(m=>day.request.targetRegions.includes(m))){
  showToast('Choose a muscle group within this workout focus');return false;
 }
 const updated={...draft.intent,preferredDays:[...(draft.intent.preferredDays||[])],
  dayPlans:[...(draft.intent.dayPlans||[])].map(p=>({...p})),
  weekdayPlans:{...(draft.intent.weekdayPlans||{})}};
 updated.dayPlans[index]={duration:minutes,equipmentKey,
  equipmentText:equipmentKey==='custom'?equipmentText:'',focusKey};
 const previous={...draft,dayOverrides:draft.dayOverrides};
 if(!coachGenerateProgram(draft.request,updated,previous)){
  showToast('These day-specific constraints could not produce a workable workout. Try more time or different equipment.');
  return false;
 }
 coachProgramBuildDraft.lastRefinement='Adjusted '+day.label+' only';
 renderCoachProgramPreview();return true;
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
 const req=coachCloneRequest(draft.request),intent={...draft.intent,preferredDays:[...(draft.intent.preferredDays||[])],customSlots:[...(draft.intent.customSlots||[])],dayPlans:(draft.intent.dayPlans||[]).map(p=>({...p})),weekdayPlans:Object.fromEntries(Object.entries(draft.intent.weekdayPlans||{}).map(([k,v])=>[k,{...v}]))};
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
 const scoped=Object.values(program.weekdayPlans||{}),hasScopedTime=scoped.some(x=>x.duration),hasScopedEquipment=scoped.some(x=>x.equipmentKey);
 const explicitSharedTime=coachProgramExplicitAllDayRequest(raw);
 const explicitAll=explicitSharedTime&&!scoped.length;
 let changed=false,structureChanged=false;
 if(parsed.duration&&(!hasScopedTime||explicitSharedTime)){req.duration=parsed.duration;changed=true}
 if(parsed.duration&&explicitAll)coachProgramClearDayField(intent,'duration');
 if(goal&&goal!==req.goal){req.goal=goal;changed=true}
 const explicitFrequency=/\b[2-6]\s*[- ]?days?(?:\s+(?:a|per)\s+week)?\b|\b[2-6]\s*(?:x|times)\s*(?:a|per)?\s*week\b/i.test(coachNumbersToDigits(raw));
 if(explicitFrequency&&program.frequency&&program.frequency!==intent.frequency){intent.frequency=program.frequency;changed=true;structureChanged=true}
 if(program.split&&program.split!==intent.split){intent.split=program.split;if(program.split!=='custom')intent.customSlots=[];changed=true;structureChanged=true}
 if(program.trainingMode&&program.trainingMode!==intent.trainingMode){
  intent.trainingMode=program.trainingMode;
  if(intent.trainingMode!=='guided')intent.deload=programDeloadConfig({enabled:false});
  changed=true;
 }
 if(program.deload&&intent.trainingMode==='guided'){
  intent.deload=programDeloadConfig(program.deload);
  changed=true;
 }
 if(scoped.length){
   coachProgramApplyWeekdayInstructions(intent,program.weekdayPlans);
   changed=true;
 }
 if(program.preferredDays.length&&!(scoped.length&&intent.preferredDays?.length===intent.frequency&&program.preferredDays.length<intent.frequency)){
   if(program.preferredDays.length!==intent.frequency){
     return {ok:false,message:'You named '+program.preferredDays.length+' weekdays for a '+intent.frequency+'-day program. Add missing weekdays, explicitly change the days-per-week frequency, or choose a flexible schedule. Coach will not silently change your program.'};
   }
   intent.preferredDays=[...program.preferredDays];
   changed=true;structureChanged=true;
 }
 if(equipment.allowed.length&&!hasScopedEquipment){
   req.scopedEquipmentOnly=false;
   req.allowedEquipment=[...equipment.allowed];
   req.brainEquipment=coachBrainExplicitEquipment({...req,prompt:raw,allowedEquipment:equipment.allowed});
   req.excludedEquipment=req.excludedEquipment.filter(x=>!equipment.allowed.includes(x));changed=true;
 }
 if(!hasScopedEquipment&&/\b(?:full|commercial|standard|well[- ]equipped)\s+gym\b/i.test(raw)){
   req.scopedEquipmentOnly=false;
   req.brainEquipment=coachBrainExplicitEquipment({...req,prompt:raw,allowedEquipment:[]});
   req.allowedEquipment=[...(req.brainEquipment?.allowed||[])];changed=true;
 }
 if(explicitAll&&!hasScopedEquipment&&req.brainEquipment&&
   (equipment.allowed.length||/\b(?:full|commercial|standard|well[- ]equipped)\s+gym\b/i.test(raw)))coachProgramClearDayField(intent,'equipmentKey');
 const natural=coachBrainApplyNaturalExerciseChange(req,raw);
 if(natural.changed){req.excludedMovementPatterns=natural.request.excludedMovementPatterns;changed=true;}
 if(equipment.excluded.length){req.excludedEquipment=[...new Set([...req.excludedEquipment,...equipment.excluded])];req.allowedEquipment=req.allowedEquipment.filter(x=>!equipment.excluded.includes(x));changed=true}
 if(/\bbalanced\b|\bno (?:special )?focus\b|\bevenly\b/.test(raw.toLowerCase())){
   intent.focusRegions=[];intent.focusLabels=[];changed=true;
 }else if(program.focusRegions.length&&!scoped.some(x=>x.focusKey)){
   intent.focusRegions=[...new Set(program.focusRegions)];intent.focusLabels=[...new Set(program.focusLabels)];changed=true;
 }
 const badFocus=coachProgramConflictingFocus(intent);
 if(badFocus)return {ok:false,message:'Day '+(badFocus.index+1)+' is '+(COACH_TARGET_GROUPS[badFocus.dayKey]?.label||badFocus.dayKey)+', but the requested '+(COACH_TARGET_GROUPS[badFocus.focusKey]?.label||badFocus.focusKey)+' emphasis does not belong to that day. Change the split or select a matching focus.'};
 if(!changed)return {ok:false,message:'I did not find a program change. Try “4 days,” “35 minutes,” “dumbbells only,” “no squats,” or “more shoulders.”'};
 if(intent.preferredDays.length&&intent.preferredDays.length!==intent.frequency)intent.preferredDays=[];
 if(intent.split==='custom'&&intent.customSlots?.length!==intent.frequency)
   return {ok:false,message:'A custom split needs one muscle focus per training day. Rebuild it using Coach program setup.'};
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
   coachPlannedDays:draft.days.map((day,i)=>({
     label:day.label,weekday:draft.intent.preferredDays?.[i]??null,
     durationMinutes:day.request.duration,
     equipmentLabel:day.request.brainEquipment?.label||'Equipment not specified',
     focusKey:day.dayPlan?.focusKey||null
   })),
   trainingMode:['guided','strength','track','inherit'].includes(draft.intent.trainingMode)?draft.intent.trainingMode:'inherit',
   deload:programDeloadConfig(draft.intent.trainingMode==='guided'?draft.intent.deload:{enabled:false}),nextIndex:0
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
// Program intake is ephemeral until Save Program. Specific prompts skip answered steps.
const COACH_PROGRAM_DAY_FOCUSES=['push','pull','legs','chest','back','shoulders','arms','upper body','lower body','full body'];
function coachProgramIntake(d=coachProgramBuildDraft){if(d&&!d.intake)d.intake={};return d?.intake||null}
function coachProgramHasExplicitGoal(req){
 return /\b(?:hypertrophy|muscle growth|build muscle|gain muscle|strength|stronger|get strong|powerlifting|general fitness|general training|stay active)\b/i.test(String(req?.prompt||''));
}
function coachProgramQuestion(title,body,note=''){
 openModal('Coach Swolecat',`<div class="coach-console"><div class="eyebrow">PROGRAM SETUP // YOUR PLAN</div><div class="coach-question">${esc(title)}</div>${note?`<div class="mini" style="margin:8px 0">${esc(note)}</div>`:''}${body}
 <div class="mini" style="margin:12px 0 6px">Or tell Coach in your own words. You can answer more than one question at once.</div>
 <div class="home-coach-row"><div class="coach-voice-field"><input id="coachProgramAnswer" aria-label="Your answer to Coach" placeholder="45 minutes, full gym, Mon Wed Fri..." onkeydown="if(event.key==='Enter')coachSubmitProgramAnswer()">${coachVoiceButtonHtml('coachProgramAnswer')}</div><button class="btn" onclick="coachSubmitProgramAnswer()">Send</button></div></div>`);
}
function coachSubmitProgramAnswer(){
 const d=coachProgramBuildDraft;if(!d)return;
 const text=document.getElementById('coachProgramAnswer')?.value.trim()||'';
 if(!text){showToast('Tell Coach your preference or tap a choice');return}
 if(!d.intent.split&&/\b(?:help me choose|recommend|suggest|not sure|unsure|i don'?t know|no idea|surprise me|up to you|your call|you choose)\b/i.test(text)){
  coachProgramIntake(d).splitAdvice=true;coachContinueProgramRequest();return;
 }
 const intent=d.intent,req=d.request,a=coachProgramIntake(d),parsed=coachParseProgramIntent(text),p=coachParsePrompt(text,req.goal);
 const scoped=Object.values(parsed.weekdayPlans||{});
 const hasScopedTime=scoped.some(x=>x.duration),hasScopedEquipment=scoped.some(x=>x.equipmentKey);
 const explicitSharedTime=coachProgramExplicitAllDayRequest(text);
 const explicitAll=explicitSharedTime&&!scoped.length;
 let changed=false;
 const explicitlySaidFrequency=/\b[2-6]\s*[- ]?days?(?:\s+(?:a|per)\s+week)?\b|\b[2-6]\s*(?:x|times)\s*(?:a|per)?\s*week\b/i.test(coachNumbersToDigits(text));
 if(parsed.frequency&&(!intent.frequency||explicitlySaidFrequency)&&parsed.frequency!==intent.frequency){
  intent.frequency=parsed.frequency;changed=true;
  if(intent.split==='custom')intent.customSlots=[];
  if((intent.preferredDays||[]).length!==intent.frequency){intent.preferredDays=[];a.scheduleAnswered=false}
 }
 if(parsed.split&&parsed.split!==intent.split){intent.split=parsed.split;intent.customSlots=[];changed=true}
 if(!parsed.split&&/\b(?:custom|choose each day|body part split)\b/i.test(text)&&!intent.split){intent.split='custom';intent.customSlots=[];changed=true}
 if(intent.split==='custom'&&(intent.customSlots||[]).length<intent.frequency){
  const normalized=coachNormalizeGymText(text).replace(/^day\s*[1-6]\s*(?:is|for|:)?\s*/,'').trim();
  const focus=COACH_PROGRAM_DAY_FOCUSES.find(key=>normalized===key||normalized===key+' day'||normalized===key+' workout');
  if(focus){intent.customSlots=[...(intent.customSlots||[]),focus];changed=true}
 }
 if(p.duration>0&&(!hasScopedTime||explicitSharedTime)){req.duration=p.duration;changed=true}
 if(p.duration>0&&explicitAll)coachProgramClearDayField(intent,'duration');
 const equipment=coachParseEquipment(text);
 if(equipment.allowed.length&&!hasScopedEquipment){
  req.scopedEquipmentOnly=false;
  req.allowedEquipment=[...equipment.allowed];
  req.brainEquipment=coachBrainExplicitEquipment({...req,prompt:text,allowedEquipment:equipment.allowed});
  req.excludedEquipment=req.excludedEquipment.filter(x=>!equipment.allowed.includes(x));changed=true;
 }else if(!hasScopedEquipment&&/\b(?:full|commercial|standard|well[- ]equipped)\s+gym\b/i.test(text)){
  req.scopedEquipmentOnly=false;
  req.brainEquipment=coachBrainExplicitEquipment({...req,prompt:text,allowedEquipment:[]});
  req.allowedEquipment=[...(req.brainEquipment?.allowed||[])];changed=true;
 }
 if(scoped.length){
  coachProgramApplyWeekdayInstructions(intent,parsed.weekdayPlans);
  changed=true;
 }
 if(explicitAll&&!hasScopedEquipment&&req.brainEquipment&&
  (equipment.allowed.length||/\b(?:full|commercial|standard|well[- ]equipped)\s+gym\b/i.test(text)))coachProgramClearDayField(intent,'equipmentKey');
 if(parsed.preferredDays.length&&!(scoped.length&&intent.preferredDays?.length===intent.frequency&&parsed.preferredDays.length<intent.frequency)){
  intent.preferredDays=[...parsed.preferredDays];
  a.scheduleAnswered=parsed.preferredDays.length===intent.frequency;changed=true;
 }
 if(/\b(?:flexible|any|no fixed)\s+(?:days?|schedule)\b/i.test(text)){
  intent.preferredDays=[];a.scheduleAnswered=true;changed=true;
 }
 const explicitGoal=coachExplicitGoal(text);
 if(explicitGoal){req.goal=explicitGoal;a.goalAnswered=true;changed=true}
 let mode=parsed.trainingMode;
 if(!mode&&/^\s*guided\s*$/i.test(text))mode='guided';
 if(!mode&&/^\s*(?:track|tracking)\s*(?:only)?\s*$/i.test(text))mode='track';
 if(mode){intent.trainingMode=mode;if(mode!=='guided')intent.deload=programDeloadConfig({enabled:false});changed=true}
 if(parsed.deload){
  if(intent.trainingMode==='guided'){intent.deload=programDeloadConfig(parsed.deload);a.deloadAnswered=true;changed=true}
  else if(parsed.deload.enabled){showToast('Deload scheduling is available with Guided Progressive Overload');}
 }
 if(!changed){showToast('Try an answer like “PPL”, “45 minutes”, “Monday Wednesday Friday”, or “Guided”.');return}
 coachContinueProgramRequest();
}

function coachContinueProgramRequest(){
 const d=coachProgramBuildDraft;if(!d)return;
 const intent=d.intent,req=d.request,a=coachProgramIntake(d);
 if(!intent.frequency){
  coachProgramQuestion('How many days per week do you want to train?',
   `<div class="coach-choice-grid">${[2,3,4,5,6].map(n=>`<button class="btn secondary" onclick="coachAnswerProgramFrequency(${n})">${n} days</button>`).join('')}</div>`);
  return;
 }
 if(intent.split==='ppl'&&intent.frequency<3){
  coachProgramQuestion('Push / Pull / Legs needs three distinct sessions for all three days.',
   `<div class="mini" style="margin:6px 0 10px">You asked for ${intent.frequency} training days, so a two-day PPL week would leave one category out. Coach won't silently drop legs, push, or pull.</div>
   <div class="coach-choice-grid"><button class="btn secondary" onclick="coachAnswerProgramFrequency(3)">Train 3 days instead</button><button class="btn secondary" onclick="coachAnswerProgramSplit('upper_lower')">Keep 2 days, Upper / Lower</button><button class="btn secondary" onclick="coachAnswerProgramSplit('full_body')">Keep 2 days, Full Body</button><button class="btn secondary" onclick="coachAnswerProgramSplit('custom')">Keep 2 days, choose day focuses</button></div>`);
  return;
 }
 if(!intent.split&&a.splitAdvice){
  if(!a.goalAnswered&&!coachProgramHasExplicitGoal(req)){
   coachProgramQuestion('What is the main thing you want out of this program?',
    `<div class="coach-choice-grid"><button class="btn secondary" onclick="coachAnswerProgramGoal('hypertrophy')">Build muscle</button><button class="btn secondary" onclick="coachAnswerProgramGoal('strength')">Build strength</button><button class="btn secondary" onclick="coachAnswerProgramGoal('general')">General fitness</button></div>`,
    'Coach will use your goal to explain reasonable split options, not choose one without your approval.');
   return;
  }
  coachProgramQuestion('A few ways to organize your week',
   `<div class="mini" style="margin:6px 0 12px">You have ${intent.frequency} days. None of these splits is universally best. Choose one that fits your priorities and that you can maintain.</div>
   <div class="coach-choice-grid coach-split-guidance">
    ${intent.frequency>=3?`<button class="btn secondary" onclick="coachAnswerProgramSplit('ppl')"><b>Push / Pull / Legs</b><span class="mini">Separate movement days; ${intent.frequency===3?'each category appears once per three-session rotation':'Coach rotates movement categories to match your training days'}.</span></button>`:`<div class="mini">Push / Pull / Legs needs three separate training days. Choose three days or another split.</div>`}
    <button class="btn secondary" onclick="coachAnswerProgramSplit('upper_lower')"><b>Upper / Lower</b><span class="mini">Alternate upper- and lower-body work as days rotate.</span></button>
    <button class="btn secondary" onclick="coachAnswerProgramSplit('custom')"><b>Custom body-part days</b><span class="mini">Pick each day yourself, useful when certain muscles are your focus.</span></button>
    <button class="btn secondary" onclick="coachAnswerProgramSplit('full_body')"><b>Full body</b><span class="mini">Practice major movement areas across multiple sessions, if that is what you prefer.</span></button>
   </div>`,
   'These are organizational trade-offs, not guarantees of faster progress. Coach will review your whole week before saving.');
  return;
 }
 if(!intent.split){
  coachProgramQuestion('What kind of split did you have in mind?',
   `<div class="coach-choice-grid">
    ${intent.frequency>=3?`<button class="btn secondary" onclick="coachAnswerProgramSplit('ppl')">Push / Pull / Legs</button>`:`<div class="mini">PPL needs at least 3 training days.</div>`}
    <button class="btn secondary" onclick="coachAnswerProgramSplit('upper_lower')">Upper / Lower rotation</button>
    <button class="btn secondary" onclick="coachAnswerProgramSplit('custom')">Choose each day's muscle focus</button>
    <button class="btn secondary" onclick="coachAnswerProgramSplit('full_body')">Full body each day</button><button class="btn secondary" onclick="coachAskForSplitRecommendation()">Help me choose</button></div>`,
   'A three-day split does not automatically mean three full-body workouts.');
  return;
 }
 if(intent.split==='custom'&&(!Array.isArray(intent.customSlots)||intent.customSlots.length!==intent.frequency)){
  const chosen=intent.customSlots||[],n=chosen.length;
  if(n>intent.frequency){intent.customSlots=[];return coachContinueProgramRequest()}
  coachProgramQuestion(`What should Day ${n+1} focus on?`,
   `<div class="mini" style="margin:7px 0">${chosen.length?'Chosen: '+esc(chosen.map(x=>COACH_TARGET_GROUPS[x]?.label||x).join(' / ')):'Choose your own body-part division.'}</div>
   <div class="coach-choice-grid">${COACH_PROGRAM_DAY_FOCUSES.map(key=>`<button class="btn secondary" onclick="coachAnswerProgramCustomDay('${key}')">${esc(COACH_TARGET_GROUPS[key].label)}</button>`).join('')}</div>
   ${n?'<div class="actions"><button class="btn secondary" onclick="coachUndoProgramCustomDay()">Change previous day</button></div>':''}`,
   'Each choice will become a separate routine; Coach will not switch it to full body.');
  return;
 }
 if(!(req.duration>0)&&!coachProgramAllDaysHaveTime(intent)){
  coachProgramQuestion('How much time do you have per workout?',
   `<div class="coach-choice-grid">${[30,45,60,75,90].map(m=>`<button class="btn secondary" onclick="coachAnswerProgramDuration(${m})">${m} minutes</button>`).join('')}</div>`,
   'We estimate working sets, rest, warm-up and equipment transitions for each day.');
  return;
 }
 if(d.interactiveBrainFlow&&!coachProgramAllDaysHaveEquipment(intent)&&coachBrainProgramNeedsQuestion({...req,duration:req.duration||45})==='equipment'){
  coachProgramQuestion('Where will you train, and what equipment do you have?',
   `<div class="coach-choice-grid">${COACH_BRAIN_EQUIPMENT_CHOICES.map(c=>`<button class="btn secondary" onclick="coachAnswerProgramBrainEquipment('${c.key}')">${esc(c.label)}</button>`).join('')}</div>`);
  return;
 }
 if(d.interactiveBrainFlow&&!req.brainEquipment)req.brainEquipment=coachBrainExplicitEquipment(req);
 if(!a.scheduleAnswered&&(!intent.preferredDays||intent.preferredDays.length!==intent.frequency)){
  const chosen=intent.preferredDays||[];
  coachProgramQuestion('Which days work best for you?',
   `<div class="mini" style="margin:8px 0">Choose ${intent.frequency} days, or leave the schedule flexible. ${chosen.length} selected.</div>
   <div class="coach-choice-grid">${PROGRAM_DAYS.map((day,n)=>`<button class="btn ${chosen.includes(n)?'':'secondary'}" aria-pressed="${chosen.includes(n)}" onclick="coachToggleProgramScheduleDay(${n})">${esc(day)}</button>`).join('')}</div>
   <div class="actions"><button class="btn" onclick="coachConfirmProgramSchedule()" ${chosen.length===intent.frequency?'':'disabled'}>Use these days</button><button class="btn secondary" onclick="coachUseFlexibleProgramSchedule()">No fixed days</button></div>`,
   'These are preferred training days, not calendar reminders.');
  return;
 }
 if(!a.goalAnswered&&!coachProgramHasExplicitGoal(req)){
  coachProgramQuestion('What is your primary goal?',
   `<div class="coach-choice-grid"><button class="btn secondary" onclick="coachAnswerProgramGoal('hypertrophy')">Build muscle</button><button class="btn secondary" onclick="coachAnswerProgramGoal('strength')">Build strength</button><button class="btn secondary" onclick="coachAnswerProgramGoal('general')">General fitness</button></div>`,
   'This informs exercise selection and suggested sets and reps.');
  return;
 }
 if(!intent.trainingMode){
  coachProgramQuestion('How would you like to track progression?',
   `<div class="coach-choice-grid"><button class="btn secondary" onclick="coachAnswerProgramTrainingMode('guided')">Guided Progressive Overload</button><button class="btn secondary" onclick="coachAnswerProgramTrainingMode('strength')">Strength Focus</button><button class="btn secondary" onclick="coachAnswerProgramTrainingMode('track')">Track Only / Standard</button></div>`,
   'Program training mode controls how sessions progress. You can change it later.');
  return;
 }
 if(intent.trainingMode==='guided'&&!a.deloadAnswered&&!intent.deload){
  coachProgramQuestion('Would you like optional deload weeks?',
   `<div class="coach-choice-grid"><button class="btn secondary" onclick="coachAnswerProgramDeload(0)">No scheduled deload</button>${[3,4,5,6,7,8].map(n=>`<button class="btn secondary" onclick="coachAnswerProgramDeload(${n})">Every ${n}th week${n===4?' (suggested)':''}</button>`).join('')}</div>`,
   'Deloads are lighter planned weeks, not a diagnosis. Review and confirm each one before it begins.');
  return;
 }
 const conflict=coachProgramConflictingFocus(intent);
 if(conflict){
  coachProgramQuestion('That day emphasis conflicts with your chosen split.',
   `<div class="mini">Day ${conflict.index+1} is ${esc(COACH_TARGET_GROUPS[conflict.dayKey]?.label||conflict.dayKey)}, but you requested more ${esc(COACH_TARGET_GROUPS[conflict.focusKey]?.label||conflict.focusKey)}. Coach won't quietly ignore or relocate that priority.</div><div class="actions"><button class="btn" onclick="coachClearProgramDayFocus(${conflict.index})">Keep split · Remove extra emphasis</button><button class="btn secondary" onclick="coachRestartProgramSplit()">Change my split</button></div>`);
  return;
 }
 if(!coachGenerateProgram(req,intent,d)){
  coachProgramQuestion('That combination needs a few adjustments.',
   '<div class="mini">Some days need more time, a different focus, or different available equipment. Coach will not invent equipment.</div><div class="actions"><button class="btn" onclick="coachRetryProgramBrainEquipment()">Change equipment</button><button class="btn secondary" onclick="coachRestartProgramSplit()">Change split</button><button class="btn secondary" onclick="coachReviseProgramDuration()">Change time</button><button class="btn secondary" onclick="openCoachSwolecat(true)">New request</button></div>');
  return;
 }
 renderCoachProgramPreview();
}
function coachClearProgramDayFocus(index){
 const d=coachProgramBuildDraft;if(!d||index<0||index>=d.intent.frequency)return;
 d.intent.dayPlans=(d.intent.dayPlans||[]).map(p=>({...p}));
 d.intent.dayPlans[index]={...(d.intent.dayPlans[index]||{}),focusKey:'none'};
 coachContinueProgramRequest();
}
function coachAnswerProgramFrequency(days){
 const d=coachProgramBuildDraft;if(!d)return;
 d.intent.frequency=Math.max(2,Math.min(6,Number(days)||3));d.intent.customSlots=[];
 if(d.intent.preferredDays?.length!==d.intent.frequency)d.intent.preferredDays=[];
 coachContinueProgramRequest();
}
function coachAskForSplitRecommendation(){
 const d=coachProgramBuildDraft;if(!d)return;
 coachProgramIntake(d).splitAdvice=true;
 coachContinueProgramRequest();
}
function coachAnswerProgramSplit(split){
 const d=coachProgramBuildDraft;if(!d||!['ppl','upper_lower','full_body','custom'].includes(split))return;
 d.intent.split=split;d.intent.customSlots=[];coachProgramIntake(d).splitAdvice=false;coachContinueProgramRequest();
}
function coachRestartProgramSplit(){
 const d=coachProgramBuildDraft;if(!d)return;
 d.intent.split='';d.intent.customSlots=[];d.days=[];coachContinueProgramRequest();
}
function coachAnswerProgramCustomDay(key){
 const d=coachProgramBuildDraft;if(!d||d.intent.split!=='custom'||!COACH_PROGRAM_DAY_FOCUSES.includes(key))return;
 d.intent.customSlots=[...(d.intent.customSlots||[]).slice(0,d.intent.frequency-1),key];coachContinueProgramRequest();
}
function coachUndoProgramCustomDay(){
 const d=coachProgramBuildDraft;if(!d||d.intent.split!=='custom')return;
 d.intent.customSlots=(d.intent.customSlots||[]).slice(0,-1);coachContinueProgramRequest();
}
function coachReviseProgramDuration(){
 const d=coachProgramBuildDraft;if(!d)return;
 d.request.duration=0;d.days=[];coachContinueProgramRequest();
}
function coachAnswerProgramDuration(minutes){
 const d=coachProgramBuildDraft;if(!d)return;
 d.request.duration=Math.max(15,Math.min(120,Number(minutes)||45));coachContinueProgramRequest();
}
function coachToggleProgramScheduleDay(day){
 const d=coachProgramBuildDraft;if(!d||!Number.isInteger(day)||day<0||day>6)return;
 const chosen=[...(d.intent.preferredDays||[])],i=chosen.indexOf(day);
 if(i<0&&chosen.length>=d.intent.frequency){showToast('Choose only '+d.intent.frequency+' days');return}
 if(i>=0)chosen.splice(i,1);else chosen.push(day);
 d.intent.preferredDays=chosen.sort((a,b)=>a-b);coachContinueProgramRequest();
}
function coachConfirmProgramSchedule(){
 const d=coachProgramBuildDraft;if(!d)return;
 if(d.intent.preferredDays?.length!==d.intent.frequency){showToast('Choose '+d.intent.frequency+' days or flexible');return}
 coachProgramIntake(d).scheduleAnswered=true;coachContinueProgramRequest();
}
function coachUseFlexibleProgramSchedule(){
 const d=coachProgramBuildDraft;if(!d)return;
 d.intent.preferredDays=[];coachProgramIntake(d).scheduleAnswered=true;coachContinueProgramRequest();
}
function coachAnswerProgramGoal(goal){
 const d=coachProgramBuildDraft;if(!d||!['hypertrophy','strength','general'].includes(goal))return;
 d.request.goal=goal;coachProgramIntake(d).goalAnswered=true;coachContinueProgramRequest();
}
function coachAnswerProgramTrainingMode(mode){
 const d=coachProgramBuildDraft;if(!d||!['guided','strength','track'].includes(mode))return;
 d.intent.trainingMode=mode;if(mode!=='guided')d.intent.deload=programDeloadConfig({enabled:false});
 coachContinueProgramRequest();
}
function coachAnswerProgramDeload(weeks){
 const d=coachProgramBuildDraft;if(!d||d.intent.trainingMode!=='guided')return;
 const n=Number(weeks);if(!Number.isInteger(n)||(n!==0&&(n<3||n>8)))return;
 d.intent.deload=programDeloadConfig({enabled:n!==0,intervalWeeks:n||4});
 coachProgramIntake(d).deloadAnswered=true;coachContinueProgramRequest();
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


// v0.94: contextual editing of EXISTING saved Programs.
// All changes remain in memory until an explicit Apply. Routine changes are
// copy-on-write: shared routines and past workout sessions never get rewritten.
let coachSavedProgramEditDraft=null;

function coachSavedProgramEditDayName(d,index){
 const day=d.program.coachPlannedDays?.[index];
 return day?.label||d.routines[index]?.name||('Day '+(index+1));
}
function coachSavedProgramEditorDayIndex(raw,d){
 const text=coachNumbersToDigits(String(raw||'')).toLowerCase();
 const numbered=text.match(/\bday\s*([1-6])\b/);
 const days=[];
 if(numbered)days.push(Number(numbered[1])-1);
 for(const [key,weekday] of COACH_WEEKDAY_TERMS){
  if(new RegExp('\\b'+key+'\\b','i').test(text)){
   const idx=(d.program.preferredDays||[]).indexOf(weekday);
   if(idx<0)return {error:'That weekday is not part of this program. Name a current training day.'};
   days.push(idx);
  }
 }
 const unique=[...new Set(days)];
 if(unique.length>1)return {error:'Name just one workout day per change.'};
 if(unique.some(i=>i<0||i>=d.routines.length))return {error:'That day number is not in this program.'};
 if(!unique.length)return {index:-1};
 return {index:unique[0]};
}
function coachSavedProgramEditorProgramSnapshot(program){
 return JSON.stringify(program);
}
function coachOpenSavedProgramEditor(programId){
 const p=programById(programId);
 if(!p){showToast('Program not found');return false}
 if(state.activeWorkout?.programId===p.id){showToast('Finish or cancel the active program workout before editing its saved plan');return false}
 const originals=p.routineIds.map(id=>state.routines.find(r=>r.id===id));
 if(!originals.length||originals.some(r=>!r)){showToast('This program has missing routines. Edit it manually first.');return false}
 coachSavedProgramEditDraft={
  programId:p.id,
  originalProgram:cloneData(p),
  originalRoutines:originals.map(cloneData),
  signedInOwnerId:typeof syncIdentityUser==='function'?(syncIdentityUser()?.id||null):null,
  program:cloneData(p),
  routines:originals.map(cloneData),
  notes:[],
  createdAt:Date.now()
 };
 coachRenderSavedProgramEditor();
 return true;
}
function coachSavedProgramEditorChanged(d){
 return JSON.stringify(d.program)!==JSON.stringify(d.originalProgram)||
  d.routines.some((r,i)=>JSON.stringify(r)!==JSON.stringify(d.originalRoutines[i]));
}
function coachRenderSavedProgramEditor(){
 const d=coachSavedProgramEditDraft;if(!d)return;
 const dirty=coachSavedProgramEditorChanged(d);
 const unchangedDays=d.routines.map((r,i)=>(
  JSON.stringify(r)===JSON.stringify(d.originalRoutines[i])&&
  JSON.stringify(d.program.coachPlannedDays?.[i]||{})===JSON.stringify(d.originalProgram.coachPlannedDays?.[i]||{})
 )?coachSavedProgramEditDayName(d,i):null).filter(Boolean);
 openModal('Edit with Coach',`
  <div class="coach-builder coach-saved-editor">
    <div class="coach-console">
      <div class="eyebrow">EDIT SAVED PROGRAM // LOCAL DRAFT</div>
      <div class="exercise-name" style="font-size:1.1rem">${esc(d.program.name)}</div>
      <div class="mini" style="margin-top:6px">${d.program.routineIds.length} workouts · ${esc(programDaysText(d.program))} · ${esc(programTrainingModeLabel(d.program.trainingMode))}</div>
      <div class="mini" style="margin-top:7px">Coach is editing a proposal, not your live workouts. Unrelated days, completed history and your existing progression position are preserved.</div>
    </div>
    ${d.routines.map((r,i)=>{
      const changed=JSON.stringify(r)!==JSON.stringify(d.originalRoutines[i])||
       JSON.stringify(d.program.coachPlannedDays?.[i]||{})!==JSON.stringify(d.originalProgram.coachPlannedDays?.[i]||{});
      const info=d.program.coachPlannedDays?.[i];
      return `<details class="coach-program-day-details" ${changed||i===0?'open':''}>
        <summary>${esc(coachSavedProgramEditDayName(d,i))} ${changed?'· Changes proposed':''} · ${r.exercises.length} exercises${info?.durationMinutes?' · '+info.durationMinutes+' min target':''}</summary>
        <div class="card" style="margin-top:6px">
        ${r.exercises.map(e=>`<div class="mini" style="padding:5px 0">${esc(exById(e.exerciseId)?.name||e.exerciseId)} · ${Number(e.sets)||0} sets · ${Number(e.minReps)||0}–${Number(e.maxReps)||0} reps</div>`).join('')}
        </div></details>`;
    }).join('')}
    ${d.notes.length?`<div class="coach-console" role="status"><div class="eyebrow">PROPOSED CHANGES // NOT SAVED</div>
       ${d.notes.map(n=>`<div class="mini" style="margin-top:7px">• ${esc(n)}</div>`).join('')}
       <div class="mini" style="margin-top:9px"><b>Unchanged days:</b> ${esc(unchangedDays.join(' / ')||'None')}</div>
       <div class="mini" style="margin-top:6px">Only the changes above will be applied. Existing routines used by another program are never edited in place.</div></div>`:
       '<div class="mini">Nothing has changed yet. Tell Coach exactly which day or setting to change.</div>'}
    <div class="coach-console coach-program-composer">
      <div class="eyebrow">ASK COACH // EDIT THIS SAVED PLAN</div>
      <details class="coach-program-prompt-tips"><summary>Supported commands and limits</summary><div class="mini">
       Try “Wednesday 45 minutes,” “remove Barbell Row from Wednesday,”
       “replace Deadlift with Romanian Deadlift on Friday,”
       “add Lateral Raise to Monday,” “switch to Track Only,”
       or “move Wednesday to Thursday.”
       Time changes update the planning target, not existing exercise volume;
       review workload before training. A full split redesign still requires manual editing or a new Coach plan.
      </div></details>
      <div class="home-coach-row"><div class="coach-voice-field">
       <input id="coachSavedProgramPrompt" aria-label="Ask Coach to edit this program"
        placeholder="Change Wednesday to 45 minutes…" onkeydown="if(event.key==='Enter')coachSubmitSavedProgramEdit()">
       ${coachVoiceButtonHtml('coachSavedProgramPrompt')}
      </div><button class="btn" onclick="coachSubmitSavedProgramEdit()">Propose</button></div>
    </div>
    <div class="actions coach-program-save-actions">
      <button class="btn green" onclick="coachApplySavedProgramEdits()" ${dirty?'':'disabled'}>Apply reviewed changes</button>
      <button class="btn secondary" onclick="coachSavedProgramEditDraft=null;closeModal()">Cancel · Keep original</button>
    </div>
  </div>`,'modal-mode-coach-saved');
}
// If a saved day explicitly says dumbbells/bodyweight only, its new movements
// must pass the same deterministic equipment checks as new Coach drafts.
function coachSavedProgramExerciseFitsEquipment(ex,d,index){
 const label=String(d.program.coachPlannedDays?.[index]?.equipmentLabel||'').toLowerCase();
 const key=/dumbbell/.test(label)?'dumbbells':/bodyweight|floor.only|no equipment/.test(label)?'bodyweight':null;
 if(!key)return true; // broader/unverified labels are not asserted as verified equipment
 const cfg=coachBrainApplyEquipmentChoice({allowedEquipment:[],excludedEquipment:[],targetRegions:[]},key);
 if(!cfg.ok)return false;
 if(ex.equipment&&!cfg.request.allowedEquipment.includes(ex.equipment))return false;
 return coachBrainEquipmentAllowed(ex,cfg.request);
}
function coachSavedProgramEditApplyText(d,raw){
 const text=String(raw||'').trim(),normalized=coachNumbersToDigits(text);
 if(!text)return {ok:false,message:'Describe one change to the saved program.'};
 const clauses=coachBrainSplitEditClauses(text);
 if(clauses.length>1){
  const copy={...d,program:cloneData(d.program),routines:d.routines.map(cloneData)};
  const descriptions=[];
  for(const clause of clauses){
   const result=coachSavedProgramEditApplyText(copy,clause);
   if(!result.ok)return {ok:false,message:'No changes proposed. '+result.message,failedClause:clause};
   descriptions.push(result.note);
  }
  d.program=copy.program;d.routines=copy.routines;
  return {ok:true,note:descriptions.join(' ')};
 }
 const mode=coachParseProgramIntent(normalized);
 // A destination weekday is naturally not in the current program, so handle
 // moves before selecting the day to edit.
 const move=normalized.match(/\bmove\s+(\w+)\s+(?:to|onto)\s+(\w+)\b/i);
 if(move){
  const from=COACH_WEEKDAY_TERMS.find(([s])=>s===move[1].toLowerCase())?.[1];
  const to=COACH_WEEKDAY_TERMS.find(([s])=>s===move[2].toLowerCase())?.[1];
  const oldIndex=(d.program.preferredDays||[]).indexOf(from);
  if(from==null||to==null||oldIndex<0)return {ok:false,message:'Name a weekday already in this program and the replacement weekday.'};
  if(d.program.preferredDays.includes(to))return {ok:false,message:'The destination weekday is already in this program.'};
  d.program.preferredDays[oldIndex]=to;
  if(d.program.coachPlannedDays?.[oldIndex])d.program.coachPlannedDays[oldIndex].weekday=to;
  return {ok:true,note:`Moved ${PROGRAM_DAYS[from]} to ${PROGRAM_DAYS[to]}; routine order unchanged.`};
 }
 const dayResult=coachSavedProgramEditorDayIndex(normalized,d);
 if(dayResult.error)return {ok:false,message:dayResult.error};
 const i=dayResult.index;
 const swap=normalized.match(/\b(?:replace|swap)\s+(.+?)\s+(?:with|for)\s+(.+?)(?:\s+(?:on|in|for)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|day\s+[1-6]))?[.!?]?\s*$/i);
 const remove=normalized.match(/\b(?:remove|drop|delete)\s+(.+?)(?:\s+(?:on|from|in)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|day\s+[1-6]))?[.!?]?\s*$/i);
 const add=normalized.match(/\b(?:add|include)\s+(.+?)(?:\s+(?:on|to|in)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|day\s+[1-6]))?[.!?]?\s*$/i);
 if(swap||remove||add){
  if(i<0)return {ok:false,message:'Which workout day should Coach edit? Name Monday, Wednesday, Friday or a day number.'};
  const routine=d.routines[i],currentIds=routine.exercises.map(e=>e.exerciseId);
  if(swap){
   const old=coachResolveExercisePhrase(swap[1],currentIds),replacement=coachResolveExercisePhrase(swap[2]);
   if(!old||!replacement)return {ok:false,message:'I could not confidently identify both exercises. Name their exact exercise titles.'};
   if(currentIds.includes(replacement.id))return {ok:false,message:'That replacement is already in this workout.'};
   if(old.pattern!==replacement.pattern)return {ok:false,message:'These exercises use different movement patterns. Review the prescription in Edit Manually instead of transferring it automatically.'};
   if(!coachSavedProgramExerciseFitsEquipment(replacement,d,i))return {ok:false,message:'That replacement does not fit the day\'s recorded equipment. Choose another movement or adjust the day manually.'};
   const idx=routine.exercises.findIndex(e=>e.exerciseId===old.id);
   if(idx<0)return {ok:false,message:'The exercise to replace is not in that day.'};
   routine.exercises[idx]={...routine.exercises[idx],exerciseId:replacement.id};
   return {ok:true,note:`Day ${i+1}: ${old.name} → ${replacement.name}. Reps/rest carried forward; review whether this prescription suits the replacement.`};
  }
  if(remove){
   const ex=coachResolveExercisePhrase(remove[1],currentIds);
   if(!ex||!currentIds.includes(ex.id))return {ok:false,message:'That exercise is not in this day. Use its full name.'};
   if(routine.exercises.length<=1)return {ok:false,message:'Keep at least one exercise in a training day.'};
   routine.exercises=routine.exercises.filter(e=>e.exerciseId!==ex.id);
   return {ok:true,note:`Day ${i+1}: removed ${ex.name}; no other exercise changed.`};
  }
  const ex=coachResolveExercisePhrase(add[1]);
  if(!ex)return {ok:false,message:'I could not recognize that exercise. Use its full name.'};
  if(currentIds.includes(ex.id))return {ok:false,message:'That exercise is already in this day.'};
  if(!coachSavedProgramExerciseFitsEquipment(ex,d,i))return {ok:false,message:'That exercise is not available with the day\'s recorded equipment.'};
  const goal='general',defaults=coachProgrammingDefaults(goal,Number(d.program.coachPlannedDays?.[i]?.durationMinutes)||45);
  const prescription=coachExercisePrescription(ex,{goal,targetRegions:exerciseMuscleMetadata(ex).primary,duration:defaults.duration},defaults);
  routine.exercises.push({
   exerciseId:ex.id,sets:prescription.sets,minReps:prescription.minReps,maxReps:prescription.maxReps,
   increment:state.settings.defaultIncrement,mode:'double',progressionStrategy:prescription.progressionStrategy||'double',
   adaptiveProgression:!!prescription.adaptiveProgression,setStructure:null,
   trainingGoal:goal,restSeconds:prescription.restSeconds,
   targetRIR:Number.isFinite(Number(prescription.targetRIR))?Number(prescription.targetRIR):null
  });
  return {ok:true,note:`Day ${i+1}: added ${ex.name} with editable general-training set/rep defaults; no starting weight assumed.`};
 }
 if(/\b(?:change|make|set|shorten|longer|minutes?|mins?|hours?)\b/i.test(normalized)){
  const m=normalized.match(/\b(\d{2,3})\s*(?:minutes?|mins?|min|m)\b/i);
  if(m){
   if(i<0)return {ok:false,message:'Specify which day should receive the new time target.'};
   const minutes=Number(m[1]);
   if(minutes<15||minutes>120)return {ok:false,message:'Use a time target between 15 and 120 minutes.'};
   if(!Array.isArray(d.program.coachPlannedDays))d.program.coachPlannedDays=d.routines.map((r,j)=>({label:r.name,weekday:d.program.preferredDays?.[j]??null}));
   const prior=d.program.coachPlannedDays[i].durationMinutes||'unspecified';
   d.program.coachPlannedDays[i].durationMinutes=minutes;
   return {ok:true,note:`Day ${i+1}: planned time ${prior} → ${minutes} min; exercises and working-set counts are unchanged. Review feasibility.`};
  }
 }
 if(mode.trainingMode){
  const chosen=mode.trainingMode;
  if(!['track','guided','strength'].includes(chosen))return {ok:false,message:'Choose Track Only, Guided Progressive Overload or Strength Focus.'};
  d.program.trainingMode=chosen;
  if(chosen!=='guided')d.program.deload=programDeloadConfig({enabled:false});
  return {ok:true,note:`Program training mode changed to ${programTrainingModeLabel(chosen)}. Routine-level settings and completed logs are unchanged.`};
 }
 return {ok:false,message:'I could not safely make that change yet. Try a specific day time, named exercise add/remove/replace, training mode, or weekday move. For a split or frequency redesign, use Edit Manually.'};
}
function coachSubmitSavedProgramEdit(){
 const d=coachSavedProgramEditDraft;if(!d)return;
 const raw=document.getElementById('coachSavedProgramPrompt')?.value.trim()||'';
 const next={...d,program:cloneData(d.program),routines:d.routines.map(cloneData),notes:[...d.notes]};
 const result=coachSavedProgramEditApplyText(next,raw);
 if(!result.ok){showToast(result.message);return}
 // Propose is transactional: only accepted changes advance the local draft.
 next.notes.push(result.note);
 coachSavedProgramEditDraft=next;
 coachRenderSavedProgramEditor();
}
function coachApplySavedProgramEdits(){
 const d=coachSavedProgramEditDraft;if(!d||!coachSavedProgramEditorChanged(d)){showToast('No changes to apply');return false}
 const ownerNow=typeof syncIdentityUser==='function'?(syncIdentityUser()?.id||null):null;
 if(ownerNow!==d.signedInOwnerId){
  showToast('Cloud account changed. Reopen the editor in the current workspace.');return false;
 }
 const p=programById(d.programId);
 if(!p||coachSavedProgramEditorProgramSnapshot(p)!==coachSavedProgramEditorProgramSnapshot(d.originalProgram)){
  showToast('This program changed since Coach opened it. Reopen the editor.');return false;
 }
 for(let i=0;i<d.originalRoutines.length;i++){
  const live=state.routines.find(r=>r.id===d.originalRoutines[i].id);
  if(!live||JSON.stringify(live)!==JSON.stringify(d.originalRoutines[i])){
   showToast('A routine changed since Coach opened it. Reopen the editor.');return false;
  }
 }
 if(state.activeWorkout?.programId===p.id){
  showToast('Finish or cancel this program workout before applying edits.');return false;
 }
 const nextProgram=cloneData(d.program),newRoutines=[];
 for(let i=0;i<d.routines.length;i++){
  if(JSON.stringify(d.routines[i])===JSON.stringify(d.originalRoutines[i]))continue;
  const newRoutine=cloneData(d.routines[i]);
  newRoutine.id=uid(); // copy-on-write, even if the original is shared elsewhere
  newRoutines.push(newRoutine);
  nextProgram.routineIds[i]=newRoutine.id;
 }
 // Preserve the same Program ID, next rotation index and completed history.
 nextProgram.id=p.id;
 nextProgram.nextIndex=p.nextIndex;
 const snapshot=cloneData(state);
 state.routines.push(...newRoutines);
 state.programs=state.programs.map(row=>row.id===p.id?nextProgram:row);
 if(!save()){
  state=normalizeState(snapshot);
  showToast('Save failed. The original program is intact.');return false;
 }
 coachSavedProgramEditDraft=null;
 closeModal();renderPrograms();renderRoutines();renderHome();
 showToast('Saved program updated · workout history preserved');
 return true;
}
