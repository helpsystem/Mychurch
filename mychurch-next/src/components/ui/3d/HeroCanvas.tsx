// @ts-nocheck
"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

function FloatingCrossAndParticles({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meshRef.current) {
      // چرخش و جابه‌جایی ذرات بر اساس میزان اسکرول کاربر
      meshRef.current.rotation.y = scrollProgress * Math.PI * 2;
      meshRef.current.rotation.x = Math.sin(scrollProgress * Math.PI) * 0.5;
      meshRef.current.position.z = scrollProgress * 3;
    }
  });

  return (
    <group ref={meshRef}>
      {/* منبع نور مرکزی طلایی (نماد نور جهان) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#FBBF24" />
      </mesh>

      {/* ذرات درخشان اطراف */}
      <Sparkles count={150} scale={10} size={3} speed={0.4} color="#FBBF24" />
      <Sparkles count={100} scale={12} size={2} speed={0.2} color="#06B6D4" />
    </group>
  );
}

export default function HeroCanvas({ scrollProgress }: { scrollProgress: number }) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 0, 5]} intensity={2} color="#FBBF24" />
        <FloatingCrossAndParticles scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
