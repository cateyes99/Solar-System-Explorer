import { beforeEach, describe, expect, it } from 'vitest'
import { DAY_MS, EPOCH, planets, tourStops, type BodyId } from '../data/planets'
import { gravityAcceleration, MAX_DAYS, MIN_DAYS, orbitFor, orbitPathFor, plutoOrientation, positionFor, radiusFor, usesApproximatePositions, type ScaleMode } from './astronomy'
import { useSimulation } from '../store/simulationStore'
import { cometActivity, halleyOrbitAt, halleySamples, halleyVectorAt } from './halley'

describe('Halley JPL Horizons ephemeris', () => {
  it('closes the full orbit guide without a gap at any supported date', () => {
    for (const days of [-25000, -1100, 0, 10000, 25000]) {
      const path = orbitPathFor('halley', days, 'educational')
      expect(path[path.length - 1]).toEqual(path[0])
    }
  })
  it('draws a smooth, Sun-focused ellipse containing the current JPL position', () => {
    for (const date of [2446471, 2461309.5, 2474033]) {
      const path = halleyOrbitAt(date)
      const perihelion = path[0]
      const aphelion = path[512]
      const semiMajor = (Math.hypot(...perihelion) + Math.hypot(...aphelion)) / 2
      const secondFocus = perihelion.map((value, axis) => value + aphelion[axis])
      for (const point of [...path, halleyVectorAt(date)]) {
        const focalDistance = Math.hypot(...point) + Math.hypot(...point.map((value, axis) => value - secondFocus[axis]))
        expect(focalDistance).toBeCloseTo(semiMajor * 2, 6)
      }
      const closingStep = path[0].map((value, axis) => value - path[path.length - 2][axis])
      const openingStep = path[1].map((value, axis) => value - path[0][axis])
      const cosine = closingStep.reduce((sum, value, axis) => sum + value * openingStep[axis], 0) / Math.hypot(...closingStep) / Math.hypot(...openingStep)
      expect(cosine).toBeGreaterThan(.999)
    }
  })
  it('continues moving through the December 2023 aphelion', () => {
    const start = (Date.UTC(2023, 11, 1) - EPOCH) / DAY_MS
    useSimulation.setState({ days: start, speed: 365, paused: false, reducedMotion: false })
    let previous = positionFor('halley', start, 'educational')
    const distances: number[] = []
    for (let index = 0; index < 90; index++) {
      useSimulation.getState().tick(1 / 365)
      const point = positionFor('halley', useSimulation.getState().days, 'educational')
      const movement = Math.hypot(...point.map((value, axis) => value - previous[axis]))
      expect(movement).toBeGreaterThan(.005)
      expect(movement).toBeLessThan(.02)
      distances.push(Math.hypot(...point))
      previous = point
    }
    const aphelion = distances.indexOf(Math.max(...distances))
    expect(aphelion).toBeGreaterThan(0)
    expect(aphelion).toBeLessThan(distances.length - 1)
    expect(useSimulation.getState().days).toBeCloseTo(start + 90)
  })
  it('matches an independently queried JPL vector on 26 September 2026 TDB', () => {
    const actual = halleyVectorAt(2461309.5)
    const expected = [-19.35855837231821, 27.46779996876238, -9.854644267040809]
    actual.forEach((value, axis) => expect(value).toBeCloseTo(expected[axis], 7))
  })
  it('preserves tabulated states and rejects nonfinite dates', () => {
    for (const index of [0, 1, 1000, halleySamples.length - 1]) {
      const sample = halleySamples[index]
      expect(halleyVectorAt(sample[0])).toEqual(sample.slice(1, 4))
    }
    for (const invalid of [-Infinity, Infinity, NaN]) expect(() => halleyVectorAt(invalid)).toThrow(RangeError)
  })
  it('transitions to approximate orbits without position or velocity jumps', () => {
    for (const [sample, direction] of [[halleySamples[0], -1], [halleySamples[halleySamples.length - 1], 1]] as const) {
      const interval = .001 * direction
      const outside = halleyVectorAt(sample[0] + interval)
      outside.forEach((value, axis) => {
        expect(Math.abs(value - sample[axis + 1])).toBeLessThan(.00001)
        expect((value - sample[axis + 1]) / interval).toBeCloseTo(sample[axis + 4], 7)
      })
      for (const offset of [1, 100, 30000, 1000000]) {
        const date = sample[0] + direction * offset
        const point = halleyVectorAt(date)
        expect(point.every(Number.isFinite)).toBe(true)
        expect(Math.hypot(...point)).toBeGreaterThan(.5)
        expect(Math.hypot(...point)).toBeLessThan(37)
        const path = halleyOrbitAt(date)
        expect(path.flat().every(Number.isFinite)).toBe(true)
        expect(path[0]).toEqual(path[path.length - 1])
      }
    }
  })
  it('matches independent near-perihelion JPL vectors between sample dates', () => {
    for (const [date, expected] of [[2446471, [.3300490784851872, -.4562801522776002, .166034061363485]], [2474033, [.3657381440466182, -.4335240533378054, .1743591884465248]]] as const) {
      const actual = halleyVectorAt(date)
      expect(Math.hypot(...actual.map((value, axis) => value - expected[axis]))).toBeLessThan(.000002)
    }
  })
  it('keeps dated positions and orbit guides finite and outside the enlarged Sun in all scales', () => {
    for (const scale of ['educational', 'relative', 'distances', 'custom'] as ScaleMode[]) {
      for (const days of [-25000, 0, 25000]) {
        expect(positionFor('halley', days, scale, .8, 2).every(Number.isFinite)).toBe(true)
        const path = orbitPathFor('halley', days, scale, .8, 2)
        expect(path.flat().every(Number.isFinite)).toBe(true)
        expect(Math.min(...path.map(point => Math.hypot(...point))) - radiusFor('halley', scale, 2)).toBeGreaterThan(radiusFor('sun', scale))
      }
    }
    expect(planets).toHaveLength(8)
    expect(tourStops).toHaveLength(12)
  })
  it('has a retrograde, highly eccentric orbit with observed 1986 perihelion', () => {
    const perihelion = halleyVectorAt(2446470.5)
    expect(Math.hypot(...perihelion)).toBeCloseTo(.5871, 3)
    const before = halleyVectorAt(2461309.5)
    const after = halleyVectorAt(2461310.5)
    expect(before[0] * after[1] - before[1] * after[0]).toBeLessThan(0)
    expect(Math.hypot(...before)).toBeGreaterThan(34)
    expect(Math.abs(before[2])).toBeGreaterThan(9)
  })
  it('only develops a coma and tails in the inner solar system', () => {
    expect(cometActivity(.587)).toBe(1)
    expect(cometActivity(2)).toBeGreaterThan(0)
    expect(cometActivity(4)).toBe(0)
    expect(cometActivity(35)).toBe(0)
  })
})

