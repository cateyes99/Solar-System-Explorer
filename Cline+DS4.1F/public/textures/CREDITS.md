# Surface map credits

These images are **not** hand-drawn: they are real planetary map data.

- Source: [Solar System Scope](https://www.solarsystemscope.com/textures/) textures,
  licensed **CC BY 4.0**.
- Derived from public-domain NASA / JPL / USGS imagery (Blue Marble, MESSENGER,
  Magellan, Mariner 10, Viking, Cassini, Voyager 2, LRO, SDO, ESO).
- Format: equirectangular (2:1) colour maps, plus one alpha ring strip and one
  grayscale height field.
- `8k_earth_daymap.jpg` and `8k_earth_nightmap.jpg` are Solar System Scope’s
  “ultra resolution” Earth maps, 8192×4096 — four times the width of the 2K maps
  they replaced. They are the same product (identical projection, colour and
  geographic alignment), so they line up exactly with each other, with the
  elevation model and with every texture offset. The app uploads each at 8K on
  High, 4K on Medium and 2K on Low quality, and never above the GPU’s maximum
  texture size.
- `earth_heightmap.jpg` is not from Solar System Scope: it is the public-domain
  NASA / USGS SRTM–GTOPO30 global relief map, published by Wikimedia Commons,
  normalised to 8-bit grayscale with sea level at `#0c0c0c`. The app reads that
  encoding (sea level texel 12, highest land texel 218) back into metres to
  displace Earth’s surface; it is 3840×1920 and is downscaled on upload.
- Pluto’s map is the public-domain NASA / JHUAPL / SwRI New Horizons global
  colour mosaic, with the southern band New Horizons never imaged filled in to
  complete the globe. It is composited rather than downloaded, so the fetch
  script leaves it untouched.

| File | Body | Provenance |
| --- | --- | --- |
| `2k_sun.jpg` | Sun | Photosphere granulation (SDO/NASA imagery) |
| `2k_mercury.jpg` | Mercury | MESSENGER global mosaic |
| `2k_venus_atmosphere.jpg` | Venus | Cloud tops as seen by Mariner 10 / Venus Express |
| `8k_earth_daymap.jpg` | Earth | Blue Marble: land, ocean and vegetation colour (8192×4096) |
| `earth_heightmap.jpg` | Earth elevation | NASA / USGS SRTM–GTOPO30 global relief (public domain), sea level at #0c0c0c |
| `2k_earth_clouds.jpg` | Earth clouds | Cloud-cover layer (black sky, white cloud) |
| `8k_earth_nightmap.jpg` | Earth at night | City lights (NASA Black Marble), 8192×4096 |
| `2k_moon.jpg` | The Moon | LRO / Clementine albedo mosaic |
| `2k_mars.jpg` | Mars | Viking / MOLA true-colour mosaic |
| `2k_jupiter.jpg` | Jupiter | Cassini / Voyager belt-and-zone mosaic |
| `2k_saturn.jpg` | Saturn | Cassini banded cloud deck |
| `2k_saturn_ring_alpha.png` | Saturn rings | Ring optical depth with alpha (C, B, Cassini, A, F) |
| `2k_uranus.jpg` | Uranus | Voyager 2 featureless methane-blue disc |
| `2k_neptune.jpg` | Neptune | Voyager 2 disc with the Great Dark Spot |
| `2k_pluto.jpg` | Pluto | NASA New Horizons global colour mosaic (public domain); far south filled in |
| `2k_stars_milky_way.jpg` | Milky Way | ESO panoramic background, unwrapped as a sky sphere |

## Maps the app works out for itself

These have no downloaded file: they are built in the browser from the map above
or from published measurements.

- `earthRoughness` — ocean-versus-land roughness, derived from the day map. Glassy water
  and dusty land are what put the sun glint on the oceans.
- `uranusRings` — Uranus’s nine narrow rings and its dust sheet, drawn from their published
  radii and normal optical depths (PDS Ring-Moon Systems Node: Showalter & Lissauer 2006;
  Nicholson et al. 2018). No calibrated Voyager ring strip is available in this map set, so
  the measured geometry is painted rather than faked with Saturn’s bands.
- The Sun’s corona, star and comet sprites — soft glows with no photographic counterpart.

Re-fetch with `node tools/fetch-textures.mjs`. If a file is missing the app
paints that body procedurally instead, so it never shows an empty planet.
