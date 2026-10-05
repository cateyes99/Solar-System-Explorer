export type Planet = {
  id: string;
  name: string;
  type: string;
  emoji: string;
  diameterKm: number;
  distanceFromSunKm: number; // million km stored as million? use 10^6 km
  distanceAU: number;
  orbitalPeriodDays: number;
  rotationPeriodHours: number;
  /** Axial tilt in degrees (real values; Venus listed as 2.6 with retrograde spin = true 177.4°). */
  tiltDeg: number;
  moons: number;
  temperatureC: string;
  color: string;
  accentColor: string;
  description: string; // kid-friendly
  facts: string[];
  didYouKnow: string;
};

export const SUN = {
  id: 'sun',
  name: 'Sun',
  type: 'Star',
  emoji: '☀️',
  diameterKm: 1_392_700,
  description:
    'The Sun is a giant glowing star. It is so big that 1.3 million Earths could fit inside it! It holds all the planets with its gravity and gives us light and warmth.',
  facts: [
    'The Sun is 4.6 billion years old.',
    'Light from the Sun takes about 8 minutes to reach Earth.',
    'The Sun is 99.8% of all the stuff in the whole Solar System!',
    'Inside the Sun it is about 15 million °C — hotter than anything you can imagine.',
  ],
  didYouKnow:
    'The Sun shines because it squeezes tiny pieces called hydrogen together — like a never-ending super-hug called fusion!',
};

export const MOON = {
  id: 'moon',
  name: 'Moon',
  type: "Earth's moon",
  emoji: '🌙',
  diameterKm: 3474,
  description:
    'The Moon is Earth’s best friend in space! It circles us about once a month, pulls on our oceans to make tides, and always shows us the same face — the “far side” is hidden from view.',
  facts: [
    'The Moon is about 384,400 km away — the farthest place humans have ever visited.',
    'Footprints on the Moon could last millions of years — there is no wind to blow them away.',
    'The Moon is slowly drifting away from Earth, about 3.8 cm every year.',
  ],
  didYouKnow: 'The Moon makes the oceans rise and fall — that sloshing is called tides!',
};

export const HALLEY = {
  id: 'halley',
  name: "Halley's Comet",
  type: 'Comet',
  emoji: '☄️',
  description:
    'Halley’s Comet is the most famous comet of all! It is a giant dirty snowball that dives close past the Sun and then zooms far beyond Neptune — and it travels BACKWARDS compared to the planets! Mark Twain was born with it in 1835 and died with its return in 1910.',
  facts: [
    'Halley visits the inner Solar System every 75–76 years — it was last here in 1986.',
    'Its next visit is in 2061 — start counting down!',
    'Its tail always points AWAY from the Sun, blown by solar wind.',
    'Its icy heart is about 15 km long — the size of a city!',
    'Its surface is darker than charcoal — it reflects only 4% of sunlight!',
    'Its potato shape was mapped from Giotto spacecraft photos taken in 1986!',
  ],
  didYouKnow: 'Halley’s tail grows millions of kilometers long near the Sun — then it fades away into the dark!',
};

