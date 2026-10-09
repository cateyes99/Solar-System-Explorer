import type { CelestialBody, SatelliteDefinition } from '../types'

/**
 * Real (rounded) astronomical data.
 *
 * Sources of truth: NASA/JPL planetary fact sheets and IAU 2015 nominal values.
 * Orbital elements are mean values at epoch J2000.0 and drive an exact two-body
 * ellipse — Kepler's equation is solved for each body every frame — which is
 * accurate enough to show which planet is where, without pretending to be a full
 * VSOP87 ephemeris.
 */
export const SUN: CelestialBody = {
  id: 'sun',
  name: 'Sun',
  kind: 'star',
  type: 'Star (G-type main sequence)',
  diameterKm: 1_392_700,
  distanceFromSunKm: 0,
  orbitalPeriodDays: 0,
  rotationPeriodHours: 609.12,
  semiMajorAxisKm: 0,
  orbitalEccentricity: 0,
  longitudeOfPeriapsisDeg: 0,
  meanLongitudeJ2000Deg: 0,
  orbitalInclinationDeg: 0,
  longitudeOfAscendingNodeDeg: 0,
  axialTiltDeg: 7.25,
  moons: 0,
  temperatureC: 5_505,
  massEarths: 332_946,
  surfaceGravity: 274,
  color: '#ffb347',
  tagline: 'Our very own star',
  description:
    'The Sun is a giant ball of glowing gas that gives us light and warmth. It is so big that about 1.3 million Earths could fit inside it!',
  facts: [
    'The Sun holds 99.8% of all the mass in the Solar System.',
    'Its surface is about 5,500 °C — hot enough to melt any metal.',
    'The Sun is a middle-aged star: about 4.6 billion years old.',
    'Every second it turns 600 million tonnes of hydrogen into helium.',
  ],
  didYouKnow:
    'Sunlight takes about 8 minutes 20 seconds to reach Earth. So you always see the Sun as it was 8 minutes ago!',
}

export const MERCURY: CelestialBody = {
  id: 'mercury',
  name: 'Mercury',
  kind: 'planet',
  type: 'Rocky planet',
  diameterKm: 4_879,
  distanceFromSunKm: 57_910_000,
  orbitalPeriodDays: 87.969,
  rotationPeriodHours: 1_407.6,
  semiMajorAxisKm: 57_910_000,
  orbitalEccentricity: 0.2056,
  longitudeOfPeriapsisDeg: 77.46,
  meanLongitudeJ2000Deg: 252.25,
  // JPL/Standish J2000 element set: inclined 7.00°, node 48.33°.
  orbitalInclinationDeg: 7.00498,
  longitudeOfAscendingNodeDeg: 48.33077,
  axialTiltDeg: 0.03,
  moons: 0,
  temperatureC: 167,
  massEarths: 0.055,
  surfaceGravity: 3.7,
  color: '#a9a29b',
  tagline: 'The speedy little rock',
  description:
    'Mercury is the smallest planet and the closest to the Sun. It zooms around the Sun faster than any other planet — one Mercury year is only 88 days!',
  facts: [
    'A day on Mercury lasts about 59 Earth days.',
    'Its surface is covered in craters, a bit like our Moon.',
    'Mercury has almost no air, so it cannot keep the heat in.',
    'The same spot can be scorching hot in the day and freezing cold at night.',
  ],
  didYouKnow:
    'Mercury is not the hottest planet, even though it is closest to the Sun. Venus is hotter because its thick clouds trap the heat!',
}

export const VENUS: CelestialBody = {
  id: 'venus',
  name: 'Venus',
  kind: 'planet',
  type: 'Rocky planet with thick clouds',
  diameterKm: 12_104,
  distanceFromSunKm: 108_210_000,
  orbitalPeriodDays: 224.701,
  rotationPeriodHours: -5_832.5,
  semiMajorAxisKm: 108_210_000,
  orbitalEccentricity: 0.0068,
  longitudeOfPeriapsisDeg: 131.53,
  meanLongitudeJ2000Deg: 181.98,
  orbitalInclinationDeg: 3.39468,
  longitudeOfAscendingNodeDeg: 76.67984,
  axialTiltDeg: 177.36,
  moons: 0,
  temperatureC: 464,
  massEarths: 0.815,
  surfaceGravity: 8.87,
  color: '#e8cf94',
  tagline: 'Earth’s cloudy twin',
  description:
    'Venus is about the same size as Earth, but its air is a thick blanket of clouds. They trap heat, which makes Venus the hottest planet of all.',
  facts: [
    'Venus is the hottest planet: about 464 °C everywhere, day and night.',
    'It spins backwards compared with almost every other planet.',
    'A single Venus day is longer than its whole year.',
    'Its clouds are made of acid droplets, not water.',
  ],
  didYouKnow:
    'Venus is the brightest planet in our sky. That is why people call it the Morning Star or the Evening Star.',
}

