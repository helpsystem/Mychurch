"use client";

import { useState } from "react";
import { Upload, FileAudio, PlayCircle, Trash2 } from "lucide-react";

export default function TelegramTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please provide a file");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);

      const response = await fetch("/api/telegram/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data.telegramFile);
        setFile(null);
        setTitle("");
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Telegram CDN Studio</h1>
        <p className="text-muted-foreground">Upload and stream media directly from Telegram Cloud Storage with Zero-Cost bandwidth.</p>
      </div>

      <div className="border rounded-xl p-6 bg-card shadow-sm">
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">File Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sunday Worship Audio"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Media File</label>
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full flex justify-center items-center gap-2 h-10 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4" />
            {loading ? "Uploading to Telegram Server..." : "Upload to Cloud"}
          </button>
        </form>
      </div>

      {result && (
        <div className="border rounded-xl p-6 bg-green-500/10 border-green-500/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-full">
              <FileAudio className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-700">Upload Successful!</h3>
              <p className="text-sm text-green-600/80">File is securely stored on Telegram Servers.</p>
            </div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              className="flex justify-center items-center gap-2 h-10 px-4 py-2 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800"
              onClick={() => window.open(`/api/telegram/media/${result.fileId}`, '_blank')}
            >
              <PlayCircle className="h-4 w-4" />
              Test Stream (Proxy)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
