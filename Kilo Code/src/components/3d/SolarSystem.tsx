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
import { getPlanetScaleRadius, getPlanetScaleDistance, getMoonScaleRadius, getMoonScaleDistance, getMinOrbitRadius } from '../../utils/scale';
import { calculateOrbitalPosition, calculateOrbitalPosition3D } from '../../utils/astronomy';
import { PlanetLabels } from './PlanetLabels';
import { Spacecraft } from './Spacecraft';

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
    spacecraftVelocity,
    spacecraftTarget,
    cameraMode,
    cinematicTourActive,
    cinematicTourStep,
    cinematicTourProgress,
  } = useAppStore();

  const timeRef = useRef(0);
  const startTimeRef = useRef(performance.now());
  const spacecraftVelocityRef = useRef(new THREE.Vector3());
  const spacecraftTargetRef = useRef<string | null>(null);

  useFrame((state, delta) => {
    if (!isPaused && !cinematicTourActive) {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      timeRef.current = elapsed * simulationSpeed;
    }

    if (spacecraftActive && spacecraftTarget) {
      const targetPlanet = planetsData.find(p => p.id === spacecraftTarget);
      if (targetPlanet) {
        const scaleModeState = useAppStore.getState().scaleMode;
        const targetDistance = Math.max(getPlanetScaleDistance(targetPlanet, scaleModeState), getMinOrbitRadius(scaleModeState) + getPlanetScaleRadius(targetPlanet, scaleModeState) * 2);
        const targetSpeed = targetPlanet.orbitalSpeed * 0.01;
        const targetPos = calculateOrbitalPosition(targetDistance, targetSpeed, timeRef.current);

        const direction = targetPos.clone().sub(spacecraftPosition).normalize();
        const distanceToTarget = spacecraftPosition.distanceTo(targetPos);

        const acceleration = direction.multiplyScalar(5 * delta);
        spacecraftVelocityRef.current.add(acceleration);

        const maxSpeed = 50;
        if (spacecraftVelocityRef.current.length() > maxSpeed) {
          spacecraftVelocityRef.current.normalize().multiplyScalar(maxSpeed);
        }

        const newPosition = spacecraftPosition.clone().add(spacecraftVelocityRef.current.clone().multiplyScalar(delta));

        useAppStore.getState().setSpacecraftPosition(newPosition);
        useAppStore.getState().setSpacecraftVelocity(spacecraftVelocityRef.current.clone());

        if (distanceToTarget < 5) {
          spacecraftVelocityRef.current.set(0, 0, 0);
        }
      }
    }
  });

  const planetaryObjects = useMemo(() => {
    return planetsData.filter(p => p.id !== 'sun').map(planet => {
      const moons = getMoonsForPlanet(planet.id);
      const radius = getPlanetScaleRadius(planet, scaleMode);
      const distance = Math.max(getPlanetScaleDistance(planet, scaleMode), getMinOrbitRadius(scaleMode) + radius * 2);
      const speed = planet.orbitalSpeed * 0.001;

      return (
        <PlanetSystem
          key={planet.id}
          planet={planet}
          moons={moons}
          radius={radius}
          distance={distance}
          speed={speed}
          timeRef={timeRef}
          isSelected={selectedPlanetId === planet.id}
          isHovered={hoveredPlanetId === planet.id}
          showOrbit={showOrbits}
          scaleMode={scaleMode}
        />
      );
    });
  }, [scaleMode, selectedPlanetId, hoveredPlanetId, showOrbits]);

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

      <OrbitPaths
        planets={planetsData}
        scaleMode={scaleMode}
        showOrbits={showOrbits}
        time={timeRef.current}
      />

      <PlanetLabels
        planets={planetsData}
        time={timeRef.current}
        selectedPlanetId={selectedPlanetId}
        hoveredPlanetId={hoveredPlanetId}
        scaleMode={scaleMode}
      />

      {spacecraftActive && (
        <Spacecraft
          position={spacecraftPosition}
          velocity={spacecraftVelocity}
          target={spacecraftTarget}
          time={timeRef.current}
          scaleMode={scaleMode}
        />
      )}

      <CameraController
        mode={cameraMode}
        targetId={selectedPlanetId}
        spacecraftActive={spacecraftActive}
        spacecraftPosition={spacecraftPosition}
        reducedMotion={reducedMotion}
        cinematicTourActive={cinematicTourActive}
        cinematicTourStep={cinematicTourStep}
        cinematicTourProgress={cinematicTourProgress}
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
  timeRef: React.MutableRefObject<number>;
  isSelected: boolean;
  isHovered: boolean;
  showOrbit: boolean;
  scaleMode: 'educational' | 'relative-size' | 'distances' | 'custom';
}

