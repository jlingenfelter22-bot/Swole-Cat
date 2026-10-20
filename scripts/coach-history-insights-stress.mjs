import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const now=Date.now(),isoDaysAgo=d=>new Date(now-d*86400000).toISOString();
const work=(weight,reps,rir=2,count=3)=>Array.from({length:count},()=>({weight,reps,rir,done:true,type:'working'}));
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,beforeParse(window){
 window.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false},settings:{defaultMin:8,defaultMax:12,defaultSets:3,defaultIncrement:5,coachAliases:{}},profile:{name:'History Test',unit:'lb'},routines:[],sessions:[]}));
 window.alert=()=>{};window.confirm=()=>true;window.scrollTo=()=>{};
}});
await new Promise(r=>setTimeout(r,180));
const w=dom.window;if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
const byName=name=>w.allExercises().find(x=>x.name===name);
const bench=byName('Barbell Bench Press'),squat=byName('Back Squat'),row=byName('Seated Cable Row')||byName('Cable Row'),curl=byName('Barbell Curl');
assert(bench&&squat&&row&&curl);

const routines=[
 {id:'push_r',name:'Push Day',trainingMode:'guided',exercises:[{exerciseId:bench.id,sets:3,minReps:5,maxReps:8,increment:5,mode:'double',adaptiveProgression:true,progressionStrategy:'double',setStructure:null,trainingGoal:'hypertrophy',restSeconds:120}]},
 {id:'legs_r',name:'Leg Day',trainingMode:'guided',exercises:[{exerciseId:squat.id,sets:3,minReps:5,maxReps:5,increment:5,mode:'double',adaptiveProgression:true,progressionStrategy:'load_first',setStructure:null,trainingGoal:'strength',restSeconds:180}]}
];
w.eval('state.routines='+JSON.stringify(routines)+';save()');

const sessions=[];
[135,145,155,165,175,185].forEach((load,i)=>sessions.push({id:'b'+i,routineId:'push_r',routineName:'Push Day',status:'finished',date:isoDaysAgo([42,35,28,21,14,7][i]),exercises:[{exerciseId:bench.id,sets:work(load,5,2),notes:''},{exerciseId:row.id,sets:work(120+i*5,8,2),notes:''}]}));
[28,21,14,7].forEach((days,i)=>sessions.push({id:'s'+i,routineId:'legs_r',routineName:'Leg Day',status:'finished',date:isoDaysAgo(days),exercises:[{exerciseId:squat.id,sets:work(225,5,1),notes:''}]}));
sessions.push({id:'recent',routineId:'push_r',routineName:'Push Day',status:'finished',date:isoDaysAgo(1),exercises:[{exerciseId:bench.id,sets:work(190,5,2),notes:''},{exerciseId:curl.id,sets:work(65,10,2),notes:''}]});
w.eval('state.sessions='+JSON.stringify(sessions)+';save()');

assert.equal(w.eval('COACH_HISTORY_INSIGHTS_VERSION'),'0.62.0');
let intent=w.coachHistoryQuestionIntent('what did I bench last time?');
assert.equal(intent.handled,true);assert.equal(intent.type,'exercise_last');
let answer=w.coachHistoryAnswer('what did I bench last time?');
assert.equal(answer.exerciseId,bench.id);assert.match(answer.answer,/190 lb × 5/i);assert.match(answer.answer,/1 day ago/i);

answer=w.coachHistoryAnswer('what is my bench press PR?');
assert.equal(answer.type,'exercise_best');assert.match(answer.answer,/190 lb × 5/i);

answer=w.coachHistoryAnswer('how is my bench progressing?');
assert.equal(answer.type,'exercise_progress');assert.equal(answer.exerciseId,bench.id);assert.match(answer.answer,/trending up/i);assert.match(answer.answer,/not a recovery or readiness diagnosis/i);

answer=w.coachHistoryAnswer('has my squat stalled?');
assert.equal(answer.type,'exercise_progress');assert.equal(answer.status,'plateau_high_effort');assert.match(answer.answer,/plateau/i);

answer=w.coachHistoryAnswer('what exercises are stalled?');
assert.equal(answer.type,'global_progress');assert.match(answer.answer,/Back Squat/i);

answer=w.coachHistoryAnswer('what am I progressing on?');
assert.equal(answer.type,'global_progress');assert.match(answer.answer,/Bench Press/i);

answer=w.coachHistoryAnswer('how consistent have I been the last 4 weeks?');
assert.equal(answer.type,'consistency');assert.match(answer.answer,/completed workout/i);assert.match(answer.answer,/workouts per week/i);

answer=w.coachHistoryAnswer('when did I last train legs?');
assert.equal(answer.type,'target_recency');assert.match(answer.answer,/7 days ago/i);

assert.equal(w.coachTryHistoryQuestion('bench press workout 45 minutes',{render:false}),false);
w.eval('coachBuildDraft=null');
assert.equal(w.coachTryHistoryQuestion('what did I bench last time?',{render:true}),true);
assert.equal(w.eval('coachBuildDraft'),null);
assert.match(w.document.getElementById('modalBody').textContent,/Last Barbell Bench Press/i);

