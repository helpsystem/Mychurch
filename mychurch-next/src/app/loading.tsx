export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background">
      {/* ── Animated Cross ── */}
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>

        {/* Outer rotating halo ring */}
        <svg className="absolute inset-0 animate-spin-slow" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="54"
            stroke="url(#halo)"
            strokeWidth="2"
            strokeDasharray="60 280"
            strokeLinecap="round" />
          <defs>
            <linearGradient id="halo" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366f1" />
              <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Second counter-rotating halo */}
        <svg className="absolute inset-0 animate-spin-reverse" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="54"
            stroke="url(#halo2)"
            strokeWidth="1.5"
            strokeDasharray="30 310"
            strokeLinecap="round" />
          <defs>
            <linearGradient id="halo2" x1="120" y1="0" x2="0" y2="120" gradientUnits="userSpaceOnUse">
              <stop stopColor="#818cf8" />
              <stop offset="1" stopColor="#818cf8" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Glow circle behind cross */}
        <div className="absolute w-16 h-16 rounded-full bg-primary/10 blur-xl animate-pulse" />

        {/* ── Cross SVG ── */}
        <svg viewBox="0 0 60 80" fill="none" className="relative z-10 animate-cross-glow" width="52" height="68">
          {/* Cross shadow / glow */}
          <rect x="23" y="0" width="14" height="80" rx="4" fill="url(#crossGradient)" opacity="0.15" />
          <rect x="0" y="24" width="60" height="14" rx="4" fill="url(#crossGradient)" opacity="0.15" />

          {/* Cross body */}
          <rect x="24" y="1" width="12" height="78" rx="3.5" fill="url(#crossGradient)" />
          <rect x="1" y="25" width="58" height="12" rx="3.5" fill="url(#crossGradient)" />

          {/* Highlight streak */}
          <rect x="28" y="1" width="3" height="78" rx="1.5" fill="white" opacity="0.25" />
          <rect x="1" y="28" width="58" height="3" rx="1.5" fill="white" opacity="0.25" />

          {/* Center jewel */}
          <circle cx="30" cy="31" r="5" fill="white" opacity="0.9" />
          <circle cx="30" cy="31" r="3" fill="url(#jewel)" />

          <defs>
            <linearGradient id="crossGradient" x1="30" y1="0" x2="30" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#818cf8" />
              <stop offset="0.5" stopColor="#6366f1" />
              <stop offset="1" stopColor="#4f46e5" />
            </linearGradient>
            <radialGradient id="jewel" cx="50%" cy="50%" r="50%">
              <stop stopColor="#e0e7ff" />
              <stop offset="1" stopColor="#6366f1" />
            </radialGradient>
          </defs>
        </svg>

        {/* Light rays */}
        {[0, 45, 90, 135].map((deg, i) => (
          <div
            key={i}
            className="absolute w-px bg-gradient-to-t from-transparent via-primary/30 to-transparent animate-pulse"
            style={{
              height: 48,
              top: "50%",
              left: "50%",
              transformOrigin: "top center",
              transform: `translateX(-50%) rotate(${deg}deg)`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* ── Text ── */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-sm font-bold text-primary tracking-[0.2em] uppercase animate-pulse font-[Vazirmatn]">
          لحظه‌ای صبر کنید
        </p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* Global keyframe styles */}
      <style>{`
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          to { transform: rotate(-360deg); }
        }
        @keyframes cross-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(99,102,241,0.5)); }
          50%       { filter: drop-shadow(0 0 16px rgba(99,102,241,0.9)); }
        }
        .animate-spin-slow   { animation: spin-slow 4s linear infinite; }
        .animate-spin-reverse{ animation: spin-reverse 6s linear infinite; }
        .animate-cross-glow  { animation: cross-glow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
