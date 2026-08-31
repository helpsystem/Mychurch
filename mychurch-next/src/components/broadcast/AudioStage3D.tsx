"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface AudioStage3DProps {
  stream: MediaStream | null;
  className?: string;
}

// Organic Particle Ring Shader
const vertexShader = `
  uniform float uTime;
  uniform float uAudioData;
  
  attribute float aSize;
  attribute float aAngle;
  attribute float aRadius;
  
  varying vec3 vColor;
  
  // Basic pseudo-random and noise functions
  float hash(float n) { return fract(sin(n) * 1e4); }
  float noise(vec3 x) {
    const vec3 step = vec3(110, 241, 171);
    vec3 i = floor(x);
    vec3 f = fract(x);
    float n = dot(i, step);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix( hash(n + dot(step, vec3(0, 0, 0))), hash(n + dot(step, vec3(1, 0, 0))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 0))), hash(n + dot(step, vec3(1, 1, 0))), u.x), u.y),
               mix(mix( hash(n + dot(step, vec3(0, 0, 1))), hash(n + dot(step, vec3(1, 0, 1))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 1))), hash(n + dot(step, vec3(1, 1, 1))), u.x), u.y), u.z);
  }

  void main() {
    // Determine base position from angle and radius
    vec3 pos = position;
    
    // Add organic noise movement
    float noiseFreq = 0.5;
    float noiseAmp = 1.5 + (uAudioData * 3.0); // Audio scales the noise amplitude
    vec3 noisePos = vec3(pos.x * noiseFreq, pos.y * noiseFreq, pos.z * noiseFreq + uTime * 0.5);
    float n = noise(noisePos);
    
    // Deform outwards based on noise and audio
    pos.x += cos(aAngle) * n * noiseAmp;
    pos.y += sin(aAngle) * n * noiseAmp;
    pos.z += (n - 0.5) * noiseAmp * 2.0;

    // Colors: Deep Indigo to Amber based on radius, angle, and audio
    vec3 color1 = vec3(0.1, 0.2, 0.8); // Deep Blue
    vec3 color2 = vec3(0.9, 0.4, 0.1); // Amber / Orange
    vec3 color3 = vec3(0.4, 0.1, 0.8); // Purple
    
    float mixVal = sin(aAngle * 3.0 + uTime + uAudioData) * 0.5 + 0.5;
    vec3 finalColor = mix(color1, color2, mixVal);
    finalColor = mix(finalColor, color3, n);
    
    // Intensify color with audio
    finalColor *= (1.0 + uAudioData * 2.0);
    
    vColor = finalColor;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation
    gl_PointSize = aSize * (300.0 / -mvPosition.z) * (1.0 + uAudioData);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  
  void main() {
    // Create a soft circle / glow for the particle
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float ll = length(xy);
    if (ll > 0.5) discard;
    
    // Soft radial gradient
    float alpha = smoothstep(0.5, 0.1, ll);
    
    gl_FragColor = vec4(vColor, alpha * 0.8);
  }
`;

export function AudioStage3D({ stream, className = "" }: AudioStage3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Set up Audio
  useEffect(() => {
    if (!stream) return;
    
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128; 
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;
    
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

    try {
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
    } catch (e) {
      console.warn("[AudioStage3D] Audio stream connect error:", e);
    }

    return () => {
      audioCtx.close();
    };
  }, [stream]);

  // Set up Three.js
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    // Dark deep background fog
    scene.fog = new THREE.FogExp2(0x050510, 0.03);

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 2, 25);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0); // Transparent base
    
    // Add additive blending for glow
    mount.appendChild(renderer.domElement);

    // Create Organic Particle System
    const particleCount = 10000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const angles = new Float32Array(particleCount);
    const radii = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Create a thick torus distribution
      const radius = 8 + (Math.random() - 0.5) * 4;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 2;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      
      sizes[i] = Math.random() * 2.0 + 0.5;
      angles[i] = angle;
      radii[i] = radius;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
    geometry.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioData: { value: 0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, material);
    // Tilt the ring slightly
    particleSystem.rotation.x = -0.3;
    scene.add(particleSystem);

    function handleResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    const clock = new THREE.Clock();
    let rafId = 0;
    let smoothAudio = 0;

    function animate() {
      rafId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Audio Data Processing
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
        // Get average of lower frequencies (bass)
        let sum = 0;
        const limit = 20;
        for (let i = 0; i < limit; i++) {
          sum += dataArrayRef.current[i];
        }
        const avg = sum / limit;
        const normalized = avg / 255.0; // 0 to 1
        
        // Smooth out the audio reactivity
        smoothAudio += (normalized - smoothAudio) * 0.15;
      }

      // Update uniforms
      material.uniforms.uTime.value = time;
      material.uniforms.uAudioData.value = smoothAudio;

      // Slowly rotate the entire system
      particleSystem.rotation.y = time * 0.1;
      particleSystem.rotation.z = Math.sin(time * 0.2) * 0.1;

      // Slight camera drift for cinematic feel
      camera.position.x = Math.sin(time * 0.1) * 2;
      camera.position.y = 2 + Math.cos(time * 0.15) * 1;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-full pointer-events-none ${className}`}>
      {/* Cinematic dark overlay base */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070e] via-transparent to-transparent opacity-80 z-[-1]" />
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
