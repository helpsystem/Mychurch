// @ts-nocheck
"use client";

import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles, Html } from "@react-three/drei";
import * as THREE from "three";
import { Heart, Sparkle, X, BookOpen, Send } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

const localDict = {
  fa: {
    badge: "ارتباط معنوی آنلاین",
    heading: "دیوار نوری دعا",
    subheading: "«شما نور جهان هستید» — روی هر نقطه نوری کلیک کنید تا با دعای ایمانداران همراه شوید.",
    addPrayerButton: "ثبت درخواست دعای جدید",
    prayerFromPrefix: "درخواست دعا از طرف",
    relatedVersePrefix: "آیه مرتبط:",
    amenCountSuffix: "نفر همراه با این دعا آمین گفتند",
    amenButton: "آمین / همدعا هستم",
    modalTitle: "ثبت درخواست دعا",
    textareaPlaceholder: "متن درخواست دعای خود را بنویسید...",
    submitButton: "تاباندن نور دعا در بوم",
    newPrayerName: "ایماندار",
    newPrayerLocation: "عضو آنلاین",
    newPrayerVerse: "متّی ۵:۱۴",
  },
  en: {
    badge: "Online Spiritual Connection",
    heading: "The Prayer Wall of Light",
    subheading: "\"You are the light of the world\" — click any point of light to join in prayer with fellow believers.",
    addPrayerButton: "Submit a New Prayer Request",
    prayerFromPrefix: "Prayer request from",
    relatedVersePrefix: "Related verse:",
    amenCountSuffix: "people have said amen to this prayer",
    amenButton: "Amen / Praying with you",
    modalTitle: "Submit a Prayer Request",
    textareaPlaceholder: "Write your prayer request here...",
    submitButton: "Light this prayer on the canvas",
    newPrayerName: "Believer",
    newPrayerLocation: "Online member",
    newPrayerVerse: "Matthew 5:14",
  },
  es: {
    badge: "Conexión Espiritual en Línea",
    heading: "El Muro de Oración de Luz",
    subheading: "\"Vosotros sois la luz del mundo\" — haz clic en cualquier punto de luz para unirte en oración con otros creyentes.",
    addPrayerButton: "Enviar una Nueva Petición de Oración",
    prayerFromPrefix: "Petición de oración de",
    relatedVersePrefix: "Versículo relacionado:",
    amenCountSuffix: "personas dijeron amén a esta oración",
    amenButton: "Amén / Oro contigo",
    modalTitle: "Enviar una Petición de Oración",
    textareaPlaceholder: "Escribe tu petición de oración aquí...",
    submitButton: "Encender esta oración en el lienzo",
    newPrayerName: "Creyente",
    newPrayerLocation: "Miembro en línea",
    newPrayerVerse: "Mateo 5:14",
  },
};

// نمونه داده‌های درخواست دعا
interface Prayer {
  id: number;
  name: string;
  location: string;
  text: string;
  verse: string;
  count: number;
  position: [number, number, number];
}

