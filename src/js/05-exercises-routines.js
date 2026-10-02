
let exerciseFilterOptionsKey='';
function populateMuscles(force=false){
 const msel=document.getElementById('muscleFilter'), esel=document.getElementById('equipmentFilter');
 const key=`${LIBRARY.length}|${state.customExercises.map(x=>`${x.id}:${x.muscle}:${x.equipment}`).join('|')}`;
 if(!force&&key===exerciseFilterOptionsKey)return;
 const muscles=[...new Set(allExercises().map(x=>x.muscle))].sort();
 const equipment=[...new Set(allExercises().map(x=>x.equipment))].sort();
 if(msel){const old=msel.value;msel.innerHTML='<option value="">All muscle groups</option>'+muscles.map(m=>`<option>${esc(m)}</option>`).join('');msel.value=old;}
 if(esel){const old=esel.value;esel.innerHTML='<option value="">All equipment</option>'+equipment.map(e=>`<option>${esc(e)}</option>`).join('');esel.value=old;}
 exerciseFilterOptionsKey=key;
}
let exerciseHistoryFilter='all',exerciseRenderFrame=null;
function scheduleExerciseRender(){
 if(exerciseRenderFrame)cancelAnimationFrame(exerciseRenderFrame);
 exerciseRenderFrame=requestAnimationFrame(()=>{exerciseRenderFrame=null;renderExercises()});
}

function setExerciseHistoryFilter(filter){
 exerciseHistoryFilter=filter;
 renderExercises();
}

function renderExercises(){
 populateMuscles();
 const q=(document.getElementById('exerciseSearch')?.value||'').toLowerCase();
 const m=document.getElementById('muscleFilter')?.value||'';
 const eq=document.getElementById('equipmentFilter')?.value||'';
 const all=allExercises(),visible=all.filter(x=>!isHiddenExercise(x.id)),hidden=all.filter(x=>isHiddenExercise(x.id));
 const loggedIds=derivedSessionData().loggedExerciseIds;

 document.querySelectorAll('[data-history-filter]').forEach(btn=>{
   btn.classList.toggle('active',btn.dataset.historyFilter===exerciseHistoryFilter);
 });
 const counts={
   all:visible.length,
   done:visible.filter(x=>loggedIds.has(x.id)).length,
   new:visible.filter(x=>!loggedIds.has(x.id)).length,
   favorite:visible.filter(x=>isFavorite(x.id)).length,
   prefer:visible.filter(x=>exercisePreference(x.id)==='prefer').length,
   hidden:hidden.length
 };
 const labels={
   exerciseFilterAll:`All (${counts.all})`,
   exerciseFilterDone:`✓ Done Before (${counts.done})`,
   exerciseFilterNew:`Not Yet Logged (${counts.new})`,
   exerciseFilterFav:`★ Favorites (${counts.favorite})`,
   exerciseFilterPrefer:`Prefer (${counts.prefer})`,
   exerciseFilterHidden:`Hidden (${counts.hidden})`
 };
 Object.entries(labels).forEach(([id,label])=>{const el=document.getElementById(id);if(el)el.textContent=label});

 const source=exerciseHistoryFilter==='hidden'?hidden:visible;
 const list=sortExerciseChoices(source.filter(x=>{
   const matchesSearch=!q||x.name.toLowerCase().includes(q)||x.muscle.toLowerCase().includes(q)||(x.pattern||'').toLowerCase().includes(q);
   const matchesFilter=exerciseHistoryFilter==='all'
     ||exerciseHistoryFilter==='hidden'
     ||(exerciseHistoryFilter==='done'&&loggedIds.has(x.id))
     ||(exerciseHistoryFilter==='new'&&!loggedIds.has(x.id))
     ||(exerciseHistoryFilter==='favorite'&&isFavorite(x.id))
     ||(exerciseHistoryFilter==='prefer'&&exercisePreference(x.id)==='prefer');
   return matchesSearch&&matchesFilter&&(!m||x.muscle===m)&&(!eq||x.equipment===eq);
 }));
 const emptyMessage=exerciseHistoryFilter==='done'
   ?'No logged exercises match these filters yet.'
   :exerciseHistoryFilter==='new'
     ?'You have already logged every visible exercise matching these filters.'
     :exerciseHistoryFilter==='favorite'
       ?'No favorite exercises match these filters.'
       :exerciseHistoryFilter==='prefer'
         ?'No preferred exercises match these filters.'
         :exerciseHistoryFilter==='hidden'
           ?'No hidden exercises match these filters.'
           :'Nothing matched that search.';
 document.getElementById('exerciseList').innerHTML=list.length?list.map(x=>`
   <div class="list-item">
     <div class="iconbox schematic-exercise-thumb">${catExerciseThumbnail(x)}</div>
     <div class="grow exercise-link" onclick="openExerciseProgress('${x.id}')"><div class="exercise-name">${esc(x.name)} ${preferenceBadgeHtml(x.id)}</div><div class="mini" style="margin:4px 0">${muscleChip(x.muscle)}</div><div class="mini">${esc(x.equipment)} · ${esc(patternLabel(x.pattern))}</div></div>
     <button class="favbtn ${isFavorite(x.id)?'on':''}" onclick="toggleFavorite('${x.id}')" title="Favorite">${isFavorite(x.id)?'★':'☆'}</button>
     ${x.custom?`<button class="btn small secondary" onclick="editExercise('${x.id}')">Edit</button>`:''}
   </div>`).join(''):`<div class="empty">${emptyMessage}</div>`;
}
function patternLabel(p){return String(p||'other').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}

