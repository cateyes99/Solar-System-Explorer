import type { IconName } from '../components/ui/Icon'
import type { WhatIfId } from '../types'

export interface Scenario {
  id: WhatIfId
  icon: IconName
  title: string
  teaser: string
  /** What the scene shows. */
  shows: string[]
  /** What the simulation actually demonstrates. */
  teaches: string[]
}

/** The four hypothetical experiments in the "What If?" mode. */
export const SCENARIOS: Scenario[] = [
  {
    id: 'two-moons',
    icon: 'moon',
    title: 'What if Earth had two moons?',
    teaser: 'Add a second moon on a wider, tilted orbit.',
    shows: [
      'One moon in a close, near-circular orbit — our real Moon.',
      'A second, bigger moon on a wider orbit tilted away from the first.',
    ],
    teaches: [
      "Two moons would tug on Earth from different directions at the same time.",
      "That competing pull would make Earth wobble on its axis more than it already does.",
      "With enough time that wobble scrambles Earth's seasons, so spring and autumn would be much harder to predict.",
    ],
  },
  {
    id: 'earth-jupiter',
    icon: 'sizes',
    title: 'What if Earth were the size of Jupiter?',
    teaser: 'Put the two worlds side by side, at the same true scale.',
    shows: ['Jupiter on the left, Earth enlarged to exactly the same radius.'],
    teaches: [
      'Earth would have to pull in a colossal cloud of hydrogen and helium to reach that size.',
      'That much extra mass would raise its surface gravity enormously — you would feel about 13× heavier.',
      "Surface gravity alone is not enough to hold that much gas, though. Real Jupiter squeezed itself together before the Sun could blow it apart.",
    ],
  },
  {
    id: 'no-sun',
    icon: 'mute',
    title: 'What if the Sun disappeared?',
    teaser: 'Watch gravity stop bending the planets’ paths.',
    shows: [
      'The planets continue forwards in straight lines, no longer curving toward anywhere.',
      'An expanding shell marks how long light takes to get away — gravity travels at the same speed as light.',
    ],
    teaches: [
      'Light would stop arriving almost at once in human terms, so Earth would go dark within about 8 minutes.',
      'But gravitational effects travel at the speed of light too, so the change in the planets’ orbits would also take 8 minutes to reach Earth.',
      'After that, Earth would keep its orbital speed and drift off in a straight line, out of the Solar System entirely.',
    ],
  },
  {
    id: 'no-rotation',
    icon: 'rotate',
    title: 'What if Earth stopped rotating?',
    teaser: 'Spin the axis to a standstill and see what happens.',
    shows: ['One hemisphere locked towards the Sun forever, the other locked in darkness.'],
    teaches: [
      'The half facing the Sun would cook, and the dark half would freeze.',
      'Every other part of Earth would be in permanent twilight — a thin ring of sunrise and sunset that never moves.',
      "In reality a planet stops rotating when something big hits it. Venus is the closest thing we have: it turns backwards, once every 243 days.",
    ],
  },
]

export const SCENARIO_BY_ID = Object.fromEntries(SCENARIOS.map((s) => [s.id, s])) as Record<
  WhatIfId,
  Scenario
>