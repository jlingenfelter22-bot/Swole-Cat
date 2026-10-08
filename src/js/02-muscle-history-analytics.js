function startOfWeek(d=new Date()){
 const x=new Date(d);x.setHours(0,0,0,0);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x;
}
const MUSCLE_REGION_LABELS={
 chest:'Chest',front_delts:'Front delts',side_delts:'Side delts',rear_delts:'Rear delts',
 biceps:'Biceps',triceps:'Triceps',forearms:'Forearms',upper_back:'Upper back',lats:'Lats',
 traps:'Traps',lower_back:'Lower back',core:'Abs / core',obliques:'Obliques',glutes:'Glutes',
 quads:'Quads',hamstrings:'Hamstrings',adductors:'Adductors',calves:'Calves',tibialis:'Tibialis'
};
function uniqueMuscles(list){return [...new Set((list||[]).filter(Boolean))]}
const EXERCISE_MUSCLE_OVERRIDES={
 'Deadlift':{primary:['quads','glutes','lower_back'],secondary:['hamstrings','upper_back','forearms','core']},
 'Rack Pull':{primary:['glutes','lower_back','upper_back'],secondary:['hamstrings','traps','forearms','core']},
 'Block Pull':{primary:['glutes','lower_back','upper_back'],secondary:['hamstrings','traps','forearms','core']},
 'Deficit Deadlift':{primary:['quads','glutes','lower_back'],secondary:['hamstrings','upper_back','forearms','core']},
 'Sumo Deadlift':{primary:['quads','glutes','adductors'],secondary:['hamstrings','lower_back','forearms','core']},
 'Trap Bar Deadlift':{primary:['quads','glutes'],secondary:['hamstrings','lower_back','traps','forearms','core']},
 'Reverse Hyperextension':{primary:['glutes','hamstrings'],secondary:['lower_back']},
 '45-Degree Back Extension':{primary:['hamstrings','glutes'],secondary:['lower_back']},
 'Glute Ham Raise':{primary:['hamstrings'],secondary:['glutes']},
 'Assisted Dip':{primary:['triceps'],secondary:['chest','front_delts']},
 'Plate Loaded Dip':{primary:['triceps'],secondary:['chest','front_delts']},
 'Bench Dip':{primary:['triceps'],secondary:['chest','front_delts']},
 'Diamond Push-Up':{primary:['triceps'],secondary:['chest','front_delts']},
 'Reverse Barbell Curl':{primary:['forearms'],secondary:['biceps']},
 'Reverse Dumbbell Curl':{primary:['forearms'],secondary:['biceps']},
 'Zottman Curl':{primary:['biceps','forearms'],secondary:[]},
 'Dumbbell Farmer Carry':{primary:['forearms','traps','core'],secondary:['glutes','quads']},
 'Trap Bar Farmer Carry':{primary:['forearms','traps','core'],secondary:['glutes','quads']},
 'Plate Pinch Carry':{primary:['forearms'],secondary:['traps','core']},
 'Kettlebell Farmer Carry':{primary:['forearms','traps','core'],secondary:['glutes','quads']},
 'Kettlebell Suitcase Carry':{primary:['forearms','obliques','core'],secondary:['traps','glutes']},
 'Kettlebell Swing':{primary:['glutes','hamstrings'],secondary:['quads','lower_back','core']},
 'Kettlebell Romanian Deadlift':{primary:['hamstrings','glutes'],secondary:['lower_back','core']},
 'Kettlebell Goblet Squat':{primary:['quads','glutes'],secondary:['adductors','core']},
 'Double Kettlebell Front Squat':{primary:['quads','glutes'],secondary:['adductors','core']},
 'Landmine Squat':{primary:['quads','glutes'],secondary:['adductors','core']},
 'Landmine Reverse Lunge':{primary:['quads','glutes'],secondary:['adductors','core']},
 'Kettlebell Press':{primary:['front_delts'],secondary:['side_delts','triceps','core']},
 'Double Kettlebell Press':{primary:['front_delts'],secondary:['side_delts','triceps','core']},
 'Landmine Press':{primary:['front_delts','chest'],secondary:['triceps','core']},
 'Half-Kneeling Landmine Press':{primary:['front_delts','chest'],secondary:['triceps','core']},
 'Backward Sled Drag':{primary:['quads'],secondary:['glutes','calves','core']},
 'Sled Drag':{primary:['quads','glutes'],secondary:['hamstrings','calves','core']}
};
function auditedMuscleResult(primary,secondary,pattern){
 const p=uniqueMuscles(primary),s=uniqueMuscles((secondary||[]).filter(x=>!p.includes(x)));
 return {primary:p,secondary:s,movementFamily:pattern||'other'};
}
function exerciseMuscleMetadata(ex){
 if(!ex)return {primary:[],secondary:[],movementFamily:'other'};
 if(Array.isArray(ex.primaryMuscles)&&ex.primaryMuscles.length){
   return auditedMuscleResult(ex.primaryMuscles,ex.secondaryMuscles||[],ex.movementFamily||ex.pattern||'other');
 }
 const name=ex.name||'',muscle=ex.muscle||'Other',pattern=ex.pattern||'other';
 const override=EXERCISE_MUSCLE_OVERRIDES[name];
 if(override)return auditedMuscleResult(override.primary,override.secondary,pattern);
 let primary=[],secondary=[];
 if(muscle==='Chest'){
   primary=['chest'];
   secondary=['front_delts',...(pattern==='chest_fly'?[]:['triceps'])];
 }else if(muscle==='Back'){
   if(pattern==='hinge'){primary=['quads','glutes','lower_back'];secondary=['hamstrings','upper_back','forearms','core'];}
   else if(pattern==='vertical_pull'){primary=['lats'];secondary=['upper_back','biceps','rear_delts'];}
   else if(pattern==='shoulder_extension'||pattern==='pullover'){primary=['lats'];secondary=['upper_back','triceps'];}
   else {primary=['upper_back','lats'];secondary=['rear_delts','biceps'];}
 }else if(muscle==='Lower Back'){
   if(pattern==='back_extension'){primary=['lower_back'];secondary=['glutes','hamstrings'];}
   else {primary=['lower_back','glutes'];secondary=['hamstrings','upper_back','forearms'];}
 }else if(muscle==='Shoulders'){
   if(pattern==='lateral_raise'){primary=['side_delts'];secondary=[];}
   else if(pattern==='rear_delt'){primary=['rear_delts'];secondary=['upper_back'];}
   else if(pattern==='front_raise'){primary=['front_delts'];secondary=[];}
   else if(pattern==='upright_row'){primary=['side_delts','traps'];secondary=['biceps'];}
   else {primary=['front_delts','side_delts'];secondary=['triceps'];}
 }else if(muscle==='Traps'){
   primary=['traps'];secondary=pattern==='shrug'?['forearms']:['upper_back'];
 }else if(muscle==='Quads'){
   if(pattern==='squat'||pattern==='lunge'){primary=['quads','glutes'];secondary=['adductors'];}
   else if(pattern==='sled_push'){primary=['quads','glutes'];secondary=['hamstrings','calves','core'];}
   else primary=['quads'];
 }else if(muscle==='Hamstrings'){
   if(pattern==='hinge'){primary=['hamstrings','glutes'];secondary=['lower_back'];}
   else primary=['hamstrings'];
 }else if(muscle==='Glutes'){
   primary=['glutes'];
   if(pattern==='hip_abduction')secondary=[];
   else if(pattern==='hip_extension')secondary=['hamstrings'];
   else if(pattern==='squat'||pattern==='lunge')secondary=['quads','adductors'];
 }else if(muscle==='Adductors'){
   primary=['adductors'];secondary=[];
 }else if(muscle==='Biceps'){
   primary=['biceps'];secondary=['forearms'];
 }else if(muscle==='Triceps'){
   primary=['triceps'];
   secondary=(pattern==='dip_press'||pattern==='horizontal_press')?['chest','front_delts']:[];
 }else if(muscle==='Forearms'){
   primary=['forearms'];
   secondary=pattern==='grip'?['traps','core']:(pattern==='elbow_flexion'?['biceps']:[]);
 }else if(muscle==='Calves'){
   primary=['calves'];
 }else if(muscle==='Tibialis'){
   primary=['tibialis'];
 }else if(muscle==='Core'){
   if(pattern==='rotation'||pattern==='lateral_flexion'||pattern==='anti_rotation')primary=['obliques','core'];
   else primary=['core'];
 }else if(muscle==='Full Body'){
   if(pattern==='carry'){primary=['forearms','traps','core'];secondary=['obliques','quads','glutes'];}
   else if(pattern==='hinge'){primary=['glutes','hamstrings'];secondary=['lower_back','core','quads'];}
   else if(pattern==='squat'||pattern==='lunge'){primary=['quads','glutes'];secondary=['adductors','core'];}
   else if(pattern==='vertical_press'){primary=['front_delts'];secondary=['side_delts','triceps','core'];}
   else if(pattern==='sled_push'||pattern==='sled_pull'){primary=['quads','glutes'];secondary=['hamstrings','calves','core'];}
   else if(pattern==='olympic_pull'){primary=['quads','glutes','traps'];secondary=['hamstrings','upper_back','core','forearms'];}
   else {primary=['quads','glutes','upper_back'];secondary=['hamstrings','traps','core','forearms'];}
 }else{
   primary=[String(muscle).toLowerCase().replace(/\s+/g,'_')];
 }
 return auditedMuscleResult(primary,secondary,pattern);
}

