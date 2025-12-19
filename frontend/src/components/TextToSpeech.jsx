import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Volume2, Settings, SkipForward, SkipBack } from 'lucide-react';

const TextToSpeech = ({ 
  text, 
  language = 'en', 
  className = '',
  autoPlay = false,
  showControls = true,
  onWordHighlight = null 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [words, setWords] = useState([]);
  const [isSupported, setIsSupported] = useState(false);

  const speechRef = useRef(null);
  const timeoutRef = useRef(null);
  const wordTimingsRef = useRef([]);

  // Check if speech synthesis is supported
  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Auto-select best voice for the language
      const preferredVoice = availableVoices.find(voice => {
        if (language === 'fa') {
          return voice.lang.includes('fa') || voice.name.toLowerCase().includes('persian') || voice.name.toLowerCase().includes('farsi');
        }
        return voice.lang.startsWith(language);
      });
      
      if (preferredVoice) {
        setSelectedVoice(preferredVoice);
      } else if (availableVoices.length > 0) {
        // Fallback to first available voice
        setSelectedVoice(availableVoices[0]);
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported, language]);

  // Process text into words with timings
  const processText = useCallback(() => {
    if (!text) return;

    // Split text into words, preserving Persian text direction
    const wordList = text.split(/\s+/).filter(word => word.trim().length > 0);
    setWords(wordList);

    // Estimate word timings (will be refined during actual speech)
    const avgWordDuration = 600; // milliseconds per word
    const timings = wordList.map((word, index) => ({
      word,
      startTime: index * avgWordDuration,
      duration: avgWordDuration,
      index
    }));
    
    wordTimingsRef.current = timings;
  }, [text]);

  useEffect(() => {
    processText();
  }, [processText]);

  // Enhanced speech with word boundary detection
  const speak = useCallback((startFromIndex = 0) => {
    if (!isSupported || !text) return;

    // Stop any current speech
    speechSynthesis.cancel();
    
    // Create utterance from specified word index
    const wordsToSpeak = words.slice(startFromIndex);
    const textToSpeak = wordsToSpeak.join(' ');
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Set voice if available, otherwise use system default
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = language === 'fa' ? 'fa-IR' : 'en-US';
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Precompute character positions for robust boundary detection
    const wordCharPositions = [];
    let charPos = 0;
    wordsToSpeak.forEach((word, index) => {
      wordCharPositions.push({
        wordIndex: startFromIndex + index,
        startChar: charPos,
        endChar: charPos + word.length,
        word: word
      });
      charPos += word.length + 1; // +1 for space
    });

    // Handle word boundaries for highlighting using character index
    utterance.onboundary = (event) => {
      if (event.name === 'word' || event.charIndex !== undefined) {
        const charIndex = event.charIndex || 0;
        
        // Find word based on character position (using half-open range)
        const wordPosition = wordCharPositions.find(pos => 
          charIndex >= pos.startChar && charIndex < pos.endChar
        );
        
        if (wordPosition) {
          const absoluteWordIndex = wordPosition.wordIndex;
          
          // Update word timings
          if (absoluteWordIndex < words.length) {
            wordTimingsRef.current[absoluteWordIndex] = {
              ...wordTimingsRef.current[absoluteWordIndex],
              actualStartTime: Date.now()
            };
            
            setCurrentWordIndex(absoluteWordIndex);
            
            if (onWordHighlight) {
              onWordHighlight(absoluteWordIndex, words[absoluteWordIndex]);
            }
          }
        }
      }
    };

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentWordIndex(startFromIndex);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
    };

    speechRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [isSupported, text, selectedVoice, rate, pitch, volume, words, onWordHighlight, language]);

  // Control functions
  const handlePlay = () => {
    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      speak();
    }
  };

  const handlePause = () => {
    if (isPlaying) {
      speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
  };

  const handleSkipWord = (direction) => {
    const newIndex = direction === 'forward' 
      ? Math.min(currentWordIndex + 1, words.length - 1)
      : Math.max(currentWordIndex - 1, 0);
    
    // Restart speech from new position using improved speak function
    if (isPlaying || isPaused) {
      speak(newIndex);
    } else {
      setCurrentWordIndex(newIndex);
    }
  };

  // Auto-play effect
  useEffect(() => {
    if (autoPlay && text && selectedVoice && !isPlaying) {
      handlePlay();
    }
  }, [autoPlay, text, selectedVoice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
        متاسفانه مرورگر شما از تکنولوژی تبدیل متن به گفتار پشتیبانی نمی‌کند
      </div>
    );
  }

  const renderHighlightedText = () => {
    if (!text || words.length === 0) return text;

    return (
      <div className={`text-content ${language === 'fa' ? 'rtl' : 'ltr'}`} dir={language === 'fa' ? 'rtl' : 'ltr'}>
        {words.map((word, index) => (
          <span
            key={index}
            className={`word-highlight ${
              index === currentWordIndex 
                ? 'bg-yellow-300 text-yellow-900 font-bold shadow-sm' 
                : 'hover:bg-gray-100'
            } transition-all duration-200 rounded px-1 mx-0.5 cursor-pointer`}
            onClick={() => {
              if (isPlaying || isPaused) {
                speak(index);
              } else {
                setCurrentWordIndex(index);
              }
            }}
          >
            {word}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={`text-to-speech-container ${className}`}>
      {/* Text with highlighting */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border text-lg leading-relaxed">
        {renderHighlightedText()}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="controls bg-white rounded-lg border p-4 shadow-sm">
          {/* Main Controls */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={() => handleSkipWord('backward')}
              disabled={currentWordIndex <= 0}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="کلمه قبل"
            >
              <SkipBack size={20} />
            </button>

            {!isPlaying ? (
              <button
                onClick={handlePlay}
                className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                title="پخش"
              >
                <Play size={24} />
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                title="مکث"
              >
                <Pause size={24} />
              </button>
            )}

            <button
              onClick={handleStop}
              className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
              title="توقف"
            >
              <Square size={20} />
            </button>

            <button
              onClick={() => handleSkipWord('forward')}
              disabled={currentWordIndex >= words.length - 1}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="کلمه بعد"
            >
              <SkipForward size={20} />
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              title="تنظیمات"
            >
              <Settings size={20} />
            </button>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>پیشرفت: {currentWordIndex + 1} از {words.length} کلمه</span>
              <span>{Math.round(((currentWordIndex + 1) / words.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentWordIndex + 1) / words.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="settings-panel bg-gray-50 rounded p-4 space-y-4">
              {/* Voice Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">انتخاب صدا:</label>
                <select
                  value={selectedVoice?.name || ''}
                  onChange={(e) => {
                    const voice = voices.find(v => v.name === e.target.value);
                    setSelectedVoice(voice);
                  }}
                  className="w-full p-2 border rounded"
                >
                  {voices
                    .filter(voice => language === 'fa' 
                      ? voice.lang.includes('fa') || voice.name.toLowerCase().includes('persian') || voice.name.toLowerCase().includes('farsi')
                      : voice.lang.startsWith(language) || voice.lang.includes('en')
                    )
                    .map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Rate Control */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  سرعت: {rate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Pitch Control */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  زیر و بمی: {pitch.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Volume Control */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Volume2 size={16} className="inline mr-1" />
                  صدا: {Math.round(volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .text-content {
          line-height: 1.8;
          font-size: 1.1rem;
        }
        .word-highlight {
          display: inline-block;
          margin: 2px;
          border-radius: 4px;
        }
        .rtl {
          direction: rtl;
          text-align: right;
        }
        .ltr {
          direction: ltr;
          text-align: left;
        }
      `}</style>
    </div>
  );
};

export default TextToSpeech;