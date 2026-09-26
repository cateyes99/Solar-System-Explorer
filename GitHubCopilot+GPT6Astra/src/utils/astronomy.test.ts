import { beforeEach, describe, expect, it } from 'vitest'
import { planets, tourStops } from '../data/planets'
import { gravityAcceleration, orbitFor, positionFor, radiusFor } from './astronomy'
import { useSimulation } from '../store/simulationStore'

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
    expect(orbitFor('mercury', 'custom', .8) - radiusFor('mercury', 'custom', 2)).toBeGreaterThan(radiusFor('sun', 'custom', 2))
  })
  it('uses finite ephemerides and moves Earth over time', () => {
    expect(positionFor('earth', 0, 'educational').every(Number.isFinite)).toBe(true)
    expect(positionFor('earth', 90, 'educational')[0]).not.toBeCloseTo(positionFor('earth', 0, 'educational')[0])
    expect(positionFor('sun', 90, 'educational')).toEqual([0, 0, 0])
  })
  it('keeps the Moon near Earth at custom scales', () => {
    const earth = positionFor('earth', 0, 'custom', 1.4, 2)
    const moon = positionFor('moon', 0, 'custom', 1.4, 2)
    expect(Math.hypot(...moon.map((value, index) => value - earth[index]))).toBeLessThan(5)
  })
  it('demonstrates the inverse square law', () => {
    expect(gravityAcceleration(2, 1)).toBe(2)
    expect(gravityAcceleration(1, 2)).toBe(.25)
  })
})

describe('simulation controls', () => {
  beforeEach(() => useSimulation.setState({ days: 0, speed: 8, paused: false, reducedMotion: false, tour: null }))
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