function sessionMuscleScores(session){
 const scores={};
 (session.exercises||[]).forEach(e=>{
   if(e.skipped)return;
   const working=progressionSets(e);
   if(!working.length)return;
   const meta=exerciseMuscleMetadata(exById(e.exerciseId));
   const setCount=working.length;
   meta.primary.forEach(m=>scores[m]=(scores[m]||0)+setCount);
   meta.secondary.forEach(m=>scores[m]=(scores[m]||0)+setCount*.5);
 });
 return scores;
}
function muscleHeatLevel(score){
 if(score>=6)return 3;
 if(score>=3)return 2;
 if(score>0)return 1;
 return 0;
}
function muscleRegionClass(region,scores){return 'muscle-region heat-'+muscleHeatLevel(Number(scores?.[region])||0)}
function anatomyScoreRegion(id){
 if(/^chest-/.test(id))return 'chest';
 if(/^shoulder-front-/.test(id))return 'front_delts';
 if(/^shoulder-side-/.test(id))return 'side_delts';
 if(/^deltoid-rear-/.test(id))return 'rear_delts';
 if(/^biceps-/.test(id))return 'biceps';
 if(/^triceps-/.test(id))return 'triceps';
 if(/^forearm/.test(id))return 'forearms';
 if(/^abs-/.test(id))return 'core';
 if(/^obliques-/.test(id))return 'obliques';
 if(/^adductors-/.test(id))return 'adductors';
 if(/^quads-/.test(id))return 'quads';
 if(/^tibialis-anterior-/.test(id))return 'tibialis';
 if(/^calves-/.test(id))return 'calves';
 if(/^traps-upper-/.test(id))return 'traps';
 if(/^traps-(mid|lower)-/.test(id))return 'upper_back';
 if(/^lats-/.test(id))return 'lats';
 if(/^lower-back-/.test(id))return 'lower_back';
 if(/^gluteus-/.test(id))return 'glutes';
 if(/^hamstrings-/.test(id))return 'hamstrings';
 return '';
}
function availableHeatMapMuscleRegions(){
 return [...new Set([...SWOLECAT_ANATOMY_FRONT,...SWOLECAT_ANATOMY_BACK].map(x=>anatomyScoreRegion(x.id)).filter(Boolean))];
}
function anatomyPathClass(part,scores){
 const region=anatomyScoreRegion(part.id);
 if(!region)return 'anatomy-neutral';
 return 'anatomy-muscle heat-'+muscleHeatLevel(Number(scores?.[region])||0);
}
function muscleHeatMapSvg(side,scores={}){
 const isBack=side==='back',parts=isBack?SWOLECAT_ANATOMY_BACK:SWOLECAT_ANATOMY_FRONT;
 const viewBox=isBack?'37 0 35 93':'0 0 35 93';
 const paths=parts.map(part=>{
   const region=anatomyScoreRegion(part.id);
   const regionAttr=region?` data-region="${region}"`:'';
   return `<path class="${anatomyPathClass(part,scores)}" data-anatomy-id="${escAttr(part.id)}"${regionAttr} d="${escAttr(part.path)}"><title>${esc(part.name)}</title></path>`;
 }).join('');
 return `<svg class="muscle-map-svg" viewBox="${viewBox}" role="img" aria-label="${isBack?'Back':'Front'} muscle involvement map">
   <defs><filter id="scAnatomyGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".22" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
   <path class="muscle-map-accent" d="${isBack?'M39 7h3M67 7h3M39 87h3M67 87h3':'M2 7h3M30 7h3M2 87h3M30 87h3'}"/>
   <g class="anatomy-body">${paths}</g>
 </svg>`;
}

