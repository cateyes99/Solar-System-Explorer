import type { LessonId } from '../types'

export interface LessonStep {
  title: string
  body: string
}

/** Icon keys resolved by the UI `<Icon>` component. */
export type LessonIcon = 'sun' | 'sizes' | 'distances' | 'gravity' | 'seasons' | 'moon' | 'orbit'

export interface LessonDef {
  id: LessonId
  title: string
  kicker: string
  icon: LessonIcon
  summary: string
  controls?: 'sizes' | 'gravity' | 'seasons' | 'moon-phases' | 'distances'
  steps: LessonStep[]
  takeaway: string
}

export const LESSONS: LessonDef[] = [
  {
    id: 'sun',
    title: 'The Sun',
    kicker: 'Lesson 1',
    icon: 'sun',
    summary: 'What the Sun is, why it shines, and how it holds everything in orbit.',
    steps: [
      {
        title: 'A star, not a lamp',
        body: 'The Sun is a star: a giant sphere of gas, about 1.4 million kilometres wide. If it were a beach ball, Earth would be a peppercorn about 30 m away.',
      },
      {
        title: 'Why it shines',
        body: 'The Sun is so heavy that its core is squeezed to 15 million °C. Hydrogen atoms are crushed together and fuse into helium, and that fusion spills out light and heat.',
      },
      {
        title: 'Four million tonnes a second',
        body: 'About 600 million tonnes of hydrogen turn into helium every second. The Sun is converting 0.7% of its mass into energy — and it has only used 13% of its fuel so far.',
      },
      {
        title: 'The gravity anchor',
        body: 'The Sun’s gravity is so strong that every planet is pulled into an orbit — a falling path that keeps missing the Sun. That is what an orbit really is.',
      },
    ],
    takeaway:
      'The Sun is 99.86% of the Solar System’s mass. Everything else is a rounding error orbiting it.',
  },
  {
    id: 'sizes',
    title: 'Planet Sizes',
    kicker: 'Lesson 2',
    icon: 'sizes',
    summary: 'Line the planets up side by side and see how different they really are.',
    controls: 'sizes',
    steps: [
      {
        title: 'Two worlds of planets',
        body: 'Four rocky planets sit close to the Sun: Mercury, Venus, Earth and Mars. Four giants — Jupiter, Saturn, Uranus and Neptune — are much further out and much, much bigger.',
      },
      {
        title: 'Jupiter is the giant',
        body: 'Jupiter is 11 times wider than Earth. More than 1,300 Earths could fit inside it. Everything else in the Solar System combined would not fill even half of Jupiter.',
      },
      {
        title: 'And the Sun dwarfs them all',
        body: 'The Sun is 109 Earths across. In this app the sizes are squashed so you can see everything — switch to Relative Size in the Scale panel to see the true proportions.',
      },
    ],
    takeaway: 'If Earth were a peppercorn, Jupiter would be a beach ball and the Sun a giant orange.',
  },
  {
    id: 'distances',
    title: 'Planet Distances',
    kicker: 'Lesson 3',
    icon: 'distances',
    summary: 'How far each planet really is — and how long light takes to get there.',
    controls: 'distances',
    steps: [
      {
        title: 'Mostly empty',
        body: 'Astronomers use a unit called an AU — one AU is the distance from Earth to the Sun, about 150 million km. Neptune is 30 AU away. That is 4.5 billion km.',
      },
      {
        title: 'The inner huddle',
        body: 'Four planets crowd inside 2 AU. Mercury takes just 88 days to race around, while Neptune needs 165 years for the same trip.',
      },
      {
        title: 'Light is slow at this scale',
        body: 'Sunlight takes 8 minutes to reach Earth but over 4 hours to reach Neptune. When you look at Neptune you see it as it was four hours ago.',
      },
    ],
    takeaway: 'The Solar System is mostly nothing. If the Sun were a beach ball on a football pitch, Neptune would sit at the far goal line.',
  },
  {
    id: 'gravity',
    title: 'Gravity',
    kicker: 'Lesson 4',
    icon: 'gravity',
    summary: 'Build gravity wells with stars and black holes and watch orbits change.',
    controls: 'gravity',
    steps: [
      {
        title: 'Mass bends space',
        body: 'Anything with mass pulls on everything else. The more mass an object has, the stronger its pull. The Sun is so massive that Earth falls towards it but keeps missing.',
      },
      {
        title: 'Speed matters too',
        body: 'Orbit is a balance between falling in and sailing past. Go too slow and you crash; go too fast and you fly off into deep space. Planets have had billions of years to settle into a balance.',
      },
      {
        title: 'Try it yourself',
        body: 'Add mass to the central star and watch the orbit shrink. Drop a black hole in and watch the orbit collapse completely.',
      },
    ],
    takeaway: 'Gravity does not push planets in circles. It pulls them straight at the Sun — and they keep missing.',
  },
  {
    id: 'day-night',
    title: 'Day and Night',
    kicker: 'Lesson 5',
    icon: 'sun',
    summary: 'Why Earth has a day, and where the night comes from.',
    steps: [
      {
        title: 'Earth spins',
        body: 'Earth rotates once every 23 hours 56 minutes. Every place on the planet is carried from sunlight into shadow and back again, once a day.',
      },
      {
        title: 'One side at a time',
        body: 'The Sun is enormous and far away, so it lights one half of Earth at a time. The curve between day and night is called the terminator.',
      },
      {
        title: 'Tilted days',
        body: 'Because Earth’s axis is tilted 23.4°, some places catch more or less sunlight through the year — that is what makes seasons.',
      },
    ],
    takeaway: 'The Sun never sets for the North Pole in summer, and never rises for six months.',
  },
  {
    id: 'seasons',
    title: 'Seasons',
    kicker: 'Lesson 6',
    icon: 'seasons',
    summary: 'Earth’s tilt is the whole story. Drag the orbit and watch the seasons turn.',
    controls: 'seasons',
    steps: [
      {
        title: 'It is not distance',
        body: 'A common surprise: the Northern Hemisphere’s summer happens when Earth is furthest from the Sun. Distance is not what causes seasons.',
      },
      {
        title: 'Tilt is the reason',
        body: 'Earth’s axis leans 23.4° all year. In June the Northern Hemisphere leans towards the Sun and gets long, high days; in December it leans away and gets short, low days.',
      },
      {
        title: 'Both hemispheres',
        body: 'While it is summer up north it is winter down south, because both hemispheres lean in opposite directions at the same time.',
      },
    ],
    takeaway: 'Australia celebrates Christmas in summer, because the Southern Hemisphere is tilted the other way.',
  },
  {
    id: 'moon-phases',
    title: 'Moon Phases',
    kicker: 'Lesson 7',
    icon: 'moon',
    summary: 'The Moon is always lit on one side. Watch the phases appear as it travels.',
    controls: 'moon-phases',
    steps: [
      {
        title: 'No shape change',
        body: 'The Moon does not really change shape. The Sun always lights one half, and as the Moon travels around Earth we see different amounts of that lit half.',
      },
      {
        title: 'The main five',
        body: 'New Moon (hidden), Crescent (a sliver), First Quarter (half), Gibbous (more than half), Full Moon (all of it).',
      },
      {
        title: 'The timing',
        body: 'A full Moon rises at sunset and sets at sunrise. A new Moon rises at sunrise and is invisible against the Sun.',
      },
    ],
    takeaway: 'We always see the same face of the Moon because it spins exactly once per orbit.',
  },
  {
    id: 'orbits',
    title: 'Orbits',
    kicker: 'Lesson 8',
    icon: 'orbit',
    summary: 'Why planets never fall into the Sun — the easiest lesson in space.',
    steps: [
      {
        title: 'Falling sideways',
        body: 'Imagine throwing a ball across Earth. It lands. Throw it fast enough and it sails off the curve of the planet and comes back later — it is orbiting.',
      },
      {
        title: 'Falling around',
        body: 'Planets do the same thing around the Sun. Every moment they are being pulled in, but they are also moving sideways fast enough to keep missing. Gravity supplies the bend.',
      },
      {
        title: 'All the same direction',
        body: 'Every planet orbits the same way — counter-clockwise seen from above the Sun’s north pole — because they all formed from one spinning cloud of dust.',
      },
    ],
    takeaway: 'An orbit is freefall that keeps missing. Spacecraft use the same trick to reach other planets.',
  },
]

export const LESSON_BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l])) as Record<
  LessonId,
  LessonDef
>