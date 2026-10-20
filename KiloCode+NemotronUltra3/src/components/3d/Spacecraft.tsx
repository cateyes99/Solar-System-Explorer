import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SpacecraftProps {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  target: string | null;
  time: number;
  scaleMode: 'educational' | 'relative-size' | 'distances' | 'custom';
}

export function Spacecraft({ position, velocity, target, time, scaleMode }: SpacecraftProps) {
  const meshRef = useRef<THREE.Group>(null);
  const engineGlowRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (engineGlowRef.current) {
        const pulse = Math.sin(time * 10) * 0.3 + 0.7;
        engineGlowRef.current.scale.setScalar(pulse);
        (engineGlowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse * 0.6;
      }
      
      if (velocity.length() > 0.1) {
        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          velocity.clone().normalize()
        );
        meshRef.current.quaternion.slerp(targetQuaternion, delta * 5);
      }
    }
  });

  return (
    <group ref={meshRef} position={position.toArray()}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.8, 4, 8]} />
        <meshStandardMaterial color={0xcccccc} roughness={0.3} metalness={0.8} />
      </mesh>
      
      <mesh position={[0, 0, 0.5]}>
        <boxGeometry args={[6, 0.1, 2]} />
        <meshStandardMaterial color={0x888888} roughness={0.4} metalness={0.6} />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2.2]}>
        <cylinderGeometry args={[0.3, 0.4, 0.8, 8]} />
        <meshStandardMaterial color={0x444444} roughness={0.2} metalness={0.9} />
      </mesh>
      
      <mesh ref={engineGlowRef} position={[0, 0, -2.6]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial 
          color={0x00aaff} 
          transparent 
          opacity={0.6} 
          blending={THREE.AdditiveBlending} 
          depthWrite={false} 
        />
      </mesh>
      
      <pointLight color={0x00aaff} intensity={2} distance={20} position={[0, 0, -2.6]} />
    </group>
  );
}