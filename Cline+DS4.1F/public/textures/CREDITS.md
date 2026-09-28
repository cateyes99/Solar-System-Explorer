# Surface map credits

These images are **not** hand-drawn: they are real planetary map data.

- Source: [Solar System Scope](https://www.solarsystemscope.com/textures/) textures,
  licensed **CC BY 4.0**.
- Derived from public-domain NASA / JPL / USGS imagery (Blue Marble, MESSENGER,
  Magellan, Mariner 10, Viking, Cassini, Voyager 2, LRO, SDO, ESO).
- Format: equirectangular (2:1) colour maps, plus one alpha ring strip.

| File | Body | Provenance |
| --- | --- | --- |
| `2k_sun.jpg` | Sun | Photosphere granulation (SDO/NASA imagery) |
| `2k_mercury.jpg` | Mercury | MESSENGER global mosaic |
| `2k_venus_atmosphere.jpg` | Venus | Cloud tops as seen by Mariner 10 / Venus Express |
| `2k_earth_daymap.jpg` | Earth | Blue Marble: land, ocean and vegetation colour |
| `2k_earth_clouds.jpg` | Earth clouds | Cloud-cover layer (black sky, white cloud) |
| `2k_earth_nightmap.jpg` | Earth at night | City lights (NASA Black Marble) |
| `2k_moon.jpg` | The Moon | LRO / Clementine albedo mosaic |
| `2k_mars.jpg` | Mars | Viking / MOLA true-colour mosaic |
| `2k_jupiter.jpg` | Jupiter | Cassini / Voyager belt-and-zone mosaic |
| `2k_saturn.jpg` | Saturn | Cassini banded cloud deck |
| `2k_saturn_ring_alpha.png` | Saturn rings | Ring optical depth with alpha (C, B, Cassini, A, F) |
| `2k_uranus.jpg` | Uranus | Voyager 2 featureless methane-blue disc |
| `2k_neptune.jpg` | Neptune | Voyager 2 disc with the Great Dark Spot |
| `2k_stars_milky_way.jpg` | Milky Way | ESO panoramic background, unwrapped as a sky sphere |

Re-fetch with `node tools/fetch-textures.mjs`. If a file is missing the app
paints that body procedurally instead, so it never shows an empty planet.
