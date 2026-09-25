"use client";

/**
 * ScrollCrossReveal
 * ------------------
 * A radiant, glass-like 3D cross that slowly turns as the user scrolls
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
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export type Verse = {
  reference: string;
  text: string;
};

type ScrollCrossRevealProps = {
  verses: Verse[];
  className?: string;
  dir?: "rtl" | "ltr";
};

// A soft radial-gradient sprite used for both the drifting dust motes and the
// halo glowing behind the cross — a plain square PointsMaterial dot reads as
// a lifeless pixel; a soft circular falloff reads as light.
function createGlowSpriteTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,233,199,0.7)");
    gradient.addColorStop(1, "rgba(255,233,199,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function ScrollCrossReveal({
  verses,
  className = "",
  dir = "rtl",
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

    // ---------- scroll-driven progress ----------
    // Wired up before the WebGL setup below so verse fading still works — via plain
    // scroll position — even on a browser without WebGL support, where only the
    // rotating glass cross itself is skipped.
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0.6, 0.2, 6);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (err) {
      // No WebGL support — fail quietly rather than crash the section; the verse text
      // itself still renders and fades on scroll (just without the rotating glass cross
      // behind it), since the fallback background color on the wrapping div covers for
      // the missing canvas.
      console.warn("[ScrollCrossReveal] WebGL unavailable, skipping 3D cross:", err);
      return () => window.removeEventListener("scroll", handleScroll);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x080d1a, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    // an environment map is what makes a transmissive glass material actually
    // catch and bend light — without one it reads as flat grey plastic.
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmremGenerator.dispose();

    // ---------- glass cross ----------
    const crossGroup = new THREE.Group();
    crossGroup.rotation.set(-0.18, -0.35, 0);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: "#F6D9A0",
      emissive: "#FFB86B",
      emissiveIntensity: 0.15,
      transmission: 0.92,
      roughness: 0.04,
      thickness: 0.9,
      ior: 1.5,
      transparent: true,
      opacity: 0.97,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      attenuationColor: new THREE.Color("#E3A85E"),
      attenuationDistance: 1.2,
      envMapIntensity: 1.4,
    });
    const vertical = new THREE.Mesh(
      new RoundedBoxGeometry(0.42, 2.6, 0.42, 4, 0.07),
      glassMaterial
    );
    const horizontal = new THREE.Mesh(
      new RoundedBoxGeometry(1.7, 0.42, 0.42, 4, 0.07),
      glassMaterial
    );
    horizontal.position.y = 0.55;
    crossGroup.add(vertical, horizontal);
    scene.add(crossGroup);

    // a warm light living inside the glass, breathing gently — this is what
    // reads as "soul" rather than a static decorative object
    const innerGlow = new THREE.PointLight("#FFD9A0", 2.4, 5, 2);
    innerGlow.position.set(0, 0.45, 0.35);
    crossGroup.add(innerGlow);

    // soft halo glowing behind the cross, billboarded so it always faces camera
    const glowTexture = createGlowSpriteTexture();
    const haloMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: "#F3C989",
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Sprite(haloMaterial);
    halo.scale.set(4.6, 4.6, 1);
    halo.position.set(0, 0.2, -0.7);
    scene.add(halo);

    // soft particle haze around the cross for atmosphere — warm dust drifting
    // slowly upward through the light, not just static dots
    const hazeCount = 220;
    const hazePositions = new Float32Array(hazeCount * 3);
    const hazeSpeeds = new Float32Array(hazeCount);
    for (let i = 0; i < hazeCount; i++) {
      hazePositions[i * 3] = (Math.random() - 0.5) * 8;
      hazePositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      hazePositions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
      hazeSpeeds[i] = 0.06 + Math.random() * 0.12;
    }
    const hazeGeometry = new THREE.BufferGeometry();
    hazeGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(hazePositions, 3)
    );
    const hazeMaterial = new THREE.PointsMaterial({
      color: "#FFE9C7",
      size: 0.09,
      map: glowTexture,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const haze = new THREE.Points(hazeGeometry, hazeMaterial);
    scene.add(haze);

    // lighting for the glass to catch
    const keyLight = new THREE.DirectionalLight("#FFE9C7", 2.4);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight("#7C93C4", 1.2);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);
    scene.add(new THREE.AmbientLight("#1A2440", 1.1));

    // bloom is what turns the cross's highlights into a genuine glow
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      0.85,
      0.55,
      0.2
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    function handleResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      composer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    let rafId = 0;
    const clock = new THREE.Clock();
    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        crossGroup.rotation.y = -0.35 + scrollProgress * Math.PI * 1.2 + Math.sin(t * 0.15) * 0.05;
        crossGroup.rotation.x = -0.18 + Math.sin(t * 0.1) * 0.04;
        innerGlow.intensity = 2.1 + Math.sin(t * 0.8) * 0.7;
        glassMaterial.emissiveIntensity = 0.12 + Math.sin(t * 0.8) * 0.05;

        const positions = hazeGeometry.attributes.position.array as Float32Array;
        for (let i = 0; i < hazeCount; i++) {
          positions[i * 3 + 1] += hazeSpeeds[i] * 0.01;
          if (positions[i * 3 + 1] > 4.5) positions[i * 3 + 1] = -4.5;
        }
        hazeGeometry.attributes.position.needsUpdate = true;
        haze.rotation.y = t * 0.01;
      } else {
        crossGroup.rotation.y = -0.35 + scrollProgress * Math.PI * 1.2;
      }

      const scale = 0.9 + scrollProgress * 0.25;
      crossGroup.scale.setScalar(scale);
      halo.position.copy(crossGroup.position);
      halo.scale.setScalar(4.6 * (0.85 + scrollProgress * 0.3));

      composer.render();
    }
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      glassMaterial.dispose();
      hazeGeometry.dispose();
      hazeMaterial.dispose();
      haloMaterial.dispose();
      glowTexture.dispose();
      envRT.texture.dispose();
      composer.dispose();
      bloomPass.dispose();
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
          <div className="relative max-w-xl text-center" dir={dir}>
            {verses.map((verse, i) => (
              <div
                key={verse.reference}
                ref={(el) => {
                  verseRefs.current[i] = el;
                }}
                className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 pointer-events-none"
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
