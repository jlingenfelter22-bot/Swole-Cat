function previousExercise(exerciseId){return derivedSessionData().previousByExercise.get(exerciseId);}
function setType(set){return ['working','warmup','drop','failure'].includes(set?.type)?set.type:'working'}
function isProgressionSet(set){return setType(set)==='working'}
function completedSets(prev){return (prev?.sets||[]).filter(s=>s.done && Number(s.weight)>=0 && Number(s.reps)>0)}
function progressionSets(prev){return completedSets(prev).filter(isProgressionSet)}
function workingSetIndexes(e){return (e?.sets||[]).map((s,i)=>isProgressionSet(s)?i:-1).filter(i=>i>=0)}
function workingSetOrdinal(e,si){
 const indexes=workingSetIndexes(e),pos=indexes.indexOf(si);
 return pos>=0?pos:Math.max(0,indexes.filter(i=>i<si).length);
}
function firstWorkingSetIndex(e){const a=workingSetIndexes(e);return a.length?a[0]:0}
function setTypeLabel(type){
 return type==='warmup'?'Warm-up':type==='drop'?'Drop set':type==='failure'?'Failure':'Working';
}
function finiteNumber(value,fallback=0){
 const n=Number(value);
 return Number.isFinite(n)?n:fallback;
}
function distributeTarget(previousReps,minReps,maxReps,setCount){
 // "Beat total reps" mode: add one rep somewhere across the exercise.
 const reps=Array.from({length:setCount},(_,i)=>Math.max(minReps,Math.min(maxReps,finiteNumber(previousReps[i],minReps))));
 for(let i=0;i<reps.length;i++){ if(reps[i]<maxReps){ reps[i]++; break; } }
 return reps;
}
function progressEverySetTarget(previousReps,minReps,maxReps,setCount){
 // Default double progression: every programmed set gets +1 rep next exposure,
 // capped at the top of the rep range.
 return Array.from({length:setCount},(_,i)=>{
   const previous=Math.max(minReps-1,finiteNumber(previousReps[i],minReps-1));
   return Math.min(maxReps,Math.max(minReps,previous+1));
 });
}

function normalizeTrainingMode(mode){return ['guided','strength','track'].includes(mode)?mode:'guided'}
function trainingModeLabel(mode){
 mode=normalizeTrainingMode(mode);
 return mode==='strength'?'Strength Focus':mode==='track'?'Track Only':'Guided Overload';
}
function normalizeProgramTrainingMode(mode){return ['inherit','guided','strength','track'].includes(mode)?mode:'inherit'}
function programTrainingModeLabel(mode){mode=normalizeProgramTrainingMode(mode);return mode==='inherit'?'Use routine modes':trainingModeLabel(mode)}
function trainingModeDescription(mode){
 mode=normalizeTrainingMode(mode);
 if(mode==='strength')return 'Load-priority progression. After you complete the programmed minimum reps across all working sets, Swole Cat can move the configured weight step next time.';
 if(mode==='track')return 'Log what you do without automatic progression targets or coach pressure. Previous numbers are carried forward only as a reference.';
 return 'Rep-first double progression. Build reps through the programmed range, then add the configured weight step after all working sets reach the top.';
}
function goalLabel(goal){
 return goal==='strength'?'Strength':goal==='hypertrophy'?'Muscle growth':'General';
}
function goalRIRText(goal){
 return goal==='hypertrophy'?'Usually aim to finish hard working sets with roughly 1-3 reps in reserve.':
        goal==='strength'?'Quality reps matter more than grinding. Strength can progress without taking every set close to failure.':
        'Use the rep target as the main guide and RIR as optional context.';
}
function averageLoggedRIR(sets){
 const vals=(sets||[]).map(s=>s.rir).filter(v=>v!==''&&v!=null&&Number.isFinite(Number(v))).map(Number);
 return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
}
function recentExerciseSessions(exerciseId,n=4){
 return exerciseHistory(exerciseId).slice(-n);
}
function coachSignal(exerciseId,config){
 if(normalizeTrainingMode(config.routineMode)==='track')return null;
 const hist=recentExerciseSessions(exerciseId,4);
 if(hist.length<2)return {level:'info',title:'Building baseline',text:`Keep logging this movement. The coach waits for repeated sessions before calling anything a stall.`,stalled:false,canReset:false};
 const scores=hist.map(h=>({
   e1:Math.max(...h.sets.map(s=>estimated1RM(s.weight,s.reps))),
   reps:h.sets.reduce((a,s)=>a+Number(s.reps||0),0),
   avgRIR:averageLoggedRIR(h.sets),
   weight:Math.max(...h.sets.map(s=>Number(s.weight)||0))
 }));
 const latest=scores.at(-1),prev=scores.at(-2);
 const first=scores[0];
 const gain=(latest.e1-first.e1)/Math.max(1,first.e1);
 const recentGain=(latest.e1-prev.e1)/Math.max(1,prev.e1);
 const highEffort=[...scores].reverse().find(x=>x.avgRIR!=null)?.avgRIR;
 const sameLoadish=Math.abs(latest.weight-first.weight)<=Math.max(.5,Number(config.increment||5));
 const enoughForStall=hist.length>=3;
 const stalled=enoughForStall && sameLoadish && gain<0.012 && latest.reps<=Math.max(...scores.slice(0,-1).map(x=>x.reps))+1;
 const regressing=enoughForStall && recentGain<-0.04 && gain<-0.02;
 const highEffortKnown=highEffort!=null && highEffort<=1;
 const resetPercent=Number(config.resetPercent||7.5);
 const resetWeight=roundLoad(latest.weight*(1-resetPercent/100));
 if(regressing && highEffortKnown){
   return {level:'reset',title:'Repeated hard-session drop',text:`Recent performance is down and your latest logged effort was very high. Consider a ${resetPercent}% session-only reset to ${resetWeight} ${state.profile.unit}, then rebuild.`,stalled:true,canReset:true,resetWeight,resetPercent};
 }
 if(stalled && highEffortKnown){
   return {level:'reset',title:'Stall detected',text:`Performance has been essentially flat across ${hist.length} exposures while effort is high. A small ${resetPercent}% reset is available, or you can keep the current load and try again.`,stalled:true,canReset:true,resetWeight,resetPercent};
 }
 if(stalled){
   return {level:'watch',title:'Holding pattern',text:`Progress has been flat across ${hist.length} exposures, but there isn't enough evidence of excessive effort to force a reset. Hold the plan, improve execution, or override the target if needed.`,stalled:true,canReset:false};
 }
 if(recentGain>0.015){
   return {level:'good',title:'Progressing',text:`Your recent estimated strength trend is moving up. Keep the current progression rules unless the sets feel meaningfully different than the log suggests.`,stalled:false,canReset:false};
 }
 return {level:'info',title:'On track',text:goalRIRText(config.trainingGoal||'general'),stalled:false,canReset:false};
}
function workoutCoachSignal(){
 const w=state.activeWorkout;if(!w)return null;
 const signals=w.exercises.filter(e=>!e.skipped).map(e=>coachSignal(e.exerciseId,e.config)).filter(Boolean);
 const reset=signals.filter(x=>x.canReset).length,stalls=signals.filter(x=>x.stalled).length;
 if(reset>=2)return {level:'reset',text:`${reset} exercises are showing repeated high-effort stalls. A lighter session may be worth considering, but it is optional.`};
 if(stalls>=3)return {level:'watch',text:`Several movements are flat right now. That can happen normally. Watch the next session before making large changes.`};
 return null;
}
function applyCoachReset(ei){
 const e=state.activeWorkout.exercises[ei],sig=coachSignal(e.exerciseId,e.config);
 if(!sig.canReset)return;
 e.targetOverride={weight:sig.resetWeight,reps:e.config.minReps,reason:`Coach reset ${sig.resetPercent}%`};
 e.sets.forEach(s=>{if(!s.done&&isProgressionSet(s)){s.weight=sig.resetWeight;s.reps=e.config.minReps;}});
 saveActiveWorkout();renderWorkout();
}
function openTargetOverride(ei){
 const e=state.activeWorkout.exercises[ei],prev=previousExercise(e.exerciseId),t=liveSetTarget(e,firstWorkingSetIndex(e),prev);
 openModal('Override session target',`
 <div class="notice">This changes the target for this workout only. It does not rewrite your routine or old history.</div>
 <div class="form-grid" style="margin-top:12px">
   <div><label>Target weight (${state.profile.unit})</label><input id="ovWeight" type="number" step=".25" value="${e.targetOverride?.weight??t.weight}"></div>
   <div><label>Target reps</label><input id="ovReps" type="number" min="1" value="${e.targetOverride?.reps??t.reps}"></div>
 </div>
 <div class="actions"><button class="btn" onclick="saveTargetOverride(${ei})">Use for this session</button>${e.targetOverride?`<button class="btn secondary" onclick="clearTargetOverride(${ei})">Clear override</button>`:''}<button class="btn secondary" onclick="closeModal()">Cancel</button></div>`);
}
function saveTargetOverride(ei){
 const e=state.activeWorkout.exercises[ei],weight=Math.max(0,+document.getElementById('ovWeight').value||0),reps=Math.max(1,+document.getElementById('ovReps').value||1);
 e.targetOverride={weight:roundLoad(weight),reps:Math.round(reps),reason:'Manual override'};
 e.sets.forEach(s=>{if(!s.done&&isProgressionSet(s)){s.weight=e.targetOverride.weight;s.reps=e.targetOverride.reps;}});
 saveActiveWorkout();closeModal();renderWorkout();
}
function clearTargetOverride(ei){
 const e=state.activeWorkout.exercises[ei];e.targetOverride=null;
 const prev=previousExercise(e.exerciseId),rec=buildRecommendation(e.config,prev,e.exerciseId);
 let wi=0;e.sets.forEach(s=>{if(!isProgressionSet(s))return;if(!s.done){s.weight=rec.weights?.[wi]??rec.weight??0;s.reps=rec.targetReps?.[wi]??e.config.minReps;}wi++;});
 saveActiveWorkout();closeModal();renderWorkout();
}
function applyLightSession(){
 const w=state.activeWorkout;if(!w)return;
 w.exercises.forEach(e=>{
   const prev=previousExercise(e.exerciseId),base=liveSetTarget(e,firstWorkingSetIndex(e),prev);
   const wt=roundLoad(base.weight*.925);
   e.targetOverride={weight:wt,reps:e.config.minReps,reason:'Light session'};
   e.sets.forEach(s=>{if(!s.done&&isProgressionSet(s)){s.weight=wt;s.reps=e.config.minReps;}});
 });
 saveActiveWorkout();renderWorkout();
}

