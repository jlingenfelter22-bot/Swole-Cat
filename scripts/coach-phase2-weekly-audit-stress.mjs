// Phase 2 behavior audit: observe current workout selection without changing it.
// Uses synthetic data and 12 locked Phase 1 scenarios; no workout/cloud writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.fetch=()=>Promise.reject(Error('No network in synthetic week auditor'));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
 }
});
try{
 await new Promise(r=>setTimeout(r,190));
 const w=dom.window;
 const before=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})');
 const baseline=JSON.parse(fs.readFileSync('docs/coach-quality/phase1-baseline-v0934.json','utf8'));
 assert.equal(baseline.scenarios.length,12);
 const byName=name=>w.allExercises().find(ex=>ex.name===name);
 const equipment=(prompt,choice,goal='hypertrophy')=>{
  const request=w.coachParsePrompt(prompt,goal);
  const configured=w.coachBrainApplyEquipmentChoice(request,choice);
  assert(configured.ok);
  return configured.request;
 };
 const scenarioSpecs={
  '2day_general_full_gym':{prompt:'2 day full body program 45 minutes',equipment:'gym',goal:'general'},
  '3day_full_gym':{prompt:'3 day full body program 45 minutes',equipment:'gym'},
  '3day_ppl_gym':{prompt:'3 day push pull legs program 60 minutes',equipment:'gym'},
  '4day_upper_lower_gym':{prompt:'4 day upper lower program 45 minutes',equipment:'gym'},
  '4day_upper_lower_dumbbells':{prompt:'4 day upper lower program 45 minutes',equipment:'dumbbells'},
  '4day_shoulder_priority_gym':{prompt:'4 day upper lower program 50 minutes',equipment:'gym',focus:['side_delts','rear_delts']},
  '4day_glute_priority_dumbbells':{prompt:'4 day upper lower program 50 minutes',equipment:'dumbbells',focus:['glutes']},
  '5day_balanced_gym':{prompt:'5 day balanced program 45 minutes',equipment:'gym'},
  '6day_ppl_gym':{prompt:'6 day push pull legs program 60 minutes',equipment:'gym'},
  '6day_ppl_strength':{prompt:'6 day push pull legs strength program 60 minutes',equipment:'gym',goal:'strength'},
  '3day_full_bodyweight_limit':{prompt:'3 day full body program 30 minutes',equipment:'bodyweight'},
  '3day_full_dumbbells':{prompt:'3 day full body program 45 minutes',equipment:'dumbbells'}
 };
 const results=[];
 for(const locked of baseline.scenarios){
  const spec=scenarioSpecs[locked.id];assert(spec);
  const request=equipment(spec.prompt,spec.equipment,spec.goal||'hypertrophy');
  const intent=w.coachParseProgramIntent(spec.prompt);
  if(spec.focus){
   intent.focusRegions=[...spec.focus];
   request.programFocusRegions=[...spec.focus];
  }
  const draft=w.coachGenerateProgram(request,intent,null);
  assert.equal(!!draft,locked.generated,'Previously frozen generation must not change: '+locked.id);
  if(!draft){results.push({id:locked.id,generated:false,reason:'known_equipment_infeasibility'});continue}
  const frozenDays=JSON.parse(JSON.stringify(draft.days.map(day=>day.selectedIds)));
  assert.deepEqual(frozenDays,locked.days.map(day=>day.exercises.map(e=>e.id)),locked.id+' exercises changed');
  const draftSnapshot=JSON.stringify(draft);
  const audit=w.coachProjectedWeekAudit(draft);
  assert(audit.ready&&audit.days.length===locked.days.length);
  assert.equal(audit.methodology.includes('No compulsory regional quotas'),true);
  assert.equal(JSON.stringify(draft),draftSnapshot,'The audit must be read-only: '+locked.id);
  const second=w.coachProjectedWeekAudit(draft);
  assert.equal(JSON.stringify(audit),JSON.stringify(second),'Auditor results deterministic: '+locked.id);
  assert(!audit.findings.some(x=>x.severity==='constraint'),'No constraint violation in baseline '+locked.id);
  results.push({id:locked.id,generated:true,days:draft.days.length,
   roles:audit.roles,feasibility:audit.roleFeasibility,
   focus:audit.priorities,regions:audit.regions,
   findings:audit.findings,summary:audit.summary});
 }
 const get=id=>results.find(x=>x.id===id);
 const missing=(s,role)=>s.findings.find(x=>x.type==='missing_weekly_role'&&x.role===role);
 const full=get('3day_full_gym');
 for(const role of ['vertical_pull','knee_flexion','calves'])
  assert(missing(full,role),'Multi-day full-body gym omitted a feasible role: '+role);
 assert.equal(full.regions.hamstrings.primary,3);
 assert(!full.findings.some(x=>x.type==='priority_absent'),'No invented focus in general full body');
 const glute=get('4day_glute_priority_dumbbells');
 assert.equal(glute.findings.filter(x=>x.type==='same_day_family_overlap'&&x.family==='squat').length,2,
  'Goblet + Bodyweight Squat are actual repeated lower-day family slots');
 assert.equal(glute.focus.find(x=>x.region==='glutes').status,'specific_direct',
  'Glute Bridge and hip hinge fulfill the specific glute focus despite squat redundancy');
 assert(!missing(glute,'knee_flexion'),
  'Do not flag absent machine-based knee flexion for a dumbbell-only week without feasible gear');
 assert.equal(glute.roleFeasibility.knee_flexion?.status,'not_feasible');
 const shoulders=get('4day_shoulder_priority_gym');
 for(const region of ['side_delts','rear_delts'])
  assert.equal(shoulders.focus.find(x=>x.region===region)?.status,'specific_direct',
   'Existing direct shoulder selection is positive protected behavior');
 assert(!shoulders.findings.some(x=>/^priority_/.test(x.type)),
  'Do not invent a gap when the explicit shoulder priority is actually satisfied');
 const ppl=get('6day_ppl_gym');
 for(const role of ['press','horizontal_pull','vertical_pull','knee','posterior','knee_flexion','calves'])
  assert(ppl.roles[role]?.count>0,'Existing six-day PPL major roles must be recognized: '+role);
 const dumbbell=get('3day_full_dumbbells');
 assert(!missing(dumbbell,'vertical_pull'),
  'Lacking equipment must not be represented as a feasible missing vertical pull');
 assert.equal(dumbbell.roleFeasibility.vertical_pull?.status,'not_feasible');
 assert(!get('3day_full_bodyweight_limit').generated,'No fictional floor-only full body plan');

 // Construct small, controlled adversarial weeks without changing the user's
 // saved routines or inventing a 310-case exercise-specific algorithm.
 const makeDay=(key,names,request,label=key)=>({
  key,label,request,defaults:w.coachProgrammingDefaults(request.goal,request.duration),
  selectedIds:names.map(name=>{const ex=byName(name);assert(ex,name);return ex.id}),
  brainSetCounts:{}
 });
 const inspect=(key,names,request,focus=[],split='custom')=>
  w.coachProjectedWeekAudit({request:{programFocusRegions:focus},intent:{split,focusRegions:focus},
   days:[makeDay(key,names,request)]});

 let r=inspect('push',['Barbell Bench Press'],equipment('45 minute push workout','gym'),['triceps']);
 assert.equal(r.priorities.find(x=>x.region==='triceps').status,'secondary_only');
 assert(r.findings.some(x=>x.type==='priority_secondary_only'&&x.availability==='feasible'));
 assert.equal(r.regions.triceps.primary,undefined,'Secondary triceps must never be rewritten as primary');
 assert(r.regions.triceps.secondary>0,'Indirect bench contribution is captured');

 r=inspect('lower body',['Back Squat'],equipment('45 minute lower body workout','gym'),['glutes']);
 assert.equal(r.priorities.find(x=>x.region==='glutes').status,'broad_primary',
  'Squat contributes glutes, but alone does not prove focused glute exercise selection');
 assert(r.findings.some(x=>x.type==='priority_broad_primary'));

 r=inspect('arms',['Barbell Curl','Triceps Pushdown'],equipment('45 minute arm workout','gym'));
 assert(!r.findings.some(x=>x.type==='missing_weekly_role'&&['knee','posterior','press','horizontal_pull','vertical_pull'].includes(x.role)),
  'Arms-only specialization must not be treated as a defective full-body week');

 const floor=equipment('45 minute lower body workout','bodyweight');
 r=inspect('lower body',['Bodyweight Squat','Glute Bridge'],floor);
 assert(!r.findings.some(x=>x.type==='missing_weekly_role'&&x.role==='knee_flexion'),
  'Bodyweight only cannot claim equipment-supported knee flexion when none exists');

 const restricted=equipment('45 minute full body workout','gym');
 restricted.excludedMovementPatterns=['vertical_pull'];
 r=inspect('full body',['Back Squat','Romanian Deadlift','Barbell Bench Press','Barbell Row'],restricted);
 assert(!missing({findings:r.findings},'vertical_pull'),
  'Explicitly excluded vertical pulling must never be recommended as eligible');
 assert.equal(r.roleFeasibility.vertical_pull?.status,'not_feasible');

 const must=equipment('45 minute pull workout','gym');
 const mandatory=byName('Lat Pulldown');assert(mandatory);
 must.requiredExerciseIds=[mandatory.id];
 r=inspect('pull',['Seated Cable Row'],must);
 assert(r.findings.some(x=>x.type==='required_exercise_absent'&&x.exerciseId===mandatory.id),
  'Explicit required named exercise absence is a hard conflict');
 assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})'),before,
  'The audit and generated fixtures must never modify saved workouts');
 const report={version:'phase2-read-only',baselineVersion:'0.93.4',tested:results.length,
  generated:results.filter(x=>x.generated).length,totalDays:results.reduce((n,r)=>n+(r.days||0),0),
  results};
 fs.mkdirSync('/tmp/swole-cat-coach-phase2',{recursive:true});
 fs.writeFileSync('/tmp/swole-cat-coach-phase2/projected-week-diagnostics.json',JSON.stringify(report,null,2)+'\n');
 console.log('COACH_PHASE2_MATRIX '+JSON.stringify(results.map(x=>({id:x.id,generated:x.generated,summary:x.summary,
  issues:(x.findings||[]).map(y=>({type:y.type,role:y.role||null,region:y.region||null,
   family:y.family||null,priority:y.priority||null,availability:y.availability||null}))}))));
 console.log('COACH_PHASE2_PASS '+JSON.stringify({scenarios:results.length,days:report.totalDays,
  goldenUnchanged:true,readOnly:true,shoulderPriorityProtected:true,limitedEquipmentRespected:true}));
}finally{dom.window.close()}
