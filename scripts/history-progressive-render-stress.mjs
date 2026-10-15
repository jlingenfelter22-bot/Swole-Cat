// History rendering scalability / appearance-preserving behavior contract.
// Isolated jsdom fixtures only: never touches real workouts or accounts.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync('/tmp/swole-cat-test.html','utf8');
const dom=new JSDOM(html,{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.fetch=()=>Promise.reject(Error('Network forbidden for history performance checks'));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
 }
});
try{
 await new Promise(r=>setTimeout(r,120));
 const w=dom.window,doc=w.document;
 w.installRegressionFixturePlan();
 const program=w.eval('state.programs[0]');
 w.startProgramWorkout(program.id);
 const workout=JSON.parse(w.eval('JSON.stringify(state.activeWorkout)'));
 const days=Array.from({length:75},(_,i)=>({
   id:'perf_history_'+i,
   date:new Date(Date.now()-i*86400000).toISOString(),
   durationMinutes:42,
   routineName:'Synthetic Workout '+i,
   programId:program.id,
   routineId:program.routineIds[i%3],
   exercises:workout.exercises.slice(0,4).map(e=>({
    exerciseId:e.exerciseId,config:{...(e.config||{})},skipped:false,
    sets:(e.sets||[]).slice(0,2).map(set=>({
      ...set,done:true,weight:115,reps:9,type:'working',pr:''
    }))
   }))
 }));
 w.eval('state.sessions='+JSON.stringify(days));
 w.eval('historyRenderedCount=0');
 const section=doc.getElementById('history'),list=doc.getElementById('historyList');
 section.classList.add('active');
 const ids=()=>Array.from(list.querySelectorAll('.history-entry .history-manage-btn'))
  .map(button=>button.getAttribute('onclick'));
 const count=()=>list.querySelectorAll('.history-entry').length;
 const firstCard=()=>list.querySelector('.history-entry');
 w.renderHistory();
 assert.equal(count(),24,'Only the first 24 workout cards should be parsed on initial open');
 assert.equal(firstCard().querySelector('.history-sequence span').textContent,'75',
  'newest-first session sequence must retain complete-history numbering');
 assert(firstCard().querySelector('.history-recap-btn'),'View Recap remains on every card');
 assert(firstCard().querySelector('.history-edit-btn'),'Edit remains available');
 assert(firstCard().querySelector('.history-manage-btn'),'Manage remains available');
 assert(firstCard().querySelector('.history-metrics'),'The exact existing metrics are retained');
 assert.equal(ids().length,24);
 const firstNode=firstCard();
 assert.equal(w.historyRenderNextBatch(),true);
 assert.equal(count(),48);
 assert.strictEqual(firstCard(),firstNode,'append must not reconstruct earlier cards or steal focus');
 assert.equal(w.historyRenderNextBatch(),true);
 assert.equal(count(),72);
 assert.equal(w.historyRenderNextBatch(),true);
 assert.equal(count(),75);
 assert.equal(w.historyRenderNextBatch(),false);
 assert(ids().at(-1)?.includes('perf_history_74'),'oldest session remains accessible');
 assert.equal(list.lastElementChild.querySelector('.history-sequence span').textContent,'01',
  'oldest session must have the original sequence number');
 // Existing completed sessions, routines, and active workout must not be mutated.
 assert.equal(w.eval('state.sessions.length'),75);
 assert.equal(w.eval('state.routines.length'),3);
 assert(w.eval('state.activeWorkout'));
 // When editing/deleting a workout, already-visible scroll depth remains available.
 const preserved=firstCard();
 w.eval("state.sessions=state.sessions.filter(s=>s.id!=='perf_history_2')");
 w.renderHistory();
 assert.equal(count(),74,'refresh preserves opened older pages after deletion');
 assert.notStrictEqual(firstCard(),preserved,'refresh still updates all card summaries correctly');
 assert(!ids().some(x=>x.includes('perf_history_2')),'deleted workout must be absent');
 // Reset the view to an initial 24-card window, and exercise the actual scroll listener.
 w.eval('historyRenderedCount=0');
 w.renderHistory();
 assert.equal(count(),24);
 Object.defineProperty(list,'getBoundingClientRect',{configurable:true,value:()=>({bottom:0})});
 w.historyScrollMaybeAppend();
 await new Promise(r=>setTimeout(r,55));
 assert.equal(count(),48,'near-bottom scrolling automatically reveals older logs without a UI button');
 section.classList.remove('active');
 w.historyScrollMaybeAppend();
 await new Promise(r=>setTimeout(r,55));
 assert.equal(count(),48,'inactive History view should not append work in the background');
 section.classList.add('active');
 w.eval('state.sessions=[]');w.renderHistory();
 assert.equal(count(),0,'cleared History returns its original empty state');
 assert(list.querySelector('.empty'),'empty History renders original empty-state copy');
 assert.equal(w.historyRenderNextBatch(),false);
 // Future sessions must render cleanly after clearing all history.
 w.eval('state.sessions='+JSON.stringify(days.slice(0,2)));
 w.renderHistory();
 assert.equal(count(),2);
 assert.equal(list.querySelector('.history-sequence span').textContent,'02');
 console.log('HISTORY_PROGRESSIVE_RENDER PASS '+JSON.stringify({
  firstPaintCards:24,fullHistoryAccessible:75,automaticScrollAppend:true,
  identicalCardActions:true,refreshDepthPreserved:true,emptyStateRestored:true,
  noCloudOrRealUserData:true
 }));
}finally{dom.window.close()}
