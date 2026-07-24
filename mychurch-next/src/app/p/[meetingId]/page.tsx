"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { createClient } from "@/utils/supabase/client";

export default function PublicPresentation({ params }: { params: Promise<{ meetingId: string }> }) {
  const [meetingId, setMeetingId] = useState<string>("");
  const { t, isRTL } = useLanguage();
  const [captions, setCaptions] = useState<{original: string, translated: string}[]>([]);
  const [liveText, setLiveText] = useState("");

  useEffect(() => {
    params.then(p => setMeetingId(p.meetingId));
  }, [params]);

  useEffect(() => {
    if (!meetingId) return;
    
    const supabase = createClient();
    const channelName = `broadcast-remote-${meetingId}`;
    
    const channel = supabase.channel(channelName, {
        config: { broadcast: { self: false } }
    });

    channel
        .on('broadcast', { event: 'sync-event' }, (payload) => {
            const data = payload.payload;
            if (!data) return;

            if (data.type === 'SET_LIVE_TRANSLATION') {
                if (data.show && data.text) {
                    setLiveText(data.text);
                    // Add to history if there is a pause (heuristic: we can just add to history when text changes drastically, but for now we just show live text)
                    setCaptions((prev) => [...prev, { original: data.text, translated: "" }]);
                } else {
                    setLiveText("");
                }
            }
        })
        .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [meetingId]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-[100dvh] font-[Vazirmatn]">
      <header className="mb-8 border-b pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black text-neutral-900">📺 پخش زنده جلسه</h1>
        <div className="flex items-center gap-2">
            <span className="flex relative w-3 h-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-bold text-red-600">LIVE</span>
        </div>
      </header>

      {/* History Area */}
      <div className="space-y-6 mb-8 pb-32">
        {captions.map((cap, index) => (
          <div key={index} className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 shadow-sm transition-all hover:shadow-md">
            <p className="text-xl font-medium text-neutral-900 text-right leading-loose" dir="rtl">{cap.original}</p>
            {cap.translated && (
              <div className="mt-4 pt-4 border-t border-neutral-200/60">
                <p className="text-lg text-blue-700 font-medium text-left leading-relaxed font-sans" dir="ltr">{cap.translated}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Live typing area floating at bottom */}
      {liveText && (
        <div className="fixed bottom-6 left-6 right-6 max-w-4xl mx-auto p-5 bg-blue-50/90 backdrop-blur-md border-l-4 border-blue-500 rounded-2xl shadow-xl animate-pulse z-50">
          <p className="text-xl font-bold text-blue-900 text-right leading-loose" dir="rtl">{liveText} ...</p>
        </div>
      )}
    </div>
  );
}