describe('astronomy and educational scale', () => {
  it('keeps the planets ordered and visible', () => {
    const radii = planets.map(body => orbitFor(body.id, 'educational'))
    expect(radii).toEqual([...radii].sort((first, second) => first - second))
    expect(radiusFor('mercury', 'educational')).toBeGreaterThan(.4)
  })
  it('preserves real diameter ratios in relative size mode', () => {
    expect(radiusFor('jupiter', 'relative') / radiusFor('earth', 'relative')).toBeCloseTo(139820 / 12742)
    expect(orbitFor('mercury', 'relative') - radiusFor('mercury', 'relative')).toBeGreaterThan(radiusFor('sun', 'relative'))
  })
  it('keeps custom-sized inner planets outside the star', () => {
    for (const days of [-25000, 0, 25000]) {
      const points = orbitPathFor('mercury', days, 'custom', .8, 2)
      const perihelion = Math.min(...points.map(point => Math.hypot(...point)))
      expect(perihelion - radiusFor('mercury', 'custom', 2)).toBeGreaterThan(radiusFor('sun', 'custom', 2))
      expect(points[256]).toEqual(positionFor('mercury', days, 'custom', .8, 2))
    }
  })
  it('uses finite ephemerides and moves Earth over time', () => {
    expect(positionFor('earth', 0, 'educational').every(Number.isFinite)).toBe(true)
    expect(positionFor('earth', 90, 'educational')[0]).not.toBeCloseTo(positionFor('earth', 0, 'educational')[0])
    expect(positionFor('sun', 90, 'educational')).toEqual([0, 0, 0])
  })
  it('preserves Mercury eccentricity and full orbital inclination', () => {
    const positions = Array.from({ length: 360 }, (_, index) => positionFor('mercury', index * 87.97 / 360, 'educational'))
    const distances = positions.map(point => Math.hypot(...point))
    expect(Math.min(...distances) / orbitFor('mercury', 'educational')).toBeCloseTo(.794, 2)
    expect(Math.max(...distances) / orbitFor('mercury', 'educational')).toBeCloseTo(1.206, 2)
    expect(Math.max(...positions.map((point, index) => Math.abs(point[1]) / distances[index]))).toBeCloseTo(Math.sin(7 * Math.PI / 180), 2)
  })
  it('keeps the Moon near Earth at custom scales', () => {
    const earth = positionFor('earth', 0, 'custom', 1.4, 2)
    const moon = positionFor('moon', 0, 'custom', 1.4, 2)
    expect(Math.hypot(...moon.map((value, index) => value - earth[index]))).toBeLessThan(5)
  })
  it('moves the Moon at its real daily angular rate relative to Earth in every scale', () => {
    for (const scale of ['educational', 'relative', 'distances', 'custom'] as ScaleMode[]) {
      const longitude = (days: number) => {
        const earth = positionFor('earth', days, scale, 1.4, 2)
        const moon = positionFor('moon', days, scale, 1.4, 2)
        return Math.atan2(-(moon[2] - earth[2]), moon[0] - earth[0]) * 180 / Math.PI
      }
      for (let days = 0; days < 365; days++) {
        const angle = (longitude(days + 1) - longitude(days) + 360) % 360
        expect(angle).toBeGreaterThan(11)
        expect(angle).toBeLessThan(16)
      }
      let revolution = 0
      for (let step = 0; step < 100; step++) {
        revolution += (longitude((step + 1) * 27.322 / 100) - longitude(step * 27.322 / 100) + 360) % 360
      }
      expect(revolution).toBeGreaterThan(355)
      expect(revolution).toBeLessThan(365)
    }
  })
  it('preserves eccentricity in every display scale', () => {
    for (const scale of ['educational', 'relative', 'distances', 'custom'] as ScaleMode[]) {
      for (const [id, eccentricity] of [['mercury', .2056], ['venus', .0068], ['earth', .0167], ['mars', .0934], ['jupiter', .0484], ['saturn', .0539], ['uranus', .0473], ['neptune', .0086]] as const) {
        const distances = orbitPathFor(id, 0, scale, 1.4).map(point => Math.hypot(...point))
        const closest = Math.min(...distances)
        const farthest = Math.max(...distances)
        expect(Math.abs((farthest - closest) / (farthest + closest) - eccentricity)).toBeLessThan(.01)
      }
    }
  })
  it('draws orbit guides from the same dated 3D positions as planets', () => {
    for (const body of planets) {
      for (const days of [-25000, 0, 25000]) {
        const points = orbitPathFor(body.id as Exclude<BodyId, 'sun' | 'moon'>, days, 'custom', 1.3)
        expect(points).toHaveLength(513)
        expect(points.flat().every(Number.isFinite)).toBe(true)
        expect(points[256]).toEqual(positionFor(body.id, days, 'custom', 1.3))
        expect(points[0]).toEqual(positionFor(body.id, days - body.year / 2, 'custom', 1.3))
        expect(points[512]).toEqual(positionFor(body.id, days + body.year / 2, 'custom', 1.3))
      }
    }
  })
  it('preserves lunar distance variation and inclination relative to Earth', () => {
    const offsets = Array.from({ length: 60 }, (_, index) => {
      const earth = positionFor('earth', index, 'educational')
      return positionFor('moon', index, 'educational').map((value, axis) => value - earth[axis])
    })
    const distances = offsets.map(point => Math.hypot(...point))
    expect(Math.max(...distances) / Math.min(...distances)).toBeGreaterThan(1.1)
    expect(Math.max(...offsets.map((point, index) => Math.abs(point[1]) / distances[index]))).toBeGreaterThan(.08)
  })
  it('demonstrates the inverse square law', () => {
    expect(gravityAcceleration(2, 1)).toBe(2)
    expect(gravityAcceleration(1, 2)).toBe(.25)
  })
})

