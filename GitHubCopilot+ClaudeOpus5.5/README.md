# Solar System Explorer

An interactive 3D model of our Solar System, built to help children explore and learn real astronomy. You can fly around the Sun and planets, open planet facts, take a narrated tour, try short lessons, and pilot a small spacecraft.

> **Status:** this is the initial version. Everything listed below works, but expect further testing and polish.

## Quick start

Requires **Node.js 20.19+ or 22.12+** (needed by Vite 8).

```bash
npm install
npm run dev        # start the dev server, then open the URL it prints
```

| Command             | What it does                                      |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Start the Vite dev server                         |
| `npm run build`     | Check types and build the production version into `dist/` |
| `npm run preview`   | Serve the production build locally                |
| `npm run typecheck` | Check types only (`tsc -b`)                       |
| `npm run lint`      | Run ESLint                                        |

To see the 2D fallback used when WebGL isn't available, add `?nowebgl` to the URL.

## Features

- **The Solar System in 3D**: a glowing, animated Sun; eight planets with generated surfaces; Earth with clouds, atmosphere and day/night lighting; the Moon; Saturn's rings; Jupiter's bands and Great Red Spot; an asteroid belt, stars, nebula and a comet.
- **Scale modes**: Educational Scale, Relative Size, Distances Emphasized and Custom. The app always says the picture is *not to scale*.
- **Camera**: rotate, zoom and pan; smooth flights to any body; View Solar System, View Planet, Follow Planet and Surprise Me.
- **Planet information**: hover tooltips, labels, and an info panel with child-friendly facts and a "Did you know?" section.
- **Time controls**: pause/play, Slow, Normal, Fast and Very Fast speeds, jump forward a day, month or year, and a visible simulated date.
- **Explore & Learn**: eight interactive lessons (The Sun, Orbits, Planet Sizes, Planet Distances, Gravity, Day and Night, Seasons, Moon Phases).
- **Cinematic Tour**: 13 narrated stops with pause, back, skip and exit.
- **What If?**: playful pretend simulations: two moons, an Earth as big as Jupiter, the Sun disappearing, and Earth that stops spinning.
- **Mission Control**: fly a spacecraft and see its speed, distance from the Sun, destination and mission goals.
- **Extras**: "Teach Me Something!" fact cards, optional sound (off by default), and hidden Easter eggs (click the Sun several times, click Earth, find the comet, spot the passing probe).
- **Accessibility**: keyboard shortcuts, visible focus, screen-reader labels and a Reduce Motion setting.
- **Responsive**: separate layouts for desktop, tablet and phone, with touch-friendly controls.
- **Graceful fallback**: if WebGL is missing or the 3D scene fails, a simplified 2D Solar System is shown instead.

## Controls

| Input                      | Action                                          |
| -------------------------- | ----------------------------------------------- |
| Drag / swipe               | Rotate around the Solar System                  |
| Scroll / pinch             | Zoom in and out                                 |
| Right-drag / two fingers   | Pan the view                                    |
| Click a planet             | Open its information                            |
| Double-click a planet      | Fly to it                                       |
| `0`–`9`                    | Fly to the Sun (0), planets (1–8) or the Moon (9) |
| `H`                        | View the whole Solar System                     |
| `F`                        | Follow the selected planet                      |
| `Space`                    | Pause or play time                              |
| `+` / `-`                  | Speed time up or slow it down                   |
| `L` / `O`                  | Show or hide labels / orbit lines               |
| `T`                        | Teach me something!                             |
| `C`                        | Start or stop the Cinematic Tour                |
| `M`                        | Sound on or off                                 |
| `Esc`                      | Close panels or go back                         |

**Spacecraft (Mission mode):** `W`/`S` speed up/slow down, `A`/`D` or `←`/`→` turn, `↑`/`↓` nose up/down, `Shift` turbo. On-screen buttons do the same on touch devices.

## Project structure

```
src/
  components/
    3d/         Scene objects: Sun, Planet, Moon, Orbit, AsteroidBelt, StarField,
                Comet, Spacecraft, CameraController, labels, effects
    lessons/    The eight Explore & Learn lessons (each loaded only when opened)
    ui/         Header, panels, time controls, tour, Mission Control, settings,
                fact card, loading screen, 2D fallback
  data/         Planet data, facts, lessons, tour stops, What If? scenarios, missions
  graphics/     Generated textures, noise and custom materials
  hooks/        Keyboard controls, dialog focus, simulation time, media queries
  scenes/       SolarSystemScene: the 3D canvas and its setup
  store/        App state (simulationStore) and fast-changing per-frame values (runtime)
  utils/        Orbit math, scale modes, formatting, audio, WebGL detection
```

### Design notes

- **Data is kept separate from presentation.** Planet data and teaching text live in `src/data/`. To add a new body, add an entry to the data files rather than editing components.
- **One central store.** App state lives in one place: selection, camera mode, speed and date, mode, panels, sound, reduced motion and scale. Values that change every frame (the simulation clock, flight input, object positions) are stored outside React so they don't cause re-renders.
- **Animation runs in the renderer.** Motion happens every frame inside the 3D scene, not through React updates.
- **Performance.** Stars and asteroids are drawn in batches, geometry and materials are reused, screen resolution adapts to keep things smooth, the 3D scene and lessons load only when needed, and there's a Graphics quality setting.

## Scientific accuracy

- **Real data**: diameters, distances, orbital periods, day lengths, moon counts and temperatures use published values, rounded to friendly numbers.
- **Simplified models**: orbits use average motion rather than exact positions, and the 3D view is never physically to scale.
- **Hypothetical**: everything in What If? is clearly labelled as an educational simulation, not a real prediction.

## Known limitations

- The 3D part is one large download (~1.1 MB, about 350 KB compressed). It loads after the main page, behind the loading screen.
- React Three Fiber prints a harmless `THREE.Clock` deprecation warning in the console.
- Only WebGL rendering is used; WebGPU is not.
