export type BodyId = 'sun' | 'mercury' | 'venus' | 'earth' | 'moon' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune'

export interface CelestialBody {
  id: BodyId
  name: string
  kind: string
  diameter: number
  distanceAU: number
  year: number
  day: number
  moons: string
  temperature: string
  color: string
  radius: number
  orbit: number
  tilt: number
  description: string
  facts: string[]
}

export const bodies: CelestialBody[] = [
  { id: 'sun', name: 'Sun', kind: 'Our home star', diameter: 1392700, distanceAU: 0, year: 0, day: 609.12, moons: 'Not applicable', temperature: '5,500 C surface', color: '#ffb752', radius: 4.1, orbit: 0, tilt: 7.25, description: 'The star at the center of our story. Its light warms every world in our solar system, including the one we call home.', facts: ['The Sun holds about 99.8% of the mass in our solar system.', 'Deep inside the Sun, hydrogen joins together to make helium. This nuclear fusion releases light and heat.', 'Sunlight takes about 8 minutes and 20 seconds to reach Earth.'] },
  { id: 'mercury', name: 'Mercury', kind: 'Terrestrial planet', diameter: 4879, distanceAU: .387, year: 87.97, day: 1407.6, moons: '0', temperature: '-180 to 430 C', color: '#b5aaa1', radius: .55, orbit: 7, tilt: .03, description: 'Small, speedy, and covered in craters. Mercury races around the Sun faster than any other planet.', facts: ['A year on Mercury lasts just 88 Earth days.', 'Without a thick atmosphere to trap heat, Mercury becomes extremely cold at night.', 'Mercury has water ice hidden in permanently shadowed polar craters.'] },
  { id: 'venus', name: 'Venus', kind: 'Terrestrial planet', diameter: 12104, distanceAU: .723, year: 224.7, day: -5832.5, moons: '0', temperature: '464 C average', color: '#e9c18c', radius: .88, orbit: 10, tilt: 177.4, description: 'Wrapped in thick clouds, Venus is the hottest planet. It is almost Earth-sized, but a very different world.', facts: ['A rotation of Venus takes longer than its year.', 'Venus rotates in the opposite direction to most planets.', 'Its thick carbon dioxide atmosphere traps heat in a powerful greenhouse effect.'] },
  { id: 'earth', name: 'Earth', kind: 'Terrestrial planet', diameter: 12742, distanceAU: 1, year: 365.256, day: 23.934, moons: '1', temperature: '15 C average', color: '#69c5eb', radius: .95, orbit: 13.5, tilt: 23.44, description: 'Our little blue home. A world of liquid oceans, swirling clouds, and the only life we have discovered so far.', facts: ['About 71% of Earth is covered by oceans.', 'Earth is the only world where we know life exists. Every person you have ever met lives here.', 'Earth is tilted by about 23.4 degrees. That tilt gives us our seasons.'] },
  { id: 'moon', name: 'Moon', kind: "Earth's natural satellite", diameter: 3474, distanceAU: 1, year: 27.322, day: 655.7, moons: '0', temperature: '-173 to 127 C', color: '#c9cdd0', radius: .26, orbit: 2.1, tilt: 6.68, description: 'Our companion in space. The Moon circles Earth, helps raise ocean tides, and lights up our night sky with reflected sunlight.', facts: ['We always see almost the same side of the Moon because it rotates once per orbit.', 'The Moon has no light of its own. It reflects sunlight.', 'The Moon is slowly moving away from Earth, about 3.8 centimeters each year.'] },
  { id: 'mars', name: 'Mars', kind: 'Terrestrial planet', diameter: 6779, distanceAU: 1.524, year: 686.98, day: 24.623, moons: '2', temperature: '-65 C average', color: '#e38d67', radius: .73, orbit: 17, tilt: 25.19, description: 'A rusty-red world with giant volcanoes, dusty deserts, and clues that rivers flowed here long ago.', facts: ['Olympus Mons on Mars is the tallest volcano in the solar system.', 'Mars has two small moons, Phobos and Deimos.', 'A day on Mars is just a little longer than a day on Earth.'] },
  { id: 'jupiter', name: 'Jupiter', kind: 'Gas giant', diameter: 139820, distanceAU: 5.203, year: 4332.59, day: 9.925, moons: '95+ known', temperature: '-110 C cloud tops', color: '#dcb28f', radius: 2.25, orbit: 23.5, tilt: 3.13, description: 'The giant of our solar system. A world of swirling cloud bands and storms larger than Earth.', facts: ['More than 1,300 Earths could fit inside Jupiter by volume.', 'The Great Red Spot is a huge storm that has been observed for centuries.', 'Jupiter spins in about 10 hours, the shortest day of any planet.'] },
  { id: 'saturn', name: 'Saturn', kind: 'Gas giant', diameter: 116460, distanceAU: 9.537, year: 10759.22, day: 10.656, moons: '270+ known', temperature: '-140 C cloud tops', color: '#e7cf99', radius: 1.85, orbit: 31, tilt: 26.73, description: 'A world with a crown of ice. Saturn is surrounded by countless pieces of ice and rock, forming its magnificent rings.', facts: ['Saturn is less dense than water on average.', 'Its rings are mostly made of ice, with some rock and dust.', 'Saturn takes almost 30 Earth years to orbit the Sun.'] },
  { id: 'uranus', name: 'Uranus', kind: 'Ice giant', diameter: 50724, distanceAU: 19.191, year: 30688.5, day: -17.24, moons: '28+ known', temperature: '-195 C cloud tops', color: '#a0d9dc', radius: 1.27, orbit: 39, tilt: 97.77, description: 'A quiet-looking blue-green giant that rolls around the Sun on its side. Its unusual tilt makes for extreme seasons.', facts: ['Uranus is tilted by about 98 degrees, so it spins almost on its side.', 'Methane gas in its atmosphere absorbs red light and gives it a blue-green color.', 'Uranus has faint rings, too.'] },
  { id: 'neptune', name: 'Neptune', kind: 'Ice giant', diameter: 49244, distanceAU: 30.069, year: 60182, day: 16.11, moons: '16+ known', temperature: '-200 C cloud tops', color: '#598eee', radius: 1.23, orbit: 47, tilt: 28.32, description: 'Cold, blue, and wonderfully wild. Our most distant planet has some of the fastest winds ever measured.', facts: ['Neptune takes about 165 Earth years to travel around the Sun.', 'Winds on Neptune can exceed 2,000 kilometers per hour.', 'Neptune was predicted with mathematics before it was seen through a telescope.'] },
]

export const planets = bodies.filter(body => body.id !== 'sun' && body.id !== 'moon')
export const bodyById = Object.fromEntries(bodies.map(body => [body.id, body])) as Record<BodyId, CelestialBody>
export const allFacts = bodies.flatMap(body => body.facts.map(text => ({ body: body.id, text })))
export const EPOCH = Date.UTC(2026, 8, 26, 12)
export const DAY_MS = 86400000

export const tourStops: { body: BodyId | null; title: string; text: string }[] = [
  { body: null, title: 'A star. Eight worlds. One home.', text: 'Welcome to our solar system. Our journey starts with the star that holds it all together.' },
  ...bodies.map(body => ({ body: body.id, title: body.name === 'Earth' ? 'There is no place like home.' : body.name === 'Saturn' ? 'A thousand rings of wonder.' : `Meet ${body.name}.`, text: body.description })),
  { body: null, title: 'Keep looking up.', text: 'Every world has a story. Your next discovery is only a little curiosity away.' },
]