import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createPlanetTexture } from '../../utils/astronomy';

interface PlanetProps {
  planet: {
    id: string;
    name: string;
    color: string;
    textureFeatures?: {
      hasRings?: boolean;
      hasGreatRedSpot?: boolean;
      hasClouds?: boolean;
      hasAtmosphere?: boolean;
      ringColor?: string;
      ringInnerRadius?: number;
      ringOuterRadius?: number;
    };
    axialTiltDeg: number;
  };
  radius: number;
  time: number;
  rotationSpeed: number;
  isSelected: boolean;
  isHovered: boolean;
}

export function Planet({ planet, radius, time, rotationSpeed, isSelected, isHovered }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const planetMaterial = useMemo(() => {
    const texture = createPlanetTexture(planet.id);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
      color: new THREE.Color(planet.color),
    });
    
    if (planet.id === 'jupiter' || planet.id === 'saturn') {
      material.roughness = 0.7;
      material.metalness = 0.2;
    }
    
    return material;
  }, [planet.id, planet.color]);

  const atmosphereMaterial = useMemo(() => {
    if (!planet.textureFeatures?.hasAtmosphere) return null;
    
    return new THREE.ShaderMaterial({
      uniforms: {
        uCameraPosition: { value: new THREE.Vector3() },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(planet.id === 'earth' ? 0x4488ff : planet.id === 'venus' ? 0xffddaa : 0x88aaff) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vNormal = normalMatrix * normal;
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uCameraPosition;
        uniform float uTime;
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        
        void main() {
          vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
          float pulse = sin(uTime * 0.5) * 0.1 + 0.9;
          gl_FragColor = vec4(uColor, fresnel * pulse * 0.4);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, [planet.id, planet.color]);

  const cloudsMaterial = useMemo(() => {
    if (!planet.textureFeatures?.hasClouds) return null;
    
    const texture = createPlanetTexture(planet.id + '_clouds');
    return new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
  }, [planet.id]);

  const ringsMaterial = useMemo(() => {
    if (!planet.textureFeatures?.hasRings) return null;
    
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(planet.textureFeatures.ringColor || '#c9b896') },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        
        float noise(float x) {
          return fract(sin(x * 12.9898) * 43758.5453);
        }
        
        void main() {
          float r = length(vUv - vec2(0.5)) * 2.0;
          float rings = 0.0;
          
          for (int i = 0; i < 20; i++) {
            float band = float(i) * 0.05;
            float width = 0.02 + noise(band * 100.0) * 0.03;
            float alpha = smoothstep(band + width, band, r) - smoothstep(band, band - width, r);
            rings += alpha * (0.5 + noise(band * 200.0 + uTime * 0.1) * 0.5);
          }
          
          rings *= smoothstep(1.0, 0.95, r) * smoothstep(0.2, 0.3, r);
          gl_FragColor = vec4(uColor, rings * 0.8);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
  }, [planet.id, planet.textureFeatures?.ringColor]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * rotationSpeed * 0.001;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * rotationSpeed * 0.001 * 1.02;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.x = -Math.PI / 2 + planet.axialTiltDeg * Math.PI / 180;
      if (ringsRef.current.material instanceof THREE.ShaderMaterial) {
        ringsRef.current.material.uniforms.uTime.value = time;
      }
    }
    if (atmosphereRef.current && atmosphereRef.current.material instanceof THREE.ShaderMaterial) {
      atmosphereRef.current.material.uniforms.uTime.value = time;
      atmosphereRef.current.material.uniforms.uCameraPosition.value.copy(camera.position);
    }
  });

  const hasRings = planet.textureFeatures?.hasRings;
  const ringInner = planet.textureFeatures?.ringInnerRadius || 1.2;
  const ringOuter = planet.textureFeatures?.ringOuterRadius || 2.2;

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={new THREE.SphereGeometry(radius, 64, 64)}
        material={planetMaterial}
        castShadow
        receiveShadow
        scale={isHovered ? 1.03 : isSelected ? 1.02 : 1}
      />
      
      {planet.textureFeatures?.hasAtmosphere && atmosphereMaterial && (
        <mesh
          ref={atmosphereRef}
          geometry={new THREE.SphereGeometry(radius * 1.08, 32, 32)}
          material={atmosphereMaterial}
        />
      )}
      
      {planet.textureFeatures?.hasClouds && cloudsMaterial && (
        <mesh
          ref={cloudsRef}
          geometry={new THREE.SphereGeometry(radius * 1.03, 64, 64)}
          material={cloudsMaterial}
        />
      )}
      
      {hasRings && ringsMaterial && (
        <mesh
          ref={ringsRef}
          geometry={new THREE.RingGeometry(radius * ringInner, radius * ringOuter, 128, 8)}
          material={ringsMaterial}
          rotation={[-Math.PI / 2 + planet.axialTiltDeg * Math.PI / 180, 0, 0]}
        />
      )}
    </group>
  );
}