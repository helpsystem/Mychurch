"use client";

/**
 * ScrollCrossReveal
 * ------------------
 * A translucent, glass-like 3D cross that slowly turns as the user scrolls
 * through this section, while verses fade in and out in sync — telling the
 * church's story (or the gospel itself) through scripture rather than
 * marketing copy.
 *
 * Usage:
 *   <ScrollCrossReveal
 *     verses={[
 *       { reference: "یوحنا ۳:۱۶", text: "زیرا خدا جهان را آنقدر محبت کرد که پسر یگانه‌ی خود را داد..." },
 *       { reference: "غلاطیان ۲:۲۰", text: "با مسیح مصلوب شده‌ام؛ دیگر من زندگی نمی‌کنم، بلکه مسیح در من زندگی می‌کند." },
 *       { reference: "۱ قرنتیان ۱:۱۸", text: "پیام صلیب برای هلاک‌شوندگان جهالت است، اما برای ما که نجات می‌یابیم، قدرت خداست." },
 *     ]}
 *   />
 *
 * The section's height is driven by the number of verses (each verse gets
 * one viewport-height of scroll), so make sure the parent doesn't clip it.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type Verse = {
  reference: string;
  text: string;
};

type ScrollCrossRevealProps = {
  verses: Verse[];
  className?: string;
};

export default function ScrollCrossReveal({
  verses,
  className = "",
}: ScrollCrossRevealProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const verseRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const mount = canvasMountRef.current;
    const section = sectionRef.current;
    if (!mount || !section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // ---------- glass cross ----------
    const crossGroup = new THREE.Group();
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: "#F3C989",
      transmission: 0.9,
      roughness: 0.08,
      thickness: 0.6,
      ior: 1.4,
      transparent: true,
      opacity: 0.95,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    });
    const vertical = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 2.6, 0.42),
      glassMaterial
    );
    const horizontal = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.42, 0.42),
      glassMaterial
    );
    horizontal.position.y = 0.55;
    crossGroup.add(vertical, horizontal);
    scene.add(crossGroup);

    // soft particle haze around the cross for atmosphere
    const hazeCount = 260;
    const hazePositions = new Float32Array(hazeCount * 3);
    for (let i = 0; i < hazeCount; i++) {
      hazePositions[i * 3] = (Math.random() - 0.5) * 8;
      hazePositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      hazePositions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    }
    const hazeGeometry = new THREE.BufferGeometry();
    hazeGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(hazePositions, 3)
    );
    const hazeMaterial = new THREE.PointsMaterial({
      color: "#FFE9C7",
      size: 0.035,
      transparent: true,
      opacity: 0.35,
    });
    const haze = new THREE.Points(hazeGeometry, hazeMaterial);
    scene.add(haze);

    // lighting for the glass to catch
    const key = new THREE.DirectionalLight("#FFE9C7", 2);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight("#7C93C4", 1);
    rim.position.set(-4, -2, -3);
    scene.add(rim);
    scene.add(new THREE.AmbientLight("#1A2440", 1.4));

    function handleResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    // ---------- scroll-driven progress ----------
    let scrollProgress = 0; // 0 -> 1 across the whole section
    function handleScroll() {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) {
        scrollProgress = 0;
        return;
      }
      const raw = -rect.top / total;
      scrollProgress = Math.min(1, Math.max(0, raw));

      // fade verses based on which segment we're in
      const segment = 1 / verses.length;
      verseRefs.current.forEach((el, i) => {
        if (!el) return;
        const segStart = i * segment;
        const segEnd = segStart + segment;
        const center = (segStart + segEnd) / 2;
        const dist = Math.abs(scrollProgress - center) / (segment * 0.6);
        const opacity = Math.max(0, 1 - dist);
        el.style.opacity = String(opacity);
        el.style.transform = `translateY(${(1 - opacity) * 12}px)`;
      });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    let rafId = 0;
    const clock = new THREE.Clock();
    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        crossGroup.rotation.y = scrollProgress * Math.PI * 1.4 + Math.sin(t * 0.15) * 0.05;
        crossGroup.rotation.x = Math.sin(t * 0.1) * 0.04;
        haze.rotation.y = t * 0.01;
      } else {
        crossGroup.rotation.y = scrollProgress * Math.PI * 1.4;
      }

      const scale = 0.9 + scrollProgress * 0.25;
      crossGroup.scale.setScalar(scale);

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      glassMaterial.dispose();
      hazeGeometry.dispose();
      hazeMaterial.dispose();
      renderer.dispose();
      mount?.removeChild(renderer.domElement);
    };
  }, [verses]);

  return (
    <div
      ref={sectionRef}
      className={`relative ${className}`}
      style={{ height: `${verses.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#080D1A]">
        <div ref={canvasMountRef} className="absolute inset-0 h-full w-full" />
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <div className="relative max-w-xl text-center" dir="rtl">
            {verses.map((verse, i) => (
              <div
                key={verse.reference}
                ref={(el) => {
                  verseRefs.current[i] = el;
                }}
                className="absolute inset-0 flex flex-col items-center justify-center
                           transition-opacity duration-300 pointer-events-none"
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                <p className="text-xl leading-relaxed text-white sm:text-2xl drop-shadow-md">
                  {verse.text}
                </p>
                <p className="mt-4 text-sm tracking-wide text-amber-200/70 drop-shadow-md">
                  {verse.reference}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
