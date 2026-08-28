"use client";

import "@/lib/react-polyfill";
import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Send, Sparkles, CheckCircle2 } from "lucide-react";

const floatingPrayers = [
  { text: "خداوندا شکرگزارم", color: "#F5A623", x: "10%", y: "20%", delay: 0 },
  { text: "برای سلامتی خانواده‌ام", color: "#60A5FA", x: "75%", y: "15%", delay: 0.8 },
  { text: "هدایت در تصمیم‌گیری", color: "#A78BFA", x: "20%", y: "70%", delay: 1.6 },
  { text: "قدرت در ضعف", color: "#34D399", x: "70%", y: "65%", delay: 2.4 },
  { text: "آرامش دل", color: "#F472B6", x: "45%", y: "80%", delay: 0.4 },
  { text: "ایمان محکم", color: "#FB923C", x: "85%", y: "45%", delay: 1.2 },
];

export default function PrayerSection() {
  const [prayer, setPrayer] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayer.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prayer.trim(), source: "homepage" }),
      });
      if (!res.ok) throw new Error("server_error");
      setSent(true);
      setPrayer("");
      setTimeout(() => setSent(false), 4000);
    } catch {
      setError("خطا در ارسال. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative py-32 px-6 overflow-hidden bg-[#050A0F]" dir="rtl">
      {/* Ambient Cinematic Background Video */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover opacity-20 mix-blend-screen"
        >
          <source src="https://cdn.pixabay.com/video/2022/11/14/138964-770800145_large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050A0F] via-transparent to-[#050A0F]" />
      </div>

      {/* Floating prayer pills */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {floatingPrayers.map((p, i) => (
          <motion.div
            key={i}
            className="absolute text-xs font-medium px-3 py-1.5 rounded-full border backdrop-blur-sm whitespace-nowrap hidden md:block"
            style={{
              left: p.x,
              top: p.y,
              color: p.color,
              borderColor: p.color + "40",
              background: p.color + "10",
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 0.7, 0.7, 0],
              scale: [0.8, 1, 1, 0.8],
              y: [0, -20, -20, 0],
            }}
            transition={{
              delay: p.delay,
              duration: 6,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            {p.text}
          </motion.div>
        ))}
      </div>

      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_60%,rgba(245,166,35,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 text-sm mb-6">
            <Sparkles size={13} />
            دیوار نوری دعا
          </div>
          <h2
            className="text-5xl md:text-6xl font-black text-white mb-5 leading-tight"
            style={{ fontFamily: "var(--font-homa, serif)" }}
          >
            دعای شما
            <br />
            <span className="text-amber-300">شنیده می‌شود</span>
          </h2>
          <p className="text-slate-400 text-lg mb-12 leading-relaxed">
            درخواست دعای خود را با جامعه کلیسای ایرانیان در میان بگذارید
          </p>
        </motion.div>

        {/* Prayer submit form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="relative"
        >
          <div
            className="rounded-3xl border border-white/10 bg-white/3 backdrop-blur-xl p-8"
            style={{
              boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-8 flex flex-col items-center gap-4"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <CheckCircle2 className="text-emerald-400" size={40} />
                  </div>
                  <p className="text-emerald-300 text-xl font-bold">دعای شما ارسال شد!</p>
                  <p className="text-slate-400 text-sm">جامعه کلیسا برای شما دعا می‌کند</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="relative">
                    <Heart
                      size={18}
                      className="absolute right-4 top-4 text-amber-400/60 pointer-events-none"
                    />
                    <label htmlFor="prayer-input" className="sr-only">
                      درخواست دعای خود را بنویسید
                    </label>
                    <textarea
                      id="prayer-input"
                      aria-label="درخواست دعا"
                      aria-required="true"
                      value={prayer}
                      onChange={(e) => setPrayer(e.target.value)}
                      placeholder="درخواست دعای خود را اینجا بنویسید..."
                      rows={4}
                      disabled={loading}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 pr-12 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all text-sm leading-relaxed disabled:opacity-60"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="text-red-400 text-xs text-center py-1">{error}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading || !prayer.trim()}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-black transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                      style={{
                        background: "linear-gradient(135deg, #F5A623, #FFCD70)",
                        boxShadow: "0 0 30px rgba(245,166,35,0.4)",
                      }}
                    >
                      <Send size={16} />
                      ارسال درخواست دعا
                    </button>
                    <Link
                      href="/prayers"
                      className="px-6 py-3.5 rounded-2xl border border-white/10 text-slate-300 font-medium hover:border-white/20 hover:bg-white/5 transition-all text-sm flex items-center"
                    >
                      مشاهده همه
                    </Link>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