export const EARTH: CelestialBody = {
  id: 'earth',
  name: 'Earth',
  kind: 'planet',
  type: 'Rocky planet with liquid water',
  diameterKm: 12_742,
  distanceFromSunKm: 149_600_000,
  orbitalPeriodDays: 365.256,
  rotationPeriodHours: 23.934,
  semiMajorAxisKm: 149_600_000,
  orbitalEccentricity: 0.0167,
  longitudeOfPeriapsisDeg: 102.95,
  meanLongitudeJ2000Deg: 100.46,
  // The ecliptic is defined by Earth's orbit, so its inclination is ~0.
  orbitalInclinationDeg: 0,
  longitudeOfAscendingNodeDeg: 0,
  axialTiltDeg: 23.44,
  moons: 1,
  temperatureC: 15,
  massEarths: 1,
  surfaceGravity: 9.807,
  color: '#4b9cf5',
  tagline: 'Our home planet',
  description:
    'Earth is the only place we know where life exists. It has oceans of liquid water, air we can breathe, and a blanket of atmosphere that protects us.',
  facts: [
    'About 71% of Earth is covered by water — you can see the blue from space.',
    'Earth spins at about 1,670 km/h at the equator.',
    'Its atmosphere is mostly nitrogen and oxygen.',
    'Earth has seasons because it is tilted, not because it gets closer to the Sun.',
  ],
  didYouKnow:
    'Earth’s magnetic field is an invisible shield that nudges harmful particles from the Sun away from us.',
}

export const MARS: CelestialBody = {
  id: 'mars',
  name: 'Mars',
  kind: 'planet',
  type: 'Rocky planet',
  diameterKm: 6_779,
  distanceFromSunKm: 227_920_000,
  orbitalPeriodDays: 686.98,
  rotationPeriodHours: 24.623,
  semiMajorAxisKm: 227_920_000,
  orbitalEccentricity: 0.0934,
  longitudeOfPeriapsisDeg: 336.06,
  meanLongitudeJ2000Deg: 355.43,
  orbitalInclinationDeg: 1.84969,
  longitudeOfAscendingNodeDeg: 49.55954,
  axialTiltDeg: 25.19,
  moons: 2,
  temperatureC: -65,
  massEarths: 0.107,
  surfaceGravity: 3.71,
  color: '#e0714a',
  tagline: 'The red desert planet',
  description:
    'Mars looks red because its dust is full of rusty iron. It has the biggest volcano and one of the deepest canyons in the Solar System.',
  facts: [
    'Olympus Mons on Mars is about 22 km high — nearly three Everests stacked up.',
    'Mars has two tiny potato-shaped moons: Phobos and Deimos.',
    'Dust storms on Mars can grow big enough to wrap around the whole planet.',
    'Its polar caps are made of frozen water and frozen carbon dioxide.',
  ],
  didYouKnow:
    'Robots are driving around on Mars right now, studying rocks and hunting for signs of ancient water.',
}

