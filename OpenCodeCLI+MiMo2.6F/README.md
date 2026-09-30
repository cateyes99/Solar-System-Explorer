# Solar System Explorer

An interactive, museum-quality 3D Solar System for the web — built for children to
**explore, learn, and play**. Fly to planets, run lessons, start a cinematic tour, pilot a
spacecraft, and try silly "What If?" experiments — all rendered live with procedural
graphics (no downloaded image assets).

Built with **React + TypeScript + Vite + Three.js + React Three Fiber**.

---

## Quick start

```bash
npm install
npm run dev        # dev server → http://localhost:5174/
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server (HMR) |
| `npm run build` | Type-check (`tsc -b`) and produce an optimized production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run verify` | Playwright smoke test: boots the app, drives the HUD, asserts **0 console errors** (needs a running server + `npx playwright install chromium`) |
| `npm run verify:full` | Deep interaction sweep: every lesson, every What-If switch, the full tour, all speed/scale/settings controls, label selection and keyboard shortcuts — asserts a clean final state and **0 console errors** |

Set `BASE_URL` to point the tests at another server, e.g.
`$env:BASE_URL = 'http://localhost:4173/' npm run verify` (PowerShell) or
`BASE_URL=http://localhost:4173/ npm run verify` (bash).

---

## How it's put together (architecture)

The app is a one-way data flow: **data → simulation → store → view**.

```
src/
├─ data/         Pure, structured content. No rendering, no state.
│   ├─ planets.ts     9 planets + Sun + Moon: size, orbit, colour, facts, kid-friendly copy
│   ├─ facts.ts       "Teach Me Something!" fact deck
│   └─ tour.ts        Cinematic Tour script (stages, camera targets, narration)
│
├─ utils/        Pure logic shared by every layer.
│   ├─ scale.ts       Educational-scale math: real AU/km → scene units, 4 scale modes
│   ├─ simClock.ts    The single source of simulated time (days since J2000) + body positions
│   ├─ astronomy.ts   Date formatting, distance/year/day display helpers
│   ├─ textures.ts    Procedural canvas textures (planets, glow, nebula, noise)
│   ├─ labelBridge.ts Lock-free bridge: 3D positions → DOM label overlay
│   ├─ audio.ts       Optional WebAudio blips/ambience (OFF by default)
│   ├─ input.ts       Central keyboard mapping
│   └─ telemetry.ts   Spacecraft command bus
│
├─ store/simulationStore.ts
│                   One Zustand store: simulation speed, camera mode, selection,
│                   scale mode, panels, tour, What-If flags, settings.
│
├─ scenes/SolarSystemScene.tsx
│                   The R3F <Canvas>: lights, star field, nebula, Sun, planets,
│                   moon, orbits, asteroid belt, comet, camera rig, effects.
│
├─ components/
│   ├─ 3d/          One component per celestial object/feature.
│   │               All animation happens in useFrame via direct mutation —
│   │               never through React state — so the frame loop never
│   │               re-renders the tree.
│   ├─ ui/          DOM HUD: header, timeline, info panel, lessons, tour controls,
│   │               Mission Control, settings, What-If, fact card, tooltips.
│   │   └─ lessons/ The 8 interactive lessons (SVG diagrams + sliders).
│   └─ SceneErrorBoundary.tsx
│
├─ hooks/          useKeyboardControls, usePlanetFocus, useScale, useSimulationTime
└─ App.tsx         WebGL check → loading screen → scene + HUD + label overlay
```

**The key performance contract**

1. `simClock` advances inside a single `useFrame` (the only per-frame store write is a
   *throttled* simulated date for the timeline).
2. Every 3D component reads `simClock` inside its own `useFrame` and mutates
   `mesh.position/rotation` directly. No React state changes, no re-renders.
3. Camera moves are lerped inside `CameraRig` — focus/follow/system transitions always
   glide, never teleport.
4. Body labels are plain DOM nodes positioned each frame from projected 3D coordinates
   (see below) — again without any React re-render.

**Labels:** drei's `<Html>` was deliberately not used — mounting a React root per label
inside the R3F commit phase caused console errors during unmount. Instead,
`LabelOverlay` renders all labels once as DOM, and `labelBridge` publishes positions from
the frame loop. Labels de-clutter radially from the Sun, draw leader lines, and avoid the
top/bottom HUD bands.

---

## Features

### Scene & visuals
- ☀️ **Sun** with animated corona, glow sprites and lens flare
- 🪐 **9 planets + Earth's Moon**, each with procedural surface texture, axial tilt,
  rotation, and its own orbital period
- 💫 **Orbit rings**, twinkling **star field**, layered **nebula**, **asteroid belt**
  (instanced) and a periodically passing **comet** with a tail
