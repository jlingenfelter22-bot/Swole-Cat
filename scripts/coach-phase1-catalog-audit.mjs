// Phase 1 only: audit the exact 310 built-in movements and live metadata.
// Read-only, synthetic DOM fixture, no workout selection changes or cloud calls.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.fetch=()=>Promise.reject(Error('Network access forbidden in catalog audit'));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
 }
});
try {
 await new Promise(resolve=>setTimeout(resolve,190));
 const w=dom.window,brain=w.SwoleCatRuntime.getService('brainKnowledge');
 const catalog=Array.from(w.eval('LIBRARY'));
 const regions=new Set(Object.keys(w.eval('MUSCLE_REGION_LABELS')));
 const stateBefore=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})');
 assert.equal(catalog.length,310,'Expect 310 built-in exercises at accepted v0.93.4 baseline');
 assert.equal(brain.count,catalog.length,'Knowledge profiles must cover each built-in');
 const ids=new Set(),names=new Map(),rows=[],fatal=[],review=[];
 for(const ex of catalog){
  const profile=brain.getProfile(ex.id);
  const meta=w.exerciseMuscleMetadata(ex);
  const family=w.coachMovementFamily(ex);
  const problems=[];
  if(ids.has(ex.id))problems.push('duplicate_id');
  ids.add(ex.id);
  if(!ex.name||!ex.pattern||!ex.equipment)problems.push('missing_catalog_fields');
  if(!profile)problems.push('missing_brain_profile');
  else if(profile.name!==ex.name||profile.pattern!==ex.pattern||profile.equipment!==ex.equipment)problems.push('knowledge_drift');
  if(!family||typeof family!=='string')problems.push('missing_movement_family');
  if(!meta.primary?.length)problems.push('missing_primary_muscle');
  for(const m of [...meta.primary,...meta.secondary])if(!regions.has(m))problems.push('unrecognized_muscle_'+m);
  for(const m of meta.primary)if(meta.secondary.includes(m))problems.push('overlapping_muscle_'+m);
  if(profile&&(!profile.needs?.length||!profile.role))problems.push('incomplete_knowledge_profile');
  const nameMatches=names.get(ex.name)||[];nameMatches.push(ex.id);names.set(ex.name,nameMatches);
  const mismatch=profile?{
   primary:JSON.stringify(Array.from(meta.primary).sort())!==JSON.stringify(Array.from(profile.primary).sort()),
   secondary:JSON.stringify(Array.from(meta.secondary).sort())!==JSON.stringify(Array.from(profile.secondary).sort()),
   movementRole:profile.role!==ex.pattern
  }:{primary:false,secondary:false,movementRole:false};
  if(mismatch.primary||mismatch.secondary)review.push({id:ex.id,name:ex.name,kind:'runtime_vs_desk_muscle_mapping',live:{primary:meta.primary,secondary:meta.secondary},desk:{primary:profile.primary,secondary:profile.secondary}});
  const row={id:ex.id,name:ex.name,muscleCategory:ex.muscle,pattern:ex.pattern,family,
   equipment:ex.equipment,primary:Array.from(meta.primary),secondary:Array.from(meta.secondary),
   profileRole:profile?.role||null,needs:Array.from(profile?.needs||[]),
   metric:profile?.measurement||'unknown',load:profile?.load||'unknown',side:profile?.side||'unknown',
   profileConfidence:profile?.review||null,profilePrimary:Array.from(profile?.primary||[]),
   profileSecondary:Array.from(profile?.secondary||[]),suggested:Array.from(profile?.suggested||[]),
   reviewMismatch:mismatch,problems};
  rows.push(row);
  if(problems.length)fatal.push({id:ex.id,name:ex.name,problems});
 }
 const duplicates=[...names.entries()].filter(([,v])=>v.length>1).map(([name,ids])=>({name,ids}));
 const rolePatterns={
  press:['horizontal_press','incline_press','vertical_press','dip_press'],
  horizontal_pull:['horizontal_pull'],vertical_pull:['vertical_pull'],
  knee:['squat','lunge','knee_extension'],hinge:['hinge'],
  knee_flexion:['knee_flexion'],hip_extension:['hip_extension'],
  lateral_delts:['lateral_raise'],rear_delts:['rear_delt'],
  calves:['calf_raise'],core:['spinal_flexion','anti_extension','rotation','anti_rotation','hip_flexion_core','lateral_flexion']
 };
 const equipmentContexts={};
 for(const choice of ['gym','dumbbells','bodyweight']){
  const parsed=w.coachParsePrompt('45 minute full body workout','hypertrophy');
  const resolved=w.coachBrainApplyEquipmentChoice(parsed,choice);
  assert(resolved.ok,'No equipment choice: '+choice);
  const request=resolved.request,context=w.coachBrainEquipmentConstraints(request);
  const statusById={},roleCounts={},primaryRegionCounts={};
  for(const ex of catalog){
   const allowed=w.coachExerciseAllowedByConstraints(ex,request);
   const available=brain.evaluateAvailability(ex.id,context);
   const status=!allowed?'excluded':available.status;
   statusById[ex.id]=status;
   if(status==='available'){
    for(const [key,patterns] of Object.entries(rolePatterns))if(patterns.includes(ex.pattern))roleCounts[key]=(roleCounts[key]||0)+1;
    for(const region of w.exerciseMuscleMetadata(ex).primary)primaryRegionCounts[region]=(primaryRegionCounts[region]||0)+1;
   }
  }
  equipmentContexts[choice]={statusCounts:Object.values(statusById).reduce((a,k)=>(a[k]=(a[k]||0)+1,a),{}),
   roleCounts,primaryRegionCounts,
   unconfirmedRoleCounts:Object.fromEntries(Object.entries(rolePatterns).map(([role,patterns])=>
    [role,catalog.filter(ex=>patterns.includes(ex.pattern)&&statusById[ex.id]==='unconfirmed').length]))};
 }
 const summary={
  version:'phase1-v0934',catalogSize:catalog.length,profileSize:brain.count,
  fatalCount:fatal.length,liveVsDeskMuscleDisagreements:review.length,
  movementFamilyCount:new Set(rows.map(x=>x.family)).size,
  profileStatuses:rows.reduce((a,row)=>(a[row.profileConfidence||'unknown']=(a[row.profileConfidence||'unknown']||0)+1,a),{}),
  musclePrimaryCounts:Object.fromEntries([...regions].map(region=>[region,rows.filter(x=>x.primary.includes(region)).length])),
  equipmentCounts:rows.reduce((a,row)=>(a[row.equipment]=(a[row.equipment]||0)+1,a),{}),
  duplicatedNames:duplicates,equipmentContexts
 };
 assert.equal(ids.size,catalog.length,'IDs must be unique');
 assert.equal(fatal.length,0,'Catalog has structurally invalid rows: '+JSON.stringify(fatal.slice(0,8)));
 assert.deepEqual(new Set(rows.map(x=>x.id)),ids);
 assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})'),stateBefore,'Catalog audit may not modify training');
 const output={summary,reviewItems:review,rows};
 fs.mkdirSync('/tmp/swole-cat-coach-phase1',{recursive:true});
 fs.writeFileSync('/tmp/swole-cat-coach-phase1/catalog-audit.json',JSON.stringify(output,null,2)+'\n');
 console.log('COACH_PHASE1_CATALOG '+JSON.stringify({size:summary.catalogSize,fatal:summary.fatalCount,
  disagreements:summary.liveVsDeskMuscleDisagreements,primary:summary.musclePrimaryCounts,
  byEquipment:Object.fromEntries(Object.entries(equipmentContexts).map(([k,v])=>[k,{status:v.statusCounts,roles:v.roleCounts}]))}));
 console.log('COACH_PHASE1_REVIEW_SAMPLE '+JSON.stringify(review.slice(0,12)));
 console.log('COACH_PHASE1_CATALOG_PASS: Read-only full catalog checked; desk-proposal disagreements are review items, not automatically wrong live metadata.');
} finally {dom.window.close()}
