import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const DAY=86400000;
const now=Date.now();
const start=now-84*DAY;
const at=(week,day=1)=>new Date(start+(((week-1)*7)+day)*DAY).toISOString();
const refAt=week=>start+(week*7)*DAY-1000;
const report=[];
const say=(persona,checkpoint,detail)=>{const row={persona,checkpoint,detail};report.push(row);console.log('[BATTLE]',persona,'|',checkpoint,'|',detail)};

const dom=new JSDOM(html,{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(window){
  window.localStorage.setItem('overload_v3',JSON.stringify({
   ui:{onboardingDone:true,haptics:false,keepAwake:false},
   settings:{defaultMin:8,defaultMax:12,defaultSets:3,defaultIncrement:5,coachAliases:{}},
   profile:{name:'Battle Test',unit:'lb'},routines:[],programs:[],sessions:[],exercisePreferences:{}
  }));
  window.alert=()=>{};window.confirm=()=>true;window.scrollTo=()=>{};
 }
});
await new Promise(r=>setTimeout(r,180));
const w=dom.window;
if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};

const pick=(...names)=>{
 for(const name of names){const ex=w.allExercises().find(x=>x.name===name);if(ex)return ex}
 return null;
};
const bench=pick('Barbell Bench Press');
const squat=pick('Back Squat');
const row=pick('Barbell Row','Seated Cable Row','Cable Row');
const rdl=pick('Romanian Deadlift');
const curl=pick('Barbell Curl','EZ-Bar Curl');
assert(bench&&squat&&row&&rdl&&curl,'battle suite requires staple exercise fixtures');

const sets=(weight,reps,rir=2,count=3,roles=[])=>Array.from({length:count},(_,i)=>({
 weight,reps,rir,done:true,type:'working',pr:'',role:roles[i]||'working'
}));
const topBackoffSets=(topWeight,topReps,rir=1,backoffPct=.9)=>[
 {weight:topWeight,reps:topReps,rir,done:true,type:'working',pr:'',role:'top'},
 ...Array.from({length:3},()=>({weight:Math.round(topWeight*backoffPct/5)*5,reps:6,rir:2,done:true,type:'working',pr:'',role:'backoff'}))
];
const cfg=(exerciseId,{sets:count=3,min=8,max=12,goal='hypertrophy',strategy='double',adaptive=true,structure=null,rest=120}={})=>({
 exerciseId,sets:count,minReps:min,maxReps:max,increment:5,mode:'double',
 progressionStrategy:strategy,adaptiveProgression:adaptive,setStructure:structure,
 trainingGoal:goal,restSeconds:rest
});
const session=(id,date,routine,programId,exercises)=>({
 id,date,routineId:routine?.id||null,routineName:routine?.name||'Synthetic',
 programId:programId||null,status:'finished',durationMinutes:50,
 exercises:exercises.map(x=>({exerciseId:x.exerciseId,sets:x.sets,notes:'',skipped:false}))
});
const reset=(routines=[],programs=[],sessions=[],activeProgramId=null)=>{
 w.eval('state.routines='+JSON.stringify(routines)+';state.programs='+JSON.stringify(programs)+';state.sessions='+JSON.stringify(sessions)+';state.activeProgramId='+JSON.stringify(activeProgramId)+';state.activeWorkout=null;state.exercisePreferences={};save()');
};
const stateSnapshot=()=>JSON.stringify({
 routines:JSON.parse(w.localStorage.getItem('overload_v3')).routines,
 programs:JSON.parse(w.localStorage.getItem('overload_v3')).programs,
 sessions:JSON.parse(w.localStorage.getItem('overload_v3')).sessions
});
const historyUntil=(rows,week)=>rows.filter(s=>new Date(s.date).getTime()<=refAt(week));

