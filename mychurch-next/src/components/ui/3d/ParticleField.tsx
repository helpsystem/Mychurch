"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// ─── Gold Particle Cloud ────────────────────────────────────────────────────
function GoldParticles() {
  const ref = useRef<THREE.Points>(null!);

  const particles = useMemo(() => {
    const count = 2200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const goldBase = new THREE.Color("#F5A623");
    const goldLight = new THREE.Color("#FFE4A0");
    const whiteGlow = new THREE.Color("#FFFFFF");

    for (let i = 0; i < count; i++) {
      // Sphere distribution
      const radius = Math.random() * 6 + 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Random color between gold shades and white
      const t = Math.random();
      const col = t < 0.6 
        ? goldBase.clone().lerp(goldLight, Math.random())
        : goldLight.clone().lerp(whiteGlow, Math.random() * 0.5);

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    return { positions, colors };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.04;
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.02) * 0.08;
  });

  return (
    <Points ref={ref} positions={particles.positions} colors={particles.colors} stride={3}>
      <PointMaterial
        transparent
        vertexColors
        size={0.025}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.85}
      />
    </Points>
  );
}

// ─── Cross Light Beam ────────────────────────────────────────────────────────
function CrossBeam() {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.3) * 0.05;
    const scale = 1 + Math.sin(clock.getElapsedTime() * 1.2) * 0.03;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <group rotation={[0, 0, 0]}>
      {/* Vertical beam */}
      <mesh ref={meshRef} position={[0, 0, -2]}>
        <planeGeometry args={[0.04, 3.5]} />
        <meshBasicMaterial
          color="#F5A623"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Horizontal beam */}
      <mesh position={[0, 0.6, -2]}>
        <planeGeometry args={[2.2, 0.04]} />
        <meshBasicMaterial
          color="#F5A623"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Center glow */}
      <mesh position={[0, 0.6, -1.9]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial
          color="#FFE4A0"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function ParticleField() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.1} />
        <GoldParticles />
        <CrossBeam />
      </Canvas>
    </div>
  );
}
