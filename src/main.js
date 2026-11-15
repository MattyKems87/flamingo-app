import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import {CONFIG,START,ITEMS,POP,GEMS,GEM_RADIUS,INTRO} from './data.js';
import {PATH} from './introPath.js';

const $=s=>document.querySelector(s);
const km=m=>(m/1000).toFixed(1)+' km', mins=s=>Math.max(1,Math.round(s/60));
const KIND={activity:'Activity',location:'Location',nest:'Nest'};
function dist(a,b){const R=6371e3,t=Math.PI/180,x=Math.sin((b[1]-a[1])*t/2)**2+Math.cos(a[1]*t)*Math.cos(b[1]*t)*Math.sin((b[0]-a[0])*t/2)**2;return 2*R*Math.asin(Math.sqrt(x));}

let pos=START, here=ITEMS.find(i=>i.id==='mds'), recent=[], trip=null, follow=false;
const EMPTY={type:'FeatureCollection',features:[]};

// ---------- map ----------
const map=new maplibregl.Map({container:'map',style:CONFIG.STYLE,center:START,zoom:15.6,maxBounds:CONFIG.BOUNDS,attributionControl:{compact:true}});
// Releasing the camera: pressing the map stops following at once. A touch waits 120 ms so a two-finger rotate/zoom keeps following.
const cc=map.getCanvasContainer();let ft=null;
cc.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'){if(e.button===0&&!e.ctrlKey&&!e.shiftKey)setFollow(false);return;}
  clearTimeout(ft);if(e.isPrimary)ft=setTimeout(()=>setFollow(false),120);
},true);
addEventListener('pointerup',()=>clearTimeout(ft));addEventListener('pointercancel',()=>clearTimeout(ft));
map.on('dragstart',()=>setFollow(false)); // panning stops following; rotating or zooming does not
map.addControl(new maplibregl.NavigationControl({showZoom:false,visualizePitch:false}),'top-right'); // compass: tap to reset north            // user dragged: stop following until Recentre
map.on('load',()=>{
  map.addSource('route',{type:'geojson',data:EMPTY});
  map.addLayer({id:'route-glow',type:'line',source:'route',paint:{'line-color':'#ff4fc3','line-width':14,'line-opacity':.3,'line-blur':4}});
  map.addLayer({id:'route-line',type:'line',source:'route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#ff4fc3','line-width':5}});
});
ITEMS.forEach(i=>{const el=document.createElement('div');el.className='pin '+i.type;el.title=i.name;if(i.type==='nest')el.textContent='N';
  el.onclick=e=>{e.stopPropagation();previewPin(i);};new maplibregl.Marker({element:el}).setLngLat(i.ll).addTo(map);});
const scEl=document.createElement('div');scEl.className='scooter';
scEl.innerHTML='<svg viewBox="0 0 48 48" width="44" height="44"><circle cx="24" cy="24" r="23" fill="#fff" stroke="#1f1f1f" stroke-width="2"/><g fill="none" stroke="#7a0a55" stroke-width="3" stroke-linecap="round"><circle cx="13" cy="33" r="3.5"/><circle cx="35" cy="33" r="3.5"/><path d="M13 33h12l6-16h4M31 17l4 16"/></g></svg>'; // placeholder icon
const scooter=new maplibregl.Marker({element:scEl}).setLngLat(START).addTo(map);

// ---------- routing ----------
async function getRoute(a,b){
  try{const r=await fetch(`${CONFIG.ROUTER}/${a[0]},${a[1]};${b[0]},${b[1]}?overview=full&geometries=geojson`);
    const rt=(await r.json()).routes[0];return {coords:rt.geometry.coordinates,dist:rt.distance,dur:rt.duration};
  }catch(e){const d=dist(a,b);return {coords:[a,b],dist:d,dur:d/4.5};} // straight-line fallback if offline
}
function pointAt(t,s){const c=t.r.coords,m=t.cum;let i=1;while(i<m.length-1&&m[i]<s)i++;
  const f=(s-m[i-1])/((m[i]-m[i-1])||1);return [c[i-1][0]+(c[i][0]-c[i-1][0])*f,c[i-1][1]+(c[i][1]-c[i-1][1])*f];}

