import {Session,focusNames,dayKey,streak,formatTime,validateRecords} from './core.js';
import {routinePose} from './poses.js';
import {catalog,categories,routineSteps,routineSeconds,validateRoutine} from './routines.js';
const app=document.querySelector('#app'),key='unfold.web.v1';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={home:'☼',practice:'▦',history:'◷',settings:'✧'};
let state={prefs:{focus:'left',minutes:10,hold:30,sound:true},records:[],customRoutines:[]},storageError='',storageBlocked=false;
try{
 const raw=localStorage.getItem(key);
 if(raw){const loaded=JSON.parse(raw);state.records=validateRecords(loaded.records??[]);state.customRoutines=(loaded.customRoutines??[]).map(validateRoutine);const p=loaded.prefs??{};state.prefs={focus:focusNames[p.focus]?p.focus:'left',minutes:Number.isInteger(p.minutes)&&p.minutes>=5&&p.minutes<=15?p.minutes:10,hold:[30,45,60].includes(p.hold)?p.hold:30,sound:p.sound!==false};}
}catch(e){storageBlocked=true;storageError='Your saved history could not be read. Keep your browser data and ask for help recovering it.';}
let view='home',session=null,month=new Date(new Date().getFullYear(),new Date().getMonth(),1),audio=null,wakeLock=null,offlineReady=false,installPrompt=null;
let toastTimer,selectedRoutineId=null;
const allRoutines=()=>[...catalog,...state.customRoutines];
const selectedRoutine=()=>allRoutines().find(r=>r.id===selectedRoutineId);
const recordTitle=r=>r.routineTitle||focusNames[r.focus]+' splits';
const dateLong=d=>d.toLocaleDateString(undefined,{month:'long',day:'numeric'});
const subtitle=focus=>focus==='middle'?'Open your inner thighs':'Lengthen hamstrings & hip flexors';
function save(){if(storageBlocked)return false;try{localStorage.setItem(key,JSON.stringify(state));return true;}catch(e){storageError='History cannot be saved in this browser right now. Keep this page open until storage is available.';toast(storageError);return false;}}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,6000);}
function announce(message){document.querySelector('#announcements').textContent=message;}
function nav(){return Object.entries({home:'Home',practice:'Routines',history:'History',settings:'Settings'}).map(([id,label])=>`<button class="nav-button ${view===id?'active':''}" data-action="nav" data-value="${id}" ${view===id?'aria-current="page"':''}><span class="nav-icon" aria-hidden="true">${icons[id]}</span><span>${label}</span></button>`).join('');}
function shell(content){return `<div class="shell"><aside class="sidebar"><a href="#home" class="brand" data-action="home"><span class="brand-mark" aria-hidden="true">✦</span>UNFOLD</a><nav aria-label="Main navigation">${nav()}</nav></aside><main id="main" class="page ${view==='settings'?'settings-page':''}" tabindex="-1">${storageError?`<p class="storage-banner" role="alert">${esc(storageError)}</p>`:''}${content}</main><nav class="bottom-nav" aria-label="Main navigation">${nav()}</nav></div>`;}
function topbar(){return `<header class="topbar"><span class="date-label">${esc(new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}))}</span><span class="mobile-brand brand"><span class="brand-mark" aria-hidden="true">✦</span>UNFOLD</span><span class="streak"><span aria-hidden="true">♧</span>${streak(state.records)} day streak</span></header>`;}
function coverArt(r){if(r.id==='dani-front-splits-10')return '<img class="stretch-art" src="./illustrations/front-splits-cover.png" alt="" aria-hidden="true" width="1254" height="1254" decoding="async">';const last=r.steps.at(-1);return routinePose(last.pose,last.side==='right');}
function home(){
 const routines=allRoutines();
 const latest=state.records.slice().sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))[0];
 const next=routines.find(r=>r.id===latest?.routineId)||routines[0];
 const days=new Set(state.records.map(r=>r.day));
 const week=Array.from({length:7},(_,i)=>{const date=new Date();date.setHours(0,0,0,0);date.setDate(date.getDate()-6+i);return date;});
 return `${topbar()}
 ${next?`<section class="home-spotlight"><div class="spotlight-art">${coverArt(next)}</div><div class="spotlight-copy"><p class="eyebrow">${latest?.routineId===next.id?'RETURN TO YOUR PRACTICE':'YOUR NEXT PRACTICE'}</p><h2>${esc(next.title)}</h2><p class="small muted">${esc(next.author)} · ${formatTime(routineSeconds(next))} movement · ${next.steps.length} moves</p><button class="primary wide" data-action="routine" data-value="${esc(next.id)}">View routine <span aria-hidden="true">↗</span></button></div></section>`:''}
 <section class="home-rhythm"><div class="section-head"><h2 class="eyebrow">YOUR LAST SEVEN DAYS</h2><button class="quiet" data-action="nav" data-value="history">View history ↗</button></div><div class="week-strip">${week.map(date=>`<div class="week-day ${days.has(dayKey(date))?'practiced':''} ${dayKey(date)===dayKey()?'current':''}" aria-label="${esc(date.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}))}, ${days.has(dayKey(date))?'practiced':'no practice recorded'}"><span>${esc(date.toLocaleDateString(undefined,{weekday:'narrow'}))}</span><strong>${days.has(dayKey(date))?'✓':date.getDate()}</strong></div>`).join('')}</div><p class="small muted">${days.size?'Every practice adds up. Rest days have their place, too.':'Your first completed routine will leave a mark here.'}</p></section>
`;
}
function library(){
 return `${topbar()}<div class="intro library-intro"><p class="eyebrow">THE ROUTINE LIBRARY</p><h1>Your routines.</h1><p>Choose a sequence and follow its pace.</p></div><div class="routine-library">${allRoutines().map(r=>`<button class="routine-tile" data-action="routine" data-value="${esc(r.id)}"><span class="tile-art">${coverArt(r)}</span><span class="tile-copy"><strong>${esc(r.title)}</strong><span class="tile-author">${esc(r.author)}</span><span class="tile-meta">${formatTime(routineSeconds(r))} movement · ${r.steps.length} moves</span></span><span class="tile-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>`;
}
function routineDetail(r){
 const seconds=routineSeconds(r);
 return `${topbar()}<button class="quiet back-link" data-action="library">← All routines</button><div class="intro"><p class="eyebrow">${esc(categories[r.category])} / GUIDED SEQUENCE</p><h1>${esc(r.title)}</h1><p>By ${esc(r.author)}</p></div><div class="home-grid"><div class="main-column"><div class="routine-detail-cover">${coverArt(r)}</div><p>${esc(r.description)}</p>${r.source?`<p class="small"><a href="${esc(r.source)}" target="_blank" rel="noopener noreferrer">Original routine & demonstrations ↗</a></p>`:''}</div><div class="side-column"><section class="card settings-card"><p class="eyebrow">THE PLAN</p><div class="routine-facts"><div><strong>${formatTime(seconds)}</strong><span>movement time</span></div><div><strong>${r.steps.length}</strong><span>timed moves</span></div></div><p class="small muted">Each move has a fixed duration. Five-second setup intervals are extra: ${formatTime(seconds+r.steps.length*5)} before pauses.</p><div class="divider"></div><p class="small">${esc(r.equipment.join(' · '))}</p><div class="setting-line"><span id="sound-label">Switch chime</span><button class="switch" role="switch" aria-checked="${state.prefs.sound}" aria-labelledby="sound-label" data-action="sound"></button></div><p class="small muted">${esc(r.notes)}</p></section><section class="start-card"><button class="primary wide" data-action="start">Begin routine <span aria-hidden="true">↗</span></button></section></div></div><section class="section sequence"><div class="section-head"><h2 class="eyebrow">THE SEQUENCE / IN ORDER</h2><span class="small muted">Fixed timings</span></div><ol class="sequence-list sequence-cards">${r.steps.map((m,i)=>`<li><div class="sequence-square"><span class="sequence-number">${String(i+1).padStart(2,'0')}</span><span class="sequence-thumb">${routinePose(m.pose,m.side==='right')}</span><span class="sequence-seconds">${m.seconds}s</span></div><span class="sequence-name">${esc(m.name)}${m.side==='both'?'':' · '+m.side}<small class="move-type">${m.mode==='active'?'Active movement':'Hold'}</small></span></li>`).join('')}</ol></section>`;
}
function history(){const today=dayKey(),days=new Set(state.records.map(r=>r.day)),offset=month.getDay(),last=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();let cells=Array(offset).fill('<span aria-hidden="true"></span>');for(let day=1;day<=last;day++){const date=new Date(month.getFullYear(),month.getMonth(),day),key=dayKey(date);cells.push(`<span class="calendar-day ${days.has(key)?'done':''} ${key===today?'today':''}" aria-label="${esc(date.toLocaleDateString(undefined,{dateStyle:'full'}))}, ${days.has(key)?'practice completed':'no completed practice'}">${day}</span>`);}
return `${topbar()}<div class="intro"><p class="eyebrow" style="margin:0 0 16px">Your history</p><h1>Look how far<br>you’ve come.</h1><p>Every practice is a little investment in you.</p></div><section class="stats" aria-label="Practice statistics"><div class="stat"><strong>${days.size}</strong><span>days practiced</span></div><div class="stat"><strong>${streak(state.records)}</strong><span>day streak</span></div><div class="stat"><strong>${Number((state.records.reduce((a,r)=>a+r.seconds,0)/60).toFixed(1))}</strong><span>total minutes</span></div></section>
<div class="history-grid"><section class="card" aria-label="Practice calendar"><div class="calendar-head"><button class="circle-button" aria-label="Previous month" data-action="month" data-value="-1">‹</button><h2>${esc(month.toLocaleDateString(undefined,{month:'long',year:'numeric'}))}</h2><button class="circle-button" aria-label="Next month" data-action="month" data-value="1">›</button></div><div class="calendar-grid">${['S','M','T','W','T','F','S'].map(s=>`<span class="weekday" aria-hidden="true">${s}</span>`).join('')}${cells.join('')}</div><p class="calendar-legend"><span class="dot" aria-hidden="true"></span>Completed practice</p></section><section class="journal"><h2 class="eyebrow">Practice journal</h2>${state.records.length?state.records.slice().sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).map(r=>`<article class="journal-item"><span class="checkmark" aria-hidden="true">✓</span><div>${esc(recordTitle(r))}<small>${esc(new Date(r.date).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}))}</small></div><span class="small">${formatTime(r.seconds)}</span></article>`).join(''):`<div class="empty"><span aria-hidden="true">❧</span><h3>Your first page is waiting.</h3><p>Finish a practice to mark your calendar. Build consistency at your own pace.</p></div>`}</section></div><p class="small muted" style="margin-top:25px">Saved on this device. A session counts when you reach the end and complete at least one full hold. Skipped holds don’t add minutes.</p>`;}
function settings(){return `${topbar()}<div class="intro"><h1>Settings</h1></div><section class="card"><div class="setting-line"><span id="sound-label">Switch chime</span><button class="switch" role="switch" aria-checked="${state.prefs.sound}" aria-labelledby="sound-label" data-action="sound"></button></div></section>`;}
function render(){
 const focused=document.activeElement;const action=focused?.dataset?.action,value=focused?.dataset?.value;
 if(session){renderSession();return;}
 app.innerHTML=shell(selectedRoutine()?routineDetail(selectedRoutine()):view==='history'?history():view==='settings'?settings():view==='practice'?library():home());
 if(action){const match=[...app.querySelectorAll('[data-action]')].find(e=>e.dataset.action===action&&e.dataset.value===value);match?.focus({preventScroll:true});}
}
function renderSession(){if(session.phase==='complete'){completeSession();return;}
 const s=session,stretch=s.step.stretch,next=s.steps[s.index+1]?.stretch;
 app.innerHTML=`<main id="main" class="session-shell" tabindex="-1">
 <header class="session-top"><button class="circle-button" data-action="end" aria-label="End practice">×</button><span class="session-position">${s.index+1} OF ${s.steps.length}</span><button class="circle-button" data-action="session-sound" aria-label="${s.sound?'Mute':'Enable'} switch chime" aria-pressed="${s.sound}">${s.sound?'♪':'♩'}</button></header>
 <div class="session-track" aria-label="Routine progress"><span style="width:${s.index/s.steps.length*100}%"></span></div>
 <div class="session-heading"><div class="session-title"><p class="eyebrow">${s.phase==='setup'?'Take a moment to get ready':stretch.mode==='active'?'ACTIVE MOVEMENT':esc(stretch.area)}</p><h1>${esc(stretch.name)}</h1></div><div class="clock"><svg viewBox="0 0 194 194" aria-hidden="true"><circle class="track" cx="97" cy="97" r="90"/><circle class="elapsed" id="timer-ring" cx="97" cy="97" r="90"/></svg><div class="clock-digits" role="timer" aria-live="off" aria-label="Seconds remaining"><strong id="timer-number"></strong><small id="timer-label"></small></div></div></div>
 <div class="session-layout"><div class="pose-panel">${routinePose(stretch.pose,stretch.side==='right')}</div><div class="session-details"><div class="cues"><p>${esc(stretch.cue)}</p><p class="modification"><strong>Make it gentler:</strong> ${esc(stretch.modification)}</p></div>${next?`<figure class="up-next-card"><figcaption><span class="eyebrow">Up next</span><span class="sr-only">: ${esc(next.name)}</span></figcaption><div class="up-next-art">${routinePose(next.pose,next.side==='right')}</div></figure>`:''}</div></div>
 <p class="session-note">Gentle tension, never pain. Timer pauses when you leave.</p>
 <footer class="session-controls"><div class="session-controls-inner"><button class="primary" data-action="pause" id="pause-button"></button><button class="quiet" data-action="skip">Skip move <span aria-hidden="true">⇥</span></button></div></footer></main>`;
 updateClock();
}
function updateClock(){if(!session||session.phase==='complete')return;const s=session;const number=document.querySelector('#timer-number');if(!number)return;number.textContent=String(Math.ceil(s.remaining)).padStart(2,'0');document.querySelector('#timer-label').textContent=s.paused?'PAUSED':s.phase==='setup'?'GET READY':s.step.stretch.mode==='active'?'MOVE':'HOLD';document.querySelector('#pause-button').textContent=s.paused?'▶  Resume practice':'Ⅱ  Pause';document.querySelector('#timer-ring').style.strokeDashoffset=565.487*(1-Math.max(0,Math.min(1,1-s.remaining/s.duration)));}
function completeSession(){
 const s=session;let saved=state.records.some(r=>r.id===s.id);
 if(!s.recorded){s.recorded=true;if(s.completedHolds){const date=new Date();state.records.push({id:s.id,date:date.toISOString(),day:dayKey(date),focus:s.focus,seconds:s.completedSeconds,holds:s.completedHolds,routineId:s.routineId,routineTitle:s.routineTitle,category:s.category});saved=save();}releaseWake();}
 app.innerHTML=`<main id="main" class="completion" tabindex="-1"><div class="completion-flower" aria-hidden="true">✧</div><p class="eyebrow">Practice complete</p><h1>You showed up.<br>That’s progress.</h1><p class="muted">${formatTime(s.completedSeconds)} · ${esc(s.routineTitle||focusNames[s.focus]+' splits')}</p><p class="small muted">${s.completedHolds?(saved?'Saved to your history.':'Kept in this session, but browser storage could not save it.')+(s.skippedHolds?` ${s.skippedHolds} skipped holds excluded.`:''):'No full holds completed, so this session wasn’t added to your history.'}</p><button class="primary" data-action="done">Back to your day <span aria-hidden="true">↗</span></button></main>`;
 announce('Practice complete. '+formatTime(s.completedSeconds)+' completed.');
}
function unlockAudio(){try{if(!audio){const Audio=window.AudioContext||window.webkitAudioContext;if(Audio)audio=new Audio();}if(audio?.state==='suspended')audio.resume().catch(()=>{});}catch{}}
function chime(){if(!session?.sound||!audio||audio.state!=='running')return;try{const now=audio.currentTime;[659.25,880].forEach((freq,i)=>{const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(0,now+i*.13);gain.gain.linearRampToValueAtTime(.17,now+i*.13+.012);gain.gain.exponentialRampToValueAtTime(.001,now+i*.13+.4);osc.connect(gain);gain.connect(audio.destination);osc.start(now+i*.13);osc.stop(now+i*.13+.42);});}catch{}}
async function requestWake(){try{if('wakeLock'in navigator&&!document.hidden&&session&&!session.paused&&session.phase!=='complete'){await releaseWake();wakeLock=await navigator.wakeLock.request('screen');}}catch{}}
async function releaseWake(){try{const lock=wakeLock;wakeLock=null;await lock?.release();}catch{}}
function cue(){chime();announce(session.phase==='complete'?'Practice complete':session.phase==='setup'?'Next: '+session.step.stretch.name:'Begin. '+session.step.seconds+' seconds.');}
function download(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),20000);}
app.addEventListener('click',async e=>{
 const el=e.target.closest('[data-action]');if(!el)return;const {action,value}=el.dataset;
 if(action==='nav'||action==='home'){e.preventDefault();view=action==='home'?'home':value;selectedRoutineId=null;render();window.scrollTo(0,0);document.querySelector('#main')?.focus({preventScroll:true});}
 else if(action==='routine'){view='practice';selectedRoutineId=value;render();window.scrollTo(0,0);}
 else if(action==='library'){view='practice';selectedRoutineId=null;render();window.scrollTo(0,0);}
 else if(action==='focus'){state.prefs.focus=value;save();render();}
 else if(action==='hold'){state.prefs.hold=Number(value);save();render();}
 else if(action==='sound'){state.prefs.sound=!state.prefs.sound;save();render();}
 else if(action==='start'){const r=selectedRoutine();if(!r)return;unlockAudio();session=new Session(routineSteps(r),'routine',{sound:state.prefs.sound});Object.assign(session,{routineId:r.id,routineTitle:r.title,category:r.category});render();window.scrollTo(0,0);requestWake();announce('Get ready for '+session.step.stretch.name);}
 else if(action==='pause'){if(session.paused){unlockAudio();session.resume();requestWake();}else {session.pause();releaseWake();}updateClock();}
 else if(action==='skip'){unlockAudio();session.skip();cue();renderSession();document.querySelector('[data-action="skip"]')?.focus({preventScroll:true});}
 else if(action==='session-sound'){session.sound=!session.sound;unlockAudio();renderSession();}
 else if(action==='end'){session.pause();releaseWake();updateClock();document.querySelector('#end-dialog').showModal();}
 else if(action==='done'){session=null;selectedRoutineId=null;view='history';render();window.scrollTo(0,0);}
 else if(action==='month'){month=new Date(month.getFullYear(),month.getMonth()+Number(value),1);render();}
 else if(action==='export'){download({app:'Unfold',version:1,exportedAt:new Date().toISOString(),records:state.records},`unfold-history-${dayKey()}.json`);toast('History backup downloaded. Keep it somewhere safe.');}
 else if(action==='raw-export'){try{download({raw:localStorage.getItem(key)},'unfold-stored-data.json');}catch{toast('Browser storage is unavailable.');}}
 else if(action==='import')document.querySelector('#import-file').click();
 else if(action==='install'&&installPrompt){await installPrompt.prompt();installPrompt=null;render();}
});
app.addEventListener('input',e=>{if(e.target.id==='minutes'){state.prefs.minutes=Number(e.target.value);document.querySelector('#minutes-output').textContent=state.prefs.minutes+' min';e.target.setAttribute('aria-valuetext',state.prefs.minutes+' minutes');}});
app.addEventListener('change',async e=>{
 if(e.target.id==='minutes'){save();render();document.querySelector('#minutes')?.focus({preventScroll:true});}
 if(e.target.id==='import-file'&&e.target.files[0]){
  try{if(storageBlocked)throw Error('Stored data could not be read. Back it up before importing into a fresh installation.');const file=e.target.files[0];if(file.size>10_000_000)throw Error('Backup file is too large.');const data=JSON.parse(await file.text());if(data.app!=='Unfold'||data.version!==1)throw Error('Choose an Unfold history backup.');const imported=validateRecords(data.records),ids=new Set(state.records.map(r=>r.id)),fresh=imported.filter(r=>!ids.has(r.id));state.records.push(...fresh);const persisted=save();render();toast(persisted?`Imported ${fresh.length} ${fresh.length===1?'session':'sessions'}. Existing history kept.`:'Imported for this session only. Browser storage is unavailable.');}catch(error){toast(error.message==='Invalid history file'||error.message==='Invalid session in history file'?'This backup contains invalid session data. Nothing was imported.':error instanceof SyntaxError?'This is not a valid JSON backup.':error.message);}
 }
});
document.querySelector('#end-dialog').addEventListener('close',e=>{if(!session)return;if(e.target.returnValue==='end'){releaseWake();session=null;view='practice';render();}else{unlockAudio();session.resume();requestWake();updateClock();}});
function pauseHidden(){if(session&&session.phase!=='complete'){session.pause();releaseWake();updateClock();}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseHidden();});window.addEventListener('pagehide',pauseHidden);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;if(view==='settings'&&!session)render();});
window.addEventListener('appinstalled',()=>{installPrompt=null;if(view==='settings'&&!session)render();});
window.addEventListener('offline',()=>toast('You’re offline. Cached practice and local history are still available.'));
setInterval(()=>{if(!session||session.phase==='complete')return;const changed=session.tick();if(changed){cue();renderSession();}else updateClock();},100);
render();
if('serviceWorker'in navigator && !['localhost','127.0.0.1','[::1]'].includes(location.hostname)){
 navigator.serviceWorker.register('./sw.js').then(reg=>{
  if(reg.active){offlineReady=true;if(view==='settings'&&!session)render();}
  const worker=reg.installing;
  worker?.addEventListener('statechange',()=>{if(worker.state==='activated'){offlineReady=true;if(view==='settings'&&!session)render();}else if(worker.state==='redundant')toast('Offline setup did not finish. Reopen while online to try again.');});
  navigator.serviceWorker.ready.then(()=>{offlineReady=true;if(view==='settings'&&!session)render();});
 }).catch(()=>toast('Offline setup is unavailable here. The app still works while online.'));
}else if(view==='settings')toast('This browser does not support offline installation.');
