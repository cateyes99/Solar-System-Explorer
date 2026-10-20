import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createStarField } from '../../utils/astronomy';

interface StarFieldProps {
  visible: boolean;
}

export function StarField({ visible }: StarFieldProps) {
  const pointsRef = useRef<THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>>(null);
  const { camera } = useThree();

  const geometry = useMemo(() => createStarField(4000), []);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false,
    });
  }, []);

  useFrame((state) => {
    const points = pointsRef.current;
    if (points && visible) {
      points.rotation.y += state.clock.getDelta() * 0.00002;
      
      const positions = points.geometry.attributes.position;
      const sizes = points.geometry.attributes.size;
      const twinkleSpeeds = points.geometry.attributes.twinkleSpeed;
      const twinklePhases = points.geometry.attributes.twinklePhase;
      
      const time = state.clock.elapsedTime;
      
      for (let i = 0; i < positions.count; i++) {
        const speed = twinkleSpeeds.getX(i);
        const phase = twinklePhases.getX(i);
        const baseSize = sizes.getX(i);
        
        const twinkle = Math.sin(time * speed + phase) * 0.3 + 0.7;
        points.material.size = baseSize * twinkle;
      }
      
      points.material.needsUpdate = true;
    }
  });

  if (!visible) return null;

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
    />
  );
}