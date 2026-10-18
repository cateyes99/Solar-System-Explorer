import type { TextureId } from '../data/visuals'

/**
 * Where every surface map comes from.
 *
 * These are real planetary map datasets, not hand-drawn art: they are
 * equirectangular (2:1) photographic / mosaic products built from NASA, JPL and
 * USGS imagery — Blue Marble for Earth, MESSENGER for Mercury, Magellan for the
 * Venusian surface, Viking and MOLA for Mars, Cassini and Voyager for the giant
 * planets, LRO and Clementine for the Moon, and SDO for the Sun.
 *
 * The files live in `public/textures` so the app still runs entirely offline;
 * `tools/fetch-textures.mjs` re-downloads them and writes the full credit table
 * to `public/textures/CREDITS.md`.
 *
 * Everything that has no real counterpart (the Sun's corona glow, the star
 * sprite, the comet sprite, and Uranus's ring strip, which is drawn from the
 * measured ring radii and optical depths instead) is still painted
 * procedurally — and if any file here is missing or fails to decode, the
 * procedural painter for that body is used instead, so a planet can never
 * appear blank.
 */
export interface TextureSource {
  /** File name inside `public/textures`. */
  file: string
  /** Shown on the loading screen while the map decodes. */
  label: string
  /** Human-readable provenance, shown in the credits file. */
  credit: string
}

export const TEXTURE_SOURCES: Partial<Record<TextureId, TextureSource>> = {
  sun: {
    file: '2k_sun.jpg',
    label: 'Reading the Sun’s granulation',
    credit: 'SDO / NASA granulation map',
  },
  mercury: {
    file: '2k_mercury.jpg',
    label: 'Mapping Mercury’s craters',
    credit: 'MESSENGER global mosaic',
  },
  venus: {
    file: '2k_venus_atmosphere.jpg',
    label: 'Peeling back Venus’s clouds',
    credit: 'Venus cloud tops (Mariner 10 / Venus Express)',
  },
  earth: {
    file: '2k_earth_daymap.jpg',
    label: 'Unfolding the Blue Marble',
    credit: 'NASA Blue Marble land and ocean colour',
  },
  earthClouds: {
    file: '2k_earth_clouds.jpg',
    label: 'Rolling out Earth’s real clouds',
    credit: 'Global cloud cover',
  },
  earthNight: {
    file: '2k_earth_nightmap.jpg',
    label: 'Switching on the real city lights',
    credit: 'NASA Black Marble city lights',
  },
  moon: {
    file: '2k_moon.jpg',
    label: 'Surveying the Moon',
    credit: 'LRO / Clementine albedo mosaic',
  },
  mars: {
    file: '2k_mars.jpg',
    label: 'Mapping Mars down to the dust',
    credit: 'Viking / MOLA true-colour mosaic',
  },
  jupiter: {
    file: '2k_jupiter.jpg',
    label: 'Unrolling Jupiter’s belts',
    credit: 'Cassini / Voyager belt-and-zone map',
  },
  saturn: {
    file: '2k_saturn.jpg',
    label: 'Banding Saturn’s skies',
    credit: 'Cassini cloud-deck map',
  },
  saturnRings: {
    file: '2k_saturn_ring_alpha.png',
    label: 'Fitting Saturn’s rings',
    credit: 'Cassini ring optical-depth strip',
  },
  uranus: {
    file: '2k_uranus.jpg',
    label: 'Chilling Uranus',
    credit: 'Voyager 2 disc',
  },
  neptune: {
    file: '2k_neptune.jpg',
    label: 'Sounding Neptune’s winds',
    credit: 'Voyager 2 disc',
  },
  pluto: {
    file: '2k_pluto.jpg',
    label: 'Mapping Pluto’s icy heart',
    credit: 'New Horizons encounter mosaic',
  },
  nebula: {
    file: '2k_stars_milky_way.jpg',
    label: 'Painting the Milky Way',
    credit: 'ESO Milky Way panorama',
  },
}

/** Everything the loader must end up with, procedural or photographic. */
export const TEXTURE_IDS: TextureId[] = [
  'nebula',
  'star',
  'glow',
  'sun',
  'earth',
  'earthClouds',
  'earthNight',
  'earthRoughness',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'saturnRings',
  'uranusRings',
  'uranus',
  'neptune',
  'pluto',
  'comet',
  'cometNucleus',
]
