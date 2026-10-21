// Phase 4 checkpoint 2: opt-in Program review, realistic attributed sessions,
// selection/schedule separation, explicit agency and no real-data mutations.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.fetch=()=>Promise.reject(Error('Coach history review must not contact a network'));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
 }
});
const NOW=Date.parse('2026-10-21T12:00:00Z'),DAY=86400000;
const findings=[];
try{
 await new Promise(resolve=>setTimeout(resolve,220));
 const w=dom.window;
 const initialStore=w.localStorage.getItem('overload_v3');
 const find=name=>{const ex=w.allExercises().find(x=>x.name===name);assert(ex,'Missing catalog '+name);return ex.id};
 const bench=find('Barbell Bench Press'),row=find('Barbell Row'),squat=find('Back Squat');
 const planned=(exerciseId,sets=3)=>({exerciseId,sets,minReps:8,maxReps:12,
  increment:5,mode:'double',progressionStrategy:'double'});
 const routines=[
  {id:'a',name:'Upper A',trainingMode:'guided',exercises:[planned(bench,3),planned(row,5)]},
  {id:'b',name:'Lower B',trainingMode:'guided',exercises:[planned(squat,5)]}
 ];
 const program={id:'p',name:'Upper and Lower',routineIds:['a','b'],frequency:2,
  preferredDays:[1,2],trainingMode:'guided',nextIndex:0};
 const ds=ago=>new Date(NOW-ago*DAY).toISOString();
 const logged=(id,{skipped=false,sets=3}={})=>({exerciseId:id,skipped,
  sets:skipped?[]:Array.from({length:sets},()=>({done:true,type:'working',reps:8,weight:100,rir:2}))});
 const log=(ago,slot='a',{programId='p',phase='normal',noRow=false,
  skipRow=false,empty=false,foreignExercise=false}={})=>({
   id:'log-'+ago+'-'+slot,date:ds(ago),programId,programPhase:phase,
   routineId:slot,routineName:slot==='a'?'Upper A':'Lower B',status:'finished',
   exercises:empty?[]:slot==='a'?
    [logged(bench),...(foreignExercise?[]:[logged(row,{skipped:skipRow&&!noRow,sets:noRow?0:5})])]:
    [logged(squat,{sets:5})]
 });
 function inject(sessions,prog=program,rs=routines){
  // New references invalidate the derived-session cache by design.
  w.eval('state.routines='+JSON.stringify(rs)+';state.programs=['+JSON.stringify(prog)+'];state.sessions='+JSON.stringify(sessions)+';');
 }
 const report=()=>JSON.parse(JSON.stringify(w.coachPhase4ProgramComparison('p',NOW)));
 const compare=(id,list)=>{const a=report();findings.push({id,
   candidates:a?.candidates.map(x=>({kind:x.kind,id:x.id,title:x.title,evidence:x.evidence})),
   logged:a?.sessions,perWeek:a?.actualPerWeek,confidence:a?.confidence});
  assert.deepEqual(a.candidates.map(x=>x.kind),list,id+' candidate classes');return a;};
 inject([]);
 let empty=report();
 assert.equal(empty.confidence,'history_forming');
 assert.equal(empty.sessions,0);
 assert(!empty.candidates.some(x=>x.kind==='schedule_gap'));
 findings.push({id:'empty_program',confidence:empty.confidence});
 inject([log(9,'a'),log(4,'b')]);
 let sparse=report();
 assert.equal(sparse.confidence,'history_forming');
 assert(!sparse.candidates.some(x=>x.kind==='schedule_gap'),'Do not label a new Program as skipped');
 findings.push({id:'recent_new_program',logged:sparse.sessions});
 inject([log(27,'a'),log(20,'b'),log(13,'a'),log(6,'b')],{...program,frequency:3});
 let schedule=report();
 assert(schedule.candidates.some(x=>x.kind==='schedule_gap'),'Actual schedule gap must be distinguished from exercise choice');
 assert(!schedule.candidates.some(x=>x.kind==='rotation_gap'),'Balanced slots are not a rotation problem');
 assert(!schedule.candidates.some(x=>x.kind==='execution_gap'),'Completed all programmed movements');
 assert(schedule.candidates[0].detail.includes('not evidence that your exercise selection is wrong'));
 findings.push({id:'true_schedule_gap',rate:schedule.actualPerWeek,first:schedule.candidates[0].kind});
 const frequent=[27,24,21,18,15,12,9,6].map((d,i)=>log(d,i===7?'b':'a'));
 inject(frequent,program);
 let rotation=report();
 assert(!rotation.candidates.some(x=>x.kind==='schedule_gap'));
 assert(rotation.candidates.some(x=>x.kind==='rotation_gap'),'Seven A, one B should prompt a rotation review');
 assert(rotation.candidates.find(x=>x.kind==='rotation_gap').detail.includes('routine rotation'));
 findings.push({id:'rotation_not_design',candidate:rotation.candidates[0].kind,
  counts:rotation.slots.map(x=>x.count)});
 const normal=[27,24,20,17,13,10,6,3].map((d,i)=>log(d,i%2?'b':'a',
   {skipRow:i<=4&&i%2===0}));
 inject(normal);
 const execution=report();
 assert(!execution.candidates.some(x=>x.kind==='schedule_gap'));
 assert(!execution.candidates.some(x=>x.kind==='rotation_gap'));
 assert(execution.candidates.some(x=>x.kind==='execution_gap'),'3/4 Upper A logs with explicit missing Row should support review');
 assert(execution.candidates.find(x=>x.kind==='execution_gap').detail.includes('Routine may have changed'));
 findings.push({id:'completed_day_execution_gap',evidence:execution.candidates.find(x=>x.kind==='execution_gap').evidence});
 // Unfinished movement logs can be a neutral data-completeness issue.
 // They must NEVER be described as an explicitly skipped movement.
 const unlogged=normal.map(s=>({...s,exercises:s.exercises.map(e=>
  e.exerciseId===row?{...e,skipped:false,sets:[]}:e)}));
 inject(unlogged);
 let emptySets=report();
 assert(emptySets.candidates.every(c=>!/intentionally skipped|refused|avoided/.test(c.detail)));
 findings.push({id:'empty_set_not_motive',classes:emptySets.candidates.map(c=>c.kind)});
 // When today's Routine differs sharply from older session exercises,
 // don't blame the user or compare incompatible templates.
 const oldSessions=normal.map(s=>s.routineId!=='a'?s:{...s,exercises:[logged(bench)]});
 inject(oldSessions);
 assert(!report().candidates.some(x=>x.kind==='execution_gap'),'Changed Routine template should suppress mismatched execution');
 findings.push({id:'routine_version_drift',executionSignals:0});
 inject([log(27,'a',{phase:'deload'}),log(20,'a',{phase:'deload'}),log(13,'a',{phase:'deload'}),log(6,'a',{phase:'deload'})],{...program,frequency:3});
 assert(!report().candidates.some(x=>x.kind==='schedule_gap'),'Deloads should not be labeled missed workouts');
 findings.push({id:'deload_only',sessions:report().sessions});
 inject([log(27,'a',{programId:'other'}),log(20,'a',{programId:'other'}),log(13,'a',{programId:'other'})]);
 assert.equal(report().sessions,0,'Must not mix same-Routine sessions from another Program');
 findings.push({id:'cross_program_separation',sessions:0});
 inject(normal,program);
 const before=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs,settings:state.settings})');
 const plan=report();
 assert(plan.candidates.every(x=>x.writesAllowed===false&&x.action==='review_only'));
 assert(plan.requiresUserReview&&plan.noAutomaticChanges);
 assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs,settings:state.settings})'),before);
 const audit=w.coachProgramAudit('p');
 assert(audit);
 w.renderCoachProgramAudit(audit);
 assert.match(w.document.getElementById('modalBody').textContent,/Review Training History/i);
 assert(w.openCoachPhase4ProgramReview('p'));
 const body=w.document.getElementById('modalBody');
 assert.match(body.textContent,/COACH \/\/ TRAINING REVIEW/);
 assert.match(body.textContent,/Keep as is/);
 const initial=report().candidates[0];
 assert(w.coachPhase4ProgramReviewDismiss('p',initial.id));
 assert(!body.querySelector('[data-coach-phase4-candidate="'+initial.id+'"]'),
   'Dismiss should hide the card without modifying data');
 assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs,settings:state.settings})'),before);
 assert.equal(w.localStorage.getItem('overload_v3'),initialStore,'Reviewing or dismissing wrote to localStorage');
 assert(!w.coachPhase4ProgramReviewDismiss('p','fabricated:other'),'Must ignore forged candidate action');
 assert(!w.coachPhase4ProgramReviewAction('p','fabricated:other'),'Forged edit must not run');
 assert(w.openCoachPhase4ProgramReview('p'));
 assert(body.querySelector('[data-coach-phase4-candidate="'+initial.id+'"]'),
  'Reopening a review should allow exploring previously dismissed advice');
 assert(w.coachPhase4ProgramReviewAction('p',initial.id));
 assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs,settings:state.settings})'),before,
  'Entering manual editor must not auto-save a recommendation');
 assert.equal(w.localStorage.getItem('overload_v3'),initialStore);
 findings.push({id:'opt_in_display_dismiss_reopen_manual_review',noSavedChanges:true});
 fs.mkdirSync('/tmp/swole-cat-coach-phase4-program',{recursive:true});
 fs.writeFileSync('/tmp/swole-cat-coach-phase4-program/review-evidence.json',
  JSON.stringify({scenarios:findings,readOnly:true,planChanges:0},null,2)+'\n');
 console.log('COACH_PHASE4_PROGRAM_MATRIX '+JSON.stringify(findings));
 console.log('COACH_PHASE4_PROGRAM_PASS '+JSON.stringify({
  scenarios:findings.length,scheduleSeparated:true,rotationSeparated:true,
  inSessionDifferenceConservative:true,deloadExcluded:true,otherProgramExcluded:true,
  incompleteLogsNotCalledSkips:true,selectionNoAutofix:true,
  optionalDismissAndReopen:true,noSavedOrStorageChanges:true}));
}finally{dom.window.close()}