function checkpointProfile(persona,rows,exerciseId,week,expected){
 reset([],[],historyUntil(rows,week));
 const p=w.coachMultiWeekExerciseProfile(exerciseId,refAt(week));
 if(expected instanceof RegExp)assert.match(p.status,expected,persona+' week '+week+' unexpected profile '+p.status);
 else if(Array.isArray(expected))assert(expected.includes(p.status),persona+' week '+week+' unexpected profile '+p.status);
 else assert.equal(p.status,expected,persona+' week '+week+' unexpected profile');
 say(persona,'week '+week,'status='+p.status+' exposures='+p.exposures+' change='+Math.round((p.changePct||0)*1000)/10+'%');
 return p;
}

// ---------------------------------------------------------------------------
// 1) Persona / prompt torture: vague beginner through expert shorthand.
// ---------------------------------------------------------------------------
reset();
const promptCases=[
 {name:'beginner-vague',prompt:"im brand new and honestly dont know what im doing, just give me a simple 30 min full body workout",goal:'hypertrophy',level:'beginner',target:'full body',maxExercises:5},
 {name:'beginner-dumbbells',prompt:"never lifted before, dumbells only, 45 min full body",goal:'hypertrophy',level:'beginner',target:'full body',equipment:'dumbbell',maxExercises:5},
 {name:'beginner-slang',prompt:"newbie here wanna get bigger guns n shoulders, like 30 mins",goal:'hypertrophy',level:'beginner',target:'arms',maxExercises:5},
 {name:'intermediate-normal',prompt:"i have some lifting experience, 45 minute chest and back hypertrophy workout",goal:'hypertrophy',level:'intermediate',target:'chest'},
 {name:'intermediate-no-barbell',prompt:"some lifting experience, 45 min upper body, no barbells, mostly back",goal:'hypertrophy',level:'intermediate',target:'upper body'},
 {name:'advanced-strength',prompt:"seasoned lifter, heavy bench strength session, top set 3-5 @8 then 3 backoffs 6-8 at 90%, 3 min rest",goal:'strength',level:'advanced',explicitExercise:'Barbell Bench Press',topBackoff:true},
 {name:'advanced-shorthand',prompt:"advanced pull day. dl top single-ish? actually 3-5 reps @8, 3x6-8 backdowns 85%, 180s",goal:'strength',level:'advanced',target:'pull',topBackoff:true},
 {name:'typo-ppl',prompt:"6 day ppl prgram 45 mins hypertrofy no barbels",program:true,frequency:6,split:'ppl'},
 {name:'upper-lower',prompt:"4x a week upper/lower, intermediate, 50 minute sessions",program:true,frequency:4,split:'upper_lower'},
 {name:'full-body-plan',prompt:"rookie, three times a week full body plan monday wednesday friday",program:true,frequency:3,split:'full_body'},
];
for(const c of promptCases){
 if(c.program){
  const intent=w.coachParseProgramIntent(c.prompt);
  assert.equal(intent.frequency,c.frequency,c.name+' frequency');
  assert.equal(intent.split,c.split,c.name+' split');
  const req=w.coachParsePrompt(c.prompt,'hypertrophy');
  const generated=w.coachGenerateProgram(req,intent);
  assert(generated&&generated.days.length===c.frequency,c.name+' program generation');
  say(c.name,'prompt','program '+c.frequency+'d '+c.split+' generated');
  continue;
 }
 const req=w.coachParsePrompt(c.prompt,c.goal);
 assert.equal(req.goal,c.goal,c.name+' goal');
 if(c.level)assert.equal(req.experienceLevel,c.level,c.name+' experience');
 if(c.target)assert(req.targetKeys.includes(c.target),c.name+' target '+c.target+' missing: '+req.targetKeys.join(','));
 let draft=null;
 if(c.explicitExercise){
  const explicit=w.coachParseExplicitWorkout(c.prompt,req.goal);
  const ex=w.allExercises().find(x=>x.name===c.explicitExercise);
  assert(ex,'battle explicit fixture missing '+c.explicitExercise);
  assert(explicit.items.some(item=>item.exerciseId===ex.id),c.name+' explicit exercise was not understood');
  draft=w.coachGenerateExplicitWorkout(req,explicit);
  assert(draft?.explicitPrescription,c.name+' did not enter explicit-workout mode');
  assert(draft.selectedIds.includes(ex.id),c.name+' explicit-workout draft lost the requested exercise');
 }else{
  draft=w.coachGenerateWorkout(req);
  assert(draft?.intelligenceAudit?.pass,c.name+' end-to-end generation failed intelligence audit');
 }
 if(c.equipment)assert(w.coachParseEquipment(c.prompt).allowed.includes(c.equipment),c.name+' equipment');
 if(c.topBackoff){
  assert.equal(w.coachParseLiftingGrammar(c.prompt).topBackoff?.enabled,true,c.name+' top/backoff grammar');
  const targetEx=c.explicitExercise?w.allExercises().find(x=>x.name===c.explicitExercise):w.exById(draft.selectedIds[0]);
  const prescription=w.coachExercisePrescription(targetEx,req,w.coachProgrammingDefaults(req.goal,req.duration||45));
  assert.equal(prescription.progressionStrategy,'top_backoff',c.name+' explicit top/backoff grammar did not reach prescription logic');
 }
 if(c.maxExercises)assert(draft.selectedIds.length<=c.maxExercises,c.name+' beginner plan too large');
 say(c.name,'prompt',(c.explicitExercise?'explicit ':'generated ')+draft.selectedIds.length+' exercise'+(draft.selectedIds.length===1?'':'s')+'; goal='+req.goal+' level='+(req.experienceLevel||'unspecified'));
}

