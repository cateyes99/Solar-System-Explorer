import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshPhysicalMaterial, SphereGeometry, Group, ShaderMaterial, AdditiveBlending, DoubleSide } from 'three';

interface SunProps {
  radius: number;
  time: number;
  isHovered: boolean;
}

export function Sun({ radius, time, isHovered }: SunProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const flareRef = useRef<THREE.Mesh>(null);

  const sunMaterial = useMemo(() => {
    const material = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: isHovered ? 1.5 : 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalMatrix * normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 5; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
        
        void main() {
          vec2 uv = vUv * 10.0;
          float n = fbm(uv + uTime * 0.05);
          float n2 = fbm(uv * 2.0 - uTime * 0.03);
          
          float intensity = n * 0.5 + n2 * 0.3 + 0.5;
          intensity = pow(intensity, 1.5) * uIntensity;
          
          vec3 color1 = vec3(1.0, 0.8, 0.0);
          vec3 color2 = vec3(1.0, 0.5, 0.0);
          vec3 color3 = vec3(1.0, 0.2, 0.0);
          
          vec3 color = mix(color3, color2, intensity);
          color = mix(color, color1, intensity * intensity);
          
          float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          color += vec3(1.0, 0.4, 0.0) * fresnel * 0.5 * uIntensity;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
    return material;
  }, [isHovered]);

  const coronaMaterial = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraPosition: { value: new THREE.Vector3() },
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
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        
        void main() {
          vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
          
          float pulse = sin(uTime * 2.0) * 0.1 + 0.9;
          float corona = fresnel * pulse * 0.6;
          
          vec3 color = vec3(1.0, 0.6, 0.1);
          gl_FragColor = vec4(color, corona);
        }
      `,
      transparent: true,
      blending: AdditiveBlending,
      side: DoubleSide,
      depthWrite: false,
    });
  }, []);

  const flareMaterial = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraPosition: { value: new THREE.Vector3() },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uCameraPosition;
        varying vec3 vWorldPosition;
        
        void main() {
          vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
          float flare = pow(max(dot(viewDir, vec3(0.0, 0.0, 1.0)), 0.0), 100.0);
          flare += pow(max(dot(viewDir, vec3(0.0, 0.0, -1.0)), 0.0), 100.0);
          
          float pulse = sin(uTime * 3.0) * 0.2 + 0.8;
          gl_FragColor = vec4(vec3(1.0, 0.7, 0.2), flare * pulse * 0.5);
        }
      `,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.001;
      if (meshRef.current.material instanceof ShaderMaterial) {
        meshRef.current.material.uniforms.uTime.value = time;
      }
    }
    if (coronaRef.current) {
      coronaRef.current.rotation.y -= delta * 0.0005;
      coronaRef.current.rotation.x += delta * 0.0002;
      if (coronaRef.current.material instanceof ShaderMaterial) {
        coronaRef.current.material.uniforms.uTime.value = time;
        coronaRef.current.material.uniforms.uCameraPosition.value.copy(state.camera.position);
      }
    }
    if (flareRef.current) {
      flareRef.current.lookAt(state.camera.position);
      if (flareRef.current.material instanceof ShaderMaterial) {
        flareRef.current.material.uniforms.uTime.value = time;
        flareRef.current.material.uniforms.uCameraPosition.value.copy(state.camera.position);
      }
    }
  });

  return (
    <group>
      <pointLight
        color="#ffcc00"
        intensity={2.5}
        distance={2000}
        decay={2}
        position={[0, 0, 0]}
      />
      <pointLight
        color="#ff8800"
        intensity={1.0}
        distance={1000}
        decay={2}
        position={[0, 0, 0]}
      />
      <ambientLight color="#332200" intensity={0.3} />

      <mesh
        ref={meshRef}
        geometry={new SphereGeometry(radius, 64, 64)}
        material={sunMaterial}
        scale={isHovered ? 1.05 : 1}
      >
        <mesh
          ref={coronaRef}
          geometry={new SphereGeometry(radius * 1.15, 32, 32)}
          material={coronaMaterial}
        />
        <mesh
          ref={flareRef}
          geometry={new SphereGeometry(radius * 1.3, 16, 16)}
          material={flareMaterial}
        />
      </mesh>
    </group>
  );
}