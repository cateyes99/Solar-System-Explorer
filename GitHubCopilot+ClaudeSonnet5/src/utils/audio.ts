/**
 * Minimal procedural Web Audio layer — no external audio files. All playback
 * requires an explicit user gesture first (browser autoplay policy + spec
 * requirement that audio is opt-in). Sound is OFF by default.
 */

let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let ambientNodes: { oscillators: OscillatorNode[]; gain: GainNode } | null = null

function ensureContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
    masterGain = audioCtx.createGain()
    masterGain.gain.value = 0.35
    masterGain.connect(audioCtx.destination)
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume()
  }
  return audioCtx
}

/** Call directly inside a click handler to satisfy autoplay-policy gesture requirements. */
export function primeAudio(): void {
  ensureContext()
}

export function setAmbientEnabled(enabled: boolean): void {
  const ctx = ensureContext()
  if (enabled) {
    if (ambientNodes || !masterGain) return
    const gain = ctx.createGain()
    gain.gain.value = 0
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 700
    filter.connect(gain)
    gain.connect(masterGain)

    const oscillators = [55, 82.5, 110].map((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = i === 1 ? 'triangle' : 'sine'
      osc.frequency.value = freq
      osc.detune.value = (i - 1) * 6
      osc.connect(filter)
      osc.start()
      return osc
    })

    gain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 2.5)
    ambientNodes = { oscillators, gain }
  } else {
    if (!ambientNodes) return
    const { oscillators, gain } = ambientNodes
    gain.gain.cancelScheduledValues(ctx.currentTime)
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)
    setTimeout(() => oscillators.forEach((osc) => osc.stop()), 1100)
    ambientNodes = null
  }
}

export function playBlip(frequency = 660): void {
  const ctx = ensureContext()
  if (!masterGain) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency
  gain.gain.value = 0.0001
  osc.connect(gain)
  gain.connect(masterGain)
  const now = ctx.currentTime
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
  osc.start(now)
  osc.stop(now + 0.3)
}

export function playFlare(): void {
  const ctx = ensureContext()
  if (!masterGain) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sawtooth'
  gain.gain.value = 0.0001
  osc.connect(gain)
  gain.connect(masterGain)
  const now = ctx.currentTime
  osc.frequency.setValueAtTime(120, now)
  osc.frequency.exponentialRampToValueAtTime(640, now + 0.6)
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)
  osc.start(now)
  osc.stop(now + 0.85)
}
