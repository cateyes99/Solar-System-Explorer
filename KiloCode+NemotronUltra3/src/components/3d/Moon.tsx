import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlanetTextures, createPlanetTexture } from '../../utils/planetTextures';

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
  const textures = usePlanetTextures(moon.id);

  const material = useMemo(() => {
    let texture: THREE.Texture;
    let roughness: number;
    let metalness: number;
    let normalMap: THREE.Texture | undefined;
    let roughnessMap: THREE.Texture | undefined;

    if (textures.color && !textures.loading && !textures.error) {
      texture = textures.color;
      normalMap = textures.normal;
      roughnessMap = textures.roughness;
      roughness = 0.9;
      metalness = 0.05;
    } else {
      texture = createPlanetTexture(moon.id);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      roughness = 0.95;
      metalness = 0.05;
    }

    return new THREE.MeshStandardMaterial({
      map: texture,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
      normalScale: new THREE.Vector2(1, 1),
      roughness,
      metalness,
      color: 0xffffff,
    });
  }, [moon.id, textures.color, textures.loading, textures.error, textures.normal, textures.roughness]);

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