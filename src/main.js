import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import {CONFIG,START,ITEMS,POP,GEMS,GEM_RADIUS} from './data.js';

const $=s=>document.querySelector(s);
const km=m=>(m/1000).toFixed(1)+' km', mins=s=>Math.max(1,Math.round(s/60));
const KIND={activity:'Activity',location:'Location',nest:'Nest'};
function dist(a,b){const R=6371e3,t=Math.PI/180,x=Math.sin((b[1]-a[1])*t/2)**2+Math.cos(a[1]*t)*Math.cos(b[1]*t)*Math.sin((b[0]-a[0])*t/2)**2;return 2*R*Math.asin(Math.sqrt(x));}

let pos=START, here=ITEMS.find(i=>i.id==='mds'), recent=[], trip=null, follow=true;
const EMPTY={type:'FeatureCollection',features:[]};

// ---------- map ----------
const map=new maplibregl.Map({container:'map',style:CONFIG.STYLE,center:START,zoom:15.6,maxBounds:CONFIG.BOUNDS,attributionControl:{compact:true}});
let userMoving=false,ft=null;
map.on('dragstart',()=>setFollow(false));
map.on('mousedown',e=>{const o=e.originalEvent;if(o.button===0&&!o.ctrlKey&&!o.shiftKey)setFollow(false);}); // stop following the instant you grab the map
map.on('touchstart',e=>{clearTimeout(ft);if(e.points.length===1)ft=setTimeout(()=>setFollow(false),120);}); // one finger = pan; two fingers (rotate/zoom) keep following
map.on('touchend',()=>clearTimeout(ft));map.on('touchcancel',()=>clearTimeout(ft));
map.on('movestart',e=>{if(e.originalEvent)userMoving=true;});map.on('moveend',()=>{userMoving=false;}); // never fight the user's gesture // panning stops following; rotating or zooming does not
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
  if(follow&&!userMoving&&now>trip.followAt)map.jumpTo({center:pos});
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
function setFollow(v){follow=v;const o=v?{around:'center'}:{};map.touchZoomRotate.enable(o);map.scrollZoom.enable(o);} // while following, rotate/zoom around the scooter
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
  const el=$('#info');el.hidden=false;
  const btn=mode==='preview'?'<button class="pill fill" id="go">Send scooter</button><button class="pill" id="done">Close</button>':'<button class="pill fill" id="done">'+(mode==='here'?'Close':'Done')+'</button>';
  el.innerHTML=`<div class="photo ${i.type}"></div><div class="row"><h2>${i.name}</h2><span class="tag">${KIND[i.type]}</span></div>
  <p class="hook">${i.hook}</p>${r?`<div class="facts"><span>${km(r.dist)}</span><span>${mins(r.dur)} min ride</span></div>`:''}<p>${i.desc}</p><div class="btns">${btn}</div>`;
  $('#done').onclick=hideInfo;if($('#go'))$('#go').onclick=()=>startTrip(i,r);
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
function showPage(kind){const p=$('#page');p.hidden=!kind;if(kind)renderPage(kind);}
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
setTimeout(()=>$('#splash').remove(),3200); // CSS fades the message in and out
