const SHARE_FORMAT='swole-cat-share';
const SHARE_FORMAT_VERSION=1;
const SHARE_TOKEN_PREFIX='SWOLECAT1';
const SHARE_MAX_CODE_CHARS=120000;
const SHARE_CLOUD_CODE_ALPHABET='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const SHARE_CLOUD_CODE_BODY_CHARS=16;
let shareExportDraft=null,shareImportDraft=null;
let swoleCatPlanShareProvider=null;

function shareNormalizeCloudCode(raw){
 const text=String(raw||'').toUpperCase();
 const match=text.match(/\bSC[-\s]?[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}[-\s]?[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}[-\s]?[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}[-\s]?[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}\b/);
 if(!match)return '';
 const compact=match[0].replace(/[^A-Z0-9]/g,'');
 const body=compact.slice(2);
 if(compact.slice(0,2)!=='SC'||body.length!==SHARE_CLOUD_CODE_BODY_CHARS||![...body].every(ch=>SHARE_CLOUD_CODE_ALPHABET.includes(ch)))return '';
 return 'SC-'+body.match(/.{1,4}/g).join('-');
}
function shareValidateCloudProvider(provider){
 if(!provider||typeof provider!=='object')throw new Error('Cloud sharing provider is required.');
 for(const name of ['createShare','resolveShare']){
  if(typeof provider[name]!=='function')throw new Error('Cloud sharing provider is missing '+name+'().');
 }
 return provider;
}
const swoleCatPlanSharingService=SwoleCatRuntime.registerService('planSharing',{
 registerProvider(provider){
  swoleCatPlanShareProvider=shareValidateCloudProvider(provider);
  return this;
 },
 canCreate(){
  const identity=SwoleCatRuntime.getService('identity')?.snapshot?.();
  const config=SwoleCatRuntime.getService('cloudConfig')?.read?.();
  return !!(swoleCatPlanShareProvider&&config?.configured&&identity?.signedIn&&identity?.user?.id&&(typeof navigator==='undefined'||navigator.onLine!==false));
 },
 canResolve(){
  const config=SwoleCatRuntime.getService('cloudConfig')?.read?.();
  return !!(swoleCatPlanShareProvider&&config?.configured&&(typeof navigator==='undefined'||navigator.onLine!==false));
 },
 async create(envelope){
  shareValidateEnvelope(envelope);
  if(!this.canCreate())throw new Error('Sign in and connect to the internet to create a short cloud share code.');
  const result=await swoleCatPlanShareProvider.createShare({envelope});
  const code=shareNormalizeCloudCode(result?.code);
  if(!code)throw new Error('Cloud sharing returned an invalid share code.');
  return {...result,code};
 },
 async resolve(raw){
  const code=shareNormalizeCloudCode(raw);
  if(!code)throw new Error('Enter a valid Swole Cat share code.');
  if(!this.canResolve())throw new Error('Connect to the internet to open this short share code.');
  const result=await swoleCatPlanShareProvider.resolveShare({code});
  shareValidateEnvelope(result?.envelope);
  return {...result,code};
 }
});

