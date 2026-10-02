// Coach Swolecat v0.63 Program auditor + long-term planning intelligence.
// Reads saved Program structure and completed local Program history.
// Findings are programming observations, never recovery/medical diagnoses.

const COACH_PROGRAM_AUDIT_VERSION='0.63.0';
const COACH_PROGRAM_AUDIT_WINDOW_DAYS=28;

function coachProgramAuditRoutines(program){
 return (program?.routineIds||[]).map((id,index)=>({id,index,routine:state.routines.find(r=>r.id===id)||null})).filter(x=>x.routine);
}
function coachProgramAuditRoutineCoverage(routine){
 const scores={};
 (routine?.exercises||[]).forEach(re=>{
  const ex=exById(re.exerciseId);if(!ex)return;
  const sets=Math.max(1,Number(re.sets)||1),meta=exerciseMuscleMetadata(ex);
  meta.primary.forEach(m=>scores[m]=(scores[m]||0)+sets);
  meta.secondary.forEach(m=>scores[m]=(scores[m]||0)+sets*.5);
 });
 return scores;
}
function coachProgramAuditAdd(target,source,scale=1){
 Object.entries(source||{}).forEach(([k,v])=>target[k]=(target[k]||0)+(Number(v)||0)*scale);
 return target;
}
function coachProgramAuditPlanned(program){
 const routines=coachProgramAuditRoutines(program),scores={},byRoutine={};
 const scale=routines.length?Math.max(1,Number(program.frequency)||routines.length)/routines.length:1;
 routines.forEach(row=>{
  const coverage=coachProgramAuditRoutineCoverage(row.routine);
  byRoutine[row.id]=coverage;coachProgramAuditAdd(scores,coverage,scale);
 });
 return {scores,byRoutine,scale};
}
function coachProgramAuditRecentSessions(program,referenceMs=Date.now(),days=COACH_PROGRAM_AUDIT_WINDOW_DAYS){
 const start=referenceMs-Math.max(7,Number(days)||28)*86400000;
 return programSessions(program).filter(s=>{
  const at=new Date(s.date||0).getTime();return Number.isFinite(at)&&at>=start&&at<=referenceMs;
 }).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}
