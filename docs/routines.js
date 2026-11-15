// Published catalog: add reviewed routine definitions here to make them available to everyone.
// Durations belong to each move; setup intervals are separate from movement time.
export const categories = {all:'All routines',splits:'Splits',handstands:'Handstands',backbends:'Backbends',other:'Other poses'};
export const sourceUrl='https://www.daniwinksflexibility.com/bendy-blog/10-minute-front-splits-routine';
const moves=[
 ['lunge-90','90° lunge',30,'hold','Tuck pelvis; stack the front knee.','lunge90'],
 ['lunge-grab','90° lunge · ankle grab',30,'hold','Use a strap for the back ankle.','lungeGrab'],
 ['deep-lunge','Deep lunge (half split)',30,'hold','Lower hips with torso upright.','deepLunge'],
 ['deep-grab','Deep lunge · ankle grab',30,'hold','Keep chest forward and hips square.','deepGrab'],
 ['knee-taps','Back-knee taps',30,'active','6–10 slow back-knee taps.','kneeTaps'],
 ['ham-flex','Hamstring stretch · flexed foot',15,'hold','Lift front toes; hinge from hips.','half'],
 ['ham-point','Hamstring stretch · pointed foot',15,'hold','Point front toes.','hamPoint'],
 ['pyramid','Pyramid pose',30,'hold','Hinge over a shorter stance.','pyramid'],
 ['good-mornings','Pyramid good mornings',30,'active','Slowly hinge down and return upright.','goodMornings'],
 ['front-split','Supported front split',60,'hold','Support hips; breathe without forcing.','frontSplit']
];
const steps=['left','right'].flatMap(side=>moves.map(([id,name,seconds,mode,cue,pose])=>({
 id:id+'-'+side,name,seconds,mode,side,cue,pose,
 area:['ham-flex','ham-point','pyramid','good-mornings'].includes(id)?'HAMSTRINGS':'HIP FLEXORS & SPLITS',
 modification:'Reduce your range or use blocks. Release with pain.',
 demonstration:sourceUrl
})));
export const catalog=[{id:'dani-front-splits-10',title:'10-Minute Front Splits',category:'splits',author:'Dani Winks',source:sourceUrl,description:'A complete sequence from Dani Winks, practiced on one side before switching.',equipment:['Mat','Two yoga blocks','Strap (optional)'],notes:'Warm up beforehand. Includes active drills; schedule recovery between demanding sessions.',cover:'half',steps}];
export function validateRoutine(value){
 const r=value;
 const text=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
 const safeUrl=v=>{try{return new URL(v).protocol==='https:';}catch{return false;}};
 if(!r||!text(r.id,100)||!text(r.title,120)||!Object.hasOwn(categories,r.category)||r.category==='all'||!text(r.author,100)||!text(r.description,1000)||!Array.isArray(r.steps)||!r.steps.length||r.steps.length>100)throw Error('Invalid routine definition. Check title, category, author, and steps.');
 if(r.source&&!safeUrl(r.source))throw Error('Source links must use HTTPS.');
 const seen=new Set();
 const steps=r.steps.map((s,index)=>{
  if(!s||!text(s.name,120)||!text(s.cue,1500)||!Number.isInteger(s.seconds)||s.seconds<5||s.seconds>600||!['left','right','both'].includes(s.side)||!['hold','active'].includes(s.mode)||!text(s.pose,50)||s.demonstration&&!safeUrl(s.demonstration))throw Error('Invalid move '+(index+1)+'. Use a name, cue, side, mode, illustration, and 5–600 seconds.');
  const id=s.id||'move-'+(index+1);if(!text(id,100)||seen.has(id))throw Error('Move IDs must be unique.');seen.add(id);
  return {id,name:s.name.trim(),cue:s.cue,seconds:s.seconds,side:s.side,mode:s.mode,pose:s.pose,area:typeof s.area==='string'?s.area.slice(0,100):'',modification:typeof s.modification==='string'?s.modification.slice(0,1000):'Use a comfortable range.',demonstration:s.demonstration||r.source||''};
 });
 return {id:r.id,title:r.title.trim(),category:r.category,author:r.author.trim(),source:r.source||'',description:r.description,notes:typeof r.notes==='string'?r.notes.slice(0,1000):'',equipment:Array.isArray(r.equipment)?r.equipment.filter(v=>typeof v==='string').map(v=>v.slice(0,100)).slice(0,10):[],cover:typeof r.cover==='string'?r.cover:'half',steps};
}
export function routineSteps(r){return r.steps.map((s,index)=>({index,seconds:s.seconds,stretch:{...s,name:s.name+(s.side==='both'?'':' · '+s.side),sided:s.side!=='both'}}));}
export function routineSeconds(r){return r.steps.reduce((sum,s)=>sum+s.seconds,0);}
