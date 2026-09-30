// Tiny procedural ambient sound engine (WebAudio, no assets).
// Off by default; started only after explicit user gesture.

let ctx: AudioContext | null = null;
let nodes: OscillatorNode[] = [];
let gain: GainNode | null = null;
let blipGain: GainNode | null = null;

export function startAmbient() {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    stopAmbient(true);
    gain = ctx.createGain();
    gain.gain.value = 0.0;
    gain.connect(ctx.destination);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 3);

    const freqs = [55, 82.4, 110.3, 164.8];
    nodes = freqs.map((f, i) => {
      const o = ctx!.createOscillator();
      o.type = i % 2 ? 'sine' : 'triangle';
      o.frequency.value = f;
      const g = ctx!.createGain();
      g.gain.value = i === 0 ? 0.5 : 0.18;
      // slow LFO shimmer
      const lfo = ctx!.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.03;
      const lg = ctx!.createGain();
      lg.gain.value = 0.08;
      lfo.connect(lg);
      lg.connect(g.gain);
      o.connect(g);
      g.connect(gain!);
      o.start();
      lfo.start();
      nodes.push(lfo);
      return o;
    });

    blipGain = ctx.createGain();
    blipGain.gain.value = 0.12;
    blipGain.connect(ctx.destination);
  } catch {
    /* audio unavailable */
  }
}

export function stopAmbient(silent = false) {
  try {
    if (gain && ctx && !silent) gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    const old = [...nodes];
    nodes = [];
    setTimeout(() => old.forEach((o) => { try { o.stop(); } catch { /* noop */ } }), silent ? 0 : 600);
  } catch { /* noop */ }
}

export function uiBlip() {
  try {
    if (!ctx || !blipGain) return;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 660;
    o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
    const g = ctx.createGain();
    g.gain.value = 0.5;
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    o.connect(g);
    g.connect(blipGain);
    o.start();
    o.stop(ctx.currentTime + 0.16);
  } catch { /* noop */ }
}
