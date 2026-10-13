// v0.89 Brain planning: bounded time feasibility estimates for generated sessions.
// Engineering planning estimates, NOT measured session times. No mutations and no network.
// Uses actual per-exercise sets/reps/rest from current Coach prescription rules.
function coachBrainSessionTimeEstimate(ids,request,defaults,{explicitConfigById={}}={}){
 const rows=[],selected=(ids||[]).map(id=>typeof id==='string'?exById(id):id).filter(Boolean);
 const hasCompound=selected.some(ex=>COACH_COMPOUND_PATTERNS.has(ex.pattern));
 // User-performed warmup and setup vary. The default is disclosed in previews.
 const warmupSeconds=selected.length?(hasCompound?300:180):0;
 let seconds=warmupSeconds;
 selected.forEach((ex,i)=>{
   const p=typeof coachExercisePrescription==='function'?coachExercisePrescription(ex,request,defaults):defaults;
   const config=explicitConfigById[ex.id]||{};
   const sets=Math.max(1,Math.min(12,Math.round(Number(config.sets||p.sets||3))));
   const range=Math.max(1,Math.min(50,Number(config.maxReps||p.maxReps||10)));
   const min=Math.max(1,Math.min(range,Number(config.minReps||p.minReps||range)));
   const tracking=typeof exerciseMeasurementType==='function'?exerciseMeasurementType(ex):'reps';
   const profile=typeof coachBrainExerciseService==='function'?coachBrainExerciseService()?.getProfile(ex.id):null;
   const isUnilateral=profile?.side==='unilateral'||(!profile&&/\b(?:single.arm|single.leg|alternating|bulgarian|split squat|step.up|lunge)\b/i.test(ex.name));
   // For true unilateral work, account for both sides rather than halving the prescription.
   const sideMultiplier=isUnilateral?1.7:1;
   const midReps=(min+range)/2;
   const repSeconds=tracking==='duration'?40:tracking==='distance'?45:3.5;
   const workingSeconds=sets*(tracking==='reps'?midReps*repSeconds:repSeconds)*sideMultiplier;
   const restSeconds=Math.max(0,Math.min(600,Number(p.restSeconds)||0))*(sets-1);
   const setupSeconds=i===0?45:75; // implement adjustment + walk between stations
   const loadSeconds=COACH_COMPOUND_PATTERNS.has(ex.pattern)?30:15;
   const timeSeconds=workingSeconds+restSeconds+setupSeconds+loadSeconds;
   rows.push({id:ex.id,name:ex.name,sets,minReps:min,maxReps:range,restSeconds:Number(p.restSeconds)||0,
     unilateral:isUnilateral,workSeconds:Math.round(workingSeconds),restTotalSeconds:restSeconds,
     setupSeconds:setupSeconds+loadSeconds,totalSeconds:Math.round(timeSeconds)});
   seconds+=timeSeconds;
 });
 const estimateMinutes=Math.round(seconds/60);
 const lowerMinutes=Math.max(0,Math.floor(seconds*.88/60));
 const upperMinutes=Math.ceil(seconds*1.22/60);
 const targetMinutes=Math.max(0,Number(request?.duration)||0);
 const overTarget=targetMinutes>0&&estimateMinutes>targetMinutes;
 return {
   version:'0.89.0-dev',basis:'engineering_estimate_not_timer_observation',
   targetMinutes,estimateMinutes,lowerMinutes,upperMinutes,overTarget,
   warmupMinutes:Math.round(warmupSeconds/60),rows,
   caution:'Estimates include warm-up, work, rest, equipment transitions and both sides where needed. Crowded equipment, actual pace and personal warm-ups can change duration.'
 };
}
function coachBrainTrimToTime(exercises,request,defaults,{retainMinimum=2}={}){
 if(!request?.brainEquipment||!(Number(request.duration)>0))return {exercises:[...exercises],time:null,removed:[]};
 const original=[...exercises],selected=[...original],removed=[];
 const mandatory=(request.requiredExerciseIds||[]);
 const coveredCore=arr=>{
   const slots=coachCoveragePlan(request,arr.length).core;
   return slots.every(slot=>!original.some(slot.match)||arr.some(slot.match));
 };
 let time=coachBrainSessionTimeEstimate(selected,request,defaults);
 while(time.estimateMinutes>request.duration&&selected.length>retainMinimum){
   // Remove only optional exercises; protect explicit requested movements, core
   // targets and existing order. No reduction to user-authored sets/rest.
   let removable=-1;
   for(let i=selected.length-1;i>=0;i--){
     if(mandatory.includes(selected[i].id))continue;
     const possible=selected.filter((_,j)=>i!==j);
     if(coveredCore(possible)){removable=i;break}
   }
   if(removable<0)break;
   removed.push(selected.splice(removable,1)[0].id);
   time=coachBrainSessionTimeEstimate(selected,request,defaults);
 }
 return {exercises:selected,removed,time};
}
