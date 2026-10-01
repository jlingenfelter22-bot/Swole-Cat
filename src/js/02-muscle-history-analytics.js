function startOfWeek(d=new Date()){
 const x=new Date(d);x.setHours(0,0,0,0);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x;
}
const MUSCLE_REGION_LABELS={
 chest:'Chest',front_delts:'Front delts',side_delts:'Side delts',rear_delts:'Rear delts',
 biceps:'Biceps',triceps:'Triceps',forearms:'Forearms',upper_back:'Upper back',lats:'Lats',
 traps:'Traps',lower_back:'Lower back',core:'Abs / core',obliques:'Obliques',glutes:'Glutes',
 quads:'Quads',hamstrings:'Hamstrings',adductors:'Adductors',calves:'Calves',tibialis:'Tibialis'
};
function uniqueMuscles(list){return [...new Set((list||[]).filter(Boolean))]}
const EXERCISE_MUSCLE_OVERRIDES={
 'Deadlift':{primary:['quads','glutes','lower_back'],secondary:['hamstrings','upper_back','forearms','core']},
 'Rack Pull':{primary:['glutes','lower_back','upper_back'],secondary:['hamstrings','traps','forearms','core']},
 'Block Pull':{primary:['glutes','lower_back','upper_back'],secondary:['hamstrings','traps','forearms','core']},
 'Deficit Deadlift':{primary:['quads','glutes','lower_back'],secondary:['hamstrings','upper_back','forearms','core']},
 'Sumo Deadlift':{primary:['quads','glutes','adductors'],secondary:['hamstrings','lower_back','forearms','core']},
 'Trap Bar Deadlift':{primary:['quads','glutes'],secondary:['hamstrings','lower_back','traps','forearms','core']},
 'Reverse Hyperextension':{primary:['glutes','hamstrings'],secondary:['lower_back']},
 '45-Degree Back Extension':{primary:['hamstrings','glutes'],secondary:['lower_back']},
 'Glute Ham Raise':{primary:['hamstrings'],secondary:['glutes']},
 'Assisted Dip':{primary:['triceps'],secondary:['chest','front_delts']},
 'Plate Loaded Dip':{primary:['triceps'],secondary:['chest','front_delts']},
 'Bench Dip':{primary:['triceps'],secondary:['chest','front_delts']},
 'Diamond Push-Up':{primary:['triceps'],secondary:['chest','front_delts']},
 'Reverse Barbell Curl':{primary:['forearms'],secondary:['biceps']},
 'Reverse Dumbbell Curl':{primary:['forearms'],secondary:['biceps']},
 'Zottman Curl':{primary:['biceps','forearms'],secondary:[]},
 'Dumbbell Farmer Carry':{primary:['forearms','traps','core'],secondary:['glutes','quads']},
 'Trap Bar Farmer Carry':{primary:['forearms','traps','core'],secondary:['glutes','quads']},
 'Plate Pinch Carry':{primary:['forearms'],secondary:['traps','core']},
 'Kettlebell Farmer Carry':{primary:['forearms','traps','core'],secondary:['glutes','quads']},
 'Kettlebell Suitcase Carry':{primary:['forearms','obliques','core'],secondary:['traps','glutes']},
 'Kettlebell Swing':{primary:['glutes','hamstrings'],secondary:['quads','lower_back','core']},
 'Kettlebell Romanian Deadlift':{primary:['hamstrings','glutes'],secondary:['lower_back','core']},
 'Kettlebell Goblet Squat':{primary:['quads','glutes'],secondary:['adductors','core']},
 'Double Kettlebell Front Squat':{primary:['quads','glutes'],secondary:['adductors','core']},
 'Landmine Squat':{primary:['quads','glutes'],secondary:['adductors','core']},
 'Landmine Reverse Lunge':{primary:['quads','glutes'],secondary:['adductors','core']},
 'Kettlebell Press':{primary:['front_delts'],secondary:['side_delts','triceps','core']},
 'Double Kettlebell Press':{primary:['front_delts'],secondary:['side_delts','triceps','core']},
 'Landmine Press':{primary:['front_delts','chest'],secondary:['triceps','core']},
 'Half-Kneeling Landmine Press':{primary:['front_delts','chest'],secondary:['triceps','core']},
 'Backward Sled Drag':{primary:['quads'],secondary:['glutes','calves','core']},
 'Sled Drag':{primary:['quads','glutes'],secondary:['hamstrings','calves','core']}
};
function auditedMuscleResult(primary,secondary,pattern){
 const p=uniqueMuscles(primary),s=uniqueMuscles((secondary||[]).filter(x=>!p.includes(x)));
 return {primary:p,secondary:s,movementFamily:pattern||'other'};
}
function exerciseMuscleMetadata(ex){
 if(!ex)return {primary:[],secondary:[],movementFamily:'other'};
 if(Array.isArray(ex.primaryMuscles)&&ex.primaryMuscles.length){
   return auditedMuscleResult(ex.primaryMuscles,ex.secondaryMuscles||[],ex.movementFamily||ex.pattern||'other');
 }
 const name=ex.name||'',muscle=ex.muscle||'Other',pattern=ex.pattern||'other';
 const override=EXERCISE_MUSCLE_OVERRIDES[name];
 if(override)return auditedMuscleResult(override.primary,override.secondary,pattern);
 let primary=[],secondary=[];
 if(muscle==='Chest'){
   primary=['chest'];
   secondary=['front_delts',...(pattern==='chest_fly'?[]:['triceps'])];
 }else if(muscle==='Back'){
   if(pattern==='hinge'){primary=['quads','glutes','lower_back'];secondary=['hamstrings','upper_back','forearms','core'];}
   else if(pattern==='vertical_pull'){primary=['lats'];secondary=['upper_back','biceps','rear_delts'];}
   else if(pattern==='shoulder_extension'||pattern==='pullover'){primary=['lats'];secondary=['upper_back','triceps'];}
   else {primary=['upper_back','lats'];secondary=['rear_delts','biceps'];}
 }else if(muscle==='Lower Back'){
   if(pattern==='back_extension'){primary=['lower_back'];secondary=['glutes','hamstrings'];}
   else {primary=['lower_back','glutes'];secondary=['hamstrings','upper_back','forearms'];}
 }else if(muscle==='Shoulders'){
   if(pattern==='lateral_raise'){primary=['side_delts'];secondary=[];}
   else if(pattern==='rear_delt'){primary=['rear_delts'];secondary=['upper_back'];}
   else if(pattern==='front_raise'){primary=['front_delts'];secondary=[];}
   else if(pattern==='upright_row'){primary=['side_delts','traps'];secondary=['biceps'];}
   else {primary=['front_delts','side_delts'];secondary=['triceps'];}
 }else if(muscle==='Traps'){
   primary=['traps'];secondary=pattern==='shrug'?['forearms']:['upper_back'];
 }else if(muscle==='Quads'){
   if(pattern==='squat'||pattern==='lunge'){primary=['quads','glutes'];secondary=['adductors'];}
   else if(pattern==='sled_push'){primary=['quads','glutes'];secondary=['hamstrings','calves','core'];}
   else primary=['quads'];
 }else if(muscle==='Hamstrings'){
   if(pattern==='hinge'){primary=['hamstrings','glutes'];secondary=['lower_back'];}
   else primary=['hamstrings'];
 }else if(muscle==='Glutes'){
   primary=['glutes'];
   if(pattern==='hip_abduction')secondary=[];
   else if(pattern==='hip_extension')secondary=['hamstrings'];
   else if(pattern==='squat'||pattern==='lunge')secondary=['quads','adductors'];
 }else if(muscle==='Adductors'){
   primary=['adductors'];secondary=[];
 }else if(muscle==='Biceps'){
   primary=['biceps'];secondary=['forearms'];
 }else if(muscle==='Triceps'){
   primary=['triceps'];
   secondary=(pattern==='dip_press'||pattern==='horizontal_press')?['chest','front_delts']:[];
 }else if(muscle==='Forearms'){
   primary=['forearms'];
   secondary=pattern==='grip'?['traps','core']:(pattern==='elbow_flexion'?['biceps']:[]);
 }else if(muscle==='Calves'){
   primary=['calves'];
 }else if(muscle==='Tibialis'){
   primary=['tibialis'];
 }else if(muscle==='Core'){
   if(pattern==='rotation'||pattern==='lateral_flexion'||pattern==='anti_rotation')primary=['obliques','core'];
   else primary=['core'];
 }else if(muscle==='Full Body'){
   if(pattern==='carry'){primary=['forearms','traps','core'];secondary=['obliques','quads','glutes'];}
   else if(pattern==='hinge'){primary=['glutes','hamstrings'];secondary=['lower_back','core','quads'];}
   else if(pattern==='squat'||pattern==='lunge'){primary=['quads','glutes'];secondary=['adductors','core'];}
   else if(pattern==='vertical_press'){primary=['front_delts'];secondary=['side_delts','triceps','core'];}
   else if(pattern==='sled_push'||pattern==='sled_pull'){primary=['quads','glutes'];secondary=['hamstrings','calves','core'];}
   else if(pattern==='olympic_pull'){primary=['quads','glutes','traps'];secondary=['hamstrings','upper_back','core','forearms'];}
   else {primary=['quads','glutes','upper_back'];secondary=['hamstrings','traps','core','forearms'];}
 }else{
   primary=[String(muscle).toLowerCase().replace(/\s+/g,'_')];
 }
 return auditedMuscleResult(primary,secondary,pattern);
}

