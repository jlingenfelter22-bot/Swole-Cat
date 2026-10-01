let coachBuildDraft=null,coachProgramBuildDraft=null,coachPromptGoal='hypertrophy';
let coachClarificationContext=null;
let coachVoiceSession=null;
function coachMicIcon(){return '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V20h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2.08A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z"/></svg>'}
function coachVoiceButtonHtml(targetId){
 return `<button class="btn secondary coach-mic-btn" type="button" data-coach-mic-for="${escAttr(targetId)}" onclick="coachStartVoiceInput('${escAttr(targetId)}')" aria-label="Speak to Coach Swolecat" title="Speak to Coach Swolecat">${coachMicIcon()}</button>`;
}
function coachSetMicListening(targetId,listening){
 document.querySelectorAll('[data-coach-mic-for]').forEach(btn=>{
   if(btn.dataset.coachMicFor!==targetId)return;
   btn.classList.toggle('listening',!!listening);
   btn.setAttribute('aria-label',listening?'Coach is listening':'Speak to Coach Swolecat');
   btn.title=listening?'Listening…':'Speak to Coach Swolecat';
   btn.innerHTML=listening?'<span aria-hidden="true">●</span>':coachMicIcon();
 });
}
function coachInsertTranscript(targetId,transcript){
 const input=document.getElementById(targetId),text=String(transcript||'').trim();if(!input||!text)return false;
 const existing=String(input.value||'').trim();
 input.value=existing?`${existing}${/[,.!?]$/.test(existing)?' ':', '}${text}`:text;
 input.dispatchEvent(new Event('input',{bubbles:true}));
 input.focus();return true;
}
function coachVoiceTranscriptScore(text){
 const raw=String(text||'').trim();if(!raw)return -Infinity;
 const analysis=coachAnalyzeExerciseMentions(raw),targets=coachParseTargets(raw),equipment=coachParseEquipment(raw);
 let score=analysis.mentions.length*80+analysis.ambiguities.length*24+targets.regions.length*8+equipment.allowed.length*5+equipment.excluded.length*5;
 if(/\b(?:sets?|reps?|rir|rpe|amrap|superset|warm ?up|drop set|failure)\b/i.test(raw))score+=18;
 if(/\b(?:add|remove|drop|swap|change|make|build|workout|routine|program)\b/i.test(raw))score+=10;
 if(/\b\d+\s*x\s*\d+\b/i.test(raw))score+=12;
 score+=Math.min(18,raw.length/12);
 const rawNormalized=coachNormalizeWords(raw.toLowerCase().replace(/[’']/g,''));
 const gymNormalized=coachNormalizeGymText(raw);
 const repairCost=coachLevenshtein(rawNormalized,gymNormalized);
 score-=Math.min(24,repairCost*2);
 return score;
}
function coachChooseVoiceTranscript(matches){
 const rows=(Array.isArray(matches)?matches:[]).map((text,index)=>({text:String(text||'').trim(),index})).filter(x=>x.text);
 if(!rows.length)return '';
 rows.forEach(row=>row.score=coachVoiceTranscriptScore(row.text));
 rows.sort((a,b)=>b.score-a.score||a.index-b.index);
 return rows[0].text;
}
async function coachNativeVoiceInput(targetId){
 const speech=capacitorPlugin('SpeechRecognition');if(!speech)return false;
 try{
   const available=await speech.available?.();if(available&&available.available===false)return false;
   const permission=await speech.checkPermissions?.();
   if(permission&&permission.speechRecognition!=='granted'){
     const requested=await speech.requestPermissions?.();
     if(requested&&requested.speechRecognition!=='granted'){
       showToast('Microphone permission is needed for Coach dictation');return true;
     }
   }
   coachVoiceSession={kind:'native',targetId};coachSetMicListening(targetId,true);showToast('Coach is listening…');
   const result=await speech.start?.({language:'en-US',maxResults:5,prompt:'Tell Coach Swolecat what you need',partialResults:false,popup:false});
   const transcript=coachChooseVoiceTranscript(result?.matches||[]);
   if(transcript){coachInsertTranscript(targetId,transcript);showToast('Got it · edit or Build when ready')}
   else showToast('I did not catch that. Tap the mic and try again.');
   return true;
 }catch(e){
   console.warn('Native Coach dictation failed',e);
   showToast('Voice input did not start. You can still type your request.');
   return true;
 }finally{
   coachVoiceSession=null;coachSetMicListening(targetId,false);
 }
}
function coachWebVoiceInput(targetId){
 const SpeechCtor=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SpeechCtor)return false;
 try{
   const recognition=new SpeechCtor();
   coachVoiceSession={kind:'web',targetId,recognition};
   recognition.lang='en-US';recognition.interimResults=false;recognition.maxAlternatives=5;recognition.continuous=false;
   recognition.onstart=()=>{coachSetMicListening(targetId,true);showToast('Coach is listening…')};
   recognition.onresult=event=>{
     const result=event?.results?.[0],matches=[];
     if(result)for(let i=0;i<result.length;i++)matches.push(result[i]?.transcript||'');
     const transcript=coachChooseVoiceTranscript(matches);
     if(transcript){coachInsertTranscript(targetId,transcript);showToast('Got it · edit or Build when ready')}
   };
   recognition.onerror=()=>showToast('Voice input did not catch that. Tap the mic and try again.');
   recognition.onend=()=>{coachSetMicListening(targetId,false);coachVoiceSession=null};
   recognition.start();return true;
 }catch(e){coachVoiceSession=null;coachSetMicListening(targetId,false);return false}
}
async function coachStartVoiceInput(targetId){
 if(coachVoiceSession){showToast('Coach is already listening');return}
 if(isNativeApp()&&await coachNativeVoiceInput(targetId))return;
 if(coachWebVoiceInput(targetId))return;
 showToast('Speech recognition is not available on this device. You can still type your request.');
}

const COACH_TARGET_GROUPS={
 'full body':{label:'Full Body',regions:['chest','lats','upper_back','front_delts','quads','hamstrings','glutes','core']},
 'upper body':{label:'Upper Body',regions:['chest','lats','upper_back','front_delts','side_delts','rear_delts','biceps','triceps']},
 'lower body':{label:'Lower Body',regions:['quads','hamstrings','glutes','adductors','calves']},
 'push':{label:'Push',regions:['chest','front_delts','side_delts','triceps']},
 'pull':{label:'Pull',regions:['lats','upper_back','rear_delts','biceps']},
 'legs':{label:'Legs',regions:['quads','hamstrings','glutes','adductors','calves']},
 'arms':{label:'Arms',regions:['biceps','triceps']},
 'shoulders':{label:'Shoulders',regions:['front_delts','side_delts','rear_delts']},
 'chest':{label:'Chest',regions:['chest']},
 'back':{label:'Back',regions:['lats','upper_back']},
 'biceps':{label:'Biceps',regions:['biceps']},
 'triceps':{label:'Triceps',regions:['triceps']},
 'quads':{label:'Quads',regions:['quads']},
 'hamstrings':{label:'Hamstrings',regions:['hamstrings']},
 'glutes':{label:'Glutes',regions:['glutes']},
 'calves':{label:'Calves',regions:['calves']},
 'core':{label:'Core',regions:['core','obliques']}
};
const COACH_EQUIPMENT_TERMS=[
 ['smith machine','smith machine'],['trap bar','trap bar'],['cable machine','cable'],
 ['dumbbells','dumbbell'],['dumbbell','dumbbell'],['barbells','barbell'],['barbell','barbell'],
 ['cables','cable'],['cable','cable'],['machines','machine'],['machine','machine'],
 ['bodyweight','bodyweight'],['no equipment','bodyweight'],['kettlebells','kettlebell'],['kettlebell','kettlebell'],
 ['landmine','landmine'],['sled','sled'],['plates','plate'],['plate','plate']
];
const COACH_COMPOUND_PATTERNS=new Set(['horizontal_press','incline_press','vertical_press','horizontal_pull','vertical_pull','squat','lunge','hinge','dip_press']);
const COACH_PROGRAM_SPLIT_LABELS={
 balanced:'Balanced',full_body:'Full Body',upper_lower:'Upper / Lower',ppl:'Push / Pull / Legs'
};
const COACH_WEEKDAY_TERMS=[
 ['sunday',0],['sun',0],['monday',1],['mon',1],['tuesday',2],['tue',2],['tues',2],
 ['wednesday',3],['wed',3],['thursday',4],['thu',4],['thur',4],['thurs',4],
 ['friday',5],['fri',5],['saturday',6],['sat',6]
];

function coachSetGoal(goal){
 coachPromptGoal=['hypertrophy','strength','general'].includes(goal)?goal:'hypertrophy';
 document.querySelectorAll('[data-coach-goal]').forEach(b=>b.classList.toggle('active',b.dataset.coachGoal===coachPromptGoal));
}
function coachFillExample(text){
 const input=document.getElementById('coachPrompt');if(input){input.value=text;input.focus()}
}
function coachParseEquipment(text){
 let work=String(text||'').toLowerCase(),allowed=[],excluded=[];
 COACH_EQUIPMENT_TERMS.forEach(([term,equipment])=>{
   const neg=new RegExp('(?:no|without|except)\\s+(?:any\\s+)?'+term.replace(' ','\\s+'),'i');
   if(neg.test(work)){excluded.push(equipment);work=work.replace(neg,' ');return}
   const re=new RegExp('\\b'+term.replace(' ','\\s+')+'\\b','i');
   if(re.test(work)){allowed.push(equipment);work=work.replace(re,' ')}
 });
 return {allowed:[...new Set(allowed)],excluded:[...new Set(excluded)]};
}
function coachParseTargets(text){
 const lower=coachNormalizeGymText(text);
 const work=lower
   .replace(/\b(?:single|one|straight)\s+arm\b/g,' ')
   .replace(/\bchest\s+supported\b/g,' ')
   .replace(/\bback\s+squats?\b/g,' ');
 const labels=[],regions=[],keys=[];
 const add=key=>{
   const g=COACH_TARGET_GROUPS[key];if(!g||keys.includes(key))return;
   keys.push(key);labels.push(g.label);regions.push(...g.regions);
 };
 const terms=[
   ['full body',/\bfull body\b/],['upper body',/\bupper body\b/],['lower body',/\blower body\b/],
   ['push',/\bpush(?: day| workout| session)?\b/],['pull',/\bpull(?: day| workout| session)?\b/],
   ['legs',/\blegs?\b/],['arms',/\barms?\b/],['shoulders',/\bshoulders?\b/],
   ['chest',/\bchest\b/],['back',/\bback\b/],['biceps',/\bbiceps?\b/],['triceps',/\btriceps?\b/],
   ['quads',/\bquads?\b/],['hamstrings',/\bhamstrings?\b/],['glutes',/\bglutes?\b/],
   ['calves',/\bcalves?\b|\bcalf\b/],['core',/\bcore\b|\babs?\b/]
 ];
 terms.forEach(([key,re])=>{if(re.test(work))add(key)});
 return {keys,labels:[...new Set(labels)],regions:[...new Set(regions)]};
}
function coachParseLiftingGrammar(text){
 const raw=String(text||''),lower=raw.toLowerCase(),out={};
 if(/\b(?:no|skip|without)\s+(?:the\s+)?warm[- ]?ups?\b/i.test(lower))out.warmupMode='none';
 else if(/\b(?:warm me up first|warm up first|start with (?:a )?warm[- ]?up|include warm[- ]?ups?|add warm[- ]?up sets?|ramp me up|ramp up first)\b/i.test(lower))out.warmupMode='first_compound';
 let m=lower.match(/\b(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min)\s+(?:of\s+)?rest\b/i)
   ||lower.match(/\brest\s+(?:for\s+)?(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min)\b/i);
 if(m)out.restSeconds=Math.max(15,Math.min(600,Math.round(Number(m[1])*60)));
 else{
   m=lower.match(/\b(\d{2,3})\s*(?:seconds?|secs?|sec|s)\s+(?:of\s+)?rest\b/i)
     ||lower.match(/\brest\s+(?:for\s+)?(\d{2,3})\s*(?:seconds?|secs?|sec|s)\b/i);
   if(m)out.restSeconds=Math.max(15,Math.min(600,Number(m[1])||0));
 }
 m=lower.match(/\b([0-5])\s*(?:rir|reps?\s+in\s+reserve)\b/i)
   ||lower.match(/\bleave\s+([0-5])\s+(?:reps?\s+)?(?:in\s+the\s+tank|in\s+reserve)\b/i);
 if(m)out.targetRIR=Number(m[1]);
 const rpe=lower.match(/\brpe\s*([5-9]|10)(?:\.([05]))?\b/i);
 if(rpe){
   const value=Number(rpe[1]+(rpe[2]?'.'+rpe[2]:''));
   out.targetRPE=value;out.targetRIR=Math.max(0,Math.min(5,10-value));
 }
 if(/\b(?:last set amrap|amrap (?:on )?(?:the )?last set|last set (?:is|to be) amrap)\b/i.test(lower))out.lastSetAmrap=true;
 if(/\b(?:no amrap|skip amrap)\b/i.test(lower))out.lastSetAmrap=false;
 out.hasAny=Object.keys(out).some(k=>k!=='hasAny');
 return out;
}
function coachApplyLiftingGrammarToDefaults(defaults,grammar){
 const out={...defaults},g=grammar||{};
 if(Number.isFinite(Number(g.restSeconds))&&Number(g.restSeconds)>0)out.restSeconds=Number(g.restSeconds);
 if(Number.isFinite(Number(g.targetRIR)))out.targetRIR=Number(g.targetRIR);
 if(Number.isFinite(Number(g.targetRPE)))out.targetRPE=Number(g.targetRPE);
 return out;
}
function coachParsePrompt(text,defaultGoal=coachPromptGoal){
 const raw=String(text||'').trim(),lower=raw.toLowerCase();
 const targets=coachParseTargets(lower),equipment=coachParseEquipment(lower),liftingGrammar=coachParseLiftingGrammar(raw);
 let duration=0;
 const min=lower.match(/(\d{2,3})\s*(?:min|mins|minute|minutes)\b/);
 const hrs=lower.match(/(\d(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
 if(min)duration=Math.max(15,Math.min(120,Number(min[1])||0));
 else if(hrs)duration=Math.max(15,Math.min(120,Math.round((Number(hrs[1])||0)*60)));
 else if(/\bquick\b|\bshort\b/.test(lower))duration=30;
 let goal=defaultGoal;
 if(/\bstrength\b|\bstronger\b|\bheavy\b|\bpowerlifting\b/.test(lower))goal='strength';
 else if(/\bhypertrophy\b|\bmuscle growth\b|\bbodybuild/.test(lower)||/\bsize\b/.test(lower))goal='hypertrophy';
 else if(/\bgeneral fitness\b|\bgeneral workout\b/.test(lower))goal='general';
 return {
   prompt:raw,goal,duration,targetKeys:[...(targets.keys||[])],targetLabels:targets.labels,targetRegions:targets.regions,
   allowedEquipment:equipment.allowed,excludedEquipment:equipment.excluded,
   priorityRegions:[],excludedExerciseIds:[],requiredExerciseIds:[],liftingGrammar
 };
}

function coachParseProgramFocus(text){
 const lower=coachNormalizeGymText(text),labels=[],regions=[];
 const terms=[
   ['chest',/\bchest\b/],['back',/\bback\b/],['shoulders',/\bshoulders?\b/],['arms',/\barms?\b/],
   ['biceps',/\bbiceps?\b/],['triceps',/\btriceps?\b/],['quads',/\bquads?\b/],['hamstrings',/\bhamstrings?\b/],
   ['glutes',/\bglutes?\b/],['calves',/\bcalves?\b|\bcalf\b/],['core',/\bcore\b|\babs?\b/]
 ];
 terms.forEach(([key,re])=>{
   if(!re.test(lower))return;
   const g=COACH_TARGET_GROUPS[key];if(!g)return;
   labels.push(g.label);regions.push(...g.regions);
 });
 return {labels:[...new Set(labels)],regions:[...new Set(regions)]};
}
function coachParseProgramIntent(text){
 const lower=String(text||'').toLowerCase();
 let frequency=0;
 const dayMatch=lower.match(/\b([2-6])\s*[- ]?days?\b/);
 const weekMatch=lower.match(/\b([2-6])\s*(?:x|times)\s*(?:\/\s*)?(?:per\s+)?week\b/);
 if(dayMatch)frequency=Number(dayMatch[1])||0;
 else if(weekMatch)frequency=Number(weekMatch[1])||0;
 const preferredDays=[];
 COACH_WEEKDAY_TERMS.forEach(([term,day])=>{
   if(new RegExp('\\b'+term+'\\b','i').test(lower)&&!preferredDays.includes(day))preferredDays.push(day);
 });
 preferredDays.sort((a,b)=>a-b);
 if(!frequency&&preferredDays.length>=2)frequency=preferredDays.length;
 let split='';
 if(/\bpush\s*[\/-]?\s*pull\s*[\/-]?\s*legs\b|\bppl\b/.test(lower))split='ppl';
 else if(/\bupper\s*[\/-]?\s*lower\b/.test(lower))split='upper_lower';
 else if(/\bfull[ -]?body\b/.test(lower))split='full_body';
 const focus=coachParseProgramFocus(lower);
 const isProgram=/\b(program|plan|split|weekly|week)\b/.test(lower)||!!dayMatch||!!weekMatch||preferredDays.length>=2||!!split;
 return {isProgram,frequency,preferredDays,split,focusLabels:focus.labels,focusRegions:focus.regions};
}
function coachDefaultProgramSplit(frequency){
 if(frequency<=3)return 'full_body';
 if(frequency===4)return 'upper_lower';
 if(frequency===5)return 'balanced';
 return 'ppl';
}
function coachProgramSlots(frequency,split){
 const f=Math.max(2,Math.min(6,Number(frequency)||3)),mode=split||coachDefaultProgramSplit(f);
 if(mode==='full_body')return Array.from({length:f},()=> 'full body');
 if(mode==='upper_lower')return Array.from({length:f},(_,i)=>i%2===0?'upper body':'lower body');
 if(mode==='ppl'){
   if(f===4)return ['push','pull','legs','full body'];
   if(f===5)return ['push','pull','legs','upper body','lower body'];
   return Array.from({length:f},(_,i)=>['push','pull','legs'][i%3]);
 }
 if(f===2)return ['full body','full body'];
 if(f===3)return ['full body','full body','full body'];
 if(f===4)return ['upper body','lower body','upper body','lower body'];
 if(f===5)return ['upper body','lower body','push','pull','legs'];
 return ['push','pull','legs','push','pull','legs'];
}
function coachProgramSplitLabel(split){return COACH_PROGRAM_SPLIT_LABELS[split||'balanced']||'Balanced'}
function coachProgramDayDisplayLabel(key,index,slots){
 const base=COACH_TARGET_GROUPS[key]?.label||'Workout';
 const sameBefore=slots.slice(0,index).filter(x=>x===key).length;
 const total=slots.filter(x=>x===key).length;
 return total>1?`${base} ${String.fromCharCode(65+sameBefore)}`:base;
}
function coachGoalLabel(goal){return goal==='strength'?'Strength':goal==='general'?'General training':'Muscle growth'}
function coachProgrammingDefaults(goal,duration){
 goal=['hypertrophy','strength','general'].includes(goal)?goal:'hypertrophy';
 if(goal==='strength')return {goal,sets:3,minReps:4,maxReps:6,restSeconds:180,trainingMode:'strength',exerciseCount:Math.max(3,Math.min(6,Math.round(duration/11)))};
 if(goal==='general')return {goal,sets:3,minReps:6,maxReps:10,restSeconds:120,trainingMode:'guided',exerciseCount:Math.max(3,Math.min(7,Math.round(duration/8.5)))};
 return {goal,sets:3,minReps:8,maxReps:12,restSeconds:90,trainingMode:'guided',exerciseCount:Math.max(3,Math.min(8,Math.round(duration/7.5)))};
}
function coachDaysSince(iso){
 const ms=Date.now()-new Date(iso||0).getTime();
 return Number.isFinite(ms)?Math.max(0,ms/86400000):Infinity;
}
function coachRecentExercisePenalty(exerciseId){
 const previous=derivedSessionData().previousByExercise.get(exerciseId);
 if(!previous?.date)return 0;
 const days=coachDaysSince(previous.date);
 if(days<=1)return 16;
 if(days<=3)return 9;
 if(days<=7)return 4;
 return 0;
}
function coachExerciseAllowedByConstraints(ex,request){
 if(!ex||isHiddenExercise(ex.id))return false;
 if((request.excludedExerciseIds||[]).includes(ex.id))return false;
 if(request.allowedEquipment.length&&!request.allowedEquipment.includes(ex.equipment))return false;
 if(request.excludedEquipment.includes(ex.equipment))return false;
 return true;
}
function coachRequestedTargetKeys(request){
 const direct=[...new Set(request?.targetKeys||[])].filter(k=>COACH_TARGET_GROUPS[k]);
 if(direct.length)return direct;
 const labelMap=Object.fromEntries(Object.entries(COACH_TARGET_GROUPS).map(([k,v])=>[v.label.toLowerCase(),k]));
 return [...new Set((request?.targetLabels||[]).map(label=>labelMap[String(label).toLowerCase()]).filter(Boolean))];
}
function coachMovementFamily(ex){
 const pattern=ex?.pattern||'other',name=ex?.name||'';
 if(/\b(?:assisted |plate loaded |bench )?dip\b/i.test(name))return 'dip_press';
 return ({
   horizontal_press:'flat_press',incline_press:'incline_press',chest_fly:'chest_fly',
   horizontal_pull:'row',vertical_pull:'vertical_pull',shoulder_extension:'lat_isolation',pullover:'lat_isolation',
   vertical_press:'shoulder_press',lateral_raise:'lateral_raise',rear_delt:'rear_delt',
   elbow_flexion:'biceps_curl',elbow_extension:'triceps_extension',dip_press:'dip_press',
   squat:'squat',lunge:'lunge',knee_extension:'leg_extension',hinge:'hinge',knee_flexion:'leg_curl',
   hip_extension:'hip_extension',hip_abduction:'hip_abduction',hip_adduction:'hip_adduction',
   calf_raise:'calf_raise',shrug:'shrug',front_raise:'front_raise',upright_row:'upright_row',
   spinal_flexion:'spinal_flexion',hip_flexion_core:'hip_flexion_core',anti_extension:'anti_extension',
   rotation:'rotation',anti_rotation:'anti_rotation',lateral_flexion:'lateral_flexion'
 })[pattern]||pattern;
}
function coachFamilyCap(family,request,count){
 const keys=coachRequestedTargetKeys(request),single=keys.length===1?keys[0]:'';
 if(family==='row')return (single==='back'||single==='pull')&&count>=5?2:1;
 if(family==='vertical_pull')return (single==='back'||single==='pull')&&count>=6?2:1;
 if(family==='biceps_curl')return (single==='arms'||single==='biceps')&&count>=5?2:1;
 if(family==='triceps_extension')return (single==='arms'||single==='triceps')&&count>=5?2:1;
 if(family==='squat')return (single==='legs'||single==='lower body'||single==='quads')&&count>=7?2:1;
 if(family==='hinge')return (single==='legs'||single==='lower body'||single==='hamstrings'||single==='glutes')&&count>=7?2:1;
 return 1;
}
function coachGenericExerciseBias(ex,request){
 const name=ex?.name||'',keys=coachRequestedTargetKeys(request);
 let score=0;
 const staples=new Set([
   'Barbell Bench Press','Incline Dumbbell Press','Incline Barbell Bench Press','Cable Fly','Pec Deck',
   'Barbell Row','Seated Cable Row','Chest Supported Row','Lat Pulldown','Pull-Up','Assisted Pull-Up','Chin-Up',
   'Overhead Press','Dumbbell Shoulder Press','Dumbbell Lateral Raise','Cable Lateral Raise','Rear Delt Fly','Face Pull',
   'Back Squat','Front Squat','Leg Press','Hack Squat','Bulgarian Split Squat','Romanian Deadlift','Seated Leg Curl','Lying Leg Curl','Leg Extension','Hip Thrust',
   'Barbell Curl','Dumbbell Curl','Hammer Curl','Preacher Curl','Triceps Pushdown','Rope Triceps Pushdown','Overhead Triceps Extension','Skull Crusher',
   'Standing Calf Raise','Seated Calf Raise','Cable Crunch','Hanging Leg Raise'
 ]);
 if(staples.has(name))score+=18;
 if(/\b(?:single arm|single leg|alternating|behind-the-neck|anderson|board press|spoto|zercher|meadows|renegade|yates|jm press|tate press|b-stance|snatch grip|deficit|block pull|clean pull|high pull|power clean|power snatch)\b/i.test(name))score-=22;
 if(ex?.pattern==='olympic_pull'&&request.goal!=='strength')score-=55;
 if(keys.includes('back')&&request.goal!=='strength'&&['hinge','olympic_pull'].includes(ex?.pattern))score-=46;
 return score;
}
function coachSmartExerciseCount(request,baseCount){
 const keys=coachRequestedTargetKeys(request),base=Math.max(1,Number(baseCount)||1);
 if(keys.length!==1)return keys.length===2?Math.min(base,7):base;
 const key=keys[0];
 if(['chest','back','shoulders','arms','biceps','triceps','full body'].includes(key))return Math.min(base,6);
 if(['push','pull','legs','lower body','upper body'].includes(key))return Math.min(base,7);
 return base;
}
function coachCandidateBaseScore(ex,request){
 if(!coachExerciseAllowedByConstraints(ex,request))return -Infinity;
 const meta=exerciseMuscleMetadata(ex),targets=new Set(request.targetRegions),priority=new Set(request.priorityRegions||[]),keys=coachRequestedTargetKeys(request);
 const upperBackOnly=keys.includes('back')&&!keys.some(k=>['legs','lower body','hamstrings','glutes','quads','full body'].includes(k));
 if(upperBackOnly&&request.goal!=='strength'&&['hinge','olympic_pull'].includes(ex.pattern)&&!(request.requiredExerciseIds||[]).includes(ex.id))return -Infinity;
 const primaryHits=meta.primary.filter(m=>targets.has(m)),secondaryHits=meta.secondary.filter(m=>targets.has(m));
 if(!primaryHits.length&&!secondaryHits.length)return -Infinity;
 let score=(primaryHits.length?115+(primaryHits.length-1)*32:0)+secondaryHits.length*28+preferenceRank(ex.id)+coachGenericExerciseBias(ex,request);
 const programUses=Number(request.programExerciseUsage?.[ex.id])||0;
 if(programUses)score-=programUses*(request.goal==='strength'?18:34);
 meta.primary.filter(m=>priority.has(m)).forEach(()=>score+=46);
 meta.secondary.filter(m=>priority.has(m)).forEach(()=>score+=16);
 if(previousExercise(ex.id))score+=4;
 score-=coachRecentExercisePenalty(ex.id);
 if(request.goal==='strength'&&COACH_COMPOUND_PATTERNS.has(ex.pattern))score+=28;
 if(request.goal==='hypertrophy'&&COACH_COMPOUND_PATTERNS.has(ex.pattern))score+=9;
 if(!primaryHits.length&&secondaryHits.length)score-=36;
 return score;
}
function coachDynamicCandidateScore(ex,request,coverage,patternCounts,familyCounts={},primaryCoverage={},count=8){
 let score=coachCandidateBaseScore(ex,request);if(!Number.isFinite(score))return score;
 const meta=exerciseMuscleMetadata(ex),targets=new Set(request.targetRegions),family=coachMovementFamily(ex);
 if((familyCounts[family]||0)>=coachFamilyCap(family,request,count))return -Infinity;
 meta.primary.filter(m=>targets.has(m)).forEach(m=>{
   score+=72/(1+(coverage[m]||0));
   if(!(primaryCoverage[m]>0))score+=54;
 });
 meta.secondary.filter(m=>targets.has(m)).forEach(m=>score+=16/(1+(coverage[m]||0)));
 score-=(patternCounts[ex.pattern]||0)*34;
 score-=(familyCounts[family]||0)*118;
 const keys=coachRequestedTargetKeys(request);
 if(keys.includes('arms')&&ex.pattern==='elbow_flexion'&&meta.primary.includes('biceps'))score+=36;
 if(keys.includes('arms')&&ex.pattern==='elbow_extension'&&meta.primary.includes('triceps'))score+=36;
 return score;
}
function coachCoveragePlan(request,count){
 const keys=coachRequestedTargetKeys(request),core=[],optional=[],seen=new Set();
 const add=(bucket,id,label,match)=>{
   if(seen.has(id))return;seen.add(id);bucket.push({id,label,match});
 };
 const meta=ex=>exerciseMuscleMetadata(ex);
 const chestPress=ex=>meta(ex).primary.includes('chest')&&ex.pattern==='horizontal_press'&&coachMovementFamily(ex)!=='dip_press';
 const chestIncline=ex=>meta(ex).primary.includes('chest')&&ex.pattern==='incline_press';
 const chestFly=ex=>meta(ex).primary.includes('chest')&&ex.pattern==='chest_fly';
 const backRow=ex=>ex.pattern==='horizontal_pull'&&(meta(ex).primary.includes('upper_back')||meta(ex).primary.includes('lats'));
 const backVertical=ex=>ex.pattern==='vertical_pull'&&meta(ex).primary.includes('lats');
 const latIsolation=ex=>['shoulder_extension','pullover'].includes(ex.pattern)&&meta(ex).primary.includes('lats');
 const bicepsDirect=ex=>ex.pattern==='elbow_flexion'&&meta(ex).primary.includes('biceps');
 const tricepsDirect=ex=>coachMovementFamily(ex)==='triceps_extension'&&meta(ex).primary.includes('triceps')&&!/\b(?:dip|push-?up|bench press|jm press|tate press)\b/i.test(ex.name||'');
 const shoulderPress=ex=>ex.pattern==='vertical_press'&&(meta(ex).primary.includes('front_delts')||meta(ex).primary.includes('side_delts'));
 const shoulderAccessory=ex=>['lateral_raise','rear_delt'].includes(ex.pattern);
 const squatPattern=ex=>['squat','lunge'].includes(ex.pattern)&&meta(ex).primary.includes('quads');
 const hamstringPattern=ex=>(ex.pattern==='knee_flexion'||ex.pattern==='hinge')&&meta(ex).primary.includes('hamstrings');
 const calfPattern=ex=>ex.pattern==='calf_raise'&&meta(ex).primary.includes('calves');
 const corePattern=ex=>meta(ex).primary.includes('core')||meta(ex).primary.includes('obliques');
 const addChest=()=>{
   add(core,'chest_press','Chest press',chestPress);
   add(optional,'chest_incline','Incline chest press',chestIncline);
   add(optional,'chest_fly','Chest isolation',chestFly);
 };
 const addBack=()=>{
   add(core,'back_row','Horizontal back pull',backRow);
   add(optional,'back_vertical','Vertical back pull',backVertical);
   add(optional,'lat_isolation','Lat isolation',latIsolation);
   add(optional,'back_rear_delt','Rear delt / upper-back accessory',ex=>ex.pattern==='rear_delt'&&meta(ex).secondary.includes('upper_back'));
 };
 const addArms=()=>{add(core,'biceps_direct','Direct biceps',bicepsDirect);add(core,'triceps_direct','Direct triceps',tricepsDirect)};
 const addShoulders=()=>{add(core,'shoulder_press','Shoulder press',shoulderPress);add(optional,'shoulder_accessory','Side / rear delt',shoulderAccessory)};
 const addLegs=()=>{add(core,'leg_knee','Knee-dominant lower body',squatPattern);add(core,'leg_hamstrings','Hamstrings',hamstringPattern);add(optional,'leg_calves','Calves',calfPattern)};

 if(keys.includes('full body')){
   add(core,'full_squat','Lower-body compound',squatPattern);
   add(core,'full_hinge','Hip hinge',hamstringPattern);
   add(core,'full_press','Upper-body press',chestPress);
   add(core,'full_pull','Upper-body pull',ex=>backRow(ex)||backVertical(ex));
   add(optional,'full_shoulders','Shoulders',shoulderPress);
 }else if(keys.includes('upper body')&&keys.length===1){
   addChest();addBack();addShoulders();
   add(optional,'upper_biceps','Direct biceps',bicepsDirect);add(optional,'upper_triceps','Direct triceps',tricepsDirect);
 }else if(keys.includes('lower body')&&keys.length===1){
   addLegs();add(optional,'lower_glutes','Glute emphasis',ex=>meta(ex).primary.includes('glutes')&&['hip_extension','hinge'].includes(ex.pattern));
 }else if(keys.includes('push')&&keys.length===1){
   add(core,'push_chest','Chest press',chestPress);add(core,'push_shoulders','Shoulder press',shoulderPress);add(core,'push_triceps','Direct triceps',tricepsDirect);
   add(optional,'push_chest_iso','Chest isolation',chestFly);add(optional,'push_side_delts','Side delts',ex=>ex.pattern==='lateral_raise');
 }else if(keys.includes('pull')&&keys.length===1){
   add(core,'pull_row','Horizontal pull',backRow);add(core,'pull_vertical','Vertical pull',backVertical);add(core,'pull_biceps','Direct biceps',bicepsDirect);
   add(optional,'pull_lats','Lat isolation',latIsolation);add(optional,'pull_rear_delts','Rear delts',ex=>ex.pattern==='rear_delt');
 }else{
   keys.forEach(key=>{
     if(key==='chest')addChest();
     else if(key==='back')addBack();
     else if(key==='arms')addArms();
     else if(key==='shoulders')addShoulders();
     else if(key==='legs')addLegs();
     else if(key==='biceps')add(core,'biceps_direct','Direct biceps',bicepsDirect);
     else if(key==='triceps')add(core,'triceps_direct','Direct triceps',tricepsDirect);
     else if(key==='quads')add(core,'quads_direct','Quads',ex=>meta(ex).primary.includes('quads'));
     else if(key==='hamstrings')add(core,'hamstrings_direct','Hamstrings',hamstringPattern);
     else if(key==='glutes')add(core,'glutes_direct','Glutes',ex=>meta(ex).primary.includes('glutes'));
     else if(key==='calves')add(core,'calves_direct','Calves',calfPattern);
     else if(key==='core')add(core,'core_direct','Core',corePattern);
     else if(key==='push'){addChest();addShoulders();add(core,'triceps_direct','Direct triceps',tricepsDirect)}
     else if(key==='pull'){addBack();add(core,'biceps_direct','Direct biceps',bicepsDirect)}
   });
 }
 return {keys,core,optional};
}
function coachSelectExercises(request,count){
 count=coachSmartExerciseCount(request,count);
 const pool=visibleExercises(),selected=[],coverage={},primaryCoverage={},patterns={},families={},targets=new Set(request.targetRegions);
 let plan=coachCoveragePlan(request,count);
 count=Math.max(count,Math.min(8,plan.core.length));
 plan=coachCoveragePlan(request,count);
 const register=pick=>{
   if(!pick||selected.some(x=>x.id===pick.id))return false;
   selected.push(pick);
   patterns[pick.pattern]=(patterns[pick.pattern]||0)+1;
   const family=coachMovementFamily(pick);families[family]=(families[family]||0)+1;
   const m=exerciseMuscleMetadata(pick);
   m.primary.filter(region=>targets.has(region)).forEach(region=>{
     coverage[region]=(coverage[region]||0)+1;primaryCoverage[region]=(primaryCoverage[region]||0)+1;
   });
   m.secondary.filter(region=>targets.has(region)).forEach(region=>coverage[region]=(coverage[region]||0)+.35);
   return true;
 };
 const slotPick=slot=>{
   const ranked=pool.filter(ex=>!selected.some(x=>x.id===ex.id)&&slot.match(ex))
     .map(ex=>({ex,score:coachDynamicCandidateScore(ex,request,coverage,patterns,families,primaryCoverage,count)}))
     .filter(x=>Number.isFinite(x.score))
     .sort((a,b)=>b.score-a.score||a.ex.name.localeCompare(b.ex.name));
   return ranked[0]?.ex||null;
 };

 (request.requiredExerciseIds||[]).map(exById).filter(Boolean).forEach(ex=>{
   if(selected.length>=count)return;
   if(coachExerciseAllowedByConstraints(ex,request))register(ex);
 });

 for(const slot of plan.core){
   if(selected.length>=count)break;
   const pick=slotPick(slot);if(pick)register(pick);
 }
 for(const slot of plan.optional){
   if(selected.length>=count)break;
   const pick=slotPick(slot);if(pick)register(pick);
 }

 while(selected.length<count){
   const ranked=pool.filter(ex=>!selected.some(x=>x.id===ex.id))
     .map(ex=>({ex,score:coachDynamicCandidateScore(ex,request,coverage,patterns,families,primaryCoverage,count)}))
     .filter(x=>Number.isFinite(x.score))
     .sort((a,b)=>b.score-a.score||a.ex.name.localeCompare(b.ex.name));
   const pick=ranked[0]?.ex;if(!pick)break;
   register(pick);
 }
 const compoundPatterns=new Set(['squat','hinge','horizontal_press','incline_press','vertical_press','horizontal_pull','vertical_pull','lunge']);
 const orderTier=ex=>{
   const family=coachMovementFamily(ex);
   if(compoundPatterns.has(ex.pattern)&&!['biceps_curl','triceps_extension','dip_press'].includes(family))return 0;
   if(['chest_fly','lat_isolation','lateral_raise','rear_delt','leg_extension','leg_curl','hip_extension'].includes(family))return 1;
   if(['biceps_curl','triceps_extension','calf_raise','spinal_flexion','hip_flexion_core','anti_extension'].includes(family))return 2;
   return 1;
 };
 return selected.map((ex,index)=>({ex,index,tier:orderTier(ex)}))
   .sort((a,b)=>a.tier-b.tier||a.index-b.index)
   .map(x=>x.ex);
}
function coachWorkoutName(request){
 const target=request.targetLabels.length?request.targetLabels.join(' + '):'Workout';
 const suffix=request.goal==='strength'?'Strength':request.goal==='general'?'Training':'Growth';
 return `Coach · ${target} · ${suffix}`;
}
function coachGenerateWorkout(request){
 const req={
   ...request,duration:request.duration||45,
   targetKeys:[...(request.targetKeys||[])],targetLabels:[...(request.targetLabels||[])],targetRegions:[...(request.targetRegions||[])],
   liftingGrammar:{...(request.liftingGrammar||{})},
   allowedEquipment:[...(request.allowedEquipment||[])],excludedEquipment:[...(request.excludedEquipment||[])],
   priorityRegions:[...(request.priorityRegions||[])],excludedExerciseIds:[...(request.excludedExerciseIds||[])],
   requiredExerciseIds:[...(request.requiredExerciseIds||[])]
 };
 const defaults=coachApplyLiftingGrammarToDefaults(coachProgrammingDefaults(req.goal,req.duration),req.liftingGrammar);
 const selected=coachSelectExercises(req,defaults.exerciseCount);
 if(!selected.length)return null;
 coachBuildDraft={request:req,defaults,selectedIds:selected.map(x=>x.id),createdAt:new Date().toISOString(),lastRefinement:request.lastRefinement||''};
 return coachBuildDraft;
}
function coachExplicitGoal(text){
 const lower=String(text||'').toLowerCase();
 if(/\bstrength\b|\bstronger\b|\bheavy\b|\bpowerlifting\b/.test(lower))return 'strength';
 if(/\bhypertrophy\b|\bmuscle growth\b|\bbodybuild/.test(lower)||/\bsize\b/.test(lower))return 'hypertrophy';
 if(/\bgeneral fitness\b|\bgeneral workout\b|\bgeneral training\b/.test(lower))return 'general';
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
 [/\bdb\b/gi,'dumbbell'],[/\bbb\b/gi,'barbell'],[/\bo h p\b/gi,'ohp'],
 [/\br d l s?\b/gi,'rdl'],[/\bromanian dead lefts?\b/gi,'romanian deadlift'],
 [/\bdead lefts?\b/gi,'deadlift'],[/\bpull downs?\b/gi,'pulldown'],[/\bpush downs?\b/gi,'pushdown'],
 [/\bpreacher corals?\b/gi,'preacher curl'],[/\bbulgarian split squads?\b/gi,'bulgarian split squat'],
 [/\blat pull towns?\b/gi,'lat pulldown'],[/\bhamer\b/gi,'hammer'],[/\btricept?s?\b/gi,'triceps']
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
function coachNumbersToDigits(text){
 return String(text||'').replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/gi,m=>String(COACH_NUMBER_WORDS[m.toLowerCase()]));
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
 req.priorityRegions=[...(req.priorityRegions||[])];req.excludedExerciseIds=[...(req.excludedExerciseIds||[])];req.requiredExerciseIds=[...(req.requiredExerciseIds||[])];
 let changed=false;
 const parsed=coachParsePrompt(raw,req.goal),explicitGoal=coachExplicitGoal(raw),equipment=coachParseEquipment(raw);
 if(parsed.duration){req.duration=parsed.duration;changed=true}
 if(parsed.liftingGrammar?.hasAny){
   req.liftingGrammar={...(req.liftingGrammar||{}),...parsed.liftingGrammar};
   changed=true;
 }
 if(explicitGoal&&explicitGoal!==req.goal){req.goal=explicitGoal;changed=true}
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
 const targetKeys=coachParseTargets(raw).keys||[];
 const negativeTargetKeys=targetKeys.filter(k=>new RegExp('(?:no|without|skip|exclude)\\s+'+k.replace(' ','\\s+'),'i').test(lower));
 negativeTargetKeys.forEach(k=>{coachRemoveTargetKey(req,k);changed=true});
 const positiveTargets=coachParseTargets(raw);
 const hasMore=/\bmore\b|\bemphas(?:ize|is)\b|\bprioriti[sz]e\b/.test(lower);
 const hasAdd=/\badd\b|\binclude\b|\balso\b|\bplus\b/.test(lower);
 const hasReplace=/\binstead\b|\bswitch\b|\bchange\b|\bfocus on\b|\btrain\b/.test(lower);
 const positiveRegions=positiveTargets.regions.filter(r=>!negativeTargetKeys.some(k=>coachTargetRegionsForKey(k).includes(r)));
 if(positiveRegions.length){
   if(hasMore){
     req.priorityRegions=[...new Set([...req.priorityRegions,...positiveRegions])];
     req.targetRegions=[...new Set([...req.targetRegions,...positiveRegions])];
     req.targetLabels=[...new Set([...req.targetLabels,...positiveTargets.labels])];
     req.targetKeys=[...new Set([...req.targetKeys,...(positiveTargets.keys||[])])];
   }else if(hasAdd){
     req.targetRegions=[...new Set([...req.targetRegions,...positiveRegions])];
     req.targetLabels=[...new Set([...req.targetLabels,...positiveTargets.labels])];
     req.targetKeys=[...new Set([...req.targetKeys,...(positiveTargets.keys||[])])];
   }else if(hasReplace||positiveTargets.labels.length===1&&raw.split(/\s+/).length<=4){
     req.targetRegions=[...positiveRegions];req.targetLabels=[...positiveTargets.labels];req.targetKeys=[...(positiveTargets.keys||[])];
     req.priorityRegions=[];
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

function coachProgramName(request,intent){
 const goal=request.goal==='strength'?'Strength':request.goal==='general'?'Training':'Growth';
 return `Coach · ${intent.frequency}-Day ${coachProgramSplitLabel(intent.split||coachDefaultProgramSplit(intent.frequency))} · ${goal}`;
}
function coachCloneRequest(request){
 return {
   ...request,
   targetKeys:[...(request.targetKeys||[])],targetLabels:[...(request.targetLabels||[])],targetRegions:[...(request.targetRegions||[])],
   allowedEquipment:[...(request.allowedEquipment||[])],excludedEquipment:[...(request.excludedEquipment||[])],
   priorityRegions:[...(request.priorityRegions||[])],excludedExerciseIds:[...(request.excludedExerciseIds||[])],
   requiredExerciseIds:[...(request.requiredExerciseIds||[])]
 };
}
function coachGenerateProgram(request,intent,previous=null){
 const frequency=Math.max(2,Math.min(6,Number(intent.frequency)||0));if(!frequency)return null;
 const split=intent.split||coachDefaultProgramSplit(frequency),slots=coachProgramSlots(frequency,split);
 const req=coachCloneRequest({...request,duration:request.duration||45});
 req.programFocusRegions=[...new Set(intent.focusRegions||request.programFocusRegions||[])];
 req.programFocusLabels=[...new Set(intent.focusLabels||request.programFocusLabels||[])];
 const defaults=coachProgrammingDefaults(req.goal,req.duration),usage={},dayOverrides=previous?.dayOverrides||[];
 const days=slots.map((key,index)=>{
   const group=COACH_TARGET_GROUPS[key],override=dayOverrides[index]||{excludedExerciseIds:[],requiredExerciseIds:[]};
   const targetRegions=[...(group?.regions||[])],targetSet=new Set(targetRegions);
   const dayReq=coachCloneRequest(req);
   dayReq.targetKeys=[key];dayReq.targetLabels=[group?.label||'Workout'];dayReq.targetRegions=targetRegions;
   dayReq.priorityRegions=req.programFocusRegions.filter(region=>targetSet.has(region));
   dayReq.excludedExerciseIds=[...new Set([...(req.excludedExerciseIds||[]),...(override.excludedExerciseIds||[])])];
   dayReq.requiredExerciseIds=[...new Set(override.requiredExerciseIds||[])];
   dayReq.programExerciseUsage=usage;
   const selected=coachSelectExercises(dayReq,defaults.exerciseCount);
   selected.forEach(ex=>usage[ex.id]=(usage[ex.id]||0)+1);
   return {
     key,label:coachProgramDayDisplayLabel(key,index,slots),request:dayReq,
     defaults:{...defaults},selectedIds:selected.map(ex=>ex.id)
   };
 });
 if(days.some(day=>!day.selectedIds.length))return null;
 coachProgramBuildDraft={
   request:req,
   intent:{...intent,frequency,split,preferredDays:[...(intent.preferredDays||[])]},
   slots,days,dayOverrides:slots.map((_,i)=>({
     excludedExerciseIds:[...(dayOverrides[i]?.excludedExerciseIds||[])],
     requiredExerciseIds:[...(dayOverrides[i]?.requiredExerciseIds||[])]
   })),
   createdAt:previous?.createdAt||new Date().toISOString(),
   lastRefinement:previous?.lastRefinement||''
 };
 return coachProgramBuildDraft;
}
function coachProgramWeeklyCoverage(draft=coachProgramBuildDraft){
 const scores={};if(!draft)return scores;
 draft.days.forEach(day=>{
   day.selectedIds.forEach(id=>{
     const ex=exById(id),meta=exerciseMuscleMetadata(ex),sets=day.defaults.sets;
     meta.primary.forEach(m=>scores[m]=(scores[m]||0)+sets);
     meta.secondary.forEach(m=>scores[m]=(scores[m]||0)+sets*.5);
   });
 });
 return scores;
}
function coachProgramCoverageText(draft=coachProgramBuildDraft){
 const scores=coachProgramWeeklyCoverage(draft);
 const rows=Object.entries(scores).sort((a,b)=>b[1]-a[1]).slice(0,8);
 if(!rows.length)return '';
 return rows.map(([region,sets])=>`${MUSCLE_REGION_LABELS[region]||region} ${Number(sets.toFixed(1))}`).join(' · ');
}
function coachProgramScheduleText(draft=coachProgramBuildDraft){
 const days=draft?.intent?.preferredDays||[];
 return days.length?days.map(d=>PROGRAM_DAYS[d]).join(' / '):'Flexible training days';
}
function coachProgramRoutineFromDay(day,draft=coachProgramBuildDraft,id=uid()){
 const d=day.defaults,r=draft.request;
 return {
   id,name:`${coachProgramName(r,draft.intent)} · ${day.label}`,
   description:`Generated locally by Coach Swolecat as part of a ${draft.intent.frequency}-day ${coachProgramSplitLabel(draft.intent.split)} program. Evidence rules: ACSM 2026 resistance-training position stand + NSCA program-design framework.`,
   trainingMode:d.trainingMode,
   exercises:day.selectedIds.map(exerciseId=>({
     exerciseId,sets:d.sets,minReps:d.minReps,maxReps:d.maxReps,increment:state.settings.defaultIncrement,
     mode:'double',trainingGoal:d.goal,resetPercent:7.5,restSeconds:d.restSeconds
   }))
 };
}
function renderCoachProgramPreview(){
 const draft=coachProgramBuildDraft;if(!draft)return;
 const req=draft.request,intent=draft.intent,coverage=coachProgramCoverageText(draft);
 const equipment=req.allowedEquipment.length?req.allowedEquipment.join(', '):'Any available equipment';
 openModal('Coach Swolecat',`
  <div class="coach-builder">
   <div class="coach-console">
    <div class="eyebrow">PROGRAM BUILD // LOCAL ENGINE</div>
    <div class="coach-preview-head"><div><div class="exercise-name" style="font-size:1.16rem;margin-top:5px">${esc(coachProgramName(req,intent))}</div><div class="mini" style="margin-top:5px">${intent.frequency} workouts · ${esc(coachProgramScheduleText(draft))} · each workout targets about ${req.duration} minutes</div></div><span class="tag">${esc(coachProgramSplitLabel(intent.split))}</span></div>
    ${draft.lastRefinement?`<div class="mini" style="margin-top:8px"><b>Last change:</b> ${esc(draft.lastRefinement)}</div>`:''}
    <div class="coach-preview-meta"><span class="tag">${esc(coachGoalLabel(req.goal))}</span><span class="tag">${esc(equipment)}</span><span class="tag">${intent.frequency}×/week</span></div>
   </div>
   <div class="coach-exercise-list">
    ${draft.days.map((day,di)=>`<div class="card" style="margin:0">
      <div class="row"><div><div class="eyebrow">DAY ${di+1}</div><div class="exercise-name" style="margin-top:4px">${esc(day.label)}</div><div class="mini">${day.selectedIds.length} exercises · ${day.defaults.sets} sets each · ${day.defaults.minReps}–${day.defaults.maxReps} reps · ${day.defaults.restSeconds}s rest</div></div>${intent.preferredDays?.[di]!=null?`<span class="tag">${PROGRAM_DAYS[intent.preferredDays[di]]}</span>`:''}</div>
      <div style="margin-top:9px">${day.selectedIds.map((id,ei)=>{const ex=exById(id);return `<div class="list-item"><div class="grow"><div class="exercise-name">${esc(ex?.name||'Exercise')} ${preferenceBadgeHtml(id)}</div><div class="mini">${esc(coachExerciseReason(ex,day.request))}</div></div><div class="actions" style="margin:0"><button class="btn small secondary" onclick="coachProgramSwapExercise(${di},${ei})">Swap</button><button class="btn small secondary" onclick="coachProgramRemoveExercise(${di},${ei})">Remove</button></div></div>`}).join('')}</div>
    </div>`).join('')}
   </div>
   ${coverage?`<div class="coach-rationale"><b>Planned weekly set-equivalents:</b> ${esc(coverage)}.<br><span class="mini">Primary involvement counts as 1.0 set and secondary involvement as 0.5. This is a planning aid, not a claim about muscle damage or recovery.</span></div>`:''}
   <div class="coach-console"><div class="eyebrow">REFINE // TALK TO COACH</div><div class="mini" style="margin:5px 0 9px">Try “make it 4 days,” “upper/lower,” “35 minutes,” “dumbbells only,” “more shoulders,” or “Monday Tuesday Thursday Saturday.”</div><div class="home-coach-row"><div class="coach-voice-field"><input id="coachProgramRefinePrompt" placeholder="4 days, upper/lower, 40 min, more shoulders..." onkeydown="if(event.key==='Enter')coachApplyProgramRefinement()">${coachVoiceButtonHtml('coachProgramRefinePrompt')}</div><button class="btn" onclick="coachApplyProgramRefinement()">Update</button></div></div>
   <div class="notice">Coach distributes work across the week using your requested frequency, split, equipment, goal, exercise preferences, and a light recent-exercise variety signal. Weekly volume is balanced pragmatically around the time available. The plan does not estimate recovery or medical readiness.</div>
   <div class="actions"><button class="btn green" onclick="coachStartProgramFirstWorkout()">Save + Start Day 1</button><button class="btn" onclick="coachSaveGeneratedProgram()">Save Program</button><button class="btn secondary" onclick="openCoachSwolecat(true)">New Request</button></div>
  </div>`);
}
function coachProgramRegenerateWithOverrides(){
 const draft=coachProgramBuildDraft;if(!draft)return false;
 const previous={...draft,lastRefinement:draft.lastRefinement,dayOverrides:draft.dayOverrides};
 return !!coachGenerateProgram(draft.request,draft.intent,previous);
}
function coachProgramRemoveExercise(dayIndex,exerciseIndex){
 const draft=coachProgramBuildDraft,day=draft?.days?.[dayIndex],id=day?.selectedIds?.[exerciseIndex];if(!id)return;
 if(day.selectedIds.length<=1){showToast('Keep at least one exercise in the workout');return}
 const override=draft.dayOverrides[dayIndex]||(draft.dayOverrides[dayIndex]={excludedExerciseIds:[],requiredExerciseIds:[]});
 override.excludedExerciseIds=[...new Set([...(override.excludedExerciseIds||[]),id])];
 override.requiredExerciseIds=(override.requiredExerciseIds||[]).filter(x=>x!==id);
 draft.lastRefinement=`Removed ${exById(id)?.name||'exercise'} from ${day.label}`;
 coachProgramRegenerateWithOverrides();renderCoachProgramPreview();
}
function coachProgramSwapExercise(dayIndex,exerciseIndex){
 const draft=coachProgramBuildDraft,day=draft?.days?.[dayIndex],id=day?.selectedIds?.[exerciseIndex];if(!id)return;
 const override=draft.dayOverrides[dayIndex]||(draft.dayOverrides[dayIndex]={excludedExerciseIds:[],requiredExerciseIds:[]});
 override.excludedExerciseIds=[...new Set([...(override.excludedExerciseIds||[]),id])];
 override.requiredExerciseIds=(override.requiredExerciseIds||[]).filter(x=>x!==id);
 draft.lastRefinement=`Swapped ${exById(id)?.name||'exercise'} in ${day.label}`;
 coachProgramRegenerateWithOverrides();renderCoachProgramPreview();
}
function coachRefineProgramText(text){
 const draft=coachProgramBuildDraft,raw=String(text||'').trim();if(!draft||!raw)return {ok:false,message:'Tell Coach what you want changed.'};
 const req=coachCloneRequest(draft.request),intent={...draft.intent,preferredDays:[...(draft.intent.preferredDays||[])]};
 const parsed=coachParsePrompt(raw,req.goal),program=coachParseProgramIntent(raw),goal=coachExplicitGoal(raw),equipment=coachParseEquipment(raw);
 let changed=false,structureChanged=false;
 if(parsed.duration){req.duration=parsed.duration;changed=true}
 if(goal&&goal!==req.goal){req.goal=goal;changed=true}
 if(program.frequency&&program.frequency!==intent.frequency){intent.frequency=program.frequency;changed=true;structureChanged=true}
 if(program.split&&program.split!==intent.split){intent.split=program.split;changed=true;structureChanged=true}
 if(program.preferredDays.length){
   intent.preferredDays=[...program.preferredDays];
   if(!program.frequency)intent.frequency=program.preferredDays.length;
   changed=true;structureChanged=true;
 }
 if(equipment.allowed.length){req.allowedEquipment=[...equipment.allowed];req.excludedEquipment=req.excludedEquipment.filter(x=>!equipment.allowed.includes(x));changed=true}
 if(equipment.excluded.length){req.excludedEquipment=[...new Set([...req.excludedEquipment,...equipment.excluded])];req.allowedEquipment=req.allowedEquipment.filter(x=>!equipment.excluded.includes(x));changed=true}
 if(/\bbalanced\b|\bno (?:special )?focus\b|\bevenly\b/.test(raw.toLowerCase())){
   intent.focusRegions=[];intent.focusLabels=[];changed=true;
 }else if(program.focusRegions.length){
   intent.focusRegions=[...new Set(program.focusRegions)];intent.focusLabels=[...new Set(program.focusLabels)];changed=true;
 }
 if(!changed)return {ok:false,message:'I did not find a program change there. Try “4 days,” “upper/lower,” “35 minutes,” “dumbbells only,” or “more shoulders.”'};
 if(intent.preferredDays.length&&intent.preferredDays.length!==intent.frequency)intent.preferredDays=[];
 const previous=structureChanged?null:{...draft,dayOverrides:draft.dayOverrides};
 if(!coachGenerateProgram(req,intent,previous))return {ok:false,message:'Those constraints leave at least one workout without enough matching exercises. Broaden the equipment or split.'};
 coachProgramBuildDraft.lastRefinement=raw;
 return {ok:true,message:'Program updated.'};
}
function coachApplyProgramRefinement(){
 const input=document.getElementById('coachProgramRefinePrompt'),text=input?.value.trim()||'';
 if(!text){showToast('Tell Coach what you want changed');return}
 const result=coachRefineProgramText(text);
 if(!result.ok){showToast(result.message);return}
 renderCoachProgramPreview();
}
function coachPersistGeneratedProgram(draft=coachProgramBuildDraft){
 if(!draft)return null;
 if(draft.savedProgramId){
   const existing=programById(draft.savedProgramId);
   if(existing)return existing;
 }
 const routines=draft.days.map(day=>coachProgramRoutineFromDay(day,draft));
 state.routines.push(...routines);
 const p={
   id:uid(),name:coachProgramName(draft.request,draft.intent),routineIds:routines.map(r=>r.id),
   frequency:draft.intent.frequency,preferredDays:[...(draft.intent.preferredDays||[])],
   trainingMode:'inherit',nextIndex:0
 };
 state.programs.push(p);if(!state.activeProgramId)state.activeProgramId=p.id;
 draft.savedProgramId=p.id;draft.savedRoutineIds=[...p.routineIds];
 return p;
}
function coachSaveGeneratedProgram(){
 const p=coachPersistGeneratedProgram();if(!p)return null;
 save();renderRoutines();renderPrograms();renderHome();closeModal();showToast('Coach program saved');
 return p.id;
}
function coachStartProgramFirstWorkout(){
 const p=coachPersistGeneratedProgram();if(!p)return;
 save();renderRoutines();renderPrograms();renderHome();closeModal();
 state.activeProgramId=p.id;save();startProgramWorkout(p.id,0);showToast('Coach program saved · Day 1 ready');
}
function coachContinueProgramRequest(){
 const draft=coachProgramBuildDraft;if(!draft)return;
 if(!draft.intent.frequency){
   openModal('Coach Swolecat',`<div class="coach-console"><div class="eyebrow">ONE QUICK QUESTION</div><div class="coach-question">How many days per week can you train?</div><div class="coach-choice-grid">${[2,3,4,5,6].map(n=>`<button class="btn secondary" onclick="coachAnswerProgramFrequency(${n})">${n} days</button>`).join('')}</div></div>`);
   return;
 }
 if(!coachGenerateProgram(draft.request,draft.intent,draft)){showToast('Coach could not build every workout with those constraints');return}
 renderCoachProgramPreview();
}
function coachAnswerProgramFrequency(days){
 if(!coachProgramBuildDraft)return;
 coachProgramBuildDraft.intent.frequency=Math.max(2,Math.min(6,Number(days)||3));
 if(!coachProgramBuildDraft.intent.split)coachProgramBuildDraft.intent.split=coachDefaultProgramSplit(coachProgramBuildDraft.intent.frequency);
 coachContinueProgramRequest();
}
function coachExerciseReason(ex,request){
 const meta=exerciseMuscleMetadata(ex),targets=new Set(request.targetRegions);
 const primary=meta.primary.filter(x=>targets.has(x)).map(x=>MUSCLE_REGION_LABELS[x]||x);
 const secondary=meta.secondary.filter(x=>targets.has(x)).map(x=>MUSCLE_REGION_LABELS[x]||x);
 const bits=[];
 if((request.requiredExerciseIds||[]).includes(ex.id))bits.push('Requested by you');
 if(primary.length)bits.push('Primary: '+primary.join(', '));
 if(secondary.length)bits.push('Secondary: '+secondary.join(', '));
 bits.push(patternLabel(ex.pattern));
 return bits.join(' · ');
}
function coachDraftRoutine(draft=coachBuildDraft,id=uid()){
 if(!draft)return null;
 const d=draft.defaults,r=draft.request,g=r.liftingGrammar||{};
 const firstWarmupId=g.warmupMode==='first_compound'
   ?draft.selectedIds.find(exerciseId=>COACH_COMPOUND_PATTERNS.has(exById(exerciseId)?.pattern))
   :null;
 return {
   id,name:coachWorkoutName(r),
   description:`Generated locally by Coach Swolecat from: "${r.prompt||r.targetLabels.join(' + ')}". Evidence rules: ACSM 2026 resistance-training position stand + NSCA program-design framework.`,
   trainingMode:d.trainingMode,
   exercises:draft.selectedIds.map(exerciseId=>{
     const explicit=draft.explicitConfigById?.[exerciseId];
     return {
       exerciseId,sets:explicit?.sets||d.sets,minReps:explicit?.minReps||d.minReps,maxReps:explicit?.maxReps||d.maxReps,increment:state.settings.defaultIncrement,
       mode:'double',trainingGoal:d.goal,resetPercent:7.5,restSeconds:d.restSeconds,
       autoWarmup:exerciseId===firstWarmupId,
       targetRIR:Number.isFinite(Number(d.targetRIR))?Number(d.targetRIR):null,
       targetRPE:Number.isFinite(Number(d.targetRPE))?Number(d.targetRPE):null,
       lastSetAmrap:!!g.lastSetAmrap
     };
   })
 };
}
function renderCoachPreview(){
 const draft=coachBuildDraft;if(!draft)return;
 const req=draft.request,d=draft.defaults,routine=coachDraftRoutine(draft,'preview');
 const equipment=req.allowedEquipment.length?req.allowedEquipment.join(', '):'Any available equipment';
 openModal('Coach Swolecat',`
   <div class="coach-builder">
    <div class="coach-console">
      <div class="eyebrow">QUICK BUILD // LOCAL ENGINE</div>
      <div class="coach-preview-head"><div><div class="exercise-name" style="font-size:1.16rem;margin-top:5px">${esc(routine.name)}</div><div class="mini" style="margin-top:5px">Built from audited Swolecat exercise metadata · local and offline.</div></div><span class="tag">${req.duration} min target</span></div>
      ${draft.lastRefinement?`<div class="mini" style="margin-top:8px"><b>Last change:</b> ${esc(draft.lastRefinement)}</div>`:''}
      <div class="coach-preview-meta"><span class="tag">${esc(coachGoalLabel(req.goal))}</span><span class="tag">${esc(equipment)}</span>${draft.explicitPrescription?'<span class="tag">Custom sets / reps</span>':`<span class="tag">${d.sets} × ${d.minReps}–${d.maxReps}</span>`}<span class="tag">${d.restSeconds}s rest</span>${req.liftingGrammar?.warmupMode==='first_compound'?'<span class="tag">Warm-up first</span>':''}${Number.isFinite(Number(d.targetRIR))?`<span class="tag">Target ${d.targetRIR} RIR</span>`:''}${req.liftingGrammar?.lastSetAmrap?'<span class="tag">Last set AMRAP</span>':''}</div>
    </div>
    <div class="coach-exercise-list">
      ${draft.selectedIds.map((id,i)=>{const ex=exById(id);return `<div class="coach-exercise">
        <div class="coach-exercise-index">${String(i+1).padStart(2,'0')}</div>
        <div><div class="exercise-name">${esc(ex?.name||'Exercise')} ${preferenceBadgeHtml(id)}</div><div class="mini" style="margin-top:3px">${esc(coachExerciseReason(ex,req))}<br>${draft.explicitConfigById?.[id]?.sets||d.sets} sets · ${draft.explicitConfigById?.[id]?.minReps||d.minReps}${(draft.explicitConfigById?.[id]?.maxReps||d.maxReps)!==(draft.explicitConfigById?.[id]?.minReps||d.minReps)?'–'+(draft.explicitConfigById?.[id]?.maxReps||d.maxReps):''} reps · ${d.restSeconds}s rest</div></div>
        <div class="coach-exercise-actions"><button class="btn small secondary" onclick="coachSwapExercise(${i})">Swap</button><button class="btn small secondary" onclick="coachRemoveExercise(${i})">Remove</button></div>
      </div>`}).join('')}
    </div>
    <div class="coach-rationale"><b>Why this structure:</b> ${draft.explicitPrescription?'This is your exercise list. Coach preserves the exercises you named and only changes the list when you explicitly ask it to add, remove, swap, or modify something.':'exercise selection is ranked from requested muscles, primary/secondary involvement, equipment, movement-pattern balance, your Prefer/Avoid/Favorite/Hidden settings, and a light recent-exercise variety signal.'} Swolecat does not invent a starting weight; your own exercise history and progression engine handle load once the workout starts.</div>
    ${coachRecentContextText(req)?`<div class="notice">${esc(coachRecentContextText(req))}</div>`:''}
    <div class="coach-console" style="margin-top:10px"><div class="eyebrow">REFINE // TALK TO COACH</div><div class="mini" style="margin:5px 0 9px">${draft.explicitPrescription?'Edit your exact list. Try “add 1 set of assisted pull-ups,” “make bench 4 sets of 6,” or “remove Bulgarian split squats.”':'Change the draft naturally. Try “make it 30 minutes,” “no barbells,” “more chest,” “strength focused,” “remove bench press,” or “add lateral raise.”'}</div><div class="home-coach-row"><div class="coach-voice-field"><input id="coachRefinePrompt" placeholder="${draft.explicitPrescription?'Add 1 set of assisted pull-ups...':'Make it 30 min, no barbells, more chest...'}" onkeydown="if(event.key==='Enter')coachApplyRefinement()">${coachVoiceButtonHtml('coachRefinePrompt')}</div><button class="btn" onclick="coachApplyRefinement()">Update</button></div></div>
    <div class="notice">Programming presets are practical defaults, not claims that one rep range or exercise is universally best. Recent logs are used only as context and a small variety signal, never as a recovery or readiness diagnosis.</div>
    <div class="actions"><button class="btn green" onclick="coachStartWorkoutNow()">Start Workout Now</button><button class="btn" onclick="coachSaveRoutine()">Save as Routine</button><button class="btn secondary" onclick="coachOpenAddToProgram()">Add to Program</button><button class="btn secondary" onclick="openCoachSwolecat(true)">New Request</button></div>
   </div>`);
}
function coachRemoveExercise(index){
 const id=coachBuildDraft?.selectedIds?.[index];if(!id)return;
 if(coachBuildDraft.selectedIds.length<=1){showToast('Keep at least one exercise');return}
 coachBuildDraft.request.excludedExerciseIds=[...new Set([...(coachBuildDraft.request.excludedExerciseIds||[]),id])];
 coachBuildDraft.request.requiredExerciseIds=(coachBuildDraft.request.requiredExerciseIds||[]).filter(x=>x!==id);
 if(coachBuildDraft.explicitConfigById)delete coachBuildDraft.explicitConfigById[id];
 coachBuildDraft.selectedIds.splice(index,1);
 coachBuildDraft.lastRefinement=`Removed ${exById(id)?.name||'exercise'}`;
 renderCoachPreview();
}
function coachSwapExercise(index){
 const draft=coachBuildDraft,currentId=draft?.selectedIds?.[index];if(!currentId)return;
 const current=exById(currentId),currentFamily=coachMovementFamily(current);
 const selectedOther=draft.selectedIds.filter((_,i)=>i!==index),coverage={},primaryCoverage={},patterns={},families={},targets=new Set(draft.request.targetRegions);
 selectedOther.forEach(id=>{
   const ex=exById(id);if(!ex)return;
   patterns[ex.pattern]=(patterns[ex.pattern]||0)+1;
   const family=coachMovementFamily(ex);families[family]=(families[family]||0)+1;
   const meta=exerciseMuscleMetadata(ex);
   meta.primary.filter(m=>targets.has(m)).forEach(m=>{coverage[m]=(coverage[m]||0)+1;primaryCoverage[m]=(primaryCoverage[m]||0)+1});
   meta.secondary.filter(m=>targets.has(m)).forEach(m=>coverage[m]=(coverage[m]||0)+.35);
 });
 const all=visibleExercises().filter(ex=>ex.id!==currentId&&!selectedOther.includes(ex.id));
 const rank=items=>items
   .map(ex=>({ex,score:coachDynamicCandidateScore(ex,draft.request,coverage,patterns,families,primaryCoverage,draft.selectedIds.length)}))
   .filter(x=>Number.isFinite(x.score))
   .sort((a,b)=>b.score-a.score||a.ex.name.localeCompare(b.ex.name))[0]?.ex;
 let replacement=rank(all.filter(ex=>coachMovementFamily(ex)===currentFamily));
 if(!replacement){
   const curMeta=exerciseMuscleMetadata(current),curPrimary=new Set(curMeta.primary.filter(m=>targets.has(m)));
   replacement=rank(all.filter(ex=>exerciseMuscleMetadata(ex).primary.some(m=>curPrimary.has(m))));
 }
 if(!replacement)replacement=rank(all);
 if(!replacement){showToast('No suitable replacement found');return}
 draft.request.excludedExerciseIds=[...new Set([...(draft.request.excludedExerciseIds||[]),currentId])];
 draft.request.requiredExerciseIds=(draft.request.requiredExerciseIds||[]).filter(id=>id!==currentId);
 if(draft.explicitConfigById){
   const config=draft.explicitConfigById[currentId];delete draft.explicitConfigById[currentId];
   if(config)draft.explicitConfigById[replacement.id]={...config,exerciseId:replacement.id};
 }
 draft.selectedIds[index]=replacement.id;
 draft.lastRefinement=`Swapped ${current?.name||'exercise'} for ${replacement.name}`;
 renderCoachPreview();
}
function coachPersistRoutine(draft=coachBuildDraft){
 if(!draft)return null;
 if(draft.savedRoutineId){
   const existing=state.routines.find(r=>r.id===draft.savedRoutineId);
   if(existing)return existing;
 }
 const routine=coachDraftRoutine(draft);if(!routine)return null;
 state.routines.push(routine);draft.savedRoutineId=routine.id;
 return routine;
}
function coachSaveRoutine(draft=coachBuildDraft){
 const routine=coachPersistRoutine(draft);if(!routine)return null;
 save();renderRoutines();renderHome();closeModal();showToast('Coach workout saved as a routine');
 return routine.id;
}
function coachAttachDraftToProgram(programId,draft=coachBuildDraft){
 const p=programById(programId);if(!p||!draft)return null;
 const routine=coachPersistRoutine(draft);if(!routine)return null;
 if(!p.routineIds.includes(routine.id))p.routineIds.push(routine.id);
 save();renderRoutines();renderPrograms();renderHome();
 return routine.id;
}
function coachCreateProgramFromDraft(draft=coachBuildDraft){
 if(!draft)return null;
 const routine=coachPersistRoutine(draft);if(!routine)return null;
 const p={id:uid(),name:`${routine.name} Program`,routineIds:[routine.id],frequency:3,preferredDays:[],trainingMode:'inherit',nextIndex:0};
 state.programs.push(p);if(!state.activeProgramId)state.activeProgramId=p.id;
 save();renderRoutines();renderPrograms();renderHome();closeModal();showToast('Coach workout added to a new program');
 return p.id;
}
function coachAddToProgram(programId){
 const p=programById(programId);if(!p)return;
 const routineId=coachAttachDraftToProgram(programId);
 if(!routineId)return;
 closeModal();showToast(`Added to ${p.name}`);
}
function coachOpenAddToProgram(){
 if(!coachBuildDraft)return;
 const programs=state.programs||[];
 openModal('Add Coach workout to program',`
   <div class="coach-console"><div class="eyebrow">PROGRAM HANDOFF</div><div class="coach-question">Where should this workout go?</div><div class="mini" style="margin-top:5px">Swolecat will save this generated workout as a normal routine, then add that routine to the selected program.</div></div>
   ${programs.length?`<div class="card" style="margin-top:10px">${programs.map(p=>`<div class="list-item"><div class="grow"><div class="exercise-name">${esc(p.name)}</div><div class="mini">${p.routineIds.length} workout${p.routineIds.length===1?'':'s'} · ${p.frequency}×/week</div></div><button class="btn small" onclick="coachAddToProgram('${p.id}')">Add</button></div>`).join('')}</div>`:''}
   <div class="actions"><button class="btn secondary" onclick="coachCreateProgramFromDraft()">Create New Program</button><button class="btn secondary" onclick="renderCoachPreview()">Back</button></div>
 `);
}
function coachActiveWorkoutFromDraft(draft=coachBuildDraft){
 const routine=coachDraftRoutine(draft,null);if(!routine)return null;
 const effectiveMode=normalizeTrainingMode(routine.trainingMode),now=new Date().toISOString();
 return {
   id:uid(),routineId:null,routineName:routine.name,trainingMode:effectiveMode,programId:null,startDate:now,status:'active',lastSavedAt:now,structureDirty:false,pausedAt:null,pausedDurationMs:0,
   exercises:routine.exercises.map((re,routineIndex)=>{
     const prev=previousExercise(re.exerciseId),config={trainingGoal:'general',resetPercent:7.5,...re,routineMode:effectiveMode,mode:re.mode==='range'?'double':re.mode};
     const rec=buildRecommendation(config,prev,re.exerciseId);
     return {exerciseId:re.exerciseId,routineIndex,config,targetOverride:null,supersetId:null,skipped:false,expanded:routineIndex===0,sets:activeSetsFromRoutineExercise(re,rec,exById(re.exerciseId)),notes:''};
   })
 };
}
function coachStartWorkoutNow(draft=coachBuildDraft){
 if(!draft)return false;
 if(state.activeWorkout){showToast('Finish or cancel your active workout first');return false}
 const active=coachActiveWorkoutFromDraft(draft);if(!active)return false;
 state.activeWorkout=active;saveActiveWorkout();updateActiveWorkoutChrome();requestWakeLock();haptic([20,35,20]);closeModal();renderWorkout();go('workout');showToast('Coach workout started');return true;
}
function coachContinueRequest(){
 const req=coachBuildDraft?.request;if(!req)return;
 if(!req.targetRegions.length){
   openModal('Coach Swolecat',`<div class="coach-console"><div class="eyebrow">ONE QUICK QUESTION</div><div class="coach-question">What are we training?</div><div class="coach-choice-grid">${['chest','back','shoulders','arms','legs','push','pull','full body'].map(k=>`<button class="btn secondary" onclick="coachAnswerTarget('${k}')">${esc(COACH_TARGET_GROUPS[k].label)}</button>`).join('')}</div></div>`);
   return;
 }
 if(!req.duration){
   openModal('Coach Swolecat',`<div class="coach-console"><div class="eyebrow">ONE QUICK QUESTION</div><div class="coach-question">How much time do we have?</div><div class="coach-choice-grid">${[30,45,60,75].map(m=>`<button class="btn secondary" onclick="coachAnswerDuration(${m})">${m} minutes</button>`).join('')}</div></div>`);
   return;
 }
 if(!coachGenerateWorkout(req)){alert('Coach Swolecat could not build a workout from that request with the available exercise/equipment filters. Try broadening the equipment or target muscles.');return}
 renderCoachPreview();
}
function coachAnswerTarget(key){
 const g=COACH_TARGET_GROUPS[key];if(!g||!coachBuildDraft)return;
 coachBuildDraft.request.targetKeys=[key];coachBuildDraft.request.targetLabels=[g.label];coachBuildDraft.request.targetRegions=[...g.regions];coachContinueRequest();
}
function coachAnswerDuration(minutes){
 if(!coachBuildDraft)return;coachBuildDraft.request.duration=Math.max(15,Math.min(120,Number(minutes)||45));coachContinueRequest();
}
function coachSubmitPrompt(){
 const input=document.getElementById('coachPrompt'),prompt=input?.value.trim()||'';
 if(!prompt){showToast('Tell Coach Swolecat what you want to train');return}
 const taught=coachTryTeachAlias(prompt);
 if(taught.handled){showToast(taught.message);return}
 const request=coachParsePrompt(prompt,coachPromptGoal),programIntent=coachParseProgramIntent(prompt),explicit=coachParseExplicitWorkout(prompt,request.goal);
 if(explicit.signal&&explicit.ambiguities?.length){coachBeginExerciseClarification({prompt,request,programIntent,explicit});return}
 if(explicit.signal&&explicit.items.length){
   coachProgramBuildDraft=null;coachGenerateExplicitWorkout(request,explicit);renderCoachPreview();return;
 }
 if(programIntent.isProgram){
   request.programFocusRegions=[...programIntent.focusRegions];request.programFocusLabels=[...programIntent.focusLabels];
   coachBuildDraft=null;
   coachProgramBuildDraft={request,intent:programIntent,days:[],dayOverrides:[],createdAt:new Date().toISOString()};
   coachContinueProgramRequest();return;
 }
 coachProgramBuildDraft=null;
 coachBuildDraft={request,selectedIds:[],defaults:null,createdAt:new Date().toISOString()};
 coachContinueRequest();
}
function openCoachSwolecat(reset=false){
 if(reset){coachBuildDraft=null;coachProgramBuildDraft=null;coachPromptGoal='hypertrophy'}
 openModal('Coach Swolecat',`
  <div class="coach-builder">
   <div class="coach-console">
    <div class="eyebrow">QUICK BUILD // OFFLINE</div>
    <div class="exercise-name" style="font-size:1.17rem;margin-top:5px">What are we building?</div>
    <div class="mini" style="margin-top:5px">Describe today's workout or a multi-day program naturally. Coach only asks for missing information that materially changes the plan.</div>
    <div class="coach-voice-field" style="margin-top:12px"><textarea id="coachPrompt" class="coach-prompt" placeholder="Say or type: bench press, squats, curls... or exact sets/reps"></textarea>${coachVoiceButtonHtml('coachPrompt')}</div>
    <div class="coach-example-row"><button class="coach-example" onclick="coachFillExample('Chest and back, 45 minutes, dumbbells and cables')">Chest + back</button><button class="coach-example" onclick="coachFillExample('3-day full body program, Monday Wednesday Friday, 45 minutes')">3-day plan</button><button class="coach-example" onclick="coachFillExample('Push pull legs program, 3 days, 60 minutes')">PPL</button></div>
   </div>
   <div><div class="mini" style="margin-bottom:6px">Primary goal</div><div class="picker-chips"><button class="chip active" data-coach-goal="hypertrophy" onclick="coachSetGoal('hypertrophy')">Muscle growth</button><button class="chip" data-coach-goal="strength" onclick="coachSetGoal('strength')">Strength</button><button class="chip" data-coach-goal="general" onclick="coachSetGoal('general')">General</button></div></div>
   <div class="actions"><button class="btn" onclick="coachSubmitPrompt()">Build Workout</button><button class="btn secondary" onclick="closeModal()">Cancel</button></div>
   <div class="mini">Evidence rules are versioned locally. Current foundation: ACSM 2026 resistance-training position stand and NSCA program-design framework.</div>
  </div>`);
 coachSetGoal(coachPromptGoal);
}

function homeSuggestedRoutine(){
 const active=activeRoutines();if(!active.length)return null;
 const byId=new Map(active.map(r=>[r.id,r]));
 const recent=state.sessions.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).find(s=>byId.has(s.routineId));
 return recent?byId.get(recent.routineId):active[0];
}
function homeCoachBuildPrompt(){
 const input=document.getElementById('homeCoachPrompt'),prompt=input?.value.trim()||'';
 if(!prompt){showToast('Tell Coach Swolecat what you want to build');return}
 const taught=coachTryTeachAlias(prompt);
 if(taught.handled){showToast(taught.message);return}
 const request=coachParsePrompt(prompt,coachPromptGoal),programIntent=coachParseProgramIntent(prompt),explicit=coachParseExplicitWorkout(prompt,request.goal);
 if(explicit.signal&&explicit.ambiguities?.length){coachBeginExerciseClarification({prompt,request,programIntent,explicit});return}
 if(explicit.signal&&explicit.items.length){
   coachProgramBuildDraft=null;coachGenerateExplicitWorkout(request,explicit);renderCoachPreview();return;
 }
 if(programIntent.isProgram){
   request.programFocusRegions=[...programIntent.focusRegions];request.programFocusLabels=[...programIntent.focusLabels];
   coachBuildDraft=null;
   coachProgramBuildDraft={request,intent:programIntent,days:[],dayOverrides:[],createdAt:new Date().toISOString()};
   coachContinueProgramRequest();return;
 }
 coachProgramBuildDraft=null;
 coachBuildDraft={request,selectedIds:[],defaults:null,createdAt:new Date().toISOString()};
 coachContinueRequest();
}
function homeCoachExample(text){
 const input=document.getElementById('homeCoachPrompt');if(input){input.value=text;input.focus()}
}
function homeCoachLauncherHtml({embedded=false}={}){
 return `<div class="${embedded?'home-new-user':''}">
   ${embedded?'':`<div class="home-coach-head"><div><div class="home-coach-title">Coach Swolecat</div><div class="mini">Need something different today?</div></div><span class="tag">QUICK BUILD</span></div>`}
   <div class="home-coach-row"><div class="coach-voice-field"><input id="homeCoachPrompt" placeholder="Say or type what you want to train..." onkeydown="if(event.key==='Enter')homeCoachBuildPrompt()">${coachVoiceButtonHtml('homeCoachPrompt')}</div><button class="btn" onclick="homeCoachBuildPrompt()">Build</button></div>
   <div class="home-coach-chips"><button class="home-coach-chip" onclick="homeCoachExample('30 minute leg workout')">30m legs</button><button class="home-coach-chip" onclick="homeCoachExample('Chest and back, 45 minutes')">Chest + back</button><button class="home-coach-chip" onclick="homeCoachExample('3-day full body program, Monday Wednesday Friday, 45 minutes')">3-day plan</button></div>
 </div>`;
}
function homeQuickActionsHtml(){
 return `<button class="home-route-btn" onclick="go('routines')"><b>Saved workouts</b><span>Routines and programs</span></button><button class="home-route-btn" onclick="newRoutine()"><b>Build manually</b><span>Choose every exercise yourself</span></button>`;
}
const COACH_INSIGHT_GROUPS=[
 {key:'lower body',label:'Lower body',regions:['quads','hamstrings','glutes','adductors','calves']},
 {key:'push',label:'Push muscles',regions:['chest','front_delts','side_delts','triceps']},
 {key:'pull',label:'Pull muscles',regions:['lats','upper_back','rear_delts','biceps']}
];
function coachSessionGroupScore(session,group){
 const scores=sessionMuscleScores(session);
 return group.regions.reduce((n,region)=>n+(Number(scores[region])||0),0);
}
function coachHistoryInsight(){
 if(state.activeWorkout||activeProgram()||state.sessions.length<3)return null;
 const sessions=state.sessions.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 const now=Date.now(),recent=sessions.filter(s=>{
   const t=new Date(s.date).getTime();return Number.isFinite(t)&&now-t<=14*86400000;
 });
 if(recent.length<3)return null;
 const candidates=[];
 COACH_INSIGHT_GROUPS.forEach(group=>{
   const recentScore=recent.reduce((n,session)=>n+coachSessionGroupScore(session,group),0);
   if(recentScore>0)return;
   const last=sessions.find(session=>coachSessionGroupScore(session,group)>0);
   const lastMs=last?new Date(last.date).getTime():NaN;
   const oldestMs=new Date(sessions.at(-1)?.date||0).getTime();
   const days=Number.isFinite(lastMs)?Math.floor((now-lastMs)/86400000):Number.isFinite(oldestMs)?Math.floor((now-oldestMs)/86400000):0;
   if(days<14)return;
   const otherWork=recent.reduce((n,session)=>n+COACH_INSIGHT_GROUPS.filter(g=>g.key!==group.key).reduce((x,g)=>x+coachSessionGroupScore(session,g),0),0);
   if(otherWork<=0)return;
   candidates.push({
     group,days,workouts:recent.length,
     text:last
       ?`You’ve logged ${recent.length} workouts in the last two weeks, but no ${group.label.toLowerCase()} work in about ${days} days.`
       :`You’ve logged ${recent.length} workouts in the last two weeks without any ${group.label.toLowerCase()} work yet.`
   });
 });
 return candidates.sort((a,b)=>b.days-a.days)[0]||null;
}
function coachBuildFromInsight(targetKey){
 const group=COACH_TARGET_GROUPS[targetKey];if(!group)return;
 const request=coachParsePrompt(`${group.label} workout, 45 minutes`,coachPromptGoal);
 request.duration=45;request.targetLabels=[group.label];request.targetRegions=[...group.regions];
 coachProgramBuildDraft=null;
 if(!coachGenerateWorkout(request)){showToast('Coach could not build that workout');return}
 renderCoachPreview();
}
function coachInsightHtml(){
 const insight=coachHistoryInsight();if(!insight)return '';
 return `<div class="home-signal-card" style="margin-top:8px"><div class="grow"><div class="eyebrow">COACH INSIGHT</div><div class="signal-copy"><b>${esc(insight.group.label)} hasn’t shown up lately.</b> ${esc(insight.text)} <span class="mini">That’s a log observation, not a recovery warning.</span></div></div><button class="btn small secondary" onclick="coachBuildFromInsight('${escAttr(insight.group.key)}')">Build ${esc(insight.group.label)}</button></div>`;
}
function renderHome(){
 const primary=document.getElementById('homePrimary'),coach=document.getElementById('homeCoachLauncher'),quick=document.getElementById('homeQuickActions'),signal=document.getElementById('homeTelemetry'),latest=document.getElementById('homeLatest');
 if(!primary)return;
 const name=state.profile.name?.trim(),active=state.activeWorkout,p=activeProgram(),next=p?programNextRoutine(p):null,suggested=homeSuggestedRoutine();

 if(active){
   const ac=activeWorkoutCounts(active),saved=active.lastSavedAt?new Date(active.lastSavedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):'just now';
   primary.innerHTML=`<div class="eyebrow"><span class="active-pulse"></span>WORKOUT IN PROGRESS</div><h1>Resume ${esc(active.routineName||'Workout')}</h1><div class="muted">${ac.done} of ${ac.total} sets complete · autosaved ${esc(saved)}</div><div class="home-primary-progress progress-bar"><div style="width:${ac.pct}%"></div></div><div class="actions"><button class="btn green" onclick="resumeActiveWorkout()">Resume Workout</button></div>`;
   coach.innerHTML='';quick.innerHTML='';
 }else if(p&&next){
   const logs=programSessions(p),last=logs[0];
   primary.innerHTML=`<div class="eyebrow">UP NEXT · ${esc(p.name)}</div><h1>${esc(next.name)}</h1><div class="muted">${next.exercises.length} exercise${next.exercises.length===1?'':'s'} · ${esc(trainingModeLabel(normalizeProgramTrainingMode(p.trainingMode)==='inherit'?next.trainingMode:p.trainingMode))}${last?` · last program session ${new Date(last.date).toLocaleDateString()}`:''}</div><div class="actions"><button class="btn green" onclick="startProgramWorkout('${p.id}')">Start Next Workout</button><button class="btn secondary" onclick="go('routines')">View Program</button></div>`;
   coach.innerHTML=`<div class="home-coach-launcher">${homeCoachLauncherHtml()}</div>`;quick.innerHTML=homeQuickActionsHtml();
 }else if(suggested){
   const last=state.sessions.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).find(s=>s.routineId===suggested.id);
   primary.innerHTML=`<div class="eyebrow">READY TO TRAIN${name?` · ${esc(name)}`:''}</div><h1>${esc(suggested.name)}</h1><div class="muted">${suggested.exercises.length} exercise${suggested.exercises.length===1?'':'s'} · ${esc(trainingModeLabel(suggested.trainingMode))}${last?` · last trained ${new Date(last.date).toLocaleDateString()}`:''}</div><div class="actions"><button class="btn green" onclick="openRoutine('${suggested.id}')">Start Workout</button><button class="btn secondary" onclick="go('routines')">Choose Another</button></div>`;
   coach.innerHTML=`<div class="home-coach-launcher">${homeCoachLauncherHtml()}</div>`;quick.innerHTML=homeQuickActionsHtml();
 }else{
   primary.innerHTML=`<div class="eyebrow">COACH SWOLECAT · QUICK BUILD</div><h1>What are we training today?</h1><div class="muted">Tell Swolecat the muscles, time, equipment, or goal. Or build the workout manually if you already know exactly what you want.</div>${homeCoachLauncherHtml({embedded:true})}`;
   coach.innerHTML='';quick.innerHTML=`<button class="home-route-btn" onclick="newRoutine()"><b>Build manually</b><span>Choose every exercise yourself</span></button><button class="home-route-btn" onclick="go('routines')"><b>Saved workouts</b><span>Nothing saved yet — manage them here later</span></button>`;
 }

 if(!state.sessions.length){
   signal.innerHTML='';latest.innerHTML='';
 }else{
   const weekStart=startOfWeek(),weekSessions=state.sessions.filter(s=>new Date(s.date)>=weekStart);
   const weekSets=weekSessions.reduce((n,s)=>n+sessionSetCount(s),0),weekPrs=weekSessions.reduce((n,s)=>n+sessionPRCount(s),0);
   signal.innerHTML=`<div class="home-signal-card" onclick="go('analytics')"><div><div class="eyebrow">THIS WEEK</div><div class="signal-copy"><b>${weekSessions.length} workout${weekSessions.length===1?'':'s'}</b> · ${weekSets} working sets · ${weekPrs} PR${weekPrs===1?'':'s'}</div></div><span class="tag">PROGRESS ›</span></div>`+coachInsightHtml();
   const last=state.sessions.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0],sets=sessionSetCount(last),prs=sessionPRCount(last);
   latest.innerHTML=`<div class="home-latest" onclick="openHistoricalWorkoutRecap('${last.id}')"><div class="row"><div><div class="eyebrow">LAST WORKOUT</div><div class="home-latest-title">${esc(last.routineName)}</div><div class="home-latest-meta">${new Date(last.date).toLocaleDateString()} · ${sets} working sets${last.durationMinutes!=null?` · ${last.durationMinutes} min`:''}${prs?` · ${prs} PR${prs===1?'':'s'}`:''}</div></div><span class="tag">RECAP ›</span></div></div>`;
 }
 updateActiveWorkoutChrome();
}
