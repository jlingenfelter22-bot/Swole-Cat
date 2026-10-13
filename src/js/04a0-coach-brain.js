// v0.89: First shared, local-only Brain decision boundary.
// Deliberately narrow: progressive clarification of unknown equipment.
// Training recommendations remain owned by the existing Coach engine.
const SWOLE_CAT_BRAIN_VERSION='0.89.0-dev';
const COACH_BRAIN_EQUIPMENT_CHOICES=Object.freeze([
 Object.freeze({id:'full_gym',label:'Full gym',equipment:Object.freeze(['barbell','dumbbell','cable','machine','bodyweight','smith machine'])}),
 Object.freeze({id:'dumbbells',label:'Dumbbells + bodyweight',equipment:Object.freeze(['dumbbell','bodyweight'])}),
 Object.freeze({id:'bodyweight',label:'Bodyweight only',equipment:Object.freeze(['bodyweight'])}),
 Object.freeze({id:'custom',label:'Other equipment',equipment:null}),
 Object.freeze({id:'skip',label:'Skip, show options',equipment:null})
]);

function coachBrainEquipmentKnown(request){
 if(!request)return false;
 if(request.brainEquipmentAnswer)return true;
 if(Array.isArray(request.allowedEquipment)&&request.allowedEquipment.length>0)return true;
 const prompt=String(request.prompt||'').toLowerCase();
 // A full/commercial gym is a useful contextual statement even when no
 // exercise-equipment noun was explicitly parsed. Avoid auto-inference from
 // "gym workout" or from user history alone.
 if(/\b(?:full gym|commercial gym|well[- ]equipped gym|gym with (?:all|most|every) equipment)\b/i.test(prompt))return true;
 return false;
}
function coachBrainNextQuestion(request,{mode='workout'}={}){
 if(mode!=='workout'||!request||request.brainEquipmentAnswer)return null;
 // The normal Coach target and time clarifiers retain priority.
 if(!Array.isArray(request.targetRegions)||!request.targetRegions.length||!(Number(request.duration)>0))return null;
 if(coachBrainEquipmentKnown(request))return null;
 return Object.freeze({
  id:'equipment',
  text:'What equipment are you working with today?',
  explanation:'This helps Coach choose exercises you can actually do.',
  options:COACH_BRAIN_EQUIPMENT_CHOICES
 });
}
function coachBrainApplyEquipmentAnswer(request,choiceId,customEquipment=''){
 const choice=COACH_BRAIN_EQUIPMENT_CHOICES.find(x=>x.id===choiceId);
 if(!request||!choice)return {ok:false,reason:'Invalid equipment choice'};
 if(choiceId==='custom'){
  const parsed=typeof coachParseEquipment==='function'?coachParseEquipment(customEquipment):{allowed:[],excluded:[]};
  if(!parsed.allowed.length)return {ok:false,reason:'Name at least one piece of equipment that you have.'};
  return {ok:true,request:{...request,allowedEquipment:[...parsed.allowed],excludedEquipment:[...(parsed.excluded||[])],brainEquipmentAnswer:'custom',brainEquipmentNote:String(customEquipment).trim()}};
 }
 if(choiceId==='skip')return {ok:true,request:{...request,brainEquipmentAnswer:'skipped',brainEquipmentNote:'Equipment unknown. Swap any exercises you cannot perform.'}};
 return {ok:true,request:{...request,allowedEquipment:[...choice.equipment],excludedEquipment:[...(request.excludedEquipment||[])].filter(x=>choice.equipment.includes(x)),brainEquipmentAnswer:choiceId,brainEquipmentNote:choice.label}};
}
function coachBrainEquipmentAssumptionText(request){
 if(!request||!request.brainEquipmentAnswer)return '';
 if(request.brainEquipmentAnswer==='skipped')return 'Equipment was not specified. This draft uses available library options; swap anything you do not have before starting.';
 if(request.brainEquipmentAnswer==='full_gym')return 'Using common full-gym equipment, not assuming access to specialized stations such as a sled.';
 return '';
}
SwoleCatRuntime.registerService('brain',Object.freeze({
 version:SWOLE_CAT_BRAIN_VERSION,
 equipmentChoices:COACH_BRAIN_EQUIPMENT_CHOICES,
 nextQuestion:coachBrainNextQuestion,
 applyEquipmentAnswer:coachBrainApplyEquipmentAnswer,
 equipmentAssumptionText:coachBrainEquipmentAssumptionText
}));
