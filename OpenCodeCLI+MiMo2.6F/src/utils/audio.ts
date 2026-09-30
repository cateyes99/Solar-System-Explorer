/**
 * Optional ambient audio, fully synthesised with the Web Audio API.
 * No audio files are downloaded and nothing plays until the user opts in.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let ambientNodes: AudioNode[] = []
let ambientGain: GainNode | null = null

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) {
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function makeNoiseBuffer(context: AudioContext, seconds = 4): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.2
  }
  return buffer
}

/** Start the very quiet space drone. Safe to call repeatedly. */
export function startAmbient(): void {
  const context = ensureContext()
  if (!context || !master || ambientGain) return

  ambientGain = context.createGain()
  ambientGain.gain.value = 0
  ambientGain.connect(master)

  // Two low drones, slightly detuned → gentle beating
  for (const [freq, detune] of [
    [55, 0],
    [82.4, 6],
    [110, -5],
  ] as const) {
    const osc = context.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.detune.value = detune
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 320
    const g = context.createGain()
    g.gain.value = 0.33
    osc.connect(filter).connect(g).connect(ambientGain)
    osc.start()
    ambientNodes.push(osc, filter, g)
  }

  // Slow swell LFO so it feels alive rather than static
  const lfo = context.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.06
  const lfoGain = context.createGain()
  lfoGain.gain.value = 0.35
  lfo.connect(lfoGain).connect(ambientGain.gain)
  lfo.start()
  ambientNodes.push(lfo, lfoGain)

  // Whisper of filtered noise (starlight hiss)
  const noise = context.createBufferSource()
  noise.buffer = makeNoiseBuffer(context)
  noise.loop = true
  const noiseFilter = context.createBiquadFilter()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.value = 700
  noiseFilter.Q.value = 0.4
  const noiseGain = context.createGain()
  noiseGain.gain.value = 0.06
  noise.connect(noiseFilter).connect(noiseGain).connect(ambientGain)
  noise.start()
  ambientNodes.push(noise, noiseFilter, noiseGain)

  // Fade in
  const now = context.currentTime
  ambientGain.gain.cancelScheduledValues(now)
  ambientGain.gain.setValueAtTime(0, now)
  ambientGain.gain.linearRampToValueAtTime(0.05, now + 2.5)
}

export function stopAmbient(): void {
  if (!ctx || !ambientGain) return
  const now = ctx.currentTime
  const gain = ambientGain
  gain.gain.cancelScheduledValues(now)
  gain.gain.setValueAtTime(gain.gain.value, now)
  gain.gain.linearRampToValueAtTime(0, now + 0.8)
  const nodes = ambientNodes
  window.setTimeout(() => {
    nodes.forEach((node) => {
      if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
        try {
          node.stop()
        } catch {
          /* already stopped */
        }
      }
      node.disconnect()
    })
    gain.disconnect()
  }, 1000)
  ambientNodes = []
  ambientGain = null
}

export function playBlip(pitch = 660, duration = 0.09, volume = 0.05): void {
  const context = ensureContext()
  if (!context || !master) return
  const osc = context.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = pitch
  const gain = context.createGain()
  const now = context.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(volume, now + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.connect(gain).connect(master)
  osc.start(now)
  osc.stop(now + duration + 0.05)
}

export function playWhoosh(volume = 0.06): void {
  const context = ensureContext()
  if (!context || !master) return
  const source = context.createBufferSource()
  source.buffer = makeNoiseBuffer(context, 2)
  const filter = context.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 1.4
  const now = context.currentTime
  filter.frequency.setValueAtTime(300, now)
  filter.frequency.exponentialRampToValueAtTime(2400, now + 0.7)
  const gain = context.createGain()
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(volume, now + 0.12)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)
  source.connect(filter).connect(gain).connect(master)
  source.start(now)
  source.stop(now + 1)
}

export function setMasterVolume(value: number): void {
  if (master && ctx) {
    master.gain.setTargetAtTime(value, ctx.currentTime, 0.1)
  }
}
