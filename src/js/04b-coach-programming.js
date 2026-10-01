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
 if(family==='row')return (['back','upper back','pull'].includes(single))&&count>=5?2:1;
 if(family==='vertical_pull')return (['back','lats','pull'].includes(single))&&count>=6?2:1;
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
   'Deadlift','Romanian Deadlift','Roman Chair Back Extension','Seated Back Extension Machine','Barbell Shrug',
   'Overhead Press','Dumbbell Shoulder Press','Dumbbell Lateral Raise','Cable Lateral Raise','Rear Delt Fly','Face Pull',
   'Back Squat','Front Squat','Leg Press','Hack Squat','Bulgarian Split Squat','Seated Leg Curl','Lying Leg Curl','Leg Extension','Hip Thrust',
   'Barbell Curl','Dumbbell Curl','Hammer Curl','Preacher Curl','Triceps Pushdown','Rope Triceps Pushdown','Overhead Triceps Extension','Skull Crusher',
   'Standing Calf Raise','Seated Calf Raise','Cable Crunch','Hanging Leg Raise'
 ]);
 if(staples.has(name))score+=18;
 if(/\b(?:single arm|single leg|alternating|behind-the-neck|anderson|board press|spoto|zercher|meadows|renegade|yates|jm press|tate press|b-stance|snatch grip|deficit|rack pull|block pull|clean pull|high pull|power clean|power snatch)\b/i.test(name))score-=22;
 if(ex?.pattern==='olympic_pull'&&request.goal!=='strength')score-=55;
 const backFocused=keys.includes('back')||keys.includes('lower back');
 if(backFocused&&request.goal!=='strength'){
   if(ex?.pattern==='back_extension')score+=30;
   if(name==='Deadlift')score-=6;
   if(/\b(?:rack pull|block pull|deficit deadlift)\b/i.test(name))score-=20;
 }
 if(backFocused&&request.goal==='strength'){
   if(name==='Deadlift')score+=100;
   if(/\b(?:rack pull|block pull|deficit deadlift)\b/i.test(name))score-=40;
 }
 if(keys.includes('traps')&&ex?.pattern==='shrug')score+=30;
 if(keys.includes('lats')&&['vertical_pull','shoulder_extension','pullover'].includes(ex?.pattern))score+=24;
 return score;
}
function coachSmartExerciseCount(request,baseCount){
 const keys=coachRequestedTargetKeys(request),base=Math.max(1,Number(baseCount)||1);
 if(keys.length!==1)return keys.length===2?Math.min(base,7):base;
 const key=keys[0];
 if(key==='lower back')return Math.min(base,4);
 if(['upper back','lats','traps'].includes(key))return Math.min(base,5);
 if(['chest','back','shoulders','arms','biceps','triceps','full body'].includes(key))return Math.min(base,6);
 if(['push','pull','legs','lower body','upper body','posterior chain'].includes(key))return Math.min(base,7);
 return base;
}
function coachCandidateBaseScore(ex,request){
 if(!coachExerciseAllowedByConstraints(ex,request))return -Infinity;
 const meta=exerciseMuscleMetadata(ex),targets=new Set(request.targetRegions),priority=new Set(request.priorityRegions||[]),keys=coachRequestedTargetKeys(request);
 const isolatedBackRequest=keys.some(k=>['back','upper back','lower back','lats','traps'].includes(k))
   &&!keys.some(k=>['legs','lower body','hamstrings','glutes','quads','full body'].includes(k));
 if(isolatedBackRequest&&request.goal!=='strength'&&ex.pattern==='olympic_pull'&&!(request.requiredExerciseIds||[]).includes(ex.id))return -Infinity;
 const primaryHits=meta.primary.filter(m=>targets.has(m)),secondaryHits=meta.secondary.filter(m=>targets.has(m));
 if(!primaryHits.length&&!secondaryHits.length)return -Infinity;
 let score=(primaryHits.length?115+(primaryHits.length-1)*32:0)+secondaryHits.length*28+preferenceRank(ex.id)+coachGenericExerciseBias(ex,request);
 const programUses=Number(request.programExerciseUsage?.[ex.id])||0;
 if(programUses)score-=programUses*(request.goal==='strength'?18:34);
 meta.primary.filter(m=>priority.has(m)).forEach(()=>score+=82);
 meta.secondary.filter(m=>priority.has(m)).forEach(()=>score+=24);
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
 const lowerBackDirect=ex=>meta(ex).primary.includes('lower_back')&&(
   request.goal==='strength'?['back_extension','hinge'].includes(ex.pattern):ex.pattern==='back_extension'
 );
 const posteriorChainHinge=ex=>{
   if(ex.pattern!=='hinge')return false;
   const m=meta(ex);
   if(request.goal==='strength')return m.primary.includes('lower_back')||m.secondary.includes('lower_back');
   return m.secondary.includes('lower_back')&&m.primary.some(region=>['hamstrings','glutes'].includes(region));
 };
 const trapDirect=ex=>meta(ex).primary.includes('traps')||ex.pattern==='shrug';
 const upperBackAccessory=ex=>ex.pattern==='rear_delt'&&meta(ex).secondary.includes('upper_back');
 const bicepsDirect=ex=>ex.pattern==='elbow_flexion'&&meta(ex).primary.includes('biceps');
 const bicepsSupinated=ex=>bicepsDirect(ex)&&!/\b(?:hammer|reverse|zottman)\b/i.test(ex.name||'');
 const bicepsNeutral=ex=>bicepsDirect(ex)&&/\b(?:hammer|cross-body|rope hammer)\b/i.test(ex.name||'');
 const tricepsDirect=ex=>coachMovementFamily(ex)==='triceps_extension'&&meta(ex).primary.includes('triceps')&&!/\b(?:dip|push-?up|bench press|jm press|tate press)\b/i.test(ex.name||'');
 const tricepsOverhead=ex=>tricepsDirect(ex)&&/\boverhead\b/i.test(ex.name||'');
 const tricepsNeutral=ex=>tricepsDirect(ex)&&!/\boverhead\b/i.test(ex.name||'');
 const forearmDirect=ex=>meta(ex).primary.includes('forearms')&&['wrist_flexion','wrist_extension','grip'].includes(ex.pattern);
 const forearmFlexion=ex=>forearmDirect(ex)&&ex.pattern==='wrist_flexion';
 const forearmExtension=ex=>forearmDirect(ex)&&ex.pattern==='wrist_extension';
 const shoulderPress=ex=>ex.pattern==='vertical_press'&&(meta(ex).primary.includes('front_delts')||meta(ex).primary.includes('side_delts'));
 const shoulderLateral=ex=>ex.pattern==='lateral_raise'&&meta(ex).primary.includes('side_delts');
 const shoulderRear=ex=>ex.pattern==='rear_delt'&&meta(ex).primary.includes('rear_delts');
 const squatPattern=ex=>['squat','lunge'].includes(ex.pattern)&&meta(ex).primary.includes('quads');
 const hipHinge=ex=>ex.pattern==='hinge'&&meta(ex).primary.some(region=>['hamstrings','glutes'].includes(region));
 const hamstringCurl=ex=>ex.pattern==='knee_flexion'&&meta(ex).primary.includes('hamstrings');
 const glutePattern=ex=>meta(ex).primary.includes('glutes')&&['hip_extension','hinge'].includes(ex.pattern);
 const adductorPattern=ex=>meta(ex).primary.includes('adductors')||ex.pattern==='hip_adduction';
 const calfPattern=ex=>ex.pattern==='calf_raise'&&meta(ex).primary.includes('calves');
 const corePattern=ex=>meta(ex).primary.includes('core')||meta(ex).primary.includes('obliques');
 const addChest=()=>{
   add(core,'chest_press','Chest press',chestPress);
   if(keys.length===1&&keys[0]==='chest'){
     add(core,'chest_incline','Incline chest press',chestIncline);
     add(core,'chest_fly','Chest isolation',chestFly);
   }else{
     add(optional,'chest_incline','Incline chest press',chestIncline);
     add(optional,'chest_fly','Chest isolation',chestFly);
   }
 };
 const addUpperBackPull=()=>{
   add(core,'back_row','Horizontal back pull',backRow);
   add(optional,'back_vertical','Vertical back pull',backVertical);
   add(optional,'lat_isolation','Lat isolation',latIsolation);
   add(optional,'back_rear_delt','Rear delt / upper-back accessory',upperBackAccessory);
 };
 const addFullBack=()=>{
   if(request.goal==='strength')add(core,'back_erectors','Spinal erector / hinge',lowerBackDirect);
   add(core,'back_row','Horizontal pull / upper back',backRow);
   add(core,'back_vertical','Vertical pull / lats',backVertical);
   if(request.goal!=='strength')add(core,'back_erectors','Spinal erector / lower back',lowerBackDirect);
   add(optional,'lat_isolation','Lat isolation',latIsolation);
   add(optional,'back_traps','Trapezius',trapDirect);
   add(optional,'back_rear_delt','Rear delt / upper-back accessory',upperBackAccessory);
 };
 const addLowerBack=()=>{
   add(core,'lower_back_direct','Direct lumbar / spinal erector',lowerBackDirect);
   add(optional,'lower_back_hinge','Posterior-chain hinge',posteriorChainHinge);
 };
 const addLats=()=>{
   add(core,'lats_vertical','Vertical pull / lats',backVertical);
   add(optional,'lats_isolation','Lat isolation',latIsolation);
   add(optional,'lats_row','Lat-involving row',ex=>backRow(ex)&&meta(ex).primary.includes('lats'));
 };
 const addTraps=()=>{
   add(core,'traps_direct','Trapezius',trapDirect);
   add(optional,'traps_row','Upper-back row',backRow);
 };
 const addUpperBack=()=>{
   add(core,'upper_back_row','Upper-back row',backRow);
   add(optional,'upper_back_traps','Trapezius',trapDirect);
   add(optional,'upper_back_rear_delt','Rear delt / scapular accessory',upperBackAccessory);
 };
 const addArms=()=>{
   if(keys.length===1&&keys[0]==='arms'){
     add(core,'arms_biceps_supinated','Supinated elbow flexion',bicepsSupinated);
     add(core,'arms_biceps_neutral','Neutral-grip elbow flexion',bicepsNeutral);
     add(core,'arms_triceps_neutral','Triceps extension',tricepsNeutral);
     add(core,'arms_triceps_overhead','Overhead triceps extension',tricepsOverhead);
     add(optional,'arms_forearm_flexion','Forearm flexors',forearmFlexion);
     add(optional,'arms_forearm_extension','Forearm extensors',forearmExtension);
   }else{
     add(core,'biceps_direct','Direct biceps',bicepsDirect);
     add(core,'triceps_direct','Direct triceps',tricepsDirect);
     add(optional,'arms_biceps_neutral','Neutral-grip elbow flexion',bicepsNeutral);
     add(optional,'arms_triceps_overhead','Overhead triceps extension',tricepsOverhead);
     add(optional,'arms_forearms','Direct forearms',forearmDirect);
   }
 };
 const addShoulders=()=>{
   add(core,'shoulder_press','Anterior-delt press',shoulderPress);
   add(core,'shoulder_lateral','Lateral delts',shoulderLateral);
   add(core,'shoulder_rear','Rear delts',shoulderRear);
 };
 const addLegs=()=>{
   add(core,'leg_knee','Knee-dominant quads',squatPattern);
   add(core,'leg_hinge','Hip hinge / posterior chain',hipHinge);
   add(core,'leg_curl','Knee-flexion hamstrings',hamstringCurl);
   add(core,'leg_calves','Calves',calfPattern);
   add(optional,'leg_glutes','Glute emphasis',glutePattern);
   add(optional,'leg_adductors','Adductors',adductorPattern);
 };
 const addPosteriorChain=()=>{
   add(core,'posterior_hinge','Hip hinge',hipHinge);
   add(core,'posterior_curl','Knee-flexion hamstrings',hamstringCurl);
   add(core,'posterior_erectors','Direct spinal erectors',lowerBackDirect);
   add(optional,'posterior_glutes','Glute emphasis',glutePattern);
 };

 if(keys.includes('full body')){
   add(core,'full_squat','Lower-body compound',squatPattern);
   add(core,'full_hinge','Hip hinge',hipHinge);
   add(core,'full_press','Upper-body press',chestPress);
   add(core,'full_pull','Upper-body pull',ex=>backRow(ex)||backVertical(ex));
   add(optional,'full_shoulders','Shoulders',shoulderPress);
 }else if(keys.includes('upper body')&&keys.length===1){
   addChest();addUpperBackPull();addShoulders();
   add(optional,'upper_biceps','Direct biceps',bicepsDirect);add(optional,'upper_triceps','Direct triceps',tricepsDirect);
 }else if(keys.includes('lower body')&&keys.length===1){
   addLegs();
 }else if(keys.includes('push')&&keys.length===1){
   add(core,'push_chest','Chest press',chestPress);add(core,'push_shoulders','Shoulder press',shoulderPress);add(core,'push_triceps','Direct triceps',tricepsDirect);
   add(optional,'push_chest_iso','Chest isolation',chestFly);add(optional,'push_side_delts','Side delts',ex=>ex.pattern==='lateral_raise');
 }else if(keys.includes('pull')&&keys.length===1){
   add(core,'pull_row','Horizontal pull',backRow);add(core,'pull_vertical','Vertical pull',backVertical);add(core,'pull_biceps','Direct biceps',bicepsDirect);
   add(optional,'pull_lats','Lat isolation',latIsolation);add(optional,'pull_rear_delts','Rear delts',ex=>ex.pattern==='rear_delt');
 }else{
   keys.forEach(key=>{
     if(key==='chest')addChest();
     else if(key==='back')addFullBack();
     else if(key==='upper back')addUpperBack();
     else if(key==='lower back')addLowerBack();
     else if(key==='lats')addLats();
     else if(key==='traps')addTraps();
     else if(key==='arms')addArms();
     else if(key==='shoulders')addShoulders();
     else if(key==='posterior chain')addPosteriorChain();
     else if(key==='legs')addLegs();
     else if(key==='biceps'){
       add(core,'biceps_supinated','Supinated elbow flexion',bicepsSupinated);
       add(optional,'biceps_neutral','Neutral-grip elbow flexion',bicepsNeutral);
     }
     else if(key==='triceps'){
       add(core,'triceps_neutral','Triceps extension',tricepsNeutral);
       add(core,'triceps_overhead','Overhead triceps extension',tricepsOverhead);
     }
     else if(key==='forearms'){
       add(core,'forearm_flexion','Forearm flexors',forearmFlexion);
       add(core,'forearm_extension','Forearm extensors',forearmExtension);
       add(optional,'forearm_grip','Grip / carry',ex=>forearmDirect(ex)&&ex.pattern==='grip');
     }
     else if(key==='quads')add(core,'quads_direct','Quads',ex=>meta(ex).primary.includes('quads'));
     else if(key==='hamstrings'){add(core,'hamstrings_hinge','Hip hinge',hipHinge);add(core,'hamstrings_curl','Knee-flexion hamstrings',hamstringCurl);}
     else if(key==='glutes')add(core,'glutes_direct','Glutes',ex=>meta(ex).primary.includes('glutes'));
     else if(key==='calves')add(core,'calves_direct','Calves',calfPattern);
     else if(key==='core')add(core,'core_direct','Core',corePattern);
     else if(key==='push'){addChest();addShoulders();add(core,'triceps_direct','Direct triceps',tricepsDirect)}
     else if(key==='pull'){addUpperBackPull();add(core,'biceps_direct','Direct biceps',bicepsDirect)}
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
 const prioritySet=new Set(request.priorityRegions||[]);
 const optionalSlots=[...plan.optional].sort((a,b)=>{
   const slotPriority=slot=>pool.some(ex=>slot.match(ex)&&exerciseMuscleMetadata(ex).primary.some(region=>prioritySet.has(region)))?1:0;
   return slotPriority(b)-slotPriority(a);
 });
 for(const slot of optionalSlots){
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
   if(['chest_fly','lat_isolation','lateral_raise','rear_delt','leg_extension','leg_curl','hip_extension','back_extension','shrug'].includes(family))return 1;
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
   priorityRegions:[...(request.priorityRegions||[])],priorityKeys:[...(request.priorityKeys||[])],excludedExerciseIds:[...(request.excludedExerciseIds||[])],
   requiredExerciseIds:[...(request.requiredExerciseIds||[])]
 };
 const defaults=coachApplyLiftingGrammarToDefaults(coachProgrammingDefaults(req.goal,req.duration),req.liftingGrammar);
 const selected=coachSelectExercises(req,defaults.exerciseCount);
 if(!selected.length)return null;
 coachBuildDraft={request:req,defaults,selectedIds:selected.map(x=>x.id),createdAt:new Date().toISOString(),lastRefinement:request.lastRefinement||''};
 return coachBuildDraft;
}