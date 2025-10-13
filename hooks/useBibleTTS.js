import { useState, useCallback, useRef } from 'react';

export const useBibleTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(null);
  const [playbackSettings, setPlaybackSettings] = useState({
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    autoAdvance: true,
    language: 'en' // 'en' or 'fa'
  });

  const speechRef = useRef(null);

  const speakVerse = useCallback((verseText, verseNumber, language = 'en') => {
    if (!verseText || !('speechSynthesis' in window)) return;

    // Cancel any current speech
    speechSynthesis.cancel();

    const speak = () => {
      // Get available voices
      const voices = speechSynthesis.getVoices();
      let selectedVoice = null;

      if (language === 'fa') {
        // Enhanced Persian voice detection
        selectedVoice = voices.find(voice => 
          voice.lang.includes('fa') || 
          voice.lang.includes('fa-IR') ||
          voice.name.toLowerCase().includes('persian') || 
          voice.name.toLowerCase().includes('farsi') ||
          voice.name.includes('زهرا') || // Google Persian voice
          voice.name.includes('Samira') || // Microsoft Persian voice
          voice.name.toLowerCase().includes('iran')
        );
        
        // Fallback: Try Arabic voices (phonetically similar)
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.includes('ar') || 
            voice.name.toLowerCase().includes('arabic')
          );
        }
        
        // Last resort: Use any available voice
        if (!selectedVoice) {
          selectedVoice = voices[0];
          console.warn('⚠️ No Persian or Arabic voice found. Using default voice.');
        }
      } else {
        // Enhanced English voice detection
        selectedVoice = voices.find(voice => 
          voice.lang.startsWith('en-US') || 
          voice.lang.startsWith('en-GB')
        );
        
        // Fallback to any English voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
        }
        
        // Last resort
        if (!selectedVoice) {
          selectedVoice = voices[0];
        }
      }

      console.log('🎙️ TTS Voice Selected:', {
        language,
        voiceName: selectedVoice?.name,
        voiceLang: selectedVoice?.lang,
        totalVoicesAvailable: voices.length
      });

      const utterance = new SpeechSynthesisUtterance(verseText);
      
      // Set voice if available, otherwise use system default
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = language === 'fa' ? 'fa-IR' : 'en-US';
      }
      
      utterance.rate = playbackSettings.rate;
      utterance.pitch = playbackSettings.pitch;
      utterance.volume = playbackSettings.volume;

      utterance.onstart = () => {
        setIsPlaying(true);
        setCurrentVerse({ number: verseNumber, text: verseText, language });
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentVerse(null);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setCurrentVerse(null);
      };

      speechRef.current = utterance;
      speechSynthesis.speak(utterance);
    };

    // Check if voices are loaded, if not wait for them
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.addEventListener('voiceschanged', speak, { once: true });
    } else {
      speak();
    }
  }, [playbackSettings]);

  const speakChapter = useCallback((verses, language = 'en', startFromVerse = 1) => {
    if (!verses || !Array.isArray(verses)) return;

    let currentIndex = startFromVerse - 1;

    const speakNext = () => {
      if (currentIndex >= verses.length) {
        setIsPlaying(false);
        setCurrentVerse(null);
        return;
      }

      const verse = verses[currentIndex];
      const verseText = typeof verse === 'string' ? verse : verse.text;
      const verseNumber = typeof verse === 'string' ? currentIndex + 1 : verse.number;

      if (!verseText || verseText.includes('ترجمه فارسی در حال تکمیل') || verseText.includes('English translation pending')) {
        currentIndex++;
        if (playbackSettings.autoAdvance) {
          setTimeout(speakNext, 100);
        }
        return;
      }

      speakVerse(verseText, verseNumber, language);

      // Auto-advance to next verse when current verse ends
      if (playbackSettings.autoAdvance) {
        const checkEnd = () => {
          if (!speechSynthesis.speaking && !speechSynthesis.pending) {
            currentIndex++;
            setTimeout(speakNext, 500); // Small delay between verses
          } else {
            setTimeout(checkEnd, 100);
          }
        };
        setTimeout(checkEnd, 100);
      }
    };

    speakNext();
  }, [speakVerse, playbackSettings]);

  const pauseSpeech = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.pause();
      setIsPlaying(false);
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPlaying(true);
    }
  }, []);

  const stopSpeech = useCallback(() => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentVerse(null);
  }, []);

  const updateSettings = useCallback((newSettings) => {
    setPlaybackSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    isPlaying,
    currentVerse,
    playbackSettings,
    speakVerse,
    speakChapter,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
    updateSettings,
    isSupported: 'speechSynthesis' in window
  };
};

export default useBibleTTS;