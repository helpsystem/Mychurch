import React, { useEffect, useRef, useState } from 'react';

type LyricPoint = { time: number; word: string };

interface Props {
  youtubeId: string;
  lyrics?: LyricPoint[];
  text?: string;
  lang?: 'fa' | 'en';
  hideVideo?: boolean; // if true, keep audio-only style (video off-screen)
}

// Lightweight YouTube IFrame API integration with optional lyric highlighting
const YouTubePlayerWithLyrics: React.FC<Props> = ({ youtubeId, lyrics = [], text = '', lang = 'fa', hideVideo = false }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const intervalRef = useRef<number | null>(null);

  // Load YT IFrame API once
  useEffect(() => {
    const ensureApi = () => new Promise<void>((resolve) => {
      if ((window as any).YT && (window as any).YT.Player) return resolve();
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = () => resolve();
    });

    let disposed = false;
    ensureApi().then(() => {
      if (disposed || !containerRef.current) return;
      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        videoId: youtubeId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onStateChange: () => {
            // Start/stop polling current time
            const YT = (window as any).YT;
            if (playerRef.current?.getPlayerState?.() === YT.PlayerState.PLAYING) {
              if (intervalRef.current) window.clearInterval(intervalRef.current);
              intervalRef.current = window.setInterval(() => {
                const t = playerRef.current?.getCurrentTime?.() ?? 0;
                if (lyrics.length) {
                  const idx = lyrics.findIndex((p: LyricPoint, i: number) => t >= p.time && (i === lyrics.length - 1 || t < lyrics[i + 1].time));
                  if (idx !== -1 && idx !== currentIndex) setCurrentIndex(idx);
                }
              }, 200);
            } else {
              if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          },
        },
      });
    });

    return () => {
      disposed = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      try { playerRef.current?.destroy?.(); } catch {}
    };
  }, [youtubeId]);

  const words = (text || '').split(/\s+/);
  const [loadError, setLoadError] = useState(false);

  // Detect if iframe fails to load after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current && !containerRef.current.querySelector('iframe')) {
        setLoadError(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [youtubeId]);

  return (
    <div className="bg-black p-4 rounded-lg border border-gray-700">
      <div className={hideVideo ? 'sr-only' : ''}>
        <div
          ref={containerRef}
          className="w-full aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center"
        >
          {loadError && (
            <div className="text-center p-8">
              <p className="text-gray-400 mb-4">ویدیو در این مرورگر قابل نمایش نیست</p>
              <a
                href={`https://www.youtube.com/watch?v=${youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                🎥 مشاهده در یوتیوب
              </a>
            </div>
          )}
        </div>
      </div>

      {!!text && (
        <div
          dir={lang === 'fa' ? 'rtl' : 'ltr'}
          className="mt-4 text-center text-xl leading-relaxed text-gray-200"
        >
          {words.map((w, i) => (
            <span
              key={i}
              className={`inline-block px-1 ${i === currentIndex ? 'text-yellow-400 font-bold' : ''}`}
            >
              {w}{' '}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default YouTubePlayerWithLyrics;