function buildRecommendation(config,prev,exerciseId=null){
 const done=progressionSets(prev);
 const goal=config.trainingGoal||'general';
 const routineMode=normalizeTrainingMode(config.routineMode);
 const avgRIR=averageLoggedRIR(done);
 if(routineMode!=='track'&&typeof coachAdaptiveRecommendation==='function'){
   const adaptive=coachAdaptiveRecommendation(config,prev,exerciseId);
   if(adaptive)return adaptive;
 }
 if(!done.length){
   const mode=normalizeTrainingMode(config.routineMode);
   const headline=mode==='track'?'Log your starting sets':mode==='strength'?'Choose a strength starting load':'Set your starting weight';
   const detail=mode==='track'?`No automatic progression target is active. Log the weight and reps you actually perform.`:mode==='strength'?`Choose a controlled load you can perform for at least ${config.minReps} clean reps across the programmed sets. Once the minimum is established, Strength Focus can prioritize small load increases.`:`Choose a clean starting load for about ${config.minReps}-${config.maxReps} reps. ${goalRIRText(goal)}`;
   return {status:'baseline',weight:0,weights:Array(config.sets).fill(0),targetReps:Array(config.sets).fill(config.minReps),headline,detail};
 }
 const weights=done.map(s=>Math.max(0,finiteNumber(s.weight,0)));
 const reps=done.map(s=>Math.max(0,finiteNumber(s.reps,0)));
 const sameWeight=weights.every(w=>w===weights[0]);
 const baseWeight=weights[0]||0;
 const total=reps.reduce((a,b)=>a+b,0);
 if(routineMode==='track'){
   return {status:'track',weight:baseWeight,weights:Array.from({length:config.sets},(_,i)=>weights[i]??baseWeight),targetReps:Array.from({length:config.sets},(_,i)=>reps[i]??config.minReps),headline:'Track your working sets',detail:`Previous session: ${done.map(s=>`${s.weight}×${s.reps}`).join(' · ')}. No automatic progression target is active for this routine.`};
 }
 if(routineMode==='strength'){
   const enoughSets=done.length>=config.sets;
   const completedMinimum=enoughSets&&done.slice(0,config.sets).every(s=>finiteNumber(s.reps,0)>=config.minReps);
   const inc=Math.max(0,finiteNumber(config.increment,0));
   if(completedMinimum&&inc>0){
     const nextWeights=Array.from({length:config.sets},(_,i)=>roundLoad((weights[i]??baseWeight)+inc));
     return {status:'load',weight:nextWeights[0]||0,weights:nextWeights,targetReps:Array(config.sets).fill(config.minReps),headline:`Add ${inc} ${state.profile.unit} next time`,detail:`You completed at least ${config.minReps} reps across all programmed working sets. Strength Focus prioritizes a small load increase, then asks you to re-establish the bottom of the rep range.`};
   }
   const holdWeights=Array.from({length:config.sets},(_,i)=>weights[i]??baseWeight);
   return {status:'hold',weight:baseWeight,weights:holdWeights,targetReps:Array(config.sets).fill(config.minReps),headline:`Hold the load and own ${config.minReps}+ reps`,detail:`Strength Focus is load-priority. Keep the current working weights until every programmed set reaches at least ${config.minReps} clean reps, then the configured load step becomes available.`};
 }
 if(config.mode==='manual'){
   return {status:'manual',weight:baseWeight,weights:Array.from({length:config.sets},(_,i)=>weights[i]??baseWeight),targetReps:Array.from({length:config.sets},(_,i)=>reps[i]??config.minReps),
     headline:'Repeat or adjust manually',detail:`Last session: ${done.map(s=>`${s.weight}×${s.reps}`).join(' · ')}`};
 }
 if(config.mode==='total'){
   const target=distributeTarget(reps,config.minReps,config.maxReps,config.sets);
   return {status:'reps',weight:baseWeight,weights:Array(config.sets).fill(baseWeight),targetReps:target,
     headline:`Beat ${total} total reps at ${baseWeight} ${state.profile.unit}`,detail:`Keep the same load. A one-rep improvement anywhere counts as progress.`};
 }
 // Double progression: add one rep to every programmed set on the next exposure, capped at the top of the rep range. Add load only after every set reaches the top of the range at one stable weight.
 const enoughSets=done.length>=config.sets;
 const allTop=enoughSets && done.slice(0,config.sets).every(s=>finiteNumber(s.reps,0)>=config.maxReps);
 if(sameWeight && allTop){
   const next=roundLoad(baseWeight+finiteNumber(config.increment,0));
   return {status:'load',weight:next,weights:Array(config.sets).fill(next),targetReps:Array(config.sets).fill(config.minReps),
     headline:`Increase to ${next} ${state.profile.unit}`,detail:`You earned one configured load step after reaching the top of the rep range across all working sets. ${goalRIRText(goal)}`};
 }
 const target=progressEverySetTarget(reps,config.minReps,config.maxReps,config.sets);
 const nextWeights=Array.from({length:config.sets},(_,i)=>weights[i]??baseWeight);
 const headline=sameWeight
   ?`Stay at ${baseWeight} ${state.profile.unit} and add 1 rep to each set`
   :'Add 1 rep to each working set';
 return {status:'reps',weight:baseWeight,weights:nextWeights,targetReps:target,
   headline,
   detail:`Last session: ${done.map(s=>`${s.weight}×${s.reps}`).join(' · ')}. Next target: ${target.map((r,i)=>`${nextWeights[i]??baseWeight}×${r}`).join(' · ')}. Each set progresses by one rep until all ${config.sets} sets reach ${config.maxReps}, then the load increases by your configured increment. RIR remains optional context and never blocks a rep-range progression step. ${goalRIRText(goal)}`};
}
function roundLoad(n){return Math.round(Number(n)*4)/4}

function setReference(prev,workingIndex){
 const done=progressionSets(prev),s=done[workingIndex]||done[done.length-1];
 return s?`${s.weight} ${state.profile.unit} × ${s.reps}${s.rir!==''&&s.rir!=null?` @${s.rir} RIR`:''}`:'No prior set';
}
function liveSetTarget(e,si,prev){
 const current=e.sets?.[si],type=setType(current);
 if(type!=='working')return {weight:roundLoad(Number(current?.weight)||0),reps:Math.max(1,Number(current?.reps)||e.config.minReps)};
 const wi=workingSetOrdinal(e,si);
 if(e.targetOverride)return {weight:roundLoad(e.targetOverride.weight),reps:Math.max(1,Number(e.targetOverride.reps)||e.config.minReps)};
 const base=buildRecommendation(e.config,prev,e.exerciseId);
 if(normalizeTrainingMode(e.config.routineMode)==='track')return {weight:roundLoad(Number(current?.weight??base.weights?.[wi]??base.weight??0)),reps:Math.max(1,Number(current?.reps??base.targetReps?.[wi]??e.config.minReps))};
 let weight=Number(base.weights?.[wi]??base.weight??current?.weight??0);
 let reps=Number(base.targetReps?.[wi]??e.config.minReps);
 const roleRange=typeof coachAdaptiveSetRepRange==='function'
   ?coachAdaptiveSetRepRange(e.config,wi)
   :{min:e.config.minReps,max:e.config.maxReps};
 const earlier=e.sets.slice(0,si).filter(s=>s.done&&isProgressionSet(s));
 if(earlier.length){
   const last=earlier[earlier.length-1];
   const prevWi=Math.max(0,wi-1);
   const expected=Number(base.targetReps?.[Math.min(prevWi,(base.targetReps?.length||1)-1)]??reps);
   const miss=Number(last.reps)-expected;
   if(miss<=-2) reps=Math.max(Math.max(1,roleRange.min-2),reps-1);
   else if(miss>=2) reps=Math.min(roleRange.max,reps+1);
   if(last.rir!=='' && Number(last.rir)===0) reps=Math.max(Math.max(1,roleRange.min-2),reps-1);
 }
 // Strong in-session performance can adjust a target inside the programmed
 // range, but Coach never prescribes reps above that role's saved ceiling.
 // The user can still manually log whatever they actually perform.
 reps=Math.min(roleRange.max,reps);
 return {weight:roundLoad(weight),reps:Math.max(1,reps)};
}
function smartNumberFocus(el){
 requestAnimationFrame(()=>{try{el.select();}catch(e){}});
}
function displaySetWeightValue(value){
 const n=Number(value);
 return n>0?n:'';
}
function targetBadgeText(target,ex){
 const wt=Number(target?.weight)||0,reps=Math.max(1,Number(target?.reps)||1);
 if(wt<=0){
   return ex?.equipment==='bodyweight'?`Bodyweight · ${reps} reps`:`Choose weight · ${reps} reps`;
 }
 return `Target ${wt} × ${reps}`;
}

function changeSetValue(ei,si,key,delta){
 const set=state.activeWorkout?.exercises?.[ei]?.sets?.[si];if(!set)return;
 let v=Number(set[key])||0;
 v=Math.max(0,roundLoad(v+delta));
 set[key]=key==='reps'?Math.round(v):v;
 if(key!=='rir')set.pr='';
 const card=document.querySelector(`#workoutExercise-${ei} .set-card[data-set-index="${si}"]`);
 const input=card?.querySelector(`input[aria-label="${key}"]`);
 if(input)input.value=key==='weight'?displaySetWeightValue(set[key]):set[key];
 haptic(8);saveActiveWorkout(true);
 if(key==='weight')scheduleFirstExerciseWeightAutofill(ei,si,120);
}
function workoutCounts(){return activeWorkoutCounts()}
function workoutElapsedMs(w=state.activeWorkout,nowMs=Date.now()){
 if(!w)return 0;
 const startMs=new Date(w.startDate).getTime();
 if(!Number.isFinite(startMs))return 0;
 let pausedMs=Math.max(0,Number(w.pausedDurationMs)||0);
 if(w.pausedAt){
   const currentPauseStart=new Date(w.pausedAt).getTime();
   if(Number.isFinite(currentPauseStart))pausedMs+=Math.max(0,nowMs-currentPauseStart);
 }
 return Math.max(0,nowMs-startMs-pausedMs);
}
function workoutElapsed(){
 const mins=Math.max(0,Math.floor(workoutElapsedMs()/60000));
 return mins<60?`${mins}m`:`${Math.floor(mins/60)}h ${mins%60}m`;
}
function estimated1RM(weight,reps){
 weight=Number(weight)||0;reps=Number(reps)||0;
 if(weight<=0||reps<=0)return 0;
 return weight*(1+Math.min(reps,15)/30);
}
function detectPR(exerciseId,set){
 if(!isProgressionSet(set))return '';
 const prior=[];
 state.sessions.forEach(s=>s.exercises.forEach(e=>{
   if(e.exerciseId===exerciseId)progressionSets(e).forEach(x=>prior.push(x));
 }));
 // Include earlier completed working sets from the current active workout, but not the
 // set currently being evaluated. This prevents duplicate PR badges when
 // multiple sets tie the same newly achieved record in one session.
 if(state.activeWorkout){
   state.activeWorkout.exercises.forEach(e=>{
     if(e.exerciseId===exerciseId)progressionSets(e).forEach(x=>{if(x!==set)prior.push(x)});
   });
 }
 // A first-ever logged performance establishes the baseline. It is not counted
 // as a PR until a future performance actually beats it.
 if(!prior.length)return '';
 const w=Number(set.weight)||0,r=Number(set.reps)||0;
 const maxWeight=Math.max(...prior.map(x=>Number(x.weight)||0));
 const sameWeightMax=Math.max(0,...prior.filter(x=>Number(x.weight)===w).map(x=>Number(x.reps)||0));
 const priorE1=Math.max(0,...prior.map(x=>estimated1RM(x.weight,x.reps)));
 const curE1=estimated1RM(w,r);
 if(w>maxWeight)return `Load PR: ${w} ${state.profile.unit}`;
 if(r>sameWeightMax)return `Rep PR: ${w} ${state.profile.unit} × ${r}`;
 if(curE1>priorE1*1.01)return `Estimated strength PR`;
 return '';
}
function plateLoadText(weight,ex){
 if(!ex || !['barbell','trap bar'].includes(ex.equipment) || Number(weight)<=0)return '';
 const kg=state.profile.unit==='kg',bar=kg?20:45,plates=kg?[25,20,15,10,5,2.5,1.25]:[45,35,25,10,5,2.5];
 let side=(Number(weight)-bar)/2;
 if(side<0)return '';
 const used=[];
 for(const plate of plates){
   const count=Math.floor((side+1e-9)/plate);
   for(let i=0;i<count;i++){used.push(plate);side-=plate;}
 }
 if(side>0.26)return '';
 return used.length?`Per side: ${used.join(' + ')} ${state.profile.unit}`:`Bar only (${bar} ${state.profile.unit})`;
}
function warmupGuide(weight,ex){
 const compound=['horizontal_press','incline_press','vertical_press','horizontal_pull','squat','hinge','lunge'];
 if(!ex||!compound.includes(ex.pattern)||Number(weight)<=0)return [];
 const inc=state.profile.unit==='kg'?2.5:5;
 const round=x=>Math.max(0,Math.round(x/inc)*inc);
 const w=Number(weight);
 return [
   {weight:round(w*.4),reps:8},
   {weight:round(w*.6),reps:5},
   {weight:round(w*.8),reps:3}
 ].filter((x,i,a)=>x.weight>0 && (i===0||x.weight!==a[i-1].weight) && x.weight<w);
}
function openWarmupGuide(ei){
 const e=state.activeWorkout.exercises[ei],ex=exById(e.exerciseId),prev=previousExercise(e.exerciseId),t=liveSetTarget(e,firstWorkingSetIndex(e),prev),sets=warmupGuide(t.weight,ex);
 openModal(`${esc(ex?.name||'Exercise')} warm-up`,sets.length?`
 <div class="notice">Optional ramp-up sets before your working sets. Adjust or skip them based on how you feel and how heavy the working weight is.</div>
 <div class="card" style="margin-top:12px">${sets.map((s,i)=>`<div class="list-item"><div class="setnum">${i+1}</div><div class="grow"><b>${s.weight} ${state.profile.unit} × ${s.reps}</b><div class="mini">${plateLoadText(s.weight,ex)}</div></div></div>`).join('')}</div>
 <div class="actions"><button class="btn" onclick="addSuggestedWarmups(${ei})">Add these warm-up sets</button><button class="btn secondary" onclick="closeModal()">Just view</button></div>`:`<div class="empty">No warm-up ramp is needed from the current target.</div>`);
}

