# Solar System Explorer

An immersive, interactive 3D Solar System built to be explored by children — and to
make a parent wonder too. Every world is drawn procedurally in the browser, so the
app ships without a single image, model or audio file.

```bash
npm install
npm run dev      # start the dev server on http://localhost:5173
npm run build    # type-check and produce a production build in dist/
npm run preview  # serve the production build on http://localhost:4173
npm run lint     # oxlint
npm run smoke    # headless Chromium walkthrough of every major flow
```

## What is in it

**The scene** — a continuously orbiting orrery with the Sun, all eight planets, the
Moon, Phobos, Deimos, the Galilean moons, Titan, Enceladus, a 1,100-rock asteroid
belt and a long-period comet.

**Real spacecraft imagery.** Every planet and major moon is textured with a real
NASA / ESA / USGS equirectangular map rather than an invented one. Earth's is
NASA's Blue Marble, so you can pick out the Sahara and the outline of Africa.
Jupiter and Saturn are Cassini maps with genuine band structure, and Saturn's
polar hexagon is visible. Mercury is the MESSENGER colour mosaic, including the
Caloris basin. Mars is the Viking global mosaic; the Moon is LRO's colour map;
the Galilean moons, Titan, Triton and the Uranian moons are Voyager, Cassini and
Hubble products. Twenty-six maps in total, committed to `public/textures` so the
app never touches the network at runtime. `scripts/fetch-textures.ps1` re-downloads
them and rejects anything that is not 2:1, because a sphere's UV layout needs a
real equirectangular projection rather than a rendered globe.

Two bodies stay procedural for a stated reason. Uranus has no published global
map — NASA has only ever released rendered globes of it, which cannot be wrapped
on a sphere — and it really is a featureless pale cyan disc, so banding it would
be an invention. The Sun is procedural because a photograph of the photosphere
does not tile around the limb. Saturn's rings, Earth's clouds and its city lights
are also still painted procedurally, since each is a separate NASA product and
none is needed to make the planet read correctly.

**Explore** — click any world for an information panel written for children, with a
"Did you know?" section. Hover for a tooltip, double-click to follow.

**Explore & Learn** — eight interactive lessons with live 3D scenes: the Sun and
nuclear fusion, an animated planet-size comparison, real orbital distances, an
interactive gravity sandbox with a real two-body integrator, day and night,
seasons driven by axial tilt, the eight Moon phases, and the sideways-motion
argument for why orbits work.

**What If?** — four hypothetical experiments (two moons, Earth the size of
Jupiter, the Sun disappearing, Earth stopping its rotation), each clearly labelled
as a simplified teaching model.

**Cinematic Tour** — a fourteen-stop narrated tour that flies the whole system
with cinematic easing, pause / resume / skip / exit.

**Mission Control** — deploy a probe and fly it with WASD/QE, or set a destination
and let the autopilot steer and brake on approach. Live telemetry, in simulated AU.

**Time controls** — pause, six speed presets from half a day per second to 5.5
years per second, single-month stepping, and a readable simulated date.

**Scale** — Educational / Relative Size / Distances Emphasised, plus custom sliders,
with a permanent note that the visualisation is not to scale.

**Discoveries** — five clicks on the Sun trigger a flare, clicking Earth says
hello, a comet is hiding out in the outer system, "Teach Me Something!" deals a
fresh fact each time, and there is a reduce-motion setting that disables camera
flights and calms the scene.

## Architecture

```
src/
  data/          Scientific content, kept separate from presentation
    planets.ts     planets, moons, the Sun, AU and orbital elements
    facts.ts       the "Teach Me Something!" pool
    lessons.ts     eight lessons, their steps and takeaways
    tour.ts        fourteen tour stages with narration
    scenarios.ts   the four What-If experiments
    missions.ts    mission briefs and cruising notes
  store/
    clock.ts       the simulation clock — a plain mutable object, not React state
    registry.ts    world-space positions published by every animated body
    useAppStore.ts one Zustand store for selection, camera, UI and modes
    useLessonStore.ts  lesson-local slider state
    shipKeys.ts    flight keys shared by two listeners
  utils/
    scale.ts       the Educational Scale curves
    ephemeris.ts   real Keplerian propagation from the JPL elements
    imageTextures.ts  loads the committed NASA imagery
    textures.ts    the remaining procedural textures (rings, clouds, Sun)
    astronomy.ts   formatting, light-travel times, body name resolution
    noise.ts       seeded simplex/perlin noise used by every texture
    textures.ts    all procedural canvas textures
    gravity.ts     two-body maths, shared by the scene and its narration
    audio.ts       Web Audio ambience, blips and whooshes
  components/
    three/         the R3F scene (one component per concern)
      SceneRoot      picks the active mode: system, lesson or what-if
      SolarSystemScene  the orrery itself
      CameraRig      all camera behaviour: focus, follow, tour, damping
      Planet / Sun / Moons / AsteroidBelt / Comet / StarField / Labels
      Spacecraft, Atmosphere, OrbitRing, materials, Effects
      lessons/        eight lesson scenes
      whatIf/         four scenario scenes
    ui/             the interface layer
    ui/primitives/  Panel, Button, Controls, Overlays
  hooks/           keyboard map, media queries, tour driver, ship keys
```