function sessionMuscleScores(session){
 const scores={};
 (session.exercises||[]).forEach(e=>{
   if(e.skipped)return;
   const working=progressionSets(e);
   if(!working.length)return;
   const meta=exerciseMuscleMetadata(exById(e.exerciseId));
   const setCount=working.length;
   meta.primary.forEach(m=>scores[m]=(scores[m]||0)+setCount);
   meta.secondary.forEach(m=>scores[m]=(scores[m]||0)+setCount*.5);
 });
 return scores;
}
function muscleHeatLevel(score){
 if(score>=6)return 3;
 if(score>=3)return 2;
 if(score>0)return 1;
 return 0;
}
function muscleRegionClass(region,scores){return 'muscle-region heat-'+muscleHeatLevel(Number(scores?.[region])||0)}
function muscleMapRegion(region,scores,shape){
 return `<${shape.tag} class="${muscleRegionClass(region,scores)}" data-region="${region}" ${shape.attrs}></${shape.tag}>`;
}
const SWOLECAT_ANATOMY_FRONT=[{"id":"head","name":"Head","path":"m 11.671635,6.3585449 -0.0482,-2.59085 4.20648,-2.46806 4.42769,2.95361 -0.0405,1.94408 0.24197,-3.34467 -2.03129,-2.31103004 -2.84508,-0.51629 -2.20423,0.52915 -1.9363,2.63077004 z"},{"id":"face","name":"Face","path":"m 19.748825,6.7034949 0.0203,-2.20747 -3.96689,-2.7637 -3.74099,2.23559 -0.006,2.63528 -0.60741,0.0403 0.27408,1.82447 0.97635,0.33932 0.44244,2.1802901 1.82222,2.06556 2.03518,-0.0607 1.79223,-1.94408 0.35957,-2.2406601 0.97616,-0.33932 0.25159,-1.78416 z"},{"id":"neck-right","name":"Right Neck","path":"m 13.304665,11.910505 1.64975,2.35202 0.74426,2.62159 -1.73486,-1.38354 -0.86649,-2.97104 z"},{"id":"neck-left","name":"Left Neck","path":"m 18.385135,11.910505 -1.64975,2.35202 -0.74538,2.62234 1.73486,-1.38354 0.86649,-2.97104 z"},{"id":"shoulder-front-left","name":"Left Shoulder (Front)","path":"m 19.047795,13.248365 3.55748,1.97916 0.72653,-0.35074 z m -0.107,0.43288 -0.37119,1.73073 2.1846,0.53561 1.40116,-0.49436 z"},{"id":"shoulder-side-left","name":"Left Shoulder (Side)","path":"m 22.922305,15.657195 0.75814,-0.41 2.40806,1.66799 1.17364,1.50707 0.62662,1.5626 -0.0464,3.70194 -1.3284,-1.72153 0.0407,-2.59376 -0.48842,-0.50049 c 0,0 -3.09778,-3.19058 -3.14371,-3.21401 z m -0.2409,0.10873 c -0.001,0.0525 3.32987,3.54733 3.32987,3.54733 l 0.10067,3.10396 -1.15426,-1.97782 -2.22547,-0.94804 -1.56576,-2.88481 z"},{"id":"shoulder-front-right","name":"Right Shoulder (Front)","path":"m 12.624785,13.248365 -3.5574599,1.97916 -0.72653,-0.35074 z m 0.107,0.43288 0.37119,1.73073 -2.18459,0.53561 -1.4011499,-0.49436 z"},{"id":"shoulder-side-right","name":"Right Shoulder (Side)","path":"m 8.7502951,15.657195 -0.75814,-0.41 -2.40806,1.66799 -1.17364,1.50707 -0.62662,1.56259 0.0464,3.70195 1.3284,-1.72153 -0.0407,-2.59376 0.48843,-0.5005 c 0,0 3.09777,-3.19057 3.1437,-3.214 z m 0.2409,0.10873 c 0.002,0.0525 -3.32987,3.54733 -3.32987,3.54733 l -0.10067,3.10396 1.15426,-1.97782 2.22547,-0.94804 1.5657499,-2.88481 z"},{"id":"biceps-left","name":"Left Biceps","path":"m 27.621665,30.814715 -0.33838,1.70499 -1.81932,-2.54418 -0.6629,-1.26895 z m -2.85271,-2.6096 c -0.0259,-0.0144 -0.0536,-0.0254 -0.0824,-0.0324 l -1.48333,-4.95503 1.00456,-2.08428 1.65511,1.74532 2.23034,6.67667 0.0415,0.93739 c -1.06528,-0.84215 -2.18962,-1.60679 -3.36434,-2.28803 z m 1.6945,-5.75654 1.64893,6.43421 -0.36469,-4.92266 z"},{"id":"forearm-left","name":"Left Forearm","path":"m 26.955425,32.969125 1.30083,10.28927 -1.10778,0.01 -1.89387,-7.99609 0.19174,-4.53719 z m 1.21978,-1.94971 -0.58729,2.58635 1.11876,9.15614 0.55849,-0.21663 0.2304,-6.77018 z"},{"id":"biceps-right","name":"Right Biceps","path":"m 4.0746451,30.814715 0.33838,1.70499 1.81931,-2.54418 0.66289,-1.26895 z m 2.8527,-2.6096 c 0.0259,-0.0144 0.0536,-0.0254 0.0824,-0.0324 l 1.48332,-4.95503 -1.00455,-2.08428 -1.65509,1.74532 -2.23034,6.67667 -0.0415,0.93739 c 1.06528,-0.84215 2.18961,-1.60679 3.36433,-2.28803 z m -1.6945,-5.75654 -1.64891,6.43421 0.36468,-4.92266 z"},{"id":"forearm-right","name":"Right Forearm","path":"m 4.5752651,32.969125 -1.30083,10.28927 1.10778,0.01 1.89387,-7.99609 -0.19174,-4.53719 z m -1.21978,-1.94971 0.58728,2.58635 -1.11875,9.15614 -0.55849,-0.21663 -0.2304,-6.77018 z"},{"id":"chest-upper-left","name":"Left Upper Chest (Clavicular)","path":"m 20.337455,17.085495 1.72942,3.09103 1.890,0.94 -0.5,0.3 -6.8, -2.1 z"},{"id":"chest-lower-left","name":"Left Lower Chest (Sternal)","path":"m 16.66,19.72 6.8,2.1 -0.65,0.5 -0.90604,2.63773 -2.09968,0.86537 -3.34524,-1.655 0.2,-3.8 z"},{"id":"chest-upper-right","name":"Right Upper Chest (Clavicular)","path":"m 11.351215,17.085495 -1.7294199,3.09103 -1.890,0.94 0.5,0.3 6.8,-2.1 z"},{"id":"chest-lower-right","name":"Right Lower Chest (Sternal)","path":"m 15.03,19.72 -6.8,2.1 0.65,0.5 0.90586,2.63773 2.0996699,0.86537 3.34636,-1.655 -0.2,-3.8 z"},{"id":"abs-upper-left","name":"Left Abs (Upper)","path":"m 19.641935,34.707615 1.81341,-1.36479 0.15748,1.83347 1.28642,2.37338 -1.98044,2.73652 -1.03109,0.16554 -0.37026,-3.88816 z"},{"id":"serratus-anterior-left","name":"Left Serratus Anterior","path":"M 19.289,26.152 l -3.11202 -1.40604 0.0937 2.27965 2.80119 1.43603 z M 21.224,27.820 l -1.29355 0.7212 0.14997 -1.70898 z M 20.171,26.183 l 2.47968 -1.03241 -0.9336 2.52093 z M 21.702,27.921 l -1.69005 1.03372 -0.28871 2.0678 1.64975 -1.07533 z"},{"id":"obliques-left","name":"Left External Oblique","path":"M 18.791,29.025 l -0.0622 1.62387 -2.30308 -0.49961 -0.12448 -2.21722 z M 18.635,31.429 l 0.0311 1.99844 -2.20953 0.59391 -0.0311 -3.1227 z M 21.290,30.444 l -1.48383 1.03372 -0.20622 2.10905 1.64862 -1.32355 z"},{"id":"abs-upper-right","name":"Right Abs (Upper)","path":"m 12.045985,34.707615 -1.81341,-1.36479 -0.15748,1.83347 -1.2856799,2.37432 1.9804499,2.73595 1.03109,0.16554 0.37119,-3.88721 z"},{"id":"abs-lower-right","name":"Right Lower Abs","path":"m 15.636055,44.919735 -0.60647,-5.91209 -0.015,-3.84879 -2.18479,-1.07533 -0.24746,7.03017 z"},{"id":"abs-lower-left","name":"Left Lower Abs","path":"m 16.051865,44.919165 0.60628,-5.91209 0.0154,-3.84915 2.18404,-1.07515 0.24746,7.03017 z"},{"id":"serratus-anterior-right","name":"Right Serratus Anterior","path":"m 12.399365,26.152365 3.11202,-1.40603 -0.0937,2.27965 -2.80138,1.4364 z m -1.93508,1.6685 1.29355,0.72139 -0.14997,-1.70899 z m 1.05303,-1.637 -2.4793099,-1.03259 0.93361,2.52148 z m -1.5316399,1.73729 1.6900499,1.03372 0.28871,2.06743 -1.64881,-1.07515 z"},{"id":"obliques-right","name":"Right External Oblique","path":"M 12.897,29.025 l 0.0623 1.62387 2.30327 -0.49961 0.12448 -2.21703 z M 13.053,31.430 l -0.0309 1.99844 2.20973 0.59353 0.0311 -3.1227 z M 10.398,30.445 l 1.48384 1.0339 0.20622 2.10905 -1.64975 -1.32355 z"},{"id":"hip-flexor-right","name":"Right Groin / Hip Flexors","path":"m 14.404465,45.040075 0.0221,-0.0277 -0.14866,-0.37945 -3.10172,-3.40449 -0.23283,-0.0825 2.05918,5.32009 z m -1.17263,2.01833 1.27705,3.29948 0.42631,-4.04862 -0.25196,-0.64303 z"},{"id":"hip-flexor-left","name":"Left Groin / Hip Flexors","path":"m 17.284025,45.040455 -0.0221,-0.0281 0.14867,-0.37926 3.10171,-3.40449 0.23246,-0.0825 -2.05843,5.3199 z m 1.17263,2.01795 -1.27706,3.29948 -0.42631,-4.04843 0.25197,-0.64303 z"},{"id":"quads-left","name":"Left Quadriceps","path":"m 23.419015,50.399125 -0.15504,4.75091 -2.40263,6.60949 0.7362,1.90021 2.36401,-8.34435 z m -0.58154,-11.60825 -0.15485,4.00722 1.31793,7.93154 0.61977,-6.40308 z m -0.38731,5.12268 -2.75152,6.07258 -0.62015,4.87425 1.16232,6.85771 2.51886,-6.98144 0.15504,-7.18764 z"},{"id":"adductors-left","name":"Left Adductors","path":"m 22.063225,39.369605 v 4.21363 l -2.94574,5.82511 -1.86027,5.78349 0.19365,-4.0072 z m -3.24944,13.42596 -0.0649,0.15467 -1.21294,2.90207 0.78325,7.18803 1.23619,-0.66122 -1.0714,-6.69272 z"},{"id":"foot-left","name":"Left Foot","path":"m 17.255895,87.868445 0.1243,3.45228 0.28983,1.20638 h 0.87136 l 0.24897,-0.83181 0.29058,-0.0416 -0.0624,0.83181 1.09914,-0.33332 0.29058,-0.16629 1.24444,-0.27033 0.0416,-0.97748 -1.20319,-2.03743 -0.82974,-1.0399 -2.03294,-0.83181 z"},{"id":"tibialis-anterior-left","name":"Left Tibialis Anterior","path":"m 18.251375,70.441125 0.29058,0.91486 0.6224,3.8681 0.0829,5.15733 -0.87136,5.03304 0.0412,-6.44714 -0.91242,-2.57848 -0.12561,-2.82837 z m 1.9915,2.32915 -0.20753,7.73637 -1.65949,6.23904 1.80478,-0.853 3.00816,-10.83583 -1.03727,-6.82095 z"},{"id":"knee-left","name":"Left Knee","path":"m 21.404635,64.784375 0.1243,1.12295 -0.87118,1.08171 -0.29058,1.70599 -0.58116,0.24933 -0.49774,-2.57866 -0.33182,-0.91486 0.29058,-0.58247 z m -3.85853,0.0832 0.6224,1.74685 1.3273,2.57867 -0.33182,2.37095 -0.95423,-2.66209 -0.78738,-1.49734 z m 4.97811,-2.37039 -0.95423,5.11609 0.62241,-0.33295 0.49773,1.66381 z"},{"id":"quads-right","name":"Right Quadriceps","path":"m 8.2694651,50.399125 0.15504,4.75053 2.4026299,6.60968 -0.73638,1.90021 -2.3640099,-8.34435 z m 0.58117,-11.60768 0.15503,4.00684 -1.31754,7.93154 -0.61978,-6.40308 z m 0.38769,5.1223 2.7515099,6.07239 0.61997,4.87425 -1.16232,6.85771 -2.5190499,-6.98163 -0.15504,-7.18801 z"},{"id":"adductors-right","name":"Right Adductors","path":"m 9.6258251,39.369415 v 4.21363 l 2.9451699,5.8253 1.86028,5.78349 -0.19366,-4.0072 z m 3.2488699,13.42559 0.0647,0.15485 1.21294,2.90207 -0.78307,7.18803 -1.23618,-0.66102 1.0714,-6.69273 z"},{"id":"foot-right","name":"Right Foot","path":"m 14.433335,87.868265 -0.12448,3.45228 -0.29058,1.20637 h -0.87118 l -0.24877,-0.83181 -0.29059,-0.0416 0.0623,0.83181 -1.09934,-0.33333 -0.29058,-0.16629 -1.2448,-0.27033 -0.0412,-0.97747 1.2031899,-2.03781 0.82975,-1.04009 2.03294,-0.83181 z"},{"id":"tibialis-anterior-right","name":"Right Tibialis Anterior","path":"m 13.437675,70.440945 -0.29058,0.91486 -0.62241,3.86828 -0.0829,5.15733 0.87174,5.03304 -0.0418,-6.44714 0.91298,-2.57848 0.1243,-2.82837 z m -1.99151,2.32914 0.20735,7.73637 1.65968,6.23904 -1.80497,-0.85299 -3.0079799,-10.83584 1.03728,-6.82095 z"},{"id":"knee-right","name":"Right Knee","path":"m 10.284405,64.784375 -0.12448,1.12295 0.87118,1.08171 0.29058,1.70599 0.58116,0.24933 0.49774,-2.57866 0.33182,-0.91486 -0.29058,-0.58247 z m 3.85854,0.0832 -0.62241,1.74685 -1.32767,2.57867 0.33182,2.37095 0.95423,-2.66209 0.78832,-1.4964 z m -4.9786799,-2.37058 0.9542299,5.11609 -0.6223999,-0.33313 -0.49793,1.6638 z"},{"id":"elbow-right","name":"Right Elbow","path":"m 3.2054751,27.370125 0.005,3.09419 -0.57959,1.91184 -0.54539,-2.41185 z"},{"id":"hand-right","name":"Right Hand","path":"m 4.3904451,43.563145 -1.5198,0.0506 -0.76631,-0.67112 -1.21261996,2.15767 -0.86245,3.32873 0.49386,0.22113 0.59814996,-2.20238 0.50016,0.25356 -0.35639,2.49422 0.62382,0.24345 0.41402,-2.49194 0.55839,0.17851 -0.2262,2.76603 0.76938,0.32268 0.25788,-2.86764 0.4578,-0.0181 0.16611,2.65239 0.65997,0.2633 0.0712,-4.56643 0.34158,-0.19428 1.35316,1.68367 0.32832,-0.34354 -0.72644,-2.0551 z"},{"id":"elbow-left","name":"Left Elbow","path":"m 28.325215,27.370125 -0.005,3.09419 0.57959,1.91184 0.54538,-2.41185 z"},{"id":"hand-left","name":"Left Hand","path":"m 27.140245,43.563145 1.5198,0.0506 0.76631,-0.67111 1.21262,2.15766 0.86245,3.32873 -0.49386,0.22113 -0.59815,-2.20238 -0.50016,0.25356 0.35639,2.49422 -0.62382,0.24345 -0.41402,-2.49194 -0.55839,0.17851 0.2262,2.76603 -0.76938,0.32268 -0.25788,-2.86764 -0.4578,-0.0181 -0.16611,2.6524 -0.65997,0.26329 -0.0712,-4.56643 -0.34158,-0.19428 -1.35316,1.68368 -0.32832,-0.34355 0.72644,-2.0551 z"}];
const SWOLECAT_ANATOMY_BACK=[{"id":"head-back","name":"Head (Posterior)","path":"m 48.157455,6.3585449 0.44208,-0.14964 0.16111,0.16427 1.48163,4.0475101 2.32401,1.45118 2.39971,-1.52387 0.97577,-3.6896901 0.52752,-0.55908 0.23367,0.0981 0.24198,-3.34467 -2.03129,-2.31103004 -2.84509,-0.51629 -2.20422,0.52915 -1.93631,2.63077004 z"},{"id":"nape","name":"Nape","path":"m 52.369695,12.105075 -2.35767,-1.55045 -1.47119,-3.9514301 -0.60741,0.0403 0.27409,1.82447 0.97635,0.33932 0.7613,2.2157201 0.33017,1.06849 0.0895,2.14894 1.16448,0.008 0.10563,-0.70833 0.54716,-0.0606 z m 1.01793,1.47595 0.23768,0.64982 1.38107,-0.004 0.01,-2.38784 0.25971,-0.79061 0.57215,-2.1698001 0.76359,-0.41018 0.25158,-1.78416 -0.62859,0.0193 -1.08488,3.8998101 -2.39725,1.46684 0.2768,1.48507 z"},{"id":"traps-upper-left","name":"Left Trapezius (Upper)","path":"M 49.625,14.629 L 49.688,12.005 L 48.974,13.157 L 44.594,14.654 L 45.945,16.925 L 51.222,16.925 L 51.183,14.550 Z"},{"id":"traps-mid-left","name":"Left Trapezius (Mid)","path":"M 46.034,17.075 L 48.920,21.925 L 51.303,21.925 L 51.224,17.075 Z"},{"id":"traps-lower-left","name":"Left Trapezius (Lower)","path":"M 49.009,22.075 L 49.572,23.022 L 51.403,28.104 L 51.305,22.075 Z"},{"id":"traps-upper-right","name":"Right Trapezius (Upper)","path":"M 55.439,14.729 L 55.376,12.104 L 56.090,13.256 L 60.470,14.754 L 59.179,16.925 L 53.844,16.925 L 53.881,14.649 Z"},{"id":"traps-mid-right","name":"Right Trapezius (Mid)","path":"M 59.089,17.075 L 56.204,21.925 L 53.763,21.925 L 53.842,17.075 Z"},{"id":"traps-lower-right","name":"Right Trapezius (Lower)","path":"M 56.114,22.075 L 55.492,23.121 L 53.661,28.203 L 53.761,22.075 Z"},{"id":"lats-upper-left","name":"Left Lats (Upper)","path":"M 44.144,15.285 L 39.888,20.286 L 39.426,22.749 L 41.263,21.510 L 44.025,20.355 L 45.663,23.400 L 49.103,23.400 Z"},{"id":"deltoid-rear-left","name":"Left Rear Deltoid","path":"M 42.201,16.586 L 40.626,18.152 L 39.736,20.156 L 43.992,15.155 Z"},{"id":"lats-mid-left","name":"Left Lats (Mid)","path":"M 45.771,23.600 L 45.872,23.789 L 47.009,29.286 L 47.023,30.400 L 51.080,30.400 L 51.053,28.314 L 49.185,23.600 Z"},{"id":"lats-lower-left","name":"Left Lats (Lower)","path":"M 47.026,30.600 L 47.086,35.145 L 51.156,36.255 L 51.082,30.600 Z"},{"id":"deltoid-rear-right","name":"Right Rear Deltoid","path":"M 62.863,16.686 L 64.438,18.251 L 65.328,20.255 L 61.073,15.254 Z"},{"id":"lats-upper-right","name":"Right Lats (Upper)","path":"M 60.921,15.384 L 65.176,20.385 L 65.290,22.849 L 63.801,21.609 L 61.039,20.454 L 59.455,23.400 L 56.022,23.400 Z"},{"id":"lats-mid-right","name":"Right Lats (Mid)","path":"M 59.347,23.600 L 59.192,23.888 L 58.055,29.385 L 58.042,30.400 L 53.986,30.400 L 54.012,28.413 L 55.918,23.600 Z"},{"id":"lats-lower-right","name":"Right Lats (Lower)","path":"M 58.039,30.600 L 57.979,35.245 L 53.908,36.354 L 53.983,30.600 Z"},{"id":"triceps-long-left","name":"Left Triceps (Long Head)","path":"M 43.593,21.039 L 44.920,23.967 L 43.615,25.653 L 43.186,27.069 L 39.209,29.802 Z"},{"id":"triceps-lateral-left","name":"Left Triceps (Lateral Head)","path":"M 43.459,20.972 L 39.075,29.735 L 38.871,25.461 L 39.407,23.674 L 41.242,21.927 Z"},{"id":"hand-back-left","name":"Left Hand (Back)","path":"M 40.716955,42.424835 l -1.5182,0.0863 -0.78184,-0.65295 -1.16168,2.1855 -0.78414,3.34805 0.49892,0.20949 0.54632,-2.2158 0.50597,0.24175 -0.29779,2.5019 0.62936,0.22875 0.35546,-2.50096 0.56242,0.16536 -0.16126,2.77057 0.77674,0.30455 0.19056,-2.87291 0.45724,-0.0289 0.22827,2.64778 0.66597,0.24774 -0.0359,-4.56685 0.33693,-0.20224 1.39227,1.65147 0.32017,-0.35115 -0.77444,-2.03749 z"},{"id":"forearm-flexors-left","name":"Forearm Flexors Left","path":"M 40.775,29.006 L 42.870,27.644 L 42.187,29.635 L 42.603,34.383 L 40.799,42.081 L 39.814,42.253 Z"},{"id":"forearm-extensors-left","name":"Forearm Extensors Left","path":"M 39.665,42.242 L 38.305,41.501 L 37.998,34.491 L 38.635,31.429 L 39.245,30.209 L 40.625,28.994 Z"},{"id":"triceps-long-right","name":"Right Triceps (Long Head)","path":"M 61.376,21.213 L 60.056,24.145 L 61.330,26.199 L 61.657,27.251 L 65.780,29.966 Z"},{"id":"triceps-lateral-right","name":"Right Triceps (Lateral Head)","path":"M 61.510,21.146 L 65.914,29.899 L 66.108,25.624 L 65.568,23.839 L 63.729,22.096 Z"},{"id":"hand-back-right","name":"Right Hand (Back)","path":"M 64.301385,42.592325 l 1.51839,0.0828 0.78033,-0.65476 1.16673,2.18281 0.79187,3.34623 -0.49843,0.21064 -0.55144,-2.21453 -0.50541,0.24292 0.30356,2.5012 -0.62882,0.23021 -0.36124,-2.50014 -0.56203,0.16666 0.16765,2.77019 -0.77603,0.30634 -0.19719,-2.87245 -0.45732,-0.0278 -0.22215,2.64829 -0.66539,0.24928 0.0254,-4.56692 -0.3374,-0.20146 -1.38845,1.65469 -0.32098,-0.35041 0.76973,-2.03928 z"},{"id":"forearm-flexors-right","name":"Forearm Flexors Right","path":"M 65.204,42.420 L 63.925,29.007 L 61.764,27.798 L 62.786,29.733 L 62.397,34.555 L 64.219,42.248 Z"},{"id":"forearm-extensors-right","name":"Forearm Extensors Right","path":"M 64.075,28.993 L 65.353,42.405 L 66.712,41.663 L 67.002,34.653 L 66.358,31.591 L 65.745,30.373 Z"},{"id":"spine","name":"Spine","path":"m 51.733705,14.788555 0.53876,25.33066 0.48967,-0.0297 0.65658,-25.3387 -0.28147,-0.84188 -1.25059,-4.9e-4 z"},{"id":"lower-back-erectors-left","name":"Erector Spinae Left","path":"M 52.100,37.310 L 49.537,36.465 L 50.244,40.788 L 52.200,42.030 L 52.200,40.270 L 52.150,40.280 Z"},{"id":"lower-back-ql-left","name":"Quadratus Lumborum Left","path":"M 49.389,36.490 L 46.240,35.460 L 44.720,39.420 L 50.096,40.812 Z"},{"id":"lower-back-erectors-right","name":"Erector Spinae Right","path":"M 52.800,42.030 L 52.800,40.270 L 52.850,40.260 L 52.900,37.290 L 55.289,36.625 L 54.805,40.801 Z"},{"id":"lower-back-ql-right","name":"Quadratus Lumborum Right","path":"M 55.439,36.643 L 55.980,36.470 L 58.320,35.720 L 59.660,39.450 L 54.955,40.819 Z"},{"id":"gluteus-medius-left","name":"Gluteus Medius Left","path":"M 50.191,41.481 L 44.740,39.690 L 43.830,41.580 L 43.431,44.301 Z"},{"id":"gluteus-maximus-left","name":"Gluteus Maximus Left","path":"M 50.249,41.619 L 43.489,44.439 L 44.410,50.520 L 47.180,51.030 L 51.620,49.090 L 52.200,49.480 L 52.200,42.880 Z"},{"id":"gluteus-medius-right","name":"Gluteus Medius Right","path":"M 55.274,41.079 L 61.354,45.519 L 60.640,42.150 L 59.740,39.860 Z"},{"id":"gluteus-maximus-right","name":"Gluteus Maximus Right","path":"M 55.186,41.201 L 52.800,42.880 L 52.800,49.480 L 53.570,49.090 L 57.680,50.760 L 60.500,50.600 L 61.266,45.641 Z"},{"id":"knee-back-left","name":"Left Back Knee","path":"m 51.176145,64.073985 -1.20605,3.01461 0.70738,0.26558 0.89754,3.51771 -0.55801,-4.01191 z m -5.08496,-3.15003 0.63355,1.8609 0.16813,2.03261 0.61314,1.93117 -0.90585,-0.0851 -0.28534,2.15982 z"},{"id":"knee-back-right","name":"Right Back Knee","path":"m 54.019305,64.073985 1.20605,3.01461 -0.70737,0.26558 -0.89755,3.51771 0.55802,-4.01191 z m 5.08496,-3.15003 -0.63355,1.8609 -0.16813,2.03261 -0.61313,1.93117 0.90584,-0.0851 0.28534,2.15982 z"},{"id":"calves-gastroc-medial-left","name":"Gastrocnemius Medial Left","path":"M 50.568,67.512 L 51.669,72.509 L 51.379,75.532 L 51.292,76.825 L 48.983,76.825 Z"},{"id":"calves-gastroc-lateral-left","name":"Gastrocnemius Lateral Left","path":"M 50.218,67.512 L 48.633,76.825 L 46.283,76.825 L 45.533,74.263 L 46.783,67.088 Z"},{"id":"calves-soleus-left","name":"Soleus Left","path":"M 46.386,77.175 L 51.269,77.175 L 50.701,85.598 L 49.037,86.233 Z"},{"id":"calves-gastroc-medial-right","name":"Gastrocnemius Medial Right","path":"M 54.628,67.512 L 53.526,72.509 L 53.816,75.532 L 53.903,76.825 L 56.213,76.825 Z"},{"id":"calves-gastroc-lateral-right","name":"Gastrocnemius Lateral Right","path":"M 54.978,67.512 L 56.563,76.825 L 58.912,76.825 L 59.662,74.263 L 58.412,67.088 Z"},{"id":"calves-soleus-right","name":"Soleus Right","path":"M 53.927,77.175 L 58.810,77.175 L 56.158,86.233 L 54.495,85.598 Z"},{"id":"foot-back-left","name":"Left Foot (Back)","path":"M 50.933115,88.340995 l 0.85194,1.3581 0.37189,0.79238 -0.15588,1.21774 -0.76984,0.74446 -1.51185,0.12543 -1.1299,-0.29192 -0.24225,-0.95894 0.80765,-1.30405 -0.22562,-0.85987 0.29679,-0.84153 -0.0194,-1.81524 1.53568,-0.54817 z m -1.19598,0.4675 0.15943,1.25776 -0.6023,0.97431 m -0.54436,0.29544 1.06474,0.40084 1.55326,-0.65137 z"},{"id":"hamstrings-medial-left","name":"Medial Hamstrings (Semis) Left","path":"M 49.550,50.504 L 51.751,49.461 L 52.389,49.692 L 52.424,51.499 L 52.499,56.145 L 50.521,62.188 L 50.997,63.602 L 49.569,66.897 L 48.755,66.754 Z"},{"id":"hamstrings-lateral-left","name":"Lateral Hamstrings (Biceps) Left","path":"M 49.400,50.496 L 48.605,66.746 L 47.803,66.596 L 47.302,64.480 L 47.133,62.723 L 44.712,54.565 L 44.369,50.918 L 47.200,51.500 Z"},{"id":"foot-back-right","name":"Right Foot (Back)","path":"M 54.262335,88.340995 l -0.85194,1.3581 -0.37189,0.79238 0.15589,1.21774 0.76983,0.74446 1.51186,0.12543 1.12989,-0.29192 0.24225,-0.95894 -0.80765,-1.30405 0.22563,-0.85987 -0.29679,-0.84153 0.0194,-1.81524 -1.53568,-0.54817 z m 1.19598,0.4675 -0.15943,1.25776 0.6023,0.97431 m 0.54436,0.29544 -1.06474,0.40084 -1.55326,-0.65137 z"},{"id":"hamstrings-medial-right","name":"Medial Hamstrings (Semis) Right","path":"M 57.425,51.196 L 56.565,66.806 L 55.759,66.965 L 54.331,63.670 L 54.807,62.256 L 52.829,56.213 L 52.904,51.567 L 52.956,49.769 L 53.520,49.498 Z"},{"id":"hamstrings-lateral-right","name":"Lateral Hamstrings (Biceps) Right","path":"M 57.575,51.204 L 60.625,50.950 L 60.616,54.633 L 58.195,62.791 L 58.026,64.547 L 57.525,66.663 L 56.715,66.814 Z"}];
function anatomyScoreRegion(id){
 if(/^chest-/.test(id))return 'chest';
 if(/^shoulder-front-/.test(id))return 'front_delts';
 if(/^shoulder-side-/.test(id))return 'side_delts';
 if(/^deltoid-rear-/.test(id))return 'rear_delts';
 if(/^biceps-/.test(id))return 'biceps';
 if(/^triceps-/.test(id))return 'triceps';
 if(/^forearm/.test(id))return 'forearms';
 if(/^abs-/.test(id))return 'core';
 if(/^obliques-/.test(id))return 'obliques';
 if(/^adductors-/.test(id))return 'adductors';
 if(/^quads-/.test(id))return 'quads';
 if(/^tibialis-anterior-/.test(id))return 'tibialis';
 if(/^calves-/.test(id))return 'calves';
 if(/^traps-upper-/.test(id))return 'traps';
 if(/^traps-(mid|lower)-/.test(id))return 'upper_back';
 if(/^lats-/.test(id))return 'lats';
 if(/^lower-back-/.test(id))return 'lower_back';
 if(/^gluteus-/.test(id))return 'glutes';
 if(/^hamstrings-/.test(id))return 'hamstrings';
 return '';
}
function availableHeatMapMuscleRegions(){
 return [...new Set([...SWOLECAT_ANATOMY_FRONT,...SWOLECAT_ANATOMY_BACK].map(x=>anatomyScoreRegion(x.id)).filter(Boolean))];
}
function auditExerciseMuscleCoverage(){
 const drawable=new Set(availableHeatMapMuscleRegions());
 return LIBRARY.map(ex=>{
   const meta=exerciseMuscleMetadata(ex);
   const missing=[...meta.primary,...meta.secondary].filter(m=>!drawable.has(m));
   return {id:ex.id,name:ex.name,primary:meta.primary,secondary:meta.secondary,missing};
 });
}