function setTypeOptions(type){
 return [['working','Working'],['warmup','Warm-up'],['drop','Drop'],['failure','Failure']].map(([v,label])=>`<option value="${v}" ${setType({type})===v?'selected':''}>${label}</option>`).join('');
}
function setDisplayLabel(e,si){
 const set=e.sets[si],type=setType(set);
 const peers=e.sets.slice(0,si+1).filter(s=>setType(s)===type).length;
 if(type==='working'&&set?.role==='top')return `Top Set${set.amrap?' · AMRAP':''}`;
 if(type==='working'&&set?.role==='backoff'){
   const n=e.sets.slice(0,si+1).filter(s=>setType(s)==='working'&&s.role==='backoff').length;
   return `Backoff ${n}${set.amrap?' · AMRAP':''}`;
 }
 return type==='working'?`Set ${peers}${set?.amrap?' · AMRAP':''}`:`${setTypeLabel(type)} ${peers}`;
}
function setProgressionNote(type){
 if(type==='warmup')return 'Warm-up set · saved to history and volume, ignored by progression and PRs.';
 if(type==='drop')return 'Drop set · saved to history and volume, ignored by progression and PRs.';
 if(type==='failure')return 'Failure set · saved to history and volume, ignored by progression and PRs.';
 return '';
}
function setWorkoutSetType(ei,si,type){
 const e=state.activeWorkout?.exercises?.[ei],set=e?.sets?.[si];if(!set)return;
 if(!['working','warmup','drop','failure'].includes(type))type='working';
 if(isProgressionSet(set)&&type!=='working'&&workingSetIndexes(e).length<=1){
   showToast('Keep at least one working set');renderWorkout();return;
 }
 const oldType=setType(set);
 set.type=type;
 if(type==='working'&&typeof coachAdaptiveSetRole==='function')set.role=coachAdaptiveSetRole(e.config,workingSetOrdinal(e,si));
 else if(type!=='working')delete set.role;
 set.pr=type==='working'&&set.done?detectPR(e.exerciseId,set):'';
 if((oldType==='working')!==(type==='working'))markWorkoutStructureDirty();else saveActiveWorkout();
 renderWorkout();
}
function addWorkoutSet(ei,type='working'){
 const w=state.activeWorkout,e=w&&w.exercises&&w.exercises[ei];if(!e)return;
 type=['working','warmup','drop','failure'].includes(type)?type:'working';
 const existingWorking=workingSetIndexes(e);
 const prev=previousExercise(e.exerciseId),rec=buildRecommendation(e.config,prev,e.exerciseId);
 let weight=0,reps=e.config.minReps;
 if(type==='working'){
   const wi=existingWorking.length,lastWorking=existingWorking.length?e.sets[existingWorking.at(-1)]:null;
   weight=Number((rec.weights&&rec.weights[wi])??rec.weight??(lastWorking&&lastWorking.weight)??0);
   reps=Number((rec.targetReps&&rec.targetReps[wi])??(lastWorking&&lastWorking.reps)??e.config.minReps);
 }else{
   const source=existingWorking.length?e.sets[existingWorking.at(-1)]:e.sets.at(-1);
   weight=Number(source&&source.weight)||0;reps=Number(source&&source.reps)||e.config.minReps;
 }
 const item={weight:roundLoad(weight),reps:Math.max(1,Math.round(reps)),done:false,rir:'',type:type,pr:'',
   role:type==='working'&&typeof coachAdaptiveSetRole==='function'?coachAdaptiveSetRole(e.config,existingWorking.length):undefined};
 let at=e.sets.length;
 if(type==='warmup')at=existingWorking.length?existingWorking[0]:0;
 else if(type==='working'&&existingWorking.length)at=existingWorking.at(-1)+1;
 e.sets.splice(at,0,item);w.focusExerciseIndex=ei;w.focusSetIndex=at;e.expanded=true;
 w.deferredExerciseIndexes=(w.deferredExerciseIndexes||[]).filter(function(i){return i!==ei});
 if(type==='working')markWorkoutStructureDirty();else saveActiveWorkout();
 renderWorkout();haptic(10);showToast(setTypeLabel(type)+' added');
}
function removeWorkoutSet(ei,si){
 const w=state.activeWorkout,e=w&&w.exercises&&w.exercises[ei],set=e&&e.sets&&e.sets[si];if(!set)return;
 if(e.sets.length<=1){showToast('Keep at least one set in the exercise');return}
 if(isProgressionSet(set)&&workingSetIndexes(e).length<=1){showToast('Keep at least one working set');return}
 const remove=function(){
   const wasWorking=isProgressionSet(set);e.sets.splice(si,1);
   w.focusExerciseIndex=ei;w.focusSetIndex=Math.max(0,Math.min(si,e.sets.length-1));
   if(wasWorking)markWorkoutStructureDirty();else saveActiveWorkout();
   renderWorkout();showToast('Set removed');
 };
 if(set.done)confirmAction('Remove completed set?','This set is already marked complete. Removing it will delete it from this active workout.',remove);else remove();
}
function moveWorkoutSet(ei,si,dir){
 const w=state.activeWorkout,e=w&&w.exercises&&w.exercises[ei];if(!e)return;
 const ni=si+dir;if(ni<0||ni>=e.sets.length)return;
 [e.sets[si],e.sets[ni]]=[e.sets[ni],e.sets[si]];
 if(w.focusExerciseIndex===ei&&w.focusSetIndex===si)w.focusSetIndex=ni;
 else if(w.focusExerciseIndex===ei&&w.focusSetIndex===ni)w.focusSetIndex=si;
 saveActiveWorkout();renderWorkout();haptic(8);
}
function addSuggestedWarmups(ei){
 const w=state.activeWorkout,e=w&&w.exercises&&w.exercises[ei],ex=e?exById(e.exerciseId):null;if(!e||!ex)return;
 const existing=e.sets.filter(function(s){return setType(s)==='warmup'});
 if(existing.length){closeModal();showToast('Warm-up sets are already in this exercise');return}
 const prev=previousExercise(e.exerciseId),t=liveSetTarget(e,firstWorkingSetIndex(e),prev),suggested=warmupGuide(t.weight,ex);
 if(!suggested.length){closeModal();showToast('No warm-up ramp available for this target');return}
 const at=firstWorkingSetIndex(e);
 e.sets.splice.apply(e.sets,[at,0].concat(suggested.map(function(s){return {weight:s.weight,reps:s.reps,done:false,rir:'',type:'warmup',pr:''}})));
 w.focusExerciseIndex=ei;w.focusSetIndex=at;w.deferredExerciseIndexes=(w.deferredExerciseIndexes||[]).filter(function(i){return i!==ei});
 saveActiveWorkout();closeModal();renderWorkout();showToast(suggested.length+' warm-up sets added');
}

