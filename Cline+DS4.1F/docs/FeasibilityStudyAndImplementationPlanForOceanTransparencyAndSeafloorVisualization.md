I've finished the codebase inspection and external research. Here is the feasibility assessment and implementation plan. No application files have been changed.

---

# Feasibility & Implementation Plan — Adjustable Seawater Opacity + Seafloor Topography

## 1. What the codebase actually is (verified)

**Stack (verified in `package.json`, `vite.config.ts`, `tsconfig.json`)**
React 19.2 + TypeScript (strict) + Vite 8, `three@0.186`, `@react-three/fiber@9`, `@react-three/drei`, `@react-three/postprocessing`, `zustand@5`, `framer-motion`, Tailwind 4. Tests run with Node's built-in runner (`node --test tests/`). Targets WebGL 2, with a 2D orrery fallback.

**How Earth is rendered (verified in `src/components/3d/Planet.tsx`, `src/data/visuals.ts`)**
- Earth is **one** `MeshStandardMaterial` sphere (`surfaceMaterial`) — `map` = 8K day map, `roughnessMap` = derived ocean/land roughness, plus a `bumpMap`.
- **There is no separate ocean mesh or water volume.** "Ocean" is simply the blue pixels of the day map on that single mesh.
- Relief is real: the vertex shader is patched via `material.onBeforeCompile` (`src/components/3d/terrain.ts`, `TERRAIN_VERTEX_DISPLACE`) to displace vertices from an 8‑bit grayscale DEM (`public/textures/earth_heightmap.jpg`, 3840×1920).
- **Verified by direct pixel inspection of `earth_heightmap.jpg`:** every sampled ocean point (mid-Pacific, Mariana Trench, Mid-Atlantic Ridge, Arctic) is exactly `RGB(12,12,12)`. The DEM is land-only; **the oceans are a flat sphere at mean radius** (`terrain.ts` sets the bias so sea level = radius 1). So the existing DEM cannot be reused for seafloor topography.
- The water/land mask is already computed in JS (`analyseEarth` / `waterMaskFromImage` → `earthRoughness`, green channel ≈26/255 water, ≈235/255 land) and uploaded as a **data** map (no sRGB decode). This is a ready-made water mask.
- All Earth maps share one longitude offset `textureOffsetU = 0.55` and an equirectangular 2:1 projection (verified: Everest at lon 87° lands on the bright pixel in the DEM).
- Shells (`Atmosphere`, `Clouds`, `NightLights`) are additive, `depthWrite:false`, and lifted by `terrain.peakRadius`. `NightLights` shares the terrain uniforms.

**Texture pipeline (verified in `src/utils/textures.ts`, `textureSources.ts`, `textureResolution.ts`)**
- Files live in `public/textures`, loaded before the scene mounts; progress on the loading screen. Quality tiers scale uploads ×1 / ×0.5 / ×0.25; per-map ceilings via `TEXTURE_MAX_WIDTH`; clamped to `maxTextureSize()`.
- Data maps (`earthClouds`, `earthRoughness`, `earthHeightmap`) are uploaded `NoColorSpace`.
- If a file is missing/fails to decode, a **procedural painter** is used so nothing renders blank; `getTexture()` otherwise returns a 4×4 `#404040` fallback.

**Info panel / store / config / i18n (verified)**
- `src/components/ui/PlanetPanel.tsx` renders Earth-only sections using `SliderRow` (`src/components/ui/primitives.tsx`).
- `src/store/simulationStore.ts` holds `earthAtmosphereOpacity`, `earthCloudOpacity`, `earthCloudDynamics`, `earthCloudCoverage`, `earthTerrainRelief`; each has a setter, is in `SettingsPatch`, `initialState`, and `applySettings`.
- `src/config/appConfig.ts` + `public/config.jsonc` define validated, documented settings applied before first render.
- `src/i18n/en.ts` is the source of truth; `zh.ts` is typed `Record<TranslationKey, string>` — **adding an English key without a Chinese one is a compile error.**

**Feasibility verdict:** Feasible and well-supported by the existing architecture. The terrain-displacement mechanism, the water mask, the data-texture path, the slider/config/i18n pattern, and the quality-tier system all already exist. The main new work is (a) sourcing/encoding a bathymetry texture and (b) one shader extension on the existing surface material. No new transparent pass or mesh is required for the MVP.

---

## 2. Dataset assessment (authoritative sources)