function anatomyPathClass(part,scores){
 const region=anatomyScoreRegion(part.id);
 if(!region)return 'anatomy-neutral';
 return 'anatomy-muscle heat-'+muscleHeatLevel(Number(scores?.[region])||0);
}
function muscleHeatMapSvg(side,scores={}){
 const isBack=side==='back',parts=isBack?SWOLECAT_ANATOMY_BACK:SWOLECAT_ANATOMY_FRONT;
 const viewBox=isBack?'37 0 35 93':'0 0 35 93';
 const paths=parts.map(part=>{
   const region=anatomyScoreRegion(part.id);
   const regionAttr=region?` data-region="${region}"`:'';
   return `<path class="${anatomyPathClass(part,scores)}" data-anatomy-id="${escAttr(part.id)}"${regionAttr} d="${escAttr(part.path)}"><title>${esc(part.name)}</title></path>`;
 }).join('');
 return `<svg class="muscle-map-svg" viewBox="${viewBox}" role="img" aria-label="${isBack?'Back':'Front'} muscle involvement map">
   <defs><filter id="scAnatomyGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".22" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
   <path class="muscle-map-accent" d="${isBack?'M39 7h3M67 7h3M39 87h3M67 87h3':'M2 7h3M30 7h3M2 87h3M30 87h3'}"/>
   <g class="anatomy-body">${paths}</g>
 </svg>`;
}