function isFavorite(id){return (state.favorites||[]).includes(id)}
function exercisePreference(id){return state.exercisePreferences?.[id]||'neutral'}
function isHiddenExercise(id){return exercisePreference(id)==='hide'}
function visibleExercises(){return allExercises().filter(x=>!isHiddenExercise(x.id))}
function preferenceRank(id){
 const p=exercisePreference(id);
 return (p==='prefer'?35:p==='avoid'?-65:p==='hide'?-999:0)+(isFavorite(id)?12:0);
}
function preferenceBadgeHtml(id){
 const p=exercisePreference(id);
 if(p==='prefer')return '<span class="preference-badge prefer">↑ Prefer</span>';
 if(p==='avoid')return '<span class="preference-badge avoid">↓ Avoid</span>';
 if(p==='hide')return '<span class="preference-badge hide">Hidden</span>';
 return '';
}
function sortExerciseChoices(items){
 return [...items].sort((a,b)=>preferenceRank(b.id)-preferenceRank(a.id)||a.name.localeCompare(b.name));
}
function setExercisePreference(id,pref,refreshDetail=false){
 state.exercisePreferences=state.exercisePreferences||{};
 if(!['prefer','avoid','hide'].includes(pref))delete state.exercisePreferences[id];
 else state.exercisePreferences[id]=pref;
 save();
 if(document.getElementById('routinePicker'))renderRoutinePicker();
 if(document.getElementById('addExList'))renderAddExercisePicker();
 if(document.getElementById('exerciseList'))renderExercises();
 if(document.getElementById('subList')){
   const activeIndex=state.activeWorkout?.exercises?.findIndex(e=>e.exerciseId===id);
   if(activeIndex>=0)refreshWorkoutSubs(activeIndex);
 }
 if(refreshDetail)openExerciseProgress(id);
 showToast(pref==='prefer'?'Exercise preferred':pref==='avoid'?'Exercise marked avoid':pref==='hide'?'Exercise hidden':'Exercise preference cleared');
}
function toggleFavorite(id){
 state.favorites=state.favorites||[];
 state.favorites=isFavorite(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];
 save();
 const detailFav=document.getElementById('exerciseDetailFavorite');
 if(detailFav&&detailFav.dataset.exerciseId===id){
   detailFav.classList.toggle('on',isFavorite(id));
   detailFav.textContent=isFavorite(id)?'★':'☆';
 }
 if(document.getElementById('routinePicker'))renderRoutinePicker();
 if(document.getElementById('addExList'))renderAddExercisePicker();
 if(document.getElementById('exerciseList'))renderExercises();
}
function recentExerciseIds(limit=18){
 const out=[],seen=new Set();
 const add=id=>{if(id&&!seen.has(id)){seen.add(id);out.push(id)}};
 if(state.activeWorkout) [...state.activeWorkout.exercises].reverse().forEach(e=>add(e.exerciseId));
 [...state.sessions].sort((a,b)=>b.date.localeCompare(a.date)).forEach(s=>[...s.exercises].reverse().forEach(e=>add(e.exerciseId)));
 state.routines.forEach(r=>r.exercises.forEach(e=>{if(out.length<limit)add(e.exerciseId)}));
 return out.slice(0,limit);
}
function categoryIcon(m){
 return ({Chest:'▰',Back:'↔',Shoulders:'△',Biceps:'◒',Triceps:'◓',Quads:'⬟',Hamstrings:'⌁',Glutes:'●',Calves:'⌃',Core:'◆',Traps:'⌂',Forearms:'✦','Lower Back':'◇',Tibialis:'⌄',Adductors:'◫','Full Body':'★'})[m]||'•';
}
function muscleCategories(){
 const counts={}; visibleExercises().forEach(x=>counts[x.muscle]=(counts[x.muscle]||0)+1);
 const preferred=['Chest','Back','Shoulders','Biceps','Triceps','Quads','Hamstrings','Glutes','Calves','Core','Traps','Forearms','Lower Back','Tibialis','Adductors','Full Body'];
 return Object.keys(counts).sort((a,b)=>{
   const ai=preferred.indexOf(a),bi=preferred.indexOf(b);
   if(ai>=0||bi>=0)return (ai<0?999:ai)-(bi<0?999:bi);
   return a.localeCompare(b);
 }).map(name=>({name,count:counts[name]}));
}
function exerciseMatchesSearch(x,q){
 q=q.trim().toLowerCase();
 return !q||x.name.toLowerCase().includes(q)||x.muscle.toLowerCase().includes(q)||x.equipment.toLowerCase().includes(q)||patternLabel(x.pattern).toLowerCase().includes(q);
}

