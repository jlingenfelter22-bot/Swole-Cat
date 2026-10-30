
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
 }
});
await new Promise(resolve=>setTimeout(resolve,190));
const w=dom.window;
w.showToast=()=>{};w.openModal=()=>{};
const brain=w.SwoleCatRuntime.getService('brainKnowledge');
assert(brain&&brain.count===310);
const catalogCount=w.eval('LIBRARY.length');
assert.equal(catalogCount,310);
const beforeSessionCount=w.eval('state.sessions.length');
const beforeRoutineCount=w.eval('state.routines.length');
const beforeProgramCount=w.eval('state.programs.length');
const output=[];

function contextFor(prompt,choice,goal='hypertrophy'){
 let req=w.coachParsePrompt(prompt,goal);
 if(choice){
   const result=w.coachBrainApplyEquipmentChoice(req,choice);
   assert(result.ok,JSON.stringify({prompt,choice,result}));
   req=result.request;
 } else {
   const equipment=w.coachBrainExplicitEquipment(req);
   if(equipment)req.brainEquipment=equipment;
 }
 return req;
}
function exerciseRows(ids,request,defaults,setCounts={}){
 return ids.map(id=>{
   const ex=w.exById(id);
   const meta=w.exerciseMuscleMetadata(ex);
   const p=w.coachExercisePrescription(ex,request,defaults);
   const availability=brain.evaluateAvailability(id,w.coachBrainEquipmentConstraints(request)||{});
   return {
     id,name:ex?.name,pattern:ex?.pattern,equipment:ex?.equipment,
     primary:Array.from(meta.primary||[]),secondary:Array.from(meta.secondary||[]),
     prescription:{sets:setCounts?.[id]?.sets||p.sets,reps:[p.minReps,p.maxReps],restSec:p.restSeconds,goal:p.goal},
     availability:availability.status,
     technical:brain.getProfile(id)?.demand?.[0]||null
   }
 })
}
function single(label,prompt,choice,goal='hypertrophy'){
 const req=contextFor(prompt,choice,goal);
 let baseline=null;
 const baseReq={...req,brainEquipment:null,excludedMovementPatterns:[]};
 const baseOK=w.coachGenerateWorkout(baseReq);
 if(baseOK){
   const d=w.eval('coachBuildDraft');
   baseline={exercises:exerciseRows(d.selectedIds,d.request,d.defaults),
     time:w.coachBrainSessionTimeEstimate(d.selectedIds,d.request,d.defaults)};
 }
 const ok=w.coachGenerateWorkout(req);
 const d=ok?w.eval('coachBuildDraft'):null;
 const ex=ok?exerciseRows(d.selectedIds,d.request,d.defaults,d.brainSetCounts):[];
 const estimate=ok?(d.brainTime||w.coachBrainSessionTimeEstimate(d.selectedIds,d.request,d.defaults)):null;
 const result={type:'session',label,prompt,choice,goal,targetMinutes:req.duration,ok:!!ok,
   estimate:estimate?{mid:estimate.estimateMinutes,low:estimate.lowerMinutes,high:estimate.upperMinutes,
     warmup:estimate.warmupMinutes,overTarget:estimate.overTarget,
     perExercise:estimate.rows.map(z=>({name:z.name,work:z.workSeconds,rest:z.restTotalSeconds,setup:z.setupSeconds,sets:z.sets,restPerSet:z.restSeconds}))}:null,
   exercises:ex,baseline:baseline?{names:baseline.exercises.map(x=>x.name),duration:baseline.time.estimateMinutes}:null,
   removedByTime:d?.brainTimeRemoved||[],
   notes:[]};
 if(ok){
   if(estimate.estimateMinutes>Number(req.duration||9999))result.notes.push('time_mid_exceeds');
   if(estimate.upperMinutes>Number(req.duration||9999))result.notes.push('time_upper_exceeds');
   if(ex.some(z=>z.availability!=='available'))result.notes.push('unconfirmed_or_unavailable');
   if(ex.filter(z=>z.pattern==='hinge').length>=2)result.notes.push('multiple_hinges');
   if(ex.filter(z=>z.pattern==='squat').length>=2)result.notes.push('multiple_squats');
   if(ex.filter(z=>z.technical>=3.5).length>=1)result.notes.push('high_technical_complexity');
   if(req.targetKeys?.includes('legs')||req.targetKeys?.includes('lower body')){
      if(!ex.some(z=>['squat','lunge','knee_extension'].includes(z.pattern)))result.notes.push('no_knee_dominant');
      if(!ex.some(z=>['hinge','knee_flexion','hip_extension'].includes(z.pattern)))result.notes.push('no_posterior_leg');
   }
 }
 output.push(result);
 console.log('COACH_HUMAN_REVIEW '+JSON.stringify(result));
}
function program(label,prompt,choice,goal='hypertrophy'){
 const req=contextFor(prompt,choice,goal);
 const intent=w.coachParseProgramIntent(prompt);
 const ok=w.coachGenerateProgram(req,intent,null);
 const d=ok?w.eval('coachProgramBuildDraft'):null;
 const days=ok?d.days.map((day,i)=>{
   const ex=exerciseRows(day.selectedIds,day.request,day.defaults,day.brainSetCounts);
   const time=day.brainTime||w.coachBrainSessionTimeEstimate(day.selectedIds,day.request,day.defaults);
   const involved=ex.flatMap(z=>z.primary);
   return {number:i+1,focus:day.label,requested:day.request.duration,mid:time.estimateMinutes,low:time.lowerMinutes,high:time.upperMinutes,
     overTarget:time.overTarget,removed:day.brainTimeRemoved||[],
     exercises:ex,
     primaryRegions:[...new Set(involved)]};
 }):[];
 const weekly=ok?w.coachProgramWeeklyCoverage(d):{};
 const issues=[];
 if(!ok)issues.push('cannot_generate');
 for(const day of days){
   if(day.mid>day.requested)issues.push('day_'+day.number+'_over_target');
   if(day.high>day.requested)issues.push('day_'+day.number+'_upper_over_target');
   if(day.exercises.some(x=>x.availability!=='available'))issues.push('day_'+day.number+'_equipment');
   if(day.exercises.filter(x=>x.pattern==='hinge').length>=2)issues.push('day_'+day.number+'_overlapping_hinges');
   if(day.exercises.length===1)issues.push('day_'+day.number+'_single_exercise');
 }
 const report={type:'program',label,prompt,choice,goal,ok:!!ok,frequency:intent.frequency,split:intent.split,
   requested: req.duration,days,weekly,issues};
 output.push(report);
 console.log('COACH_HUMAN_REVIEW '+JSON.stringify(report));
}
single('30min gym legs','30 minute leg workout','gym');
single('45min gym legs','45 minute leg workout','gym');
single('30min dumbbell legs','30 minute leg workout','dumbbells');
single('30min floor legs','30 minute leg workout','bodyweight');
single('20min gym legs','20 minute leg workout','gym');
single('30min strength gym legs','30 minute leg strength workout','gym','strength');
single('45min gym back','45 minute back workout','gym');
single('60min advanced shoulder/arms','60 minute advanced shoulders and arms hypertrophy workout','gym');
single('45min dumbbell upper','45 minute upper body workout','dumbbells');
single('30min gym chest','30 minute chest workout','gym');
single('30min gym fullbody','30 minute full body workout','gym');
single('30min dumbbell fullbody','30 minute full body workout','dumbbells');
single('60min strength upper','60 minute strength upper body workout','gym','strength');
program('3day fullbody 45 gym','3 day full body program 45 minutes','gym');
program('4day upperlower 35 gym','4 day upper lower program 35 minutes','gym');
program('4day upperlower 35 dumbbells','4 day upper lower program 35 minutes','dumbbells');
program('5day balanced 45 gym','5 day balanced program 45 minutes','gym');
program('6day pushpulllegs 60 gym','6 day push pull legs program 60 minutes','gym');
program('3day fullbody 30 dumbbells','3 day full body program 30 minutes','dumbbells');
program('3day fullbody 30 floor','3 day full body program 30 minutes','bodyweight');

assert.equal(w.eval('state.sessions.length'),beforeSessionCount);
assert.equal(w.eval('state.routines.length'),beforeRoutineCount);
assert.equal(w.eval('state.programs.length'),beforeProgramCount);
console.log('COACH_HUMAN_REVIEW_SUMMARY '+JSON.stringify({scenarios:output.length,sessions:output.filter(x=>x.type==='session').length,programs:output.filter(x=>x.type==='program').length,
 sessionsGenerated:output.filter(x=>x.type==='session'&&x.ok).length,
 programsGenerated:output.filter(x=>x.type==='program'&&x.ok).length,
 programDays:output.filter(x=>x.type==='program'&&x.ok).reduce((a,b)=>a+b.days.length,0),
 flags:output.flatMap(x=>x.type==='session'?x.notes:x.issues).reduce((a,k)=>(a[k]=(a[k]||0)+1,a),{}),
 historyUntouched:true}));
dom.window.close();
