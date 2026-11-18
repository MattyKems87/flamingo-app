# Flamingo Extension demo (web app)

Vite + vanilla JavaScript + MapLibre GL JS + Material Web components (@material/web) + Material Symbols icons.

## Run (Node 20+)
    npm install
    npm run dev        # desktop: http://localhost:5173
Phone: same Wi-Fi, open the "Network" address Vite prints. Publish: `npm run build`, then upload `dist` (GitHub Pages needs `base` in vite.config.js).

## Files
- `src/data.js`  ALL configuration: places, collectibles (45), AI riders, intro and music timings.
- `src/main.js`  map, trips, routing, riders, collectibles, pages, carousel, search, rail, music, intro.
- `src/style.css`  Material 3 colour roles (`--md-sys-color-*`) and layout. Change the brand colour at the top.
- `index.html`  skeleton and Material Web elements. `tools/trace_path.py` re-traces the intro spark path.

## Material 3 notes
Material Web provides buttons, icon buttons (incl. toggle), filter chips, lists, FAB, progress, ripple and focus ring. It has no carousel, navigation rail, search bar, bottom sheet or dialog-card, so those are custom, built to the M3 specs with the same colour tokens. M3 Expressive components are not in Material Web; shapes and sizes approximate them.

## Config highlights (`src/data.js`)
- `RIDERS.COUNT` (25), `STAY_MIN/MAX`, `SPEED`, `USE_ROUTING` (false = straight lines, no routing-server load).
- `COLLECT.CHANCE` per trip, `COLLECT.PERSIST` (reset: `localStorage.removeItem('collected')` in the console).
- `INTRO.*` timings, `GLOW_*` (path light-up), `MUSIC_FADE_OUT_ENABLED`, `MUSIC_STOP_AFTER_MAP`.
- Music: MP3 or M4A (AAC) 128-192 kbps in `public/audio/`. Intro image: `public/intro/strava_path.png`; re-trace the spark with `python tools/trace_path.py START_X START_Y END_X END_Y`.
- Routes come from a free OSM bike-routing demo server, for testing only.
