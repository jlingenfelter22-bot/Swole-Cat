// Coach time fidelity: protect movement coverage when time trimming generated plans.
// Synthetic-only DOM fixture, no live cloud/account/workout data touched.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.fetch=()=>Promise.reject(Error('Cloud/network calls forbidden by Coach test'));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
 }
});
try{
 await new Promise(r=>setTimeout(r,150));
 const w=dom.window,trace=[];
 const before=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})');
 function equipped(prompt,choice='gym',goal='hypertrophy'){
  const initial=w.coachParsePrompt(prompt,goal);
  const result=w.coachBrainApplyEquipmentChoice(initial,choice);
  assert(result.ok,JSON.stringify(result));
  return result.request;
 }
 const names=['Back Squat','Romanian Deadlift','Leg Extension','Seated Leg Curl'];
 const selected=names.map(name=>w.allExercises().find(ex=>ex.name===name));
 assert(selected.every(Boolean),'Known mixed knee/posterior gym movements must exist');
 const request=equipped('45 minute legs at a full gym');
 const defaults=w.coachProgrammingDefaults(request.goal,45);
 const full=w.coachBrainSessionTimeEstimate(selected,request,defaults);
 const twoSetOverride=Object.fromEntries(selected.map(ex=>[ex.id,{sets:2}]));
 const reduced=w.coachBrainSessionTimeEstimate(selected,request,defaults,{explicitConfigById:twoSetOverride});
 assert(full.estimateMinutes>reduced.estimateMinutes+1,
   'test fixture must have a meaningful set-reduction time saving');
 const target=Math.ceil((full.estimateMinutes+reduced.estimateMinutes)/2);
 assert(target<full.estimateMinutes&&target>=reduced.estimateMinutes);
 const shortened={...request,duration:target};
 const result=w.coachBrainTrimToTime(selected,shortened,defaults);
 assert(result.feasible,'generated legs should fit after modest set reductions');
 assert.equal(result.removed.length,0,'keep all knee/posterior exercise roles before deleting');
 assert.deepEqual(Array.from(result.exercises.map(x=>x.id)),Array.from(selected.map(x=>x.id)),
   'preserve original exercise order');
 assert(result.time.estimateMinutes<=target,'planned midpoint respects target');
 const cuts=selected.filter(ex=>result.setCounts[ex.id]?.sets);
 assert(cuts.length>0,'Coach must reduce generated sets rather than silently remove exercises');
 assert(cuts.every(ex=>{
  const natural=w.coachExercisePrescription(ex,shortened,defaults);
  return result.setCounts[ex.id].sets>=2&&result.setCounts[ex.id].sets<natural.sets;
 }),'never reduce an auto-generated prescription below two sets');
 assert(result.exercises.some(ex=>['squat','lunge','knee_extension'].includes(ex.pattern)));
 assert(result.exercises.some(ex=>['hinge','knee_flexion','hip_extension'].includes(ex.pattern)));
 trace.push({case:'gym-legs-cover-all-movements',target,full:full.estimateMinutes,shortened:result.time.estimateMinutes,
   sets:result.time.rows.map(x=>({id:x.id,sets:x.sets})),removed:result.removed});

 const required={...shortened,requiredExerciseIds:[selected[0].id]};
 const kept=w.coachBrainTrimToTime(selected,required,defaults);
 assert(kept.exercises.some(ex=>ex.id===selected[0].id),'explicitly required lift is kept');
 assert(!kept.setCounts[selected[0].id],'required lift must retain its full set prescription');
 const fullSets=w.coachExercisePrescription(selected[0],required,defaults).sets;
 assert.equal(kept.time.rows.find(x=>x.id===selected[0].id)?.sets,fullSets);

 const explicit={...shortened,prompt:'Leg session with 4 sets of 8 on squats'};
 const authored=w.coachBrainTrimToTime(selected,explicit,defaults);
 assert.equal(Object.keys(authored.setCounts).length,0,'user-specified sets never silently shortened');
 assert(authored.removed.length||!authored.feasible,'overbudget explicit sets remain transparent rather than auto-cut');

 // Intentionally infeasible plans must not be fabricated as meeting a clock deadline.
 const impossible={...request,duration:1,requiredExerciseIds:selected.map(ex=>ex.id)};
 const blocked=w.coachBrainTrimToTime(selected,impossible,defaults);
 assert.equal(blocked.feasible,false,'a one-minute mandatory workout cannot be advertised as feasible');
 assert.equal(blocked.exercises.length,selected.length);
 assert.equal(Object.keys(blocked.setCounts).length,0,'all mandatory prescriptions retained');

 // Real multi-day generator must still produce feasible, balanced programs.
 for(const [prompt,choice] of [
  ['3 day full body program 45 minutes','gym'],
  ['4 day upper lower program 35 minutes','dumbbells'],
  ['6 day push pull legs program 60 minutes','gym']
 ]){
  const req=equipped(prompt,choice);
  const intent=w.coachParseProgramIntent(prompt);
  const program=w.coachGenerateProgram(req,intent,null);
  assert(program,'known feasible program should still generate: '+prompt);
  for(const day of program.days){
   assert(day.brainTime&&day.brainTime.estimateMinutes<=day.request.duration,
     'day plan respects its individual duration: '+day.label);
   const emitted=w.coachProgramRoutineFromDay(day,program,'synthetic');
   for(const item of emitted.exercises){
    const timeRow=day.brainTime.rows.find(x=>x.id===item.exerciseId);
    assert.equal(item.sets,timeRow?.sets,'preview/time estimate/saved program must match');
   }
  }
  const review=w.coachBrainProgramWeekReview(program);
  assert(review.roles.press>0&&review.roles.pull>0&&review.roles.knee>0&&review.roles.posterior>0,
    'multi-day generation must retain whole-week pressing/pulling/knee/posterior roles');
  trace.push({case:prompt,days:program.days.length,roles:review.roles,
    mins:program.days.map(d=>d.brainTime.estimateMinutes)});
 }
 assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})'),before,
   'Coach planning must never modify actual training records');
 console.log('COACH_TIME_COVERAGE_PRIORITY PASS '+JSON.stringify({scenarios:trace.length,trace,realUserDataUntouched:true}));
}finally{dom.window.close()}