export const PLANETS: Planet[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'Rocky planet',
    emoji: '☿',
    diameterKm: 4879,
    distanceFromSunKm: 57.9,
    distanceAU: 0.39,
    orbitalPeriodDays: 88,
    rotationPeriodHours: 1407.6,
    tiltDeg: 0.03,
    moons: 0,
    temperatureC: '-180 to 430°C',
    color: '#9c8e82',
    accentColor: '#b8a99a',
    description:
      'Mercury is the smallest planet and the closest to the Sun. It races around the Sun faster than any other planet — one whole year in just 88 days!',
    facts: [
      'A year on Mercury is only 88 Earth days.',
      'Mercury has almost no air, so the sky would look black even in daytime.',
      'Its surface is covered in craters, like our Moon.',
    ],
    didYouKnow: 'Even though Mercury is closest to the Sun, ice hides in its shadowy craters!',
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'Rocky planet',
    emoji: '♀',
    diameterKm: 12_104,
    distanceFromSunKm: 108.2,
    distanceAU: 0.72,
    orbitalPeriodDays: 225,
    rotationPeriodHours: -5832.5,
    tiltDeg: 2.6,
    moons: 0,
    temperatureC: '465°C',
    color: '#e8c97a',
    accentColor: '#f5d78e',
    description:
      'Venus is wrapped in thick golden clouds. Those clouds trap heat like a blanket, making Venus the hottest planet — hot enough to melt metal!',
    facts: [
      'A day on Venus is longer than its year!',
      'Venus spins backwards compared to most planets.',
      'Its clouds are made of stinky acid — yuck!',
    ],
    didYouKnow: 'A day on Venus (243 Earth days) is longer than its year (225 days)!',
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'Rocky planet · Our home',
    emoji: '🌍',
    diameterKm: 12_742,
    distanceFromSunKm: 149.6,
    distanceAU: 1.0,
    orbitalPeriodDays: 365.25,
    rotationPeriodHours: 23.9,
    tiltDeg: 23.4,
    moons: 1,
    temperatureC: 'Average 15°C',
    color: '#3b82f6',
    accentColor: '#60a5fa',
    description:
      'Earth is our home — the only planet with oceans, trees, animals, and you! It sits in the “just right” zone: not too hot, not too cold.',
    facts: [
      '71% of Earth is covered in oceans.',
      'Earth is the only planet known to have life.',
      'Our air, water, and magnetic field protect us from space.',
    ],
    didYouKnow: 'Hello, Earth! You live on the only planet that has pizza. As far as we know.',
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'Rocky planet',
    emoji: '♂',
    diameterKm: 6779,
    distanceFromSunKm: 227.9,
    distanceAU: 1.52,
    orbitalPeriodDays: 687,
    rotationPeriodHours: 24.6,
    tiltDeg: 25.2,
    moons: 2,
    temperatureC: 'Average -63°C',
    color: '#e2592b',
    accentColor: '#f97316',
    description:
      'Mars is the red planet! Its dust is rusty, like an old bicycle left in the rain. It has the tallest volcano and the longest canyon in the Solar System.',
    facts: [
      'Mars has 2 tiny moons: Phobos and Deimos.',
      'Olympus Mons on Mars is 3× taller than Mount Everest.',
      'Robots like Perseverance drive around on Mars right now!',
    ],
    didYouKnow: 'Sunsets on Mars look BLUE instead of orange!',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'Gas giant',
    emoji: '♃',
    diameterKm: 139_820,
    distanceFromSunKm: 778.5,
    distanceAU: 5.2,
    orbitalPeriodDays: 4333,
    rotationPeriodHours: 9.9,
    tiltDeg: 3.1,
    moons: 95,
    temperatureC: 'Average -110°C',
    color: '#d8a06a',
    accentColor: '#fbbf24',
    description:
      'Jupiter is the KING of planets — so big that more than 1,000 Earths could fit inside it! Its Great Red Spot is a storm bigger than Earth that has raged for hundreds of years.',
    facts: [
      'Jupiter is the largest planet in our Solar System.',
      'One day on Jupiter is only 10 hours — it spins super fast!',
      'Its moon Europa may hide an ocean under its ice.',
    ],
    didYouKnow: 'Jupiter is so big that more than 1,000 Earths could fit inside it!',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'Gas giant · Ringed wonder',
    emoji: '♄',
    diameterKm: 116_460,
    distanceFromSunKm: 1434,
    distanceAU: 9.58,
    orbitalPeriodDays: 10_759,
    rotationPeriodHours: 10.7,
    tiltDeg: 26.7,
    moons: 146,
    temperatureC: 'Average -140°C',
    color: '#e6cf9e',
    accentColor: '#fde68a',
    description:
      'Saturn wears the most beautiful rings in the Solar System! They are made of billions of pieces of ice and rock — from tiny grains to chunks as big as a house.',
    facts: [
      'Saturn’s rings are mostly made of ice and rock.',
      'Saturn has 146 moons — the most of any planet!',
      'Saturn is so light it would float in a giant bathtub!',
    ],
    didYouKnow: 'Saturn’s rings are super thin — only about 10 meters thick in places, like a sheet of paper held across a football field!',
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'Ice giant',
    emoji: '♅',
    diameterKm: 50_724,
    distanceFromSunKm: 2871,
    distanceAU: 19.2,
    orbitalPeriodDays: 30_687,
    rotationPeriodHours: -17.2,
    tiltDeg: 97.8,
    moons: 28,
    temperatureC: 'Average -195°C',
    color: '#7dd3d8',
    accentColor: '#67e8f9',
    description:
      'Uranus is a chilly blue-green world that rolls around the Sun on its side — like a bowling ball! It is the coldest planet atmosphere ever measured.',
    facts: [
      'Uranus spins on its side with a tilt of 98°.',
      'It was the first planet found with a telescope, in 1781.',
      'Methane gas gives Uranus its pretty blue-green color.',
    ],
    didYouKnow: 'Uranus rolls around the Sun sideways, like a ball rolling around a circle!',
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'Ice giant',
    emoji: '♆',
    diameterKm: 49_244,
    distanceFromSunKm: 4495,
    distanceAU: 30.1,
    orbitalPeriodDays: 60_190,
    rotationPeriodHours: 16.1,
    tiltDeg: 28.3,
    moons: 16,
    temperatureC: 'Average -200°C',
    color: '#4f6df5',
    accentColor: '#818cf8',
    description:
      'Neptune is the farthest planet — a deep-blue world with the fastest winds anywhere: up to 2,000 km/h! It takes 165 Earth years to orbit the Sun once.',
    facts: [
      'Neptune was found using math before anyone saw it!',
      'Its winds are the fastest in the Solar System.',
      'One Neptune year = 165 Earth years.',
    ],
    didYouKnow: 'Neptune is so far away that it has only finished ONE lap around the Sun since it was discovered in 1846!',
  },
  {
    id: 'pluto',
    name: 'Pluto',
    type: 'Dwarf planet',
    emoji: '♇',
    diameterKm: 2376,
    distanceFromSunKm: 5906,
    distanceAU: 39.5,
    orbitalPeriodDays: 90560,
    rotationPeriodHours: -153.3,
    moons: 5,
    temperatureC: 'Average -232°C',
    color: '#d8c2a8',
    accentColor: '#e8d5b5',
    tiltDeg: 122.5,
    description:
      'Tiny Pluto used to be called the 9th planet! In 2006 scientists made it a “dwarf planet” because it is so small — even smaller than our Moon. It has a giant heart-shaped glacier and takes 248 Earth years to orbit the Sun once!',
    facts: [
      'Pluto is smaller than Earth’s Moon!',
      'Pluto has a giant heart of ice called Tombaugh Regio. 💘',
      'Its biggest moon Charon is half Pluto’s size — they dance around each other!',
      'Pluto was discovered in 1930 by Clyde Tombaugh.',
    ],
    didYouKnow: 'Pluto takes 248 years to orbit the Sun — it has not finished even ONE lap since it was discovered!',
  },
];

