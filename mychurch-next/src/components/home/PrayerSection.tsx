"use client";

import "@/lib/react-polyfill";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Send, CheckCircle, Sparkles, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/providers/LanguageProvider";

const localDict = {
  en: {
    badge: "Prayer Wall",
    heading: "Your Prayer Is Heard",
    subheading: "Submit your prayer request so ministers, pastors, and brothers and sisters can intercede for you before the Lord.",
    topicsLabel: "Popular topics this week:",
    topics: [
      "Thankful to the Lord",
      "Health of family and the sick",
      "Divine guidance and wisdom",
      "Peace of heart and relief from worry",
      "Employment and immigration matters",
    ],
    nameLabel: "Your Name (optional or anonymous)",
    namePlaceholder: "e.g. Mary, Brother in Christ, or Anonymous...",
    contentLabel: "Your Prayer Request",
    contentPlaceholder: "Write your need, concern, illness, family peace, or thanksgiving...",
    privateLabel: "Private prayer (shown only to pastors and the church prayer team)",
    submitting: "Submitting prayer...",
    submit: "Send Prayer Request",
    successMessage: "Your prayer request has been submitted successfully. Church ministers will intercede for you. May the Lord keep you.",
    errorEmpty: "Please enter the text of your prayer request.",
    successToast: "Your prayer request has been submitted successfully. We stand with you in prayer.",
    errorToast: "Error submitting prayer. Please try again.",
    defaultTitle: "Believer",
    defaultName: "Anonymous",
  },
  fa: {
    badge: "دیوار نوری دعا",
    heading: "دعای شما شنیده می‌شود",
    subheading: "درخواست دعای خود را ثبت کنید تا خادمین، شبانان و برادران و خواهران در حضور خداوند برای شما شفاعت کنند.",
    topicsLabel: "موضوعات پردعا در این هفته:",
    topics: [
      "خداوندا شکرگزارم",
      "سلامتی خانواده و بیماران",
      "هدایت و حکمت الهی",
      "آرامش دل و رفع نگرانی",
      "شغل و امور اقامت",
    ],
    nameLabel: "نام شما (اختیاری یا ناشناس)",
    namePlaceholder: "مثال: مریم، برادر ایماندار، یا ناشناس...",
    contentLabel: "درخواست دعای شما",
    contentPlaceholder: "نیاز، دغدغه، بیماری، آرامش خانواده یا شکرگزاری خود را بنویسید...",
    privateLabel: "دعای محرمانه (فقط برای شبانان و تیم دعای کلیسا نمایش داده شود)",
    submitting: "در حال ثبت دعا...",
    submit: "ارسال درخواست دعا",
    successMessage: "درخواست دعای شما با موفقیت ثبت گردید. خادمین کلیسا برای شما شفاعت خواهند کرد. خداوند نگهدارتان باشد.",
    errorEmpty: "لطفاً متن درخواست دعای خود را وارد نمایید.",
    successToast: "درخواست دعای شما با موفقیت ثبت گردید. در دعا با شما ایستاده‌ایم.",
    errorToast: "خطا در ارسال دعا. لطفاً مجدداً تلاش کنید.",
    defaultTitle: "ایماندار",
    defaultName: "ناشناس",
  },
  es: {
    badge: "Muro de Oración",
    heading: "Tu Oración Es Escuchada",
    subheading: "Envía tu petición de oración para que ministros, pastores y hermanos puedan interceder por ti ante el Señor.",
    topicsLabel: "Temas populares esta semana:",
    topics: [
      "Agradecido con el Señor",
      "Salud de la familia y los enfermos",
      "Guía y sabiduría divina",
      "Paz en el corazón y alivio de la ansiedad",
      "Trabajo y asuntos de inmigración",
    ],
    nameLabel: "Tu Nombre (opcional o anónimo)",
    namePlaceholder: "ej. María, Hermano en la fe, o Anónimo...",
    contentLabel: "Tu Petición de Oración",
    contentPlaceholder: "Escribe tu necesidad, preocupación, enfermedad, paz familiar o acción de gracias...",
    privateLabel: "Oración privada (visible solo para los pastores y el equipo de oración de la iglesia)",
    submitting: "Enviando oración...",
    submit: "Enviar Petición de Oración",
    successMessage: "Tu petición de oración se envió con éxito. Los ministros de la iglesia intercederán por ti. Que el Señor te guarde.",
    errorEmpty: "Por favor ingresa el texto de tu petición de oración.",
    successToast: "Tu petición de oración se envió con éxito. Estamos contigo en oración.",
    errorToast: "Error al enviar la oración. Por favor intenta de nuevo.",
    defaultTitle: "Creyente",
    defaultName: "Anónimo",
  },
};

