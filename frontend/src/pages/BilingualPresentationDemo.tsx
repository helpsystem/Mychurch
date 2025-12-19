// BilingualPresentationDemo.tsx
// ------------------------------------------------------------
// Demo page showcasing BilingualBiblePresentation with real data from API
// ------------------------------------------------------------

import React, { useEffect, useState } from "react";
import BilingualBiblePresentation, { BiblePayload } from "@/components/BilingualBiblePresentation";
import { Loader2 } from "lucide-react";
import axios from "axios";

const BilingualPresentationDemo: React.FC = () => {
  const [data, setData] = useState<BiblePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBibleData = async () => {
      try {
        setLoading(true);
        
        // Load a sample book (e.g., Ephesians - EPH)
        const booksResponse = await axios.get("/api/bible/books");
        const booksData = booksResponse.data;
        
        // Handle both array and object responses
        const books = Array.isArray(booksData) ? booksData : (booksData.books || []);
        
        console.log("Books response:", books);
        
        // Find Ephesians (or use first book if not found)
        const ephesians = books.find((b: any) => b.book_iso === "EPH") || books[0];
        
        if (!ephesians) {
          setError("No books found in database");
          return;
        }

        // Load chapters (for Ephesians, we'll load chapter 1)
        const chapters: BiblePayload["chapters"] = [];
        
        for (let chNum = 1; chNum <= 1; chNum++) { // Load just chapter 1 for demo
          const chapterResponse = await axios.get(`/api/bible/content/${ephesians.book_iso}/${chNum}`);
          
          if (chapterResponse.data.success) {
            const verses = chapterResponse.data.verses;
            
            // Transform to BilingualBiblePresentation format
            // از TTS فارسی استفاده می‌شود برای خواندن آیه به آیه
            const transformedVerses = verses.en.map((enVerse: any, idx: number) => ({
              verseNumber: enVerse.verse,
              text_en: enVerse.text,
              text_fa: verses.fa[idx]?.text || "",
              // audio_fa حذف شد تا از TTS فارسی استفاده شود
            }));

            chapters.push({
              chapterNumber: chNum,
              verses: transformedVerses,
            });
          }
        }

        setData({
          book_en: ephesians.book_name,
          book_fa: ephesians.book_name_fa,
          chapters,
        });
      } catch (err: any) {
        console.error("Failed to load Bible data:", err);
        setError(err.message || "Failed to load Bible data");
      } finally {
        setLoading(false);
      }
    };

    loadBibleData();
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-neutral-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-sky-500 mx-auto mb-4" />
          <p className="text-neutral-300 text-lg">Loading Bible content...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-neutral-900">
        <div className="text-center max-w-md p-8 bg-neutral-800 rounded-2xl">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Bible</h2>
          <p className="text-neutral-400">{error || "No data available"}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <BilingualBiblePresentation data={data} autoStart={false} />;
};

export default BilingualPresentationDemo;
