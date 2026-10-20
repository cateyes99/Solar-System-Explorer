/**
 * Tiny procedural audio engine — no audio files needed.
 * Everything is synthesised with the Web Audio API. Sound is OFF by default and
 * only starts after an explicit user click (browsers require a gesture anyway).
 */
class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private ambientGain: GainNode | null = null
  private ambientStarted = false
  enabled = false

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.6
      this.master.connect(this.ctx.destination)
    } catch {
      this.ctx = null
    }
    return this.ctx
  }

  setEnabled(on: boolean): void {
    this.enabled = on
    const ctx = this.ensureContext()
    if (!ctx || !this.master) return
    if (on) {
      void ctx.resume()
      this.startAmbient()
      this.ambientGain?.gain.setTargetAtTime(0.05, ctx.currentTime, 1.5)
    } else {
      this.ambientGain?.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3)
    }
  }

  /** Soft evolving space drone: detuned oscillators through a low-pass filter. */
  private startAmbient(): void {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master || this.ambientStarted) return
    this.ambientStarted = true

    const pad = ctx.createGain()
    pad.gain.value = 1
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 420
    pad.connect(filter)
    filter.connect(master)
    this.ambientGain = pad

    const freqs = [55, 82.5, 110.3, 164.8]
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator()
      osc.type = i % 2 === 0 ? 'sine' : 'triangle'
      osc.frequency.value = f
      osc.detune.value = (i - 1.5) * 4
      const g = ctx.createGain()
      g.gain.value = i === 0 ? 0.5 : 0.22
      osc.connect(g)
      g.connect(pad)
      // Slow LFO so the drone "breathes" instead of droning flatly.
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.05 + i * 0.017
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = g.gain.value * 0.6
      lfo.connect(lfoGain)
      lfoGain.connect(g.gain)
      osc.start()
      lfo.start()
    })
  }

  /** Short UI blip. Only audible when sound is enabled. */
  blip(freq = 740, dur = 0.07, vol = 0.12): void {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    const master = this.master
    if (!ctx || !master) return
    void ctx.resume()
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(vol, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    osc.connect(g)
    g.connect(master)
    osc.start()
    osc.stop(ctx.currentTime + dur + 0.02)
  }

  /** Soft filtered-noise whoosh for cinematic transitions. */
  whoosh(): void {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    const master = this.master
    if (!ctx || !master) return
    void ctx.resume()
    const dur = 1.6
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 0.7
    filter.frequency.setValueAtTime(220, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + dur * 0.7)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.25)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    src.connect(filter)
    filter.connect(g)
    g.connect(master)
    src.start()
  }
}

export const audio = new AudioEngine()
