import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/simulationStore';
import { planetsData } from '../../data/planets';
import { getPlanetScaleDistance, getPlanetScaleRadius } from '../../utils/scale';
import { calculateOrbitalPosition, easeOutExpo } from '../../utils/astronomy';

interface CameraControllerProps {
  mode: 'solar-system' | 'planet' | 'follow' | 'cinematic';
  targetId: string | null;
  spacecraftActive: boolean;
  spacecraftPosition: THREE.Vector3;
  reducedMotion: boolean;
  cinematicTourActive: boolean;
  cinematicTourStep: number;
  cinematicTourProgress: number;
}

interface OrbitControlsLike {
  enabled: boolean;
  target: THREE.Vector3;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: [number, number, number];
  lookAt: [number, number, number];
  duration: number;
}

const tourSteps: TourStep[] = [
  { id: 'overview', title: 'Solar System Overview', description: 'Welcome to our cosmic neighborhood. Eight planets orbit our Sun.', target: [0, 100, 400], lookAt: [0, 0, 0], duration: 4 },
  { id: 'sun', title: 'The Sun', description: 'Our star contains 99.86% of the Solar System\'s mass. Nuclear fusion in its core powers everything.', target: [0, 10, 25], lookAt: [0, 0, 0], duration: 5 },
  { id: 'mercury', title: 'Mercury', description: 'Closest to the Sun. No atmosphere, extreme temperatures, and a year of just 88 days.', target: [30, 5, 15], lookAt: [25, 0, 10], duration: 3 },
  { id: 'venus', title: 'Venus', description: 'Earth\'s toxic twin. Runaway greenhouse effect makes it the hottest planet.', target: [45, 5, 10], lookAt: [40, 0, 5], duration: 3 },
  { id: 'earth', title: 'Earth', description: 'Our home. The only known world with life, liquid water, and a protective atmosphere.', target: [60, 10, 10], lookAt: [55, 0, 5], duration: 4 },
  { id: 'moon', title: 'The Moon', description: 'Earth\'s companion. Causes tides, stabilizes our axis, and is the only other world humans have visited.', target: [65, 8, 12], lookAt: [60, 0, 5], duration: 3 },
  { id: 'mars', title: 'Mars', description: 'The Red Planet. Once had water, has the tallest volcano, and is our next target for exploration.', target: [85, 10, 10], lookAt: [80, 0, 5], duration: 4 },
  { id: 'jupiter', title: 'Jupiter', description: 'King of planets. A gas giant with a centuries-old storm and 95 moons.', target: [150, 20, 30], lookAt: [140, 0, 10], duration: 5 },
  { id: 'saturn', title: 'Saturn', description: 'The jewel of the Solar System. Magnificent rings made of ice and rock.', target: [280, 30, 50], lookAt: [260, 0, 20], duration: 5 },
  { id: 'uranus', title: 'Uranus', description: 'The sideways planet. Rolls on its side with extreme 42-year seasons.', target: [500, 20, 50], lookAt: [480, 0, 20], duration: 4 },
  { id: 'neptune', title: 'Neptune', description: 'The windiest world. Supersonic winds and a beautiful deep blue color.', target: [750, 15, 50], lookAt: [720, 0, 20], duration: 4 },
  { id: 'finale', title: 'The Complete System', description: 'All planets in their orbital dance. A fragile, beautiful system we call home.', target: [0, 200, 600], lookAt: [0, 0, 0], duration: 5 },
];

export function CameraController({ mode, targetId, spacecraftActive, spacecraftPosition, reducedMotion, cinematicTourActive, cinematicTourStep, cinematicTourProgress }: CameraControllerProps) {
  const { camera, controls } = useThree();
  const currentModeRef = useRef(mode);
  const transitionRef = useRef<{ start: number; duration: number; from: THREE.Vector3; to: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3 } | null>(null);
  const followOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 20, 50));
  const timeRef = useRef(0);
  const tourTransitionRef = useRef<{ stepIndex: number; startTime: number; fromPos: THREE.Vector3; toPos: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3; duration: number } | null>(null);

  useEffect(() => {
    if (mode !== currentModeRef.current) {
      currentModeRef.current = mode;
      transitionRef.current = null;
      tourTransitionRef.current = null;
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

  const getTargetPosition = (time: number): THREE.Vector3 => {
    if (spacecraftActive) {
      return spacecraftPosition.clone();
    }
    
    if (targetId && targetId !== 'sun') {
      return getPlanetPosition(targetId, time);
    }
    
    return new THREE.Vector3(0, 0, 0);
  };

  const getCameraTargetPosition = (time: number): THREE.Vector3 => {
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
    
    const simulationSpeed = useAppStore.getState().simulationSpeed;
    const isPaused = useAppStore.getState().isPaused;
    
    if (!isPaused) {
      timeRef.current += delta * simulationSpeed;
    }
    
    const c = controls as unknown as OrbitControlsLike;
    const targetPos = getTargetPosition(timeRef.current);
    const lookAtPos = getCameraTargetPosition(timeRef.current);
    
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
    
    if (mode === 'cinematic' && cinematicTourActive) {
      c.enabled = false;
      
      const currentStep = tourSteps[cinematicTourStep];
      if (!currentStep) return;
      
      const stepDuration = currentStep.duration;
      const stepProgress = cinematicTourProgress;
      
      if (!tourTransitionRef.current || tourTransitionRef.current.stepIndex !== cinematicTourStep) {
        tourTransitionRef.current = {
          stepIndex: cinematicTourStep,
          startTime: state.clock.elapsedTime,
          fromPos: camera.position.clone(),
          toPos: new THREE.Vector3(...currentStep.target),
          fromTarget: c.target.clone(),
          toTarget: new THREE.Vector3(...currentStep.lookAt),
          duration: stepDuration,
        };
      }
      
      if (tourTransitionRef.current) {
        const elapsed = state.clock.elapsedTime - tourTransitionRef.current.startTime;
        const progress = Math.min(elapsed / tourTransitionRef.current.duration, 1);
        const eased = easeOutExpo(progress);
        
        camera.position.lerpVectors(tourTransitionRef.current.fromPos, tourTransitionRef.current.toPos, eased);
        c.target.lerpVectors(tourTransitionRef.current.fromTarget, tourTransitionRef.current.toTarget, eased);
      }
    }
  });

  return null;
}