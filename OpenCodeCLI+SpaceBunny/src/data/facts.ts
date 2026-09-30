import type { StarFact } from '../types'

/**
 * "Teach Me Something!" pool. Each fact is verifiable astronomy; we avoid
 * speculation and mark anything that is an estimate.
 */
export const FACTS: StarFact[] = [
  {
    id: 'venus-day',
    level: 'amazing',
    title: 'A day longer than a year',
    body: 'A day on Venus takes 243 Earth days, but Venus only takes 225 days to go around the Sun. On Venus, one day outlasts an entire year!',
  },
  {
    id: 'sun-eight-minutes',
    level: 'easy',
    title: 'Sunlight takes 8 minutes',
    body: 'Light from the Sun needs about 8 minutes and 20 seconds to reach Earth. The sunlight on your face right now left the Sun before you asked the question.',
  },
  {
    id: 'jupiter-size',
    level: 'easy',
    title: 'Jupiter is enormous',
    body: 'Jupiter is so big that more than 1,300 Earths could fit inside it — and it is twice as heavy as every other planet combined.',
  },
  {
    id: 'saturn-rings',
    level: 'easy',
    title: 'Rings of ice and rock',
    body: 'Saturn’s rings are made of billions of pieces of water ice and rock. They are huge across but only about 10 metres thick on average.',
  },
  {
    id: 'sun-mass',
    level: 'amazing',
    title: '99.86% of everything',
    body: 'The Sun holds 99.86% of all the mass in the Solar System. All eight planets, every moon and every comet together make up the rest.',
  },
  {
    id: 'neptune-wind',
    level: 'amazing',
    title: 'Fastest winds in space',
    body: 'Neptune’s winds blow at over 2,000 km/h — faster than the speed of sound here on Earth — even though Neptune is far from the Sun.',
  },
  {
    id: 'saturn-float',
    level: 'easy',
    title: 'Saturn would float',
    body: 'Saturn is less dense than water. In a big enough bathtub, it would bob gently on the surface.',
  },
  {
    id: 'uranus-sideways',
    level: 'easy',
    title: 'Uranus rolls sideways',
    body: 'Uranus is tipped so far over that it rolls around the Sun. Each of its poles gets 42 years of sunlight followed by 42 years of darkness.',
  },
  {
    id: 'moon-drifting',
    level: 'amazing',
    title: 'The Moon is moving away',
    body: 'The Moon drifts about 3.8 cm further from Earth every year. When dinosaurs lived, the day was only about 20 hours long.',
  },
  {
    id: 'mars-day',
    level: 'easy',
    title: 'Mars days are almost like ours',
    body: 'A day on Mars — called a sol — is 24 hours and 37 minutes, only 40 minutes longer than an Earth day.',
  },
  {
    id: 'europa-ocean',
    level: 'amazing',
    title: 'A hidden ocean on Europa',
    body: 'Beneath Europa’s cracked ice is an ocean with twice as much water as all of Earth’s oceans combined.',
  },
  {
    id: 'footprints-moon',
    level: 'easy',
    title: 'Moon footprints stay forever',
    body: 'There is no wind or rain on the Moon, so the footprints left by the Apollo astronauts could stay there for millions of years.',
  },
  {
    id: 'red-dwarf',
    level: 'amazing',
    title: 'Space is mostly empty',
    body: 'If the Sun were a beach ball on a football pitch, Neptune would be the other goal — and the rest of the pitch is empty space.',
  },
  {
    id: 'pluto-year',
    level: 'amazing',
    title: 'Pluto’s year is long',
    body: 'Pluto is so far out that one trip around the Sun takes 248 years. It has not finished its first lap since 1930.',
  },
  {
    id: 'star-colour',
    level: 'easy',
    title: 'Stars are colour-coded',
    body: 'Star colours tell us how hot they are. Blue stars are hottest, red stars are coolest, and our Sun sits in the middle as a yellow-white star.',
  },
  {
    id: 'light-speed',
    level: 'amazing',
    title: 'Light is the speed limit',
    body: 'Nothing in the universe can travel faster than light. It covers 300,000 km in a single second — seven and a half times around Earth.',
  },
  {
    id: 'solar-system-age',
    level: 'easy',
    title: '4.6 billion years old',
    body: 'The Solar System formed about 4.6 billion years ago from a giant cloud of gas and dust. Earth was already 500 million years old when the first life appeared.',
  },
  {
    id: 'mercury-spin',
    level: 'amazing',
    title: 'Mercury’s weird spin',
    body: 'Mercury spins three times for every two trips around the Sun. Astronomers once tried to explain that for over 40 years.',
  },
  {
    id: 'hot-jupiter',
    level: 'easy',
    title: 'Gas giants are not solid',
    body: 'Jupiter and Saturn have no solid surface to stand on. If you dropped in, you would sink into deep hydrogen like walking into a very thick cloud.',
  },
  {
    id: 'diamond-rain',
    level: 'amazing',
    title: 'Diamond rain',
    body: 'On Neptune and Uranus it is cold enough that carbon can crystallise into diamonds, and the planets may have had diamond rain.',
  },
  {
    id: 'solar-prominence',
    level: 'easy',
    title: 'The Sun throws fire',
    body: 'The Sun occasionally throws out enormous arcs of hot gas called prominences. Some are big enough to swallow a dozen Earths.',
  },
  {
    id: 'crater-count',
    level: 'amazing',
    title: 'Mercury is a crater museum',
    body: 'Mercury has no wind or water, so every impact crater it ever had is still there — billions of them, preserved.',
  },
  {
    id: 'grand-canyon',
    level: 'easy',
    title: 'Mars has a huge canyon',
    body: 'Valles Marineris on Mars is 4,000 km long. It would stretch from California all the way to New York.',
  },
  {
    id: 'blue-beauty',
    level: 'easy',
    title: 'Why Earth is blue',
    body: 'Water absorbs red light and bounces blue light back. That is why the oceans look blue from space.',
  },
  {
    id: 'titan-rain',
    level: 'amazing',
    title: 'Rain of liquid methane',
    body: 'Titan, Saturn’s largest moon, has clouds and rain — but the rain is liquid methane, like natural gas.',
  },
  {
    id: 'asteroid-belt',
    level: 'easy',
    title: 'A mostly empty belt',
    body: 'The asteroid belt is so spread out that spacecraft fly through it without ever coming close to a rock.',
  },
  {
    id: 'hottest-coldest',
    level: 'easy',
    title: 'Hottest and coldest',
    body: 'Venus is the hottest planet because of its thick greenhouse atmosphere. Neptune is the coldest — even though it is the furthest away.',
  },
  {
    id: 'one-side-moon',
    level: 'amazing',
    title: 'We always see one face',
    body: 'The Moon takes exactly as long to spin as it does to go around Earth, so from Earth we always see the same half. The far side was only photographed in 1959.',
  },
  {
    id: 'milky-way',
    level: 'amazing',
    title: 'We are inside a galaxy',
    body: 'The whole Solar System sits inside the Milky Way, a spiral galaxy with hundreds of billions of stars. Looking up on a dark night, you are seeing its disk edge-on.',
  },
]

export const DID_YOU_KNOW_QUOTES: { label: string; text: string }[] = [
  {
    label: 'Quick scale check',
    text: 'The Sun is about 109 times wider than Earth — and 333,000 times heavier.',
  },
  {
    label: 'Remember',
    text: 'Distances in space are enormous. The New Horizons probe needed 9 years just to reach Pluto.',
  },
  {
    label: 'Tiny detail',
    text: 'Saturn’s density is lower than water, so Saturn would float in a sufficiently large ocean.',
  },
]