// ---------- trips ----------
async function startTrip(item,pre){
  if(trip||item.id===here?.id)return;
  hideInfo();showPage(null);setBusy(true);
  const r=pre||await getRoute(pos,item.ll),cum=[0];
  for(let i=1;i<r.coords.length;i++)cum.push(cum[i-1]+dist(r.coords[i-1],r.coords[i]));
  trip={item,r,cum,total:cum.at(-1)||1,s:0,paused:false,last:performance.now(),followAt:performance.now()+800};
  drawRoute(r); // pink path lights up
  const b=r.coords.reduce((bb,c)=>bb.extend(c),new maplibregl.LngLatBounds(r.coords[0],r.coords[0]));
  map.fitBounds(b,{padding:{top:110,bottom:260,left:40,right:40},maxZoom:16.5,duration:700});
  setFollow(true);$('#trip').hidden=false;$('#pauseBtn').textContent='Pause';$('#tripTitle').textContent='Heading to '+item.name;
  requestAnimationFrame(tick);
}
function tick(now){
  if(!trip)return;
  const dt=(now-trip.last)/1000;trip.last=now;
  if(!trip.paused&&!gemOpen)trip.s=Math.min(trip.total,trip.s+CONFIG.SPEED*dt);
  pos=pointAt(trip,trip.s);scooter.setLngLat(pos);
  if(follow&&!map.isMoving()&&now>trip.followAt)map.jumpTo({center:pos}); // never fight a gesture in progress
  for(const g of GEMS)if(g.ll&&!got.has(g.id)&&dist(pos,g.ll)<GEM_RADIUS)offerGem(g);
  const left=1-trip.s/trip.total;
  $('#bar').style.width=(100-left*100)+'%';
  $('#tripSub').textContent=`${km(trip.total*left)} left \u00b7 about ${mins(trip.r.dur*left)} min`;
  if(trip.s>=trip.total)return arrive();
  requestAnimationFrame(tick);
}
function arrive(){
  const {item,r}=trip;here=item;recent=[item.id,...recent].slice(0,2);trip=null;
  $('#trip').hidden=true;setBusy(false);showInfo(item,r,'arrived');GEMS.filter(g=>g.at===item.id).forEach(offerGem);refreshPage(); // path stays until the card is closed
}
$('#pauseBtn').onclick=()=>{if(!trip)return;trip.paused=!trip.paused;trip.last=performance.now();$('#pauseBtn').textContent=trip.paused?'Resume':'Pause';};
$('#skipBtn').onclick=()=>{if(trip)trip.s=trip.total;};            // complete instantly
function setFollow(v){if(follow===v)return;follow=v;const o=v?{around:'center'}:{};[map.touchZoomRotate,map.scrollZoom].forEach(h=>{h.disable();h.enable(o);});} // while following, rotate/zoom around the scooter
function drawRoute(r){if(map.getSource('route'))map.getSource('route').setData({type:'Feature',geometry:{type:'LineString',coordinates:r.coords}});}
function clearRoute(){if(map.getSource('route'))map.getSource('route').setData(EMPTY);}
function cancelTrip(){if(!trip)return;trip=null;here=null;clearRoute();$('#trip').hidden=true;setBusy(false);refreshPage();}
$('#cancelBtn').onclick=cancelTrip; // scooter stays where it is
async function previewPin(i){
  if(trip)return;hideInfo();
  if(i.id===here?.id)return showInfo(i,null,'here');
  const r=await getRoute(pos,i.ll);if(trip)return;
  drawRoute(r);setFollow(false);
  const b=r.coords.reduce((bb,c)=>bb.extend(c),new maplibregl.LngLatBounds(r.coords[0],r.coords[0]));
  map.fitBounds(b,{padding:{top:110,bottom:400,left:40,right:40},maxZoom:16.5,duration:600});
  showInfo(i,r,'preview');
}
const gemQ=[],got=new Set();let gemOpen=false; // collected gems are kept in memory only (reset on reload)
function offerGem(g){if(got.has(g.id))return;got.add(g.id);gemQ.push(g);nextGem();}
function nextGem(){if(gemOpen||!gemQ.length)return;const g=gemQ.shift();gemOpen=true;$('#gemName').textContent=g.name;$('#gemText').textContent=g.text;$('#gem').hidden=false;}
$('#gemClose').onclick=()=>{$('#gem').hidden=true;gemOpen=false;nextGem();}; // the trip holds while the window is open
function refreshPage(){const p=$('#page');if(!p.hidden)renderPage(p.dataset.kind);}
function setBusy(b){$('#rndLoc').disabled=$('#rndAct').disabled=b;}

