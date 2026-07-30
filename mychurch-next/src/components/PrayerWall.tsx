"use client";

/**
 * PrayerWall — as provided by user, with minor self-contained improvements.
 * Uses raw Three.js (no React Three Fiber). Receives prayers via props.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

export type Prayer = {
  id: string;
  text: string;
  author?: string;
};

type PrayerWallProps = {
  prayers: Prayer[];
  onAddPrayer?: (text: string) => void;
  className?: string;
};

export default function PrayerWall({
  prayers,
  onAddPrayer,
  className = "",
}: PrayerWallProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Prayer | null>(null);
  const [selectedScreenPos, setSelectedScreenPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [draftText, setDraftText] = useState("");
  const [showForm, setShowForm] = useState(false);

  const positions = useMemo(() => {
    return prayers.map(() => ({
      x: (Math.random() - 0.5) * 7,
      y: (Math.random() - 0.5) * 4.2,
      z: (Math.random() - 0.5) * 3,
    }));
  }, [prayers.length]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#05070E");
    scene.fog = new THREE.FogExp2(0x05070e, 0.045);

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // soft sprite for candle-like glow
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const ctx = spriteCanvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,235,200,1)");
    gradient.addColorStop(0.4, "rgba(255,200,140,0.5)");
    gradient.addColorStop(1, "rgba(255,200,140,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const spriteTexture = new THREE.CanvasTexture(spriteCanvas);

    const lightMeshes: THREE.Sprite[] = [];
    const material = new THREE.SpriteMaterial({
      map: spriteTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    prayers.forEach((prayer, i) => {
      const sprite = new THREE.Sprite(material.clone());
      const pos = positions[i];
      sprite.position.set(pos.x, pos.y, pos.z);
      sprite.scale.setScalar(0.5 + Math.random() * 0.25);
      sprite.userData.prayer = prayer;
      sprite.userData.baseY = pos.y;
      sprite.userData.phase = Math.random() * Math.PI * 2;
      scene.add(sprite);
      lightMeshes.push(sprite);
    });

    // cross anchor
    const crossMaterial = new THREE.MeshBasicMaterial({
      color: "#3A4A66",
      transparent: true,
      opacity: 0.5,
    });
    const crossGroup = new THREE.Group();
    crossGroup.add(
      new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), crossMaterial),
      Object.assign(
        new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.12), crossMaterial),
        { position: new THREE.Vector3(0, 0.35, 0) }
      )
    );
    crossGroup.position.set(0, 0, -2.5);
    scene.add(crossGroup);

    const raycaster = new THREE.Raycaster();
    raycaster.params.Sprite = { threshold: 0.3 };
    const pointerNdc = new THREE.Vector2();

    function handleClick(event: MouseEvent) {
      const rect = mount!.getBoundingClientRect();
      pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(lightMeshes);
      if (hits.length > 0) {
        const prayer = hits[0].object.userData.prayer as Prayer;
        setSelected(prayer);
        setSelectedScreenPos({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      } else {
        setSelected(null);
      }
    }
    renderer.domElement.addEventListener("click", handleClick);

    function handleResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    let rafId = 0;
    const clock = new THREE.Clock();
    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      lightMeshes.forEach((sprite) => {
        const phase = sprite.userData.phase as number;
        sprite.position.y =
          sprite.userData.baseY + Math.sin(t * 0.4 + phase) * 0.08;
        const mat = sprite.material as THREE.SpriteMaterial;
        mat.opacity = 0.75 + Math.sin(t * 1.2 + phase) * 0.2;
      });
      crossGroup.rotation.y = Math.sin(t * 0.05) * 0.1;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("click", handleClick);
      spriteTexture.dispose();
      material.dispose();
      lightMeshes.forEach((s) => (s.material as THREE.Material).dispose());
      crossMaterial.dispose();
      renderer.dispose();
      mount?.removeChild(renderer.domElement);
    };
  }, [prayers, positions]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draftText.trim();
    if (!trimmed) return;
    onAddPrayer?.(trimmed);
    setDraftText("");
    setShowForm(false);
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />

      {selected && selectedScreenPos && (
        <div
          dir="rtl"
          className="absolute z-20 max-w-xs -translate-x-1/2 rounded-lg
                     border border-amber-200/20 bg-[#0B1120]/90 p-4
                     text-sm text-white shadow-lg backdrop-blur"
          style={{
            left: selectedScreenPos.x,
            top: Math.max(16, selectedScreenPos.y - 90),
          }}
        >
          <p className="leading-relaxed">{selected.text}</p>
          {selected.author && (
            <p className="mt-2 text-xs text-amber-200/60">
              — {selected.author}
            </p>
          )}
          <button
            onClick={() => setSelected(null)}
            className="mt-3 text-xs text-white/50 hover:text-white/80"
          >
            بستن
          </button>
        </div>
      )}

      <div dir="rtl" className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
        {showForm ? (
          <form
            onSubmit={handleSubmit}
            className="flex w-[min(90vw,420px)] flex-col gap-2 rounded-lg
                       border border-amber-200/20 bg-[#0B1120]/90 p-4
                       backdrop-blur"
          >
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="درخواست دعای خود را بنویسید..."
              rows={3}
              className="resize-none rounded-md border border-white/10
                         bg-white/5 p-2 text-sm text-white placeholder:text-white/40
                         focus:outline-none focus:ring-1 focus:ring-amber-200/50"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md px-3 py-1.5 text-sm text-white/60 hover:text-white"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="rounded-md bg-amber-200/90 px-4 py-1.5 text-sm
                           font-medium text-[#080D1A] hover:bg-amber-200"
              >
                افزودن نور
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full border border-amber-200/30 bg-[#0B1120]/80
                       px-5 py-2.5 text-sm text-amber-100 backdrop-blur
                       hover:bg-[#0B1120]"
          >
            + یک نور دعا اضافه کنید
          </button>
        )}
      </div>
    </div>
  );
}