export default function PrayerSection() {
  const { language, isRTL } = useLanguage();
  const d = localDict[language] || localDict.fa;

  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleTopicClick = (topic: string) => {
    setContent(prev => prev ? `${prev} - ${topic}` : topic);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error(d.errorEmpty);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: name.trim() || d.defaultTitle,
          userName: name.trim() || d.defaultName,
          text: content.trim(),
          content: content.trim(),
          isPrivate: isPrivate,
          is_private: isPrivate,
          source: "homepage_stitch"
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit prayer");
      }

      setIsSuccess(true);
      setContent("");
      setName("");
      toast.success(d.successToast);
      setTimeout(() => setIsSuccess(false), 7000);
    } catch (err) {
      console.error("Prayer submit error:", err);
      toast.error(d.errorToast);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full py-16 px-4 max-w-[1240px] mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      <div className={`rounded-3xl bg-[#171b26] p-6 sm:p-10 border border-white/8 shadow-2xl relative overflow-hidden ${isRTL ? "text-right" : "text-left"}`}>

        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1c1f2a] text-amber-400 text-[12px] font-semibold mb-3 border border-amber-500/20">
            <Heart className="w-3.5 h-3.5 fill-amber-400" />
            <span>{d.badge}</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2">
            {d.heading}
          </h2>

          <p className="text-[14px] text-gray-300 leading-relaxed mb-6">
            {d.subheading}
          </p>

          {/* Quick Topic Chips */}
          <span className="text-[13px] text-gray-200 font-bold block mb-2.5">
            {d.topicsLabel}
          </span>
          <div className="flex flex-wrap gap-2 mb-6">
            {d.topics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => handleTopicClick(topic)}
                className="px-3.5 py-1.5 rounded-full bg-[#1c1f2a] hover:bg-[#262a35] border border-white/10 text-gray-300 hover:text-amber-300 text-[12px] transition-all"
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Prayer Form */}
          <div className="p-5 sm:p-7 rounded-2xl bg-[#0a0e18]/80 backdrop-blur-md border border-white/8 shadow-inner">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              <div>
                <label htmlFor="prayerName" className="text-[13px] text-gray-200 block mb-1.5 font-semibold">
                  {d.nameLabel}
                </label>
                <input
                  id="prayerName"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={d.namePlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-[#171b26] text-white text-[14px] focus:outline-none focus:ring-1 focus:ring-amber-400 border border-white/10 placeholder-gray-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="prayerContent" className="text-[13px] text-gray-200 block mb-1.5 font-semibold">
                  {d.contentLabel}
                </label>
                <textarea
                  id="prayerContent"
                  rows={4}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={d.contentPlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-[#171b26] text-white text-[14px] focus:outline-none focus:ring-1 focus:ring-amber-400 border border-white/10 placeholder-gray-500 resize-none transition-all"
                />
              </div>

              {/* Private Checkbox */}
              <div className="flex items-center gap-2.5 py-1">
                <input
                  id="isPrivate"
                  type="checkbox"
                  checked={isPrivate}
                  onChange={e => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#171b26] accent-amber-500 border-white/20 cursor-pointer"
                />
                <label htmlFor="isPrivate" className="text-[12px] sm:text-[13px] text-gray-300 cursor-pointer select-none flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400/80" />
                  <span>{d.privateLabel}</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-bold text-[15px] shadow-[0_6px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_8px_24px_rgba(245,158,11,0.45)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? d.submitting : d.submit}</span>
              </button>

            </form>

            {/* Confirmation Feedback */}
            <AnimatePresence>
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[13px] flex items-center gap-2.5"
                >
                  <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>{d.successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>
    </section>
  );
}