function workoutSupersetGroups(){
 const w=state.activeWorkout;if(!w)return [];
 return [...new Set(w.exercises.map(e=>e.supersetId).filter(Boolean))];
}
function supersetMeta(ei){
 const w=state.activeWorkout,e=w?.exercises?.[ei];if(!e?.supersetId)return null;
 const groups=workoutSupersetGroups(),idx=groups.indexOf(e.supersetId);
 const members=w.exercises.map((x,i)=>x.supersetId===e.supersetId&&!x.skipped?i:-1).filter(i=>i>=0);
 if(members.length<2)return null;
 return {id:e.supersetId,label:String.fromCharCode(65+Math.max(0,idx)),members};
}
function supersetNames(groupId){
 const w=state.activeWorkout;if(!w||!groupId)return '';
 return w.exercises.filter(e=>e.supersetId===groupId&&!e.skipped).map(e=>exById(e.exerciseId)?.name||'Exercise').join(' ↔ ');
}
function cleanupActiveSupersets(){
 const w=state.activeWorkout;if(!w)return;
 const groups=[...new Set(w.exercises.map(e=>e.supersetId).filter(Boolean))];
 groups.forEach(g=>{
   const members=w.exercises.filter(e=>e.supersetId===g);
   if(members.length<2)members.forEach(e=>e.supersetId=null);
 });
}
function cleanupRoutineSupersets(r){
 if(!r)return;
 const groups=[...new Set(r.exercises.map(e=>e.supersetGroup).filter(Boolean))];
 groups.forEach(g=>{
   const members=r.exercises.filter(e=>e.supersetGroup===g);
   if(members.length<2)members.forEach(e=>e.supersetGroup=null);
 });
}
function routineSupersetMeta(r,index){
 const re=r?.exercises?.[index];if(!re?.supersetGroup)return null;
 const groups=[...new Set(r.exercises.map(e=>e.supersetGroup).filter(Boolean))],idx=groups.indexOf(re.supersetGroup);
 const members=r.exercises.map((e,i)=>e.supersetGroup===re.supersetGroup?i:-1).filter(i=>i>=0);
 return members.length>=2?{id:re.supersetGroup,label:String.fromCharCode(65+Math.max(0,idx)),members}:null;
}
function openSupersetPicker(ei){
 const w=state.activeWorkout,e=w?.exercises?.[ei];if(!e)return;
 const cur=exById(e.exerciseId),meta=supersetMeta(ei);
 const rows=w.exercises.map((other,oi)=>{
   if(oi===ei)return '';
   const ox=exById(other.exerciseId),same=meta&&other.supersetId===meta.id;
   const canSave=Number.isInteger(e.routineIndex)&&Number.isInteger(other.routineIndex);
   return `<div class="picker-result-card">
    <div class="picker-result-main"><span class="superset-badge">⚡</span><div class="iconbox">${catExerciseThumbnail(ox)}</div><div class="picker-result-copy"><div class="exercise-name">${esc(ox?.name||'Exercise')}</div><div class="mini">${esc(ox?.muscle||'')} · ${esc(patternLabel(ox?.pattern||''))}</div></div></div>
    <div class="picker-result-actions">
      <button class="btn small" ${same?'disabled':''} onclick="linkSuperset(${ei},${oi},false)">${same?'Already linked':'Pair Today'}</button>
      <button class="btn small secondary" ${same||!canSave?'disabled':''} onclick="linkSuperset(${ei},${oi},true)">Pair + Save</button>
    </div>
   </div>`;
 }).join('');
 openModal(`Superset · ${esc(cur?.name||'Exercise')}`,`
  <div class="notice">Linked exercises rotate set-to-set. Swole Cat skips the rest timer between exercises in the same round, then starts your rest after the round is complete. Only working sets participate in the rotation.</div>
  ${meta?`<div class="superset-note"><b>Superset ${meta.label}</b><br>${esc(supersetNames(meta.id))}</div><div class="actions"><button class="btn danger" onclick="unlinkSuperset(${ei},false)">Remove for today</button>${Number.isInteger(e.routineIndex)?`<button class="btn secondary" onclick="unlinkSuperset(${ei},true)">Remove + routine</button>`:''}</div>`:''}
  <div class="picker-section">Pair with</div><div class="picker-result-list">${rows||'<div class="empty">Add another exercise to this workout first.</div>'}</div>
 `);
}
function linkSuperset(ei,oi,permanent){
 const w=state.activeWorkout,a=w?.exercises?.[ei],b=w?.exercises?.[oi];if(!a||!b)return;
 const oldA=a.supersetId,oldB=b.supersetId,group=oldA||oldB||('ss_'+uid());
 const merge=new Set([oldA,oldB].filter(Boolean));
 w.exercises.forEach(e=>{if(merge.has(e.supersetId))e.supersetId=group});
 a.supersetId=group;b.supersetId=group;
 if(permanent){
   const r=state.routines.find(x=>x.id===w.routineId);
   const mapped=w.exercises.filter(e=>e.supersetId===group&&Number.isInteger(e.routineIndex));
   if(r&&mapped.length>=2){
     const oldRoutineGroups=new Set(mapped.map(e=>r.exercises[e.routineIndex]?.supersetGroup).filter(Boolean));
     const persist=[...oldRoutineGroups][0]||group;
     r.exercises.forEach(re=>{if(oldRoutineGroups.has(re.supersetGroup))re.supersetGroup=persist});
     mapped.forEach(e=>{if(r.exercises[e.routineIndex])r.exercises[e.routineIndex].supersetGroup=persist});
     w.exercises.forEach(e=>{if(e.supersetId===group)e.supersetId=persist});
   }
 }
 cleanupActiveSupersets();if(!permanent)markWorkoutStructureDirty();else saveActiveWorkout();closeModal();renderWorkout();haptic([15,25,15]);
 const m=supersetMeta(ei);showToast(m?`Superset ${m.label} linked`:'Superset linked');
}
function unlinkSuperset(ei,permanent){
 const w=state.activeWorkout,e=w?.exercises?.[ei];if(!e?.supersetId)return;
 const old=e.supersetId;
 e.supersetId=null;
 if(permanent&&Number.isInteger(e.routineIndex)){
   const r=state.routines.find(x=>x.id===w.routineId);
   if(r?.exercises?.[e.routineIndex]){
     const rg=r.exercises[e.routineIndex].supersetGroup;
     r.exercises[e.routineIndex].supersetGroup=null;
     cleanupRoutineSupersets(r);
     if(rg){
       w.exercises.forEach(x=>{
         if(Number.isInteger(x.routineIndex)&&r.exercises[x.routineIndex]?.supersetGroup!==rg&&x.supersetId===rg)x.supersetId=null;
       });
     }
   }
 }
 cleanupActiveSupersets();if(!permanent)markWorkoutStructureDirty();else saveActiveWorkout();closeModal();renderWorkout();showToast('Superset updated');
}
function workingSetIndexAtRound(e,round){
 const indexes=workingSetIndexes(e);return indexes[round]??-1;
}
function advanceSupersetAfterSet(ei,si){
 const w=state.activeWorkout,e=w&&w.exercises&&w.exercises[ei],meta=supersetMeta(ei);
 if(!w||!e||!meta||!isProgressionSet(e.sets[si]))return false;
 const round=workingSetOrdinal(e,si),members=meta.members,pos=members.indexOf(ei);
 const ordered=members.slice(pos+1).concat(members.slice(0,pos));
 for(const oi of ordered){
   const oe=w.exercises[oi],targetSi=workingSetIndexAtRound(oe,round);
   if(targetSi>=0&&!oe.sets[targetSi].done){
     w.focusExerciseIndex=oi;w.focusSetIndex=targetSi;
     w.deferredExerciseIndexes=(w.deferredExerciseIndexes||[]).filter(function(i){return i!==oi});
     w.exercises.forEach(function(x,i){x.expanded=i===oi});
     saveActiveWorkout();renderWorkoutExerciseTransition(ei,oi);
     showToast('Superset '+meta.label+': '+((exById(oe.exerciseId)&&exById(oe.exerciseId).name)||'next exercise'));
     return true;
   }
 }
 let next=members.find(function(oi){return workingSetIndexes(w.exercises[oi]).some(function(idx){return !w.exercises[oi].sets[idx].done})});
 if(next==null)next=members.find(function(oi){return !exerciseSetProgress(w.exercises[oi]).complete});
 if(next!=null){
   startRestTimer(e.config.restSeconds||120);
   w.focusExerciseIndex=next;w.focusSetIndex=workoutFirstIncompleteSetIndex(w.exercises[next]);
   w.deferredExerciseIndexes=(w.deferredExerciseIndexes||[]).filter(function(i){return i!==next});
   w.exercises.forEach(function(x,i){x.expanded=i===next});
   saveActiveWorkout();renderWorkoutExerciseTransition(ei,next);showToast('Superset '+meta.label+' round complete · rest');return true;
 }
 if(workoutHasRemainingProgrammedWork())startRestTimer(e.config.restSeconds||120);else stopRestTimer();
 if(advanceFromCompletedExercise(ei))return true;
 saveActiveWorkout();renderWorkout();return true;
}
function openRoutineSupersetPicker(routineId,index){
 const r=state.routines.find(x=>x.id===routineId),re=r?.exercises?.[index];if(!re)return;
 const cur=exById(re.exerciseId),meta=routineSupersetMeta(r,index);
 const rows=r.exercises.map((other,oi)=>{
   if(oi===index)return '';
   const ox=exById(other.exerciseId),same=meta&&other.supersetGroup===meta.id;
   return `<div class="list-item"><div class="iconbox">${catExerciseThumbnail(ox)}</div><div class="grow"><div class="exercise-name">${esc(ox?.name||'Exercise')}</div><div class="mini">${esc(ox?.muscle||'')} · ${esc(patternLabel(ox?.pattern||''))}</div></div><button class="btn small" ${same?'disabled':''} onclick="linkRoutineSuperset('${routineId}',${index},${oi})">${same?'Linked':'Pair'}</button></div>`;
 }).join('');
 openModal(`Routine superset · ${esc(cur?.name||'Exercise')}`,`
   <div class="notice">Saved supersets will be restored automatically every time you start this routine.</div>
   ${meta?`<div class="superset-note"><b>Superset ${meta.label}</b><br>${meta.members.map(i=>esc(exById(r.exercises[i].exerciseId)?.name||'Exercise')).join(' ↔ ')}</div><div class="actions"><button class="btn danger" onclick="unlinkRoutineSuperset('${routineId}',${index})">Remove from superset</button></div>`:''}
   <div class="card" style="margin-top:12px">${rows}</div>
   <div class="actions"><button class="btn secondary" onclick="editRoutineDetails('${routineId}')">Back</button></div>
 `);
}
function linkRoutineSuperset(routineId,index,otherIndex){
 const r=state.routines.find(x=>x.id===routineId),a=r?.exercises?.[index],b=r?.exercises?.[otherIndex];if(!a||!b)return;
 const oldA=a.supersetGroup,oldB=b.supersetGroup,group=oldA||oldB||('ss_'+uid()),merge=new Set([oldA,oldB].filter(Boolean));
 r.exercises.forEach(re=>{if(merge.has(re.supersetGroup))re.supersetGroup=group});
 a.supersetGroup=group;b.supersetGroup=group;cleanupRoutineSupersets(r);save();openRoutineSupersetPicker(routineId,index);refreshRoutineEditor(routineId);
}
function unlinkRoutineSuperset(routineId,index){
 const r=state.routines.find(x=>x.id===routineId),re=r?.exercises?.[index];if(!re)return;
 re.supersetGroup=null;cleanupRoutineSupersets(r);save();editRoutineDetails(routineId);
}

