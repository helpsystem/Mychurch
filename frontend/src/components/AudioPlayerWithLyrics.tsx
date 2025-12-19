import React, { useEffect, useRef, useState } from "react";

interface LyricPoint {
  time: number;
  word: string;
}

interface Props {
  src: string;
  lyrics?: LyricPoint[];
  text?: string;
  lang?: "fa" | "en";
}

const AudioPlayerWithLyrics: React.FC<Props> = ({ src, lyrics = [], text = "", lang = "fa" }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      let index = lyrics.findIndex(
        (point, i) =>
          currentTime >= point.time &&
          (i === lyrics.length - 1 || currentTime < lyrics[i + 1].time)
      );
      if (index !== -1) setCurrentWordIndex(index);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [lyrics]);

  const words = text.split(/\s+/);

  return (
    <div className="bg-black p-4 rounded-lg shadow-inner border border-gray-700">
      <audio ref={audioRef} src={src} controls className="w-full mb-4" />
      <div
        dir={lang === "fa" ? "rtl" : "ltr"}
        className="text-center text-lg font-medium leading-relaxed text-white"
      >
        {words.map((word, i) => (
          <span
            key={i}
            className={`inline-block px-1 transition-all duration-150 ${
              i === currentWordIndex
                ? "text-yellow-400 font-bold scale-110"
                : "text-gray-300"
            }`}
          >
            {word}{" "}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AudioPlayerWithLyrics;