const stale=[
 {id:'old_leg',routineId:'legs_r',routineName:'Leg Day',status:'finished',date:isoDaysAgo(20),exercises:[{exerciseId:squat.id,sets:work(225,5,2),notes:''}]},
 {id:'u1',routineId:'push_r',routineName:'Push Day',status:'finished',date:isoDaysAgo(10),exercises:[{exerciseId:bench.id,sets:work(175,5,2),notes:''},{exerciseId:row.id,sets:work(140,8,2),notes:''}]},
 {id:'u2',routineId:'push_r',routineName:'Push Day',status:'finished',date:isoDaysAgo(5),exercises:[{exerciseId:bench.id,sets:work(180,5,2),notes:''},{exerciseId:row.id,sets:work(145,8,2),notes:''}]},
 {id:'u3',routineId:'push_r',routineName:'Push Day',status:'finished',date:isoDaysAgo(1),exercises:[{exerciseId:bench.id,sets:work(185,5,2),notes:''},{exerciseId:row.id,sets:work(150,8,2),notes:''}]}
];
w.eval('state.sessions='+JSON.stringify(stale)+';save()');
answer=w.coachHistoryAnswer("what haven't I trained lately?");
assert.equal(answer.type,'neglected');assert.match(answer.answer,/Lower body/i);assert.equal(answer.targetKey,'lower body');
let insight=w.coachDeepHistoryInsight();
assert(insight);assert.equal(insight.type,'neglected');assert.equal(insight.group.key,'lower body');assert(insight.days>=14);assert.match(insight.text,/workouts in the last two weeks/i);
assert.match(w.coachDeepInsightHtml(),/Build Lower body/);

w.eval('state.sessions='+JSON.stringify(sessions)+';save()');
insight=w.coachDeepHistoryInsight();
assert(insight);assert.equal(insight.type,'plateau');assert.equal(insight.exerciseId,squat.id);
assert.match(w.coachDeepInsightHtml(),/Review Routine|Open Progress/);


// Region-level history: 2+ active weeks and prior primary work, not a
// universal requirement to hit every listed muscle. All data is synthetic.
const regional=[
 {id:'older_squat1',routineId:'legs_r',routineName:'Leg Day',status:'finished',date:isoDaysAgo(37),exercises:[{exerciseId:squat.id,sets:work(225,5),notes:''}]},
 {id:'older_squat2',routineId:'legs_r',routineName:'Leg Day',status:'finished',date:isoDaysAgo(24),exercises:[{exerciseId:squat.id,sets:work(225,5),notes:''}]},
 ...[12,7,2].map((day,i)=>({id:'recent_push_'+i,routineId:'push_r',routineName:'Push Day',status:'finished',date:isoDaysAgo(day),exercises:[{exerciseId:bench.id,sets:work(180,7),notes:''},{exerciseId:row.id,sets:work(140,8),notes:''}]}))
];
w.eval('state.sessions='+JSON.stringify(regional)+';save()');
const regionalSnapshot=w.eval('JSON.stringify(state.sessions)');
const muscleReport=w.coachMultiWeekRegionCoverage(now);
assert(muscleReport.ready);
assert(muscleReport.gaps.some(x=>x.region==='glutes'),'glutes disappeared from completed log contribution across weeks');
answer=w.coachHistoryAnswer('which muscles have I neglected in recent weeks?');
assert.equal(answer.type,'muscle_coverage');
assert.match(answer.answer,/glutes/i);
answer=w.coachHistoryAnswer('have I neglected glutes lately?');
assert.equal(answer.type,'muscle_coverage');
assert.match(answer.answer,/Glutes: no primary or secondary contribution/i);
answer=w.coachHistoryAnswer('have I neglected triceps lately?');
assert.match(answer.answer,/Triceps: secondary involvement only/i,
  'bench press triceps contribution is not mistaken for complete absence');
assert(!muscleReport.gaps.some(x=>x.region==='triceps'),
  'a secondary-worked region is not reported as completely neglected');
assert.equal(w.eval('JSON.stringify(state.sessions)'),regionalSnapshot,'Coach Q&A cannot mutate logged history');
// Logging an actual recent squat clears the glute gap; avoid claiming no work.
const recentSquat={id:'recent_squat',routineId:'legs_r',routineName:'Leg Day',status:'finished',date:isoDaysAgo(1),exercises:[{exerciseId:squat.id,sets:work(205,6)}]};
w.eval('state.sessions='+JSON.stringify([...regional,recentSquat])+';save()');
const corrected=w.coachMultiWeekRegionCoverage(now);
assert(!corrected.gaps.some(x=>x.region==='glutes'));
answer=w.coachHistoryAnswer('have I neglected glutes lately?');
assert.match(answer.answer,/Glutes: 3 direct set-equivalents/i);
// Unfinished warm-up sets never count as training; skipped exercises never count.
const incomplete=[...regional,{
 id:'unused_workout',routineId:'legs_r',routineName:'Not completed',status:'finished',date:isoDaysAgo(1),
 exercises:[{exerciseId:squat.id,skipped:true,sets:work(205,6)},{exerciseId:squat.id,sets:[{weight:100,reps:5,type:'warmup',done:true}]}]
}];
w.eval('state.sessions='+JSON.stringify(incomplete)+';save()');
assert(w.coachMultiWeekRegionCoverage(now).gaps.some(x=>x.region==='glutes'),
  'skipped and warm-up-only squat rows cannot erase a glute gap');
w.eval('state.sessions='+JSON.stringify(regional.slice(-2))+';save()');
answer=w.coachHistoryAnswer('which muscles have I neglected in recent weeks?');
assert.match(answer.answer,/needs more history/i,'no false gap alert with inadequate history');
// Restore the existing fixture and keep every synthetic workout unchanged.
w.eval('state.sessions='+JSON.stringify(sessions)+';save()');

console.log('Coach Swolecat v0.62 history intelligence PASS: Q&A routing, exact logs, PRs, progression, stalls, consistency, recency, neglected coverage, ranked insights, and safe handoffs');
dom.window.close();