const INITIAL_PRAYERS_BY_LANG: Record<"en" | "fa" | "es", Prayer[]> = {
  fa: [
    { id: 1, name: "سارا", location: "واشنگتن دی‌سی", text: "دعا برای سلامتی بیماران و هدایت روح‌القدس در خانواده‌ها.", verse: "یوشع ۱:۹", count: 14, position: [-2.5, 1.2, 1] },
    { id: 2, name: "مهراد", location: "سیلور اسپرینگ", text: "شکرگزاری برای فیض عیسی مسیح و برکت جلسات خانگی.", verse: "یوحنا ۸:۱۲", count: 28, position: [2, -1, 0.5] },
    { id: 3, name: "مریم", location: "مریلند", text: "دعا برای آرامش، ایمنی و حکمت خادمین کلیسا.", verse: "فیلیپیان ۴:۷", count: 19, position: [0.5, 2.2, -1.5] },
    { id: 4, name: "دانیال", location: "ویرجینیا", text: "دعا برای هدایت جوانان و اشتیاق بیشتر برای کلام خدا.", verse: "مزامیر ۱۱۹:۱۰۵", count: 11, position: [-1.8, -2, -0.8] },
    { id: 5, name: "هلن", location: "کالیفرنیا", text: "شکرگزاری برای رهایی و آرامشی که تنها در نام عیسی مسیح یافت می‌شود.", verse: "متّی ۱۱:۲۸", count: 35, position: [2.8, 1.8, -2] },
  ],
  en: [
    { id: 1, name: "Sara", location: "Washington D.C.", text: "Praying for healing for the sick and for the Holy Spirit's guidance in families.", verse: "Joshua 1:9", count: 14, position: [-2.5, 1.2, 1] },
    { id: 2, name: "Mehrad", location: "Silver Spring", text: "Giving thanks for the grace of Jesus Christ and the blessing of the home gatherings.", verse: "John 8:12", count: 28, position: [2, -1, 0.5] },
    { id: 3, name: "Maryam", location: "Maryland", text: "Praying for peace, safety, and wisdom for the church's servants.", verse: "Philippians 4:7", count: 19, position: [0.5, 2.2, -1.5] },
    { id: 4, name: "Daniel", location: "Virginia", text: "Praying for guidance for the youth and a greater hunger for the Word of God.", verse: "Psalm 119:105", count: 11, position: [-1.8, -2, -0.8] },
    { id: 5, name: "Helen", location: "California", text: "Giving thanks for the deliverance and peace found only in the name of Jesus Christ.", verse: "Matthew 11:28", count: 35, position: [2.8, 1.8, -2] },
  ],
  es: [
    { id: 1, name: "Sara", location: "Washington D.C.", text: "Oración por la sanidad de los enfermos y la guía del Espíritu Santo en las familias.", verse: "Josué 1:9", count: 14, position: [-2.5, 1.2, 1] },
    { id: 2, name: "Mehrad", location: "Silver Spring", text: "Acción de gracias por la gracia de Jesucristo y la bendición de las reuniones en casas.", verse: "Juan 8:12", count: 28, position: [2, -1, 0.5] },
    { id: 3, name: "Maryam", location: "Maryland", text: "Oración por paz, seguridad y sabiduría para los siervos de la iglesia.", verse: "Filipenses 4:7", count: 19, position: [0.5, 2.2, -1.5] },
    { id: 4, name: "Daniel", location: "Virginia", text: "Oración por guía para los jóvenes y mayor hambre por la Palabra de Dios.", verse: "Salmo 119:105", count: 11, position: [-1.8, -2, -0.8] },
    { id: 5, name: "Helen", location: "California", text: "Acción de gracias por la liberación y la paz que solo se encuentran en el nombre de Jesucristo.", verse: "Mateo 11:28", count: 35, position: [2.8, 1.8, -2] },
  ],
};

// کامپوننت ذرات ۳D
function PrayerNodes({ prayers, onSelect }: { prayers: Prayer[]; onSelect: (p: Prayer) => void }) {
  const groupRef = useRef<THREE.Group>(null);

  // چرخش بسیار خرامان و معنوی کل منظومه ذرات
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      {prayers.map((prayer) => (
        <group key={prayer.id} position={prayer.position}>
          {/* ذره نوری قابل کلیک */}
          <mesh onClick={() => onSelect(prayer)} className="cursor-pointer">
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshBasicMaterial color="#FBBF24" />
          </mesh>
          {/* درخشش هاله دور ذره */}
          <Sparkles count={10} scale={1.5} size={2.5} speed={0.3} color="#FDE047" />
        </group>
      ))}
    </group>
  );
}

