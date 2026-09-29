# Solar System Explorer

An immersive, interactive **3D Solar System** for curious children and the grown-ups who get
dragged into it. Built with React, TypeScript, Three.js and react-three-fiber — every world is
textured with **real, NASA-derived map data** (Blue Marble for Earth, MESSENGER for Mercury,
Cassini for Saturn and its rings, and so on), shipped inside the app so nothing is fetched while
it runs.

> **Not to scale — on purpose.** The app uses a clearly explained *Educational Scale* so that
> children can see the planets, watch them orbit and still learn the real numbers. Every figure in
> the information panels is rounded, real astronomy from NASA and IAU reference values.

---

## Quick start

```bash
npm install        # install dependencies
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # type-check and build for production (output in dist/)
npm run preview    # serve the production build (http://localhost:4173)
npm run typecheck  # TypeScript only, no build
```

Node.js 20.19+ (or 22.12+) is required by Vite 8. The 3D scene needs **WebGL 2**; if it is
unavailable the app automatically switches to a polished 2D orrery with the same real data.

---

## What you can do

**Explore**

- Drag to orbit the camera, scroll or pinch to zoom, right-drag or two-finger drag to pan.
- Click any planet for a full information panel (diameter, distance, year, day, moons,
  temperature, gravity, facts and a "Did you know?").
- Double-click a planet to **follow** it as it travels around the Sun.
- Hover anything for a subtle highlight, a name label and a pointer cursor.

**Watch**

- Time controls: pause, play, slow, normal, fast, "a year a second" and hyperdrive, plus a date
  picker, ±1 day stepping and a "time travel" reverse button.
- The simulated date is always on screen, and the speed is shown both as *days per second* and as
  a multiple of real time.

**Learn**

- **Cinematic Tour**: a 14-stage guided fly-through from the Sun to Neptune and back, with
  narration, pause / resume / skip / exit.
- **Explore & Learn**: eight lessons (the Sun, planet sizes, distances, gravity, day and night,
  seasons, Moon phases, orbits), each with an interactive widget and a button that shows it
  happening in the 3D scene.
- **What If?**: playful experiments — two moons, a Jupiter-sized Earth, a vanishing Sun and a
  non-rotating Earth — each clearly labelled as an educational simulation, not a prediction.
- **Teach Me Something!**: a large animated card of curated, checkable space facts.

**Fly**

- **Mission Control**: pick a destination, let the autopilot cruise there, or switch the autopilot
  off and fly the spacecraft yourself (W/A/S/D, R to climb, F to dive, Shift to boost) with live
  telemetry.

**Hidden fun**

- Click the Sun three times.
- Find the comet that drifts through the scene.
- Click the asteroid belt, the Moon, Jupiter's moons…
- "Surprise Me" in the camera controls jumps you somewhere new.

---

## Keyboard

| Keys | Action |
| --- | --- |
| `Space` | Pause / play |
| `←` `→` | Step one day back / forward |
| `1` … `6` | Simulation speed |
| `Esc` | Close panels, leave a tour or mission |
| `L` `O` `B` `N` | Labels, orbits, asteroid belt, nebula |
| `R` | Return to the full Solar System view |
| `T` | Cinematic tour on / off |
| `E` | Explore & Learn |
| `I` | What If experiments |
| `F` | Random fact |
| `M` | Mute / unmute |
| `S` | Settings |
| `H` | Help (the full list is also in the app) |
| `W A S D` `R` `F` `Shift` | Fly the spacecraft |

Every control is also reachable with a mouse or a finger, has a visible focus ring, an accessible
name and a 44 px touch target on phones.

---

## Accessibility

- Full keyboard navigation, visible focus states and screen-reader labels on every control.
- A polite live region announces what is happening, and there is a screen-reader-only list of
  worlds you can jump to directly.
- **Reduce Motion** (in the header or in settings) shortens camera flights, calms the visual
  effects and speeds up the tour. The operating-system `prefers-reduced-motion` preference is
  honoured automatically, and animation is disabled entirely in that mode.
- High-contrast text on glass panels, and an unmissable note that the view is not to scale.

---

## The Educational Scale

A physically exact Solar System cannot be taught on a screen: to keep Earth visible the Sun would
have to be a hundred times wider, and to keep that Sun on screen Neptune would fall off the edge of
the world. So the picture is deliberately designed, and the UI says so out loud.

| Mode | What is true | What is compressed |
| --- | --- | --- |
| **Educational Scale** | The order of the planets, the shape and direction of their orbits | Planet sizes and orbit spacing |
| **Relative Size** | Planet sizes, exactly, relative to each other | Orbit spacing; the Sun is drawn smaller than reality |
| **Distances Emphasized** | Orbit spacing, exactly (linear in AU) | Planet sizes |
| **Custom** | Whatever you choose with the three sliders | Everything else |

The real numbers are always available in the planet panels, so the simplified picture never replaces
the science.

### What is real, what is simplified

- **Real:** diameters, masses, mean distances, orbital and rotation periods, axial tilts, surface
  gravities, temperatures, moon counts, light travel times, orbital eccentricities, and the periapsis
  longitudes and mean longitudes at epoch J2000.
