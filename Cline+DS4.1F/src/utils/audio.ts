/**
 * Optional ambient audio, generated with the Web Audio API.
 *
 * No audio files are downloaded: the ambience is a pair of very quiet detuned
 * oscillators plus filtered noise, and interface sounds are short envelopes.
 * Audio is off until the user switches it on, and the context is created inside
 * that click, so browsers never block playback.
 */
export type SoundEffect = 'click' | 'hover' | 'arrive' | 'whoosh' | 'flare'

type AudioContextCtor = new () => AudioContext

function audioContextCtor(): AudioContextCtor | undefined {
  if (typeof window === 'undefined') return undefined
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
  )
}

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private ambientGain: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private volume = 0.35
  enabled = false

  /** Must be called from a user gesture (the sound button in the header). */
  enable(): boolean {
    const Ctor = audioContextCtor()
    if (!Ctor) return false
    if (!this.ctx) {
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.volume * 0.5
      this.master.connect(this.ctx.destination)
      this.noiseBuffer = this.createNoiseBuffer(this.ctx)
      this.startAmbient()
    }
    void this.ctx.resume()
    this.enabled = true
    return true
  }

  disable(): void {
    this.enabled = false
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.cancelScheduledValues(this.ctx.currentTime)
      this.ambientGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4)
    }
    if (this.ctx && this.ctx.state === 'running') {
      void this.ctx.suspend()
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.volume * 0.5, this.ctx.currentTime, 0.1)
    }
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * 3)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < length; i += 1) {
      // Brown-ish noise: smoother and less hissy than white noise.
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.2
    }
    return buffer
  }

  private startAmbient(): void {
    if (!this.ctx || !this.master || !this.noiseBuffer) return
    const ctx = this.ctx
    const ambient = ctx.createGain()
    ambient.gain.value = 0
    ambient.gain.setTargetAtTime(0.55, ctx.currentTime, 3)
    ambient.connect(this.master)
    this.ambientGain = ambient

    // Two very low, slowly beating tones: the "hum" of deep space.
    ;[55, 82.5].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      const gain = ctx.createGain()
      gain.gain.value = index === 0 ? 0.16 : 0.09
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.05 + index * 0.03
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.06
      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)
      oscillator.connect(gain)
      gain.connect(ambient)
      oscillator.start()
      lfo.start()
    })

    // Filtered noise gives a faint "solar wind" texture.
    const noise = ctx.createBufferSource()
    noise.buffer = this.noiseBuffer
    noise.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 420
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.22
    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(ambient)
    noise.start()
  }

  play(effect: SoundEffect): void {
    if (!this.enabled || !this.ctx) return
    switch (effect) {
      case 'click':
        this.tone(660, 0.12, 0.28, 'triangle')
        break
      case 'hover':
        this.tone(880, 0.07, 0.06, 'sine')
        break
      case 'arrive':
        this.tone(523.25, 0.18, 0.22, 'sine')
        window.setTimeout(() => this.tone(783.99, 0.22, 0.22, 'sine'), 130)
        break
      case 'whoosh':
        this.noiseSweep(200, 1800, 1.4, 0.2)
        break
      case 'flare':
        this.noiseSweep(3200, 220, 1.8, 0.28)
        break
    }
  }

  private noiseSweep(from: number, to: number, duration: number, peak: number): void {
    if (!this.ctx || !this.master || !this.noiseBuffer) return
    const ctx = this.ctx
    const now = ctx.currentTime
    const source = ctx.createBufferSource()
    source.buffer = this.noiseBuffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 0.8
    filter.frequency.setValueAtTime(from, now)
    filter.frequency.exponentialRampToValueAtTime(to, now + duration)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(peak * this.volume + 0.0001, now + 0.12)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    source.start(now)
    source.stop(now + duration + 0.1)
  }

  private tone(frequency: number, duration: number, peak: number, type: OscillatorType): void {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const now = ctx.currentTime
    const oscillator = ctx.createOscillator()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(peak * this.volume + 0.0001, now + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    oscillator.connect(gain)
    gain.connect(this.master)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.05)
  }
}

export const audio = new AudioEngine()