function routineExerciseFromWorkout(e){
 const cfg=e.config||{},workingCount=Math.max(1,workingSetIndexes(e).length||Number(cfg.sets)||1);
 let savedStructure=cfg.setStructure?cloneData(cfg.setStructure):null;
 if(savedStructure?.type==='top_backoff'){
   const topCount=Math.max(1,(e.sets||[]).filter(s=>isProgressionSet(s)&&s.role==='top').length||Number(savedStructure.topSets)||1);
   savedStructure.topSets=Math.min(topCount,workingCount);
   savedStructure.backoffSets=Math.max(0,workingCount-savedStructure.topSets);
   if(savedStructure.backoffSets<1)savedStructure=null;
 }
 return {
   exerciseId:e.exerciseId,
   sets:workingCount,
   minReps:Math.max(1,Number(cfg.minReps)||1),
   maxReps:Math.max(Math.max(1,Number(cfg.minReps)||1),Number(cfg.maxReps)||12),
   increment:Math.max(0,Number(cfg.increment)||0),
   mode:cfg.mode==='range'?'double':(cfg.mode||'double'),
   progressionStrategy:cfg.progressionStrategy||'double',
   adaptiveProgression:!!cfg.adaptiveProgression,
   setStructure:savedStructure,
   trainingGoal:cfg.trainingGoal||'general',
   resetPercent:Number(cfg.resetPercent)||7.5,
   restSeconds:Math.max(15,Number(cfg.restSeconds)||120),
   targetRIR:Number.isFinite(Number(cfg.targetRIR))?Number(cfg.targetRIR):null,
   supersetGroup:e.supersetId||null
 };
}
function syncActiveWorkoutStructureToRoutine(){
 const w=state.activeWorkout;if(!w)return false;
 const r=state.routines.find(x=>x.id===w.routineId);if(!r)return false;
 r.name=w.routineName||r.name;
 r.exercises=w.exercises.map(routineExerciseFromWorkout);
 cleanupRoutineSupersets(r);
 w.exercises.forEach((e,i)=>{
   e.routineIndex=i;
   e.config={...e.config,sets:Math.max(1,workingSetIndexes(e).length||Number(e.config?.sets)||1)};
   e.supersetId=r.exercises[i]?.supersetGroup||null;
 });
 w.structureDirty=false;
 saveActiveWorkout();renderRoutines();renderHome();
 return true;
}
function workoutStructureRowsHtml(){
 const w=state.activeWorkout;if(!w)return '';
 return w.exercises.map((e,ei)=>{
   const ex=exById(e.exerciseId),p=exerciseSetProgress(e);
   const done=(e.sets||[]).filter(s=>s.done).length;
   return `<div class="workout-manage-row ${e.skipped?'skipped':''}">
     <div class="workout-order-controls">
       <button aria-label="Move exercise earlier" onclick="moveWorkoutExercise(${ei},-1)" ${ei===0?'disabled':''}>↑</button>
       <button aria-label="Move exercise later" onclick="moveWorkoutExercise(${ei},1)" ${ei===w.exercises.length-1?'disabled':''}>↓</button>
     </div>
     <div>
       <div class="exercise-name">${esc(ex?.name||'Exercise')}</div>
       <div class="mini">${e.skipped?'Skipped for today':`${done} of ${e.sets.length} sets complete`}${e.supersetId?' · superset':''}</div>
     </div>
     <div class="workout-manage-actions">
       <button class="btn small secondary" onclick="toggleSkipWorkoutExercise(${ei})">${e.skipped?'Unskip':'Skip'}</button>
       <button class="btn small danger" onclick="removeWorkoutExercise(${ei})">Remove</button>
     </div>
   </div>`;
 }).join('');
}
function openWorkoutStructureEditor(){
 const w=state.activeWorkout;if(!w)return;
 const r=state.routines.find(x=>x.id===w.routineId);
 openModal('Manage active workout',`
   <div class="notice">Reorder, skip, or remove exercises without ending the workout. Skip is always today-only. Reordering, removals, today-only additions, substitutions, supersets, and working-set count changes can be saved back to the routine only when you explicitly choose to.</div>
   <div id="workoutStructureList" class="workout-manage-list">${workoutStructureRowsHtml()}</div>
   <div class="actions">
     ${r?`<button class="btn secondary" onclick="saveWorkoutStructureNow()">Save current structure to routine</button>`:''}
     <button class="btn" onclick="closeModal()">Done</button>
   </div>
 `);
}
function refreshWorkoutStructureEditor(){
 const host=document.getElementById('workoutStructureList');
 if(host)host.innerHTML=workoutStructureRowsHtml();
}
function moveWorkoutExercise(ei,dir){
 const w=state.activeWorkout;if(!w)return;
 const ni=ei+dir;if(ni<0||ni>=w.exercises.length)return;
 [w.exercises[ei],w.exercises[ni]]=[w.exercises[ni],w.exercises[ei]];
 if(w.focusExerciseIndex===ei)w.focusExerciseIndex=ni;else if(w.focusExerciseIndex===ni)w.focusExerciseIndex=ei;
 w.deferredExerciseIndexes=(w.deferredExerciseIndexes||[]).map(function(i){return i===ei?ni:i===ni?ei:i});
 markWorkoutStructureDirty();renderWorkout();refreshWorkoutStructureEditor();haptic(8);
}
function toggleSkipWorkoutExercise(ei){
 const w=state.activeWorkout,e=w&&w.exercises&&w.exercises[ei];if(!e)return;
 e.skipped=!e.skipped;
 w.deferredExerciseIndexes=(w.deferredExerciseIndexes||[]).filter(function(i){return i!==ei});
 if(e.skipped){
   e.expanded=false;
   const next=nextWorkoutExerciseIndex(ei,w);
   w.focusExerciseIndex=next>=0?next:Math.max(0,w.exercises.findIndex(function(x){return !x.skipped}));
   if(w.focusExerciseIndex>=0)w.focusSetIndex=workoutFirstIncompleteSetIndex(w.exercises[w.focusExerciseIndex]);
 }else{
   w.focusExerciseIndex=ei;w.focusSetIndex=workoutFirstIncompleteSetIndex(e);
 }
 w.exercises.forEach(function(x,i){x.expanded=i===w.focusExerciseIndex});
 saveActiveWorkout();renderWorkout();refreshWorkoutStructureEditor();
 showToast(e.skipped?'Exercise skipped for today':'Exercise restored');
}
function removeWorkoutExercise(ei){
 const w=state.activeWorkout,e=w&&w.exercises&&w.exercises[ei];if(!e)return;
 const ex=exById(e.exerciseId),hasLogged=(e.sets||[]).some(function(s){return s.done});
 const remove=function(){
   w.exercises.splice(ei,1);
   w.deferredExerciseIndexes=(w.deferredExerciseIndexes||[]).filter(function(i){return i!==ei}).map(function(i){return i>ei?i-1:i});
   if(w.focusExerciseIndex===ei)w.focusExerciseIndex=Math.min(ei,w.exercises.length-1);
   else if(w.focusExerciseIndex>ei)w.focusExerciseIndex--;
   cleanupActiveSupersets();normalizeWorkoutFocusState(w);markWorkoutStructureDirty();
   closeModal();renderWorkout();showToast(((ex&&ex.name)||'Exercise')+' removed for today');
 };
 const name=(ex&&ex.name)||'this exercise';
 if(hasLogged)confirmAction('Remove logged exercise?','Remove '+name+" from today's workout? Completed sets for it will also be removed from this active session.",remove);
 else confirmAction('Remove exercise for today?','Remove '+name+" from today's workout? Your saved routine stays unchanged unless you later choose to update it.",remove);
}
function saveWorkoutStructureNow(){
 const w=state.activeWorkout;if(!w)return;
 const r=state.routines.find(x=>x.id===w.routineId);if(!r){showToast('No saved routine to update');return}
 confirmAction('Update saved routine?',`Replace ${r.name}'s exercise order and structure with the current workout layout? Skipped exercises remain in the routine.`,()=>{
   if(syncActiveWorkoutStructureToRoutine()){
     closeModal();renderWorkout();showToast('Routine updated from active workout');
   }
 });
}

function exerciseSetProgress(e){
 const done=e.sets.filter(s=>s.done).length,total=e.sets.length;
 if(e.skipped)return {done,total,pct:100,complete:true,skipped:true};
 return {done,total,pct:total?Math.round(done/total*100):0,complete:total>0&&done===total,skipped:false};
}
function workoutFirstIncompleteSetIndex(e){
 if(!e?.sets?.length)return -1;
 const next=e.sets.findIndex(s=>!s.done);
 return next>=0?next:Math.max(0,e.sets.length-1);
}
function normalizeWorkoutFocusState(w=state.activeWorkout){
 if(!w?.exercises?.length)return -1;
 if(!Array.isArray(w.deferredExerciseIndexes))w.deferredExerciseIndexes=[];
 w.deferredExerciseIndexes=[...new Set(w.deferredExerciseIndexes.map(Number).filter(i=>Number.isInteger(i)&&i>=0&&i<w.exercises.length&&!w.exercises[i].skipped&&!exerciseSetProgress(w.exercises[i]).complete))];
 let focus=Number(w.focusExerciseIndex);
 const valid=Number.isInteger(focus)&&focus>=0&&focus<w.exercises.length&&!w.exercises[focus].skipped;
 if(!valid){
   focus=w.exercises.findIndex(e=>!e.skipped&&!exerciseSetProgress(e).complete);
   if(focus<0)focus=w.exercises.findIndex(e=>!e.skipped);
   if(focus<0)focus=0;
 }
 const focused=w.exercises[focus];
 let setIndex=Number(w.focusSetIndex);
 if(!Number.isInteger(setIndex)||setIndex<0||setIndex>=Math.max(1,focused?.sets?.length||0)||(focused?.sets?.[setIndex]?.done&&focused?.sets?.some(s=>!s.done))){
   setIndex=workoutFirstIncompleteSetIndex(focused);
 }
 w.focusExerciseIndex=focus;
 w.focusSetIndex=Math.max(0,setIndex);
 w.exercises.forEach((e,i)=>e.expanded=i===focus);
 return focus;
}
function workoutActiveExerciseIndex(w=state.activeWorkout){
 if(!w)return -1;
 return normalizeWorkoutFocusState(w);
}
function workoutFocusedSetIndex(w=state.activeWorkout){
 const ei=normalizeWorkoutFocusState(w);if(ei<0)return -1;
 return Math.max(0,Math.min(w.exercises[ei].sets.length-1,Number(w.focusSetIndex)||0));
}
function workoutExerciseDeferred(ei,w=state.activeWorkout){
 return !!w&&Array.isArray(w.deferredExerciseIndexes)&&w.deferredExerciseIndexes.includes(ei);
}
function workoutActiveSetText(e){
 if(!e)return '';
 const next=e.sets.findIndex(s=>!s.done);
 if(next<0)return 'Exercise complete';
 return `Set ${next+1} of ${e.sets.length}`;
}

function applyWorkoutFocusState(w,ei,si=null,{deferCurrent=true}={}){
 if(!w?.exercises?.[ei]||w.exercises[ei].skipped)return false;
 const current=normalizeWorkoutFocusState(w);
 if(!Array.isArray(w.deferredExerciseIndexes))w.deferredExerciseIndexes=[];
 if(deferCurrent&&current>=0&&current!==ei&&!w.exercises[current].skipped&&!exerciseSetProgress(w.exercises[current]).complete){
   if(!w.deferredExerciseIndexes.includes(current))w.deferredExerciseIndexes.push(current);
 }
 w.deferredExerciseIndexes=w.deferredExerciseIndexes.filter(i=>i!==ei);
 w.focusExerciseIndex=ei;
 w.focusSetIndex=si==null?workoutFirstIncompleteSetIndex(w.exercises[ei]):Math.max(0,Math.min(w.exercises[ei].sets.length-1,Number(si)||0));
 w.exercises.forEach((e,i)=>e.expanded=i===ei);
 return true;
}
function setWorkoutFocus(ei,si=null,{deferCurrent=true,render=true}={}){
 const w=state.activeWorkout;
 if(!applyWorkoutFocusState(w,ei,si,{deferCurrent}))return false;
 saveActiveWorkout(true);
 if(render)renderWorkout();
 return true;
}
function syncWorkoutStickyOffsets(){
 const header=document.querySelector('header');
 const headerHeight=Math.max(0,Math.round(header?.getBoundingClientRect().height||0));
 document.documentElement.style.setProperty('--workout-sticky-top',headerHeight+'px');
}
function compactTargetText(e,ex,prev){
 const t=liveSetTarget(e,firstWorkingSetIndex(e),prev);
 if(e.targetOverride)return `Target ${e.targetOverride.weight} ${state.profile.unit} × ${e.targetOverride.reps}`;
 if((Number(t.weight)||0)<=0)return ex?.equipment==='bodyweight'?`${t.reps} reps · bodyweight`:`Choose starting weight · ${t.reps} reps`;
 return `${t.weight} ${state.profile.unit} × ${t.reps} target`;
}

let workoutIncomingExerciseCue=null,workoutSetAdvanceCue=null,workoutStructureNoticeTimer=null;
function workoutReducedMotion(){
 try{return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches}catch(e){return false}
}
function dismissWorkoutStructureNotice(){
 clearTimeout(workoutStructureNoticeTimer);workoutStructureNoticeTimer=null;
 const el=document.getElementById('workoutStructureNotice');if(!el)return;
 el.classList.remove('show');
 setTimeout(()=>el.remove(),180);
}
function showWorkoutStructureNotice(){
 if(!state.activeWorkout)return;
 document.getElementById('workoutStructureNotice')?.remove();
 clearTimeout(workoutStructureNoticeTimer);
 const el=document.createElement('div');
 el.id='workoutStructureNotice';
 el.className='workout-structure-toast';
 el.setAttribute('role','status');
 el.setAttribute('aria-live','polite');
 el.setAttribute('tabindex','0');
 el.innerHTML='<div class="workout-structure-toast-copy"><b>Workout modified</b><span>Your saved routine stays unchanged unless you update it when finishing.</span></div><span class="workout-structure-toast-close" aria-hidden="true">×</span><span class="workout-structure-toast-progress" aria-hidden="true"></span>';
 el.addEventListener('click',dismissWorkoutStructureNotice);
 el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();dismissWorkoutStructureNotice()}});
 document.body.appendChild(el);
 requestAnimationFrame(()=>el.classList.add('show'));
 workoutStructureNoticeTimer=setTimeout(dismissWorkoutStructureNotice,5000);
}
SwoleCatRuntime.events.addEventListener('workout:structure-changed',()=>setTimeout(showWorkoutStructureNotice,0));