function shareClampNumber(value,min,max,fallback=min){
 const n=Number(value);
 return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
}
function shareClampInteger(value,min,max,fallback=min){
 return Math.round(shareClampNumber(value,min,max,fallback));
}
function shareUnit(unit){return unit==='kg'?'kg':'lb'}
function shareConvertLoad(value,fromUnit,toUnit){
 const n=Math.max(0,Number(value)||0),from=shareUnit(fromUnit),to=shareUnit(toUnit);
 if(from===to)return Math.round(n*100)/100;
 const factor=from==='lb'&&to==='kg'?0.45359237:2.2046226218;
 return Math.round(n*factor*100)/100;
}
function shareUtf8Bytes(text){
 if(typeof TextEncoder!=='undefined')return new TextEncoder().encode(String(text));
 const bin=unescape(encodeURIComponent(String(text))),bytes=new Uint8Array(bin.length);
 for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
 return bytes;
}
function shareUtf8Text(bytes){
 if(typeof TextDecoder!=='undefined')return new TextDecoder().decode(bytes);
 let bin='';
 for(let i=0;i<bytes.length;i+=8192)bin+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return decodeURIComponent(escape(bin));
}
function shareBase64UrlEncode(text){
 const bytes=shareUtf8Bytes(text);
 let bin='';
 for(let i=0;i<bytes.length;i+=8192)bin+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function shareBase64UrlDecode(body){
 if(!/^[A-Za-z0-9_-]+$/.test(body||''))throw new Error('That share code contains invalid characters.');
 const padded=body.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-body.length%4)%4);
 let bin;
 try{bin=atob(padded)}catch(e){throw new Error('That share code could not be decoded.')}
 const bytes=new Uint8Array(bin.length);
 for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
 try{return shareUtf8Text(bytes)}catch(e){throw new Error('That share code contains invalid text data.')}
}
function shareHash(text){
 let hash=0x811c9dc5;
 const bytes=shareUtf8Bytes(text);
 for(const b of bytes){hash^=b;hash=Math.imul(hash,0x01000193)>>>0}
 return hash.toString(16).padStart(8,'0');
}
function shareEncodeEnvelope(envelope){
 const json=JSON.stringify(envelope),body=shareBase64UrlEncode(json);
 const token=`${SHARE_TOKEN_PREFIX}.${shareHash(json)}.${body}`;
 if(token.length>SHARE_MAX_CODE_CHARS)throw new Error('This plan is too large for a local share code.');
 return token;
}
function shareExtractToken(raw){
 const text=String(raw||'').trim();
 if(!text)throw new Error('Paste a Swole Cat share code first.');
 const match=text.match(/SWOLECAT1\.[0-9a-fA-F]{8}\.[A-Za-z0-9_-]+/);
 if(!match)throw new Error('No Swole Cat share code was found in that text.');
 if(match[0].length>SHARE_MAX_CODE_CHARS)throw new Error('That share code is larger than this version supports.');
 return match[0];
}
function decodeSwoleCatShare(raw){
 const token=shareExtractToken(raw),parts=token.split('.');
 if(parts.length!==3||parts[0]!==SHARE_TOKEN_PREFIX)throw new Error('That is not a supported Swole Cat share code.');
 const json=shareBase64UrlDecode(parts[2]);
 if(shareHash(json)!==parts[1].toLowerCase())throw new Error('That share code looks incomplete or corrupted.');
 let envelope;
 try{envelope=JSON.parse(json)}catch(e){throw new Error('That share code does not contain valid Swole Cat data.')}
 shareValidateEnvelope(envelope);
 return envelope;
}
function shareSafeText(value,max=160){return String(value||'').trim().slice(0,max)}
function shareStringArray(value,maxItems=20,maxLength=80){
 return Array.isArray(value)?value.filter(x=>typeof x==='string').slice(0,maxItems).map(x=>x.slice(0,maxLength)):[];
}
function shareSetStructure(value){
 if(!isPlainObject(value)||value.type!=='top_backoff')return null;
 const topSets=shareClampInteger(value.topSets,1,2,1),backoffSets=shareClampInteger(value.backoffSets,1,5,2);
 const topMinReps=shareClampInteger(value.topMinReps,1,100,3),topMaxReps=Math.max(topMinReps,shareClampInteger(value.topMaxReps,1,100,5));
 const backoffMinReps=shareClampInteger(value.backoffMinReps,1,100,5),backoffMaxReps=Math.max(backoffMinReps,shareClampInteger(value.backoffMaxReps,1,100,8));
 return {type:'top_backoff',topSets,backoffSets,backoffPercent:shareClampNumber(value.backoffPercent,70,97.5,90),topMinReps,topMaxReps,backoffMinReps,backoffMaxReps};
}
function shareCustomDefinition(ex,ref){
 return {
  ref,
  name:shareSafeText(ex?.name,120)||'Shared custom exercise',
  muscle:shareSafeText(ex?.muscle,80)||'Other',
  equipment:shareSafeText(ex?.equipment,80)||'other',
  pattern:shareSafeText(ex?.pattern,80)||'other',
  primaryMuscles:shareStringArray(ex?.primaryMuscles),
  secondaryMuscles:shareStringArray(ex?.secondaryMuscles),
  movementFamily:shareSafeText(ex?.movementFamily,80)
 };
}
function shareExportContext(){return {customRefs:new Map(),customExercises:[]}}
function shareExerciseReference(exerciseId,context){
 const id=String(exerciseId||''),custom=state.customExercises.find(x=>x.id===id);
 if(custom){
  if(!context.customRefs.has(id)){
   const ref=`custom_${context.customRefs.size+1}`;
   context.customRefs.set(id,ref);
   context.customExercises.push(shareCustomDefinition(custom,ref));
  }
  return context.customRefs.get(id);
 }
 if(!exById(id))throw new Error('This plan contains an exercise that no longer exists in the library.');
 return id;
}
function shareRoutineExercise(re,context){
 const minReps=shareClampInteger(re?.minReps,1,100,8),maxReps=Math.max(minReps,shareClampInteger(re?.maxReps,1,100,12));
 const mode=['double','range','total','manual'].includes(re?.mode)?re.mode:'double';
 const progressionStrategy=['double','load_first','top_backoff'].includes(re?.progressionStrategy)?re.progressionStrategy:'double';
 const goal=['general','hypertrophy','strength'].includes(re?.trainingGoal)?re.trainingGoal:'general';
 const targetRIR=Number.isFinite(Number(re?.targetRIR))?shareClampNumber(re.targetRIR,0,10,2):null;
 return {
  exerciseId:shareExerciseReference(re?.exerciseId,context),
  sets:shareClampInteger(re?.sets,1,20,3),
  minReps,maxReps,
  increment:Math.max(0,Number(re?.increment)||0),
  mode,
  progressionStrategy,
  adaptiveProgression:!!re?.adaptiveProgression,
  setStructure:shareSetStructure(re?.setStructure),
  trainingGoal:goal,
  resetPercent:shareClampNumber(re?.resetPercent,0,50,7.5),
  restSeconds:shareClampInteger(re?.restSeconds,15,1800,120),
  targetRIR,
  supersetGroup:typeof re?.supersetGroup==='string'&&re.supersetGroup?re.supersetGroup.slice(0,80):null,
  autoWarmup:!!re?.autoWarmup,
  lastSetAmrap:!!re?.lastSetAmrap
 };
}
function shareRoutineBlueprint(routine,context,shareKey=null){
 if(!routine||!Array.isArray(routine.exercises))throw new Error('That routine is not available to share.');
 if(routine.exercises.length>80)throw new Error('That routine has too many exercises for a local share code.');
 return {
  shareKey:shareKey||undefined,
  name:shareSafeText(routine.name,160)||'Shared Routine',
  description:shareSafeText(routine.description,1200),
  trainingMode:normalizeTrainingMode(routine.trainingMode),
  exercises:routine.exercises.map(re=>shareRoutineExercise(re,context))
 };
}
function createRoutineShareEnvelope(id){
 const routine=state.routines.find(x=>x.id===id);if(!routine)throw new Error('That routine no longer exists.');
 const context=shareExportContext();
 return {
  format:SHARE_FORMAT,version:SHARE_FORMAT_VERSION,kind:'routine',appVersion:APP_VERSION,
  unit:shareUnit(state.profile.unit),exportedAt:new Date().toISOString(),
  routine:shareRoutineBlueprint(routine,context),customExercises:context.customExercises
 };
}
function createProgramShareEnvelope(id){
 const program=programById(id);if(!program)throw new Error('That program no longer exists.');
 if(!program.routineIds.length)throw new Error('Add at least one routine before sharing this program.');
 const context=shareExportContext(),byRoutineId=new Map(),routines=[],routineKeys=[];
 for(const rid of program.routineIds){
  let key=byRoutineId.get(rid);
  if(!key){
   const routine=state.routines.find(x=>x.id===rid);
   if(!routine)throw new Error('This program references a routine that no longer exists.');
   key=`routine_${byRoutineId.size+1}`;byRoutineId.set(rid,key);
   routines.push(shareRoutineBlueprint(routine,context,key));
  }
  routineKeys.push(key);
 }
 return {
  format:SHARE_FORMAT,version:SHARE_FORMAT_VERSION,kind:'program',appVersion:APP_VERSION,
  unit:shareUnit(state.profile.unit),exportedAt:new Date().toISOString(),
  program:{
   name:shareSafeText(program.name,160)||'Shared Program',
   frequency:shareClampInteger(program.frequency,1,7,3),
   preferredDays:Array.isArray(program.preferredDays)?program.preferredDays.filter(d=>Number.isInteger(d)&&d>=0&&d<=6).slice(0,7):[],
   trainingMode:normalizeProgramTrainingMode(program.trainingMode),
   routineKeys
  },
  routines,customExercises:context.customExercises
 };
}
function createRoutineShareCode(id){return shareEncodeEnvelope(createRoutineShareEnvelope(id))}
function createProgramShareCode(id){return shareEncodeEnvelope(createProgramShareEnvelope(id))}

