import {library} from './library.js';
export const focusNames = {left:'Left front',right:'Right front',middle:'Middle',routine:'Routine'};
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function dayNumber(date) { return Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000); }
const mod = (a,b)=>(a%b+b)%b;
export function routine(date, focus, minutes, hold) {
  minutes=Math.max(5,Math.min(15,Math.round(minutes)||10));
  hold=[30,45,60].includes(hold)?hold:30;
  focus=focusNames[focus]?focus:'left';
  const front=['lunge','half','figure','hamstring','butterfly','hinge','quad','wide'].map(id=>library.find(s=>s.id===id));
  const middle=['butterfly','wide','adductor','frog','side','hamstring','hinge','figure'].map(id=>library.find(s=>s.id===id));
  const catalog=focus==='middle'?middle:front;
  const anchors=focus==='middle'?[catalog[0],catalog[1],catalog[3]]:[catalog[0],catalog[1]];
  const rotating=focus==='middle'?[catalog[2],catalog[4],catalog[5],catalog[6],catalog[7]]:catalog.slice(2);
  const day=dayNumber(date),rotation=mod(day,rotating.length);
  const pool=[...anchors,...[0,1,2].map(i=>rotating[(rotation+i)%rotating.length])];
  const total=minutes*60,count=Math.ceil(total/hold),durations=Array(count).fill(30);
  let extra=total-count*30, i=0;
  while(extra>0){const add=Math.min(15,extra,60-durations[i%count]);durations[i%count]+=add;extra-=add;i++;}
  const offset=mod(day,pool.length),direction=day%2===0?1:-1,selected=[];
  let cursor=0;
  while(selected.length<count){
    let source=pool[mod(offset+direction*cursor++,pool.length)];
    if(focus==='middle'&&source.sided&&count-selected.length===1)source=front[4];
    const sides=source.sided?(focus==='middle'?['Left','Right']:[focus==='left'?'Left':'Right']):[''];
    for(const side of sides)selected.push({...source,id:source.id+side,name:source.name+(side?' · '+side.toLowerCase():''),cue:source.cue.replaceAll('target',side.toLowerCase()),side:side.toLowerCase()});
  }
  if(focus==='middle')for(let j=0;j<count-1;j++)if(selected[j].sided&&selected[j].id.endsWith('Left')){
    const delta=durations[j]-durations[j+1];
    const neutral=selected.findIndex((s,k)=>!s.sided&&durations[k]+delta>=30&&durations[k]+delta<=60);
    if(delta&&neutral>=0){durations[j]-=delta;durations[neutral]+=delta;}
  }
  return selected.map((stretch,index)=>({index,stretch,seconds:durations[index]}));
}
export class Session {
  constructor(steps,focus,{now=Date.now(),sound=true,id=globalThis.crypto?.randomUUID?.()??String(now)}={}){
    if(!steps.length)throw Error('A session needs at least one hold');
    Object.assign(this,{steps,focus,sound,id,index:0,phase:'setup',remaining:5,deadline:now+5000,paused:false,completedSeconds:0,completedHolds:0,skippedHolds:0});
  }
  get step(){return this.steps[Math.min(this.index,this.steps.length-1)];}
  get duration(){return this.phase==='setup'?5:this.step.seconds;}
  tick(now=Date.now()){
    if(this.paused||this.phase==='complete')return false;
    this.remaining=Math.max(0,(this.deadline-now)/1000);
    if(this.remaining>0)return false;
    if(this.phase==='setup'){this.phase='hold';this.remaining=this.step.seconds;this.deadline=now+this.remaining*1000;}
    else {this.completedSeconds+=this.step.seconds;this.completedHolds++;this.advance(now);}
    return true;
  }
  advance(now){
    if(this.index+1<this.steps.length){this.index++;this.phase='setup';this.remaining=5;}
    else {this.phase='complete';this.remaining=0;}
    this.deadline=now+this.remaining*1000;
  }
  skip(now=Date.now()){if(this.phase==='complete')return false;this.skippedHolds++;this.advance(now);return true;}
  pause(now=Date.now()){if(this.paused||this.phase==='complete')return;this.remaining=Math.max(0,(this.deadline-now)/1000);this.paused=true;}
  resume(now=Date.now()){if(!this.paused||this.phase==='complete')return;this.deadline=now+this.remaining*1000;this.paused=false;}
}
export function streak(records,date=new Date()){
  const days=new Set(records.map(r=>r.day));let current=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  if(!days.has(dayKey(current)))current.setDate(current.getDate()-1);
  let count=0;while(days.has(dayKey(current))){count++;current.setDate(current.getDate()-1);}return count;
}
export function formatTime(seconds){return seconds<60?`${seconds}s`:seconds%60===0?`${seconds/60} min`:`${Math.floor(seconds/60)}m ${seconds%60}s`;}
export function validateRecords(records){
  if(!Array.isArray(records)||records.length>50000)throw Error('Invalid history file');
  const ids=new Set();
  return records.map(r=>{
    if(!r||typeof r.id!=='string'||r.id.length>100||ids.has(r.id)||!focusNames[r.focus]||!Number.isInteger(r.seconds)||r.seconds<5||r.seconds>60000||!Number.isInteger(r.holds)||r.holds<1||r.holds>100||!Number.isFinite(Date.parse(r.date))||typeof r.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.day))throw Error('Invalid session in history file');
    ids.add(r.id);return {id:r.id,date:r.date,day:r.day,focus:r.focus,seconds:r.seconds,holds:r.holds,...(typeof r.routineId==='string'?{routineId:r.routineId.slice(0,100)}:{}),...(typeof r.routineTitle==='string'?{routineTitle:r.routineTitle.slice(0,120)}:{}),...(typeof r.category==='string'?{category:r.category.slice(0,30)}:{})};
  });
}
