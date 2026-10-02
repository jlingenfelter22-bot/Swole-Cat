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
 'posterior chain':{label:'Posterior Chain',regions:['hamstrings','glutes','lower_back']},
 'push':{label:'Push',regions:['chest','front_delts','side_delts','triceps']},
 'pull':{label:'Pull',regions:['lats','upper_back','rear_delts','biceps']},
 'legs':{label:'Legs',regions:['quads','hamstrings','glutes','adductors','calves']},
 'arms':{label:'Arms',regions:[...COACH_ARM_KNOWLEDGE.regions]},
 'shoulders':{label:'Shoulders',regions:[...COACH_SHOULDER_KNOWLEDGE.regions]},
 'front delts':{label:'Front Delts',regions:['front_delts']},
 'side delts':{label:'Side Delts',regions:['side_delts']},
 'rear delts':{label:'Rear Delts',regions:['rear_delts']},
 'chest':{label:'Chest',regions:['chest']},
 'back':{label:COACH_BACK_KNOWLEDGE.full.label,regions:[...COACH_BACK_KNOWLEDGE.full.regions]},
 'upper back':{label:COACH_BACK_KNOWLEDGE.upper.label,regions:[...COACH_BACK_KNOWLEDGE.upper.regions]},
 'lower back':{label:COACH_BACK_KNOWLEDGE.lower.label,regions:[...COACH_BACK_KNOWLEDGE.lower.regions]},
 'lats':{label:COACH_BACK_KNOWLEDGE.lats.label,regions:[...COACH_BACK_KNOWLEDGE.lats.regions]},
 'traps':{label:COACH_BACK_KNOWLEDGE.traps.label,regions:[...COACH_BACK_KNOWLEDGE.traps.regions]},
 'forearms':{label:'Forearms',regions:['forearms']},
 'biceps':{label:'Biceps',regions:['biceps']},
 'triceps':{label:'Triceps',regions:['triceps']},
 'quads':{label:'Quads',regions:['quads']},
 'hamstrings':{label:'Hamstrings',regions:['hamstrings']},
 'glutes':{label:'Glutes',regions:['glutes']},
 'adductors':{label:'Adductors',regions:['adductors']},
 'calves':{label:'Calves',regions:['calves']},
 'abs':{label:'Abs',regions:['core']},
 'obliques':{label:'Obliques',regions:['obliques']},
 'core':{label:'Core',regions:['core','obliques']}
};
const COACH_EQUIPMENT_TERMS=[
 ['smith machine','smith machine'],['smith','smith machine'],['trap bar','trap bar'],['cable machine','cable'],
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
 let work=coachNormalizeGymText(text),allowed=[],excluded=[];
 const freeWeights=['dumbbell','barbell','kettlebell','trap bar','plate','landmine'];
 if(/\b(?:no|without|skip|exclude)\s+(?:any\s+)?free weights?\b/i.test(work)){
   excluded.push(...freeWeights);work=work.replace(/\b(?:no|without|skip|exclude)\s+(?:any\s+)?free weights?\b/ig,' ');
 }else if(/\b(?:only|just|use|using|with)\s+free weights?\b|\bfree weights? only\b/i.test(work)){
   allowed.push(...freeWeights);work=work.replace(/\b(?:only|just|use|using|with)?\s*free weights?(?:\s+only)?\b/ig,' ');
 }
 COACH_EQUIPMENT_TERMS.forEach(([term,equipment])=>{
   const escaped=term.replace(' ','\\s+');
   const neg=new RegExp('(?:no|without|except|skip|exclude)\\s+(?:any\\s+)?'+escaped,'i');
   if(neg.test(work)){excluded.push(equipment);work=work.replace(neg,' ');return}
   const re=new RegExp('\\b'+escaped+'\\b','i');
   if(re.test(work)){allowed.push(equipment);work=work.replace(re,' ')}
 });
 return {allowed:[...new Set(allowed)],excluded:[...new Set(excluded)]};
}