// ---------- random logic ----------
function pick(types){
  let pool=ITEMS.filter(i=>types.includes(i.type)&&i.id!==here?.id&&!recent.includes(i.id));
  if(!pool.length)pool=ITEMS.filter(i=>types.includes(i.type)&&i.id!==here?.id);
  return pool[Math.floor(Math.random()*pool.length)];
}
$('#rndLoc').onclick=()=>startTrip(pick(['location','nest'])); // locations and nests, never activities
$('#rndAct').onclick=()=>startTrip(pick(['activity']));

// ---------- arrival info ----------
function showInfo(i,r,mode){
  const el=$('#info');el.hidden=false;el.classList.remove('min');
  const btn=mode==='preview'?'<button class="pill fill" id="go">Send scooter</button><button class="pill" id="done">Close</button>':'<button class="pill fill" id="done">'+(mode==='here'?'Close':'Done')+'</button>';
  el.innerHTML=`<button class="grab" id="grab" aria-label="Collapse card to see the map" aria-expanded="true"><i></i></button>
  <div class="row head"><h2>${i.name}</h2><span class="tag">${KIND[i.type]}</span></div>
  <div class="more"><div class="photo ${i.type}"></div><p class="hook">${i.hook}</p>${r?`<div class="facts"><span>${km(r.dist)}</span><span>${mins(r.dur)} min ride</span></div>`:''}<p>${i.desc}</p><div class="btns">${btn}</div></div>`;
  $('#done').onclick=hideInfo;if($('#go'))$('#go').onclick=()=>startTrip(i,r);
  // Material "standard bottom sheet" drag handle: drag down/up, tap, or press Enter/Space to collapse or expand. Collapsed = a peek that leaves the map visible.
  const g=$('#grab');let y0=null,moved=false;
  const set=min=>{el.classList.toggle('min',min);g.setAttribute('aria-expanded',String(!min));g.setAttribute('aria-label',min?'Expand card':'Collapse card to see the map');};
  g.onpointerdown=e=>{y0=e.clientY;moved=false;g.setPointerCapture(e.pointerId);};
  g.onpointermove=e=>{if(y0===null)return;const d=e.clientY-y0;if(Math.abs(d)>24){moved=true;set(d>0);y0=e.clientY;}};
  g.onpointerup=()=>{if(!moved)set(!el.classList.contains('min'));y0=null;};
  g.onpointercancel=()=>{y0=null;};
  g.onclick=e=>{if(e.detail===0)set(!el.classList.contains('min'));}; // keyboard activation
  el.querySelector('.head').onclick=()=>{if(el.classList.contains('min'))set(false);};
}
function hideInfo(){$('#info').hidden=true;clearRoute();} // closing the card removes the pink path

// ---------- recentre ----------
$('#recentre').onclick=()=>{setFollow(true);map.flyTo({center:pos,zoom:Math.max(map.getZoom(),15.6)});};

// ---------- search ----------
const q=$('#q'),res=$('#results');
q.oninput=()=>{const v=q.value.trim().toLowerCase();
  const hits=v?ITEMS.filter(i=>i.name.toLowerCase().includes(v)).slice(0,5):[];
  res.innerHTML=hits.map(i=>`<li data-id="${i.id}"><span class="pin ${i.type} sm"></span>${i.name}</li>`).join('');};
res.onpointerdown=e=>{const li=e.target.closest('li');if(!li)return;e.preventDefault();
  q.value='';res.innerHTML='';q.blur();startTrip(ITEMS.find(i=>i.id===li.dataset.id));};

