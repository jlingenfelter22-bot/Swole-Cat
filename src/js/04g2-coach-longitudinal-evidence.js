// Phase 4, checkpoint 1: READ-ONLY longitudinal evidence eligibility.
// This module does not change workout prescriptions, Coach routing, or saved data.
// It reuses the existing v0.60 exercise-profile engine and completed-set rules.
// Observations never diagnose injury, fatigue, recovery, or medical readiness.
const COACH_PHASE4_EVIDENCE_VERSION='0.94.0-shadow-readonly';

function coachPhase4ReferenceMs(value=Date.now()){
 const ms=Number(value);
 return Number.isFinite(ms)&&ms>0?ms:Date.now();
}
function coachPhase4DistinctExposureRows(exerciseId,referenceMs){
 // The adaptive engine already filters deload work and non-external loads.
 // Reduce repeated same-calendar-day logs to one exposure, choosing the
 // highest representative e1RM that day to avoid treating split logs as weeks.
 const rows=coachProgressionExposureRows(exerciseId,referenceMs,8)
  .filter(r=>Number.isFinite(new Date(r.date).getTime())&&
   new Date(r.date).getTime()<=referenceMs&&r.setCount>0&&r.bestE1>0);
 const days=new Map();
 for(const row of rows){
  const day=String(row.date).slice(0,10);
  const existing=days.get(day);
  if(!existing||row.bestE1>existing.bestE1)days.set(day,row);
 }
 return [...days.values()].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}
