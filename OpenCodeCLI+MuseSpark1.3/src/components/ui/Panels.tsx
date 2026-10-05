import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLANETS, SUN, MOON, LESSONS, TOUR_STOPS } from '../../data/planets';
import { useSim } from '../../store/simulationStore';
import { formatSimDate } from '../../utils/scale';
import { timeRef, craftRef } from '../3d/SolarSystemScene';
import { uiBlip } from '../../utils/audio';

/* ---------------- Planet info panel ---------------- */
export function PlanetPanel() {
  const selectedId = useSim((s) => s.selectedId);
  if (!selectedId) return null;
  const isSun = selectedId === 'sun';
  const isMoon = selectedId === 'moon';
  const p = isSun || isMoon ? null : PLANETS.find((x) => x.id === selectedId);
  if (!isSun && !isMoon && !p) return null;

  const rows: [string, string][] = isSun
    ? [
        ['Type', 'Star 🌟'],
        ['Diameter', '1,392,700 km'],
        ['Temperature', '5,505°C surface'],
        ['Age', '4.6 billion years'],
        ['Light to Earth', '~8 minutes'],
      ]
    : isMoon
    ? [
        ['Type', 'Moon 🌙'],
        ['Diameter', `${MOON.diameterKm.toLocaleString()} km`],
        ['Distance from Earth', '384,400 km'],
        ['Orbit around Earth', '27.3 days'],
        ['Day length', '29.5 days (same face always toward us!)'],
        ['Temperature', '-180 to 120°C'],
      ]
    : [
        ['Type', p!.type],
        ['Diameter', `${p!.diameterKm.toLocaleString()} km`],
        ['Distance from Sun', `${p!.distanceFromSunKm.toLocaleString()}M km · ${p!.distanceAU} AU`],
        ['Year length', `${p!.orbitalPeriodDays.toLocaleString()} days`],
        ['Day length', `${Math.abs(p!.rotationPeriodHours).toLocaleString()} hours${p!.rotationPeriodHours < 0 ? ' (spins backwards!)' : ''}`],
        ['Moons', `${p!.moons}`],
        ['Temperature', p!.temperatureC],
      ];

  const desc = isSun ? SUN.description : isMoon ? MOON.description : p!.description;
  const facts = isSun ? SUN.facts : isMoon ? MOON.facts : p!.facts;
  const dyk = isSun ? SUN.didYouKnow : isMoon ? MOON.didYouKnow : p!.didYouKnow;
  const emoji = isSun ? '☀️' : isMoon ? '🌙' : p!.emoji;
  const name = isSun ? 'Sun' : isMoon ? 'Moon' : p!.name;

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="absolute right-2 sm:right-3 top-20 sm:top-24 bottom-24 z-20 w-[min(88vw,340px)] flex"
      aria-label={`${name} information`}
    >
      <div className="glass rounded-2xl p-4 overflow-y-auto scroll-thin w-full">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-3xl">{emoji}</div>
            <h2 className="text-xl font-extrabold text-white text-glow">{name}</h2>
            <div className="text-xs text-cyan-300 font-semibold">{isSun ? 'Our star' : isMoon ? MOON.type : p!.type}</div>
          </div>
          <button aria-label={`Close ${name} panel`} onClick={() => useSim.getState().set({ selectedId: null, cameraMode: 'overview' })}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 font-bold">✕</button>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-slate-200">{desc}</p>

        <dl className="mt-3 space-y-1.5">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2 text-xs bg-white/5 rounded-lg px-2 py-1.5 border border-white/5">
              <dt className="text-slate-400 font-semibold shrink-0">{k}</dt>
              <dd className="text-right text-slate-100 font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-3">
          <div className="text-xs font-extrabold text-slate-300 tracking-widest">COOL FACTS</div>
          <ul className="mt-1 space-y-1">
            {facts.map((f, i) => (
              <li key={i} className="text-xs text-slate-200 bg-white/5 border border-white/5 rounded-lg px-2 py-1.5">🌟 {f}</li>
            ))}
          </ul>
        </div>

        <div className="mt-3 rounded-xl p-3 bg-gradient-to-br from-amber-400/20 to-fuchsia-500/20 border border-amber-300/30">
          <div className="text-xs font-extrabold text-amber-200">💡 DID YOU KNOW?</div>
          <p className="text-[13px] text-white mt-1 font-medium">{dyk}</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <button onClick={() => useSim.getState().set({ cameraMode: 'focus' })}
            className="py-2 rounded-xl bg-cyan-400/90 text-slate-950 text-xs font-extrabold hover:bg-cyan-300 active:scale-95">👁 View</button>
          <button onClick={() => useSim.getState().set({ cameraMode: 'follow' })}
            className="py-2 rounded-xl bg-violet-500/80 text-white text-xs font-extrabold hover:bg-violet-400 active:scale-95">🛰 Follow</button>
          <button onClick={() => useSim.getState().set({ selectedId: null, cameraMode: 'overview' })}
            className="col-span-2 py-2 rounded-xl bg-white/10 text-slate-100 text-xs font-extrabold hover:bg-white/20 active:scale-95">🌌 Back to Solar System</button>
        </div>
      </div>
    </motion.aside>
  );
}

