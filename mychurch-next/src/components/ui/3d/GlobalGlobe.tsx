"use client";

import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles, Html } from "@react-three/drei";
import * as THREE from "three";
import { Globe, Users, Home, MapPin, X } from "lucide-react";

// داده‌های نمونه گروه‌های خانگی و اعضا در نقاط جهان
interface LocationMarker {
  id: number;
  city: string;
  country: string;
  members: number;
  groups: number;
  position: [number, number, number];
}

const GLOBE_LOCATIONS: LocationMarker[] = [
  { id: 1, city: "سیلور اسپرینگ (واشنگتن دی‌سی)", country: "آمریکا (مرکز کلیسا)", members: 3200, groups: 25, position: [0.7, 1.8, 1.6] },
  { id: 2, city: "لندن", country: "انگلستان", members: 1100, groups: 12, position: [0.1, 2.3, 0.9] },
  { id: 3, city: "فرانکفورت", country: "آلمان", members: 1400, groups: 15, position: [0.4, 2.1, 0.7] },
  { id: 4, city: "تورنتو", country: "کانادا", members: 1800, groups: 18, position: [0.4, 1.9, 1.7] },
  { id: 5, city: "سیدنی", country: "استرالیا", members: 850, groups: 8, position: [-1.8, -1.5, -1.2] },
];

function InteractiveGlobeMesh({ onSelectMarker }: { onSelectMarker: (loc: LocationMarker) => void }) {
  const globeGroupRef = useRef<THREE.Group>(null);

  // چرخش خرامان کره زمین
  useFrame((_, delta) => {
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={globeGroupRef}>
      {/* کره اصلی شیشه‌ای / تیره */}
      <mesh>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshStandardMaterial
          color="#0f172a"
          wireframe
          transparent
          opacity={0.3}
          emissive="#06b6d4"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* هسته درخشان داخل کره */}
      <mesh>
        <sphereGeometry args={[2.3, 32, 32]} />
        <meshBasicMaterial color="#020617" />
      </mesh>

      {/* نقاط درخشان گروه‌های خانگی روی سطح کره */}
      {GLOBE_LOCATIONS.map((loc) => (
        <group key={loc.id} position={loc.position}>
          <mesh onClick={() => onSelectMarker(loc)} className="cursor-pointer">
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#06B6D4" />
          </mesh>
          <Sparkles count={6} scale={0.8} size={2} speed={0.4} color="#FBBF24" />
        </group>
      ))}
    </group>
  );
}

export default function GlobalGlobe() {
  const [selectedLoc, setSelectedLoc] = useState<LocationMarker | null>(null);

  return (
    <section id="globe" className="relative w-full h-[90vh] bg-bgDark py-16 px-6 overflow-hidden flex flex-col justify-between border-y border-white/5" dir="rtl">
      
      {/* هدر فوقانی */}
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-accentCyan text-sm mb-3">
          <Globe size={16} />
          <span>شبکه بین‌المللی کلیسا</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">
          پراکنده در سراسر زمین، متحد در یک بدن
        </h2>
        <p className="text-slate-400 text-sm md:text-base">
          اتصال بیش از ۱۲,۴۰۰ عضو فعال و ۱۵۰ گروه کوچک خانگی در ۳۴ کشور جهان
        </p>
      </div>

      {/* بوم سه‌بعدی Three.js */}
      <div className="absolute inset-0 z-0">
        {/* پس‌زمینه تصویر کره زمین */}
        <img
          src="/globe-bg.webp"
          alt="Globe Background"
          className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none"
        />
        <div className="absolute inset-0 bg-bgDark/60 pointer-events-none" />

        <Canvas camera={{ position: [0, 0, 6.5], fov: 60 }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[5, 5, 5]} intensity={1.5} color="#06B6D4" />
          <pointLight position={[-5, -5, -5]} intensity={1} color="#FBBF24" />

          <InteractiveGlobeMesh onSelectMarker={setSelectedLoc} />

          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.3} />
        </Canvas>
      </div>

      {/* آمار کلیدی پایینی */}
      <div className="relative z-10 max-w-4xl mx-auto w-full grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-4 rounded-xl text-center">
          <p className="text-accentGold text-2xl md:text-3xl font-bold">۱۲,۴۰۰+</p>
          <p className="text-slate-400 text-xs md:text-sm">عضو فعال بین‌المللی</p>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-4 rounded-xl text-center">
          <p className="text-accentCyan text-2xl md:text-3xl font-bold">۳۴</p>
          <p className="text-slate-400 text-xs md:text-sm">کشور تحت پوشش</p>
        </div>
        <div className="col-span-2 md:col-span-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-4 rounded-xl text-center">
          <p className="text-amber-400 text-2xl md:text-3xl font-bold">۱۵۰+</p>
          <p className="text-slate-400 text-xs md:text-sm">گروه کوچک خانگی</p>
        </div>
      </div>

      {/* کارت شیشه‌ای مشخصات مرکز انتخابی */}
      {selectedLoc && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900/90 backdrop-blur-xl border border-accentCyan/40 rounded-2xl p-5 text-white z-50 shadow-2xl">
          <button
            onClick={() => setSelectedLoc(null)}
            className="absolute top-4 left-4 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 text-accentCyan mb-2 font-bold">
            <MapPin size={18} />
            <span>{selectedLoc.city}</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">{selectedLoc.country}</p>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <Users size={14} className="text-accentGold" />
              <span>{selectedLoc.members} عضو</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <Home size={14} className="text-accentCyan" />
              <span>{selectedLoc.groups} گروه خانگی</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
