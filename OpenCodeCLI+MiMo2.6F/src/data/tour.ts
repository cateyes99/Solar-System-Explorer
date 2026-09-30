/**
 * Cinematic tour: a scripted flight through the Solar System.
 * Camera framing per stage is relative to each body so it works at any scale.
 */
export interface TourStage {
  /** Target body id, or 'system' for a full view */
  id: string
  title: string
  narration: string
  /** Seconds this stage lasts */
  duration: number
  /** Camera distance expressed as a multiple of the body's visual radius */
  distanceFactor: number
  /** Around-the-body azimuth, radians */
  azimuth: number
  /** Elevation above the orbital plane, radians */
  elevation: number
}

export const TOUR_STAGES: TourStage[] = [
  {
    id: 'system',
    title: 'Welcome aboard',
    narration:
      'One star, eight planets, hundreds of moons and billions of asteroids — all held together by gravity. Let’s take a tour!',
    duration: 9,
    distanceFactor: 1,
    azimuth: 0.6,
    elevation: 0.55,
  },
  {
    id: 'sun',
    title: 'The Sun',
    narration:
      'Our journey starts at the Sun: a giant ball of glowing gas where nuclear fusion crushes hydrogen into helium, releasing the light and heat that power every planet.',
    duration: 10,
    distanceFactor: 7,
    azimuth: 0.4,
    elevation: 0.3,
  },
  {
    id: 'mercury',
    title: 'Mercury',
    narration:
      'Mercury is the fastest planet — it laps the Sun in just 88 days. With almost no atmosphere, its cratered surface swings from searing heat to deep freeze.',
    duration: 8,
    distanceFactor: 13,
    azimuth: 1.9,
    elevation: 0.4,
  },
  {
    id: 'venus',
    title: 'Venus',
    narration:
      'Venus is almost the same size as Earth, but its thick clouds trap heat like a blanket. It is the hottest planet — hotter than Mercury!',
    duration: 8,
    distanceFactor: 11,
    azimuth: 3.4,
    elevation: 0.25,
  },
  {
    id: 'earth',
    title: 'Earth',
    narration:
      'Here it is: our home. The only planet we know with liquid oceans on its surface and life everywhere we look.',
    duration: 9,
    distanceFactor: 9,
    azimuth: 5.1,
    elevation: 0.35,
  },
  {
    id: 'moon',
    title: 'The Moon',
    narration:
      'Earth’s Moon circles us every 27 days, always showing the same face. It steadies our planet’s tilt and lights up the night.',
    duration: 8,
    distanceFactor: 9,
    azimuth: 2.2,
    elevation: 0.5,
  },
  {
    id: 'mars',
    title: 'Mars',
    narration:
      'The rusty red planet has the tallest volcano in the Solar System — and small robots called rovers are exploring it for us right now.',
    duration: 8,
    distanceFactor: 11,
    azimuth: 0.9,
    elevation: 0.32,
  },
  {
    id: 'jupiter',
    title: 'Jupiter',
    narration:
      'Dramatic reveal: Jupiter, the giant! More than 1,300 Earths would fit inside it, and its Great Red Spot is a storm wider than our planet.',
    duration: 10,
    distanceFactor: 8,
    azimuth: 4.4,
    elevation: 0.28,
  },
  {
    id: 'saturn',
    title: 'Saturn and its rings',
    narration:
      'Fly past Saturn: its glittering rings are billions of pieces of ice and rock, some as tiny as sand and some as big as houses.',
    duration: 10,
    distanceFactor: 8.5,
    azimuth: 1.3,
    elevation: 0.42,
  },
  {
    id: 'uranus',
    title: 'Uranus',
    narration:
      'Uranus rolls around the Sun lying on its side, like a ball. Each pole gets 21 years of sunlight, then 21 years of darkness.',
    duration: 8,
    distanceFactor: 11,
    azimuth: 2.8,
    elevation: 0.3,
  },
  {
    id: 'neptune',
    title: 'Neptune',
    narration:
      'The farthest planet: a deep blue ice giant with the fastest winds ever measured on any planet — over 2,000 km/h.',
    duration: 9,
    distanceFactor: 11,
    azimuth: 5.6,
    elevation: 0.36,
  },
  {
    id: 'system',
    title: 'Back home',
    narration:
      'And there it is — our whole Solar System again. Gravity keeps every planet circling the Sun. Which world will you explore next?',
    duration: 9,
    distanceFactor: 1,
    azimuth: 2.4,
    elevation: 0.6,
  },
]