describe('Pluto ephemeris', () => {
  it('uses dated IAU rotation with a 6.39-day period, including paused date jumps', () => {
    const initial = plutoOrientation(0)
    expect(initial.angleTo(plutoOrientation(1)) * 180 / Math.PI).toBeCloseTo(56.3625225, 3)
    expect(initial.angleTo(plutoOrientation(360 / 56.3625225))).toBeLessThan(.00001)
    expect(initial.angleTo(plutoOrientation(400))).toBeGreaterThan(.1)
  })
  it('preserves Pluto eccentricity, inclination, and orbital motion', () => {
    const points = orbitPathFor('pluto', 0, 'educational')
    const distances = points.map(point => Math.hypot(...point) / orbitFor('pluto', 'educational') * 39.482)
    expect(Math.min(...distances)).toBeGreaterThan(29)
    expect(Math.min(...distances)).toBeLessThan(31)
    expect(Math.max(...distances)).toBeGreaterThan(48)
    expect(Math.max(...distances)).toBeLessThan(50)
    const inclination = Math.max(...points.map(point => Math.asin(Math.abs(point[1]) / Math.hypot(...point)) * 180 / Math.PI))
    expect(inclination).toBeGreaterThan(16)
    expect(inclination).toBeLessThan(18)
    expect(positionFor('pluto', 365, 'educational')).not.toEqual(positionFor('pluto', 0, 'educational'))
    for (const scale of ['educational', 'relative', 'distances', 'custom'] as ScaleMode[]) {
      for (const days of [MIN_DAYS, 0, MAX_DAYS, MAX_DAYS + 36500]) expect(positionFor('pluto', days, scale).every(Number.isFinite)).toBe(true)
    }
    expect(planets).toHaveLength(8)
    expect(tourStops).toHaveLength(12)
  })
})

