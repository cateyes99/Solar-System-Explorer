import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, useTexture } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { PLANETS, TOUR_STOPS } from '../../data/planets';
import { useSim } from '../../store/simulationStore';
import { orbitalPosition, planetIndex, planetRadius, sunRadius, planetDistance, orbitalAngle, moonWorldPosition } from '../../utils/scale';
import { glowSprite, REAL_TEXTURE_URLS, prepColorMap, remapRingUVs, type RealMaps } from '../../utils/textures';

// Shared smooth simulation clock (not React state — updated every frame)
export const timeRef = { days: 120 };
export const craftRef = { pos: new THREE.Vector3(30, 6, 40) };

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ---------------- Time keeper: advances smooth clock, syncs store ~5Hz ---------------- */
export function TimeKeeper() {
  const acc = useRef(0);
  useFrame((_, delta) => {
    const s = useSim.getState();
    const d = Math.min(delta, 0.1);
    if (!s.paused && s.tourPlaying !== false) {
      const mult = s.paused ? 0 : s.speed;
      timeRef.days += d * mult;
    }
    acc.current += d;
    if (acc.current > 0.2) {
      acc.current = 0;
      if (Math.abs(s.simDays - timeRef.days) > 0.001) s.set({ simDays: timeRef.days });
    }
  });
  return null;
}

/* ---------------- Tour auto-advance ---------------- */
export function TourDriver() {
  const t = useRef(0);
  useFrame((_, delta) => {
    const s = useSim.getState();
    if (!s.tourActive || !s.tourPlaying) return;
    t.current += Math.min(delta, 0.2);
    const stop = TOUR_STOPS[s.tourIndex];
    if (t.current >= (stop?.duration ?? 6)) {
      t.current = 0;
      if (s.tourIndex >= TOUR_STOPS.length - 1) {
        s.set({ tourActive: false, tourIndex: 0, cameraMode: 'overview', selectedId: null });
      } else {
        const next = TOUR_STOPS[s.tourIndex + 1];
        s.set({ tourIndex: s.tourIndex + 1 });
        if (next.target !== 'overview' && next.target !== 'sun') s.set({ selectedId: next.target });
        else if (next.target === 'sun') s.set({ selectedId: 'sun' });
        else s.set({ selectedId: null });
      }
    }
  });
  return null;
}

