"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Heart, Plus, Trash2, Edit3, ArrowUp, ArrowDown,
  Send, X, Check, ChevronDown, Users, Sparkles,
  BookOpen, Loader2, Copy
} from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

export type PrayerCategory =
  | "healing"    // شفا
  | "family"     // خانواده
  | "financial"  // مالی
  | "spiritual"  // روحانی
  | "thanksgiving" // تشکر
  | "grief"      // عزاداری
  | "other";     // سایر

export interface PrayerItem {
  id: string;
  name: string;          // نام شخص / خانواده
  request: string;       // متن درخواست
  category: PrayerCategory;
  addedAt: string;       // ISO date
  isPrivate?: boolean;   // درخواست خصوصی (نام در تلگرام مخفی)
}

interface PrayerListModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRTL?: boolean;
  churchName?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "mychurch_prayer_list";

const CATEGORIES: { value: PrayerCategory; label: string; emoji: string; color: string }[] = [
  { value: "healing",      label: "شفا",        emoji: "💊", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  { value: "family",       label: "خانواده",    emoji: "👨‍👩‍👧", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { value: "financial",    label: "مالی",       emoji: "💼", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { value: "spiritual",    label: "روحانی",     emoji: "🙏", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
  { value: "thanksgiving", label: "تشکر",       emoji: "🌟", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
  { value: "grief",        label: "عزاداری",   emoji: "🕊️", color: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
  { value: "other",        label: "سایر",       emoji: "📿", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
];

const getCategoryInfo = (value: PrayerCategory) =>
  CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];

// ─────────────────────────────────────────────────────────────────────
// Helper: Format date in Persian-friendly style
// ─────────────────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("fa-IR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
};

// ─────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────

export default function PrayerListModal({
  isOpen,
  onClose,
  isRTL = true,
  churchName = "کلیسای انجیلی ایرانیان",
}: PrayerListModalProps) {
  const [items, setItems] = useState<PrayerItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [filterCategory, setFilterCategory] = useState<PrayerCategory | "all">("all");

  // Form state
  const [formName, setFormName] = useState("");
  const [formRequest, setFormRequest] = useState("");
  const [formCategory, setFormCategory] = useState<PrayerCategory>("healing");
  const [formPrivate, setFormPrivate] = useState(false);

  // ── Load from localStorage ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  // ── Persist to localStorage ──
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  if (!isOpen) return null;

  // ── CRUD ──
  const resetForm = () => {
    setFormName("");
    setFormRequest("");
    setFormCategory("healing");
    setFormPrivate(false);
    setEditingId(null);
    setIsAdding(false);
  };

  const handleAddOrUpdate = () => {
    if (!formName.trim() || !formRequest.trim()) {
      toast.error("لطفاً نام و متن درخواست دعا را وارد کنید.");
      return;
    }

    if (editingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, name: formName.trim(), request: formRequest.trim(), category: formCategory, isPrivate: formPrivate }
            : item
        )
      );
      toast.success("درخواست دعا ویرایش شد.");
    } else {
      const newItem: PrayerItem = {
        id: `prayer-${Date.now()}`,
        name: formName.trim(),
        request: formRequest.trim(),
        category: formCategory,
        addedAt: new Date().toISOString(),
        isPrivate: formPrivate,
      };
      setItems((prev) => [...prev, newItem]);
      toast.success("درخواست دعا اضافه شد.");
    }
    resetForm();
  };

  const startEdit = (item: PrayerItem) => {
    setFormName(item.name);
    setFormRequest(item.request);
    setFormCategory(item.category);
    setFormPrivate(item.isPrivate ?? false);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("درخواست حذف شد.");
  };

  const moveItem = (index: number, dir: "up" | "down") => {
    setItems((prev) => {
      const arr = [...prev];
      const newIdx = dir === "up" ? index - 1 : index + 1;
      if (newIdx < 0 || newIdx >= arr.length) return arr;
      [arr[index], arr[newIdx]] = [arr[newIdx], arr[index]];
      return arr;
    });
  };

  const clearAll = () => {
    if (!confirm("آیا مطمئنید؟ تمام درخواست‌های دعا حذف می‌شوند.")) return;
    setItems([]);
    toast.success("لیست دعا پاک شد.");
  };

  // ── Filtered items ──
  const filtered = filterCategory === "all"
    ? items
    : items.filter((i) => i.category === filterCategory);

  // ── Build Telegram message ──
  const buildTelegramMessage = (): string => {
    const today = new Date().toLocaleDateString("fa-IR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const lines = [
      `🙏 *لیست درخواست‌های دعا*`,
      `📅 ${today}`,
      `🏛 ${churchName}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
    ];

    items.forEach((item, idx) => {
      const cat = getCategoryInfo(item.category);
      const displayName = item.isPrivate ? "یک نفر از اعضا" : item.name;
      lines.push(``, `*${idx + 1}. ${cat.emoji} ${displayName}*`);
      lines.push(`${item.request}`);
    });

    lines.push(``, `━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`_با محبت، ${churchName}_`);

    return lines.join("\n");
  };

  const copyToClipboard = () => {
    if (items.length === 0) {
      toast.error("لیست دعا خالی است.");
      return;
    }
    navigator.clipboard.writeText(buildTelegramMessage().replace(/\*/g, "").replace(/_/g, ""));
    toast.success("متن لیست دعا کپی شد.");
  };

  const sendToTelegram = async () => {
    if (items.length === 0) {
      toast.error("لیست دعا خالی است.");
      return;
    }
    setIsSending(true);
    const toastId = toast.loading("در حال ارسال لیست دعا به تلگرام...");

    try {
      const res = await fetch("/api/telegram/prayer-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          churchName,
          date: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ارسال");

      toast.success(`✓ لیست دعا (${items.length} مورد) با موفقیت به تلگرام ارسال شد.`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "خطا در ارسال به تلگرام", { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl font-[Vazirmatn] text-white overflow-hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">لیست درخواست‌های دعا</h3>
              <p className="text-xs text-neutral-400">
                {items.length} مورد · ذخیره‌شده محلی · قابل ارسال به تلگرام
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── TOOLBAR ── */}
        <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-950/30 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          {/* Category filter */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setFilterCategory("all")}
              className={`px-2.5 py-1 rounded-lg font-bold transition border ${filterCategory === "all" ? "bg-white/10 border-white/20 text-white" : "border-transparent text-neutral-400 hover:text-white"}`}
            >
              همه ({items.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = items.filter((i) => i.category === cat.value).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.value}
                  onClick={() => setFilterCategory(cat.value)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition border flex items-center gap-1 ${filterCategory === cat.value ? `${cat.color} border-current` : "border-transparent text-neutral-400 hover:text-white"}`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label} ({count})</span>
                </button>
              );
            })}
          </div>

          {/* Clear button */}
          {items.length > 0 && (
            <button
              onClick={clearAll}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاک کردن همه</span>
            </button>
          )}
        </div>

        {/* ── ADD FORM ── */}
        {isAdding ? (
          <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/50 space-y-3 shrink-0 animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-sm font-bold text-white">
              {editingId ? "ویرایش درخواست دعا" : "افزودن درخواست جدید"}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1">نام شخص یا خانواده:</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: خانواده احمدی"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-rose-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1">دسته‌بندی:</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as PrayerCategory)}
                  className="w-full bg-neutral-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-rose-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-400 block mb-1">متن درخواست دعا:</label>
              <textarea
                value={formRequest}
                onChange={(e) => setFormRequest(e.target.value)}
                placeholder="متن درخواست دعا را بنویسید..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-rose-400 resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="prayer-private"
                type="checkbox"
                checked={formPrivate}
                onChange={(e) => setFormPrivate(e.target.checked)}
                className="accent-rose-500 w-4 h-4"
              />
              <label htmlFor="prayer-private" className="text-xs text-neutral-300 cursor-pointer">
                درخواست خصوصی — در تلگرام نام ذکر نشود
              </label>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleAddOrUpdate}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingId ? "ذخیره تغییرات" : "افزودن به لیست"}</span>
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 text-neutral-400 hover:text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition"
              >
                انصراف
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-3 border-b border-neutral-800 shrink-0">
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن درخواست دعای جدید</span>
            </button>
          </div>
        )}

        {/* ── LIST ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8 text-rose-400/50" />
              </div>
              <p className="text-neutral-500 text-sm">
                {items.length === 0
                  ? "لیست دعا خالی است. اولین درخواست را اضافه کنید."
                  : "هیچ درخواستی در این دسته یافت نشد."}
              </p>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const cat = getCategoryInfo(item.category);
              const globalIdx = items.indexOf(item);
              return (
                <div
                  key={item.id}
                  className="group p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-2xl hover:border-neutral-600 transition flex items-start gap-3"
                >
                  {/* Number + Category */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-black flex items-center justify-center border border-rose-500/30">
                      {idx + 1}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-lg border font-bold ${cat.color}`}>
                      {cat.emoji}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-sm text-white">
                        {item.isPrivate ? "یک نفر از اعضا" : item.name}
                      </span>
                      {item.isPrivate && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-400 border border-neutral-600">
                          خصوصی
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-lg border font-bold ${cat.color}`}>
                        {cat.label}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-300 leading-relaxed">{item.request}</p>
                    <p className="text-[11px] text-neutral-500 mt-1">{formatDate(item.addedAt)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveItem(globalIdx, "up")}
                      disabled={globalIdx === 0}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition"
                      title="بالا"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveItem(globalIdx, "down")}
                      disabled={globalIdx === items.length - 1}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition"
                      title="پایین"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 transition"
                      title="ویرایش"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 shrink-0 flex-wrap gap-3">
          <span className="text-xs text-neutral-400">
            {items.length === 0 ? (
              <span className="text-amber-400">لیست خالی است</span>
            ) : (
              <span>
                <b className="text-white font-mono">{items.length}</b> درخواست دعا آماده ارسال
              </span>
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
            >
              بستن
            </button>
            <button
              onClick={copyToClipboard}
              disabled={items.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl text-xs font-bold transition disabled:opacity-40"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>کپی متن</span>
            </button>
            <button
              onClick={sendToTelegram}
              disabled={isSending || items.length === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
            >
              {isSending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>در حال ارسال...</span></>
              ) : (
                <><Send className="w-4 h-4" /><span>ارسال به تلگرام ({items.length})</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
