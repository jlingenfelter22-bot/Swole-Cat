// Phase 4 read-only shadow Coach evidence contract.
// All histories are synthetic and remain inside one disposable DOM document.
// The real app's storage, cloud, routines and progression settings are untouched.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const dom=new JSDOM(fs.readFileSync('/tmp/swole-cat-test.html','utf8'),{
 runScripts:'dangerously',url:'https://swole-cat.test/',pretendToBeVisual:true,
 beforeParse(w){
  w.localStorage.setItem('overload_v3',JSON.stringify({ui:{onboardingDone:true,haptics:false,keepAwake:false}}));
  w.fetch=()=>Promise.reject(Error('Phase 4 audit cannot contact network'));
  w.confirm=()=>true;w.alert=()=>{};w.scrollTo=()=>{};
 }
});
const evidence=[],NOW=Date.parse('2026-10-20T12:00:00Z');
try{
 await new Promise(resolve=>setTimeout(resolve,220));
 const w=dom.window;
 const originalStorage=w.localStorage.getItem('overload_v3');
 const originalSaved=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs,settings:state.settings})');
 const pick=name=>{const ex=w.allExercises().find(ex=>ex.name===name);assert(ex,'Catalog missing '+name);return ex};
 const bench=pick('Barbell Bench Press'),other=pick('Barbell Row'),assist=pick('Assisted Pull-Up'),body=pick('Pull-Up');
 const dat=day=>day+'T12:00:00.000Z';
 const makeSet=(weight,reps,rir=2)=>({done:true,type:'working',weight,reps,rir});
 const exercise=(id,sets,{skipped=false,config={}}={})=>({exerciseId:id,sets,skipped,config});
 const session=(date,entries,options={})=>({
   id:'synthetic-'+date+'-'+(options.routineId||'none'),date:dat(date),
   name:'Synthetic workout',routineId:options.routineId||'synthetic-routine',
   routineName:'Synthetic Routine',programId:options.programId||'synthetic-program',
   programPhase:options.programPhase||'normal',exercises:entries
 });
 const logs=(dates,weights,{reps=8,rir=2,id=bench.id,phase='normal'}={})=>
  dates.map((day,i)=>session(day,[exercise(id,[makeSet(weights[i],reps,rir),makeSet(weights[i],reps,rir)])],{programPhase:phase}));
 const setState=sessions=>{
  // Reassign, never mutate an existing list: derivedSessionData's existing
  // reference/length cache must not hide synthetic fixture changes.
  w.eval('state.sessions='+JSON.stringify(sessions)+';');
 };
 const audit=()=>JSON.parse(JSON.stringify(w.coachPhase4ReadOnlyAudit({referenceMs:NOW})));
 const only=(id=bench.id)=>JSON.parse(JSON.stringify(w.coachPhase4ExerciseEvidence(id,NOW)));
 const track=(id,data)=>evidence.push({id,...data});
 setState([]);
 let empty=audit();
 assert.equal(empty.candidates.length,0);
 assert.equal(empty.evidence.completedSessionsIn84Days,0);
 assert.equal(empty.mode,'shadow_read_only');
 assert(empty.noProgramChanges&&empty.noProgressionOverrides&&empty.noHealthInferences);
 track('no_history',{candidateCount:empty.candidates.length});
 const d4=['2026-09-21','2026-09-29','2026-10-07','2026-10-15'];
 setState(logs(d4.slice(0,2),[100,100],{rir:1}));
 assert.equal(only().eligible,false,'Two exposures cannot be a plateau');
 track('insufficient_two_exposures',{signal:only().signal});
 setState(logs(d4,[100,100,100,100],{rir:1}));
 let high=only();
 assert(high.eligible&&high.signal==='plateau_high_effort','Four spaced high-effort flat exposures should qualify');
 assert.equal(high.supporting.exposures,4);
 assert(high.observation.includes('do not automatically'));
 assert(!Object.hasOwn(high,'proposedWeight'));
 track('flat_four_spaced_high_effort',{signal:high.signal,days:high.supporting.spanDays});
 setState(logs(d4,[100,100,100,100],{rir:''}));
 let flat=only();
 assert(flat.eligible&&flat.signal==='plateau_watch','No RIR must not create high effort signal');
 track('flat_four_without_rir',{signal:flat.signal});
 setState(logs(['2026-07-01','2026-07-09','2026-07-17','2026-07-25'],[100,100,100,100],{rir:1}));
 assert.equal(only().eligible,false,'Stale exercise signal must be suppressed');
 track('stale_history',{reason:only().reason});
 setState(logs(['2026-10-06','2026-10-06','2026-10-12','2026-10-12'],[100,100,100,100],{rir:1}));
 assert.equal(only().eligible,false,'Same-day duplicate logs must not make a plateau');
 track('duplicate_day',{reason:only().reason});
 const withDeload=[
  ...logs(['2026-09-21','2026-09-29','2026-10-07'],[100,100,100],{rir:1}),
  ...logs(['2026-10-09','2026-10-11','2026-10-15'],[40,40,40],{rir:1,phase:'deload'})
 ];
 setState(withDeload);
 assert.equal(only().eligible,false,'Deload sets must not manufacture a plateau or dip');
 track('deload_is_not_stall',{reason:only().reason});
 setState(logs(['2026-11-01','2026-11-04','2026-11-11','2026-11-18'],[100,100,100,100],{rir:1}));
 assert.equal(only().eligible,false,'Future workout dates are not current evidence');
 track('future_dated',{reason:only().reason});
 const dates6=['2026-09-10','2026-09-17','2026-09-24','2026-10-01','2026-10-08','2026-10-15'];
 setState(logs(dates6.slice(0,5),[100,100,100,100,90],{rir:2}));
 assert(!only().eligible,'A single low session should not become a repeated dip');
 track('one_lower_session',{reason:only().reason});
 setState(logs(dates6,[100,100,100,100,90,90],{rir:2}));
 let dip=only();
 assert(dip.eligible&&dip.signal==='repeated_performance_dip','Two independently lower recent days should produce a review-only observation');
 assert(dip.observation.includes('no cause'));
 track('two_lower_days',{signal:dip.signal});
 setState(logs(d4,[80,85,90,95],{rir:2}));
 let up=only();
 assert(up.eligible&&up.signal==='progressing','Improvement across spaced dates should be descriptive');
 track('progressing',{signal:up.signal});
 setState([...logs(d4,[100,100,100,100],{id:body.id})]);
 assert.equal(only(body.id).eligible,false,'Bodyweight reps cannot be treated as barbell 1RM');
 track('bodyweight_metric',{reason:only(body.id).reason});
 setState([...logs(d4,[20,20,20,20],{id:assist.id})]);
 assert.equal(only(assist.id).eligible,false,'Assistance decrease must not be analyzed as external weight');
 track('assistance_metric',{reason:only(assist.id).reason});
 const skipDates=['2026-09-21','2026-09-29','2026-10-07','2026-10-15'];
 const skipped=skipDates.map((day,i)=>session(day,[
  exercise(bench.id,i<3?[]:[makeSet(100,8)],{skipped:i<3}),
  exercise(other.id,[makeSet(90,8)])
 ],{routineId:'A'}));
 setState(skipped);
 let review=audit();
 let sk=review.candidates.find(c=>c.signal==='repeated_explicit_skips');
 assert(sk&&sk.exerciseId===bench.id,'Repeated EXPLICIT skips should be reviewable');
 assert.equal(sk.supporting.explicitlySkipped,3);
 assert(!sk.observation.includes('must remove'));
 track('three_explict_skips',{signal:sk.signal,skips:sk.supporting.explicitlySkipped});
 const incomplete=skipDates.map(day=>session(day,[
  exercise(bench.id,[],{skipped:false}),exercise(other.id,[makeSet(90,8)])
 ],{routineId:'A'}));
 setState(incomplete);
 assert(!audit().candidates.some(c=>c.signal==='repeated_explicit_skips'),
  'Unlogged set or incomplete movement is not an explicit skipped exercise');
 track('unlogged_is_not_skipped',{skipSignals:0});
 // Explicitly prove the analysis path has no program/setting writes, cloud
 // activity or persistence even when many candidate signals are produced.
 setState(logs(d4,[100,100,100,100],{rir:1}));
 const stateBefore=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs,settings:state.settings})');
 const out=audit();
 const stateAfter=w.eval('JSON.stringify({sessions:state.sessions,routines:state.routines,programs:state.programs,settings:state.settings})');
 assert.equal(stateAfter,stateBefore,'Phase4 mutated synthetic app state');
 assert.equal(w.localStorage.getItem('overload_v3'),originalStorage,'Read-only review wrote to storage');
 assert(out.candidates.every(x=>x.writesAllowed===false&&x.action==='review_only'));
 assert(out.candidates.length<=6);
 fs.mkdirSync('/tmp/swole-cat-coach-phase4',{recursive:true});
 fs.writeFileSync('/tmp/swole-cat-coach-phase4/evidence-acceptance.json',
  JSON.stringify({version:'0.93.6',scenarios:evidence,readOnly:true,savedStateUnchanged:true,
   samples:{plateau:high,nonRirPlateau:flat,lowerDays:dip,progress:up,skip:sk}},null,2)+'\n');
 console.log('COACH_PHASE4_EVIDENCE_MATRIX '+JSON.stringify(evidence));
 console.log('COACH_PHASE4_EVIDENCE_PASS '+JSON.stringify({
  scenarios:evidence.length,readOnly:true,staleSuppressed:true,
  sparseHistorySuppressed:true,deloadExcluded:true,sameDayDeduped:true,
  futureDatesExcluded:true,singleOffDaySuppressed:true,
  multimodalProtected:true,explicitSkipsOnly:true,existingProgressionUntouched:true
 }));
}finally{dom.window.close()}