// Routing collisions and ambiguity must stay deterministic.
assert.equal(w.coachHistoryQuestionIntent('what did I bench last time?').handled,true);
assert.equal(w.coachProgramAuditIntent('what did I bench last time?').handled,false);
assert.equal(w.coachProgramAuditIntent('audit my program').handled,true);
assert.equal(w.coachHistoryQuestionIntent('audit my program').handled,false);
assert.equal(w.coachProgramAuditIntent('build me a 4 day program').handled,false);
assert.equal(w.coachTryHistoryQuestion('bench press workout 45 minutes',{render:false}),false);
const vague=w.coachParsePrompt("i dunno what i wanna hit, just wanna move around for a bit",'general');
assert.equal(vague.targetRegions.length,0,'vague user must not receive an invented body-part target');
say('routing','prompt','history/build/audit collisions stayed separated; vague prompt invented no target');

// Brand-new advanced user can ask for top/backoff, but Coach still cannot invent load.
reset();
const newReq={...w.coachParsePrompt('advanced strength chest workout, top set 3-5 then 3 backoffs 6-8 at 90%','strength'),referenceDate:new Date(now).toISOString()};
const newP=w.coachExercisePrescription(bench,newReq,w.coachProgrammingDefaults('strength',60));
const newConfig={...newP,increment:5,mode:'double',routineMode:'strength',trainingGoal:'strength',adaptiveProgression:true};
const noHistoryRec=w.buildRecommendation(newConfig,null,bench.id);
assert.equal(noHistoryRec.status,'baseline');
assert(noHistoryRec.weights.every(x=>x===0),'Coach invented a starting load for a lifter with no history');
say('advanced-new','baseline','top/backoff structure allowed; starting load remained user-supplied');

