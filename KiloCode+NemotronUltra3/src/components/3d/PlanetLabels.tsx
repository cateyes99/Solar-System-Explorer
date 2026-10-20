import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useAppStore } from '../../store/simulationStore';
import { planetsData, getMoonsForPlanet } from '../../data/planets';
import { getPlanetScaleDistance, getPlanetScaleRadius, getMinOrbitRadius } from '../../utils/scale';
import { calculateOrbitalPosition } from '../../utils/astronomy';

interface PlanetLabelProps {
  planet: typeof planetsData[0];
  radius: number;
  distance: number;
  speed: number;
  time: number;
  isSelected: boolean;
  isHovered: boolean;
}

function PlanetLabel({ planet, radius, distance, speed, time, isSelected, isHovered }: PlanetLabelProps) {
  const { camera } = useThree();
  const { showLabels } = useAppStore();
  
  const position = useMemo(() => {
    return calculateOrbitalPosition(distance, speed, time, planet.orbitalRadius * 0.1);
  }, [distance, speed, time, planet.orbitalRadius]);

  const labelDistance = radius + 3;
  const labelPosition = position.clone().setY(labelDistance);

  const screenPosition = useMemo(() => {
    const vector = labelPosition.project(camera);
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    return { x, y, visible: vector.z < 1 };
  }, [labelPosition, camera]);

  if (!showLabels || !screenPosition.visible) return null;

  return (
    <Html
      style={{
        position: 'absolute',
        left: screenPosition.x,
        top: screenPosition.y,
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'none',
        zIndex: 100,
        opacity: isHovered || isSelected ? 1 : 0.8,
        transition: 'opacity 0.2s',
      }}
    >
      <div className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-white text-xs font-medium whitespace-nowrap shadow-lg">
        <span>{planet.id === 'sun' ? '☀️' : planet.id === 'earth' ? '🌍' : planet.id === 'mars' ? '🔴' : planet.id === 'jupiter' ? '🪐' : planet.id === 'saturn' ? '💍' : planet.id === 'venus' ? '✨' : planet.id === 'mercury' ? '🪨' : planet.id === 'uranus' ? '🧊' : '🌊'}</span>
        <span>{planet.name}</span>
        {isSelected && <span className="text-cyan-400">●</span>}
      </div>
    </Html>
  );
}

interface MoonLabelProps {
  moon: { id: string; name: string; orbitalSpeed: number; orbitalRadius: number; color: string };
  planetRadius: number;
  time: number;
}

function MoonLabel({ moon, planetRadius, time }: MoonLabelProps) {
  const { camera } = useThree();
  const { showLabels } = useAppStore();
  
  const moonDistance = planetRadius * 1.5 + Math.max(3, moon.orbitalRadius);
  const moonSpeed = moon.orbitalSpeed * 0.01;
  const moonPosition = calculateOrbitalPosition(moonDistance, moonSpeed, time);
  
  const labelDistance = 2;
  const labelPosition = moonPosition.clone().setY(labelDistance);

  const screenPosition = useMemo(() => {
    const vector = labelPosition.project(camera);
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    return { x, y, visible: vector.z < 1 };
  }, [labelPosition, camera]);

  if (!showLabels || !screenPosition.visible) return null;

  return (
    <Html
      style={{
        position: 'absolute',
        left: screenPosition.x,
        top: screenPosition.y,
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'none',
        zIndex: 100,
        opacity: 0.7,
      }}
    >
      <div className="px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded text-white text-[10px] font-medium whitespace-nowrap shadow">
        <span>{moon.name}</span>
      </div>
    </Html>
  );
}

export function PlanetLabels({ 
  planets, 
  time, 
  selectedPlanetId, 
  hoveredPlanetId, 
  scaleMode
}: { 
  planets: typeof planetsData;
  time: number;
  selectedPlanetId: string | null;
  hoveredPlanetId: string | null;
  scaleMode: 'educational' | 'relative-size' | 'distances' | 'custom';
}) {
  const { showLabels } = useAppStore();
  
  if (!showLabels) return null;
  
  return (
    <>
      {planets.filter(p => p.id !== 'sun').map(planet => {
        const moons = getMoonsForPlanet(planet.id);
        const radius = getPlanetScaleRadius(planet, scaleMode);
        const distance = Math.max(getPlanetScaleDistance(planet, scaleMode), getMinOrbitRadius(scaleMode) + radius * 2);
        const speed = planet.orbitalSpeed * 0.01;

        return (
          <group key={planet.id}>
            <PlanetLabel
              planet={planet}
              radius={radius}
              distance={distance}
              speed={speed}
              time={time}
              isSelected={selectedPlanetId === planet.id}
              isHovered={hoveredPlanetId === planet.id}
            />
            {moons.map(moon => (
              <MoonLabel
                key={moon.id}
                moon={moon}
                planetRadius={radius}
                time={time}
              />
            ))}
          </group>
        );
      })}
      
      <PlanetLabel
        planet={planetsData[0]}
        radius={getPlanetScaleRadius(planetsData[0], scaleMode)}
        distance={0}
        speed={0}
        time={time}
        isSelected={selectedPlanetId === 'sun'}
        isHovered={hoveredPlanetId === 'sun'}
      />
    </>
  );
}