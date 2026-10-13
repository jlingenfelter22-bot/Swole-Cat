// Local, no-DOM/no-network validation of the unconnected v0.89 Brain knowledge service.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const registry=new Map();
const sandbox={SwoleCatRuntime:{registerService(name,value){registry.set(name,value);return value}}};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('src/data/coach-brain-exercise-profiles.js','utf8'),sandbox,{filename:'coach-brain-exercise-profiles.js'});
vm.runInContext(fs.readFileSync('src/js/04a0-coach-brain-knowledge.js','utf8'),sandbox,{filename:'04a0-coach-brain-knowledge.js'});
const brain=registry.get('brainKnowledge');
assert(brain,'brainKnowledge registration must exist');
assert.equal(brain.count,308);

const source=JSON.parse(fs.readFileSync('docs/coach-brain/exercise-knowledge-audit-308.json','utf8')).records;
assert.equal(source.length,308);
for(const item of source){
 const got=brain.getProfile(item.id);
 assert(got,'missing '+item.name);
 assert.equal(got.name,item.name);
 assert.equal(got.role,item.proposed.movementRole);
 assert.deepEqual(Array.from(got.primary),item.proposed.primaryMuscles);
 assert.deepEqual(Array.from(got.secondary),item.proposed.secondaryMuscles);
 assert.deepEqual(Array.from(got.needs),item.proposed.equipmentCapabilities);
 assert.equal(got.load,item.proposed.resistancePolicy);
 assert.equal(got.measurement,item.progression.measurement);
 assert.equal(got.side,item.proposed.sideExecution);
 assert.equal(got.sideMetrics,item.proposed.sideMetricAvailableInCurrentApp);
 assert.equal(got.power,item.proposed.powerOrSkillPriority);
 assert.equal(got.review,item.review.confidence);
 assert.equal(Object.isFrozen(got),true,'profile must be immutable');
}
assert.equal(brain.getProfile('lib_9999'),null);
assert.equal(brain.evaluateAvailability('lib_9999').status,'unknown_exercise');

const preset=(preset,complete=false,unavailable=[])=>({equipment:{preset,complete,unavailable}});
const strict=(available,unavailable=[])=>({equipment:{available,unavailable,complete:true}});
const status=(id,c)=>brain.evaluateAvailability(id,c).status;

// Inventory is contextual, not a global user profile; defaults must never claim full-gym access.
assert.equal(status('lib_7',preset('floor_only',true)),'available','push-up should be floor-compatible');
assert.equal(status('lib_56',preset('floor_only',true)),'unavailable','ab wheel requires a wheel');
assert.equal(status('lib_31',preset('floor_only',true)),'unavailable','pull-up requires an overhead bar');
assert.equal(status('lib_307',preset('floor_only',true)),'unavailable','hang requires secure overhead bar');
assert.equal(status('lib_198',preset('floor_only',true)),'unavailable','banded movement requires band');
assert.equal(status('lib_184',preset('floor_only',true)),'unavailable','Nordic curl requires anchor');
assert.equal(status('lib_83',preset('floor_only',true)),'unavailable','deficit push-up needs stable supports');
assert.equal(status('lib_84',preset('floor_only',true)),'unavailable','weighted push-up needs secure added load');
assert.equal(status('lib_94',preset('home_dumbbells',true)),'unavailable','Meadows row needs landmine, not just dumbbells');
assert.equal(status('lib_89',preset('standard_gym')),'unconfirmed','full gym cannot guarantee landmine');
assert.equal(status('lib_174',preset('standard_gym')),'unconfirmed','full gym cannot guarantee sled');
assert.equal(status('lib_31',preset('standard_gym')),'unconfirmed','generic gym cannot guarantee a bar');
assert.equal(status('lib_89',strict(['bodyweight','barbell','plates','anchored_landmine'])),'available','actual landmine inventory permits landmine row');
assert.equal(status('lib_94',strict(['barbell','plates','anchored_landmine','stable_braced_stance'])),'available');
assert.equal(status('lib_94',strict(['dumbbells','bodyweight','exercise_space'])),'unavailable');
assert.equal(status('lib_31',strict(['bodyweight','secure_overhead_bar'])),'available');
assert.equal(status('lib_198',strict(['bodyweight','exercise_space','resistance_band'])),'available');
assert.equal(status('lib_7',{}),'unconfirmed','unknown inventory must not be treated as confirmed');
assert.equal(status('lib_31',preset('floor_only',false)),'unconfirmed','partial inventory is not certain proof of absence');
assert.equal(status('lib_7',preset('floor_only',false,['bodyweight'])),'unavailable','explicit denial overrides preset');
assert.equal(status('lib_7',{equipment:{available:['bodyweight','exercise_space']},excludedExerciseIds:['lib_7']}),'unavailable');

