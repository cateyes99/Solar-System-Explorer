import type { BodyId } from '../types'

export interface Mission {
  id: BodyId
  name: string
  /** Plain-language mission brief shown in Mission Control. */
  brief: string
  /** Fun fact shown while cruising. */
  cruisingFact: string
}

export const MISSIONS: Mission[] = [
  {
    id: 'sun',
    name: 'Fly to the Sun',
    brief: 'Hold your shields — this is the hottest destination in the Solar System.',
    cruisingFact: 'Light from the surface of the Sun takes thousands of years to fight its way out.',
  },
  {
    id: 'mercury',
    name: 'Cruise to Mercury',
    brief: 'A quick hop inward to the smallest planet and the fastest orbit.',
    cruisingFact: 'Mercury completes three laps for every two laps it makes around the Sun.',
  },
  {
    id: 'venus',
    name: 'Cruise to Venus',
    brief: 'Fly inward past Earth to the golden cloud world.',
    cruisingFact: 'Venus turns once on its axis every 243 Earth days — backwards.',
  },
  {
    id: 'earth',
    name: 'Return to Earth',
    brief: 'The blue marble. Everybody wants to come home eventually.',
    cruisingFact: 'You are always exactly one rotation away from the day you started.',
  },
  {
    id: 'mars',
    name: 'Cruise to Mars',
    brief: 'The red planet — home of the tallest volcano in the Solar System.',
    cruisingFact: 'A spacecraft has to travel for months to reach Mars, and then it has to slow down a lot.',
  },
  {
    id: 'jupiter',
    name: 'Cruise to Jupiter',
    brief: 'The heavyweight. Expect a lot of weather, all the way to the core.',
    cruisingFact: 'Jupiter spins so fast that it bulges out into an obvious football shape.',
  },
  {
    id: 'saturn',
    name: 'Cruise to Saturn',
    brief: 'Wings out — this one has the best view in the Solar System.',
    cruisingFact: 'The rings are enormous across but only about 10 metres thick on average.',
  },
  {
    id: 'uranus',
    name: 'Cruise to Uranus',
    brief: 'A pale cyan ice giant, tipped on its side.',
    cruisingFact: 'Uranus was the first planet discovered with a telescope, in 1781.',
  },
  {
    id: 'neptune',
    name: 'Cruise to Neptune',
    brief: 'The final frontier: 4.5 billion kilometres from the Sun.',
    cruisingFact: 'Neptune has only ever been visited by one spacecraft, exactly once.',
  },
]

export const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((m) => [m.id, m])) as Record<
  BodyId,
  Mission
>