export const JUPITER: CelestialBody = {
  id: 'jupiter',
  name: 'Jupiter',
  kind: 'planet',
  type: 'Gas giant',
  diameterKm: 139_820,
  distanceFromSunKm: 778_570_000,
  orbitalPeriodDays: 4_332.59,
  rotationPeriodHours: 9.925,
  semiMajorAxisKm: 778_570_000,
  orbitalEccentricity: 0.0489,
  longitudeOfPeriapsisDeg: 14.75,
  meanLongitudeJ2000Deg: 34.35,
  orbitalInclinationDeg: 1.3044,
  longitudeOfAscendingNodeDeg: 100.47391,
  axialTiltDeg: 3.13,
  moons: 95,
  temperatureC: -110,
  massEarths: 317.8,
  surfaceGravity: 24.79,
  color: '#d8a56b',
  tagline: 'The giant with the big spot',
  description:
    'Jupiter is the largest planet. It is so big that more than 1,000 Earths could fit inside it. Its stripes are giant bands of cloud and stormy gas.',
  facts: [
    'The Great Red Spot is a storm wider than Earth that has raged for centuries.',
    'Jupiter spins faster than any other planet — a day lasts under 10 hours.',
    'It has 95 known moons, and four of them are as big as small planets.',
    'Jupiter is a gas giant: there is no solid ground to stand on.',
  ],
  didYouKnow:
    'Jupiter’s gravity acts like a cosmic goalkeeper, pulling in many comets and asteroids before they reach the inner Solar System.',
}
export const SATURN: CelestialBody = {
  id: 'saturn',
  name: 'Saturn',
  kind: 'planet',
  type: 'Gas giant with rings',
  diameterKm: 116_460,
  distanceFromSunKm: 1_433_530_000,
  orbitalPeriodDays: 10_759.22,
  rotationPeriodHours: 10.656,
  semiMajorAxisKm: 1_433_530_000,
  orbitalEccentricity: 0.0565,
  longitudeOfPeriapsisDeg: 92.43,
  meanLongitudeJ2000Deg: 50.08,
  orbitalInclinationDeg: 2.48599,
  longitudeOfAscendingNodeDeg: 113.66242,
  axialTiltDeg: 26.73,
  moons: 146,
  temperatureC: -140,
  massEarths: 95.16,
  surfaceGravity: 10.44,
  color: '#e3cd9a',
  tagline: 'The ringed jewel',
  description:
    'Saturn is famous for its beautiful rings. They are not solid — they are made of billions of pieces of ice and rock, some as tiny as grains of sand and some as big as houses.',
  facts: [
    'Saturn’s rings stretch about 280,000 km wide but are often only 10 m thick.',
    'Saturn is the least dense planet — it would float in a giant bathtub.',
    'Its moon Titan has lakes and rivers, but of liquid methane instead of water.',
    'Enceladus shoots geysers of icy water into space from under its icy shell.',
  ],
  didYouKnow:
    'Saturn’s rings may be disappearing. Dust and ice slowly rain down onto the planet, so one day the rings could be gone.',
}

export const URANUS: CelestialBody = {
  id: 'uranus',
  name: 'Uranus',
  kind: 'planet',
  type: 'Ice giant',
  diameterKm: 50_724,
  distanceFromSunKm: 2_872_460_000,
  orbitalPeriodDays: 30_685.4,
  rotationPeriodHours: -17.24,
  semiMajorAxisKm: 2_872_460_000,
  orbitalEccentricity: 0.0457,
  longitudeOfPeriapsisDeg: 170.96,
  meanLongitudeJ2000Deg: 314.06,
  orbitalInclinationDeg: 0.77264,
  longitudeOfAscendingNodeDeg: 74.01693,
  axialTiltDeg: 97.77,
  moons: 28,
  temperatureC: -195,
  massEarths: 14.54,
  surfaceGravity: 8.69,
  color: '#9fe3e8',
  tagline: 'The planet on its side',
  description:
    'Uranus is a pale blue-green ice giant that rolls around the Sun like a ball, because it is tipped right over onto its side.',
  facts: [
    'Uranus is tilted about 98°, so it spins lying on its side.',
    'Each pole gets about 42 years of sunlight, then 42 years of darkness.',
    'Methane in its air absorbs red light, which makes it look blue-green.',
    'It was the first planet discovered with a telescope, back in 1781.',
  ],
  didYouKnow:
    'Uranus is the coldest planet, dipping to about -224 °C — even colder than Neptune, which is farther from the Sun.',
}

