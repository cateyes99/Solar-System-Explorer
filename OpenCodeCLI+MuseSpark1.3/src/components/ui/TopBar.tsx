import { useSim } from '../../store/simulationStore';
import { startAmbient, stopAmbient, uiBlip } from '../../utils/audio';
import { RANDOM_FACTS } from '../../data/planets';

export function TopBar() {
  const tourActive = useSim((s) => s.tourActive);
  const learnOpen = useSim((s) => s.learnOpen);
  const whatIfOpen = useSim((s) => s.whatIfOpen);
  const craftActive = useSim((s) => s.craftActive);
  const soundOn = useSim((s) => s.soundOn);
  const showLabels = useSim((s) => s.showLabels);

  const btn = 'px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border border-white/10 bg-white/5 hover:bg-white/15 active:scale-95 whitespace-nowrap';

  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between gap-2 p-2 sm:p-3 pointer-events-none" role="banner">
      <div className="glass rounded-2xl px-3 py-2 pointer-events-auto flex items-center gap-2.5 max-w-[46vw] sm:max-w-none">
        <div className="text-2xl" aria-hidden>🪐</div>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-lg font-extrabold tracking-tight text-white leading-tight truncate">Solar System Explorer</h1>
          <p className="hidden sm:block text-[11px] text-slate-300/80">An interactive space adventure for curious kids 🚀</p>
        </div>
      </div>

      <nav className="glass rounded-2xl px-2 py-1.5 pointer-events-auto flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end max-w-[52vw] sm:max-w-none" aria-label="Main controls">
        <button className={`${btn} ${tourActive ? 'bg-fuchsia-500/40' : ''} text-fuchsia-100`} aria-label={tourActive ? 'Exit cinematic tour' : 'Start cinematic tour'}
          onClick={() => { uiBlip(); const s = useSim.getState(); s.set(tourActive ? { tourActive: false, tourIndex: 0, selectedId: null, cameraMode: 'overview' } : { tourActive: true, tourIndex: 0, tourPlaying: true, selectedId: null, learnOpen: false }); }}>
          🎬 {tourActive ? 'Exit' : 'Tour'}
        </button>
        <button className={`${btn} ${learnOpen ? 'bg-cyan-500/40' : ''} text-cyan-100`} aria-label="Open explore and learn lessons"
          onClick={() => { uiBlip(); useSim.getState().set({ learnOpen: !useSim.getState().learnOpen }); }}>
          📚 Learn
        </button>
        <button className={`${btn} ${whatIfOpen ? 'bg-amber-500/40' : ''} text-amber-100 hidden sm:inline-block`} aria-label="Open what-if experiments"
          onClick={() => { uiBlip(); useSim.getState().set({ whatIfOpen: !useSim.getState().whatIfOpen }); }}>
          🧪 What if?
        </button>
        <button className={`${btn} text-emerald-100`} aria-label="Teach me something — random space fact"
          onClick={() => { uiBlip(); useSim.getState().advanceFact(); }}>
          💡 Surprise fact
        </button>
        <button className={`${btn} ${craftActive ? 'bg-emerald-500/40' : ''} text-emerald-100 hidden md:inline-block`} aria-label="Toggle spacecraft mission control"
          onClick={() => { uiBlip(); const s = useSim.getState(); s.set({ craftActive: !s.craftActive }); }}>
          🚀 {craftActive ? 'Land ship' : 'Fly ship'}
        </button>
        <button className={`${btn} ${showLabels ? 'bg-sky-500/40' : ''} text-sky-100 hidden sm:inline-block`} aria-label="Toggle planet labels"
          onClick={() => { uiBlip(); useSim.getState().set({ showLabels: !useSim.getState().showLabels }); }}>
          🏷️ Labels
        </button>
        <button className={`${btn} ${soundOn ? 'bg-violet-500/40' : ''} text-violet-100`} aria-label={soundOn ? 'Mute ambient sound' : 'Enable ambient sound'}
          onClick={() => {
            const s = useSim.getState();
            if (s.soundOn) { stopAmbient(); s.set({ soundOn: false }); }
            else { startAmbient(); s.set({ soundOn: true }); }
          }}>
          {soundOn ? '🔊' : '🔇'}
        </button>
      </nav>
    </header>
  );
}

