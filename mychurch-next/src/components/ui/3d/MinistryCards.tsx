"use client";

/**
 * MinistryCards
 * -------------
 * Glass cards introducing the church's groups. On hover, a small 3D symbol
 * rises out of the card and turns slowly:
 *   - Children  -> an open book (Scripture)
 *   - Youth     -> a rising flame (the Holy Spirit)
 *   - Worship   -> a cross with a simple musical note beside it
 *
 * Usage:
 *   <MinistryCards
 *     cards={[
 *       { kind: "children", title: "کودکان", description: "آموزش کتاب مقدس برای کودکان", href: "/children" },
 *       { kind: "youth", title: "جوانان", description: "رشد ایمان در نسل جوان", href: "/youth" },
 *       { kind: "worship", title: "پرستش", description: "سرودها و لحظات پرستش", href: "/worship" },
 *     ]}
 *   />
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type MinistryKind = "children" | "youth" | "worship";

export type MinistryCard = {
  kind: MinistryKind;
  title: string;
  description: string;
  href?: string;
};

type MinistryCardsProps = {
  cards: MinistryCard[];
  className?: string;
};

export default function MinistryCards({
  cards,
  className = "",
}: MinistryCardsProps) {
  return (
    <div
      dir="rtl"
      className={`grid grid-cols-1 gap-6 sm:grid-cols-3 ${className}`}
    >
      {cards.map((card) => (
        <MinistryCardItem key={card.kind} card={card} />
      ))}
    </div>
  );
}

function MinistryCardItem({ card }: { card: MinistryCard }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const size = Math.min(mount.clientWidth, mount.clientHeight) || 140;
    renderer.setSize(size, size);
    mount.appendChild(renderer.domElement);

    const material = new THREE.MeshPhysicalMaterial({
      color: "#F3C989",
      metalness: 0.1,
      roughness: 0.25,
      transmission: 0.15,
      clearcoat: 0.6,
    });

    const symbol = new THREE.Group();

    if (card.kind === "children") {
      // open book: two angled planes ("pages")
      const pageGeometry = new THREE.BoxGeometry(1, 1.3, 0.03);
      const left = new THREE.Mesh(pageGeometry, material);
      left.position.x = -0.5;
      left.rotation.y = 0.35;
      const right = new THREE.Mesh(pageGeometry, material);
      right.position.x = 0.5;
      right.rotation.y = -0.35;
      symbol.add(left, right);
    } else if (card.kind === "youth") {
      // rising flame: stacked, tapering spheres
      const flameMaterial = material.clone();
      flameMaterial.color = new THREE.Color("#FFB177");
      const base = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 16, 16),
        flameMaterial
      );
      base.scale.set(1, 1.3, 1);
      const mid = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 16, 16),
        flameMaterial
      );
      mid.position.y = 0.55;
      mid.scale.set(0.9, 1.4, 0.9);
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 16),
        flameMaterial
      );
      tip.position.y = 0.95;
      tip.scale.set(0.7, 1.5, 0.7);
      symbol.add(base, mid, tip);
    } else {
      // worship: small cross + a simple note (sphere + stem) beside it
      const crossVertical = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 1.1, 0.16),
        material
      );
      crossVertical.position.x = -0.35;
      const crossHorizontal = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.16, 0.16),
        material
      );
      crossHorizontal.position.set(-0.35, 0.2, 0);
      const noteHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 16),
        material
      );
      noteHead.position.set(0.35, -0.35, 0);
      const noteStem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.85, 8),
        material
      );
      noteStem.position.set(0.47, 0.05, 0);
      symbol.add(crossVertical, crossHorizontal, noteHead, noteStem);
    }

    scene.add(symbol);

    const key = new THREE.DirectionalLight("#FFE9C7", 2);
    key.position.set(2, 3, 4);
    scene.add(key);
    scene.add(new THREE.AmbientLight("#2A3550", 1.6));

    function handleResize() {
      if (!mount) return;
      const s = Math.min(mount.clientWidth, mount.clientHeight) || 140;
      renderer.setSize(s, s);
    }
    window.addEventListener("resize", handleResize);

    let rafId = 0;
    const clock = new THREE.Clock();
    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const targetScale = hoveredRef.current ? 1 : 0.82;
      symbol.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.08
      );
      symbol.rotation.y = t * 0.6;
      symbol.position.y = hoveredRef.current ? Math.sin(t * 1.5) * 0.05 : 0;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      material.dispose();
      renderer.dispose();
      mount?.removeChild(renderer.domElement);
    };
  }, [card.kind]);

  const content = (
    <div
      onMouseEnter={() => (hoveredRef.current = true)}
      onMouseLeave={() => (hoveredRef.current = false)}
      className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md transition-colors hover:border-amber-200/30 hover:bg-white/[0.08]"
    >
      <div ref={mountRef} className="h-32 w-32" />
      <h3 className="mt-2 text-lg font-semibold text-white">{card.title}</h3>
      <p className="mt-1 text-sm text-white/60">{card.description}</p>
    </div>
  );

  return card.href ? (
    <a href={card.href} className="block">
      {content}
    </a>
  ) : (
    content
  );
}
