import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import {CONFIG,START,ITEMS} from './data.js';

const $=s=>document.querySelector(s);
const km=m=>(m/1000).toFixed(1)+' km', mins=s=>Math.max(1,Math.round(s/60));
const KIND={activity:'Activity',location:'Location',nest:'Nest'};
function dist(a,b){const R=6371e3,t=Math.PI/180,x=Math.sin((b[1]-a[1])*t/2)**2+Math.cos(a[1]*t)*Math.cos(b[1]*t)*Math.sin((b[0]-a[0])*t/2)**2;return 2*R*Math.asin(Math.sqrt(x));}

let pos=START, here=ITEMS.find(i=>i.id==='mds'), recent=[], trip=null, follow=true;
const EMPTY={type:'FeatureCollection',features:[]};

// ---------- map ----------
const map=new maplibregl.Map({container:'map',style:CONFIG.STYLE,center:START,zoom:15.6,maxBounds:CONFIG.BOUNDS,attributionControl:{compact:true}});
map.on('dragstart',()=>{follow=false;});            // user dragged: stop following until Recentre
map.on('load',()=>{
  map.addSource('route',{type:'geojson',data:EMPTY});
  map.addLayer({id:'route-glow',type:'line',source:'route',paint:{'line-color':'#ff4fc3','line-width':14,'line-opacity':.3,'line-blur':4}});
  map.addLayer({id:'route-line',type:'line',source:'route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#ff4fc3','line-width':5}});
});
ITEMS.forEach(i=>{const el=document.createElement('div');el.className='pin '+i.type;el.title=i.name;if(i.type==='nest')el.textContent='N';
  new maplibregl.Marker({element:el}).setLngLat(i.ll).addTo(map);});
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
async function startTrip(item){
  if(trip||item.id===here.id)return;
  hideInfo();showPage(null);setBusy(true);
  const r=await getRoute(pos,item.ll),cum=[0];
  for(let i=1;i<r.coords.length;i++)cum.push(cum[i-1]+dist(r.coords[i-1],r.coords[i]));
  trip={item,r,cum,total:cum.at(-1)||1,s:0,paused:false,last:performance.now(),followAt:performance.now()+800};
  map.getSource('route').setData({type:'Feature',geometry:{type:'LineString',coordinates:r.coords}}); // pink path lights up
  const b=r.coords.reduce((bb,c)=>bb.extend(c),new maplibregl.LngLatBounds(r.coords[0],r.coords[0]));
  map.fitBounds(b,{padding:{top:110,bottom:260,left:40,right:40},maxZoom:16.5,duration:700});
  follow=true;$('#trip').hidden=false;$('#pauseBtn').textContent='Pause';$('#tripTitle').textContent='Heading to '+item.name;
  requestAnimationFrame(tick);
}
function tick(now){
  if(!trip)return;
  const dt=(now-trip.last)/1000;trip.last=now;
  if(!trip.paused)trip.s=Math.min(trip.total,trip.s+CONFIG.SPEED*dt);
  pos=pointAt(trip,trip.s);scooter.setLngLat(pos);
  if(follow&&now>trip.followAt)map.jumpTo({center:pos});
  const left=1-trip.s/trip.total;
  $('#bar').style.width=(100-left*100)+'%';
  $('#tripSub').textContent=`${km(trip.total*left)} left \u00b7 about ${mins(trip.r.dur*left)} min`;
  if(trip.s>=trip.total)return arrive();
  requestAnimationFrame(tick);
}
function arrive(){
  const {item,r}=trip;here=item;recent=[item.id,...recent].slice(0,2);trip=null;
  map.getSource('route').setData(EMPTY);$('#trip').hidden=true;setBusy(false);showInfo(item,r);
}
$('#pauseBtn').onclick=()=>{if(!trip)return;trip.paused=!trip.paused;trip.last=performance.now();$('#pauseBtn').textContent=trip.paused?'Resume':'Pause';};
$('#skipBtn').onclick=()=>{if(trip)trip.s=trip.total;};            // complete instantly
function setBusy(b){$('#rndLoc').disabled=$('#rndAct').disabled=b;}

// ---------- random logic ----------
function pick(types){
  let pool=ITEMS.filter(i=>types.includes(i.type)&&i.id!==here.id&&!recent.includes(i.id));
  if(!pool.length)pool=ITEMS.filter(i=>types.includes(i.type)&&i.id!==here.id);
  return pool[Math.floor(Math.random()*pool.length)];
}
$('#rndLoc').onclick=()=>startTrip(pick(['location','nest'])); // locations and nests, never activities
$('#rndAct').onclick=()=>startTrip(pick(['activity']));

