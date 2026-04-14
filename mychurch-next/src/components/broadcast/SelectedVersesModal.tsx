"use client";

import React, { useState, useCallback } from "react";
import {
  X, GripVertical, Trash2, ChevronUp, ChevronDown,
  ArrowUp, ArrowDown, Copy, Eye, EyeOff
} from "lucide-react";

interface SelectedVerseEntry {
  id: string;
  book_id: string;
  book_name_en: string;
  book_name_fa: string;
  book_order: number;
  chapter: number;
  verse_num: number;
  en: string;
  fa: string;
}

interface SelectedVersesModalProps {
  isOpen: boolean;
  verses: SelectedVerseEntry[];
  onClose: () => void;
  onReorder: (newVerses: SelectedVerseEntry[]) => void;
  onRemove: (verseId: string) => void;
  onClear: () => void;
  lang: "fa" | "en";
}

export default function SelectedVersesModal({
  isOpen,
  verses,
  onClose,
  onReorder,
  onRemove,
  onClear,
  lang
}: SelectedVersesModalProps) {
  const isRTL = lang === "fa";
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showFullText, setShowFullText] = useState<string | null>(null);
  const [showScrollTools, setShowScrollTools] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, verseId: string) => {
    setDraggedItem(verseId);
    e.dataTransfer!.effectAllowed = "move";
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "move";
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetVerseId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetVerseId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = verses.findIndex((v) => v.id === draggedItem);
    const targetIndex = verses.findIndex((v) => v.id === targetVerseId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    const newVerses = [...verses];
    const [removed] = newVerses.splice(draggedIndex, 1);
    newVerses.splice(targetIndex, 0, removed);

    onReorder(newVerses);
    setDraggedItem(null);
  };

  // Move verse up
  const moveVerse = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= verses.length) return;

    const newVerses = [...verses];
    [newVerses[index], newVerses[newIndex]] = [newVerses[newIndex], newVerses[index]];
    onReorder(newVerses);
  };

  // Copy verse text to clipboard
  const copyVerse = (verse: SelectedVerseEntry) => {
    const text = `${verse.book_name_fa} ${verse.chapter}:${verse.verse_num}\nEN: ${verse.en}\nFA: ${verse.fa}`;
    navigator.clipboard.writeText(text);
  };

  // Scroll to top
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  if (!isOpen) return null;

  const groupedByReference = verses.reduce(
    (acc, verse) => {
      const key = `${verse.book_name_fa}-${verse.chapter}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(verse);
      return acc;
    },
    {} as Record<string, SelectedVerseEntry[]>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`bg-slate-900 border border-white/10 rounded-lg shadow-2xl flex flex-col h-[80vh] max-w-2xl w-full ${
          isRTL ? "font-[Vazirmatn]" : ""
        }`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-amber-600/20 to-amber-500/10 border-b border-amber-500/20 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-amber-300">
              {isRTL ? "مدیریت آیات انتخابی" : "Manage Selected Verses"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {verses.length} {isRTL ? "آیه | کلیک برای باز کردن جزئیات" : "verses | Click for details"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Controls Bar */}
        <div className="shrink-0 bg-slate-800/50 border-b border-white/5 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScrollTools(!showScrollTools)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                showScrollTools
                  ? "bg-blue-500/30 text-blue-300 border border-blue-500/50"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {isRTL ? "ابزار اسکرول" : "Scroll Tools"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {isRTL ? "تعداد آیات:" : "Total Verses:"}
            </span>
            <span className="text-sm font-bold text-amber-400">{verses.length}</span>
          </div>

          <button
            onClick={onClear}
            disabled={verses.length === 0}
            className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRTL ? "پاک کردن همه" : "Clear All"}
          </button>
        </div>

        {/* Scroll Controls (Conditional) */}
        {showScrollTools && (
          <div className="shrink-0 bg-slate-950/50 border-b border-white/5 px-6 py-3 flex items-center gap-2">
            <button
              onClick={scrollToTop}
              className="flex-1 px-3 py-2 text-xs rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <ChevronUp className="w-4 h-4" />
              {isRTL ? "به بالا" : "To Top"}
            </button>
            <button
              onClick={scrollToBottom}
              className="flex-1 px-3 py-2 text-xs rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
            >
              {isRTL ? "به پایین" : "To Bottom"}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Verses List */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto space-y-0 divide-y divide-white/5"
        >
          {verses.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>{isRTL ? "آیه‌ای انتخاب نشده است" : "No verses selected"}</p>
            </div>
          ) : (
            verses.map((verse, index) => (
              <div
                key={verse.id}
                draggable
                onDragStart={(e) => handleDragStart(e, verse.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, verse.id)}
                onDragEnd={handleDragEnd}
                className={`p-4 transition-all duration-200 cursor-move hover:bg-white/5 ${
                  draggedItem === verse.id ? "bg-amber-500/20 opacity-70" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Drag Handle */}
                  <div className="pt-1 text-slate-600 hover:text-amber-400 transition-colors">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Verse Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-amber-400 shrink-0">
                        {verse.book_name_fa}
                      </span>
                      <span className="text-xs text-slate-500 shrink-0">
                        {verse.chapter}:{verse.verse_num}
                      </span>
                      <span className="text-[10px] bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Preview */}
                    <p className="text-xs text-slate-300 mb-1 line-clamp-2">
                      {verse.en ? verse.en : "—"}
                    </p>
                    <p
                      className="text-xs text-slate-400 font-[Vazirmatn] line-clamp-2"
                    >
                      {verse.fa ? verse.fa : "—"}
                    </p>

                    {/* Full Text Modal Trigger */}
                    {showFullText === verse.id && (
                      <div className="mt-3 p-3 bg-slate-800/50 border border-white/10 rounded text-xs leading-relaxed space-y-2">
                        <p className="text-slate-200">{verse.en}</p>
                        <p className="text-slate-300 font-[Vazirmatn] text-right" dir="rtl">
                          {verse.fa}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      onClick={() =>
                        setShowFullText(
                          showFullText === verse.id ? null : verse.id
                        )
                      }
                      title={isRTL ? "متن کامل" : "Full text"}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                    >
                      {showFullText === verse.id ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => copyVerse(verse)}
                      title={isRTL ? "کپی" : "Copy"}
                      className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Up Arrow */}
                    <button
                      onClick={() => moveVerse(index, "up")}
                      disabled={index === 0}
                      title={isRTL ? "بالا رفتن" : "Move up"}
                      className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    {/* Down Arrow */}
                    <button
                      onClick={() => moveVerse(index, "down")}
                      disabled={index === verses.length - 1}
                      title={isRTL ? "پایین رفتن" : "Move down"}
                      className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onRemove(verse.id)}
                      title={isRTL ? "حذف" : "Remove"}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-slate-950/50 border-t border-white/5 px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            {isRTL
              ? "درگ و رها کنید برای تغییر ترتیب | کلیک برای متن کامل"
              : "Drag to reorder | Click for full text"}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition-colors"
          >
            {isRTL ? "بستن" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
