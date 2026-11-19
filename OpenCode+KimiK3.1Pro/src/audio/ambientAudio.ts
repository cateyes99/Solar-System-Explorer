let context: AudioContext | null = null
let master: GainNode | null = null

function createAmbientGraph(): void {
  if (context) return
  context = new AudioContext()
  master = context.createGain()
  master.gain.value = 0
  master.connect(context.destination)

  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 240
  filter.Q.value = 0.6
  filter.connect(master)

  const bed = context.createGain()
  bed.gain.value = 0.22
  bed.connect(filter)

  ;[55, 82.41, 110.2].forEach((frequency, index) => {
    const oscillator = context!.createOscillator()
    const gain = context!.createGain()
    oscillator.type = index === 1 ? 'triangle' : 'sine'
    oscillator.frequency.value = frequency
    oscillator.detune.value = index * 4 - 3
    gain.gain.value = index === 2 ? 0.025 : 0.065
    oscillator.connect(gain)
    gain.connect(bed)
    oscillator.start()
  })

  const lfo = context.createOscillator()
  const lfoGain = context.createGain()
  lfo.frequency.value = 0.07
  lfoGain.gain.value = 0.045
  lfo.connect(lfoGain)
  lfoGain.connect(bed.gain)
  lfo.start()
}

export async function setAmbientAudio(enabled: boolean): Promise<void> {
  if (enabled) {
    createAmbientGraph()
    if (!context || !master) return
    await context.resume()
    master.gain.cancelScheduledValues(context.currentTime)
    master.gain.setTargetAtTime(0.12, context.currentTime, 0.8)
  } else if (context && master) {
    master.gain.cancelScheduledValues(context.currentTime)
    master.gain.setTargetAtTime(0, context.currentTime, 0.25)
  }
}
