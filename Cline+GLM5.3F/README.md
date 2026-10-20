# 🪐 Solar System Explorer

An immersive, interactive **3D Solar System** built for curious kids — beautiful enough to say
"whoa!", educational enough to answer "why?".

Built by using ***Cline*** + ***Z.ai GLM-5.3-Flash*** (a large language model. The particular instance used is a ***free*** one provided by *cline:z-ai/glm-5.3-flash*) with **React 18 + TypeScript + Vite + Three.js (React Three Fiber) + Zustand + Framer Motion + Tailwind CSS**.
All planet surfaces, rings, starfields and nebulae are **procedurally generated** — zero image assets.

## Getting started

```bash
npm install      # install dependencies (once)
npm run dev      # start the dev server → http://localhost:5173
```

## Production build

```bash
npm run build    # type-checks and bundles into dist/
npm run preview  # serve the production build locally
```

## What's inside

| Area                      | Highlights                                                                                                                                                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **3D scene**        | Shader-animated Sun with corona + flares, 8 uniquely painted planets (Earth oceans/clouds/atmosphere, Jupiter's Great Red Spot, Saturn's ringed glory…), the Moon, asteroid belt (instanced), a hidden comet, twinkling star field, subtle nebulae |
| **Interaction**     | Hover tooltips, click for info panels, double-click to visit, orbit/zoom/pan camera, "View system / View / Follow" modes                                                                                                                            |
| **Time**            | Pause + 5 speeds (0.2–365 days/sec), simulated calendar date, +1d/+1mo/+1y jumps                                                                                                                                                                   |
| **Cinematic Tour**  | 12-stop guided tour with narration, pause/resume/skip/exit                                                                                                                                                                                          |
| **Explore & Learn** | 8 lessons: the Sun, sizes, distances, gravity, day/night, seasons, moon phases, orbits — with animated 2D experiments                                                                                                                              |
| **What If? Lab**    | Two moons, Jupiter-sized Earth, a vanishing Sun, a stopped Earth (clearly labelled pretend simulations)                                                                                                                                             |
| **Spacecraft**      | Fly manually (WASD/arrows/shift, touch pads) or use planet-to-planet autopilot, with HUD                                                                                                                                                            |
| **Scale modes**     | Educational · Relative Size · Distances Emphasized · Custom sliders — with honest "not to scale" explanations                                                                                                                                   |
| **Extras**          | Easter eggs, 30-fact "Teach Me!" cards, procedural ambient audio (off by default), reduce-motion mode, keyboard shortcuts, WebGL fallback screen                                                                                                    |

## Architecture

```
src/
  data/        planets, bodies, facts, lessons, tour script (pure science + copy)
  store/       zustand app state (selection, focus, time config, panels, what-if…)
  utils/       astronomy math, educational-scale layouts, procedural textures, sim clock
  hooks/       scene layout, simulated date polling, keyboard, click-vs-drag guard
  audio/       Web Audio ambient engine (no files)
  components/
    3d/        Sun, Planet, Moon, Orbit, AsteroidBelt, Comet, StarField, Nebula,
               Spacecraft, CameraController, PlanetLabels, PostFX…
    ui/        Header, TimeControls, PlanetPanel, ExploreLearn + diagrams,
               WhatIfPanel, MissionControl, TourControls, Settings, overlays
  scenes/      SolarSystemScene (Canvas composition)
```

**Performance notes:** per-frame motion (orbit positions, clock, spacecraft) bypasses React via
refs and a singleton clock; instanced asteroid meshes; damped camera transitions; adaptive DPR;
three depth layers of shader-driven points for stars. Scientific values are real (NASA, rounded);
positions use mean longitudes on circular orbits — a deliberate educational simplification.
