# 🪐 Solar System Explorer — Interactive 3D Space Adventure

A museum-quality, kid-friendly interactive 3D solar system built with **React + TypeScript + Vite + Three.js + React Three Fiber + Zustand + Framer Motion + Tailwind CSS**.

## Start it

```bash
npm install
npm run dev
```

Then open the printed `http://localhost:5173/` URL.

## Build it

```bash
npm run build
npm run preview
```

## Architecture

```
src/
  data/planets.ts            # Planet type, Sun, 8 planets, facts, tour stops, lessons
  store/simulationStore.ts   # Zustand: selection, camera, speed, scale, tour, what-if, sound, a11y
  utils/scale.ts             # Educational / relative / distances / custom scale math + orbit math
  utils/textures.ts          # Procedural canvas textures (rocky, bands, Earth, clouds, Sun, rings, glow)
  utils/audio.ts             # Procedural WebAudio ambient drone + UI blips (off by default)
  components/3d/SolarSystemScene.tsx  # All 3D: Sun, planets, moon(s), rings, orbits, stars, nebulae,
                                      # asteroid belt (instanced), comet, spacecraft, camera rig, clocks
  components/ui/TopBar.tsx   # Header, time controls, scale control, random-fact card
  components/ui/Panels.tsx   # Planet panel, Learn, What-If Lab, tour overlay, mission control, help, welcome
  App.tsx                    # Canvas, loader, error boundary + 2D fallback, keyboard shortcuts
```

- **No per-frame React renders**: one shared `timeRef.days` clock advances in `useFrame`; the Zustand `simDays` syncs ~5 Hz for the date label only.
- **Procedural everything**: planet surfaces, rings, clouds, star twinkle shader, nebulae, and ambient audio are all generated in code — zero image/audio assets.

## Major interactive features

- Animated solar system: glowing pulsing Sun + corona, 8 distinct planets (Earth clouds + atmosphere + Moon, Saturn rings + Cassini gap, Jupiter bands + Red Spot, Uranus tilt rings), orbiting + rotating, asteroid belt, hidden comet, twinkling star field, nebulae
- 4 scale modes (Educational / True sizes / Distances / Custom) with honest "not to scale" note
- Cinematic camera: orbit/zoom/pan, click to focus, double-click to follow, eased fly-to, View/Follow/System modes
- Planet panels with kid-friendly data + "Did you know?", hover tooltips, labels toggle
- Explore & Learn: 8 lessons (Sun, sizes compare widget, distances, gravity-mass demo, day/night, seasons tilt, moon-phase slider, orbit arrows)
- Time controls: pause/play, Slow/Normal/Fast/Warp (days/sec readout), live simulated date
- 12-stop cinematic tour with narration, pause/resume/skip/exit
- What-If Lab: two moons, Jupiter-sized Earth, Sun off, no spin (labeled as play, not predictions)
- Flyable spacecraft (WASD/arrows + Q/E, Shift boost) with Mission Control HUD (speed, Sun distance, nearest planet) + chase cam
- Random-fact system, 🎲 Surprise-Me, Sun ×5 flare easter egg, "Hello Earth" joke
- Ambient procedural audio (off by default), glassmorphism NASA-style UI, responsive + touch, keyboard shortcuts, reduced-motion mode, screen-reader labels, loading screen, WebGL error boundary with 2D SVG fallback

## Realism & data sources

- **Surface maps**: real NASA-based equirectangular planet maps (2K) from **Solar System Scope**, used under **CC BY 4.0** (based on NASA/Messenger/Viking/Cassini/Hubble imagery, Blue Marble for Earth). Files live in `public/textures/` so the app works offline.
- **True axial tilts** per planet (Earth 23.4°, Mars 25.2°, Saturn 26.7°, Uranus 97.8° sideways, …; Venus retrograde).
- **Earth**: day map + night-side city lights (emissive), separate real cloud layer, fresnel atmosphere, real Moon map with relief.
- **Saturn**: real ring alpha texture with radial UV remap, true 1.24–2.27 R extent, tilted with the planet.
- **Sun**: real solar surface map with slow rotation + corona; Milky Way star-map backdrop behind the procedural twinkling stars.
- Mercury/Mars/Moon use their maps as bump maps for real crater/canyon relief.
- **Pluto** (dwarf planet, real 248-year orbit, 122.5° tilt, procedural heart-glacier map) and **Halley's Comet** (true Kepler elliptical retrograde orbit — fast swoop past the Sun, slow fade-out beyond Neptune — with a sun-avoiding tail that grows near perihelion) are both selectable, followable, and listed in the bodies menu; Pluto has its own cinematic-tour stop.

Texture credit: *Planet maps by Solar System Scope (solarsystemscope.com/textures), CC BY 4.0, based on NASA data.*

## Compromises (performance & scale honesty)

- **Deliberate educational scale**: real distances would make planets sub-pixel; orbits are compressed (roughly logarithmic) and small planets exaggerated. True-size and distance-emphasis modes are offered, and the UI states the view is not to scale.
- **Procedural textures over photo maps**: keeps the bundle asset-free and fast; stylized but each planet is visually distinct.
- **Capped pixel ratio (1.75), 3.5k shader stars, 1.1k instanced asteroids, 40-seg spheres**: smooth on an average modern laptop. No post-processing bloom (uses additive sprites instead) to protect frame rate.
- **Chunk-size warning**: single ~1.35 MB JS bundle (mostly three.js) — acceptable for a 3D app; lazy-splitting three would complicate the R3F scene graph for little gain.
