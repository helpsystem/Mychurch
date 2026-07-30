"use client";

/**
 * PrayerWall
 * ----------
 * "دیوار نوری دعای تعاملی" — a dark, reverent space where each point of
 * light is a prayer or a word of thanksgiving from the congregation.
 * Clicking a light shows its text; a small form lets a visitor add their
 * own. Data handling (fetching/saving prayers) is left to the parent via
 * props — this component only renders and handles interaction.
 *
 * Usage:
 *   <PrayerWall
 *     prayers={[
 *       { id: "1", text: "برای شفای مادرم دعا کنید.", author: "ناشناس" },
 *       { id: "2", text: "شکرگزارم برای تولد فرزندم.", author: "مریم" },
 *     ]}
 *     onAddPrayer={(text) => saveToBackend(text)}
 *   />
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

  // stable per-prayer 3D positions, recomputed only when the prayer list changes length
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

    // custom shader material for instanced glowing particles
    const vertexShader = `
      attribute float phase;
      attribute float baseY;
      varying float vPhase;
      varying vec2 vUv;
      uniform float time;
      void main() {
        vUv = uv;
        vPhase = phase;
        // Animation
        vec3 pos = position;
        
        // Transform the instance position (from instanceMatrix)
        mat4 instanceMat = instanceMatrix;
        
        // Add waving motion on Y axis based on phase and time
        float yOffset = sin(time * 0.4 + phase) * 0.08;
        instanceMat[3][1] += yOffset; // modify the Y translation

        vec4 mvPosition = modelViewMatrix * instanceMat * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      uniform sampler2D map;
      uniform float time;
      varying vec2 vUv;
      varying float vPhase;
      void main() {
        vec4 texColor = texture2D(map, vUv);
        float pulse = 0.75 + sin(time * 1.2 + vPhase) * 0.2;
        gl_FragColor = vec4(texColor.rgb, texColor.a * pulse);
      }
    `;

    const uniforms = {
      map: { value: spriteTexture },
      time: { value: 0.0 }
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const geometry = new THREE.PlaneGeometry(1, 1);
    const instanceCount = prayers.length;
    
    // Attributes
    const phases = new Float32Array(instanceCount);
    const baseYs = new Float32Array(instanceCount);
    
    const instancedMesh = new THREE.InstancedMesh(geometry, material, instanceCount);
    
    const dummy = new THREE.Object3D();
    prayers.forEach((prayer, i) => {
      const pos = positions[i];
      const scale = 0.5 + Math.random() * 0.25;
      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      
      instancedMesh.setMatrixAt(i, dummy.matrix);
      phases[i] = Math.random() * Math.PI * 2;
      baseYs[i] = pos.y;
    });

    geometry.setAttribute('phase', new THREE.InstancedBufferAttribute(phases, 1));
    geometry.setAttribute('baseY', new THREE.InstancedBufferAttribute(baseYs, 1));
    
    scene.add(instancedMesh);

    // small cross silhouette at the center, faint, as the wall's quiet anchor
    const crossMaterial = new THREE.MeshBasicMaterial({
      color: "#3A4A66",
      transparent: true,
      opacity: 0.5,
    });
    const crossVertical = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), crossMaterial);
    const crossHorizontal = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.12), crossMaterial);
    crossHorizontal.position.set(0, 0.35, 0);
    
    const crossGroup = new THREE.Group();
    crossGroup.add(crossVertical, crossHorizontal);
    crossGroup.position.set(0, 0, -2.5);
    scene.add(crossGroup);

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    function handleClick(event: PointerEvent) {
      const rect = mount!.getBoundingClientRect();
      pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObject(instancedMesh);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const prayer = prayers[hits[0].instanceId];
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
      
      uniforms.time.value = t;
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
      geometry.dispose();
      crossMaterial.dispose();
      crossVertical.geometry.dispose();
      crossHorizontal.geometry.dispose();
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
          className="absolute z-20 max-w-xs -translate-x-1/2 rounded-lg border border-amber-200/20 bg-[#0B1120]/90 p-4 text-sm text-white shadow-lg backdrop-blur"
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
            className="flex w-[min(90vw,420px)] flex-col gap-2 rounded-lg border border-amber-200/20 bg-[#0B1120]/90 p-4 backdrop-blur"
          >
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="درخواست دعای خود را بنویسید..."
              rows={3}
              className="resize-none rounded-md border border-white/10 bg-white/5 p-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-amber-200/50"
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
                className="rounded-md bg-amber-200/90 px-4 py-1.5 text-sm font-medium text-[#080D1A] hover:bg-amber-200"
              >
                افزودن نور
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full border border-amber-200/30 bg-[#0B1120]/80 px-5 py-2.5 text-sm text-amber-100 backdrop-blur hover:bg-[#0B1120]"
          >
            + یک نور دعا اضافه کنید
          </button>
        )}
      </div>
    </div>
  );
}