export const NEPTUNE: CelestialBody = {
  id: 'neptune',
  name: 'Neptune',
  kind: 'planet',
  type: 'Ice giant',
  diameterKm: 49_244,
  distanceFromSunKm: 4_495_060_000,
  orbitalPeriodDays: 60_189,
  rotationPeriodHours: 16.11,
  semiMajorAxisKm: 4_495_060_000,
  orbitalEccentricity: 0.0113,
  longitudeOfPeriapsisDeg: 44.97,
  meanLongitudeJ2000Deg: 304.35,
  orbitalInclinationDeg: 1.77004,
  longitudeOfAscendingNodeDeg: 131.78423,
  axialTiltDeg: 28.32,
  moons: 16,
  temperatureC: -200,
  massEarths: 17.15,
  surfaceGravity: 11.15,
  color: '#4a6bff',
  tagline: 'The windy blue giant',
  description:
    'Neptune is the farthest planet from the Sun. It is deep blue and has the fastest winds of any planet — they blow at more than 2,000 km/h!',
  facts: [
    'Neptune takes about 165 Earth years to orbit the Sun once.',
    'Sunlight there is roughly 900 times dimmer than on Earth.',
    'Its moon Triton orbits backwards and may be a captured world.',
    'Neptune was found with maths before anyone spotted it in a telescope.',
  ],
  didYouKnow:
    'Neptune has completed only about one orbit since it was discovered in 1846 — its first lap finished in 2011!',
}

/**
 * Pluto: round, orbiting the Sun, and far too small to have cleared its lane —
 * a dwarf planet, and for 76 years the ninth planet people had learned at school.
 *
 * Elements are the JPL/Standish J2000 set (a 39.482 au, e 0.2488, i 17.14°,
 * Ω 110.30°, ϖ 224.07°, L 238.93°), which is the same source the planets above
 * use. The orbit is now drawn with that real 17° tilt, and it crosses inside
 * Neptune's path near perihelion.
 */
export const PLUTO: CelestialBody = {
  id: 'pluto',
  name: 'Pluto',
  kind: 'dwarf',
  type: 'Dwarf planet',
  diameterKm: 2_377,
  distanceFromSunKm: 5_906_400_000,
  orbitalPeriodDays: 90_560,
  // Pluto is tipped right over and spins backwards: 122.53° of obliquity.
  rotationPeriodHours: -153.3,
  semiMajorAxisKm: 5_906_400_000,
  orbitalEccentricity: 0.2488,
  longitudeOfPeriapsisDeg: 224.07,
  meanLongitudeJ2000Deg: 238.93,
  orbitalInclinationDeg: 17.14001,
  longitudeOfAscendingNodeDeg: 110.30394,
  axialTiltDeg: 122.53,
  moons: 5,
  // Mean surface temperature: 44 K. New Horizons measured -240 °C in the coldest
  // spots and -218 °C in the warmest.
  temperatureC: -229,
  massEarths: 0.0022,
  surfaceGravity: 0.62,
  color: '#cbb39c',
  tagline: 'The icy world that lost its planet badge',
  description:
    'Pluto is a small, icy world far beyond Neptune — smaller than our own Moon. From 1930 to 2006 it was called the ninth planet. Astronomers then found many more worlds like it, so they gave them a name of their own: dwarf planets.',
  facts: [
    'Pluto is smaller than our Moon: only about 2,377 km across.',
    'Its biggest moon, Charon, is half Pluto’s size, and the two spin around a point between them.',
    'One lap of its orbit takes 248 Earth years, so Pluto has not finished a single lap since it was found in 1930.',
    'In July 2015 the New Horizons spacecraft flew past Pluto and sent back the first close-up pictures.',
  ],
  didYouKnow:
    'Pluto has a bright, heart-shaped plain of nitrogen ice called Tombaugh Regio, after the astronomer who spotted the world in 1930. At about -229 °C that ice is far too cold to melt — it behaves more like rock.',
}

export const MOON: CelestialBody = {
  id: 'moon',
  name: 'The Moon',
  kind: 'moon',
  type: 'Rocky moon of Earth',
  diameterKm: 3_474.8,
  distanceFromSunKm: 149_600_000,
  orbitalPeriodDays: 27.322,
  rotationPeriodHours: 655.72,
  semiMajorAxisKm: 384_400,
  orbitalEccentricity: 0.0549,
  // Mean orbital elements of the Moon about the Earth at J2000.0: inclination
  // 5.145°, node 125.08°, perigee 318.15° (so ϖ = 83.23°) and mean anomaly 135.27°.
  longitudeOfPeriapsisDeg: 83.23,
  meanLongitudeJ2000Deg: 218.5,
  orbitalInclinationDeg: 5.145,
  longitudeOfAscendingNodeDeg: 125.08,
  axialTiltDeg: 6.68,
  moons: 0,
  temperatureC: -20,
  massEarths: 0.0123,
  surfaceGravity: 1.62,
  color: '#c9c6c0',
  tagline: 'Earth’s faithful companion',
  description:
    'The Moon is Earth’s only natural satellite. It travels around us once every 27 days and always shows us the same friendly face.',
  facts: [
    'The Moon always keeps the same side facing Earth.',
    'Its gravity creates the ocean tides here on Earth.',
    'Apollo 11 landed people on the Moon in July 1969.',
    'Astronaut footprints may stay for millions of years — there is no wind up there.',
  ],
  didYouKnow:
    'The Moon drifts about 3.8 cm farther from Earth every year — roughly the speed your fingernails grow!',
  parentId: 'earth',
}