// ---------------------------------------------------------------------------
// 2) Beginner, 12 weeks, 3x full body, rapid but plausible progression.
// ---------------------------------------------------------------------------
const beginnerRoutine={id:'beg_fb',name:'Beginner Full Body',trainingMode:'guided',exercises:[
 cfg(bench.id,{min:8,max:12}),cfg(squat.id,{min:8,max:12}),cfg(row.id,{min:8,max:12})
]};
const beginnerProgram={id:'beg_prog',name:'Beginner 3-Day Full Body',routineIds:[beginnerRoutine.id],frequency:3,preferredDays:[1,3,5],trainingMode:'inherit',nextIndex:0};
const beginnerSessions=[];
for(let week=1;week<=12;week++){
 const benchW=65+(week-1)*5,squatW=85+(week-1)*5,rowW=60+(week-1)*5;
 for(const day of [1,3,5])beginnerSessions.push(session('beg_'+week+'_'+day,at(week,day),beginnerRoutine,beginnerProgram.id,[
  {exerciseId:bench.id,sets:sets(benchW,8+(day===5?1:0),3)},
  {exerciseId:squat.id,sets:sets(squatW,8,3)},
  {exerciseId:row.id,sets:sets(rowW,10,3)}
 ]));
}
for(const week of [4,8,12]){
 const p=checkpointProfile('beginner-fast',beginnerSessions,bench.id,week,'progressing');
 const req={...w.coachParsePrompt("im a beginner chest workout",'hypertrophy'),referenceDate:new Date(refAt(week)).toISOString()};
 const d=w.coachAdaptiveProgressionDecision(bench,req);
 assert.equal(d.action,'continue_progression','fast beginner should keep progressing at week '+week);
}
reset([beginnerRoutine],[beginnerProgram],beginnerSessions,beginnerProgram.id);
let hist=w.coachHistoryAnswer('how is my bench progressing?');
assert.equal(hist.type,'exercise_progress');assert.match(hist.answer,/trending up/i);
let audit=w.coachProgramAudit(beginnerProgram.id);
assert(!audit.findings.some(x=>x.type==='adherence'),'3x/week beginner should not be flagged for adherence');
say('beginner-fast','week 12','history Q&A and Program Audit agree: progressing with target adherence');

// ---------------------------------------------------------------------------
// 3) Intermediate upper/lower, slow progress. Never turn slow progress into stall.
// ---------------------------------------------------------------------------
const upper={id:'int_u',name:'Upper',trainingMode:'guided',exercises:[cfg(bench.id),cfg(row.id)]};
const lower={id:'int_l',name:'Lower',trainingMode:'guided',exercises:[cfg(squat.id),cfg(rdl.id)]};
const intProgram={id:'int_prog',name:'Intermediate Upper Lower',routineIds:[upper.id,lower.id],frequency:4,preferredDays:[1,2,4,5],trainingMode:'inherit',nextIndex:0};
const intSessions=[];
for(let week=1;week<=12;week++){
 const phase=Math.floor((week-1)/3),bw=155+phase*5,sw=205+phase*5;
 intSessions.push(session('iu1_'+week,at(week,1),upper,intProgram.id,[{exerciseId:bench.id,sets:sets(bw,8,2)},{exerciseId:row.id,sets:sets(130+phase*5,10,2)}]));
 intSessions.push(session('il1_'+week,at(week,2),lower,intProgram.id,[{exerciseId:squat.id,sets:sets(sw,6,2)},{exerciseId:rdl.id,sets:sets(185+phase*5,8,2)}]));
 intSessions.push(session('iu2_'+week,at(week,4),upper,intProgram.id,[{exerciseId:bench.id,sets:sets(bw,9,2)},{exerciseId:row.id,sets:sets(130+phase*5,10,2)}]));
 intSessions.push(session('il2_'+week,at(week,5),lower,intProgram.id,[{exerciseId:squat.id,sets:sets(sw,6,2)},{exerciseId:rdl.id,sets:sets(185+phase*5,8,2)}]));
}
for(const week of [4,8,12]){
 const p=checkpointProfile('intermediate-slow',intSessions,bench.id,week,['progressing','consolidating']);
 assert(!['plateau_high_effort','performance_dip'].includes(p.status),'slow intermediate progress misread at week '+week);
}
reset([upper,lower],[intProgram],intSessions,intProgram.id);
audit=w.coachProgramAudit(intProgram.id);
assert(!audit.findings.some(x=>x.type==='adherence'),'consistent 4-day intermediate Program should not be low adherence');
say('intermediate-slow','week 12','slow progress remained progress/consolidation, not a false stall');