function queueWorkoutSetAdvanceCue(ei,si){
 if(workoutReducedMotion())return;
 workoutSetAdvanceCue={ei,si};
}
function applyWorkoutMotionCues(){
 const exerciseCue=workoutIncomingExerciseCue;
 if(exerciseCue){
   workoutIncomingExerciseCue=null;
   const stage=document.querySelector('#workout .focus-exercise-stage[data-exercise-index="'+exerciseCue.ei+'"]');
   if(stage){
     const cls='workout-exercise-enter-'+exerciseCue.direction;
     stage.classList.add(cls);
     setTimeout(()=>stage.classList.remove(cls),320);
   }
 }
 const setCue=workoutSetAdvanceCue;
 if(setCue){
   workoutSetAdvanceCue=null;
   const pill=document.querySelector('#workout .focus-set-pill.current');
   const card=document.querySelector('#workout .focus-set-card[data-set-index="'+setCue.si+'"]');
   if(pill)pill.classList.add('set-advance-pulse');
   if(card)card.classList.add('set-advance-settle');
   setTimeout(()=>{pill?.classList.remove('set-advance-pulse');card?.classList.remove('set-advance-settle')},520);
 }
}
function renderWorkoutExerciseTransition(fromEi,toEi){
 if(fromEi===toEi||workoutReducedMotion()){renderWorkout();return}
 const direction=toEi>fromEi?'forward':'back';
 if(typeof document.startViewTransition==='function'){
   const root=document.documentElement;
   root.dataset.workoutTransition=direction;
   let transition=null;
   try{transition=document.startViewTransition(()=>renderWorkout())}catch(e){delete root.dataset.workoutTransition;renderWorkout();return}
   Promise.resolve(transition?.finished).catch(()=>{}).finally(()=>{
     if(root.dataset.workoutTransition===direction)delete root.dataset.workoutTransition;
   });
   return;
 }
 workoutIncomingExerciseCue={ei:toEi,direction};
 renderWorkout();
}
function advanceFromCompletedExercise(ei){
 const w=state.activeWorkout;if(!w)return false;
 const e=w.exercises[ei],p=exerciseSetProgress(e);
 if(!p.complete)return false;
 e.expanded=false;
 w.deferredExerciseIndexes=(w.deferredExerciseIndexes||[]).filter(function(i){return i!==ei});
 const next=nextWorkoutExerciseIndex(ei,w);
 if(next>=0){
   w.focusExerciseIndex=next;w.focusSetIndex=workoutFirstIncompleteSetIndex(w.exercises[next]);
   w.deferredExerciseIndexes=w.deferredExerciseIndexes.filter(function(i){return i!==next});
   w.exercises.forEach(function(x,i){x.expanded=i===next});
   saveActiveWorkout();renderWorkoutExerciseTransition(ei,next);
 }else{
   stopRestTimer();w.focusExerciseIndex=ei;w.focusSetIndex=Math.max(0,e.sets.length-1);
   saveActiveWorkout();renderWorkout();showToast('All programmed sets complete');
 }
 return true;
}


function workoutExerciseFocusStatus(w,e,ei){
 const p=exerciseSetProgress(e),done=e.sets.filter(function(s){return s.done}).length;
 if(e.skipped)return {label:'Skipped',cls:'skipped'};
 if(p.complete)return {label:'Complete',cls:'complete'};
 if(ei===w.focusExerciseIndex)return {label:'Now',cls:'current'};
 if(workoutExerciseDeferred(ei,w))return {label:done?('Pending · '+done+'/'+e.sets.length):'Pending',cls:'pending'};
 if(done)return {label:done+'/'+e.sets.length+' done',cls:'pending'};
 return {label:'Up next',cls:'up-next'};
}
function nextWorkoutExerciseIndex(from,w){
 w=w||state.activeWorkout;if(!w||!w.exercises||!w.exercises.length)return -1;
 for(let step=1;step<=w.exercises.length;step++){
   const i=(from+step)%w.exercises.length,e=w.exercises[i];
   if(!e.skipped&&!exerciseSetProgress(e).complete)return i;
 }
 return -1;
}
function workoutExerciseNavigatorHtml(w,ei){
 const e=w.exercises[ei],ex=exById(e.exerciseId),p=exerciseSetProgress(e);
 const rows=w.exercises.map(function(row,i){
   const rx=exById(row.exerciseId),status=workoutExerciseFocusStatus(w,row,i),rp=exerciseSetProgress(row);
   return '<button class="focus-nav-row '+status.cls+' '+(i===ei?'selected':'')+'" onclick="event.preventDefault();event.stopPropagation();selectWorkoutExercise('+i+')" '+(row.skipped?'disabled':'')+'>'+
    '<span class="focus-nav-index">'+(row.skipped?'–':rp.complete?'✓':i+1)+'</span>'+
    '<span class="focus-nav-copy"><b>'+esc(rx&&rx.name||'Exercise')+'</b><small>'+esc(status.label)+' · '+row.sets.filter(function(s){return s.done}).length+'/'+row.sets.length+' sets</small></span>'+
    '<span class="focus-nav-go">'+(i===ei?'●':'›')+'</span></button>';
 }).join('');
 const addRow='<button class="focus-nav-add" onclick="event.preventDefault();event.stopPropagation();openAddWorkoutExercise()" aria-label="Add exercise to this workout">'+
   '<span class="focus-nav-add-icon">＋</span><span class="focus-nav-copy"><b>Add exercise</b><small>Add another movement to today\'s workout</small></span><span class="focus-nav-go">›</span></button>';
 return '<div class="focus-exercise-nav-shell">'+
   '<details class="focus-exercise-nav"><summary>'+
   '<div class="focus-exercise-position">EXERCISE '+(ei+1)+' OF '+w.exercises.length+'</div>'+
   '<div class="focus-exercise-title-line"><span class="focus-exercise-name">'+esc(ex&&ex.name||'Exercise')+'</span>'+
   '<button type="button" class="focus-howto-inline" onclick="event.preventDefault();event.stopPropagation();openFocusedExerciseHowTo('+ei+')" aria-label="How to do '+esc(ex&&ex.name||'this exercise')+'" title="How to"><span aria-hidden="true">i</span></button></div>'+
   '<div class="focus-exercise-bottom-row"><div class="focus-exercise-meta">'+esc(p.complete?'Complete':workoutActiveSetText(e))+' · '+esc(ex&&ex.muscle||'')+' · '+workingSetIndexes(e).length+' working sets</div>'+
   '<span class="focus-nav-switch" aria-hidden="true">Switch exercise</span></div>'+
   '</summary><div class="focus-nav-list">'+rows+addRow+'</div></details>'+
   '</div>';
}
function openFocusedExerciseHowTo(ei){
 const w=state.activeWorkout,e=w&&w.exercises&&w.exercises[ei],ex=e?exById(e.exerciseId):null;if(!w||!e||!ex)return;
 const focusExercise=Number(w.focusExerciseIndex),focusSet=Number(w.focusSetIndex);
 openModal(esc(ex.name)+' · How to',
  '<div class="focus-howto-scroll">'+
   '<div class="focus-howto-lead"><div class="eyebrow">FORM HELP // IN WORKOUT</div><div class="mini">Quickly check setup and execution, then close this sheet to return to the exact set you were logging.</div></div>'+
   '<div id="exerciseFormGuide"><div class="empty"><strong>Loading public form guide…</strong>Checking the source exercise library.</div></div>'+
  '</div>'+
  '<div class="focus-howto-footer"><button class="btn" onclick="closeModal()">Back to workout</button></div>',
  'modal-mode-focus-howto');
 const live=state.activeWorkout;
 if(live){live.focusExerciseIndex=focusExercise;live.focusSetIndex=focusSet}
 loadExerciseFormGuide(e.exerciseId);
}

