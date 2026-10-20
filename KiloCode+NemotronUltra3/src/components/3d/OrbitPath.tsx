import React, { useMemo } from 'react';
import * as THREE from 'three';

interface OrbitPathProps {
  radius: number;
  inclination?: number;
  longitudeOfAscendingNode?: number;
  argumentOfPeriapsis?: number;
  color?: string;
  opacity?: number;
}

export function OrbitPath({ 
  radius, 
  inclination = 0, 
  longitudeOfAscendingNode = 0,
  argumentOfPeriapsis = 0,
  color = '#ffffff', 
  opacity = 0.15 
}: OrbitPathProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.RingGeometry(radius - 0.5, radius + 0.5, 256);
    const positions = geo.attributes.position;
    const newPositions = new Float32Array(positions.count * 3);
    
    const inc = inclination;
    const lan = longitudeOfAscendingNode;
    const aop = argumentOfPeriapsis;
    
    // Pre-calculate rotation matrices for orbital elements
    const cosInc = Math.cos(inc);
    const sinInc = Math.sin(inc);
    const cosLan = Math.cos(lan);
    const sinLan = Math.sin(lan);
    const cosAop = Math.cos(aop);
    const sinAop = Math.sin(aop);
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      // Start with ring in XY plane (z=0), then rotate to orbital plane
      // Apply argument of periapsis (rotation in orbital plane)
      let x1 = x * cosAop - y * sinAop;
      let y1 = x * sinAop + y * cosAop;
      let z1 = z;
      
      // Apply inclination (tilt orbital plane)
      let x2 = x1;
      let y2 = y1 * cosInc - z1 * sinInc;
      let z2 = y1 * sinInc + z1 * cosInc;
      
      // Apply longitude of ascending node (rotate around Z)
      let x3 = x2 * cosLan - y2 * sinLan;
      let y3 = x2 * sinLan + y2 * cosLan;
      let z3 = z2;
      
      newPositions[i * 3] = x3;
      newPositions[i * 3 + 1] = y3;
      newPositions[i * 3 + 2] = z3;
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    geo.dispose();
    return geo;
  }, [radius, inclination, longitudeOfAscendingNode, argumentOfPeriapsis]);

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      depthWrite: false,
    });
  }, [color, opacity]);

  return (
    <primitive object={new THREE.Line(geometry, material)} />
  );
}