function muscleHeatMapHtml(session){
 const scores=sessionMuscleScores(session);
 const ranked=Object.entries(scores).filter(([,score])=>score>0).sort((a,b)=>b[1]-a[1]);
 return `<div class="muscle-heatmap-grid">
   <div class="muscle-map-card"><div class="muscle-map-title">Front</div>${muscleHeatMapSvg('front',scores)}</div>
   <div class="muscle-map-card"><div class="muscle-map-title">Back</div>${muscleHeatMapSvg('back',scores)}</div>
 </div>
 <div class="muscle-map-legend">
   <div class="muscle-map-legend-item"><span class="muscle-map-dot heat-0"></span>Untargeted</div>
   <div class="muscle-map-legend-item"><span class="muscle-map-dot heat-1"></span>Light</div>
   <div class="muscle-map-legend-item"><span class="muscle-map-dot heat-2"></span>Moderate</div>
   <div class="muscle-map-legend-item"><span class="muscle-map-dot heat-3"></span>High</div>
 </div>
 ${ranked.length?`<div class="muscle-score-list">${ranked.slice(0,8).map(([muscle,score])=>`<span class="muscle-score-chip"><b>${esc(MUSCLE_REGION_LABELS[muscle]||muscle)}</b> · ${score % 1 ? score.toFixed(1) : score} set-eq</span>`).join('')}</div>`:''}
 <div class="muscle-map-note">Based on completed working sets. Primary muscles contribute more than secondary muscles. This map shows relative training involvement only — not soreness, recovery, muscle damage, or measured activation.</div>`;
}
function sessionVolume(s){
 return s.exercises.reduce((sum,e)=>sum+completedSets(e).reduce((a,x)=>a+(Number(x.weight)||0)*(Number(x.reps)||0),0),0);
}
function sessionSetCount(s){return s.exercises.reduce((n,e)=>n+progressionSets(e).length,0)}
function sessionAllSetCount(s){return s.exercises.reduce((n,e)=>n+completedSets(e).length,0)}
function sessionPRCount(s){return s.exercises.reduce((n,e)=>n+(progressionSets(e).some(x=>x.pr)?1:0),0)}
function sessionTotalReps(s){return (s.exercises||[]).reduce((n,e)=>n+completedSets(e).reduce((a,set)=>a+(Number(set.reps)||0),0),0)}
function sessionCompletedExerciseCount(s){return (s.exercises||[]).filter(e=>!e.skipped&&completedSets(e).length>0).length}
function sessionMuscleGroups(s){
 const groups=[];
 (s.exercises||[]).forEach(e=>{
   if(e.skipped||!completedSets(e).length)return;
   const meta=exerciseMuscleMetadata(exById(e.exerciseId));
   meta.primary.forEach(m=>groups.push(MUSCLE_REGION_LABELS[m]||m));
 });
 return [...new Set(groups)];
}
function sessionPRDetails(s){
 const rows=[];
 (s.exercises||[]).forEach(e=>{
   const ex=exById(e.exerciseId);
   const labels=[...new Set(progressionSets(e).map(set=>set.pr).filter(Boolean))];
   if(labels.length)rows.push({exerciseId:e.exerciseId,name:ex?.name||'Exercise',labels});
 });
 return rows;
}
function previousSessionExercise(exerciseId,sessions=state.sessions){
 for(let i=sessions.length-1;i>=0;i--){
   const row=(sessions[i].exercises||[]).find(e=>e.exerciseId===exerciseId&&progressionSets(e).length);
   if(row)return row;
 }
 return null;
}
function sessionsBeforeSession(session){
 const at=new Date(session?.date||0).getTime();
 if(!Number.isFinite(at))return [];
 return state.sessions
   .filter(s=>s.id!==session.id&&new Date(s.date).getTime()<at)
   .sort((a,b)=>new Date(a.date)-new Date(b.date));
}
function historicalProgressHighlights(session){
 return sessionProgressHighlights(session,sessionsBeforeSession(session));
}
function openHistoricalWorkoutRecap(id){
 const session=state.sessions.find(s=>s.id===id);
 if(!session)return;
 openModal('Workout recap',workoutRecapHtml(session,{progressHighlights:historicalProgressHighlights(session),historical:true}));
}
function sessionProgressHighlights(s,priorSessions=state.sessions){
 const highlights=[];
 (s.exercises||[]).forEach(e=>{
   const current=progressionSets(e);
   if(!current.length)return;
   const prior=previousSessionExercise(e.exerciseId,priorSessions);
   if(!prior)return;
   const previous=progressionSets(prior);
   if(!previous.length)return;
   const ex=exById(e.exerciseId),name=ex?.name||'Exercise';
   const currentMax=Math.max(...current.map(set=>Number(set.weight)||0));
   const previousMax=Math.max(...previous.map(set=>Number(set.weight)||0));
   const currentReps=current.reduce((n,set)=>n+(Number(set.reps)||0),0);
   const previousReps=previous.reduce((n,set)=>n+(Number(set.reps)||0),0);
   const currentVolume=current.reduce((n,set)=>n+(Number(set.weight)||0)*(Number(set.reps)||0),0);
   const previousVolume=previous.reduce((n,set)=>n+(Number(set.weight)||0)*(Number(set.reps)||0),0);
   if(currentMax>previousMax){
     highlights.push({name,text:`Top working weight increased from ${previousMax} to ${currentMax} ${state.profile.unit}.`});
   }else if(currentMax===previousMax&&currentReps>previousReps){
     highlights.push({name,text:`Logged ${currentReps-previousReps} more working-set rep${currentReps-previousReps===1?'':'s'} at the same top load.`});
   }else if(currentVolume>0&&previousVolume>0&&currentVolume>previousVolume*1.02){
     const pct=Math.round((currentVolume/previousVolume-1)*100);
     highlights.push({name,text:`Working-set volume increased about ${pct}% versus the previous exposure.`});
   }
 });
 return highlights.slice(0,4);
}
function formatSessionCompletionTime(s){
 const d=new Date(s.date);
 return Number.isNaN(d.getTime())?'Completed workout':d.toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
}
function routineSavedFromSession(sessionId){
 return state.routines.find(r=>r.sourceSessionId===sessionId)||null;
}
function completedSessionRoutineExercises(session){
 return (session?.exercises||[])
   .filter(e=>!e.skipped&&completedSets(e).length)
   .map(e=>{
     const row=routineExerciseFromWorkout(e);
     const completedWorking=progressionSets(e).length,completedAny=completedSets(e).length;
     row.sets=Math.max(1,completedWorking||completedAny||row.sets||1);
     return row;
   });
}
function routineFromCompletedSession(session,name){
 if(!session)return null;
 const exercises=completedSessionRoutineExercises(session);
 if(!exercises.length)return null;
 const existingLinked=!!(session.routineId&&state.routines.some(r=>r.id===session.routineId));
 const routine={
   id:uid(),
   name:(name||session.routineName||'Saved Workout').trim()||'Saved Workout',
   description:`Saved from completed workout · ${formatSessionCompletionTime(session)}`,
   trainingMode:normalizeTrainingMode(session.trainingMode),
   sourceSessionId:session.id,
   sourceType:'completed_session',
   exercises
 };
 cleanupRoutineSupersets(routine);
 if(existingLinked&&routine.name===session.routineName)routine.name=`${routine.name} Copy`;
 return routine;
}
function openSaveSessionAsRoutine(sessionId){
 const session=state.sessions.find(s=>s.id===sessionId);if(!session)return;
 const already=routineSavedFromSession(sessionId);
 if(already){closeModal();go('routines');showToast('That workout is already saved as a routine');return}
 const exercises=completedSessionRoutineExercises(session);
 if(!exercises.length){showToast('No completed exercises to save');return}
 const linked=!!(session.routineId&&state.routines.some(r=>r.id===session.routineId));
 const defaultName=linked?`${session.routineName||'Workout'} Copy`:(session.routineName||'Saved Workout');
 openModal('Save workout as routine',`
   <div class="notice"><b>Save what you actually trained.</b><br>This creates a new reusable routine from the completed workout. Your historical session stays unchanged.</div>
   <div class="field" style="margin-top:12px"><label>Routine name</label><input id="sessionRoutineName" value="${escAttr(defaultName)}"></div>
   <div class="picker-section">Exercises</div>
   <div class="card">${exercises.map((row,i)=>`<div class="list-item"><div class="program-letter">${i+1}</div><div class="grow"><div class="exercise-name">${esc(exById(row.exerciseId)?.name||'Exercise')}</div><div class="mini">${row.sets} working set${row.sets===1?'':'s'} · ${row.minReps}–${row.maxReps} reps · ${row.restSeconds}s rest</div></div></div>`).join('')}</div>
   <div class="actions"><button class="btn" onclick="saveCompletedSessionAsRoutine('${escAttr(sessionId)}')">Save Routine</button><button class="btn secondary" onclick="closeModal()">Cancel</button></div>
 `);
}
function saveCompletedSessionAsRoutine(sessionId){
 const session=state.sessions.find(s=>s.id===sessionId);if(!session)return null;
 const already=routineSavedFromSession(sessionId);
 if(already){showToast('That workout is already saved as a routine');return already.id}
 const name=document.getElementById('sessionRoutineName')?.value?.trim()||session.routineName||'Saved Workout';
 const routine=routineFromCompletedSession(session,name);
 if(!routine){showToast('No completed exercises to save');return null}
 state.routines.push(routine);save();renderRoutines();renderHome();closeModal();showToast('Workout saved as a routine');
 return routine.id;
}
function workoutRecapHtml(session,{updateRoutine=false,progressHighlights=[],historical=false}={}){
 const workingSets=sessionSetCount(session),allSets=sessionAllSetCount(session),reps=sessionTotalReps(session);
 const savedRoutine=routineSavedFromSession(session.id);
 const linkedRoutine=!!(session.routineId&&state.routines.some(r=>r.id===session.routineId));
 const volume=Math.round(sessionVolume(session)),prs=sessionPRDetails(session),muscles=sessionMuscleGroups(session);
 const completedExercises=sessionCompletedExerciseCount(session),skipped=(session.exercises||[]).filter(e=>e.skipped).length;
 const exerciseRows=(session.exercises||[]).map(e=>{
   const ex=exById(e.exerciseId),done=completedSets(e),working=progressionSets(e);
   if(e.skipped)return `<div class="recap-exercise"><div class="recap-exercise-name">${esc(ex?.name||'Exercise')}</div><div class="recap-exercise-meta">Skipped for this session</div></div>`;
   if(!done.length)return `<div class="recap-exercise"><div class="recap-exercise-name">${esc(ex?.name||'Exercise')}</div><div class="recap-exercise-meta">No completed sets</div>${e.notes?`<div class="muscle-map-note" style="margin-top:8px"><b>Notes</b><br>${esc(e.notes)}</div>`:''}</div>`;
   const totalReps=done.reduce((n,set)=>n+(Number(set.reps)||0),0);
   const topWeight=Math.max(...done.map(set=>Number(set.weight)||0));
   const prCount=working.filter(set=>set.pr).length;
   const setRows=done.map((set,i)=>{
     const ordinal=e.sets.slice(0,e.sets.indexOf(set)+1).filter(x=>setType(x)===setType(set)).length;
     const load=Number(set.weight)||0,reps=Number(set.reps)||0;
     return `<div class="recap-set-row"><span>${esc(setTypeLabel(setType(set)))} ${ordinal}</span><b>${load} ${state.profile.unit} × ${reps}</b>${set.rir!==''&&set.rir!=null?`<span>${esc(String(set.rir))} RIR</span>`:'<span></span>'}${set.pr?`<span class="inline-pr-mark">PR</span>`:'<span></span>'}</div>`;
   }).join('');
   return `<div class="recap-exercise">
     <div class="recap-exercise-top"><div><div class="recap-exercise-name">${esc(ex?.name||'Exercise')}</div><div class="recap-exercise-meta">${working.length} working set${working.length===1?'':'s'} · ${totalReps} total reps${topWeight>0?` · top ${topWeight} ${state.profile.unit}`:''}</div></div>${prCount?`<span class="preference-badge prefer">PR ×${prCount}</span>`:''}</div>
     <div class="recap-set-list">${setRows}</div>
     ${e.notes?`<div class="muscle-map-note" style="margin-top:8px"><b>Notes</b><br>${esc(e.notes)}</div>`:''}
   </div>`;
 }).join('');
 const progressionHtml=progressHighlights.length
   ?progressHighlights.map(row=>`<div class="recap-progression"><b>${esc(row.name)}</b><div class="mini">${esc(row.text)}</div></div>`).join('')
   :'<div class="notice">No standout progression callout this session. The recap only highlights clear changes versus your previous exposure.</div>';
 const prHtml=prs.length
   ?prs.map(row=>`<div class="summary-pr"><b><span class="inline-pr-mark">PR</span> ${esc(row.name)}</b><div class="mini">${row.labels.map(x=>esc(x)).join(' · ')}</div></div>`).join('')
   :'<div class="notice">No PR badge this time. PRs are only called when the logged performance clears the existing record logic.</div>';
 return `
   <div class="workout-recap-hero">
     <div class="eyebrow">${historical?'HISTORICAL SESSION · SAVED LOCALLY':'SESSION COMPLETE · SAVED LOCALLY'}</div>
     <div class="workout-recap-title">${esc(session.routineName)}</div>
     <div class="workout-recap-time">${esc(formatSessionCompletionTime(session))} · ${session.durationMinutes||0} min</div>
   </div>
   <div class="recap-metrics">
     <div class="recap-metric"><b>${completedExercises}</b><span>Exercises</span></div>
     <div class="recap-metric"><b>${workingSets}</b><span>Working sets</span></div>
     <div class="recap-metric"><b>${reps}</b><span>Total reps</span></div>
     <div class="recap-metric"><b>${prs.length}</b><span>Exercises with PR</span></div>
   </div>
   <div class="recap-section">
     <div class="recap-section-title">Training snapshot</div>
     ${volume>0?`<div class="summary-win"><b>${volume.toLocaleString()} ${state.profile.unit} × reps</b><div class="mini">External-load volume from completed sets. Useful as context, not a score to maximize.</div></div>`:'<div class="notice">External-load volume is not meaningful for this session based on the logged weights.</div>'}
     ${allSets!==workingSets?`<div class="mini" style="margin:8px 2px 0">${allSets} total completed sets including warm-up/drop/failure sets.</div>`:''}
     ${skipped?`<div class="mini" style="margin:5px 2px 0">${skipped} exercise${skipped===1?' was':'s were'} skipped today.</div>`:''}
     ${updateRoutine?'<div class="summary-win"><b>Routine updated</b><div class="mini">Today’s structural changes are now saved to the routine.</div></div>':''}
   </div>
   <div class="recap-section">
     <div class="recap-section-title">Muscles trained</div>
     ${muscles.length?`<div class="recap-muscles">${muscles.map(m=>`<span class="recap-muscle">${esc(m)}</span>`).join('')}</div>`:'<div class="notice">Muscle-group metadata is not available for the completed exercises.</div>'}
   </div>
   <div class="recap-section">
     <div class="recap-section-title">Muscle involvement map</div>
     ${muscleHeatMapHtml(session)}
   </div>
   <div class="recap-section"><div class="recap-section-title">Exercises</div><div class="recap-exercise-list">${exerciseRows}</div></div>
   <div class="recap-section"><div class="recap-section-title">Progression versus last exposure</div>${progressionHtml}</div>
   <div class="recap-section"><div class="recap-section-title">Personal records</div>${prHtml}</div>
   ${session.programId&&programById(session.programId)?`<div class="summary-win"><b>Next in ${esc(programById(session.programId).name)}</b><div class="mini">${esc(programNextRoutine(programById(session.programId))?.name||'Program complete')}</div></div>`:''}
   <div class="actions">
     ${savedRoutine?`<button class="btn green" onclick="closeModal();go('routines')">Routine Saved ✓</button>`:`<button class="btn" onclick="openSaveSessionAsRoutine('${escAttr(session.id)}')">${linkedRoutine?'Save Copy as Routine':'Save as Routine'}</button>`}
     ${historical?`<button class="btn secondary" onclick="closeModal();editCompletedWorkout('${escAttr(session.id)}')">Edit Workout</button>`:''}
     <button class="btn secondary" onclick="closeModal();go('analytics')">View progress</button>
     <button class="btn secondary" onclick="closeModal()">Done</button>
   </div>
 `;
}
function exerciseHistory(exerciseId){return derivedSessionData().historyByExercise.get(exerciseId)||[];}
function exerciseMetrics(exerciseId){
 const h=exerciseHistory(exerciseId),sets=h.flatMap(x=>x.sets);
 const bestWeight=sets.length?Math.max(...sets.map(x=>Number(x.weight)||0)):0;
 const bestE1=sets.length?Math.max(...sets.map(x=>estimated1RM(x.weight,x.reps))):0;
 const bestVolume=h.length?Math.max(...h.map(x=>x.sets.reduce((a,s)=>a+(Number(s.weight)||0)*(Number(s.reps)||0),0))):0;
 const latest=h.at(-1),prior=h.at(-2);
 const latestE1=latest?Math.max(...latest.sets.map(x=>estimated1RM(x.weight,x.reps))):0;
 const priorE1=prior?Math.max(...prior.sets.map(x=>estimated1RM(x.weight,x.reps))):0;
 let trend='flat';
 if(priorE1 && latestE1>priorE1*1.01)trend='up';
 else if(priorE1 && latestE1<priorE1*.99)trend='down';
 return {history:h,sets,bestWeight,bestE1,bestVolume,latestE1,priorE1,trend};
}
function weeklyMuscleSets(){
 const start=startOfWeek(),counts={};
 state.sessions.filter(s=>new Date(s.date)>=start).forEach(s=>s.exercises.forEach(e=>{
   const ex=exById(e.exerciseId);if(!ex)return;
   counts[ex.muscle]=(counts[ex.muscle]||0)+progressionSets(e).length;
 }));
 return counts;
}
function lastEightWeeks(){
 const now=startOfWeek(),rows=[];
 for(let i=7;i>=0;i--){
   const start=new Date(now);start.setDate(start.getDate()-i*7);
   const end=new Date(start);end.setDate(end.getDate()+7);
   const sessions=state.sessions.filter(s=>{const d=new Date(s.date);return d>=start&&d<end});
   rows.push({label:`${start.getMonth()+1}/${start.getDate()}`,workouts:sessions.length,sets:sessions.reduce((a,s)=>a+sessionSetCount(s),0)});
 }
 return rows;
}
let analyticsMonthOffset=0;