### Notable decisions

**The simulation clock is not React state.** Planets derive their position from
`simClock.simDays` inside `useFrame`, so the orrery animates at 60fps without a
single React render. The UI receives a throttled snapshot four times a second, and
that is the only thing that re-renders.

**One camera rig drives everything.** Rather than tweening between keyframes,
`CameraRig` continuously damps the orbit target and the camera radius towards
whatever the current mode wants. User input blends in naturally, moving planets can
be followed without jitter, and the tour can keep sweeping the azimuth. Arriving at
a planet also steers onto its sunlit face, so you never click a world and get a
black disc.

**Rotation is rate-clipped per body, not scaled globally.** True spin rates span three
orders of magnitude — Mercury turns once in 59 days, Jupiter in 10 hours — and at every
speed preset the fast rotators would smear into an unreadable blur. `store/clock.ts`
integrates each body's angle separately and soft-clips its rate towards a ceiling
(≈18°/s): a body already turning slower than the ceiling keeps its true rate, and a
faster one is bent towards the ceiling asymptotically. Jupiter still visibly whirls,
Mercury still crawls, Venus still turns backwards, and Earth takes about 20 seconds
per turn at the Slow preset — slow enough to read continents, fast enough to feel
alive.

**Where the planets actually are, and which way they point.** Orbits are not
drawn from guesswork. `data/keplerian.ts` carries the JPL approximate elements
(Standish & Williams, valid 1800–2050): semi-major axis, eccentricity,
inclination, mean longitude, longitude of perihelion and longitude of the
ascending node, each with its per-century rate. `utils/ephemeris.ts` propagates
those to the simulated date, solves Kepler's equation for the eccentric anomaly
and rotates the result into the ecliptic frame. Consequences you can actually see:

- Planets sit where they really are on the displayed date, not at an invented phase.
- Each orbit lies in its true orbital plane, correctly inclined to the ecliptic.
- Mercury really does race at perihelion and crawl at aphelion, because the mean
  anomaly advances linearly while the eccentric anomaly does not.
- Uranus' rings are near-vertical and Venus is tipped over, because axial tilt now
  comes from the IAU north-pole directions rather than an arbitrary rotation.
- Saturn is visibly squashed — planets are drawn with their real rotational
  flattening, and the atmosphere shell is squashed to match.

Radii are still compressed so the whole system fits on screen, but only the
radius: the sunward vector keeps its true direction, so compression never
distorts the orbital geometry. Geometric albedo is carried through to the info
panel, which is why Venus reads 65% against Mercury's 11%.

`npm run verify:astronomy` re-checks the maths against the published values:
Kepler round-trips, heliocentric distances inside each planet's real
perihelion/aphelion range, Earth's distance and the Sun's apparent longitude in
early January, every planet's obliquity recovered from its pole against its own
orbit normal, prograde orbital direction, and orbit rings that close exactly once.

**Everything still procedural is procedural on purpose.** `utils/textures.ts`
paints the Sun's photosphere, Saturn's radial ring structure, Uranus's shepherd
rings, Earth's cloud shell and its city lights on a 2D canvas from seeded noise.
The space backdrop is a 2048×1024 equirectangular canvas with a Milky Way band and
nebulae. The loading screen reports real progress across both the downloaded
imagery and the generated textures.

