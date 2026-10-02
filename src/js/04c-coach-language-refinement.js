function coachExplicitGoal(text){
 const lower=coachNormalizeGymText(coachNumbersToDigits(String(text||'')));
 if(/\bstrength\b|\bstronger\b|\bget strong\b|\bheavy\b|\bpowerlifting\b|\bbuild strength\b/.test(lower))return 'strength';
 if(/\bhypertrophy\b|\bmuscle growth\b|\bbuild muscle\b|\bgain muscle\b|\bget bigger\b|\badd size\b|\bbodybuild/.test(lower)||/\bsize\b/.test(lower))return 'hypertrophy';
 if(/\bgeneral fitness\b|\bgeneral workout\b|\bgeneral training\b|\bjust exercise\b|\bstay active\b/.test(lower))return 'general';
 return null;
}
function coachNormalizeWords(value){
 return String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}

const COACH_EXERCISE_ALIASES={
 'bench':'Barbell Bench Press','bench press':'Barbell Bench Press','barbell bench':'Barbell Bench Press','flat bench':'Barbell Bench Press',
 'paused bench':'Paused Bench Press','pause bench':'Paused Bench Press','spoto':'Spoto Press','close grip bench':'Close Grip Bench Press','cgbp':'Close Grip Bench Press',
 'db bench':'Dumbbell Bench Press','dumbbell bench':'Dumbbell Bench Press','dumbbell press':'Dumbbell Bench Press',
 'incline db':'Incline Dumbbell Press','incline dumbbells':'Incline Dumbbell Press','incline db press':'Incline Dumbbell Press','incline dumbbell bench':'Incline Dumbbell Press',
 'incline bench':'Incline Barbell Bench Press','incline barbell':'Incline Barbell Bench Press',
 'chest machine':'Chest Press Machine','machine chest press':'Chest Press Machine','pec deck machine':'Pec Deck',
 'cable flyes':'Cable Fly','cable flies':'Cable Fly','pushups':'Push-Up','push ups':'Push-Up','weighted pushups':'Weighted Push-Up',
 'squat':'Back Squat','squats':'Back Squat','barbell squat':'Back Squat','back squats':'Back Squat',
 'high bar':'High Bar Squat','high bar squats':'High Bar Squat','low bar':'Low Bar Squat','low bar squats':'Low Bar Squat',
 'front squats':'Front Squat','goblets':'Goblet Squat','goblet squats':'Goblet Squat','hack':'Hack Squat','hack squats':'Hack Squat',
 'bulgarians':'Bulgarian Split Squat','bulgarian splits':'Bulgarian Split Squat','bulgarian split squats':'Bulgarian Split Squat',
 'split squats':'Bulgarian Split Squat','walking lunges':'Walking Lunge','reverse lunges':'Reverse Lunge','step ups':'Step-Up',
 'leg extensions':'Leg Extension','leg press machine':'Leg Press','leg presses':'Leg Press',
 'deadlift':'Deadlift','deadlifts':'Deadlift','conventional deadlift':'Deadlift','conventional deads':'Deadlift',
 'rdl':'Romanian Deadlift','rdls':'Romanian Deadlift','romanian deads':'Romanian Deadlift','romanian deadlifts':'Romanian Deadlift',
 'db rdl':'Dumbbell Romanian Deadlift','db rdls':'Dumbbell Romanian Deadlift','dumbbell rdls':'Dumbbell Romanian Deadlift',
 'stiff leg':'Stiff-Leg Deadlift','stiff legs':'Stiff-Leg Deadlift','stiff leg deadlift':'Stiff-Leg Deadlift','sldl':'Stiff-Leg Deadlift',
 'sumo':'Sumo Deadlift','sumo deads':'Sumo Deadlift','trap bar deads':'Trap Bar Deadlift',
 'good mornings':'Good Morning','hip thrusts':'Hip Thrust','glute bridges':'Glute Bridge',
 'pull up':'Pull-Up','pull ups':'Pull-Up','pullup':'Pull-Up','pullups':'Pull-Up',
 'assisted pullup':'Assisted Pull-Up','assisted pullups':'Assisted Pull-Up','assisted pull ups':'Assisted Pull-Up','assist pullups':'Assisted Pull-Up',
 'chin up':'Chin-Up','chin ups':'Chin-Up','chinup':'Chin-Up','chinups':'Chin-Up','assisted chins':'Assisted Chin-Up',
 'lat pull down':'Lat Pulldown','lat pull downs':'Lat Pulldown','lat pulldowns':'Lat Pulldown','pulldowns':'Lat Pulldown',
 'wide pulldown':'Wide Grip Lat Pulldown','close pulldown':'Close Grip Lat Pulldown',
 'barbell rows':'Barbell Row','bent over row':'Barbell Row','bent rows':'Barbell Row','pendlays':'Pendlay Row',
 'db row':'Dumbbell Row','db rows':'Dumbbell Row','dumbbell rows':'Dumbbell Row','cable rows':'Seated Cable Row','seated rows':'Seated Cable Row',
 'chest supported rows':'Chest Supported Row','chest supported db row':'Chest Supported Dumbbell Row','t bar':'T-Bar Row','t bar row':'T-Bar Row',
 'overhead press':'Overhead Press','ohp':'Overhead Press','military press':'Overhead Press','barbell shoulder press':'Overhead Press',
 'db shoulder press':'Dumbbell Shoulder Press','dumbbell overhead press':'Dumbbell Shoulder Press','arnolds':'Arnold Press',
 'lateral raises':'Dumbbell Lateral Raise','side raises':'Dumbbell Lateral Raise','db laterals':'Dumbbell Lateral Raise',
 'cable laterals':'Cable Lateral Raise','rear delt flies':'Rear Delt Fly','rear delt flyes':'Rear Delt Fly','rear delt machine':'Reverse Pec Deck',
 'reverse pec deck machine':'Reverse Pec Deck','face pulls':'Face Pull',
 'curl':'Barbell Curl','curls':'Barbell Curl','barbell curls':'Barbell Curl','ez curls':'EZ-Bar Curl','ez bar curls':'EZ-Bar Curl',
 'db curls':'Dumbbell Curl','dumbbell curls':'Dumbbell Curl','hammer curls':'Hammer Curl','hammers':'Hammer Curl',
 'preachers':'Preacher Curl','preacher curls':'Preacher Curl','incline curls':'Incline Dumbbell Curl','concentration curls':'Concentration Curl',
 'rope hammers':'Rope Hammer Curl','bayesian curls':'Bayesian Cable Curl',
 'pushdowns':'Triceps Pushdown','tricep pushdowns':'Triceps Pushdown','triceps pushdowns':'Triceps Pushdown',
 'rope pushdowns':'Rope Triceps Pushdown','skullcrushers':'Skull Crusher','skull crushers':'Skull Crusher',
 'overhead tricep extension':'Overhead Triceps Extension','overhead tricep extensions':'Overhead Triceps Extension',
 'dips':'Dip','assisted dips':'Assisted Dip','bench dips':'Bench Dip','diamond pushups':'Diamond Push-Up',
 'calf raises':'Standing Calf Raise','standing calves':'Standing Calf Raise','seated calves':'Seated Calf Raise',
 'shrugs':'Barbell Shrug','barbell shrugs':'Barbell Shrug','db shrugs':'Dumbbell Shrug',
 'ab wheel rollout':'Ab Wheel','ab wheel rollouts':'Ab Wheel','hanging leg raises':'Hanging Leg Raise','hanging knee raises':'Hanging Knee Raise',
 'cable crunches':'Cable Crunch','pallof':'Pallof Press','pallof press':'Pallof Press','woodchops':'Cable Woodchop',
 'farmers carry':'Dumbbell Farmer Carry','farmer carry':'Dumbbell Farmer Carry','farmer walks':'Dumbbell Farmer Carry',
 'sled pushes':'Sled Push','sled drags':'Sled Drag'
};
const COACH_GYM_TEXT_REPLACEMENTS=[
 [/\bdumbells?\b/gi,'dumbbell'],[/\bdumb bell\b/gi,'dumbbell'],[/\bbarbel\b/gi,'barbell'],
 [/\bdbs\b/gi,'dumbbells'],[/\bdb\b/gi,'dumbbell'],[/\bbb\b/gi,'barbell'],[/\bo h p\b/gi,'ohp'],
 [/\br d l s?\b/gi,'rdl'],[/\bromanian dead lefts?\b/gi,'romanian deadlift'],
 [/\bdead lefts?\b/gi,'deadlift'],[/\bpull downs?\b/gi,'pulldown'],[/\bpush downs?\b/gi,'pushdown'],
 [/\bpreacher corals?\b/gi,'preacher curl'],[/\bbulgarian split squads?\b/gi,'bulgarian split squat'],
 [/\blat pull towns?\b/gi,'lat pulldown'],[/\bhamer\b/gi,'hammer'],[/\btricept?s?\b/gi,'triceps'],

 // Body-part slang, common misspellings, and frequent speech-recognition repairs.
 [/\b(?:bicepts?|biseps?|buy ceps?|bye ceps?)\b/gi,'biceps'],
 [/\b(?:tricepts?|try ceps?|tri ceps?)\b/gi,'triceps'],
 [/\b(?:sholders?|shoulderss|deltoids?)\b/gi,'shoulders'],
 [/\b(?:rear|back) deltoids?\b/gi,'rear delts'],[/\bposterior delts?\b/gi,'rear delts'],
 [/\b(?:middle|medial|lateral) delts?\b/gi,'side delts'],[/\banterior delts?\b/gi,'front delts'],
 [/\bpectorals?\b/gi,'chest'],[/\bpecs?\b/gi,'chest'],
 [/\bham strings?\b/gi,'hamstrings'],[/\b(?:hammies|hammys|hammy)\b/gi,'hamstrings'],
 [/\bquadriceps?\b/gi,'quads'],[/\bquad muscles?\b/gi,'quads'],
 [/\b(?:gluteus|glute muscles?|booty|butt)\b/gi,'glutes'],
 [/\bcalfs\b/gi,'calves'],[/\b(?:calf muscles?)\b/gi,'calves'],
 [/\b(?:obleeks?|oblicks?)\b/gi,'obliques'],
 [/\b(?:abdominals?|ab muscles?)\b/gi,'abs'],
 [/\b(?:erecters?|spine erectors?)\b/gi,'spinal erectors'],
 [/\b(?:latissimus dorsi|latissimus)\b/gi,'lats'],
 [/\btrapezius\b/gi,'traps'],
 [/\b(?:guns|gun show)\b/gi,'arms'],[/\bwheels\b/gi,'legs'],
 [/\b(?:love handles?)\b/gi,'obliques'],

 // Common goal-language repairs.
 [/\bhyper trophy\b/gi,'hypertrophy'],[/\bhypertr(?:o|a)phy\b/gi,'hypertrophy'],
 [/\bbody building\b/gi,'bodybuilding']
];
function coachNormalizeGymText(text){
 let out=String(text||'').toLowerCase().replace(/[’']/g,'');
 COACH_GYM_TEXT_REPLACEMENTS.forEach(([re,value])=>{out=out.replace(re,value)});
 return coachNormalizeWords(out);
}
function coachLearnedAliases(){
 return isPlainObject(state?.settings?.coachAliases)?state.settings.coachAliases:{};
}
function coachAllAliases(){
 const out={...COACH_EXERCISE_ALIASES};
 Object.entries(coachLearnedAliases()).forEach(([alias,id])=>{
   const ex=exById(id);if(ex)out[coachNormalizeGymText(alias)]=ex.name;
 });
 return out;
}
function coachLearnAlias(alias,exerciseId){
 const key=coachNormalizeGymText(alias),ex=exById(exerciseId);
 if(!key||key.length<2||!ex)return false;
 state.settings.coachAliases=isPlainObject(state.settings.coachAliases)?state.settings.coachAliases:{};
 state.settings.coachAliases[key]=exerciseId;save();return true;
}
const COACH_NUMBER_WORDS={
 zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
 eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20
};
const COACH_NUMBER_TENS={twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
function coachNumbersToDigits(text){
 let out=String(text||'');
 out=out.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[- ](one|two|three|four|five|six|seven|eight|nine))?\b/gi,(_,t,u)=>{
   return String(COACH_NUMBER_TENS[t.toLowerCase()]+(u?COACH_NUMBER_WORDS[u.toLowerCase()]:0));
 });
 return out.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/gi,m=>String(COACH_NUMBER_WORDS[m.toLowerCase()]));
}
function coachCleanExercisePhrase(value){
 return coachNormalizeWords(String(value||'')
   .replace(/\b(?:please|then|next|also|and then|i want|i need|do|doing|exercise)\b/gi,' ')
   .replace(/\b(?:for|at)\s+\d+(?:\s*(?:-|to)\s*\d+)?\s*(?:reps?)?\s*$/i,' '));
}
function coachParseRepTarget(value){
 const text=String(value||'');
 let m=text.match(/(?:for|at|x)\s*(\d+)\s*(?:-|to)\s*(\d+)\s*reps?\b/i);
 if(m)return {minReps:Number(m[1]),maxReps:Number(m[2])};
 m=text.match(/(?:for|at|x)\s*(\d+)(?:\s*reps?)?\b/i)||text.match(/\b(\d+)\s*reps?\b/i);
 if(m)return {minReps:Number(m[1]),maxReps:Number(m[1])};
 return null;
}
function coachRegexEscape(value){return String(value||'').replace(/[.*+?^$(){}|[\]\\]/g,'\\$&')}
function coachLevenshtein(a,b){
 a=String(a||'');b=String(b||'');
 if(a===b)return 0;if(!a.length)return b.length;if(!b.length)return a.length;
 let prev=Array.from({length:b.length+1},(_,i)=>i),cur=[];
 for(let i=1;i<=a.length;i++){
   cur=[i];
   for(let j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
   prev=cur;
 }
 return prev[b.length];
}
function coachStringSimilarity(a,b){
 a=coachNormalizeGymText(a);b=coachNormalizeGymText(b);if(!a||!b)return 0;if(a===b)return 1;
 const ac=a.replace(/\s+/g,''),bc=b.replace(/\s+/g,'');
 return 1-coachLevenshtein(ac,bc)/Math.max(ac.length,bc.length,1);
}
function coachTokenSimilarity(a,b){
 const aa=coachNormalizeGymText(a).split(' ').filter(Boolean),bb=coachNormalizeGymText(b).split(' ').filter(Boolean);
 if(!aa.length||!bb.length)return 0;
 const oneWay=(from,to)=>from.reduce((sum,token)=>sum+Math.max(...to.map(t=>coachStringSimilarity(token,t))),0)/from.length;
 return (oneWay(aa,bb)+oneWay(bb,aa))/2;
}
function coachExerciseLanguagePhrases(){
 const rows=[];
 visibleExercises().forEach(ex=>rows.push({phrase:coachNormalizeGymText(ex.name),ex,source:'name'}));
 Object.entries(coachAllAliases()).forEach(([alias,name])=>{
   const ex=visibleExercises().find(x=>coachNormalizeGymText(x.name)===coachNormalizeGymText(name));
   if(ex)rows.push({phrase:coachNormalizeGymText(alias),ex,source:coachLearnedAliases()[coachNormalizeGymText(alias)]?'learned':'alias'});
 });
 return rows;
}
function coachUnderstandExercisePhrase(phrase,ids=null){
 const q=coachNormalizeGymText(phrase);if(!q||q.length<2)return {exercise:null,confidence:0,level:'none',alternatives:[],query:q};
 const allowed=ids?.length?new Set(ids):null,byExercise=new Map();
 coachExerciseLanguagePhrases().forEach(row=>{
   if(allowed&&!allowed.has(row.ex.id))return;
   const p=row.phrase;if(!p)return;
   let score=0;
   if(q===p)score=1;
   else if(q.replace(/\s+/g,'')===p.replace(/\s+/g,''))score=.995;
   else{
     const compact=coachStringSimilarity(q,p),tokens=coachTokenSimilarity(q,p);
     score=Math.max(compact*.82+tokens*.18,tokens*.72+compact*.28);
     if(q.length>=5&&p.includes(q))score=Math.max(score,.91);
     if(p.length>=5&&q.includes(p))score=Math.max(score,.89);
   }
   if(row.source==='learned')score=Math.min(1,score+.06);
   else if(row.source==='alias')score=Math.min(1,score+.025);
   const existing=byExercise.get(row.ex.id);
   if(!existing||score>existing.score)byExercise.set(row.ex.id,{exercise:row.ex,score,matchedPhrase:p,source:row.source});
 });
 const ranked=[...byExercise.values()].sort((a,b)=>b.score-a.score||a.exercise.name.localeCompare(b.exercise.name));
 const top=ranked[0],second=ranked[1],gap=top?(top.score-(second?.score||0)):0;
 const confidence=top?.score||0;
 const exactTop=!!top&&(q===top.matchedPhrase||q.replace(/\s+/g,'')===top.matchedPhrase.replace(/\s+/g,''));
 const crowded=!!top&&!!second&&!exactTop&&top.score>=.80&&second.score>=.78&&gap<.08;
 const level=exactTop?'high':crowded?'medium':confidence>=.92||confidence>=.86&&gap>=.055?'high':confidence>=.72?'medium':'low';
 return {exercise:level==='high'?top.exercise:null,confidence,level,gap,query:q,alternatives:ranked.slice(0,3)};
}
function coachExerciseMentionCandidates(){
 const out=[],seen=new Set();
 coachExerciseLanguagePhrases().forEach(({phrase,ex})=>{
   const key=phrase+'|'+ex.id;if(!phrase||seen.has(key))return;seen.add(key);out.push({phrase,ex});
 });
 return out.sort((a,b)=>b.phrase.length-a.phrase.length||a.phrase.localeCompare(b.phrase));
}
function coachExerciseChunkText(value){
 return coachNormalizeGymText(String(value||'')
   .replace(/\b(?:please|can you|could you|would you|hey|coach|also|then|next|i want|i need|want to do|need to do|do|doing|exercise|add|include|remove|drop|skip|delete|make|change|set|update|some)\b/gi,' ')
   .replace(/\b\d+\s*(?:sets?|reps?)\b/gi,' ')
   .replace(/\b\d+\s*x\s*\d+(?:\s*(?:-|to)\s*\d+)?\b/gi,' ')
   .replace(/\b(?:for|at|targeting|aiming for|to)\s*\d+(?:\s*(?:-|to)\s*\d+)?\s*(?:reps?)?\b/gi,' ')
   .replace(/\b(?:a|an|one)\s+sets?\s+(?:of\s+)?/gi,' '));
}
function coachAnalyzeExerciseMentions(text){
 const raw=coachNormalizeGymText(coachNumbersToDigits(text)),mentions=[],occupied=[],ambiguities=[];
 coachExerciseMentionCandidates().forEach(({phrase,ex})=>{
   const pattern=new RegExp('(?:^|\\s)'+coachRegexEscape(phrase)+'s?(?=\\s|$)','g');let m;
   while((m=pattern.exec(raw))){
     const leading=m[0].startsWith(' ')?1:0,start=m.index+leading,end=m.index+m[0].length;
     if(occupied.some(([a,b])=>start<b&&end>a))continue;
     mentions.push({exerciseId:ex.id,ex,start,end,phrase:raw.slice(start,end).trim(),confidence:1});
     occupied.push([start,end]);
   }
 });
 let cursor=0;
 const chunks=raw.split(/\s*(?:,|;|\band\b|\bthen\b)\s*/).filter(Boolean);
 chunks.forEach(chunk=>{
   const start=raw.indexOf(chunk,cursor);cursor=Math.max(cursor,start+chunk.length);
   const end=start+chunk.length;
   if(start>=0&&occupied.some(([a,b])=>start<b&&end>a))return;
   const cleaned=coachExerciseChunkText(chunk);if(!cleaned||cleaned.length<2)return;
   const understood=coachUnderstandExercisePhrase(cleaned);
   if(understood.level==='high'&&understood.exercise){
     mentions.push({exerciseId:understood.exercise.id,ex:understood.exercise,start:Math.max(0,start),end:Math.max(0,end),phrase:cleaned,segmentText:chunk,confidence:understood.confidence});
     occupied.push([Math.max(0,start),Math.max(0,end)]);
   }else if(understood.level==='medium'){
     ambiguities.push({phrase:cleaned,segmentText:chunk,start:Math.max(0,start),end:Math.max(0,end),alternatives:understood.alternatives});
   }
 });
 const deduped=[];const seenIds=new Set();
 mentions.sort((a,b)=>a.start-b.start).forEach(m=>{if(!seenIds.has(m.exerciseId)){seenIds.add(m.exerciseId);deduped.push(m)}});
 return {mentions:deduped,ambiguities};
}
function coachFindExerciseMentions(text){return coachAnalyzeExerciseMentions(text).mentions}
function coachPrescriptionNumbersAround(text,mention,index,mentions,goal,globalRep){
 const beforeStart=index?mentions[index-1].end:0,nextStart=index<mentions.length-1?mentions[index+1].start:text.length;
 const before=text.slice(beforeStart,mention.start).trim(),after=text.slice(mention.end,nextStart).trim();
 const local=coachNormalizeGymText(mention.segmentText||'');
 let sets=0,minReps=0,maxReps=0,m;
 m=local.match(/\b(\d+)\s*(?:sets?|set)\b/i);
 if(m)sets=Number(m[1]);
 if(!sets&&(m=local.match(/\b(\d+)\s*x\s*(\d+)(?:\s*(?:-|to)\s*(\d+))?\b/i))){sets=Number(m[1]);minReps=Number(m[2]);maxReps=Number(m[3]||m[2])}
 m=before.match(/(?:^|\s)(\d+)\s*(?:sets?|set)\s*(?:of\s*)?$/i);
 if(!sets&&m)sets=Number(m[1]);
 if(!sets&&(m=after.match(/^(?:for\s+)?(\d+)\s*(?:sets?|set)\b/i)))sets=Number(m[1]);
 if(!sets&&(m=before.match(/(?:^|\s)(\d+)\s*x\s*(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*$/i))){sets=Number(m[1]);minReps=Number(m[2]);maxReps=Number(m[3]||m[2])}
 if(!sets&&(m=after.match(/^(?:for\s+)?(\d+)\s*x\s*(\d+)(?:\s*(?:-|to)\s*(\d+))?/i))){sets=Number(m[1]);minReps=Number(m[2]);maxReps=Number(m[3]||m[2])}
 if(m=after.match(/^(?:for\s+)?\d+\s*(?:sets?|set)\s*(?:of\s*)?(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*(?:reps?)?/i)){minReps=Number(m[1]);maxReps=Number(m[2]||m[1])}
 if(!minReps&&(m=after.match(/(?:^|\s)(?:target(?:ing)?|aim(?:ing)?(?:\s+for)?|shoot(?:ing)?(?:\s+for)?)\s*(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*(?:reps?)?/i))){minReps=Number(m[1]);maxReps=Number(m[2]||m[1])}
 if(!minReps&&(m=after.match(/(?:^|\s)(?:for|at)\s*(\d+)(?:\s*(?:-|to)\s*(\d+))?(?!\s*sets?\b)(?:\s*reps?)?/i))){minReps=Number(m[1]);maxReps=Number(m[2]||m[1])}
 if(!minReps&&(m=local.match(/(?:for|at|target(?:ing)?|aim(?:ing)?(?:\s+for)?)\s*(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*(?:reps?)?\b/i))){minReps=Number(m[1]);maxReps=Number(m[2]||m[1])}
 if(!minReps&&(m=local.match(/\b(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*reps?\b/i))){minReps=Number(m[1]);maxReps=Number(m[2]||m[1])}
 if(!minReps&&(m=after.match(/(?:^|\s)(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*reps?\b/i))){minReps=Number(m[1]);maxReps=Number(m[2]||m[1])}
 const defaults=coachProgrammingDefaults(goal,45);
 return {
   sets:Math.max(1,Math.min(10,sets||defaults.sets)),
   minReps:minReps||globalRep?.minReps||defaults.minReps,
   maxReps:maxReps||globalRep?.maxReps||defaults.maxReps,
   explicitSets:!!sets,explicitReps:!!minReps||!!globalRep
 };
}
function coachParseExplicitWorkout(text,goal=coachPromptGoal){
 const normalized=coachNumbersToDigits(text),lower=normalized.toLowerCase(),normalizedWords=coachNormalizeGymText(normalized),analysis=coachAnalyzeExerciseMentions(normalized),mentions=analysis.mentions,items=[],seen=new Set();
 let globalRep=null;
 let globalMatch=lower.match(/(?:target(?:ing)?|aim(?:ing)?(?:\s+for)?|shoot(?:ing)?(?:\s+for)?)\s*(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*reps?\s*(?:each|for each|on each|across|all)?/i);
 if(!globalMatch)globalMatch=lower.match(/(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*reps?\s*(?:each|for each|on each)/i);
 if(globalMatch)globalRep={minReps:Number(globalMatch[1]),maxReps:Number(globalMatch[2]||globalMatch[1])};
 mentions.forEach((mention,index)=>{
   if(seen.has(mention.exerciseId))return;
   const cfg=coachPrescriptionNumbersAround(normalizedWords,mention,index,mentions,goal,globalRep);
   items.push({exerciseId:mention.exerciseId,sets:cfg.sets,minReps:cfg.minReps,maxReps:cfg.maxReps,explicitSets:cfg.explicitSets,explicitReps:cfg.explicitReps});
   seen.add(mention.exerciseId);
 });
 const hasPrescriptionLanguage=/\bsets?\b|\breps?\b|\b\d+\s*x\s*\d+\b/i.test(normalized);
 const listLanguage=/\b(?:i want|i need|want to do|need to do|do|doing|workout with|routine with|include|add)\b/i.test(lower);
 const ambiguities=analysis.ambiguities.map(a=>{
   const temp={...a,segmentText:a.segmentText||a.phrase};
   const cfg=coachPrescriptionNumbersAround(normalizedWords,temp,0,[temp],goal,globalRep);
   return {...a,config:cfg,options:a.alternatives.slice(0,3).map(x=>({exerciseId:x.exercise.id,name:x.exercise.name,confidence:x.score}))};
 });
 const understoodCount=items.length+ambiguities.length;
 const signal=understoodCount>=2||(understoodCount===1&&hasPrescriptionLanguage)||(understoodCount===1&&listLanguage);
 return {signal,items,ambiguities,mentions:mentions.map(x=>x.exerciseId)};
}
function coachShowExerciseClarification(){
 const ctx=coachClarificationContext,ambiguity=ctx?.explicit?.ambiguities?.[0];if(!ctx||!ambiguity)return false;
 const options=ambiguity.options||[];
 openModal('Coach Swolecat',`
   <div class="coach-console">
     <div class="eyebrow">QUICK CLARIFICATION</div>
     <div class="coach-question">I heard “${esc(ambiguity.phrase)}.” What did you mean?</div>
     <div class="mini" style="margin-top:5px">I’m not going to guess and put the wrong exercise in your workout.</div>
     <div class="coach-choice-grid">${options.map(o=>`<button class="btn secondary" onclick="coachResolveExerciseClarification('${escAttr(o.exerciseId)}')">${esc(o.name)}</button>`).join('')}</div>
     <div class="actions"><button class="btn secondary" onclick="openCoachSwolecat(true)">Start Over</button></div>
   </div>`);
 return true;
}
function coachBeginExerciseClarification(context){
 coachClarificationContext=context;return coachShowExerciseClarification();
}
function coachResolveExerciseClarification(exerciseId){
 const ctx=coachClarificationContext,ambiguity=ctx?.explicit?.ambiguities?.shift(),ex=exById(exerciseId);
 if(!ctx||!ambiguity||!ex)return;
 const cfg=ambiguity.config||coachProgrammingDefaults(ctx.request.goal,ctx.request.duration||45);
 ctx.explicit.items.push({
   exerciseId:ex.id,
   sets:cfg.sets||ctx.request?.defaults?.sets||state.settings.defaultSets,
   minReps:cfg.minReps||state.settings.defaultMin,
   maxReps:cfg.maxReps||state.settings.defaultMax,
   explicitSets:!!cfg.explicitSets,explicitReps:!!cfg.explicitReps
 });
 if(ctx.explicit.ambiguities.length){coachShowExerciseClarification();return}
 const finished=ctx;coachClarificationContext=null;
 finished.explicit.items.sort((a,b)=>{
   const ai=coachAnalyzeExerciseMentions(finished.prompt).mentions.findIndex(m=>m.exerciseId===a.exerciseId);
   const bi=coachAnalyzeExerciseMentions(finished.prompt).mentions.findIndex(m=>m.exerciseId===b.exerciseId);
   return (ai<0?999:ai)-(bi<0?999:bi);
 });
 coachProgramBuildDraft=null;coachGenerateExplicitWorkout(finished.request,finished.explicit);renderCoachPreview();
}
function coachTryTeachAlias(text){
 const raw=String(text||'').trim();
 const m=raw.match(/^(?:remember\s+)?(?:when\s+i\s+say\s+)?[“"']?(.+?)[”"']?\s+(?:means|mean|i mean)\s+[“"']?(.+?)[”"']?[.!]?$/i);
 if(!m)return {handled:false};
 const alias=m[1].trim(),meaning=m[2].trim(),understood=coachUnderstandExercisePhrase(meaning);
 if(understood.level==='high'&&understood.exercise){
   coachLearnAlias(alias,understood.exercise.id);
   return {handled:true,ok:true,message:`Coach learned “${alias}” = ${understood.exercise.name}`};
 }
 const choices=understood.alternatives?.slice(0,2).map(x=>x.exercise.name).join(' or ');
 return {handled:true,ok:false,message:choices?`I’m not sure what “${meaning}” means. Did you mean ${choices}?`:'I could not match that exercise yet.'};
}
function coachGenerateExplicitWorkout(request,prescription){
 if(!prescription?.items?.length)return null;
 const defaults=coachApplyLiftingGrammarToDefaults(coachProgrammingDefaults(request.goal,request.duration||45),request.liftingGrammar),regions=[],labels=[];
 prescription.items.forEach(item=>{
   const ex=exById(item.exerciseId),meta=exerciseMuscleMetadata(ex);regions.push(...meta.primary,...meta.secondary);
   if(ex?.muscle&&!labels.includes(ex.muscle))labels.push(ex.muscle);
 });
 const req=coachCloneRequest({...request,duration:request.duration||45});
 req.targetLabels=labels.length?labels:['Custom'];req.targetRegions=[...new Set(regions)];
 coachBuildDraft={
   request:req,defaults,selectedIds:prescription.items.map(x=>x.exerciseId),
   explicitPrescription:true,explicitConfigById:Object.fromEntries(prescription.items.map(x=>[x.exerciseId,{...x}])),
   createdAt:new Date().toISOString(),lastRefinement:'',sourcePrompt:request.prompt||''
 };
 return coachBuildDraft;
}
function coachResolveExercisePhrase(phrase,ids=null){
 const understood=coachUnderstandExercisePhrase(phrase,ids);
 return understood.exercise||null;
}
function coachExerciseClarification(phrase,ids=null){
 const understood=coachUnderstandExercisePhrase(phrase,ids);
 if(understood.level!=='medium')return null;
 return {
   phrase:understood.query,
   options:understood.alternatives.slice(0,3).map(x=>({exerciseId:x.exercise.id,name:x.exercise.name,confidence:x.score}))
 };
}
function coachTargetRegionsForKey(key){return COACH_TARGET_GROUPS[key]?.regions||[]}
function coachRemoveTargetKey(req,key){
 const regions=new Set(coachTargetRegionsForKey(key));
 req.targetRegions=(req.targetRegions||[]).filter(x=>!regions.has(x));
 req.priorityRegions=(req.priorityRegions||[]).filter(x=>!regions.has(x));
 req.priorityKeys=(req.priorityKeys||[]).filter(x=>x!==key);
 req.targetLabels=(req.targetLabels||[]).filter(x=>x!==COACH_TARGET_GROUPS[key]?.label);
 req.targetKeys=(req.targetKeys||[]).filter(x=>x!==key);
}
function coachRecentContextText(request){
 const targets=new Set(request?.targetRegions||[]);if(!targets.size||!state.sessions.length)return '';
 const found=new Map();
 state.sessions.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).forEach(session=>{
   const days=coachDaysSince(session.date);if(days>7)return;
   const scores=sessionMuscleScores(session);
   Object.keys(scores).forEach(region=>{
     if(targets.has(region)&&scores[region]>0&&!found.has(region))found.set(region,days);
   });
 });
 const bits=[...found.entries()].sort((a,b)=>a[1]-b[1]).slice(0,4).map(([region,days])=>{
   const label=MUSCLE_REGION_LABELS[region]||region;
   const rounded=Math.floor(days);
   return `${label} ${rounded===0?'today':rounded===1?'1 day ago':rounded+' days ago'}`;
 });
 return bits.length?`Recent log context: ${bits.join(' · ')}. This is training history, not a recovery score.`:'';
}

function coachRefreshExplicitDraftTargets(draft=coachBuildDraft){
 if(!draft?.explicitPrescription)return;
 const regions=[],labels=[];
 draft.selectedIds.forEach(id=>{
   const ex=exById(id),meta=exerciseMuscleMetadata(ex);if(!ex)return;
   regions.push(...meta.primary,...meta.secondary);
   if(ex.muscle&&!labels.includes(ex.muscle))labels.push(ex.muscle);
 });
 draft.request.targetRegions=[...new Set(regions)];
 draft.request.targetLabels=labels.length?labels:['Custom'];
}
function coachExplicitConfigForExercise(draft,exerciseId,overrides={}){
 const current=draft.explicitConfigById?.[exerciseId]||{},d=draft.defaults||coachProgrammingDefaults(draft.request.goal,draft.request.duration||45);
 return {
   exerciseId,
   sets:Math.max(1,Math.min(10,Number(overrides.sets??current.sets??d.sets)||d.sets)),
   minReps:Math.max(1,Number(overrides.minReps??current.minReps??d.minReps)||d.minReps),
   maxReps:Math.max(1,Number(overrides.maxReps??current.maxReps??d.maxReps)||d.maxReps),
   explicitSets:overrides.explicitSets??current.explicitSets??false,
   explicitReps:overrides.explicitReps??current.explicitReps??false
 };
}
function coachResolveExplicitEditExercise(text,draft=coachBuildDraft,{selectedOnly=false}={}){
 const mentions=coachFindExerciseMentions(text);
 const pool=selectedOnly?new Set(draft?.selectedIds||[]):null;
 const mention=mentions.find(m=>!pool||pool.has(m.exerciseId));
 if(mention)return exById(mention.exerciseId);
 const cleaned=String(text||'')
   .replace(/^(?:can\s+you\s+)?(?:please\s+)?(?:also\s+)?(?:add|include|remove|drop|skip|delete|make|change|set|update)\s+/i,'')
   .replace(/^(?:a|an|one|\d+)\s+sets?\s+(?:of\s+)?/i,'')
   .replace(/\s+(?:for|at|to)\s+\d+(?:\s*(?:-|to)\s*\d+)?\s*(?:reps?)?.*$/i,'')
   .replace(/\s+\d+\s+sets?.*$/i,'');
 return coachResolveExercisePhrase(cleaned,selectedOnly?(draft?.selectedIds||[]):null);
}
function coachExplicitEditNumbers(text,draft,exerciseId,{forAdd=false}={}){
 const normalized=coachNumbersToDigits(text),current=coachExplicitConfigForExercise(draft,exerciseId),out={};
 let m;
 if((m=normalized.match(/\b(?:a|an)\s+sets?\b/i)))out.sets=1;
 if((m=normalized.match(/\b(\d+)\s+sets?\b/i)))out.sets=Number(m[1]);
 if((m=normalized.match(/\b(\d+)\s*x\s*(\d+)(?:\s*(?:-|to)\s*(\d+))?\b/i))){
   out.sets=Number(m[1]);out.minReps=Number(m[2]);out.maxReps=Number(m[3]||m[2]);
 }
 if((m=normalized.match(/(?:for|at|target(?:ing)?|aim(?:ing)?(?:\s+for)?|to)\s*(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*reps?\b/i))){
   out.minReps=Number(m[1]);out.maxReps=Number(m[2]||m[1]);
 }else if((m=normalized.match(/\b(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*reps?\b/i))){
   out.minReps=Number(m[1]);out.maxReps=Number(m[2]||m[1]);
 }
 if(forAdd&&out.sets==null){
   if(/\b(?:a|an)\s+set\b/i.test(normalized))out.sets=1;
   else out.sets=current.sets;
 }
 return {
   sets:out.sets??current.sets,
   minReps:out.minReps??current.minReps,
   maxReps:out.maxReps??current.maxReps,
   explicitSets:out.sets!=null||current.explicitSets,
   explicitReps:out.minReps!=null||current.explicitReps
 };
}
function coachRefineExplicitDraftText(text){
 const draft=coachBuildDraft,raw=String(text||'').trim();if(!draft?.explicitPrescription||!raw)return {ok:false,message:'Tell Coach what you want changed.'};
 const normalized=coachNumbersToDigits(raw),lower=normalized.toLowerCase();
 draft.explicitConfigById=draft.explicitConfigById||{};
 const isAdd=/\b(?:add|include)\b/i.test(lower);
 const isRemove=/\b(?:remove|drop|skip|delete)\b/i.test(lower);
 const isModify=/\b(?:make|change|set|update)\b/i.test(lower)||(/\bsets?\b|\breps?\b/i.test(lower)&&!isAdd&&!isRemove);

 if(isAdd){
   const ex=coachResolveExplicitEditExercise(normalized,draft);
   if(!ex)return {ok:false,message:'I heard the add request, but I could not match that exercise. Try the exercise name again.'};
   if(draft.selectedIds.includes(ex.id)){
     const cfg=coachExplicitEditNumbers(normalized,draft,ex.id,{forAdd:true});
     draft.explicitConfigById[ex.id]=coachExplicitConfigForExercise(draft,ex.id,cfg);
     draft.lastRefinement=`Updated ${ex.name}`;
   }else{
     const cfg=coachExplicitEditNumbers(normalized,draft,ex.id,{forAdd:true});
     draft.selectedIds.push(ex.id);
     draft.explicitConfigById[ex.id]=coachExplicitConfigForExercise(draft,ex.id,cfg);
     draft.lastRefinement=`Added ${ex.name}`;
   }
   coachRefreshExplicitDraftTargets(draft);
   return {ok:true,message:'Workout updated.'};
 }

 if(isRemove){
   const ex=coachResolveExplicitEditExercise(normalized,draft,{selectedOnly:true});
   if(!ex)return {ok:false,message:'I could not tell which current exercise you want removed.'};
   if(draft.selectedIds.length<=1)return {ok:false,message:'Keep at least one exercise in the workout.'};
   draft.selectedIds=draft.selectedIds.filter(id=>id!==ex.id);
   delete draft.explicitConfigById[ex.id];
   draft.lastRefinement=`Removed ${ex.name}`;
   coachRefreshExplicitDraftTargets(draft);
   return {ok:true,message:'Workout updated.'};
 }

 if(isModify){
   const ex=coachResolveExplicitEditExercise(normalized,draft,{selectedOnly:true});
   if(!ex)return {ok:false,message:'I could not tell which current exercise you want changed.'};
   const cfg=coachExplicitEditNumbers(normalized,draft,ex.id);
   draft.explicitConfigById[ex.id]=coachExplicitConfigForExercise(draft,ex.id,cfg);
   draft.lastRefinement=`Updated ${ex.name}`;
   return {ok:true,message:'Workout updated.'};
 }

 const parsed=coachParseExplicitWorkout(normalized,draft.request.goal);
 if(parsed.signal&&parsed.items.length){
   parsed.items.forEach(item=>{
     const existing=draft.selectedIds.includes(item.exerciseId);
     if(!existing)draft.selectedIds.push(item.exerciseId);
     draft.explicitConfigById[item.exerciseId]=coachExplicitConfigForExercise(draft,item.exerciseId,item);
   });
   draft.lastRefinement='Updated explicit workout';
   coachRefreshExplicitDraftTargets(draft);
   return {ok:true,message:'Workout updated.'};
 }

 const parsedPrompt=coachParsePrompt(normalized,draft.request.goal),goal=coachExplicitGoal(normalized);
 let metadataChanged=false;
 if(parsedPrompt.duration){draft.request.duration=parsedPrompt.duration;metadataChanged=true}
 if(goal&&goal!==draft.request.goal){
   draft.request.goal=goal;
   draft.defaults=coachProgrammingDefaults(goal,draft.request.duration||45);
   metadataChanged=true;
 }
 if(metadataChanged){draft.lastRefinement=raw;return {ok:true,message:'Workout updated.'}}
 return {ok:false,message:'I did not understand that edit. Try “add 1 set of assisted pull-ups,” “make bench 4 sets of 6,” or “remove Bulgarian split squats.”'};
}
function coachRefineDraftText(text){
 const draft=coachBuildDraft,raw=String(text||'').trim();if(!draft||!raw)return {ok:false,message:'Tell Coach what you want changed.'};
 if(draft.explicitPrescription)return coachRefineExplicitDraftText(raw);
 const lower=raw.toLowerCase(),req={...draft.request};
 req.targetKeys=[...(req.targetKeys||[])];req.targetLabels=[...(req.targetLabels||[])];req.targetRegions=[...(req.targetRegions||[])];
 req.allowedEquipment=[...(req.allowedEquipment||[])];req.excludedEquipment=[...(req.excludedEquipment||[])];
 req.priorityRegions=[...(req.priorityRegions||[])];req.priorityKeys=[...(req.priorityKeys||[])];
 req.excludedTargetKeys=[...(req.excludedTargetKeys||[])];req.excludedTargetRegions=[...(req.excludedTargetRegions||[])];
 req.excludedExerciseIds=[...(req.excludedExerciseIds||[])];req.requiredExerciseIds=[...(req.requiredExerciseIds||[])];
 let changed=false;
 const parsed=coachParsePrompt(raw,req.goal),explicitGoal=coachExplicitGoal(raw),equipment=coachParseEquipment(raw);
 if(parsed.duration){req.duration=parsed.duration;changed=true}
 if(parsed.liftingGrammar?.hasAny){
   req.liftingGrammar={...(req.liftingGrammar||{}),...parsed.liftingGrammar};
   changed=true;
 }
 if(explicitGoal&&explicitGoal!==req.goal){req.goal=explicitGoal;changed=true}
 if(parsed.experienceLevel&&parsed.experienceLevel!=='auto'&&parsed.experienceLevel!==req.experienceLevel){req.experienceLevel=parsed.experienceLevel;changed=true}
 if(parsed.lateralityPreference&&parsed.lateralityPreference!=='auto'&&parsed.lateralityPreference!==req.lateralityPreference){req.lateralityPreference=parsed.lateralityPreference;changed=true}
 if(equipment.allowed.length){
   req.allowedEquipment=[...equipment.allowed];
   req.excludedEquipment=req.excludedEquipment.filter(x=>!equipment.allowed.includes(x));
   changed=true;
 }
 if(equipment.excluded.length){
   req.excludedEquipment=[...new Set([...req.excludedEquipment,...equipment.excluded])];
   req.allowedEquipment=req.allowedEquipment.filter(x=>!equipment.excluded.includes(x));
   changed=true;
 }
 const targetExclusions=coachParseTargetExclusions(raw);
 targetExclusions.keys.forEach(k=>{coachRemoveTargetKey(req,k);changed=true});
 if(targetExclusions.keys.length){
   req.excludedTargetKeys=[...new Set([...req.excludedTargetKeys,...targetExclusions.keys])];
   req.excludedTargetRegions=[...new Set([...req.excludedTargetRegions,...targetExclusions.regions])];
   req.targetRegions=req.targetRegions.filter(region=>!req.excludedTargetRegions.includes(region));
 }
 const positiveTargets=coachParseTargets(raw);
 const hasMore=/\bmore\b|\bemphas(?:ize|ise|is)\b|\bprioriti[sz]e\b|\bmostly\b|\bmainly\b|\bespecially\b|\bfocused\b|\bbiased\b|\bdominant\b/.test(lower);
 const hasAdd=/\badd\b|\binclude\b|\balso\b|\bplus\b/.test(lower);
 const hasReplace=/\binstead\b|\bswitch\b|\bchange\b|\bfocus on\b|\btrain\b/.test(lower);
 const positiveRegions=positiveTargets.regions.filter(r=>!targetExclusions.regions.includes(r));
 if(positiveTargets.keys.length&&!targetExclusions.keys.length){
   const restoringRegions=new Set(positiveTargets.regions);
   req.excludedTargetRegions=req.excludedTargetRegions.filter(r=>!restoringRegions.has(r));
   req.excludedTargetKeys=req.excludedTargetKeys.filter(k=>!positiveTargets.keys.includes(k));
 }
 if(positiveRegions.length){
   if(hasMore){
     req.priorityRegions=[...new Set([...req.priorityRegions,...positiveRegions])];
     req.priorityKeys=[...new Set([...req.priorityKeys,...(positiveTargets.keys||[])])];
     req.targetRegions=[...new Set([...req.targetRegions,...positiveRegions])];
     req.targetLabels=[...new Set([...req.targetLabels,...positiveTargets.labels])];
     req.targetKeys=[...new Set([...req.targetKeys,...(positiveTargets.keys||[])])];
   }else if(hasAdd){
     req.targetRegions=[...new Set([...req.targetRegions,...positiveRegions])];
     req.targetLabels=[...new Set([...req.targetLabels,...positiveTargets.labels])];
     req.targetKeys=[...new Set([...req.targetKeys,...(positiveTargets.keys||[])])];
   }else if(hasReplace||positiveTargets.labels.length===1&&raw.split(/\s+/).length<=4){
     req.targetRegions=[...positiveRegions];req.targetLabels=[...positiveTargets.labels];req.targetKeys=[...(positiveTargets.keys||[])];
     req.priorityRegions=[];req.priorityKeys=[];
   }
   changed=true;
 }
 const segments=raw.split(/[,;]|\bthen\b/i).map(x=>x.trim()).filter(Boolean);
 segments.forEach(segment=>{
   let m=segment.match(/^(?:remove|drop|skip)\s+(.+)$/i);
   if(m){
     const ex=coachResolveExercisePhrase(m[1],draft.selectedIds);
     if(ex){
       req.excludedExerciseIds=[...new Set([...req.excludedExerciseIds,ex.id])];
       req.requiredExerciseIds=req.requiredExerciseIds.filter(id=>id!==ex.id);changed=true;
     }
     return;
   }
   m=segment.match(/^(?:add|include)\s+(.+)$/i);
   if(m&&!COACH_TARGET_GROUPS[coachNormalizeWords(m[1])]){
     const ex=coachResolveExercisePhrase(m[1]);
     if(ex){
       const candidateRequest={...req,excludedExerciseIds:req.excludedExerciseIds.filter(id=>id!==ex.id)};
       if(coachExerciseAllowedByConstraints(ex,candidateRequest)){
         req.requiredExerciseIds=[...new Set([...req.requiredExerciseIds,ex.id])];
         req.excludedExerciseIds=req.excludedExerciseIds.filter(id=>id!==ex.id);changed=true;
       }
     }
   }
 });
 if(!req.targetRegions.length)return {ok:false,message:'That would remove every target muscle. Tell Coach what you still want to train.'};
 if(!changed)return {ok:false,message:'I did not find a workout change there. Try “30 minutes,” “no barbells,” “more chest,” “strength focused,” or “remove bench press.”'};
 req.lastRefinement=raw;
 const defaults=coachProgrammingDefaults(req.goal,req.duration||45),selected=coachSelectExercises(req,defaults.exerciseCount);
 if(!selected.length)return {ok:false,message:'Those constraints leave no matching exercises. Broaden the equipment or muscle target.'};
 coachBuildDraft={...draft,request:req,defaults,selectedIds:selected.map(ex=>ex.id),lastRefinement:raw};
 return {ok:true,message:'Workout updated.'};
}
function coachApplyRefinement(){
 const input=document.getElementById('coachRefinePrompt'),text=input?.value.trim()||'';
 if(!text){showToast('Tell Coach what you want changed');return}
 const taught=coachTryTeachAlias(text);if(taught.handled){showToast(taught.message);return}
 if(/^start(?: it| workout)?(?: now)?[.!]?$/i.test(text)){coachStartWorkoutNow();return}
 if(/^save(?: it)?(?: as (?:a )?routine)?[.!]?$/i.test(text)){coachSaveRoutine();return}
 if(/^add (?:it )?to (?:a )?program[.!]?$/i.test(text)){coachOpenAddToProgram();return}
 const result=coachRefineDraftText(text);
 if(!result.ok){showToast(result.message);return}
 renderCoachPreview();
}
