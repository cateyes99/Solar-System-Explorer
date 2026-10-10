import { useEffect } from 'react'
import { useSimulationStore } from '../../store/simulationStore'

/**
 * Optional ambient space hum, generated with WebAudio (no audio assets).
 * Off by default; starts only after explicit unmute.
 */
export function AmbientAudio() {
  const muted = useSimulationStore((s) => s.muted)

  useEffect(() => {
    if (muted) return
    let ctx: AudioContext | null = null
    let stop = false
    try {
      ctx = new AudioContext()
      const master = ctx.createGain()
      master.gain.value = 0.035
      master.connect(ctx.destination)

      // two slow detuned oscillators = soft space drone
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      osc1.type = 'sine'; osc1.frequency.value = 55
      osc2.type = 'sine'; osc2.frequency.value = 55.4
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = 0.07
      lfoGain.gain.value = 0.012
      lfo.connect(lfoGain); lfoGain.connect(master.gain)
      osc1.connect(master); osc2.connect(master)
      osc1.start(); osc2.start(); lfo.start()
      return () => {
        stop = true
        osc1.stop(); osc2.stop(); lfo.stop()
        ctx?.close()
      }
    } catch {
      return () => { void stop }
    }
  }, [muted])

  return null
}
