# _Prompt:_

With more and more rich features being added to the Earth in the 3D solar system animation, I am considering a major functional shift: adding a **Solo Earth mode**.

This feature would include a toggle switch on the settings panel:

* **When turned off:** The normal solar system is presented with no changes.
* **When turned on:** The app enters Solo Earth mode. All other parts of the solar system—including the Moon, the Sun, and everything else—are completely offloaded so they no longer consume computing resources. This effectively turns the application into a standalone 3D animated Earth globe, laying the groundwork for additional Earth-centric features later.

However, there is an important concern and requirement regarding camera behavior. Currently, the camera can move inside celestial bodies, including the Earth. In Solo Earth mode, this behavior is **not desired**.

Instead, the camera should be able to zoom in as close as possible to the surface of the Earth, but it **must not penetrate or enter inside the Earth** (functioning purely as a zoom-in/zoom-out effect). Users should still retain the ability to drag, pan, move, and rotate the Earth freely.

**Please research and analyze whether this proposal is technically feasible.**

# _Response from DeepSeek V4.1 Flash:_

I've traced the scene, the camera, the texture pipeline, and the lighting. Here's the feasibility analysis.

## Verdict: feasible

Both halves of the proposal are implementable within the current architecture. The codebase is already built around the exact seams this needs — conditional rendering in `SolarSystem.tsx`, a `bodyRegistry` that self-cleans on unmount, a single custom camera controller (`FreeOrbitControls` + `CameraController`), and a one-cache texture pipeline with an in-place rebuild path. This is a contained change, not a rewrite.

---

## Part 1 — Solo Earth mode (offloading everything else)

### How the scene is built today
- `SolarSystem.tsx` renders every body as a component (`Sun`, `ORBITING_WORLDS.map(Planet)`, `Comet`, `Orbit`, `AsteroidBelt`, `Spacecraft`, `TourDirector`). Each registers itself in `utils/bodyRegistry` and adds its own `useFrame`; all unregister on unmount.
- `Timekeeper` is the only writer to the simulation clock; every body derives its position from it each frame.
- Lighting is `ambientLight 0.26` **plus the Sun's single `pointLight`** (`decay 0`, intensity 3.5). The Sun is the only real light.
- Earth's atmosphere/clouds/ocean/night-lights shaders all take a `sunPosition` prop, and `Planet` passes the `SUN_POSITION = (0,0,0)` constant; the shaders use `normalize(uSunPosition − worldPos)`. `EarthMap` reads `SUN_POSITION` directly too.
- Every surface map is generated up-front by `useAssetPreloader → ensureTextures → generateTextures`, iterating the fixed `TEXTURE_IDS` list into one module-level cache.

### What "offload computing resources" actually buys, ranked
1. **Per-frame CPU** — unmounting removes each body's `useFrame` (orbit integration, LOD, hover, cloud/ocean shaders' uniform writes). Largest steady-state win.
2. **Draw calls / geometry** — unmounting removes the meshes; the shared `SPHERE_LODS` ladder persists (small).
3. **GPU texture memory** — the real heavyweight. Earth's 8K day + night maps dominate, but the Sun/Moon/eight planets/rings/comets maps add up. Truly offloading means *not building* them.
4. **Sun extras** — corona sprites and the 260-particle flare system.

### Recommended shape
- Add `soloEarth: boolean` to the store + a Settings toggle (same pattern as the `freeTumble` switch I just added).
- Split the scene: `soloEarth ? <SoloEarth/> : <full system>`. `SoloEarth` renders Earth (reusing `Planet` with a new `solo` prop that **pins its position to a fixed constant** and omits satellites/the selection ring) plus a light.
- **Light:** keep a single `pointLight` at the origin and pin Earth at a fixed non-origin point. This keeps `SUN_POSITION = (0,0,0)` valid for *every* shader unchanged, so no Atmosphere/Clouds/NightLights/Ocean/EarthMap edits are needed. Time still advances, so the globe keeps spinning; only the orbital *position* is pinned so it doesn't drift.
- **Texture trimming (optional, phase 2):** thread an id subset through `ensureTextures`/`generateTextures` so a solo launch builds only the Earth + sky maps. Releasing already-built maps at runtime is possible (dispose + evict from the cache after the bodies have unmounted) but causes a rebuild hitch on toggle-off, so I'd treat it as an enhancement rather than the default.

