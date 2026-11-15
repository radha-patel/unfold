import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,routineSteps,routineSeconds,validateRoutine} from '../docs/routines.js';
import {Session,validateRecords} from '../docs/core.js';
import {routinePose} from '../docs/poses.js';
import {existsSync} from 'node:fs';
test('Dani Winks sequence is 300 seconds per side, in order, 600 seconds total',()=>{
 const r=validateRoutine(catalog[0]),steps=routineSteps(r);
 assert.equal(steps.length,20);assert.equal(routineSeconds(r),600);
 assert.deepEqual(steps.slice(0,10).map(s=>s.seconds),[30,30,30,30,30,15,15,30,30,60]);
 assert.deepEqual(steps.slice(10).map(s=>s.seconds),steps.slice(0,10).map(s=>s.seconds));
 assert.ok(steps.slice(0,10).every(s=>s.stretch.side==='left'));
 assert.ok(steps.slice(10).every(s=>s.stretch.side==='right'));
 assert.deepEqual(steps.filter(s=>s.stretch.mode==='active').map(s=>s.index),[4,8,14,18]);
});
test('timer honors every routine interval including 15 and 60 seconds',()=>{
 const r=catalog[0],s=new Session(routineSteps(r),'routine',{now:0});let now=0;
 for(const step of s.steps){now+=5000;s.tick(now);assert.equal(s.remaining,step.seconds);assert.equal(s.phase,'hold');now+=step.seconds*1000;s.tick(now);}
 assert.equal(s.phase,'complete');assert.equal(s.completedSeconds,600);assert.equal(s.completedHolds,20);assert.equal(now,700000);
});
test('legacy and routine history both survive backup validation; short holds are retained',()=>{
 const base={id:'old',date:'2026-11-13T12:00:00Z',day:'2026-11-13',focus:'left',seconds:300,holds:10};
 const fresh={...base,id:'new',focus:'routine',seconds:15,holds:1,routineId:catalog[0].id,routineTitle:catalog[0].title,category:'splits'};
 assert.deepEqual(validateRecords([base,fresh]),[base,fresh]);
});
test('routine imports reject invalid timings, category, side, duplicate move IDs and unsafe URLs',()=>{
 const r=catalog[0];assert.equal(validateRoutine(r).steps.length,20);
 for(const replacement of [{seconds:0},{seconds:2.5},{seconds:601},{side:'banana'},{mode:'automatic'},{demonstration:'javascript:alert(1)'}])assert.throws(()=>validateRoutine({...r,steps:[{...r.steps[0],...replacement}]}));
 assert.throws(()=>validateRoutine({...r,category:'all'}));assert.throws(()=>validateRoutine({...r,steps:[r.steps[0],r.steps[0]]}));
});
test('all published moves use supplied PNGs with no placeholder SVGs',()=>{
 for(const m of catalog[0].steps){const art=routinePose(m.pose,m.side==='right');assert.ok(!art.includes('art-pending'));assert.ok(!art.includes('NaN'));assert.ok(!art.includes('<svg'));const src=art.match(/src="([^"]+)"/)[1];assert.ok(existsSync(new URL('../docs/'+src,import.meta.url)));}
 assert.ok(routinePose('constructor').includes('art-pending'));
});