| Dataset | Coverage | Nominal grid | Real resolution / accuracy | Formats & size | License | Notes |
|---|---|---|---|---|---|---|
| **GEBCO_2025 / 2026 Grid** | global land+ocean, 89°59′N–S | 15″ (~450 m), 43200×86400, int16 m | **Only ~27.3% of the ocean is mapped to modern standards** (multibeam ~0.5 km); the rest is satellite-gravity-predicted (~6 km). Of predicted vs measured: 85.7% within ±100 m, 14% within 100–500 m, 0.3% 500–2000 m | netCDF global **7.5 GB**; 8×90° tiles GeoTIFF/ASCII; or user-defined area; separate TID grid marks measured vs predicted | **Public domain**; attribution requested; *not for navigation* | The reference product; base is SRTM15+ v2.7 |
| **ETOPO 2022** (NOAA NCEI) | global | 15″ / 30″ / 60″ | integrates SRTM15+ and regional grids; same predicted-vs-measured caveat | GeoTIFF/netCDF. **60″ global = single 456 MB GeoTIFF** (or 491 MB netCDF); 15″ as ~60 tiles (5–30 MB each) | **CC0-1.0 (public domain)** | Simplest to fetch and the cleanest license |
| **SRTM15+ v2.5.5** (Tozer et al. 2019) | global to ±85° | 15″ | base of GEBCO | netCDF/GeoTIFF | OpenTopography lists **"Use License: Not Provided"** | Avoid as primary — licensing ambiguity |
| **GMRT** | regional, high-res in surveyed areas | up to ~100 m | direct multibeam | grid server | varies | Optional enhancement (zoom-in), not MVP |

Authoritative links: GEBCO grid page and terms (`gebco.net/data-products/gridded-bathymetry-data`, `.../terms-of-use`; DOI `10.5285/37c52e96-24ea-67ce-e063-7086abc05f29`); ETOPO 2022 (`ncei.noaa.gov/products/etopo-global-relief-model`, DOI `10.25921/fd45-gt74`); Seabed 2030 coverage/accuracy (IOC/UNESCO 2024; Frontiers in Marine Science 2025, `10.3389/fmars.2025.1543885`).

