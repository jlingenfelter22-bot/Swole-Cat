// Exercise Library bounded-render regression, synthetic state only.
// Protect full search/filter access, row markup, favorites, scroll, and zero data writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.fetch=()=>Promise.reject(Error('No network in exercise rendering tests'));
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
 }
});
try{
 await new Promise(r=>setTimeout(r,120));
 const w=dom.window,doc=w.document,list=doc.getElementById('exerciseList'),view=doc.getElementById('exercises');
 const input=doc.getElementById('exerciseSearch');
 assert(list&&view&&input,'exercise screen controls must exist');
 const ids=()=>Array.from(list.querySelectorAll('.exercise-link[onclick]'))
  .map(n=>(n.getAttribute('onclick')||'').match(/openExerciseProgress\('([^']+)'\)/)?.[1]);
 const count=()=>list.querySelectorAll('.list-item').length;
 const catalog=w.allExercises(),allIds=w.sortExerciseChoices(w.visibleExercises()).map(x=>x.id);
 assert(allIds.length>200,'large catalog expected for meaningful DOM stress');
 const snapshots=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})');
 view.classList.add('active');
 w.eval('exerciseLibraryRenderedCount=0');
 w.renderExercises();
 assert.equal(count(),32,'all-exercises first paint is bounded');
 assert.deepEqual(ids(),Array.from(allIds.slice(0,32)),'first 32 ordered IDs are unchanged');
 const row=list.querySelector('.list-item');
 assert(row.querySelector('.iconbox.schematic-exercise-thumb'),'artwork structure preserved');
 assert(row.querySelector('.grow.exercise-link'),'tap target preserved');
 assert(row.querySelector('.favbtn'),'favorite button preserved');
 const originalNode=row;
 assert.equal(w.exerciseLibraryAppendNextBatch(),true);
 assert.equal(count(),64);
 assert.strictEqual(list.querySelector('.list-item'),originalNode,'appending never destroys visible DOM');
 w.renderExercises();
 assert.equal(count(),64,'same-filter refresh preserves loaded scroll depth');
 while(w.exerciseLibraryAppendNextBatch()){}
 assert.equal(count(),allIds.length,'every unhidden exercise remains accessible');
 assert.deepEqual(ids(),Array.from(allIds),'all exercise ordering unchanged');
 assert.equal(w.exerciseLibraryAppendNextBatch(),false,'no duplicate trailing rows');
 // Real scroll handler appends only on the exercise screen and near the list end.
 w.eval('exerciseLibraryRenderedCount=0');w.renderExercises();
 Object.defineProperty(list,'getBoundingClientRect',{configurable:true,value:()=>({bottom:0})});
 w.exerciseLibraryScrollMaybeAppend();
 await new Promise(r=>setTimeout(r,50));
 assert.equal(count(),64,'scroll reveals next 32 without a visible pagination button');
 view.classList.remove('active');
 w.exerciseLibraryScrollMaybeAppend();
 await new Promise(r=>setTimeout(r,50));
 assert.equal(count(),64,'no hidden-view processing while another page is active');
 view.classList.add('active');
 // Searching and filters must reset the list to the right matches.
 input.value='press';
 w.renderExercises();
 const pressIds=w.sortExerciseChoices(w.visibleExercises().filter(x=>
  x.name.toLowerCase().includes('press')||x.muscle.toLowerCase().includes('press')||
  (x.pattern||'').toLowerCase().includes('press'))).map(x=>x.id);
 assert.equal(count(),Math.min(32,pressIds.length));
 while(w.exerciseLibraryAppendNextBatch()){}
 assert.deepEqual(ids(),Array.from(pressIds),'search never hides matching rows');
 input.value='this-does-not-match-exercises-777';
 w.renderExercises();
 assert.equal(count(),0);
 assert(list.querySelector('.empty'),'original empty state remains');
 input.value='';
 // Favorite and hide filters must retain their existing semantics.
 const favoriteId=allIds[20],hiddenId=allIds[40];
 w.eval('state.favorites=['+JSON.stringify(favoriteId)+']');
 w.eval('state.exercisePreferences='+JSON.stringify({[hiddenId]:'hide'}));
 w.renderExercises();
 assert.equal(count(),32,'catalog filter recomputes after state change');
 assert(ids().includes(favoriteId),'favorite sort preserves featured movement');
 assert(!ids().includes(hiddenId),'hidden exercises never appear in All');
 w.setExerciseHistoryFilter('favorite');
 assert.deepEqual(ids(),[favoriteId],'favorites filter returns only favorite');
 w.setExerciseHistoryFilter('hidden');
 assert.deepEqual(ids(),[hiddenId],'hidden filter lists hidden moves');
 w.setExerciseHistoryFilter('all');
 assert.equal(count(),32,'filter changes reset depth');
 assert.equal(w.eval('state.sessions.length'),0,'all synthetic workout history unchanged');
 assert.equal(w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs})'),snapshots,
   'filtering and scrolling must never change stored training records');
 console.log('EXERCISE_LIBRARY_PROGRESSIVE_RENDER PASS '+JSON.stringify({
  initialRows:32,fullCatalogAccessible:allIds.length,searchResults:pressIds.length,
  sortIdentical:true,favoritesAndHiddenIntact:true,noVisualMarkupChange:true,
  passiveScrollAppend:true,existingStateIntact:true
 }));
}finally{dom.window.close()}
