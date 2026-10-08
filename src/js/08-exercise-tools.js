function newExercise(){editExercise(null)}
function editExercise(id){
 const ex=id?state.customExercises.find(x=>x.id===id):{id:uid(),name:'',muscle:'Other',equipment:'machine',pattern:'other'};
 openModal(id?'Edit custom exercise':'Create custom exercise',`
 <div class="field"><label>Exercise name</label><input id="exName" value="${escAttr(ex.name)}" placeholder="My weird cable thing"></div>
 <div class="form-grid">
  <div><label>Muscle group</label><input id="exMuscle" value="${escAttr(ex.muscle)}"></div>
  <div><label>Equipment</label><select id="exEquip">${['barbell','dumbbell','machine','cable','bodyweight','smith machine','kettlebell','landmine','trap bar','sled'].map(v=>`<option ${ex.equipment===v?'selected':''}>${v}</option>`).join('')}</select></div>
 </div>
 <div class="field"><label>Movement pattern (helps substitutions)</label><select id="exPattern">${['horizontal_press','incline_press','vertical_press','chest_fly','horizontal_pull','vertical_pull','shoulder_extension','squat','lunge','hinge','knee_extension','knee_flexion','hip_extension','hip_abduction','hip_adduction','lateral_raise','rear_delt','elbow_flexion','elbow_extension','calf_raise','spinal_flexion','anti_extension','anti_rotation','rotation','shrug','carry','grip','other'].map(v=>`<option value="${v}" ${(ex.pattern||'other')===v?'selected':''}>${patternLabel(v)}</option>`).join('')}</select></div>
 <div class="actions"><button class="btn" onclick="saveCustomExercise('${ex.id}',${id?'true':'false'})">Save exercise</button>${id?`<button class="btn danger" onclick="deleteCustomExercise('${ex.id}')">Delete</button>`:''}</div>`);
}
function saveCustomExercise(id,editing){
 const name=document.getElementById('exName').value.trim(); if(!name)return alert('Give the exercise a name.');
 const obj={id,name,muscle:document.getElementById('exMuscle').value.trim()||'Other',equipment:document.getElementById('exEquip').value,pattern:document.getElementById('exPattern').value,custom:true};
 const resolved=exerciseMuscleMetadata(obj);
 obj.primaryMuscles=resolved.primary;obj.secondaryMuscles=resolved.secondary;obj.movementFamily=resolved.movementFamily;
 if(editing)state.customExercises=state.customExercises.map(x=>x.id===id?obj:x); else state.customExercises=[...state.customExercises,obj];
 save();closeModal();renderExercises();
}
function deleteCustomExercise(id){
 state.customExercises=state.customExercises.filter(x=>x.id!==id);
 state.routines.forEach(r=>r.exercises=r.exercises.filter(x=>x.exerciseId!==id));
 save();closeModal();renderExercises();renderRoutines();
}