export function TimeControls() {
  const paused = useSim((s) => s.paused);
  const speed = useSim((s) => s.speed);
  const simDays = useSim((s) => s.simDays);
  const date = new Date(Date.UTC(2026, 0, 1) + simDays * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

  const speeds: { label: string; v: number; icon: string }[] = [
    { label: 'Slow', v: 0.5, icon: '🐢' },
    { label: 'Normal', v: 2, icon: '🚶' },
    { label: 'Fast', v: 10, icon: '🚀' },
    { label: 'Warp', v: 40, icon: '⚡' },
  ];

  return (
    <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 w-[min(96vw,720px)]" role="group" aria-label="Time controls">
      <div className="glass rounded-2xl px-2.5 sm:px-4 py-2 flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
        <button
          className="w-9 h-9 rounded-xl bg-cyan-400/90 hover:bg-cyan-300 text-slate-950 font-bold text-lg active:scale-95 transition"
          aria-label={paused ? 'Play simulation' : 'Pause simulation'}
          onClick={() => { uiBlip(); useSim.getState().set({ paused: !useSim.getState().paused }); }}
        >
          {paused ? '▶' : '⏸'}
        </button>
        {speeds.map((sp) => (
          <button
            key={sp.label}
            aria-label={`Set speed ${sp.label}`}
            onClick={() => { uiBlip(); useSim.getState().set({ speed: sp.v, paused: false }); }}
            className={`px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 ${!paused && speed === sp.v ? 'bg-cyan-400 text-slate-950 border-cyan-300' : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/15'}`}
          >
            {sp.icon} {sp.label}
          </button>
        ))}
        <div className="ml-auto text-right leading-tight pl-2">
          <div className="text-[11px] sm:text-xs font-bold text-cyan-200">📅 {date}</div>
          <div className="text-[10px] sm:text-[11px] text-slate-300/80">{paused ? 'Paused' : `Speed: ${speed} days/sec`}</div>
        </div>
      </div>
    </div>
  );
}

export function ScaleControl() {
  const mode = useSim((s) => s.scaleMode);
  const sizeMult = useSim((s) => s.sizeMult);
  const distMult = useSim((s) => s.distMult);
  const modes = [
    { id: 'educational', label: '🎓 Educational', tip: 'Easy to see & click' },
    { id: 'relative', label: '📏 True sizes', tip: 'Real size ratios' },
    { id: 'distances', label: '🌌 Distances', tip: 'Feel the emptiness' },
    { id: 'custom', label: '🎛️ Custom', tip: 'Your own mix' },
  ] as const;
  return (
    <div className="glass rounded-2xl p-2.5 w-44 sm:w-48" role="group" aria-label="Scale mode">
      <div className="text-[11px] font-extrabold tracking-wide text-slate-200 mb-1.5">🔭 VIEW SCALE</div>
      <div className="flex flex-col gap-1">
        {modes.map((m) => (
          <button key={m.id} title={m.tip}
            onClick={() => { uiBlip(); useSim.getState().set({ scaleMode: m.id }); }}
            className={`text-left px-2 py-1.5 rounded-lg text-xs font-semibold border transition active:scale-95 ${mode === m.id ? 'bg-cyan-400/90 text-slate-950 border-cyan-300' : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/15'}`}>
            {m.label}
          </button>
        ))}
      </div>
      {mode === 'custom' && (
        <div className="mt-2 space-y-2 text-[11px]">
          <label className="block text-slate-300">Planet size ×{sizeMult.toFixed(1)}
            <input aria-label="Planet size multiplier" type="range" min={0.3} max={2.5} step={0.1} value={sizeMult} onChange={(e) => useSim.getState().set({ sizeMult: Number(e.target.value) })} className="w-full accent-cyan-400" />
          </label>
          <label className="block text-slate-300">Distance ×{distMult.toFixed(1)}
            <input aria-label="Distance multiplier" type="range" min={0.5} max={2} step={0.1} value={distMult} onChange={(e) => useSim.getState().set({ distMult: Number(e.target.value) })} className="w-full accent-cyan-400" />
          </label>
        </div>
      )}
      <p className="mt-2 text-[10px] leading-snug text-slate-400">⚠️ Not to scale — planets are enlarged so you can see them!</p>
    </div>
  );
}

export function RandomFactButton() {
  const show = useSim((s) => s.showFact);
  const idx = useSim((s) => s.factIndex);
  if (!show) return null;
  const fact = RANDOM_FACTS[idx % RANDOM_FACTS.length];
  return (
    <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-30 w-[min(92vw,480px)]" role="status" aria-live="polite">
      <div className="glass rounded-2xl p-4 border-cyan-300/30" style={{ animation: 'float-slow 4s ease-in-out infinite' }}>
        <div className="flex items-start gap-2">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <div className="text-xs font-extrabold tracking-widest text-cyan-300">DID YOU KNOW?</div>
            <p className="text-sm sm:text-base text-white font-medium mt-1">{fact}</p>
          </div>
          <button aria-label="Dismiss fact" onClick={() => useSim.getState().set({ showFact: false })}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-sm">✕</button>
        </div>
        <button onClick={() => useSim.getState().advanceFact()}
          className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 text-sm font-extrabold hover:brightness-110 active:scale-[.98] transition">
          Teach me something else! ✨
        </button>
      </div>
    </div>
  );
}
