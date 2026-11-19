# World map data credits

The optional **World map** layer (national boundaries, regional boundaries,
country names, national and state/provincial capitals, and major cities —
including every city of a million people or more) is built from **Natural
Earth** vector data.

- Source: [Natural Earth](https://www.naturalearthdata.com/), from the
  project’s own vector repository (`nvkelso/natural-earth-vector`).
- Licence: **public domain** — "No permission is needed to use Natural Earth.
  Crediting the authors is unnecessary." Attribution is given here anyway.
- Layers: `admin_0_boundary_lines_land` (national borders),
  `admin_1_states_provinces_lines` (regional borders), `admin_0_countries`
  (country names and their label points) and `populated_places` (national and
  state/provincial capitals, and cities of every size).
- State/provincial capitals are the `Admin-1 capital`, `Admin-1 region capital`
  and `Admin-0 region capital` classes in `populated_places`; cities with a
  population of at least one million are named too. The provincial seats come
  first, with the million-plus cities at the closest zoom.
- Projection: WGS84 geographic (longitude/latitude), the same equirectangular
  layout as the surface maps, so the overlay lines up with the continents.
- Place names carry Natural Earth’s localized names (`NAME_ZH`), so the city
  labels follow the interface language; the English/ASCII name is kept as a
  fallback for any place without one.
- National borders and cities ship at two detail levels: 1:110m (low graphics
  tier) and 1:50m (medium and high). Regional borders ship at 1:10m, the only
  scale with worldwide coverage. Regenerate with `node tools/fetch-geo.mjs`.
- Country and city names ship in English and Simplified Chinese (Natural
  Earth’s `NAME_ZH`), so the map labels follow the interface language.

## Files

| File | Contents |
| --- | --- |
| `borders-110.json` | National borders (1:110m) |
| `borders-50.json` | National borders (1:50m) |
| `countries-110.json` | Country names (1:110m) |
| `countries-50.json` | Country names (1:50m) |
| `regions.json` | Regional borders (1:10m, worldwide) |
| `places-110.json` | Capitals and cities (1:110m) |
| `places-50.json` | Capitals and cities (1:50m) |

City population figures are Natural Earth's metro-area estimates, used only
to rank and size the markers; they are not census data.
