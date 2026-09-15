import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createPlanetTexture } from '../../utils/astronomy';

interface MoonProps {
  moon: {
    id: string;
    name: string;
    color: string;
  };
  radius: number;
  time: number;
  rotationSpeed: number;
}

export function Moon({ moon, radius, time, rotationSpeed }: MoonProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    const texture = createPlanetTexture(moon.id);
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.95,
      metalness: 0.05,
      color: new THREE.Color(moon.color),
    });
  }, [moon.id, moon.color]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * rotationSpeed * 0.001;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={new THREE.SphereGeometry(radius, 32, 32)}
      material={material}
      castShadow
      receiveShadow
    />
  );
}