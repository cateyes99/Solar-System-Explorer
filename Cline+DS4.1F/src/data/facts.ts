import type { AstronomyFact } from '../types'

/**
 * A pool of bite-sized astronomy facts used by the "Teach Me Something!"
 * random-fact card. All statements are standard, well-established astronomy.
 */
export const FACTS: AstronomyFact[] = [
  { id: 'f01', category: 'space', text: 'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.' },
  { id: 'f02', category: 'planets', text: 'A day on Venus is longer than a whole year on Venus.' },
  { id: 'f03', category: 'planets', text: 'Jupiter is so big that more than 1,000 Earths could fit inside it.' },
  { id: 'f04', category: 'planets', text: 'Saturn’s rings are mostly made of ice and rock, from grains of sand to chunks as big as houses.' },
  { id: 'f05', category: 'planets', text: 'Jupiter’s Great Red Spot is a storm that has been swirling for centuries.' },
  { id: 'f06', category: 'moons', text: 'Jupiter’s moon Ganymede is bigger than the planet Mercury.' },
  { id: 'f07', category: 'space', text: 'If the Sun were the size of a basketball, Earth would be a grain of sand about 27 metres away.' },
  { id: 'f08', category: 'planets', text: 'Neptune’s winds blow faster than 2,000 km/h — the fastest in the Solar System.' },
  { id: 'f09', category: 'stars', text: 'The Sun is so large that 1.3 million Earths could fit inside it.' },
  { id: 'f10', category: 'space', text: 'Space is completely silent because sound needs air to travel through.' },
  { id: 'f11', category: 'planets', text: 'Uranus spins on its side, so it looks like it is rolling around the Sun.' },
  { id: 'f12', category: 'moons', text: 'The Moon drifts about 3.8 cm farther from Earth each year.' },
  { id: 'f13', category: 'planets', text: 'Mercury has almost no atmosphere, so it cannot trap heat. Its days are roasting and its nights are freezing.' },
  { id: 'f14', category: 'moons', text: 'Saturn’s moon Enceladus shoots geysers of icy water into space.' },
  { id: 'f15', category: 'planets', text: 'A spacecraft would need about 5 years to reach Jupiter and 12 years to reach Neptune.' },
  { id: 'f16', category: 'space', text: 'The asteroid belt has millions of rocks, but they are so spread out that spacecraft fly through safely.' },
  { id: 'f17', category: 'history', text: 'People have watched the planets for thousands of years — ancient stargazers called them “wandering stars”.' },
  { id: 'f18', category: 'space', text: 'Weight is different on every world. You would jump about 2.6 times higher on Mars than on Earth.' },
  { id: 'f19', category: 'stars', text: 'The Sun is a star, and it is the closest star to Earth by far. The next closest is over 4 light-years away.' },
  { id: 'f20', category: 'planets', text: 'Venus is the hottest planet at about 464 °C, even though Mercury is closer to the Sun.' },
  { id: 'f21', category: 'moons', text: 'Mars has two tiny moons, Phobos and Deimos. They look like lumpy potatoes.' },
  { id: 'f22', category: 'space', text: 'It takes sunlight about 4 hours and 10 minutes to reach Neptune.' },
  { id: 'f23', category: 'planets', text: 'Saturn is so light for its size that it would float in a giant bathtub of water.' },
  { id: 'f24', category: 'history', text: 'In 1969, Apollo 11 astronauts became the first people to walk on the Moon.' },
  { id: 'f25', category: 'space', text: 'Earth travels around the Sun at about 107,000 km/h — that is roughly 30 km every second.' },
  { id: 'f26', category: 'moons', text: 'Titan, Saturn’s biggest moon, has lakes and rivers — but they are made of liquid methane.' },
  { id: 'f27', category: 'planets', text: 'Olympus Mons on Mars is about 22 km tall, nearly three times the height of Mount Everest.' },
  { id: 'f28', category: 'space', text: 'A comet’s tail always points away from the Sun, because sunlight and solar wind push it outward.' },
  { id: 'f29', category: 'stars', text: 'The Sun turns about 600 million tonnes of hydrogen into helium every single second.' },
  { id: 'f30', category: 'space', text: 'If you could drive a car to the Sun at 100 km/h, the trip would take about 170 years.' },
]

/** Returns a random fact, avoiding an immediate repeat when possible. */
export function pickFact(previousIndex: number): number {
  if (FACTS.length <= 1) return 0
  let index = Math.floor(Math.random() * FACTS.length)
  while (index === previousIndex) {
    index = Math.floor(Math.random() * FACTS.length)
  }
  return index
}