export const RANDOM_FACTS: string[] = [
  'A day on Venus is longer than a year on Venus.',
  'Jupiter is the largest planet in our Solar System.',
  'Saturn’s rings are mostly made of ice and rock.',
  'Light from the Sun takes about 8 minutes to reach Earth.',
  'Jupiter is so big that more than 1,000 Earths could fit inside it.',
  'There are more stars in space than grains of sand on all Earth’s beaches!',
  'A footstep on the Moon could last millions of years — there is no wind to blow it away.',
  'Saturn would float if you could find a bathtub big enough!',
  'Space is completely silent — sound needs air to travel.',
  'The Sun is 109 times wider than Earth.',
  'Mars sunsets look blue!',
  'One spoonful of a neutron star would weigh billions of tons.',
  'Comets are like dirty snowballs flying through space.',
  'The Moon is slowly drifting away from Earth, about 3.8 cm every year.',
  'Neptune’s winds blow at 2,000 km/h — the fastest in the Solar System!',
  'Earth is the only planet not named after a god.',
];

export type TourStop = {
  target: string; // 'overview' | 'sun' | planet id
  title: string;
  text: string;
  duration: number; // seconds
};

export const TOUR_STOPS: TourStop[] = [
  { target: 'overview', title: 'The Whole Solar System', text: 'Welcome aboard! This is our cosmic neighborhood — one star and eight planets, all held together by gravity.', duration: 6 },
  { target: 'sun', title: 'The Sun — Our Star', text: 'The Sun holds 99.8% of everything here. It shines by squeezing hydrogen together — a super-hug called fusion!', duration: 7 },
  { target: 'mercury', title: 'Mercury — The Speedy One', text: 'Tiny Mercury zooms around the Sun in just 88 days. Blink and you will miss it!', duration: 6 },
  { target: 'venus', title: 'Venus — The Hothouse', text: 'Venus hides under golden clouds that trap heat. It is hotter than a pizza oven — 465°C!', duration: 6 },
  { target: 'earth', title: 'Earth — Our Home', text: 'Blue oceans, green land, white clouds. Earth is the only world known to have life… and ice cream.', duration: 7 },
  { target: 'earth', title: 'The Moon — Our Friend', text: 'The Moon pulls on our oceans to make tides. Watch it circle Earth as we linger here.', duration: 6 },
  { target: 'mars', title: 'Mars — The Red Planet', text: 'Rusty red Mars has the tallest volcano in the Solar System. Robots drive there right now!', duration: 6 },
  { target: 'jupiter', title: 'Jupiter — The Giant', text: 'Behold the king! Over 1,000 Earths could fit inside Jupiter. That red swirl is a storm bigger than Earth.', duration: 7 },
  { target: 'saturn', title: 'Saturn — Ringed Jewel', text: 'Saturn’s rings are billions of glittering ice pieces. They are wide but amazingly thin!', duration: 7 },
  { target: 'uranus', title: 'Uranus — The Sideways Roller', text: 'Uranus rolls around the Sun on its side. It is the coldest, most tilted planet of all.', duration: 6 },
  { target: 'neptune', title: 'Neptune — The Windy Deep', text: 'Far, dark, deep-blue Neptune has supersonic winds of 2,000 km/h. But our journey has one bonus stop…', duration: 6 },
  { target: 'pluto', title: 'Pluto — The Little Heart World', text: 'Tiny Pluto was a planet for 76 years! It wears a giant heart of ice and takes 248 Earth years to circle the Sun once.', duration: 6 },
  { target: 'overview', title: 'Home Again', text: 'Tour complete! Drag to explore, click any planet to learn more, or fly the spacecraft. What will you discover next?', duration: 7 },
];