function selectWorkoutExercise(ei){
 const w=state.activeWorkout;if(!w||!w.exercises||!w.exercises[ei]||w.exercises[ei].skipped)return;
 const current=normalizeWorkoutFocusState(w);
 const currentName=exById(w.exercises[current]&&w.exercises[current].exerciseId);
 const wasIncomplete=current!==ei&&current>=0&&!exerciseSetProgress(w.exercises[current]).complete&&!w.exercises[current].skipped;
 if(!setWorkoutFocus(ei,null,{deferCurrent:true,render:false}))return;
 saveActiveWorkout();renderWorkoutExerciseTransition(current,ei);
 if(wasIncomplete)showToast(((currentName&&currentName.name)||'Exercise')+' saved as pending');
}
function selectWorkoutSet(ei,si){
 const w=state.activeWorkout;if(!w||!w.exercises||!w.exercises[ei]||!w.exercises[ei].sets||!w.exercises[ei].sets[si])return;
 setWorkoutFocus(ei,si,{deferCurrent:false,render:false});
 saveActiveWorkout();renderWorkout();
}
function deferFocusedExercise(){
 const w=state.activeWorkout,ei=normalizeWorkoutFocusState(w);if(ei<0)return;
 const next=nextWorkoutExerciseIndex(ei,w);
 if(next<0){showToast('No other unfinished exercise');return}
 const ex=exById(w.exercises[ei].exerciseId),name=ex&&ex.name||'Exercise';
 setWorkoutFocus(next,null,{deferCurrent:true,render:false});
 saveActiveWorkout();renderWorkoutExerciseTransition(ei,next);showToast(name+' saved as pending');
}
function focusedSetRailHtml(e,ei,si){
 const setPills=e.sets.map(function(set,i){
   const cls=set.done?'done':i===si?'current':'future';
   return '<button class="focus-set-pill '+cls+'" onclick="selectWorkoutSet('+ei+','+i+')" aria-label="Open '+esc(setDisplayLabel(e,i))+'">'+(set.done?'✓ ':'')+(i+1)+'</button>';
 }).join('');
 return '<div class="focus-set-rail" aria-label="Workout sets">'+setPills+
  '<button class="focus-set-add" onclick="addWorkoutSet('+ei+',\'working\')" aria-label="Add working set"><span aria-hidden="true">＋</span> Set</button></div>';
}
function openFocusedSetOptions(ei,si){
 const w=state.activeWorkout,e=w&&w.exercises&&w.exercises[ei],set=e&&e.sets&&e.sets[si];if(!e||!set)return;
 const type=setType(set);
 openModal(esc(setDisplayLabel(e,si))+' options',
  '<div class="notice">These are advanced set controls. Your live workout stays focused on logging weight, reps, and RIR.</div>'+
  '<div class="field" style="margin-top:12px"><label>Set type</label><select class="set-type-select" onchange="setWorkoutSetType('+ei+','+si+',this.value);closeModal();renderWorkout()">'+setTypeOptions(type)+'</select></div>'+
  '<div class="actions"><button class="btn secondary" onclick="moveWorkoutSet('+ei+','+si+',-1);closeModal()">Move earlier</button>'+
  '<button class="btn secondary" onclick="moveWorkoutSet('+ei+','+si+',1);closeModal()">Move later</button>'+
  '<button class="btn danger" onclick="removeWorkoutSet('+ei+','+si+');closeModal()">Remove set</button>'+
  '<button class="btn secondary" onclick="closeModal()">Done</button></div>');
}
function openFocusedExerciseMore(ei){
 const w=state.activeWorkout,e=w&&w.exercises&&w.exercises[ei],ex=e?exById(e.exerciseId):null;if(!e)return;
 const prev=previousExercise(e.exerciseId),target=liveSetTarget(e,firstWorkingSetIndex(e),prev),warmups=warmupGuide(target.weight,ex),superset=supersetMeta(ei),hasRemaining=workoutHasRemainingProgrammedWork(w);
 openModal(esc(ex&&ex.name||'Exercise')+' · More',
  '<div class="notice">Keep the live screen focused on logging. Everything here stays available when you need to change the exercise or the session.</div>'+
  '<div class="workout-more-section"><div class="eyebrow">EXERCISE</div><div class="actions">'+
  (warmups.length?'<button class="btn secondary" onclick="closeModal();openWarmupGuide('+ei+')">Warm-up guide</button>':'')+
  '<button class="btn secondary" onclick="closeModal();openTargetOverride('+ei+')">Override target</button>'+
  '<button class="btn secondary" onclick="closeModal();openSupersetPicker('+ei+')">⚡ '+(superset?('Superset '+superset.label):'Superset')+'</button>'+
  '<button class="btn secondary" onclick="addWorkoutSet('+ei+',\'working\');closeModal()">+ Working set</button>'+
  '<button class="btn danger" onclick="closeModal();toggleSkipWorkoutExercise('+ei+')">Skip exercise today</button></div></div>'+
  '<div class="field" style="margin-top:12px"><label>Exercise notes</label><textarea oninput="updateNotes('+ei+',this.value)" placeholder="Seat setting, grip, tempo, machine used...">'+esc(e.notes||'')+'</textarea></div>'+
  '<div class="workout-more-section"><div class="eyebrow">WORKOUT</div><div class="actions">'+
  '<button class="btn secondary" onclick="closeModal();openWorkoutStructureEditor()">Manage workout</button>'+
  (hasRemaining?'<button class="btn secondary" onclick="closeModal();finishWorkout()">Finish workout early</button>':'<button class="btn green" onclick="closeModal();finishWorkout()">Finish workout</button>')+
  '<button class="btn danger" onclick="closeModal();cancelWorkout()">Cancel workout</button></div></div>');
}
function focusedCoachTargetHtml(e,ei,ex,prev){
 const rec=buildRecommendation(e.config,prev,e.exerciseId),coach=coachSignal(e.exerciseId,e.config);
 const firstWorking=firstWorkingSetIndex(e),firstTarget=liveSetTarget(e,firstWorking,prev),plateText=plateLoadText(firstTarget.weight,ex),compactTarget=compactTargetText(e,ex,prev);
 const title=e.targetOverride?(e.targetOverride.weight+' '+state.profile.unit+' × '+e.targetOverride.reps):rec.headline;
 const detail=e.targetOverride?('Session-only '+(e.targetOverride.reason||'override')+'. Routine progression is unchanged.'):rec.detail;
 return '<details class="workout-guidance focus-guidance" '+(e.targetOverride?'open':'')+'><summary>'+
  '<div class="workout-guidance-copy"><div class="eyebrow">COACH TARGET</div><div class="workout-guidance-title">'+esc(title)+'</div>'+
  '<div class="workout-guidance-meta">'+esc((coach&&coach.title)||compactTarget)+' · '+(e.config.restSeconds||120)+'s rest</div></div><span class="workout-guidance-more">Why</span></summary>'+
  '<div class="workout-guidance-detail"><div class="mini">'+esc(detail)+'</div>'+
  (coach?'<div class="mini guidance-coach-copy"><b>'+esc(coach.title)+':</b> '+esc(coach.text)+'</div>':'')+
  (plateText?'<div class="plates">🏋 '+esc(plateText)+'</div>':'')+
  (coach&&coach.canReset&&!e.targetOverride?'<div class="actions compact-guidance-action"><button class="btn small secondary" onclick="applyCoachReset('+ei+')">Apply '+coach.resetPercent+'% reset for today</button></div>':'')+
  '</div></details>';
}
function focusedSetCardHtml(e,ei,si,ex,prev){
 const s=e.sets[si],type=setType(s),wi=workingSetOrdinal(e,si),target=liveSetTarget(e,si,prev),ref=type==='working'?setReference(prev,wi):'Not used for progression',pt=plateLoadText(s.weight||target.weight,ex);
 const rirOptions=[0,1,2,3,4,5].map(function(v){return '<option value="'+v+'" '+(String(s.rir)===String(v)?'selected':'')+'>'+v+'</option>'}).join('');
 const increment=Math.max(.25,Number(e.config.increment||state.settings.defaultIncrement||5));
 return '<div class="focus-set-card set-card type-'+type+' '+(s.done?'completed':'')+'" data-set-index="'+si+'">'+
  '<div class="focus-set-head"><div><div class="exercise-kicker">'+esc(setDisplayLabel(e,si))+' · '+(si+1)+' OF '+e.sets.length+'</div><div class="focus-set-reference">'+(type==='working'?('Previous: '+esc(ref)):'Logged separately from progression')+'</div></div>'+
  '<button class="focus-set-options" onclick="openFocusedSetOptions('+ei+','+si+')" aria-label="Set options">•••</button></div>'+
  (type==='working'?'<div class="focus-set-target"><span class="set-target">'+esc(targetBadgeText(target,ex))+'</span></div>':'<div class="set-nonprogress-note">'+esc(setProgressionNote(type))+'</div>')+
  '<div class="live-entry"><div class="live-input-wrap numeric-entry"><label>'+((ex&&ex.equipment)==='bodyweight'?'Added weight':'Weight')+' ('+state.profile.unit+')</label><div class="numeric-stepper">'+
  '<button class="numeric-step-btn" aria-label="decrease weight" onclick="changeSetValue('+ei+','+si+',\'weight\',-'+increment+')">−</button>'+
  '<input class="direct-number" type="number" inputmode="decimal" enterkeyhint="done" step=".25" min="0" value="'+displaySetWeightValue(s.weight)+'" placeholder="'+((ex&&ex.equipment)==='bodyweight'?'0':'Enter')+'" onfocus="workoutNumberFocus(this)" onclick="workoutNumberFocus(this)" oninput="updateSet('+ei+','+si+',\'weight\',this.value)" onblur="commitFirstExerciseWeightAutofill('+ei+','+si+')" aria-label="weight">'+
  '<button class="numeric-step-btn" aria-label="increase weight" onclick="changeSetValue('+ei+','+si+',\'weight\','+increment+')">+</button></div></div>'+
  '<div class="live-input-wrap numeric-entry"><label>Reps</label><div class="numeric-stepper">'+
  '<button class="numeric-step-btn" aria-label="decrease reps" onclick="changeSetValue('+ei+','+si+',\'reps\',-1)">−</button>'+
  '<input class="direct-number" type="number" inputmode="numeric" enterkeyhint="done" min="0" value="'+s.reps+'" placeholder="Reps" onfocus="workoutNumberFocus(this)" onclick="workoutNumberFocus(this)" oninput="updateSet('+ei+','+si+',\'reps\',this.value)" aria-label="reps">'+
  '<button class="numeric-step-btn" aria-label="increase reps" onclick="changeSetValue('+ei+','+si+',\'reps\',1)">+</button></div></div>'+
  '<div class="live-input-wrap rir-small"><div class="input-label-row"><label>RIR</label></div><select onchange="updateSet('+ei+','+si+',\'rir\',this.value)"><option value="">—</option>'+rirOptions+'</select></div></div>'+
  (pt?'<div class="plates">'+esc(pt)+'</div>':'')+
  '<button class="complete-set '+(s.done?'done':'')+'" onclick="toggleSet('+ei+','+si+')">'+(s.done?'✓ Completed · tap to reopen':'Complete Set')+'</button>'+
  (s.pr?'<div class="pr-banner"><span class="inline-pr-mark">PR</span> '+esc(s.pr)+'</div>':'')+'</div>';
}
function focusedExerciseCanvasHtml(w,ei){
 const e=w.exercises[ei],ex=exById(e.exerciseId),prev=previousExercise(e.exerciseId),si=workoutFocusedSetIndex(w),prog=exerciseSetProgress(e),superset=supersetMeta(ei);
 const next=nextWorkoutExerciseIndex(ei,w),allDone=!workoutHasRemainingProgrammedWork(w);
 return '<div class="focus-exercise-stage" data-exercise-index="'+ei+'">'+workoutExerciseNavigatorHtml(w,ei)+
  '<div id="workoutExercise-'+ei+'" class="focus-exercise-canvas tone-'+(ei%4)+' '+(prog.complete?'complete-block':'')+'">'+
  '<div class="focus-exercise-actions"><button class="btn secondary" onclick="openWorkoutSubstitute('+ei+')">⇄ Substitute</button>'+
  '<button class="btn secondary focus-more-btn" onclick="openFocusedExerciseMore('+ei+')">More ···</button></div>'+
  focusedCoachTargetHtml(e,ei,ex,prev)+
  (superset?'<div class="superset-note"><b>Superset '+superset.label+'</b> · '+esc(supersetNames(superset.id))+'<br>Complete this set, then Swole Cat will rotate to the paired movement.</div>':'')+
  focusedSetRailHtml(e,ei,si)+focusedSetCardHtml(e,ei,si,ex,prev)+
  (allDone?'<div class="focus-workout-complete"><div><div class="eyebrow">SESSION READY</div><b>All programmed sets complete.</b></div><button class="btn green" onclick="finishWorkout()">Finish Workout</button></div>':
   (prog.complete&&next>=0?'<div class="focus-exercise-footer"><button class="btn secondary" onclick="deferFocusedExercise()">Go to unfinished exercise</button></div>':''))+
  '</div></div>';
}

let workoutKeyboardAnchorBound=false;
function anchorFocusedWorkoutSet(behavior='auto'){
 const card=document.querySelector('.focus-set-card');if(!card)return;
 const header=Math.max(0,Math.round((document.querySelector('header')&&document.querySelector('header').getBoundingClientRect().height)||0));
 const nav=Math.max(0,Math.round((document.querySelector('.focus-exercise-nav')&&document.querySelector('.focus-exercise-nav').getBoundingClientRect().height)||0));
 const top=Math.max(0,window.scrollY+card.getBoundingClientRect().top-header-nav-10);
 window.scrollTo({top:top,behavior:behavior});
}
function bindWorkoutKeyboardAnchor(){
 if(workoutKeyboardAnchorBound||!window.visualViewport)return;
 workoutKeyboardAnchorBound=true;
 window.visualViewport.addEventListener('resize',function(){
   const active=document.activeElement;
   if(!active||!active.closest||!active.closest('.focus-set-card'))return;
   setTimeout(function(){anchorFocusedWorkoutSet('auto')},70);
 });
}
function workoutNumberFocus(el){
 smartNumberFocus(el);
 setTimeout(function(){
   if(document.activeElement!==el)return;
   anchorFocusedWorkoutSet('smooth');
 },220);
}


function renderWorkout(){
 const w=state.activeWorkout;
 if(!w){document.getElementById('workoutArea').innerHTML='<div class="empty">No active workout.</div>';return;}
 const focus=normalizeWorkoutFocusState(w);
 const counts=workoutCounts(),pct=counts.total?Math.round(counts.done/counts.total*100):0,workoutCoach=workoutCoachSignal();
 let html='<div class="focus-session-strip">'+
  '<div class="focus-session-primary"><span class="focus-session-label"><span class="active-pulse"></span>ACTIVE</span><b class="focus-session-name" title="'+escAttr(w.routineName)+'">'+esc(w.routineName)+'</b></div>'+
  '<div class="focus-session-stats"><span>'+counts.done+'/'+counts.total+' sets</span><span>'+pct+'%</span><span>'+workoutElapsed()+'</span></div></div>'+
  '<div class="focus-session-progress"><div style="width:'+pct+'%"></div></div>';
 if(workoutCoach)html+='<details class="focus-session-coach"><summary>Coach session note</summary><div class="coachbox '+workoutCoach.level+'"><div class="coach-text">'+esc(workoutCoach.text)+'</div>'+
  (workoutCoach.level==='reset'?'<div class="actions"><button class="btn small secondary" onclick="applyLightSession()">Use a 7.5% lighter session</button></div>':'')+'</div></details>';
 html+=focus>=0?focusedExerciseCanvasHtml(w,focus):'<div class="empty">No available exercise.</div>';
 document.getElementById('workoutArea').innerHTML=html;
 bindWorkoutKeyboardAnchor();
 applyWorkoutMotionCues();
 requestAnimationFrame(syncWorkoutStickyOffsets);
}