function muscleHeatMapHtml(session){
 const scores=sessionMuscleScores(session);
 const ranked=Object.entries(scores).filter(([,score])=>score>0).sort((a,b)=>b[1]-a[1]);
 return `<div class="muscle-heatmap-grid">
   <div class="muscle-map-card"><div class="muscle-map-title">Front</div>${muscleHeatMapSvg('front',scores)}</div>
   <div class="muscle-map-card"><div class="muscle-map-title">Back</div>${muscleHeatMapSvg('back',scores)}</div>
 </div>
 <div class="muscle-map-legend">
   <div class="muscle-map-legend-item"><span class="muscle-map-dot heat-0"></span>Untargeted</div>
   <div class="muscle-map-legend-item"><span class="muscle-map-dot heat-1"></span>Light</div>
   <div class="muscle-map-legend-item"><span class="muscle-map-dot heat-2"></span>Moderate</div>
   <div class="muscle-map-legend-item"><span class="muscle-map-dot heat-3"></span>High</div>
 </div>
 ${ranked.length?`<div class="muscle-score-list">${ranked.slice(0,8).map(([muscle,score])=>`<span class="muscle-score-chip"><b>${esc(MUSCLE_REGION_LABELS[muscle]||muscle)}</b> · ${score % 1 ? score.toFixed(1) : score} set-eq</span>`).join('')}</div>`:''}
 <div class="muscle-map-note">Based on completed working sets. Primary muscles contribute more than secondary muscles. This map shows relative training involvement only — not soreness, recovery, muscle damage, or measured activation.</div>`;
}
function sessionVolume(s){
 // Assistance numbers are counterweights, not external resistance volume.
 return s.exercises.reduce((sum,e)=>sum+(exerciseLoadType(e.exerciseId,e.config)==='external'
   ?completedSets(e).reduce((a,x)=>a+(Number(x.weight)||0)*(Number(x.reps)||0),0):0),0);
}
function sessionSetCount(s){return s.exercises.reduce((n,e)=>n+progressionSets(e).length,0)}
function sessionAllSetCount(s){return s.exercises.reduce((n,e)=>n+completedSets(e).length,0)}
function sessionPRCount(s){return s.exercises.reduce((n,e)=>n+(progressionSets(e).some(x=>x.pr)?1:0),0)}
function sessionTotalReps(s){return (s.exercises||[]).reduce((n,e)=>n+completedSets(e).reduce((a,set)=>a+(Number(set.reps)||0),0),0)}
function sessionCompletedExerciseCount(s){return (s.exercises||[]).filter(e=>!e.skipped&&completedSets(e).length>0).length}
function sessionMuscleGroups(s){
 const groups=[];
 (s.exercises||[]).forEach(e=>{
   if(e.skipped||!completedSets(e).length)return;
   const meta=exerciseMuscleMetadata(exById(e.exerciseId));
   meta.primary.forEach(m=>groups.push(MUSCLE_REGION_LABELS[m]||m));
 });
 return [...new Set(groups)];
}
function sessionPRDetails(s){
 const rows=[];
 (s.exercises||[]).forEach(e=>{
   const ex=exById(e.exerciseId);
   const labels=[...new Set(progressionSets(e).map(set=>set.pr).filter(Boolean))];
   if(labels.length)rows.push({exerciseId:e.exerciseId,name:ex?.name||'Exercise',labels});
 });
 return rows;
}
function previousSessionExercise(exerciseId,sessions=state.sessions){
 for(let i=sessions.length-1;i>=0;i--){
   if(sessions[i].programPhase==='deload')continue;
   const row=(sessions[i].exercises||[]).find(e=>e.exerciseId===exerciseId&&progressionSets(e).length);
   if(row)return row;
 }
 return null;
}
function sessionsBeforeSession(session){
 const at=new Date(session?.date||0).getTime();
 if(!Number.isFinite(at))return [];
 return state.sessions
   .filter(s=>s.id!==session.id&&new Date(s.date).getTime()<at)
   .sort((a,b)=>new Date(a.date)-new Date(b.date));
}
function historicalProgressHighlights(session){
 return sessionProgressHighlights(session,sessionsBeforeSession(session));
}
function openHistoricalWorkoutRecap(id){
 const session=state.sessions.find(s=>s.id===id);
 if(!session)return;
 openModal('Workout recap',workoutRecapHtml(session,{progressHighlights:historicalProgressHighlights(session),historical:true}));
}
function sessionProgressHighlights(s,priorSessions=state.sessions){
 if(s.programPhase==='deload')return [];
 const highlights=[];
 (s.exercises||[]).forEach(e=>{
   const current=progressionSets(e);
   if(!current.length)return;
   const prior=previousSessionExercise(e.exerciseId,priorSessions);
   if(!prior)return;
   const previous=progressionSets(prior);
   if(!previous.length)return;
   const ex=exById(e.exerciseId),name=ex?.name||'Exercise',type=exerciseLoadType(e.exerciseId,e.config);
   const measurement=exerciseMeasurementType(e.exerciseId,e.config);
   if(measurement!=='reps'){
    const sum=rows=>rows.reduce((n,set)=>n+exerciseMetricValue(set,measurement),0);
    const currentTotal=sum(current),previousTotal=sum(previous);
    if(currentTotal>previousTotal&&previousTotal>0)
     highlights.push({name,text:measurement==='duration'?
      'Total working hold time increased from '+compactMetricNumber(previousTotal)+' to '+compactMetricNumber(currentTotal)+' seconds.':
      'Total working distance increased from '+compactMetricNumber(distanceFromMeters(previousTotal))+' to '+compactMetricNumber(distanceFromMeters(currentTotal))+' '+distanceUnitLabel()+'.'});
    return;
   }
   const currentMax=Math.max(...current.map(set=>Number(set.weight)||0));
   const previousMax=Math.max(...previous.map(set=>Number(set.weight)||0));
   const currentReps=current.reduce((n,set)=>n+(Number(set.reps)||0),0);
   const previousReps=previous.reduce((n,set)=>n+(Number(set.reps)||0),0);
   const currentVolume=current.reduce((n,set)=>n+(Number(set.weight)||0)*(Number(set.reps)||0),0);
   const previousVolume=previous.reduce((n,set)=>n+(Number(set.weight)||0)*(Number(set.reps)||0),0);
   if(type==='assistance'){
     const currentMin=Math.min(...current.map(set=>Number(set.weight)||0));
     const previousMin=Math.min(...previous.map(set=>Number(set.weight)||0));
     if(currentMin<previousMin&&currentReps>=previousReps){
       highlights.push({name,text:'Reduced assistance from '+previousMin+' to '+currentMin+' '+state.profile.unit+' while maintaining or increasing reps.'});
     }else if(currentMin===previousMin&&currentReps>previousReps){
       highlights.push({name,text:'Completed '+(currentReps-previousReps)+' more reps at '+currentMin+' '+state.profile.unit+' assistance.'});
     }
     return;
   }
   if(type==='bodyweight'){
     if(currentReps>previousReps)highlights.push({name,text:'Completed '+(currentReps-previousReps)+' more bodyweight reps.'});
     return;
   }
   if(currentMax>previousMax){
     highlights.push({name,text:`Top working weight increased from ${previousMax} to ${currentMax} ${state.profile.unit}.`});
   }else if(currentMax===previousMax&&currentReps>previousReps){
     highlights.push({name,text:`Logged ${currentReps-previousReps} more working-set rep${currentReps-previousReps===1?'':'s'} at the same top load.`});
   }else if(currentVolume>0&&previousVolume>0&&currentVolume>previousVolume*1.02){
     const pct=Math.round((currentVolume/previousVolume-1)*100);
     highlights.push({name,text:`Working-set volume increased about ${pct}% versus the previous exposure.`});
   }
 });
 return highlights.slice(0,4);
}
function formatSessionCompletionTime(s){
 const d=new Date(s.date);
 return Number.isNaN(d.getTime())?'Completed workout':d.toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
}
function routineSavedFromSession(sessionId){
 return state.routines.find(r=>r.sourceSessionId===sessionId)||null;
}
function completedSessionRoutineExercises(session){
 return (session?.exercises||[])
   .filter(e=>!e.skipped&&completedSets(e).length)
   .map(e=>{
     const row=routineExerciseFromWorkout(e);
     const completedWorking=progressionSets(e).length,completedAny=completedSets(e).length;
     row.sets=Math.max(1,completedWorking||completedAny||row.sets||1);
     return row;
   });
}
function routineFromCompletedSession(session,name){
 if(!session)return null;
 const exercises=completedSessionRoutineExercises(session);
 if(!exercises.length)return null;
 const existingLinked=!!(session.routineId&&state.routines.some(r=>r.id===session.routineId));
 const routine={
   id:uid(),
   name:(name||session.routineName||'Saved Workout').trim()||'Saved Workout',
   description:`Saved from completed workout · ${formatSessionCompletionTime(session)}`,
   trainingMode:normalizeTrainingMode(session.trainingMode),
   sourceSessionId:session.id,
   sourceType:'completed_session',
   exercises
 };
 cleanupRoutineSupersets(routine);
 if(existingLinked&&routine.name===session.routineName)routine.name=`${routine.name} Copy`;
 return routine;
}
function openSaveSessionAsRoutine(sessionId){
 const session=state.sessions.find(s=>s.id===sessionId);if(!session)return;
 const already=routineSavedFromSession(sessionId);
 if(already){closeModal();go('routines');showToast('That workout is already saved as a routine');return}
 const exercises=completedSessionRoutineExercises(session);
 if(!exercises.length){showToast('No completed exercises to save');return}
 const linked=!!(session.routineId&&state.routines.some(r=>r.id===session.routineId));
 const defaultName=linked?`${session.routineName||'Workout'} Copy`:(session.routineName||'Saved Workout');
 openModal('Save workout as routine',`
   <div class="notice"><b>Save what you actually trained.</b><br>This creates a new reusable routine from the completed workout. Your historical session stays unchanged.</div>
   <div class="field" style="margin-top:12px"><label>Routine name</label><input id="sessionRoutineName" value="${escAttr(defaultName)}"></div>
   <div class="picker-section">Exercises</div>
   <div class="card">${exercises.map((row,i)=>`<div class="list-item"><div class="program-letter">${i+1}</div><div class="grow"><div class="exercise-name">${esc(exById(row.exerciseId)?.name||'Exercise')}</div><div class="mini">${row.sets} working set${row.sets===1?'':'s'} · ${row.minReps}–${row.maxReps} reps · ${row.restSeconds}s rest</div></div></div>`).join('')}</div>
   <div class="actions"><button class="btn" onclick="saveCompletedSessionAsRoutine('${escAttr(sessionId)}')">Save Routine</button><button class="btn secondary" onclick="closeModal()">Cancel</button></div>
 `);
}
function saveCompletedSessionAsRoutine(sessionId){
 const session=state.sessions.find(s=>s.id===sessionId);if(!session)return null;
 const already=routineSavedFromSession(sessionId);
 if(already){showToast('That workout is already saved as a routine');return already.id}
 const name=document.getElementById('sessionRoutineName')?.value?.trim()||session.routineName||'Saved Workout';
 const routine=routineFromCompletedSession(session,name);
 if(!routine){showToast('No completed exercises to save');return null}
 state.routines.push(routine);save();renderRoutines();renderHome();closeModal();showToast('Workout saved as a routine');
 return routine.id;
}
function workoutRecapHtml(session,{updateRoutine=false,progressHighlights=[],historical=false}={}){
 const workingSets=sessionSetCount(session),allSets=sessionAllSetCount(session),reps=sessionTotalReps(session);
 const savedRoutine=routineSavedFromSession(session.id);
 const linkedRoutine=!!(session.routineId&&state.routines.some(r=>r.id===session.routineId));
 const volume=Math.round(sessionVolume(session)),prs=sessionPRDetails(session),muscles=sessionMuscleGroups(session);
 const completedExercises=sessionCompletedExerciseCount(session),skipped=(session.exercises||[]).filter(e=>e.skipped).length;
 const exerciseRows=(session.exercises||[]).map(e=>{
   const ex=exById(e.exerciseId),done=completedSets(e),working=progressionSets(e);
   if(e.skipped)return `<div class="recap-exercise"><div class="recap-exercise-name">${esc(ex?.name||'Exercise')}</div><div class="recap-exercise-meta">Skipped for this session</div></div>`;
   if(!done.length)return `<div class="recap-exercise"><div class="recap-exercise-name">${esc(ex?.name||'Exercise')}</div><div class="recap-exercise-meta">No completed sets</div>${e.notes?`<div class="muscle-map-note" style="margin-top:8px"><b>Notes</b><br>${esc(e.notes)}</div>`:''}</div>`;
   const totalReps=done.reduce((n,set)=>n+(Number(set.reps)||0),0);
   const topWeight=Math.max(...done.map(set=>Number(set.weight)||0));
   const prCount=working.filter(set=>set.pr).length;
   const setRows=done.map((set,i)=>{
     const ordinal=e.sets.slice(0,e.sets.indexOf(set)+1).filter(x=>setType(x)===setType(set)).length;
     const load=Number(set.weight)||0,reps=Number(set.reps)||0;
     return `<div class="recap-set-row"><span>${esc(setTypeLabel(setType(set)))} ${ordinal}</span><b>${load} ${state.profile.unit} × ${reps}</b>${set.rir!==''&&set.rir!=null?`<span>${esc(String(set.rir))} RIR</span>`:'<span></span>'}${set.pr?`<span class="inline-pr-mark">PR</span>`:'<span></span>'}</div>`;
   }).join('');
   return `<div class="recap-exercise">
     <div class="recap-exercise-top"><div><div class="recap-exercise-name">${esc(ex?.name||'Exercise')}</div><div class="recap-exercise-meta">${working.length} working set${working.length===1?'':'s'} · ${totalReps} total reps${topWeight>0?` · top ${topWeight} ${state.profile.unit}`:''}</div></div>${prCount?`<span class="preference-badge prefer">PR ×${prCount}</span>`:''}</div>
     <div class="recap-set-list">${setRows}</div>
     ${e.notes?`<div class="muscle-map-note" style="margin-top:8px"><b>Notes</b><br>${esc(e.notes)}</div>`:''}
   </div>`;
 }).join('');
 const progressionHtml=progressHighlights.length
   ?progressHighlights.map(row=>`<div class="recap-progression"><b>${esc(row.name)}</b><div class="mini">${esc(row.text)}</div></div>`).join('')
   :'<div class="notice">No standout progression callout this session. The recap only highlights clear changes versus your previous exposure.</div>';
 const prHtml=prs.length
   ?prs.map(row=>`<div class="summary-pr"><b><span class="inline-pr-mark">PR</span> ${esc(row.name)}</b><div class="mini">${row.labels.map(x=>esc(x)).join(' · ')}</div></div>`).join('')
   :'<div class="notice">No PR badge this time. PRs are only called when the logged performance clears the existing record logic.</div>';
 return `
   <div class="workout-recap-hero">
     <div class="eyebrow">${session.programPhase==='deload'?'DELOAD WEEK · INTENTIONALLY LIGHTER':historical?'HISTORICAL SESSION · SAVED LOCALLY':'SESSION COMPLETE · SAVED LOCALLY'}</div>
     <div class="workout-recap-title">${esc(session.routineName)}</div>
     <div class="workout-recap-time">${esc(formatSessionCompletionTime(session))} · ${session.durationMinutes||0} min</div>
   </div>
   ${session.programPhase==='deload'?'<div class="workout-deload-note"><b>☾ Deload workout</b><span>This workload is saved in your training history, but it is not used to conclude that you lost strength or to lower your next normal target.</span></div>':''}
   <div class="recap-metrics">
     <div class="recap-metric"><b>${completedExercises}</b><span>Exercises</span></div>
     <div class="recap-metric"><b>${workingSets}</b><span>Working sets</span></div>
     <div class="recap-metric"><b>${reps}</b><span>Total reps</span></div>
     <div class="recap-metric"><b>${prs.length}</b><span>Exercises with PR</span></div>
   </div>
   <div class="recap-section">
     <div class="recap-section-title">Training snapshot</div>
     ${volume>0?`<div class="summary-win"><b>${volume.toLocaleString()} ${state.profile.unit} × reps</b><div class="mini">External-load volume from completed sets. Useful as context, not a score to maximize.</div></div>`:'<div class="notice">External-load volume is not meaningful for this session based on the logged weights.</div>'}
     ${allSets!==workingSets?`<div class="mini" style="margin:8px 2px 0">${allSets} total completed sets including warm-up/drop/failure sets.</div>`:''}
     ${skipped?`<div class="mini" style="margin:5px 2px 0">${skipped} exercise${skipped===1?' was':'s were'} skipped today.</div>`:''}
     ${updateRoutine?'<div class="summary-win"><b>Routine updated</b><div class="mini">Today’s structural changes are now saved to the routine.</div></div>':''}
   </div>
   <div class="recap-section">
     <div class="recap-section-title">Muscles trained</div>
     ${muscles.length?`<div class="recap-muscles">${muscles.map(m=>`<span class="recap-muscle">${esc(m)}</span>`).join('')}</div>`:'<div class="notice">Muscle-group metadata is not available for the completed exercises.</div>'}
   </div>
   <div class="recap-section">
     <div class="recap-section-title">Muscle involvement map</div>
     ${muscleHeatMapHtml(session)}
   </div>
   <div class="recap-section"><div class="recap-section-title">Exercises</div><div class="recap-exercise-list">${exerciseRows}</div></div>
   <div class="recap-section"><div class="recap-section-title">Progression versus last exposure</div>${progressionHtml}</div>
   <div class="recap-section"><div class="recap-section-title">Personal records</div>${prHtml}</div>
   ${session.programId&&programById(session.programId)?`<div class="summary-win"><b>Next in ${esc(programById(session.programId).name)}</b><div class="mini">${esc(programNextRoutine(programById(session.programId))?.name||'Program complete')}</div></div>`:''}
   <div class="actions">
     ${savedRoutine?`<button class="btn green" onclick="closeModal();go('routines')">Routine Saved ✓</button>`:`<button class="btn" onclick="openSaveSessionAsRoutine('${escAttr(session.id)}')">${linkedRoutine?'Save Copy as Routine':'Save as Routine'}</button>`}
     ${historical?`<button class="btn secondary" onclick="closeModal();editCompletedWorkout('${escAttr(session.id)}')">Edit Workout</button>`:''}
     <button class="btn secondary" onclick="closeModal();go('analytics')">View progress</button>
     <button class="btn secondary" onclick="closeModal()">Done</button>
   </div>
 `;
}
function exerciseHistory(exerciseId){return derivedSessionData().historyByExercise.get(exerciseId)||[];}
function exerciseMetrics(exerciseId){
 const h=exerciseHistory(exerciseId).filter(row=>row.programPhase!=='deload'),sets=h.flatMap(x=>x.sets);
 const measurement=exerciseMeasurementType(exerciseId,h.at(-1)||null);
 const type=exerciseLoadType(exerciseId,h.at(-1)||null);
 const metricRows=measurement==='reps'?sets:sets.filter(x=>exerciseMetricValue(x,measurement)>0);
 const bestMetric=measurement==='reps'?0:Math.max(0,...metricRows.map(x=>exerciseMetricValue(x,measurement)));
 const bestWeight=measurement==='reps'&&type==='external'&&sets.length?Math.max(...sets.map(x=>Number(x.weight)||0)):0;
 const bestAssistance=measurement==='reps'&&type==='assistance'&&sets.length?Math.min(...sets.map(x=>Math.max(0,Number(x.weight)||0))):null;
 const bestReps=measurement==='reps'&&sets.length?Math.max(...sets.map(x=>Number(x.reps)||0)):0;
 const bestE1=measurement==='reps'&&type==='external'&&sets.length?Math.max(...sets.map(x=>estimated1RM(x.weight,x.reps))):0;
 const bestVolume=measurement==='reps'&&type==='external'&&h.length?Math.max(...h.map(x=>x.sets.reduce((n,v)=>n+(Number(v.weight)||0)*(Number(v.reps)||0),0))):0;
 const comparable=h.filter(x=>x.sets.some(set=>exerciseMetricValue(set,measurement)>0));
 const latest=comparable.at(-1),prior=comparable.at(-2);
 const latestE1=measurement==='reps'&&type==='external'&&latest?Math.max(...latest.sets.map(x=>estimated1RM(x.weight,x.reps))):0;
 const priorE1=measurement==='reps'&&type==='external'&&prior?Math.max(...prior.sets.map(x=>estimated1RM(x.weight,x.reps))):0;
 let trend='flat';
 if(priorE1&&latestE1>priorE1*1.01)trend='up';
 else if(priorE1&&latestE1<priorE1*.99)trend='down';
 return {history:h,sets,measurement,type,bestMetric,bestWeight,bestAssistance,bestReps,bestE1,bestVolume,latestE1,priorE1,trend};
}
function lastEightWeeks(){
 const now=startOfWeek(),rows=[];
 for(let i=7;i>=0;i--){
   const start=new Date(now);start.setDate(start.getDate()-i*7);
   const end=new Date(start);end.setDate(end.getDate()+7);
   const sessions=state.sessions.filter(s=>{const d=new Date(s.date);return d>=start&&d<end});
   rows.push({label:`${start.getMonth()+1}/${start.getDate()}`,workouts:sessions.length,sets:sessions.reduce((a,s)=>a+sessionSetCount(s),0)});
 }
 return rows;
}
let analyticsMonthOffset=0;

