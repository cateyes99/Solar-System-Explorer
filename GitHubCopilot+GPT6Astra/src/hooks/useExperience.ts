import { useEffect } from 'react'
import { useSimulation } from '../store/simulationStore'

export function useExperience() {
  const audio = useSimulation(state => state.audio)
  useEffect(() => {
    if (!audio) return
    const context = new AudioContext()
    const gain = context.createGain()
    gain.gain.value = .015
    gain.connect(context.destination)
    const oscillators = [55, 82.41, 110, 164.81].map(frequency => {
      const oscillator = context.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      oscillator.connect(gain)
      oscillator.start()
      return oscillator
    })
    void context.resume()
    return () => { oscillators.forEach(oscillator => oscillator.stop()); void context.close() }
  }, [audio])
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'SUMMARY'].includes(target.tagName)) return
      const state = useSimulation.getState()
      if (event.code === 'Space') { event.preventDefault(); state.set({ paused: !state.paused }) }
      if (event.key.toLowerCase() === 'h') state.viewSystem()
      if (event.key.toLowerCase() === 'l') state.set({ labels: !state.labels })
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const state = useSimulation.getState()
      if (state.tour !== null) state.exitTour()
      else if (state.panel) state.set({ panel: null })
      else state.viewSystem()
    }
    window.addEventListener('keydown', keydown)
    window.addEventListener('keydown', escape)
    return () => { window.removeEventListener('keydown', keydown); window.removeEventListener('keydown', escape) }
  }, [])
}