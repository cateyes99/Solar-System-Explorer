# _Prompt_:
## Context
Our application currently uses 8K resolution day and night texture maps. To improve visual fidelity up close, particularly for the "Solo Earth" mode, we want to give users a much sharper surface experience.

## Objective
1. **Asset Availability Research:** Investigate whether public domain, open-source, or commercially viable 16K (16384x8192) and 32K (32768x16384) Earth day and night texture maps are available for download.
2. **Settings UI Expansion:** Add a new graphics quality tier to the Settings Panel named **"Ultra"** (or **"Cinematic"** / **"Master"** if more appropriate). When selected, this tier loads and renders the 16K or 32K Earth assets while leaving all existing quality settings (Low, Medium, High/8K) untouched.
3. **Performance & VRAM Impact Analysis:** Evaluate the technical implications of scaling texture sizes from 8K to 16K/32K—specifically focusing on:
   - GPU VRAM consumption (noting memory footprint differences uncompressed vs. compressed formats like BC7/ASTC).
   - Texture streaming / loading times and disk space footprint.
   - Rendering performance impacts (fill rate, mipmapping overhead, and texture cache efficiency).

## Task Deliverables
   - Provide links or sources for available 16K/32K Earth day/night textures.
   - Detail the recommended naming convention and UI implementation for the new settings tier.
   - Deliver a concise technical risk/performance breakdown for implementing 16K vs. 32K textures.

# _Response from DeepSeek V4.1 Flash:_
I've researched the assets, the hard browser/GPU limits, and every place the code switches on quality. Here's the feasibility analysis and plan.

## Headline

- **16K (16384×8192): feasible**, and exactly the right ceiling. It fits the browser canvas area limit and ~85% of desktop WebGL2 GPUs.
- **32K (32768×16384): not viable** in a browser — it breaks the canvas area limit, exceeds `MAX_TEXTURE_SIZE` on ~99% of devices, and needs a 2 GiB image decode. I'd rule it out.
- The cleanest source is **NASA public domain** (Blue Marble for day, Black Marble for night). Solar System Scope — the app's current 8K source — caps at 8K, so a 16K asset has to come from elsewhere.

---

## 1. Asset availability

**The current 8K source caps at 8K.** Solar System Scope's "Ultra resolution" is 8192×4096 (confirmed on their site and the Wikimedia copy of the exact file the app ships). No 16K there.

**Recommended — NASA, public domain, equirectangular:**

| Need | Product | Resolution | Link |
|---|---|---|---|
| Day | Blue Marble: Next Generation (base map, no baked topography) | 21600×10800 JPEG (~19–26 MB); full 500 m is 86400×43200 tiled | https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/ · https://visibleearth.nasa.gov/collection/1484/blue-marble |
| Night | Black Marble 2016 color | 13500×6750 JPEG (8 MB); 86400×43200 tiled | https://visibleearth.nasa.gov/images/144898/earth-at-night-black-marble-2016-color-maps |
| Both | GMT `@earth_day` / `@earth_night` single-file mosaics | 21600×10800 (171 MB) · 43200×21600 (622 MB) | https://www.generic-mapping-tools.org/remote-datasets/earth-daynight.html |
| Day (alt) | Blue Marble 2002 | 43200×21600 PNG (530 MB) | https://commons.wikimedia.org/wiki/File:Blue_Marble_2002.png |
| Night (alt) | BlackMarble 2016 | 43200×21600 JPEG (266 MB) | https://commons.wikimedia.org/wiki/File:BlackMarble20161km.jpg |

All are **public domain** (NASA/US-Gov; credit expected). Use the BMNG **base** map, not "with topography" — the app already displaces real terrain, so baked shading would double up.

**Community 16K/32K (licensing caveats, not recommended):** Celestia Motherlode (DDS/virtual-texture, mixed licences) — http://celestiamotherlode.net/catalog/earth.php · RSS-Reborn/RSS-Earth GitHub (16k–86k, non-commercial-ish) · SpaceEngine addons (cubemap PAK) · a 2011 "16K Earth" on highend3d (MIT but unverifiable provenance).

**Recommendation:** derive `16k_earth_daymap.jpg` and `16k_earth_nightmap.jpg` by downscaling BMNG (21600×10800 → 16384×8192) and Black Marble 2016, re-encoded as JPEG. **Downscale offline**, not at runtime — feeding a 21600 source through the loader would cost a 933 MiB decode plus a 512 MiB canvas.

