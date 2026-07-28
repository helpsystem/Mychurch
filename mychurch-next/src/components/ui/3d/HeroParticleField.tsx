"use client";

/**
 * HeroParticleField
 * -------------------
 * A slow, contemplative field of light — thousands of warm particles that
 * gather loosely into a cross of light and drift like embers or candle
 * smoke. Built with plain three.js (no @react-three/fiber dependency) so
 * it drops into any Next.js app after `npm install three`.
 *
 * Usage (in app/page.tsx or a Hero.tsx section):
 *
 *   import HeroParticleField from "@/components/HeroParticleField";
 *
 *   <section className="relative h-[100svh] overflow-hidden">
 *     <HeroParticleField />
 *     <div className="relative z-10 flex h-full items-center justify-center">
 *       ...your headline / CTA...
 *     </div>
 *   </section>
 *
 * The canvas is absolutely positioned and fills its parent — the parent
 * needs `position: relative` and a defined height.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

type HeroParticleFieldProps = {
  /** Base particle color (warm amber/gold by default). */
  color?: string;
  /** Background color behind the particles. */
  background?: string;
  /** Roughly how many particles to draw on desktop. Halved on small screens. */
  density?: number;
  className?: string;
};

export default function HeroParticleField({
  color = "#F3C989",
  background = "#080D1A",
  density = 3600,
  className = "",
}: HeroParticleFieldProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isSmallScreen = window.innerWidth < 768;
    const particleCount = isSmallScreen ? Math.round(density * 0.45) : density;

    // ---------- scene ----------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);
    scene.fog = new THREE.FogExp2(new THREE.Color(background).getHex(), 0.05);

    const camera = new THREE.PerspectiveCamera(
      50,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // ---------- soft circular sprite for glow ----------
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const ctx = spriteCanvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.55)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const spriteTexture = new THREE.CanvasTexture(spriteCanvas);

    // ---------- particle positions: a cross silhouette + soft haze ----------
    // 60% of particles sample points near a cross shape, 40% drift freely
    // through the volume so the cross feels emergent, not stamped.
    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3); // for gentle drift math
    const speeds = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);

    const crossHalfHeight = 3.4;
    const crossHalfWidth = 1.9;
    const armY = 0.9; // vertical position of the horizontal beam center
    const armHalfHeight = 0.5;

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
      // jitter so it reads as particles gathering toward a form, not a solid shape
      x += (Math.random() - 0.5) * 1.1;
      y += (Math.random() - 0.5) * 1.1;
      const z = (Math.random() - 0.5) * 4;
      return [x, y, z];
    }

    function sampleHazePoint(): [number, number, number] {
      const radius = 6 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 8;
      return [Math.cos(theta) * radius, y, Math.sin(theta) * radius - 2];
    }

    for (let i = 0; i < particleCount; i++) {
      const [x, y, z] =
        Math.random() < 0.6 ? sampleCrossPoint() : sampleHazePoint();
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;
      speeds[i] = 0.15 + Math.random() * 0.35;
      sizes[i] = 0.04 + Math.random() * 0.09;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      map: spriteTexture,
      color: new THREE.Color(color),
      size: 0.14,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // a few brighter "ember" particles for depth
    const emberGeometry = geometry.clone();
    const emberMaterial = material.clone();
    emberMaterial.size = 0.05;
    emberMaterial.opacity = 0.5;
    emberMaterial.color = new THREE.Color("#FFE9C7");
    const embers = new THREE.Points(emberGeometry, emberMaterial);
    scene.add(embers);

    // ---------- mouse parallax ----------
    const pointer = { x: 0, y: 0 };
    const targetRotation = { x: 0, y: 0 };

    function handlePointerMove(e: PointerEvent) {
      const rect = mount!.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    }
    mount.addEventListener("pointermove", handlePointerMove);

    // ---------- resize ----------
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
        const posAttr = geometry.getAttribute(
          "position"
        ) as THREE.BufferAttribute;
        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          const speed = speeds[i];
          // gentle upward drift + sideways sway, like rising light/smoke
          posAttr.array[idx + 1] =
            basePositions[idx + 1] +
            Math.sin(t * speed + i) * 0.18 +
            (t * speed * 0.06) % 3.6;
          posAttr.array[idx] =
            basePositions[idx] + Math.sin(t * speed * 0.5 + i * 2) * 0.12;
        }
        posAttr.needsUpdate = true;

        // slow ambient rotation
        points.rotation.y = t * 0.02;
        embers.rotation.y = t * 0.02;
      }

      // mouse parallax — smoothed toward pointer target
      targetRotation.x += (pointer.y * 0.12 - targetRotation.x) * 0.03;
      targetRotation.y += (pointer.x * 0.15 - targetRotation.y) * 0.03;
      camera.position.x = targetRotation.y * 1.2;
      camera.position.y = -targetRotation.x * 0.8;
      camera.lookAt(0, 0.6, 0);

      renderer.render(scene, camera);
    }
    animate();

    // ---------- cleanup ----------
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      mount?.removeEventListener("pointermove", handlePointerMove);
      geometry.dispose();
      material.dispose();
      emberGeometry.dispose();
      emberMaterial.dispose();
      spriteTexture.dispose();
      renderer.dispose();
      mount?.removeChild(renderer.domElement);
    };
  }, [color, background, density]);

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
