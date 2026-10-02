function installRegressionFixturePlan(){
 const find=name=>allExercises().find(x=>x.name===name)?.id;
 const make=(name,items)=>({id:uid(),name,description:'Regression fixture',trainingMode:'guided',exercises:items.map(([exercise,sets,min,max,inc,rest])=>({
   exerciseId:find(exercise),sets,minReps:min,maxReps:max,increment:inc,mode:'double',restSeconds:rest
 })).filter(x=>x.exerciseId)});
 const created=[
   make('Fixture Full Body A',[
    ['Back Squat',3,6,10,5,150],['Barbell Bench Press',3,6,10,5,150],['Seated Cable Row',3,8,12,5,120],['Romanian Deadlift',2,8,12,5,150],['Dumbbell Lateral Raise',2,10,15,5,75],['Cable Crunch',2,10,15,5,75]
   ]),
   make('Fixture Full Body B',[
    ['Deadlift',2,5,8,5,180],['Dumbbell Shoulder Press',3,8,12,5,120],['Lat Pulldown',3,8,12,5,120],['Bulgarian Split Squat',3,8,12,5,120],['Incline Dumbbell Press',2,8,12,5,120],['Cable Curl',2,10,15,5,75],['Triceps Pushdown',2,10,15,5,75]
   ]),
   make('Fixture Full Body C',[
    ['Leg Press',3,8,12,10,150],['Dumbbell Bench Press',3,8,12,5,120],['Chest Supported Row',3,8,12,5,120],['Hip Thrust',3,8,12,5,150],['Seated Leg Curl',2,10,15,5,90],['Cable Lateral Raise',2,10,15,5,75]
   ])
 ];
 state.routines=[...state.routines,...created];
 const p={id:uid(),name:'Fixture 3-Day Rotation',routineIds:created.map(r=>r.id),frequency:3,preferredDays:[1,3,5],trainingMode:'inherit',nextIndex:0};
 state.programs=[...state.programs,p];state.activeProgramId=p.id;save();renderHome();renderRoutines();
 return {routines:created,program:p};
}
function auditExerciseMuscleCoverage(){
 const drawable=new Set(availableHeatMapMuscleRegions());
 return LIBRARY.map(ex=>{
   const meta=exerciseMuscleMetadata(ex);
   const missing=[...meta.primary,...meta.secondary].filter(m=>!drawable.has(m));
   return {id:ex.id,name:ex.name,primary:meta.primary,secondary:meta.secondary,missing};
 });
}