export type LessonId = 'sun' | 'sizes' | 'distances' | 'gravity' | 'daynight' | 'seasons' | 'moon' | 'orbits';

export const LESSONS: { id: LessonId; title: string; emoji: string; body: string }[] = [
  { id: 'sun', title: 'The Sun', emoji: '☀️', body: 'The Sun is a star — a giant ball of hot glowing gas. It shines because of FUSION: tiny pieces crash together and release light and heat. Its gravity is so strong it keeps all 8 planets circling around it, like an invisible leash!' },
  { id: 'sizes', title: 'Planet Sizes', emoji: '📏', body: 'Planets come in two families: small rocky ones (Mercury → Mars) and huge gas/ice giants (Jupiter → Neptune). Try the size-comparison below: put Earth next to Jupiter and watch Earth become a tiny marble!' },
  { id: 'distances', title: 'Planet Distances', emoji: '🛰️', body: 'Space is ENORMOUS. If Earth were 1 step from the Sun, Neptune would be 30 steps away! Switch the Scale control to “Distances Emphasized” to feel how lonely the outer planets are.' },
  { id: 'gravity', title: 'Gravity', emoji: '🧲', body: 'Gravity is an invisible pulling force. Heavy things pull harder! Drag the Mass slider below: a heavier Sun holds planets tightly, a lighter Sun lets them drift. Gravity keeps planets moving around the Sun instead of flying away.' },
  { id: 'daynight', title: 'Day & Night', emoji: '🌗', body: 'Day and night happen because Earth SPINS like a top, once every 24 hours. The side facing the Sun has daytime; the other side has nighttime. Click Earth and watch it spin!' },
  { id: 'seasons', title: 'Seasons', emoji: '🍂', body: 'Earth is tilted 23.5° — like a leaning dancer. As Earth travels around the Sun, one half leans toward the Sun (summer!) and half a year later it leans away (winter!). Tilt, not distance, makes seasons.' },
  { id: 'moon', title: 'Moon Phases', emoji: '🌙', body: 'The Moon does not glow by itself — it mirrors sunlight! As it orbits Earth, we see different lit-up shapes: New → Crescent → Quarter → Gibbous → Full. Drag the Moon-phase slider to travel through a month!' },
  { id: 'orbits', title: 'Orbits', emoji: '🔄', body: 'Gravity keeps planets moving around the Sun. They do not fly in a straight line — the Sun’s pull bends their path into a circle (an orbit!). Toggle “Orbit arrows” to see the direction every planet travels.' },
];