const WORKOUT_ART_BASE='https://raw.githubusercontent.com/bryllim/workout-guide/main/packages/workout-guide/assets/';
const WORKOUT_ART_ALIASES={
 'barbell-bench-press':'bench-press',
 'incline-barbell-bench-press':'incline-bench-press',
 'back-squat':'squat',
 'dumbbell-row':'one-arm-dumbbell-row',
 'seated-cable-row':'seated-row',
 'dumbbell-shoulder-press':'seated-dumbbell-shoulder-press',
 'dumbbell-lateral-raise':'lateral-raise',
 'barbell-curl':'ez-bar-curl',
 'dumbbell-curl':'bicep-curl',
 'triceps-pushdown':'tricep-pushdown',
 'overhead-triceps-extension':'overhead-tricep-extension',
 'barbell-shrug':'shrug',
 'decline-barbell-bench-press':'decline-bench-press',
 '45-degree-back-extension':'back-extension',
 'ab-crunch-machine':'crunch',
 'alternating-dumbbell-curl':'bicep-curl',
 'anderson-squat':'squat',
 'chest-press-machine':'bench-press',
 'floor-press':'bench-press',
 'paused-bench-press':'bench-press',
 'wide-grip-bench-press':'bench-press',
 'dumbbell-floor-press':'dumbbell-bench-press',
 'neutral-grip-dumbbell-bench-press':'dumbbell-bench-press',
 'single-arm-dumbbell-bench-press':'dumbbell-bench-press',
 'low-incline-dumbbell-press':'incline-dumbbell-press',
 'incline-dumbbell-fly':'dumbbell-fly',
 'standing-cable-chest-press':'cable-fly',
 'single-arm-cable-chest-press':'cable-fly',
 'low-to-high-cable-fly':'cable-fly',
 'high-to-low-cable-fly':'cable-fly',
 'single-arm-cable-fly':'cable-fly',
 'plate-loaded-chest-press':'bench-press',
 'hammer-strength-chest-press':'bench-press',
 'yates-row':'barbell-row',
 'underhand-barbell-row':'barbell-row',
 'landmine-row':'t-bar-row',
 'chest-supported-dumbbell-row':'chest-supported-row',
 'incline-bench-dumbbell-row':'chest-supported-row',
 'wide-grip-seated-cable-row':'seated-row',
 'close-grip-seated-cable-row':'seated-row',
 'kneeling-cable-row':'single-arm-cable-row',
 'high-cable-row':'seated-row',
 'plate-loaded-row':'machine-row',
 'hammer-strength-row':'machine-row',
 'machine-high-row':'machine-row',
 'machine-low-row':'machine-row',
 'neutral-grip-lat-pulldown':'lat-pulldown',
 'underhand-lat-pulldown':'close-grip-lat-pulldown',
 'single-arm-lat-pulldown':'lat-pulldown',
 'kneeling-single-arm-pulldown':'lat-pulldown',
 'plate-loaded-pulldown':'lat-pulldown',
 'rope-straight-arm-pulldown':'straight-arm-pulldown',
 'single-arm-straight-arm-pulldown':'straight-arm-pulldown',
 'cable-pullover':'straight-arm-pulldown',
 'dumbbell-pullover':'pullover',
 'machine-pullover':'pullover',
 'seated-barbell-shoulder-press':'overhead-press',
 'smith-machine-shoulder-press':'overhead-press',
 'single-arm-dumbbell-shoulder-press':'seated-dumbbell-shoulder-press',
 'single-arm-cable-shoulder-press':'overhead-press',
 'plate-loaded-shoulder-press':'overhead-press',
 'lean-away-dumbbell-lateral-raise':'lateral-raise',
 'seated-dumbbell-lateral-raise':'lateral-raise',
 'incline-dumbbell-lateral-raise':'lateral-raise',
 'behind-the-back-cable-lateral-raise':'cable-lateral-raise',
 'lean-away-cable-lateral-raise':'cable-lateral-raise',
 'bent-over-dumbbell-reverse-fly':'bent-over-rear-delt-raise',
 'incline-rear-delt-raise':'rear-delt-fly',
 'cable-reverse-fly':'cable-rear-delt-fly',
 'single-arm-rear-delt-cable-fly':'cable-rear-delt-fly',
 'rope-face-pull':'face-pull',
 'dumbbell-front-raise':'cable-front-raise',
 'barbell-front-raise':'cable-front-raise',
 'barbell-upright-row':'upright-row',
 'cable-upright-row':'upright-row',
 'high-bar-squat':'squat',
 'low-bar-squat':'squat',
 'pause-squat':'squat',
 'box-squat':'squat',
 'anderson-squat':'squat',
 'stationary-lunge':'forward-lunge',
 'dumbbell-step-up':'step-up',
 'barbell-reverse-lunge':'reverse-lunge',
 'barbell-split-squat':'split-squat',
 'single-leg-extension':'leg-extension',
 'stiff-leg-deadlift':'romanian-deadlift',
 'snatch-grip-romanian-deadlift':'romanian-deadlift',
 'deficit-romanian-deadlift':'romanian-deadlift',
 'standing-leg-curl':'leg-curl',
 'single-leg-seated-curl':'seated-leg-curl',
 'single-leg-lying-curl':'lying-leg-curl',
 'nordic-curl-machine':'nordic-hamstring-curl',
 'sliding-leg-curl':'stability-ball-hamstring-curl',
 'glute-ham-raise':'back-extension',
 'b-stance-hip-thrust':'hip-thrust',
 'hip-thrust-machine':'hip-thrust',
 'glute-drive-machine':'hip-thrust',
 'standing-cable-hip-extension':'cable-kickback',
 'standing-hip-abduction-machine':'hip-abduction-machine',
 'cable-hip-abduction':'cable-standing-hip-abduction',
 'banded-hip-abduction':'banded-standing-hip-abduction',
 'cable-hip-adduction':'cable-standing-hip-adduction',
 'reverse-barbell-curl':'reverse-curl',
 'spider-barbell-curl':'spider-curl',
 'spider-dumbbell-curl':'spider-curl',
 'cross-body-hammer-curl':'hammer-curl',
 'zottman-curl':'reverse-curl',
 'reverse-dumbbell-curl':'reverse-curl',
 'bayesian-cable-curl':'cable-curl',
 'high-cable-curl':'cable-curl',
 'single-arm-cable-curl':'cable-curl',
 'cable-preacher-curl':'preacher-curl',
 'machine-biceps-curl':'preacher-curl',
 'plate-loaded-preacher-curl':'preacher-curl',
 'rope-triceps-pushdown':'rope-tricep-pushdown',
 'straight-bar-pushdown':'tricep-pushdown',
 'v-bar-pushdown':'tricep-pushdown',
 'single-arm-triceps-pushdown':'tricep-pushdown',
 'cross-body-cable-triceps-extension':'tricep-kickback',
 'rope-overhead-triceps-extension':'overhead-tricep-extension',
 'single-arm-overhead-cable-extension':'overhead-tricep-extension',
 'single-dumbbell-overhead-extension':'dumbbell-overhead-tricep-extension',
 'dumbbell-kickback':'tricep-kickback',
 'machine-triceps-extension':'overhead-tricep-extension',
 'plate-loaded-dip':'dip',
 'single-leg-standing-calf-raise':'single-leg-calf-raise',
 'hack-squat-calf-raise':'leg-press-calf-raise',
 'smith-machine-calf-raise':'standing-calf-raise',
 'dumbbell-standing-calf-raise':'standing-calf-raise',
 'single-leg-dumbbell-calf-raise':'single-leg-calf-raise',
 'tibialis-raise-machine':'calf-raise',
 'wall-tibialis-raise':'calf-raise',
 'behind-the-back-barbell-shrug':'shrug',
 'snatch-grip-shrug':'shrug',
 'smith-machine-shrug':'shrug',
 'machine-shrug':'shrug',
 'cable-shrug':'shrug',
 'incline-dumbbell-shrug':'dumbbell-shrug'
};
function workoutArtSlugify(name){
 return String(name||'').toLowerCase().replace(/&/g,' and ').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function workoutArtExactSlug(ex){
 const slug=workoutArtSlugify(ex?.name||'');
 return WORKOUT_ART_ALIASES[slug]||slug;
}
function workoutArtFallbackSlug(ex){
 const p=ex?.pattern||'',name=String(ex?.name||'').toLowerCase();
 if(p==='squat')return /front|goblet|zercher/.test(name)?'front-squat':'squat';
 if(p==='lunge')return 'bulgarian-split-squat';
 if(p==='back_extension'||name.includes('back extension'))return 'back-extension';
 if(['hinge','olympic_pull'].includes(p))return 'deadlift';
 if(p==='hip_extension')return 'hip-thrust';
 if(p==='horizontal_press'||p==='dip_press')return 'bench-press';
 if(p==='incline_press')return 'incline-bench-press';
 if(p==='vertical_press')return 'overhead-press';
 if(['horizontal_pull','upright_row'].includes(p))return 'barbell-row';
 if(p==='rear_delt')return 'rear-delt-fly';
 if(['vertical_pull','pullover','shoulder_extension'].includes(p))return 'lat-pulldown';
 if(p==='chest_fly')return 'cable-fly';
 if(['lateral_raise','front_raise'].includes(p))return 'lateral-raise';
 if(p==='elbow_flexion')return 'bicep-curl';
 if(p==='elbow_extension')return 'tricep-pushdown';
 if(p==='knee_extension')return 'leg-extension';
 if(p==='knee_flexion')return 'seated-leg-curl';
 if(['calf_raise','dorsiflexion'].includes(p))return 'standing-calf-raise';
 if(p==='spinal_flexion')return 'crunch';
 if(p==='anti_extension')return 'ab-wheel';
 if(p==='hip_flexion_core')return 'captains-chair-knee-raise';
 if(['anti_rotation','rotation','lateral_flexion'].includes(p))return 'cable-pallof-hold';
 if(p==='carry')return 'farmer-carry';
 if(p==='shrug')return 'shrug';
 if(['wrist_extension','wrist_flexion','grip'].includes(p))return 'wrist-curl';
 if(['hip_abduction','hip_adduction'].includes(p))return 'hip-abduction-machine';
 return 'cable-pallof-hold';
}
function workoutArtUrl(slug){return WORKOUT_ART_BASE+encodeURIComponent(slug)+'/frame-1.svg'}
function exerciseThumbFallback(img){
 const fallback=img?.dataset?.fallback;
 if(fallback&&img.src!==fallback){
   img.src=fallback;
   img.removeAttribute('data-fallback');
   return;
 }
 img?.parentElement?.classList.add('thumb-unavailable');
}
function catExerciseThumbnail(ex){
 const exact=workoutArtExactSlug(ex),fallback=workoutArtFallbackSlug(ex);
 const exactUrl=workoutArtUrl(exact),fallbackUrl=workoutArtUrl(fallback);
 return '<span class="exercise-thumb-shell schematic-thumb">'+
   '<span class="schematic-grid" aria-hidden="true"></span>'+
   '<img class="exercise-thumb-art" loading="lazy" decoding="async" alt="" src="'+escAttr(exactUrl)+'" data-fallback="'+escAttr(fallbackUrl)+'" onerror="exerciseThumbFallback(this)">'+
   '<span class="schematic-axis" aria-hidden="true"></span>'+
   '<span class="schematic-corner" aria-hidden="true"></span>'+
  '</span>';
}

function routineIsArchived(r){return !!r?.archivedAt}
function activeRoutines(){return state.routines.filter(r=>!routineIsArchived(r))}
function archivedRoutines(){return state.routines.filter(r=>routineIsArchived(r))}
function syncRoutinePagePriority(){
 const host=document.getElementById('routinePageSections'),programs=document.getElementById('programsSection'),routines=document.getElementById('workoutRoutinesSection');
 if(!host||!programs||!routines)return;
 if(state.programs.length){
   host.append(programs,routines);
 }else{
   host.append(routines,programs);
 }
}
function renderRoutines(){
 syncRoutinePagePriority();
 renderPrograms();
 const el=document.getElementById('routineList'),activeList=activeRoutines(),archived=archivedRoutines();
 const activeHtml=activeList.length?activeList.map(r=>{
   const active=state.activeWorkout?.routineId===r.id;
   const counts=active?activeWorkoutCounts():null;
   return `
 <div class="card" style="${active?'border-color:rgba(34,197,94,.42)':''}">
   <div class="row">
     <div class="grow"><div class="exercise-name">${esc(r.name)}</div><div class="mini">${esc(trainingModeLabel(r.trainingMode))} · ${active?`${counts.done} of ${counts.total} sets complete · active workout is autosaved`:(r.exercises.map(x=>esc(exById(x.exerciseId)?.name||'Unknown')).join(' · ')||'No exercises yet')}</div></div>
     <button class="btn small ${active?'green':''}" onclick="${active?'resumeActiveWorkout()':`openRoutine('${r.id}')`}">${active?'Resume':'Start'}</button>
   </div>
   <div class="actions">${active?'<span class="tag">● ACTIVE</span>':''}<button class="btn small secondary" onclick="openRoutineShare('${r.id}')">Share</button><button class="btn small secondary" onclick="editRoutine('${r.id}')">Edit routine</button><button class="btn small secondary" onclick="archiveRoutine('${r.id}')">Archive</button></div>
 </div>`;
 }).join(''):`<div class="empty">You don't have any active routines yet.</div>`;
 const archivedHtml=archived.length?`<div class="picker-section" style="margin-top:18px">Archived routines</div>${archived.map(r=>`
 <div class="card">
   <div class="row"><div class="grow"><div class="exercise-name">${esc(r.name)}</div><div class="mini">${esc(trainingModeLabel(r.trainingMode))} · archived ${new Date(r.archivedAt).toLocaleDateString()} · history preserved</div></div><span class="tag">ARCHIVED</span></div>
   <div class="actions"><button class="btn small secondary" onclick="restoreRoutine('${r.id}')">Restore</button><button class="btn small danger" onclick="deleteRoutine('${r.id}')">Delete permanently</button></div>
 </div>`).join('')}`:'';
 el.innerHTML=activeHtml+archivedHtml;
 updateActiveWorkoutChrome();
}
function installRegressionFixturePlan(){
 // Internal deterministic fixture used by the repository smoke tests.
 // It is intentionally not exposed in the product UI or onboarding.
 const find=name=>allExercises().find(x=>x.name===name)?.id;
 const make=(name,items)=>({id:uid(),name,description:'Regression fixture',trainingMode:'guided',exercises:items.map(([exercise,sets,min,max,inc,rest])=>({
   exerciseId:find(exercise),sets,minReps:min,maxReps:max,increment:inc,mode:'double',restSeconds:rest
 })).filter(x=>x.exerciseId)});
 const created=[
   make('Fixture Full Body A',[
    ['Back Squat',3,6,10,5,150],['Barbell Bench Press',3,6,10,5,150],['Seated Cable Row',3,8,12,5,120],['Romanian Deadlift',2,8,12,5,150],['Dumbbell Lateral Raise',2,10,15,5,75],['Cable Crunch',2,10,15,5,75]
   ]),
   make('Fixture Full Body B',[
    ['Deadlift',2,5,8,5,180],['Dumbbell Shoulder Press',3,8,12,5,120],['Lat Pulldown',3,8,12,5,120],['Bulgarian Split Squat',3,8,12,5,120],['Incline Dumbbell Press',2,8,12,5,120],['Cable Curl',2,10,15,5,75],['Triceps Pushdown',2,10,15,5,75]
   ]),
   make('Fixture Full Body C',[
    ['Leg Press',3,8,12,10,150],['Dumbbell Bench Press',3,8,12,5,120],['Chest Supported Row',3,8,12,5,120],['Hip Thrust',3,8,12,5,150],['Seated Leg Curl',2,10,15,5,90],['Cable Lateral Raise',2,10,15,5,75]
   ])
 ];
 state.routines.push(...created);
 const p={id:uid(),name:'Fixture 3-Day Rotation',routineIds:created.map(r=>r.id),frequency:3,preferredDays:[1,3,5],trainingMode:'inherit',nextIndex:0};
 state.programs.push(p);state.activeProgramId=p.id;save();renderHome();renderRoutines();
 return {routines:created,program:p};
}

let routinePickerSelection=new Set(),routinePickerCategory='home',routinePickerMovement='';

function newRoutine(id=null){
 const r=id?state.routines.find(x=>x.id===id):{id:uid(),name:'',description:'',trainingMode:'guided',exercises:[]};
 routinePickerSelection=new Set(r.exercises.map(x=>x.exerciseId));
 routinePickerCategory='home'; routinePickerMovement='';
 const body=`<div class="field"><label>Routine name</label><input id="rName" value="${escAttr(r.name)}" placeholder="Push Day"></div>
 <div class="notice">Search anything instantly, or browse by muscle group → movement. Star exercises you use a lot and they'll stay in Favorites.</div>
 <div class="picker-tools" style="margin-top:12px">
   <input id="routineExSearch" placeholder="Search exercise, muscle, equipment..." oninput="renderRoutinePicker()">
   <div class="row" style="margin-top:9px"><span class="mini">Exercise picker</span><span id="routinePickCount" class="pickcount">${routinePickerSelection.size} selected</span></div>
 </div>
 <div id="routinePicker" style="max-height:52vh;overflow:auto"></div>
 <div class="actions"><button class="btn" onclick="saveRoutine('${r.id}',${id?'true':'false'})">Save routine</button></div>`;
 openModal(id?'Edit routine':'New routine',body);
 renderRoutinePicker();
}
function routinePickerRows(items){
 return sortExerciseChoices(items.filter(x=>!isHiddenExercise(x.id))).map(x=>`<div class="list-item">
   <button class="favbtn ${isFavorite(x.id)?'on':''}" onclick="toggleFavorite('${x.id}')" title="Favorite">${isFavorite(x.id)?'★':'☆'}</button>
   <div class="iconbox">${catExerciseThumbnail(x)}</div>
   <div class="grow" onclick="toggleRoutineExercise('${x.id}')" style="cursor:pointer"><div class="exercise-name">${esc(x.name)} ${preferenceBadgeHtml(x.id)}</div><div class="mini">${esc(x.muscle)} · ${esc(patternLabel(x.pattern))} · ${esc(x.equipment)}</div></div>
   <input type="checkbox" ${routinePickerSelection.has(x.id)?'checked':''} onchange="toggleRoutineExercise('${x.id}',this.checked)" style="width:22px;height:22px">
 </div>`).join('')||'<div class="empty">No visible exercises here yet.</div>';
}
function toggleRoutineExercise(id,forced){
 const add=forced===undefined?!routinePickerSelection.has(id):forced;
 if(add)routinePickerSelection.add(id);else routinePickerSelection.delete(id);
 const c=document.getElementById('routinePickCount');if(c)c.textContent=`${routinePickerSelection.size} selected`;
 renderRoutinePicker();
}
function setRoutineCategory(cat){routinePickerCategory=cat;routinePickerMovement='';document.getElementById('routineExSearch').value='';renderRoutinePicker()}
function setRoutineMovement(p){routinePickerMovement=p;renderRoutinePicker()}
function renderRoutinePicker(){
 const host=document.getElementById('routinePicker');if(!host)return;
 const q=(document.getElementById('routineExSearch')?.value||'').trim();
 if(q){
   host.innerHTML=`<div class="picker-section">Search results</div><div class="card">${routinePickerRows(visibleExercises().filter(x=>exerciseMatchesSearch(x,q)).slice(0,100))}</div>`;
   return;
 }
 if(routinePickerCategory==='home'){
   const fav=visibleExercises().filter(x=>isFavorite(x.id));
   const preferred=visibleExercises().filter(x=>exercisePreference(x.id)==='prefer'&&!isFavorite(x.id));
   const recent=recentExerciseIds().map(exById).filter(x=>x&&!isHiddenExercise(x.id));
   host.innerHTML=`
    ${fav.length?`<div class="picker-section">★ Favorites</div><div class="card">${routinePickerRows(fav)}</div>`:''}
    ${preferred.length?`<div class="picker-section">↑ Preferred</div><div class="card">${routinePickerRows(preferred.slice(0,12))}</div>`:''}
    ${recent.length?`<div class="picker-section">↺ Recently used</div><div class="card">${routinePickerRows(recent.slice(0,10))}</div>`:''}
    <div class="picker-section">Browse by muscle group</div>
    <div class="category-grid">${muscleCategories().map(c=>`<button class="category-card" onclick="setRoutineCategory('${escAttr(c.name)}')"><b>${categoryIcon(c.name)} ${esc(c.name)}</b><span>${c.count} exercises</span></button>`).join('')}</div>`;
   return;
 }
 const inCat=visibleExercises().filter(x=>x.muscle===routinePickerCategory);
 const patterns=[...new Set(inCat.map(x=>x.pattern))].sort((a,b)=>patternLabel(a).localeCompare(patternLabel(b)));
 const filtered=routinePickerMovement?inCat.filter(x=>x.pattern===routinePickerMovement):inCat;
 host.innerHTML=`<div class="breadcrumb"><button onclick="setRoutineCategory('home')">All categories</button><span>›</span><b>${esc(routinePickerCategory)}</b></div>
 <div class="picker-chips"><button class="chip ${!routinePickerMovement?'active':''}" onclick="setRoutineMovement('')">All</button>${patterns.map(p=>`<button class="chip ${routinePickerMovement===p?'active':''}" onclick="setRoutineMovement('${p}')">${esc(patternLabel(p))}</button>`).join('')}</div>
 <div class="card">${routinePickerRows(filtered)}</div>`;
}
function saveRoutine(id,editing){
 const name=document.getElementById('rName').value.trim()||'Untitled Workout';
 const ids=[...routinePickerSelection];
 let old=state.routines.find(x=>x.id===id);
 const oldMap=new Map((old?.exercises||[]).map(x=>[x.exerciseId,x]));
 const exercises=ids.map(exerciseId=>oldMap.get(exerciseId)||{
   exerciseId,sets:state.settings.defaultSets,minReps:state.settings.defaultMin,maxReps:state.settings.defaultMax,
   increment:state.settings.defaultIncrement,mode:'double',restSeconds:120
 });
 const obj={...(old||{}),id,name,trainingMode:normalizeTrainingMode(old?.trainingMode),description:old?.description||'',exercises};
 if(editing) state.routines=state.routines.map(x=>x.id===id?obj:x); else state.routines.push(obj);
 save();closeModal();renderRoutines();renderHome();
 if(exercises.length) editRoutineDetails(id);
}
function editRoutine(id){newRoutine(id)}
function programsUsingRoutine(id){return state.programs.filter(p=>p.routineIds.includes(id))}
function archiveRoutine(id){
 const r=state.routines.find(x=>x.id===id);if(!r||routineIsArchived(r))return;
 if(state.activeWorkout?.routineId===id){showToast('Finish or cancel the active workout before archiving this routine');return}
 const programs=programsUsingRoutine(id);
 if(programs.length){
   openModal('Archive routine?',`
     <div class="notice"><b>${esc(r.name)}</b> is currently used by ${programs.length===1?'this program':'these programs'}: <b>${programs.map(p=>esc(p.name)).join(', ')}</b>.<br><br>Archiving can remove the routine from those rotations while keeping all completed workout history.</div>
     <div class="actions"><button class="btn danger" onclick="archiveRoutineAndRemoveFromPrograms('${id}')">Remove from program${programs.length===1?'':'s'} + Archive</button><button class="btn secondary" onclick="closeModal()">Cancel</button></div>
   `);
   return;
 }
 confirmAction('Archive routine?',`Archive "${r.name}"? It will disappear from active workout lists, but all completed history and the routine itself stay recoverable.`,()=>performArchiveRoutine(id,false));
}
function archiveRoutineAndRemoveFromPrograms(id){closeModal();performArchiveRoutine(id,true)}
function performArchiveRoutine(id,removeFromPrograms=false){
 const r=state.routines.find(x=>x.id===id);if(!r)return;
 if(removeFromPrograms){
   state.programs.forEach(p=>{
     const oldNext=p.routineIds[p.nextIndex]||null;
     p.routineIds=p.routineIds.filter(rid=>rid!==id);
     if(oldNext&&p.routineIds.includes(oldNext))p.nextIndex=p.routineIds.indexOf(oldNext);
     else p.nextIndex=Math.min(Number(p.nextIndex)||0,Math.max(0,p.routineIds.length-1));
   });
 }
 r.archivedAt=new Date().toISOString();
 save();closeModal();renderRoutines();renderHome();showToast('Routine archived');
}
function restoreRoutine(id){
 const r=state.routines.find(x=>x.id===id);if(!r)return;
 r.archivedAt=null;save();renderRoutines();renderHome();showToast('Routine restored');
}
function deleteRoutine(id){
 const r=state.routines.find(x=>x.id===id);if(!r)return;
 if(!routineIsArchived(r)){showToast('Archive this routine before permanently deleting it');return}
 if(state.activeWorkout?.routineId===id){showToast('Finish or cancel the active workout before deleting this routine');return}
 const sessions=state.sessions.filter(s=>s.routineId===id).length;
 confirmAction('Permanently delete routine?',`Permanently delete "${r.name}"? This cannot be undone. ${sessions?`${sessions} completed workout${sessions===1?' remains':'s remain'} in History because workout history is stored independently.`:'There is no completed history linked to this routine.'}`,()=>{
   state.routines=state.routines.filter(x=>x.id!==id);
   state.programs.forEach(p=>{
     p.routineIds=p.routineIds.filter(rid=>rid!==id);
     p.nextIndex=Math.min(Number(p.nextIndex)||0,Math.max(0,p.routineIds.length-1));
   });
   save();closeModal();renderRoutines();renderHome();showToast('Routine permanently deleted');
 });
}

function editRoutineDetails(id){
 const r=state.routines.find(x=>x.id===id); if(!r)return;
 openModal(`${esc(r.name)} editor`,`
 <div class="field"><label>Routine name</label><input id="routineEditorName" value="${escAttr(r.name||"")}" placeholder="Push Day" data-routine-id="${r.id}" onchange="saveRoutineMeta(this.dataset.routineId)"></div>
 <div class="field"><label>Routine notes <span class="mini">(optional)</span></label><textarea id="routineEditorDescription" placeholder="Goal, split notes, equipment setup..." data-routine-id="${r.id}" onchange="saveRoutineMeta(this.dataset.routineId)">${esc(r.description||"")}</textarea></div>
 <div class="field"><label>Training mode</label><select id="routineEditorTrainingMode" data-routine-id="${r.id}" onchange="saveRoutineMeta(this.dataset.routineId);updateRoutineModeHelp(this.value)"><option value="guided" ${normalizeTrainingMode(r.trainingMode)==="guided"?"selected":""}>Guided Progressive Overload</option><option value="strength" ${normalizeTrainingMode(r.trainingMode)==="strength"?"selected":""}>Strength Focus</option><option value="track" ${normalizeTrainingMode(r.trainingMode)==="track"?"selected":""}>Track Only / Standard Workout</option></select><div id="routineModeHelp" class="native-note" style="margin-top:6px">${esc(trainingModeDescription(r.trainingMode))}</div></div>
 <div class="notice">Reorder exercises, edit progression, duplicate movements, remove them, or swap to a recommended substitute without rebuilding the routine.</div>
 <div id="routineEditorList" class="routine-edit-list" style="margin-top:12px">${routineEditorHtml(r)}</div>
 <div class="actions"><button class="btn" onclick="openCoachRoutineControl('${id}')">Coach Edit</button><button class="btn secondary" onclick="openRoutineExerciseAdder('${id}')">+ Add exercise</button><button class="btn secondary" onclick="duplicateRoutine('${id}')">Duplicate routine</button><button class="btn" onclick="saveRoutineEditor('${id}')">Done</button><button class="btn secondary" onclick="archiveRoutine('${id}')">Archive routine</button></div>`);
}
function routineEditorHtml(r){
 return r.exercises.map((re,i)=>{
   const ex=exById(re.exerciseId);
   return `<div class="routine-edit-card" data-index="${i}">
    <div class="routine-edit-head">
      <div class="orderbox">
        <button class="orderbtn" onclick="moveRoutineExercise('${r.id}',${i},-1)" ${i===0?'disabled':''}>↑</button>
        <button class="orderbtn" onclick="moveRoutineExercise('${r.id}',${i},1)" ${i===r.exercises.length-1?'disabled':''}>↓</button>
      </div>
      <div>
        <div class="exercise-name">${esc(ex?.name||'Exercise')} ${preferenceBadgeHtml(re.exerciseId)}</div>
        <div class="mini">${esc(ex?.muscle||'')} · ${esc(patternLabel(ex?.pattern||''))} · ${esc(ex?.equipment||'')}</div>
        <div class="editor-summary">
          <span class="tag">${re.sets} sets</span>
          <span class="tag">${re.minReps}-${re.maxReps} reps</span>
          <span class="tag">+${re.increment} ${state.profile.unit}</span>
          <span class="tag">${re.setStructure?.type==='top_backoff'?`Top + ${re.setStructure.backoffSets||0} backoff @ ${re.setStructure.backoffPercent||90}%`:(re.mode==='range'||re.mode==='double')?'Double progression · +1/set':re.mode==='total'?'Beat total reps':'Manual'}</span>
          <span class="tag">${goalLabel(re.trainingGoal||'general')}</span>
          ${routineSupersetMeta(r,i)?`<span class="superset-badge">⚡ Superset ${routineSupersetMeta(r,i).label}</span>`:''}
        </div>
      </div>
      <span class="pickcount">#${i+1}</span>
    </div>
    <div class="routine-tools">
      <button class="btn small secondary" onclick="editRoutineExerciseSettings('${r.id}',${i})">⚙ Progression</button>
      <button class="btn small secondary" onclick="openRoutineSwap('${r.id}',${i})">⇄ Substitute</button>
      <button class="btn small secondary" onclick="openRoutineSupersetPicker('${r.id}',${i})">⚡ Superset</button>
      <button class="btn small secondary" onclick="duplicateRoutineExercise('${r.id}',${i})">Duplicate</button>
      <button class="btn small danger" onclick="removeRoutineExercise('${r.id}',${i})">Remove</button>
    </div>
   </div>`;
 }).join('')||'<div class="empty">No exercises in this routine yet.</div>';
}
function refreshRoutineEditor(id){
 const r=state.routines.find(x=>x.id===id),host=document.getElementById('routineEditorList');
 if(r&&host)host.innerHTML=routineEditorHtml(r);
}
function moveRoutineExercise(id,index,dir){
 const r=state.routines.find(x=>x.id===id); if(!r)return;
 const ni=index+dir; if(ni<0||ni>=r.exercises.length)return;
 [r.exercises[index],r.exercises[ni]]=[r.exercises[ni],r.exercises[index]];
 save();refreshRoutineEditor(id);
}
function duplicateRoutineExercise(id,index){
 const r=state.routines.find(x=>x.id===id); if(!r)return;
 const copy=JSON.parse(JSON.stringify(r.exercises[index]));copy.supersetGroup=null;
 r.exercises.splice(index+1,0,copy); save();refreshRoutineEditor(id);
}
function removeRoutineExercise(id,index){
 const r=state.routines.find(x=>x.id===id); if(!r)return;
 const ex=exById(r.exercises[index]?.exerciseId);
 if(!confirm(`Remove ${ex?.name||'this exercise'} from the routine? Your old workout history will stay saved.`))return;
 r.exercises.splice(index,1);cleanupRoutineSupersets(r); save();refreshRoutineEditor(id);
}
function editRoutineExerciseSettings(id,index){
 const r=state.routines.find(x=>x.id===id),re=r?.exercises[index]; if(!re)return;
 const ex=exById(re.exerciseId),topBackoff=re.setStructure?.type==='top_backoff',structure=re.setStructure||{};
 const structureFields=topBackoff?`
 <div class="notice">This exercise uses real top-set + backoff progression. Edit the two roles separately so saved set counts and live targets stay aligned.</div>
 <div class="form-grid three">
   <div><label>Top sets</label><input type="number" min="1" max="2" id="reTopSets" value="${Math.max(1,Number(structure.topSets)||1)}"></div>
   <div><label>Top min reps</label><input type="number" min="1" id="reTopMin" value="${Math.max(1,Number(structure.topMinReps)||re.minReps||3)}"></div>
   <div><label>Top max reps</label><input type="number" min="1" id="reTopMax" value="${Math.max(1,Number(structure.topMaxReps)||re.maxReps||5)}"></div>
 </div>
 <div class="form-grid three">
   <div><label>Backoff sets</label><input type="number" min="1" max="5" id="reBackoffSets" value="${Math.max(1,Number(structure.backoffSets)||2)}"></div>
   <div><label>Backoff min reps</label><input type="number" min="1" id="reBackoffMin" value="${Math.max(1,Number(structure.backoffMinReps)||re.minReps||5)}"></div>
   <div><label>Backoff max reps</label><input type="number" min="1" id="reBackoffMax" value="${Math.max(1,Number(structure.backoffMaxReps)||re.maxReps||8)}"></div>
 </div>
 <div class="field"><label>Backoff load (% of top set)</label><input type="number" min="70" max="97.5" step=".5" id="reBackoffPercent" value="${Math.max(70,Math.min(97.5,Number(structure.backoffPercent)||90))}"></div>
 `:`
 <div class="form-grid three">
   <div><label>Sets</label><input type="number" min="1" max="10" id="reSets" value="${re.sets}"></div>
   <div><label>Min reps</label><input type="number" id="reMin" value="${re.minReps}"></div>
   <div><label>Max reps</label><input type="number" id="reMax" value="${re.maxReps}"></div>
 </div>
 <div class="field"><label>Progression</label><select id="reMode">
   <option value="double" ${(re.mode==='range'||re.mode==='double')?'selected':''}>Double progression (+1 rep each set)</option>
   <option value="total" ${re.mode==='total'?'selected':''}>Beat total reps</option>
   <option value="manual" ${re.mode==='manual'?'selected':''}>Manual</option>
 </select></div>`;
 openModal(`${esc(ex?.name||'Exercise')} progression`,`
 ${structureFields}
 <div class="field"><label>Weight jump (${state.profile.unit})</label><input type="number" step=".5" id="reInc" value="${re.increment}"></div>
 <div class="form-grid">
   <div><label>Training goal</label><select id="reGoal">
    <option value="general" ${(re.trainingGoal||'general')==='general'?'selected':''}>General progression</option>
    <option value="hypertrophy" ${re.trainingGoal==='hypertrophy'?'selected':''}>Muscle growth</option>
    <option value="strength" ${re.trainingGoal==='strength'?'selected':''}>Strength</option>
   </select></div>
   <div><label>Reset suggestion</label><select id="reReset">
    <option value="5" ${Number(re.resetPercent||7.5)===5?'selected':''}>5%</option>
    <option value="7.5" ${Number(re.resetPercent||7.5)===7.5?'selected':''}>7.5%</option>
    <option value="10" ${Number(re.resetPercent||7.5)===10?'selected':''}>10%</option>
   </select></div>
 </div>
 <div class="field"><label>Rest seconds</label><input type="number" id="reRest" value="${re.restSeconds||120}"></div>
 <div class="notice">Goal changes how Coach interprets effort and stalls. It does not silently invent working weights.</div>
 <div class="actions"><button class="btn" onclick="saveRoutineExerciseSettings('${id}',${index})">Save</button><button class="btn secondary" onclick="editRoutineDetails('${id}')">Back</button></div>`);
}
function saveRoutineExerciseSettings(id,index){
 const r=state.routines.find(x=>x.id===id),re=r?.exercises[index]; if(!re)return;
 const topBackoff=re.setStructure?.type==='top_backoff'&&document.getElementById('reTopSets');
 if(topBackoff){
   const topSets=Math.max(1,Math.min(2,+document.getElementById('reTopSets').value||1));
   const topMin=Math.max(1,+document.getElementById('reTopMin').value||3);
   const topMax=Math.max(topMin,+document.getElementById('reTopMax').value||topMin);
   const backoffSets=Math.max(1,Math.min(5,+document.getElementById('reBackoffSets').value||2));
   const backoffMin=Math.max(1,+document.getElementById('reBackoffMin').value||5);
   const backoffMax=Math.max(backoffMin,+document.getElementById('reBackoffMax').value||backoffMin);
   const backoffPercent=Math.max(70,Math.min(97.5,+document.getElementById('reBackoffPercent').value||90));
   re.sets=topSets+backoffSets;
   re.minReps=Math.min(topMin,backoffMin);
   re.maxReps=Math.max(topMax,backoffMax);
   re.mode='double';
   re.progressionStrategy='top_backoff';
   re.setStructure={...re.setStructure,type:'top_backoff',topSets,backoffSets,backoffPercent,topMinReps:topMin,topMaxReps:topMax,backoffMinReps:backoffMin,backoffMaxReps:backoffMax};
 }else{
   re.sets=Math.max(1,+document.getElementById('reSets').value||3);
   re.minReps=Math.max(1,+document.getElementById('reMin').value||8);
   re.maxReps=Math.max(re.minReps,+document.getElementById('reMax').value||12);
   re.mode=document.getElementById('reMode').value;
 }
 re.increment=Math.max(0,+document.getElementById('reInc').value||0);
 re.trainingGoal=document.getElementById('reGoal').value;
 re.resetPercent=+document.getElementById('reReset').value||7.5;
 re.restSeconds=Math.max(15,+document.getElementById('reRest').value||120);
 save();editRoutineDetails(id);
}
function openRoutineSwap(id,index){
 const r=state.routines.find(x=>x.id===id),re=r?.exercises[index];if(!re)return;
 const current=exById(re.exerciseId);
 openModal(`Substitute ${esc(current?.name||'exercise')}`,`
   <div class="notice">Matches prioritize movement pattern and primary muscle, then your exercise preferences. Preferred and favorite movements rise, Avoid moves down, and Hidden exercises stay out of suggestions.</div>
   <div style="margin:12px 0"><input id="routineSwapSearch" placeholder="Search visible exercises..." oninput="refreshRoutineSwap('${id}',${index})"></div>
   <div id="routineSwapList" class="picker-result-list">${routineSwapRows(id,index)}</div>
   <div class="actions"><button class="btn secondary" onclick="editRoutineDetails('${id}')">Back</button></div>
 `);
}
function routineSwapRows(id,index,query=''){
 const r=state.routines.find(x=>x.id===id),re=r?.exercises?.[index];if(!re)return '';
 const cur=exById(re.exerciseId);
 return recommendedSubs(re.exerciseId,query).slice(0,query?60:14).map(({x})=>`<div class="picker-result-card">
   <div class="picker-result-main">
     <button class="favbtn ${isFavorite(x.id)?'on':''}" onclick="toggleFavorite('${x.id}');refreshRoutineSwap('${id}',${index})">${isFavorite(x.id)?'★':'☆'}</button>
     <div class="iconbox">${catExerciseThumbnail(x)}</div>
     <div class="picker-result-copy"><div class="exercise-name">${esc(x.name)} ${preferenceBadgeHtml(x.id)}</div><div class="mini">${esc(x.muscle)} · ${esc(patternLabel(x.pattern))} · ${esc(x.equipment)}<br>${esc(substitutionReason(cur,x))}</div></div>
   </div>
   <div class="picker-result-actions one"><button class="btn small" onclick="applyRoutineSwap('${id}',${index},'${x.id}')">Use</button></div>
 </div>`).join('')||'<div class="empty">No matching visible exercises.</div>';
}
function refreshRoutineSwap(id,index){
 const q=document.getElementById('routineSwapSearch')?.value||'';
 const host=document.getElementById('routineSwapList');if(host)host.innerHTML=routineSwapRows(id,index,q);
}
function applyRoutineSwap(id,index,newExerciseId){
 const r=state.routines.find(x=>x.id===id);if(!r)return;
 r.exercises[index].exerciseId=newExerciseId;save();editRoutineDetails(id);
}
function openRoutineExerciseAdder(id){
 routinePickerSelection=new Set(); routinePickerCategory='home';routinePickerMovement='';
 openModal('Add exercise to routine',`
 <div class="picker-tools"><input id="routineExSearch" placeholder="Search exercise, muscle, equipment..." oninput="renderRoutinePickerAdder('${id}')"></div>
 <div id="routinePicker" style="max-height:58vh;overflow:auto"></div>
 <div class="actions"><button class="btn" onclick="appendSelectedRoutineExercises('${id}')">Add selected</button><button class="btn secondary" onclick="editRoutineDetails('${id}')">Back</button></div>`);
 renderRoutinePickerAdder(id);
}
function renderRoutinePickerAdder(id){
 const host=document.getElementById('routinePicker');if(!host)return;
 const q=(document.getElementById('routineExSearch')?.value||'').trim();
 const rows=items=>sortExerciseChoices(items.filter(x=>!isHiddenExercise(x.id))).map(x=>`<div class="list-item">
   <button class="favbtn ${isFavorite(x.id)?'on':''}" onclick="toggleFavorite('${x.id}')">${isFavorite(x.id)?'★':'☆'}</button>
   <div class="iconbox">${catExerciseThumbnail(x)}</div>
   <div class="grow"><div class="exercise-name">${esc(x.name)} ${preferenceBadgeHtml(x.id)}</div><div class="mini">${esc(x.muscle)} · ${esc(patternLabel(x.pattern))} · ${esc(x.equipment)}</div></div>
   <input type="checkbox" ${routinePickerSelection.has(x.id)?'checked':''} onchange="this.checked?routinePickerSelection.add('${x.id}'):routinePickerSelection.delete('${x.id}')" style="width:22px;height:22px">
 </div>`).join('');
 if(q){host.innerHTML=`<div class="card">${rows(visibleExercises().filter(x=>exerciseMatchesSearch(x,q)).slice(0,100))}</div>`;return}
 const fav=visibleExercises().filter(x=>isFavorite(x.id));
 const preferred=visibleExercises().filter(x=>exercisePreference(x.id)==='prefer'&&!isFavorite(x.id));
 const recent=recentExerciseIds().map(exById).filter(x=>x&&!isHiddenExercise(x.id));
 host.innerHTML=`${fav.length?`<div class="picker-section">★ Favorites</div><div class="card">${rows(fav)}</div>`:''}
 ${preferred.length?`<div class="picker-section">↑ Preferred</div><div class="card">${rows(preferred.slice(0,12))}</div>`:''}
 ${recent.length?`<div class="picker-section">↺ Recently used</div><div class="card">${rows(recent.slice(0,10))}</div>`:''}
 <div class="picker-section">Browse by muscle group</div><div class="category-grid">${muscleCategories().map(c=>`<button class="category-card" onclick="addRoutineCategoryView('${id}','${escAttr(c.name)}')"><b>${categoryIcon(c.name)} ${esc(c.name)}</b><span>${c.count} exercises</span></button>`).join('')}</div>`;
}
function addRoutineCategoryView(id,cat){
 const host=document.getElementById('routinePicker'),items=sortExerciseChoices(visibleExercises().filter(x=>x.muscle===cat));
 const rows=items.map(x=>`<div class="list-item"><button class="favbtn ${isFavorite(x.id)?'on':''}" onclick="toggleFavorite('${x.id}')">${isFavorite(x.id)?'★':'☆'}</button><div class="iconbox">${catExerciseThumbnail(x)}</div><div class="grow"><div class="exercise-name">${esc(x.name)} ${preferenceBadgeHtml(x.id)}</div><div class="mini">${esc(patternLabel(x.pattern))} · ${esc(x.equipment)}</div></div><input type="checkbox" ${routinePickerSelection.has(x.id)?'checked':''} onchange="this.checked?routinePickerSelection.add('${x.id}'):routinePickerSelection.delete('${x.id}')" style="width:22px;height:22px"></div>`).join('');
 host.innerHTML=`<div class="breadcrumb"><button onclick="renderRoutinePickerAdder('${id}')">All categories</button><span>›</span><b>${esc(cat)}</b></div><div class="card">${rows}</div>`;
}
function appendSelectedRoutineExercises(id){
 const r=state.routines.find(x=>x.id===id); if(!r)return;
 for(const exerciseId of routinePickerSelection){
   r.exercises.push({exerciseId,sets:state.settings.defaultSets,minReps:state.settings.defaultMin,maxReps:state.settings.defaultMax,increment:state.settings.defaultIncrement,mode:'double',trainingGoal:'general',resetPercent:7.5,restSeconds:120});
 }
 save(); editRoutineDetails(id);
}
function saveRoutineMeta(id){
 const r=state.routines.find(x=>x.id===id);if(!r)return;
 const name=document.getElementById('routineEditorName');
 const description=document.getElementById('routineEditorDescription');
 const trainingMode=document.getElementById('routineEditorTrainingMode');
 if(name)r.name=name.value.trim()||'Untitled Workout';
 if(description)r.description=description.value.trim();
 if(trainingMode)r.trainingMode=normalizeTrainingMode(trainingMode.value);
 save();
}
function uniqueRoutineName(sourceName){
 const base=(sourceName||'Untitled Workout').trim()||'Untitled Workout';
 let candidate=base+' Copy',n=2;
 while(state.routines.some(r=>r.name.toLowerCase()===candidate.toLowerCase()))candidate=base+' Copy '+n++;
 return candidate;
}
function duplicateRoutine(id){
 saveRoutineMeta(id);
 const source=state.routines.find(x=>x.id===id);if(!source)return;
 const copy=JSON.parse(JSON.stringify(source));
 copy.id=uid();
 copy.name=uniqueRoutineName(source.name);
 state.routines.push(copy);
 save();closeModal();renderRoutines();renderHome();
 showToast('Created '+copy.name);
}
function updateRoutineModeHelp(mode){const el=document.getElementById('routineModeHelp');if(el)el.textContent=trainingModeDescription(mode)}
function saveRoutineEditor(id){saveRoutineMeta(id);closeModal();renderRoutines();renderHome();}

function openRoutine(id,programId=null){
 const r=state.routines.find(x=>x.id===id);if(!r)return;
 if(routineIsArchived(r)){showToast('Restore this routine before starting it');return}
 if(state.activeWorkout){
   if(state.activeWorkout.routineId===id){resumeActiveWorkout();return}
   const ac=activeWorkoutCounts();
   openModal('Workout already active',`
    <div class="notice"><b>${esc(state.activeWorkout.routineName)}</b> is still active with ${ac.done} of ${ac.total} sets completed. Your entries are saved locally. Starting another routine will not overwrite it unless you explicitly discard it.</div>
    <div class="actions">
      <button class="btn green" onclick="closeModal();resumeActiveWorkout()">Resume ${esc(state.activeWorkout.routineName)}</button>
      <button class="btn danger" onclick="discardActiveAndStart('${id}',${programId?`'${programId}'`:'null'})">Discard active & start ${esc(r.name)}</button>
      <button class="btn secondary" onclick="closeModal()">Keep browsing</button>
    </div>`);
   return;
 }
 startRoutineFresh(id,programId);
}