**Alignment risk (important):** the app ties the day map, height map, night map and the Natural Earth overlay together with `textureOffsetU: 0.55` (`data/visuals.ts:957`). The 8K asset was verified pixel-aligned against the 2K it replaced. Swapping in BMNG requires the same pixel-level alignment check against the current 8K (both descend from Blue Marble, so it should hold, but it must be verified — and the offset adjusted if not).

---

## 2. Settings tier and naming

**Name: "Ultra"** (recommended). It reads as "above High" in the conventional Low/Medium/High/Ultra scale and is honest — it only changes texture detail. "Cinematic"/"Master" imply post-processing or gameplay changes it doesn't make.

**File naming** (mirrors the existing `8k_…` convention): `16k_earth_daymap.jpg`, `16k_earth_nightmap.jpg`.

**UI:** a fourth button in the existing Graphics-quality row in `SettingsPanel` (`QUALITY_LEVELS`), plus `settings.quality.ultra` in `en.ts`/`zh.ts` and an updated `settings.qualityNote` mentioning VRAM. Best paired with **Solo Earth mode** — there the texture scope is `earth`-only, so Ultra builds just the two 16K maps and nothing else, which is the ideal target experience.

### Implementation shape

I recommend adding `'ultra'` to `QualityLevel` (one tier, as asked), and **per-tier source selection** so Low/Medium/High stay byte-identical:

- `TextureSource` gains an optional `ultraFile`; `textureSources.ts` gets a pure `textureFileFor(id, quality)` helper. `buildMap` loads the 16K file only at Ultra; High still loads the 8K file.
- `QUALITY_SCALE.ultra = 1` → the 16K source uploads at 16384; other bodies (2048 source) stay 2048, same as High.
- `EARTH_ANALYSIS_WIDTH.ultra = 2048` → the water/land analysis stays capped (no quarter-GB scratch pass).
- `TEXTURE_MAX_WIDTH` unchanged (earth day/night uncapped, heightmap capped at 2048).
- `maxTextureSize()` already clamps: on a GPU that only accepts 8192, Ultra silently uploads 8K. I'd **disable the Ultra button with a note** when `maxTextureSize() < 16384` so it isn't misleading.

### The audit that matters

Adding a 4th literal to `QualityLevel` means every `quality ===` switch that treats "high" as the top must also treat "ultra" as high, or Ultra silently regresses to the *low* branch. I found these (real bugs if missed):

| File | Site | Ultra would wrongly get |
|---|---|---|
| `utils/textureResolution.ts` | `QUALITY_SCALE`, `EARTH_ANALYSIS_WIDTH` | `undefined` → **NaN** (crash) |
| `utils/textures.ts` | `resolutionFor` (procedural fallback) | low-res painter |
| `components/3d/StarField.tsx` | star layers | fewest stars |
| `components/3d/AsteroidBelt.tsx` | rock count | 520 (low) |
| `components/3d/Orbit.tsx` | `arrowCount` | 10 arrows |
| `components/3d/PostProcessing.tsx` | `multisampling`, bloom `intensity` | no MSAA, weaker bloom |
| `scenes/SolarSystemScene.tsx` | `QUALITY_ORDER` | (must add) |
| `components/ui/SettingsPanel.tsx` | `QUALITY_LEVELS` | (must add) |

Everything else (`geo.ts`, `Moon`, `Planet`, `dpr`, `antialias`) already falls through to the high-ish branch and is fine. `DEFAULT_QUALITY` stays `medium`, so the performance monitor never auto-selects Ultra.

**Lower-risk alternative:** keep `QualityLevel` as-is and add a separate `earthUltra` flag composed with the render tier (Ultra button = `quality:'high'` + `earthUltra:true`). This touches none of the switches above — only the texture pipeline and the panel. It's arguably the truer model, since Ultra is texture-only; I'd happily go this route if you prefer minimal blast radius.

Also to update: `tools/fetch-textures.mjs` (+ `public/textures/CREDITS.md`) for the new assets, `README.md`, and `tests/textureResolution.test.ts` (ultra width, GPU clamp, `textureFileFor`).

---

## 3. Performance / VRAM / risk breakdown

**VRAM per map** (WebGL uploads a JPEG/PNG as uncompressed RGBA8; mipmaps add ~⅓):

| Base size | Pixels | RGBA8 | + mips |
|---|---|---|---|
| 2K 2048×1024 | 2.1 M | 8 MB | 10.7 MB |
| 4K 4096×2048 | 8.4 M | 32 MB | 42.7 MB |
| **8K 8192×4096** | 33.6 M | 128 MB | 170.7 MB |
| **16K 16384×8192** | 134 M | **512 MB** | **682.7 MB** |
| 32K 32768×16384 | 537 M | 2048 MB | 2730.7 MB |

