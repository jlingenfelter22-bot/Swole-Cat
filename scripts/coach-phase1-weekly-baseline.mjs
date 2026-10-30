// Phase 1: frozen baseline of REAL current Coach output across representative weeks.
// Does not change exercise selection. All data stays inside an isolated jsdom fixture.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.fetch=()=>Promise.reject(Error('Network access forbidden in quality baseline'));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
 }
});
try{
 await new Promise(r=>setTimeout(r,190));
 const w=dom.window,brain=w.SwoleCatRuntime.getService('brainKnowledge');
 const before=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})');
 assert.equal(w.eval('LIBRARY.length'),310);
 const scenarios=[
  {id:'2day_general_full_gym',prompt:'2 day full body program 45 minutes',equipment:'gym',goal:'general'},
  {id:'3day_full_gym',prompt:'3 day full body program 45 minutes',equipment:'gym'},
  {id:'3day_ppl_gym',prompt:'3 day push pull legs program 60 minutes',equipment:'gym'},
  {id:'4day_upper_lower_gym',prompt:'4 day upper lower program 45 minutes',equipment:'gym'},
  {id:'4day_upper_lower_dumbbells',prompt:'4 day upper lower program 45 minutes',equipment:'dumbbells'},
  {id:'4day_shoulder_priority_gym',prompt:'4 day upper lower program 50 minutes',equipment:'gym',focus:['side_delts','rear_delts']},
  {id:'4day_glute_priority_dumbbells',prompt:'4 day upper lower program 50 minutes',equipment:'dumbbells',focus:['glutes']},
  {id:'5day_balanced_gym',prompt:'5 day balanced program 45 minutes',equipment:'gym'},
  {id:'6day_ppl_gym',prompt:'6 day push pull legs program 60 minutes',equipment:'gym'},
  {id:'6day_ppl_strength',prompt:'6 day push pull legs strength program 60 minutes',equipment:'gym',goal:'strength'},
  {id:'3day_full_bodyweight_limit',prompt:'3 day full body program 30 minutes',equipment:'bodyweight',expectCannotGenerate:true},
  {id:'3day_full_dumbbells',prompt:'3 day full body program 45 minutes',equipment:'dumbbells'}
 ];
 const roles={
  press:new Set(['horizontal_press','incline_press','vertical_press','dip_press']),
  horizontal_pull:new Set(['horizontal_pull']),vertical_pull:new Set(['vertical_pull']),
  knee:new Set(['squat','lunge','knee_extension']),hinge:new Set(['hinge']),
  knee_flexion:new Set(['knee_flexion']),posterior:new Set(['hinge','knee_flexion','hip_extension','back_extension']),
  lateral_delt:new Set(['lateral_raise']),rear_delt:new Set(['rear_delt']),calf:new Set(['calf_raise']),
  core:new Set(['anti_extension','spinal_flexion','hip_flexion_core','rotation','anti_rotation','lateral_flexion'])
 };
 const output=[];
 for(const test of scenarios){
  let request=w.coachParsePrompt(test.prompt,test.goal||'hypertrophy');
  const configured=w.coachBrainApplyEquipmentChoice(request,test.equipment);
  assert(configured.ok,'Cannot resolve synthetic equipment for '+test.id);
  request=configured.request;
  const intent=w.coachParseProgramIntent(test.prompt);
  if(test.focus){
   // Fixed scenario of an explicit user priority: independent of text-parser
   // fuzziness. Future parser tests separately validate natural-language focus.
   intent.focusRegions=[...test.focus];request.programFocusRegions=[...test.focus];
  }
  const generated=w.coachGenerateProgram(request,intent,null);
  if(test.expectCannotGenerate)assert(!generated,'Unsupported equipment cannot yield a fake complete full-body program');
  else assert(generated&&generated.days?.length===intent.frequency,
   'Baseline supported case must generate: '+test.id);
  if(!generated){output.push({id:test.id,prompt:test.prompt,equipment:test.equipment,goal:test.goal||'hypertrophy',
    focus:test.focus||[],frequency:intent.frequency,split:intent.split,generated:false,days:[],signals:['equipment_limited_or_infeasible']});continue}
  const primary={},secondary={},roleCounts={},exerciseUse={},signals=[],days=[];
  for(const [index,day] of generated.days.entries()){
   const rows=[],families={};
   const estimated=day.brainTime||w.coachBrainSessionTimeEstimate(day.selectedIds,day.request,day.defaults,{explicitConfigById:day.brainSetCounts||{}});
   for(const id of day.selectedIds){
    const ex=w.exById(id);
    assert(ex,'No catalog exercise '+id);
    const p=w.coachExercisePrescription(ex,day.request,day.defaults);
    const sets=Number(day.brainSetCounts?.[id]?.sets||p.sets);
    const meta=w.exerciseMuscleMetadata(ex),family=w.coachMovementFamily(ex);
    const availability=brain.evaluateAvailability(id,w.coachBrainEquipmentConstraints(day.request)).status;
    assert(availability==='available','Generated exercise unavailable or unconfirmed '+test.id+' / '+ex.name+': '+availability);
    meta.primary.forEach(m=>primary[m]=(primary[m]||0)+sets);
    meta.secondary.forEach(m=>secondary[m]=(secondary[m]||0)+sets*.5);
    for(const [role,patterns] of Object.entries(roles))if(patterns.has(ex.pattern))roleCounts[role]=(roleCounts[role]||0)+1;
    families[family]=(families[family]||0)+1;
    exerciseUse[id]=(exerciseUse[id]||0)+1;
    rows.push({id,name:ex.name,pattern:ex.pattern,family,equipment:ex.equipment,
     primary:Array.from(meta.primary),secondary:Array.from(meta.secondary),sets,
     minReps:p.minReps,maxReps:p.maxReps,restSeconds:p.restSeconds,availability});
   }
   const repeated=Object.entries(families).filter(([,n])=>n>1).map(([family,n])=>({family,count:n}));
   if(repeated.length)signals.push({kind:'repeated_family_in_day',day:index+1,repeated});
   days.push({index:index+1,label:day.label,dayFocus:day.key,
    requestedMinutes:day.request.duration,estimate:{min:estimated.lowerMinutes,typical:estimated.estimateMinutes,max:estimated.upperMinutes},
    exercises:rows,repeatFamilies:repeated,plannedSetChanges:day.brainSetCounts||{},removedByDuration:day.brainTimeRemoved||[]});
  }
  // Observations, not fail conditions: the selected split may deliberately
  // omit any pattern, and duration is an estimate, not an exact deadline.
  const roleGaps=Object.keys(roles).filter(role=>!(roleCounts[role]>0));
  const focusDirect=(test.focus||[]).filter(region=>(primary[region]||0)>0);
  const focusIndirect=(test.focus||[]).filter(region=>(primary[region]||0)===0&&(secondary[region]||0)>0);
  const focusAbsent=(test.focus||[]).filter(region=>(primary[region]||0)+(secondary[region]||0)===0);
  if(focusIndirect.length||focusAbsent.length)signals.push({kind:'explicit_priority_not_direct',secondaryOnly:focusIndirect,missing:focusAbsent});
  const repeatedAcrossWeek=Object.entries(exerciseUse).filter(([,n])=>n>1).map(([id,count])=>({id,count}));
  const review=w.coachBrainProgramWeekReview(generated);
  output.push({id:test.id,prompt:test.prompt,equipment:test.equipment,goal:test.goal||'hypertrophy',
   focus:test.focus||[],frequency:intent.frequency,split:intent.split,generated:true,
   days,weekly:{primary,secondary,roleCounts,missingRoles:roleGaps,repeatedExercises:repeatedAcrossWeek,
    directFocus:focusDirect,indirectFocus:focusIndirect,absentFocus:focusAbsent},
   weekReviewNotes:(review.notes||[]).map(n=>({key:n.key,text:n.text})),signals});
 }
 assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})'),before,
  'Baseline generation must not mutate real training data');
 const report={phase:'phase1',sourceVersion:'0.93.4',catalogSize:310,scenarios:output};
 const frozen={phase:'phase1',sourceVersion:'0.93.4',catalogSize:310,
  scenarios:output.map(({id,generated,days,weekly,signals,focus})=>({
   id,generated,focus,
   days:days.map(d=>({label:d.label,requestedMinutes:d.requestedMinutes,estimate:d.estimate,
    exercises:d.exercises.map(e=>({id:e.id,sets:e.sets})),removedByDuration:d.removedByDuration})),
   weekly:weekly?{roleCounts:weekly.roleCounts,primary:weekly.primary,secondary:weekly.secondary,
    directFocus:weekly.directFocus,indirectFocus:weekly.indirectFocus,absentFocus:weekly.absentFocus}:null,
   signals
  }))};
 fs.mkdirSync('/tmp/swole-cat-coach-phase1',{recursive:true});
 fs.writeFileSync('/tmp/swole-cat-coach-phase1/weekly-program-human-review.json',JSON.stringify(report,null,2)+'\n');
 const frozenText=JSON.stringify(frozen,null,2)+'\n';
 fs.writeFileSync('/tmp/swole-cat-coach-phase1/weekly-baseline-frozen.json',frozenText);
 const target='docs/coach-quality/phase1-baseline-v0934.json';
 if(fs.existsSync(target)){
  const original=JSON.parse(fs.readFileSync(target,'utf8'));
  // Rehydrate through JSON: selected IDs and removed-set lists originate in
  // the jsdom Window realm, whose Array prototypes are not Node's prototypes.
  // Compare persisted VALUES, not cross-realm object identity/prototypes.
  assert.deepEqual(JSON.parse(JSON.stringify(frozen)),original,
   'Production generator drifted from locked v0.93.4 pre-improvement baseline');
 }
 console.log('COACH_PHASE1_MATRIX '+JSON.stringify(output.map(s=>({id:s.id,generated:s.generated,
  days:s.days.length,roles:s.weekly?.roleCounts,primaryFocus:s.weekly?.directFocus,
  indirectFocus:s.weekly?.indirectFocus,missingFocus:s.weekly?.absentFocus,signals:s.signals}))));
 console.log('COACH_PHASE1_FREEZE_JSON '+JSON.stringify(frozen));
 console.log('COACH_PHASE1_BASELINE_PASS '+JSON.stringify({scenarios:output.length,generated:output.filter(s=>s.generated).length,
  days:output.reduce((n,s)=>n+s.days.length,0),historyUntouched:true,baselineFile:target,baselineLocked:fs.existsSync(target)}));
}finally{dom.window.close()}