**The scale is a design decision, and the app says so.** True scale would make Earth
a fraction of a pixel wide next to Jupiter. `utils/scale.ts` applies a power curve
to diameters and to orbital distances; an exponent of 1 is true proportion, and the
presets move between "accurate" and "legible". The UI states plainly that the
visualisation is not to scale.

**Accessibility is built in, not bolted on.** Every control is a real button with an
accessible name, there is a skip link, panels take focus on open, keyboard
shortcuts are documented in-app, and reduce-motion both calms the scene and stops
the tour auto-advancing.

## Performance

- One instanced draw call for the whole asteroid belt; one points draw call for the
  star field.
- Geometry and materials are created once per body and disposed on unmount; every
  texture lives in a single memoised cache.
- The NASA imagery totals about 12 MB and is committed, so it is served from the
  origin and cached by the browser after the first visit. Every map is capped at
  2048×1024 and stored as JPEG, which is all a sphere in this scene can resolve
  and is several times smaller than PNG for photographic subjects.
- Adaptive device pixel ratio, a quality setting that drops post-processing
  entirely, and reduced-motion automatically lowers star, belt and asteroid counts.
- The WebGL failure path renders a working animated 2D Solar System rather than an
  error page.

## Compromises

- **Scale.** Planet sizes and distances are exaggerated. The Sun uses its own,
  gentler curve and a cap, because a true 109:1 ratio would swallow Mercury's orbit.
  Relative Size mode keeps planet-to-planet proportions true but caps the Sun.
- **Moons.** Only the largest are drawn, on compressed orbits, at exaggerated
  sizes. Lunar months are compressed on screen; the Moon Phases lesson shows the
  real geometry.
- **Uranus and the Sun are procedurally painted.** Uranus has no published
  equirectangular map and the Sun's photosphere does not tile. Both are the honest
  fallback rather than a wrapped-on photograph that would look wrong.
- **Spin rates are compressed** above roughly 18°/s (see above). The differences
  between planets survive, but a gas giant at the Slow preset is not turning at
  its true ten-hour rate.
- **Lighting.** A single decay-free point light at the Sun, because squashed orbits
  make physical falloff meaningless. Real shadow casting is not simulated.
- **Moons and planets are untextured on their night sides** apart from Earth's city
  lights; there is no ring shadowing on Saturn.
- **The asteroid belt** is denser and larger than reality — a realistic belt is
  almost entirely empty space.
- **Orbital *distances* are compressed**, which slightly squares off each orbit's
  perihelion/aphelion aspect. Directions, orbital planes and speeds are real.
- **Moon orbits** are still compressed and their inclinations are stylistic.
- The tour auto-advance stops entirely under reduced motion.

## Textures and credits

All planetary imagery is public domain, from NASA, ESA, USGS and their mission
partners. No map is generated by a third party and nothing is hot-linked.

| Body | Source |
| --- | --- |
| Mercury | MESSENGER colour mosaic (NASA SVS) |
| Venus | Magellan-derived global map (NASA 3D Resources) |
| Earth | Blue Marble, NASA Earth Observatory |
| Mars | Viking MDIM colour mosaic (NASA 3D Resources) |
| Jupiter, Saturn, Neptune | Cassini global maps (NASA 3D Resources) |
| Moon | LRO colour map (NASA SVS) |
| Galilean moons, Saturn's and Uranus's moons, Triton, Phobos, Deimos | Voyager / Cassini / Hubble maps (NASA 3D Resources) |

Run `npm run fetch:textures` (PowerShell: `scripts/fetch-textures.ps1`) to refresh
them. The script downscales anything larger than 2048×1024 and **fails** on any
file that is not 2:1, because a rendered globe cannot be wrapped on a sphere.

## Verification

`npm run smoke` drives the production build in headless Chromium and checks
startup, planet selection, follow mode, the time controls, all eight lessons, all
four scenarios, mission control, the scale switcher, the tour, the fact deck, the
reduced-motion setting, five viewport sizes, keyboard order, button accessibility
names, the WebGL fallback path and frame pacing. It fails the run on any console
error. Screenshots land in `screenshots/`.

`npm run verify:astronomy` checks the orbital maths against published values
rather than against itself — see the note on real ephemeris above. It covers
Kepler's equation, perihelion/aphelion distances, Earth's position in early
January, all eight obliquities recovered from real poles, prograde motion, and
orbit rings closing exactly once.

Note: `THREE.Clock` deprecation warnings come from react-three-fiber's internal
store, not from application code.