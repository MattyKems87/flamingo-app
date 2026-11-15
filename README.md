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
