import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SunProps {
  radius: number;
  time: number;
  isHovered: boolean;
}

export function Sun({ radius, time, isHovered }: SunProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);

  const sunMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: isHovered ? 1.2 : 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vNormal = normalMatrix * normal;
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }

        float fbm(vec2 p, float time) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p * (1.0 + float(i) * 0.5) + time * 0.01 * float(i));
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 normal = normalize(vWorldPosition);
          float phi = atan(normal.z, normal.x);
          float theta = acos(clamp(normal.y, -1.0, 1.0));
          vec2 uv = vec2(phi / (2.0 * 3.14159) + 0.5, theta / 3.14159);

          // Subtle granulation
          float gran = fbm(uv * 40.0, uTime) * 0.15;
          float gran2 = fbm(uv * 80.0 - uTime * 0.005, uTime) * 0.08;

          // Base color - bright yellow-white
          vec3 color = vec3(1.0, 0.95, 0.7);

          // Add granulation variation
          color *= 1.0 + gran + gran2;

          // Slight limb darkening
          vec3 viewDir = normalize(-vWorldPosition);
          float cosTheta = max(dot(vNormal, viewDir), 0.0);
          float limb = 0.6 + 0.4 * cosTheta;
          color *= limb;

          // Warm limb glow
          float limbGlow = pow(1.0 - cosTheta, 4.0) * 0.25;
          color += vec3(1.0, 0.5, 0.1) * limbGlow;

          color *= uIntensity;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
  }, [isHovered]);

  // Soft corona glow
  const coronaMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraPosition: { value: new THREE.Vector3() },
        uRadius: { value: radius },
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
        uniform float uTime;
        uniform vec3 uCameraPosition;
        uniform float uRadius;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);

          float dist = length(vWorldPosition) - uRadius;
          float fade = smoothstep(uRadius * 0.5, 0.0, dist);

          float pulse = sin(uTime * 0.3) * 0.05 + 0.95;

          float corona = fresnel * fade * pulse * 0.25;

          vec3 color = vec3(1.0, 0.85, 0.5);
          gl_FragColor = vec4(color, corona);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, [radius]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.0003;
      if (meshRef.current.material instanceof THREE.ShaderMaterial) {
        meshRef.current.material.uniforms.uTime.value = time;
      }
    }
    if (coronaRef.current && coronaRef.current.material instanceof THREE.ShaderMaterial) {
      coronaRef.current.material.uniforms.uTime.value = time;
      coronaRef.current.material.uniforms.uCameraPosition.value.copy(state.camera.position);
    }
  });

  return (
    <group>
      {/* Primary sunlight - casts shadows */}
      <pointLight
        color="#fffbe6"
        intensity={18000}
        distance={5000}
        decay={2}
        position={[0, 0, 0]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={5000}
        shadow-bias={-0.0002}
        shadow-radius={2}
        shadow-normalBias={0.05}
      />
      {/* Fill light - no shadows, softer */}
      <pointLight
        color="#ffeebb"
        intensity={4000}
        distance={3000}
        decay={2}
        position={[0, 0, 0]}
      />

      {/* Photosphere - bright yellow surface with subtle granulation */}
      <mesh
        ref={meshRef}
        geometry={new THREE.SphereGeometry(radius, 64, 32)}
        material={sunMaterial}
        scale={isHovered ? 1.02 : 1}
      />

      {/* Soft corona */}
      <mesh
        ref={coronaRef}
        geometry={new THREE.SphereGeometry(radius * 1.3, 32, 16)}
        material={coronaMaterial}
      />
    </group>
  );
}