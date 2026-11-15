import test from 'node:test';
import assert from 'node:assert/strict';
import {routine,Session,dayKey,streak,validateRecords} from '../docs/core.js';
import {readFileSync,existsSync} from 'node:fs';

test('5,940 routines: exact totals, bounds, daily variety, determinism, equal paired sides',()=>{
 let checked=0;
 for(let day=1;day<=60;day++)for(const focus of ['left','right','middle'])for(let minutes=5;minutes<=15;minutes++)for(const hold of [30,45,60]){
  const date=new Date(2026,10,day),next=new Date(2026,10,day+1),steps=routine(date,focus,minutes,hold);
  assert.equal(steps.reduce((a,s)=>a+s.seconds,0),minutes*60);
  assert.ok(steps.every(s=>s.seconds>=30&&s.seconds<=60));
  assert.deepEqual(steps,routine(date,focus,minutes,hold));
  assert.notDeepEqual(steps.map(s=>s.stretch.id),routine(next,focus,minutes,hold).map(s=>s.stretch.id));
  if(focus==='middle')for(const s of steps)if(s.stretch.side==='left'){const right=steps[s.index+1];assert.equal(right.stretch.id,s.stretch.id.replace('Left','Right'));assert.equal(right.seconds,s.seconds);}
  checked++;
 }assert.equal(checked,5940);
});
const steps=()=>routine(new Date(2026,10,13),'left',5,30).slice(0,2);
test('timer: preparation, hold, pauses, resume, transition, completion, no duplicate time',()=>{
 const s=new Session(steps(),'left',{now:0});
 s.tick(4000);assert.equal(s.remaining,1);assert.equal(s.phase,'setup');
 s.tick(5000);assert.equal(s.phase,'hold');assert.equal(s.remaining,30);
 s.pause(15000);assert.equal(s.remaining,20);s.tick(100000);assert.equal(s.remaining,20);
 s.resume(100000);s.tick(119000);assert.equal(s.remaining,1);
 s.tick(120000);assert.equal(s.phase,'setup');assert.equal(s.index,1);assert.equal(s.completedSeconds,30);
 s.tick(125000);s.tick(155000);assert.equal(s.phase,'complete');assert.equal(s.completedSeconds,60);
 s.tick(180000);assert.equal(s.completedHolds,2);assert.equal(s.completedSeconds,60);
});
test('skip excludes partial holds, starts five-second setup, completes on last move',()=>{
 const s=new Session(steps(),'middle',{now:0});s.tick(5000);s.skip(15000);
 assert.equal(s.index,1);assert.equal(s.phase,'setup');assert.equal(s.remaining,5);assert.equal(s.completedSeconds,0);
 s.tick(20000);s.tick(50000);assert.equal(s.phase,'complete');assert.equal(s.completedSeconds,30);assert.equal(s.skippedHolds,1);
});
test('skip while paused remains paused; all skipped earns no completed holds',()=>{
 const s=new Session(steps(),'left',{now:0});s.pause(1000);s.skip(2000);s.tick(100000);assert.equal(s.remaining,5);assert.ok(s.paused);s.skip(100000);assert.equal(s.phase,'complete');assert.equal(s.completedHolds,0);s.skip();assert.equal(s.skippedHolds,2);
});
test('late callback starts next hold without silently skipping unseen stretches',()=>{const s=new Session(steps(),'left',{now:0});s.tick(100000);assert.equal(s.phase,'hold');assert.equal(s.remaining,30);assert.equal(s.index,0);});
test('calendar streak ignores duplicate sessions, allows yesterday and crosses months',()=>{
 const records=['2026-10-30','2026-10-31','2026-11-01','2026-11-01'].map(day=>({day}));
 assert.equal(streak(records,new Date(2026,10,2)),3);assert.equal(streak(records,new Date(2026,10,3)),0);assert.equal(dayKey(new Date(2026,0,2)),'2026-01-02');
});
test('backup validation rejects duplicate IDs, unknown focus, bad duration and hostile content',()=>{
 const r={id:'one',date:'2026-11-13T12:00:00Z',day:'2026-11-13',focus:'left',seconds:300,holds:10};
 assert.deepEqual(validateRecords([r]),[r]);assert.throws(()=>validateRecords([r,r]));assert.throws(()=>validateRecords([{...r,focus:'<script>'}]));assert.throws(()=>validateRecords([{...r,seconds:-1}]));assert.throws(()=>validateRecords([{...r,date:'invalid'}]));
});
test('install manifest and offline shell reference real files',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/manifest.webmanifest',import.meta.url)));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./');
 for(const icon of manifest.icons)assert.ok(existsSync(new URL('../docs/'+icon.src,import.meta.url)));
 const sw=readFileSync(new URL('../docs/sw.js',import.meta.url),'utf8');
 const files=[...sw.match(/const SHELL=\[(.*?)\];/s)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
 for(const file of files)assert.ok(existsSync(new URL('../docs/'+file,import.meta.url)));
});
