import { Suspense, useEffect, useState, Component, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence } from 'framer-motion';
import { SolarSystemScene, timeRef } from './components/3d/SolarSystemScene';
import { TopBar, TimeControls, ScaleControl, RandomFactButton } from './components/ui/TopBar';
import { PlanetPanel, BodyMenu, LearnPanel, WhatIfPanel, TourOverlay, MissionControl, SideDock, Welcome } from './components/ui/Panels';
import { PLANETS } from './data/planets';
import { useSim } from './store/simulationStore';
import { stopAmbient } from './utils/audio';

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { useSim.getState().set({ webglFailed: true }); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Loader({ done }: { done: boolean }) {
  return (
    <AnimatePresence>
      {!done && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#030612]" aria-label="Loading">
          <div className="relative w-40 h-40">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-orange-600" style={{ boxShadow: '0 0 40px #f59e0b' }} />
            </div>
            {[26, 52, 74].map((s, i) => (
              <div key={i} className="absolute inset-0 flex items-center justify-center loading-orbit" style={{ animationDuration: `${2 + i * 1.4}s` }}>
                <div className="rounded-full border border-cyan-300/40" style={{ width: s * 2, height: s * 2 }}>
                  <div className="w-2 h-2 -mt-1 ml-4 rounded-full bg-cyan-300" style={{ boxShadow: '0 0 10px #67e8f9' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-lg font-extrabold text-white text-glow">Preparing the Solar System…</div>
          <div className="text-xs text-slate-400 mt-1">Lighting the Sun · Placing planets · Sprinkling stars ✨</div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Fallback2D() {
  const [a, setA] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setA((v) => v + 0.02), 50);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#030612] p-6 text-center">
      <h2 className="text-xl font-extrabold text-white">🌌 2D Solar System (WebGL unavailable)</h2>
      <p className="text-xs text-slate-300 mt-1 max-w-md">Your browser or graphics hardware cannot display 3D. Here is a simplified 2D map — all planet facts still work!</p>
      <svg viewBox="0 0 400 400" className="w-[min(90vw,440px)] mt-3" role="img" aria-label="2D solar system map">
        <circle cx="200" cy="200" r="16" fill="#fbbf24" />
        {PLANETS.map((p, i) => {
          const d = 28 + i * 20;
          const ang = a * (2 - i * 0.18) + i;
          return (
            <g key={p.id} onClick={() => useSim.getState().select(p.id)} style={{ cursor: 'pointer' }}>
              <circle cx="200" cy="200" r={d} fill="none" stroke="#334155" strokeWidth="1" />
              <circle cx={200 + Math.cos(ang) * d} cy={200 + Math.sin(ang) * d} r={i > 3 ? 8 : 5} fill={p.color} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Keyboard() {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const s = useSim.getState();
      if (e.key === ' ') { e.preventDefault(); s.set({ paused: !s.paused }); }
      else if (e.key === '1') s.set({ speed: 0.5, paused: false });
      else if (e.key === '2') s.set({ speed: 2, paused: false });
      else if (e.key === '3') s.set({ speed: 10, paused: false });
      else if (e.key === '4') s.set({ speed: 40, paused: false });
      else if (e.key === 'Escape') s.set({ selectedId: null, cameraMode: 'overview', learnOpen: false, whatIfOpen: false, showHelp: false, showFact: false });
      else if (e.key.toLowerCase() === 't') s.set(s.tourActive ? { tourActive: false } : { tourActive: true, tourIndex: 0, tourPlaying: true });
      else if (e.key.toLowerCase() === 'l') s.set({ showLabels: !s.showLabels });
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  return null;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const webglFailed = useSim((s) => s.webglFailed);
  const whatIfOpen = useSim((s) => s.whatIfOpen);

  useEffect(() => {
    timeRef.days = 120;
    useSim.getState().set({ simDays: 120 });
    const t = setTimeout(() => {
      setReady(true);
      setTimeout(() => useSim.getState().set({ welcomeDone: useSim.getState().welcomeDone }), 9000);
    }, 1400);
    const welcomeTimer = setTimeout(() => {
      // auto-dismiss welcome after 12s so kids see the scene
      const s = useSim.getState();
      if (!s.welcomeDone && !s.tourActive) s.set({ welcomeDone: true });
    }, 14000);
    return () => { clearTimeout(t); clearTimeout(welcomeTimer); stopAmbient(); };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#030612]" role="application" aria-label="Interactive 3D Solar System">
      {!webglFailed && (
        <Boundary>
          <Canvas
            dpr={[1, 1.75]}
            camera={{ position: [0, 62, 105], fov: 50, near: 0.1, far: 2000 }}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              try {
                // trigger loader dismissal on first frames
                let frames = 0;
                const loop = () => {
                  frames++;
                  if (frames === 5) setReady(true);
                  if (frames < 6) requestAnimationFrame(loop);
                };
                requestAnimationFrame(loop);
                void gl;
              } catch { useSim.getState().set({ webglFailed: true }); }
            }}
            onPointerMissed={() => { if (useSim.getState().selectedId && (window.event as PointerEvent | undefined)?.type !== 'dblclick') { /* keep selection on drag */ } }}
          >
            <color attach="background" args={['#030612']} />
            <fog attach="fog" args={['#030612', 180, 700]} />
            <Suspense fallback={null}>
              <SolarSystemScene />
            </Suspense>
          </Canvas>
        </Boundary>
      )}
      {webglFailed && <Fallback2D />}

      <Loader done={ready} />
      {ready && (
        <>
          <TopBar />
          <Keyboard />
          <div className="absolute left-2 sm:left-3 top-20 sm:top-24 z-10 hidden sm:block">
            <ScaleControl />
          </div>
          {/* mobile scale shortcut */}
          <div className="absolute right-2 top-20 z-10 sm:hidden">
            <button aria-label="Cycle scale mode"
              onClick={() => {
                const s = useSim.getState();
                const order = ['educational', 'relative', 'distances', 'custom'] as const;
                s.set({ scaleMode: order[(order.indexOf(s.scaleMode) + 1) % order.length] });
              }}
              className="glass w-10 h-10 rounded-xl text-lg">🔭</button>
          </div>
          <AnimatePresence><PlanetPanel key="pp" /></AnimatePresence>
          <BodyMenu />
          <LearnPanel />
          <WhatIfPanel />
          <TourOverlay />
          <MissionControl />
          <SideDock />
          <RandomFactButton />
          <Welcome />
          <TimeControls />
          {/* mobile what-if FAB */}
          <button aria-label="Open what-if lab"
            onClick={() => useSim.getState().set({ whatIfOpen: !whatIfOpen })}
            className="sm:hidden absolute right-2 bottom-24 z-20 glass w-11 h-11 rounded-2xl text-xl">🧪</button>
          <div className="sr-only" aria-live="polite">
            {useSim.getState().selectedId ? `Selected: ${useSim.getState().selectedId}. ` : ''}Simulation {useSim.getState().paused ? 'paused' : `running at ${useSim.getState().speed} days per second`}.
          </div>
        </>
      )}
    </div>
  );
}
