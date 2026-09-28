/**
 * General astronomy facts for the "Teach Me Something!" random fact button.
 * Kept separate from per-planet facts (see `planets.ts`) so the button can
 * surface fun Solar-System-wide trivia rather than repeating planet details.
 */
export const RANDOM_FACTS: string[] = [
  'A day on Venus is longer than a year on Venus.',
  'Jupiter is the largest planet in our Solar System — you could fit every other planet inside it.',
  "Saturn's rings are mostly made of ice and rock, some pieces as small as sugar grains, others as big as houses.",
  'Light from the Sun takes about 8 minutes to reach Earth.',
  'The Solar System is about 4.6 billion years old.',
  'There are more stars in the universe than grains of sand on every beach on Earth.',
  'Neutron stars are so dense that a teaspoon of one would weigh billions of tons.',
  'The footprints left by astronauts on the Moon could last millions of years — there is no wind to blow them away.',
  'One million Earths could fit inside the Sun.',
  'Space is completely silent because sound needs air (or another medium) to travel through.',
  'The largest known volcano in the Solar System is Olympus Mons on Mars.',
  'A full trip around the Sun takes Neptune about 165 Earth years.',
  'The asteroid belt between Mars and Jupiter contains millions of rocky bodies, but they are so spread out that spacecraft usually pass through safely.',
  'Uranus and Neptune are called "ice giants" because they are made mostly of icy materials like water, ammonia, and methane.',
  'Mercury has almost no atmosphere, so its temperature can swing more than 600 degrees Celsius between day and night.',
  'Saturn is so much less dense than water that it would float in a bathtub big enough to hold it.',
  'Some comets take thousands of years to complete a single orbit of the Sun.',
  'The Great Red Spot on Jupiter is a storm larger than Earth that has raged for at least 150 years.',
  'Astronauts grow slightly taller in space because there is no gravity compressing their spine.',
  'Our galaxy, the Milky Way, contains an estimated 100 to 400 billion stars.',
]

export function getRandomFact(excluding?: string): string {
  if (RANDOM_FACTS.length <= 1) return RANDOM_FACTS[0]
  let fact: string
  do {
    fact = RANDOM_FACTS[Math.floor(Math.random() * RANDOM_FACTS.length)]
  } while (fact === excluding)
  return fact
}
