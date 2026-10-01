function coachProgrammingDefaults(goal,duration){
 goal=['hypertrophy','strength','general'].includes(goal)?goal:'hypertrophy';
 if(goal==='strength')return {goal,sets:3,minReps:4,maxReps:6,restSeconds:180,trainingMode:'strength',exerciseCount:Math.max(3,Math.min(6,Math.round(duration/11)))};
 if(goal==='general')return {goal,sets:3,minReps:6,maxReps:10,restSeconds:120,trainingMode:'guided',exerciseCount:Math.max(3,Math.min(7,Math.round(duration/8.5)))};
 return {goal,sets:3,minReps:8,maxReps:12,restSeconds:90,trainingMode:'guided',exerciseCount:Math.max(3,Math.min(8,Math.round(duration/7.5)))};
}
function coachDaysSince(iso){
 const ms=Date.now()-new Date(iso||0).getTime();
 return Number.isFinite(ms)?Math.max(0,ms/86400000):Infinity;
}
function coachRecentExercisePenalty(exerciseId){
 const previous=derivedSessionData().previousByExercise.get(exerciseId);
 if(!previous?.date)return 0;
 const days=coachDaysSince(previous.date);
 if(days<=1)return 16;
 if(days<=3)return 9;
 if(days<=7)return 4;
 return 0;
}
function coachExerciseAllowedByConstraints(ex,request){
 if(!ex||isHiddenExercise(ex.id))return false;
 if((request.excludedExerciseIds||[]).includes(ex.id))return false;
 if(request.allowedEquipment.length&&!request.allowedEquipment.includes(ex.equipment))return false;
 if(request.excludedEquipment.includes(ex.equipment))return false;
 return true;
}
function coachRequestedTargetKeys(request){
 const direct=[...new Set(request?.targetKeys||[])].filter(k=>COACH_TARGET_GROUPS[k]);
 if(direct.length)return direct;
 const labelMap=Object.fromEntries(Object.entries(COACH_TARGET_GROUPS).map(([k,v])=>[v.label.toLowerCase(),k]));
 return [...new Set((request?.targetLabels||[]).map(label=>labelMap[String(label).toLowerCase()]).filter(Boolean))];
}
function coachMovementFamily(ex){
 const pattern=ex?.pattern||'other',name=ex?.name||'';
 if(/\b(?:assisted |plate loaded |bench )?dip\b/i.test(name))return 'dip_press';
 return ({
   horizontal_press:'flat_press',incline_press:'incline_press',chest_fly:'chest_fly',
   horizontal_pull:'row',vertical_pull:'vertical_pull',shoulder_extension:'lat_isolation',pullover:'lat_isolation',
   vertical_press:'shoulder_press',lateral_raise:'lateral_raise',rear_delt:'rear_delt',
   elbow_flexion:'biceps_curl',elbow_extension:'triceps_extension',dip_press:'dip_press',
   squat:'squat',lunge:'lunge',knee_extension:'leg_extension',hinge:'hinge',knee_flexion:'leg_curl',
   hip_extension:'hip_extension',hip_abduction:'hip_abduction',hip_adduction:'hip_adduction',
   calf_raise:'calf_raise',shrug:'shrug',front_raise:'front_raise',upright_row:'upright_row',
   spinal_flexion:'spinal_flexion',hip_flexion_core:'hip_flexion_core',anti_extension:'anti_extension',
   rotation:'rotation',anti_rotation:'anti_rotation',lateral_flexion:'lateral_flexion'
 })[pattern]||pattern;
}
function coachFamilyCap(family,request,count){
 const keys=coachRequestedTargetKeys(request),single=keys.length===1?keys[0]:'';
 if(family==='row')return (single==='back'||single==='pull')&&count>=5?2:1;
 if(family==='vertical_pull')return (single==='back'||single==='pull')&&count>=6?2:1;
 if(family==='biceps_curl')return (single==='arms'||single==='biceps')&&count>=5?2:1;
 if(family==='triceps_extension')return (single==='arms'||single==='triceps')&&count>=5?2:1;
 if(family==='squat')return (single==='legs'||single==='lower body'||single==='quads')&&count>=7?2:1;
 if(family==='hinge')return (single==='legs'||single==='lower body'||single==='hamstrings'||single==='glutes')&&count>=7?2:1;
 return 1;
}
function coachGenericExerciseBias(ex,request){
 const name=ex?.name||'',keys=coachRequestedTargetKeys(request);
 let score=0;
 const staples=new Set([
   'Barbell Bench Press','Incline Dumbbell Press','Incline Barbell Bench Press','Cable Fly','Pec Deck',
   'Barbell Row','Seated Cable Row','Chest Supported Row','Lat Pulldown','Pull-Up','Assisted Pull-Up','Chin-Up',
   'Overhead Press','Dumbbell Shoulder Press','Dumbbell Lateral Raise','Cable Lateral Raise','Rear Delt Fly','Face Pull',
   'Back Squat','Front Squat','Leg Press','Hack Squat','Bulgarian Split Squat','Romanian Deadlift','Seated Leg Curl','Lying Leg Curl','Leg Extension','Hip Thrust',
   'Barbell Curl','Dumbbell Curl','Hammer Curl','Preacher Curl','Triceps Pushdown','Rope Triceps Pushdown','Overhead Triceps Extension','Skull Crusher',
   'Standing Calf Raise','Seated Calf Raise','Cable Crunch','Hanging Leg Raise'
 ]);
 if(staples.has(name))score+=18;
 if(/\b(?:single arm|single leg|alternating|behind-the-neck|anderson|board press|spoto|zercher|meadows|renegade|yates|jm press|tate press|b-stance|snatch grip|deficit|block pull|clean pull|high pull|power clean|power snatch)\b/i.test(name))score-=22;
 if(ex?.pattern==='olympic_pull'&&request.goal!=='strength')score-=55;
 if(keys.includes('back')&&request.goal!=='strength'&&['hinge','olympic_pull'].includes(ex?.pattern))score-=46;
 return score;
}
function coachSmartExerciseCount(request,baseCount){
 const keys=coachRequestedTargetKeys(request),base=Math.max(1,Number(baseCount)||1);
 if(keys.length!==1)return keys.length===2?Math.min(base,7):base;
 const key=keys[0];
 if(['chest','back','shoulders','arms','biceps','triceps','full body'].includes(key))return Math.min(base,6);
 if(['push','pull','legs','lower body','upper body'].includes(key))return Math.min(base,7);
 return base;
}
function coachCandidateBaseScore(ex,request){
 if(!coachExerciseAllowedByConstraints(ex,request))return -Infinity;
 const meta=exerciseMuscleMetadata(ex),targets=new Set(request.targetRegions),priority=new Set(request.priorityRegions||[]),keys=coachRequestedTargetKeys(request);
 const upperBackOnly=keys.includes('back')&&!keys.some(k=>['legs','lower body','hamstrings','glutes','quads','full body'].includes(k));
 if(upperBackOnly&&request.goal!=='strength'&&['hinge','olympic_pull'].includes(ex.pattern)&&!(request.requiredExerciseIds||[]).includes(ex.id))return -Infinity;
 const primaryHits=meta.primary.filter(m=>targets.has(m)),secondaryHits=meta.secondary.filter(m=>targets.has(m));
 if(!primaryHits.length&&!secondaryHits.length)return -Infinity;
 let score=(primaryHits.length?115+(primaryHits.length-1)*32:0)+secondaryHits.length*28+preferenceRank(ex.id)+coachGenericExerciseBias(ex,request);
 const programUses=Number(request.programExerciseUsage?.[ex.id])||0;
 if(programUses)score-=programUses*(request.goal==='strength'?18:34);
 meta.primary.filter(m=>priority.has(m)).forEach(()=>score+=46);
 meta.secondary.filter(m=>priority.has(m)).forEach(()=>score+=16);
 if(previousExercise(ex.id))score+=4;
 score-=coachRecentExercisePenalty(ex.id);
 if(request.goal==='strength'&&COACH_COMPOUND_PATTERNS.has(ex.pattern))score+=28;
 if(request.goal==='hypertrophy'&&COACH_COMPOUND_PATTERNS.has(ex.pattern))score+=9;
 if(!primaryHits.length&&secondaryHits.length)score-=36;
 return score;
}
function coachDynamicCandidateScore(ex,request,coverage,patternCounts,familyCounts={},primaryCoverage={},count=8){
 let score=coachCandidateBaseScore(ex,request);if(!Number.isFinite(score))return score;
 const meta=exerciseMuscleMetadata(ex),targets=new Set(request.targetRegions),family=coachMovementFamily(ex);
 if((familyCounts[family]||0)>=coachFamilyCap(family,request,count))return -Infinity;
 meta.primary.filter(m=>targets.has(m)).forEach(m=>{
   score+=72/(1+(coverage[m]||0));
   if(!(primaryCoverage[m]>0))score+=54;
 });
 meta.secondary.filter(m=>targets.has(m)).forEach(m=>score+=16/(1+(coverage[m]||0)));
 score-=(patternCounts[ex.pattern]||0)*34;
 score-=(familyCounts[family]||0)*118;
 const keys=coachRequestedTargetKeys(request);
 if(keys.includes('arms')&&ex.pattern==='elbow_flexion'&&meta.primary.includes('biceps'))score+=36;
 if(keys.includes('arms')&&ex.pattern==='elbow_extension'&&meta.primary.includes('triceps'))score+=36;
 return score;
}
function coachCoveragePlan(request,count){
 const keys=coachRequestedTargetKeys(request),core=[],optional=[],seen=new Set();
 const add=(bucket,id,label,match)=>{
   if(seen.has(id))return;seen.add(id);bucket.push({id,label,match});
 };
 const meta=ex=>exerciseMuscleMetadata(ex);
 const chestPress=ex=>meta(ex).primary.includes('chest')&&ex.pattern==='horizontal_press'&&coachMovementFamily(ex)!=='dip_press';
 const chestIncline=ex=>meta(ex).primary.includes('chest')&&ex.pattern==='incline_press';
 const chestFly=ex=>meta(ex).primary.includes('chest')&&ex.pattern==='chest_fly';
 const backRow=ex=>ex.pattern==='horizontal_pull'&&(meta(ex).primary.includes('upper_back')||meta(ex).primary.includes('lats'));
 const backVertical=ex=>ex.pattern==='vertical_pull'&&meta(ex).primary.includes('lats');
 const latIsolation=ex=>['shoulder_extension','pullover'].includes(ex.pattern)&&meta(ex).primary.includes('lats');
 const bicepsDirect=ex=>ex.pattern==='elbow_flexion'&&meta(ex).primary.includes('biceps');
 const tricepsDirect=ex=>coachMovementFamily(ex)==='triceps_extension'&&meta(ex).primary.includes('triceps')&&!/\b(?:dip|push-?up|bench press|jm press|tate press)\b/i.test(ex.name||'');
 const shoulderPress=ex=>ex.pattern==='vertical_press'&&(meta(ex).primary.includes('front_delts')||meta(ex).primary.includes('side_delts'));
 const shoulderAccessory=ex=>['lateral_raise','rear_delt'].includes(ex.pattern);
 const squatPattern=ex=>['squat','lunge'].includes(ex.pattern)&&meta(ex).primary.includes('quads');
 const hamstringPattern=ex=>(ex.pattern==='knee_flexion'||ex.pattern==='hinge')&&meta(ex).primary.includes('hamstrings');
 const calfPattern=ex=>ex.pattern==='calf_raise'&&meta(ex).primary.includes('calves');
 const corePattern=ex=>meta(ex).primary.includes('core')||meta(ex).primary.includes('obliques');
 const addChest=()=>{
   add(core,'chest_press','Chest press',chestPress);
   add(optional,'chest_incline','Incline chest press',chestIncline);
   add(optional,'chest_fly','Chest isolation',chestFly);
 };
 const addBack=()=>{
   add(core,'back_row','Horizontal back pull',backRow);
   add(optional,'back_vertical','Vertical back pull',backVertical);
   add(optional,'lat_isolation','Lat isolation',latIsolation);
   add(optional,'back_rear_delt','Rear delt / upper-back accessory',ex=>ex.pattern==='rear_delt'&&meta(ex).secondary.includes('upper_back'));
 };
 const addArms=()=>{add(core,'biceps_direct','Direct biceps',bicepsDirect);add(core,'triceps_direct','Direct triceps',tricepsDirect)};
 const addShoulders=()=>{add(core,'shoulder_press','Shoulder press',shoulderPress);add(optional,'shoulder_accessory','Side / rear delt',shoulderAccessory)};
 const addLegs=()=>{add(core,'leg_knee','Knee-dominant lower body',squatPattern);add(core,'leg_hamstrings','Hamstrings',hamstringPattern);add(optional,'leg_calves','Calves',calfPattern)};

 if(keys.includes('full body')){
   add(core,'full_squat','Lower-body compound',squatPattern);
   add(core,'full_hinge','Hip hinge',hamstringPattern);
   add(core,'full_press','Upper-body press',chestPress);
   add(core,'full_pull','Upper-body pull',ex=>backRow(ex)||backVertical(ex));
   add(optional,'full_shoulders','Shoulders',shoulderPress);
 }else if(keys.includes('upper body')&&keys.length===1){
   addChest();addBack();addShoulders();
   add(optional,'upper_biceps','Direct biceps',bicepsDirect);add(optional,'upper_triceps','Direct triceps',tricepsDirect);
 }else if(keys.includes('lower body')&&keys.length===1){
   addLegs();add(optional,'lower_glutes','Glute emphasis',ex=>meta(ex).primary.includes('glutes')&&['hip_extension','hinge'].includes(ex.pattern));
 }else if(keys.includes('push')&&keys.length===1){
   add(core,'push_chest','Chest press',chestPress);add(core,'push_shoulders','Shoulder press',shoulderPress);add(core,'push_triceps','Direct triceps',tricepsDirect);
   add(optional,'push_chest_iso','Chest isolation',chestFly);add(optional,'push_side_delts','Side delts',ex=>ex.pattern==='lateral_raise');
 }else if(keys.includes('pull')&&keys.length===1){
   add(core,'pull_row','Horizontal pull',backRow);add(core,'pull_vertical','Vertical pull',backVertical);add(core,'pull_biceps','Direct biceps',bicepsDirect);
   add(optional,'pull_lats','Lat isolation',latIsolation);add(optional,'pull_rear_delts','Rear delts',ex=>ex.pattern==='rear_delt');
 }else{
   keys.forEach(key=>{
     if(key==='chest')addChest();
     else if(key==='back')addBack();
     else if(key==='arms')addArms();
     else if(key==='shoulders')addShoulders();
     else if(key==='legs')addLegs();
     else if(key==='biceps')add(core,'biceps_direct','Direct biceps',bicepsDirect);
     else if(key==='triceps')add(core,'triceps_direct','Direct triceps',tricepsDirect);
     else if(key==='quads')add(core,'quads_direct','Quads',ex=>meta(ex).primary.includes('quads'));
     else if(key==='hamstrings')add(core,'hamstrings_direct','Hamstrings',hamstringPattern);
     else if(key==='glutes')add(core,'glutes_direct','Glutes',ex=>meta(ex).primary.includes('glutes'));
     else if(key==='calves')add(core,'calves_direct','Calves',calfPattern);
     else if(key==='core')add(core,'core_direct','Core',corePattern);
     else if(key==='push'){addChest();addShoulders();add(core,'triceps_direct','Direct triceps',tricepsDirect)}
     else if(key==='pull'){addBack();add(core,'biceps_direct','Direct biceps',bicepsDirect)}
   });
 }
 return {keys,core,optional};
}
function coachSelectExercises(request,count){
 count=coachSmartExerciseCount(request,count);
 const pool=visibleExercises(),selected=[],coverage={},primaryCoverage={},patterns={},families={},targets=new Set(request.targetRegions);
 let plan=coachCoveragePlan(request,count);
 count=Math.max(count,Math.min(8,plan.core.length));
 plan=coachCoveragePlan(request,count);
 const register=pick=>{
   if(!pick||selected.some(x=>x.id===pick.id))return false;
   selected.push(pick);
   patterns[pick.pattern]=(patterns[pick.pattern]||0)+1;
   const family=coachMovementFamily(pick);families[family]=(families[family]||0)+1;
   const m=exerciseMuscleMetadata(pick);
   m.primary.filter(region=>targets.has(region)).forEach(region=>{
     coverage[region]=(coverage[region]||0)+1;primaryCoverage[region]=(primaryCoverage[region]||0)+1;
   });
   m.secondary.filter(region=>targets.has(region)).forEach(region=>coverage[region]=(coverage[region]||0)+.35);
   return true;
 };
 const slotPick=slot=>{
   const ranked=pool.filter(ex=>!selected.some(x=>x.id===ex.id)&&slot.match(ex))
     .map(ex=>({ex,score:coachDynamicCandidateScore(ex,request,coverage,patterns,families,primaryCoverage,count)}))
     .filter(x=>Number.isFinite(x.score))
     .sort((a,b)=>b.score-a.score||a.ex.name.localeCompare(b.ex.name));
   return ranked[0]?.ex||null;
 };

 (request.requiredExerciseIds||[]).map(exById).filter(Boolean).forEach(ex=>{
   if(selected.length>=count)return;
   if(coachExerciseAllowedByConstraints(ex,request))register(ex);
 });

 for(const slot of plan.core){
   if(selected.length>=count)break;
   const pick=slotPick(slot);if(pick)register(pick);
 }
 for(const slot of plan.optional){
   if(selected.length>=count)break;
   const pick=slotPick(slot);if(pick)register(pick);
 }

 while(selected.length<count){
   const ranked=pool.filter(ex=>!selected.some(x=>x.id===ex.id))
     .map(ex=>({ex,score:coachDynamicCandidateScore(ex,request,coverage,patterns,families,primaryCoverage,count)}))
     .filter(x=>Number.isFinite(x.score))
     .sort((a,b)=>b.score-a.score||a.ex.name.localeCompare(b.ex.name));
   const pick=ranked[0]?.ex;if(!pick)break;
   register(pick);
 }
 const compoundPatterns=new Set(['squat','hinge','horizontal_press','incline_press','vertical_press','horizontal_pull','vertical_pull','lunge']);
 const orderTier=ex=>{
   const family=coachMovementFamily(ex);
   if(compoundPatterns.has(ex.pattern)&&!['biceps_curl','triceps_extension','dip_press'].includes(family))return 0;
   if(['chest_fly','lat_isolation','lateral_raise','rear_delt','leg_extension','leg_curl','hip_extension'].includes(family))return 1;
   if(['biceps_curl','triceps_extension','calf_raise','spinal_flexion','hip_flexion_core','anti_extension'].includes(family))return 2;
   return 1;
 };
 return selected.map((ex,index)=>({ex,index,tier:orderTier(ex)}))
   .sort((a,b)=>a.tier-b.tier||a.index-b.index)
   .map(x=>x.ex);
}
function coachWorkoutName(request){
 const target=request.targetLabels.length?request.targetLabels.join(' + '):'Workout';
 const suffix=request.goal==='strength'?'Strength':request.goal==='general'?'Training':'Growth';
 return `Coach · ${target} · ${suffix}`;
}
function coachGenerateWorkout(request){
 const req={
   ...request,duration:request.duration||45,
   targetKeys:[...(request.targetKeys||[])],targetLabels:[...(request.targetLabels||[])],targetRegions:[...(request.targetRegions||[])],
   liftingGrammar:{...(request.liftingGrammar||{})},
   allowedEquipment:[...(request.allowedEquipment||[])],excludedEquipment:[...(request.excludedEquipment||[])],
   priorityRegions:[...(request.priorityRegions||[])],excludedExerciseIds:[...(request.excludedExerciseIds||[])],
   requiredExerciseIds:[...(request.requiredExerciseIds||[])]
 };
 const defaults=coachApplyLiftingGrammarToDefaults(coachProgrammingDefaults(req.goal,req.duration),req.liftingGrammar);
 const selected=coachSelectExercises(req,defaults.exerciseCount);
 if(!selected.length)return null;
 coachBuildDraft={request:req,defaults,selectedIds:selected.map(x=>x.id),createdAt:new Date().toISOString(),lastRefinement:request.lastRefinement||''};
 return coachBuildDraft;
}