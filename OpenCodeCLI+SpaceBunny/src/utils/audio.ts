/**
 * All audio is synthesised with the Web Audio API — no audio files ship with
 * the app. Nothing plays until the user explicitly turns sound on, and the
 * ambient bed is deliberately extremely quiet so it never competes with the
 * visuals.
 */

type SoundName = 'click' | 'focus' | 'whoosh' | 'chime' | 'flare' | 'launch'

class SpaceAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private ambientGain: GainNode | null = null
  private ambientNodes: { osc: OscillatorNode; lfo: OscillatorNode }[] = []
  private noiseSource: AudioBufferSourceNode | null = null
  private enabled = false

  get isEnabled(): boolean {
    return this.enabled
  }

  /** Must be called from a user gesture on most browsers. */
  async setEnabled(enabled: boolean): Promise<void> {
    if (enabled === this.enabled) return
    this.enabled = enabled
    if (enabled) {
      await this.start()
    } else {
      this.stop()
    }
  }

  private async start(): Promise<void> {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.5
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume()
    if (!this.ctx || !this.master) return

    this.ambientGain = this.ctx.createGain()
    this.ambientGain.gain.value = 0.0001
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 420
    filter.Q.value = 0.7
    this.ambientGain.connect(filter)
    filter.connect(this.master)

    // Two slightly detuned low drones plus a slow tremolo.
    const base = 55
    for (const ratio of [1, 1.5, 2.02]) {
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = base * ratio

      const gain = this.ctx.createGain()
      gain.gain.value = ratio === 1 ? 0.5 : 0.16

      const lfo = this.ctx.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 0.03 + ratio * 0.017
      const lfoGain = this.ctx.createGain()
      lfoGain.gain.value = gain.gain.value * 0.7
      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)

      osc.connect(gain)
      gain.connect(this.ambientGain)
      osc.start()
      lfo.start()
      this.ambientNodes.push({ osc, lfo })
    }

    // A whisper of filtered noise for "air in a big empty room".
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 4, this.ctx.sampleRate)
    const channel = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < channel.length; i += 1) {
      const white = Math.random() * 2 - 1
      last = last * 0.96 + white * 0.04
      channel[i] = last * 3
    }
    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    const noiseFilter = this.ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 260
    noiseFilter.Q.value = 0.6
    const noiseGain = this.ctx.createGain()
    noiseGain.gain.value = 0.09
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(this.ambientGain)
    noise.start()
    this.noiseSource = noise

    this.ambientGain.gain.exponentialRampToValueAtTime(0.06, this.ctx.currentTime + 4)
  }

  private stop(): void {
    if (!this.ctx || !this.ambientGain) return
    const now = this.ctx.currentTime
    this.ambientGain.gain.cancelScheduledValues(now)
    this.ambientGain.gain.setValueAtTime(Math.max(0.0001, this.ambientGain.gain.value), now)
    this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)
    const nodes = this.ambientNodes
    const noise = this.noiseSource
    window.setTimeout(() => {
      nodes.forEach(({ osc, lfo }) => {
        try {
          osc.stop()
          lfo.stop()
        } catch {
          /* already stopped */
        }
      })
      try {
        noise?.stop()
      } catch {
        /* already stopped */
      }
    }, 700)
    this.ambientNodes = []
    this.noiseSource = null
    this.ambientGain = null
  }

  play(name: SoundName): void {
    if (!this.enabled || !this.ctx || !this.master) return
    const ctx = this.ctx
    const now = ctx.currentTime

    const blip = (freq: number, duration: number, gain: number, type: OscillatorType, sweep = 0) => {
      const osc = ctx.createOscillator()
      osc.type = type
      osc.frequency.setValueAtTime(freq, now)
      if (sweep) osc.frequency.exponentialRampToValueAtTime(freq * sweep, now + duration)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(gain, now + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, now + duration)
      osc.connect(g)
      g.connect(this.master!)
      osc.start(now)
      osc.stop(now + duration + 0.05)
    }

    switch (name) {
      case 'click':
        blip(880, 0.09, 0.05, 'triangle', 0.85)
        break
      case 'focus':
        blip(420, 0.3, 0.06, 'sine', 1.9)
        blip(630, 0.42, 0.03, 'sine', 1.7)
        break
      case 'chime':
        blip(523.25, 0.9, 0.05, 'sine')
        blip(783.99, 1.1, 0.035, 'sine')
        blip(1046.5, 1.4, 0.02, 'sine')
        break
      case 'whoosh': {
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.9, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
        const src = ctx.createBufferSource()
        src.buffer = buffer
        const filter = ctx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.Q.value = 1.2
        filter.frequency.setValueAtTime(260, now)
        filter.frequency.exponentialRampToValueAtTime(2200, now + 0.7)
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.0001, now)
        g.gain.exponentialRampToValueAtTime(0.09, now + 0.18)
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)
        src.connect(filter)
        filter.connect(g)
        g.connect(this.master)
        src.start(now)
        break
      }
      case 'flare': {
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 1.4, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < data.length; i += 1) {
          const t = i / data.length
          data[i] = (Math.random() * 2 - 1) * (1 - t) ** 2
        }
        const src = ctx.createBufferSource()
        src.buffer = buffer
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(2600, now)
        filter.frequency.exponentialRampToValueAtTime(220, now + 1.2)
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.0001, now)
        g.gain.exponentialRampToValueAtTime(0.14, now + 0.05)
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4)
        src.connect(filter)
        filter.connect(g)
        g.connect(this.master)
        src.start(now)
        break
      }
      case 'launch':
        blip(160, 1.1, 0.07, 'sawtooth', 6)
        blip(320, 0.8, 0.03, 'sine', 4)
        break
      default:
        break
    }
  }

  dispose(): void {
    this.stop()
    this.enabled = false
    void this.ctx?.close()
    this.ctx = null
    this.master = null
  }
}

export const spaceAudio = new SpaceAudio()