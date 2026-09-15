import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/simulationStore';
import { planetsData } from '../../data/planets';
import { getPlanetScaleDistance, getPlanetScaleRadius } from '../../utils/scale';
import { calculateOrbitalPosition, easeOutExpo } from '../../utils/astronomy';

interface CameraControllerProps {
  mode: 'solar-system' | 'planet' | 'follow';
  targetId: string | null;
  spacecraftActive: boolean;
  spacecraftPosition: THREE.Vector3;
  reducedMotion: boolean;
}

interface OrbitControlsLike {
  enabled: boolean;
  target: THREE.Vector3;
}

export function CameraController({ mode, targetId, spacecraftActive, spacecraftPosition, reducedMotion }: CameraControllerProps) {
  const { camera, controls } = useThree();
  const currentModeRef = useRef(mode);
  const transitionRef = useRef<{ start: number; duration: number; from: THREE.Vector3; to: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3 } | null>(null);
  const followOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 20, 50));

  useEffect(() => {
    if (mode !== currentModeRef.current) {
      currentModeRef.current = mode;
      transitionRef.current = null;
    }
  }, [mode]);

  const getPlanetPosition = (planetId: string, time: number): THREE.Vector3 => {
    const planet = planetsData.find(p => p.id === planetId);
    if (!planet || planetId === 'sun') return new THREE.Vector3(0, 0, 0);
    
    const scaleMode = useAppStore.getState().scaleMode;
    const distance = getPlanetScaleDistance(planet, scaleMode);
    const speed = planet.orbitalSpeed * 0.01;
    
    return calculateOrbitalPosition(distance, speed, time);
  };

  const getTargetPosition = (): THREE.Vector3 => {
    const state = useAppStore.getState();
    const time = state.isPaused ? 0 : (performance.now() / 1000) * state.simulationSpeed;
    
    if (spacecraftActive) {
      return spacecraftPosition.clone();
    }
    
    if (targetId && targetId !== 'sun') {
      return getPlanetPosition(targetId, time);
    }
    
    return new THREE.Vector3(0, 0, 0);
  };

  const getCameraTargetPosition = (): THREE.Vector3 => {
    const state = useAppStore.getState();
    const scaleMode = state.scaleMode;
    const time = state.isPaused ? 0 : (performance.now() / 1000) * state.simulationSpeed;
    
    if (spacecraftActive) {
      return spacecraftPosition.clone();
    }
    
    if (targetId && targetId !== 'sun') {
      const planet = planetsData.find(p => p.id === targetId);
      if (planet) {
        return getPlanetPosition(targetId, time);
      }
    }
    
    return new THREE.Vector3(0, 0, 0);
  };

  useFrame((state, delta) => {
    if (reducedMotion || !controls) return;
    
    const c = controls as unknown as OrbitControlsLike;
    const targetPos = getTargetPosition();
    const lookAtPos = getCameraTargetPosition();
    
    if (mode === 'solar-system') {
      if (!transitionRef.current) {
        c.enabled = true;
      }
      return;
    }
    
    if (mode === 'planet' || mode === 'follow') {
      c.enabled = false;
      
      if (!transitionRef.current) {
        transitionRef.current = {
          start: state.clock.elapsedTime,
          duration: 2.0,
          from: camera.position.clone(),
          to: targetPos.clone().add(followOffsetRef.current),
          fromTarget: c.target.clone(),
          toTarget: lookAtPos.clone(),
        };
      }
      
      if (transitionRef.current) {
        const elapsed = state.clock.elapsedTime - transitionRef.current.start;
        const progress = Math.min(elapsed / transitionRef.current.duration, 1);
        const eased = easeOutExpo(progress);
        
        camera.position.lerpVectors(transitionRef.current.from, transitionRef.current.to, eased);
        c.target.lerpVectors(transitionRef.current.fromTarget, transitionRef.current.toTarget, eased);
        
        if (progress >= 1) {
          transitionRef.current = null;
        }
      } else if (mode === 'follow') {
        const desiredPos = targetPos.clone().add(followOffsetRef.current);
        camera.position.lerp(desiredPos, delta * 2);
        c.target.lerp(lookAtPos, delta * 2);
      }
    }
  });

  return null;
}