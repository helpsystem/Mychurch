// @ts-nocheck
"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// Church presence locations: [lat, lon]
const CHURCH_LOCATIONS: [number, number][] = [
  [38.9, -77.0],   // Washington DC
  [35.7, 51.4],    // Tehran
  [51.5, -0.1],    // London
  [52.5, 13.4],    // Berlin
  [48.8, 2.3],     // Paris
  [59.9, 10.7],    // Oslo
  [45.5, -73.6],   // Montreal
  [34.0, -118.2],  // Los Angeles
  [37.8, -122.4],  // San Francisco
  [43.7, -79.4],   // Toronto
  [55.7, 37.6],    // Moscow
  [41.0, 28.9],    // Istanbul
  [-33.9, 18.4],   // Cape Town
  [1.3, 103.8],    // Singapore
  [-37.8, 144.9],  // Melbourne
];

function latLonToXYZ(lat: number, lon: number, r = 1.5) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function Globe() {
  const globeRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!globeRef.current) return;
    globeRef.current.rotation.y = clock.getElapsedTime() * 0.12;
  });

  // Generate grid dots for globe surface
  const gridDots = useMemo(() => {
    const positions: number[] = [];
    const count = 1800;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const r = 1.5;
      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }
    return new Float32Array(positions);
  }, []);

  return (
    <group ref={globeRef}>
      {/* Globe base sphere */}
      <Sphere args={[1.48, 64, 64]}>
        <meshPhongMaterial
          color="#0A1628"
          transparent
          opacity={0.9}
          shininess={30}
          specular="#1a3460"
        />
      </Sphere>

      {/* Grid dots */}
      <Points positions={gridDots} stride={3}>
        <PointMaterial
          color="#1E4080"
          size={0.008}
          sizeAttenuation
          transparent
          opacity={0.7}
        />
      </Points>

      {/* Equator glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.006, 8, 100]} />
        <meshBasicMaterial color="#F5A623" transparent opacity={0.3} />
      </mesh>

      {/* Church location dots */}
      {CHURCH_LOCATIONS.map(([lat, lon], i) => {
        const pos = latLonToXYZ(lat, lon, 1.52);
        return (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial
              color={i === 0 ? "#F5A623" : "#60A5FA"}
              transparent
              opacity={0.9}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function GlowRings() {
  const ring1 = useRef<THREE.Mesh>(null!);
  const ring2 = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring1.current) ring1.current.rotation.z = t * 0.1;
    if (ring2.current) ring2.current.rotation.x = t * 0.07;
  });

  return (
    <>
      <mesh ref={ring1} rotation={[0.8, 0, 0]}>
        <torusGeometry args={[2.2, 0.003, 4, 120]} />
        <meshBasicMaterial color="#F5A623" transparent opacity={0.15} />
      </mesh>
      <mesh ref={ring2} rotation={[0.4, 0.6, 0]}>
        <torusGeometry args={[2.5, 0.002, 4, 120]} />
        <meshBasicMaterial color="#60A5FA" transparent opacity={0.1} />
      </mesh>
    </>
  );
}

export default function WorldGlobe() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#F5A623" />
        <pointLight position={[-5, -3, -5]} intensity={0.5} color="#60A5FA" />
        <Globe />
        <GlowRings />
      </Canvas>
    </div>
  );
}
