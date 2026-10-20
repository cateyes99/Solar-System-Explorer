import type { BodyId } from '../types'

export type DiagramId =
  | 'sizes'
  | 'distances'
  | 'gravity'
  | 'daynight'
  | 'seasons'
  | 'moonphases'
  | 'orbits'

export interface Lesson {
  id: string
  title: string
  emoji: string
  tagline: string
  paragraphs: string[]
  diagram?: DiagramId
  focusBody?: BodyId
  /** Extra scene action offered to the child (e.g. switch to the distances scale). */
  action?: 'distances-scale'
}

/** Interactive lessons for the "Explore & Learn" mode. */
export const LESSONS: Lesson[] = [
  {
    id: 'sun',
    emoji: '☀️',
    title: 'The Sun — Our Star',
    tagline: 'Why does the Sun shine?',
    focusBody: 'sun',
    paragraphs: [
      'The Sun is a star — a gigantic ball of super-hot glowing gas. It is the biggest thing in our Solar System: about 1.3 million Earths could fit inside it!',
      'The Sun shines because of something called nuclear fusion. Deep in its heart, it squeezes tiny hydrogen atoms together so hard that they join up to make helium — and releases a huge burst of energy. That energy is sunlight!',
      'Why do planets circle the Sun instead of flying away? Gravity! The Sun is so massive that its invisible pull holds onto every planet, the way you hold onto a ball on a string when you spin it around.',
    ],
  },
  {
    id: 'sizes',
    emoji: '⚖️',
    title: 'Planet Sizes',
    tagline: 'How big is Jupiter, really?',
    diagram: 'sizes',
    paragraphs: [
      'Planets come in wildly different sizes. Try the comparison below — pick two planets and watch them grow next to each other!',
      'Jupiter is the champion: more than 1,000 Earths could fit inside it. But even Jupiter is tiny compared to the Sun, which could hold more than a million Earths!',
      'Mercury is the smallest planet — smaller than some of Jupiter’s moons.',
    ],
  },
  {
    id: 'distances',
    emoji: '📏',
    title: 'Planet Distances',
    tagline: 'How far is far?',
    diagram: 'distances',
    action: 'distances-scale',
    paragraphs: [
      'Space is mostly… space! The planets are separated by enormous, mind-boggling distances.',
      'Light is the fastest thing in the universe, yet sunlight takes about 8 minutes to reach Earth and more than 4 hours to reach Neptune.',
      'If you flew on the fastest spaceship ever built, the trip to Neptune would still take more than 12 years!',
    ],
  },
  {
    id: 'gravity',
    emoji: '🧲',
    title: 'Gravity',
    tagline: 'The invisible pull',
    diagram: 'gravity',
    paragraphs: [
      'Gravity is an invisible force that pulls everything toward everything else. The more mass something has, the stronger its pull.',
      'Try the experiment below: change the mass of the star and watch what happens to the planet’s orbit. More mass means a stronger pull and a faster orbit!',
      'The Sun’s gravity is what keeps all the planets from drifting off into deep space. It is like an invisible leash — gently bending their paths into big loops we call orbits.',
    ],
  },
  {
    id: 'daynight',
    emoji: '🌗',
    title: 'Day & Night',
    tagline: 'Why the Sun rises and sets',
    diagram: 'daynight',
    focusBody: 'earth',
    paragraphs: [
      'The Sun does not actually “rise” or “set” — Earth is spinning! Our planet turns around once every 24 hours.',
      'When your side of Earth faces the Sun, it is daytime. When your side spins into the shadow, it is night.',
      'Watch the little flag in the animation: it swings from day to night as Earth rotates. Try it in the 3D scene too — zoom close to Earth and watch it spin!',
    ],
  },
  {
    id: 'seasons',
    emoji: '🍂',
    title: 'Seasons',
    tagline: 'Why summer follows spring',
    diagram: 'seasons',
    focusBody: 'earth',
    paragraphs: [
      'Earth is slightly tipped over — its axis leans by 23.4 degrees, like a spinning top that tilts.',
      'As Earth travels around the Sun, sometimes the top half leans toward the Sun (summer in the north!), and sometimes it leans away (winter).',
      'Seasons are not about distance — they are about the tilt! When your part of Earth leans toward the Sun, you get longer, warmer days.',
    ],
  },
  {
    id: 'moonphases',
    emoji: '🌙',
    title: 'Moon Phases',
    tagline: 'Why the Moon changes shape',
    diagram: 'moonphases',
    focusBody: 'moon',
    paragraphs: [
      'The Moon does not make its own light — it reflects sunlight, like a mirror.',
      'As the Moon circles Earth every 27 days, we see different amounts of its sunny side: that is why it seems to change shape.',
      'The phases are: New Moon (dark), Crescent, First Quarter (half), Gibbous (almost full), Full Moon — and then back again!',
    ],
  },
  {
    id: 'orbits',
    emoji: '🔁',
    title: 'Orbits',
    tagline: 'Falling around the Sun',
    diagram: 'orbits',
    paragraphs: [
      'Here is a secret: the planets are always falling! But they are also moving sideways — so fast that they keep missing the Sun.',
      'Falling down + moving sideways = looping around forever. That loop is called an orbit.',
      'Gravity provides the pull toward the Sun, while speed keeps the planet travelling forward. Together, they make a perfect cosmic dance. Watch the arrows in the animation!',
    ],
  },
]
