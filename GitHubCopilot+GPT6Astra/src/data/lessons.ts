import type { BodyId } from './planets'

export interface Lesson {
  title: string
  subtitle: string
  body: BodyId
  explanation: string
  takeaway: string
}

export const lessons: Lesson[] = [
  { title: 'The Sun', subtitle: 'A star in our backyard', body: 'sun', explanation: 'Inside the Sun, pressure and heat squeeze hydrogen nuclei together to form helium. A little mass becomes a lot of energy. We call this nuclear fusion.', takeaway: 'The Sun is a star, not a planet. Its gravity keeps our solar system together.' },
  { title: 'Planet Sizes', subtitle: 'How big is big?', body: 'jupiter', explanation: 'Earth feels enormous until you meet Jupiter. Compare the real diameters below. These circles share the same size scale.', takeaway: 'Diameter measures the distance straight through the center of a world.' },
  { title: 'Planet Distances', subtitle: 'Space is mostly... space', body: 'neptune', explanation: 'An astronomical unit, or AU, is the average distance from Earth to the Sun: about 150 million kilometers. Even light takes time to cross it.', takeaway: 'Neptune is about 30 times farther from the Sun than Earth is.' },
  { title: 'Gravity', subtitle: 'An invisible connection', body: 'earth', explanation: 'Every object with mass pulls on other objects. Increase the central mass to see a stronger pull. Move twice as far away and the pull becomes four times weaker.', takeaway: 'For a circular orbit at the same distance, stronger gravity requires a faster orbital speed.' },
  { title: 'Day and Night', subtitle: 'A world that keeps turning', body: 'earth', explanation: 'The Sun lights only half of Earth at a time. As Earth rotates, your home turns into sunlight for day and away from it for night.', takeaway: 'Earth spins once in about 24 hours. The Sun does not circle Earth each day.' },
  { title: 'Seasons', subtitle: 'A little tilt changes everything', body: 'earth', explanation: 'Earth leans about 23.4 degrees. As it travels around the Sun, each hemisphere takes a turn leaning toward the sunlight. More direct light and longer days bring summer.', takeaway: 'Seasons come from the tilt, not from Earth moving closer to the Sun. The hemispheres have opposite seasons.' },
  { title: 'Moon Phases', subtitle: 'One Moon, many faces', body: 'moon', explanation: 'Half the Moon is always lit by the Sun. As the Moon circles Earth, we see different amounts of that sunlit half. A full cycle takes about 29.5 days.', takeaway: "Earth's shadow does not cause the regular phases. It causes lunar eclipses, which are much rarer." },
  { title: 'Orbits', subtitle: 'Falling, but always missing', body: 'earth', explanation: 'A planet moves forward while gravity pulls it toward the Sun. Together, those motions bend its path into an orbit. Without that inward pull, it would continue along a straight line.', takeaway: 'Gravity keeps planets moving around the Sun. Real orbits are ellipses; this diagram uses a circle.' },
]

export const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']
export const seasons = [
  { title: 'March equinox', north: 'Spring', south: 'Autumn', note: 'Both hemispheres receive roughly equal daylight.' },
  { title: 'June solstice', north: 'Summer', south: 'Winter', note: 'The Northern Hemisphere leans toward the Sun.' },
  { title: 'September equinox', north: 'Autumn', south: 'Spring', note: 'Day and night are roughly equal again.' },
  { title: 'December solstice', north: 'Winter', south: 'Summer', note: 'The Southern Hemisphere leans toward the Sun.' },
]