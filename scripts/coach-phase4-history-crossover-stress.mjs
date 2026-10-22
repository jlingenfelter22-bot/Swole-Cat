// Swole Cat Phase 4: program changes and overlapping-program history acceptance.
// Read-only synthetic QA. This does not prescribe, edit, or save workouts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const NOW=Date.parse('2026-10-22T12:00:00Z');
const DAY=86400000;
const cases=[];
const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
  url:'https://swole-cat.test/',runScripts:'dangerously',pretendToBeVisual:true,
  beforeParse(w){
    w.localStorage.setItem('overload_v3',
      JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
    w.fetch=()=>Promise.reject(Error('Program review QA must not contact a network'));
    w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
  }
});
try{
  await new Promise(resolve=>setTimeout(resolve,220));
  const w=dom.window;
  if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
  const exercise=name=>{
    const value=w.allExercises().find(x=>x.name===name);
    assert(value,'Missing exercise '+name);return value.id;
  };
  const bench=exercise('Barbell Bench Press');
  const row=exercise('Barbell Row');
  const squat=exercise('Back Squat');
  const dbBench=exercise('Dumbbell Bench Press');
  const planned=(exerciseId,sets=3)=>({
    exerciseId,sets,minReps:8,maxReps:12,increment:5,
    mode:'double',progressionStrategy:'double'
  });
  const routines=[
    {id:'a',name:'Upper A',trainingMode:'guided',
      exercises:[planned(bench,3),planned(row,5)]},
    {id:'b',name:'Lower B',trainingMode:'guided',
      exercises:[planned(squat,4)]}
  ];
  const first={id:'first',name:'First Program',frequency:3,
    routineIds:['a','b'],preferredDays:[1,3,5],
    trainingMode:'guided',nextIndex:0};
  // Distinct Programs can deliberately use the SAME saved Routine IDs.
  const second={...first,id:'second',name:'Second Program',
    frequency:2,preferredDays:[2,4]};
  const completed=(exerciseId,sets=3)=>({
    exerciseId,sets:Array.from({length:sets},()=>({
      done:true,type:'working',weight:100,reps:8,rir:2
    }))
  });
  const log=(programId,ago,slot,options={})=>({
    id:'case-'+programId+'-'+ago+'-'+slot+'-'+(options.suffix||'ok'),
    programId,routineId:slot,routineName:slot==='a'?'Upper A':'Lower B',
    status:'finished',
    date:new Date(NOW-ago*DAY).toISOString(),
    programPhase:options.phase||'normal',
    exercises:options.empty?[]:
      slot==='a'?[completed(bench,3),completed(row,5)]:
      [completed(squat,4)]
  });
  const firstLogs=[log('first',27,'a'),log('first',20,'b'),
    log('first',13,'a'),log('first',6,'b')];
  const secondLogs=[27,24,20,17,13,10,6,3].map((ago,i)=>
    log('second',ago,i%2?'b':'a'));
  const inject=(sessions,programs=[first,second],currentRoutines=routines)=>{
    w.eval('state.sessions='+JSON.stringify(sessions)+';'+
      'state.programs='+JSON.stringify(programs)+';'+
      'state.routines='+JSON.stringify(currentRoutines)+';');
  };
  const report=id=>JSON.parse(JSON.stringify(
    w.coachPhase4ProgramComparison(id,NOW)));
  const immutable=()=>w.eval('JSON.stringify({sessions:state.sessions,'+
    'routines:state.routines,programs:state.programs,settings:state.settings})');
  const storage=w.localStorage.getItem('overload_v3');

  // 1. Attribution is by Program ID, even when two Programs use the same
  // Routine IDs. Neither side may inherit the other's completed sessions.
  inject([...firstLogs,...secondLogs]);
  let a=report('first'),b=report('second');
  assert.equal(a.sessions,4);
  assert.equal(b.sessions,8);
  assert.deepEqual(a.slots.map(x=>x.count),[2,2]);
  assert.deepEqual(b.slots.map(x=>x.count),[4,4]);
  assert(a.candidates.some(x=>x.kind==='schedule_gap'));
  assert(!b.candidates.some(x=>x.kind==='schedule_gap'));
  cases.push({id:'shared_routines_distinct_program_history',
    firstCount:a.sessions,secondCount:b.sessions,isolated:true});

  // 2. Reordering today's Program changes the display order, not historic
  // routine attribution or the completed-session counts.
  const reordered={...first,routineIds:['b','a']};
  inject([...firstLogs,...secondLogs],[reordered,second]);
  a=report('first');
  assert.deepEqual(a.slots.map(x=>x.routineId),['b','a']);
  assert.deepEqual(a.slots.map(x=>x.count),[2,2]);
  assert.equal(a.sessions,4);
  cases.push({id:'program_routine_reorder_id_stable',passed:true});

  // 3. If a Routine was REMOVED from today's saved Program, old sessions
  // using that slot cannot be presented as today's missing slot or rotation.
  const onlyLower={...first,routineIds:['b'],frequency:1};
  inject([...firstLogs,...secondLogs],[onlyLower,second]);
  a=report('first');
  assert.equal(a.sessions,2);
  assert.deepEqual(a.slots.map(x=>x.routineId),['b']);
  assert(!a.candidates.some(x=>x.kind==='rotation_gap'));
  cases.push({id:'removed_current_slot_not_reassigned',passed:true});

  // 4. Material exercise-list edits cannot be compared as if today's
  // prescription existed across the entire historical observation window.
  const altered=[{...routines[0],name:'Updated Upper A',
    exercises:[planned(bench),planned(squat),planned(dbBench)]},routines[1]];
  const recent=[27,20,13,6].map(ago=>log('first',ago,'a'));
  inject([...recent,...secondLogs],[first,second],altered);
  a=report('first');
  assert.equal(a.sessions,4);
  assert(!a.candidates.some(x=>x.kind==='execution_gap'),
    'Historic workouts with less than 60% current exercise identity '+
    'must not trigger an execution shortfall');
  assert.equal(a.slots[0].name,'Updated Upper A');
  cases.push({id:'edited_routine_identity_gate',passed:true});

  // 5. Date, deload, incomplete-session and unrelated-Program exclusions
  // must still hold when the present-day Program has changed.
  const filtered=[...firstLogs,
    log('first',32,'a',{suffix:'old'}),
    log('first',-2,'b',{suffix:'future'}),
    log('first',15,'a',{phase:'deload',suffix:'deload'}),
    log('first',9,'a',{empty:true,suffix:'blank'}),
    ...secondLogs];
  inject(filtered);
  a=report('first');b=report('second');
  assert.equal(a.sessions,4);
  assert.equal(b.sessions,8);
  assert.equal(a.slots.reduce((n,x)=>n+x.count,0),a.sessions);
  assert(a.candidates.every(x=>x.action==='review_only'&&x.writesAllowed===false));
  cases.push({id:'filtered_history_and_user_review_only',passed:true});

  // 6. Deliberately changing a frequency or the planned number of sets
  // without retaining historical plan snapshots is not independently
  // date-verifiable. Capture the observation, do not claim a proven lapse.
  const largerSets=[{...routines[0],
    exercises:[planned(bench,8),planned(row,8)]},routines[1]];
  inject([...recent,...secondLogs],[{...first,frequency:4},second],largerSets);
  a=report('first');
  cases.push({id:'frequency_and_set_target_drift_observation_only',
    caveat:'No effective-date plan snapshot exists in this review',
    candidateKinds:a.candidates.map(x=>x.kind),
    mustNotBePresentedAsVerifiedPastTarget:true});

  // 7. Display, dismiss and reopen remain opt-in, ephemeral, and isolated.
  inject([...firstLogs,...secondLogs]);
  const before=immutable();
  assert(w.openCoachPhase4ProgramReview('first'));
  const body=w.document.getElementById('modalBody');
  assert(body.textContent.includes('First Program'));
  assert(body.textContent.includes('Completed sessions by Routine'));
  assert(body.textContent.includes('Review Training History')===false);
  const candidate=report('first').candidates[0];
  assert(candidate,'Need a synthetic optional review to test dismissal');
  assert(w.coachPhase4ProgramReviewDismiss('first',candidate.id));
  assert(!body.querySelector('[data-coach-phase4-candidate="'+candidate.id+'"]'));
  assert(w.openCoachPhase4ProgramReview('first'));
  assert(body.querySelector('[data-coach-phase4-candidate="'+candidate.id+'"]'));
  assert.equal(immutable(),before,'Review UI must never save workouts');
  assert.equal(w.localStorage.getItem('overload_v3'),storage,
    'Review or dismissal must not persist');
  cases.push({id:'opt_in_dismiss_reopen_isolation',readOnly:true});

  fs.mkdirSync('/tmp/swole-cat-coach-phase4-crossover',{recursive:true});
  fs.writeFileSync('/tmp/swole-cat-coach-phase4-crossover/acceptance.json',
    JSON.stringify({date:'2026-10-22',baseVersion:'0.93.8',
      cases,readOnly:true,requiresDeviceAcceptance:true},null,2)+'\n');
  console.log('COACH_PHASE4_HISTORY_CROSSOVER_PASS '+JSON.stringify({
    scenarios:cases.length,programAttributionIsolated:true,
    routineReorderStable:true,removedSlotExcluded:true,
    materialRoutineEditFailClosed:true,savedDataUnchanged:true
  }));
}finally{dom.window.close()}
