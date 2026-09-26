# Orbit Atlas

An interactive 3D solar-system field guide for curious explorers. Built using ***GitHub Copilot*** + ***OpenAI GPT-6 Astra*** (a large language model) with React, TypeScript, Vite, React Three Fiber, Three.js, Zustand, Motion, and Astronomy Engine.

## Run Locally

Use Node.js 22.12 or later. From this directory in PowerShell:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the URL printed by Vite, normally <http://localhost:5173>. Vite chooses the next available port when needed.

## Build and Test

```powershell
npm.cmd run build
npm.cmd run preview
npm.cmd run lint
npm.cmd test
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

The production site is generated in `dist/`. Browser tests use an isolated headless Chromium, not your everyday browser profile. They start a development server if one is not already running on port 5173. Screenshots are written to `test-results/`.

## Explore

- The Sun, all eight planets, Earth's Moon, orbital paths, a 1,100-instance asteroid belt, and 3,600 subtly twinkling stars.
- Procedural rocky and banded surfaces, Jupiter's Great Red Spot, Saturn's rings, a shader-driven Sun, atmospheric rims, and locally hosted Earth imagery with clouds.
- Click a planet or its accessible HTML label to learn about it. Double-clicking a 3D planet also focuses it. The planet index is an equivalent keyboard-accessible route.
- Smooth fly-ins, a fixed planet view, follow mode, and a full-system view. Orbit by dragging; zoom with the wheel or pinch; pan with right-drag or a two-finger gesture.
- Four scale modes: educational, relative body diameters, distance-emphasized, and custom planet sizes and orbital spacing.
- Pause, resume, step by one day, reset the date, and choose 1, 8, 30, or 365 simulated days per real second. The clock starts at 26 September 2026, 12:00 UTC.
- A guided 12-stop tour with narration, pause/resume, skip, and exit.
- Eight hands-on lessons: fusion, size comparison, light-travel distances, gravity, day/night, seasons, lunar phases, and orbits.
- Four hypothetical experiments: a second Moon, Jupiter-sized Earth, an absent Sun, and a nonrotating Earth.
- Spacecraft missions with manual flight, destination autopilot, orbital-path following, arrival status, and live telemetry.
- Random discoveries, a surprise destination, a greeting from Earth, and a solar pulse after every third Sun click.
- Optional synthesized ambient audio, initially off. Reduce Motion respects the operating-system preference and can be toggled in Settings.

## Keyboard and Accessibility

- Tab and Shift+Tab navigate native HTML controls. Enter and Space activate buttons.
- Space pauses/resumes the simulation when focus is not on a control.
- H returns to the whole system. L toggles labels. Escape closes the active panel or tour.
- In an active mission, use W/A/S/D or arrow keys to fly. On-screen directional buttons work with pointer, touch, or keyboard.
- Reduced motion stops automatic simulation time, star twinkling, axial rotation, spacecraft travel, and automatic tour advancement. Camera transitions become brief. Explicit day steps and tour skips remain available.
- Planet labels avoid each other and interface panels. Mobile information sheets leave the focused planet visible above them.
- If WebGL2 is unavailable or its context is lost, an interactive 2D planet index preserves access to the facts and learning interface. Add `?fallback` to the URL to inspect that mode directly.

## Architecture

```text
src/
  components/3d/    Planet surfaces, stars, belt, camera, labels, and spacecraft
  components/ui/    Navigation, facts, time, settings, lessons, and missions
  data/            Typed celestial facts, lesson content, and tour stops
  hooks/           Keyboard and audio lifecycle
  scenes/          Lazy-loaded React Three Fiber scene
  store/           Central simulation state and frame-level flight telemetry
  utils/           Ephemerides, educational scale, textures, and unit tests
tests/             Playwright interaction and responsive-rendering tests
public/textures/   Local Earth map and attribution
```

Animation transforms are updated in the rendering loop, not React component state. HTML time and flight readouts update only a few times per second. Asteroids are instanced, stars are a single point cloud, and pixel ratio drops on slow devices. Planet textures and other owned resources are disposed on unmount. The Three.js renderer is the largest production chunk; its size warning is expected for this application.

## Scientific Boundaries

This is an educational visualization, not a mission planner or a physical N-body simulation.

- Astronomy Engine supplies heliocentric ecliptic longitudes and lunar positions for the displayed date. The scene maps them onto simplified circular paths, compresses inclinations, and deliberately enlarges bodies. Earth's Moon uses a separately enlarged orbit.
- Relative Size preserves body diameter ratios, including the Sun, while separating orbital tracks for visibility. Distances Emphasized uses AU-proportional spacing plus clearance around the Sun. Custom size changes planets, not the star.
- Surface rotation is slowed for legibility. Texture patterns, the Great Red Spot, rings, atmospheres, and solar activity are illustrative rather than weather forecasts. Earth's map is photographic; other planet surfaces are generated.
- The dates are limited to roughly 68 years either side of the starting date. Scientific values are rounded. Gas-giant temperatures describe cloud tops, solar temperature describes the surface, and moon counts are conservative lower bounds that can change with discoveries.
- Gravity lessons use Newton's inverse-square relationship and circular-orbit scaling, not a general orbital integrator. Moon phases are rendered from the illuminated portion of a sphere.
- Hypothetical experiments intentionally do not recalculate planetary dynamics. In particular, hiding the Sun is not an instantaneous physical disappearance: the panel explains light-speed propagation and the later tangential motion, while retaining the reference orbits.
- Spacecraft motion is an arcade model in scene units. It does not represent real fuel consumption, acceleration, or travel time. The optional comet and computationally expensive volumetric nebula/postprocessing effects are omitted in favor of a lighter scene.
- Google Fonts supplies the interface typefaces when online; the application remains usable with fallback fonts if that request is unavailable. The planet map itself is bundled locally.

## Sources

- [NASA Solar System Exploration](https://science.nasa.gov/solar-system/)
- [NASA Planetary Fact Sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)
- [Astronomy Engine](https://github.com/cosinekitty/astronomy)
- [Earth imagery attribution](public/textures/CREDITS.md)
