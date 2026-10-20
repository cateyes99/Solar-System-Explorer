type UiSound = 'tick' | 'select' | 'open'
type CinematicSound = 'whoosh' | 'flare' | 'reveal'

/** Tiny synthesised sound engine – no audio files, nothing plays until the user turns sound on. */
class SpaceAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private ambientGain: GainNode | null = null
  private ambientNodes: AudioScheduledSourceNode[] = []
  private noiseBuffer: AudioBuffer | null = null

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined' || !('AudioContext' in window)) return null
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.8
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  private noise(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer
    const length = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
    this.noiseBuffer = buffer
    return buffer
  }

  setAmbient(on: boolean): void {
    if (!on) {
      this.stopAmbient()
      return
    }
    const ctx = this.ensure()
    if (!ctx || !this.master || this.ambientGain) return
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 4)
    gain.connect(this.master)
    this.ambientGain = gain

    const freqs = [55, 82.6, 110.3]
    for (const [i, f] of freqs.entries()) {
      const osc = ctx.createOscillator()
      osc.type = i === 2 ? 'triangle' : 'sine'
      osc.frequency.value = f
      osc.detune.value = (i - 1) * 4
      const g = ctx.createGain()
      g.gain.value = i === 2 ? 0.12 : 0.35
      osc.connect(g).connect(gain)
      osc.start()
      this.ambientNodes.push(osc)
    }

    const noise = ctx.createBufferSource()
    noise.buffer = this.noise(ctx)
    noise.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 420
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.05
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 220
    lfo.connect(lfoGain).connect(filter.frequency)
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.25
    noise.connect(filter).connect(noiseGain).connect(gain)
    noise.start()
    lfo.start()
    this.ambientNodes.push(noise, lfo)
  }

  private stopAmbient(): void {
    const ctx = this.ctx
    const gain = this.ambientGain
    if (!ctx || !gain) return
    gain.gain.cancelScheduledValues(ctx.currentTime)
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)
    const nodes = this.ambientNodes
    this.ambientNodes = []
    this.ambientGain = null
    window.setTimeout(() => {
      nodes.forEach((n) => n.stop())
      gain.disconnect()
    }, 1100)
  }

  ui(kind: UiSound): void {
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    const t = ctx.currentTime
    const notes = kind === 'tick' ? [1320] : kind === 'select' ? [660, 990] : [523, 784]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = t + i * 0.07
      g.gain.setValueAtTime(0, start)
      g.gain.linearRampToValueAtTime(kind === 'tick' ? 0.025 : 0.05, start + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, start + (kind === 'tick' ? 0.06 : 0.22))
      osc.connect(g).connect(this.master as GainNode)
      osc.start(start)
      osc.stop(start + 0.3)
    })
  }

  cinematic(kind: CinematicSound): void {
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    const t = ctx.currentTime
    if (kind === 'reveal') {
      ;[261.6, 392, 523.3].forEach((freq) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.frequency.value = freq
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.03, t + 1.2)
        g.gain.linearRampToValueAtTime(0, t + 3.5)
        osc.connect(g).connect(this.master as GainNode)
        osc.start(t)
        osc.stop(t + 3.6)
      })
      return
    }
    const src = ctx.createBufferSource()
    src.buffer = this.noise(ctx)
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = kind === 'flare' ? 0.7 : 1.4
    const g = ctx.createGain()
    const duration = kind === 'flare' ? 2.4 : 1.8
    filter.frequency.setValueAtTime(kind === 'flare' ? 120 : 260, t)
    filter.frequency.exponentialRampToValueAtTime(kind === 'flare' ? 900 : 1600, t + duration * 0.45)
    filter.frequency.exponentialRampToValueAtTime(180, t + duration)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(kind === 'flare' ? 0.35 : 0.18, t + duration * 0.4)
    g.gain.linearRampToValueAtTime(0, t + duration)
    src.connect(filter).connect(g).connect(this.master)
    src.start(t)
    src.stop(t + duration + 0.1)
  }
}

export const audio = new SpaceAudio()
