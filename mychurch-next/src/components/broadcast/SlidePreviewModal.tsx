"use client";

import React, { useState } from "react";
import { X, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { ScripturePage, SlideType } from "@/types/broadcast";
import { Slide } from "@/types/broadcast";

interface SlidePreviewModalProps {
  slide: Slide;
  isOpen: boolean;
  onClose: () => void;
  lang: "fa" | "en";
}

export default function SlidePreviewModal({ slide, isOpen, onClose, lang }: SlidePreviewModalProps) {
  const isRTL = lang === "fa";
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Handle Scripture slides
  if (slide.type === SlideType.SCRIPTURE) {
    const content = slide.content as any;
    const pages = content.pages || [];

    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-20" onClick={onClose}>
        <div
          className="w-full max-w-2xl bg-[#18181b] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                {isRTL ? "پیش‌نمایش اسلاید کتاب مقدس" : "Scripture Slide Preview"}
              </h2>
              <p className="text-sm text-slate-400">{slide.content?.title || "Scripture"}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {pages.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {isRTL ? "داده‌ای برای نمایش نیست" : "No scripture to display"}
              </div>
            ) : (
              pages.map((page: ScripturePage, idx: number) => {
                const isExpanded = expandedIndex === idx;
                const isCopied = copiedIndex === idx;
                const verseText = `${page.bookName.fa}/\n${page.bookName.en}\nفصل ${page.chapter}: آیات ${page.verses}`;

                return (
                  <div
                    key={page.id || idx}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all"
                  >
                    {/* Summary Row */}
                    <button
                      onClick={() => toggleExpand(idx)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-1" dir={isRTL ? "rtl" : "ltr"}>
                          {/* Version Info */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-block px-2 py-0.5 bg-blue-500/30 text-blue-200 text-xs rounded font-semibold">
                              {page.translation || "Bible"}
                            </span>
                            <span className="text-sm font-medium text-white">
                              {isRTL ? page.bookName.fa : page.bookName.en}
                            </span>
                          </div>

                          {/* Chapter & Verses */}
                          <div className="text-xs text-slate-400">
                            {isRTL ? "باب" : "Ch."} {page.chapter}: {page.verses}
                          </div>
                        </div>
                      </div>

                      {/* Expand Icon */}
                      <div className="ml-2 flex-shrink-0 text-slate-500">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-white/10 bg-black/30 px-4 py-4 space-y-3">
                        {/* Primary Text */}
                        {page.textPrimary && page.textPrimary.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                              {page.bookName.fa}
                            </p>
                            <div
                              className="text-sm text-slate-300 leading-relaxed font-[Vazirmatn] space-y-1"
                              dir="rtl"
                            >
                              {page.textPrimary.map((line, lineIdx) => (
                                <div key={lineIdx} className="flex gap-2">
                                  <span className="text-slate-500 text-xs flex-shrink-0 min-w-fit">
                                    {page.verseNumbers?.[lineIdx] || lineIdx + 1}
                                  </span>
                                  <p>{line}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Secondary Text */}
                        {page.textSecondary && page.textSecondary.length > 0 && (
                          <div className="space-y-2 border-t border-white/10 pt-3 mt-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                              {page.bookName.en}
                            </p>
                            <div
                              className="text-sm text-slate-300 leading-relaxed space-y-1"
                              dir="ltr"
                            >
                              {page.textSecondary.map((line, lineIdx) => (
                                <div key={lineIdx} className="flex gap-2">
                                  <span className="text-slate-500 text-xs flex-shrink-0 min-w-fit">
                                    {page.verseNumbers?.[lineIdx] || lineIdx + 1}
                                  </span>
                                  <p>{line}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopy(verseText, idx)}
                          className="text-xs px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2 mt-4 w-full justify-center"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              {isRTL ? "کپی شد" : "Copied"}
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              {isRTL ? "کپی اطلاعات" : "Copy"}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-white/10 bg-[#0e0e0f]/50 px-6 py-3 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              {isRTL ? "بستن" : "Close"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generic preview for other slide types
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-20" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-[#18181b] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              {isRTL ? "پیش‌نمایش اسلاید" : "Slide Preview"}
            </h2>
            <p className="text-sm text-slate-400">{slide.content?.title || "Content"}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-slate-300">{JSON.stringify(slide.content, null, 2)}</p>
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 bg-[#0e0e0f]/50 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            {isRTL ? "بستن" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