### Things that need explicit handling (not blockers)
- **Stale references on toggle-on:** if the follow target or selection is another body, reset it to Earth; cancel any in-flight `cameraRequest` aimed at a removed body. `getBodyWorldPosition` already returns `undefined` safely for unmounted ids.
- **`resetView` (R)** currently flies to `SYSTEM_VIEW` (the whole system); in solo mode it must re-frame Earth.
- **`TourDirector`** must be dropped (it scripts other bodies); Tour/Mission/What-If/quick-travel UI would be misleading — hide or leave inert.
- **What-If scenarios** (`no-sun`, `earth-jupiter-size`, `two-moons`, `no-rotation`) intersect solo mode and need a rule.
- `StarField` / `PostProcessing` stay (shared, cheap-ish).

---

## Part 2 — Camera must not enter Earth

### Why it can today
- `controls.minDistance = 0.35` is measured **from the orbit target, not the body**, and Earth's drawn radius varies by mode: **0.34** (`distances`/`relativeSize`), **0.62** (`educational`/`custom`), and **×11 ≈ 3.74** under the "Earth as big as Jupiter" What-If. So 0.35 is only a surface bound in the default mode; in the others the camera flies straight inside.
- Panning moves the target; flights/tweens set `camera.position` directly; free tumbling has no collision. None of these respect the globe.

### Recommended approach (three layers, the last is the guarantee)
1. **Pin `controls.target` to Earth's centre** in solo mode. This makes scroll/pinch a purely radial dolly toward the globe — exactly the "zoom-in/zoom-out effect" you described.
2. **Set `controls.minDistance = surfaceRadius + margin`**, where `surfaceRadius = radius × (1 + terrain.peakRadius)`. This matters: the DEM is exaggerated 160×, so at the default 50% relief the highest peaks stand ~**11% of the radius** above sea level (up to ~22% at full relief) — clamping at `radius` alone would let the camera clip into mountains. Margin should also clear the 0.1 near plane.
3. **A hard per-frame sphere clamp** on `camera.position` (distance from Earth's centre ≥ `surfaceRadius + margin`), applied *after* the controls' update and after `CameraController`'s tween/follow branches. This is the real guarantee: it also covers flights, panning, and free tumble.

Why this is safe: `FreeOrbitControls` deliberately keeps **no persistent spherical state** — each `update()` re-derives the offset from `camera.position` and `target`. So an external position clamp is stable and won't fight the controller or drift.

### The one design decision for you
The requirement says "drag, pan, move, and rotate freely," but a *pure* radial zoom needs the target at the globe centre, which makes panning pointless. Two options:
- **(A, recommended)** Pin the target to Earth's centre and disable pan → zoom is purely radial to the surface; drag/rotate/tumble all preserved.
- **(B)** Keep pan enabled, rely on the sphere clamp for the no-penetration guarantee → more freedom, but zoom is only radial when you haven't panned off the globe.

---

## Rough scope

| Area | Files | Notes |
|---|---|---|
| Flag + toggle + strings | `simulationStore.ts`, `SettingsPanel.tsx`, `i18n/en.ts`, `i18n/zh.ts` | mirrors `freeTumble` |
| Scene split + light + pin | `SolarSystem.tsx`, new `SoloEarth.tsx`, `Planet.tsx` (`solo` prop) | conditional render |
| Camera clamp + solo framing | `CameraController.tsx`, `freeOrbitControls.ts` | clamp helper is unit-testable |
| Reset/follow/selection on toggle | `simulationStore.ts` | avoid stale targets |
| (Optional) texture subset | `textures.ts`, `useAssetPreloader.ts` | first-load skip; runtime release is extra |
| Tests | `tests/*` | pure clamp + id-subset logic |

Overall: **moderate** effort, no architectural obstacles. The camera constraint is the part worth getting exactly right, and it's a small, well-isolated piece of maths.

## Questions before I'd finalize a plan
1. **Time in solo mode:** keep the clock running so the globe spins (my recommendation), or freeze it entirely?
2. **Pan:** disable it for a pure radial zoom (A), or keep it with the sphere clamp (B)?
3. **Texture offload:** is skipping non-Earth maps *at first load* enough, or do you also want them released when toggling solo on mid-session (accepting a rebuild hitch when toggling off)?
4. **UI in solo mode:** hide the tour/mission/What-If/quick-travel controls, or leave them visible-but-inert?
5. **Toggle placement:** Settings only (like `freeTumble`), or also the left control panel this time?

I'm still in Plan mode, so I haven't changed anything. Tell me your answers (or just "go with your recommendations") and switch to a build agent, and I'll implement it.

# _Decisions for the questions you've asked:_

1. Time in solo mode: keep the clock running so the globe spins as your recommendation.
2. Pan: disable it for a pure radial zoom (A). Let's see its effect first.
3. Texture offload: I want them released when toggling solo on mid-session (accepting a rebuild hitch when toggling off).
4. UI in solo mode: hide the tour/mission/What-If/quick-travel controls.
5. Toggle placement: Settings only (like freeTumble).