export const COMET_CLINE: CelestialBody = {
  id: 'comet',
  name: 'Comet Cline-1',
  kind: 'comet',
  type: 'Icy comet on a long, stretched orbit',
  diameterKm: 9.4,
  distanceFromSunKm: 1_100_000_000,
  orbitalPeriodDays: 2_190,
  rotationPeriodHours: 14.8,
  semiMajorAxisKm: 1_100_000_000,
  orbitalEccentricity: 0.72,
  longitudeOfPeriapsisDeg: 48,
  meanLongitudeJ2000Deg: 190,
  // Cline-1 is fictional, so its orbit stays a simple, unfitted ellipse.
  orbitalInclinationDeg: 0,
  longitudeOfAscendingNodeDeg: 0,
  axialTiltDeg: 12,
  moons: 0,
  temperatureC: -110,
  massEarths: 0,
  surfaceGravity: 0.004,
  color: '#bff4ff',
  tagline: 'A dusty snowball in the dark',
  description:
    'A comet is a ball of ice, dust and rock left over from when the Solar System was young. When it nears the Sun it grows a glowing tail.',
  facts: [
    'A comet’s tail always points away from the Sun, pushed by light and solar wind.',
    'Comets can be as big as a small town but weigh almost nothing.',
    'Some comets take thousands of years to make one trip around the Sun.',
    'Halley’s Comet visits the inner Solar System about every 76 years.',
  ],
  didYouKnow:
    'You have just discovered Comet Cline-1 — a friendly visitor on a very stretched, elliptical path around the Sun.',
  discoveryToast: 'You found Comet Cline-1! A dusty snowball with a glowing tail.',
}

/**
 * Halley's Comet (1P/Halley): the one that comes back.
 *
 * Elements are the J2000 osculating set (a 17.834 au, e 0.96714, i 162.26°,
 * Ω 58.42°, ϖ 169.75°), anchored to the perihelion it was last seen at — 9 February
 * 1986 — so the comet sits where it really was on the date a child is looking at.
 * Its orbit is retrograde — tipped 162°, so it travels the "wrong" way round, and
 * is drawn that way — while successive returns take anywhere from 74 to 79 years
 * because Jupiter tugs on it, which a single mean ellipse cannot show, so that is
 * explained in the panel instead.
 */
