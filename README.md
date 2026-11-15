# Flamingo Extension demo (web app)

Vite + vanilla JavaScript + MapLibre GL JS. No account or API key needed.

## Run (needs Node 20+)
    npm install
    npm run dev        # desktop: http://localhost:5173
Phone: join the same Wi-Fi as your computer and open the "Network" address Vite prints (for example http://192.168.1.20:5173).
Share with anyone: `npm run build`, then upload the `dist` folder to Netlify, Vercel or GitHub Pages (HTTPS, works on phones).

## Files
- `src/data.js`  config plus every place (nests, locations, activities). Edit names, coordinates, text and tags here.
- `src/main.js`  map, scooter, routing and animation, random logic, info sheet, search, menu and pages.
- `src/style.css`  all styling (colours are CSS variables at the top).
- `index.html`  page skeleton.

## Notes
- Routes come from the free OpenStreetMap bike-routing demo server (it prefers cycle lanes). It is for testing only; for production use your own or a paid routing service (Mapbox, Google, GraphHopper, Valhalla). If it is unreachable the scooter takes a straight line.
- Map tiles use OpenFreeMap (free, no key). Change `CONFIG.STYLE` to use another style.
- Place coordinates other than Media Design School are approximate: check them on the map.
- Demo speed is `CONFIG.SPEED` metres per second.

## Changes in v0.2
Cancel button; tap a pin to preview its route and info; path stays until the card is closed; 16 fictional activities added in `src/data.js` (replace with real ones); 'Most popular' carousels ordered by the `POP` scores in `data.js`; burger menu on list pages; rotating or zooming keeps following the scooter (only panning stops it).
- Hidden gems: edit `GEMS` in `src/data.js`. `at:` gems are found on arrival at that place; `ll:` gems are found if a trip passes within `GEM_RADIUS` metres. Collected gems reset on page reload.
- Panning stops following immediately; rotating or zooming keeps following the scooter. Recentre resumes following.

## Intro, music and sound button (v0.3)
- All intro timings are in `INTRO` in `src/data.js` (image delay and fades, spark duration, title timings, music fade in/out and how long after the map appears the music fades out).
- Browsers block sound until the user taps, so the intro starts on a black "Tap to start" screen. Set `REQUIRE_TAP:false` to try autoplay (sound then starts on the first tap if blocked). `ENABLED:false` skips the intro entirely.
- Replace the music: drop your file in `public/audio/` and set `MUSIC_FILE`. Best format: MP3 or M4A (AAC), 128-192 kbps, 44.1 kHz stereo, under about 2 MB; plays everywhere including iPhones. Avoid WAV (huge) and Ogg (not on all iPhones). `MUSIC_LOOP:true` repeats a short track.
- Replace the intro image: put it in `public/intro/strava_path.png` (transparent PNG), then re-trace the spark path: `python tools/trace_path.py START_X START_Y END_X END_Y`.
- The sound button sits in the search bar. The on/off choice is remembered on the device.
