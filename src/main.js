import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'material-symbols/outlined.css';
import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/iconbutton/filled-tonal-icon-button.js';
import '@material/web/chips/chip-set.js';
import '@material/web/chips/filter-chip.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/icon/icon.js';
import '@material/web/fab/fab.js';
import '@material/web/progress/linear-progress.js';
import '@material/web/ripple/ripple.js';
import '@material/web/focus/md-focus-ring.js';
import './style.css';
import { CONFIG, START, ITEMS, POP, INTRO, RIDERS, COLLECT, COLLECTIBLES, PHOTOS } from './data.js';
import { PATH } from './introPath.js';

const $ = s => document.querySelector(s);
const km = m => (m / 1000).toFixed(1) + ' km', mins = s => Math.max(1, Math.round(s / 60));
const KIND = { activity: 'Activity', location: 'Location', nest: 'Nest' };
const byId = id => ITEMS.find(i => i.id === id), byName = (a, b) => a.name.localeCompare(b.name), rnd = (a, b) => a + Math.random() * (b - a);
const wait = ms => new Promise(r => setTimeout(r, ms)), asset = p => import.meta.env.BASE_URL + p;
function dist(a, b) { const R = 6371e3, t = Math.PI / 180, x = Math.sin((b[1] - a[1]) * t / 2) ** 2 + Math.cos(a[1] * t) * Math.cos(b[1] * t) * Math.sin((b[0] - a[0]) * t / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); }
// Placeholder pictures: random black and white shapes, stable per id. Replace with your own images.
function art(id) {
  if (PHOTOS[id]) return `<img src="${asset(PHOTOS[id])}" alt="" loading="lazy">`; let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; const r = () => (h = (h * 1664525 + 1013904223) >>> 0) / 4294967296;
  const bg = r() < .5 ? '#fff' : '#1f1f1f', fg = bg === '#fff' ? '#1f1f1f' : '#fff'; let s = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="100" height="100" fill="${bg}"/>`;
  for (let i = 0; i < 3; i++) {
    const c = r() < .5 ? fg : '#9a9a9a', x = r() * 70 + 10, y = r() * 70 + 10, q = r() * 22 + 10, t = r();
    s += t < .34 ? `<circle cx="${x}" cy="${y}" r="${q}" fill="${c}"/>` : t < .67 ? `<rect x="${x - q}" y="${y - q}" width="${q * 2}" height="${q * 2}" fill="${c}"/>` : `<polygon points="${x},${y - q} ${x + q},${y + q} ${x - q},${y + q}" fill="${c}"/>`;
  }
  return s + '</svg>';
}

let pos = START, here = byId('mds'), recent = [], trip = null, follow = false, modalOpen = false;
const EMPTY = { type: 'FeatureCollection', features: [] };

// ---------- map ----------
const map = new maplibregl.Map({ container: 'map', style: CONFIG.STYLE, center: START, zoom: 15.6, maxBounds: CONFIG.BOUNDS, attributionControl: { compact: true } });
map.addControl(new maplibregl.NavigationControl({ showZoom: false, visualizePitch: false }), 'top-left');
map.on('load', () => {
  map.addSource('route', { type: 'geojson', data: EMPTY });
  map.addLayer({ id: 'route-glow', type: 'line', source: 'route', paint: { 'line-color': '#ff4fc3', 'line-width': 14, 'line-opacity': .3, 'line-blur': 4 } });
  map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ff4fc3', 'line-width': 5 } });
});
// Releasing the camera: pressing the map stops following at once. A touch waits 120 ms so a two-finger rotate/zoom keeps following.
const cc = map.getCanvasContainer(); let ft = null;
cc.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse') { if (e.button === 0 && !e.ctrlKey && !e.shiftKey) setFollow(false); return; }
  clearTimeout(ft); if (e.isPrimary) ft = setTimeout(() => setFollow(false), 120);
}, true);
addEventListener('pointerup', () => clearTimeout(ft)); addEventListener('pointercancel', () => clearTimeout(ft));
map.on('dragstart', () => setFollow(false));
function setFollow(v) { if (follow === v) return; follow = v; const o = v ? { around: 'center' } : {};[map.touchZoomRotate, map.scrollZoom].forEach(h => { h.disable(); h.enable(o); }); }
ITEMS.forEach(i => {
  const el = document.createElement('div'); el.className = 'pin ' + i.type; el.title = i.name;
  el.onclick = e => { e.stopPropagation(); previewPin(i); }; new maplibregl.Marker({ element: el }).setLngLat(i.ll).addTo(map);
});
const scEl = document.createElement('div'); scEl.className = 'scooter';
// scEl.innerHTML='<svg viewBox="0 0 48 48" width="44" height="44"><circle cx="24" cy="24" r="23" fill="#fff" stroke="#1f1f1f" stroke-width="2"/><g fill="none" stroke="#7a0a55" stroke-width="3" stroke-linecap="round"><circle cx="13" cy="33" r="3.5"/><circle cx="35" cy="33" r="3.5"/><path d="M13 33h12l6-16h4M31 17l4 16"/></g></svg>'; // placeholder icon
const scooter = new maplibregl.Marker({ element: scEl }).setLngLat(START).addTo(map);

// ---------- routing ----------
async function getRoute(a, b) {
  try {
    const r = await fetch(`${CONFIG.ROUTER}/${a[0]},${a[1]};${b[0]},${b[1]}?overview=full&geometries=geojson`);
    const rt = (await r.json()).routes[0]; return { coords: rt.geometry.coordinates, dist: rt.distance, dur: rt.duration };
  } catch (e) { return straight(a, b); }
}
const straight = (a, b) => { const d = dist(a, b); return { coords: [a, b], dist: d, dur: d / 4.5 }; };
const cumul = c => { const m = [0]; for (let i = 1; i < c.length; i++)m.push(m[i - 1] + dist(c[i - 1], c[i])); return m; };
function pointAt(t, s) {
  const c = t.r.coords, m = t.cum; let i = 1; while (i < m.length - 1 && m[i] < s) i++;
  const f = (s - m[i - 1]) / ((m[i] - m[i - 1]) || 1); return [c[i - 1][0] + (c[i][0] - c[i - 1][0]) * f, c[i - 1][1] + (c[i][1] - c[i - 1][1]) * f];
}
function drawRoute(r) { if (map.getSource('route')) map.getSource('route').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: r.coords } }); }
function clearRoute() { if (map.getSource('route')) map.getSource('route').setData(EMPTY); }
const fit = (r, bottom) => { const b = r.coords.reduce((bb, c) => bb.extend(c), new maplibregl.LngLatBounds(r.coords[0], r.coords[0])); map.fitBounds(b, { padding: { top: 110, bottom, left: 40, right: 60 }, maxZoom: 16.5, duration: 700 }); };

// ---------- user trips ----------
const got = new Set(COLLECT.PERSIST ? JSON.parse(localStorage.getItem('collected') || '[]') : []);
async function startTrip(item, pre) {
  if (trip || item.id === here?.id) return;
  hideInfo(); showPage(null); setBusy(true); hintOff();
  const r = pre || await getRoute(pos, item.ll), cum = cumul(r.coords), left = COLLECTIBLES.filter(c => !got.has(c.id));
  const drop = left.length && Math.random() < COLLECT.CHANCE ? { c: left[Math.floor(Math.random() * left.length)], at: rnd(.15, .85) } : null; // random event, not tied to a map position
  trip = { item, r, cum, total: cum.at(-1) || 1, s: 0, paused: false, last: performance.now(), followAt: performance.now() + 800, drop };
  drawRoute(r); fit(r, 260); setFollow(true);
  $('#trip').hidden = false; $('#tripTitle').textContent = 'Heading to ' + item.name; setPause();
  requestAnimationFrame(tick);
}
function tick(now) {
  if (!trip) return;
  const dt = Math.min((now - trip.last) / 1000, .2); trip.last = now;
  if (!trip.paused && !modalOpen) trip.s = Math.min(trip.total, trip.s + CONFIG.SPEED * dt);
  pos = pointAt(trip, trip.s); scooter.setLngLat(pos);
  if (follow && !map.isMoving() && now > trip.followAt) map.jumpTo({ center: pos }); // never fight a gesture in progress
  const f = trip.s / trip.total;
  if (trip.drop && f >= trip.drop.at) { const c = trip.drop.c; trip.drop = null; offer(c); }
  $('#bar2').value = f; $('#tripSub').textContent = `${km(trip.total * (1 - f))} left \u00b7 about ${mins(trip.r.dur * (1 - f))} min`;
  if (trip.s >= trip.total) return arrive();
  requestAnimationFrame(tick);
}
function arrive() {
  const { item, r, drop } = trip; here = item; recent = [item.id, ...recent].slice(0, 2); trip = null;
  $('#trip').hidden = true; setBusy(false); showInfo(item, r, 'arrived'); // the pink path stays until the card is closed
  if (drop) offer(drop.c); refreshPage();
}
function cancelTrip() { if (!trip) return; trip = null; here = null; clearRoute(); $('#trip').hidden = true; setBusy(false); refreshPage(); }
function setPause() { $('#pauseBtn').innerHTML = trip && trip.paused ? '<md-icon slot="icon">play_arrow</md-icon>Resume' : '<md-icon slot="icon">pause</md-icon>Pause'; }
$('#pauseBtn').onclick = () => { if (!trip) return; trip.paused = !trip.paused; trip.last = performance.now(); setPause(); };
$('#skipBtn').onclick = () => { if (trip) trip.s = trip.total; };
$('#cancelBtn').onclick = cancelTrip;
function setBusy(b) { $('#actions').hidden = b; scEl.classList.toggle('glow', b); } // random buttons are hidden during a trip; the scooter pin glows
function hintOff() { $('#hint')?.remove(); $('#actions').classList.remove('glow'); }

// ---------- random ----------
function pick(types) {
  let pool = ITEMS.filter(i => types.includes(i.type) && i.id !== here?.id && !recent.includes(i.id));
  if (!pool.length) pool = ITEMS.filter(i => types.includes(i.type) && i.id !== here?.id);
  return pool[Math.floor(Math.random() * pool.length)];
}
$('#rndLoc').onclick = () => startTrip(pick(['location', 'nest'])); // locations and nests, never activities
$('#rndAct').onclick = () => startTrip(pick(['activity']));

// ---------- collectibles ----------
function offer(c) {
  if (got.has(c.id)) return; got.add(c.id); if (COLLECT.PERSIST) localStorage.setItem('collected', JSON.stringify([...got]));
  modalOpen = true; $('#gemArt').innerHTML = art(c.id); $('#gemName').textContent = c.title; $('#gemText').textContent = c.text; $('#gem').hidden = false; $('#gemClose').focus();
}
$('#gemClose').onclick = () => { $('#gem').hidden = true; modalOpen = false; }; // the trip holds while the window is open

// ---------- arrival card (M3 standard bottom sheet look) ----------
function showInfo(i, r, mode) {
  const el = $('#info'); el.hidden = false; el.classList.remove('min');
  const btn = mode === 'preview' ? '<md-filled-button id="go"><md-icon slot="icon">electric_scooter</md-icon>Go to</md-filled-button><md-outlined-button id="done"><md-icon slot="icon">close</md-icon>Close</md-outlined-button>' : '<md-filled-button id="done"><md-icon slot="icon">' + (mode === 'here' ? 'close' : 'check') + '</md-icon>' + (mode === 'here' ? 'Close' : 'Done') + '</md-filled-button>';
  el.innerHTML = `<button class="grab" id="grab" aria-label="Collapse card" aria-expanded="true"><i></i></button>
  <div class="hintRow"><md-icon id="hintIcon">keyboard_arrow_down</md-icon><span id="hintTxt">Swipe down to see the map</span></div>
  <div class="head"><h2>${i.name}</h2><span class="tag">${KIND[i.type]}</span></div>
  <div class="more"><div class="photo">${art(i.id)}</div><p class="hook">${i.hook}</p>${r ? `<div class="facts"><span>${km(r.dist)}</span><span>${mins(r.dur)} min ride</span></div>` : ''}<div class="scrollText"><p>${i.desc}</p></div><div class="btns">${btn}</div></div>`;
  $('#done').onclick = hideInfo; if ($('#go')) $('#go').onclick = () => startTrip(i, r);
  const g = $('#grab'); let y0 = null, mv = false;
  const set = min => {
    el.classList.toggle('min', min); g.setAttribute('aria-expanded', String(!min)); g.setAttribute('aria-label', min ? 'Expand card' : 'Collapse card');
    $('#hintTxt').textContent = min ? 'Swipe up for details' : 'Swipe down to see the map'; $('#hintIcon').textContent = min ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
  };
  const isMin = () => el.classList.contains('min');
  el.onpointerdown = e => { mv = false; y0 = e.target.closest('md-filled-button,md-outlined-button,.scrollText') ? null : e.clientY; };
  el.onpointermove = e => { if (y0 === null) return; const d = e.clientY - y0; if (Math.abs(d) > 28) { mv = true; set(d > 0); y0 = null; } }; // the whole card can be swiped up or down
  el.onpointerup = el.onpointercancel = () => { y0 = null; };
  g.onclick = () => { if (mv) { mv = false; return; } set(!isMin()); }; // tap or keyboard alternative to swiping
  el.querySelector('.head').onclick = () => { if (isMin()) set(false); };
}
function hideInfo() { $('#info').hidden = true; clearRoute(); } // closing the card removes the pink path
async function previewPin(i) {
  if (trip) return; hideInfo();
  if (i.id === here?.id) return showInfo(i, null, 'here');
  const r = await getRoute(pos, i.ll); if (trip) return;
  drawRoute(r); setFollow(false); fit(r, 470); showInfo(i, r, 'preview');
}
function openItem(i) { showPage(null); previewPin(i); }
$('#recentre').onclick = () => { setFollow(true); map.flyTo({ center: pos, zoom: Math.max(map.getZoom(), 15.6) }); };

// ---------- list rows (shared by pages and search) ----------
const row = i => `<md-list-item type="button" data-open="${i.id}" ${trip ? 'disabled' : ''}><div slot="start" class="thumb">${art(i.id)}</div><div slot="headline">${i.name}</div><div slot="supporting-text">${i.hook}</div>
<md-icon-button slot="end" data-ride="${i.id}" aria-label="Go to ${i.name}" ${trip || i.id === here?.id ? 'disabled' : ''}><md-icon>electric_scooter</md-icon></md-icon-button></md-list-item>`;
function rowClick(e) {
  const r = e.target.closest('[data-ride]'); if (r) { clearSearch(); return startTrip(byId(r.dataset.ride)); }
  const o = e.target.closest('[data-open]'); if (o) { clearSearch(); openItem(byId(o.dataset.open)); }
}
// ---------- search (M3 contained search bar with a docked results list) ----------
const q = $('#q'), res = $('#results');
q.oninput = () => {
  const v = q.value.trim().toLowerCase(); $('#clearQ').hidden = !v;
  const hits = v ? ITEMS.filter(i => i.name.toLowerCase().includes(v)).sort(byName).slice(0, 6) : []; res.innerHTML = hits.map(row).join(''); res.hidden = !hits.length;
};
function clearSearch() { q.value = ''; q.oninput(); q.blur(); }
$('#clearQ').onclick = () => { clearSearch(); q.focus(); }; res.onclick = rowClick;

// ---------- navigation rail (expanded, modal) ----------
function openRail(o) { $('#rail').classList.toggle('open', o); $('#rail').setAttribute('aria-hidden', String(!o)); $('#scrim').hidden = !o; if (o) $('#rail .rail-item')?.focus(); }
$('#menuBtn').onclick = () => openRail(true); $('#railClose').onclick = () => openRail(false); $('#scrim').onclick = () => openRail(false);
addEventListener('keydown', e => { if (e.key === 'Escape') openRail(false); });
$('#rail').onclick = e => { const b = e.target.closest('[data-nav]'); if (b) { openRail(false); showPage(b.dataset.nav === 'map' ? null : b.dataset.nav); } };
function setActive(k) { document.querySelectorAll('#rail [data-nav]').forEach(b => { const on = b.dataset.nav === k; b.classList.toggle('on', on); on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'); }); }
setActive('map');

// ---------- pages ----------
const FILTERS = { activity: ['Nearest', 'Outdoors', 'Free'], location: ['Nearest', 'Nests', 'Views'] };
const TAG = { Outdoors: 'outdoors', Nests: 'nest', Views: 'views', Free: 'free' };
const active = { activity: new Set(), location: new Set() }, TITLE = { activity: 'Activities', location: 'Locations' };
function showPage(kind) { const p = $('#page'); p.hidden = !kind; if (kind) renderPage(kind); setActive(kind || 'map'); }
function refreshPage() { const p = $('#page'); if (!p.hidden) renderPage(p.dataset.kind); }
function renderPage(kind) {
  const types = kind === 'activity' ? ['activity'] : ['location', 'nest']; let list = ITEMS.filter(i => types.includes(i.type));
  const pop = list.filter(i => POP[i.id]).sort((a, b) => POP[b.id] - POP[a.id]).slice(0, 6);
  active[kind].forEach(f => { if (TAG[f]) list = list.filter(i => i.tags.includes(TAG[f])); });
  list.sort(active[kind].has('Nearest') ? (a, b) => dist(pos, a.ll) - dist(pos, b.ll) : byName); // alphabetical unless "Nearest" is selected
  $('#page').dataset.kind = kind;
  $('#page').innerHTML = `<header><md-icon-button data-back aria-label="Back to map"><md-icon>arrow_back</md-icon></md-icon-button><md-icon-button data-menu aria-label="Open navigation"><md-icon>menu</md-icon></md-icon-button><h1>${TITLE[kind]}</h1></header>
  ${trip ? '<div class="wide"><md-filled-tonal-button data-cancel><md-icon slot="icon">cancel</md-icon>Cancel current trip</md-filled-tonal-button></div>' : ''}
  <h2 class="sub">Most popular</h2><div class="hero" id="hero"><div class="heroInner">${pop.map((_, i) => `<i class="snap" style="left:${i * 180}px;width:180px"></i>`).join('')}<div class="track">${pop.map(i => `<div class="hc" role="button" tabindex="0" data-open="${i.id}" aria-label="${i.name}"><div class="hArt">${art(i.id)}</div><div class="hTxt"><b>${i.name}</b><small>${i.hook}</small></div></div>`).join('')}</div></div></div>
  <md-chip-set aria-label="Filters">${FILTERS[kind].map(f => `<md-filter-chip label="${f}" data-chip="${f}" ${active[kind].has(f) ? 'selected' : ''}></md-filter-chip>`).join('')}</md-chip-set>
  <md-list>${list.map(row).join('') || '<p class="sub2">Nothing matches.</p>'}</md-list>`;
  initHero(pop.length);
}
$('#page').onclick = e => {
  const k = $('#page').dataset.kind;
  if (e.target.closest('[data-cancel]')) return cancelTrip();
  if (e.target.closest('[data-menu]')) return openRail(true);
  if (e.target.closest('[data-back]')) return showPage(null);
  const c = e.target.closest('[data-chip]'); if (c) return setTimeout(() => { const s = active[k], f = c.dataset.chip; c.selected ? s.add(f) : s.delete(f); renderPage(k); }, 0);
  rowClick(e);
};
$('#page').onkeydown = e => { if (e.key === 'Enter' && e.target.matches('.hc')) e.target.click(); };
// M3 hero carousel: one large item that shrinks as the next grows; small items peek in. Items snap on scroll.
function initHero(n) {
  const box = $('#hero'); if (!box || !n) return; const S = 56, G = 8, STEP = 180, track = box.querySelector('.track'), inner = box.querySelector('.heroInner'), cards = [...track.children];
  const layout = () => {
    const C = box.clientWidth, L = C - S - G; track.style.width = C + 'px'; inner.style.width = (C + (n - 1) * STEP) + 'px';
    const p = Math.min(n - 1, box.scrollLeft / STEP), k = Math.floor(p), t = p - k; let x = 0;
    cards.forEach((c, i) => {
      const w = i < k ? 0 : i === k ? L * (1 - t) : i === k + 1 ? S + (L - S) * t : S;
      c.style.width = w + 'px'; c.style.transform = `translateX(${x}px)`; c.style.setProperty('--o', Math.max(0, Math.min(1, (w - 130) / 50))); if (w > 0) x += w + G;
    });
  };
  box.addEventListener('scroll', layout, { passive: true }); new ResizeObserver(layout).observe(box); layout();
  let mv = false;
  box.onpointerdown = e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return; const x0 = e.clientX, l0 = box.scrollLeft; mv = false; box.style.scrollSnapType = 'none'; // mouse drag-scroll for desktop
    const mm = ev => { const d = ev.clientX - x0; if (Math.abs(d) > 5) mv = true; box.scrollLeft = l0 - d; };
    const up = () => { removeEventListener('pointermove', mm); removeEventListener('pointerup', up); box.style.scrollSnapType = ''; box.scrollTo({ left: Math.round(box.scrollLeft / STEP) * STEP, behavior: 'smooth' }); };
    addEventListener('pointermove', mm); addEventListener('pointerup', up);
  };
  box.addEventListener('click', e => { if (mv) { e.stopPropagation(); e.preventDefault(); mv = false; } }, true);
}

// ---------- AI riders ----------
const riders = [], rq = []; let rbusy = false;
async function pump() { if (rbusy) return; rbusy = true; while (rq.length) { const j = rq.shift(); j.cb(RIDERS.USE_ROUTING ? await getRoute(j.a, j.b) : straight(j.a, j.b)); await wait(RIDERS.ROUTE_GAP); } rbusy = false; }
function spawnRiders() {
  for (let k = 0; k < RIDERS.COUNT; k++) {
    const el = document.createElement('div'); el.className = 'rider v' + (1 + Math.floor(Math.random() * 5)); el.innerHTML = '<md-icon>electric_scooter</md-icon>'; // 5 placeholder pin styles
    const at = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    riders.push({ at, ll: [...at.ll], el, mk: new maplibregl.Marker({ element: el }).setLngLat(at.ll).addTo(map), state: 'stay', until: performance.now() + rnd(0, RIDERS.STAY_MAX) });
  }
  setRiders(RIDERS.SHOW); requestAnimationFrame(ridersTick);
}
function setRiders(on) { $('#ridersBtn').selected = on; $('#ridersBtn').setAttribute('aria-label', on ? 'Hide other riders' : 'Show other riders'); riders.forEach(p => p.el.style.display = on ? '' : 'none'); }
$('#ridersBtn').addEventListener('change', () => setRiders($('#ridersBtn').selected));
let rlast = 0;
function ridersTick(now) {
  const dt = Math.min((now - (rlast || now)) / 1000, .2); rlast = now;
  for (const p of riders) {
    if (p.state === 'stay' && now > p.until) {
      p.state = 'wait'; let d; do d = ITEMS[Math.floor(Math.random() * ITEMS.length)]; while (d === p.at);
      rq.push({ a: p.ll, b: d.ll, cb: rt => { p.r = rt; p.cum = cumul(rt.coords); p.total = p.cum.at(-1) || 1; p.s = 0; p.dest = d; p.state = 'ride'; } }); pump();
    }
    else if (p.state === 'ride') {
      p.s = Math.min(p.total, p.s + RIDERS.SPEED * dt); p.ll = pointAt(p, p.s); p.mk.setLngLat(p.ll);
      if (p.s >= p.total) { p.state = 'stay'; p.at = p.dest; p.until = now + rnd(RIDERS.STAY_MIN, RIDERS.STAY_MAX); }
    } // stay 3-20 s (configurable)
  }
  requestAnimationFrame(ridersTick);
}
spawnRiders();

// ---------- music (Web Audio, because iPhones ignore audio.volume) ----------
let ctx, gain, audio, musicOn = localStorage.getItem('music') !== 'off', musicActive = false, stopTimer = null, pauseTimer = null;
function initAudio() {
  if (ctx || !INTRO.MUSIC_FILE) return;
  audio = new Audio(asset(INTRO.MUSIC_FILE)); audio.loop = INTRO.MUSIC_LOOP;
  ctx = new (window.AudioContext || window.webkitAudioContext)(); gain = ctx.createGain(); gain.gain.value = 0;
  ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
}
function ramp(v, ms) { if (!ctx) return; const t = ctx.currentTime; gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(v, t + ms / 1000); }
function playMusic(ms) { if (!ctx || !musicOn) return; clearTimeout(pauseTimer); ctx.resume(); audio.play().catch(() => { }); ramp(INTRO.MUSIC_VOLUME, ms); }
function fadeMusicOut() { ramp(0, INTRO.MUSIC_FADE_OUT); pauseTimer = setTimeout(() => { audio && audio.pause(); musicActive = false; }, INTRO.MUSIC_FADE_OUT + 100); }
function scheduleStop() { clearTimeout(stopTimer); if (INTRO.MUSIC_FADE_OUT_ENABLED) stopTimer = setTimeout(fadeMusicOut, INTRO.MUSIC_STOP_AFTER_MAP); }
function syncSound() { const b = $('#sound'), t = musicOn ? 'Turn music off' : 'Turn music on'; b.selected = musicOn; b.setAttribute('aria-label', t); b.title = t; }
$('#sound').addEventListener('change', () => {
  musicOn = $('#sound').selected; localStorage.setItem('music', musicOn ? 'on' : 'off'); syncSound(); initAudio(); if (!ctx) return;
  if (!musicOn) { ramp(0, 250); clearTimeout(pauseTimer); pauseTimer = setTimeout(() => { if (!musicOn) audio.pause(); }, 300); }
  else if (musicActive) playMusic(500);
  else { musicActive = true; playMusic(INTRO.MUSIC_FADE_IN); scheduleStop(); }
});
document.addEventListener('visibilitychange', () => { if (ctx) document.hidden ? ctx.suspend() : ctx.resume(); });
syncSound();

// ---------- intro ----------
let skipped = false; const pend = new Set();
const sleep = ms => new Promise(r => { const t = setTimeout(() => { pend.delete(f); r(); }, ms), f = () => { clearTimeout(t); r(); }; pend.add(f); });
const T = async p => { await p; if (skipped) throw 0; };
async function fade(el, to, ms) { el.style.transition = `opacity ${ms}ms ease`; void el.offsetWidth; el.style.opacity = to; await sleep(ms); }
async function glow() {
  const l = $('#logo'); l.style.transition = `filter ${INTRO.GLOW_UP}ms ease-out`; l.style.filter = `drop-shadow(0 0 24px ${INTRO.GLOW_COLOR}) brightness(1.8)`; await sleep(INTRO.GLOW_UP);
  l.style.transition = `filter ${INTRO.GLOW_DOWN}ms ease-in`; l.style.filter = 'none'; await sleep(INTRO.GLOW_DOWN);
}
function runSpark(ms) {
  return new Promise(res => {
    const path = $('#sp'), L = path.getTotalLength(), g = $('#sg'), S = INTRO.SPARK_SIZE, N = 16, cs = [];
    g.innerHTML = ''; g.style.opacity = 1;
    for (let k = 0; k < N; k++) { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('r', S * (1 - k / N * .7)); c.setAttribute('fill', k ? INTRO.SPARK_COLOR : '#fff'); c.setAttribute('opacity', (1 - k / N) * .9); g.appendChild(c); cs.push(c); }
    const t0 = performance.now();
    (function f(now) {
      if (skipped) return res(); const t = Math.min(1, (now - t0) / ms);
      cs.forEach((c, k) => { const p = path.getPointAtLength(Math.max(0, t * L - k * S * 1.4)); c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); });
      t < 1 ? requestAnimationFrame(f) : res();
    })(t0);
  });
}
async function startIntro() {
  const intro = $('#intro');
  if (!INTRO.ENABLED) { intro.remove(); return; }
  const svg = $('#sparkSvg'); svg.setAttribute('viewBox', `0 0 ${PATH.W} ${PATH.H}`); svg.style.setProperty('--spark', INTRO.SPARK_COLOR);
  svg.innerHTML = `<path id="sp" d="M${PATH.pts.map(p => p.join(' ')).join('L')}" fill="none" stroke="none"/><g id="sg" style="opacity:0"></g>`;
  $('#logoImg').src = asset(INTRO.STRAVA_IMAGE);
  if (INTRO.REQUIRE_TAP) { await new Promise(r => $('#gate').addEventListener('click', r, { once: true })); initAudio(); }
  else { initAudio(); addEventListener('pointerdown', () => { if (ctx) { ctx.resume(); if (musicActive && musicOn) audio.play().catch(() => { }); } }, { once: true }); }
  $('#gate').remove(); $('#skipIntro').hidden = false; $('#skipIntro').onclick = () => { skipped = true; pend.forEach(f => f()); };
  musicActive = true; playMusic(INTRO.MUSIC_FADE_IN);
  try {
    await T(sleep(INTRO.STRAVA_DELAY)); await T(fade($('#logo'), 1, INTRO.STRAVA_FADE_IN));
    await T(sleep(INTRO.SPARK_START_DELAY)); await T(runSpark(INTRO.SPARK_DURATION));
    await T(sleep(INTRO.SPARK_FADE_DELAY)); await T(fade($('#sg'), 0, INTRO.SPARK_FADE_OUT));
    await T(glow());                                   // the whole path lights up and dims
    await T(sleep(INTRO.STRAVA_FADE_OUT_DELAY)); await T(fade($('#logo'), 0, INTRO.STRAVA_FADE_OUT));
    await T(sleep(INTRO.TITLE_DELAY)); await T(fade($('#introTitle'), 1, INTRO.TITLE_FADE_IN));
    await T(sleep(INTRO.TITLE_HOLD)); await T(fade(intro, 0, INTRO.TITLE_FADE_OUT));
  } catch (e) { }
  intro.remove(); scheduleStop(); // the map is now visible
}
startIntro();
