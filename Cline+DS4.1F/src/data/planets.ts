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
  longitudeOfPeriapsisDeg: 0,
  meanLongitudeJ2000Deg: 0,
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

/** The Sun first, then the planets in orbital order, then our Moon and the comet. */
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
  MOON,
  ASTEROID_BELT,
  COMET_CLINE,
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
 */
export const SATELLITES: SatelliteDefinition[] = [
  {
    id: 'phobos',
    name: 'Phobos',
    parentId: 'mars',
    diameterKm: 22.5,
    orbitalRadiusKm: 9_376,
    orbitalPeriodDays: 0.319,
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
    color: '#cfd8e3',
    note: 'Orbits backwards and has icy geysers.',
  },
]

export function satellitesOf(parentId: string): SatelliteDefinition[] {
  return SATELLITES.filter((satellite) => satellite.parentId === parentId)
}