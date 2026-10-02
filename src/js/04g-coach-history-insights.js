// Coach Swolecat v0.62 training-history Q&A and deeper insights.
// Answers come only from completed local logs. Performance patterns are
// descriptive and never diagnose recovery, fatigue, injury, or readiness.

const COACH_HISTORY_INSIGHTS_VERSION='0.62.0';
let coachHistoryQuestionContext=null;

function coachHistoryDateLabel(value){
 const d=new Date(value);if(Number.isNaN(d.getTime()))return 'unknown date';
 return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
}
function coachHistoryDaysSince(value,referenceMs=Date.now()){
 const at=new Date(value||0).getTime();
 return Number.isFinite(at)?Math.max(0,Math.floor((referenceMs-at)/86400000)):Infinity;
}
function coachHistorySetText(set){
 const weight=Number(set?.weight)||0,reps=Math.max(0,Number(set?.reps)||0);
 const rir=set?.rir!==''&&set?.rir!=null&&Number.isFinite(Number(set.rir))?Number(set.rir):null;
 const role=set?.role&&set.role!=='working'?String(set.role).replaceAll('_',' ')+' ':'';
 return role+(weight>0?weight+' '+state.profile.unit+' × '+reps:reps+' reps')+(rir!=null?' @ '+rir+' RIR':'');
}
function coachHistorySetSummary(row,limit=6){
 const sets=(row?.sets||[]).filter(s=>Number(s.reps)>0);
 if(!sets.length)return 'No completed working sets were logged.';
 return sets.slice(0,limit).map(coachHistorySetText).join(' · ')+(sets.length>limit?' · +'+(sets.length-limit)+' more':'');
}
function coachHistoryResolveExercise(text){
 const raw=String(text||''),analysis=coachAnalyzeExerciseMentions(raw),ids=[...new Set((analysis.mentions||[]).map(x=>x.exerciseId))];
 if(ids.length===1)return {exercise:exById(ids[0]),alternatives:[],ambiguous:false};
 if(ids.length>1)return {exercise:null,alternatives:ids.slice(0,4).map(exById).filter(Boolean),ambiguous:true};
 const cleaned=coachNormalizeGymText(coachNumbersToDigits(raw))
  .replace(/\b(?:what|when|how|which|did|do|have|has|was|were|am|is|are|my|i|me|last|time|previous|session|workout|history|progress|progressing|progression|trend|trending|stalled|stalling|stall|plateau|best|pr|record|heaviest|strongest|logged|recent|recently|on|for|with|at)\b/g,' ')
  .replace(/[?!.]/g,' ').replace(/\s+/g,' ').trim();
 if(!cleaned)return {exercise:null,alternatives:[],ambiguous:false};
 const understood=coachUnderstandExercisePhrase(cleaned);
 if(understood.level==='high'&&understood.exercise)return {exercise:understood.exercise,alternatives:[],ambiguous:false};
 if(understood.level==='medium')return {exercise:null,alternatives:(understood.alternatives||[]).slice(0,4).map(x=>x.exercise),ambiguous:true};
 return {exercise:null,alternatives:[],ambiguous:false};
}
function coachHistoryQuestionIntent(text){
 const raw=String(text||'').trim(),lower=coachNormalizeGymText(coachNumbersToDigits(raw));
 if(!raw)return {handled:false,type:''};
 const build=/\b(?:build|make me|give me|create|generate|start)\b.{0,35}\b(?:workout|routine|program|session)\b/i.test(lower);
 const historySignal=/\b(?:last time|last session|last workout|previous time|history|progress(?:ing|ion)?|trend(?:ing)?|stall(?:ed|ing)?|plateau|best|pr|record|heaviest|strongest|consistent|consistency|how many workouts|haven(?:'|’|\s)?t(?:\s+i)?\s+trained|havent(?:\s+i)?\s+trained|have(?:\s+i)?\s+not\s+trained|not trained lately|neglect(?:ed|ing)?|when did i last|recently trained|trained lately)\b/i.test(lower);
 const question=/^(?:what|when|how|which|have i|has my|did i|am i)\b/i.test(lower)||raw.includes('?');
 if(build&&!question)return {handled:false,type:''};
 if(!historySignal&&!question)return {handled:false,type:''};

 const resolved=coachHistoryResolveExercise(raw),hasExercise=!!resolved.exercise||resolved.ambiguous;
 const target=typeof coachParseTargets==='function'?coachParseTargets(raw):{keys:[],labels:[],regions:[]};
 if(/\b(?:consistent|consistency|how many workouts|training frequency|how often)\b/i.test(lower))return {handled:true,type:'consistency',raw,lower,resolved,target};
 if(/\b(?:haven(?:'|’|\s)?t(?:\s+i)?\s+trained|havent(?:\s+i)?\s+trained|have(?:\s+i)?\s+not\s+trained|not trained lately|neglect(?:ed|ing)?|what.*not.*train)\b/i.test(lower))return {handled:true,type:'neglected',raw,lower,resolved,target};
 if(!hasExercise&&/\b(?:what|which).{0,25}\b(?:progressing|stalled|stalling|plateau|trending|going up|going down)\b/i.test(lower))return {handled:true,type:'global_progress',raw,lower,resolved,target};
 if(hasExercise&&/\b(?:best|pr|record|heaviest|strongest)\b/i.test(lower))return {handled:true,type:'exercise_best',raw,lower,resolved,target};
 if(hasExercise&&/\b(?:progress(?:ing|ion)?|trend(?:ing)?|stall(?:ed|ing)?|plateau)\b/i.test(lower))return {handled:true,type:'exercise_progress',raw,lower,resolved,target};
 if(hasExercise&&/\b(?:last time|last session|last workout|previous time|what did i|when did i last)\b/i.test(lower))return {handled:true,type:'exercise_last',raw,lower,resolved,target};
 if(!hasExercise&&(target?.regions||[]).length&&/\b(?:when did i last|last train|last hit|trained lately|recently trained)\b/i.test(lower))return {handled:true,type:'target_recency',raw,lower,resolved,target};
 return {handled:false,type:''};
}
function coachHistoryRoutineForExercise(exerciseId){
 const recent=state.sessions.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).find(s=>s.routineId&&(s.exercises||[]).some(e=>e.exerciseId===exerciseId));
 const recentRoutine=recent?state.routines.find(r=>r.id===recent.routineId&&!r.archivedAt):null;
 return recentRoutine||state.routines.find(r=>!r.archivedAt&&(r.exercises||[]).some(e=>e.exerciseId===exerciseId))||null;
}
function coachHistoryLastExerciseAnswer(ex){
 const h=exerciseHistory(ex.id);
 if(!h.length)return {handled:true,type:'exercise_last',title:ex.name,answer:'You do not have a completed working-set entry for '+ex.name+' yet.',exerciseId:ex.id};
 const row=h.at(-1),days=coachHistoryDaysSince(row.date);
 return {handled:true,type:'exercise_last',title:'Last '+ex.name,exerciseId:ex.id,
  answer:'Your last logged '+ex.name+' was '+coachHistoryDateLabel(row.date)+(days===0?' (today)':days===1?' (1 day ago)':' ('+days+' days ago)')+' in '+(row.routineName||'a workout')+'. '+coachHistorySetSummary(row)};
}
function coachHistoryBestExerciseAnswer(ex){
 const h=exerciseHistory(ex.id);
 if(!h.length)return {handled:true,type:'exercise_best',title:ex.name,answer:'You do not have a completed working-set entry for '+ex.name+' yet.',exerciseId:ex.id};
 let best=null,bestRow=null;
 h.forEach(row=>(row.sets||[]).forEach(set=>{
  const weight=Number(set.weight)||0,reps=Number(set.reps)||0;
  if(!best||weight>Number(best.weight)||weight===Number(best.weight)&&reps>Number(best.reps)){best=set;bestRow=row}
 }));
 if(!best)return {handled:true,type:'exercise_best',title:ex.name,answer:'I found history for '+ex.name+', but no usable completed working set.',exerciseId:ex.id};
 return {handled:true,type:'exercise_best',title:'Best '+ex.name,exerciseId:ex.id,
  answer:'Your heaviest logged working set for '+ex.name+' is '+(Number(best.weight)>0?Number(best.weight)+' '+state.profile.unit+' × '+Number(best.reps):Number(best.reps)+' reps')+' on '+coachHistoryDateLabel(bestRow.date)+'.'};
}
function coachHistoryProfileSentence(profile){
 if(!profile?.exposures)return 'There is not enough logged history to describe a trend yet.';
 if(profile.exposures===1)return 'You have one logged exposure, so this is still a baseline rather than a trend.';
 if(profile.status==='progressing')return 'Across '+profile.exposures+' recent exposures, your logged performance is trending up.';
 if(profile.status==='plateau_high_effort')return 'Your recent performance is flat across a multi-week window and the recent logged RIR values show high effort. Coach classifies that as a high-effort plateau pattern.';
 if(profile.status==='plateau_watch')return 'Your recent performance is flat across a multi-week window. Coach is watching the plateau before assuming the exercise needs to change.';
 if(profile.status==='performance_dip')return 'Your latest logged performance is meaningfully below the stronger exposures from this block. Coach classifies that as a recent performance dip.';
 if(profile.status==='consolidating')return 'Your recent sessions are relatively stable. Coach classifies this as consolidation rather than a clear rise or stall.';
 return 'You have '+profile.exposures+' logged exposures and the pattern is still forming.';
}
function coachHistoryExerciseProgressAnswer(ex){
 const profile=coachMultiWeekExerciseProfile(ex.id,Date.now()),latest=exerciseHistory(ex.id).at(-1),routine=coachHistoryRoutineForExercise(ex.id);
 let answer=coachHistoryProfileSentence(profile);
 if(latest)answer+=' Latest logged session: '+coachHistoryDateLabel(latest.date)+' - '+coachHistorySetSummary(latest,4)+'.';
 answer+=' This is a performance-history interpretation, not a recovery or readiness diagnosis.';
 return {handled:true,type:'exercise_progress',title:ex.name+' trend',answer,exerciseId:ex.id,routineId:routine?.id||null,status:profile.status,profile};
}
function coachHistoryProfiles(){
 return allExercises().map(ex=>({ex,profile:coachMultiWeekExerciseProfile(ex.id,Date.now())})).filter(x=>x.profile.exposures>=2);
}
function coachHistoryGlobalProgressAnswer(text){
 const lower=String(text||'').toLowerCase(),rows=coachHistoryProfiles();
 if(!rows.length)return {handled:true,type:'global_progress',title:'Training trends',answer:'You do not have enough repeated exercise history yet for Coach to compare multi-week trends.'};
 let mode='progressing';
 if(/\b(?:stall|stalled|stalling|plateau|flat)\b/.test(lower))mode='stalled';
 else if(/\b(?:down|dip)\b/.test(lower))mode='down';
 const progressing=rows.filter(x=>x.profile.status==='progressing').sort((a,b)=>b.profile.changePct-a.profile.changePct);
 const stalled=rows.filter(x=>['plateau_high_effort','plateau_watch'].includes(x.profile.status));
 const down=rows.filter(x=>x.profile.status==='performance_dip');
 const list=mode==='stalled'?stalled:mode==='down'?down:progressing;
 const label=mode==='stalled'?'Exercises with a recent flat multi-week pattern: ':mode==='down'?'Exercises with a recent performance-dip pattern: ':'Exercises currently classified as progressing: ';
 const answer=list.length?label+list.slice(0,5).map(x=>x.ex.name).join(', ')+'. These labels describe your logged performance only.':'Nothing currently meets that multi-week history rule.';
 const focus=list[0],routine=focus?coachHistoryRoutineForExercise(focus.ex.id):null;
 return {handled:true,type:'global_progress',title:'Training trends',answer,exerciseId:focus?.ex?.id||null,routineId:routine?.id||null};
}
function coachHistoryConsistencyAnswer(text){
 const lower=coachNormalizeGymText(coachNumbersToDigits(String(text||''))),now=Date.now();
 let start,label='the last 4 weeks',days=28;
 if(/\bthis week\b/.test(lower)){start=startOfWeek().getTime();label='this week';days=null}
 else{
  let m=lower.match(/\blast\s+(\d+)\s+weeks?\b/);
  if(m){days=Math.max(7,Math.min(365,(Number(m[1])||4)*7));label='the last '+Number(m[1])+' weeks'}
  m=lower.match(/\blast\s+(\d+)\s+days?\b/);
  if(m){days=Math.max(1,Math.min(365,Number(m[1])||28));label='the last '+Number(m[1])+' days'}
  if(/\b(?:this month|past month|last month)\b/.test(lower)){days=30;label='the last 30 days'}
  start=now-days*86400000;
 }
 const sessions=state.sessions.filter(s=>{const at=new Date(s.date).getTime();return Number.isFinite(at)&&at>=start&&at<=now});
 if(!sessions.length)return {handled:true,type:'consistency',title:'Training consistency',answer:'You have no completed workouts logged '+label+'.'};
 const uniqueDays=new Set(sessions.map(s=>localDateKey(s.date)).filter(Boolean)).size,totalSets=sessions.reduce((n,s)=>n+sessionSetCount(s),0);
 let answer='You logged '+sessions.length+' completed workout'+(sessions.length===1?'':'s')+' across '+uniqueDays+' training day'+(uniqueDays===1?'':'s')+' '+label+', totaling '+totalSets+' working sets.';
 if(days&&days>=14)answer+=' That is about '+(Math.round((sessions.length/(days/7))*10)/10)+' workouts per week.';
 return {handled:true,type:'consistency',title:'Training consistency',answer};
}
function coachHistoryTargetRecencyAnswer(intent){
 const regions=intent?.target?.regions||[],label=intent?.target?.labels?.[0]||'that area';
 if(!regions.length)return {handled:true,type:'target_recency',title:'Training recency',answer:'Tell me which muscle or training area you want checked.'};
 const row=state.sessions.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).find(s=>{const scores=sessionMuscleScores(s);return regions.some(r=>(Number(scores[r])||0)>0)});
 if(!row)return {handled:true,type:'target_recency',title:label+' recency',answer:'I do not see completed '+label.toLowerCase()+' work in your logged history yet.',targetKey:intent.target.keys?.[0]||null};
 const days=coachHistoryDaysSince(row.date);
 return {handled:true,type:'target_recency',title:label+' recency',targetKey:intent.target.keys?.[0]||null,
  answer:'Your most recent logged '+label.toLowerCase()+' work was '+coachHistoryDateLabel(row.date)+(days===0?' (today)':days===1?' (1 day ago)':' ('+days+' days ago)')+' in '+(row.routineName||'a workout')+'.'};
}
function coachHistoryNeglectedRows(referenceMs=Date.now()){
 const sessions=state.sessions.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 if(sessions.length<3)return [];
 const oldest=new Date(sessions[0]?.date||0).getTime(),historyDays=Number.isFinite(oldest)?Math.floor((referenceMs-oldest)/86400000):0;
 if(historyDays<14)return [];
 const recent=sessions.filter(s=>{const at=new Date(s.date).getTime();return Number.isFinite(at)&&referenceMs-at<=14*86400000});
 if(recent.length<2)return [];
 return COACH_INSIGHT_GROUPS.map(group=>{
  const last=[...sessions].reverse().find(s=>coachSessionGroupScore(s,group)>0);
  const days=last?coachHistoryDaysSince(last.date,referenceMs):historyDays;
  const otherWork=recent.reduce((n,s)=>n+COACH_INSIGHT_GROUPS.filter(g=>g.key!==group.key).reduce((x,g)=>x+coachSessionGroupScore(s,g),0),0);
  return {group,last,days,otherWork,recentCount:recent.length};
 }).filter(x=>x.days>=14&&x.otherWork>0).sort((a,b)=>b.days-a.days);
}
function coachHistoryNeglectedAnswer(){
 const rows=coachHistoryNeglectedRows();
 if(!rows.length)return {handled:true,type:'neglected',title:'Recent coverage',answer:'I do not see a broad push, pull, or lower-body area that has been absent for about two weeks while you kept logging other workouts.'};
 const first=rows[0],list=rows.map(x=>x.group.label+' ('+(x.last?x.days+' days':'not yet logged')+')').join(', ');
 return {handled:true,type:'neglected',title:'Recent coverage',targetKey:first.group.key,group:first.group,days:first.days,
  answer:'Broad areas that have not shown up recently: '+list+'. This is a log-coverage observation, not a statement that you need to train them today.'};
}
function coachHistoryClarification(intent){
 return {handled:true,type:'clarification',title:'Which exercise?',answer:'I found more than one possible exercise. Pick the one you meant so I do not guess from your history.',options:(intent.resolved?.alternatives||[]).slice(0,4),originalText:intent.raw,intentType:intent.type};
}
function coachHistoryAnswer(text,forcedExerciseId=null,forcedType=null){
 const intent=coachHistoryQuestionIntent(text);
 if(!intent.handled&&!forcedType)return {handled:false};
 if(forcedType){intent.handled=true;intent.type=forcedType}
 if(forcedExerciseId)intent.resolved={exercise:exById(forcedExerciseId),alternatives:[],ambiguous:false};
 if(intent.resolved?.ambiguous&&!forcedExerciseId)return coachHistoryClarification(intent);
 const ex=intent.resolved?.exercise;
 if(intent.type==='exercise_last'&&ex)return coachHistoryLastExerciseAnswer(ex);
 if(intent.type==='exercise_best'&&ex)return coachHistoryBestExerciseAnswer(ex);
 if(intent.type==='exercise_progress'&&ex)return coachHistoryExerciseProgressAnswer(ex);
 if(intent.type==='global_progress')return coachHistoryGlobalProgressAnswer(intent.raw);
 if(intent.type==='consistency')return coachHistoryConsistencyAnswer(intent.raw);
 if(intent.type==='target_recency')return coachHistoryTargetRecencyAnswer(intent);
 if(intent.type==='neglected')return coachHistoryNeglectedAnswer();
 return {handled:false};
}
function coachHistoryActionHtml(result){
 const buttons=[];
 if(result?.exerciseId)buttons.push('<button class="btn secondary" onclick="closeModal();openExerciseProgress(\''+escAttr(result.exerciseId)+'\')">Open Progress</button>');
 if(result?.routineId)buttons.push('<button class="btn secondary" onclick="coachHistoryOpenRoutineReview(\''+escAttr(result.routineId)+'\')">Review Routine</button>');
 if(result?.targetKey&&COACH_TARGET_GROUPS[result.targetKey])buttons.push('<button class="btn" onclick="closeModal();coachBuildFromInsight(\''+escAttr(result.targetKey)+'\')">Build '+esc(COACH_TARGET_GROUPS[result.targetKey].label)+'</button>');
 if(result?.type==='consistency'||result?.type==='global_progress')buttons.push('<button class="btn secondary" onclick="closeModal();go(\'analytics\')">Open Progress</button>');
 return buttons.join('');
}
function coachHistoryOpenRoutineReview(id){closeModal();openCoachRoutineControl(id)}
function renderCoachHistoryAnswer(result){
 if(!result?.handled)return false;
 if(result.type==='clarification'){
  coachHistoryQuestionContext={text:result.originalText,intentType:result.intentType};
  openModal('Coach Swolecat','<div class="coach-console"><div class="eyebrow">HISTORY Q&A // CLARIFY</div><div class="coach-question">'+esc(result.title)+'</div><div class="mini" style="margin-top:6px">'+esc(result.answer)+'</div></div><div class="coach-choice-grid" style="margin-top:12px">'+result.options.map(ex=>'<button class="btn secondary" onclick="coachHistoryChooseExercise(\''+escAttr(ex.id)+'\')">'+esc(ex.name)+'</button>').join('')+'</div>');
  return true;
 }
 coachHistoryQuestionContext=null;
 openModal('Coach Swolecat','<div class="coach-console"><div class="eyebrow">TRAINING HISTORY // LOCAL</div><div class="exercise-name" style="font-size:1.12rem;margin-top:5px">'+esc(result.title||'Training history')+'</div></div><div class="notice" style="margin-top:10px">'+esc(result.answer||'')+'</div><div class="mini" style="margin-top:9px">Based only on your completed Swole Cat logs. Performance patterns are not recovery, fatigue, injury, or medical-readiness diagnoses.</div><div class="actions">'+coachHistoryActionHtml(result)+'<button class="btn secondary" onclick="closeModal()">Done</button></div>');
 return true;
}
function coachHistoryChooseExercise(id){
 const ctx=coachHistoryQuestionContext;if(!ctx)return;
 renderCoachHistoryAnswer(coachHistoryAnswer(ctx.text,id,ctx.intentType));
}
function coachTryHistoryQuestion(text,{render=true}={}){
 const intent=coachHistoryQuestionIntent(text);if(!intent.handled)return false;
 const result=coachHistoryAnswer(text);if(render)renderCoachHistoryAnswer(result);return true;
}

function coachDeepInsightCandidates(){
 if(state.activeWorkout||activeProgram()||state.sessions.length<3)return [];
 const candidates=[];
 coachHistoryProfiles().forEach(({ex,profile})=>{
  const routine=coachHistoryRoutineForExercise(ex.id);
  if(profile.status==='plateau_high_effort')candidates.push({type:'plateau',priority:100,title:ex.name+' has been flat lately.',text:'Performance is flat across a multi-week window with high logged effort. That is a performance pattern, not a recovery diagnosis.',exerciseId:ex.id,routineId:routine?.id||null,status:profile.status});
  else if(profile.status==='performance_dip')candidates.push({type:'dip',priority:94,title:ex.name+' is below this block’s stronger sessions.',text:'The latest logged performance is meaningfully below the better exposures from this block. Coach does not assume why.',exerciseId:ex.id,routineId:routine?.id||null,status:profile.status});
 });
 coachHistoryNeglectedRows().slice(0,2).forEach((row,index)=>candidates.push({type:'neglected',priority:82-index,title:row.group.label+' hasn’t shown up lately.',text:'You’ve logged '+row.recentCount+' workouts in the last two weeks, but no '+row.group.label.toLowerCase()+' work in about '+row.days+' days.',targetKey:row.group.key,group:row.group,days:row.days}));
 coachHistoryProfiles().filter(x=>x.profile.status==='progressing'&&x.profile.exposures>=3).sort((a,b)=>b.profile.changePct-a.profile.changePct).slice(0,2).forEach((row,index)=>candidates.push({type:'progressing',priority:64-index,title:row.ex.name+' is moving up.',text:'Multi-week logged performance is trending upward across '+row.profile.exposures+' recent exposures.',exerciseId:row.ex.id,status:row.profile.status}));
 const consistency=coachHistoryConsistencyAnswer('last 4 weeks');
 if(state.sessions.length>=4&&!/no completed/i.test(consistency.answer))candidates.push({type:'consistency',priority:40,title:'Your recent training rhythm.',text:consistency.answer});
 return candidates.sort((a,b)=>b.priority-a.priority||a.title.localeCompare(b.title));
}
function coachDeepHistoryInsight(){return coachDeepInsightCandidates()[0]||null}
function coachDeepInsightHtml(){
 const insight=coachDeepHistoryInsight();if(!insight)return '';
 let action='';
 if(insight.type==='neglected'&&insight.targetKey&&COACH_TARGET_GROUPS[insight.targetKey])action='<button class="btn small secondary" onclick="coachBuildFromInsight(\''+escAttr(insight.targetKey)+'\')">Build '+esc(insight.group?.label||COACH_TARGET_GROUPS[insight.targetKey].label)+'</button>';
 else if(insight.routineId)action='<button class="btn small secondary" onclick="openCoachRoutineControl(\''+escAttr(insight.routineId)+'\')">Review Routine</button>';
 else if(insight.exerciseId)action='<button class="btn small secondary" onclick="openExerciseProgress(\''+escAttr(insight.exerciseId)+'\')">Open Progress</button>';
 else action='<button class="btn small secondary" onclick="go(\'analytics\')">Open Progress</button>';
 return '<div class="home-signal-card" style="margin-top:8px"><div class="grow"><div class="eyebrow">COACH INSIGHT</div><div class="signal-copy"><b>'+esc(insight.title)+'</b> '+esc(insight.text)+' <span class="mini">Log-based observation only.</span></div></div>'+action+'</div>';
}
