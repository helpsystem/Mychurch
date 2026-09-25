"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Mail,
  Send,
  Inbox,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Reply,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Eye,
  Ban,
  Archive,
  Lock,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  X,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdminEmails,
  getAdminEmailById,
  sendAdminEmail,
  markEmailSpam,
  deleteAdminEmail,
  AdminEmailRecord,
} from "@/actions/admin-emails";
import Link from "next/link";

interface Props {
  initialEmails: AdminEmailRecord[];
  initialFolderCounts: {
    inbox: number;
    inboxUnread: number;
    sent: number;
    spam: number;
  };
}

export default function EmailInboxClient({
  initialEmails,
  initialFolderCounts,
}: Props) {
  const [emails, setEmails] = useState<AdminEmailRecord[]>(initialEmails);
  const [folderCounts, setFolderCounts] = useState(initialFolderCounts);
  const [currentFolder, setCurrentFolder] = useState<"inbox" | "sent" | "spam" | "archived">("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<AdminEmailRecord | null>(null);
  const [isPending, startTransition] = useTransition();

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeReplyId, setComposeReplyId] = useState<number | undefined>(undefined);
  const [composeHoneypot, setComposeHoneypot] = useState(""); // Anti-Bot Honeypot
  const [formOpenTime, setFormOpenTime] = useState<number>(0);
  const [isSending, setIsSending] = useState(false);

  // Active view tab (HTML vs Plain Text in reading pane)
  const [renderMode, setRenderMode] = useState<"html" | "text">("text");

  // Load emails when folder or search changes
  const loadEmails = (folder = currentFolder, search = searchQuery) => {
    startTransition(async () => {
      const res = await getAdminEmails({ folder, search });
      if (res.success) {
        setEmails(res.emails);
        setFolderCounts(res.folderCounts);
        if (selectedEmail && !res.emails.some((e) => e.id === selectedEmail.id)) {
          setSelectedEmail(null);
        }
      } else {
        toast.error(res.error || "خطا در دریافت ایمیل‌ها.");
      }
    });
  };

  const handleSelectEmail = async (email: AdminEmailRecord) => {
    setSelectedEmail(email);
    if (email.body_html) {
      setRenderMode("html");
    } else {
      setRenderMode("text");
    }

    if (email.status === "unread") {
      // Mark as read in server
      const res = await getAdminEmailById(email.id);
      if (res.success && res.email) {
        setEmails((prev) =>
          prev.map((e) => (e.id === email.id ? { ...e, status: "read" } : e))
        );
        setFolderCounts((prev) => ({
          ...prev,
          inboxUnread: Math.max(0, prev.inboxUnread - 1),
        }));
      }
    }
  };

  const handleOpenCompose = (replyEmail?: AdminEmailRecord) => {
    setFormOpenTime(Date.now());
    setComposeHoneypot("");
    if (replyEmail) {
      setComposeTo(replyEmail.direction === "inbound" ? replyEmail.from_email : replyEmail.to_email);
      setComposeSubject(
        replyEmail.subject.startsWith("Re:") ? replyEmail.subject : `Re: ${replyEmail.subject}`
      );
      setComposeReplyId(replyEmail.id);
      setComposeBody(
        `\n\n--- پیام قبلی از ${replyEmail.from_email} ---\n${replyEmail.body_text || ""}`
      );
    } else {
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setComposeReplyId(undefined);
    }
    setIsComposeOpen(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    const formFillTimeMs = Date.now() - formOpenTime;

    const res = await sendAdminEmail({
      to: composeTo,
      subject: composeSubject,
      body: composeBody,
      replyToId: composeReplyId,
      honeypot: composeHoneypot,
      formFillTimeMs,
    });

    setIsSending(false);

    if (res.success) {
      toast.success("ایمیل با موفقیت و تحت پروتکل امن Resend ارسال گردید.");
      setIsComposeOpen(false);
      loadEmails();
    } else {
      toast.error(res.error || "خطا در ارسال ایمیل.");
    }
  };

  const handleToggleSpam = async (email: AdminEmailRecord) => {
    const newSpamState = !email.is_spam;
    const res = await markEmailSpam(email.id, newSpamState);
    if (res.success) {
      toast.success(newSpamState ? "ایمیل به پوشه هرزنامه منتقل شد." : "ایمیل به اینباکس بازگردانده شد.");
      loadEmails();
      setSelectedEmail(null);
    } else {
      toast.error("خطا در تغییر وضعیت اسپم.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این ایمیل اطمینان دارید؟")) return;
    const res = await deleteAdminEmail(id);
    if (res.success) {
      toast.success("ایمیل با موفقیت حذف شد.");
      setSelectedEmail(null);
      loadEmails();
    } else {
      toast.error("خطا در حذف ایمیل.");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen font-[Vazirmatn]">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-4 bg-[#111319]/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/communications"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10"
            title="بازگشت به مرکز ارتباطات"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-white font-[Work Sans]">
                Church Official Mail Console
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                admin@iranianchurchdc.com
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              صندوق پستی رسمی کلیسا &bull; مجهز به فیلتر ضد ربات (Anti-Bot) و اعتبارسنجی SPF / DKIM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => loadEmails()}
            disabled={isPending}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10"
            title="بروزرسانی"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-amber-400" : ""}`} />
          </button>
          <Link
            href="/admin/communications/email/campaigns"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-2"
          >
            <Radio className="w-4 h-4 text-indigo-400" />
            ارسال گروهی (Campaigns)
          </Link>
          <button
            onClick={() => handleOpenCompose()}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-transform active:scale-95 flex items-center gap-2 font-[Vazirmatn]"
          >
            <Plus className="w-4 h-4" />
            نگارش ایمیل جدید (Compose)
          </button>
        </div>
      </header>

      {/* Main Mail Console Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Folder Nav */}
        <aside className="w-full lg:w-64 bg-[#0d1017]/80 border-b lg:border-b-0 lg:border-l border-white/10 p-4 shrink-0 flex flex-row lg:flex-col justify-between">
          <div className="space-y-1 w-full flex flex-row lg:flex-col gap-1 lg:gap-0 overflow-x-auto">
            <button
              onClick={() => {
                setCurrentFolder("inbox");
                loadEmails("inbox");
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentFolder === "inbox"
                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4 text-amber-400" />
                <span>صندوق ورودی (Inbox)</span>
              </div>
              {folderCounts.inboxUnread > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold font-mono rounded-full bg-amber-500 text-slate-950 shadow-sm">
                  {folderCounts.inboxUnread}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setCurrentFolder("sent");
                loadEmails("sent");
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentFolder === "sent"
                  ? "bg-sky-500/10 text-sky-300 border border-sky-500/30 font-bold"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-sky-400" />
                <span>ارسال شده‌ها (Sent)</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">{folderCounts.sent}</span>
            </button>

            <button
              onClick={() => {
                setCurrentFolder("spam");
                loadEmails("spam");
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentFolder === "spam"
                  ? "bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>هرزنامه و ربات (Spam)</span>
              </div>
              {folderCounts.spam > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold font-mono rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {folderCounts.spam}
                </span>
              )}
            </button>
          </div>

          {/* Security Status Box */}
          <div className="hidden lg:block mt-8 p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>پروتکل امنیتی Resend</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400 font-mono" dir="ltr">
              <div className="flex justify-between">
                <span>DKIM:</span>
                <span className="text-emerald-400 font-bold">Verified</span>
              </div>
              <div className="flex justify-between">
                <span>SPF:</span>
                <span className="text-emerald-400 font-bold">Pass</span>
              </div>
              <div className="flex justify-between">
                <span>Anti-Bot:</span>
                <span className="text-amber-400 font-bold">Active</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Email List */}
        <section className={`w-full lg:w-96 border-b lg:border-b-0 lg:border-l border-white/10 bg-[#0f1219]/60 flex flex-col shrink-0 ${selectedEmail ? "hidden lg:flex" : "flex"}`}>
          {/* Search Box */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="جستجو در ایمیل‌ها..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  loadEmails(currentFolder, e.target.value);
                }}
                className="w-full bg-black/40 border border-white/10 rounded-xl pr-9 pl-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {isPending && emails.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                <span className="text-xs">در حال بارگذاری ایمیل‌ها...</span>
              </div>
            ) : emails.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Mail className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">هیچ ایمیلی در این بخش وجود ندارد.</p>
              </div>
            ) : (
              emails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                const isUnread = email.status === "unread";
                const isOutbound = email.direction === "outbound";
                const dateStr = new Date(email.created_at).toLocaleDateString("fa-IR", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className={`p-4 cursor-pointer transition-colors relative group ${
                      isSelected
                        ? "bg-amber-500/10 border-r-4 border-amber-500"
                        : isUnread
                        ? "bg-white/[0.04] hover:bg-white/[0.07]"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    {isUnread && (
                      <span className="absolute left-3 top-4 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    )}

                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs truncate max-w-[180px] ${isUnread ? "font-bold text-white" : "text-slate-300"}`}>
                        {isOutbound ? `به: ${email.to_email}` : (email.from_name || email.from_email)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{dateStr}</span>
                    </div>

                    <h4 className={`text-xs mb-1 line-clamp-1 ${isUnread ? "font-bold text-amber-200" : "text-slate-200"}`}>
                      {email.subject || "(بدون موضوع)"}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {email.body_text || "بدون متن پیش‌نمایش"}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      {email.is_spam ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-mono">
                          <Ban className="w-3 h-3" /> Spam ({email.spam_score}%)
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                          Verified
                        </span>
                      )}
                      {email.status === "replied" && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          پاسخ داده شده
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Pane: Email Reader */}
        <main className={`flex-1 bg-[#131722]/50 flex flex-col ${!selectedEmail ? "hidden lg:flex" : "flex"}`}>
          {selectedEmail ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Reader Action Bar */}
              <div className="p-4 border-b border-white/10 bg-[#0e111a]/80 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                    title="بازگشت به لیست"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleOpenCompose(selectedEmail)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1.5"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    پاسخ دادن (Reply)
                  </button>
                  <button
                    onClick={() => handleToggleSpam(selectedEmail)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                      selectedEmail.is_spam
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                        : "bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {selectedEmail.is_spam ? "انتقال به اینباکس" : "گزارش اسپم (Spam)"}
                  </button>
                  <button
                    onClick={() => handleDelete(selectedEmail.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                    title="حذف ایمیل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Switch Render Mode */}
                {selectedEmail.body_html && (
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
                    <button
                      onClick={() => setRenderMode("html")}
                      className={`px-2.5 py-1 rounded ${renderMode === "html" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400"}`}
                    >
                      قالب HTML
                    </button>
                    <button
                      onClick={() => setRenderMode("text")}
                      className={`px-2.5 py-1 rounded ${renderMode === "text" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400"}`}
                    >
                      متن ساده
                    </button>
                  </div>
                )}
              </div>

              {/* Message Header */}
              <div className="p-6 border-b border-white/10 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg md:text-xl font-bold text-white leading-snug">
                    {selectedEmail.subject || "(بدون موضوع)"}
                  </h2>
                  <span className="text-xs text-slate-400 font-mono shrink-0">
                    {new Date(selectedEmail.created_at).toLocaleString("fa-IR")}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-sm shrink-0">
                    {selectedEmail.from_name ? selectedEmail.from_name.charAt(0) : selectedEmail.from_email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">
                        {selectedEmail.from_name || selectedEmail.from_email}
                      </span>
                      <span className="text-xs text-slate-400 font-mono" dir="ltr">
                        &lt;{selectedEmail.from_email}&gt;
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      به: <span className="font-mono text-slate-300" dir="ltr">{selectedEmail.to_email}</span>
                    </div>
                  </div>
                </div>

                {/* Spam & Security Details Alert */}
                {selectedEmail.is_spam && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <p className="font-bold">این ایمیل به عنوان اسپم یا ربات شناسایی شده است (نمره: {selectedEmail.spam_score} از 100)</p>
                      {selectedEmail.spam_reasons && selectedEmail.spam_reasons.length > 0 && (
                        <p className="mt-1 text-slate-400">علت: {selectedEmail.spam_reasons.join(", ")}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Body */}
              <div className="flex-1 p-6 overflow-y-auto">
                {renderMode === "html" && selectedEmail.body_html ? (
                  <div className="bg-white text-slate-900 rounded-xl p-6 shadow-xl max-w-4xl mx-auto overflow-x-auto min-h-[400px]">
                    <div
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                      className="prose max-w-none"
                    />
                  </div>
                ) : (
                  <div className="bg-black/30 border border-white/5 rounded-xl p-6 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans max-w-4xl mx-auto">
                    {selectedEmail.body_text || selectedEmail.body_html?.replace(/<[^>]+>/g, " ") || "(بدون متن پیام)"}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Mail className="w-16 h-16 text-slate-600 mb-3 opacity-40 stroke-[1.5]" />
              <h3 className="text-sm font-bold text-slate-400 mb-1">یک ایمیل را برای مشاهده انتخاب کنید</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                ایمیل‌های دریافتی به آدرس admin@iranianchurchdc.com به صورت رمزنگاری‌شده و آنالیزشده در اینجا به نمایش درمی‌آیند.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Compose Modal (With Anti-Bot Protection) */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141724] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  {composeReplyId ? "پاسخ به ایمیل" : "نگارش ایمیل جدید (New Email)"}
                </h3>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendEmail} className="p-6 space-y-4 font-[Vazirmatn]">
              {/* Anti-Bot Honeypot Field (Invisible to human, filled by bots) */}
              <div style={{ opacity: 0, position: "absolute", top: 0, left: 0, height: 0, width: 0, zIndex: -1 }}>
                <label htmlFor="_church_hp_token">Do not fill this</label>
                <input
                  type="text"
                  id="_church_hp_token"
                  name="_church_hp_token"
                  value={composeHoneypot}
                  onChange={(e) => setComposeHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* From display */}
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-400">فرستنده رسمی:</span>
                <span className="font-mono font-bold text-amber-400" dir="ltr">
                  admin@iranianchurchdc.com
                </span>
              </div>

              {/* Recipient */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">گیرنده (To)</label>
                <input
                  type="email"
                  required
                  placeholder="recipient@example.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50 font-mono"
                  dir="ltr"
                />
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">موضوع (Subject)</label>
                <input
                  type="text"
                  required
                  placeholder="عنوان ایمیل..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>

              {/* Body */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">متن پیام (Message)</label>
                <textarea
                  required
                  rows={8}
                  placeholder="متن پیام خود را بنویسید..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none leading-relaxed"
                />
              </div>

              {/* Security note */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>محافظت ضد ربات و امضای دیجیتال DKIM فعال است</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComposeOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        در حال ارسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        ارسال ایمیل
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
