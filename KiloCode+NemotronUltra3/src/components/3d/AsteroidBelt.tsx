import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createAsteroidBelt } from '../../utils/astronomy';

export function AsteroidBelt() {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

  const geometry = useMemo(() => createAsteroidBelt(2000), []);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      depthWrite: false,
    });
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.0001;
      
      const positions = pointsRef.current.geometry.attributes.position;
      const orbitalData = pointsRef.current.geometry.attributes.orbitalData;
      
      for (let i = 0; i < positions.count; i++) {
        const radius = orbitalData.getX(i);
        let theta = orbitalData.getY(i);
        const phi = orbitalData.getZ(i);
        const speed = orbitalData.getW(i);
        
        theta += delta * speed * 0.01;
        
        const x = radius * Math.cos(theta) * Math.cos(phi);
        const y = radius * Math.sin(phi);
        const z = radius * Math.sin(theta) * Math.cos(phi);
        
        positions.setXYZ(i, x, y, z);
        orbitalData.setY(i, theta);
      }
      
      positions.needsUpdate = true;
    }
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
    />
  );
}