const firstExerciseWeightSeedTimers=new Map();
function exerciseHasLoggedWeightHistory(exerciseId){
 return derivedSessionData().loggedExerciseIds.has(exerciseId);
}
function paintWorkoutSetWeight(ei,si){
 const set=state.activeWorkout?.exercises?.[ei]?.sets?.[si];if(!set)return;
 const card=document.querySelector(`#workoutExercise-${ei} .set-card[data-set-index="${si}"]`);
 const input=card?.querySelector('input[aria-label="weight"]');
 if(input&&document.activeElement!==input)input.value=displaySetWeightValue(set.weight);
}
function applyFirstExerciseWeightAutofill(ei,sourceSi){
 const e=state.activeWorkout?.exercises?.[ei],source=e?.sets?.[sourceSi];
 if(!e||!source||e.firstWeightAutofillDone)return false;
 if(exerciseHasLoggedWeightHistory(e.exerciseId))return false;
 if(!isProgressionSet(source))return false;
 const weight=Number(source.weight)||0;
 if(!(weight>0))return false;
 const targets=[];
 e.sets.forEach((set,si)=>{
   if(si===sourceSi||!isProgressionSet(set)||set.done)return;
   if(!(Number(set.weight)>0)){
     set.weight=weight;
     set.pr='';
     targets.push(si);
   }
 });
 e.firstWeightAutofillDone=true;
 if(targets.length){
   targets.forEach(si=>paintWorkoutSetWeight(ei,si));
   saveActiveWorkoutWithoutExtendingPendingSave();
 }
 return targets.length>0;
}
function scheduleFirstExerciseWeightAutofill(ei,si,delay=250){
 const e=state.activeWorkout?.exercises?.[ei],set=e?.sets?.[si];
 if(!e||!set||e.firstWeightAutofillDone||exerciseHasLoggedWeightHistory(e.exerciseId)||!isProgressionSet(set))return;
 const key=String(ei);
 clearTimeout(firstExerciseWeightSeedTimers.get(key));
 firstExerciseWeightSeedTimers.set(key,setTimeout(()=>{
   firstExerciseWeightSeedTimers.delete(key);
   const card=document.querySelector(`#workoutExercise-${ei} .set-card[data-set-index="${si}"]`);
   const input=card?.querySelector('input[aria-label="weight"]');
   if(input&&document.activeElement===input)return;
   applyFirstExerciseWeightAutofill(ei,si);
 },delay));
}
function commitFirstExerciseWeightAutofill(ei,si){
 const key=String(ei);
 clearTimeout(firstExerciseWeightSeedTimers.get(key));
 firstExerciseWeightSeedTimers.delete(key);
 return applyFirstExerciseWeightAutofill(ei,si);
}
function updateSet(ei,si,k,v){
 const s=state.activeWorkout.exercises[ei].sets[si];
 if(k==='rir')s[k]=(v===''?'':+v);
 else s[k]=(v===''?0:Math.max(0,+v||0));
 if(k!=='rir')s.pr='';
 saveActiveWorkout(true);
 if(k==='weight')scheduleFirstExerciseWeightAutofill(ei,si);
}
function toggleSet(ei,si){
 const w=state.activeWorkout,e=w.exercises[ei],set=e.sets[si];
 set.done=!set.done;w.focusExerciseIndex=ei;
 if(set.done){
   set.pr=isProgressionSet(set)?detectPR(e.exerciseId,set):'';
   haptic(set.pr?[35,40,70]:25);
   if(isProgressionSet(set)&&advanceSupersetAfterSet(ei,si))return;
   if(workoutHasRemainingProgrammedWork())startRestTimer(e.config.restSeconds||120);else stopRestTimer();
   if(advanceFromCompletedExercise(ei))return;
   w.focusSetIndex=workoutFirstIncompleteSetIndex(e);
   queueWorkoutSetAdvanceCue(ei,w.focusSetIndex);
 }else{
   set.pr='';w.focusSetIndex=si;
   w.deferredExerciseIndexes=(w.deferredExerciseIndexes||[]).filter(function(i){return i!==ei});
   w.exercises.forEach(function(x,i){x.expanded=i===ei});
 }
 saveActiveWorkout();renderWorkout();
}
function updateNotes(ei,v){state.activeWorkout.exercises[ei].notes=v;saveActiveWorkout(true);}
let restInterval=null,restLeft=0;
function workoutHasRemainingProgrammedWork(w=state.activeWorkout){
 return !!w?.exercises?.some(e=>!e.skipped&&(e.sets||[]).some(s=>!s.done));
}
function syncRestTimerDock(){
 const nav=document.querySelector('nav'),root=document.documentElement;
 const navHeight=Math.max(58,Math.round(nav?.getBoundingClientRect().height||0));
 root.style.setProperty('--rest-nav-height',navHeight+'px');
}
function paintRestTimer(){
 const box=document.getElementById('restTimer'),txt=document.getElementById('restTimerText');if(!box||!txt)return;
 const m=Math.floor(restLeft/60),s=String(Math.max(0,restLeft%60)).padStart(2,'0');txt.textContent=`${m}:${s}`;
}
function toggleRestTimerExpanded(){
 const box=document.getElementById('restTimer');if(!box?.classList.contains('show'))return;
 box.classList.toggle('expanded');
}
function startRestTimer(seconds){
 stopRestTimer();
 if(!workoutHasRemainingProgrammedWork())return;
 restLeft=Math.max(0,Number(seconds)||120);
 syncRestTimerDock();
 const box=document.getElementById('restTimer');
 box?.classList.remove('expanded');box?.classList.add('show');paintRestTimer();
 restInterval=setInterval(()=>{restLeft--;paintRestTimer();if(restLeft<=0){stopRestTimer();haptic([120,80,120]);}},1000);
}
function adjustRestTimer(delta){restLeft=Math.max(0,restLeft+delta);paintRestTimer();if(restLeft===0)stopRestTimer();}
function stopRestTimer(){
 if(restInterval)clearInterval(restInterval);restInterval=null;restLeft=0;
 const box=document.getElementById('restTimer');box?.classList.remove('show','expanded');
}
function cancelWorkout(){confirmAction('Cancel active workout?','This deletes the autosaved active workout draft. Completed workout history is not affected.',()=>{stopRestTimer();state.activeWorkout=null;save();updateActiveWorkoutChrome();releaseWakeLock();go('home',{resetHistory:true});showToast('Active workout cancelled');});}

function unfinishedWorkoutExercises(w){
 w=w||state.activeWorkout;if(!w)return [];
 return w.exercises.map(function(e,ei){
   const undone=(e.sets||[]).filter(function(s){return !s.done}).length;
   const done=(e.sets||[]).length-undone;
   return {e:e,ei:ei,done:done,total:(e.sets||[]).length,undone:undone};
 }).filter(function(row){return !row.e.skipped&&row.undone>0});
}
function focusUnfinishedWorkoutExercise(ei){
 const w=state.activeWorkout,from=normalizeWorkoutFocusState(w);
 closeModal();setWorkoutFocus(ei,null,{deferCurrent:false,render:false});saveActiveWorkout();renderWorkoutExerciseTransition(from,ei);
 const ex=exById(state.activeWorkout.exercises[ei].exerciseId);showToast('Back to '+((ex&&ex.name)||'unfinished exercise'));
}
function skipUnfinishedWorkoutExercise(ei){
 const w=state.activeWorkout,e=w&&w.exercises&&w.exercises[ei];if(!e)return;
 e.skipped=true;w.deferredExerciseIndexes=(w.deferredExerciseIndexes||[]).filter(function(i){return i!==ei});
 normalizeWorkoutFocusState(w);saveActiveWorkout();renderWorkout();
 const remaining=unfinishedWorkoutExercises(w);
 if(remaining.length)openUnfinishedWorkoutReview();else{closeModal();showToast('Unfinished work marked skipped')}
}
function openUnfinishedWorkoutReview(){
 const w=state.activeWorkout,rows=unfinishedWorkoutExercises(w);if(!w)return;
 if(!rows.length){closeModal();finishWorkout(true);return}
 const body=rows.map(function(row){
   const ex=exById(row.e.exerciseId),pending=workoutExerciseDeferred(row.ei,w);
   return '<div class="unfinished-work-row"><div class="unfinished-work-copy"><b>'+esc(ex&&ex.name||'Exercise')+'</b><span>'+row.done+' of '+row.total+' sets complete'+(pending?' · Pending':'')+'</span></div>'+
    '<div class="unfinished-work-actions"><button class="btn small" onclick="focusUnfinishedWorkoutExercise('+row.ei+')">Do It Now</button>'+
    '<button class="btn small secondary" onclick="skipUnfinishedWorkoutExercise('+row.ei+')">Skip Exercise</button></div></div>';
 }).join('');
 openModal('Unfinished workout',
  '<div class="notice"><b>'+rows.length+' exercise'+(rows.length===1?' is':'s are')+' unfinished.</b><br>Swole Cat remembered the work you moved past. Finish it now, explicitly skip it, or save the workout anyway.</div>'+
  '<div class="unfinished-work-list">'+body+'</div>'+
  '<div class="actions"><button class="btn secondary" onclick="finishWorkout(true)">Finish Anyway</button><button class="btn secondary" onclick="closeModal()">Keep Working Out</button></div>');
}

function finishWorkout(allowIncomplete=false){
 const w=state.activeWorkout;if(!w)return;
 const completed=w.exercises.some(function(e){return e.sets.some(function(s){return s.done})});
 if(!completed&&!allowIncomplete&&!confirm('No sets are marked complete. Save anyway?'))return;
 const unfinished=unfinishedWorkoutExercises(w);
 if(unfinished.length&&!allowIncomplete){openUnfinishedWorkoutReview();return}
 closeModal();
 const routine=state.routines.find(function(x){return x.id===w.routineId});
 if(w.structureDirty&&routine){
   openModal('Update your routine?',
    '<div class="notice">You changed today’s workout structure. Choose whether those structural changes stay only in this session or become the new saved version of <b>'+esc(routine.name)+'</b>.<br><br><b>Skip status is always today-only.</b> Updating the routine saves the current exercise order, today-only additions or removals, substitutions, supersets, and number of working sets.</div>'+
    '<div class="actions"><button class="btn green" onclick="finalizeWorkout(true)">Finish + Update Routine</button>'+
    '<button class="btn secondary" onclick="finalizeWorkout(false)">Finish · Today Only</button>'+
    '<button class="btn secondary" onclick="closeModal()">Keep Working Out</button></div>');
   return;
 }
 finalizeWorkout(false);
}
function finalizeWorkout(updateRoutine=false){
 const w=state.activeWorkout;if(!w)return;
 stopRestTimer();
 if(updateRoutine)syncActiveWorkoutStructureToRoutine();
 closeModal();
 const end=new Date(),duration=Math.max(0,Math.round(workoutElapsedMs(w,end.getTime())/60000));
 const session={id:w.id,routineId:w.routineId,routineName:w.routineName,trainingMode:normalizeTrainingMode(w.trainingMode),programId:w.programId||null,status:'finished',date:end.toISOString(),startDate:w.startDate,durationMinutes:duration,exercises:w.exercises};
 const progressHighlights=sessionProgressHighlights(session,state.sessions);
 state.sessions=[...state.sessions,session];
 advanceProgramAfterWorkout(session);
 state.activeWorkout=null;save();updateActiveWorkoutChrome();releaseWakeLock();haptic([40,45,100]);renderHome();go('home',{resetHistory:true});
 openModal('Workout complete',workoutRecapHtml(session,{updateRoutine,progressHighlights}));
}
