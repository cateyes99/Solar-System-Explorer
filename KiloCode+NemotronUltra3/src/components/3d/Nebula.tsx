import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createNebulaGeometry } from '../../utils/astronomy';

export function Nebula() {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

  const geometry = useMemo(() => createNebulaGeometry(300), []);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 50,
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.00001;
      pointsRef.current.rotation.x += delta * 0.000005;
      
      const positions = pointsRef.current.geometry.attributes.position;
      const velocities = pointsRef.current.geometry.attributes.velocity;
      
      for (let i = 0; i < positions.count; i++) {
        const vx = velocities.getX(i);
        const vy = velocities.getY(i);
        const vz = velocities.getZ(i);
        
        positions.setXYZ(
          i,
          positions.getX(i) + vx * delta * 60,
          positions.getY(i) + vy * delta * 60,
          positions.getZ(i) + vz * delta * 60
        );
        
        const dist = Math.sqrt(
          positions.getX(i) ** 2 + 
          positions.getY(i) ** 2 + 
          positions.getZ(i) ** 2
        );
        
        if (dist > 800) {
          const radius = 300 + Math.random() * 400;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          
          positions.setXYZ(
            i,
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
          );
        }
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