function localDateKey(dateLike){
 const d=dateLike instanceof Date?dateLike:new Date(dateLike);
 if(Number.isNaN(d.getTime()))return '';
 const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
 return `${y}-${m}-${day}`;
}
function monthAnchor(offset=analyticsMonthOffset){
 const d=new Date();d.setHours(12,0,0,0);d.setDate(1);d.setMonth(d.getMonth()+offset);return d;
}
function changeAnalyticsMonth(delta){
 analyticsMonthOffset+=delta;renderAnalytics();
}
function resetAnalyticsMonth(){
 analyticsMonthOffset=0;renderAnalytics();
}
function sessionsForDateKey(key){return derivedSessionData().sessionsByDate.get(key)||[]}
function calendarMonthData(offset=analyticsMonthOffset){
 const base=monthAnchor(offset),year=base.getFullYear(),month=base.getMonth();
 const days=new Date(year,month+1,0).getDate();
 const mondayOffset=(new Date(year,month,1).getDay()+6)%7;
 const cells=Array(mondayOffset).fill(null);
 for(let day=1;day<=days;day++){
   const d=new Date(year,month,day,12),key=localDateKey(d),sessions=sessionsForDateKey(key);
   cells.push({day,key,sessions,count:sessions.length,today:key===localDateKey(new Date())});
 }
 while(cells.length%7)cells.push(null);
 return {base,year,month,cells};
}
function progressCalendarHtml(){
 const data=calendarMonthData(),label=data.base.toLocaleDateString(undefined,{month:'long',year:'numeric'});
 return `<div class="calendar-card">
   <div class="calendar-head">
     <div class="progress-nav"><button onclick="changeAnalyticsMonth(-1)" aria-label="Previous month">‹</button><button onclick="resetAnalyticsMonth()">Today</button><button onclick="changeAnalyticsMonth(1)" aria-label="Next month">›</button></div>
     <div class="calendar-title">${esc(label)}</div>
   </div>
   <div class="calendar-weekdays">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<div>${x}</div>`).join('')}</div>
   <div class="calendar-grid">${data.cells.map(cell=>cell
     ?`<button class="calendar-day ${cell.today?'today':''} ${cell.count?'trained':''} ${cell.sessions.some(s=>s.programPhase==='deload')?'calendar-deload':''}" ${cell.count?`onclick="openProgressDay('${cell.key}')"`:'disabled'}>
        <span class="daynum">${cell.day}</span>${cell.count?'<span class="calendar-dot"></span>':''}${cell.sessions.some(s=>s.programPhase==='deload')?'<span class="calendar-deload-icon" title="Deload workout">☾</span>':''}
        ${cell.count?`<span class="daycount">${cell.count} workout${cell.count===1?'':'s'}</span>`:''}
       </button>`
     :'<div class="calendar-day empty"></div>').join('')}</div>
 </div>`;
}
function openProgressDay(key){
 const sessions=sessionsForDateKey(key).sort((a,b)=>b.date.localeCompare(a.date));
 if(!sessions.length)return;
 const d=new Date(key+'T12:00:00');
 openModal(d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}),`
   <div class="mini" style="margin-bottom:10px">${sessions.length} workout${sessions.length===1?'':'s'} logged</div>
   ${sessions.map(s=>`<div class="card" style="margin-bottom:9px">
     <div class="row"><div><div class="exercise-name">${esc(s.routineName)}</div><div class="mini">${s.programPhase==='deload'?'☾ DELOAD · ':''}${new Date(s.date).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})} · ${sessionSetCount(s)} working sets${s.durationMinutes!=null?` · ${s.durationMinutes} min`:''}</div></div>${sessionPRCount(s)?`<span class="tag pr-tag">PR · ${sessionPRCount(s)}</span>`:''}</div>
     <div class="mini" style="margin-top:8px">${s.exercises.filter(e=>progressionSets(e).length).map(e=>esc(exById(e.exerciseId)?.name||'Exercise')).join(' · ')}</div>
     <div class="actions"><button class="btn small" onclick="closeModal();openHistoricalWorkoutRecap('${s.id}')">View Recap</button><button class="btn small secondary" onclick="closeModal();go('history')">Open History</button></div>
   </div>`).join('')}
 `);
}
function lifetimeExerciseRecords(){
 const ids=[...new Set(state.sessions.flatMap(s=>(s.exercises||[]).flatMap(e=>progressionSets(e).length?[e.exerciseId]:[])))];
 return ids.map(id=>{
   const ex=exById(id),history=exerciseHistory(id);
   const rows=[];
   history.forEach(h=>h.sets.forEach(set=>rows.push({set,date:h.date,routineName:h.routineName})));
   if(!rows.length)return null;
   const type=exerciseLoadType(id,history.at(-1)||null),measurement=exerciseMeasurementType(id,history.at(-1)||null);
   const bestMetric=measurement==='reps'?0:Math.max(0,...rows.map(x=>exerciseMetricValue(x.set,measurement)));
   const byLoad=[...rows].sort((a,b)=>(Number(b.set.weight)||0)-(Number(a.set.weight)||0)||(Number(b.set.reps)||0)-(Number(a.set.reps)||0))[0];
   const byAssistance=type==='assistance'?[...rows].sort((a,b)=>(Number(a.set.weight)||0)-(Number(b.set.weight)||0)||(Number(b.set.reps)||0)-(Number(a.set.reps)||0))[0]:null;
   const byE1=[...rows].sort((a,b)=>estimated1RM(b.set.weight,b.set.reps)-estimated1RM(a.set.weight,a.set.reps))[0];
   const byReps=[...rows].sort((a,b)=>(Number(b.set.reps)||0)-(Number(a.set.reps)||0))[0];
   const prs=rows.filter(x=>x.set.pr);
   return {
     id,ex,history,type,measurement,bestMetric,
     bestAssistance:byAssistance?(Number(byAssistance.set.weight)||0):null,
     bestAssistanceReps:byAssistance?(Number(byAssistance.set.reps)||0):0,
     bestWeight:type==='external'?(Number(byLoad?.set.weight)||0):0,
     bestWeightReps:Number(byLoad?.set.reps)||0,
     bestReps:Number(byReps?.set.reps)||0,
     bestE1:measurement==='reps'&&type==='external'&&byE1?estimated1RM(byE1.set.weight,byE1.set.reps):0,
     sessions:history.length,
     lastDate:history.at(-1)?.date||'',
     lastPRDate:prs.at(-1)?.date||''
   };
 }).filter(Boolean);
}
function recordPrimaryText(r){
 if(r.measurement==='duration')return compactMetricNumber(r.bestMetric)+' sec';
 if(r.measurement==='distance')return compactMetricNumber(distanceFromMeters(r.bestMetric))+' '+distanceUnitLabel();
 if(r.type==='assistance')return (r.bestAssistance??0)+' '+state.profile.unit+' assist × '+r.bestAssistanceReps;
 if(r.type==='bodyweight')return r.bestReps+' reps';
 return r.bestWeight>0?r.bestWeight+' '+state.profile.unit+' × '+r.bestWeightReps:r.bestReps+' reps';
}
function recordSecondaryText(r){
 if(r.measurement==='duration'||r.measurement==='distance')return r.sessions+' tracked sessions';
 if(r.type==='assistance')return 'Less assistance is harder · '+r.sessions+' sessions';
 if(r.type==='bodyweight')return 'Repetition record · '+r.sessions+' sessions';
 return r.bestE1>0?r.bestE1.toFixed(0)+' '+state.profile.unit+' est. 1RM':r.sessions+' logged sessions';
}
function recentPREvents(limit=8){
 const events=[];
 state.sessions.forEach(s=>(s.exercises||[]).forEach(e=>{
   const seen=new Set();
   progressionSets(e).forEach(set=>{
     if(!set.pr||seen.has(set.pr))return;
     seen.add(set.pr);
     events.push({date:s.date,sessionId:s.id,exerciseId:e.exerciseId,exercise:exById(e.exerciseId),label:set.pr,weight:Number(set.weight)||0,reps:Number(set.reps)||0});
   });
 }));
 return events.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,limit);
}
function sessionsBetween(start,end,sessions=state.sessions){
 return sessions.filter(s=>{
   const d=new Date(s.date);
   return Number.isFinite(d.getTime())&&d>=start&&d<end;
 });
}
function muscleCoverageSummary(sessions){
 const byMuscle={};
 (sessions||[]).forEach(session=>{
   const scores=sessionMuscleScores(session),day=localDateKey(session.date);
   Object.entries(scores).forEach(([muscle,setEq])=>{
     if(!(setEq>0))return;
     const row=byMuscle[muscle]||(byMuscle[muscle]={muscle,name:MUSCLE_REGION_LABELS[muscle]||muscle,setEq:0,sessions:0,days:new Set(),lastDate:''});
     row.setEq+=setEq;row.sessions++;if(day)row.days.add(day);
     if(!row.lastDate||String(session.date)>row.lastDate)row.lastDate=String(session.date);
   });
 });
 return Object.values(byMuscle).map(row=>({...row,days:row.days.size}))
   .sort((a,b)=>b.setEq-a.setEq||b.sessions-a.sessions||a.name.localeCompare(b.name));
}
function muscleCoveragePeriods(reference=new Date()){
 const ref=new Date(reference),weekStart=startOfWeek(ref),weekEnd=new Date(weekStart);weekEnd.setDate(weekEnd.getDate()+7);
 const monthStart=new Date(ref.getFullYear(),ref.getMonth(),1);monthStart.setHours(0,0,0,0);
 const monthEnd=new Date(ref.getFullYear(),ref.getMonth()+1,1);monthEnd.setHours(0,0,0,0);
 const weekSessions=sessionsBetween(weekStart,weekEnd),monthSessions=sessionsBetween(monthStart,monthEnd);
 return {
   week:{start:weekStart,end:weekEnd,sessions:weekSessions,rows:muscleCoverageSummary(weekSessions)},
   month:{start:monthStart,end:monthEnd,sessions:monthSessions,rows:muscleCoverageSummary(monthSessions)}
 };
}
function muscleFrequencyWeeks(weeks=8,reference=new Date(),sessions=state.sessions){
 const count=Math.max(1,Math.round(Number(weeks)||8)),current=startOfWeek(reference),periods=[];
 for(let i=count-1;i>=0;i--){
   const start=new Date(current);start.setDate(start.getDate()-i*7);
   const end=new Date(start);end.setDate(end.getDate()+7);
   const weekSessions=sessionsBetween(start,end,sessions);
   const hits={};
   weekSessions.forEach(session=>{
     Object.entries(sessionMuscleScores(session)).forEach(([muscle,score])=>{
       if(score>0)hits[muscle]=(hits[muscle]||0)+1;
     });
   });
   periods.push({start,end,label:`${start.getMonth()+1}/${start.getDate()}`,hits});
 }
 const muscles=[...new Set(periods.flatMap(p=>Object.keys(p.hits)))];
 const rows=muscles.map(muscle=>({
   muscle,name:MUSCLE_REGION_LABELS[muscle]||muscle,
   counts:periods.map(p=>p.hits[muscle]||0),
   total:periods.reduce((n,p)=>n+(p.hits[muscle]||0),0)
 })).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name));
 return {periods,rows};
}
function frequencyCellLevel(count){return count>=3?3:count===2?2:count===1?1:0}
function coveragePeriodHtml(period,title){
 const rows=period.rows,max=Math.max(1,...rows.map(r=>r.setEq));
 const sessionCount=period.sessions.length,days=new Set(period.sessions.map(s=>localDateKey(s.date)).filter(Boolean)).size;
 return `<div class="coverage-card">
   <div class="coverage-card-head"><div><div class="coverage-card-title">${esc(title)}</div><div class="mini">${sessionCount} workout${sessionCount===1?'':'s'} · ${days} training day${days===1?'':'s'}</div></div><div class="coverage-card-meta">${rows.length} muscle region${rows.length===1?'':'s'}</div></div>
   ${rows.length?`<div class="coverage-list">${rows.slice(0,12).map(row=>`<div class="coverage-row">
     <div class="coverage-name">${esc(row.name)}</div>
     <div class="coverage-track"><div class="coverage-fill" style="width:${Math.max(5,Math.round(row.setEq/max*100))}%"></div></div>
     <div class="coverage-values"><b>${row.sessions}×</b> · ${row.setEq%1?row.setEq.toFixed(1):row.setEq} eq</div>
   </div>`).join('')}</div>`:'<div class="empty">No completed working sets in this period yet.</div>'}
 </div>`;
}
function muscleFrequencyHtml(data){
 if(!data.rows.length)return '<div class="empty">Complete workouts across multiple weeks to build training-frequency history.</div>';
 return `<div class="frequency-card">
   <div class="frequency-head"><span>Muscle</span>${data.periods.map(p=>`<span>${esc(p.label)}</span>`).join('')}</div>
   ${data.rows.slice(0,14).map(row=>`<div class="frequency-row"><div class="frequency-name">${esc(row.name)}</div>${row.counts.map(count=>`<div class="frequency-cell freq-${frequencyCellLevel(count)}" title="${count} session${count===1?'':'s'}">${count||''}</div>`).join('')}</div>`).join('')}
   <div class="frequency-legend"><span>Cells = completed sessions involving that muscle during each week.</span><span>1 = light frequency · 2 = moderate · 3+ = high frequency</span></div>
 </div>`;
}
function muscleWorkloadComparison(){
 const currentStart=startOfWeek(),currentEnd=new Date(currentStart);currentEnd.setDate(currentEnd.getDate()+7);
 const priorStart=new Date(currentStart);priorStart.setDate(priorStart.getDate()-28);
 const current=muscleCoverageSummary(sessionsBetween(currentStart,currentEnd));
 const prior=muscleCoverageSummary(sessionsBetween(priorStart,currentStart));
 const currentMap=Object.fromEntries(current.map(x=>[x.muscle,x.setEq]));
 const priorMap=Object.fromEntries(prior.map(x=>[x.muscle,x.setEq/4]));
 const muscles=[...new Set([...Object.keys(currentMap),...Object.keys(priorMap)])];
 return muscles.map(muscle=>({muscle,name:MUSCLE_REGION_LABELS[muscle]||muscle,current:currentMap[muscle]||0,average:priorMap[muscle]||0}))
   .sort((a,b)=>Math.max(b.current,b.average)-Math.max(a.current,a.average)||a.name.localeCompare(b.name));
}

function recentStrengthChanges(){
 const ids=[...new Set(state.sessions.flatMap(s=>(s.exercises||[]).map(e=>e.exerciseId)))];
 return ids.map(id=>{
   const m=exerciseMetrics(id);if(m.history.length<2||!m.priorE1)return null;
   const delta=m.latestE1-m.priorE1,pct=(delta/m.priorE1)*100;
   return {id,ex:exById(id),latest:m.latestE1,prior:m.priorE1,delta,pct,date:m.history.at(-1).date};
 }).filter(Boolean).sort((a,b)=>Math.abs(b.pct)-Math.abs(a.pct)||b.date.localeCompare(a.date));
}
function openAllRecords(){
 openModal('Lifetime records',`
   <div class="notice">Records use completed <b>working sets</b>. Warm-ups, drop sets, and failure sets do not set progression records.</div>
   <div class="records-toolbar"><input id="recordsSearch" placeholder="Search exercise..." oninput="renderRecordsModal()"></div>
   <div id="recordsList" class="records-list"></div>
 `);
 renderRecordsModal();
}
function renderRecordsModal(){
 const host=document.getElementById('recordsList');if(!host)return;
 const q=(document.getElementById('recordsSearch')?.value||'').trim().toLowerCase();
 const rows=lifetimeExerciseRecords().filter(r=>!q||(r.ex?.name||'').toLowerCase().includes(q)).sort((a,b)=>(a.ex?.name||'').localeCompare(b.ex?.name||''));
 host.innerHTML=rows.length?rows.map(r=>`<div class="records-row clickable" onclick="openExerciseProgress('${r.id}')">
   <div><div class="exercise-name">${esc(r.ex?.name||'Exercise')}</div><div class="mini">${r.sessions} session${r.sessions===1?'':'s'} · last ${new Date(r.lastDate).toLocaleDateString()}</div></div>
   <div class="records-value"><b>${esc(recordPrimaryText(r))}</b><span>${r.measurement==='duration'?'Best hold':r.measurement==='distance'?'Best distance':r.type==='assistance'?'Least assistance':r.type==='bodyweight'?'Best reps':r.bestWeight>0?'Best load':'Best reps'}</span></div>
   <div class="records-value e1"><b>${r.bestE1>0?r.bestE1.toFixed(0):'—'}</b><span>Est. 1RM</span></div>
 </div>`).join(''):'<div class="empty">No matching records yet.</div>';
}

function svgLine(values,width=600,height=130){
 if(!values.length)return '';
 const pad=14,max=Math.max(...values),min=Math.min(...values),range=Math.max(1,max-min);
 const points=values.map((v,i)=>{
   const x=pad+(width-pad*2)*(values.length===1?.5:i/(values.length-1));
   const y=height-pad-(height-pad*2)*((v-min)/range);
   return {x,y,v};
 });
 const pts=points.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
 const fillPts=`${points[0].x},${height-pad} ${pts} ${points.at(-1).x},${height-pad}`;
 return `<svg class="spark" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="progress chart">
   <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8b5cf6" stop-opacity=".34"/><stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/></linearGradient></defs>
   <line x1="${pad}" y1="${height/2}" x2="${width-pad}" y2="${height/2}" stroke="#253047" stroke-width="1"/>
   <polygon points="${fillPts}" fill="url(#areaFill)"/>
   <polyline points="${pts}" fill="none" stroke="#9b77f7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
   ${points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="5" fill="#ddd6fe" stroke="#6d49bd" stroke-width="2"/>`).join('')}
 </svg><div class="chart-labels"><span>${min.toFixed(0)}</span><span>${max.toFixed(0)}</span></div>`;
}
const FORM_GUIDE_MAP_KEY='swole_cat_form_guide_map_v1';
const REPDB_DATA_URL='https://exercise-dataset.com/exercises.json';
const REPDB_ASSET_BASE='https://exercise-dataset.com/';
let repdbGuideData=null,repdbGuidePromise=null;