function shareValidateRoutineBlueprint(routine){
 if(!isPlainObject(routine))throw new Error('The shared routine is malformed.');
 if(!Array.isArray(routine.exercises)||routine.exercises.length>80)throw new Error('The shared routine has an invalid exercise list.');
 if(typeof routine.name!=='string')throw new Error('The shared routine is missing a name.');
 for(const re of routine.exercises){
  if(!isPlainObject(re)||typeof re.exerciseId!=='string'||!re.exerciseId)throw new Error('The shared routine contains an invalid exercise.');
 }
 return true;
}
function shareValidateEnvelope(envelope){
 if(!isPlainObject(envelope)||envelope.format!==SHARE_FORMAT)throw new Error('This is not a Swole Cat share package.');
 const version=Number(envelope.version);
 if(!Number.isInteger(version)||version<1)throw new Error('That share package has an invalid version.');
 if(version>SHARE_FORMAT_VERSION)throw new Error('This share was created by a newer Swole Cat version. Update the app before importing it.');
 if(!['routine','program'].includes(envelope.kind))throw new Error('That share package has an unknown plan type.');
 if(!['lb','kg'].includes(envelope.unit))throw new Error('That share package has invalid unit information.');
 if(!Array.isArray(envelope.customExercises)||envelope.customExercises.length>100)throw new Error('That share package has an invalid custom exercise list.');
 const customRefs=new Set();
 for(const ex of envelope.customExercises){
  if(!isPlainObject(ex)||typeof ex.ref!=='string'||!ex.ref||customRefs.has(ex.ref))throw new Error('That share package contains invalid custom exercise data.');
  customRefs.add(ex.ref);
 }
 const validateExerciseRefs=routine=>{
  shareValidateRoutineBlueprint(routine);
  for(const re of routine.exercises){
   if(customRefs.has(re.exerciseId))continue;
   if(!exById(re.exerciseId))throw new Error('This share uses an exercise this Swole Cat version does not recognize. Update both devices to the same beta build and try again.');
  }
 };
 if(envelope.kind==='routine'){
  validateExerciseRefs(envelope.routine);
 }else{
  if(!isPlainObject(envelope.program)||!Array.isArray(envelope.program.routineKeys)||!Array.isArray(envelope.routines)||envelope.routines.length>24)throw new Error('The shared program is malformed.');
  const keys=new Set();
  envelope.routines.forEach(r=>{
   validateExerciseRefs(r);
   if(typeof r.shareKey!=='string'||!r.shareKey||keys.has(r.shareKey))throw new Error('The shared program has invalid routine references.');
   keys.add(r.shareKey);
  });
  if(!envelope.program.routineKeys.length||envelope.program.routineKeys.some(key=>!keys.has(key)))throw new Error('The shared program is missing one or more routines.');
 }
 return true;
}
function shareCustomSignature(ex){
 return JSON.stringify({
  name:shareSafeText(ex?.name,120).toLowerCase(),
  muscle:shareSafeText(ex?.muscle,80).toLowerCase(),
  equipment:shareSafeText(ex?.equipment,80).toLowerCase(),
  pattern:shareSafeText(ex?.pattern,80).toLowerCase(),
  primary:shareStringArray(ex?.primaryMuscles).slice().sort(),
  secondary:shareStringArray(ex?.secondaryMuscles).slice().sort(),
  family:shareSafeText(ex?.movementFamily,80).toLowerCase()
 });
}
function sharePrepareCustomExercises(envelope){
 const additions=[],map=new Map(),pool=[...state.customExercises];
 for(const def of envelope.customExercises){
  const signature=shareCustomSignature(def);
  let existing=pool.find(ex=>shareCustomSignature(ex)===signature);
  if(!existing){
   existing={
    id:uid(),name:shareSafeText(def.name,120)||'Shared custom exercise',
    muscle:shareSafeText(def.muscle,80)||'Other',
    equipment:shareSafeText(def.equipment,80)||'other',
    pattern:shareSafeText(def.pattern,80)||'other',
    primaryMuscles:shareStringArray(def.primaryMuscles),
    secondaryMuscles:shareStringArray(def.secondaryMuscles),
    movementFamily:shareSafeText(def.movementFamily,80),
    custom:true
   };
   additions.push(existing);pool.push(existing);
  }
  map.set(def.ref,existing.id);
 }
 return {additions,map};
}
function shareImportRoutineExercise(re,customMap,sourceUnit,targetUnit,supersetMap){
 const exerciseId=customMap.get(re.exerciseId)||re.exerciseId;
 if(!customMap.has(re.exerciseId)&&!exById(exerciseId))throw new Error('One shared exercise is not available on this device.');
 const minReps=shareClampInteger(re.minReps,1,100,8),maxReps=Math.max(minReps,shareClampInteger(re.maxReps,1,100,12));
 const sourceGroup=typeof re.supersetGroup==='string'&&re.supersetGroup?re.supersetGroup:null;
 let supersetGroup=null;
 if(sourceGroup){
  if(!supersetMap.has(sourceGroup))supersetMap.set(sourceGroup,'ss_'+uid());
  supersetGroup=supersetMap.get(sourceGroup);
 }
 const result={
  exerciseId,
  sets:shareClampInteger(re.sets,1,20,3),
  minReps,maxReps,
  increment:shareConvertLoad(re.increment,sourceUnit,targetUnit),
  mode:['double','range','total','manual'].includes(re.mode)?re.mode:'double',
  progressionStrategy:['double','load_first','top_backoff'].includes(re.progressionStrategy)?re.progressionStrategy:'double',
  adaptiveProgression:!!re.adaptiveProgression,
  setStructure:shareSetStructure(re.setStructure),
  trainingGoal:['general','hypertrophy','strength'].includes(re.trainingGoal)?re.trainingGoal:'general',
  resetPercent:shareClampNumber(re.resetPercent,0,50,7.5),
  restSeconds:shareClampInteger(re.restSeconds,15,1800,120),
  targetRIR:Number.isFinite(Number(re.targetRIR))?shareClampNumber(re.targetRIR,0,10,2):null,
  supersetGroup
 };
 if(re.autoWarmup)result.autoWarmup=true;
 if(re.lastSetAmrap)result.lastSetAmrap=true;
 return result;
}
function shareImportRoutineBlueprint(blueprint,customMap,sourceUnit,targetUnit){
 const supersetMap=new Map();
 return {
  id:uid(),
  name:shareSafeText(blueprint.name,160)||'Shared Routine',
  description:shareSafeText(blueprint.description,1200),
  trainingMode:normalizeTrainingMode(blueprint.trainingMode),
  archivedAt:null,
  exercises:blueprint.exercises.map(re=>shareImportRoutineExercise(re,customMap,sourceUnit,targetUnit,supersetMap))
 };
}
function buildSharedPlanImport(envelope){
 shareValidateEnvelope(envelope);
 const sourceUnit=shareUnit(envelope.unit),targetUnit=shareUnit(state.profile.unit);
 const prepared=sharePrepareCustomExercises(envelope);
 if(envelope.kind==='routine'){
  return {customExercises:prepared.additions,routines:[shareImportRoutineBlueprint(envelope.routine,prepared.map,sourceUnit,targetUnit)],program:null};
 }
 const routines=[],keyMap=new Map();
 for(const blueprint of envelope.routines){
  const routine=shareImportRoutineBlueprint(blueprint,prepared.map,sourceUnit,targetUnit);
  routines.push(routine);keyMap.set(blueprint.shareKey,routine.id);
 }
 const program={
  id:uid(),
  name:shareSafeText(envelope.program.name,160)||'Shared Program',
  routineIds:envelope.program.routineKeys.map(key=>keyMap.get(key)),
  frequency:shareClampInteger(envelope.program.frequency,1,7,3),
  preferredDays:Array.isArray(envelope.program.preferredDays)?envelope.program.preferredDays.filter(d=>Number.isInteger(d)&&d>=0&&d<=6).slice(0,7):[],
  trainingMode:normalizeProgramTrainingMode(envelope.program.trainingMode),
  nextIndex:0
 };
 return {customExercises:prepared.additions,routines,program};
}
function importSharedEnvelope(envelope){
 const plan=buildSharedPlanImport(envelope);
 const previous={customExercises:state.customExercises,routines:state.routines,programs:state.programs};
 state.customExercises=[...state.customExercises,...plan.customExercises];
 state.routines=[...state.routines,...plan.routines];
 if(plan.program)state.programs=[...state.programs,plan.program];
 if(!save()){
  state.customExercises=previous.customExercises;state.routines=previous.routines;state.programs=previous.programs;
  throw new Error('Swole Cat could not save the imported plan on this device.');
 }
 populateMuscles(true);renderRoutines();renderHome();
 return plan;
}

