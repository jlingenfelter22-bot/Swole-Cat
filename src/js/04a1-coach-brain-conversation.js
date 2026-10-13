// v0.89 Coach Brain conversation adapter. Local-only, not a stored personal equipment profile.
// Interactive quick-build deliberately asks again for unknown equipment on each NEW request.
// All decisions are confined to the current draft; no mutations to exercise history/cloud.
const COACH_BRAIN_EQUIPMENT_CHOICES=Object.freeze([
 Object.freeze({key:'gym',label:'Gym (common equipment)',preset:'standard_gym',allowed:['barbell','dumbbell','cable','machine','bodyweight']}),
 Object.freeze({key:'dumbbells',label:'Dumbbells + bodyweight',preset:'home_dumbbells',allowed:['dumbbell','bodyweight']}),
 Object.freeze({key:'bodyweight',label:'Bodyweight only',preset:'floor_only',allowed:['bodyweight']}),
 Object.freeze({key:'custom',label:'Other equipment',preset:null,allowed:null}),
 Object.freeze({key:'skip',label:'Skip / basic options',preset:'floor_only',allowed:['bodyweight']})
]);
const COACH_BRAIN_EQUIPMENT_CAPABILITIES=Object.freeze({
 barbell:['barbell','plates'],dumbbell:['dumbbells'],cable:['cable_station','stable_cable_anchor'],
 machine:[],bodyweight:['bodyweight','exercise_space'],'smith machine':['smith_station'],
 kettlebell:['kettlebell'],'trap bar':['trap_bar'],sled:['sled','clear_lane','suitable_surface'],
 landmine:['barbell','plates','landmine_anchor','anchored_landmine'],plate:['plate']
});
function coachBrainExerciseService(){return SwoleCatRuntime.getService('brainKnowledge')}
function coachBrainExplicitEquipment(request){
 const raw=String(request?.prompt||'');
 if(/\b(?:full|commercial|standard|well[- ]equipped)\s+gym\b/i.test(raw))
   return {choice:'gym',context:{equipment:{preset:'standard_gym',complete:false}},allowed:['barbell','dumbbell','cable','machine','bodyweight'],label:'Gym (common equipment)',assumption:true};
 const allowed=Array.isArray(request?.allowedEquipment)?request.allowedEquipment:[];
 if(!allowed.length)return null;
 const cap=new Set();allowed.forEach(key=>(COACH_BRAIN_EQUIPMENT_CAPABILITIES[key]||[]).forEach(x=>cap.add(x)));
 if(/\b(?:pull.?up bar|chin.?up bar|hanging bar)\b/i.test(raw))cap.add('secure_overhead_bar');
 if(/\b(?:bench|adjustable bench)\b/i.test(raw))cap.add('bench');
 if(/\b(?:bands?|resistance bands?)\b/i.test(raw))cap.add('resistance_band');
 if(/\b(?:ab wheel|ab roller)\b/i.test(raw))cap.add('ab_wheel');
 if(/\b(?:sliders?|sliding discs?)\b/i.test(raw))cap.add('sliders_and_floor');
 if(/\b(?:dip bars|parallel bars)\b/i.test(raw))cap.add('dip_bars');
 if(/\b(?:rack|squat rack)\b/i.test(raw))cap.add('rack_safeties');
 if(/\b(?:floor|at home|home gym)\b/i.test(raw))cap.add('exercise_space');
 return {choice:'explicit',context:{equipment:{available:[...cap],complete:true}},allowed:[...allowed],label:'Equipment from request',assumption:false};
}
function coachBrainNextQuickBuildQuestion(request){
 if(!request||request.brainEquipment)return null;
 if(!request.targetRegions?.length)return null; // Existing target question takes priority.
 if(!(request.duration>0))return null;  // Existing time question takes priority.
 if(coachBrainExplicitEquipment(request))return null;
 return {id:'equipment',title:'What equipment do you have access to today?',note:'Coach will use this for your workout, not assume what was available last time.',choices:COACH_BRAIN_EQUIPMENT_CHOICES};
}
function coachBrainApplyEquipmentChoice(request,key,customText=''){
 const choice=COACH_BRAIN_EQUIPMENT_CHOICES.find(x=>x.key===key);
 if(!request||!choice)return {ok:false,message:'Choose an equipment option.'};
 let config;
 if(key==='custom'){
   const raw=String(customText||'').trim();
   const parse=coachParseEquipment(raw);
   if(!parse.allowed.length)return {ok:false,message:'List some equipment Coach recognizes, like dumbbells, cables, barbell, or kettlebells.'};
   config=coachBrainExplicitEquipment({...request,prompt:raw,allowedEquipment:parse.allowed});
   if(!config)return {ok:false,message:'Coach could not recognize that equipment.'};
   config={...config,choice:'custom',label:raw.slice(0,160)};
 }else{
   config={choice:key,context:{equipment:{preset:choice.preset,complete:key!=='gym'}},allowed:[...choice.allowed],label:choice.label,assumption:key==='gym'||key==='skip'};
 }
 const updated={...request,allowedEquipment:[...config.allowed],
   excludedEquipment:(request.excludedEquipment||[]).filter(x=>!config.allowed.includes(x)),
   brainEquipment:config};
 return {ok:true,request:updated};
}
function coachBrainResolveEquipment(request){
 if(request?.brainEquipment)return request.brainEquipment;
 return coachBrainExplicitEquipment(request);
}
function coachBrainEquipmentConstraints(request){
 // Explicit opt-in is required here. Legacy program generation and existing
 // Coach tests must not inherit stricter equipment assumptions implicitly.
 const config=request?.brainEquipment||null;
 if(!config)return null;
 return {equipment:{...config.context.equipment,
    unavailable:[...(config.context.equipment?.unavailable||[])]},excludedExerciseIds:[...(request.excludedExerciseIds||[])]};
}
function coachBrainEquipmentAllowed(ex,request){
 const brain=coachBrainExerciseService(),context=coachBrainEquipmentConstraints(request);
 if(!context||!brain)return true;
 return brain.evaluateAvailability(ex.id,context).status==='available';
}
function coachBrainEquipmentPreviewNotice(request){
 const config=coachBrainResolveEquipment(request);
 if(!config)return '';
 if(config.choice==='skip')return 'Equipment was skipped. This draft uses floor-friendly exercises only, not an assumed fully equipped gym. You can change your equipment in the chat.';
 if(config.choice==='gym')return 'Using common gym equipment only. Specialty machines, sleds and attachments are not assumed. Confirm availability before making substitutions.';
 if(config.choice==='bodyweight')return 'Bodyweight only, without assuming a pull-up station, dip bars, sliders or an ab wheel.';
 return '';
}
function coachBrainAlternativeChoices(id,request,{includeRelated=false}={}){
 const brain=coachBrainExerciseService(),context=coachBrainEquipmentConstraints(request);
 if(!brain||!context)return [];
 return brain.suggestSubstitutes(id,context,{includeRelated,limit:12}).candidates||[];
}
function coachBrainApplyNaturalExerciseChange(request,text){
 const raw=String(text||'').trim(),lower=raw.toLowerCase();
 const result={request:{...request,excludedMovementPatterns:[...(request.excludedMovementPatterns||[])]},changed:false,feedback:''};
 const excludePatterns=[];
 const broadSquats=/(?:\b(?:no|without|avoid|skip|exclude|other than|rather than|instead of|different (?:than|from)|replace)\s+(?:all\s+)?squats?\b|\bsquats?\s+(?:out|off the menu)\b)/i.test(lower)
   && !/\b(?:back|front|goblet|zercher|hack|box|pendulum|belt|smith|pause|high bar|low bar)\s+squat\b/i.test(lower);
 const broadLunges=/(?:\b(?:no|without|avoid|skip|exclude|other than|rather than|instead of|different (?:than|from)|replace)\s+(?:all\s+)?lunges?\b)/i.test(lower)
   && !/\b(?:reverse|walking|stationary|barbell|smith|landmine)\s+lunge\b/i.test(lower);
 if(broadSquats)excludePatterns.push('squat');
 if(broadLunges)excludePatterns.push('lunge');
 if(/\b(?:bring (?:back|in)|allow|okay with|include|add)\s+(?:the\s+)?squats?\b|\bbring\s+(?:the\s+)?squats?\s+back\b/i.test(lower)){
   result.request.excludedMovementPatterns=result.request.excludedMovementPatterns.filter(x=>x!=='squat');
   result.changed=true;result.feedback='Squat-family exercises are allowed again.';
 }
 for(const pattern of excludePatterns){
   result.request.excludedMovementPatterns=[...new Set([...result.request.excludedMovementPatterns,pattern])];
   result.changed=true;
 }
 if(excludePatterns.length)result.feedback='Avoiding '+excludePatterns.map(x=>x==='squat'?'squat-family exercises':'lunge-family exercises').join(' and ')+'.';
 return result;
}

function coachBrainSplitEditClauses(text){
 const raw=String(text||'').trim();
 if(!raw)return [];
 // Only split at a clear *new instruction*, not commas inside equipment names.
 // All clauses must succeed in order or the caller rolls back the entire change.
 const verbs='make|set|change|switch|swap|replace|remove|drop|skip|avoid|no|without|different|other than|more|less|focus|emphasize|include|add|bring|keep|only|just|actually|with|use';
 return raw.split(new RegExp('(?:[,;]\\s*|\\s+(?:and|then|but)\\s+)(?=(?:'+verbs+')\\b)','ig'))
   .map(x=>x.trim()).filter(Boolean);
}
function coachBrainProgramNeedsQuestion(request){
 if(!request?.duration)return 'duration';
 if(!request?.brainEquipment&&!coachBrainExplicitEquipment(request))return 'equipment';
 return null;
}
