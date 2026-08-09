"use client";

import React, { useEffect, useRef } from "react";

export function PingPongVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let reverseInterval: NodeJS.Timeout;

    const handleTimeUpdate = () => {
      if (!video.duration) return;

      // When reaching the end playing forward
      if (video.playbackRate > 0 && video.currentTime >= video.duration - 0.15) {
        try {
          video.playbackRate = -1; // Works in some versions of Chrome/Firefox
        } catch (e) {
          // Safari throws error on negative playback rate
        }

        // If native reverse didn't work (browser doesn't support it)
        if (video.playbackRate > 0) {
          video.pause();
          clearInterval(reverseInterval);
          // Fallback: manually scrub backwards
          reverseInterval = setInterval(() => {
            if (!video) return;
            video.currentTime -= 0.05; // ~20fps backward scrub
            if (video.currentTime <= 0.15) {
              clearInterval(reverseInterval);
              video.play(); // Play forward again
            }
          }, 50);
        }
      }
      // When reaching the beginning playing backward (if native reverse worked)
      else if (video.playbackRate < 0 && video.currentTime <= 0.15) {
        video.playbackRate = 1;
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      clearInterval(reverseInterval);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      poster={poster}
      className={className}
      // Using metadata preload to improve initial page load speed
      preload="metadata"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