function shareExerciseDisplayName(envelope,exerciseId){
 const custom=(envelope.customExercises||[]).find(x=>x.ref===exerciseId);
 return custom?.name||exById(exerciseId)?.name||'Unknown exercise';
}
function shareRoutinePreviewHtml(envelope,routine){
 const rows=(routine.exercises||[]).map(re=>`<div class="share-preview-row"><div><b>${esc(shareExerciseDisplayName(envelope,re.exerciseId))}</b><div class="mini">${shareClampInteger(re.sets,1,20,3)} sets · ${shareClampInteger(re.minReps,1,100,8)}–${Math.max(shareClampInteger(re.minReps,1,100,8),shareClampInteger(re.maxReps,1,100,12))} reps · ${shareClampInteger(re.restSeconds,15,1800,120)}s rest</div></div><span class="tag">${re.exerciseId.startsWith('custom_')?'CUSTOM':'MOVE'}</span></div>`).join('');
 return `<div class="share-preview-routine"><div class="row"><div><div class="exercise-name">${esc(routine.name)}</div><div class="mini">${esc(trainingModeLabel(routine.trainingMode))} · ${routine.exercises.length} exercise${routine.exercises.length===1?'':'s'}</div></div><span class="tag">ROUTINE</span></div><div class="share-preview-list">${rows||'<div class="empty">No exercises in this routine.</div>'}</div></div>`;
}
function shareImportPreviewHtml(envelope){
 const unitNote=envelope.unit!==shareUnit(state.profile.unit)?`<div class="notice share-unit-note">This plan was created in <b>${envelope.unit}</b>. Weight jumps will be converted to <b>${state.profile.unit}</b> when you import it.</div>`:'';
 if(envelope.kind==='routine'){
  return `<div class="share-preview-head"><div class="eyebrow">SHARED ROUTINE // IMPORT PREVIEW</div><h3>${esc(envelope.routine.name)}</h3><div class="mini">Preview everything before it touches your local routines.</div></div>${unitNote}${shareRoutinePreviewHtml(envelope,envelope.routine)}<div class="notice share-privacy-note"><b>Private data stays private.</b> This package contains the routine blueprint only. Workout history, PRs, bodyweight, profile data, active workout state, and personal analytics are not included.</div>`;
 }
 const byKey=new Map(envelope.routines.map(r=>[r.shareKey,r]));
 const route=envelope.program.routineKeys.map((key,i)=>{
  const routine=byKey.get(key);
  return `<div class="share-program-step"><span class="program-letter">${programSlotLabel(i)}</span><div><b>${esc(routine?.name||'Routine')}</b><div class="mini">${routine?.exercises?.length||0} exercises</div></div></div>`;
 }).join('');
 return `<div class="share-preview-head"><div class="eyebrow">SHARED PROGRAM // IMPORT PREVIEW</div><h3>${esc(envelope.program.name)}</h3><div class="mini">${shareClampInteger(envelope.program.frequency,1,7,3)}×/week · ${esc(programTrainingModeLabel(envelope.program.trainingMode))} · starts fresh at Day 1</div></div>${unitNote}<div class="share-program-route">${route}</div><div class="notice share-privacy-note"><b>Private data stays private.</b> The program and its routine blueprints are included. Sender progress, completed workouts, PRs, bodyweight, profile data, active workout state, and personal analytics are not.</div>`;
}