function subScore(current,candidate){
 if(!current||!candidate||current.id===candidate.id||isHiddenExercise(candidate.id))return -999;
 let score=0;
 if(current.pattern && candidate.pattern===current.pattern)score+=60;
 if(current.muscle===candidate.muscle)score+=35;
 if(current.equipment===candidate.equipment)score+=8;
 // close families that commonly substitute reasonably when the exact pattern is unavailable
 const families={horizontal_press:['incline_press','dip_press'],incline_press:['horizontal_press','vertical_press'],horizontal_pull:['vertical_pull'],vertical_pull:['horizontal_pull','shoulder_extension'],squat:['lunge'],lunge:['squat'],hip_extension:['hinge'],hinge:['hip_extension'],rear_delt:['horizontal_pull'],elbow_extension:['dip_press']};
 if((families[current.pattern]||[]).includes(candidate.pattern))score+=14;
 // Personal preference never replaces movement compatibility, but it strongly breaks ties.
 score+=preferenceRank(candidate.id);
 return score;
}
function substitutionReason(current,c){
 const bits=[];
 if(c.pattern===current.pattern)bits.push('same movement pattern');
 if(c.muscle===current.muscle)bits.push('same primary muscle');
 if(c.equipment===current.equipment)bits.push('same equipment');
 if(exercisePreference(c.id)==='prefer')bits.push('you prefer this');
 else if(exercisePreference(c.id)==='avoid')bits.push('you marked avoid');
 if(isFavorite(c.id))bits.push('favorite');
 return bits.length?bits.join(' · '):`${c.muscle} alternative`;
}
function recommendedSubs(exerciseId,query=''){
 const cur=exById(exerciseId); if(!cur)return [];
 let arr=visibleExercises().filter(x=>x.id!==exerciseId);
 if(query){const q=query.toLowerCase();arr=arr.filter(x=>x.name.toLowerCase().includes(q)||x.muscle.toLowerCase().includes(q)||patternLabel(x.pattern).toLowerCase().includes(q));}
 return arr.map(x=>({x,score:subScore(cur,x)})).filter(row=>row.score>-900).sort((a,b)=>b.score-a.score||a.x.name.localeCompare(b.x.name));
}
function subRowsHtml(currentId,index,query=''){
 const cur=exById(currentId);
 const rows=recommendedSubs(currentId,query).slice(0,query?60:14);
 return rows.map(({x})=>`<div class="picker-result-card">
   <div class="picker-result-main">
     <button class="favbtn ${isFavorite(x.id)?'on':''}" onclick="toggleFavorite('${x.id}');refreshWorkoutSubs(${index})" title="Favorite">${isFavorite(x.id)?'★':'☆'}</button>
     <div class="iconbox">${catExerciseThumbnail(x)}</div>
     <div class="picker-result-copy"><div class="exercise-name">${esc(x.name)} ${preferenceBadgeHtml(x.id)}</div><div class="mini">${esc(x.muscle)} · ${esc(x.equipment)}<br>${esc(substitutionReason(cur,x))}</div></div>
   </div>
   <div class="picker-result-actions">
     <button class="btn small" onclick="swapWorkoutExercise(${index},'${x.id}',false)">Use Today</button>
     <button class="btn small secondary" onclick="swapWorkoutExercise(${index},'${x.id}',true)">Use + Save to Routine</button>
   </div>
 </div>`).join('')||'<div class="empty">No matching visible exercises.</div>';
}
function openWorkoutSubstitute(ei){
 const e=state.activeWorkout?.exercises?.[ei];if(!e)return;const cur=exById(e.exerciseId);
 openModal(`Substitute ${esc(cur?.name||'exercise')}`,`<div class="notice">Recommended swaps prioritize movement and muscle match, then use your Favorite / Prefer / Avoid choices to break ties. Hidden exercises are excluded. <b>Today</b> changes only this session. <b>Routine</b> also replaces the exercise in your saved routine. Progress history stays separate for each exercise.</div><div style="margin:12px 0"><input id="subSearch" placeholder="Search any exercise..." oninput="refreshWorkoutSubs(${ei})"></div><div id="subList" class="picker-result-list">${subRowsHtml(e.exerciseId,ei)}</div>`);
}
function refreshWorkoutSubs(ei){const e=state.activeWorkout.exercises[ei];document.getElementById('subList').innerHTML=subRowsHtml(e.exerciseId,ei,document.getElementById('subSearch').value)}
function swapWorkoutExercise(ei,newId,permanent){
 const e=state.activeWorkout.exercises[ei], old=e.exerciseId;
 if(permanent){const r=state.routines.find(x=>x.id===state.activeWorkout.routineId);if(r&&Number.isInteger(e.routineIndex)&&r.exercises[e.routineIndex]){
   r.exercises[e.routineIndex].exerciseId=newId;
   r.exercises[e.routineIndex].loadType='auto'; // Old exercise's assistance setting must not carry over.
 }}
 e.exerciseId=newId;e.targetOverride=null;e.skipped=false;
 e.config={...e.config,loadType:'auto'};
 if(exerciseLoadType(newId,e.config)!=='external'){
  e.config.adaptiveProgression=false;e.config.setStructure=null;e.config.progressionStrategy='double';
 }
 const prev=previousExercise(newId,state.activeWorkout.programId,e.config),rec=buildRecommendation(e.config,prev,e.exerciseId);
 e.sets=Array.from({length:e.config.sets},(_,i)=>({weight:rec.weights[i]??rec.weight??0,reps:rec.targetReps[i]??e.config.minReps,done:false,rir:'',type:'working'}));e.notes='';
 if(!permanent)markWorkoutStructureDirty();else saveActiveWorkout();closeModal();renderWorkout();
}
let addPickerCategory='home',addPickerMovement='';