function localDateKey(dateLike){
 const d=dateLike instanceof Date?dateLike:new Date(dateLike);
 if(Number.isNaN(d.getTime()))return '';
 const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
 return `${y}-${m}-${day}`;
}
function monthAnchor(offset=analyticsMonthOffset){
 const d=new Date();d.setHours(12,0,0,0);d.setDate(1);d.setMonth(d.getMonth()+offset);return d;
}
function changeAnalyticsMonth(delta){
 analyticsMonthOffset+=delta;renderAnalytics();
}
function resetAnalyticsMonth(){
 analyticsMonthOffset=0;renderAnalytics();
}
function sessionsForDateKey(key){return derivedSessionData().sessionsByDate.get(key)||[]}
function calendarMonthData(offset=analyticsMonthOffset){
 const base=monthAnchor(offset),year=base.getFullYear(),month=base.getMonth();
 const days=new Date(year,month+1,0).getDate();
 const mondayOffset=(new Date(year,month,1).getDay()+6)%7;
 const cells=Array(mondayOffset).fill(null);
 for(let day=1;day<=days;day++){
   const d=new Date(year,month,day,12),key=localDateKey(d),sessions=sessionsForDateKey(key);
   cells.push({day,key,sessions,count:sessions.length,today:key===localDateKey(new Date())});
 }
 while(cells.length%7)cells.push(null);
 return {base,year,month,cells};
}
function progressCalendarHtml(){
 const data=calendarMonthData(),label=data.base.toLocaleDateString(undefined,{month:'long',year:'numeric'});
 return `<div class="calendar-card">
   <div class="calendar-head">
     <div class="progress-nav"><button onclick="changeAnalyticsMonth(-1)" aria-label="Previous month">‹</button><button onclick="resetAnalyticsMonth()">Today</button><button onclick="changeAnalyticsMonth(1)" aria-label="Next month">›</button></div>
     <div class="calendar-title">${esc(label)}</div>
   </div>
   <div class="calendar-weekdays">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<div>${x}</div>`).join('')}</div>
   <div class="calendar-grid">${data.cells.map(cell=>cell
     ?`<button class="calendar-day ${cell.today?'today':''} ${cell.count?'trained':''}" ${cell.count?`onclick="openProgressDay('${cell.key}')"`:'disabled'}>
        <span class="daynum">${cell.day}</span>${cell.count?'<span class="calendar-dot"></span>':''}
        ${cell.count?`<span class="daycount">${cell.count} workout${cell.count===1?'':'s'}</span>`:''}
       </button>`
     :'<div class="calendar-day empty"></div>').join('')}</div>
 </div>`;
}
function openProgressDay(key){
 const sessions=sessionsForDateKey(key).sort((a,b)=>b.date.localeCompare(a.date));
 if(!sessions.length)return;
 const d=new Date(key+'T12:00:00');
 openModal(d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}),`
   <div class="mini" style="margin-bottom:10px">${sessions.length} workout${sessions.length===1?'':'s'} logged</div>
   ${sessions.map(s=>`<div class="card" style="margin-bottom:9px">
     <div class="row"><div><div class="exercise-name">${esc(s.routineName)}</div><div class="mini">${new Date(s.date).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})} · ${sessionSetCount(s)} working sets${s.durationMinutes!=null?` · ${s.durationMinutes} min`:''}</div></div>${sessionPRCount(s)?`<span class="tag pr-tag">PR · ${sessionPRCount(s)}</span>`:''}</div>
     <div class="mini" style="margin-top:8px">${s.exercises.filter(e=>progressionSets(e).length).map(e=>esc(exById(e.exerciseId)?.name||'Exercise')).join(' · ')}</div>
     <div class="actions"><button class="btn small" onclick="closeModal();openHistoricalWorkoutRecap('${s.id}')">View Recap</button><button class="btn small secondary" onclick="closeModal();go('history')">Open History</button></div>
   </div>`).join('')}
 `);
}
function lifetimeExerciseRecords(){
 const ids=[...new Set(state.sessions.flatMap(s=>(s.exercises||[]).flatMap(e=>progressionSets(e).length?[e.exerciseId]:[])))];
 return ids.map(id=>{
   const ex=exById(id),history=exerciseHistory(id);
   const rows=[];
   history.forEach(h=>h.sets.forEach(set=>rows.push({set,date:h.date,routineName:h.routineName})));
   if(!rows.length)return null;
   const byLoad=[...rows].sort((a,b)=>(Number(b.set.weight)||0)-(Number(a.set.weight)||0)||(Number(b.set.reps)||0)-(Number(a.set.reps)||0))[0];
   const byE1=[...rows].sort((a,b)=>estimated1RM(b.set.weight,b.set.reps)-estimated1RM(a.set.weight,a.set.reps))[0];
   const byReps=[...rows].sort((a,b)=>(Number(b.set.reps)||0)-(Number(a.set.reps)||0))[0];
   const prs=rows.filter(x=>x.set.pr);
   return {
     id,ex,history,
     bestWeight:Number(byLoad?.set.weight)||0,
     bestWeightReps:Number(byLoad?.set.reps)||0,
     bestReps:Number(byReps?.set.reps)||0,
     bestE1:byE1?estimated1RM(byE1.set.weight,byE1.set.reps):0,
     sessions:history.length,
     lastDate:history.at(-1)?.date||'',
     lastPRDate:prs.at(-1)?.date||''
   };
 }).filter(Boolean);
}
function recordPrimaryText(r){
 return r.bestWeight>0?`${r.bestWeight} ${state.profile.unit} × ${r.bestWeightReps}`:`${r.bestReps} reps`;
}
function recordSecondaryText(r){
 return r.bestE1>0?`${r.bestE1.toFixed(0)} ${state.profile.unit} est. 1RM`:`${r.sessions} logged session${r.sessions===1?'':'s'}`;
}
function recentPREvents(limit=8){
 const events=[];
 state.sessions.forEach(s=>(s.exercises||[]).forEach(e=>{
   const seen=new Set();
   progressionSets(e).forEach(set=>{
     if(!set.pr||seen.has(set.pr))return;
     seen.add(set.pr);
     events.push({date:s.date,sessionId:s.id,exerciseId:e.exerciseId,exercise:exById(e.exerciseId),label:set.pr,weight:Number(set.weight)||0,reps:Number(set.reps)||0});
   });
 }));
 return events.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,limit);
}
function sessionsBetween(start,end,sessions=state.sessions){
 return sessions.filter(s=>{
   const d=new Date(s.date);
   return Number.isFinite(d.getTime())&&d>=start&&d<end;
 });
}
function muscleCoverageSummary(sessions){
 const byMuscle={};
 (sessions||[]).forEach(session=>{
   const scores=sessionMuscleScores(session),day=localDateKey(session.date);
   Object.entries(scores).forEach(([muscle,setEq])=>{
     if(!(setEq>0))return;
     const row=byMuscle[muscle]||(byMuscle[muscle]={muscle,name:MUSCLE_REGION_LABELS[muscle]||muscle,setEq:0,sessions:0,days:new Set(),lastDate:''});
     row.setEq+=setEq;row.sessions++;if(day)row.days.add(day);
     if(!row.lastDate||String(session.date)>row.lastDate)row.lastDate=String(session.date);
   });
 });
 return Object.values(byMuscle).map(row=>({...row,days:row.days.size}))
   .sort((a,b)=>b.setEq-a.setEq||b.sessions-a.sessions||a.name.localeCompare(b.name));
}
function muscleCoveragePeriods(reference=new Date()){
 const ref=new Date(reference),weekStart=startOfWeek(ref),weekEnd=new Date(weekStart);weekEnd.setDate(weekEnd.getDate()+7);
 const monthStart=new Date(ref.getFullYear(),ref.getMonth(),1);monthStart.setHours(0,0,0,0);
 const monthEnd=new Date(ref.getFullYear(),ref.getMonth()+1,1);monthEnd.setHours(0,0,0,0);
 const weekSessions=sessionsBetween(weekStart,weekEnd),monthSessions=sessionsBetween(monthStart,monthEnd);
 return {
   week:{start:weekStart,end:weekEnd,sessions:weekSessions,rows:muscleCoverageSummary(weekSessions)},
   month:{start:monthStart,end:monthEnd,sessions:monthSessions,rows:muscleCoverageSummary(monthSessions)}
 };
}
function muscleFrequencyWeeks(weeks=8,reference=new Date(),sessions=state.sessions){
 const count=Math.max(1,Math.round(Number(weeks)||8)),current=startOfWeek(reference),periods=[];
 for(let i=count-1;i>=0;i--){
   const start=new Date(current);start.setDate(start.getDate()-i*7);
   const end=new Date(start);end.setDate(end.getDate()+7);
   const weekSessions=sessionsBetween(start,end,sessions);
   const hits={};
   weekSessions.forEach(session=>{
     Object.entries(sessionMuscleScores(session)).forEach(([muscle,score])=>{
       if(score>0)hits[muscle]=(hits[muscle]||0)+1;
     });
   });
   periods.push({start,end,label:`${start.getMonth()+1}/${start.getDate()}`,hits});
 }
 const muscles=[...new Set(periods.flatMap(p=>Object.keys(p.hits)))];
 const rows=muscles.map(muscle=>({
   muscle,name:MUSCLE_REGION_LABELS[muscle]||muscle,
   counts:periods.map(p=>p.hits[muscle]||0),
   total:periods.reduce((n,p)=>n+(p.hits[muscle]||0),0)
 })).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name));
 return {periods,rows};
}
function frequencyCellLevel(count){return count>=3?3:count===2?2:count===1?1:0}
function coveragePeriodHtml(period,title){
 const rows=period.rows,max=Math.max(1,...rows.map(r=>r.setEq));
 const sessionCount=period.sessions.length,days=new Set(period.sessions.map(s=>localDateKey(s.date)).filter(Boolean)).size;
 return `<div class="coverage-card">
   <div class="coverage-card-head"><div><div class="coverage-card-title">${esc(title)}</div><div class="mini">${sessionCount} workout${sessionCount===1?'':'s'} · ${days} training day${days===1?'':'s'}</div></div><div class="coverage-card-meta">${rows.length} muscle region${rows.length===1?'':'s'}</div></div>
   ${rows.length?`<div class="coverage-list">${rows.slice(0,12).map(row=>`<div class="coverage-row">
     <div class="coverage-name">${esc(row.name)}</div>
     <div class="coverage-track"><div class="coverage-fill" style="width:${Math.max(5,Math.round(row.setEq/max*100))}%"></div></div>
     <div class="coverage-values"><b>${row.sessions}×</b> · ${row.setEq%1?row.setEq.toFixed(1):row.setEq} eq</div>
   </div>`).join('')}</div>`:'<div class="empty">No completed working sets in this period yet.</div>'}
 </div>`;
}
function muscleFrequencyHtml(data){
 if(!data.rows.length)return '<div class="empty">Complete workouts across multiple weeks to build training-frequency history.</div>';
 return `<div class="frequency-card">
   <div class="frequency-head"><span>Muscle</span>${data.periods.map(p=>`<span>${esc(p.label)}</span>`).join('')}</div>
   ${data.rows.slice(0,14).map(row=>`<div class="frequency-row"><div class="frequency-name">${esc(row.name)}</div>${row.counts.map(count=>`<div class="frequency-cell freq-${frequencyCellLevel(count)}" title="${count} session${count===1?'':'s'}">${count||''}</div>`).join('')}</div>`).join('')}
   <div class="frequency-legend"><span>Cells = completed sessions involving that muscle during each week.</span><span>1 = light frequency · 2 = moderate · 3+ = high frequency</span></div>
 </div>`;
}
function muscleWorkloadComparison(){
 const currentStart=startOfWeek(),currentEnd=new Date(currentStart);currentEnd.setDate(currentEnd.getDate()+7);
 const priorStart=new Date(currentStart);priorStart.setDate(priorStart.getDate()-28);
 const current=muscleCoverageSummary(sessionsBetween(currentStart,currentEnd));
 const prior=muscleCoverageSummary(sessionsBetween(priorStart,currentStart));
 const currentMap=Object.fromEntries(current.map(x=>[x.muscle,x.setEq]));
 const priorMap=Object.fromEntries(prior.map(x=>[x.muscle,x.setEq/4]));
 const muscles=[...new Set([...Object.keys(currentMap),...Object.keys(priorMap)])];
 return muscles.map(muscle=>({muscle,name:MUSCLE_REGION_LABELS[muscle]||muscle,current:currentMap[muscle]||0,average:priorMap[muscle]||0}))
   .sort((a,b)=>Math.max(b.current,b.average)-Math.max(a.current,a.average)||a.name.localeCompare(b.name));
}

function recentStrengthChanges(){
 const ids=[...new Set(state.sessions.flatMap(s=>(s.exercises||[]).map(e=>e.exerciseId)))];
 return ids.map(id=>{
   const m=exerciseMetrics(id);if(m.history.length<2||!m.priorE1)return null;
   const delta=m.latestE1-m.priorE1,pct=(delta/m.priorE1)*100;
   return {id,ex:exById(id),latest:m.latestE1,prior:m.priorE1,delta,pct,date:m.history.at(-1).date};
 }).filter(Boolean).sort((a,b)=>Math.abs(b.pct)-Math.abs(a.pct)||b.date.localeCompare(a.date));
}
function openAllRecords(){
 openModal('Lifetime records',`
   <div class="notice">Records use completed <b>working sets</b>. Warm-ups, drop sets, and failure sets do not set progression records.</div>
   <div class="records-toolbar"><input id="recordsSearch" placeholder="Search exercise..." oninput="renderRecordsModal()"></div>
   <div id="recordsList" class="records-list"></div>
 `);
 renderRecordsModal();
}
function renderRecordsModal(){
 const host=document.getElementById('recordsList');if(!host)return;
 const q=(document.getElementById('recordsSearch')?.value||'').trim().toLowerCase();
 const rows=lifetimeExerciseRecords().filter(r=>!q||(r.ex?.name||'').toLowerCase().includes(q)).sort((a,b)=>(a.ex?.name||'').localeCompare(b.ex?.name||''));
 host.innerHTML=rows.length?rows.map(r=>`<div class="records-row clickable" onclick="openExerciseProgress('${r.id}')">
   <div><div class="exercise-name">${esc(r.ex?.name||'Exercise')}</div><div class="mini">${r.sessions} session${r.sessions===1?'':'s'} · last ${new Date(r.lastDate).toLocaleDateString()}</div></div>
   <div class="records-value"><b>${esc(recordPrimaryText(r))}</b><span>${r.bestWeight>0?'Best load':'Best reps'}</span></div>
   <div class="records-value e1"><b>${r.bestE1>0?r.bestE1.toFixed(0):'—'}</b><span>Est. 1RM</span></div>
 </div>`).join(''):'<div class="empty">No matching records yet.</div>';
}

function svgLine(values,width=600,height=130){
 if(!values.length)return '';
 const pad=14,max=Math.max(...values),min=Math.min(...values),range=Math.max(1,max-min);
 const points=values.map((v,i)=>{
   const x=pad+(width-pad*2)*(values.length===1?.5:i/(values.length-1));
   const y=height-pad-(height-pad*2)*((v-min)/range);
   return {x,y,v};
 });
 const pts=points.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
 const fillPts=`${points[0].x},${height-pad} ${pts} ${points.at(-1).x},${height-pad}`;
 return `<svg class="spark" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="progress chart">
   <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8b5cf6" stop-opacity=".34"/><stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/></linearGradient></defs>
   <line x1="${pad}" y1="${height/2}" x2="${width-pad}" y2="${height/2}" stroke="#253047" stroke-width="1"/>
   <polygon points="${fillPts}" fill="url(#areaFill)"/>
   <polyline points="${pts}" fill="none" stroke="#9b77f7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
   ${points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="5" fill="#ddd6fe" stroke="#6d49bd" stroke-width="2"/>`).join('')}
 </svg><div class="chart-labels"><span>${min.toFixed(0)}</span><span>${max.toFixed(0)}</span></div>`;
}
const FORM_GUIDE_MAP_KEY='swole_cat_form_guide_map_v1';
const REPDB_DATA_URL='https://exercise-dataset.com/exercises.json';
const REPDB_ASSET_BASE='https://exercise-dataset.com/';
let repdbGuideData=null,repdbGuidePromise=null;

