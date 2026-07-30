"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type HeroParticleFieldProps = {
  color?: string;
  background?: string;
  density?: number;
  className?: string;
};

const vertexShader = `
  uniform float uTime;
  
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute vec3 aBasePos;
  
  varying vec3 vColor;
  varying float vAlpha;
  
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
    vColor = aColor;
    vec3 pos = aBasePos;
    
    // Smooth fluid flow noise
    float n1 = noise(vec3(pos.x * 0.15, pos.y * 0.15, uTime * 0.05 + aPhase));
    float n2 = noise(vec3(pos.x * 0.2 + 10.0, pos.y * 0.2 + 10.0, uTime * 0.07 + aPhase));
    
    // Add swirl
    pos.x += sin(n1 * 10.0) * 1.5;
    pos.y += cos(n2 * 10.0) * 1.5;
    pos.z += (n1 - 0.5) * 4.0;
    
    // Gentle upward drift
    pos.y += uTime * 0.3 * (0.5 + n1);
    // Wrap around for continuous flow
    float modY = mod(pos.y + 8.0, 16.0) - 8.0;
    pos.y = modY;
    
    // Fade in and out at top and bottom edges
    vAlpha = smoothstep(-8.0, -4.0, pos.y) * smoothstep(8.0, 4.0, pos.y);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z) * (0.5 + n1 * 0.5);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float ll = length(xy);
    if (ll > 0.5) discard;
    
    // Core glow and soft falloff
    float alpha = smoothstep(0.5, 0.0, ll);
    float core = smoothstep(0.15, 0.0, ll) * 0.6;
    
    gl_FragColor = vec4(vColor * (1.0 + core), alpha * vAlpha * 0.85);
  }
`;

export default function HeroParticleField({
  color = "#F3C989",
  background = "#05070E",
  density = 5000, // Increased for a denser galaxy feel
  className = "",
}: HeroParticleFieldProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmallScreen = window.innerWidth < 768;
    const particleCount = isSmallScreen ? Math.round(density * 0.4) : density;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070E, 0.04);

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0); // Transparent base so CSS backgrounds can show
    mount.appendChild(renderer.domElement);

    // Create custom particle field
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);

    const crossHalfHeight = 3.5;
    const crossHalfWidth = 1.9;
    const armY = 0.9;
    const armHalfHeight = 0.5;
    
    const palette = [
      new THREE.Color("#fcd34d"), // Amber
      new THREE.Color("#fde68a"), // Light Amber
      new THREE.Color("#fff7ed"), // Warm White
      new THREE.Color("#6366f1"), // Indigo / Deep space
      new THREE.Color("#818cf8"), // Light Indigo
    ];

    function sampleCrossPoint(): [number, number, number] {
      const onArm = Math.random() < 0.35;
      let x: number, y: number;
      if (onArm) {
        x = (Math.random() * 2 - 1) * crossHalfWidth;
        y = armY + (Math.random() * 2 - 1) * armHalfHeight;
      } else {
        x = (Math.random() * 2 - 1) * 0.55;
        y = (Math.random() * 2 - 1) * crossHalfHeight;
      }
      x += (Math.random() - 0.5) * 1.5;
      y += (Math.random() - 0.5) * 1.5;
      const z = (Math.random() - 0.5) * 5;
      return [x, y, z];
    }

    function sampleGalaxyPoint(): [number, number, number] {
      const radius = 5 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 16;
      return [Math.cos(theta) * radius, y, Math.sin(theta) * radius];
    }

    for (let i = 0; i < particleCount; i++) {
      // 50% form the cross core, 50% form the ambient galaxy
      const [x, y, z] = Math.random() < 0.5 ? sampleCrossPoint() : sampleGalaxyPoint();
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      sizes[i] = Math.random() * 0.15 + 0.05;
      phases[i] = Math.random() * Math.PI * 2;
      
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("aBasePos", new THREE.BufferAttribute(positions, 3));
    // Dummy position attribute for Three.js bounding box requirements
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // ---------- mouse parallax ----------
    const pointer = { x: 0, y: 0 };
    const targetRotation = { x: 0, y: 0 };

    function handlePointerMove(e: PointerEvent) {
      const rect = mount!.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    }
    mount.addEventListener("pointermove", handlePointerMove);

    function handleResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    // ---------- animation loop ----------
    let rafId = 0;
    const clock = new THREE.Clock();

    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        material.uniforms.uTime.value = t;
        // Super slow organic overall rotation
        points.rotation.y = t * 0.03;
      }

      // Smooth parallax
      targetRotation.x += (pointer.y * 0.15 - targetRotation.x) * 0.05;
      targetRotation.y += (pointer.x * 0.20 - targetRotation.y) * 0.05;
      camera.position.x = targetRotation.y * 1.5;
      camera.position.y = -targetRotation.x * 1.0;
      camera.lookAt(0, 0.6, 0);

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      mount?.removeEventListener("pointermove", handlePointerMove);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      mount?.removeChild(renderer.domElement);
    };
  }, [color, background, density]);

  return (
    <div className={`relative h-full w-full ${className}`} aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-[#02040a] via-[#05070E] to-[#0a0815] z-[-1]" />
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

