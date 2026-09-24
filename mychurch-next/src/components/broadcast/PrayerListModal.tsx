"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Heart, Plus, Trash2, Edit3, ArrowUp, ArrowDown,
  Send, X, Check, ChevronDown, Users, Sparkles,
  BookOpen, Loader2, Copy
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/providers/LanguageProvider";

const localDict = {
  en: {
    modalTitle: "Prayer Request List",
    itemsCountLocal: (n: number) => `${n} items · stored locally · can be sent to Telegram`,
    allCategory: (n: number) => `All (${n})`,
    clearAll: "Clear all",
    editRequestTitle: "Edit Prayer Request",
    addRequestTitle: "Add New Request",
    nameLabel: "Person or family name:",
    namePlaceholder: "e.g. The Ahmadi Family",
    categoryLabel: "Category:",
    requestTextLabel: "Prayer request text:",
    requestTextPlaceholder: "Write the prayer request text...",
    privateLabel: "Private request — name will not be shown on Telegram",
    saveChanges: "Save Changes",
    addToList: "Add to List",
    cancel: "Cancel",
    addNewRequest: "Add New Prayer Request",
    emptyListPrompt: "Prayer list is empty. Add the first request.",
    emptyCategoryPrompt: "No requests found in this category.",
    moveUp: "Up",
    moveDown: "Down",
    edit: "Edit",
    delete: "Delete",
    someoneFromMembers: "Someone from the congregation",
    privateBadge: "Private",
    close: "Close",
    copyText: "Copy Text",
    sending: "Sending...",
    sendToTelegram: (n: number) => `Send to Telegram (${n})`,
    listEmpty: "List is empty",
    itemsReady: (n: number) => `${n} prayer requests ready to send`,
    itemsReadySuffix: "prayer requests ready to send",
    fillNameAndRequest: "Please enter a name and prayer request text.",
    requestUpdated: "Prayer request updated.",
    requestAdded: "Prayer request added.",
    requestDeleted: "Request deleted.",
    confirmClearAll: "Are you sure? All prayer requests will be deleted.",
    listCleared: "Prayer list cleared.",
    listEmptyError: "Prayer list is empty.",
    listCopied: "Prayer list text copied.",
    sendingToTelegram: "Sending prayer list to Telegram...",
    sendError: "Error sending",
    sendErrorGeneric: "Error sending to Telegram",
    sentSuccess: (n: number) => `✓ Prayer list (${n} items) sent to Telegram successfully.`,
    telegramTitle: "*Prayer Request List*",
    withLove: (churchName: string) => `_With love, ${churchName}_`,
  },
  fa: {
    modalTitle: "لیست درخواست‌های دعا",
    itemsCountLocal: (n: number) => `${n} مورد · ذخیره‌شده محلی · قابل ارسال به تلگرام`,
    allCategory: (n: number) => `همه (${n})`,
    clearAll: "پاک کردن همه",
    editRequestTitle: "ویرایش درخواست دعا",
    addRequestTitle: "افزودن درخواست جدید",
    nameLabel: "نام شخص یا خانواده:",
    namePlaceholder: "مثال: خانواده احمدی",
    categoryLabel: "دسته‌بندی:",
    requestTextLabel: "متن درخواست دعا:",
    requestTextPlaceholder: "متن درخواست دعا را بنویسید...",
    privateLabel: "درخواست خصوصی — در تلگرام نام ذکر نشود",
    saveChanges: "ذخیره تغییرات",
    addToList: "افزودن به لیست",
    cancel: "انصراف",
    addNewRequest: "افزودن درخواست دعای جدید",
    emptyListPrompt: "لیست دعا خالی است. اولین درخواست را اضافه کنید.",
    emptyCategoryPrompt: "هیچ درخواستی در این دسته یافت نشد.",
    moveUp: "بالا",
    moveDown: "پایین",
    edit: "ویرایش",
    delete: "حذف",
    someoneFromMembers: "یک نفر از اعضا",
    privateBadge: "خصوصی",
    close: "بستن",
    copyText: "کپی متن",
    sending: "در حال ارسال...",
    sendToTelegram: (n: number) => `ارسال به تلگرام (${n})`,
    listEmpty: "لیست خالی است",
    itemsReady: (n: number) => `${n} درخواست دعا آماده ارسال`,
    itemsReadySuffix: "درخواست دعا آماده ارسال",
    fillNameAndRequest: "لطفاً نام و متن درخواست دعا را وارد کنید.",
    requestUpdated: "درخواست دعا ویرایش شد.",
    requestAdded: "درخواست دعا اضافه شد.",
    requestDeleted: "درخواست حذف شد.",
    confirmClearAll: "آیا مطمئنید؟ تمام درخواست‌های دعا حذف می‌شوند.",
    listCleared: "لیست دعا پاک شد.",
    listEmptyError: "لیست دعا خالی است.",
    listCopied: "متن لیست دعا کپی شد.",
    sendingToTelegram: "در حال ارسال لیست دعا به تلگرام...",
    sendError: "خطا در ارسال",
    sendErrorGeneric: "خطا در ارسال به تلگرام",
    sentSuccess: (n: number) => `✓ لیست دعا (${n} مورد) با موفقیت به تلگرام ارسال شد.`,
    telegramTitle: "*لیست درخواست‌های دعا*",
    withLove: (churchName: string) => `_با محبت، ${churchName}_`,
  },
  es: {
    modalTitle: "Lista de peticiones de oración",
    itemsCountLocal: (n: number) => `${n} elementos · guardado localmente · se puede enviar a Telegram`,
    allCategory: (n: number) => `Todas (${n})`,
    clearAll: "Borrar todo",
    editRequestTitle: "Editar petición de oración",
    addRequestTitle: "Añadir nueva petición",
    nameLabel: "Nombre de la persona o familia:",
    namePlaceholder: "ej. Familia Ahmadi",
    categoryLabel: "Categoría:",
    requestTextLabel: "Texto de la petición de oración:",
    requestTextPlaceholder: "Escriba el texto de la petición de oración...",
    privateLabel: "Petición privada — el nombre no se mostrará en Telegram",
    saveChanges: "Guardar cambios",
    addToList: "Añadir a la lista",
    cancel: "Cancelar",
    addNewRequest: "Añadir nueva petición de oración",
    emptyListPrompt: "La lista de oración está vacía. Añada la primera petición.",
    emptyCategoryPrompt: "No se encontraron peticiones en esta categoría.",
    moveUp: "Subir",
    moveDown: "Bajar",
    edit: "Editar",
    delete: "Eliminar",
    someoneFromMembers: "Alguien de la congregación",
    privateBadge: "Privada",
    close: "Cerrar",
    copyText: "Copiar texto",
    sending: "Enviando...",
    sendToTelegram: (n: number) => `Enviar a Telegram (${n})`,
    listEmpty: "La lista está vacía",
    itemsReady: (n: number) => `${n} peticiones de oración listas para enviar`,
    itemsReadySuffix: "peticiones de oración listas para enviar",
    fillNameAndRequest: "Por favor ingrese el nombre y el texto de la petición de oración.",
    requestUpdated: "Petición de oración editada.",
    requestAdded: "Petición de oración añadida.",
    requestDeleted: "Petición eliminada.",
    confirmClearAll: "¿Está seguro? Se eliminarán todas las peticiones de oración.",
    listCleared: "Lista de oración eliminada.",
    listEmptyError: "La lista de oración está vacía.",
    listCopied: "Texto de la lista de oración copiado.",
    sendingToTelegram: "Enviando lista de oración a Telegram...",
    sendError: "Error al enviar",
    sendErrorGeneric: "Error al enviar a Telegram",
    sentSuccess: (n: number) => `✓ Lista de oración (${n} elementos) enviada a Telegram con éxito.`,
    telegramTitle: "*Lista de peticiones de oración*",
    withLove: (churchName: string) => `_Con cariño, ${churchName}_`,
  },
};

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

