# Solar System Explorer

A polished, interactive 3D Solar System built with React Three Fiber — designed to let kids (and adults) explore and learn real astronomy through play.

## Features

- **Animated 3D Solar System** — the Sun and all eight planets orbit and rotate, with a starfield, nebula clouds, an asteroid belt, comets, and Earth's Moon.
- **Cinematic camera** — orbit, zoom, and pan freely, or double-click/select a planet to smoothly fly the camera in and follow it; return to the full system view at any time.
- **Multiple scale modes** — switch between an Educational Scale, Relative Size, Distances Emphasized, and Custom views (the UI always makes clear the scene isn't physically to-scale).
- **Mission Control** — time controls (pause/play, speed up/slow down/reverse simulation time), a guided tour, and settings for labels, audio, and quality.
- **Explore & Learn panel** — per-planet fact sheets, "did you know" trivia, and mini interactive lessons: gravity demo, moon phase tracker, planet distance strip, planet size comparison, and a seasons diagram.
- **What-if sandbox** — tweak parameters and see hypothetical effects on the system.
- **Keyboard shortcuts** — `1`-`8` focus a planet, `0`/`Esc` returns to the system view, `Space` pauses/resumes, `L` toggles labels.
- **Procedural visuals** — planet surfaces, rings, atmospheres, and the Sun's glow are generated procedurally rather than relying on large image assets.
- **Graceful WebGL fallback** for devices/browsers without WebGL support.

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for dev/build tooling
- [Three.js](https://threejs.org/) via [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) and [drei](https://github.com/pmndrs/drei)
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [Framer Motion](https://www.framer.com/motion/) for UI animation
- [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first config, no `tailwind.config.js`)

## Getting Started

### Prerequisites

- Node.js and npm

### Install

```bash
npm install
```

### Run the dev server

```bash
npm run dev
```

Then open the printed local URL (defaults to `http://localhost:5173`).

### Build for production

```bash
npm run build
```

### Preview a production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
  components/
    3d/         3D scene objects (Sun, Planet, Moon, AsteroidBelt, Comet, StarField, ...)
    ui/         2D overlay UI (Header, MissionControl, PlanetPanel, WhatIfPanel, ...)
    ui/lessons/ Interactive mini science lessons
  data/         Astronomical data, missions, facts, and tour scripts (single source of truth)
  hooks/        Simulation time, camera focus, keyboard controls, ambient audio
  scenes/       Top-level R3F scene composition
  store/        Zustand simulation store
  utils/        Astronomy math, scale calculations, texture generation, formatting
```

## Controls

| Input | Action |
| --- | --- |
| Drag | Orbit camera |
| Scroll / pinch | Zoom |
| Click a planet | Select / focus |
| Double-click a planet | Fly camera to planet |
| `1`-`8` | Focus Mercury–Neptune |
| `0` / `Esc` | Return to system view |
| `Space` | Pause / resume |
| `L` | Toggle labels |