- **Approximated:** positions come from mean orbital elements, with Kepler's equation solved exactly
  for the ellipse. That is accurate enough to show which planet is where on a given date (and it produces
  visibly elliptical orbits, the correct speed-up at perihelion, and a comet that always travels the same
  way round), but it is not a full VSOP87 ephemeris, so it will not match a planetarium to the
  arc-minute.
- **Simplified on purpose:** the scale (above), moon sizes and moon orbits, the lighting falloff
  (the Sun's light does not fade with distance, so distant planets stay readable) and the spacecraft,
  which is a friendly arcade model rather than a real trajectory.
- **Hypothetical:** everything in *What If?* is clearly labelled as an educational simulation.

---

## Architecture

```
src/
  data/       Real astronomy, kept out of the components
              planets.ts (bodies, moons, asteroid belt) · facts.ts · lessons.ts
              tour.ts · whatIf.ts · missions.ts · visuals.ts
  store/      simulationStore.ts — one Zustand store for all shared UI state
  utils/      astronomy.ts (Keplerian positions) · scale.ts (the four scale modes)
              textures.ts (map loader + procedural painters) · textureSources.ts
              (where each real map comes from) · simulationClock.ts
              spacecraftSim.ts · bodyRegistry.ts · audio.ts · format.ts
              input.ts · random.ts · webgl.ts
  hooks/      useSimulationTime · useMissionReadout · useAssetPreloader
              useKeyboardControls
  components/
    3d/       Sun · Planet · Moon · Rings · Atmosphere · NightLights · Orbit
              AsteroidBelt · Comet · Spacecraft · StarField · PlanetLabel
              CameraController · TourDirector · PostProcessing · Timekeeper
              SolarSystem
    ui/       Header · BottomBar · TimeControls · SimulationControls · PlanetPanel
              EducationPanel (+ lessons/LessonWidgets) · WhatIfPanel · MissionControl
              SettingsPanel · FactCard · Toast · LoadingScreen · Fallback2D
              Overlays · primitives · icons
  scenes/     SolarSystemScene.tsx — the Canvas, lighting and quality tiers
public/
  textures/   Real map data (equirectangular 2:1) + CREDITS.md
tools/
  fetch-textures.mjs — re-downloads the maps and rewrites CREDITS.md
```

A few decisions worth knowing about:

- **Data is separate from presentation.** Every number shown in the UI comes from `src/data`; a
  component never hard-codes a fact. Adding a new world means adding an entry (and, if it needs one,
  a visual recipe).
- **Two kinds of state.** Anything the interface *renders* lives in the Zustand store. Anything that
  changes every frame (the clock, the spacecraft) lives in a plain mutable module singleton that the
  render loop reads and the HUD samples about five times a second. Orbiting planets never re-render
  React. `Timekeeper` is the one component that writes to that clock: it advances it once per frame
  with the current speed and direction, and every planet, moon and comet derives its position from it —
  so simulated time only moves while that component is mounted inside the canvas.
- **Bodies are found through a registry.** Each 3D body registers its `Object3D` under its id, so the
  camera, tour director and mission autopilot can resolve a target's live world position without prop
  drilling or duplicated orbital maths.
- **Real maps, baked in.** `public/textures` holds real equirectangular map data — NASA / JPL /
  USGS imagery via Solar System Scope, CC BY 4.0, listed in `public/textures/CREDITS.md` — and
  `utils/textures.ts` decodes it into GPU textures before the scene mounts, reporting progress on
  the loading screen. Whatever has no real counterpart (the Sun's corona, the star and comet
  sprites, Earth's ocean-roughness map, Uranus's ring strip) is still painted procedurally, and if
  a file is ever missing the same painter covers for it, so no world can render blank.
- **Measured, not guessed.** Every material setting comes from a measurement rather than a taste:
  the IAU polar flattening squashes Jupiter (6.5%) and Saturn (9.8%), the ring discs begin and end
  at the published ring radii, the Sun's disc is dimmed toward the limb by the Eddington
  grey-atmosphere law, and Earth's oceans are glassy while its deserts are matte — which is what
  puts a sun glint on the real planet.
- **Quality is adaptive — and recoverable.** A performance monitor inside the scene reduces star, rock
  and segment counts (and drops post-processing) when the frame rate stays low, but it ignores the
  start-up warm-up, never climbs above the default look on its own, and steps back up as soon as the
  machine proves comfortable — so a brief dip can no longer leave the scene permanently darker.
  Lighting is never part of the trade: the Sun burns just as brightly at every tier.
- **Failure is graceful.** WebGL 2 is probed before the scene is created; if it is unavailable (or the
  context is lost later) a React error boundary swaps in a 2D orrery built from the same data.

## Verification

- `npm run typecheck` and `npm run build` are clean (strict TypeScript, no `any` in application code;
  about 1.5 MB of JavaScript, 420 kB gzipped, including three.js).
- The shipped build was driven through headless Chrome in WebGL 2 (SwiftShader) with an empty console:
  startup and the quick-travel HUD, planet selection and the information panel, the cinematic tour,
  every lesson, the What If experiments, Mission Control, the desktop HUD and the phone layout.
- Layout was measured rather than eyeballed. The desktop control panel clears the quick-travel strip
  (panel bottom 724 px, chips start at 732 px), the tour card pushes that panel down instead of covering
  it (card bottom 310 px, panel top 320 px), a phone sheet opens above the footer (sheet bottom 652 px,
  chips start at 656 px) and the phone page has no horizontal overflow at 390 × 844.