// ---------------------------------------------------------------------------
// 4) Advanced strength, early progress followed by a genuine high-effort stall.
// ---------------------------------------------------------------------------
const advancedStructure={type:'top_backoff',topSets:1,backoffSets:3,backoffPercent:90,topMinReps:3,topMaxReps:5,backoffMinReps:6,backoffMaxReps:8};
const advBenchCfg=cfg(bench.id,{count:4,min:3,max:8,goal:'strength',strategy:'top_backoff',adaptive:true,structure:advancedStructure,rest:180});
const advRoutine={id:'adv_b',name:'Bench Strength',trainingMode:'strength',exercises:[advBenchCfg,cfg(row.id,{min:6,max:8,goal:'strength'})]};
const advProgram={id:'adv_prog',name:'Advanced Bench Block',routineIds:[advRoutine.id],frequency:2,preferredDays:[1,4],trainingMode:'strength',nextIndex:0};
const advSessions=[];
for(let week=1;week<=12;week++){
 const progressing=week<=8;
 const top=progressing?225+(week-1)*5:260;
 for(const day of [1,4])advSessions.push(session('adv_'+week+'_'+day,at(week,day),advRoutine,advProgram.id,[
  {exerciseId:bench.id,sets:topBackoffSets(top,5,week>=9?1:2,.90)},
  {exerciseId:row.id,sets:sets(165+Math.min(week,8)*5,6,2)}
 ]));
}
checkpointProfile('advanced-stall',advSessions,bench.id,4,'progressing');
checkpointProfile('advanced-stall',advSessions,bench.id,8,'progressing');
const advFinal=checkpointProfile('advanced-stall',advSessions,bench.id,12,'plateau_high_effort');
assert(advFinal.highEffort);
reset([advRoutine],[advProgram],advSessions,advProgram.id);
const advReq={...w.coachParsePrompt('advanced strength chest workout','strength'),referenceDate:new Date(now).toISOString()};
const advDecision=w.coachAdaptiveProgressionDecision(bench,advReq);
assert.equal(advDecision.action,'hold_or_small_reset');
const advRec=w.buildRecommendation({...advBenchCfg,routineMode:'strength'},w.previousExercise(bench.id),bench.id);
assert.equal(advRec.status,'adaptive_hold','genuine advanced stall should hold, not force load');
hist=w.coachHistoryAnswer('has my bench stalled?');
assert.equal(hist.status,'plateau_high_effort');
audit=w.coachProgramAudit(advProgram.id);
assert(audit.findings.some(x=>x.type==='plateau_high_effort'&&x.exerciseId===bench.id),'Program Audit missed the same bench stall seen by history intelligence');
say('advanced-stall','week 12','adaptive engine, history Q&A, and Program Audit all agree on high-effort plateau');

// ---------------------------------------------------------------------------
// 5) Temporary dip then rebound. Coach may react to the dip, but must recover.
// ---------------------------------------------------------------------------
const dipRoutine={id:'dip_r',name:'Deadlift Day',trainingMode:'strength',exercises:[cfg(rdl.id,{min:5,max:5,goal:'strength',strategy:'load_first',adaptive:true,rest:180})]};
const dipSessions=[];
const dipLoads=[185,195,205,215,225,235,245,255,225,260,265,270];
for(let week=1;week<=12;week++)dipSessions.push(session('dip_'+week,at(week,2),dipRoutine,null,[{exerciseId:rdl.id,sets:sets(dipLoads[week-1],5,week===9?1:2)}]));
checkpointProfile('dip-rebound',dipSessions,rdl.id,8,'progressing');
const dipP=checkpointProfile('dip-rebound',dipSessions,rdl.id,9,'performance_dip');
assert(dipP.latestE1<dipP.bestE1);
const rebound=checkpointProfile('dip-rebound',dipSessions,rdl.id,12,['progressing','consolidating']);
assert.notEqual(rebound.status,'performance_dip','Coach stayed stuck on an old one-session dip after rebound');
reset([dipRoutine],[],dipSessions);
hist=w.coachHistoryAnswer('how is my romanian deadlift progressing?');
assert(!/performance dip/i.test(hist.answer),'final history answer should not keep diagnosing the recovered dip');
say('dip-rebound','week 12','one bad week was recognized, then cleared after a real rebound');