function coachTargetPriorityRegex(key){
 const map={
  'full body':'full body','upper body':'upper body','lower body':'lower body','posterior chain':'posterior chain',
  push:'push',pull:'pull',legs:'legs?',arms:'arms?',shoulders:'(?:shoulders?|delts?)',
  'front delts':'front delts?','side delts':'side delts?','rear delts':'rear delts?',
  chest:'chest',back:'back','upper back':'(?:upper|mid(?:dle)?) back',
  'lower back':'(?:lower back|lumbar(?: spine| extensors?)?|spinal erectors?|erector spinae|erectors?)',
  lats:'(?:lats|latissimus(?: dorsi)?)',traps:'(?:traps?|trapezius)',forearms:'forearms?',
  biceps:'(?:biceps?|bis)',triceps:'(?:triceps?|tris)',quads:'quads?',hamstrings:'(?:hamstrings?|hams)',
  glutes:'glutes?',adductors:'adductors?',calves:'(?:calves?|calf)',abs:'abs?',obliques:'obliques?',core:'core'
 };
 return map[key]||coachRegexEscape(key);
}
function coachParsePriorityTargets(text,availableKeys=[]){
 const lower=coachNormalizeGymText(text),keys=[],regions=[];
 const pool=availableKeys.length?[...new Set(availableKeys)]:Object.keys(COACH_TARGET_GROUPS);
 pool.forEach(key=>{
   const term=coachTargetPriorityRegex(key);
   const cues=[
     new RegExp('\\b(?:more|extra|mostly|mainly|especially)\\s+(?:focus\\s+on\\s+)?(?:the\\s+)?'+term+'\\b','i'),
     new RegExp('\\bfocus(?:ed)?\\s+(?:more\\s+)?(?:on\\s+)?(?:the\\s+)?'+term+'\\b','i'),
     new RegExp('\\b(?:emphas(?:ize|ise)|prioriti[sz]e|favor|favour)\\s+(?:the\\s+)?'+term+'\\b','i'),
     new RegExp('\\b(?:bias(?:ed)?\\s+(?:toward|towards|to)\\s+)(?:the\\s+)?'+term+'\\b','i'),
     new RegExp('\\b'+term+'[- ]?(?:focused|focus|emphasis|priority|biased|dominant|heavy)\\b','i'),
     new RegExp('\\b(?:main focus|emphasis|priority)\\s+(?:is|on)?\\s*(?:the\\s+)?'+term+'\\b','i')
   ];
   if(!cues.some(re=>re.test(lower)))return;
   keys.push(key);regions.push(...(COACH_TARGET_GROUPS[key]?.regions||[]));
 });
 return {keys:[...new Set(keys)],regions:[...new Set(regions)]};
}
function coachParseTargetExclusions(text){
 const lower=coachNormalizeGymText(text)
   .replace(/\bchest supported\b/g,'supported')
   .replace(/\bback squats?\b/g,'squats');
 const keys=[],regions=[];
 Object.keys(COACH_TARGET_GROUPS).forEach(key=>{
   const term=coachTargetPriorityRegex(key);
   const patterns=[
     new RegExp('\\b(?:no|without|skip|exclude|except|avoid)\\s+(?:the\\s+)?'+term+'\\b','i'),
     new RegExp('\\bdont\\s+(?:train|hit|work)\\s+(?:the\\s+)?'+term+'\\b','i'),
     new RegExp('\\bdo not\\s+(?:train|hit|work)\\s+(?:the\\s+)?'+term+'\\b','i')
   ];
   if(!patterns.some(re=>re.test(lower)))return;
   keys.push(key);regions.push(...(COACH_TARGET_GROUPS[key]?.regions||[]));
 });
 return {keys:[...new Set(keys)],regions:[...new Set(regions)]};
}
function coachParseTargets(text){
 const lower=coachNormalizeGymText(text);
 const exclusions=coachParseTargetExclusions(lower);
 let work=lower
   .replace(/\b(?:single|one|straight)\s+arm\b/g,' ')
   .replace(/\bchest\s+supported\b/g,' ')
   .replace(/\bback\s+squats?\b/g,' ');

 // Remove negated target phrases before positive matching.
 Object.keys(COACH_TARGET_GROUPS).forEach(key=>{
   const term=coachTargetPriorityRegex(key);
   [
     new RegExp('\\b(?:no|without|skip|exclude|except|avoid)\\s+(?:the\\s+)?'+term+'\\b','ig'),
     new RegExp('\\bdont\\s+(?:train|hit|work)\\s+(?:the\\s+)?'+term+'\\b','ig'),
     new RegExp('\\bdo not\\s+(?:train|hit|work)\\s+(?:the\\s+)?'+term+'\\b','ig')
   ].forEach(re=>{work=work.replace(re,' ')});
 });

 const labels=[],regions=[],keys=[];
 const add=key=>{
   const g=COACH_TARGET_GROUPS[key];if(!g||keys.includes(key)||exclusions.keys.includes(key))return;
   keys.push(key);labels.push(g.label);regions.push(...g.regions);
 };

 // Preserve precise deltoid/core requests instead of broadening them to all shoulders/core.
 if(/\bfront delts?\b/.test(work)){add('front delts');work=work.replace(/\bfront delts?\b/g,' ')}
 if(/\bside delts?\b/.test(work)){add('side delts');work=work.replace(/\bside delts?\b/g,' ')}
 if(/\brear delts?\b/.test(work)){add('rear delts');work=work.replace(/\brear delts?\b/g,' ')}
 if(/\bobliques?\b/.test(work)){add('obliques');work=work.replace(/\bobliques?\b/g,' ')}
 if(/\babs?\b/.test(work)){add('abs');work=work.replace(/\babs?\b/g,' ')}

 const terms=[
   ['full body',/\bfull body\b/],['upper body',/\bupper body\b/],['lower body',/\blower body\b/],
   ['posterior chain',/\bposterior chain\b/],
   ['push',/\bpush(?: day| workout| session)?\b/],['pull',/\bpull(?: day| workout| session)?\b/],
   ['legs',/\blegs?\b/],['arms',/\barms?\b/],['shoulders',/\bshoulders?\b|\bdelts?\b/],
   ['upper back',/\bupper back\b|\bmid(?:dle)? back\b/],
   ['lower back',/\blower back\b|\blumbar(?: spine| extensors?)?\b|\bspinal erectors?\b|\berector spinae\b|\berectors?\b/],
   ['lats',/\blats\b/],['traps',/\btraps?\b/],['forearms',/\bforearms?\b/],
   ['chest',/\bchest\b/],['biceps',/\bbiceps?\b|\bbis\b/],['triceps',/\btriceps?\b|\btris\b/],
   ['quads',/\bquads?\b/],['hamstrings',/\bhamstrings?\b|\bhams\b/],['glutes',/\bglutes?\b/],
   ['adductors',/\badductors?\b/],['calves',/\bcalves?\b|\bcalf\b/],['core',/\bcore\b/]
 ];
 terms.forEach(([key,re])=>{if(re.test(work))add(key)});
 const genericBackWork=work
   .replace(/\b(?:upper|lower|mid(?:dle)?) back\b/g,' ')
   .replace(/\blumbar(?: spine| extensors?)?\b|\bspinal erectors?\b|\berector spinae\b|\berectors?\b/g,' ');
 if(/\bback\b/.test(genericBackWork))add('back');

 const excludedRegions=new Set(exclusions.regions);
 return {
   keys,labels:[...new Set(labels)],
   regions:[...new Set(regions)].filter(region=>!excludedRegions.has(region)),
   excludedKeys:exclusions.keys,
   excludedRegions:exclusions.regions
 };
}
function coachParseLiftingGrammar(text){
 const raw=coachNumbersToDigits(String(text||'')),lower=coachNormalizeGymText(raw),out={};
 if(/\b(?:no|skip|without)\s+(?:the\s+)?warm[- ]?ups?\b/i.test(lower))out.warmupMode='none';
 else if(/\b(?:warm me up first|warm up first|start with (?:a )?warm[- ]?up|include warm[- ]?ups?|add warm[- ]?up sets?|ramp me up|ramp up first)\b/i.test(lower))out.warmupMode='first_compound';
 let m=lower.match(/\b(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min)\s+(?:of\s+)?rest\b/i)
   ||lower.match(/\brest\s+(?:for\s+)?(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min)\b/i);
 if(m)out.restSeconds=Math.max(15,Math.min(600,Math.round(Number(m[1])*60)));
 else{
   m=lower.match(/\b(\d{2,3})\s*(?:seconds?|secs?|sec|s)\s+(?:of\s+)?rest\b/i)
     ||lower.match(/\brest\s+(?:for\s+)?(\d{2,3})\s*(?:seconds?|secs?|sec|s)\b/i)
     ||lower.match(/\b(\d{2,3})\s*(?:seconds?|secs?|sec|s)\s+between\s+sets\b/i);
   if(m)out.restSeconds=Math.max(15,Math.min(600,Number(m[1])||0));
 }
 m=lower.match(/\b([0-5])\s*(?:rir|reps?\s+in\s+reserve)\b/i)
   ||lower.match(/\bleave\s+([0-5])\s+(?:reps?\s+)?(?:in\s+the\s+tank|in\s+reserve)\b/i)
   ||lower.match(/\b([0-5])\s+reps?\s+(?:shy|short)\s+of\s+failure\b/i);
 if(m)out.targetRIR=Number(m[1]);
 const rpe=lower.match(/\brpe\s*([5-9]|10)(?:\.([05]))?\b/i);
 if(rpe){
   const value=Number(rpe[1]+(rpe[2]?'.'+rpe[2]:''));
   out.targetRPE=value;out.targetRIR=Math.max(0,Math.min(5,10-value));
 }
 if(/\b(?:last set amrap|amrap (?:on )?(?:the )?last set|last set (?:is|to be) amrap)\b/i.test(lower))out.lastSetAmrap=true;
 if(/\b(?:no amrap|skip amrap)\b/i.test(lower))out.lastSetAmrap=false;

 const mentionsTopBackoff=/\btop set\b|\bback[- ]?off sets?\b/.test(lower);
 if(mentionsTopBackoff){
   const topBackoff={enabled:true};
   let tb=lower.match(/\b(\d+)\s+top sets?\b/i);
   if(tb)topBackoff.topSets=Math.max(1,Math.min(2,Number(tb[1])||1));
   tb=lower.match(/\b(\d+)\s+back[- ]?off sets?\b/i);
   if(tb)topBackoff.backoffSets=Math.max(1,Math.min(5,Number(tb[1])||1));
   tb=lower.match(/\btop set(?:s)?(?:\s+(?:for|of|at))?\s+(\d+)(?:\s*[-–]\s*(\d+))?\s*(?:reps?)?\b/i);
   if(tb){
     topBackoff.topMinReps=Math.max(1,Number(tb[1])||1);
     topBackoff.topMaxReps=Math.max(topBackoff.topMinReps,Number(tb[2])||topBackoff.topMinReps);
   }
   tb=lower.match(/\bback[- ]?off sets?(?:\s+(?:for|of|at))?\s+(\d+)(?:\s*[-–]\s*(\d+))?\s*(?:reps?)?\b/i);
   if(tb){
     topBackoff.backoffMinReps=Math.max(1,Number(tb[1])||1);
     topBackoff.backoffMaxReps=Math.max(topBackoff.backoffMinReps,Number(tb[2])||topBackoff.backoffMinReps);
   }
   tb=lower.match(/\bback[- ]?off(?: sets?)?\s+(?:at\s+)?(\d{2})(?:\.([05]))?\s*%/i);
   if(tb)topBackoff.backoffPercent=Math.max(70,Math.min(97.5,Number(tb[1]+(tb[2]?'.'+tb[2]:''))));
   out.topBackoff=topBackoff;
 }
 if(/\b(?:no|skip|without)\s+top set(?:s)?\b|\b(?:no|skip|without)\s+back[- ]?off sets?\b/i.test(lower))out.topBackoff={enabled:false};
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
function coachParseTrainingExperience(text){
 const lower=coachNormalizeGymText(text);
 if(/\b(?:beginner|newbie|rookie|new to lifting|new lifter|just starting|just started lifting|first time lifting|never lifted|novice)\b/.test(lower))return 'beginner';
 if(/\b(?:advanced|experienced lifter|seasoned lifter|competitive lifter|been lifting for years|training for years)\b/.test(lower))return 'advanced';
 if(/\b(?:intermediate|not a beginner|some lifting experience)\b/.test(lower))return 'intermediate';
 return 'auto';
}
function coachParseLateralityPreference(text){
 const lower=coachNormalizeGymText(text);
 if(/\b(?:together and separately|separately and together|individually and together|together and individually|both ways|mix unilateral and bilateral|mix bilateral and unilateral)\b/.test(lower))return 'mixed';
 const unilateral=/\b(?:unilateral|single[- ]arm|single[- ]leg|one arm at a time|one leg at a time|one side at a time|each arm individually|each leg individually|left and right separately|alternate arms|alternating arms|single sided)\b/.test(lower);
 const bilateral=/\b(?:bilateral|both arms together|both legs together|both sides together|both at once)\b/.test(lower);
 if(unilateral&&bilateral)return 'mixed';
 if(unilateral)return 'unilateral';
 if(bilateral)return 'bilateral';
 return 'auto';
}
function coachParsePrompt(text,defaultGoal=coachPromptGoal){
 const raw=String(text||'').trim(),numbered=coachNumbersToDigits(raw),lower=coachNormalizeGymText(numbered);
 const targets=coachParseTargets(lower),equipment=coachParseEquipment(lower),liftingGrammar=coachParseLiftingGrammar(numbered);
 const priority=coachParsePriorityTargets(lower,targets.keys||[]);
 const experienceLevel=coachParseTrainingExperience(lower),lateralityPreference=coachParseLateralityPreference(lower);
 let duration=0;
 const min=lower.match(/(\d{1,3})\s*(?:ish\s*)?(?:m|min|mins|minute|minutes)\b/);
 const hrs=lower.match(/(\d(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
 if(/\b(?:an?|one|1) hour and a half\b/.test(lower))duration=90;
 else if(/\bhalf (?:an )?hour\b|\bhalf hour\b/.test(lower))duration=30;
 else if(/\b(?:an?|one) hour\b/.test(lower))duration=60;
 else if(min)duration=Math.max(15,Math.min(120,Number(min[1])||0));
 else if(hrs)duration=Math.max(15,Math.min(120,Math.round((Number(hrs[1])||0)*60)));
 else if(/\bquick\b|\bshort\b|\bin a rush\b|\bnot much time\b/.test(lower))duration=30;
 let goal=defaultGoal;
 const targetHeavy=/\b(?:push|pull|legs?|chest|back|shoulders?|arms?|upper body|lower body|full body)\s+heavy\b/.test(lower);
 if(/\bstrength\b|\bstronger\b|\bget strong\b|\bpowerlifting\b|\bbuild strength\b|\bgo heavy\b|\bheavy (?:weights?|lifting|sets?)\b/.test(lower)
   ||(!targetHeavy&&/\bheavy (?:push|pull|legs?|chest|back|shoulders?|arms?|upper body|lower body|full body)\b/.test(lower)))goal='strength';
 else if(/\bhypertrophy\b|\bmuscle growth\b|\bbuild muscle\b|\bgain muscle\b|\bget bigger\b|\badd size\b|\bbodybuild/.test(lower)||/\bsize\b/.test(lower))goal='hypertrophy';
 else if(/\bgeneral fitness\b|\bgeneral workout\b|\bgeneral training\b|\bjust exercise\b|\bstay active\b/.test(lower))goal='general';
 return {
   prompt:raw,goal,duration,targetKeys:[...(targets.keys||[])],targetLabels:targets.labels,targetRegions:targets.regions,
   excludedTargetKeys:[...(targets.excludedKeys||[])],excludedTargetRegions:[...(targets.excludedRegions||[])],
   allowedEquipment:equipment.allowed,excludedEquipment:equipment.excluded,
   priorityRegions:[...priority.regions],priorityKeys:[...priority.keys],experienceLevel,lateralityPreference,
   excludedExerciseIds:[],requiredExerciseIds:[],liftingGrammar
 };
}

function coachParseProgramFocus(text){
 const lower=coachNormalizeGymText(text),labels=[],regions=[];
 const add=key=>{
   const g=COACH_TARGET_GROUPS[key];if(!g)return;
   labels.push(g.label);regions.push(...g.regions);
 };
 const terms=[
   ['posterior chain',/\bposterior chain\b/],
   ['upper back',/\bupper back\b|\bmid(?:dle)? back\b/],
   ['lower back',/\blower back\b|\blumbar(?: spine| extensors?)?\b|\bspinal erectors?\b|\berector spinae\b|\berectors?\b/],
   ['lats',/\blats\b/],['traps',/\btraps?\b/],['forearms',/\bforearms?\b/],
   ['front delts',/\bfront delts?\b/],['side delts',/\bside delts?\b/],['rear delts',/\brear delts?\b/],
   ['chest',/\bchest\b/],['shoulders',/\bshoulders?\b/],['arms',/\barms?\b/],
   ['biceps',/\bbiceps?\b|\bbis\b/],['triceps',/\btriceps?\b|\btris\b/],['quads',/\bquads?\b/],['hamstrings',/\bhamstrings?\b|\bhams\b/],
   ['glutes',/\bglutes?\b/],['adductors',/\badductors?\b/],['calves',/\bcalves?\b|\bcalf\b/],['abs',/\babs?\b/],['obliques',/\bobliques?\b/],['core',/\bcore\b/]
 ];
 terms.forEach(([key,re])=>{if(re.test(lower))add(key)});
 const genericDeltWork=lower.replace(/\b(?:front|side|rear) delts?\b/g,' ');
 if(/\bdelts?\b/.test(genericDeltWork))add('shoulders');
 const genericBackWork=lower
   .replace(/\b(?:upper|lower|mid(?:dle)?) back\b/g,' ')
   .replace(/\blumbar(?: spine| extensors?)?\b|\bspinal erectors?\b|\berector spinae\b|\berectors?\b/g,' ');
 if(/\bback\b/.test(genericBackWork))add('back');
 return {labels:[...new Set(labels)],regions:[...new Set(regions)]};
}
function coachParseProgramIntent(text){
 let lower=coachNormalizeGymText(coachNumbersToDigits(String(text||'')));
 lower=lower
   .replace(/\btwice\s+(?:a|per)\s+week\b/g,'2 times a week')
   .replace(/\bthree times\s+(?:a|per)\s+week\b/g,'3 times a week');
 // Common schedule shorthand after punctuation normalization cannot preserve M/W/F, so detect it from the raw text.
 const raw=String(text||'').toLowerCase();
 if(/\bm\s*[\/-]\s*w\s*[\/-]\s*f\b/.test(raw))lower+=' monday wednesday friday';
 if(/\bt(?:ue)?\s*[\/-]\s*th(?:u|ur|urs)?\b/.test(raw))lower+=' tuesday thursday';
 let frequency=0;
 const dayMatch=lower.match(/\b([2-6])\s*[- ]?days?(?:\s+(?:a|per)\s+week)?\b/);
 const weekMatch=lower.match(/\b([2-6])\s*(?:x|times)\s*(?:\/\s*)?(?:(?:a|per)\s+)?week\b/);
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