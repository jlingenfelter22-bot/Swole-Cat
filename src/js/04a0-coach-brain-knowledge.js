// Swole Cat Brain v0.89: standalone, read-only exercise knowledge and decision service.
// Not wired into existing Coach generation, logging, progression, or cloud.
// Proposals originate in docs/coach-brain; they are not independently clinically validated.
(function(){
 'use strict';
 const raw=SWOLE_CAT_BRAIN_EXERCISE_PROFILES;
 const byId=new Map();
 function freezeDeep(obj){
   if(!obj||typeof obj!=='object'||Object.isFrozen(obj))return obj;
   Object.values(obj).forEach(freezeDeep);
   return Object.freeze(obj);
 }
 raw.forEach(p=>{if(byId.has(p.id))throw Error('Duplicate Brain profile: '+p.id);byId.set(p.id,freezeDeep(p))});
 freezeDeep(raw);
 const PRESETS=freezeDeep({
   floor_only:['bodyweight','exercise_space'],
   home_dumbbells:['bodyweight','exercise_space','dumbbells'],
   standard_gym:['bodyweight','exercise_space','barbell','plates','bench','dumbbells','cable_station']
 });
 const QUESTION_CAPS=new Set(['assistance_mechanism_unknown','pelvic_restraint_status_unknown','drag_direction_to_confirm']);
 const OPTIONAL_CAPS=new Set(['plates_if_required']);
 const OR_GROUPS={
   bench_or_specific_support:['bench','bench_or_specific_support'],
   dip_bars_or_stable_bench:['dip_bars','stable_bench','dip_bars_or_stable_bench'],
   anchored_landmine_or_tbar_station:['anchored_landmine','landmine_anchor','tbar_station','anchored_landmine_or_tbar_station'],
   landmine_or_tbar_anchor:['anchored_landmine','landmine_anchor','tbar_station','landmine_or_tbar_anchor'],
   tbar_station_or_landmine:['tbar_station','anchored_landmine','landmine_anchor','tbar_station_or_landmine']
 };
 const ALIASES={
   landmine_anchor:['anchored_landmine','landmine_anchor'],
   anchored_landmine:['anchored_landmine','landmine_anchor'],
   matching_machine:['matching_machine'],
   bench:['bench'],
   dumbbells:['dumbbells'],
   barbell:['barbell'],
   plates:['plates'],
   bodyweight:['bodyweight']
 };
 const asSet=value=>new Set((Array.isArray(value)?value:[]).filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim()));
 const intersect=(a,b)=>a.some(x=>b.includes(x));
 function resolveInventory(context={}){
   const equipment=context&&typeof context.equipment==='object'?context.equipment:{};
   const preset=typeof equipment.preset==='string'&&Object.prototype.hasOwnProperty.call(PRESETS,equipment.preset)?equipment.preset:null;
   const confirmed=asSet(equipment.available);
   const unavailable=asSet(equipment.unavailable);
   const available=asSet(preset?PRESETS[preset]:[]);
   confirmed.forEach(x=>available.add(x));
   // Explicit exclusions always outrank a preset or other positive assumption.
   unavailable.forEach(x=>available.delete(x));
   return {preset,available,unavailable,confirmed,complete:equipment.complete===true};
 }
 function hasRequirement(requirement,inventory,profile){
   if(OPTIONAL_CAPS.has(requirement))return true;
   const options=OR_GROUPS[requirement]||ALIASES[requirement]||[requirement];
   // Plain Dip requires dip bars. The support for Bench Dip must not be
   // silently considered valid for a parallel-bar Dip.
   if(requirement==='dip_bars_or_stable_bench'&&profile.name==='Dip')return inventory.available.has('dip_bars');
   return options.some(x=>inventory.available.has(x));
 }
 function deniedRequirement(requirement,inventory,profile){
   const options=requirement==='dip_bars_or_stable_bench'&&profile.name==='Dip'?['dip_bars']:OR_GROUPS[requirement]||ALIASES[requirement]||[requirement];
   return options.every(x=>inventory.unavailable.has(x));
 }
 function evaluateAvailability(id,context={}){
   const profile=byId.get(id);
   if(!profile)return freezeDeep({exerciseId:id,status:'unknown_exercise',reason:'Exercise is not in the audited built-in catalog.',missing:[],questions:[]});
   const inv=resolveInventory(context);
   const excluded=new Set(context?.excludedExerciseIds||[]);
   if(excluded.has(id))return freezeDeep({exerciseId:id,status:'unavailable',reason:'Explicitly excluded exercise.',missing:[],questions:[],source:'user_exclusion'});
   const missing=[],questions=[],denied=[];
   for(const req of profile.needs){
     if(QUESTION_CAPS.has(req)){
       if(!inv.confirmed.has(req))questions.push(req);
     }else if(!OPTIONAL_CAPS.has(req)&&!hasRequirement(req,inv,profile)){
       missing.push(req);
       if(inv.complete||deniedRequirement(req,inv,profile))denied.push(req);
     }
   }
   const status=denied.length?'unavailable':missing.length||questions.length?'unconfirmed':'available';
   const reason=status==='available'?
     inv.preset?'Compatible with the stated equipment preset, which is an assumption until confirmed.':'Compatible with the explicitly listed equipment.':
     status==='unavailable'?'Required equipment is excluded or absent from a complete inventory.':
     'Confirm missing equipment or execution details before recommending.';
   return freezeDeep({
     exerciseId:id,status,reason,missing,questions,
     source:inv.preset?'preset_assumption':inv.complete?'complete_inventory':'partial_or_unknown_inventory',
     assumed:!!inv.preset
   });
 }
 function getProfile(id){return byId.get(id)||null}
 function describeExercise(id,context={}){
   const p=getProfile(id);
   if(!p)return null;
   const availability=evaluateAvailability(id,context);
   return freezeDeep({
     exerciseId:p.id,name:p.name,movementRole:p.role,
     primary:p.primary,secondary:p.secondary,
     equipmentCapabilities:p.needs,resistancePolicy:p.load,measurement:p.measurement,
     sideExecution:p.side,sideSpecificTrackingAvailable:p.sideMetrics,
     powerOrSkillPriority:p.power,technicalDemand:p.demand[0],
     purpose:p.reason,
     classification:'reviewed_desk_proposal_not_live',
     reviewLevel:p.review,
     availability,
     coachingCaveats:[
       ...(p.sideMetrics?[]:['Side-specific performance cannot be inferred from existing combined sets.']),
       ...(p.power?['Power/skill exercise: avoid automatically applying near-failure hypertrophy prescriptions.']:[]),
       ...(p.load.startsWith('unknown_')?['The machine loading or assistance meaning requires configuration.']:[])
     ]
   });
 }
 function suggestSubstitutes(id,context={},options={}){
   const origin=getProfile(id);
   if(!origin)return freezeDeep({exerciseId:id,candidates:[],reason:'Unknown exercise.'});
   const max=Math.max(0,Math.min(12,Number.isFinite(Number(options.limit))?Math.floor(Number(options.limit)):5));
   const includeRelated=options.includeRelated===true;
   const includeUnconfirmed=options.includeUnconfirmed===true;
   const matches=[];
   for(const candidate of raw){
     if(candidate.id===origin.id)continue;
     if(candidate.measurement!==origin.measurement)continue; // never swap reps with seconds or distance
     if(!intersect(candidate.primary,origin.primary))continue;
     const sameRole=candidate.role===origin.role;
     if(!sameRole&&!includeRelated)continue;
     const availability=evaluateAvailability(candidate.id,context);
     if(availability.status!=='available'&&!(includeUnconfirmed&&availability.status==='unconfirmed'))continue;
     const loadChanged=candidate.load!==origin.load;
     const powerChanged=candidate.power!==origin.power;
     const roleChanged=!sameRole;
     const sideChanged=candidate.side!==origin.side;
     const score=(sameRole?100:0)+
       candidate.primary.filter(x=>origin.primary.includes(x)).length*18+
       (candidate.equipment===origin.equipment?7:0)+
       (loadChanged?-20:12)+(powerChanged?-15:0)+
       (sideChanged?-8:0)-
       Math.abs(candidate.demand[0]-origin.demand[0])*4+
       (origin.suggested.includes(candidate.id)?3:0);
     const warnings=[
       ...(loadChanged?['Load or assistance semantics differ; do not transfer weights or progression targets.']:[]),
       ...(sideChanged?['Unilateral/bilateral execution differs; prior performance is not directly comparable.']:[]),
       ...(powerChanged?['Training skill/power purpose differs; confirm suitability.']:[]),
       ...(roleChanged?['Related muscle target, but not the same movement role.']:[]),
       ...(availability.status==='unconfirmed'?['Equipment or execution needs confirmation.']:[])
     ];
     matches.push({
       exerciseId:candidate.id,name:candidate.name,movementRole:candidate.role,
       relationship:roleChanged?'related_programming_option':'same_role_option',
       availability,reason:candidate.reason,
       warnings,measurement:origin.measurement,
       historyTransferAllowed:false,automaticSwapAllowed:false,
       // This service returns suggestions only. It does not edit routines,
       // transfer history or invent progression.
       _score:score
     });
   }
   matches.sort((a,b)=>b._score-a._score||a.name.localeCompare(b.name)||a.exerciseId.localeCompare(b.exerciseId));
   const result=matches.slice(0,max).map(({_score,...item})=>freezeDeep(item));
   return freezeDeep({
     exerciseId:id,candidates:result,
     reason:result.length?'Candidate alternatives only. Confirm equipment and retain independent exercise histories.':'No compatible confirmed alternative in the current catalog under these constraints.',
     automaticSwapAllowed:false,historyTransferAllowed:false
   });
 }
 const service=Object.freeze({
   version:'0.89.0-dev',
   dataVersion:SWOLE_CAT_BRAIN_KNOWLEDGE_VERSION,
   count:raw.length,
   presets:PRESETS,
   getProfile,describeExercise,evaluateAvailability,suggestSubstitutes
 });
 SwoleCatRuntime.registerService('brainKnowledge',service);
})();
