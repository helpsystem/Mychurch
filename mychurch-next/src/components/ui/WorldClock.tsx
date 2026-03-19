"use client";

import React, { useState, useEffect, useRef } from "react";

type TZClock = {
  label: string;
  labelFa: string;
  timezone: string;
  color: string;
  accentColor: string;
};

const TIMEZONES: TZClock[] = [
  { label: "Washington, D.C.", labelFa: "واشنگتن دی‌سی", timezone: "America/New_York", color: "#3b82f6", accentColor: "#1d4ed8" },
  { label: "Tehran, Iran", labelFa: "تهران", timezone: "Asia/Tehran", color: "#8b5cf6", accentColor: "#6d28d9" },
];

function getTimeInZone(timezone: string) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).formatToParts(now);

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  const h = parseInt(get("hour")) % 24;
  const m = parseInt(get("minute"));
  const s = parseInt(get("second"));

  return {
    hours: h, minutes: m, seconds: s,
    digital: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
    dateStr: `${get("weekday")}, ${get("month")} ${get("day")} ${get("year")}`,
    isPM: h >= 12,
  };
}

function AnalogClock({ hours, minutes, seconds, color }: { hours: number; minutes: number; seconds: number; color: string }) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;

  const handCoords = (pct: number, length: number) => {
    const angle = pct * 2 * Math.PI - Math.PI / 2;
    return { x: cx + length * Math.cos(angle), y: cy + length * Math.sin(angle) };
  };

  const secPct = seconds / 60;
  const minPct = (minutes + seconds / 60) / 60;
  const hourPct = ((hours % 12) + minutes / 60) / 12;

  const secEnd = handCoords(secPct, r * 0.85);
  const minEnd = handCoords(minPct, r * 0.72);
  const hourEnd = handCoords(hourPct, r * 0.52);

  // Tick marks
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const isHour = i % 5 === 0;
    const outer = r;
    const inner = isHour ? r - 10 : r - 5;
    return {
      x1: cx + inner * Math.cos(a), y1: cy + inner * Math.sin(a),
      x2: cx + outer * Math.cos(a), y2: cy + outer * Math.sin(a),
      isHour,
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
      {/* Face */}
      <circle cx={cx} cy={cy} r={r} fill="white" fillOpacity={0.04} stroke={color} strokeWidth={2} strokeOpacity={0.4} />
      {/* Ticks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={color} strokeWidth={t.isHour ? 2 : 1} strokeOpacity={t.isHour ? 0.8 : 0.3} strokeLinecap="round" />
      ))}
      {/* Hour hand */}
      <line x1={cx} y1={cy} x2={hourEnd.x} y2={hourEnd.y} stroke={color} strokeWidth={4} strokeLinecap="round" strokeOpacity={0.95} />
      {/* Minute hand */}
      <line x1={cx} y1={cy} x2={minEnd.x} y2={minEnd.y} stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeOpacity={0.9} />
      {/* Second hand */}
      <line x1={cx} y1={cy} x2={secEnd.x} y2={secEnd.y} stroke="#f43f5e" strokeWidth={1.5} strokeLinecap="round" />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={4} fill={color} fillOpacity={0.9} />
      <circle cx={cx} cy={cy} r={2} fill="white" fillOpacity={0.8} />
    </svg>
  );
}

function ClockWidget({ tz }: { tz: TZClock }) {
  const [time, setTime] = useState<{hours: number, minutes: number, seconds: number, digital: string, dateStr: string, isPM: boolean} | null>(null);

  useEffect(() => {
    setTime(getTimeInZone(tz.timezone));
    const id = setInterval(() => setTime(getTimeInZone(tz.timezone)), 1000);
    return () => clearInterval(id);
  }, [tz.timezone]);

  if (!time) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm animate-pulse">
        <div className="w-[120px] h-[120px] rounded-full bg-white/10" />
        <div className="h-8 w-24 bg-white/10 rounded mt-2" />
        <div className="w-full flex flex-col items-center gap-2 mt-4">
          <div className="h-4 w-28 bg-white/10 rounded" />
          <div className="h-3 w-20 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/8 transition-all">
      {/* Analog */}
      <AnalogClock hours={time.hours} minutes={time.minutes} seconds={time.seconds} color={tz.color} />

      {/* Digital */}
      <div className="font-mono font-black text-2xl tracking-tight" style={{ color: tz.color }}>
        {time.digital}
      </div>

      {/* Labels */}
      <div className="text-center">
        <p className="font-bold text-white/90 text-sm">{tz.label}</p>
        <p className="font-[Vazirmatn] text-white/60 text-xs">{tz.labelFa}</p>
        <p className="text-white/30 text-[10px] mt-1 font-mono">{time.dateStr}</p>
      </div>
    </div>
  );
}

export function WorldClock() {
  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-sm mx-auto">
      {TIMEZONES.map(tz => <ClockWidget key={tz.timezone} tz={tz} />)}
    </div>
  );
}
