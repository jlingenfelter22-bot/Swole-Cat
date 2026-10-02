// Coach Swolecat v0.60 adaptive progression and multi-week training intelligence.
// This layer extends the v0.59 training-context model with exercise-specific
// progression strategies. It uses the user's own logged history only.
// It does not diagnose readiness, fatigue, injury, or recovery.

const COACH_ADAPTIVE_VERSION='0.60.0';

function coachProgressionExposureRows(exerciseId,referenceMs=Date.now(),limit=8){
 const rows=exerciseHistory(exerciseId)
   .filter(row=>new Date(row?.date||0).getTime()<=referenceMs)
   .slice(-Math.max(2,Number(limit)||8));
 return rows.map(row=>{
   const sets=(row.sets||[]).filter(s=>Number(s.weight)>=0&&Number(s.reps)>0);
   const e1s=sets.map(s=>estimated1RM(s.weight,s.reps));
   const rir=sets.map(s=>s.rir).filter(v=>v!==''&&v!=null&&Number.isFinite(Number(v))).map(Number);
   return {
     ...row,
     bestE1:e1s.length?Math.max(...e1s):0,
     maxWeight:sets.length?Math.max(...sets.map(s=>Number(s.weight)||0)):0,
     totalReps:sets.reduce((n,s)=>n+(Number(s.reps)||0),0),
     avgRIR:rir.length?rir.reduce((a,b)=>a+b,0)/rir.length:null,
     setCount:sets.length
   };
 });
}
function coachMultiWeekExerciseProfile(exerciseId,referenceMs=Date.now()){
 const rows=coachProgressionExposureRows(exerciseId,referenceMs,8),n=rows.length;
 if(!n)return {exerciseId,exposures:0,status:'new',changePct:0,recentChangePct:0,recentSpreadPct:0,highEffort:false,spanDays:0,recentSpanDays:0,rows};
 const best=Math.max(...rows.map(x=>x.bestE1||0)),latest=rows.at(-1),previous=rows.at(-2);
 const firstWindow=rows.slice(0,Math.min(3,n)).map(x=>x.bestE1||0).filter(Boolean);
 const recentRows=rows.slice(-Math.min(4,n));
 const recentWindow=recentRows.map(x=>x.bestE1||0).filter(Boolean);
 const firstBest=firstWindow.length?Math.max(...firstWindow):latest.bestE1||1;
 const recentBest=recentWindow.length?Math.max(...recentWindow):latest.bestE1||0;
 const recentLow=recentWindow.length?Math.min(...recentWindow):recentBest;
 const changePct=firstBest>0?(recentBest-firstBest)/firstBest:0;
 const recentChangePct=previous?.bestE1>0?(latest.bestE1-previous.bestE1)/previous.bestE1:0;
 const recentSpreadPct=recentBest>0?(recentBest-recentLow)/recentBest:0;
 const recentRIR=rows.slice(-3).map(x=>x.avgRIR).filter(v=>v!=null);
 const highEffort=recentRIR.length>=2&&recentRIR.reduce((a,b)=>a+b,0)/recentRIR.length<=1.5;
 const dates=rows.map(r=>new Date(r.date).getTime()).filter(Number.isFinite);
 const recentDates=recentRows.map(r=>new Date(r.date).getTime()).filter(Number.isFinite);
 const spanDays=dates.length>1?(Math.max(...dates)-Math.min(...dates))/86400000:0;
 const recentSpanDays=recentDates.length>1?(Math.max(...recentDates)-Math.min(...recentDates))/86400000:0;
 // A stall is a recent pattern, not the absence of progress across an entire block.
 // Require the recent four-exposure window to span at least 10 days so several
 // clustered sessions in one week are not mislabeled as a multi-week plateau.
 const stableWindow=n>=4&&recentSpanDays>=10&&recentSpreadPct<.02;
 const priorBest=n>=2?Math.max(...rows.slice(0,-1).map(x=>x.bestE1||0)):0;
 const performanceDip=n>=3&&spanDays>=7&&latest.bestE1>0&&priorBest>0&&latest.bestE1<priorBest*.94;
 let status='building';
 if(n===1)status='baseline';
 else if(performanceDip)status='performance_dip';
 else if(stableWindow&&highEffort)status='plateau_high_effort';
 else if(stableWindow)status='plateau_watch';
 else if(recentChangePct>.015||changePct>.025)status='progressing';
 else status='consolidating';
 return {exerciseId,exposures:n,status,changePct,recentChangePct,recentSpreadPct,highEffort,bestE1:best,latestE1:latest.bestE1||0,spanDays,recentSpanDays,rows};
}
function coachIsAdaptiveCompound(ex){
 if(!ex)return false;
 const family=coachMovementFamily(ex);
 return COACH_COMPOUND_PATTERNS.has(ex.pattern)&&!['biceps_curl','triceps_extension','dip_press'].includes(family);
}
function coachAdaptiveCandidateAdjustment(ex,request){
 const profile=coachMultiWeekExerciseProfile(ex.id,coachIntelligenceReferenceMs(request));
 let score=0;
 if(profile.status==='progressing')score+=12;
 else if(profile.status==='consolidating')score+=4;
 else if(profile.status==='plateau_watch')score+=1;
 else if(profile.status==='plateau_high_effort')score-=2;
 else if(profile.status==='performance_dip')score-=4;
 if(request?.experienceLevel==='beginner'&&profile.exposures>=2)score+=8;
 return score;
}
function coachAdaptiveProgressionStrategy(ex,request,basePrescription={}){
 const grammar=request?.liftingGrammar||{},profile=coachMultiWeekExerciseProfile(ex?.id,coachIntelligenceReferenceMs(request));
 const compound=coachIsAdaptiveCompound(ex),weighted=ex?.equipment!=='bodyweight';
 if(grammar.topBackoff?.enabled&&compound&&weighted)return 'top_backoff';
 if(request?.goal==='strength'&&compound&&weighted){
   if(request?.experienceLevel==='advanced'||profile.exposures>=3)return 'top_backoff';
   return 'load_first';
 }
 if(request?.goal==='strength')return 'load_first';
 return 'double';
}
function coachTopBackoffStructure(ex,request,base){
 const grammar=request?.liftingGrammar||{},tb=grammar.topBackoff||{};
 const strength=request?.goal==='strength';
 const topMin=Math.max(1,Number(tb.topMinReps)||(strength?3:6));
 const topMax=Math.max(topMin,Number(tb.topMaxReps)||(strength?5:8));
 const backoffMin=Math.max(1,Number(tb.backoffMinReps)||(strength?5:8));
 const backoffMax=Math.max(backoffMin,Number(tb.backoffMaxReps)||(strength?8:10));
 const topSets=Math.max(1,Math.min(2,Number(tb.topSets)||1));
 const requestedBackoff=Number(tb.backoffSets);
 const backoffSets=Math.max(1,Math.min(5,Number.isFinite(requestedBackoff)?requestedBackoff:Math.max(2,(Number(base.sets)||3)-topSets)));
 const backoffPercent=Math.max(70,Math.min(97.5,Number(tb.backoffPercent)||90));
 return {type:'top_backoff',topSets,backoffSets,backoffPercent,topMinReps:topMin,topMaxReps:topMax,backoffMinReps:backoffMin,backoffMaxReps:backoffMax};
}
function coachApplyAdaptivePrescription(ex,request,base){
 const out={...base},strategy=coachAdaptiveProgressionStrategy(ex,request,base);
 out.progressionStrategy=strategy;
 out.adaptiveProgression=true;
 if(strategy==='top_backoff'){
   const structure=coachTopBackoffStructure(ex,request,out);
   out.setStructure=structure;
   out.sets=structure.topSets+structure.backoffSets;
   out.minReps=Math.min(structure.topMinReps,structure.backoffMinReps);
   out.maxReps=Math.max(structure.topMaxReps,structure.backoffMaxReps);
   out.restSeconds=Math.max(out.restSeconds||0,request?.goal==='strength'?180:120);
 }
 return out;
}
function coachAdaptiveProgressionDecision(ex,request){
 const referenceMs=coachIntelligenceReferenceMs(request),profile=coachMultiWeekExerciseProfile(ex.id,referenceMs);
 const strategy=coachAdaptiveProgressionStrategy(ex,request,{});
 let action='establish_baseline';
 if(profile.exposures>=2){
   if(profile.status==='progressing')action='continue_progression';
   else if(profile.status==='plateau_high_effort')action='hold_or_small_reset';
   else if(profile.status==='plateau_watch')action='hold_and_retest';
   else if(profile.status==='performance_dip')action='hold_and_review';
   else action='continue_progression';
 }
 return {version:COACH_ADAPTIVE_VERSION,strategy,action,profile};
}
function coachAdaptiveReasonText(ex,request){
 const d=coachAdaptiveProgressionDecision(ex,request),p=d.profile;
 if(!p.exposures)return 'no prior performance yet';
 if(p.status==='progressing')return 'multi-week performance is progressing';
 if(p.status==='plateau_high_effort')return 'multi-week performance is flat with high logged effort, so Coach avoids forcing a bigger jump';
 if(p.status==='plateau_watch')return 'multi-week performance is flat, so Coach holds the progression before changing the movement';
 if(p.status==='performance_dip')return 'recent performance is below this block’s best, so Coach holds rather than forcing progression';
 return p.exposures>=2?'multi-week continuity is established':'baseline is still forming';
}
function coachAdaptiveRecommendation(config,prev,exerciseId){
 const topBackoff=config?.progressionStrategy==='top_backoff'||config?.setStructure?.type==='top_backoff';
 if(!topBackoff&&!config?.adaptiveProgression)return null;
 const done=progressionSets(prev);
 if(!topBackoff){
   if(!done.length||!exerciseId)return null;
   const profile=coachMultiWeekExerciseProfile(exerciseId,Date.now());
   if(!['plateau_high_effort','performance_dip'].includes(profile.status))return null;
   const weights=Array.from({length:Math.max(1,Number(config.sets)||done.length)},(_,i)=>Number(done[i]?.weight??done.at(-1)?.weight??0));
   const reps=Array.from({length:weights.length},(_,i)=>Math.max(1,Number(done[i]?.reps??done.at(-1)?.reps??config.minReps)||config.minReps));
   const reason=profile.status==='plateau_high_effort'
     ?'Multi-week performance has been flat while recent logged effort is high. Coach is holding the last completed targets instead of forcing another progression step.'
     :'Recent performance is below this training block’s best. Coach is holding the last completed targets for another exposure instead of automatically adding load or reps.';
   return {status:'adaptive_hold',weight:weights[0]||0,weights,targetReps:reps,headline:'Hold this target and consolidate',detail:reason};
 }
 const structure=config.setStructure||{};
 const topSets=Math.max(1,Number(structure.topSets)||1),backoffSets=Math.max(1,Number(structure.backoffSets)||2);
 const topMin=Math.max(1,Number(structure.topMinReps)||3),topMax=Math.max(topMin,Number(structure.topMaxReps)||5);
 const backMin=Math.max(1,Number(structure.backoffMinReps)||5),backMax=Math.max(backMin,Number(structure.backoffMaxReps)||8);
 const pct=Math.max(.7,Math.min(.975,(Number(structure.backoffPercent)||90)/100));
 const count=topSets+backoffSets,inc=Math.max(0,Number(config.increment)||0);
 if(!done.length){
   return {
     status:'baseline',weight:0,weights:Array(count).fill(0),
     targetReps:[...Array(topSets).fill(topMin),...Array(backoffSets).fill(backMin)],
     headline:'Establish your top set',
     detail:`Use a controlled top set for ${topMin}–${topMax} reps, then ${backoffSets} backoff set${backoffSets===1?'':'s'} for ${backMin}–${backMax}. Working weight still comes from you, not a population estimate.`
   };
 }
 const previousTop=done.find(s=>s.role==='top')||done[0],topWeight=Math.max(0,Number(previousTop?.weight)||0),topReps=Math.max(0,Number(previousTop?.reps)||0);
 const topRIR=previousTop?.rir!==''&&previousTop?.rir!=null&&Number.isFinite(Number(previousTop.rir))?Number(previousTop.rir):null;
 const targetRIR=Number.isFinite(Number(config.targetRIR))?Number(config.targetRIR):2;
 const profile=exerciseId?coachMultiWeekExerciseProfile(exerciseId,Date.now()):null;
 const adaptiveHold=!!config?.adaptiveProgression&&['plateau_high_effort','performance_dip'].includes(profile?.status);
 let nextTopWeight=topWeight,nextTopReps=Math.max(topMin,Math.min(topMax,topReps||topMin)),status=adaptiveHold?'adaptive_hold':'hold';
 const earnedLoad=!adaptiveHold&&topReps>=topMax&&(topRIR==null||topRIR>=Math.max(0,targetRIR-1));
 if(earnedLoad&&inc>0){
   nextTopWeight=roundLoad(topWeight+inc);nextTopReps=topMin;status='load';
 }else if(!adaptiveHold&&topReps<topMax){
   nextTopReps=Math.min(topMax,Math.max(topMin,topReps+1));status='reps';
 }
 const backWeight=nextTopWeight>0?roundLoad(nextTopWeight*pct):0;
 const weights=[...Array(topSets).fill(nextTopWeight),...Array(backoffSets).fill(backWeight)];
 const reps=[...Array(topSets).fill(nextTopReps),...Array(backoffSets).fill(backMin)];
 const headline=status==='load'
   ?`Top set: increase to ${nextTopWeight} ${state.profile.unit}`
   :status==='reps'?`Top set: aim for ${nextTopReps} reps at ${nextTopWeight} ${state.profile.unit}`
   :status==='adaptive_hold'?`Hold the top set at ${nextTopWeight} ${state.profile.unit}`
   :`Repeat the top set at ${nextTopWeight} ${state.profile.unit}`;
 const adaptiveDetail=status==='adaptive_hold'
   ?(profile?.status==='plateau_high_effort'
     ?' Recent multi-week performance is flat with high logged effort, so Coach is holding the top set instead of forcing a load or rep increase.'
     :' Recent performance is meaningfully below this block’s prior best, so Coach is holding the top set for another exposure.')
   :' Progress the top set first; backoff work follows the programmed percentage.';
 return {
   status,weight:nextTopWeight,weights,targetReps:reps,headline,
   detail:`${headline}. Backoff target: about ${Math.round(pct*100)}% (${backWeight} ${state.profile.unit}) for ${backMin}–${backMax} reps.${adaptiveDetail}`
 };
}
function coachAdaptiveSetRole(config,workingIndex){
 const s=config?.setStructure;
 if(s?.type!=='top_backoff')return 'working';
 return workingIndex<Math.max(1,Number(s.topSets)||1)?'top':'backoff';
}
function coachAdaptiveSetRepRange(config,workingIndex){
 const s=config?.setStructure;
 if(s?.type!=='top_backoff')return {min:config.minReps,max:config.maxReps};
 const top=workingIndex<Math.max(1,Number(s.topSets)||1);
 return top
   ?{min:Number(s.topMinReps)||config.minReps,max:Number(s.topMaxReps)||config.maxReps}
   :{min:Number(s.backoffMinReps)||config.minReps,max:Number(s.backoffMaxReps)||config.maxReps};
}