**Recommendation**
- **Primary: ETOPO 2022, 60 arc-second** — CC0 (no attribution obligation, though we'll credit anyway), a *single* 456 MB GeoTIFF, and 60″ (~1.85 km) is already finer than what a 4096-wide texture (≈9.8 km/px) can show. This keeps preprocessing trivial and licensing unambiguous.
- **Alternative / authoritative cross-check: GEBCO_2025** (15″ tiles or a custom-area download), used if we want maximum fidelity or the TID grid to visually distinguish measured vs predicted floor.
- Both share the same SRTM15+ base, so the *shape* of the floor is essentially identical; GEBCO adds newer regional multibeam.
- **Explicitly disclose** in UI/comments that ~73% of this floor is *predicted* from satellite gravity, not measured — do not imply survey-grade accuracy.

---

## 3. Rendering approach evaluation

The three options in the request, judged against this architecture:

1. **Basic transparency (fade the ocean material's opacity).** ❌ Risky here. The ocean is not a separate material; making it transparent means either a transparent pass on the whole Earth mesh (changes the 100% look, breaks front/back-face self-occlusion, interacts with clouds/atmosphere depth sorting) or splitting the mesh into land + water layers (a large rewrite). It also cannot guarantee an unchanged 100% appearance.
2. **Depth-aware visibility (blend by water depth).** ✅ Cheap and physically motivated; a good enhancement layered on the MVP.
3. **Physically informed (Beer–Lambert absorption + scattering + view distance).** ✅ Feasible in-shader but harder to validate and to keep "predictable". → optional later enhancement.

**Recommended MVP: single-mesh, shader-blended seafloor ("drain/morph"), implementing the requested formula exactly.**
Keep the existing surface mesh. Add a bathymetry height field and, for **ocean pixels only**, gate a downward displacement and a colour/roughness blend on the slider. At 100% the seafloor contribution is *exactly zero*, so the appearance is pixel-identical to today; at 0% the ocean floor is displaced to true (exaggerated) depth and coloured by a depth ramp. This:
- needs **no** new mesh, **no** transparent pass, and **no** draw call;
- sidesteps transparency sorting, depth-test and self-occlusion entirely;
- implements the requested `O = S/100, V = 1−O` literally.

Its one honest limitation (to document): it is a *crossfade/morph*, not a volumetric water layer, so intermediate values don't show true water-above-floor parallax. At globe scale the water column is ~0.17% of the radius, so parallax is negligible. A true translucent water shell is proposed as an optional enhancement (P2).

**Shading math (MVP)**
- Decode depth from the bathymetry texel; `O = S/100`, `V = 1−O`.
- Vertex: `seaOffset = −depthFraction · uBathyScale · V`, where `uBathyScale = (maxDepthM / EARTH_RADIUS_M) · exaggeration`. Added to the existing land displacement. At `V=0` → 0.
- Fragment (after `map_fragment`): `reveal = waterMask · V`; `diffuseColor.rgb = mix(dayColor, seafloorRamp(depth), reveal)`; and after `roughnessmap_fragment`: `roughnessFactor = mix(roughnessFactor, seafloorRoughness, reveal)` so the water's sun-glint fades as it drains.
- `waterMask` is reused from the existing `earthRoughness` green channel (`water = 1 − green`), applied with the shared UV offset — zero new cost. (A dedicated mask texture is a clean alternative.)
- Optional depth-aware tweak (P1): `reveal = waterMask · V · exp(−depth · k · O)` — still exactly 1 at `V=1`, still 0 at `V=0`, but deep floor stays hidden at mid values.

**Vertical exaggeration:** reuse the existing `Terrain relief` slider so one control governs both land and sea (`exaggeration = terrain.maxExaggeration · earthTerrainRelief`). At `relief=0` the floor is flat but still depth-coloured. (A separate seafloor exaggeration is the alternative.)

---

## 4. Files to add / modify (concrete)

**Assets & tooling**
- **ADD** `public/textures/earth_bathymetry.png` — 8‑bit grayscale, equirectangular 2:1, prime meridian at u=0.5 (generated).
- **ADD** `tools/fetch-bathymetry.mjs` — downloads ETOPO 2022 60″ (CC0) GeoTIFF → area-resample to 4096×2048 → encode depth (sea level = 0, deepest = 255, sqrt-gamma for shelf detail) → write PNG → update `CREDITS.md`. Mirrors the existing `tools/fetch-textures.mjs` style. Raw download is **not** committed; the derived PNG is.
- **EDIT** `public/textures/CREDITS.md` — ETOPO 2022 / GEBCO attribution + "predicted vs measured" caveat.

**Data & textures**
- **EDIT** `src/data/visuals.ts` — add `'earthBathymetry'` to `TextureId`; add a `bathymetry?` block to Earth (map id, `seaLevelTexel`, `maxDepthMeters`, encoding gamma, seafloor ramp colours, `seafloorRoughness`).
- **EDIT** `src/utils/textureSources.ts` — source entry for `earthBathymetry` (file/label/credit) + add to `TEXTURE_IDS`.
- **EDIT** `src/utils/textures.ts` — add `earthBathymetry` to `DATA_MAPS` and `LARGE_MAPS`; size in `resolutionFor`; a `TEXTURE_MAX_WIDTH` ceiling if desired; an honest procedural fallback painter (flat sea level — **no fabricated terrain**); add `hasTexture(id)` so the feature can go inert if the file is missing.
- **EDIT** `src/components/3d/terrain.ts` — extend `TerrainRelief`/`TerrainUniforms`/`createTerrainUniforms` with bathymetry uniforms (`uBathyMap`, `uBathyScale`, `uSeawaterVisibility`, `uBathymetryEnabled`); add `SEAFLOOR_VERTEX_DISPLACE` + fragment chunks; add a pure `bathymetryDisplacement()` helper.
- **ADD** `src/utils/seawater.ts` — pure helpers (`seawaterVisibility`, `depthFractionFromTexel`, encoding constants) for unit testing.

**Component / UI**
- **EDIT** `src/components/3d/Planet.tsx` — subscribe `earthSeawaterOpacity` (Earth only; other bodies get a constant so they don't re-render); feed it into the shared terrain uniforms; add the fragment injection in `onBeforeCompile`; update the uniform per frame/effect (no material rebuild).
- **EDIT** `src/components/ui/PlanetPanel.tsx` — new Earth "Seawater" section with a `SliderRow` (0…1, step 0.01, `%` display, default 100%).

**Store / config / i18n**
- **EDIT** `src/store/simulationStore.ts` — `earthSeawaterOpacity` (default **1**), `setEarthSeawaterOpacity`, `SettingsPatch`, `initialState`, `applySettings` (clamp01).
- **EDIT** `src/config/appConfig.ts` + `public/config.jsonc` — `"Earth Seawater Opacity"` (0…1, default 1) with comments.
- **EDIT** `src/i18n/en.ts` **and** `src/i18n/zh.ts` — `planet.earthSeawater`, `planet.seawaterHint`, `planet.seawaterOpacity`, `planet.seawaterOpacityHint` (+ `texture.source.earthBathymetry`).

**Tests**
- **ADD** `tests/seawater.test.ts` — visibility formula, encoding round-trip, displacement scaling.
- **EDIT** `tests/textureResolution.test.ts` — if a bathymetry ceiling is added.

---

## 5. Prioritized plan

**P0 — MVP (essential)**
1. Generate `earth_bathymetry.png` from ETOPO 2022 (60″) with the documented encoding; add the fetch tool + credits.
2. Wire the texture through `visuals.ts` → `textureSources.ts` → `textures.ts` (data map, tier sizing, honest fallback, `hasTexture`).
3. Extend `terrain.ts` + `Planet.tsx` with the gated seafloor displacement and the ocean-only colour/roughness blend (`reveal = waterMask · (1−O)`).
4. Store + config + i18n (both dictionaries) + PlanetPanel slider (default 100%).
5. Verify **100% is pixel-identical**, 0% reveals the floor, intermediate is smooth; graceful fallback when the file is missing.

**P1 — Polish (recommended)**
6. Bathymetric **bump/normal shading** so fine floor detail reads from orbit (parity with the land DEM's `bumpMap`), independent of mesh tessellation.
7. Seafloor **ramp texture** and/or depth-aware intermediate falloff (`exp(−depth·k·O)`).
8. LOD/exaggeration tuning; tune the fallback/disabled behaviour.

**P2 — Optional / physically richer**
9. True translucent water shell (Beer–Lambert absorption + scattering, view-distance aware) — accepts the transparency-sorting complexity the MVP avoids.
10. 16‑bit depth via a `DataTexture` (Uint16) for smoother gradients; regional GMRT high-res for close zooms.

---

## 6. Risks, dependencies, data storage

**Risks / mitigations**
- *Alignment/projection mismatch* (seafloor offset from coastlines): ETOPO/GEBCO and the DEM are both standard equirectangular, so it should align automatically; **verify** with known features (Mid-Atlantic Ridge, Mariana Trench, shelf edges) and the project's existing zero-shift/PSNR method. Watch for half-pixel registration differences (negligible at 4096).
- *100% not unchanged*: guaranteed by `V=0` → zero displacement and `reveal=0`; validate by screenshot pixel-diff.
- *JPEG terracing on a heightfield*: use **PNG** (lossless), unlike the land DEM's JPEG.
- *8‑bit quantization*: 0–11,034 m → ~43 m/level; sub-pixel after exaggeration. Use a sqrt encoding to protect shallow shelves; 16‑bit is a P2 option.
- *Missing/failed data*: procedural fallback = flat sea level + `hasTexture` gate → slider goes inert, no crash, no invented terrain.
- *Transparency/sorting*: avoided by the single-mesh design (the P2 shell reintroduces it deliberately).
- *Performance*: +1 texture and a few sampler fetches, no new draw calls, no new pass; the slider writes a uniform only.
- *Over-claiming accuracy*: UI hint and comments state ~73% predicted and that the slider is nominal, not physical transmission.

**Dependencies:** a build-time GeoTIFF decode (recommend `geotiff` as a **devDependency**, used only by `tools/fetch-bathymetry.mjs`; a GDAL/Python alternative avoids any new dependency). No runtime dependency added.

**Data storage:** raw ETOPO 60″ GeoTIFF ≈ **456 MB, download-only, not committed**; committed `earth_bathymetry.png` at 4096×2048 ≈ **4–10 MB** (or ~1–2 MB at 2048×1024); GPU ≈ 8 MB + mipmaps at 4K. ETOPO is CC0; GEBCO is public domain with attribution requested.

---

## 7. Testing & validation

- **Unit** (`npm test`): `seawaterVisibility(S) = 1 − S/100` (clamped); encoding round-trip; displacement math.
- **Types/build**: `npm run typecheck`, `npm run build` (strict, no `any`).
- **Visual**: 100% pixel-diff vs. baseline = identical; 0% shows a correctly placed floor; intermediate is smooth; land, Moon, and other bodies unchanged; cloud/atmosphere sliders still independent.
- **Interaction**: zoom LOD, camera orbit/follow, tour, missions unaffected.
- **Robustness**: remove `earth_bathymetry.png` → flat/unchanged ocean, empty console, no crash; quality-tier switch rebuilds in place.
- **Reproduce the project's own harness** (per README): headless Chrome + WebGL 2 (SwiftShader), empty console, driving the panel.
- **Document limitations**: predicted-vs-measured floor, 4096 horizontal sampling (~9.8 km/px), vertical exaggeration, nominal (non-physical) slider.

---

## 8. Decisions to confirm before I implement

1. **Dataset:** ETOPO 2022 60″ (CC0, single 456 MB file) as primary — or GEBCO_2025 15″ for max fidelity?
2. **Texture resolution:** 4096×2048 (recommended) / 2048×1024 / 8192×4096?
3. **Exaggeration:** reuse the existing "Terrain relief" slider (recommended) or give the seafloor its own?
4. **Depth-aware falloff** (`exp(−depth·k·O)`): include in MVP or defer to P1?
5. **Preprocessing dependency:** small `geotiff` devDependency for a Node script, or an offline GDAL/Python step?

I'll stop here for your review. Once you approve (and pick options above), switch me out of Plan mode and I'll implement P0, then P1.