export default function PrayerWall() {
  const { language, isRTL } = useLanguage();
  const d = localDict[language] || localDict.fa;
  const [prayers, setPrayers] = useState<Prayer[]>(
    INITIAL_PRAYERS_BY_LANG[language] || INITIAL_PRAYERS_BY_LANG.fa
  );
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [newPrayerText, setNewPrayerText] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // افزایش تعداد آمین‌ها
  const handleAmen = (id: number) => {
    setPrayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, count: p.count + 1 } : p))
    );
    if (selectedPrayer && selectedPrayer.id === id) {
      setSelectedPrayer((prev) => (prev ? { ...prev, count: prev.count + 1 } : null));
    }
  };

  // ثبت دعای جدید در بوم ۳D
  const handleAddPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayerText.trim()) return;

    const newEntry: Prayer = {
      id: Date.now(),
      name: d.newPrayerName,
      location: d.newPrayerLocation,
      text: newPrayerText,
      verse: d.newPrayerVerse,
      count: 1,
      position: [
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 3,
      ],
    };

    setPrayers((prev) => [...prev, newEntry]);
    setNewPrayerText("");
    setShowAddForm(false);
  };

  return (
    <section id="prayer-wall" className="relative w-full h-screen bg-bgDark py-20 px-6 overflow-hidden flex flex-col justify-between" dir={isRTL ? "rtl" : "ltr"}>

      {/* عنوان فوقانی */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-accentGold text-sm mb-3">
          <Sparkle size={16} />
          <span>{d.badge}</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">
          {d.heading}
        </h2>
        <p className="text-slate-400 text-sm md:text-base">
          {d.subheading}
        </p>
      </div>

      {/* بوم سه‌بعدی Three.js */}
      <div className="absolute inset-0 z-0">
        {/* پس‌زمینه کهکشان ذرات طلایی */}
        <img
          src="/prayer-bg.webp"
          alt="Galaxy Background"
          className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
        />
        <div className="absolute inset-0 bg-bgDark/40 pointer-events-none" />
        
        <Canvas camera={{ position: [0, 0, 7], fov: 60 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[0, 0, 0]} intensity={2.5} color="#FBBF24" />

          {/* منبع نور مرکزی (رمز نور مسیح) */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshBasicMaterial color="#FFFBEB" />
          </mesh>
          <Sparkles count={80} scale={4} size={3} speed={0.2} color="#FBBF24" />

          {/* ذرات دعا */}
          <PrayerNodes prayers={prayers} onSelect={setSelectedPrayer} />

          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      {/* دکمه افزودن درخواست دعا */}
      <div className="relative z-10 text-center mb-6">
        <button
          onClick={() => setShowAddForm(true)}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-accentGold to-amber-600 text-bgDark font-bold text-sm shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:scale-105 transition-transform inline-flex items-center gap-2"
        >
          <Send size={16} />
          {d.addPrayerButton}
        </button>
      </div>

      {/* مودال نمایش جزئیات دعا */}
      {selectedPrayer && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-slate-900/90 backdrop-blur-xl border border-accentGold/30 rounded-2xl p-6 text-white z-50 shadow-2xl shadow-black">
          <button
            onClick={() => setSelectedPrayer(null)}
            className="absolute top-4 left-4 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 text-accentGold mb-2 font-bold text-sm">
            <Sparkle size={16} />
            <span>{d.prayerFromPrefix} {selectedPrayer.name}</span>
            <span className="text-slate-500 text-xs">({selectedPrayer.location})</span>
          </div>

          <p className="text-slate-200 text-sm md:text-base leading-relaxed mb-4">
            {selectedPrayer.text}
          </p>

          <div className="flex items-center gap-2 text-cyan-400 text-xs mb-6">
            <BookOpen size={14} />
            <span>{d.relatedVersePrefix} {selectedPrayer.verse}</span>
          </div>

          <div className="flex justify-between items-center border-t border-slate-800 pt-4">
            <span className="text-xs text-slate-400">
              {selectedPrayer.count} {d.amenCountSuffix}
            </span>
            <button
              onClick={() => handleAmen(selectedPrayer.id)}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Heart size={14} fill="#fff" />
              {d.amenButton}
            </button>
          </div>
        </div>
      )}

      {/* فرم ثبت دعای جدید */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md relative text-right">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">{d.modalTitle}</h3>
            <form onSubmit={handleAddPrayer} className="flex flex-col gap-4">
              <textarea
                value={newPrayerText}
                onChange={(e) => setNewPrayerText(e.target.value)}
                placeholder={d.textareaPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accentGold h-28 resize-none"
              />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-accentGold to-amber-600 text-bgDark font-bold rounded-xl text-sm"
              >
                {d.submitButton}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