function openAddWorkoutExercise(){
 if(!state.activeWorkout)return;
 addPickerCategory='home';addPickerMovement='';
 openModal('Add exercise',`<div class="notice">Search directly or browse by muscle group and movement. <b>Add Today</b> changes only this workout. <b>Add + Save to Routine</b> adds it now and keeps it in this workout routine next time.</div>
 <div class="add-picker-help"><span>Tip:</span><span>After adding, the app will jump you directly to the new exercise.</span></div>
 <div class="picker-tools" style="margin-top:12px"><input id="addExSearch" placeholder="Search exercise, muscle, equipment..." oninput="renderAddExercisePicker()"></div>
 <div id="addExList" style="max-height:58vh;overflow:auto"></div>`);
 renderAddExercisePicker();
}
function addPickerRows(items){
 const w=state.activeWorkout;
 const routine=state.routines.find(r=>r.id===w?.routineId);
 return sortExerciseChoices(items.filter(x=>!isHiddenExercise(x.id))).map(x=>{
   const inWorkout=!!w?.exercises.some(e=>e.exerciseId===x.id);
   const inRoutine=!!routine?.exercises.some(e=>e.exerciseId===x.id);
   const todayText=inWorkout?'Already in Workout':'+ Add Today';
   const routineText=inRoutine?'Already in Routine':(inWorkout?'+ Save to Routine':'+ Add + Save to Routine');
   return `<div class="picker-result-card">
     <div class="picker-result-main">
       <button class="favbtn ${isFavorite(x.id)?'on':''}" onclick="toggleFavorite('${x.id}')">${isFavorite(x.id)?'★':'☆'}</button>
       <div class="iconbox">${catExerciseThumbnail(x)}</div>
       <div class="picker-result-copy"><div class="exercise-name">${esc(x.name)} ${preferenceBadgeHtml(x.id)}</div><div class="mini">${esc(x.muscle)} · ${esc(patternLabel(x.pattern))}<br>${esc(x.equipment)}</div></div>
     </div>
     <div class="picker-result-actions">
       <button class="btn small" ${inWorkout?'disabled':''} onclick="addExerciseToWorkout('${x.id}',false)">${todayText}</button>
       <button class="btn small secondary" ${inRoutine?'disabled':''} onclick="addExerciseToWorkout('${x.id}',true)">${routineText}</button>
     </div>
   </div>`;
 }).join('')||'<div class="empty">No visible exercises here yet.</div>';
}
function setAddCategory(cat){addPickerCategory=cat;addPickerMovement='';document.getElementById('addExSearch').value='';renderAddExercisePicker()}
function setAddMovement(p){addPickerMovement=p;renderAddExercisePicker()}
function renderAddExercisePicker(){
 const host=document.getElementById('addExList');if(!host)return;
 const q=(document.getElementById('addExSearch')?.value||'').trim();
 if(q){host.innerHTML=`<div class="picker-section">Search results</div><div class="picker-result-list">${addPickerRows(visibleExercises().filter(x=>exerciseMatchesSearch(x,q)).slice(0,100))}</div>`;return;}
 if(addPickerCategory==='home'){
   const fav=visibleExercises().filter(x=>isFavorite(x.id));
   const preferred=visibleExercises().filter(x=>exercisePreference(x.id)==='prefer'&&!isFavorite(x.id));
   const recent=recentExerciseIds().map(exById).filter(x=>x&&!isHiddenExercise(x.id));
   host.innerHTML=`${fav.length?`<div class="picker-section">★ Favorites</div><div class="picker-result-list">${addPickerRows(fav)}</div>`:''}
   ${preferred.length?`<div class="picker-section">↑ Preferred</div><div class="picker-result-list">${addPickerRows(preferred.slice(0,12))}</div>`:''}
   ${recent.length?`<div class="picker-section">↺ Recently used</div><div class="picker-result-list">${addPickerRows(recent.slice(0,10))}</div>`:''}
   <div class="picker-section">Browse by muscle group</div><div class="category-grid">${muscleCategories().map(c=>`<button class="category-card" onclick="setAddCategory('${escAttr(c.name)}')"><b>${categoryIcon(c.name)} ${esc(c.name)}</b><span>${c.count} exercises</span></button>`).join('')}</div>`;
   return;
 }
 const inCat=visibleExercises().filter(x=>x.muscle===addPickerCategory);
 const patterns=[...new Set(inCat.map(x=>x.pattern))].sort((a,b)=>patternLabel(a).localeCompare(patternLabel(b)));
 const filtered=addPickerMovement?inCat.filter(x=>x.pattern===addPickerMovement):inCat;
 host.innerHTML=`<div class="breadcrumb"><button onclick="setAddCategory('home')">All categories</button><span>›</span><b>${esc(addPickerCategory)}</b></div>
 <div class="picker-chips"><button class="chip ${!addPickerMovement?'active':''}" onclick="setAddMovement('')">All</button>${patterns.map(p=>`<button class="chip ${addPickerMovement===p?'active':''}" onclick="setAddMovement('${p}')">${esc(patternLabel(p))}</button>`).join('')}</div>
 <div class="picker-result-list">${addPickerRows(filtered)}</div>`;
}