/* ---------------- Camera rig with cinematic easing ---------------- */
export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const fly = useRef<{ t: number; dur: number; fromPos: THREE.Vector3; toPos: THREE.Vector3; fromTg: THREE.Vector3; toTg: THREE.Vector3; active: boolean }>({ t: 1, dur: 1.8, fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(), fromTg: new THREE.Vector3(), toTg: new THREE.Vector3(), active: false });
  const lastKey = useRef('');

  const desiredTarget = (s: ReturnType<typeof useSim.getState>): THREE.Vector3 => {
    if (s.tourActive) {
      const stop = TOUR_STOPS[s.tourIndex];
      if (!stop || stop.target === 'overview') return new THREE.Vector3(0, 0, 0);
      if (stop.target === 'sun') return new THREE.Vector3(0, 0, 0);
      const idx = planetIndex(stop.target);
      if (idx < 0) return new THREE.Vector3(0, 0, 0);
      const p = orbitalPosition(idx, timeRef.days, s.scaleMode, s.distMult, s.gravityMass);
      return new THREE.Vector3(p[0], 0, p[2]);
    }
    if (s.selectedId === 'moon') {
      const m = moonWorldPosition(timeRef.days, s.scaleMode, s.distMult, s.gravityMass, s.sizeMult, s.bigEarth, s.moonPhaseManual, s.moonPhase);
      return new THREE.Vector3(m[0], m[1], m[2]);
    }
    if (s.selectedId && s.selectedId !== 'sun') {
      const idx = planetIndex(s.selectedId);
      if (idx >= 0) {
        const p = orbitalPosition(idx, timeRef.days, s.scaleMode, s.distMult, s.gravityMass);
        return new THREE.Vector3(p[0], 0, p[2]);
      }
    }
    return new THREE.Vector3(0, 0, 0);
  };

  useFrame((_, delta) => {
    const s = useSim.getState();
    const ctl = controls.current;
    if (!ctl) return;
    const key = `${s.selectedId}|${s.tourActive ? 'tour' + s.tourIndex : s.cameraMode}|${s.scaleMode}`;
    if (key !== lastKey.current) {
      lastKey.current = key;
      const toTg = desiredTarget(s);
      let toPos: THREE.Vector3;
      if (s.tourActive && TOUR_STOPS[s.tourIndex]?.target === 'overview') {
        toPos = new THREE.Vector3(0, 62, 105);
      } else if (!s.selectedId || (s.tourActive && TOUR_STOPS[s.tourIndex]?.target === 'overview')) {
        toPos = new THREE.Vector3(0, 62, 105);
      } else if (s.selectedId === 'sun' || (s.tourActive && TOUR_STOPS[s.tourIndex]?.target === 'sun')) {
        toPos = new THREE.Vector3(0, 12, 30);
      } else if (s.selectedId === 'moon') {
        // the Moon is tiny — get close enough for kids to see its craters
        const off = 2.2;
        toPos = toTg.clone().add(new THREE.Vector3(off * 0.7, off * 0.45, off));
      } else {
        const idx = planetIndex(s.selectedId ?? TOUR_STOPS[s.tourIndex]?.target ?? '');
        const r = idx >= 0 ? planetRadius(idx, s.scaleMode, s.sizeMult, s.bigEarth) : 1;
        const off = Math.max(5, r * 5 + 2.5);
        toPos = toTg.clone().add(new THREE.Vector3(off * 0.7, off * 0.45, off));
      }
      if (s.reducedMotion) {
        camera.position.copy(toPos);
        ctl.target.copy(toTg);
      } else {
        fly.current = { t: 0, dur: 1.9, fromPos: camera.position.clone(), toPos, fromTg: ctl.target.clone(), toTg, active: true };
      }
    }
    if (fly.current.active) {
      fly.current.t += delta / fly.current.dur;
      const k = easeInOut(Math.min(1, fly.current.t));
      camera.position.lerpVectors(fly.current.fromPos, fly.current.toPos, k);
      ctl.target.lerpVectors(fly.current.fromTg, fly.current.toTg, k);
      if (fly.current.t >= 1) fly.current.active = false;
    } else if ((s.cameraMode === 'follow' || (s.tourActive && s.selectedId)) && !s.reducedMotion) {
      // gently stick to moving planet
      const toTg = desiredTarget(s);
      const shift = toTg.clone().sub(ctl.target);
      ctl.target.copy(toTg);
      camera.position.add(shift);
    } else if (s.cameraMode === 'follow') {
      ctl.target.copy(desiredTarget(s));
    }
    ctl.update();
  });

  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} minDistance={1.5} maxDistance={320} enablePan />;
}

