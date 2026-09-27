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
- Halley's Comet with a JPL Horizons trajectory, an elongated irregular nucleus, a near-Sun coma, and separate dust/ion tails. Select it in the object index for a full-orbit view or dated 1986/2061 perihelion visits.
- Procedural rocky and banded surfaces, Jupiter's Great Red Spot, Saturn's rings, a shader-driven Sun, atmospheric rims, and locally hosted Earth imagery with clouds.
- Click a planet or its accessible HTML label to learn about it. Double-clicking a 3D planet also focuses it. The planet index is an equivalent keyboard-accessible route.
- Smooth fly-ins, a fixed planet view, follow mode, and a full-system view. Orbit by dragging; zoom with the wheel or pinch; hold Ctrl and left-drag to pan horizontally or vertically in the screen plane. Right-drag and two-finger panning also work. Panning preserves your offset in follow mode; H or View Solar System recenters the overview.
- Four scale modes: educational, relative body diameters, distance-emphasized, and custom planet sizes and orbital spacing.
- Pause, resume, step by one day, reset the date, and choose 1, 8, 30, or 365 simulated days per real second. The clock starts at 26 September 2026, 12:00 UTC.
- While paused (including Reduce Motion), use the calendar button beside the clock to choose a date. Apply sets that day at 12:00 UTC and keeps playback paused; Cancel or Escape changes nothing. Dates outside the bundled JPL range require confirmation unless already authorized. Declining keeps the current date, and accepting applies the selected date without resuming playback. The calendar accepts years 0001-9999; distant dates use approximate calculations, not reliable predictions.
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

- Astronomy Engine supplies full heliocentric planetary vectors and a geocentric lunar vector for the displayed date. A fixed J2000 ecliptic frame preserves orbital eccentricity, inclination, orientation, distance variation, and nonuniform orbital speed, including the engine's modeled perturbations. The Sun is the heliocentric origin, not the solar-system barycenter.
- Each planetary guide samples 513 ephemeris positions over one sidereal period around the current date, refreshing every quarter period. These are sampled trajectories, not exact closed ellipses: perturbations can leave a small endpoint gap. Planet positions are evaluated directly every frame, not interpolated from the guides.
- Each orbit is uniformly rescaled using its rounded mean distance, preserving its shape but compressing interplanetary distances. Bodies are deliberately enlarged, and the Moon's geocentric orbit is separately enlarged using a mean distance of 384,400 km. Most real planetary orbits still look nearly circular; Mercury's eccentricity is about 0.206 and Earth's only about 0.017. The asteroid belt remains illustrative, not a catalog of measured asteroid orbits.
- Relative Size preserves body diameter ratios, including the Sun, while separating orbital tracks for visibility. Distances Emphasized uses AU-proportional mean spacing plus clearance around the Sun. Custom size changes planets, not the star; custom orbits have a minimum display size to keep perihelia outside the enlarged Sun. This uses a conservative perihelion/mean-distance ratio of 0.79, below Mercury's roughly 0.794 (the smallest among these planets), without altering orbit shapes.
- Surface rotation is slowed for legibility. Texture patterns, the Great Red Spot, rings, atmospheres, and solar activity are illustrative rather than weather forecasts. Earth's map is photographic; other planet surfaces are generated.
- Playback and manual steps pause at the actual bundled JPL data boundaries (approximately 1957-2097) and ask permission to switch to approximate orbital calculations. Yes resumes from the same date; No or Escape stays paused. Outside that range the clock displays "Approximate positions". Reset is always available and clears this permission, returning to the original date and JPL-based Halley positions. Dates are not wrapped back into the data range. Scientific values are rounded; the data boundary is unrelated to comet aphelion.
- Gravity lessons use Newton's inverse-square relationship and circular-orbit scaling, not a general orbital integrator. Moon phases are rendered from the illuminated portion of a sphere.
- Hypothetical experiments intentionally do not recalculate planetary dynamics. In particular, hiding the Sun is not an instantaneous physical disappearance: the panel explains light-speed propagation and the later tangential motion, while retaining the reference orbits.
- Spacecraft motion is an arcade model in scene units. It does not represent real fuel consumption, acceleration, or travel time. Computationally expensive volumetric nebula/postprocessing effects are omitted in favor of a lighter scene.
- Google Fonts supplies the interface typefaces when online; the application remains usable with fallback fonts if that request is unavailable. The planet map itself is bundled locally.

