// Phase 4 checkpoint 2: opt-in, read-only Program follow-through review.
// Compare today's saved Program plan with explicitly attributed completed logs.
// This is not a new progression engine and cannot change a Program or workout.
const COACH_PHASE4_PROGRAM_VERSION='0.94.0-review';
let coachPhase4DismissedReviews=new Map();

function coachPhase4ProgramSessions(program,now){
 const earliest=now-28*86400000,routineIds=new Set(program.routineIds||[]);
 return programSessions(program).filter(s=>{
  const date=new Date(s.date||0).getTime();
  return Number.isFinite(date)&&date>=earliest&&date<=now&&
   s.programPhase!=='deload'&&routineIds.has(s.routineId)&&
   (s.exercises||[]).some(e=>!e.skipped&&progressionSets(e).length>0);
 }).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}
function coachPhase4ProgramSlotSummary(program,sessions){
 return coachProgramAuditRoutines(program).map(({id,routine})=>{
  const occurrences=sessions.filter(s=>s.routineId===id);
  return {routineId:id,name:routine.name,count:occurrences.length,
   sessions:occurrences};
 });
}
function coachPhase4ProgramComparison(programId,referenceMs=Date.now()){
 const program=programById(programId);if(!program)return null;
 const now=coachPhase4ReferenceMs(referenceMs);
 const slots=coachProgramAuditRoutines(program);
 const sessions=coachPhase4ProgramSessions(program,now);
 const earliest=sessions.length?new Date(sessions[0].date).getTime():null;
 const spanDays=earliest==null?0:(now-earliest)/86400000;
 const enoughTime=spanDays>=21;
 const weeks=enoughTime?Math.min(4,Math.max(3,spanDays/7)):null;
 const weeklyRate=weeks?sessions.length/weeks:null;
 const target=Math.max(1,Math.min(7,Number(program.frequency)||slots.length||1));
 const coverage=coachProgramAuditGroups();
 const planned=coachProgramAuditPlanned(program);
 const bySlot=coachPhase4ProgramSlotSummary(program,sessions);
 const candidates=[];
 const add=(id,kind,priority,title,detail,extra={})=>candidates.push({
  id,kind,priority,title,detail,action:'review_only',writesAllowed:false,
  ...extra
 });
 // An incomplete, new or abandoned Program does not prove a scheduling gap.
 // We never map preferred weekdays to Routine slots by index.
 if(enoughTime&&sessions.length>=3&&weeklyRate<target*.65){
  add('schedule:'+program.id,'schedule_gap',95,
   'Your logged Program workouts are below the saved weekly target.',
   'The saved target is '+target+' sessions a week; '+sessions.length+
   ' completed Program sessions across about '+weeks.toFixed(1)+
   ' observed weeks is '+weeklyRate.toFixed(1)+' per week. This describes logged sessions only. Training outside this Program, unlogged sessions, or changes in availability could explain the difference; it does not mean your exercises are wrong.',
   {evidence:{targetPerWeek:target,loggedPerWeek:Number(weeklyRate.toFixed(2)),
    sessions:sessions.length,observedWeeks:Number(weeks.toFixed(2))},nextStep:'review_program'});
 }
 // Only discuss rotation imbalance with repeated Program history. Avoid
 // conflating missing Routine slots with individual muscle underdevelopment.
 const slotCounts=bySlot.map(x=>x.count);
 const maxCount=Math.max(0,...slotCounts),minCount=Math.min(Infinity,...slotCounts);
 if(enoughTime&&slots.length>=2&&sessions.length>=Math.max(6,slots.length*2)&&
    maxCount>=minCount+3&&minCount<=Math.max(1,maxCount*.4)){
  const under=bySlot.filter(x=>x.count===minCount).sort((a,b)=>a.name.localeCompare(b.name))[0];
  add('rotation:'+program.id+':'+under.routineId,'rotation_gap',83,
   under.name+' appears less often in your Program logs.',
   'In '+sessions.length+' recent Program workouts, '+under.name+' appeared '+
   under.count+' time'+(under.count===1?'':'s')+
   ' while another Routine appeared '+maxCount+' times. That can reflect your schedule, preferences, or logging. Review your routine rotation before considering exercise changes.',
   {routineId:under.routineId,
    evidence:{underCount:under.count,maxCount,sessions:sessions.length},
    nextStep:'review_program'});
 }
 // A "plan vs actual" difference is tested only among sessions that ACTUALLY
 // occurred, not against missed appointments. Without routine snapshots,
 // limit interpretation to sessions structurally similar to today's saved
 // routine: otherwise the user may simply have edited their Program.
 for(const slot of slots){
  const relevant=sessions.filter(s=>s.routineId===slot.id);
  const plannedIds=new Set((slot.routine.exercises||[]).map(e=>e.exerciseId));
  const comparable=relevant.filter(s=>{
   if(!plannedIds.size)return false;
   const present=(s.exercises||[]).filter(e=>plannedIds.has(e.exerciseId)).length;
   return present/plannedIds.size>=.6;
  });
  if(comparable.length<3)continue;
  const first=new Date(comparable[0].date).getTime();
  const last=new Date(comparable.at(-1).date).getTime();
  if(!Number.isFinite(first)||!Number.isFinite(last)||last-first<10*86400000)continue;
  const expected=coachProgramAuditRoutineCoverage(slot.routine);
  const issues=[];
  for(const group of coverage){
   const plannedSets=coachProgramAuditGroupScore(expected,group);
   if(plannedSets<4)continue;
   const deficits=comparable.filter(s=>{
    const logged=coachProgramAuditGroupScore(sessionMuscleScores(s),group);
    return logged<plannedSets*.45;
   });
   if(deficits.length>=2&&deficits.length/comparable.length>=.5){
    issues.push({group,plannedSets,deficits});
   }
  }
  // One cautious slot-level suggestion only. Do not invent causes,
  // count absent rows as explicit skips, or prescribe new exercises.
  issues.sort((a,b)=>b.deficits.length-a.deficits.length||a.group.label.localeCompare(b.group.label));
  if(issues.length){
   const item=issues[0];
   add('execution:'+program.id+':'+slot.id+':'+item.group.key,'execution_gap',72,
    item.group.label+' work in '+slot.routine.name+' has a logged-work difference to review.',
    item.deficits.length+' of '+comparable.length+' comparable completed '+
    slot.routine.name+' sessions logged substantially less '+
    item.group.label.toLowerCase()+
    ' involvement than the Routine currently specifies. The saved Routine may have changed, and missing sets may be incomplete logs. Check the sessions before editing your plan; Coach will not add exercises automatically.',
    {routineId:slot.id,groupKey:item.group.key,nextStep:'review_routine',
     evidence:{comparableSessions:comparable.length,lowerCoverageSessions:item.deficits.length,
       plannedSetEquivalents:Number(item.plannedSets.toFixed(2))}});
  }
 }
 // Structural gaps are *not* caused by skipping sessions; they exist in the
 // current saved plan. We only show one at a time with neutral wording.
 const hasPlanned=coverage.filter(g=>coachProgramAuditGroupScore(planned.scores,g)>0).length;
 if(slots.length>=2&&target>=3&&hasPlanned>=2){
  for(const group of coverage){
   if(coachProgramAuditGroupScore(planned.scores,group)>0)continue;
   add('design:'+program.id+':'+group.key,'planned_gap',50,
    group.label+' is not represented in today’s saved Program.',
    'Today’s saved Routines do not include meaningful '+group.label.toLowerCase()+
    ' work. That may be intentional given your split and goals. This describes the current plan, not the workouts you missed or completed. No changes are required.',
    {groupKey:group.key,nextStep:'review_program',evidence:{plannedSetEquivalents:0}});
  }
 }
 const priority={'schedule_gap':0,'rotation_gap':1,'execution_gap':2,'planned_gap':3};
 candidates.sort((a,b)=>(priority[a.kind]??9)-(priority[b.kind]??9)||
  b.priority-a.priority||a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
 return {version:COACH_PHASE4_PROGRAM_VERSION,mode:'opt_in_read_only',programId,
  title:program.name||'Program',trainingMode:program.trainingMode||'',
  targetPerWeek:target,sessions:sessions.length,historyDays:Number(spanDays.toFixed(1)),
  actualPerWeek:weeklyRate==null?null:Number(weeklyRate.toFixed(2)),
  confidence:enoughTime?'comparative':'history_forming',
  slots:bySlot.map(x=>({routineId:x.routineId,name:x.name,count:x.count})),
  candidates,requiresUserReview:true,noAutomaticChanges:true,
  caveat:'Coach compares the current saved plan with completed Program logs. Changes to the plan, incomplete logging, training goals and equipment can explain differences. No medical or recovery conclusions.'};
}
function coachPhase4ProgramReviewHtml(review){
 if(!review)return '<div class="notice">Program not found.</div>';
 const dismissed=coachPhase4DismissedReviews.get(review.programId)||new Set();
 const visible=review.candidates.filter(c=>!dismissed.has(c.id));
 const candidate=visible[0];
 const evidence=review.actualPerWeek==null
  ?review.sessions+' completed Program sessions; more history needed to assess a weekly average.'
  :review.sessions+' completed sessions; about '+review.actualPerWeek.toFixed(1)+
   ' per week against '+review.targetPerWeek+' planned.';
 const header='<div class="coach-console"><div class="eyebrow">COACH // TRAINING REVIEW</div>'+
  '<div class="exercise-name" role="heading" aria-level="2">'+esc(review.title)+'</div>'+
  '<div class="mini">'+esc(evidence)+'</div></div>';
 const slotSummary='<div class="coach-rationale"><b>Completed sessions by Routine</b>'+
  '<div class="coach-phase4-slot-list">'+review.slots.map(x=>
   '<div class="coach-phase4-slot"><span>'+esc(x.name)+'</span><b>'+
   x.count+' logged</b></div>').join('')+'</div></div>';
 const card=candidate?'<div class="card coach-phase4-suggestion" style="margin-top:10px" data-coach-phase4-candidate="'+escAttr(candidate.id)+'">'+
  '<div class="eyebrow">OPTIONAL REVIEW · '+esc(candidate.kind.replaceAll('_',' '))+'</div>'+
  '<div class="exercise-name">'+esc(candidate.title)+'</div>'+
  '<div class="coach-phase4-description" style="margin-top:7px">'+esc(candidate.detail)+'</div>'+
  '<div class="actions"><button class="btn secondary" onclick="coachPhase4ProgramReviewAction(\''+
    escAttr(review.programId)+'\',\''+escAttr(candidate.id)+'\')">'+
    esc(candidate.nextStep==='review_routine'?'Review Routine':'Review Program')+'</button>'+
  '<button class="btn secondary" onclick="coachPhase4ProgramReviewDismiss(\''+
    escAttr(review.programId)+'\',\''+escAttr(candidate.id)+'\')">Keep as is</button></div></div>'
  :'<div class="notice">'+(review.confidence==='history_forming'
   ?'There is not enough completed Program history yet to draw reliable planned-versus-actual conclusions.'
   :'There are no other suggestions to review right now. Reopen this review to see dismissed observations again.')+'</div>';
 return header+slotSummary+card+'<div class="mini" style="margin-top:10px">'+esc(review.caveat)+
  ' Suggestions are optional. “Keep as is” hides this observation until you reopen the review; your Program and progression targets stay unchanged.</div>'+
  '<div class="actions"><button class="btn secondary" onclick="openCoachProgramAudit(\''+
  escAttr(review.programId)+'\')">Back to Program Audit</button>'+
  '<button class="btn secondary" onclick="closeModal()">Done</button></div>';
}
function openCoachPhase4ProgramReview(programId,{reset=true}={}){
 const review=coachPhase4ProgramComparison(programId);
 if(!review){showToast('Program not found');return false}
 if(reset)coachPhase4DismissedReviews.delete(programId);
 openModal('Coach · Training Review','<div class="coach-builder coach-phase4-review" id="coachPhase4Review" aria-live="polite">'+
  coachPhase4ProgramReviewHtml(review)+'</div>');
 return true;
}
function coachPhase4ProgramReviewDismiss(programId,candidateId){
 const review=coachPhase4ProgramComparison(programId);
 if(!review?.candidates.some(c=>c.id===candidateId))return false;
 if(!coachPhase4DismissedReviews.has(programId))coachPhase4DismissedReviews.set(programId,new Set());
 coachPhase4DismissedReviews.get(programId).add(candidateId);
 const el=document.getElementById('coachPhase4Review');
 if(el)el.innerHTML=coachPhase4ProgramReviewHtml(review);
 return true;
}
function coachPhase4ProgramReviewAction(programId,candidateId){
 const review=coachPhase4ProgramComparison(programId);
 const item=review?.candidates.find(c=>c.id===candidateId);
 if(!item)return false;
 // Opens existing manual review interfaces. Never apply or save edits here.
 if(item.nextStep==='review_routine'&&item.routineId){
  closeModal();return !!openCoachRoutineControl(item.routineId);
 }
 closeModal();newProgram(programId);return true;
}