function shareCloudExpiryLabel(value){
 if(!value)return '7 days';
 const date=new Date(value);
 if(Number.isNaN(date.getTime()))return '7 days';
 return date.toLocaleString();
}
function shareMessageForDraft(draft){
 const label=draft.kind==='program'?'Program':'Routine';
 if(draft.cloudCode){
  return `Swole Cat ${label}: ${draft.name}\n\nShare code: ${draft.cloudCode}\n\nOpen Swole Cat > Routines > Import and enter the code. This share expires automatically after 7 days.`;
 }
 return `Swole Cat ${label}: ${draft.name}\n\nOpen Swole Cat > Routines > Import, then paste this offline code:\n\n${draft.code}`;
}
function shareCloudLoadingHtml(name){
 return `<div class="share-export-card">
  <div class="eyebrow">CLOUD SHARE // SECURE TICKET</div>
  <div class="notice" style="margin-top:10px"><b>Creating a short share code…</b><br>Swole Cat is uploading only the plan blueprint. Workout history, PRs, profile data, bodyweight, analytics, and active workout data stay private.</div>
  <div class="mini" style="margin-top:10px">${esc(name)}</div>
 </div>`;
}
function renderCloudShareExport(){
 const draft=shareExportDraft;if(!draft?.cloudCode)return;
 const label=draft.kind==='program'?'program':'routine';
 openModal(`Share ${esc(draft.name)}`,`
  <div class="share-export-card">
   <div class="eyebrow">CLOUD SHARE // ${draft.kind==='program'?'PROGRAM':'ROUTINE'}</div>
   <div class="notice" style="margin-top:10px">Send this short code to anyone using Swole Cat. They do not need a cloud account to import it. The ${label} blueprint expires automatically after <b>7 days</b>.</div>
   <div class="field share-code-field"><label>Swole Cat share code</label><input id="shareCodeField" readonly spellcheck="false" value="${escAttr(draft.cloudCode)}" onclick="this.select()"><div class="mini">Expires ${esc(shareCloudExpiryLabel(draft.expiresAt))} · plan blueprint only</div></div>
   <div class="actions"><button class="btn" onclick="shareCurrentPlan()">Share</button><button class="btn secondary" onclick="copyCurrentShareCode()">Copy Code</button><button class="btn secondary" onclick="openOfflineShareForDraft()">Offline Code</button><button class="btn secondary" onclick="closeModal()">Done</button></div>
  </div>`);
}
function renderOfflineShareChoice(reason=''){
 const draft=shareExportDraft;if(!draft)return;
 const identity=SwoleCatRuntime.getService('identity')?.snapshot?.();
 const cloudHint=identity?.signedIn
   ?'Cloud sharing is unavailable right now. You can retry when the connection is back, or create a self-contained offline code.'
   :'Sign in to Swole Cat Cloud to create a short 7-day share code. You can still create a self-contained offline code without an account.';
 openModal(`Share ${esc(draft.name)}`,`
  <div class="share-export-card">
   <div class="eyebrow">SHARE // FALLBACK</div>
   <div class="notice" style="margin-top:10px">${esc(reason||cloudHint)}</div>
   <div class="actions">${identity?.signedIn?'<button class="btn" onclick="retryCurrentCloudShare()">Retry Cloud Share</button>':''}<button class="btn secondary" onclick="openOfflineShareForDraft()">Create Offline Code</button><button class="btn secondary" onclick="closeModal()">Cancel</button></div>
  </div>`);
}
function renderOfflineShareExport(){
 const draft=shareExportDraft;if(!draft?.code)return;
 openModal(`Share ${esc(draft.name)}`,`
  <div class="share-export-card">
   <div class="eyebrow">OFFLINE SHARE // ${draft.kind==='program'?'PROGRAM BUNDLE':'ROUTINE'}</div>
   <div class="notice" style="margin-top:10px">This is the legacy self-contained fallback. It works without a server, but it is much longer than a cloud share code.</div>
   <div class="field share-code-field"><label>Offline Swole Cat code</label><textarea id="shareCodeField" readonly spellcheck="false" onclick="this.select()">${esc(draft.code)}</textarea><div class="mini">${draft.code.length.toLocaleString()} characters · version ${SHARE_FORMAT_VERSION}</div></div>
   <div class="actions"><button class="btn" onclick="shareCurrentPlan()">Share Offline Code</button><button class="btn secondary" onclick="copyCurrentShareCode()">Copy Code</button><button class="btn secondary" onclick="closeModal()">Done</button></div>
  </div>`);
}
async function createCloudShareForDraft(){
 const draft=shareExportDraft;if(!draft)return;
 const service=SwoleCatRuntime.getService('planSharing');
 if(!service?.canCreate?.()){renderOfflineShareChoice();return}
 openModal(`Share ${esc(draft.name)}`,shareCloudLoadingHtml(draft.name));
 try{
  const result=await service.create(draft.envelope);
  if(shareExportDraft!==draft)return;
  draft.cloudCode=result.code;
  draft.expiresAt=result.expiresAt||null;
  renderCloudShareExport();
 }catch(e){
  if(shareExportDraft!==draft)return;
  renderOfflineShareChoice(e?.message||'Could not create a short cloud share code.');
 }
}
async function retryCurrentCloudShare(){await createCloudShareForDraft()}
function openOfflineShareForDraft(){
 const draft=shareExportDraft;if(!draft)return;
 try{
  draft.code=draft.code||shareEncodeEnvelope(draft.envelope);
  draft.cloudCode='';
  renderOfflineShareExport();
 }catch(e){showToast(e?.message||'Could not create offline share code')}
}
async function openShareExport(kind,id){
 try{
  const envelope=kind==='program'?createProgramShareEnvelope(id):createRoutineShareEnvelope(id);
  const name=kind==='program'?envelope.program.name:envelope.routine.name;
  shareExportDraft={kind,name,envelope,cloudCode:'',expiresAt:null,code:''};
  const service=SwoleCatRuntime.getService('planSharing');
  if(service?.canCreate?.())await createCloudShareForDraft();
  else renderOfflineShareChoice();
 }catch(e){showToast(e?.message||'Could not prepare this plan for sharing')}
}
function openRoutineShare(id){openShareExport('routine',id)}
function openProgramShare(id){openShareExport('program',id)}

