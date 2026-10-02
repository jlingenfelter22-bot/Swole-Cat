// Coach Swolecat v0.61 saved-routine conversational control.
// This module edits a draft copy of an existing routine and only persists when
// the user explicitly chooses Save Changes. Completed workout history is never mutated.

const COACH_ROUTINE_CONTROL_VERSION='0.61.0';
let coachRoutineSession=null;

function coachRoutineById(id){return state.routines.find(r=>r.id===id)||null}
function coachRoutineClone(routine){return cloneData(routine)}
function coachRoutineGoal(routine){
 const explicit=(routine?.exercises||[]).map(x=>x.trainingGoal).find(x=>['hypertrophy','strength','general'].includes(x));
 if(explicit)return explicit;
 return normalizeTrainingMode(routine?.trainingMode)==='strength'?'strength':'hypertrophy';
}
function coachRoutineExerciseLabel(re){
 const ex=exById(re?.exerciseId);
 const structure=re?.setStructure?.type==='top_backoff'
   ?'top '+(re.setStructure.topMinReps||re.minReps)+'-'+(re.setStructure.topMaxReps||re.maxReps)+' + '+(re.setStructure.backoffSets||1)+' backoff @ '+(re.setStructure.backoffPercent||90)+'%'
   :(re?.sets||0)+' x '+(re?.minReps||0)+(re?.maxReps!==re?.minReps?'-'+(re?.maxReps||0):'');
 return (ex?.name||'Exercise')+' · '+structure;
}
function coachRoutineEstimateMinutes(routine){
 const exercises=routine?.exercises||[];
 let minutes=exercises.length?Math.max(0,exercises.length-1)*1.1:0;
 exercises.forEach(re=>{
   const sets=Math.max(1,Number(re.sets)||1);
   const rest=Math.max(30,Number(re.restSeconds)||90);
   minutes+=sets*(.7+rest/60);
 });
 return Math.max(1,Math.round(minutes));
}
function coachRoutineBeginMutation(label){
 if(!coachRoutineSession)return null;
 return {label,routine:coachRoutineClone(coachRoutineSession.working),lastReference:coachRoutineSession.lastReference?{...coachRoutineSession.lastReference}:null};
}
function coachRoutineCommitMutation(before,response,lastIndex=null){
 if(!coachRoutineSession||!before)return;
 coachRoutineSession.undoStack.push(before);
 if(coachRoutineSession.undoStack.length>30)coachRoutineSession.undoStack.shift();
 coachRoutineSession.redoStack=[];
 coachRoutineSession.dirty=true;
 coachRoutineSession.lastResponse=response||'Routine updated.';
 if(Number.isInteger(lastIndex))coachRoutineSession.lastReference={index:lastIndex};
}
function coachRoutineUndo(){
 const s=coachRoutineSession;if(!s||!s.undoStack.length)return {ok:false,message:'Nothing to undo yet.'};
 s.redoStack.push({label:'redo',routine:coachRoutineClone(s.working),lastReference:s.lastReference?{...s.lastReference}:null});
 const previous=s.undoStack.pop();
 s.working=previous.routine;s.lastReference=previous.lastReference||null;s.dirty=true;
 s.lastResponse='Undid '+(previous.label||'the last Coach change')+'.';
 return {ok:true,message:s.lastResponse};
}
function coachRoutineRedo(){
 const s=coachRoutineSession;if(!s||!s.redoStack.length)return {ok:false,message:'Nothing to redo yet.'};
 s.undoStack.push({label:'undo',routine:coachRoutineClone(s.working),lastReference:s.lastReference?{...s.lastReference}:null});
 const next=s.redoStack.pop();
 s.working=next.routine;s.lastReference=next.lastReference||null;s.dirty=true;
 s.lastResponse='Redid the last Coach change.';
 return {ok:true,message:s.lastResponse};
}
function coachRoutineOrdinalIndex(text,count){
 const lower=coachNormalizeGymText(coachNumbersToDigits(String(text||'')));
 if(/\blast(?: one| exercise| movement)?\b/.test(lower))return count-1;
 const m=lower.match(/\b(?:exercise|movement|number|#)?\s*(\d+)(?:st|nd|rd|th)?\b/);
 if(m){
   const n=Number(m[1]);if(n>=1&&n<=count)return n-1;
 }
 const words={first:0,second:1,third:2,fourth:3,fifth:4,sixth:5,seventh:6,eighth:7,ninth:8,tenth:9};
 for(const [word,index] of Object.entries(words)){
   if(new RegExp('\\b'+word+'(?: one| exercise| movement)?\\b').test(lower)&&index<count)return index;
 }
 return -1;
}
function coachRoutineReferenceResult(index,source='reference'){
 if(!Number.isInteger(index)||index<0)return {index:-1,source,error:'I could not tell which exercise you meant.'};
 return {index,source,error:''};
}
function coachRoutineResolveReference(text,{allowLastReference=true}={}){
 const s=coachRoutineSession,routine=s?.working,count=routine?.exercises?.length||0;
 if(!s||!count)return coachRoutineReferenceResult(-1);
 const raw=String(text||''),lower=coachNormalizeGymText(raw);
 const ordinal=coachRoutineOrdinalIndex(raw,count);
 if(ordinal>=0)return coachRoutineReferenceResult(ordinal,'ordinal');
 if(allowLastReference&&/\b(?:that|that one|it|this one|same one)\b/.test(lower)&&Number.isInteger(s.lastReference?.index)){
   const index=Math.max(0,Math.min(count-1,s.lastReference.index));
   return coachRoutineReferenceResult(index,'conversation');
 }
 const selectedIds=routine.exercises.map(x=>x.exerciseId);
 const analysis=coachAnalyzeExerciseMentions(raw);
 const indices=[];
 analysis.mentions.forEach(mention=>{
   routine.exercises.forEach((re,index)=>{if(re.exerciseId===mention.exerciseId&&!indices.includes(index))indices.push(index)});
 });
 if(indices.length===1)return coachRoutineReferenceResult(indices[0],'name');
 if(indices.length>1)return {index:-1,source:'ambiguous',error:'I found more than one matching exercise. Say first, second, last, or use the full exercise name.'};
 const cleaned=String(raw)
   .replace(/\b(?:please|can you|could you|would you|coach|why|explain|remove|delete|drop|take out|move|make|change|set|update|swap|replace)\b/gi,' ')
   .replace(/\b(?:before|after|for|with|to)\b.*$/i,' ')
   .trim();
 if(cleaned){
   const understood=coachUnderstandExercisePhrase(cleaned,selectedIds);
   if(understood.level==='high'&&understood.exercise){
     const matches=routine.exercises.map((re,index)=>re.exerciseId===understood.exercise.id?index:-1).filter(i=>i>=0);
     if(matches.length===1)return coachRoutineReferenceResult(matches[0],'fuzzy');
     if(matches.length>1)return {index:-1,source:'ambiguous',error:'That exercise appears more than once. Tell me which occurrence to change.'};
   }
   if(understood.level==='medium')return {index:-1,source:'ambiguous',error:'That exercise reference is ambiguous. Use the full name or its position in the routine.'};
 }
 return coachRoutineReferenceResult(-1);
}
function coachRoutineResolveExternalExercise(text){
 const phrase=String(text||'').trim();
 if(!phrase)return {exercise:null,error:'Tell me which exercise you want.'};
 const analysis=coachAnalyzeExerciseMentions(phrase);
 if(analysis.mentions.length){
   const ex=exById(analysis.mentions.at(-1).exerciseId);
   if(ex)return {exercise:ex,error:''};
 }
 const understood=coachUnderstandExercisePhrase(phrase);
 if(understood.level==='high'&&understood.exercise)return {exercise:understood.exercise,error:''};
 if(understood.level==='medium'){
   const choices=(understood.alternatives||[]).slice(0,3).map(x=>x.exercise.name).join(', ');
   return {exercise:null,error:'I am not certain which exercise you mean'+(choices?'. Try: '+choices:'')+'.'};
 }
 return {exercise:null,error:'I could not match that exercise. Try its full exercise name.'};
}
function coachRoutineCoverage(routine){
 const regions={},primary={},patterns={},families={};
 (routine?.exercises||[]).forEach(re=>{
   const ex=exById(re.exerciseId);if(!ex)return;
   const meta=exerciseMuscleMetadata(ex),sets=Math.max(1,Number(re.sets)||1);
   meta.primary.forEach(m=>{regions[m]=(regions[m]||0)+sets;primary[m]=(primary[m]||0)+sets});
   meta.secondary.forEach(m=>regions[m]=(regions[m]||0)+sets*.5);
   patterns[ex.pattern]=(patterns[ex.pattern]||0)+1;
   const family=coachMovementFamily(ex);families[family]=(families[family]||0)+1;
 });
 return {regions,primary,patterns,families};
}
function coachRoutineRequestForText(text,routine){
 const goal=coachRoutineGoal(routine);
 const req=coachParsePrompt(String(text||''),goal);
 req.duration=Number(routine?.targetDuration)||coachRoutineEstimateMinutes(routine)||45;
 req.goal=goal;
 req.allowedEquipment=req.allowedEquipment||[];
 req.excludedEquipment=req.excludedEquipment||[];
 req.targetRegions=req.targetRegions||[];
 req.targetKeys=req.targetKeys||[];
 req.targetLabels=req.targetLabels||[];
 req.priorityRegions=req.priorityRegions||[];
 req.priorityKeys=req.priorityKeys||[];
 req.excludedTargetRegions=req.excludedTargetRegions||[];
 req.excludedExerciseIds=req.excludedExerciseIds||[];
 req.requiredExerciseIds=req.requiredExerciseIds||[];
 return req;
}
function coachRoutineCandidateForTarget(text,routine){
 const req=coachRoutineRequestForText(text,routine);
 if(!req.targetRegions.length)return null;
 const coverage=coachRoutineCoverage(routine),selected=new Set(routine.exercises.map(x=>x.exerciseId));
 const candidates=visibleExercises().filter(ex=>!selected.has(ex.id)&&coachExerciseAllowedByConstraints(ex,req))
   .map(ex=>({ex,score:coachDynamicCandidateScore(ex,req,coverage.regions,coverage.patterns,coverage.families,coverage.primary,routine.exercises.length+1)}))
   .filter(x=>Number.isFinite(x.score))
   .sort((a,b)=>b.score-a.score||a.ex.name.localeCompare(b.ex.name));
 return candidates[0]?.ex||null;
}
function coachRoutineNewExerciseConfig(ex,routine,text=''){
 const request=coachRoutineRequestForText(text||((ex?.muscle||'')+' workout'),routine);
 if(!request.targetRegions.length){
   const meta=exerciseMuscleMetadata(ex);request.targetRegions=[...meta.primary,...meta.secondary];
 }
 const defaults=coachProgrammingDefaults(request.goal,request.duration||45);
 const p=coachExercisePrescription(ex,request,defaults);
 return {
   exerciseId:ex.id,sets:p.sets,minReps:p.minReps,maxReps:p.maxReps,increment:state.settings.defaultIncrement,
   mode:'double',progressionStrategy:p.progressionStrategy||'double',adaptiveProgression:!!p.adaptiveProgression,
   setStructure:p.setStructure?cloneData(p.setStructure):null,trainingGoal:request.goal,resetPercent:7.5,
   restSeconds:p.restSeconds,targetRIR:Number.isFinite(Number(p.targetRIR))?Number(p.targetRIR):null,supersetGroup:null
 };
}
function coachRoutineParseNumbers(text){
 const normalized=coachNumbersToDigits(String(text||'')),out={};
 let m=normalized.match(/\b(\d+)\s*x\s*(\d+)(?:\s*(?:-|to)\s*(\d+))?\b/i);
 if(m){out.sets=Number(m[1]);out.minReps=Number(m[2]);out.maxReps=Number(m[3]||m[2])}
 if((m=normalized.match(/\b(\d+)\s+sets?\b/i)))out.sets=Number(m[1]);
 if((m=normalized.match(/(?:for|at|to|of)\s*(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*reps?\b/i))
   ||(m=normalized.match(/\b(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*reps?\b/i))){
   out.minReps=Number(m[1]);out.maxReps=Number(m[2]||m[1]);
 }
 const grammar=coachParseLiftingGrammar(normalized);
 if(Number.isFinite(Number(grammar.restSeconds)))out.restSeconds=Number(grammar.restSeconds);
 if(Number.isFinite(Number(grammar.targetRIR)))out.targetRIR=Number(grammar.targetRIR);
 const goal=coachExplicitGoal(normalized);if(goal)out.trainingGoal=goal;
 if(/\bmanual(?: progression)?\b/i.test(normalized))out.mode='manual';
 else if(/\b(?:beat total|total reps)\b/i.test(normalized))out.mode='total';
 else if(/\bdouble progression\b/i.test(normalized))out.mode='double';
 return out;
}
function coachRoutineApplyParsedConfig(re,parsed){
 if(!re||!parsed)return;
 if(Number.isFinite(parsed.sets)){
   const requested=Math.max(1,Math.min(10,Number(parsed.sets)));
   if(re.setStructure?.type==='top_backoff'){
     const topSets=Math.max(1,Number(re.setStructure.topSets)||1);
     const total=Math.max(topSets+1,requested);
     re.setStructure.topSets=Math.min(topSets,total-1);
     re.setStructure.backoffSets=Math.max(1,total-re.setStructure.topSets);
     re.sets=re.setStructure.topSets+re.setStructure.backoffSets;
   }else re.sets=requested;
 }
 if(Number.isFinite(parsed.minReps)){
   const min=Math.max(1,Number(parsed.minReps)),max=Math.max(min,Number(parsed.maxReps)||min);
   re.minReps=min;re.maxReps=max;
   if(re.setStructure?.type==='top_backoff'){
     re.setStructure.topMinReps=min;re.setStructure.topMaxReps=max;
     re.setStructure.backoffMinReps=min;re.setStructure.backoffMaxReps=max;
   }
 }
 if(Number.isFinite(parsed.restSeconds))re.restSeconds=Math.max(15,Math.min(600,Number(parsed.restSeconds)));
 if(Number.isFinite(parsed.targetRIR))re.targetRIR=Math.max(0,Math.min(5,Number(parsed.targetRIR)));
 if(parsed.trainingGoal)re.trainingGoal=parsed.trainingGoal;
 if(parsed.mode)re.mode=parsed.mode;
}
function coachRoutineReplacementConfig(source,newEx){
 const out=coachRoutineClone(source);out.exerciseId=newEx.id;
 if(out.setStructure?.type==='top_backoff'){
   const compatible=typeof coachIsAdaptiveCompound==='function'&&coachIsAdaptiveCompound(newEx)&&newEx.equipment!=='bodyweight';
   if(!compatible){out.setStructure=null;out.progressionStrategy='double'}
 }
 return out;
}
function coachRoutineMoveExercise(from,to,after=false){
 const routine=coachRoutineSession?.working;if(!routine)return -1;
 if(from===to)return from;
 const item=routine.exercises.splice(from,1)[0];
 let destination=to;
 if(from<to)destination--;
 if(after)destination++;
 destination=Math.max(0,Math.min(routine.exercises.length,destination));
 routine.exercises.splice(destination,0,item);
 return destination;
}
function coachRoutineExplainExercise(index){
 const routine=coachRoutineSession?.working,re=routine?.exercises?.[index],ex=exById(re?.exerciseId);
 if(!routine||!re||!ex)return 'I could not find that exercise in this routine.';
 const meta=exerciseMuscleMetadata(ex),coverage=coachRoutineCoverage(routine),family=coachMovementFamily(ex);
 const sameFamily=routine.exercises.filter(x=>coachMovementFamily(exById(x.exerciseId))===family).length;
 const primary=meta.primary.map(x=>MUSCLE_REGION_LABELS[x]||x).join(', ')||ex.muscle;
 const secondary=meta.secondary.map(x=>MUSCLE_REGION_LABELS[x]||x).join(', ');
 let progression='double progression';
 if(re.setStructure?.type==='top_backoff')progression='top-set/backoff progression';
 else if(re.mode==='manual')progression='manual progression';
 else if(re.mode==='total')progression='total-rep progression';
 else if(re.progressionStrategy==='load_first')progression='load-first progression';
 const profile=typeof coachMultiWeekExerciseProfile==='function'?coachMultiWeekExerciseProfile(ex.id):null;
 const history=profile?.exposures?(' Your logged history has '+profile.exposures+' recent exposure'+(profile.exposures===1?'':'s')+' and is currently classified as '+String(profile.status).replaceAll('_',' ')+'.'):' You do not have enough logged history for a multi-week progression read yet.';
 const duplicate=sameFamily>1?' There are '+sameFamily+' movements from the same '+patternLabel(ex.pattern)+' family, so this one may be partially redundant depending on the rest of the routine.':' It is not duplicating another movement from the same family.';
 return ex.name+' is primarily here for '+primary+(secondary?' with secondary work for '+secondary:'')+'. It uses '+progression+' and currently has '+re.sets+' working sets.'+duplicate+history;
}
function coachRoutineExplainRoutine(){
 const routine=coachRoutineSession?.working;if(!routine)return 'No routine is open.';
 const coverage=coachRoutineCoverage(routine),top=Object.entries(coverage.regions).sort((a,b)=>b[1]-a[1]).slice(0,5)
   .map(([m,v])=>(MUSCLE_REGION_LABELS[m]||m)+' '+Math.round(v*10)/10).join(' · ');
 const repeated=Object.entries(coverage.families).filter(([,n])=>n>1).map(([family,n])=>family.replaceAll('_',' ')+' ×'+n);
 return routine.name+' currently has '+routine.exercises.length+' exercises and an estimated '+coachRoutineEstimateMinutes(routine)+' minute session. Main set-equivalent coverage: '+(top||'not enough metadata')+'.'+(repeated.length?' Repeated movement families: '+repeated.join(', ')+'.':' No movement family is repeated.');
}
function coachRoutineFitDuration(target){
 const s=coachRoutineSession,r=s?.working;if(!s||!r)return {changed:false,message:'No routine is open.'};
 target=Math.max(15,Math.min(120,Number(target)||45));
 const beforeEstimate=coachRoutineEstimateMinutes(r),changes=[];
 r.targetDuration=target;
 if(beforeEstimate<=target+2)return {changed:true,message:'Set the routine target to '+target+' minutes. The current structure already estimates around '+beforeEstimate+' minutes, so I left the exercises alone.'};
 let guard=80;
 while(coachRoutineEstimateMinutes(r)>target+2&&guard-->0){
   let changed=false;
   for(let i=r.exercises.length-1;i>=0;i--){
     const re=r.exercises[i],ex=exById(re.exerciseId);
     const compound=COACH_COMPOUND_PATTERNS.has(ex?.pattern);
     const minSets=re.setStructure?.type==='top_backoff'?Math.max(2,(Number(re.setStructure.topSets)||1)+1):(compound?2:1);
     if(Number(re.sets)>minSets){
       re.sets--;
       if(re.setStructure?.type==='top_backoff')re.setStructure.backoffSets=Math.max(1,re.sets-(Number(re.setStructure.topSets)||1));
       changes.push('trimmed one set from '+(ex?.name||'an exercise'));changed=true;break;
     }
   }
   if(changed)continue;
   if(r.exercises.length>3){
     let removeIndex=-1;
     for(let i=r.exercises.length-1;i>=2;i--){
       const ex=exById(r.exercises[i].exerciseId);
       if(!COACH_COMPOUND_PATTERNS.has(ex?.pattern)){removeIndex=i;break}
     }
     if(removeIndex>=0){
       const removed=r.exercises.splice(removeIndex,1)[0];
       changes.push('removed '+(exById(removed.exerciseId)?.name||'an accessory')+' to fit the requested time');
       continue;
     }
   }
   break;
 }
 const afterEstimate=coachRoutineEstimateMinutes(r);
 return {changed:true,message:'Adjusted toward '+target+' minutes. Estimated session is now about '+afterEstimate+' minutes'+(changes.length?'. '+changes.slice(0,4).join('; '):'')+'.'};
}
function coachRoutineApplyCommand(text){
 const s=coachRoutineSession,raw=String(text||'').trim();if(!s||!raw)return {ok:false,message:'Tell Coach what you want changed.'};
 const normalized=coachNumbersToDigits(raw),lower=coachNormalizeGymText(normalized),routine=s.working;
 if(/^(?:undo|undo that|go back)$/.test(lower))return coachRoutineUndo();
 if(/^(?:redo|redo that)$/.test(lower))return coachRoutineRedo();

 if(/\b(?:why|explain|what is|whats)\b/.test(lower)){
   const ref=coachRoutineResolveReference(raw);
   const message=ref.index>=0?coachRoutineExplainExercise(ref.index):coachRoutineExplainRoutine();
   if(ref.index>=0)s.lastReference={index:ref.index};
   s.lastResponse=message;return {ok:true,changed:false,message};
 }

 let duration=normalized.match(/\b(\d{2,3})\s*(?:minute|minutes|min|mins)\b/i);
 if(duration&&/\b(?:make|fit|keep|cut|shorten|target|routine|workout|session|minutes?)\b/i.test(normalized)){
   const before=coachRoutineBeginMutation('duration change'),fit=coachRoutineFitDuration(Number(duration[1]));
   if(fit.changed){coachRoutineCommitMutation(before,fit.message,s.lastReference?.index??null);return {ok:true,changed:true,message:fit.message}}
 }

 let m=normalized.match(/\b(?:swap|replace)\s+(.+?)\s+(?:for|with)\s+(.+)$/i)
   ||normalized.match(/\bchange\s+(.+?)\s+to\s+(.+)$/i);
 if(m&&!/\b(?:sets?|reps?|seconds?|rir|rpe)\b/i.test(m[2])){
   const source=coachRoutineResolveReference(m[1]),replacement=coachRoutineResolveExternalExercise(m[2]);
   if(source.index<0)return {ok:false,message:source.error||'I could not tell which current exercise you want swapped.'};
   if(!replacement.exercise)return {ok:false,message:replacement.error};
   if(routine.exercises.some((re,i)=>i!==source.index&&re.exerciseId===replacement.exercise.id))return {ok:false,message:replacement.exercise.name+' is already in this routine.'};
   const before=coachRoutineBeginMutation('swap '+(exById(routine.exercises[source.index].exerciseId)?.name||'exercise'));
   const previous=exById(routine.exercises[source.index].exerciseId);
   routine.exercises[source.index]=coachRoutineReplacementConfig(routine.exercises[source.index],replacement.exercise);
   const message='Swapped '+(previous?.name||'the exercise')+' for '+replacement.exercise.name+' and preserved compatible progression settings.';
   coachRoutineCommitMutation(before,message,source.index);return {ok:true,changed:true,message};
 }

 m=normalized.match(/\bmove\s+(.+?)\s+(before|after)\s+(.+)$/i);
 if(m){
   const source=coachRoutineResolveReference(m[1]),target=coachRoutineResolveReference(m[3],{allowLastReference:false});
   if(source.index<0)return {ok:false,message:source.error};
   if(target.index<0)return {ok:false,message:target.error||'I could not tell where to move it.'};
   if(source.index===target.index)return {ok:false,message:'That exercise is already there.'};
   const before=coachRoutineBeginMutation('reorder exercise'),name=exById(routine.exercises[source.index].exerciseId)?.name||'Exercise';
   const newIndex=coachRoutineMoveExercise(source.index,target.index,m[2].toLowerCase()==='after');
   const message='Moved '+name+' '+m[2].toLowerCase()+' '+(exById(routine.exercises[m[2].toLowerCase()==='after'?newIndex-1:newIndex+1]?.exerciseId)?.name||'the target exercise')+'.';
   coachRoutineCommitMutation(before,message,newIndex);return {ok:true,changed:true,message};
 }

 m=normalized.match(/\b(?:remove|delete|drop|take out)\s+(.+)$/i);
 if(m){
   const ref=coachRoutineResolveReference(m[1]);
   if(ref.index<0)return {ok:false,message:ref.error};
   if(routine.exercises.length<=1)return {ok:false,message:'Keep at least one exercise in the routine.'};
   const before=coachRoutineBeginMutation('remove exercise'),removed=routine.exercises.splice(ref.index,1)[0],name=exById(removed.exerciseId)?.name||'Exercise';
   cleanupRoutineSupersets(routine);
   const nextIndex=Math.min(ref.index,routine.exercises.length-1),message='Removed '+name+'. Nothing else in the routine was regenerated.';
   coachRoutineCommitMutation(before,message,nextIndex);return {ok:true,changed:true,message};
 }

 m=normalized.match(/\b(?:add|include)\s+(.+)$/i);
 if(m){
   const additionText=m[1];
   let resolved=coachRoutineResolveExternalExercise(additionText),ex=resolved.exercise;
   if(!ex)ex=coachRoutineCandidateForTarget(additionText,routine);
   if(!ex)return {ok:false,message:resolved.error||'I could not find a routine-aware exercise for that request.'};
   if(routine.exercises.some(re=>re.exerciseId===ex.id))return {ok:false,message:ex.name+' is already in this routine.'};
   const before=coachRoutineBeginMutation('add '+ex.name),config=coachRoutineNewExerciseConfig(ex,routine,additionText);
   coachRoutineApplyParsedConfig(config,coachRoutineParseNumbers(additionText));
   routine.exercises.push(config);
   const index=routine.exercises.length-1,message='Added '+ex.name+' without changing the rest of the routine.';
   coachRoutineCommitMutation(before,message,index);return {ok:true,changed:true,message};
 }

 const parsed=coachRoutineParseNumbers(normalized);
 const hasConfigChange=Object.keys(parsed).length>0;
 if(hasConfigChange){
   const ref=coachRoutineResolveReference(normalized);
   if(ref.index>=0){
     const before=coachRoutineBeginMutation('update '+(exById(routine.exercises[ref.index].exerciseId)?.name||'exercise'));
     coachRoutineApplyParsedConfig(routine.exercises[ref.index],parsed);
     const name=exById(routine.exercises[ref.index].exerciseId)?.name||'Exercise';
     const message='Updated '+name+' only. Other exercises were left unchanged.';
     coachRoutineCommitMutation(before,message,ref.index);return {ok:true,changed:true,message};
   }
   if(parsed.trainingGoal&&/\b(?:routine|workout|session|this)\b/.test(lower)){
     const before=coachRoutineBeginMutation('routine training goal');
     routine.trainingMode=parsed.trainingGoal==='strength'?'strength':'guided';
     routine.exercises.forEach(re=>re.trainingGoal=parsed.trainingGoal);
     const message='Updated the routine training goal to '+parsed.trainingGoal+' while preserving each exercise’s existing progression structure.';
     coachRoutineCommitMutation(before,message,s.lastReference?.index??null);return {ok:true,changed:true,message};
   }
 }

 return {ok:false,message:'I did not understand that routine edit. Try “make the second exercise 4 sets,” “swap bench for dumbbell bench,” “move that before curls,” “add rear delts,” or “why is the third exercise here?”'};
}
function coachRoutineControlListHtml(){
 const s=coachRoutineSession;if(!s)return '';
 return s.working.exercises.map((re,index)=>{
   const ex=exById(re.exerciseId),active=s.lastReference?.index===index?' active':'';
   return '<div class="list-item'+active+'"><div class="pickcount">'+(index+1)+'</div><div class="grow"><div class="exercise-name">'+esc(ex?.name||'Exercise')+'</div><div class="mini">'+esc(coachRoutineExerciseLabel(re))+'</div></div></div>';
 }).join('');
}
function renderCoachRoutineControl(){
 const s=coachRoutineSession;if(!s)return;
 const estimate=coachRoutineEstimateMinutes(s.working),target=Number(s.working.targetDuration)||0;
 openModal('Coach · '+esc(s.working.name),[
   '<div class="coach-builder">',
   '<div class="coach-console"><div class="eyebrow">ROUTINE CONTROL // v0.61</div><div class="exercise-name" style="font-size:1.12rem;margin-top:5px">'+esc(s.working.name)+'</div>',
   '<div class="mini" style="margin-top:5px">Editing a draft copy · '+s.working.exercises.length+' exercises · ~'+estimate+' min'+(target?' · target '+target+' min':'')+'</div></div>',
   '<div class="card" style="margin-top:10px">'+coachRoutineControlListHtml()+'</div>',
   s.lastResponse?'<div class="notice" style="margin-top:10px">'+esc(s.lastResponse)+'</div>':'',
   '<div class="coach-console" style="margin-top:10px"><div class="eyebrow">TALK TO COACH</div><div class="mini" style="margin:5px 0 9px">Try “make the second exercise 4 sets,” “swap bench for dumbbell bench,” “move that before curls,” “add rear delts,” “make this 40 minutes,” or “why is the third one here?”</div>',
   '<div class="home-coach-row"><div class="coach-voice-field"><input id="coachRoutinePrompt" placeholder="Tell Coach what to change..." onkeydown="if(event.key===\'Enter\')coachRoutineApplyFromInput()">'+coachVoiceButtonHtml('coachRoutinePrompt')+'</div><button class="btn" onclick="coachRoutineApplyFromInput()">Update</button></div></div>',
   '<div class="actions"><button class="btn secondary" onclick="coachRoutineUndoAndRender()" '+(s.undoStack.length?'':'disabled')+'>Undo</button><button class="btn secondary" onclick="coachRoutineRedoAndRender()" '+(s.redoStack.length?'':'disabled')+'>Redo</button><button class="btn green" onclick="coachRoutineSave()">Save Changes</button><button class="btn secondary" onclick="coachRoutineCancel()">Cancel</button></div>',
   '<div class="notice">Coach makes surgical routine edits. Completed workout history stays untouched, and adaptive progression/top-backoff data is preserved unless the requested edit makes that structure incompatible.</div>',
   '</div>'
 ].join(''));
}
function openCoachRoutineControl(routineId){
 const routine=coachRoutineById(routineId);if(!routine)return false;
 coachRoutineSession={routineId,original:coachRoutineClone(routine),working:coachRoutineClone(routine),undoStack:[],redoStack:[],lastReference:null,lastResponse:'',dirty:false,openedAt:new Date().toISOString()};
 renderCoachRoutineControl();return true;
}
function coachRoutineApplyFromInput(){
 const input=document.getElementById('coachRoutinePrompt'),text=input?.value.trim()||'';
 if(!text){showToast('Tell Coach what you want changed');return}
 const result=coachRoutineApplyCommand(text);
 if(!result.ok)coachRoutineSession.lastResponse=result.message;
 renderCoachRoutineControl();
}
function coachRoutineUndoAndRender(){coachRoutineUndo();renderCoachRoutineControl()}
function coachRoutineRedoAndRender(){coachRoutineRedo();renderCoachRoutineControl()}
function coachRoutineSave(){
 const s=coachRoutineSession;if(!s)return false;
 const index=state.routines.findIndex(r=>r.id===s.routineId);if(index<0)return false;
 const saved=coachRoutineClone(s.working);saved.id=s.routineId;
 cleanupRoutineSupersets(saved);
 state.routines[index]=saved;
 save();renderRoutines();renderHome();
 const id=s.routineId;coachRoutineSession=null;showToast('Coach routine changes saved');editRoutineDetails(id);return true;
}
function coachRoutineCancel(){
 const s=coachRoutineSession;if(!s)return;
 if(s.dirty&&!confirm('Discard the unsaved Coach routine changes?'))return;
 const id=s.routineId;coachRoutineSession=null;editRoutineDetails(id);
}
