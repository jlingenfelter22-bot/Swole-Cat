// Testing-only, nonvisual Coach program fast-path regression.
// Uses synthetic local DOM state; no Supabase, cloud identities, or production records.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const dom=new JSDOM(html,{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
  w.fetch=()=>Promise.reject(Error('Network intentionally disabled for Coach parser regression'));
 }
});
try{
 await new Promise(r=>setTimeout(r,140));
 const w=dom.window,doc=w.document,body=doc.getElementById('modalBody');
 const overview='3-day push pull legs Monday 30 minutes at the gym, Wednesday 45 minutes with dumbbells only, Friday 75 minutes at the gym, for muscle growth, track only';
 assert(w.coachParseProgramIntent(overview).isProgram);
 assert.equal(w.coachProgramNeedsFuzzyExerciseScan(overview),false,
   'plain program brief must not trigger approximate exercise-catalog scanning');
 assert.equal(w.coachProgramNeedsFuzzyExerciseScan('3-day split, include bench preas and sqauts'),true,
   'program with an explicitly requested exercise list must preserve typo matching');
 const oldUnderstand=w.coachUnderstandExercisePhrase;
 let fuzzyCalls=0;
 w.coachUnderstandExercisePhrase=function(...args){fuzzyCalls++;return oldUnderstand.apply(this,args)};
 const originalExplicit=w.coachParseExplicitWorkout;
 let routing=[];
 w.coachParseExplicitWorkout=function(text,goal,options){
   routing.push({text,allowFuzzy:options?.allowFuzzy!==false});
   return originalExplicit.apply(this,arguments);
 };
 try{
   body.innerHTML='<textarea id="coachPrompt"></textarea>';
   doc.getElementById('coachPrompt').value=overview;
   w.coachSubmitPrompt();
   assert.equal(body.querySelectorAll('.coach-program-day-card').length,3,'Coach must still create a complete 3-day program');
   assert.equal(routing[0]?.allowFuzzy,false,'modal Coach path must use program fast route');
   assert.equal(fuzzyCalls,0,'plain program overview must not trigger costly approximate exercise scans');
   assert.equal(w.eval('coachProgramBuildDraft.intent.trainingMode'),'track');
   assert.deepEqual(Array.from(w.eval('coachProgramBuildDraft.days.map(x=>x.request.duration)')),[30,45,75]);
   const preserved=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})');
   doc.body.insertAdjacentHTML('beforeend','<input id="homeCoachPrompt">');
   doc.getElementById('homeCoachPrompt').value=overview;
   w.homeCoachBuildPrompt();
   assert.equal(routing.at(-1)?.allowFuzzy,false,'Home launcher must use the same program fast route');
   assert.equal(fuzzyCalls,0,'Home launcher must not use unnecessary approximate matching either');
   assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})'),preserved,
     'preview and input parsing must never save or mutate local workout history');
   const e=w.coachParseExplicitWorkout('Do 5 x 5 deadlift in 20 minutes','strength');
   assert.equal(e.items.length,1,'explicit single-exercise prescriptions must still parse');
   assert(e.items[0].explicitSets,'explicit sets must survive');
   const banned=w.coachParseExplicitWorkout('legs workout, no barbell rows','hypertrophy',{allowFuzzy:false});
   assert(banned.excludedExerciseIds.length>0,'exact exercise exclusions survive the program fast route');
   assert(!banned.items.length,'excluded rows must not be treated as positive exercises');
   const before=fuzzyCalls;
   w.coachParseExplicitWorkout('bench preas and dumbbell curls','hypertrophy',{allowFuzzy:true});
   assert(fuzzyCalls>before,'fuzzy parsing must remain available when explicitly requested');
   const listPrompt='3-day split, include bench preas and sqauts';
   routing=[];
   doc.getElementById('coachPrompt')?.remove();
   body.innerHTML='<textarea id="coachPrompt"></textarea>';
   doc.getElementById('coachPrompt').value=listPrompt;
   w.coachSubmitPrompt();
   assert.equal(routing[0]?.allowFuzzy,true,'explicit exercise list in a program must preserve fuzzy name resolution');
 }finally{
   w.coachUnderstandExercisePhrase=oldUnderstand;
   w.coachParseExplicitWorkout=originalExplicit;
 }
 console.log('COACH_PROGRAM_FAST_PATH PASS '+JSON.stringify({
   standardProgramFuzzyCalls:0,entrypoints:2,correctDayDurations:true,
   explicitPrescriptionKept:true,negationKept:true,fuzzyClarificationPathKept:true
 }));
}finally{dom.window.close()}
