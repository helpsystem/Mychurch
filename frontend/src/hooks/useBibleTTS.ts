import { useState, useCallback, useRef, useEffect } from 'react';

interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

interface UseBibleTTSReturn {
  isPlaying: boolean;
  isPaused: boolean;
  currentVerse: number | null;
  currentWord: number | null;
  progress: number;
  playVerse: (verseText: string, verseNumber: number, options?: TTSOptions) => void;
  playChapter: (verses: string[], options?: TTSOptions) => void;
  pauseAudio: () => void;
  resumeAudio: () => void;
  stopAudio: () => void;
  setSpeed: (rate: number) => void;
  setVoice: (voice: SpeechSynthesisVoice | null) => void;
  getAvailableVoices: () => SpeechSynthesisVoice[];
  getCurrentSettings: () => TTSOptions;
}

const useBibleTTS = (): UseBibleTTSReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);
  const [currentWord, setCurrentWord] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const settingsRef = useRef<TTSOptions>({
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voice: null
  });

  // Check if speech synthesis is supported
  const isSpeechSupported = 'speechSynthesis' in window;

  // Get available voices
  const getAvailableVoices = useCallback((): SpeechSynthesisVoice[] => {
    if (!isSpeechSupported) return [];
    return speechSynthesis.getVoices();
  }, [isSpeechSupported]);

  // Update available voices when they're loaded
  useEffect(() => {
    if (!isSpeechSupported) return;

    const updateVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0 && !settingsRef.current.voice) {
        // Try to find Persian or Arabic voice, fallback to default
        const persianVoice = voices.find(voice => 
          voice.lang.includes('fa') || voice.lang.includes('per')
        );
        const arabicVoice = voices.find(voice => 
          voice.lang.includes('ar')
        );
        const englishVoice = voices.find(voice => 
          voice.lang.includes('en')
        );
        
        settingsRef.current.voice = persianVoice || arabicVoice || englishVoice || voices[0];
      }
    };

    updateVoices();
    speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, [isSpeechSupported]);

  // Stop any current speech
  const stopAudio = useCallback(() => {
    if (!isSpeechSupported) return;
    
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentVerse(null);
    setCurrentWord(null);
    setProgress(0);
    utteranceRef.current = null;
  }, [isSpeechSupported]);

  // Pause speech
  const pauseAudio = useCallback(() => {
    if (!isSpeechSupported || !isPlaying) return;
    
    speechSynthesis.pause();
    setIsPaused(true);
  }, [isSpeechSupported, isPlaying]);

  // Resume speech
  const resumeAudio = useCallback(() => {
    if (!isSpeechSupported || !isPaused) return;
    
    speechSynthesis.resume();
    setIsPaused(false);
  }, [isSpeechSupported, isPaused]);

  // Play a single verse
  const playVerse = useCallback((verseText: string, verseNumber: number, options?: TTSOptions) => {
    if (!isSpeechSupported || !verseText.trim()) return;

    // Stop any current speech
    stopAudio();

    const utterance = new SpeechSynthesisUtterance(verseText);
    
    // Apply settings
    const settings = { ...settingsRef.current, ...options };
    utterance.rate = settings.rate || 1.0;
    utterance.pitch = settings.pitch || 1.0;
    utterance.volume = settings.volume || 1.0;
    if (settings.voice) {
      utterance.voice = settings.voice;
    }

    // Set language based on content
    if (verseText.match(/[\u0600-\u06FF]/)) {
      utterance.lang = 'fa-IR'; // Persian
    } else if (verseText.match(/[\u0590-\u05FF]/)) {
      utterance.lang = 'he-IL'; // Hebrew
    } else if (verseText.match(/[\u0621-\u064A]/)) {
      utterance.lang = 'ar-SA'; // Arabic
    } else {
      utterance.lang = 'en-US'; // English
    }

    // Event handlers
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentVerse(verseNumber);
      setProgress(0);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentVerse(null);
      setProgress(100);
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      stopAudio();
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    // Boundary events for word highlighting (if supported)
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setCurrentWord(event.charIndex);
        // Calculate rough progress based on character position
        const progressPercent = (event.charIndex / verseText.length) * 100;
        setProgress(Math.min(progressPercent, 100));
      }
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [isSpeechSupported, stopAudio]);

  // Play entire chapter
  const playChapter = useCallback((verses: string[], options?: TTSOptions) => {
    if (!isSpeechSupported || !verses.length) return;

    let currentVerseIndex = 0;

    const playNextVerse = () => {
      if (currentVerseIndex < verses.length) {
        const verseText = verses[currentVerseIndex];
        const verseNumber = currentVerseIndex + 1;
        
        playVerse(verseText, verseNumber, options);
        
        // Set up listener for when this verse ends
        const checkForEnd = () => {
          if (!speechSynthesis.speaking && !speechSynthesis.pending) {
            currentVerseIndex++;
            setTimeout(playNextVerse, 500); // Short pause between verses
          } else {
            setTimeout(checkForEnd, 100);
          }
        };
        
        setTimeout(checkForEnd, 100);
      }
    };

    // Stop any current speech and start from first verse
    stopAudio();
    playNextVerse();
  }, [isSpeechSupported, playVerse, stopAudio]);

  // Update speech rate
  const setSpeed = useCallback((rate: number) => {
    settingsRef.current.rate = Math.max(0.1, Math.min(3.0, rate));
    
    // If currently speaking, we need to restart with new rate
    if (isPlaying && utteranceRef.current && currentVerse) {
      const currentText = utteranceRef.current.text;
      stopAudio();
      playVerse(currentText, currentVerse);
    }
  }, [isPlaying, currentVerse, stopAudio, playVerse]);

  // Update voice
  const setVoice = useCallback((voice: SpeechSynthesisVoice | null) => {
    settingsRef.current.voice = voice;
  }, []);

  // Get current settings
  const getCurrentSettings = useCallback((): TTSOptions => {
    return { ...settingsRef.current };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    isPlaying,
    isPaused,
    currentVerse,
    currentWord,
    progress,
    playVerse,
    playChapter,
    pauseAudio,
    resumeAudio,
    stopAudio,
    setSpeed,
    setVoice,
    getAvailableVoices,
    getCurrentSettings
  };
};

export default useBibleTTS;