/** Curated, verifiable astronomy facts for the "Teach Me Something!" card. */

export interface RandomFact {
  text: string
  category: 'Sun' | 'Planets' | 'Moons' | 'Space' | 'Stars'
}

export const RANDOM_FACTS: RandomFact[] = [
  { text: 'A day on Venus is longer than a year on Venus.', category: 'Planets' },
  { text: 'Jupiter is the largest planet in our Solar System.', category: 'Planets' },
  { text: 'Saturn’s rings are mostly made of ice and rock.', category: 'Planets' },
  { text: 'Light from the Sun takes about 8 minutes to reach Earth.', category: 'Sun' },
  { text: 'More than 1,000 Earths could fit inside Jupiter.', category: 'Planets' },
  {
    text: 'The Sun makes up 99.8% of all the mass in the Solar System.',
    category: 'Sun',
  },
  { text: 'Neptune has the fastest winds in the Solar System — over 2,000 km/h.', category: 'Planets' },
  { text: 'Earth is the only planet not named after a Greek or Roman god.', category: 'Planets' },
  { text: 'There are more stars in the sky than grains of sand on all Earth’s beaches.', category: 'Stars' },
  { text: 'Footprints on the Moon can last for millions of years.', category: 'Moons' },
  { text: 'Saturn would float in water — it is less dense than water.', category: 'Planets' },
  { text: 'Uranus spins on its side, rolling around the Sun like a ball.', category: 'Planets' },
  { text: 'A year on Mercury is only 88 Earth days long.', category: 'Planets' },
  { text: 'Sunsets on Mars are blue because of the dust in its air.', category: 'Planets' },
  { text: 'The Sun is a middle-aged star — it is about 4.6 billion years old.', category: 'Sun' },
  { text: 'Mars has the tallest volcano in the Solar System: Olympus Mons.', category: 'Planets' },
  { text: 'Jupiter’s Great Red Spot is a storm bigger than Earth.', category: 'Planets' },
  { text: 'The Moon is slowly moving away from Earth at 3.8 cm per year.', category: 'Moons' },
  { text: 'One day on Jupiter is less than 10 hours long.', category: 'Planets' },
  { text: 'Space is not completely silent — astronauts hear vibrations through their suits.', category: 'Space' },
  { text: 'There are thought to be more planets than stars in our galaxy.', category: 'Stars' },
  { text: 'Venus spins backwards, so the Sun rises in the west.', category: 'Planets' },
  { text: 'The light you see from some stars left them before you were born.', category: 'Stars' },
  { text: 'Neptune takes about 165 Earth years to circle the Sun once.', category: 'Planets' },
  { text: 'Earth’s magnetic field protects us from the solar wind.', category: 'Space' },
  { text: 'A teaspoon of a neutron star would weigh about a billion tonnes.', category: 'Stars' },
  { text: 'The Sun will keep shining for another 5 billion years or so.', category: 'Sun' },
  { text: 'Mercury has craters named after famous artists and musicians.', category: 'Planets' },
  { text: 'Saturn has more than 140 known moons.', category: 'Moons' },
  { text: 'You weigh about 3 times more on Jupiter than on Earth.', category: 'Planets' },
  { text: 'The Moon has no air, so there is no wind or sound there.', category: 'Moons' },
  { text: 'Comets are made of ice, dust and rock — like dirty snowballs.', category: 'Space' },
  { text: 'Greenhouse gases make Venus hotter than Mercury, even though Mercury is closer to the Sun.', category: 'Planets' },
  { text: 'The Sun’s surface is about 5,500°C — its core is about 15 million °C.', category: 'Sun' },
  { text: 'Uranus was the first planet discovered with a telescope, in 1781.', category: 'Planets' },
  { text: 'Astronauts on the Space Station see 16 sunrises and sunsets every day.', category: 'Space' },
]