/* ---------------- Left-hand bodies menu (Sun · planets · Moon) ---------------- */
const BODY_MENU: { id: string; emoji: string; name: string }[] = [
  { id: 'sun', emoji: '☀️', name: 'Sun' },
  ...PLANETS.map((p) => ({ id: p.id, emoji: p.emoji, name: p.name })),
  { id: 'moon', emoji: '🌙', name: 'Moon' },
];

export function BodyMenu() {
  const open = useSim((s) => s.bodiesMenuOpen);
  const selectedId = useSim((s) => s.selectedId);
  return (
    <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10" role="navigation" aria-label="Celestial bodies">
      {!open ? (
        <button aria-label="Open bodies menu" title="Bodies"
          onClick={() => { uiBlip(); useSim.getState().set({ bodiesMenuOpen: true }); }}
          className="glass w-10 h-10 rounded-xl text-lg hover:bg-white/15 active:scale-95">🪐</button>
      ) : (
        <div className="glass rounded-2xl p-1.5 w-36 sm:w-40 max-h-[52vh] overflow-y-auto scroll-thin">
          <div className="flex items-center justify-between px-1.5 py-1">
            <span className="text-[11px] font-extrabold tracking-widest text-slate-300">🪐 BODIES</span>
            <button aria-label="Collapse bodies menu" onClick={() => useSim.getState().set({ bodiesMenuOpen: false })}
              className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold">‹</button>
          </div>
          <ul className="space-y-0.5">
            {BODY_MENU.map((b) => (
              <li key={b.id}>
                <button
                  aria-label={`View ${b.name}`}
                  title={`${b.name} — click to view, double-click to follow`}
                  onClick={() => { uiBlip(); useSim.getState().select(b.id); }}
                  onDoubleClick={() => useSim.getState().set({ selectedId: b.id, cameraMode: 'follow' })}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 ${selectedId === b.id ? 'bg-cyan-400/90 text-slate-950 border-cyan-300' : 'bg-white/5 text-slate-100 border-transparent hover:bg-white/15'}`}
                >
                  <span className="text-base leading-none">{b.emoji}</span>
                  <span className="truncate">{b.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- Learn panel with interactive widgets ---------------- */
export function LearnPanel() {
  const open = useSim((s) => s.learnOpen);
  const tab = useSim((s) => s.learnTab);
  const lesson = LESSONS.find((l) => l.id === tab) ?? LESSONS[0];
  return (
    <AnimatePresence>
      {open && (
        <motion.section
          initial={{ x: -340, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -340, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 28 }}
          className="absolute left-2 sm:left-3 top-20 sm:top-24 bottom-24 z-20 w-[min(90vw,360px)] flex"
          aria-label="Explore and learn"
        >
          <div className="glass rounded-2xl p-3.5 overflow-y-auto scroll-thin w-full">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white">📚 Explore &amp; Learn</h2>
              <button aria-label="Close lessons" onClick={() => useSim.getState().set({ learnOpen: false })}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 font-bold">✕</button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1">
              {LESSONS.map((l) => (
                <button key={l.id} title={l.title} aria-label={`Lesson: ${l.title}`}
                  onClick={() => { uiBlip(); useSim.getState().set({ learnTab: l.id }); }}
                  className={`py-1.5 rounded-xl text-lg border transition active:scale-95 ${tab === l.id ? 'bg-cyan-400/90 border-cyan-300' : 'bg-white/5 border-white/10 hover:bg-white/15'}`}>
                  {l.emoji}
                </button>
              ))}
            </div>
            <h3 className="mt-2.5 text-sm font-extrabold text-cyan-200">{lesson.emoji} {lesson.title}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-200">{lesson.body}</p>
            <div className="mt-2.5"><LessonWidget id={lesson.id} /></div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function LessonWidget({ id }: { id: string }) {
  const set = useSim.getState().set;
  const moonPhase = useSim((s) => s.moonPhase);
  const manual = useSim((s) => s.moonPhaseManual);
  const mass = useSim((s) => s.gravityMass);
  const [compare, setCompare] = useState<'jupiter' | 'saturn' | 'mars'>('jupiter');

  if (id === 'sizes') {
    const sizes: Record<string, { e: number; o: number; label: string }> = {
      jupiter: { e: 14, o: 140, label: 'Jupiter is ~11× wider than Earth!' },
      saturn: { e: 15, o: 130, label: 'Saturn is ~9× wider than Earth!' },
      mars: { e: 40, o: 76, label: 'Mars is only half as wide as Earth!' },
    };
    const c = sizes[compare];
    return (
      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
        <div className="text-xs font-bold text-slate-200 mb-1.5">Earth vs …</div>
        <div className="flex gap-1 mb-2">
          {(['jupiter', 'saturn', 'mars'] as const).map((k) => (
            <button key={k} onClick={() => setCompare(k)}
              className={`px-2 py-1 rounded-lg text-xs font-bold capitalize border ${compare === k ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-white/10 text-slate-200 border-white/10'}`}>{k}</button>
          ))}
        </div>
        <div className="flex items-end justify-center gap-4 h-28">
          <div className="text-center">
            <div className="mx-auto rounded-full bg-gradient-to-br from-blue-400 to-green-500 border border-cyan-200/50" style={{ width: c.e, height: c.e }} />
            <div className="text-[10px] text-slate-300 mt-1">Earth</div>
          </div>
          <div className="text-center">
            <div className="mx-auto rounded-full bg-gradient-to-br from-amber-300 to-orange-600 border border-amber-100/40" style={{ width: c.o, height: c.o, maxWidth: 150, maxHeight: 90 }} />
            <div className="text-[10px] text-slate-300 mt-1 capitalize">{compare}</div>
          </div>
        </div>
        <p className="text-[11px] text-amber-200 font-semibold mt-1">✨ {c.label}</p>
        <button onClick={() => set({ selectedId: compare, cameraMode: 'focus' })}
          className="mt-1.5 w-full py-1.5 rounded-lg bg-cyan-400/90 text-slate-950 text-xs font-extrabold">See the real {compare} 🪐</button>
      </div>
    );
  }

  if (id === 'gravity') {
    return (
      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
        <div className="text-xs font-bold text-slate-200">☀️ Sun mass: ×{mass.toFixed(1)}</div>
        <input aria-label="Sun mass multiplier" type="range" min={0.3} max={2.2} step={0.1} value={mass}
          onChange={(e) => set({ gravityMass: Number(e.target.value) })} className="w-full accent-amber-400" />
        <div className="mt-1 h-20 relative rounded-lg bg-black/40 border border-white/10 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400"
            style={{ width: 18 * mass, height: 18 * mass, boxShadow: '0 0 18px #fbbf24' }} />
          <div className="absolute rounded-full border border-dashed border-cyan-300/70"
            style={{ width: 110 / Math.sqrt(mass), height: 110 / Math.sqrt(mass), left: `calc(50% - ${55 / Math.sqrt(mass)}px)`, top: `calc(50% - ${55 / Math.sqrt(mass)}px)` }} />
          <div className="absolute text-sm" style={{ left: `calc(50% + ${50 / Math.sqrt(mass)}px)`, top: '50%' }}>🌍</div>
        </div>
        <p className="text-[11px] text-slate-300 mt-1">
          {mass < 0.8 ? '🕊️ Light Sun → orbits get WIDE and slow. Gravity barely holds on!' : mass > 1.4 ? '🧲 Heavy Sun → orbits get TIGHT and fast. Super grip!' : '⚖️ Just right — like our real Sun!'}
        </p>
        <button onClick={() => set({ gravityMass: 1 })} className="mt-1 text-[11px] px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20">Reset Sun</button>
      </div>
    );
  }

  if (id === 'moon') {
    const phase = manual ? moonPhase : (timeRef.days * 0.48) % 1;
    const names: [number, string][] = [[0.03, '🌑 New Moon'], [0.2, '🌒 Crescent'], [0.28, '🌓 First Quarter'], [0.45, '🌔 Gibbous'], [0.53, '🌕 Full Moon'], [0.7, '🌖 Gibbous'], [0.8, '🌗 Last Quarter'], [0.95, '🌘 Crescent']];
    const label = [...names].reverse().find(([t]) => phase >= t)?.[1] ?? '🌑 New Moon';
    return (
      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
        <div className="text-5xl" aria-label={label}>
          {phase < 0.06 || phase > 0.94 ? '🌑' : phase < 0.22 ? '🌒' : phase < 0.31 ? '🌓' : phase < 0.44 ? '🌔' : phase < 0.56 ? '🌕' : phase < 0.69 ? '🌖' : phase < 0.81 ? '🌗' : '🌘'}
        </div>
        <div className="text-xs font-extrabold text-indigo-200 mt-1">{label}</div>
        <input aria-label="Moon phase" type="range" min={0} max={0.99} step={0.01} value={manual ? moonPhase : phase}
          onChange={(e) => set({ moonPhase: Number(e.target.value), moonPhaseManual: true })} className="w-full accent-indigo-400 mt-1" />
        <div className="flex gap-1 mt-1">
          <button onClick={() => set({ moonPhaseManual: false, selectedId: 'earth', cameraMode: 'focus' })}
            className="flex-1 py-1.5 rounded-lg bg-indigo-400/90 text-slate-950 text-[11px] font-extrabold">▶ Live Moon</button>
          <button onClick={() => set({ moonPhaseManual: true, moonPhase: 0.5 })}
            className="flex-1 py-1.5 rounded-lg bg-white/10 text-slate-100 text-[11px] font-extrabold">🌕 Jump to Full</button>
        </div>
      </div>
    );
  }

  if (id === 'seasons' || id === 'daynight') {
    return (
      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
        <div className="text-4xl">{id === 'seasons' ? '🌍' : '🌗'}</div>
        <div className="mx-auto mt-1 w-24 h-1 rounded bg-gradient-to-r from-cyan-300 via-amber-300 to-cyan-300" style={{ transform: id === 'seasons' ? 'rotate(-23.5deg)' : undefined }} />
        <p className="text-[11px] text-slate-300 mt-1.5">
          {id === 'seasons'
            ? 'Earth leans 23.5°. When your half leans TOWARD the Sun → summer ☀️. Away → winter ❄️.'
            : 'Watch Earth spin! The sunny side has DAY ☀️, the dark side has NIGHT 🌙.'}
        </p>
        <button onClick={() => set({ selectedId: 'earth', cameraMode: 'follow', paused: false, speed: 10 })}
          className="mt-1.5 w-full py-1.5 rounded-lg bg-cyan-400/90 text-slate-950 text-xs font-extrabold">Zoom to spinning Earth 🌍</button>
      </div>
    );
  }

  if (id === 'distances') {
    return (
      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
        <div className="flex items-end gap-[3px] h-14 justify-center" aria-hidden>
          {PLANETS.map((p) => (
            <div key={p.id} title={p.name} className="rounded-sm bg-gradient-to-t from-cyan-500 to-violet-400" style={{ width: 10, height: 6 + p.distanceAU * 1.1 }} />
          ))}
        </div>
        <div className="flex gap-[3px] justify-center text-[8px] text-slate-400">
          {PLANETS.map((p) => <span key={p.id} style={{ width: 10 }} className="text-center">{p.name[0]}</span>)}
        </div>
        <button onClick={() => set({ scaleMode: 'distances', selectedId: null, cameraMode: 'overview' })}
          className="mt-1.5 w-full py-1.5 rounded-lg bg-violet-500/80 text-white text-xs font-extrabold">Feel real distances 🌌</button>
      </div>
    );
  }

  // sun + orbits default widget
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
      <div className="flex gap-1.5">
        <button onClick={() => set({ selectedId: 'sun', cameraMode: 'focus' })}
          className="flex-1 py-1.5 rounded-lg bg-amber-400/90 text-slate-950 text-xs font-extrabold">☀️ Visit the Sun</button>
        <button onClick={() => { const v = useSim.getState().showOrbitArrows; useSim.getState().set({ showOrbitArrows: !v }); }}
          className="flex-1 py-1.5 rounded-lg bg-white/10 text-slate-100 text-xs font-extrabold">🔄 Arrows</button>
      </div>
      <button onClick={() => { const s = useSim.getState(); s.set({ tourActive: true, tourIndex: 1, tourPlaying: true, selectedId: 'sun' }); }}
        className="mt-1.5 w-full py-1.5 rounded-lg bg-fuchsia-500/70 text-white text-xs font-extrabold">🎬 Tour the Sun story</button>
    </div>
  );
}

/* ---------------- What-if lab ---------------- */
export function WhatIfPanel() {
  const open = useSim((s) => s.whatIfOpen);
  const twoMoons = useSim((s) => s.twoMoons);
  const bigEarth = useSim((s) => s.bigEarth);
  const sunOff = useSim((s) => s.sunOff);
  const noSpin = useSim((s) => s.noSpin);
  const card = 'rounded-xl border p-2.5 text-left transition active:scale-[.98] w-full';
  const on = 'bg-amber-400/90 text-slate-950 border-amber-300 font-extrabold';
  const off = 'bg-white/5 text-slate-100 border-white/10 hover:bg-white/15';
  return (
    <AnimatePresence>
      {open && (
        <motion.section initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 300, opacity: 0 }}
          className="absolute left-2 sm:left-3 bottom-20 sm:bottom-24 z-20 w-[min(90vw,340px)]" aria-label="What-if experiments">
          <div className="glass rounded-2xl p-3.5 max-h-[52vh] overflow-y-auto scroll-thin">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white">🧪 What-If Lab</h2>
              <button aria-label="Close what-if lab" onClick={() => useSim.getState().set({ whatIfOpen: false })}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 font-bold">✕</button>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Playful educational guesses — not real predictions! 🔬</p>
            <div className="mt-2 space-y-1.5">
              <button className={`${card} ${twoMoons ? on : off}`} onClick={() => { uiBlip(); useSim.getState().set({ twoMoons: !twoMoons, selectedId: 'earth', cameraMode: 'focus' }); }}>
                <div className="text-xs">🌙🌙 What if Earth had TWO moons?</div>
                <div className="text-[11px] opacity-80 font-normal">{twoMoons ? 'Look — a second purple moon joined Earth! Double tides, double moonlight!' : 'Add a second moon and watch what happens.'}</div>
              </button>
              <button className={`${card} ${bigEarth ? on : off}`} onClick={() => { uiBlip(); useSim.getState().set({ bigEarth: !bigEarth, selectedId: 'earth', cameraMode: 'focus' }); }}>
                <div className="text-xs">🌍➜♃ What if Earth were Jupiter-sized?</div>
                <div className="text-[11px] opacity-80 font-normal">{bigEarth ? 'Whoa — Earth is HUGE now! Gravity would squash you flat!' : 'Grow Earth to giant size for comparison.'}</div>
              </button>
              <button className={`${card} ${sunOff ? on : off}`} onClick={() => { uiBlip(); useSim.getState().set({ sunOff: !sunOff }); }}>
                <div className="text-xs">🌑 What if the Sun disappeared?</div>
                <div className="text-[11px] opacity-80 font-normal">{sunOff ? 'Dark! No sunshine, no warmth. Planets would drift away — gravity travels at light speed!' : 'Turn off the sunshine (light takes 8 min to fade on Earth!).'}</div>
              </button>
              <button className={`${card} ${noSpin ? on : off}`} onClick={() => { uiBlip(); useSim.getState().set({ noSpin: !noSpin, selectedId: 'earth', cameraMode: 'focus' }); }}>
                <div className="text-xs">🛑 What if Earth stopped spinning?</div>
                <div className="text-[11px] opacity-80 font-normal">{noSpin ? 'Frozen! One side bakes in endless day, the other freezes in endless night.' : 'Freeze all rotation and see endless day + night.'}</div>
              </button>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Cinematic tour overlay ---------------- */
export function TourOverlay() {
  const active = useSim((s) => s.tourActive);
  const idx = useSim((s) => s.tourIndex);
  const playing = useSim((s) => s.tourPlaying);
  if (!active) return null;
  const stop = TOUR_STOPS[idx];
  return (
    <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-30 w-[min(94vw,560px)]" role="dialog" aria-label="Cinematic tour">
      <div className="glass rounded-2xl p-3.5 sm:p-4 border-fuchsia-300/30">
        <div className="flex items-center gap-2 text-[11px] font-extrabold tracking-widest text-fuchsia-300">
          🎬 CINEMATIC TOUR · {idx + 1}/{TOUR_STOPS.length}
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-fuchsia-400 to-cyan-300 transition-all" style={{ width: `${((idx + 1) / TOUR_STOPS.length) * 100}%` }} />
          </div>
        </div>
        <h3 className="text-base sm:text-lg font-extrabold text-white mt-1">{stop.title}</h3>
        <p className="text-[13px] sm:text-sm text-slate-200 mt-0.5">{stop.text}</p>
        <div className="mt-2.5 flex gap-1.5 flex-wrap">
          <button aria-label={playing ? 'Pause tour' : 'Resume tour'}
            onClick={() => useSim.getState().set({ tourPlaying: !playing })}
            className="px-3 py-1.5 rounded-xl bg-cyan-400/90 text-slate-950 text-xs font-extrabold">{playing ? '⏸ Pause' : '▶ Resume'}</button>
          <button aria-label="Skip to next stop"
            onClick={() => { const s = useSim.getState(); const n = Math.min(TOUR_STOPS.length - 1, s.tourIndex + 1); const t = TOUR_STOPS[n]; s.set({ tourIndex: n, selectedId: t.target === 'overview' ? null : t.target }); }}
            className="px-3 py-1.5 rounded-xl bg-white/10 text-slate-100 text-xs font-extrabold hover:bg-white/20">⏭ Skip</button>
          <button aria-label="Exit tour"
            onClick={() => useSim.getState().set({ tourActive: false, tourIndex: 0, selectedId: null, cameraMode: 'overview' })}
            className="px-3 py-1.5 rounded-xl bg-white/10 text-slate-100 text-xs font-extrabold hover:bg-white/20">✕ Exit tour</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Mission control (spacecraft) ---------------- */
export function MissionControl() {
  const active = useSim((s) => s.craftActive);
  const follow = useSim((s) => s.craftFollow);
  const speed = useSim((s) => s.craftSpeed);
  if (!active) return null;
  return (
    <div className="absolute left-2 sm:left-3 bottom-20 sm:bottom-24 z-20 w-[min(90vw,300px)]" role="dialog" aria-label="Mission control">
      <div className="glass rounded-2xl p-3 border-emerald-300/30">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-emerald-200">🚀 Mission Control</h2>
          <button aria-label="End mission" onClick={() => useSim.getState().set({ craftActive: false, craftFollow: false })}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold">✕</button>
        </div>
        <p id="craft-hud" className="mt-1 text-[11px] font-mono text-emerald-100/90 bg-black/40 rounded-lg px-2 py-1.5 border border-emerald-300/20">⦿ Speed …</p>
        <label className="block mt-2 text-[11px] text-slate-300 font-bold">Engine power: {speed.toFixed(0)}
          <input aria-label="Spacecraft speed" type="range" min={4} max={40} step={1} value={speed}
            onChange={(e) => useSim.getState().set({ craftSpeed: Number(e.target.value) })} className="w-full accent-emerald-400" />
        </label>
        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
          <button onClick={() => useSim.getState().set({ craftFollow: !follow })}
            className={`py-1.5 rounded-xl text-xs font-extrabold ${follow ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-slate-100'}`}>{follow ? '🎥 Chase cam ON' : '🎥 Chase cam'}</button>
          <button onClick={() => craftRef.pos.set(30, 6, 40)}
            className="py-1.5 rounded-xl bg-white/10 text-slate-100 text-xs font-extrabold">🏠 Reset ship</button>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400 leading-snug">Fly: <b>W A S D</b> + arrows · <b>Q/E</b> down/up · hold <b>Shift</b> for boost. Visit a planet!</p>
      </div>
    </div>
  );
}

/* ---------------- Settings + Help + Welcome ---------------- */
export function SideDock() {
  const [open, setOpen] = useState(false);
  const orbits = useSim((s) => s.showOrbits);
  const arrows = useSim((s) => s.showOrbitArrows);
  const reduced = useSim((s) => s.reducedMotion);
  const help = useSim((s) => s.showHelp);
  const simDays = useSim((s) => s.simDays);
  return (
    <>
      <div className="absolute left-2 sm:left-3 bottom-20 sm:bottom-24 z-10 flex flex-col gap-2">
        <button aria-label="Open display settings" onClick={() => setOpen(!open)}
          className="glass w-10 h-10 rounded-xl text-lg hover:bg-white/15 active:scale-95">⚙️</button>
        <button aria-label="Show keyboard shortcuts and help" onClick={() => useSim.getState().set({ showHelp: !help })}
          className="glass w-10 h-10 rounded-xl text-lg hover:bg-white/15 active:scale-95">❓</button>
        <button aria-label="Surprise me — fly somewhere random"
          onClick={() => {
            uiBlip();
            const pool = [...PLANETS.map((p) => p.id), 'sun', 'moon'];
            const pick = pool[Math.floor(Math.random() * pool.length)];
            useSim.getState().set({ tourActive: false, selectedId: pick, cameraMode: Math.random() > 0.5 ? 'follow' : 'focus' });
            useSim.getState().advanceFact();
          }}
          className="glass w-10 h-10 rounded-xl text-lg hover:bg-white/15 active:scale-95">🎲</button>
      </div>
      {open && (
        <div className="absolute left-14 sm:left-16 bottom-20 sm:bottom-24 z-20 w-60" role="dialog" aria-label="Display settings">
          <div className="glass rounded-2xl p-3.5 text-xs">
            <div className="font-extrabold text-white mb-2">⚙️ Display &amp; Comfort</div>
            {([
              ['Orbit paths', orbits, 'showOrbits'],
              ['Orbit direction arrows', arrows, 'showOrbitArrows'],
              ['Reduce motion', reduced, 'reducedMotion'],
            ] as const).map(([label, v, k]) => (
              <label key={k} className="flex items-center justify-between py-1.5 text-slate-200 font-semibold cursor-pointer">
                {label}
                <input type="checkbox" checked={v} onChange={() => useSim.getState().set({ [k]: !v } as never)} className="w-4 h-4 accent-cyan-400" />
              </label>
            ))}
            <div className="mt-1 text-[11px] text-slate-400">Sim date: {formatSimDate(simDays)}</div>
            <div className="mt-1 text-[11px] text-slate-400">Tip: double-click a planet to follow it!</div>
          </div>
        </div>
      )}
      {help && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/60" role="dialog" aria-label="Help">
          <div className="glass rounded-2xl p-5 w-[min(92vw,440px)]">
            <h2 className="text-lg font-extrabold text-white">❓ How to explore</h2>
            <ul className="mt-2 space-y-1.5 text-[13px] text-slate-200">
              <li>🖱️ <b>Drag</b> to spin around · scroll / pinch to <b>zoom</b> · right-drag to <b>pan</b></li>
              <li>👆 <b>Click a planet</b> to learn · <b>double-click</b> to follow it</li>
              <li>⌨️ <b>Space</b> pause · <b>1–4</b> speeds · <b>Esc</b> close panels · <b>T</b> tour · <b>L</b> labels</li>
              <li>🚀 In ship mode: <b>WASD/arrows + Q/E</b>, <b>Shift</b> = boost</li>
              <li>🎬 Try the <b>Cinematic Tour</b> and the <b>🧪 What-If Lab</b>!</li>
            </ul>
            <button onClick={() => useSim.getState().set({ showHelp: false })}
              className="mt-3 w-full py-2 rounded-xl bg-cyan-400 text-slate-950 font-extrabold text-sm">Let's explore! 🚀</button>
          </div>
        </div>
      )}
    </>
  );
}

export function Welcome() {
  const done = useSim((s) => s.welcomeDone);
  if (done) return null;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 pointer-events-none" aria-live="polite">
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass rounded-3xl px-6 py-5 text-center max-w-md pointer-events-auto border-cyan-300/20">
        <div className="text-4xl">🌌</div>
        <h2 className="text-2xl font-black text-white text-glow mt-1">Welcome to the Solar System!</h2>
        <p className="text-sm text-slate-200 mt-1.5">Drag to explore · Click a planet to learn · Start a mission 🚀</p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => { uiBlip(); useSim.getState().set({ welcomeDone: true, tourActive: true, tourIndex: 0, tourPlaying: true }); }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-white text-sm font-extrabold hover:brightness-110 active:scale-[.98]">🎬 Start the tour</button>
          <button onClick={() => useSim.getState().set({ welcomeDone: true })}
            className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-extrabold hover:bg-white/20 active:scale-[.98]">Free explore 🪐</button>
        </div>
      </motion.div>
    </div>
  );
}