function formGuideMap(){
 try{return JSON.parse(localStorage.getItem(FORM_GUIDE_MAP_KEY)||'{}')||{}}catch(e){return {}}
}
function saveFormGuideChoice(exerciseId,guideId){
 const map=formGuideMap();map[exerciseId]=guideId;localStorage.setItem(FORM_GUIDE_MAP_KEY,JSON.stringify(map));
 loadExerciseFormGuide(exerciseId);
}
function clearFormGuideChoice(exerciseId){
 const map=formGuideMap();delete map[exerciseId];localStorage.setItem(FORM_GUIDE_MAP_KEY,JSON.stringify(map));
 showFormGuidePicker(exerciseId);
}
function guideKey(s){
 return String(s||'').toLowerCase()
  .replace(/push[\s-]?ups?/g,'push up').replace(/pull[\s-]?ups?/g,'pull up').replace(/chin[\s-]?ups?/g,'chin up')
  .replace(/\bflyes\b/g,'fly').replace(/\bflies\b/g,'fly').replace(/\brows\b/g,'row').replace(/\bcurls\b/g,'curl')
  .replace(/\braises\b/g,'raise').replace(/\bextensions\b/g,'extension').replace(/\bpresses\b/g,'press')
  .replace(/\bsquats\b/g,'squat').replace(/\blunges\b/g,'lunge').replace(/\bone arm\b/g,'single arm').replace(/\bone leg\b/g,'single leg')
  .replace(/[^a-z0-9]+/g,' ').trim();
}
function guideTokens(s){return guideKey(s).split(' ').filter(Boolean)}
function guideScore(ex,g){
 const a=new Set(guideTokens(ex.name)),b=new Set(guideTokens(g.name_en));
 let inter=0;for(const x of a)if(b.has(x))inter++;
 const union=new Set([...a,...b]).size||1;
 let score=inter/union;
 const appEq=guideKey(ex.equipment||'');
 const srcEq=guideKey(String(g.equipment||'').replaceAll('_',' '));
 if(appEq&&srcEq&&(srcEq.includes(appEq)||appEq.includes(srcEq)))score+=.12;
 const appMuscle=guideKey(ex.muscle||'');
 const body=guideKey(String(g.body_part||'').replaceAll('_',' '));
 if(appMuscle&&body&&(body.includes(appMuscle)||appMuscle.includes(body)))score+=.08;
 return score;
}
function prettyGuideTerm(s){
 return String(s||'').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
}
async function loadRepdbGuides(){
 if(repdbGuideData)return repdbGuideData;
 if(!repdbGuidePromise){
  repdbGuidePromise=fetch(REPDB_DATA_URL,{cache:'force-cache'})
   .then(r=>{if(!r.ok)throw new Error('Guide source unavailable');return r.json()})
   .then(d=>{repdbGuideData=d.exercises||[];return repdbGuideData})
   .catch(err=>{repdbGuidePromise=null;throw err});
 }
 return repdbGuidePromise;
}
function repdbImageUrl(path){
 if(!path)return '';
 if(/^https?:/i.test(path))return path;
 return REPDB_ASSET_BASE+String(path).replace(/^\/+/, '');
}
function exactRepdbGuide(ex,data){
 const key=guideKey(ex?.name||'');
 return data.find(g=>guideKey(g.name_en)===key)||null;
}
function renderRepdbGuide(exerciseId,g){
 const flat=g.images?.flat||{};
 const images=[['Start',flat.start],['Peak / Finish',flat.peak],['Position',flat.main]].filter(x=>x[1]);
 const prim=(g.primary_muscles||[]).map(prettyGuideTerm);
 const sec=(g.secondary_muscles||[]).map(prettyGuideTerm);
 const steps=g.instructions_en||[];
 const tips=g.tips_en||[];
 return `<div class="form-guide-card">
   <div class="form-guide-head">
    <div><div class="source-badge">↗ Public source · RepDB</div><div class="form-guide-title" style="margin-top:8px">${esc(g.name_en||'Exercise guide')}</div><div class="mini" style="margin-top:4px">${esc(prettyGuideTerm(g.equipment||'Bodyweight'))} · ${esc(prettyGuideTerm(g.difficulty||''))}</div></div>
   </div>
   ${g.description_en?`<div class="lastline">${esc(g.description_en)}</div>`:''}
   ${images.length?`<div class="form-guide-images">${images.map(([label,path])=>`<figure><img loading="lazy" src="${escAttr(repdbImageUrl(path))}" alt="${escAttr((g.name_en||'Exercise')+' '+label+' position')}"><figcaption>${esc(label)}</figcaption></figure>`).join('')}</div>`:''}
   <div class="form-guide-section"><h3>Muscles</h3><div class="form-guide-muscles">
     ${prim.map(x=>`<span class="tag">Primary · ${esc(x)}</span>`).join('')}
     ${sec.slice(0,5).map(x=>`<span class="tag">Secondary · ${esc(x)}</span>`).join('')}
   </div></div>
   ${steps.length?`<div class="form-guide-section"><h3>Source instructions</h3><ol class="form-guide-steps">${steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`:''}
   ${tips.length?`<div class="form-guide-section"><h3>Form cues from source</h3><div class="form-guide-tips">${tips.map(x=>`<div class="form-guide-tip">${esc(x)}</div>`).join('')}</div></div>`:''}
   <div class="form-guide-credit">Technique text and illustrations are loaded directly from RepDB's public exercise dataset, not generated by Swole Cat. <a href="https://repdb.co" target="_blank" rel="noopener">Exercise data by RepDB</a>. Form references are general education, and equipment setup or individual anatomy can change how a movement should be performed.</div>
   <div class="actions"><button class="btn small secondary" onclick="showFormGuidePicker('${exerciseId}')">Choose a different public reference</button></div>
  </div>`;
}
async function loadExerciseFormGuide(exerciseId){
 const host=document.getElementById('exerciseFormGuide');if(!host)return;
 const ex=exById(exerciseId);if(!ex)return;
 host.innerHTML='<div class="empty"><strong>Loading public form guide…</strong>Checking the source exercise library.</div>';
 try{
  const data=await loadRepdbGuides();
  if(!document.getElementById('exerciseFormGuide'))return;
  const saved=formGuideMap()[exerciseId];
  const chosen=saved?data.find(g=>g.id===saved):null;
  const exact=chosen||exactRepdbGuide(ex,data);
  if(exact){host.innerHTML=renderRepdbGuide(exerciseId,exact);return}
  showFormGuidePicker(exerciseId);
 }catch(err){
  host.innerHTML=`<div class="form-guide-card"><div class="source-badge">Public source</div><div class="form-guide-title" style="margin-top:8px">Form guide needs a connection</div><div class="lastline">Swole Cat does not invent exercise instructions when the public source is unavailable. Connect to the internet and try again.</div><div class="actions"><a class="btn small secondary" href="https://exercise-dataset.com/" target="_blank" rel="noopener">Open public exercise library</a></div></div>`;
 }
}
async function showFormGuidePicker(exerciseId){
 const host=document.getElementById('exerciseFormGuide');if(!host)return;
 const ex=exById(exerciseId);if(!ex)return;
 try{
  const data=await loadRepdbGuides();
  host.innerHTML=`<div class="form-guide-card">
   <div class="source-badge">Public source matching</div>
   <div class="form-guide-title" style="margin-top:8px">Choose the exact variation</div>
   <div class="lastline">There isn't an automatic exact-name match, or you asked to change it. Swole Cat will not guess and attach a different movement. Search RepDB's public library and choose the reference that matches the exercise you mean.</div>
   <div class="field" style="margin-top:12px"><label>Search public form guides</label><input id="guideSearchInput" value="${escAttr(ex.name)}" oninput="renderFormGuidePickerResults('${exerciseId}')"></div>
   <div id="guidePickerResults" class="guide-picker"></div>
   <div class="form-guide-credit"><a href="https://exercise-dataset.com/" target="_blank" rel="noopener">Browse RepDB's public exercise library</a> · <a href="https://repdb.co" target="_blank" rel="noopener">Exercise data by RepDB</a></div>
  </div>`;
  renderFormGuidePickerResults(exerciseId);
 }catch(err){loadExerciseFormGuide(exerciseId)}
}
function renderFormGuidePickerResults(exerciseId){
 const host=document.getElementById('guidePickerResults');if(!host||!repdbGuideData)return;
 const ex=exById(exerciseId),q=(document.getElementById('guideSearchInput')?.value||'').trim();
 const qKey=guideKey(q);
 let rows=repdbGuideData.map(g=>({g,score:q?guideScore({...ex,name:q},g):guideScore(ex,g)}));
 if(qKey)rows=rows.filter(x=>guideKey(x.g.name_en).includes(qKey)||x.score>.18);
 rows.sort((a,b)=>b.score-a.score);
 const top=rows.slice(0,8);
 host.innerHTML=top.length?top.map(({g})=>`<button class="guide-choice" onclick="saveFormGuideChoice('${exerciseId}','${escAttr(g.id)}')"><div class="grow"><b>${esc(g.name_en)}</b><div class="mini">${esc(prettyGuideTerm(g.body_part||''))} · ${esc(prettyGuideTerm(g.equipment||'Bodyweight'))} · ${esc(prettyGuideTerm(g.difficulty||''))}</div></div><span class="tag">Use guide</span></button>`).join(''):'<div class="empty">No public-source matches found for that search. Try a simpler exercise name.</div>';
}

function openExerciseProgress(exerciseId){
 const ex=exById(exerciseId),m=exerciseMetrics(exerciseId),h=m.history,pref=exercisePreference(exerciseId);
 const recent=h.slice(-12);
 const e1s=recent.map(x=>Math.max(...x.sets.map(s=>estimated1RM(s.weight,s.reps))));
 const trend=m.trend==='up'?'<span class="trend-up">↑ Trending up</span>':m.trend==='down'?'<span class="trend-down">↓ Recent dip</span>':'<span class="trend-flat">→ Holding steady</span>';
 const progressHtml=!h.length
  ?'<div class="empty"><strong>No workout history yet</strong>Log this exercise in a workout and its progress will appear here.</div>'
  :`<div style="margin-top:8px;font-weight:850">${trend}</div>
   <div class="metric-row">
     <div class="metric-mini"><b>${m.bestWeight} ${state.profile.unit}</b><span>Best load</span></div>
     <div class="metric-mini"><b>${m.bestE1.toFixed(0)} ${state.profile.unit}</b><span>Est. 1RM</span></div>
     <div class="metric-mini"><b>${h.length}</b><span>Sessions</span></div>
   </div>
   <div class="chart-card"><div class="row"><b>Estimated strength</b><span class="mini">Last ${recent.length}</span></div>${svgLine(e1s)}</div>
   <div class="picker-section">Recent sessions</div>
   <div class="card">${h.slice().reverse().slice(0,8).map(x=>`<div class="list-item"><div class="grow"><b>${new Date(x.date).toLocaleDateString()}</b><div class="mini">${x.sets.map(s=>`${s.weight}×${s.reps}`).join(' · ')}</div></div><span class="tag">${Math.max(...x.sets.map(s=>estimated1RM(s.weight,s.reps))).toFixed(0)} e1RM</span></div>`).join('')}</div>`;
 openModal(`${esc(ex?.name||'Exercise')} details`,`
 <div class="row"><div><div class="exercise-name">${esc(ex?.name||'Exercise')} ${preferenceBadgeHtml(exerciseId)}</div><div class="mini" style="margin-top:4px">${esc(ex?.muscle||'')} · ${esc(ex?.equipment||'')} · ${esc(patternLabel(ex?.pattern||''))}</div></div><button id="exerciseDetailFavorite" data-exercise-id="${exerciseId}" class="favbtn ${isFavorite(exerciseId)?'on':''}" onclick="toggleFavorite('${exerciseId}')" title="Favorite">${isFavorite(exerciseId)?'★':'☆'}</button></div>
 <div class="picker-section">Your preference</div>
 <div class="card">
   <div class="preference-row">
     <button class="preference-btn ${pref==='neutral'?'on':''}" onclick="setExercisePreference('${exerciseId}','neutral',true)">Neutral</button>
     <button class="preference-btn prefer ${pref==='prefer'?'on':''}" onclick="setExercisePreference('${exerciseId}','prefer',true)">↑ Prefer</button>
     <button class="preference-btn avoid ${pref==='avoid'?'on':''}" onclick="setExercisePreference('${exerciseId}','avoid',true)">↓ Avoid</button>
     <button class="preference-btn hide ${pref==='hide'?'on':''}" onclick="setExercisePreference('${exerciseId}','hide',true)">Hide</button>
   </div>
   <div class="preference-help"><b>Favorite</b> is a quick pin. <b>Prefer</b> pushes this exercise higher in pickers and substitutions. <b>Avoid</b> pushes it lower without removing it. <b>Hide</b> removes it from normal browsing and substitution suggestions, but never deletes it from routines, workout history, or progress.</div>
 </div>
 <div class="picker-section">Your progress</div>
 ${progressHtml}
 <div class="picker-section">Form guide</div>
 <div id="exerciseFormGuide"><div class="empty"><strong>Loading public form guide…</strong>Checking the source exercise library.</div></div>
 `);
 loadExerciseFormGuide(exerciseId);
}
function renderAnalytics(){
 const host=document.getElementById('analyticsArea');if(!host)return;
 const now=Date.now(),last30=state.sessions.filter(s=>now-new Date(s.date).getTime()<=30*86400000);
 const weekStart=startOfWeek(),thisWeek=state.sessions.filter(s=>new Date(s.date)>=weekStart);
 const prs30=last30.reduce((a,s)=>a+sessionPRCount(s),0);
 const sets30=last30.reduce((a,s)=>a+sessionSetCount(s),0);
 const trainingDays30=new Set(last30.map(s=>localDateKey(s.date))).size;
 const weeks=lastEightWeeks(),maxWeek=Math.max(1,...weeks.map(x=>x.workouts));
 const workloads=muscleWorkloadComparison(),maxWorkload=Math.max(1,...workloads.flatMap(x=>[x.current,x.average]));
 const coveragePeriods=muscleCoveragePeriods(),frequency=muscleFrequencyWeeks(8);
 const records=lifetimeExerciseRecords();
 const recordCards=[...records].sort((a,b)=>(b.lastPRDate||b.lastDate).localeCompare(a.lastPRDate||a.lastDate)).slice(0,6);
 const prEvents=recentPREvents(6);
 const changes=recentStrengthChanges().slice(0,8);
 const used=[...new Set(state.sessions.flatMap(s=>s.exercises.filter(e=>progressionSets(e).length).map(e=>e.exerciseId)))];
 const recentExercises=used.map(id=>({id,ex:exById(id),...exerciseMetrics(id)})).filter(x=>x.history.length).sort((a,b)=>b.history.at(-1).date.localeCompare(a.history.at(-1).date)).slice(0,8);
 const coachInsights=used.map(id=>{
   const r=state.routines.flatMap(x=>x.exercises).find(e=>e.exerciseId===id)||{trainingGoal:'general',resetPercent:7.5,increment:state.settings.defaultIncrement,minReps:state.settings.defaultMin,maxReps:state.settings.defaultMax,sets:state.settings.defaultSets};
   return {id,ex:exById(id),signal:coachSignal(id,r)};
 }).filter(x=>x.signal.stalled||x.signal.level==='good').slice(0,8);

 host.innerHTML=`
 <div class="progress-hero telemetry-hero">
   <div class="row"><div><div class="eyebrow">LIVE LOCAL TELEMETRY</div><div class="exercise-name" style="font-size:1.15rem;margin-top:4px">Progress at a glance</div><div class="mini" style="margin-top:4px">Calendar, records, workload, consistency, and exercise trends from your completed workouts.</div></div><span class="tag">${state.sessions.length} workout${state.sessions.length===1?'':'s'}</span></div>
 </div>

 <div class="stat-grid">
   <div class="stat-card"><div class="caption">This week</div><div class="big">${thisWeek.length}</div><div class="mini">workouts</div></div>
   <div class="stat-card"><div class="caption">Last 30 days</div><div class="big">${trainingDays30}</div><div class="mini">training days</div></div>
   <div class="stat-card"><div class="caption">Working sets · 30d</div><div class="big">${sets30}</div><div class="mini">completed</div></div>
   <div class="stat-card"><div class="caption">PRs · 30d</div><div class="big">${prs30}</div><div class="mini">exercises with PRs</div></div>
 </div>

 <div class="section-title"><h2>Training calendar</h2><span class="mini">Tap a training day</span></div>
 ${progressCalendarHtml()}

 <div class="section-title"><h2>Lifetime records</h2><button class="btn small secondary" onclick="openAllRecords()">View All</button></div>
 ${recordCards.length?`<div class="record-grid">${recordCards.map(r=>`<div class="record-card" onclick="openExerciseProgress('${r.id}')">
   <div class="record-name">${esc(r.ex?.name||'Exercise')}</div>
   <div class="record-big">${esc(recordPrimaryText(r))}</div>
   <div class="record-meta">${esc(recordSecondaryText(r))}<br>${r.sessions} logged session${r.sessions===1?'':'s'}</div>
 </div>`).join('')}</div>`:'<div class="empty">Complete working sets to build your record book.</div>'}

 <div class="section-title"><h2>Recent PRs</h2><span class="mini">Newest first</span></div>
 <div class="chart-card">
   ${prEvents.length?`<div class="pr-feed">${prEvents.map(p=>`<div class="pr-feed-row clickable" onclick="openExerciseProgress('${p.exerciseId}')">
     <div class="pr-icon" aria-label="Personal record"><span class="pr-glyph">PR</span></div>
     <div><div class="exercise-name">${esc(p.exercise?.name||'Exercise')}</div><div class="mini">${esc(p.label)} · ${p.weight} ${state.profile.unit} × ${p.reps}</div></div>
     <div class="mini">${new Date(p.date).toLocaleDateString()}</div>
   </div>`).join('')}</div>`:'<div class="empty">PRs will show here after an exercise has an established baseline to beat.</div>'}
 </div>

 <div class="section-title"><h2>Muscle coverage</h2><span class="mini">Audited primary + secondary involvement</span></div>
 <div class="coverage-period-grid">
   ${coveragePeriodHtml(coveragePeriods.week,'This week')}
   ${coveragePeriodHtml(coveragePeriods.month,'This month to date')}
 </div>

 <div class="section-title"><h2>Training frequency</h2><span class="mini">Sessions involving each muscle · last 8 weeks</span></div>
 ${muscleFrequencyHtml(frequency)}

 <div class="section-title"><h2>Muscle workload</h2><span class="mini">This week vs prior 4-week average</span></div>
 <div class="chart-card">
   ${workloads.length?`<div class="workload-grid">${workloads.map(x=>`<div class="workload-row">
     <span>${esc(x.name)}</span>
     <div class="workload-bars">
       <div class="workload-track" title="This week"><div class="workload-current" style="width:${Math.round(x.current/maxWorkload*100)}%"></div></div>
       <div class="workload-track" title="Prior 4-week average"><div class="workload-average" style="width:${Math.round(x.average/maxWorkload*100)}%"></div></div>
     </div>
     <div class="workload-values"><b>${x.current}</b> now<br>${x.average.toFixed(1)} avg</div>
   </div>`).join('')}</div><div class="mini" style="margin-top:11px">Top bar = audited muscle set-equivalents this week. Bottom bar = average set-equivalents per week across the previous four full weeks. Primary involvement contributes 1.0 per working set; secondary contributes 0.5.</div>`:'<div class="empty">Complete working sets to populate muscle workload.</div>'}
 </div>

 <div class="section-title"><h2>8-week consistency</h2></div>
 <div class="chart-card">
   <div class="row"><div class="mini">Completed workouts per week</div><span class="tag">${weeks.reduce((a,x)=>a+x.workouts,0)} total</span></div>
   <div class="weekbars">${weeks.map(w=>`<div class="weekcol"><div class="weekbar" style="height:${Math.max(3,w.workouts/maxWeek*92)}px" title="${w.workouts} workouts · ${w.sets} working sets"></div><div class="weeklabel">${w.label}</div></div>`).join('')}</div>
 </div>

 <div class="section-title"><h2>Recent strength changes</h2><span class="mini">Latest session vs previous session</span></div>
 <div class="chart-card">
   ${changes.length?`<div class="progress-change-list">${changes.map(x=>`<div class="progress-change clickable" onclick="openExerciseProgress('${x.id}')">
     <div><div class="exercise-name">${esc(x.ex?.name||'Exercise')}</div><div class="mini">${x.prior.toFixed(0)} → ${x.latest.toFixed(0)} ${state.profile.unit} est. 1RM · ${new Date(x.date).toLocaleDateString()}</div></div>
     <div class="progress-change-value ${x.delta>0?'trend-up':x.delta<0?'trend-down':'trend-flat'}">${x.delta>0?'+':''}${x.pct.toFixed(1)}%</div>
   </div>`).join('')}</div>`:'<div class="empty">Log an exercise at least twice to compare recent strength.</div>'}
 </div>

 <div class="section-title"><h2>Coach insights</h2></div>
 <div class="chart-card">${coachInsights.length?`<div class="insight-list">${coachInsights.map(x=>`<div class="coachbox ${x.signal.level==='info'?'':x.signal.level}" style="margin:0"><div class="row"><div><div class="coach-title">${esc(x.ex?.name||'Exercise')}</div><div class="coach-text">${esc(x.signal.text)}</div></div><span class="${x.signal.level==='good'?'trend-up':x.signal.level==='reset'?'trend-down':'trend-flat'}">${x.signal.level==='good'?'↑':x.signal.level==='reset'?'!':'→'}</span></div></div>`).join('')}</div>`:'<div class="empty">No notable progression patterns yet. Keep logging consistent sessions.</div>'}</div>

 <div class="section-title"><h2>Recently trained exercises</h2></div>
 <div class="grid">${recentExercises.length?recentExercises.map(x=>`<div class="card clickable" onclick="openExerciseProgress('${x.id}')"><div class="row"><div><div class="exercise-name">${esc(x.ex?.name||'Exercise')}</div><div class="mini">${x.history.length} logged sessions · best load ${x.bestWeight} ${state.profile.unit}</div></div><span class="${x.trend==='up'?'trend-up':x.trend==='down'?'trend-down':'trend-flat'}">${x.trend==='up'?'↑':x.trend==='down'?'↓':'→'} ${x.latestE1.toFixed(0)}</span></div></div>`).join(''):'<div class="empty">Once you log repeated exercises, your strength trends will live here.</div>'}</div>

 <div class="section-title"><h2>Bodyweight <span class="mini">(optional)</span></h2><button class="btn small secondary" onclick="logBodyweight()">+ Log</button></div>
 <div class="chart-card">${(state.bodyweight||[]).length?`${svgLine(state.bodyweight.slice(-20).map(x=>Number(x.value)))}<div class="row"><span class="mini">Latest</span><b>${state.bodyweight.at(-1).value} ${state.profile.unit}</b></div>`:'<div class="empty">Optional bodyweight tracking lives only on this device.</div>'}</div>`;
}
function logBodyweight(){
 openModal('Log bodyweight',`<div class="field"><label>Bodyweight (${state.profile.unit})</label><input id="bwValue" type="number" step=".1" placeholder="150"></div><button class="btn" onclick="saveBodyweight()">Save</button>`);
}
function saveBodyweight(){
 const v=Number(document.getElementById('bwValue').value);if(!v)return;
 state.bodyweight=state.bodyweight||[];state.bodyweight.push({date:new Date().toISOString(),value:v});save();closeModal();renderAnalytics();
}
