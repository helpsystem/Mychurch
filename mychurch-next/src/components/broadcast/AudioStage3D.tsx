"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface AudioStage3DProps {
  stream: MediaStream | null;
  className?: string;
}

export function AudioStage3D({ stream, className = "" }: AudioStage3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!stream) return;
    
    // Set up Web Audio API
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64; // Small fft for simple visualizer (32 bars)
    analyserRef.current = analyser;
    
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

    try {
      // Create source from the provided stream
      // We don't connect source to destination because we don't want to playback the mic
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
    } catch (e) {
      console.warn("[AudioStage3D] Could not connect stream to audio context", e);
    }

    return () => {
      audioCtx.close();
    };
  }, [stream]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Three.js Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070e, 0.05);

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    // Transparent background so video can show behind or it can overlay
    renderer.setClearColor(0x000000, 0); 
    mount.appendChild(renderer.domElement);

    // Create a 3D Audio Visualizer Grid / Bars
    const barsCount = 32;
    const bars: THREE.Mesh[] = [];
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x818cf8, 
      transparent: true, 
      opacity: 0.8,
      wireframe: true 
    });

    const group = new THREE.Group();
    const radius = 8;
    
    for (let i = 0; i < barsCount; i++) {
      const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
      // Shift origin to bottom
      geometry.translate(0, 0.5, 0);
      const mesh = new THREE.Mesh(geometry, material);
      
      const angle = (i / barsCount) * Math.PI * 2;
      mesh.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      mesh.lookAt(0, 0, 0);
      
      bars.push(mesh);
      group.add(mesh);
    }
    
    // Add an inner glowing sphere
    const sphereGeo = new THREE.IcosahedronGeometry(3, 1);
    const sphereMat = new THREE.MeshBasicMaterial({ 
      color: 0x6366f1, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.3 
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(sphere);

    scene.add(group);

    // Resize handler
    function handleResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let rafId = 0;
    function animate() {
      rafId = requestAnimationFrame(animate);

      // Update audio data
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        // Update bars
        let avgIntensity = 0;
        for (let i = 0; i < barsCount; i++) {
          const value = dataArrayRef.current[i];
          const scaleY = Math.max(0.1, value / 10);
          bars[i].scale.y = scaleY;
          
          // Modify color slightly based on intensity
          const hue = 230 + (value / 255) * 60; // Blue to Purple
          (bars[i].material as THREE.MeshBasicMaterial).color.setHSL(hue / 360, 0.8, 0.6);
          
          avgIntensity += value;
        }
        avgIntensity /= barsCount;

        // Pulse the inner sphere based on average intensity
        const sphereScale = 1 + (avgIntensity / 255) * 0.5;
        sphere.scale.set(sphereScale, sphereScale, sphereScale);
      }

      // Slowly rotate the group
      group.rotation.y += 0.002;
      sphere.rotation.x -= 0.005;
      sphere.rotation.y -= 0.005;

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      
      material.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      bars.forEach(b => b.geometry.dispose());
      
      renderer.dispose();
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-full pointer-events-none ${className}`}>
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
