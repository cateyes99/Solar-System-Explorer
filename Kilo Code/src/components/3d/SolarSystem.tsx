import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Sun } from './Sun';
import { Planet } from './Planet';
import { Moon } from './Moon';
import { OrbitPath } from './OrbitPath';
import { AsteroidBelt } from './AsteroidBelt';
import { StarField } from './StarField';
import { Nebula } from './Nebula';
import { CameraController } from './CameraController';
import { useAppStore } from '../../store/simulationStore';
import { planetsData, getMoonsForPlanet } from '../../data/planets';
import type { MoonData } from '../../types';
import { getPlanetScaleRadius, getPlanetScaleDistance, getMoonScaleRadius, getMoonScaleDistance } from '../../utils/scale';
import { calculateOrbitalPosition } from '../../utils/astronomy';

export function SolarSystemScene() {
  const {
    scaleMode,
    simulationSpeed,
    isPaused,
    selectedPlanetId,
    hoveredPlanetId,
    showOrbits,
    showStars,
    reducedMotion,
    spacecraftActive,
    spacecraftPosition,
    cameraMode,
    cinematicTourActive,
  } = useAppStore();

  const timeRef = useRef(0);
  const startTimeRef = useRef(performance.now());

  useFrame((_state, delta) => {
    if (!isPaused && !cinematicTourActive) {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      timeRef.current = elapsed * simulationSpeed;
    }
  });

  const planetaryObjects = useMemo(() => {
    return planetsData.filter(p => p.id !== 'sun').map(planet => {
      const moons = getMoonsForPlanet(planet.id);
      const radius = getPlanetScaleRadius(planet, scaleMode);
      const distance = getPlanetScaleDistance(planet, scaleMode);
      const speed = planet.orbitalSpeed * 0.01;

      return (
        <PlanetSystem
          key={planet.id}
          planet={planet}
          moons={moons}
          radius={radius}
          distance={distance}
          speed={speed}
          time={timeRef.current}
          isSelected={selectedPlanetId === planet.id}
          isHovered={hoveredPlanetId === planet.id}
          showOrbit={showOrbits}
          scaleMode={scaleMode}
        />
      );
    });
  }, [scaleMode, timeRef.current, selectedPlanetId, hoveredPlanetId, showOrbits]);

  const sunRadius = getPlanetScaleRadius(planetsData[0], scaleMode);

  return (
    <>
      <StarField visible={showStars} />
      <Nebula />
      <AsteroidBelt />
      
      <group>
        <Sun radius={sunRadius} time={timeRef.current} isHovered={hoveredPlanetId === 'sun'} />
        
        {planetaryObjects}
      </group>

      <CameraController
        mode={cameraMode}
        targetId={selectedPlanetId}
        spacecraftActive={spacecraftActive}
        spacecraftPosition={spacecraftPosition}
        reducedMotion={reducedMotion}
      />

      <ContactShadows opacity={0.1} scale={200} blur={2} far={500} position={[0, -0.1, 0]} />
    </>
  );
}

interface PlanetSystemProps {
  planet: typeof planetsData[0];
  moons: ReturnType<typeof getMoonsForPlanet>;
  radius: number;
  distance: number;
  speed: number;
  time: number;
  isSelected: boolean;
  isHovered: boolean;
  showOrbit: boolean;
  scaleMode: 'educational' | 'relative-size' | 'distances' | 'custom';
}

function PlanetSystem({ planet, moons, radius, distance, speed, time, isSelected, isHovered, showOrbit, scaleMode }: PlanetSystemProps) {
  const position = calculateOrbitalPosition(distance, speed, time, planet.orbitalRadius * 0.1);

  return (
    <group position={position.toArray()}>
      {showOrbit && <OrbitPath radius={distance} inclination={planet.axialTiltDeg * Math.PI / 180} />}
      
      <Planet
        planet={planet}
        radius={radius}
        time={time}
        rotationSpeed={360 / (planet.rotationPeriodHours || 24)}
        isSelected={isSelected}
        isHovered={isHovered}
      />

      {moons.map(moon => (
        <MoonSystem
          key={moon.id}
          moon={moon}
          planetRadius={radius}
          planetRotationSpeed={360 / (planet.rotationPeriodHours || 24)}
          time={time}
          scaleMode={scaleMode}
        />
      ))}
    </group>
  );
}

interface MoonSystemProps {
  moon: MoonData;
  planetRadius: number;
  planetRotationSpeed: number;
  time: number;
  scaleMode: 'educational' | 'relative-size' | 'distances' | 'custom';
}

function MoonSystem({ moon, planetRadius, planetRotationSpeed, time, scaleMode }: MoonSystemProps) {
  const radius = getMoonScaleRadius(moon, scaleMode);
  const distance = getMoonScaleDistance(moon, scaleMode) + planetRadius * 1.5;
  const speed = moon.orbitalSpeed * 0.01;
  const position = calculateOrbitalPosition(distance, speed, time);

  return (
    <group position={position.toArray()}>
      <Moon
        moon={moon}
        radius={radius}
        time={time}
        rotationSpeed={planetRotationSpeed * 0.5}
      />
    </group>
  );
}

export function SolarSystemCanvas() {
  const { loading, error, reducedMotion } = useAppStore();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-space z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80 text-lg">Preparing the Solar System...</p>
          <p className="text-white/40 text-sm mt-2">Loading shaders, textures, and celestial data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-space z-50 p-8">
        <div className="text-center max-w-md glass-strong rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Unable to Load 3D View</h2>
          <p className="text-white/70 mb-6">
            Your browser or graphics hardware cannot display the 3D Solar System.
            This usually means WebGL is not supported or disabled.
          </p>
          <details className="text-left text-white/60 text-sm">
            <summary className="cursor-pointer mb-2">Technical Details</summary>
            <pre className="bg-black/50 p-4 rounded text-xs overflow-auto">{error}</pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 100, 300], fov: 50 }}
      gl={{
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: true,
      }}
      shadows={false}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
    >
      <color attach="background" args={['#03030c']} />
      <fog attach="fog" args={['#03030c', 200, 1500]} />
      
      <SolarSystemScene />
      
      <OrbitControls
        enableDamping={true}
        dampingFactor={0.05}
        enableZoom={true}
        enablePan={true}
        minDistance={10}
        maxDistance={2000}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.1}
      />
    </Canvas>
  );
}