function formGuideMap(){
 try{return JSON.parse(localStorage.getItem(FORM_GUIDE_MAP_KEY)||'{}')||{}}catch(e){return {}}
}
function saveFormGuideChoice(exerciseId,guideId){
 const map=formGuideMap();map[exerciseId]=guideId;localStorage.setItem(FORM_GUIDE_MAP_KEY,JSON.stringify(map));
 loadExerciseFormGuide(exerciseId);
}
function guideKey(s){
 return String(s||'').toLowerCase()
  .replace(/push[\s-]?ups?/g,'push up').replace(/pull[\s-]?ups?/g,'pull up').replace(/chin[\s-]?ups?/g,'chin up')
  .replace(/\bflyes\b/g,'fly').replace(/\bflies\b/g,'fly').replace(/\brows\b/g,'row').replace(/\bcurls\b/g,'curl')
  .replace(/\braises\b/g,'raise').replace(/\bextensions\b/g,'extension').replace(/\bpresses\b/g,'press')
  .replace(/\bsquats\b/g,'squat').replace(/\blunges\b/g,'lunge').replace(/\bone arm\b/g,'single arm').replace(/\bone leg\b/g,'single leg')
  .replace(/[^a-z0-9]+/g,' ').trim();
}
function guideTokens(s){return guideKey(s).split(' ').filter(Boolean)}
function guideScore(ex,g){
 const a=new Set(guideTokens(ex.name)),b=new Set(guideTokens(g.name_en));
 let inter=0;for(const x of a)if(b.has(x))inter++;
 const union=new Set([...a,...b]).size||1;
 let score=inter/union;
 const appEq=guideKey(ex.equipment||'');
 const srcEq=guideKey(String(g.equipment||'').replaceAll('_',' '));
 if(appEq&&srcEq&&(srcEq.includes(appEq)||appEq.includes(srcEq)))score+=.12;
 const appMuscle=guideKey(ex.muscle||'');
 const body=guideKey(String(g.body_part||'').replaceAll('_',' '));
 if(appMuscle&&body&&(body.includes(appMuscle)||appMuscle.includes(body)))score+=.08;
 return score;
}
function prettyGuideTerm(s){
 return String(s||'').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
}
async function loadRepdbGuides(){
 if(repdbGuideData)return repdbGuideData;
 if(!repdbGuidePromise){
  repdbGuidePromise=fetch(REPDB_DATA_URL,{cache:'force-cache'})
   .then(r=>{if(!r.ok)throw new Error('Guide source unavailable');return r.json()})
   .then(d=>{repdbGuideData=d.exercises||[];return repdbGuideData})
   .catch(err=>{repdbGuidePromise=null;throw err});
 }
 return repdbGuidePromise;
}
function repdbImageUrl(path){
 if(!path)return '';
 if(/^https?:/i.test(path))return path;
 return REPDB_ASSET_BASE+String(path).replace(/^\/+/, '');
}
function exactRepdbGuide(ex,data){
 const key=guideKey(ex?.name||'');
 return data.find(g=>guideKey(g.name_en)===key)||null;
}
function renderRepdbGuide(exerciseId,g){
 const flat=g.images?.flat||{};
 const images=[['Start',flat.start],['Peak / Finish',flat.peak],['Position',flat.main]].filter(x=>x[1]);
 const prim=(g.primary_muscles||[]).map(prettyGuideTerm);
 const sec=(g.secondary_muscles||[]).map(prettyGuideTerm);
 const steps=g.instructions_en||[];
 const tips=g.tips_en||[];
 return `<div class="form-guide-card">
   <div class="form-guide-head">
    <div><div class="source-badge">↗ Public source · RepDB</div><div class="form-guide-title" style="margin-top:8px">${esc(g.name_en||'Exercise guide')}</div><div class="mini" style="margin-top:4px">${esc(prettyGuideTerm(g.equipment||'Bodyweight'))} · ${esc(prettyGuideTerm(g.difficulty||''))}</div></div>
   </div>
   ${g.description_en?`<div class="lastline">${esc(g.description_en)}</div>`:''}
   ${images.length?`<div class="form-guide-images">${images.map(([label,path])=>`<figure><img loading="lazy" src="${escAttr(repdbImageUrl(path))}" alt="${escAttr((g.name_en||'Exercise')+' '+label+' position')}"><figcaption>${esc(label)}</figcaption></figure>`).join('')}</div>`:''}
   <div class="form-guide-section"><h3>Muscles</h3><div class="form-guide-muscles">
     ${prim.map(x=>`<span class="tag">Primary · ${esc(x)}</span>`).join('')}
     ${sec.slice(0,5).map(x=>`<span class="tag">Secondary · ${esc(x)}</span>`).join('')}
   </div></div>
   ${steps.length?`<div class="form-guide-section"><h3>Source instructions</h3><ol class="form-guide-steps">${steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`:''}
   ${tips.length?`<div class="form-guide-section"><h3>Form cues from source</h3><div class="form-guide-tips">${tips.map(x=>`<div class="form-guide-tip">${esc(x)}</div>`).join('')}</div></div>`:''}
   <div class="form-guide-credit">Technique text and illustrations are loaded directly from RepDB's public exercise dataset, not generated by Swole Cat. <a href="https://repdb.co" target="_blank" rel="noopener">Exercise data by RepDB</a>. Form references are general education, and equipment setup or individual anatomy can change how a movement should be performed.</div>
   <div class="actions"><button class="btn small secondary" onclick="showFormGuidePicker('${exerciseId}')">Choose a different public reference</button></div>
  </div>`;
}
async function loadExerciseFormGuide(exerciseId){
 const host=document.getElementById('exerciseFormGuide');if(!host)return;
 const ex=exById(exerciseId);if(!ex)return;
 host.innerHTML='<div class="empty"><strong>Loading public form guide…</strong>Checking the source exercise library.</div>';
 try{
  const data=await loadRepdbGuides();
  if(!document.getElementById('exerciseFormGuide'))return;
  const saved=formGuideMap()[exerciseId];
  const chosen=saved?data.find(g=>g.id===saved):null;
  const exact=chosen||exactRepdbGuide(ex,data);
  if(exact){host.innerHTML=renderRepdbGuide(exerciseId,exact);return}
  showFormGuidePicker(exerciseId);
 }catch(err){
  host.innerHTML=`<div class="form-guide-card"><div class="source-badge">Public source</div><div class="form-guide-title" style="margin-top:8px">Form guide needs a connection</div><div class="lastline">Swole Cat does not invent exercise instructions when the public source is unavailable. Connect to the internet and try again.</div><div class="actions"><a class="btn small secondary" href="https://exercise-dataset.com/" target="_blank" rel="noopener">Open public exercise library</a></div></div>`;
 }
}
async function showFormGuidePicker(exerciseId){
 const host=document.getElementById('exerciseFormGuide');if(!host)return;
 const ex=exById(exerciseId);if(!ex)return;
 try{
  const data=await loadRepdbGuides();
  host.innerHTML=`<div class="form-guide-card">
   <div class="source-badge">Public source matching</div>
   <div class="form-guide-title" style="margin-top:8px">Choose the exact variation</div>
   <div class="lastline">There isn't an automatic exact-name match, or you asked to change it. Swole Cat will not guess and attach a different movement. Search RepDB's public library and choose the reference that matches the exercise you mean.</div>
   <div class="field" style="margin-top:12px"><label>Search public form guides</label><input id="guideSearchInput" value="${escAttr(ex.name)}" oninput="renderFormGuidePickerResults('${exerciseId}')"></div>
   <div id="guidePickerResults" class="guide-picker"></div>
   <div class="form-guide-credit"><a href="https://exercise-dataset.com/" target="_blank" rel="noopener">Browse RepDB's public exercise library</a> · <a href="https://repdb.co" target="_blank" rel="noopener">Exercise data by RepDB</a></div>
  </div>`;
  renderFormGuidePickerResults(exerciseId);
 }catch(err){loadExerciseFormGuide(exerciseId)}
}
function renderFormGuidePickerResults(exerciseId){
 const host=document.getElementById('guidePickerResults');if(!host||!repdbGuideData)return;
 const ex=exById(exerciseId),q=(document.getElementById('guideSearchInput')?.value||'').trim();
 const qKey=guideKey(q);
 let rows=repdbGuideData.map(g=>({g,score:q?guideScore({...ex,name:q},g):guideScore(ex,g)}));
 if(qKey)rows=rows.filter(x=>guideKey(x.g.name_en).includes(qKey)||x.score>.18);
 rows.sort((a,b)=>b.score-a.score);
 const top=rows.slice(0,8);
 host.innerHTML=top.length?top.map(({g})=>`<button class="guide-choice" onclick="saveFormGuideChoice('${exerciseId}','${escAttr(g.id)}')"><div class="grow"><b>${esc(g.name_en)}</b><div class="mini">${esc(prettyGuideTerm(g.body_part||''))} · ${esc(prettyGuideTerm(g.equipment||'Bodyweight'))} · ${esc(prettyGuideTerm(g.difficulty||''))}</div></div><span class="tag">Use guide</span></button>`).join(''):'<div class="empty">No public-source matches found for that search. Try a simpler exercise name.</div>';
}

function openExerciseProgress(exerciseId){
 const ex=exById(exerciseId),m=exerciseMetrics(exerciseId),h=m.history,pref=exercisePreference(exerciseId);
 const type=exerciseLoadType(exerciseId,h.at(-1)||null),recent=h.slice(-12);
 const e1s=recent.map(x=>Math.max(...x.sets.map(s=>estimated1RM(s.weight,s.reps))));
 const bestReps=recent.map(x=>Math.max(...x.sets.map(s=>Number(s.reps)||0)));
 const firstAssistance=recent.length?Math.min(...recent[0].sets.map(s=>Number(s.weight)||0)):0;
 const assistanceReductions=recent.map(x=>firstAssistance-Math.min(...x.sets.map(s=>Number(s.weight)||0)));
 const trend=m.trend==='up'?'<span class="trend-up">↑ Trending up</span>':m.trend==='down'?'<span class="trend-down">↓ Recent dip</span>':'<span class="trend-flat">→ Holding steady</span>';
 const progressHtml=!h.length
  ?'<div class="empty"><strong>No workout history yet</strong>Log this exercise in a workout and its progress will appear here.</div>'
  :type==='assistance'?`<div class="notice">Assistance is a counterweight. <b>Less assistance means a harder movement.</b> Estimated 1RM and conventional external-load volume are not applicable.</div>
    <div class="metric-row"><div class="metric-mini"><b>${m.bestAssistance??0} ${state.profile.unit}</b><span>Least assistance</span></div><div class="metric-mini"><b>${m.bestReps}</b><span>Most reps</span></div><div class="metric-mini"><b>${h.length}</b><span>Sessions</span></div></div>
    <div class="chart-card"><div class="row"><b>Reduction in assistance</b><span class="mini">Last ${recent.length}</span></div>${svgLine(assistanceReductions)}</div>
    <div class="picker-section">Recent sessions</div><div class="card">${h.slice().reverse().slice(0,8).map(x=>`<div class="list-item"><div class="grow"><b>${new Date(x.date).toLocaleDateString()}</b><div class="mini">${x.sets.map(s=>`${s.weight} ${state.profile.unit} assist × ${s.reps}`).join(' · ')}</div></div></div>`).join('')}</div>`
  :type==='bodyweight'?`<div class="notice">Repetitions track progress in this unweighted movement. To add external resistance, use a weighted variant or configure a different load type in the routine.</div>
    <div class="metric-row"><div class="metric-mini"><b>${m.bestReps}</b><span>Best reps</span></div><div class="metric-mini"><b>${h.length}</b><span>Sessions</span></div></div>
    <div class="chart-card"><div class="row"><b>Best reps per session</b><span class="mini">Last ${recent.length}</span></div>${svgLine(bestReps)}</div>
    <div class="picker-section">Recent sessions</div><div class="card">${h.slice().reverse().slice(0,8).map(x=>`<div class="list-item"><b>${new Date(x.date).toLocaleDateString()}</b><span class="mini">${x.sets.map(s=>s.reps+' reps').join(' · ')}</span></div>`).join('')}</div>`
  :`<div style="margin-top:8px;font-weight:850">${trend}</div>
   <div class="metric-row">
     <div class="metric-mini"><b>${m.bestWeight} ${state.profile.unit}</b><span>Best load</span></div>
     <div class="metric-mini"><b>${m.bestE1.toFixed(0)} ${state.profile.unit}</b><span>Est. 1RM</span></div>
     <div class="metric-mini"><b>${h.length}</b><span>Sessions</span></div>
   </div>
   <div class="chart-card"><div class="row"><b>Estimated strength</b><span class="mini">Last ${recent.length}</span></div>${svgLine(e1s)}</div>
   <div class="picker-section">Recent sessions</div>
   <div class="card">${h.slice().reverse().slice(0,8).map(x=>`<div class="list-item"><div class="grow"><b>${new Date(x.date).toLocaleDateString()}</b><div class="mini">${x.sets.map(s=>`${s.weight}×${s.reps}`).join(' · ')}</div></div><span class="tag">${Math.max(...x.sets.map(s=>estimated1RM(s.weight,s.reps))).toFixed(0)} e1RM</span></div>`).join('')}</div>`;
 openModal(`${esc(ex?.name||'Exercise')} details`,`
 <div class="row"><div><div class="exercise-name">${esc(ex?.name||'Exercise')} ${preferenceBadgeHtml(exerciseId)}</div><div class="mini" style="margin-top:4px">${esc(ex?.muscle||'')} · ${esc(ex?.equipment||'')} · ${esc(patternLabel(ex?.pattern||''))}</div></div><button id="exerciseDetailFavorite" data-exercise-id="${exerciseId}" class="favbtn ${isFavorite(exerciseId)?'on':''}" onclick="toggleFavorite('${exerciseId}')" title="Favorite">${isFavorite(exerciseId)?'★':'☆'}</button></div>
 <div class="picker-section">Your preference</div>
 <div class="card">
   <div class="preference-row">
     <button class="preference-btn ${pref==='neutral'?'on':''}" onclick="setExercisePreference('${exerciseId}','neutral',true)">Neutral</button>
     <button class="preference-btn prefer ${pref==='prefer'?'on':''}" onclick="setExercisePreference('${exerciseId}','prefer',true)">↑ Prefer</button>
     <button class="preference-btn avoid ${pref==='avoid'?'on':''}" onclick="setExercisePreference('${exerciseId}','avoid',true)">↓ Avoid</button>
     <button class="preference-btn hide ${pref==='hide'?'on':''}" onclick="setExercisePreference('${exerciseId}','hide',true)">Hide</button>
   </div>
   <div class="preference-help"><b>Favorite</b> is a quick pin. <b>Prefer</b> pushes this exercise higher in pickers and substitutions. <b>Avoid</b> pushes it lower without removing it. <b>Hide</b> removes it from normal browsing and substitution suggestions, but never deletes it from routines, workout history, or progress.</div>
 </div>
 <div class="picker-section">Your progress</div>
 ${progressHtml}
 <div class="picker-section">Form guide</div>
 <div id="exerciseFormGuide"><div class="empty"><strong>Loading public form guide…</strong>Checking the source exercise library.</div></div>
 `);
 loadExerciseFormGuide(exerciseId);
}
function progressVolumeTrend30(now=Date.now()){
 const day=86400000;
 const current=state.sessions.filter(s=>{const age=now-new Date(s.date).getTime();return age>=0&&age<=30*day});
 const prior=state.sessions.filter(s=>{const age=now-new Date(s.date).getTime();return age>30*day&&age<=60*day});
 const currentVolume=current.reduce((n,s)=>n+sessionVolume(s),0);
 const priorVolume=prior.reduce((n,s)=>n+sessionVolume(s),0);
 const pct=priorVolume>0?((currentVolume-priorVolume)/priorVolume*100):null;
 return {currentVolume,priorVolume,pct};
}
function openProgressMethodology(topic='overview'){
 const blocks={
   workload:`<div class="notice"><b>Muscle workload</b><br><br>Top bars show audited muscle set-equivalents this week. Bottom bars show the average per week across the previous four full weeks. A completed working set contributes 1.0 to primary muscles and 0.5 to secondary muscles. This is training-volume context, not a recovery or soreness score.</div>`,
   strength:`<div class="notice"><b>Strength changes</b><br><br>Recent strength uses estimated 1RM from your latest logged exposure versus the previous one for the same exercise. Small changes can reflect reps, load, fatigue, or logging differences, so Swole Cat treats this as a trend rather than a diagnosis.</div>`,
   coverage:`<div class="notice"><b>Muscle coverage</b><br><br>Coverage is derived from completed working sets and the app's audited primary/secondary muscle map. It shows what your training has involved, not measured muscle activation, soreness, recovery, or growth.</div>`,
   overview:`<div class="notice"><b>Progress analytics</b><br><br>Swole Cat summarizes your completed local workout history. PRs, volume, consistency, estimated strength, muscle coverage, and workload are signals to help you understand training patterns. No single metric is intended to be maximized in isolation.</div>`
 };
 openModal('How Progress Works',blocks[topic]||blocks.overview);
}
function renderAnalytics(){
 const host=document.getElementById('analyticsArea');if(!host)return;
 const now=Date.now(),last30=state.sessions.filter(s=>now-new Date(s.date).getTime()<=30*86400000);
 const weekStart=startOfWeek(),thisWeek=state.sessions.filter(s=>new Date(s.date)>=weekStart);
 const prs30=last30.reduce((a,s)=>a+sessionPRCount(s),0);
 const trainingDays30=new Set(last30.map(s=>localDateKey(s.date))).size;
 const weeks=lastEightWeeks(),maxWeek=Math.max(1,...weeks.map(x=>x.workouts));
 const activeWeeks=weeks.filter(x=>x.workouts>0).length;
 const avgWorkouts=(weeks.reduce((a,x)=>a+x.workouts,0)/Math.max(1,weeks.length));
 const volumeTrend=progressVolumeTrend30(now);
 const recentDeloadCount=last30.filter(s=>s.programPhase==='deload').length;
 const volumeTrendText=volumeTrend.pct==null?'—':`${volumeTrend.pct>0?'+':''}${Math.round(volumeTrend.pct)}%`;
 const volumeTrendClass=volumeTrend.pct==null||recentDeloadCount&&volumeTrend.pct<-2?'trend-flat':volumeTrend.pct>2?'trend-up':volumeTrend.pct<-2?'trend-down':'trend-flat';
 const workloads=muscleWorkloadComparison(),maxWorkload=Math.max(1,...workloads.flatMap(x=>[x.current,x.average]));
 const coveragePeriods=muscleCoveragePeriods(),frequency=muscleFrequencyWeeks(8);
 const records=lifetimeExerciseRecords();
 const recordCards=[...records].sort((a,b)=>(b.lastPRDate||b.lastDate).localeCompare(a.lastPRDate||a.lastDate)).slice(0,6);
 const prEvents=recentPREvents(6);
 const changes=recentStrengthChanges().slice(0,8);
 const used=[...new Set(state.sessions.flatMap(s=>s.exercises.filter(e=>progressionSets(e).length).map(e=>e.exerciseId)))];
 const recentExercises=used.map(id=>({id,ex:exById(id),...exerciseMetrics(id)})).filter(x=>x.history.length).sort((a,b)=>b.history.at(-1).date.localeCompare(a.history.at(-1).date)).slice(0,8);
 const coachInsights=used.map(id=>{
   const r=state.routines.flatMap(x=>x.exercises).find(e=>e.exerciseId===id)||{trainingGoal:'general',resetPercent:7.5,increment:state.settings.defaultIncrement,minReps:state.settings.defaultMin,maxReps:state.settings.defaultMax,sets:state.settings.defaultSets};
   return {id,ex:exById(id),signal:coachSignal(id,r)};
 }).filter(x=>x.signal.stalled||x.signal.level==='good').slice(0,8);

 host.innerHTML=`
 <div class="progress-hero telemetry-hero progress-snapshot-hero">
   <div class="progress-snapshot-head">
     <div>
       <div class="eyebrow">YOUR TRAINING SIGNAL</div>
       <div class="exercise-name progress-snapshot-title">Progress at a glance</div>
       <div class="mini progress-snapshot-copy">Results first. Deeper training analytics are below when you want them.</div>
     </div>
     <button class="progress-help-btn" onclick="openProgressMethodology('overview')" aria-label="How Progress works">?</button>
   </div>
   <div class="progress-snapshot-grid">
     <div class="progress-snapshot-metric"><span>THIS WEEK</span><b>${thisWeek.length}</b><small>workout${thisWeek.length===1?'':'s'}</small></div>
     <div class="progress-snapshot-metric"><span>PRs · 30D</span><b>${prs30}</b><small>exercise PR${prs30===1?'':'s'}</small></div>
     <div class="progress-snapshot-metric"><span>CONSISTENCY</span><b>${activeWeeks}/8</b><small>active weeks · ${avgWorkouts.toFixed(1)}/wk</small></div>
     <div class="progress-snapshot-metric"><span>VOLUME · 30D</span><b class="${volumeTrendClass}">${volumeTrendText}</b><small>${volumeTrend.pct==null?'build more history':'vs prior 30 days'}${recentDeloadCount?' · includes deload':''}</small></div>
   </div>
 </div>
 ${recentDeloadCount?'<div class="workout-deload-note"><b>☾ Planned deload sessions in the last 30 days</b><span>Lower set counts or volume during a planned deload are intentional, not proof of lost strength. These sessions remain in your workout counts and volume totals; estimated strength changes and future progression exclude them.</span></div>':''}

 <div class="progress-primary-section">
   <div class="section-title"><h2>8-week consistency</h2><span class="mini">${weeks.reduce((a,x)=>a+x.workouts,0)} workouts</span></div>
   <div class="chart-card progress-primary-chart">
     <div class="weekbars">${weeks.map(w=>`<div class="weekcol"><div class="weekbar" style="height:${Math.max(3,w.workouts/maxWeek*92)}px" title="${w.workouts} workouts · ${w.sets} working sets"></div><div class="weeklabel">${w.label}</div></div>`).join('')}</div>
   </div>
 </div>

 <div class="section-title progress-section-title"><h2>Recent strength changes</h2><button class="progress-inline-help" onclick="openProgressMethodology('strength')">How it works</button></div>
 <div class="chart-card">
   ${changes.length?`<div class="progress-change-list">${changes.map(x=>`<div class="progress-change clickable" onclick="openExerciseProgress('${x.id}')">
     <div><div class="exercise-name">${esc(x.ex?.name||'Exercise')}</div><div class="mini">${x.prior.toFixed(0)} → ${x.latest.toFixed(0)} ${state.profile.unit} est. 1RM · ${new Date(x.date).toLocaleDateString()}</div></div>
     <div class="progress-change-value ${x.delta>0?'trend-up':x.delta<0?'trend-down':'trend-flat'}">${x.delta>0?'+':''}${x.pct.toFixed(1)}%</div>
   </div>`).join('')}</div>`:'<div class="empty">Log an exercise at least twice to compare recent strength.</div>'}
 </div>

 <div class="section-title progress-section-title"><h2>Recent PRs</h2><span class="mini">Newest first</span></div>
 <div class="chart-card">
   ${prEvents.length?`<div class="pr-feed">${prEvents.map(p=>`<div class="pr-feed-row clickable" onclick="openExerciseProgress('${p.exerciseId}')">
     <div class="pr-icon" aria-label="Personal record"><span class="pr-glyph">PR</span></div>
     <div><div class="exercise-name">${esc(p.exercise?.name||'Exercise')}</div><div class="mini">${esc(p.label)} · ${p.weight} ${state.profile.unit} × ${p.reps}</div></div>
     <div class="mini">${new Date(p.date).toLocaleDateString()}</div>
   </div>`).join('')}</div>`:'<div class="empty">PRs will show here after an exercise has an established baseline to beat.</div>'}
 </div>

 <div class="progress-secondary-divider"><span>TRAINING DETAIL</span></div>

 <div class="section-title progress-section-title"><h2>Training calendar</h2><span class="mini">Tap a training day</span></div>
 ${progressCalendarHtml()}

 <div class="section-title progress-section-title"><h2>Lifetime records</h2><button class="btn small secondary" onclick="openAllRecords()">View All</button></div>
 ${recordCards.length?`<div class="record-grid">${recordCards.map(r=>`<div class="record-card" onclick="openExerciseProgress('${r.id}')">
   <div class="record-name">${esc(r.ex?.name||'Exercise')}</div>
   <div class="record-big">${esc(recordPrimaryText(r))}</div>
   <div class="record-meta">${esc(recordSecondaryText(r))}<br>${r.sessions} logged session${r.sessions===1?'':'s'}</div>
 </div>`).join('')}</div>`:'<div class="empty">Complete working sets to build your record book.</div>'}

 <div class="section-title progress-section-title"><h2>Muscle coverage</h2><button class="progress-inline-help" onclick="openProgressMethodology('coverage')">How it works</button></div>
 <div class="coverage-period-grid">
   ${coveragePeriodHtml(coveragePeriods.week,'This week')}
   ${coveragePeriodHtml(coveragePeriods.month,'This month to date')}
 </div>

 <div class="section-title progress-section-title"><h2>Muscle workload</h2><button class="progress-inline-help" onclick="openProgressMethodology('workload')">How it works</button></div>
 <div class="chart-card">
   ${workloads.length?`<div class="workload-grid">${workloads.map(x=>`<div class="workload-row">
     <span>${esc(x.name)}</span>
     <div class="workload-bars">
       <div class="workload-track" title="This week"><div class="workload-current" style="width:${Math.round(x.current/maxWorkload*100)}%"></div></div>
       <div class="workload-track" title="Prior 4-week average"><div class="workload-average" style="width:${Math.round(x.average/maxWorkload*100)}%"></div></div>
     </div>
     <div class="workload-values"><b>${x.current}</b> now<br>${x.average.toFixed(1)} avg</div>
   </div>`).join('')}</div>`:'<div class="empty">Complete working sets to populate muscle workload.</div>'}
 </div>

 <div class="section-title progress-section-title"><h2>Training frequency</h2><span class="mini">Sessions involving each muscle · last 8 weeks</span></div>
 ${muscleFrequencyHtml(frequency)}

 <div class="section-title progress-section-title"><h2>Coach insights</h2></div>
 <div class="chart-card">${coachInsights.length?`<div class="insight-list">${coachInsights.map(x=>`<div class="coachbox ${x.signal.level==='info'?'':x.signal.level}" style="margin:0"><div class="row"><div><div class="coach-title">${esc(x.ex?.name||'Exercise')}</div><div class="coach-text">${esc(x.signal.text)}</div></div><span class="${x.signal.level==='good'?'trend-up':x.signal.level==='reset'?'trend-down':'trend-flat'}">${x.signal.level==='good'?'↑':x.signal.level==='reset'?'!':'→'}</span></div></div>`).join('')}</div>`:'<div class="empty">No notable progression patterns yet. Keep logging consistent sessions.</div>'}</div>

 <div class="section-title progress-section-title"><h2>Recently trained exercises</h2></div>
 <div class="grid">${recentExercises.length?recentExercises.map(x=>`<div class="card clickable" onclick="openExerciseProgress('${x.id}')"><div class="row"><div><div class="exercise-name">${esc(x.ex?.name||'Exercise')}</div><div class="mini">${x.history.length} logged sessions · best load ${x.bestWeight} ${state.profile.unit}</div></div><span class="${x.trend==='up'?'trend-up':x.trend==='down'?'trend-down':'trend-flat'}">${x.trend==='up'?'↑':x.trend==='down'?'↓':'→'} ${x.latestE1.toFixed(0)}</span></div></div>`).join(''):'<div class="empty">Once you log repeated exercises, your strength trends will live here.</div>'}</div>

 <div class="section-title progress-section-title"><h2>Bodyweight <span class="mini">(optional)</span></h2><button class="btn small secondary" onclick="logBodyweight()">+ Log</button></div>
 <div class="chart-card">${(state.bodyweight||[]).length?`${svgLine(state.bodyweight.slice(-20).map(x=>Number(x.value)))}<div class="row"><span class="mini">Latest</span><b>${state.bodyweight.at(-1).value} ${state.profile.unit}</b></div>`:'<div class="empty">Optional bodyweight tracking lives only on this device.</div>'}</div>`;
}
function logBodyweight(){
 openModal('Log bodyweight',`<div class="field"><label>Bodyweight (${state.profile.unit})</label><input id="bwValue" type="number" step=".1" placeholder="150"></div><button class="btn" onclick="saveBodyweight()">Save</button>`);
}
function saveBodyweight(){
 const v=Number(document.getElementById('bwValue').value);if(!v)return;
 state.bodyweight=state.bodyweight||[];state.bodyweight.push({date:new Date().toISOString(),value:v});save();closeModal();renderAnalytics();
}
