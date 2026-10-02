// Coach Swolecat v0.59 training-context intelligence.
// This layer consumes completed workout history as programming context.
// It does not diagnose recovery, soreness, injury, or medical readiness.

const COACH_INTELLIGENCE_VERSION='0.59.0';
const COACH_CONTEXT_CACHE=new WeakMap();

function coachIntelligenceReferenceMs(request){
 const raw=request?.referenceDate||request?.now;
 const ms=raw?new Date(raw).getTime():Date.now();
 return Number.isFinite(ms)?ms:Date.now();
}
function coachSessionsWithinDays(days,referenceMs=Date.now(),sessions=state.sessions){
 const start=referenceMs-Math.max(0,Number(days)||0)*86400000;
 return (sessions||[]).filter(s=>{
   const at=new Date(s?.date||0).getTime();
   return Number.isFinite(at)&&at>=start&&at<=referenceMs;
 });
}
function coachMuscleLedger(sessions){
 const scores={};
 (sessions||[]).forEach(session=>{
   Object.entries(sessionMuscleScores(session)).forEach(([region,value])=>{
     scores[region]=(scores[region]||0)+(Number(value)||0);
   });
 });
 return scores;
}
function coachPriorWeeklyAverage(referenceMs=Date.now(),weeks=4){
 const totals={},count=Math.max(1,Number(weeks)||1);
 for(let i=1;i<=count;i++){
   const end=referenceMs-(i-1)*7*86400000;
   const start=end-7*86400000;
   const rows=(state.sessions||[]).filter(s=>{
     const at=new Date(s?.date||0).getTime();
     return Number.isFinite(at)&&at>=start&&at<end;
   });
   const ledger=coachMuscleLedger(rows);
   Object.entries(ledger).forEach(([region,value])=>totals[region]=(totals[region]||0)+(Number(value)||0));
 }
 Object.keys(totals).forEach(region=>totals[region]/=count);
 return totals;
}
function coachExerciseLaterality(ex){
 const name=String(ex?.name||'');
 if(/\b(?:single[- ]?arm|single[- ]?leg|one[- ]?arm|one[- ]?leg|unilateral|alternating|concentration curl|bulgarian split squat|split squat|lunge|step[- ]?up|b-stance)\b/i.test(name))return 'unilateral';
 return 'bilateral';
}
function coachExerciseDemand(ex){
 const pattern=ex?.pattern||'',name=String(ex?.name||''),equipment=ex?.equipment||'';
 let systemic=1,axial=0,technical=1;
 if(['olympic_pull'].includes(pattern)){systemic=4;axial=3;technical=4}
 else if(pattern==='hinge'){systemic=3;axial=3;technical=3}
 else if(pattern==='squat'){systemic=3;axial=2;technical=2}
 else if(['lunge','sled_push','sled_pull'].includes(pattern)){systemic=2.5;axial=1;technical=2}
 else if(['horizontal_press','incline_press','vertical_press','horizontal_pull','vertical_pull'].includes(pattern)){systemic=2;axial=1;technical=2}
 else if(['carry','grip'].includes(pattern)){systemic=2;axial=1;technical=1.5}
 if(/chest supported|machine|pec deck/i.test(name)||equipment==='machine'){systemic=Math.max(1,systemic-.5);axial=Math.max(0,axial-1)}
 if(coachExerciseLaterality(ex)==='unilateral')technical+=.25;
 return {systemic,axial,technical,total:systemic+axial*.65+technical*.25};
}
function coachExerciseHistoryProfile(exerciseId,referenceMs=Date.now()){
 const h=exerciseHistory(exerciseId).filter(row=>new Date(row.date).getTime()<=referenceMs);
 const latest=h.at(-1),prior=h.at(-2);
 const e1=row=>row?.sets?.length?Math.max(...row.sets.map(s=>estimated1RM(s.weight,s.reps))):0;
 const latestE1=e1(latest),priorE1=e1(prior);
 let trend='baseline';
 if(priorE1>0){
   if(latestE1>priorE1*1.01)trend='up';
   else if(latestE1<priorE1*.97)trend='down';
   else trend='flat';
 }
 const latestAt=latest?new Date(latest.date).getTime():0;
 const daysSince=latestAt?Math.max(0,(referenceMs-latestAt)/86400000):Infinity;
 return {exposures:h.length,latest,prior,latestE1,priorE1,trend,daysSince};
}
function coachRecentDemandContext(referenceMs=Date.now(),days=3){
 let highDemandSets=0,axialSets=0;
 const byPattern={};
 coachSessionsWithinDays(days,referenceMs).forEach(session=>{
   (session.exercises||[]).forEach(row=>{
     if(row.skipped)return;
     const sets=progressionSets(row).length;if(!sets)return;
     const ex=exById(row.exerciseId);if(!ex)return;
     const demand=coachExerciseDemand(ex);
     if(demand.systemic>=3)highDemandSets+=sets;
     if(demand.axial>=2)axialSets+=sets;
     byPattern[ex.pattern]=(byPattern[ex.pattern]||0)+sets;
   });
 });
 return {highDemandSets,axialSets,byPattern};
}
function coachBuildTrainingContext(request){
 const referenceMs=coachIntelligenceReferenceMs(request);
 const currentSessions=coachSessionsWithinDays(7,referenceMs);
 const currentLedger=coachMuscleLedger(currentSessions);
 const priorAverage=coachPriorWeeklyAverage(referenceMs,4);
 const planned={...(request?.programMuscleUsage||{})};
 const loggedSessions=(state.sessions||[]).filter(s=>new Date(s?.date||0).getTime()<=referenceMs).length;
 return {
   version:COACH_INTELLIGENCE_VERSION,
   referenceMs,
   currentSessions,
   currentLedger,
   priorAverage,
   planned,
   recentDemand:coachRecentDemandContext(referenceMs,3),
   loggedSessions,
   historyDepth:loggedSessions>=24?'deep':loggedSessions>=8?'established':loggedSessions>=2?'emerging':'new'
 };
}
function coachTrainingContext(request){
 if(!request||typeof request!=='object')return coachBuildTrainingContext({});
 const cached=COACH_CONTEXT_CACHE.get(request);
 if(cached&&cached.revision===stateRevision)return cached.context;
 const context=coachBuildTrainingContext(request);
 COACH_CONTEXT_CACHE.set(request,{revision:stateRevision,context});
 return context;
}
function coachWeeklyReferenceSets(goal){
 if(goal==='hypertrophy')return Number(COACH_EVIDENCE_MODEL?.principles?.hypertrophyWeeklyVolumeReferenceSets)||10;
 if(goal==='strength')return 6;
 return 6;
}
function coachRegionNeedAdjustment(region,request,context=coachTrainingContext(request)){
 const current=(Number(context.currentLedger?.[region])||0)+(Number(context.planned?.[region])||0);
 const prior=Number(context.priorAverage?.[region])||0;
 const reference=coachWeeklyReferenceSets(request?.goal);
 let score=0;
 if(current<reference*.35)score+=18;
 else if(current<reference*.7)score+=10;
 else if(current<reference)score+=4;
 else if(current>reference*1.5)score-=8;
 if(prior>0&&current<prior*.55)score+=6;
 if(prior>0&&current>prior*1.5)score-=4;
 return score;
}
function coachExerciseContinuityAdjustment(ex,request,context=coachTrainingContext(request)){
 const profile=coachExerciseHistoryProfile(ex.id,context.referenceMs);
 let score=0;
 if(profile.exposures>=2){
   if(profile.trend==='up')score+=18;
   else if(profile.trend==='flat')score+=6;
   else if(profile.trend==='down')score-=2;
 }
 // Continuity is useful, but repeating yesterday's exact movement is not automatically preferred.
 if(profile.daysSince<=1)score-=16;
 else if(profile.daysSince<=3)score-=7;
 else if(profile.daysSince<=7)score-=2;
 if(request?.experienceLevel==='beginner'&&profile.exposures>=1)score+=10;
 return score;
}
function coachDemandAdjustment(ex,request,context=coachTrainingContext(request)){
 const demand=coachExerciseDemand(ex);
 let score=0;
 const recent=context.recentDemand||{};
 if(demand.axial>=2&&recent.axialSets>=6)score-=14;
 if(demand.systemic>=3&&recent.highDemandSets>=9)score-=10;
 if((recent.byPattern?.[ex.pattern]||0)>=6&&demand.systemic>=2.5)score-=8;
 if(request?.goal==='strength'&&COACH_COMPOUND_PATTERNS.has(ex.pattern))score+=4;
 return score;
}
function coachLateralityAdjustment(ex,request){
 const preference=request?.lateralityPreference||'auto',type=coachExerciseLaterality(ex);
 if(preference==='unilateral')return type==='unilateral'?24:-10;
 if(preference==='bilateral')return type==='bilateral'?18:-12;
 if(preference==='mixed')return type==='unilateral'?6:4;
 // No default hypertrophy superiority is assumed for unilateral work.
 return 0;
}
function coachHistoryAwareCandidateAdjustment(ex,request){
 const context=coachTrainingContext(request),meta=exerciseMuscleMetadata(ex),targets=new Set(request?.targetRegions||[]);
 let score=coachExerciseContinuityAdjustment(ex,request,context)+coachDemandAdjustment(ex,request,context)+coachLateralityAdjustment(ex,request);
 meta.primary.filter(region=>targets.has(region)).forEach(region=>score+=coachRegionNeedAdjustment(region,request,context));
 meta.secondary.filter(region=>targets.has(region)).forEach(region=>score+=coachRegionNeedAdjustment(region,request,context)*.3);
 return score;
}
function coachExercisePrescription(ex,request,defaults){
 const family=coachMovementFamily(ex),compound=COACH_COMPOUND_PATTERNS.has(ex?.pattern)&&!['biceps_curl','triceps_extension','dip_press'].includes(family);
 const grammar=request?.liftingGrammar||{};
 const explicitRest=Number.isFinite(Number(grammar.restSeconds))&&Number(grammar.restSeconds)>0;
 const explicitRIR=Number.isFinite(Number(grammar.targetRIR));
 let minReps=defaults.minReps,maxReps=defaults.maxReps,restSeconds=defaults.restSeconds,targetRIR=defaults.targetRIR;
 if(request?.goal==='strength'){
   if(compound){minReps=3;maxReps=6;restSeconds=Math.max(180,restSeconds||0);targetRIR=2}
   else {minReps=6;maxReps=12;restSeconds=Math.max(90,Math.min(150,restSeconds||120));targetRIR=2}
 }else if(request?.goal==='hypertrophy'){
   if(compound){minReps=6;maxReps=10;restSeconds=Math.max(120,restSeconds||0);targetRIR=2}
   else if(['lateral_raise','rear_delt','biceps_curl','triceps_extension','calf_raise','wrist_flexion','wrist_extension'].includes(family)){
     minReps=10;maxReps=15;restSeconds=Math.max(60,Math.min(90,restSeconds||90));targetRIR=1;
   }else {minReps=8;maxReps=12;restSeconds=Math.max(75,restSeconds||0);targetRIR=2}
 }else{
   if(compound){minReps=6;maxReps=10;restSeconds=Math.max(120,restSeconds||0);targetRIR=3}
   else {minReps=8;maxReps=12;restSeconds=Math.max(75,Math.min(120,restSeconds||120));targetRIR=2}
 }
 if(explicitRest)restSeconds=Number(grammar.restSeconds);
 if(explicitRIR)targetRIR=Number(grammar.targetRIR);
 return {...defaults,minReps,maxReps,restSeconds,targetRIR};
}
function coachExerciseIntelligenceReason(ex,request){
 const context=coachTrainingContext(request),meta=exerciseMuscleMetadata(ex),bits=[];
 const profile=coachExerciseHistoryProfile(ex.id,context.referenceMs);
 const targetPrimary=meta.primary.filter(r=>(request.targetRegions||[]).includes(r));
 if(targetPrimary.some(r=>coachRegionNeedAdjustment(r,request,context)>=10))bits.push('fills lighter recent weekly coverage');
 if(profile.trend==='up'&&profile.exposures>=2)bits.push('keeps a movement that is progressing');
 if(profile.daysSince<=3&&coachExerciseDemand(ex).systemic>=3)bits.push('selected despite recent high-demand work because it fits a required role');
 if(request?.lateralityPreference&&request.lateralityPreference!=='auto')bits.push(coachExerciseLaterality(ex)===request.lateralityPreference?'matches laterality request':request.lateralityPreference==='mixed'?'supports mixed unilateral/bilateral work':'');
 return bits.filter(Boolean).join(' · ');
}
function coachProjectedWeeklyLedger(request,selected,defaults){
 const context=coachTrainingContext(request),projected={...context.currentLedger};
 Object.entries(context.planned||{}).forEach(([region,value])=>projected[region]=(projected[region]||0)+(Number(value)||0));
 (selected||[]).forEach(ex=>{
   const p=coachExercisePrescription(ex,request,defaults),sets=Number(p.sets||defaults.sets)||0,meta=exerciseMuscleMetadata(ex);
   meta.primary.forEach(region=>projected[region]=(projected[region]||0)+sets);
   meta.secondary.forEach(region=>projected[region]=(projected[region]||0)+sets*.5);
 });
 return projected;
}
function coachWorkoutIntelligenceAudit(request,selected,defaults){
 const issues=[],warnings=[],pool=visibleExercises(),plan=coachCoveragePlan(request,selected.length),families={};
 selected.forEach(ex=>families[coachMovementFamily(ex)]=(families[coachMovementFamily(ex)]||0)+1);
 for(const slot of plan.core){
   const possible=pool.some(ex=>coachExerciseAllowedByConstraints(ex,request)&&slot.match(ex));
   if(possible&&!selected.some(slot.match))issues.push('Missing '+slot.label);
 }
 selected.forEach(ex=>{
   if(!coachExerciseAllowedByConstraints(ex,request))issues.push('Constraint mismatch: '+ex.name);
   const family=coachMovementFamily(ex),cap=coachFamilyCap(family,request,selected.length);
   if((families[family]||0)>cap)issues.push('Too many '+family+' movements');
 });
 const projected=coachProjectedWeeklyLedger(request,selected,defaults);
 const context=coachTrainingContext(request);
 const highDemand=selected.filter(ex=>coachExerciseDemand(ex).systemic>=3).length;
 if(highDemand>=3&&request.goal!=='strength')warnings.push('Several high-demand movements are stacked in one session.');
 return {
   version:COACH_INTELLIGENCE_VERSION,
   pass:issues.length===0,
   issues:[...new Set(issues)],
   warnings:[...new Set(warnings)],
   historyDepth:context.historyDepth,
   recentSessionCount:context.currentSessions.length,
   projectedWeekly:projected
 };
}
function coachIntelligenceSummaryText(draft){
 const audit=draft?.intelligenceAudit;if(!audit)return '';
 const pieces=[];
 if(audit.recentSessionCount)pieces.push(`${audit.recentSessionCount} logged session${audit.recentSessionCount===1?'':'s'} from the last 7 days informed exercise ranking`);
 else pieces.push('No recent training history was needed; Coach used evidence-backed baseline programming');
 pieces.push('weekly primary/secondary muscle overlap was checked');
 pieces.push('progressing movements receive continuity preference when they still fit the request');
 return pieces.join(' · ')+'.';
}
