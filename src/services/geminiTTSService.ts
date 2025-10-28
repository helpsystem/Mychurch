/**
 * Gemini 2.5 Flash TTS Service
 * Text-to-Speech using Google Gemini AI Studio API
 */

import { GoogleGenAI, Modality } from "@google/genai";

// Voice options for Gemini TTS
export enum VoiceName {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

// API Key - در محیط production باید از environment variable استفاده شود
const GEMINI_API_KEY = 'AIzaSyCTzZgnzvWcxd6KirJbc2sbaryFr14TrKg';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export interface TTSResult {
  audioData: string; // base64 audio
  error?: string;
}

/**
 * Generate speech from text using Gemini TTS
 */
export async function generateSpeech(text: string, voice: VoiceName = VoiceName.Zephyr): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("API key is not configured. Please set the GEMINI_API_KEY.");
  }

  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty");
  }

  try {
    console.log(`🎤 Generating speech with Gemini TTS...`);
    console.log(`Text: ${text.substring(0, 50)}...`);
    console.log(`Voice: ${voice}`);

    // Prepare prompt for Gemini
    const prompt = `Say: ${text}`;

    // Call Gemini API with TTS model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    // Extract audio data from response
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from the API.");
    }

    console.log(`✅ Speech generated successfully`);
    return base64Audio;

  } catch (error) {
    console.error("Error generating speech:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate speech: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating speech.");
  }
}

/**
 * Decode base64 string to Uint8Array
 */
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decode raw PCM audio data into AudioBuffer
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