export const COMET_HALLEY: CelestialBody = {
  id: 'halley',
  name: 'Halley’s Comet',
  kind: 'comet',
  type: 'Periodic comet, back about every 76 years',
  // The nucleus is a lumpy potato about 15 km long and 8 km across.
  diameterKm: 11,
  distanceFromSunKm: 2_667_900_000,
  orbitalPeriodDays: 27_511,
  rotationPeriodHours: 52.8,
  semiMajorAxisKm: 2_667_900_000,
  orbitalEccentricity: 0.96714,
  longitudeOfPeriapsisDeg: 169.75,
  meanLongitudeJ2000Deg: 236.2,
  // Halley's orbit is retrograde: inclined 162.26° with its node at 58.42°, so
  // it rounds the Sun the opposite way to every planet.
  orbitalInclinationDeg: 162.2627,
  longitudeOfAscendingNodeDeg: 58.42,
  // The scene applies no tilt to a comet's nucleus (see `Comet.tsx`) and the
  // orientation of Halley's spin axis is not published in the app's terms, so no
  // invented figure is stored here.
  axialTiltDeg: 0,
  moons: 0,
  // A comet has no single temperature. Giotto and the Vega probes measured the
  // sunlit ice at 370–400 K — about 100 °C — as Halley passed the Sun in 1986,
  // while its shaded side stayed far below freezing.
  temperatureC: 100,
  massEarths: 0,
  surfaceGravity: 0.0005,
  color: '#cfe9ff',
  tagline: 'The comet that keeps its promise',
  description:
    'Halley’s Comet is a lump of ice, dust and rock about 15 km long. As it swings close to the Sun the ice turns to gas and it grows a tail millions of kilometres long. It comes back about every 76 years — it is the first comet anyone worked out would return.',
  facts: [
    'In 1705 Edmond Halley predicted his comet would come back, and it did — in 1758, sixteen years after he died.',
    'Halley was last here in 1986 and comes back in 2061. You might be the person who sees it!',
    'Its nucleus is darker than charcoal: it bounces back only 4% of the sunlight that hits it.',
    'Halley orbits the Sun the wrong way round, backwards compared with the planets.',
  ],
  didYouKnow:
    'In 1986 five spacecraft flew out to meet Halley. Europe’s Giotto passed just 596 km from the nucleus and sent back the first close-up pictures of a comet ever taken.',
  discoveryToast:
    'You found Halley’s Comet! The snowball of 1705, last seen in 1986 and due back in 2061.',
}
/** The asteroid belt has a panel of its own, so it is a "body" too. */
export const ASTEROID_BELT: CelestialBody = {
  id: 'belt',
  name: 'Asteroid Belt',
  kind: 'belt',
  type: 'Ring of rocky leftovers',
  diameterKm: 0,
  distanceFromSunKm: 414_000_000,
  orbitalPeriodDays: 1_680,
  rotationPeriodHours: 0,
  semiMajorAxisKm: 414_000_000,
  orbitalEccentricity: 0.08,
  longitudeOfPeriapsisDeg: 0,
  meanLongitudeJ2000Deg: 0,
  orbitalInclinationDeg: 0,
  longitudeOfAscendingNodeDeg: 0,
  axialTiltDeg: 0,
  moons: 0,
  temperatureC: -73,
  massEarths: 0.0005,
  surfaceGravity: 0,
  color: '#cbb89a',
  tagline: 'Leftovers from the beginning of time',
  description:
    'Between Mars and Jupiter there is a wide ring of rocky leftovers from the birth of the Solar System. Its biggest member, the dwarf planet Ceres, is about 940 km across.',
  facts: [
    'There are millions of asteroids here, but they are spread very far apart.',
    'Ceres is so big and round that we call it a dwarf planet.',
    'The belt sits about 2.2 to 3.2 times farther from the Sun than Earth does.',
    'Spacecraft have flown through the belt many times without hitting anything.',
  ],
  didYouKnow:
    'The asteroid belt is not a crowded minefield like in the movies. The rocks are millions of kilometres apart!',
}

/**
 * Every body in the app, in the order they sit out from the Sun: the star, the
 * eight planets, the dwarf planet out past Neptune, our Moon, the belt and the
 * comets.
 */
export const BODIES: CelestialBody[] = [
  SUN,
  MERCURY,
  VENUS,
  EARTH,
  MARS,
  JUPITER,
  SATURN,
  URANUS,
  NEPTUNE,
  PLUTO,
  MOON,
  ASTEROID_BELT,
  COMET_CLINE,
  COMET_HALLEY,
]

/** The eight planets in orbital order. */
export const PLANETS: CelestialBody[] = [
  MERCURY,
  VENUS,
  EARTH,
  MARS,
  JUPITER,
  SATURN,
  URANUS,
  NEPTUNE,
]

/**
 * Every world the scene draws as a sphere: the eight planets and the dwarf planet
 * Pluto, in orbital order.
 */
export const ORBITING_WORLDS: CelestialBody[] = [...PLANETS, PLUTO]

/** The comets: each one an icy visitor on an orbit of its own. */
export const COMETS: CelestialBody[] = [COMET_CLINE, COMET_HALLEY]

export const BODY_BY_ID: Record<string, CelestialBody> = Object.fromEntries(
  BODIES.map((body) => [body.id, body]),
)

export function getBody(id: string): CelestialBody | undefined {
  return BODY_BY_ID[id]
}

/**
 * A curated set of well-known moons so children can see that planets have
 * families of their own. Distances are exaggerated in the 3D scene (see
 * `utils/scale.ts`) because the true ratios are impossible to see on a screen.
 *
 * The orbital elements are real: each moon's inclination is measured against the
 * ecliptic, and because most large moons circle their planet's equator, that
 * inclination follows the planet's own tilt — which is why Titan's path leans and
 * Titania's stands almost upright. Eccentricities are the measured values.
 */