/* ---------------- Sun (real SDO-style surface map + slow rotation) ---------------- */
function Sun({ map }: { map: THREE.Texture }) {
  const mesh = useRef<THREE.Mesh>(null);
  const spin = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Sprite>(null);
  const glowTex = useMemo(() => glowSprite('#ff9d00'), []);
  const flareTex = useMemo(() => glowSprite('#ffdd55'), []);

  useFrame(({ clock }, delta) => {
    const s = useSim.getState();
    const t = clock.elapsedTime;
    const r = sunRadius(s.scaleMode, s.sizeMult);
    const flaring = performance.now() < s.flareUntil ? 1 : 0;
    const pulse = 1 + Math.sin(t * (s.reducedMotion ? 0.3 : 2.2)) * 0.015 + flaring * 0.25 * Math.abs(Math.sin(t * 9));
    // keep geometry radius 1 and scale — set base scale via radius
    if (mesh.current) mesh.current.scale.setScalar(r * pulse);
    if (spin.current && !s.paused && !s.reducedMotion) spin.current.rotation.y += Math.min(delta, 0.1) * 0.03;
    if (glow.current) {
      const base = r * (s.sunOff ? 2.2 : 4.6 + Math.sin(t * 1.5) * 0.25 + flaring * 2);
      glow.current.scale.set(base, base, 1);
      (glow.current.material as THREE.SpriteMaterial).opacity = s.sunOff ? 0.08 : 0.85;
    }
  });

  const r = 5;
  const s = useSim((st) => st.sunOff);
  const selected = useSim((st) => st.selectedId === 'sun');
  return (
    <group>
      <group ref={spin}>
      <mesh
        ref={mesh}
        scale={r}
        onClick={(e) => {
          e.stopPropagation();
          const st = useSim.getState();
          const clicks = st.sunClicks + 1;
          if (clicks >= 5) {
            st.set({ sunClicks: 0, flareUntil: performance.now() + 4000, selectedId: 'sun', cameraMode: 'focus' });
          } else {
            st.set({ sunClicks: clicks, selectedId: 'sun', cameraMode: 'focus' });
          }
          setTimeout(() => { const cur = useSim.getState(); if (cur.sunClicks > 0 && performance.now() > cur.flareUntil) cur.set({ sunClicks: 0 }); }, 3000);
        }}
        onPointerOver={(e) => { e.stopPropagation(); useSim.getState().set({ hoveredId: 'sun' }); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { useSim.getState().set({ hoveredId: null }); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial map={map} color={s ? '#334155' : '#ffffff'} toneMapped={false} fog={false} />
      </mesh>
      </group>
      <sprite ref={glow}>
        <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.85} />
      </sprite>
      <FlareSprite tex={flareTex} />
      <pointLight intensity={s ? 0.05 : 2.4} distance={0} decay={0} color="#fff2d9" />
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r + 1.6, r + 1.9, 64]} />
          <meshBasicMaterial color="#67e8f9" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
      <SunLabel />
    </group>
  );
}

function FlareSprite({ tex }: { tex: THREE.Texture }) {
  const ref = useRef<THREE.Sprite>(null);
  useFrame(({ clock }) => {
    const s = useSim.getState();
    const on = performance.now() < s.flareUntil;
    if (!ref.current) return;
    ref.current.visible = on;
    if (on) {
      const t = clock.elapsedTime;
      ref.current.scale.set(26 + Math.sin(t * 12) * 4, 26 + Math.cos(t * 10) * 4, 1);
    }
  });
  return (
    <sprite ref={ref} visible={false}>
      <spriteMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.9} />
    </sprite>
  );
}

function SunLabel() {
  const show = useSim((s) => s.showLabels);
  if (!show) return null;
  return (
    <Html position={[0, 7.6, 0]} center distanceFactor={120} style={{ pointerEvents: 'none' }}>
      <div className="px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide text-amber-200 bg-black/40 border border-amber-300/20">☀️ Sun</div>
    </Html>
  );
}

