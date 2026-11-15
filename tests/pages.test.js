import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../docs/sw.js',import.meta.url),'utf8');
test('Home Screen manifest stays under both repository and custom-domain roots',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/manifest.webmanifest',import.meta.url)));
 for(const root of ['https://example.github.io/unfold/','https://unfold.example/']){
  const url=new URL('manifest.webmanifest',root);
  for(const field of ['id','start_url','scope'])assert.equal(new URL(manifest[field],url).href,root);
 }
});
test('offline navigation finds the cached app under a GitHub project path',async()=>{
 const scope='https://example.github.io/unfold/',handlers={},lookups=[];
 const cache={match:async key=>{lookups.push(key);return key===scope+'index.html'?'cached app':undefined;}};
 vm.runInNewContext(script,{URL,Response,fetch:async()=>{throw Error('offline');},caches:{open:async()=>cache},self:{location:new URL(scope),registration:{scope},addEventListener:(name,fn)=>handlers[name]=fn}});
 for(const url of [scope,scope+'index.html']){
  let result;handlers.fetch({request:{url,method:'GET',mode:'navigate'},respondWith:p=>result=p});
  assert.equal(await result,'cached app');assert.equal(lookups.at(-1),scope+'index.html');
 }
 let intercepted=false;
 handlers.fetch({request:{url:'https://example.github.io/other/index.html',method:'GET',mode:'navigate'},respondWith:()=>intercepted=true});
 assert.equal(intercepted,false);
});
test('updating one project does not delete another project’s offline cache',async()=>{
 const handlers={},deleted=[];
 vm.runInNewContext(script,{URL,caches:{keys:async()=>['unfold-%2Funfold%2F-v0','unfold-%2Fother%2F-v1'],delete:async name=>deleted.push(name)},self:{registration:{scope:'https://example.github.io/unfold/'},clients:{claim:async()=>{}},addEventListener:(name,fn)=>handlers[name]=fn}});
 let result;handlers.activate({waitUntil:p=>result=p});await result;
 assert.deepEqual(deleted,['unfold-%2Funfold%2F-v0']);
});