describe('simulation controls', () => {
  beforeEach(() => useSimulation.setState({ days: 0, speed: 8, paused: false, reducedMotion: false, tour: null, approximationAllowed: false, dateLimitPrompt: false, pendingDate: null }))
  it('sets a valid calendar date at noon UTC while remaining paused', () => {
    useSimulation.setState({ paused: true })
    const revision = useSimulation.getState().cameraRevision
    expect(useSimulation.getState().setDate('2024-02-29')).toBe(true)
    expect(new Date(EPOCH + useSimulation.getState().days * DAY_MS).toISOString()).toBe('2024-02-29T12:00:00.000Z')
    expect(useSimulation.getState()).toMatchObject({ paused: true, cameraRevision: revision + 1 })
  })
  it('rejects invalid calendar dates and date edits during playback', () => {
    expect(useSimulation.getState().setDate('2024-02-29')).toBe(false)
    useSimulation.setState({ paused: true })
    for (const date of ['', '2023-02-29', '2026-04-31', '2026-13-01', '0000-01-01', 'not a date']) {
      expect(useSimulation.getState().setDate(date)).toBe(false)
      expect(useSimulation.getState().days).toBe(0)
    }
  })
  it('confirms an out-of-range selected date without changing it on No or resuming on Yes', () => {
    useSimulation.setState({ paused: true })
    for (const date of ['1900-01-01', '2100-01-01']) {
      useSimulation.getState().setDate(date)
      expect(useSimulation.getState()).toMatchObject({ days: 0, dateLimitPrompt: true, paused: true })
      useSimulation.getState().resolveDateLimit(false)
      expect(useSimulation.getState()).toMatchObject({ days: 0, pendingDate: null, paused: true, approximationAllowed: false })
    }
    useSimulation.getState().setDate('2100-01-01')
    useSimulation.getState().resolveDateLimit(true)
    expect(new Date(EPOCH + useSimulation.getState().days * DAY_MS).toISOString()).toBe('2100-01-01T12:00:00.000Z')
    expect(useSimulation.getState()).toMatchObject({ paused: true, pendingDate: null, approximationAllowed: true })
    useSimulation.getState().setDate('2026-09-26')
    expect(usesApproximatePositions(useSimulation.getState().days)).toBe(false)
    useSimulation.getState().resetDate()
    expect(useSimulation.getState()).toMatchObject({ days: 0, approximationAllowed: false, pendingDate: null })
  })
  it('allows date selection when reduced motion has stopped playback', () => {
    useSimulation.setState({ reducedMotion: true })
    expect(useSimulation.getState().setDate('2000-01-01')).toBe(true)
    expect(useSimulation.getState()).toMatchObject({ paused: true, reducedMotion: true })
  })
  it('pauses explicitly when playback reaches the supported date boundary', () => {
    useSimulation.setState({ days: MAX_DAYS - 1, speed: 365 })
    useSimulation.getState().tick(.1)
    expect(useSimulation.getState()).toMatchObject({ days: MAX_DAYS, paused: true, dateLimitPrompt: true })
  })
  it('requires consent for manual steps at either JPL boundary', () => {
    for (const [boundary, direction] of [[MIN_DAYS, -1], [MAX_DAYS, 1]]) {
      useSimulation.setState({ days: boundary, dateLimitPrompt: false })
      useSimulation.getState().advance(direction)
      expect(useSimulation.getState()).toMatchObject({ days: boundary, paused: true, dateLimitPrompt: true })
      useSimulation.getState().advance(direction * 100)
      expect(useSimulation.getState().days).toBe(boundary)
      useSimulation.getState().resolveDateLimit(false)
      expect(useSimulation.getState()).toMatchObject({ paused: true, dateLimitPrompt: false, approximationAllowed: false })
    }
  })
  it('continues from the boundary after Yes and clears consent on reset', () => {
    useSimulation.setState({ days: MAX_DAYS - 1, speed: 30 })
    useSimulation.getState().tick(.1)
    useSimulation.getState().resolveDateLimit(true)
    expect(useSimulation.getState()).toMatchObject({ days: MAX_DAYS, paused: false, approximationAllowed: true })
    useSimulation.getState().tick(.1)
    expect(useSimulation.getState().days).toBeCloseTo(MAX_DAYS + 3)
    expect(usesApproximatePositions(useSimulation.getState().days)).toBe(true)
    useSimulation.getState().resetDate()
    expect(useSimulation.getState()).toMatchObject({ days: 0, approximationAllowed: false, dateLimitPrompt: false })
    expect(usesApproximatePositions(0)).toBe(false)
  })
  it('uses the actual bundled JPL coverage as clock boundaries', () => {
    for (const days of [MIN_DAYS, MAX_DAYS]) {
      expect(positionFor('halley', days, 'educational').every(Number.isFinite)).toBe(true)
      expect(usesApproximatePositions(days)).toBe(false)
    }
    expect(usesApproximatePositions(MIN_DAYS - 1)).toBe(true)
    expect(usesApproximatePositions(MAX_DAYS + 1)).toBe(true)
  })
  it('advances, pauses, and resumes simulation time', () => {
    useSimulation.getState().tick(.1)
    expect(useSimulation.getState().days).toBe(.8)
    useSimulation.getState().set({ paused: true })
    useSimulation.getState().tick(.1)
    expect(useSimulation.getState().days).toBe(.8)
    useSimulation.getState().set({ paused: false })
    useSimulation.getState().tick(.1)
    expect(useSimulation.getState().days).toBe(1.6)
  })
  it('stops automatic time in reduced motion but allows explicit steps', () => {
    useSimulation.getState().set({ reducedMotion: true })
    useSimulation.getState().tick(.1)
    expect(useSimulation.getState().days).toBe(0)
    useSimulation.getState().advance(1)
    expect(useSimulation.getState().days).toBe(1)
  })
  it('starts, advances, and exits the tour', () => {
    useSimulation.getState().startTour()
    useSimulation.getState().nextTour()
    expect(useSimulation.getState().selected).toBe('sun')
    useSimulation.getState().exitTour()
    expect(useSimulation.getState().tour).toBeNull()
    expect(useSimulation.getState().cameraMode).toBe('system')
  })
  it('jumps to every tour stop in either direction and resumes playback', () => {
    useSimulation.getState().startTour()
    for (const index of [9, 3, 0, 11, 6, 5, 7, 8, 10, 2, 1, 4]) {
      useSimulation.getState().set({ tourPaused: true })
      const revision = useSimulation.getState().cameraRevision
      useSimulation.getState().jumpToTourStop(index)
      expect(useSimulation.getState()).toMatchObject({
        tour: index, tourPaused: false, selected: tourStops[index].body,
        cameraMode: tourStops[index].body ? 'follow' : 'system', cameraRevision: revision + 1,
      })
    }
    useSimulation.getState().nextTour()
    expect(useSimulation.getState().tour).toBe(5)
    useSimulation.getState().jumpToTourStop(tourStops.length - 1)
    useSimulation.getState().nextTour()
    expect(useSimulation.getState().tour).toBeNull()
  })
  it('restarts the current tour stop and ignores invalid destinations', () => {
    useSimulation.getState().startTour()
    const revision = useSimulation.getState().cameraRevision
    useSimulation.getState().jumpToTourStop(0)
    expect(useSimulation.getState().cameraRevision).toBe(revision + 1)
    const state = useSimulation.getState()
    for (const index of [-1, tourStops.length, 1.5, NaN]) {
      useSimulation.getState().jumpToTourStop(index)
      expect(useSimulation.getState()).toBe(state)
    }
  })
})