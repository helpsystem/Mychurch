import { useState, useCallback, useRef, useEffect } from 'react';

export interface TTSOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
  onStart?: () => void;
  onError?: (error: Error) => void;
}

export interface TTSControls {
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
}

export function useTTS(options: TTSOptions = {}): TTSControls {
  const {
    lang = 'fa-IR',
    rate = 1,
    pitch = 1,
    volume = 1,
    onEnd,
    onStart,
    onError,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if speech synthesis is supported
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) {
        console.warn('Speech synthesis is not supported in this browser');
        return;
      }

      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        onStart?.();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        onEnd?.();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        setIsPaused(false);
        const error = new Error(`Speech synthesis error: ${event.error}`);
        onError?.(error);
        console.error(error);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, lang, rate, pitch, volume, onStart, onEnd, onError]
  );

  const pause = useCallback(() => {
    if (!isSupported) return;

    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;

    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    isSupported,
  };
}