// ---------------------------------------------------------------------------
// 6) Inconsistent PPL: descriptive adherence + skipped slot, never causal blame.
// ---------------------------------------------------------------------------
const push={id:'ppl_push',name:'Push',trainingMode:'guided',exercises:[cfg(bench.id),cfg(curl.id)]};
const pull={id:'ppl_pull',name:'Pull',trainingMode:'guided',exercises:[cfg(row.id),cfg(curl.id)]};
const legs={id:'ppl_legs',name:'Legs',trainingMode:'guided',exercises:[cfg(squat.id),cfg(rdl.id)]};
const ppl={id:'ppl_prog',name:'PPL Reality Check',routineIds:[push.id,pull.id,legs.id],frequency:3,preferredDays:[1,3,5],trainingMode:'inherit',nextIndex:0};
const pplSessions=[];
for(let week=1;week<=12;week++){
 pplSessions.push(session('pp_'+week,at(week,1),push,ppl.id,[{exerciseId:bench.id,sets:sets(135+week*2.5,8,2)},{exerciseId:curl.id,sets:sets(55,10,2)}]));
 if(week%2===0)pplSessions.push(session('pl_'+week,at(week,4),pull,ppl.id,[{exerciseId:row.id,sets:sets(120+week*2.5,8,2)},{exerciseId:curl.id,sets:sets(55,10,2)}]));
}
reset([push,pull,legs],[ppl],pplSessions,ppl.id);
const beforeAudit=stateSnapshot();
audit=w.coachProgramAudit(ppl.id);
assert(audit.findings.some(x=>x.type==='adherence'),'inconsistent Program should surface below-target completion pattern');
assert(audit.findings.some(x=>x.type==='slot_gap'&&x.routineId===legs.id),'repeatedly uncompleted legs slot should be underrepresented');
assert(audit.findings.some(x=>x.type==='actual_coverage_gap'&&x.groupKey==='lower body'),'planned lower-body coverage should disagree with actual PPL history');
const auditText=audit.findings.map(x=>x.text).join(' ');
assert.match(auditText,/completion pattern|without assuming why|recent completed Program/i);
assert(!/\b(?:lazy|undisciplined|unmotivated|injured|overtrained)\b/i.test(auditText),'Program audit invented a causal/blaming diagnosis');
assert.equal(stateSnapshot(),beforeAudit,'Program audit mutated saved state');
const consistency=w.coachHistoryAnswer('how consistent have I been the last 4 weeks?');
assert.match(consistency.answer,/workouts per week/i);
say('inconsistent-ppl','week 12','low adherence + skipped legs surfaced descriptively with no mutation or causal blame');

// ---------------------------------------------------------------------------
// 7) Same-week dense flat work must not masquerade as a multi-week plateau.
// ---------------------------------------------------------------------------
const dense=[];
for(let d=1;d<=4;d++)dense.push(session('dense_'+d,new Date(now-(5-d)*DAY).toISOString(),{id:'dense_r',name:'Dense Week'},null,[{exerciseId:curl.id,sets:sets(60,10,1)}]));
reset([],[],dense);
const denseProfile=w.coachMultiWeekExerciseProfile(curl.id,now);
assert(!['plateau_high_effort','plateau_watch'].includes(denseProfile.status),'four clustered same-week exposures became a false multi-week plateau');
say('dense-week','4 exposures','flat high-effort work inside one week did not become a multi-week plateau');

// Final invariant: battle suite itself never mutates history through questions/audits.
const preQuestion=stateSnapshot();
w.coachHistoryAnswer('what did I barbell curl last time?');
assert.equal(stateSnapshot(),preQuestion,'history Q&A mutated saved state');

console.log('[BATTLE SUMMARY] personas='+new Set(report.map(x=>x.persona)).size+' checkpoints='+report.length);
for(const row of report)console.log('[BATTLE REPORT]',JSON.stringify(row));
console.log('Coach Swolecat v0.64 battle-hardening PASS: persona prompt torture + 12-week beginner/intermediate/advanced/dip/adherence simulations');
dom.window.close();