function coachPhase4ExerciseEvidence(exerciseId,referenceMs=Date.now()){
 const now=coachPhase4ReferenceMs(referenceMs),ex=exById(exerciseId);
 const base={exerciseId,name:ex?.name||'Unknown exercise',eligible:false,
  signal:'insufficient_evidence',confidence:'insufficient',observation:'',
  supporting:{exposures:0,spanDays:0,lastDaysAgo:null},
  action:'review_only',writesAllowed:false};
 if(!ex)return {...base,reason:'unknown_exercise'};
 if(exerciseLoadType(exerciseId)!=='external'||exerciseMeasurementType(exerciseId)!=='reps')
  return {...base,reason:'measurement_not_comparable_by_external_load'};
 // The underlying v0.60 profile processes eight raw exposures, not one
 // per training day. Its estimated trend cannot safely be reused if those
 // raw rows include duplicates or a session-level measurement/load override.
 // Fail closed instead of showing an apparently stronger multi-week claim.
 const raw=coachProgressionExposureRows(exerciseId,now,8);
 const rows=coachPhase4DistinctExposureRows(exerciseId,now);
 if(raw.some(r=>r.loadType!=='external'||r.measurementType!=='reps'))
  return {...base,reason:'mixed_load_or_measurement_history'};
 if(raw.length!==rows.length)
  return {...base,supporting:{...base.supporting,exposures:rows.length},
   reason:'duplicate_or_incomplete_comparable_exposures'};
 const latest=rows.at(-1),first=rows[0];
 const latestMs=new Date(latest?.date||0).getTime(),firstMs=new Date(first?.date||0).getTime();
 const spanDays=rows.length>=2?(latestMs-firstMs)/86400000:0;
 const lastDaysAgo=latest&&Number.isFinite(latestMs)?Math.max(0,(now-latestMs)/86400000):null;
 const supporting={exposures:rows.length,spanDays:Math.round(spanDays*10)/10,
  lastDaysAgo:lastDaysAgo==null?null:Math.round(lastDaysAgo*10)/10};
 if(rows.length<4||spanDays<10)return {...base,supporting,reason:'need_four_distinct_training_days_spanning_ten_days'};
 if(lastDaysAgo>28)return {...base,supporting,reason:'exercise_history_not_recent'};
 const profile=coachMultiWeekExerciseProfile(exerciseId,now);
 if(['plateau_high_effort','plateau_watch'].includes(profile.status)){
  // Trust the existing multi-week plateau classifier, but require enough
  // independent days and a recent actual exposure before surfacing it.
  return {...base,eligible:true,signal:profile.status,
   confidence:'review_candidate',supporting,
   observation:profile.status==='plateau_high_effort'
    ?'Recent logged performance has been flat across several training days with high logged effort. Review progression targets; do not automatically reduce load or change the exercise.'
    :'Recent logged performance has been relatively flat across several training days. Consider reviewing targets after another comparable exposure; this is not proof of a plateau.'};
 }
 if(profile.status==='performance_dip'){
  // A single off-day cannot justify a long-term intervention. Require two
  // independently logged days below the *earlier* performance benchmark.
  if(rows.length<5)return {...base,supporting,reason:'single_or_insufficient_performance_dip'};
  const earlier=rows.slice(0,-2),peak=Math.max(0,...earlier.map(r=>r.bestE1));
  const lowDays=rows.slice(-2);
  if(!(peak>0&&lowDays.every(r=>r.bestE1<peak*.94)))
   return {...base,supporting,reason:'single_session_dip_is_not_a_trend'};
  return {...base,eligible:true,signal:'repeated_performance_dip',
   confidence:'review_candidate',supporting,
   observation:'Two recent separately logged exposures were below earlier comparable performance. Review the log and training context before considering a change; no cause is inferred.'};
 }
 if(profile.status==='progressing'){
  return {...base,eligible:true,signal:'progressing',
   confidence:'descriptive',supporting,
   observation:'Recent externally loaded performance is trending upward. Keeping a working movement is a reasonable option; no progression rule changes are implied.'};
 }
 return {...base,supporting,reason:'no_actionable_multiweek_change'};
}
function coachPhase4RepeatSkippedEvidence(referenceMs=Date.now()){
 const now=coachPhase4ReferenceMs(referenceMs),since=now-42*86400000,observed=new Map();
 for(const session of state.sessions||[]){
  const at=new Date(session?.date||0).getTime();
  if(!Number.isFinite(at)||at<since||at>now||session.programPhase==='deload'||!session.routineId)continue;
  const completedOthers=(session.exercises||[]).some(e=>!e.skipped&&progressionSets(e).length>0);
  if(!completedOthers)continue;
  for(const e of session.exercises||[]){
   if(!exById(e.exerciseId))continue;
   const key=session.routineId+'|'+e.exerciseId;
   if(!observed.has(key))observed.set(key,{routineId:session.routineId,exerciseId:e.exerciseId,
    opportunities:new Set(),skipped:new Set(),lastSkip:0});
   const record=observed.get(key),day=String(session.date).slice(0,10);
   record.opportunities.add(day);
   if(e.skipped===true){
    record.skipped.add(day);record.lastSkip=Math.max(record.lastSkip,at);
   }
  }
 }
 return [...observed.values()].filter(x=>x.opportunities.size>=4&&x.skipped.size>=3&&
  x.skipped.size/x.opportunities.size>=.6&&now-x.lastSkip<=28*86400000)
  .map(x=>({signal:'repeated_explicit_skips',eligible:true,confidence:'review_candidate',
   exerciseId:x.exerciseId,routineId:x.routineId,name:exById(x.exerciseId)?.name||'Exercise',
   supporting:{opportunities:x.opportunities.size,explicitlySkipped:x.skipped.size},
   observation:'This exercise was explicitly skipped in several completed Routine workouts. Check whether it still fits your preferences or equipment; do not remove it automatically.',
   action:'review_only',writesAllowed:false}))
  .sort((a,b)=>b.supporting.explicitlySkipped-a.supporting.explicitlySkipped||
   a.name.localeCompare(b.name));
}
function coachPhase4ReadOnlyAudit({referenceMs=Date.now(),maxCandidates=6}={}){
 const now=coachPhase4ReferenceMs(referenceMs);
 const eligibleSessions=(state.sessions||[]).filter(s=>{
  const at=new Date(s?.date||0).getTime();
  return Number.isFinite(at)&&at<=now&&at>=now-84*86400000;
 });
 const seen=new Set();
 eligibleSessions.forEach(s=>(s.exercises||[]).forEach(e=>{
  if(exById(e.exerciseId))seen.add(e.exerciseId);
 }));
 const signals=[...seen].map(id=>coachPhase4ExerciseEvidence(id,now))
  .filter(x=>x.eligible);
 signals.push(...coachPhase4RepeatSkippedEvidence(now));
 const priority={plateau_high_effort:90,repeated_performance_dip:85,
  plateau_watch:60,repeated_explicit_skips:55,progressing:30};
 signals.sort((a,b)=>(priority[b.signal]||0)-(priority[a.signal]||0)||
  String(a.name).localeCompare(String(b.name))||
  String(a.exerciseId).localeCompare(String(b.exerciseId)));
 const count=Math.max(0,Math.min(12,Math.floor(Number(maxCandidates)||0)));
 return {version:COACH_PHASE4_EVIDENCE_VERSION,mode:'shadow_read_only',
  recommendationOnly:true,requiresUserReview:true,
  noProgramChanges:true,noProgressionOverrides:true,noHealthInferences:true,
  evidence:{completedSessionsIn84Days:eligibleSessions.length,
   distinctExercises:seen.size,eligibleObservations:signals.length},
  candidates:signals.slice(0,count),
  caveat:'Logged patterns are not diagnoses or proof of optimal training. Missing logs, exercise context, time since last use, and program goals limit interpretation.'};
}
