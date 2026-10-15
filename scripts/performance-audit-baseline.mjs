// Non-destructive, synthetic Swole Cat CPU/DOM scaling audit.
// This is a Node/jsdom baseline, NOT an Android FPS, frame-time or memory trace.
// No production accounts, personal data, Supabase, real app storage or APK edits.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {JSDOM} from 'jsdom';

const source='/tmp/swole-cat-test.html';
assert(fs.existsSync(source),'Generate bundled DOM fixture before benchmarking');
const html=fs.readFileSync(source,'utf8');
const dom=new JSDOM(html,{
  runScripts:'dangerously',
  url:'https://swole-cat.test/',
  pretendToBeVisual:true,
  beforeParse(w){
    w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
    w.fetch=()=>Promise.reject(new Error('Network intentionally disabled for performance benchmark'));
    w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
  }
});
try {
  await new Promise(resolve=>setTimeout(resolve,180));
  const w=dom.window,doc=w.document;
  if(w.HTMLElement)w.HTMLElement.prototype.scrollIntoView=()=>{};
  assert.equal(typeof w.renderHistory,'function');
  assert.equal(typeof w.derivedSessionData,'function');
  assert.equal(typeof w.renderWorkout,'function');
  assert.equal(typeof w.renderAnalytics,'function');

  const fixture=w.installRegressionFixturePlan();
  const pid=fixture.program.id;
  w.startProgramWorkout(pid);
  const workout=JSON.parse(w.eval('JSON.stringify(state.activeWorkout)'));
  assert(workout?.exercises?.length>=5,'Benchmark uses a real existing workout template');

  const baseDate=Date.now();
  function makeHistory(count){
    return Array.from({length:count},(_,index)=>{
      const date=new Date(baseDate-index*86400000/3).toISOString();
      return {
        id:'synthetic_perf_session_'+index,
        routineId:fixture.routines[index%fixture.routines.length].id,
        routineName:'Synthetic Test Session '+(index%3+1),
        programId:pid,
        date,startDate:date,
        durationMinutes:48+index%13,
        trainingMode:'guided',
        programPhase:'normal',
        exercises:workout.exercises.slice(0,5).map(e=>({
          exerciseId:e.exerciseId,skipped:false,
          config:{...(e.config||{})},
          sets:(e.sets||[]).slice(0,3).map((set,i)=>({
            ...set,type:'working',done:true,weight:80+(index%15)*5+i*2.5,reps:8+i,rir:2,pr:''
          }))
        }))
      };
    });
  }
  const sample=(fn,repetitions=3)=>{
    const times=[];
    for(let i=0;i<repetitions;i++){
      const start=performance.now();fn();times.push(Number((performance.now()-start).toFixed(3)));
    }
    const sorted=times.slice().sort((a,b)=>a-b),mid=Math.floor(sorted.length/2);
    const median=sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
    return {runs:repetitions,medianMs:Number(median.toFixed(3)),maxMs:sorted.at(-1),samplesMs:times};
  };
  const metrics=[];
  function measure(sessions,operation,fn,runs){
    const timing=sample(fn,runs);
    metrics.push({sessions,operation,...timing});
    console.log('BASELINE '+String(sessions).padStart(4)+' sessions  '+operation.padEnd(23)+' median '+timing.medianMs.toFixed(1)+' ms  max '+timing.maxMs.toFixed(1)+' ms');
  }
  function install(count){
    const data=makeHistory(count);
    w.eval('state.sessions='+JSON.stringify(data));
    assert.equal(w.eval('state.sessions.length'),count);
    return data;
  }

  // Explicit hot and cold state-index measurements; no user content.
  for(const count of [30,150,300]){
    install(count);
    measure(count,'history_index_cold',()=>{
      w.eval('state.sessions=state.sessions.slice()');
      const idx=w.derivedSessionData();
      assert.equal(idx.sessionsDesc.length,count);
    },3);
    measure(count,'history_index_warm',()=>{
      assert.equal(w.derivedSessionData().sessionsDesc.length,count);
    },4);
    // Render actual History and Progress implementations and exercise real DOM allocation.
    measure(count,'history_render',()=>{
      w.renderHistory();
      assert.equal(doc.getElementById('historyList').querySelectorAll('.history-entry').length,count);
    },3);
    if(count<=150)measure(count,'progress_render',()=>{
      w.renderAnalytics();
      assert(doc.getElementById('analyticsArea').textContent.trim().length>30);
      assert(!doc.getElementById('analyticsArea').textContent.includes('Progress could not display'),'Progress must not degrade to error fallback');
    },3);
    if(count===30||count===300){
      measure(count,'workout_render',()=>{
        w.renderWorkout();
        assert(doc.getElementById('workoutArea').querySelector('.focus-session-strip'),'live workout canvas must render');
      },3);
      measure(count,'exercise_render',()=>{
        w.renderExercises();
        assert(doc.getElementById('exerciseList').querySelectorAll('.list-item').length>=200,'exercise catalog must render');
      },3);
    }
    measure(count,'state_save',()=>{
      assert.equal(w.save({syncRelevant:false}),true);
      assert(w.localStorage.getItem('overload_v3')?.length>0);
    },3);
  }
  // Separate longer-history serialization/index test; avoids 1,000-history-card DOM explosion.
  install(1000);
  measure(1000,'history_index_cold',()=>{
    w.eval('state.sessions=state.sessions.slice()');
    assert.equal(w.derivedSessionData().sessionsDesc.length,1000);
  },3);
  measure(1000,'state_save',()=>{
    assert.equal(w.save({syncRelevant:false}),true);
  },3);
  const stateBytes=Buffer.byteLength(w.localStorage.getItem('overload_v3')||'','utf8');
  const appJsBytes=fs.statSync('www/app.js').size,appCssBytes=fs.statSync('www/app.css').size;

  const report={
    schema:1,
    measuredAt:new Date().toISOString(),
    baselineType:'GitHub-hosted Node.js + jsdom synthetic CPU/DOM only',
    androidDeviceMeasured:false,
    noProductionDataUsed:true,
    fpsMeasured:false,
    longTaskTraceCaptured:false,
    notes:['Runner timing varies: report is observational, not an absolute performance gate.',
      'jsdom does not implement real WebView paint, GPU compositing, touchscreen or Gboard.',
      'Each count represents completed sessions with up to five exercise movements and up to three logged working sets per movement.',
      'A separate real-device profile is required before performance acceptance.'],
    environment:{node:process.version,platform:process.platform,cpuArch:process.arch},
    bundleBytes:{javascript:appJsBytes,css:appCssBytes},
    syntheticStateBytesAt1000Sessions:stateBytes,
    metrics
  };
  fs.writeFileSync('performance-baseline.json',JSON.stringify(report,null,2)+'\n');
  console.log('PERFORMANCE_AUDIT_BASELINE PASS '+JSON.stringify({
    cases:metrics.length,androidMeasured:false,syntheticSessionsMax:1000,
    bundleBytes:report.bundleBytes,stateBytesAt1000:stateBytes
  }));
  if(process.env.GITHUB_STEP_SUMMARY){
    const rows=metrics.map(x=>'| '+x.sessions+' | '+x.operation+' | '+x.medianMs+' | '+x.maxMs+' |').join('\n');
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      '\n## Synthetic Swole Cat CPU/DOM baseline (NOT Android FPS)\n\n'+
      '| Sessions | Operation | Median ms | Max ms |\n|---:|---|---:|---:|\n'+rows+'\n\n'+
      'Built JS '+appJsBytes+' bytes, CSS '+appCssBytes+' bytes. Synthetic 1,000-session state '+stateBytes+' bytes. No real account data used.\n');
  }
} finally {
  dom.window.close();
}