/* ---------------- Atmosphere (fresnel-ish rim via BackSide additive shell) ---------------- */
function Atmosphere({ radius, color, opacity = 0.5 }: { radius: number; color: string; opacity?: number }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        uniforms: { c: { value: new THREE.Color(color) }, o: { value: opacity } },
        vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 c; uniform float o; varying vec3 vN; void main(){ float rim = pow(1.0 - abs(vN.z), 2.2); gl_FragColor = vec4(c, rim * o); }`,
      }),
    [color, opacity]
  );
  return (
    <mesh scale={radius * 1.22}>
      <sphereGeometry args={[1, 32, 32]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

/* ---------------- Planet (real surface maps + true axial tilt) ---------------- */
const DAY_MAP: Record<string, keyof RealMaps> = {
  mercury: 'mercury',
  venus: 'venus',
  earth: 'earthDay',
  mars: 'mars',
  jupiter: 'jupiter',
  saturn: 'saturn',
  uranus: 'uranus',
  neptune: 'neptune',
};

const ROUGHNESS: Record<string, number> = {
  mercury: 1,
  venus: 0.95,
  earth: 0.72,
  mars: 1,
  jupiter: 0.9,
  saturn: 0.9,
  uranus: 0.85,
  neptune: 0.8,
};

// bump only where the map carries real relief (craters/canyons), never on gas giants
const BUMP: Record<string, number> = {
  mercury: 0.05,
  venus: 0,
  earth: 0,
  mars: 0.06,
  jupiter: 0,
  saturn: 0,
  uranus: 0,
  neptune: 0,
};

function EarthClouds({ r, map, innerRef }: { r: number; map: THREE.Texture; innerRef: React.RefObject<THREE.Mesh | null> }) {
  return (
    <mesh ref={innerRef} scale={r * 1.014}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial color="#ffffff" alphaMap={map} transparent opacity={0.9} depthWrite={false} roughness={1} metalness={0} />
    </mesh>
  );
}

function EarthMoon({ innerRef, map }: { innerRef: React.RefObject<THREE.Group | null>; map: THREE.Texture }) {
  const hovered = useSim((s) => s.hoveredId === 'moon');
  const selected = useSim((s) => s.selectedId === 'moon');
  return (
    <group
      ref={innerRef}
      onClick={(e) => { e.stopPropagation(); useSim.getState().select('moon'); }}
      onDoubleClick={(e) => { e.stopPropagation(); useSim.getState().set({ selectedId: 'moon', cameraMode: 'follow' }); }}
      onPointerOver={(e) => { e.stopPropagation(); useSim.getState().set({ hoveredId: 'moon' }); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { useSim.getState().set({ hoveredId: null }); document.body.style.cursor = 'auto'; }}
    >
      <mesh>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial map={map} bumpMap={map} bumpScale={0.04} roughness={1} metalness={0} />
      </mesh>
      {/* invisible-but-raycastable hit bubble: the Moon is small and hard to tap */}
      <mesh>
        <sphereGeometry args={[0.8, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {(hovered || selected) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.52, 0.6, 32]} />
          <meshBasicMaterial color={selected ? '#22d3ee' : '#94a3b8'} transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}
      {hovered && <HoverTip name="Moon" r={0.32} />}
    </group>
  );
}

function SaturnRings({ r, map }: { r: number; map: THREE.Texture }) {
  const geo = useMemo(() => {
    const inner = r * 1.24; // real C-ring inner edge ≈ 1.24 R
    const outer = r * 2.27; // real A-ring outer edge ≈ 2.27 R
    const g = new THREE.RingGeometry(inner, outer, 160, 1);
    remapRingUVs(g, inner, outer);
    return g;
  }, [r]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]}>
      <meshBasicMaterial map={map} color="#e8dcc0" transparent side={THREE.DoubleSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

function PlanetMesh({ idx, maps }: { idx: number; maps: RealMaps }) {
  const planet = PLANETS[idx];
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const moonG = useRef<THREE.Group>(null);
  const moon2 = useRef<THREE.Group>(null);

  const selected = useSim((s) => s.selectedId === planet.id);
  const hovered = useSim((s) => s.hoveredId === planet.id);
  const twoMoons = useSim((s) => s.twoMoons);
  // reactive scale so scale-mode switches resize planets immediately
  const scaleMode = useSim((s) => s.scaleMode);
  const sizeMult = useSim((s) => s.sizeMult);
  const distMult = useSim((s) => s.distMult);
  const bigEarth = useSim((s) => s.bigEarth);

  useFrame(({ clock }, delta) => {
    const s = useSim.getState();
    const d = Math.min(delta, 0.1);
    const pos = orbitalPosition(idx, timeRef.days, s.scaleMode, s.distMult, s.gravityMass);
    group.current?.position.set(pos[0], 0, pos[2]);
    const st = useSim.getState();
    if (!st.noSpin && !st.paused) {
      const dir = planet.rotationPeriodHours < 0 ? -1 : 1;
      const rate = st.reducedMotion ? 0.02 : Math.min(1.2, 12 / Math.max(4, Math.abs(planet.rotationPeriodHours))) * dir;
      if (spin.current) spin.current.rotation.y += d * rate;
      if (clouds.current) clouds.current.rotation.y += d * rate * 1.4 + d * 0.02;
    }
    if (moonG.current) {
      const m = moonWorldPosition(timeRef.days, st.scaleMode, st.distMult, st.gravityMass, st.sizeMult, st.bigEarth, st.moonPhaseManual, st.moonPhase);
      const e = orbitalPosition(idx, timeRef.days, st.scaleMode, st.distMult, st.gravityMass);
      moonG.current.position.set(m[0] - e[0], m[1], m[2] - e[2]);
    }
    if (moon2.current) {
      const a = -timeRef.days * 0.34 + 2;
      const r = planetRadius(idx, st.scaleMode, st.sizeMult, st.bigEarth);
      moon2.current.position.set(Math.cos(a) * (r + 2.6), -0.4, Math.sin(a) * (r + 2.6));
    }
    void clock;
  });

  const r = planetRadius(idx, scaleMode, sizeMult, bigEarth);
  const dayMap = maps[DAY_MAP[planet.id]];
  const bump = BUMP[planet.id] ?? 0;
  void distMult;

  return (
    <group ref={group}>
      {/* axial tilt — rings & spin axis follow the real obliquity */}
      <group rotation={[0, 0, THREE.MathUtils.degToRad(planet.tiltDeg)]}>
        <group ref={spin}>
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              useSim.getState().select(planet.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              useSim.getState().set({ selectedId: planet.id, cameraMode: 'follow' });
            }}
            onPointerOver={(e) => { e.stopPropagation(); useSim.getState().set({ hoveredId: planet.id }); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { useSim.getState().set({ hoveredId: null }); document.body.style.cursor = 'auto'; }}
            scale={hovered ? 1.08 : 1}
          >
            <sphereGeometry args={[r, 48, 48]} />
            <meshStandardMaterial
              map={dayMap}
              bumpMap={bump > 0 ? dayMap : undefined}
              bumpScale={bump}
              roughness={ROUGHNESS[planet.id] ?? 0.9}
              metalness={planet.id === 'earth' ? 0.04 : 0}
              emissiveMap={planet.id === 'earth' ? maps.earthNight : undefined}
              emissive={planet.id === 'earth' ? new THREE.Color('#ffffff') : selected ? new THREE.Color('#0a2540') : new THREE.Color('#000000')}
              emissiveIntensity={planet.id === 'earth' ? 1.5 : selected ? 0.55 : 0}
            />
          </mesh>
          {planet.id === 'earth' && <EarthClouds r={r} map={maps.earthClouds} innerRef={clouds} />}
        </group>

        {planet.id === 'earth' && <Atmosphere radius={r} color="#4aa8ff" opacity={0.75} />}
        {planet.id === 'venus' && <Atmosphere radius={r} color="#e8c97a" opacity={0.35} />}
        {(planet.id === 'jupiter' || planet.id === 'neptune' || planet.id === 'uranus') && (
          <Atmosphere radius={r} color={planet.id === 'jupiter' ? '#d8a06a' : '#5aa2ff'} opacity={0.22} />
        )}

        {planet.id === 'saturn' && <SaturnRings r={r} map={maps.saturnRing} />}
        {planet.id === 'uranus' && (
          <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[r * 1.55, r * 1.65, 64]} />
              <meshBasicMaterial color="#9adbe8" transparent opacity={0.35} side={THREE.DoubleSide} fog={false} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[r * 1.8, r * 1.86, 64]} />
              <meshBasicMaterial color="#9adbe8" transparent opacity={0.2} side={THREE.DoubleSide} fog={false} />
            </mesh>
          </group>
        )}
      </group>

      {planet.id === 'earth' && (
        <>
          <EarthMoon innerRef={moonG} map={maps.moon} />
          {twoMoons && (
            <group ref={moon2}>
              <mesh>
                <sphereGeometry args={[0.22, 20, 20]} />
                <meshStandardMaterial color="#a5b4fc" roughness={1} emissive="#312e81" emissiveIntensity={0.4} />
              </mesh>
              <Html center distanceFactor={60} style={{ pointerEvents: 'none' }}>
                <div className="text-[10px] text-indigo-200 bg-black/50 px-1.5 py-0.5 rounded-full border border-indigo-300/30">2nd Moon!</div>
              </Html>
            </group>
          )}
        </>
      )}

      {(selected || hovered) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r + 0.35, r + 0.5, 48]} />
          <meshBasicMaterial color={selected ? '#22d3ee' : '#94a3b8'} transparent opacity={selected ? 0.95 : 0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      <PlanetLabel idx={idx} r={r} />
      {hovered && <HoverTip name={planet.name} r={r} />}
    </group>
  );
}

function PlanetLabel({ idx, r }: { idx: number; r: number }) {
  const show = useSim((s) => s.showLabels);
  if (!show) return null;
  return (
    <Html position={[0, r + 1.1, 0]} center distanceFactor={110} style={{ pointerEvents: 'none' }}>
      <div className="px-2 py-0.5 rounded-full text-[11px] font-medium text-slate-100 bg-black/40 border border-white/10 whitespace-nowrap">{PLANETS[idx].name}</div>
    </Html>
  );
}

function HoverTip({ name, r }: { name: string; r: number }) {
  return (
    <Html position={[0, r + 2.1, 0]} center distanceFactor={90} style={{ pointerEvents: 'none' }}>
      <div className="px-2.5 py-1 rounded-lg text-xs font-semibold glass text-cyan-100 whitespace-nowrap">✨ {name} — click to explore</div>
    </Html>
  );
}

/* ---------------- Orbits ---------------- */
function OrbitLines() {
  const mode = useSim((s) => s.scaleMode);
  const distMult = useSim((s) => s.distMult);
  const mass = useSim((s) => s.gravityMass);
  const show = useSim((s) => s.showOrbits);
  const arrows = useSim((s) => s.showOrbitArrows);
  const lines = useMemo(() => PLANETS.map((_, i) => planetDistance(i, mode, distMult, mass)), [mode, distMult, mass]);
  if (!show) return null;
  return (
    <group>
      {lines.map((d, i) => (
        <group key={PLANETS[i].id}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[d - 0.035, d + 0.035, 180]} />
            <meshBasicMaterial color={useSim.getState().selectedId === PLANETS[i].id ? '#22d3ee' : '#3b4a6b'} transparent opacity={0.55} side={THREE.DoubleSide} />
          </mesh>
          {arrows && <OrbitArrow dist={d} idx={i} />}
        </group>
      ))}
    </group>
  );
}

function OrbitArrow({ dist, idx }: { dist: number; idx: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const a = orbitalAngle(idx, timeRef.days) + 0.35;
    ref.current?.position.set(Math.cos(a) * dist, 0, Math.sin(a) * dist);
    ref.current?.rotation.set(0, -a, 0);
  });
  return (
    <mesh ref={ref} rotation={[0, 0, 0]}>
      <coneGeometry args={[0.45, 1.2, 10]} />
      <meshBasicMaterial color="#67e8f9" />
    </mesh>
  );
}

/* ---------------- Star field ---------------- */
function StarField() {
  const ref = useRef<THREE.Points>(null);
  const { positions, colors, sizes } = useMemo(() => {
    const N = 3500;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const sizes = new Float32Array(N);
    const palette = [new THREE.Color('#ffffff'), new THREE.Color('#bcd2ff'), new THREE.Color('#ffe3c2'), new THREE.Color('#c4b5fd')];
    for (let i = 0; i < N; i++) {
      const R = 260 + Math.random() * 320;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = R * Math.sin(ph) * Math.cos(th);
      positions[i * 3 + 1] = R * Math.cos(ph) * 0.7;
      positions[i * 3 + 2] = R * Math.sin(ph) * Math.sin(th);
      const c = palette[Math.floor(Math.random() * palette.length)];
      const b = 0.45 + Math.random() * 0.55;
      colors[i * 3] = c.r * b;
      colors[i * 3 + 1] = c.g * b;
      colors[i * 3 + 2] = c.b * b;
      sizes[i] = 0.6 + Math.random() * 2.2;
    }
    return { positions, colors, sizes };
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { t: { value: 0 } },
        vertexShader: `attribute float aSize; varying vec3 vC; varying float vTw; uniform float t;
          void main(){ vC = color; vTw = 0.65 + 0.35 * sin(t*2.0 + position.x*0.5 + position.y); vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = aSize * (140.0 / -mv.z); gl_Position = projectionMatrix*mv; }`,
        fragmentShader: `varying vec3 vC; varying float vTw; void main(){ vec2 uv = gl_PointCoord - 0.5; float d = length(uv); if(d>0.5) discard; float a = smoothstep(0.5,0.05,d) * vTw; gl_FragColor = vec4(vC, a); }`,
        vertexColors: true,
      }),
    []
  );
  useFrame(({ clock }) => {
    mat.uniforms.t.value = clock.elapsedTime;
    if (ref.current && !useSim.getState().reducedMotion) ref.current.rotation.y += 0.00025;
  });
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [positions, colors, sizes]);
  return (
    <points ref={ref} geometry={geo} material={mat} frustumCulled={false}>
      {/* points */}
    </points>
  );
}

/* ---------------- Nebula sprites ---------------- */
function Nebulae() {
  const texs = useMemo(() => [glowSprite('#4c1d95'), glowSprite('#0c4a6e'), glowSprite('#831843')], []);
  const items = useMemo(
    () => [
      { p: [-180, 40, -220] as const, s: 260, t: texs[0], o: 0.16 },
      { p: [220, -30, -180] as const, s: 300, t: texs[1], o: 0.13 },
      { p: [60, 80, -260] as const, s: 220, t: texs[2], o: 0.12 },
      { p: [-240, -60, 120] as const, s: 240, t: texs[1], o: 0.1 },
    ],
    [texs]
  );
  return (
    <group>
      {items.map((n, i) => (
        <sprite key={i} position={[n.p[0], n.p[1], n.p[2]]} scale={[n.s, n.s, 1]}>
          <spriteMaterial map={n.t} transparent opacity={n.o} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  );
}

/* ---------------- Asteroid belt (instanced) ---------------- */
function AsteroidBelt() {
  const show = useSim((s) => s.showOrbits);
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 1100;
  const data = useMemo(() => {
    const arr: { p: THREE.Vector3; s: number; r: number }[] = [];
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 31.5 + Math.random() * 4.5;
      arr.push({ p: new THREE.Vector3(Math.cos(a) * d, (Math.random() - 0.5) * 1.2, Math.sin(a) * d), s: 0.05 + Math.random() * 0.14, r: Math.random() * Math.PI });
    }
    return arr;
  }, []);
  useFrame((_, delta) => {
    if (ref.current && !useSim.getState().reducedMotion) ref.current.rotation.y += delta * 0.008;
  });
  if (!show) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, N]}
      frustumCulled={false}
      onUpdate={(m) => {
        const M = new THREE.Matrix4();
        const Q = new THREE.Quaternion();
        const E = new THREE.Euler();
        data.forEach((d, i) => {
          E.set(d.r, d.r * 1.3, 0);
          Q.setFromEuler(E);
          M.compose(d.p, Q, new THREE.Vector3(d.s, d.s, d.s));
          m.setMatrixAt(i, M);
        });
        m.instanceMatrix.needsUpdate = true;
      }}
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#8d7f72" roughness={1} />
    </instancedMesh>
  );
}

/* ---------------- Hidden comet (easter egg) ---------------- */
function Comet() {
  const g = useRef<THREE.Group>(null);
  const tailTex = useMemo(() => glowSprite('#a5f3fc'), []);
  useFrame(() => {
    const t = timeRef.days * 0.05;
    // eccentric path
    const a = 85, b = 48;
    const x = Math.cos(t) * a;
    const z = Math.sin(t) * b - 10;
    g.current?.position.set(x, 8 + Math.sin(t * 2) * 6, z);
  });
  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[0.4, 12, 12]} />
        <meshBasicMaterial color="#e0f2fe" toneMapped={false} />
      </mesh>
      <sprite scale={[7, 7, 1]}>
        <spriteMaterial map={tailTex} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

/* ---------------- Controllable spacecraft ---------------- */
function Spacecraft() {
  const active = useSim((s) => s.craftActive);
  const g = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const hudAcc = useRef(0);

  useEffect(() => {
    const dn = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame(({ camera }, delta) => {
    if (!active || !g.current) return;
    const s = useSim.getState();
    const d = Math.min(delta, 0.05);
    const sp = s.craftSpeed * (keys.current['shift'] ? 2.5 : 1);
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const move = new THREE.Vector3();
    if (keys.current['w'] || keys.current['arrowup']) move.add(fwd);
    if (keys.current['s'] || keys.current['arrowdown']) move.sub(fwd);
    if (keys.current['a'] || keys.current['arrowleft']) move.sub(right);
    if (keys.current['d'] || keys.current['arrowright']) move.add(right);
    if (keys.current['q']) move.y -= 1;
    if (keys.current['e']) move.y += 1;
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(sp * d);
      craftRef.pos.add(move);
      // orient ship toward movement
      g.current.lookAt(craftRef.pos.clone().add(move.clone().multiplyScalar(10)));
    }
    g.current.position.copy(craftRef.pos);
    if (s.craftFollow) {
      camera.position.lerp(craftRef.pos.clone().add(new THREE.Vector3(6, 3.5, 8)), 0.06);
    }
    hudAcc.current += d;
    if (hudAcc.current > 0.25) {
      hudAcc.current = 0;
      // nearest planet for "destination"
      let best = 'Deep space', bd = Infinity;
      PLANETS.forEach((p, i) => {
        const q = orbitalPosition(i, timeRef.days, s.scaleMode, s.distMult, s.gravityMass);
        const dd = Math.hypot(q[0] - craftRef.pos.x, q[2] - craftRef.pos.z);
        if (dd < bd) { bd = dd; best = p.name; }
      });
      const el = document.getElementById('craft-hud');
      if (el) el.textContent = `⦿ Speed ${sp.toFixed(0)} u/s · ☀ ${craftRef.pos.length().toFixed(1)} u from Sun · ➜ nearest: ${best} (${bd.toFixed(1)} u)`;
    }
  });

  if (!active) return null;
  return (
    <group ref={g} position={craftRef.pos}>
      <mesh>
        <coneGeometry args={[0.5, 1.8, 12]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.3} emissive="#0ea5e9" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, -1.1, 0]}>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
      <pointLight intensity={8} distance={12} color="#22d3ee" />
    </group>
  );
}

/* ---------------- Milky Way backdrop (real star map, far shell) ---------------- */
function MilkyWay({ map }: { map: THREE.Texture }) {
  return (
    <mesh scale={950} renderOrder={-10}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshBasicMaterial map={map} side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}

/* ---------------- Scene root ---------------- */
export function SolarSystemScene() {
  const maps = useTexture(REAL_TEXTURE_URLS) as unknown as RealMaps;
  // sRGB for every color map; clouds stay linear (used as alphaMap)
  useEffect(() => {
    (Object.keys(maps) as (keyof RealMaps)[]).forEach((k) => {
      if (k === 'earthClouds') return;
      prepColorMap(maps[k]);
    });
  }, [maps]);
  const sunOff = useSim((s) => s.sunOff);
  return (
    <>
      <ambientLight intensity={sunOff ? 0.12 : 0.35} />
      <TimeKeeper />
      <TourDriver />
      <CameraRig />
      <MilkyWay map={maps.milkyWay} />
      <StarField />
      <Nebulae />
      <Sun map={maps.sun} />
      <OrbitLines />
      {PLANETS.map((p, i) => (
        <PlanetMesh key={p.id} idx={i} maps={maps} />
      ))}
      <AsteroidBelt />
      <Comet />
      <Spacecraft />
    </>
  );
}