const CATEGORY_LABELS: Record<"en" | "fa" | "es", Record<PrayerCategory, string>> = {
  en: { healing: "Healing", family: "Family", financial: "Financial", spiritual: "Spiritual", thanksgiving: "Thanksgiving", grief: "Grief", other: "Other" },
  fa: { healing: "شفا", family: "خانواده", financial: "مالی", spiritual: "روحانی", thanksgiving: "تشکر", grief: "عزاداری", other: "سایر" },
  es: { healing: "Sanidad", family: "Familia", financial: "Financiera", spiritual: "Espiritual", thanksgiving: "Acción de gracias", grief: "Duelo", other: "Otra" },
};

const CATEGORY_META: { value: PrayerCategory; emoji: string; color: string }[] = [
  { value: "healing",      emoji: "💊", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  { value: "family",       emoji: "👨‍👩‍👧", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { value: "financial",    emoji: "💼", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { value: "spiritual",    emoji: "🙏", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
  { value: "thanksgiving", emoji: "🌟", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
  { value: "grief",        emoji: "🕊️", color: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
  { value: "other",        emoji: "📿", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
];

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

  const { language } = useLanguage();
  const d = localDict[language] || localDict.fa;
  const CATEGORIES = useMemo(
    () => CATEGORY_META.map((c) => ({ ...c, label: (CATEGORY_LABELS[language] || CATEGORY_LABELS.fa)[c.value] })),
    [language]
  );
  const getCategoryInfo = useCallback(
    (value: PrayerCategory) => CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1],
    [CATEGORIES]
  );

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
      toast.error(d.fillNameAndRequest);
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
      toast.success(d.requestUpdated);
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
      toast.success(d.requestAdded);
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
    toast.success(d.requestDeleted);
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
    if (!confirm(d.confirmClearAll)) return;
    setItems([]);
    toast.success(d.listCleared);
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
      `🙏 ${d.telegramTitle}`,
      `📅 ${today}`,
      `🏛 ${churchName}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
    ];

    items.forEach((item, idx) => {
      const cat = getCategoryInfo(item.category);
      const displayName = item.isPrivate ? d.someoneFromMembers : item.name;
      lines.push(``, `*${idx + 1}. ${cat.emoji} ${displayName}*`);
      lines.push(`${item.request}`);
    });

    lines.push(``, `━━━━━━━━━━━━━━━━━━━━`);
    lines.push(d.withLove(churchName));

    return lines.join("\n");
  };

  const copyToClipboard = () => {
    if (items.length === 0) {
      toast.error(d.listEmptyError);
      return;
    }
    navigator.clipboard.writeText(buildTelegramMessage().replace(/\*/g, "").replace(/_/g, ""));
    toast.success(d.listCopied);
  };

  const sendToTelegram = async () => {
    if (items.length === 0) {
      toast.error(d.listEmptyError);
      return;
    }
    setIsSending(true);
    const toastId = toast.loading(d.sendingToTelegram);

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
      if (!res.ok) throw new Error(data.error || d.sendError);

      toast.success(d.sentSuccess(items.length), { id: toastId });
    } catch (err: any) {
      toast.error(err.message || d.sendErrorGeneric, { id: toastId });
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
              <h3 className="font-bold text-base text-white">{d.modalTitle}</h3>
              <p className="text-xs text-neutral-400">
                {d.itemsCountLocal(items.length)}
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
              {d.allCategory(items.length)}
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
              <span>{d.clearAll}</span>
            </button>
          )}
        </div>

        {/* ── ADD FORM ── */}
        {isAdding ? (
          <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/50 space-y-3 shrink-0 animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-sm font-bold text-white">
              {editingId ? d.editRequestTitle : d.addRequestTitle}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1">{d.nameLabel}</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={d.namePlaceholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-rose-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1">{d.categoryLabel}</label>
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
              <label className="text-[11px] font-bold text-neutral-400 block mb-1">{d.requestTextLabel}</label>
              <textarea
                value={formRequest}
                onChange={(e) => setFormRequest(e.target.value)}
                placeholder={d.requestTextPlaceholder}
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
                {d.privateLabel}
              </label>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleAddOrUpdate}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingId ? d.saveChanges : d.addToList}</span>
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 text-neutral-400 hover:text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition"
              >
                {d.cancel}
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
              <span>{d.addNewRequest}</span>
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
                  ? d.emptyListPrompt
                  : d.emptyCategoryPrompt}
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
                        {item.isPrivate ? d.someoneFromMembers : item.name}
                      </span>
                      {item.isPrivate && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-400 border border-neutral-600">
                          {d.privateBadge}
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
                      title={d.moveUp}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveItem(globalIdx, "down")}
                      disabled={globalIdx === items.length - 1}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition"
                      title={d.moveDown}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 transition"
                      title={d.edit}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title={d.delete}
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
              <span className="text-amber-400">{d.listEmpty}</span>
            ) : (
              <span>
                <b className="text-white font-mono">{items.length}</b> {d.itemsReadySuffix}
              </span>
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
            >
              {d.close}
            </button>
            <button
              onClick={copyToClipboard}
              disabled={items.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl text-xs font-bold transition disabled:opacity-40"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{d.copyText}</span>
            </button>
            <button
              onClick={sendToTelegram}
              disabled={isSending || items.length === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
            >
              {isSending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>{d.sending}</span></>
              ) : (
                <><Send className="w-4 h-4" /><span>{d.sendToTelegram(items.length)}</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