// ---------- arrival info ----------
function showInfo(i,r){
  const el=$('#info');el.hidden=false;
  el.innerHTML=`<div class="photo ${i.type}"></div><div class="row"><h2>${i.name}</h2><span class="tag">${KIND[i.type]}</span></div>
  <p class="hook">${i.hook}</p><div class="facts"><span>${km(r.dist)}</span><span>${mins(r.dur)} min ride</span></div><p>${i.desc}</p><button class="pill fill" id="done">Done</button>`;
  $('#done').onclick=hideInfo;
}
function hideInfo(){$('#info').hidden=true;}

// ---------- recentre ----------
$('#recentre').onclick=()=>{follow=true;map.flyTo({center:pos,zoom:Math.max(map.getZoom(),15.6)});};

// ---------- search ----------
const q=$('#q'),res=$('#results');
q.oninput=()=>{const v=q.value.trim().toLowerCase();
  const hits=v?ITEMS.filter(i=>i.name.toLowerCase().includes(v)).slice(0,5):[];
  res.innerHTML=hits.map(i=>`<li data-id="${i.id}"><span class="pin ${i.type} sm"></span>${i.name}</li>`).join('');};
res.onpointerdown=e=>{const li=e.target.closest('li');if(!li)return;e.preventDefault();
  q.value='';res.innerHTML='';q.blur();startTrip(ITEMS.find(i=>i.id===li.dataset.id));};

// ---------- menu and pages ----------
const FILTERS={activity:['Nearest','Outdoors'],location:['Nearest','Nests','Views']};
const TAG={Outdoors:'outdoors',Nests:'nest',Views:'views'};
const active={activity:new Set(),location:new Set()};
const TITLE={activity:'Activities',location:'Locations'};
function openDrawer(o){$('#drawer').classList.toggle('open',o);$('#scrim').hidden=!o;}
$('#menuBtn').onclick=()=>openDrawer(true);$('#scrim').onclick=()=>openDrawer(false);
$('#drawer').onclick=e=>{const b=e.target.closest('[data-go]');if(b){openDrawer(false);showPage(b.dataset.go==='map'?null:b.dataset.go);}};
function showPage(kind){const p=$('#page');p.hidden=!kind;if(kind)renderPage(kind);}
function renderPage(kind){
  const types=kind==='activity'?['activity']:['location','nest'];let list=ITEMS.filter(i=>types.includes(i.type));
  active[kind].forEach(f=>{if(TAG[f])list=list.filter(i=>i.tags.includes(TAG[f]));});
  if(active[kind].has('Nearest'))list.sort((a,b)=>dist(pos,a.ll)-dist(pos,b.ll));
  $('#page').innerHTML=`<header><button class="round" data-go="map" aria-label="Back">&larr;</button><h1>${TITLE[kind]}</h1><button class="pill" data-go="map">Map</button></header>
  <div class="chips">${FILTERS[kind].map(f=>`<button class="chip ${active[kind].has(f)?'on':''}" data-chip="${f}">${f}</button>`).join('')}</div>
  <div class="list">${list.map(i=>`<article><span class="pin ${i.type}"></span><div><b>${i.name}</b><small>${i.hook}</small><small>${km(dist(pos,i.ll))} away</small></div>
  <button class="pill fill" data-send="${i.id}" ${trip||i.id===here.id?'disabled':''}>${i.id===here.id?'You are here':'Send scooter'}</button></article>`).join('')||'<p class="empty">Nothing matches.</p>'}</div>`;
  $('#page').dataset.kind=kind;
}
$('#page').onclick=e=>{const p=$('#page'),k=p.dataset.kind;
  if(e.target.closest('[data-go]'))return showPage(null);
  const c=e.target.closest('[data-chip]');if(c){const s=active[k];s.has(c.dataset.chip)?s.delete(c.dataset.chip):s.add(c.dataset.chip);return renderPage(k);}
  const s=e.target.closest('[data-send]');if(s)startTrip(ITEMS.find(i=>i.id===s.dataset.send));};

// ---------- startup ----------
setTimeout(()=>$('#splash').remove(),3200); // CSS fades the message in and out