function PlanetSystem({ planet, moons, radius, distance, speed, timeRef, isSelected, isHovered, showOrbit, scaleMode }: PlanetSystemProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      const position = calculateOrbitalPosition3D(
        distance,
        speed,
        timeRef.current,
        planet.orbitalInclinationDeg * Math.PI / 180,
        planet.longitudeOfAscendingNodeDeg * Math.PI / 180,
        0, // argument of periapsis (not in data)
        planet.orbitalRadius * 0.1
      );
      groupRef.current.position.set(position.x, position.y, position.z);
    }
  });

  return (
    <group ref={groupRef}>
      <Planet
        planet={planet}
        radius={radius}
        time={timeRef.current}
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
          timeRef={timeRef}
          scaleMode={scaleMode}
        />
      ))}
    </group>
  );
}

function OrbitPaths({ planets, scaleMode, showOrbits, time }: {
  planets: typeof planetsData;
  scaleMode: 'educational' | 'relative-size' | 'distances' | 'custom';
  showOrbits: boolean;
  time: number;
}) {
  if (!showOrbits) return null;

  return (
    <group>
      {planets.filter(p => p.id !== 'sun').map(planet => {
        const radius = getPlanetScaleRadius(planet, scaleMode);
        const distance = Math.max(getPlanetScaleDistance(planet, scaleMode), getMinOrbitRadius(scaleMode) + radius * 2);
        return (
          <OrbitPath
            key={planet.id}
            radius={distance}
            inclination={planet.orbitalInclinationDeg * Math.PI / 180}
            longitudeOfAscendingNode={planet.longitudeOfAscendingNodeDeg * Math.PI / 180}
            color="#ffffff"
            opacity={0.15}
          />
        );
      })}
    </group>
  );
}

interface MoonSystemProps {
  moon: MoonData;
  planetRadius: number;
  planetRotationSpeed: number;
  timeRef: React.MutableRefObject<number>;
  scaleMode: 'educational' | 'relative-size' | 'distances' | 'custom';
}

function MoonSystem({ moon, planetRadius, planetRotationSpeed, timeRef, scaleMode }: MoonSystemProps) {
  const groupRef = useRef<THREE.Group>(null);
  const radius = getMoonScaleRadius(moon, scaleMode);
  const baseDistance = getMoonScaleDistance(moon, scaleMode);
  const minDistance = planetRadius + radius + 2;
  const distance = Math.max(baseDistance, minDistance);
  const speed = moon.orbitalSpeed * 0.001;

  useFrame(() => {
    if (groupRef.current) {
      const position = calculateOrbitalPosition(distance, speed, timeRef.current);
      groupRef.current.position.set(position.x, position.y, position.z);
    }
  });

  return (
    <group ref={groupRef}>
      <Moon
        moon={moon}
        radius={radius}
        time={timeRef.current}
        rotationSpeed={planetRotationSpeed * 0.5}
      />
    </group>
  );
}

export function SolarSystemCanvas() {
  const { error, reducedMotion } = useAppStore();

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
      shadows={true}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.2;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <color attach="background" args={['#03030c']} />
      <fog attach="fog" args={['#03030c', 500, 3000]} />

      {/* Minimal ambient fill - primary lighting from Sun point lights */}
      <ambientLight color="#101020" intensity={0.2} />
      <hemisphereLight color="#181830" groundColor="#080818" intensity={0.12} />

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