## Sources

### Halley's Comet

- Bundled [JPL Horizons state vectors](src/data/halley-ephemeris.json) for 1P/Halley (record 90000030, solution JPL#75 dated 2025-11-21) cover 1957-2097. Within this range these are geometric, Sun-centered J2000 ecliptic positions in AU and velocities in AU/day, including JPL's planetary perturbations and modeled non-gravitational outgassing. They are not propagated from a fixed two-body ellipse.
- Outside the data range, after consent, Halley follows the nearest endpoint's osculating two-body orbit using [Astronomia's Kepler solver](https://github.com/commenthol/astronomia). Both position and velocity match the endpoint state; the continued trajectory omits subsequent perturbations and outgassing and is not a reliable prediction of future returns. Planets and the Moon continue using Astronomy Engine's analytical models. The accuracy indicator describes this overall unvalidated extrapolation, not a promise that all bodies have the same accuracy. The closed Halley guide uses the same endpoint orbit outside the range. JavaScript date representation and the numerical models still have finite practical limits; this is not scientifically valid infinite-time propagation.
- Sampling is every two days inside 4 AU and every sixteen days outside, with cubic Hermite interpolation using the supplied velocities. Regression checks compare separate Horizons queries, including near perihelion (error below 0.000002 AU at the tested dates, not a global accuracy guarantee). Astronomy Engine converts UTC to TT; TT approximates Horizons TDB to within about two milliseconds. No live connection is needed at runtime.
- Reproduce the data from the repository root with `.\scripts\Update-Halley.ps1` in PowerShell. The generator uses the Horizons JSON API and PowerShell's CSV parser; the exact query and reference frame are stored with the data. Updated JPL solutions may require revising the recorded solution metadata and reference tests.
- The comet's orbit uses a single uniform scale factor, preserving its eccentricity, orientation and retrograde motion. It is enlarged separately from the compressed planetary tracks to keep perihelion outside the oversized Sun. Visual intersections and relative comet/planet separations are therefore **not to scale**. The full-orbit guide is a closed **osculating ellipse**, derived from the dated JPL position, a central-difference velocity from the interpolated trajectory, and Astronomy Engine's solar gravitational parameter. It is sampled with Three.js EllipseCurve and refreshed every 16 simulated days. This instantaneous two-body guide avoids joining mismatched endpoints from different revolutions; it approximates, rather than predicts, the perturbed trajectory. Halley's actual motion still uses the dated Horizons interpolation and never follows or wraps around guide vertices. It slows near aphelion but does not stop there. The default overview stays centered on the planets; use **View full orbit** to frame the entire comet trajectory.
- NASA/Giotto observations constrain the dark, elongated nucleus to about 15 by 8 km and roughly 3% reflectivity. The mesh preserves that approximate aspect ratio, with procedural irregularities and an assumed similar depth. It is **not** a recovered Giotto terrain mesh. Shading is brightened enough to inspect, and the rotation is illustrative, not a reconstructed spin solution.
- A soft coma and straight blue ion tail point away from the Sun; a broader dust tail curves away. Activity fades beyond 3.5 AU. Tail dimensions, dust curvature, brightness and activity threshold are illustrative, not predictions of actual outgassing or spacecraft imagery. At the initial 2026 date Halley is distant and inactive, so there is no bright tail.
- [NASA: 1P/Halley](https://science.nasa.gov/solar-system/comets/1p-halley/) includes the Giotto nucleus image, dimensions, reflectivity, retrograde orbit and return dates.
- [JPL Small-Body Database](https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=1P&full-prec=true) provides the orbit solution and osculating elements. [Horizons API documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html) defines the bundled vector output.

### General

- [NASA Solar System Exploration](https://science.nasa.gov/solar-system/)
- [NASA Planetary Fact Sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)
- [Astronomy Engine](https://github.com/cosinekitty/astronomy)
- [Astronomy Engine coordinate/vector API](https://github.com/cosinekitty/astronomy/tree/master/source/js): compact VSOP87-based planetary calculations, validated by its authors against NOVAS and JPL Horizons; the library targets about one arcminute angular accuracy, not spacecraft-navigation precision. No live ephemeris download is required.
- [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/): reference ephemerides used in Astronomy Engine validation, not a live data feed for this app.
- [Earth imagery attribution](public/textures/CREDITS.md)