- ✨ Post-processing (bloom, vignette) with an automatic quality mode
- Everything is **procedurally generated** — no image downloads, loads fast offline

### Education
- 📏 **Educational Scale** with 4 modes (Educational / Relative Size / Distances
  Emphasized / Custom) plus a permanent **“not to scale” disclaimer**
- 📚 **Explore & Learn**: 8 interactive lessons — The Sun, Planet Sizes, Planet
  Distances, Gravity, Day & Night, Seasons, Moon Phases, Orbits — with SVG diagrams,
  sliders and “see it in 3D” buttons
- 🎯 Click any body for an **info panel**: description, stats, good-to-know facts and a
  “Did you know?” card, with actions (View / Follow / Fly there / Compare sizes)
- 🎲 **“Teach Me Something!”** random fact card

### Interaction & modes
- 🎥 **Cinematic Tour**: narrated multi-stage fly-through with pause / resume / skip / exit
- 🚀 **Spacecraft mode** with a Mission Control HUD: fly destinations, ride an orbit,
  thrust/turn/pitch controls, live speed & distance readouts
- 🤔 **“What If?”** mode — 4 playful simulations, each clearly labelled as a thought
  experiment, not a prediction
- 🕒 **Time controls**: pause + 5 speed presets, speed label, simulated date, and
  +1 day / +30 days / +1 year jumps

### Usability
- 🖱️ Smooth **orbit camera**: system view ⇄ focus ⇄ follow, never teleporting
- 🏷️ Hover **tooltips** and projected **body labels** with click-to-focus
- ⌨️ Full keyboard support (`0`–`8` focus bodies, `Space` pause, `L` labels, `O` orbits,
  `T` tour, `C` spacecraft, `F` follow, `R` random fact, `M` mute, `E` lessons,
  `?` shortcuts, `Esc` closes layers top-down) — press `?` in the app for the full list
- ♿ Accessibility: skip link, focus-visible styles, ARIA roles/labels, honors
  **reduced motion** (system preference or in-app toggle)
- 📱 Responsive layout — desktop, tablet and phone HUDs
- 🔊 Optional sound (off by default)
- 🧯 WebGL-unavailable and runtime-error fallbacks to a simplified 2D view, plus a
  boot loading screen with progress

---

## Verification status

- `tsc -b --force` — clean
- `npm run build` — succeeds (index 1.5 kB, CSS 44.5 kB, app 355 kB, motion 136 kB,
  r3f/three chunk 1.0 MB — 270 kB gzipped, manually code-split)
- `npm run verify` — `PROBLEMS: 0` on both dev and production preview
- `npm run verify:full` — all flows pass, final state clean, `PROBLEMS: 0`

The only console output in normal operation is a deprecation **warning** emitted from
inside Three.js/R3F (`THREE.Clock: This module has been deprecated`) and Chromium's
headless GPU `ReadPixels` notice — neither originates from this codebase, and there are
no console **errors**.

---

## Documented compromises

1. **Nothing is to real scale.** Real planets would be invisible dots at real distances.
   The default *Educational Scale* exaggerates sizes and compresses orbits (a `^0.56`
   distance curve) so everything fits on screen — and the UI says so permanently.
2. **Orbits are circularised and coplanar.** Real eccentricities, inclinations and the
   Moon's complex perturbations are simplified to clean circles so children can
   understand and predict the motion.
3. **The Sun is scaled down in Relative Size mode.** At true relative sizes the Sun
   would swallow the whole scene, so it is capped while planet ratios stay honest.
4. **No photographic textures.** Surfaces are procedurally painted on canvas (bands for
   Jupiter, craters for Mercury, continents for Earth…). They read as *representative*,
   not NASA-accurate — this keeps the bundle tiny and the app fully offline.
5. **What-If scenarios are illustrative, not simulated physics.** They are explicitly
   labelled as thought experiments; the copy explains what is simplified.
6. **`StrictMode` is disabled** in `src/main.tsx`. StrictMode's double-invoked effects
   combined with R3F/drei's commit-phase DOM work produced duplicate mounts and console
   errors; removing it was the clean fix after replacing drei `<Html>` labels.
7. **Tour narration is text-only** (no speech synthesis) so it works silently in
   classrooms and never triggers autoplay policies.
8. **Simulated dates are approximate.** Orbital positions use a simplified circular
   model, so the on-screen date is good for orientation, not for ephemeris-grade
   astronomy.
9. **Fonts load from Google Fonts** (`index.html`); offline, the app falls back to
   system fonts — everything else works with no network.

---

## Tech stack

React 19 · TypeScript 5.9 (strict) · Vite 8 · Three.js · React Three Fiber · drei ·
@react-three/postprocessing · Zustand · Framer Motion · Tailwind CSS 4 · Playwright (tests)
