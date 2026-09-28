import type { WhatIfScenario } from '../types'

/**
 * "What If?" experiments. These are clearly labelled educational simulations:
 * they change one thing at a time so children can reason about the result.
 */
export const WHAT_IF_SCENARIOS: WhatIfScenario[] = [
  {
    id: 'two-moons',
    title: 'What if Earth had two moons?',
    question: 'What would happen if a second Moon appeared next to ours?',
    explanation:
      'A second moon would add its own gravity to the mix. Tides would become much stronger and more complicated, and the two moons would tug on each other. In real life such a pair would slowly drift into very stable or very chaotic paths — nobody can say exactly which without doing the maths.',
    takeaway: 'More moons means more gravity pulling on our oceans — and much wilder tides.',
    emoji: '🌕🌕',
  },
  {
    id: 'earth-jupiter-size',
    title: 'What if Earth were the size of Jupiter?',
    question: 'How would our home look if it were 11 times wider?',
    explanation:
      'Gravity depends on mass and size. A “Jupiter-sized Earth” would have about 300 times the mass of the real Earth, so you would feel roughly 11 times heavier and could barely lift your arms. It would also collect a much thicker atmosphere and, most likely, become a gas giant with no solid ground at all.',
    takeaway: 'A bigger Earth means stronger gravity and a completely different kind of planet.',
    emoji: '🪐',
  },
  {
    id: 'no-sun',
    title: 'What if the Sun disappeared?',
    question: 'What happens if the Sun simply vanishes?',
    explanation:
      'Sunlight would stop arriving immediately in the model, but the real thing is even stranger: gravity travels at the speed of light too. If the Sun vanished, Earth would keep orbiting the empty spot for the 8 minutes and 20 seconds it takes light (and gravity) to reach us. After that we would fly off in a straight line, and Earth would slowly freeze.',
    takeaway: 'Nothing about the Sun — including its gravity — can reach us faster than the speed of light.',
    emoji: '🌑',
  },
  {
    id: 'no-rotation',
    title: 'What if Earth stopped rotating?',
    question: 'What if Earth’s spin slowed down and stopped?',
    explanation:
      'The day would last forever. One side would bake in permanent sunlight while the other froze in endless night. The atmosphere would race around the planet causing gigantic winds, and the oceans would pile up toward the poles. Our 24-hour day is a very precious gift.',
    takeaway: 'Earth’s spin gives us day and night, and it helps keep our climate steady.',
    emoji: '🌀',
  },
]

export function getScenario(id: string): WhatIfScenario | undefined {
  return WHAT_IF_SCENARIOS.find((scenario) => scenario.id === id)
}