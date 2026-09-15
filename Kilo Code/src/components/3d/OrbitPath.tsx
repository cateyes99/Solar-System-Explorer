import React, { useMemo } from 'react';
import * as THREE from 'three';

interface OrbitPathProps {
  radius: number;
  inclination?: number;
  color?: string;
  opacity?: number;
}

export function OrbitPath({ radius, inclination = 0, color = '#ffffff', opacity = 0.15 }: OrbitPathProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.RingGeometry(radius - 0.5, radius + 0.5, 128);
    const positions = geo.attributes.position;
    const newPositions = new Float32Array(positions.count * 3);
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      const rotX = inclination;
      const newY = y * Math.cos(rotX) - z * Math.sin(rotX);
      const newZ = y * Math.sin(rotX) + z * Math.cos(rotX);
      
      newPositions[i * 3] = x;
      newPositions[i * 3 + 1] = newY;
      newPositions[i * 3 + 2] = newZ;
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    geo.dispose();
    return geo;
  }, [radius, inclination]);

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, [color, opacity]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
}