async function copyShareText(text){
 if(navigator.clipboard?.writeText){
  try{await navigator.clipboard.writeText(text);return true}catch(e){}
 }
 const area=document.createElement('textarea');
 area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';area.style.pointerEvents='none';
 document.body.appendChild(area);area.select();
 let ok=false;try{ok=!!document.execCommand?.('copy')}catch(e){}
 area.remove();return ok;
}
async function copyCurrentShareCode(){
 if(!shareExportDraft)return;
 const value=shareExportDraft.cloudCode||shareExportDraft.code;
 if(!value)return;
 const ok=await copyShareText(value);
 showToast(ok?'Share code copied':'Select the code and copy it');
}
async function shareCurrentPlan(){
 if(!shareExportDraft)return;
 const text=shareMessageForDraft(shareExportDraft),title=`Swole Cat ${shareExportDraft.kind==='program'?'Program':'Routine'}: ${shareExportDraft.name}`;
 try{
  const plugin=typeof capacitorPlugin==='function'?capacitorPlugin('Share'):null;
  if(plugin?.share){await plugin.share({title,text,dialogTitle:'Share with'});return}
  if(navigator.share){await navigator.share({title,text});return}
  const value=shareExportDraft.cloudCode||shareExportDraft.code;
  const ok=value?await copyShareText(value):false;
  showToast(ok?'Share code copied':'Share sheet unavailable');
 }catch(e){
  if(e?.name!=='AbortError'&&!/cancel/i.test(String(e?.message||'')))showToast('Could not open the share sheet');
 }
}

