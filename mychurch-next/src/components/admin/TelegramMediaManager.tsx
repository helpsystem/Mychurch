"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload, CheckCircle2, XCircle, Clock, RefreshCw, Send,
  Music2, Film, CloudUpload, AlertCircle, Loader2, Search,
  Filter, ChevronDown, Link2, BarChart3, Zap, FolderOpen,
  X, Play, Pause
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getWorshipSongs, type WorshipSong } from "@/actions/worship";

// ─── Types ────────────────────────────────────────────────────────────────────
type UploadStatus = "idle" | "uploading" | "done" | "error";

interface SongUploadState {
  songId: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  fileId?: string;
  fileName?: string;
}

interface SongWithTelegram extends WorshipSong {
  hasTelegram: boolean;
}

// ─── Single Song Row ──────────────────────────────────────────────────────────
function SongRow({
  song,
  uploadState,
  onUploadFile,
}: {
  song: SongWithTelegram;
  uploadState?: SongUploadState;
  onUploadFile: (songId: string, file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadFile(song.id, file);
    e.target.value = "";
  };

  const togglePreview = () => {
    if (!song.audio_url && !(uploadState?.fileId)) return;
    if (isPreviewPlaying) {
      audioRef.current?.pause();
      setIsPreviewPlaying(false);
    } else {
      const src = uploadState?.fileId
        ? `/api/telegram/stream/${uploadState.fileId}`
        : song.audio_url || "";
      if (!audioRef.current) {
        audioRef.current = new Audio(src);
        audioRef.current.onended = () => setIsPreviewPlaying(false);
      }
      audioRef.current.play();
      setIsPreviewPlaying(true);
    }
  };

  const statusColor = () => {
    if (uploadState?.status === "done" || song.hasTelegram) return "text-emerald-400";
    if (uploadState?.status === "error") return "text-red-400";
    if (uploadState?.status === "uploading") return "text-amber-400";
    return "text-slate-500";
  };

  const statusIcon = () => {
    if (uploadState?.status === "uploading") return <Loader2 size={15} className="animate-spin text-amber-400" />;
    if (uploadState?.status === "error") return <XCircle size={15} className="text-red-400" />;
    if (uploadState?.status === "done" || song.hasTelegram) return <CheckCircle2 size={15} className="text-emerald-400" />;
    return <Clock size={15} className="text-slate-600" />;
  };

  return (
    <motion.div
      layout
      className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
        song.hasTelegram || uploadState?.status === "done"
          ? "border-emerald-500/20 bg-emerald-500/5"
          : uploadState?.status === "error"
          ? "border-red-500/20 bg-red-500/5"
          : uploadState?.status === "uploading"
          ? "border-amber-500/20 bg-amber-500/5"
          : "border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/4"
      }`}
    >
      {/* Status icon */}
      <div className="flex-shrink-0 w-7 flex items-center justify-center">
        {statusIcon()}
      </div>

      {/* Song info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate" dir="rtl">
          {song.title_fa}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {song.artist && (
            <span className="text-xs text-slate-500 truncate">{song.artist}</span>
          )}
          {(uploadState?.fileId || song.hasTelegram) && (
            <span className="flex items-center gap-1 text-xs text-emerald-400/70">
              <Link2 size={10} />
              Telegram CDN
            </span>
          )}
        </div>
        {/* Progress bar */}
        {uploadState?.status === "uploading" && (
          <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
              initial={{ width: 0 }}
              animate={{ width: `${uploadState.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
        {uploadState?.error && (
          <p className="text-xs text-red-400 mt-1 truncate">{uploadState.error}</p>
        )}
      </div>

      {/* Audio indicator */}
      {(song.audio_url || uploadState?.fileId) && (
        <button
          onClick={togglePreview}
          className="flex-shrink-0 w-7 h-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center hover:border-white/20 hover:bg-white/10 transition-all"
          title={isPreviewPlaying ? "توقف" : "پیش‌نمایش"}
        >
          {isPreviewPlaying
            ? <Pause size={12} className="text-amber-400" />
            : <Play size={12} className="text-slate-400" />}
        </button>
      )}

      {/* Upload button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadState?.status === "uploading"}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
          song.hasTelegram || uploadState?.status === "done"
            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            : uploadState?.status === "uploading"
            ? "border border-amber-500/20 bg-amber-500/10 text-amber-400 cursor-not-allowed"
            : "border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
        }`}
        title={song.hasTelegram ? "آپلود مجدد" : "آپلود MP3"}
      >
        {uploadState?.status === "uploading" ? (
          <><Loader2 size={11} className="animate-spin" />در حال آپلود</>
        ) : song.hasTelegram || uploadState?.status === "done" ? (
          <><RefreshCw size={11} />جایگزین</>
        ) : (
          <><CloudUpload size={11} />آپلود MP3</>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.ogg,.wav"
        className="hidden"
        onChange={handleFileChange}
      />
    </motion.div>
  );
}

// ─── Bulk Uploader ────────────────────────────────────────────────────────────
function BulkUploader({ songs, onComplete }: { songs: SongWithTelegram[]; onComplete: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [matchResults, setMatchResults] = useState<Array<{
    file: File; matchedSong: SongWithTelegram | null; songId: string | null;
  }>>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [bulkUploadStates, setBulkUploadStates] = useState<Record<string, SongUploadState>>({});
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith("audio/") || /\.(mp3|m4a|ogg|wav)$/i.test(f.name)
    );
    if (files.length > 0) matchFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f =>
      f.type.startsWith("audio/") || /\.(mp3|m4a|ogg|wav)$/i.test(f.name)
    );
    if (files.length > 0) matchFiles(files);
    e.target.value = "";
  };

  const matchFiles = async (files: File[]) => {
    setIsMatching(true);
    const results = files.map(file => {
      const baseName = file.name
        .replace(/\.(mp3|m4a|ogg|wav)$/i, "")
        .toLowerCase()
        .trim();

      // Try to match by title_fa, title_en, or artist+title
      let matchedSong: SongWithTelegram | null = null;

      matchedSong = songs.find(s => {
        const titleFa = (s.title_fa || "").toLowerCase();
        const titleEn = (s.title_en || "").toLowerCase();
        return baseName.includes(titleFa) || titleFa.includes(baseName) ||
          baseName.includes(titleEn) || titleEn.includes(baseName);
      }) || null;

      return { file, matchedSong, songId: matchedSong?.id || null };
    });

    setMatchResults(results);
    setIsMatching(false);
  };

  const updateMatch = (index: number, songId: string | null) => {
    setMatchResults(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        songId,
        matchedSong: songs.find(s => s.id === songId) || null,
      };
      return updated;
    });
  };

  const startBulkUpload = async () => {
    const toUpload = matchResults.filter(r => r.songId);
    if (toUpload.length === 0) return;

    setIsBulkUploading(true);

    for (const item of toUpload) {
      if (!item.songId) continue;
      const id = item.songId;

      setBulkUploadStates(prev => ({
        ...prev,
        [id]: { songId: id, status: "uploading", progress: 30, fileName: item.file.name },
      }));

      try {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("songId", id);
        formData.append("title", item.matchedSong?.title_fa || item.file.name);

        const res = await fetch("/api/worship/upload-audio", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        setBulkUploadStates(prev => ({
          ...prev,
          [id]: { songId: id, status: "done", progress: 100, fileId: data.fileId, fileName: item.file.name },
        }));
      } catch (err: any) {
        setBulkUploadStates(prev => ({
          ...prev,
          [id]: { songId: id, status: "error", progress: 0, error: err.message, fileName: item.file.name },
        }));
      }
    }

    setIsBulkUploading(false);
    onComplete();
  };

  const matched = matchResults.filter(r => r.songId).length;
  const unmatched = matchResults.filter(r => !r.songId).length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {matchResults.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer ${
            isDragging
              ? "border-amber-400/60 bg-amber-400/5"
              : "border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/4"
          }`}
        >
          <label className="cursor-pointer">
            <input type="file" accept="audio/*,.mp3,.m4a,.ogg,.wav" multiple className="hidden" onChange={handleFileSelect} />
            <CloudUpload size={40} className={`mx-auto mb-3 ${isDragging ? "text-amber-400" : "text-slate-600"}`} />
            <p className="text-sm font-semibold text-slate-300">
              فایل‌های MP3 را اینجا رها کنید یا کلیک کنید
            </p>
            <p className="text-xs text-slate-600 mt-1">MP3, M4A, OGG, WAV — حداکثر 200MB هر فایل</p>
          </label>
        </div>
      )}

      {/* Match results */}
      {matchResults.length > 0 && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
            <div className="flex items-center gap-1.5 text-sm">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-emerald-300 font-semibold">{matched}</span>
              <span className="text-slate-400">منطبق</span>
            </div>
            {unmatched > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <AlertCircle size={14} className="text-amber-400" />
                <span className="text-amber-300 font-semibold">{unmatched}</span>
                <span className="text-slate-400">بدون تطابق</span>
              </div>
            )}
            <button
              onClick={() => setMatchResults([])}
              className="mr-auto flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <X size={12} /> پاک کردن
            </button>
          </div>

          {/* File list */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {matchResults.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl border border-white/5 bg-white/2">
                <Music2 size={14} className="text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 truncate">{item.file.name}</p>
                  <p className="text-xs text-slate-600">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                {/* Song selector */}
                <select
                  value={item.songId || ""}
                  onChange={(e) => updateMatch(i, e.target.value || null)}
                  className="flex-1 min-w-0 max-w-[200px] bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  dir="rtl"
                >
                  <option value="">— انتخاب سرود —</option>
                  {songs.map(s => (
                    <option key={s.id} value={s.id}>{s.title_fa}</option>
                  ))}
                </select>
                {/* Status */}
                {bulkUploadStates[item.songId || ""]?.status === "done" ? (
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                ) : bulkUploadStates[item.songId || ""]?.status === "error" ? (
                  <XCircle size={14} className="text-red-400 flex-shrink-0" />
                ) : bulkUploadStates[item.songId || ""]?.status === "uploading" ? (
                  <Loader2 size={14} className="animate-spin text-amber-400 flex-shrink-0" />
                ) : item.songId ? (
                  <CheckCircle2 size={14} className="text-emerald-500/50 flex-shrink-0" />
                ) : (
                  <AlertCircle size={14} className="text-amber-500/50 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Upload all button */}
          {matched > 0 && (
            <button
              onClick={startBulkUpload}
              disabled={isBulkUploading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-black transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #F5A623, #FFCD70)",
                boxShadow: "0 0 30px rgba(245,166,35,0.3)",
              }}
            >
              {isBulkUploading ? (
                <><Loader2 size={18} className="animate-spin" />در حال آپلود به تلگرام...</>
              ) : (
                <><Send size={18} />آپلود {matched} فایل به Telegram CDN</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TelegramMediaManager() {
  const [songs, setSongs] = useState<SongWithTelegram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStates, setUploadStates] = useState<Record<string, SongUploadState>>({});
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "uploaded" | "pending">("all");
  const [activeTab, setActiveTab] = useState<"songs" | "bulk">("songs");

  const loadSongs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWorshipSongs();
      const withTelegram: SongWithTelegram[] = data.map(s => ({
        ...s,
        hasTelegram: !!(s as any).telegram_file_id,
      }));
      setSongs(withTelegram);
    } catch (err) {
      console.error("Failed to load songs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadSongs(); }, [loadSongs]);

  const handleUploadSingle = async (songId: string, file: File) => {
    setUploadStates(prev => ({
      ...prev,
      [songId]: { songId, status: "uploading", progress: 10, fileName: file.name },
    }));

    // Fake progress while uploading
    const progressInterval = setInterval(() => {
      setUploadStates(prev => {
        const current = prev[songId];
        if (!current || current.status !== "uploading") {
          clearInterval(progressInterval);
          return prev;
        }
        return {
          ...prev,
          [songId]: { ...current, progress: Math.min(current.progress + 5, 85) },
        };
      });
    }, 400);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("songId", songId);
      const song = songs.find(s => s.id === songId);
      formData.append("title", song?.title_fa || file.name);

      const res = await fetch("/api/worship/upload-audio", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      clearInterval(progressInterval);

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploadStates(prev => ({
        ...prev,
        [songId]: { songId, status: "done", progress: 100, fileId: data.fileId, fileName: file.name },
      }));

      // Update local song state
      setSongs(prev => prev.map(s =>
        s.id === songId ? { ...s, hasTelegram: true } : s
      ));
    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadStates(prev => ({
        ...prev,
        [songId]: { songId, status: "error", progress: 0, error: err.message, fileName: file.name },
      }));
    }
  };

  // Filter + search
  const filteredSongs = songs.filter(s => {
    const matchesSearch =
      s.title_fa.toLowerCase().includes(search.toLowerCase()) ||
      (s.title_en || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.artist || "").toLowerCase().includes(search.toLowerCase());

    const uploadState = uploadStates[s.id];
    const hasTelegram = s.hasTelegram || uploadState?.status === "done";

    if (filterMode === "uploaded") return matchesSearch && hasTelegram;
    if (filterMode === "pending") return matchesSearch && !hasTelegram;
    return matchesSearch;
  });

  const uploadedCount = songs.filter(s => s.hasTelegram || uploadStates[s.id]?.status === "done").length;
  const pendingCount = songs.length - uploadedCount;

  return (
    <div className="min-h-screen bg-[#050A0F] text-white p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,166,35,0.05))", border: "1px solid rgba(245,166,35,0.3)" }}
          >
            <Send size={22} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">مدیریت رسانه‌های تلگرام</h1>
            <p className="text-slate-400 text-sm">آپلود فایل‌های سنگین به Telegram CDN</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "کل سرودها", value: songs.length, icon: Music2, color: "#60A5FA" },
            { label: "آپلود شده", value: uploadedCount, icon: CheckCircle2, color: "#34D399" },
            { label: "در انتظار", value: pendingCount, icon: Clock, color: "#F5A623" },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/2 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: stat.color + "15", border: `1px solid ${stat.color}30` }}
              >
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar overall */}
        {songs.length > 0 && (
          <div className="p-4 rounded-2xl border border-white/5 bg-white/2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">پیشرفت کلی آپلود</span>
              <span className="text-sm font-bold text-amber-400">
                {Math.round((uploadedCount / songs.length) * 100)}٪
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #F5A623, #34D399)" }}
                initial={{ width: 0 }}
                animate={{ width: `${(uploadedCount / songs.length) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl bg-white/3 border border-white/5">
          {[
            { id: "songs", label: "آپلود تکی", icon: Music2 },
            { id: "bulk", label: "آپلود دسته‌جمعی", icon: FolderOpen },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-amber-500 text-black shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bulk uploader tab */}
        <AnimatePresence mode="wait">
          {activeTab === "bulk" && (
            <motion.div
              key="bulk"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 rounded-2xl border border-white/5 bg-white/2"
            >
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen size={16} className="text-amber-400" />
                <h3 className="font-bold text-white">آپلود چند فایل به‌صورت همزمان</h3>
              </div>
              <BulkUploader songs={songs} onComplete={loadSongs} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Songs list tab */}
        <AnimatePresence mode="wait">
          {activeTab === "songs" && (
            <motion.div
              key="songs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* Search + filter bar */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="جستجوی سرود..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white/3 border border-white/8 rounded-xl pr-9 pl-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 focus:bg-white/5 transition-all"
                    dir="rtl"
                  />
                </div>
                <div className="flex rounded-xl border border-white/8 overflow-hidden">
                  {[
                    { id: "all", label: "همه" },
                    { id: "uploaded", label: "✅ آپلود" },
                    { id: "pending", label: "⏳ انتظار" },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFilterMode(f.id as any)}
                      className={`px-3 py-2 text-xs font-semibold transition-all ${
                        filterMode === f.id
                          ? "bg-amber-500/20 text-amber-300"
                          : "text-slate-500 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={28} className="animate-spin text-amber-400" />
                </div>
              ) : filteredSongs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Music2 size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">سرودی یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredSongs.map(song => (
                    <SongRow
                      key={song.id}
                      song={song}
                      uploadState={uploadStates[song.id]}
                      onUploadFile={handleUploadSingle}
                    />
                  ))}
                </div>
              )}

              {/* Refresh button */}
              <button
                onClick={loadSongs}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/8 text-slate-400 text-sm hover:border-white/15 hover:text-white hover:bg-white/3 transition-all"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                بارگذاری مجدد
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
