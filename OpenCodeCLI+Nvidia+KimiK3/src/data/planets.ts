export type Planet = {
  id: string
  name: string
  type: string
  diameterKm: number
  distanceFromSunKm: number
  orbitalPeriodDays: number
  rotationPeriodHours: number
  moons: number
  temperatureC: number
  color: string
  description: string
  facts: string[]
  didYouKnow: string
}

// Real astronomical data (rounded). Visual sizes/distances in the scene
// are deliberately NOT to scale — see utils/scale.ts.
export const PLANETS: Planet[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'Rocky planet',
    diameterKm: 4879,
    distanceFromSunKm: 57_900_000,
    orbitalPeriodDays: 88,
    rotationPeriodHours: 1407.6,
    moons: 0,
    temperatureC: 167,
    color: '#9c8e84',
    description: 'Mercury is the smallest planet and the closest one to the Sun. It zips around the Sun faster than any other planet!',
    facts: [
      'A year on Mercury is only 88 Earth days long.',
      'Mercury has almost no atmosphere, so its surface is covered in craters.',
      'One day on Mercury (sunrise to sunrise) lasts 176 Earth days!',
    ],
    didYouKnow: 'Even though Mercury is closest to the Sun, it is NOT the hottest planet — Venus is!',
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'Rocky planet',
    diameterKm: 12104,
    distanceFromSunKm: 108_200_000,
    orbitalPeriodDays: 224.7,
    rotationPeriodHours: -5832.5,
    moons: 0,
    temperatureC: 464,
    color: '#e8c37a',
    description: 'Venus is wrapped in thick, glowing clouds. It is the hottest planet in our Solar System — hot enough to melt lead!',
    facts: [
      'Venus spins backwards compared to most planets.',
      'A day on Venus is longer than a year on Venus!',
      'Venus is often called Earth’s “sister planet” because they are almost the same size.',
    ],
    didYouKnow: 'Venus is the brightest planet in our night sky — people sometimes mistake it for a UFO!',
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'Rocky planet',
    diameterKm: 12742,
    distanceFromSunKm: 149_600_000,
    orbitalPeriodDays: 365.25,
    rotationPeriodHours: 23.9,
    moons: 1,
    temperatureC: 15,
    color: '#3f7fd4',
    description: 'Our home! Earth is the only planet we know of with oceans of liquid water — and life everywhere.',
    facts: [
      'Earth is the only planet known to have living things.',
      'About 71% of Earth’s surface is covered by oceans.',
      'Light from the Sun takes about 8 minutes to reach Earth.',
    ],
    didYouKnow: 'Earth is the densest planet in the Solar System — it packs a lot into its size!',
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'Rocky planet',
    diameterKm: 6779,
    distanceFromSunKm: 227_900_000,
    orbitalPeriodDays: 687,
    rotationPeriodHours: 24.6,
    moons: 2,
    temperatureC: -65,
    color: '#c1613b',
    description: 'Mars is the Red Planet! Its red color comes from rusty iron dust covering its surface. Robots and rovers explore it right now.',
    facts: [
      'Mars has the tallest volcano in the Solar System: Olympus Mons, nearly 3 times taller than Mount Everest!',
      'A day on Mars is only a little longer than a day on Earth.',
      'Mars has two tiny moons called Phobos and Deimos.',
    ],
    didYouKnow: 'Sunsets on Mars look BLUE instead of orange!',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'Gas giant',
    diameterKm: 139_820,
    distanceFromSunKm: 778_500_000,
    orbitalPeriodDays: 4331,
    rotationPeriodHours: 9.9,
    moons: 95,
    temperatureC: -110,
    color: '#d8a06a',
    description: 'Jupiter is the giant of the Solar System! It is a huge ball of gas with colorful stripes and a giant storm called the Great Red Spot.',
    facts: [
      'Jupiter is so big that more than 1,000 Earths could fit inside it.',
      'The Great Red Spot is a storm bigger than Earth that has been raging for hundreds of years.',
      'Jupiter has the shortest day of any planet — under 10 hours!',
    ],
    didYouKnow: 'Jupiter’s strong gravity helps protect Earth by pulling in comets and asteroids.',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'Gas giant',
    diameterKm: 116_460,
    distanceFromSunKm: 1_434_000_000,
    orbitalPeriodDays: 10_747,
    rotationPeriodHours: 10.7,
    moons: 146,
    temperatureC: -140,
    color: '#e0c68f',
    description: 'Saturn is famous for its spectacular rings, made of billions of chunks of ice and rock. It is the lightest planet — it could float in a giant bathtub!',
    facts: [
      'Saturn’s rings are mostly made of ice and rock.',
      'The rings are huge — up to 282,000 km wide — but in places only about 10 meters thick!',
      'Saturn has more moons than any other planet.',
    ],
    didYouKnow: 'Saturn is less dense than water. If you had a big enough ocean, Saturn would float!',
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'Ice giant',
    diameterKm: 50_724,
    distanceFromSunKm: 2_871_000_000,
    orbitalPeriodDays: 30_589,
    rotationPeriodHours: -17.2,
    moons: 28,
    temperatureC: -195,
    color: '#9fd8dd',
    description: 'Uranus is a pale blue-green ice giant that spins on its side, like a rolling ball going around the Sun!',
    facts: [
      'Uranus is tilted about 98 degrees — it orbits the Sun on its side.',
      'It is very cold: the coldest planetary atmosphere in the Solar System.',
      'Uranus was the first planet discovered with a telescope.',
    ],
    didYouKnow: 'Because Uranus rolls on its side, each pole gets about 21 years of sunlight, then 21 years of darkness!',
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'Ice giant',
    diameterKm: 49_244,
    distanceFromSunKm: 4_495_000_000,
    orbitalPeriodDays: 59_800,
    rotationPeriodHours: 16.1,
    moons: 16,
    temperatureC: -200,
    color: '#3f66d4',
    description: 'Neptune is the farthest planet from the Sun — a deep blue, windy world with the fastest winds in the Solar System!',
    facts: [
      'Neptune’s winds can blow faster than 2,000 km/h — faster than the speed of sound on Earth!',
      'One year on Neptune lasts 165 Earth years.',
      'Neptune was found with math before anyone saw it through a telescope.',
    ],
    didYouKnow: 'Since its discovery in 1846, Neptune has completed only about one full trip around the Sun!',
  },
]

export const SUN_INFO = {
  name: 'The Sun',
  type: 'Star (G-type main-sequence)',
  diameterKm: 1_392_700,
  temperatureC: 5505,
  description: 'The Sun is a star — a giant ball of hot gas. Deep inside, it smashes hydrogen atoms together (nuclear fusion), which releases enormous amounts of light and heat. Its gravity holds the whole Solar System together!',
  facts: [
    'The Sun contains 99.86% of all the mass in the Solar System.',
    'About 1.3 million Earths could fit inside the Sun.',
    'The Sun is about 4.6 billion years old.',
  ],
}