function coachProgramAuditHistoryDays(program,referenceMs=Date.now()){
 const times=programSessions(program).map(s=>new Date(s.date||0).getTime()).filter(Number.isFinite);
 return times.length?Math.max(0,(referenceMs-Math.min(...times))/86400000):0;
}
function coachProgramAuditActual(program,referenceMs=Date.now()){
 const sessions=coachProgramAuditRecentSessions(program,referenceMs),raw={};
 sessions.forEach(s=>coachProgramAuditAdd(raw,sessionMuscleScores(s)));
 const historyDays=coachProgramAuditHistoryDays(program,referenceMs);
 const effectiveDays=sessions.length?Math.max(7,Math.min(28,Math.max(7,historyDays))):28,weeks=Math.max(1,effectiveDays/7),scores={};
 Object.entries(raw).forEach(([k,v])=>scores[k]=v/weeks);
 return {sessions,scores,weeks,effectiveDays};
}
function coachProgramAuditGroups(){
 return COACH_INSIGHT_GROUPS.map(g=>({key:g.key,label:g.label,regions:[...g.regions]}));
}
function coachProgramAuditGroupScore(scores,group){
 return group.regions.reduce((n,m)=>n+(Number(scores?.[m])||0),0);
}
function coachProgramAuditCoverageRows(program,referenceMs=Date.now()){
 const planned=coachProgramAuditPlanned(program),actual=coachProgramAuditActual(program,referenceMs);
 return coachProgramAuditGroups().map(g=>({
  ...g,plannedSets:coachProgramAuditGroupScore(planned.scores,g),actualSets:coachProgramAuditGroupScore(actual.scores,g)
 }));
}
function coachProgramAuditFinding(type,priority,title,text,extra={}){
 return {id:[type,extra.routineId||'',extra.exerciseId||'',extra.groupKey||'',extra.family||'',title].join(':'),type,priority,title,text,severity:priority>=90?'high':priority>=70?'medium':priority>=50?'low':'positive',...extra};
}
function coachProgramAuditExerciseEntries(program){
 const out=[];
 coachProgramAuditRoutines(program).forEach(row=>{
  (row.routine.exercises||[]).forEach(re=>{
   const ex=exById(re.exerciseId);if(!ex)return;
   const min=Number(re.minReps)||1,max=Number(re.maxReps)||min,band=max<=6?'low':min>=10?'high':'mid';
   out.push({routineId:row.id,routineName:row.routine.name,exerciseId:ex.id,exerciseName:ex.name,family:coachMovementFamily(ex),role:[re.trainingGoal||'general',band,re.progressionStrategy||re.mode||'double',re.setStructure?.type||'standard'].join('|'),preference:exercisePreference(ex.id),favorite:isFavorite(ex.id)});
  });
 });
 return out;
}
function coachProgramAuditAdherence(program,audit){
 const f=[],sessions=audit.actual.sessions;
 if(!sessions.length)return [coachProgramAuditFinding('history_depth',45,'No completed Program sessions yet.','Coach can audit Program structure now, but needs completed Program workouts before comparing saved frequency with actual completion.',{action:'none'})];
 if(audit.historyDays<14)return [coachProgramAuditFinding('history_depth',42,'Program history is still forming.','There are completed Program workouts, but fewer than two weeks of Program history, so Coach avoids strong adherence conclusions.',{action:'none'})];
 const target=Math.max(1,Number(program.frequency)||1),rate=sessions.length/audit.actual.weeks;
 audit.targetPerWeek=target;audit.actualPerWeek=rate;
 if(rate/target<.65)f.push(coachProgramAuditFinding('adherence',86,'Actual Program frequency is below the saved target.','The Program is set to '+target+' workouts per week. Recent completed Program history averages about '+rate.toFixed(1)+' per week. That is a completion pattern, not a recovery or motivation diagnosis.',{action:'edit_program',programId:program.id}));
 const counts={};program.routineIds.forEach(id=>counts[id]=0);sessions.forEach(s=>{if(counts[s.routineId]!=null)counts[s.routineId]++});
 const routines=coachProgramAuditRoutines(program);
 if(sessions.length>=Math.max(4,routines.length*2)&&routines.length>1){
  const avg=sessions.length/routines.length,max=Math.max(...Object.values(counts));
  routines.forEach(row=>{
   const n=counts[row.id]||0;
   if(n<=avg*.45&&max>=n+2)f.push(coachProgramAuditFinding('slot_gap',84,row.routine.name+' is underrepresented in completed Program history.','This Program slot has '+n+' recent completion'+(n===1?'':'s')+' while the rotation averages '+avg.toFixed(1)+' per slot. Coach is reporting the imbalance without assuming why.',{action:'edit_program',programId:program.id,routineId:row.id}));
  });
 }
 return f;
}
function coachProgramAuditCoverageFindings(program,audit){
 const f=[],evidence=audit.actual.sessions.length>=3&&audit.historyDays>=14,positive=audit.coverageRows.filter(x=>x.plannedSets>0);
 audit.coverageRows.forEach(row=>{
  if(Number(program.frequency)>=3&&row.plannedSets===0&&positive.length>=2)f.push(coachProgramAuditFinding('planned_gap',68,row.label+' has no meaningful planned coverage.','Across the saved Program Routines, Coach does not find meaningful primary/secondary coverage for '+row.label.toLowerCase()+'. That may be intentional, so this is a design observation.',{action:'edit_program',programId:program.id,groupKey:row.key}));
  else if(evidence&&row.plannedSets>=4&&row.actualSets<row.plannedSets*.45)f.push(coachProgramAuditFinding('actual_coverage_gap',78,row.label+' completion is well below the Program’s planned coverage.','The saved Program represents about '+row.plannedSets.toFixed(1)+' '+row.label.toLowerCase()+' set-equivalents per week, while recent completed Program sessions average about '+row.actualSets.toFixed(1)+'.',{action:'edit_program',programId:program.id,groupKey:row.key}));
 });
 return f;
}
function coachProgramAuditRedundancy(program){
 const f=[],families=new Map();
 coachProgramAuditExerciseEntries(program).forEach(e=>{if(!e.family||e.family==='other')return;if(!families.has(e.family))families.set(e.family,[]);families.get(e.family).push(e)});
 families.forEach((rows,family)=>{
  const routineIds=[...new Set(rows.map(x=>x.routineId))],exerciseIds=[...new Set(rows.map(x=>x.exerciseId))],roles=[...new Set(rows.map(x=>x.role))];
  if(routineIds.length<2||rows.length<3)return;
  const preferred=rows.filter(x=>x.preference==='prefer'||x.favorite).length;
  const sameAcrossThree=exerciseIds.length===1&&routineIds.length>=3&&roles.length===1;
  const variantsSameRole=exerciseIds.length>=2&&roles.length===1;
  const stacked=routineIds.some(id=>rows.filter(x=>x.routineId===id).length>=2);
  if(!(sameAcrossThree||variantsSameRole||stacked)||preferred===rows.length)return;
  const names=[...new Set(rows.map(x=>x.exerciseName))].join(', ');
  f.push(coachProgramAuditFinding('redundancy',72,patternLabel(family)+' work repeats with very similar roles across the Program.','Coach found '+rows.length+' '+family.replaceAll('_',' ')+' slots across '+routineIds.length+' Routines with a very similar progression/rep role: '+names+'.'+(preferred?' Some are explicitly preferred/favorited, so Coach will not treat them as automatic removal targets.':''),{action:'review_routine',programId:program.id,routineId:rows.at(-1).routineId,family}));
 });
 return f;
}
function coachProgramAuditCalendarDayNumber(value){
 const d=new Date(value);if(Number.isNaN(d.getTime()))return null;
 d.setHours(12,0,0,0);return Math.floor(d.getTime()/86400000);
}
function coachProgramAuditDistribution(program,audit){
 const f=[],routines=coachProgramAuditRoutines(program),groups=coachProgramAuditGroups(),seenActual=new Set();
 if(routines.length<2)return f;

 // Preferred days are availability preferences, not routine-to-weekday assignments.
 // Therefore actual adjacent-day findings come from completed Program sessions only.
 const sessions=audit.actual.sessions||[];
 for(let i=1;i<sessions.length;i++){
  const a=sessions[i-1],b=sessions[i],da=coachProgramAuditCalendarDayNumber(a.date),db=coachProgramAuditCalendarDayNumber(b.date);
  if(da==null||db==null||db-da!==1)continue;
  const aScores=sessionMuscleScores(a),bScores=sessionMuscleScores(b);
  groups.forEach(group=>{
   if(seenActual.has(group.key))return;
   const left=coachProgramAuditGroupScore(aScores,group),right=coachProgramAuditGroupScore(bScores,group);
   if(left<4||right<4)return;
   seenActual.add(group.key);
   f.push(coachProgramAuditFinding(
    'distribution',76,group.label+' work has landed on adjacent completed Program days.',
    (a.routineName||'One Program workout')+' on '+coachHistoryDateLabel(a.date)+' and '+(b.routineName||'the next Program workout')+' on '+coachHistoryDateLabel(b.date)+' both logged substantial '+group.label.toLowerCase()+' involvement. This describes recent scheduling, not a recovery or safety diagnosis.',
    {action:'edit_program',programId:program.id,routineId:b.routineId||null,groupKey:group.key,evidence:'actual_adjacent_sessions'}
   ));
  });
 }

 // A preferred-day risk is only deterministic when every routine in the rotation
 // substantially trains the same group. We never assign preferredDays by index.
 const days=[...new Set(program.preferredDays||[])].sort((a,b)=>a-b);
 const hasAdjacentPreferred=days.some((day,i)=>days.slice(i+1).some(other=>Math.min(Math.abs(day-other),7-Math.abs(day-other))===1));
 if(hasAdjacentPreferred&&days.length>=2){
  groups.forEach(group=>{
   const heavy=routines.filter(row=>coachProgramAuditGroupScore(audit.planned.byRoutine[row.id]||{},group)>=4);
   if(heavy.length!==routines.length)return;
   f.push(coachProgramAuditFinding(
    'distribution',62,group.label+' involvement spans the full rotation while preferred training days include an adjacent pair.',
    'Every saved Program Routine contains substantial '+group.label.toLowerCase()+' involvement, and the preferred schedule includes back-to-back training days. Coach cannot assign a specific Routine to a preferred weekday, so this is a schedule-design note rather than a claim about which workouts land together.',
    {action:'edit_program',programId:program.id,groupKey:group.key,evidence:'rotation_wide_schedule_risk'}
   ));
  });
 }

 // Concentration inside one routine is independent of weekday mapping.
 groups.forEach(group=>{
  const rows=routines.map(row=>({row,score:coachProgramAuditGroupScore(audit.planned.byRoutine[row.id]||{},group)}));
  const total=rows.reduce((n,x)=>n+x.score,0),top=rows.slice().sort((a,b)=>b.score-a.score)[0];
  if(Number(program.frequency)>=3&&total>=6&&top?.score>=total*.7&&top.score>=6){
   f.push(coachProgramAuditFinding(
    'distribution',64,group.label+' work is concentrated in '+top.row.routine.name+'.',
    top.row.routine.name+' contains about '+top.score.toFixed(1)+' of '+total.toFixed(1)+' planned '+group.label.toLowerCase()+' set-equivalents across the saved rotation. Coach is flagging concentration across the Program, not saying the design is automatically wrong.',
    {action:'review_routine',programId:program.id,routineId:top.row.id,groupKey:group.key,evidence:'routine_concentration'}
   ));
  }
 });
 return f;
}
function coachProgramAuditProgression(program){
 const f=[],seen=new Set(),entries=coachProgramAuditExerciseEntries(program);
 entries.forEach(e=>{
  if(seen.has(e.exerciseId))return;seen.add(e.exerciseId);
  const p=coachMultiWeekExerciseProfile(e.exerciseId,Date.now());if(p.exposures<3)return;
  const routine=entries.find(x=>x.exerciseId===e.exerciseId)?.routineId||null;
  if(p.status==='plateau_high_effort')f.push(coachProgramAuditFinding('plateau_high_effort',96,e.exerciseName+' has a repeated high-effort plateau pattern.','Across '+p.exposures+' recent exposures, the v0.60 progression engine sees a flat multi-week performance window with high logged effort. Coach recommends reviewing progression before replacing the exercise.',{action:'review_routine',programId:program.id,routineId:routine,exerciseId:e.exerciseId,status:p.status}));
  else if(p.status==='performance_dip')f.push(coachProgramAuditFinding('performance_dip',90,e.exerciseName+' is below stronger exposures from this block.','The latest logged performance is meaningfully below stronger exposures in the current multi-week history. Coach does not infer fatigue or recovery from that pattern.',{action:'open_progress',programId:program.id,routineId:routine,exerciseId:e.exerciseId,status:p.status}));
  else if(p.status==='plateau_watch')f.push(coachProgramAuditFinding('plateau_watch',74,e.exerciseName+' is flat enough for Coach to watch.','The recent multi-week window is flat, but logged effort does not meet the higher-effort plateau rule. The minimal next step is review, not an automatic swap.',{action:'open_progress',programId:program.id,routineId:routine,exerciseId:e.exerciseId,status:p.status}));
  else if(p.status==='progressing'&&p.exposures>=4)f.push(coachProgramAuditFinding('progressing',38,e.exerciseName+' is progressing inside this Program.','The multi-week performance signal is trending upward across '+p.exposures+' recent exposures. That supports keeping continuity unless another Program-level issue outweighs it.',{action:'open_progress',programId:program.id,routineId:routine,exerciseId:e.exerciseId,status:p.status}));
 });
 return f;
}
function coachProgramAudit(programId,referenceMs=Date.now()){
 const program=programById(programId);if(!program)return null;
 const audit={version:COACH_PROGRAM_AUDIT_VERSION,program,programId,routines:coachProgramAuditRoutines(program),planned:coachProgramAuditPlanned(program),actual:coachProgramAuditActual(program,referenceMs),historyDays:coachProgramAuditHistoryDays(program,referenceMs),coverageRows:coachProgramAuditCoverageRows(program,referenceMs),findings:[]};
 audit.findings=[...coachProgramAuditAdherence(program,audit),...coachProgramAuditCoverageFindings(program,audit),...coachProgramAuditRedundancy(program),...coachProgramAuditDistribution(program,audit),...coachProgramAuditProgression(program)].sort((a,b)=>b.priority-a.priority||a.title.localeCompare(b.title));
 if(!audit.findings.length)audit.findings.push(coachProgramAuditFinding('clear',30,'No major Program-level conflict is showing up yet.','Coach did not find a strong adherence, rotation, coverage, redundancy, distribution, or progression conflict with the current evidence.',{action:'none'}));
 audit.issueCount=audit.findings.filter(x=>x.priority>=50).length;
 return audit;
}
function coachProgramAuditIntent(text){
 const raw=String(text||'').trim(),lower=coachNormalizeGymText(coachNumbersToDigits(raw));if(!raw)return {handled:false};
 if(/\b(?:build|make|create|generate)\b.{0,30}\b(?:program|plan)\b/i.test(lower))return {handled:false};
 if(!/\b(?:audit|review|check|analyze|analyse|assess)\b.{0,35}\b(?:program|plan|split)\b|\bhow(?:\s+is|'s|\s+has).{0,35}\b(?:program|plan)\b|\b(?:program|plan).{0,20}\b(?:going|working|doing)\b/i.test(lower))return {handled:false};
 const programs=state.programs||[];if(!programs.length)return {handled:true,program:null,needsChoice:false};
 const exact=programs.filter(p=>lower.includes(coachNormalizeGymText(p.name)));if(exact.length===1)return {handled:true,program:exact[0],needsChoice:false};
 const active=activeProgram();if(active)return {handled:true,program:active,needsChoice:false};
 if(programs.length===1)return {handled:true,program:programs[0],needsChoice:false};
 return {handled:true,program:null,needsChoice:true,programs};
}
function coachProgramAuditCoverageText(audit){
 return audit.coverageRows.map(r=>r.label+': planned '+r.plannedSets.toFixed(1)+' / actual '+(audit.actual.sessions.length?r.actualSets.toFixed(1):'--')).join(' · ');
}
function coachProgramAuditActionLabel(f){return f.action==='review_routine'?'Review Routine':f.action==='open_progress'?'Open Progress':f.action==='edit_program'?'Review Program':''}
function coachProgramAuditFindingHtml(f,programId){
 const label=coachProgramAuditActionLabel(f),badge=f.severity==='high'?'HIGH':f.severity==='medium'?'CHECK':f.severity==='low'?'NOTE':'POSITIVE';
 return '<div class="card" style="margin-top:9px"><div class="eyebrow">'+esc(badge)+'</div><div class="exercise-name" style="margin-top:3px">'+esc(f.title)+'</div><div class="mini" style="margin-top:5px">'+esc(f.text)+'</div>'+(label?'<div class="actions"><button class="btn small secondary" onclick="coachProgramAuditAction(\''+escAttr(programId)+'\',\''+escAttr(f.id)+'\')">'+esc(label)+'</button></div>':'')+'</div>';
}
function renderCoachProgramAudit(audit){
 if(!audit)return false;
 const p=audit.program,rate=Number.isFinite(audit.actualPerWeek)?audit.actualPerWeek.toFixed(1):'--';
 openModal('Coach · Program Audit','<div class="coach-builder"><div class="coach-console"><div class="eyebrow">PROGRAM AUDIT // v0.63</div><div class="exercise-name" style="font-size:1.16rem;margin-top:5px">'+esc(p.name)+'</div><div class="mini" style="margin-top:5px">'+audit.routines.length+' Routines · target '+p.frequency+'×/week · recent actual '+rate+'×/week · '+audit.actual.sessions.length+' Program sessions in audit window</div></div><div class="coach-rationale"><b>Planned vs. recent completed muscle coverage:</b><br><span class="mini">'+esc(coachProgramAuditCoverageText(audit))+'</span></div><div class="mini" style="margin:9px 0 2px">Ranked findings · '+audit.issueCount+' items to review</div>'+audit.findings.map(f=>coachProgramAuditFindingHtml(f,p.id)).join('')+'<div class="notice">Findings are programming observations only. Coach does not diagnose fatigue, soreness, injury, recovery, overtraining, or medical readiness, and auditing never silently saves changes.</div><div class="actions"><button class="btn secondary" onclick="closeModal();newProgram(\''+escAttr(p.id)+'\')">Edit Program</button><button class="btn secondary" onclick="closeModal();go(\'analytics\')">Open Progress</button><button class="btn secondary" onclick="closeModal()">Done</button></div></div>');
 return true;
}
function openCoachProgramAudit(programId){const audit=coachProgramAudit(programId);if(!audit){showToast('Program not found');return false}return renderCoachProgramAudit(audit)}
function coachProgramAuditAction(programId,findingId){
 const audit=coachProgramAudit(programId),f=audit?.findings.find(x=>x.id===findingId);if(!f)return false;
 if(f.action==='review_routine'&&f.routineId){closeModal();if(openCoachRoutineControl(f.routineId)&&coachRoutineSession){coachRoutineSession.lastResponse='Program audit: '+f.title+' '+f.text;renderCoachRoutineControl()}return true}
 if(f.action==='open_progress'&&f.exerciseId){closeModal();openExerciseProgress(f.exerciseId);return true}
 if(f.action==='edit_program'){closeModal();newProgram(programId);return true}
 return false;
}
function coachProgramAuditChoose(id){return openCoachProgramAudit(id)}
function coachTryProgramAuditQuestion(text,{render=true}={}){
 const intent=coachProgramAuditIntent(text);if(!intent.handled)return false;if(!render)return true;
 if(!intent.program&&!intent.needsChoice){openModal('Coach Swolecat','<div class="notice">You do not have a saved Program to audit yet.</div>');return true}
 if(intent.needsChoice){openModal('Coach Swolecat','<div class="coach-console"><div class="eyebrow">PROGRAM AUDIT // CHOOSE</div><div class="exercise-name">Which Program should I audit?</div></div><div class="coach-choice-grid">'+intent.programs.map(p=>'<button class="btn secondary" onclick="coachProgramAuditChoose(\''+escAttr(p.id)+'\')">'+esc(p.name)+'</button>').join('')+'</div>');return true}
 return openCoachProgramAudit(intent.program.id);
}
