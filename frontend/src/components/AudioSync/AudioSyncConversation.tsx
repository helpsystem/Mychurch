import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Icon } from './AudioSyncIcon';

interface WordSegment {
  word: string;
  start_time: number;
  end_time: number;
}

interface TranscriptionResponse {
    transcript: string;
    word_segments: WordSegment[];
}

const FileInput: React.FC<{ onFileSelect: (file: File) => void; disabled: boolean }> = ({ onFileSelect, disabled }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
      <label htmlFor="audio-upload" className={`
        flex flex-col items-center justify-center w-full max-w-md p-10 
        border-2 border-dashed border-gray-600 rounded-xl
        cursor-pointer transition-colors
        ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-teal-400 hover:bg-gray-800/50'}
      `}>
        <Icon name="upload" className="w-16 h-16 mb-4 text-gray-500" />
        <span className="text-xl font-semibold text-gray-400">Click to upload or drag and drop</span>
        <span className="text-sm mt-1">Supports MP3, WAV, M4A, etc.</span>
        <input id="audio-upload" type="file" className="hidden" accept="audio/*" onChange={handleFileChange} disabled={disabled} />
      </label>
    </div>
  );
};

const LoadingIndicator: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
    <svg className="animate-spin h-12 w-12 text-teal-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-xl">{message}</p>
  </div>
);

const TranscriptDisplay: React.FC<{ wordSegments: WordSegment[], currentWordIndex: number }> = ({ wordSegments, currentWordIndex }) => {
    return (
        <p className="text-2xl leading-relaxed font-sans p-8">
            {wordSegments.map((segment, index) => (
                <span key={index} className={index === currentWordIndex ? 'bg-cyan-500/50 rounded-md px-1 transition-all duration-100' : 'transition-all duration-100'}>
                    {segment.word}{' '}
                </span>
            ))}
        </p>
    );
};

export const Conversation: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [audioURL, setAudioURL] = useState<string>('');
    const [wordSegments, setWordSegments] = useState<WordSegment[]>([]);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);

    const audioRef = useRef<HTMLAudioElement>(null);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileSelect = async (selectedFile: File) => {
        if (isProcessing) return;
        
        setFile(selectedFile);
        setAudioURL(URL.createObjectURL(selectedFile));
        setWordSegments([]);
        setError('');
        setCurrentWordIndex(-1);
        setIsProcessing(true);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("VITE_GEMINI_API_KEY environment variable not set");
            }
            const ai = new GoogleGenAI({ apiKey });
            
            const base64Audio = await fileToBase64(selectedFile);
            const audioPart = {
                inlineData: {
                    mimeType: selectedFile.type,
                    data: base64Audio,
                },
            };
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    { parts: [audioPart, { text: "You are an expert audio-to-text synchronization tool. Your task is to transcribe the provided audio and generate word-level timestamps. The output must be in a structured JSON format." }] }
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            transcript: { type: Type.STRING },
                            word_segments: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        word: { type: Type.STRING },
                                        start_time: { type: Type.NUMBER },
                                        end_time: { type: Type.NUMBER },
                                    },
                                    required: ['word', 'start_time', 'end_time']
                                }
                            }
                        },
                        required: ['transcript', 'word_segments']
                    }
                }
            });
            
            const resultJson = response.text;
            const parsedResponse: TranscriptionResponse = JSON.parse(resultJson);

            if (parsedResponse && parsedResponse.word_segments) {
                setWordSegments(parsedResponse.word_segments);
            } else {
                throw new Error("Transcription failed to produce valid word segments.");
            }
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during transcription.';
            setError(`Transcription failed. ${errorMessage}`);
            setFile(null);
            setAudioURL('');
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleTimeUpdate = useCallback(() => {
        if (!audioRef.current || wordSegments.length === 0) return;
        const { currentTime } = audioRef.current;
        
        const newWordIndex = wordSegments.findIndex(segment => 
            currentTime >= segment.start_time && currentTime <= segment.end_time
        );
        
        if (newWordIndex !== -1) {
            setCurrentWordIndex(newWordIndex);
        }

    }, [wordSegments]);
    
    const handleReset = () => {
        setFile(null);
        setAudioURL('');
        setWordSegments([]);
        setError('');
        setCurrentWordIndex(-1);
        setIsProcessing(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        URL.revokeObjectURL(audioURL);
    };

    return (
        <div className="relative flex flex-col h-[70vh]">
            {file && (
                 <div className="p-4 bg-gray-900/70 border-b border-white/10 flex-shrink-0 flex items-center space-x-4">
                    <audio ref={audioRef} src={audioURL} controls onTimeUpdate={handleTimeUpdate} className="w-full" />
                    <button onClick={handleReset} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-sm transition-colors flex-shrink-0">New File</button>
                 </div>
            )}
            <div className="flex-1 overflow-y-auto">
                {!file && !isProcessing && <FileInput onFileSelect={handleFileSelect} disabled={isProcessing} />}
                {isProcessing && <LoadingIndicator message="Transcribing with word-level timing..." />}
                {error && (
                    <div className="flex flex-col items-center justify-center h-full text-red-400 p-8">
                        <p className="text-lg text-center">{error}</p>
                        <button onClick={handleReset} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors">Try Again</button>
                    </div>
                )}
                {wordSegments.length > 0 && !error && <TranscriptDisplay wordSegments={wordSegments} currentWordIndex={currentWordIndex} />}
            </div>
        </div>
    );
};