// Unknown machine mechanism/direction must be a question, not a claimed equipment match.
const nordic=source.find(x=>x.name==='Nordic Curl Machine');
assert(nordic);
const nordicAvailability=brain.evaluateAvailability(nordic.id,strict(nordic.proposed.equipmentCapabilities.filter(c=>c!=='assistance_mechanism_unknown')));
assert(nordicAvailability.questions.includes('assistance_mechanism_unknown'));
assert.equal(nordicAvailability.status,'unconfirmed');
const sledDrag=source.find(x=>x.name==='Sled Drag');
const dragCheck=brain.evaluateAvailability(sledDrag.id,strict(sledDrag.proposed.equipmentCapabilities.filter(c=>c!=='drag_direction_to_confirm')));
assert(dragCheck.questions.includes('drag_direction_to_confirm'));

const bp=brain.describeExercise('lib_0',strict(['bodyweight','dumbbells','bench','exercise_space']));
assert.equal(bp.movementRole,'horizontal_press');
assert.equal(bp.availability.status,'unavailable');
assert.equal(bp.classification,'reviewed_desk_proposal_not_live');
const deadHang=brain.describeExercise('lib_307');
assert.equal(deadHang.measurement,'duration');
const gluteHam=brain.describeExercise('lib_187');
assert.equal(gluteHam.resistancePolicy,'bodyweight_default_optional_added_load');
const assisted=brain.describeExercise('lib_32');
assert.equal(assisted.resistancePolicy,'assistance');
assert.equal(brain.describeExercise('lib_116').resistancePolicy,'added_external_load_only');
assert.equal(brain.describeExercise('lib_50').movementRole,'dip_press');

// Alternative discovery searches the FULL catalog, not just the three audit suggestions.
const dumbbellContext=strict(['bodyweight','exercise_space','dumbbells','bench']);
const alt=brain.suggestSubstitutes('lib_0',dumbbellContext);
assert(alt.candidates.some(c=>c.name==='Dumbbell Bench Press'),'bench should find a feasible DB press');
assert(alt.candidates.every(c=>c.availability.status==='available'));
assert(alt.candidates.every(c=>c.relationship==='same_role_option'));
assert(alt.candidates.every(c=>!c.historyTransferAllowed&&!c.automaticSwapAllowed));
assert.equal(alt.automaticSwapAllowed,false);
assert.equal(alt.historyTransferAllowed,false);
assert(!alt.candidates.some(c=>c.name==='Board Press'),'cannot assume extra board setup');
const excluded=brain.suggestSubstitutes('lib_0',{...dumbbellContext,excludedExerciseIds:['lib_2']});
assert(!excluded.candidates.some(c=>c.name==='Dumbbell Bench Press'));
assert.equal(brain.suggestSubstitutes('lib_307',strict(['bodyweight','exercise_space','dumbbells'])).candidates.length,0,'dead hang should not get fake timed-grip alternatives');
assert.equal(brain.suggestSubstitutes('lib_56',preset('floor_only',true)).candidates.every(c=>c.measurement==='reps'),true);
const pallof=brain.suggestSubstitutes('lib_273',strict(['cable_station','stable_cable_anchor']),{includeRelated:true});
assert(pallof.candidates.every(c=>!c.historyTransferAllowed),'anti-rotation must not share PRs');
const timed=brain.suggestSubstitutes('lib_57',strict(['bodyweight','exercise_space']),{includeRelated:true});
assert(timed.candidates.every(c=>c.measurement==='duration'),'no rep exercise substitution for timed plank');
const needsConfirmation=brain.suggestSubstitutes('lib_0',{equipment:{available:['dumbbells']}},{includeUnconfirmed:true});
assert(needsConfirmation.candidates.some(c=>c.availability.status==='unconfirmed'));
assert(needsConfirmation.candidates.every(c=>!c.automaticSwapAllowed));

// Pure caller input, including simulated identity switches, must not be persisted or changed.
const accountA={equipment:{available:['barbell','plates','bench'],complete:true},ownerId:'A'};
const accountB={equipment:{available:['dumbbells','bench'],complete:true},ownerId:'B'};
const beforeA=JSON.stringify(accountA),beforeB=JSON.stringify(accountB);
assert.equal(brain.evaluateAvailability('lib_0',accountA).status,'available');
assert.equal(brain.evaluateAvailability('lib_0',accountB).status,'unavailable');
assert.equal(brain.evaluateAvailability('lib_0',accountA).status,'available');
assert.equal(JSON.stringify(accountA),beforeA);
assert.equal(JSON.stringify(accountB),beforeB);
assert(!('save' in brain)&&!('sync' in brain)&&!('ownerId' in brain),'Brain knowledge is stateless');

console.log('Brain knowledge + equipment + substitution stress PASS: 308 profiles and scenario/owner/measurement guards');