function defaultWorkoutExerciseConfig(){
 return {
   sets:state.settings.defaultSets,
   minReps:state.settings.defaultMin,
   maxReps:state.settings.defaultMax,
   increment:state.settings.defaultIncrement,
   loadType:'auto',
   mode:'double',
   trainingGoal:'general',
   resetPercent:7.5,
   restSeconds:120
 };
}
function addExerciseToWorkout(exerciseId,permanent){
 const w=state.activeWorkout;if(!w)return;
 const ex=exById(exerciseId);if(!ex)return;
 const routine=state.routines.find(r=>r.id===w.routineId);
 const existingIndex=w.exercises.findIndex(e=>e.exerciseId===exerciseId);
 const routineIndex=routine?.exercises.findIndex(e=>e.exerciseId===exerciseId)??-1;

 // If it is already in today's workout, "Routine" can still promote a today-only addition.
 if(existingIndex>=0){
   if(permanent && routine && routineIndex<0){
     const cfg={...w.exercises[existingIndex].config};
     const savedCfg={
       exerciseId,
       sets:cfg.sets,
       minReps:cfg.minReps,
       maxReps:cfg.maxReps,
       increment:cfg.increment,
       loadType:cfg.loadType||'auto',
       mode:cfg.mode==='double'?'double':cfg.mode,
       trainingGoal:cfg.trainingGoal||'general',
       resetPercent:cfg.resetPercent||7.5,
       restSeconds:cfg.restSeconds||120,
       supersetGroup:null
     };
     routine.exercises.push(savedCfg);
     applyWorkoutFocusState(w,existingIndex,null,{deferCurrent:true});
     w.exercises[existingIndex].routineIndex=routine.exercises.length-1;
     saveActiveWorkout();haptic([20,30,20]);closeModal();renderWorkout();
     showToast(`${ex.name} saved to routine`);
     return;
   }
   showToast(`${ex.name} is already in this workout`);
   return;
 }

 const cfg=defaultWorkoutExerciseConfig();
 let newRoutineIndex=null;

 if(permanent && routine){
   if(routineIndex<0){
     routine.exercises.push({exerciseId,...cfg});
     newRoutineIndex=routine.exercises.length-1;
   }else{
     newRoutineIndex=routineIndex;
   }
 }

 cfg.routineMode=w.trainingMode||'guided';
 cfg.programGuided=!!(w.programId&&cfg.routineMode==='guided');
 const prev=previousExercise(exerciseId,w.programId,cfg);
 const rec=buildRecommendation(cfg,prev,exerciseId);
 const entry={
   exerciseId,
   routineIndex:newRoutineIndex,
   config:{...cfg},
   targetOverride:null,
   supersetId:null,
   skipped:false,
   expanded:true,
   sets:Array.from({length:cfg.sets},(_,i)=>({
     weight:rec.weights?.[i]??rec.weight??0,
     reps:rec.targetReps?.[i]??cfg.minReps,
     done:false,
     rir:'',
     type:'working'
   })),
   notes:''
 };
 w.exercises.push(entry);
 const newIndex=w.exercises.length-1;
 applyWorkoutFocusState(w,newIndex,null,{deferCurrent:true});
 if(!permanent)markWorkoutStructureDirty();else saveActiveWorkout();haptic([20,30,20]);closeModal();renderWorkout();
 showToast(permanent?`${ex.name} added + saved to routine`:`${ex.name} added for today`);
}