export const SATELLITES: SatelliteDefinition[] = [
  {
    id: 'phobos',
    name: 'Phobos',
    parentId: 'mars',
    diameterKm: 22.5,
    orbitalRadiusKm: 9_376,
    orbitalPeriodDays: 0.319,
    orbitalEccentricity: 0.0151,
    orbitalInclinationDeg: 25.19,
    color: '#9b8f86',
    note: 'Races around Mars three times a day.',
  },
  {
    id: 'deimos',
    name: 'Deimos',
    parentId: 'mars',
    diameterKm: 12.4,
    orbitalRadiusKm: 23_463,
    orbitalPeriodDays: 1.263,
    orbitalEccentricity: 0.00033,
    orbitalInclinationDeg: 25.19,
    color: '#a89b90',
    note: 'Tiny and lumpy, only 12 km across.',
  },
  {
    id: 'io',
    name: 'Io',
    parentId: 'jupiter',
    diameterKm: 3_643,
    orbitalRadiusKm: 421_700,
    orbitalPeriodDays: 1.769,
    orbitalEccentricity: 0.0041,
    orbitalInclinationDeg: 3.13,
    color: '#e8dc7f',
    note: 'The most volcanic world we know.',
  },
  {
    id: 'europa',
    name: 'Europa',
    parentId: 'jupiter',
    diameterKm: 3_122,
    orbitalRadiusKm: 671_034,
    orbitalPeriodDays: 3.551,
    orbitalEccentricity: 0.009,
    orbitalInclinationDeg: 3.13,
    color: '#dcd3c2',
    note: 'Has an ocean of water under an icy crust.',
  },
  {
    id: 'ganymede',
    name: 'Ganymede',
    parentId: 'jupiter',
    diameterKm: 5_268,
    orbitalRadiusKm: 1_070_412,
    orbitalPeriodDays: 7.155,
    orbitalEccentricity: 0.0013,
    orbitalInclinationDeg: 3.13,
    color: '#b9b0a6',
    note: 'The biggest moon in the Solar System.',
  },
  {
    id: 'callisto',
    name: 'Callisto',
    parentId: 'jupiter',
    diameterKm: 4_821,
    orbitalRadiusKm: 1_882_709,
    orbitalPeriodDays: 16.689,
    orbitalEccentricity: 0.0074,
    orbitalInclinationDeg: 3.13,
    color: '#8d8378',
    note: 'The most cratered object we know of.',
  },
  {
    id: 'titan',
    name: 'Titan',
    parentId: 'saturn',
    diameterKm: 5_150,
    orbitalRadiusKm: 1_221_870,
    orbitalPeriodDays: 15.945,
    orbitalEccentricity: 0.0288,
    orbitalInclinationDeg: 26.73,
    color: '#e0a049',
    note: 'Has lakes and rivers of liquid methane.',
  },
  {
    id: 'titania',
    name: 'Titania',
    parentId: 'uranus',
    diameterKm: 1_578,
    orbitalRadiusKm: 435_910,
    orbitalPeriodDays: 8.706,
    // Uranus is tipped 97.8°, so its moons circle it almost pole-to-pole.
    orbitalEccentricity: 0.0011,
    orbitalInclinationDeg: 97.77,
    color: '#b6b2ad',
    note: 'The largest moon of Uranus.',
  },
  {
    id: 'triton',
    name: 'Triton',
    parentId: 'neptune',
    diameterKm: 2_707,
    orbitalRadiusKm: 354_759,
    orbitalPeriodDays: 5.877,
    // Triton is a captured world: its orbit runs backwards, inclined ~130°.
    orbitalEccentricity: 0.000016,
    orbitalInclinationDeg: 130,
    color: '#cfd8e3',
    note: 'Orbits backwards and has icy geysers.',
  },
  {
    id: 'charon',
    name: 'Charon',
    parentId: 'pluto',
    diameterKm: 1_212,
    orbitalRadiusKm: 19_591,
    orbitalPeriodDays: 6.387,
    // Charon orbits in Pluto's tilted equatorial plane (~113° to the ecliptic).
    orbitalEccentricity: 0.0002,
    orbitalInclinationDeg: 112.78,
    color: '#b3aca2',
    note: 'Half the size of Pluto — they circle a point between them.',
  },
]

export function satellitesOf(parentId: string): SatelliteDefinition[] {
  return SATELLITES.filter((satellite) => satellite.parentId === parentId)
}