**Earth day + night together:** 8K ≈ 341 MB · **16K ≈ 1.33 GB** · 32K ≈ 5.3 GB.

**Compressed (BC7/ASTC, 1 byte/px — 4× smaller):** 16K ≈ 128 MB/map (+mips 171), so day+night ≈ 341 MB. But WebGL can't decode JPEG→BC7 at runtime: it needs **KTX2/Basis** (`KTX2Loader` + `EXT_texture_compression_basisu`) and an offline transcode step (`toktx`/`basisu`). That's a meaningful build-pipeline addition — worth it only if the uncompressed 1.3 GB proves too much. I'd ship JPEG first and note KTX2 as the escape hatch.

**Transient decode memory** (before upload): 8K 128 MiB · **16K 512 MiB** · 32K 2 GiB. With a pre-downscaled 16384 source and a ≥16384 GPU the loader uploads the decoded image directly (no canvas copy); a smaller GPU makes one 128 MiB canvas instead.

**Load time / disk:** the app ships assets in `public/textures` and loads everything up-front. Repo + `dist` grow from ~7.4 MB (8K day+night) to **~25–40 MB** for the 16K pair. Decode is ~2–6 s/map on desktop; the existing rebuild overlay covers it, and `ensureTextures` skips the maps it already has, so entering/leaving Solo Earth doesn't re-decode.

**Rendering (fill rate, mips, cache):** for the same on-screen globe the fragment count and sample count are unchanged — Ultra only matters when Earth fills the screen (Solo Earth zoomed in); at the wide system view mip level 0 is never sampled, so 16K and 8K look identical. Mip levels go 14→15 (+1, already in the +⅓). The real risks are **capacity** (1.3 GB of two textures evicting everything else / thrashing on 2–4 GB and integrated GPUs) and a one-off **upload stall** (512 MB per map → a visible hitch).

**Hard limits (why 32K is out):**

| Limit | Value | Source |
|---|---|---|
| Canvas area | 268,435,456 px (2²⁸ = 16384²) on Chromium/WebKit; 16384×8192 = 134 M ✅, 32768×16384 = 537 M ❌ | canvas-size test results |
| `MAX_TEXTURE_SIZE` | ≥16384 on ~85% of WebGL2 (Windows via ANGLE fixed at 16384); **Android only ~5%**; ≥32768 ~1% | web3dsurvey |
| Decode | 16K = 512 MiB; 32K = 2 GiB → OOM | w×h×4 |

So: **16K is the practical ceiling; 32K is not implementable in-browser.**

### Risk summary
- **16K:** safe on ~85% of desktop; **fails on most mobile** (Android caps at 8192) — must degrade via the existing `maxTextureSize()` clamp, and I'd hide/disable the tier below 16384.
- **1.3 GB VRAM** for day+night is the headline cost; the Solo Earth pairing (which releases the other bodies' maps) is what makes it defensible.
- **Alignment** must be re-verified (`textureOffsetU: 0.55`).
- **The `QualityLevel` audit** (above) — the main correctness trap.
- **Repo size** grows ~25–40 MB if the assets are committed (consistent with the offline philosophy; otherwise `fetch-textures.mjs` pulls them at setup).

---

## Proposed plan (for your approval)

1. Source and pre-downscale the two 16K assets from NASA public-domain imagery; verify pixel alignment against the current 8K day map; add them to `public/textures` + credits + `fetch-textures.mjs`.
2. `TextureSource.ultraFile` + `textureFileFor()`; `buildMap` picks the file by tier.
3. Add `'ultra'` to `QualityLevel`; extend `QUALITY_SCALE`, `EARTH_ANALYSIS_WIDTH`, `QUALITY_ORDER`, `QUALITY_LEVELS`; fix the six "else→low" switch sites (StarField, AsteroidBelt, Orbit arrows, PostProcessing, `resolutionFor`) to treat Ultra as ≥ High.
4. Settings button + `settings.quality.ultra` (en/zh) + updated quality note; disable when `maxTextureSize() < 16384`.
5. Tests: `textureUploadWidth` ultra cases, GPU clamp, `textureFileFor`, and that Ultra ≥ High for the audited sites.
6. Docs: README + credits.

**Open questions before I build:** (a) single `'ultra'` tier (my recommendation) or the lower-risk separate `earthUltra` flag? (b) commit the ~25–40 MB of assets into the repo, or have `fetch-textures.mjs` pull them? (c) proceed with 16K only and formally drop 32K?

I'm in Plan mode, so I haven't changed anything. Tell me your answers (or "go with the recommendations") and switch to a build agent, and I'll implement it.