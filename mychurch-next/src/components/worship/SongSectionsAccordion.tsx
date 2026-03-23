"use client";

import React, { useState } from "react";
import { ChevronDown, Music2, Repeat2, Zap, Mic2, Play, Pause, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Section type map ─────────────────────────────────────────────────────────
const SECTION_MAP: Record<string, { fa: string; icon: React.ElementType; color: string; bg: string }> = {
  verse:       { fa: "بند",           icon: Mic2,    color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  "verse 1":   { fa: "بند ۱",         icon: Mic2,    color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  "verse 2":   { fa: "بند ۲",         icon: Mic2,    color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/20" },
  "verse 3":   { fa: "بند ۳",         icon: Mic2,    color: "text-sky-400",    bg: "bg-sky-500/10 border-sky-500/20" },
  chorus:      { fa: "ترجیع‌بند",      icon: Repeat2, color: "text-primary",    bg: "bg-primary/10 border-primary/20" },
  bridge:      { fa: "پل",            icon: Zap,     color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  intro:       { fa: "مقدمه",         icon: Play,    color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20" },
  outro:       { fa: "پایان‌بندی",    icon: Pause,   color: "text-rose-400",   bg: "bg-rose-500/10 border-rose-500/20" },
  "pre-chorus":{ fa: "پیش ترجیع",    icon: Music2,  color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
  tag:         { fa: "تگ",            icon: Hash,    color: "text-pink-400",   bg: "bg-pink-500/10 border-pink-500/20" },
  interlude:   { fa: "میانی",        icon: Music2,  color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
};

function getSectionMeta(raw: string) {
  const key = raw.toLowerCase().trim();
  return SECTION_MAP[key] || { fa: raw, icon: Music2, color: "text-muted-foreground", bg: "bg-secondary border-border/50" };
}

// ── Parse lyrics into sections ───────────────────────────────────────────────
interface Section { id: number; header: string; content: string; }

const SECTION_PATTERN = /^(Verse[\s\d]*|Chorus|Bridge|Intro|Outro|Pre-?[Cc]horus|Tag|Interlude)\s*$/im;

export function parseSections(lyrics: string): Section[] {
  const lines = lyrics.split("\n");
  const sections: Section[] = [];
  let currentHeader = "";
  let currentLines: string[] = [];
  let id = 0;

  const push = () => {
    if (currentHeader || currentLines.some(l => l.trim())) {
      sections.push({ id: id++, header: currentHeader, content: currentLines.join("\n").trim() });
    }
  };

  for (const line of lines) {
    if (SECTION_PATTERN.test(line.trim())) {
      push();
      currentHeader = line.trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  push();

  // If no sections found, return the whole text as one unsectioned block
  if (sections.length <= 1 && !sections[0]?.header) return [];
  return sections;
}

// ── Strip / highlight inline chords ─────────────────────────────────────────
function stripChords(text: string) {
  return text.replace(/\[[A-G][^[\]]*\]/g, "").replace(/  +/g, " ").trim();
}

function ChordsLine({ line }: { line: string }) {
  const parts = line.split(/(\[[A-G][^[\]]*\])/g);
  return (
    <span>
      {parts.map((p, i) =>
        /^\[[A-G][^[\]]*\]$/.test(p)
          ? <span key={i} className="inline-flex items-center text-[10px] font-black font-mono text-purple-300 bg-purple-500/20 border border-purple-400/30 rounded px-1.5 py-0.5 mx-0.5 align-middle leading-none">
              {p.slice(1, -1)}
            </span>
          : <span key={i}>{p}</span>
      )}
    </span>
  );
}

// ── Single Section Card ──────────────────────────────────────────────────────
function SectionCard({
  section, showChords, defaultOpen,
}: {
  section: Section; showChords: boolean; defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = getSectionMeta(section.header || "");
  const Icon = meta.icon;
  const lines = section.content.split("\n");
  const hasHeader = !!section.header;

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm transition-all">
      {/* ── Header (clickable toggle) */}
      {hasHeader && (
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 gap-4 hover:bg-secondary/50 transition-colors border-b border-border"
        >
          <div className="flex items-center gap-3">
            <span className={cn(
              "flex items-center justify-center w-7 h-7 rounded-lg shrink-0 bg-secondary border border-border"
            )}>
              <Icon className={cn("w-3.5 h-3.5", meta.color)} />
            </span>
            <span className={cn("font-black text-sm", meta.color)}>{meta.fa}</span>
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">{section.header}</span>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground/40 shrink-0 transition-transform duration-300",
            open && "rotate-180"
          )} />
        </button>
      )}

      {/* ── Content */}
      {(open || !hasHeader) && (
        <div className={cn("px-5 pb-5 font-[Vazirmatn]", hasHeader && "pt-4")}>
          <div className="space-y-0.5">
            {lines.map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={i} className="h-3" />;
              return (
                <div key={i} className="text-[15px] leading-[2] text-foreground/90">
                  {showChords
                    ? <ChordsLine line={trimmed} />
                    : <span>{stripChords(trimmed)}</span>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
interface Props {
  lyrics: string;
  showChords: boolean;
}

export function SongSectionsAccordion({ lyrics, showChords }: Props) {
  const sections = parseSections(lyrics);

  // Fallback: no sections detected — render as plain text
  if (sections.length === 0) {
    const lines = lyrics.split("\n");
    return (
      <div className="bg-card border border-border rounded-2xl p-6 font-[Vazirmatn] shadow-sm space-y-0.5">
        {lines.map((line, i) => {
          const t = line.trim();
          if (!t) return <div key={i} className="h-3" />;
          return (
            <div key={i} className="text-base leading-relaxed text-foreground">
              {showChords ? <ChordsLine line={t} /> : <span>{stripChords(t)}</span>}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Chord summary bar
  const allChords = Array.from(new Set(
    (lyrics.match(/\[[A-G][^[\]]*\]/g) || []).map(c => c.slice(1, -1))
  ));

  return (
    <div className="space-y-3">
      {/* Chord key bar */}
      {allChords.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1 pb-1">
          <span className="text-xs text-muted-foreground font-bold shrink-0">🎸 آکوردها:</span>
          {allChords.map(c => (
            <span key={c} className="font-mono font-black text-xs bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-lg">
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Section cards */}
      {sections.map((s, i) => (
        <SectionCard
          key={s.id}
          section={s}
          showChords={showChords}
          defaultOpen={i === 0}
        />
      ))}
    </div>
  );
}
