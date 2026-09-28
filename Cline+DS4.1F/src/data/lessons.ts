import type { Lesson } from '../types'

/**
 * "Explore & Learn" lessons. Each lesson pairs short, child-friendly narration
 * with a hands-on widget (chosen by `id` in `EducationPanel`) and a scene action
 * so the child can jump straight into the 3D Solar System.
 */
export const LESSONS: Lesson[] = [
  {
    id: 'sun',
    title: 'The Sun',
    emoji: '☀️',
    summary: 'Meet the star that holds our Solar System together.',
    steps: [
      {
        text: 'The Sun is a star: a huge ball of very hot gas. It is the closest star to Earth, which is why it looks so big and bright.',
      },
      {
        text: 'Deep inside the Sun, hydrogen atoms are squeezed together so hard that they join into helium. That is nuclear fusion, and it releases enormous amounts of energy.',
        highlight: 'Fusion in the Sun’s core makes the light and heat that power life on Earth.',
      },
      {
        text: 'That energy travels outward and escapes as sunlight. It takes about 8 minutes and 20 seconds to cross the 150 million kilometres to Earth.',
      },
      {
        text: 'Because the Sun is so heavy, its gravity reaches far into space. It pulls on every planet, which is why the planets travel around it in orbits instead of flying away.',
        highlight: 'Gravity keeps the planets moving around the Sun.',
      },
    ],
    sceneAction: { label: 'Fly me to the Sun', targetId: 'sun' },
  },
  {
    id: 'sizes',
    title: 'Planet Sizes',
    emoji: '📏',
    summary: 'Line the planets up and see how big (or small) they really are.',
    steps: [
      {
        text: 'The planets come in very different sizes. Mercury is the smallest planet and Jupiter is the biggest — by a lot!',
      },
      {
        text: 'If Earth were a cherry tomato, Jupiter would be a beach ball about 11 times wider.',
        highlight: 'Jupiter is 11 times wider than Earth, and more than 1,300 times bigger in volume.',
      },
      {
        text: 'The Sun is even bigger: about 109 Earths could sit side by side across it.',
      },
    ],
    sceneAction: { label: 'Compare them in 3D', targetId: 'jupiter', scaleMode: 'relativeSize' },
  },
  {
    id: 'distances',
    title: 'Planet Distances',
    emoji: '🌌',
    summary: 'Find out how far apart the planets really are.',
    steps: [
      {
        text: 'The planets are very far apart. The four inner planets huddle near the Sun, and the giant planets live much farther out.',
      },
      {
        text: 'The gap between Mars and Jupiter is especially huge — that is where the asteroid belt circles the Sun.',
      },
      {
        text: 'Switch to “Distances Emphasized” to see the real spacing. Then imagine a spacecraft: it would need about 12 years to reach Neptune.',
        highlight: 'Neptune is about 30 times farther from the Sun than Earth is.',
      },
    ],
    sceneAction: { label: 'Show true spacing', scaleMode: 'distances' },
  },
  {
    id: 'gravity',
    title: 'Gravity',
    emoji: '🍎',
    summary: 'Try your own gravity experiment.',
    steps: [
      {
        text: 'Gravity is a force that pulls things together. Bigger things pull harder, and things that are farther apart pull less.',
      },
      {
        text: 'Gravity keeps moons going around planets and planets going around the Sun. Without it, everything would drift away.',
        highlight: 'The more mass something has, the stronger its gravity.',
      },
      {
        text: 'Use the sliders below to make the planet heavier, then watch the ball drop.',
      },
    ],
  },
  {
    id: 'day-night',
    title: 'Day and Night',
    emoji: '🌗',
    summary: 'Why the Sun seems to rise and set.',
    steps: [
      {
        text: 'Earth spins like a top. When your part of Earth faces the Sun you have daytime; when it turns away you have night.',
      },
      {
        text: 'One full spin takes 24 hours, so we get one day and one night every rotation.',
        highlight: 'Earth turns at about 1,670 km/h at the equator — and we never feel it.',
      },
      {
        text: 'Watch Earth in the scene: the dark half is having night, and the city lights glow there.',
      },
    ],
    sceneAction: { label: 'Zoom in on Earth', targetId: 'earth' },
  },
  {
    id: 'seasons',
    title: 'Seasons',
    emoji: '🌤️',
    summary: 'Why summer is warm and winter is chilly.',
    steps: [
      {
        text: 'Earth is tilted over by about 23.4 degrees, and that tilt stays pointing the same way as Earth travels around the Sun.',
      },
      {
        text: 'When your half of Earth tilts toward the Sun, sunlight arrives more directly — that is summer. When your half tilts away, you get winter.',
        highlight: 'Seasons come from Earth’s tilt, not from being closer to the Sun.',
      },
      {
        text: 'The two days each year when neither half leans toward the Sun are the equinoxes: day and night are nearly equal.',
      },
    ],
    sceneAction: { label: 'See the tilt in 3D', targetId: 'earth' },
  },
  {
    id: 'moon-phases',
    title: 'Moon Phases',
    emoji: '🌒',
    summary: 'Why the Moon changes shape every night.',
    steps: [
      {
        text: 'The Moon does not make its own light — it reflects sunlight. Half of the Moon is always lit by the Sun.',
      },
      {
        text: 'As the Moon orbits Earth we see different amounts of the lit half. That is why it looks like a thin crescent some nights and a full circle on others.',
        highlight: 'It takes about 29.5 days to go from new Moon back to new Moon.',
      },
      {
        text: 'Drag the slider below to travel through every phase, then watch the Moon orbit Earth in the scene.',
      },
    ],
    sceneAction: { label: 'Watch the Moon orbit', targetId: 'earth', daysPerSecond: 1 },
  },
  {
    id: 'orbits',
    title: 'Orbits',
    emoji: '🪐',
    summary: 'How the planets keep moving.',
    steps: [
      {
        text: 'A planet has two jobs at the same time: it keeps moving forward, and gravity keeps pulling it toward the Sun.',
      },
      {
        text: 'Sideways motion plus inward gravity makes a curve — an orbit. The planet is always falling… and always missing.',
        highlight: 'Gravity keeps planets moving around the Sun.',
      },
      {
        text: 'Orbits are not perfect circles. They are slightly stretched shapes called ellipses, so a planet is a little closer to the Sun at some points than others.',
      },
    ],
    sceneAction: { label: 'Animate the orbits', scaleMode: 'educational', showOrbitFlow: true },
  },
]

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id)
}