function openShareImport(prefill=''){
 shareImportDraft=null;
 openModal('Import shared plan',`
  <div class="share-import-card">
   <div class="eyebrow">UNIVERSAL IMPORT // ROUTINE OR PROGRAM</div>
   <div class="notice" style="margin-top:10px">Enter a short Swole Cat cloud code like <b>SC-7K4M-PQ2D-X9V7-R3HT</b>, or paste an older SWOLECAT1 offline package. Short cloud shares expire after 7 days.</div>
   <div class="field"><label>Share code</label><textarea id="shareImportInput" class="share-import-input" spellcheck="false" placeholder="SC-XXXX-XXXX-XXXX-XXXX or SWOLECAT1...">${esc(prefill)}</textarea></div>
   <div id="shareImportError" class="share-import-error" role="alert"></div>
   <div class="actions"><button class="btn" onclick="previewShareImport()">Preview Import</button><button class="btn secondary" onclick="closeModal()">Cancel</button></div>
  </div>`);
 setTimeout(()=>document.getElementById('shareImportInput')?.focus(),0);
}
async function previewShareImport(){
 const input=document.getElementById('shareImportInput'),raw=input?.value||'';
 const error=document.getElementById('shareImportError');
 try{
  if(error)error.textContent='';
  let envelope,canonicalRaw=raw,cloudCode='',expiresAt=null;
  if(/SWOLECAT1\./i.test(raw)){
   envelope=decodeSwoleCatShare(raw);
  }else{
   cloudCode=shareNormalizeCloudCode(raw);
   if(!cloudCode)throw new Error('Enter a valid short Swole Cat code or paste an older SWOLECAT1 offline package.');
   if(error)error.textContent='Loading shared plan…';
   const result=await SwoleCatRuntime.getService('planSharing')?.resolve?.(cloudCode);
   if(!result?.envelope)throw new Error('That cloud share could not be loaded.');
   envelope=result.envelope;
   expiresAt=result.expiresAt||null;
   canonicalRaw=cloudCode;
  }
  shareImportDraft={raw:canonicalRaw,envelope,cloudCode,expiresAt};
  const label=envelope.kind==='program'?'Add Program':'Add to My Routines';
  openModal('Import preview',`${shareImportPreviewHtml(envelope)}${cloudCode?'<div class="mini" style="margin-top:10px">Cloud share '+esc(cloudCode)+(expiresAt?' · expires '+esc(shareCloudExpiryLabel(expiresAt)):'')+'</div>':''}<div class="actions"><button class="btn green" onclick="confirmSharedPlanImport()">${label}</button><button class="btn secondary" onclick="openShareImport(shareImportDraft?.raw||'')">Back</button><button class="btn secondary" onclick="closeModal()">Cancel</button></div>`);
 }catch(e){
  if(error)error.textContent=e?.message||'That share code could not be read.';
 }
}
function confirmSharedPlanImport(){
 const envelope=shareImportDraft?.envelope;if(!envelope)return;
 try{
  const plan=importSharedEnvelope(envelope),isProgram=!!plan.program;
  shareImportDraft=null;closeModal();renderRoutines();renderHome();
  showToast(isProgram?`Imported ${plan.program.name}`:`Imported ${plan.routines[0].name}`);
 }catch(e){
  showToast(e?.message||'Could not import shared plan');
 }
}