// ---------- menu and pages ----------
const FILTERS={activity:['Nearest','Outdoors','Free'],location:['Nearest','Nests','Views']};
const TAG={Outdoors:'outdoors',Nests:'nest',Views:'views',Free:'free'};
const active={activity:new Set(),location:new Set()};
const TITLE={activity:'Activities',location:'Locations'};
function openDrawer(o){$('#drawer').classList.toggle('open',o);$('#scrim').hidden=!o;}
$('#menuBtn').onclick=()=>openDrawer(true);$('#scrim').onclick=()=>openDrawer(false);
$('#drawer').onclick=e=>{const b=e.target.closest('[data-go]');if(b){openDrawer(false);showPage(b.dataset.go==='map'?null:b.dataset.go);}};
function setActive(k){document.querySelectorAll('#drawer [data-go]').forEach(b=>{const on=b.dataset.go===k;b.classList.toggle('on',on);on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current');});}
setActive('map');
function showPage(kind){const p=$('#page');p.hidden=!kind;if(kind)renderPage(kind);setActive(kind||'map');}
function renderPage(kind){
  const types=kind==='activity'?['activity']:['location','nest'];let list=ITEMS.filter(i=>types.includes(i.type));
  const pop=ITEMS.filter(i=>types.includes(i.type)&&POP[i.id]).sort((a,b)=>POP[b.id]-POP[a.id]).slice(0,6);
  active[kind].forEach(f=>{if(TAG[f])list=list.filter(i=>i.tags.includes(TAG[f]));});
  if(active[kind].has('Nearest'))list.sort((a,b)=>dist(pos,a.ll)-dist(pos,b.ll));
  $('#page').innerHTML=`<header><button class="round" data-go="map" aria-label="Back">&larr;</button><button class="round" data-menu aria-label="Menu">&#9776;</button><h1>${TITLE[kind]}</h1><button class="pill" data-go="map">Map</button></header>${trip?'<button class="pill fill wide" data-cancel>Cancel current trip</button>':''}
  <h2 class="sub">Most popular</h2><div class="car">${pop.map(i=>`<div class="cc"><span class="pin ${i.type}"></span><b>${i.name}</b><small>${i.hook}</small><button class="pill fill" data-send="${i.id}" ${trip||i.id===here?.id?'disabled':''}>Send scooter</button></div>`).join('')}</div>
  <div class="chips">${FILTERS[kind].map(f=>`<button class="chip ${active[kind].has(f)?'on':''}" data-chip="${f}">${f}</button>`).join('')}</div>
  <div class="list">${list.map(i=>`<article><span class="pin ${i.type}"></span><div><b>${i.name}</b><small>${i.hook}</small><small>${km(dist(pos,i.ll))} away</small></div>
  <button class="pill fill" data-send="${i.id}" ${trip||i.id===here?.id?'disabled':''}>${i.id===here?.id?'You are here':'Send scooter'}</button></article>`).join('')||'<p class="empty">Nothing matches.</p>'}</div>`;
  $('#page').dataset.kind=kind;
}
$('#page').onclick=e=>{const p=$('#page'),k=p.dataset.kind;
  if(e.target.closest('[data-cancel]'))return cancelTrip();
  if(e.target.closest('[data-menu]'))return openDrawer(true);
  if(e.target.closest('[data-go]'))return showPage(null);
  const c=e.target.closest('[data-chip]');if(c){const s=active[k];s.has(c.dataset.chip)?s.delete(c.dataset.chip):s.add(c.dataset.chip);return renderPage(k);}
  const s=e.target.closest('[data-send]');if(s)startTrip(ITEMS.find(i=>i.id===s.dataset.send));};

// mouse drag-scroll for the carousels (touch scrolls natively)
let dEl=null,dx=0,dl=0,moved=false;
$('#page').addEventListener('pointerdown',e=>{const c=e.target.closest('.car');if(c&&e.pointerType==='mouse'){dEl=c;dx=e.clientX;dl=c.scrollLeft;moved=false;}});
addEventListener('pointermove',e=>{if(!dEl)return;const d=e.clientX-dx;if(Math.abs(d)>5)moved=true;dEl.scrollLeft=dl-d;});
addEventListener('pointerup',()=>{dEl=null;});
$('#page').addEventListener('click',e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false;}},true);

// ---------- startup ----------
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const asset=p=>import.meta.env.BASE_URL+p;
// Music uses the Web Audio API because iPhones ignore audio.volume, so fades only work through a gain node.
let ctx,gain,audio,musicOn=localStorage.getItem('music')!=='off',musicActive=false,stopTimer=null,pauseTimer=null;
function initAudio(){
  if(ctx||!INTRO.MUSIC_FILE)return;
  audio=new Audio(asset(INTRO.MUSIC_FILE));audio.loop=INTRO.MUSIC_LOOP;
  ctx=new (window.AudioContext||window.webkitAudioContext)();gain=ctx.createGain();gain.gain.value=0;
  ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
}
function ramp(v,ms){if(!ctx)return;const t=ctx.currentTime;gain.gain.cancelScheduledValues(t);gain.gain.setValueAtTime(gain.gain.value,t);gain.gain.linearRampToValueAtTime(v,t+ms/1000);}
function playMusic(ms){if(!ctx||!musicOn)return;clearTimeout(pauseTimer);ctx.resume();audio.play().catch(()=>{});ramp(INTRO.MUSIC_VOLUME,ms);}
function fadeMusicOut(){ramp(0,INTRO.MUSIC_FADE_OUT);pauseTimer=setTimeout(()=>{audio&&audio.pause();musicActive=false;},INTRO.MUSIC_FADE_OUT+100);}
const ICON_ON='<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
const ICON_OFF='<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
function syncSound(){const b=$('#sound'),t=musicOn?'Turn music off':'Turn music on';b.setAttribute('aria-label',t);b.title=t;b.innerHTML=musicOn?ICON_ON:ICON_OFF;b.classList.toggle('off',!musicOn);}
$('#sound').onclick=()=>{
  musicOn=!musicOn;localStorage.setItem('music',musicOn?'on':'off');syncSound();initAudio();if(!ctx)return;
  if(!musicOn){ramp(0,250);clearTimeout(pauseTimer);pauseTimer=setTimeout(()=>{if(!musicOn)audio.pause();},300);}
  else if(musicActive)playMusic(500);
  else{musicActive=true;playMusic(INTRO.MUSIC_FADE_IN);clearTimeout(stopTimer);stopTimer=setTimeout(fadeMusicOut,INTRO.MUSIC_STOP_AFTER_MAP);}
};
document.addEventListener('visibilitychange',()=>{if(ctx)document.hidden?ctx.suspend():ctx.resume();});
syncSound();

// ---------- intro ----------
async function fade(el,to,ms){el.style.transition=`opacity ${ms}ms ease`;void el.offsetWidth;el.style.opacity=to;await sleep(ms);}
function runSpark(ms){return new Promise(res=>{
  const path=$('#sp'),L=path.getTotalLength(),g=$('#sg'),S=INTRO.SPARK_SIZE,N=16,cs=[];
  g.innerHTML='';g.style.opacity=1;
  for(let k=0;k<N;k++){const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('r',S*(1-k/N*.7));c.setAttribute('fill',k?INTRO.SPARK_COLOR:'#fff');c.setAttribute('opacity',(1-k/N)*.9);g.appendChild(c);cs.push(c);}
  const t0=performance.now();
  (function f(now){const t=Math.min(1,(now-t0)/ms);
    cs.forEach((c,k)=>{const p=path.getPointAtLength(Math.max(0,t*L-k*S*1.4));c.setAttribute('cx',p.x);c.setAttribute('cy',p.y);});
    t<1?requestAnimationFrame(f):res();})(t0);
});}
async function startIntro(){
  const intro=$('#intro');
  if(!INTRO.ENABLED){intro.remove();return;}
  const svg=$('#sparkSvg');svg.setAttribute('viewBox',`0 0 ${PATH.W} ${PATH.H}`);svg.style.setProperty('--spark',INTRO.SPARK_COLOR);
  svg.innerHTML=`<path id="sp" d="M${PATH.pts.map(p=>p.join(' ')).join('L')}" fill="none" stroke="none"/><g id="sg" style="opacity:0"></g>`;
  $('#logoImg').src=asset(INTRO.STRAVA_IMAGE);
  if(INTRO.REQUIRE_TAP){await new Promise(r=>$('#gate').addEventListener('click',r,{once:true}));initAudio();}
  else{initAudio();addEventListener('pointerdown',()=>{if(ctx){ctx.resume();if(musicActive&&musicOn)audio.play().catch(()=>{});}},{once:true});}
  $('#gate').remove();
  musicActive=true;playMusic(INTRO.MUSIC_FADE_IN);
  await sleep(INTRO.STRAVA_DELAY);await fade($('#logo'),1,INTRO.STRAVA_FADE_IN);
  await sleep(INTRO.SPARK_START_DELAY);await runSpark(INTRO.SPARK_DURATION);
  await sleep(INTRO.SPARK_FADE_DELAY);await fade($('#sg'),0,INTRO.SPARK_FADE_OUT);
  await sleep(INTRO.STRAVA_FADE_OUT_DELAY);await fade($('#logo'),0,INTRO.STRAVA_FADE_OUT);
  await sleep(INTRO.TITLE_DELAY);await fade($('#introTitle'),1,INTRO.TITLE_FADE_IN);
  await sleep(INTRO.TITLE_HOLD);await fade(intro,0,INTRO.TITLE_FADE_OUT);
  intro.remove(); // the map is now visible
  clearTimeout(stopTimer);stopTimer=setTimeout(fadeMusicOut,INTRO.MUSIC_STOP_AFTER_MAP);
}
startIntro();
