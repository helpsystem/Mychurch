import { GoogleGenAI, GenerateContentResponse, Type, Content } from "@google/genai";
import { WHATSAPP_CONNECT_TRIGGER } from "../lib/constants";
import { TTSResponse, ChatMessage } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const chatSystemInstruction = `You are "Al Hayat GPT", an AI assistant for the "Iranian Christian Church of Washington D.C.". Your purpose is to answer questions about Christianity, the Bible, and our church in a helpful, respectful, and theologically sound manner, consistent with mainstream evangelical beliefs. Your tone should be warm, encouraging, and pastoral. When relevant, you can refer to the church by its full name. Never provide medical, legal, or financial advice. If a user asks to speak with a real person, or expresses a need that requires human interaction (like counseling, urgent help, or a personal conversation), you MUST respond with ONLY the exact string "${WHATSAPP_CONNECT_TRIGGER}" and nothing else.`;
const prayerSystemInstruction = "You are a Christian prayer assistant. Based on the user's request, write a short, respectful, and encouraging prayer. The prayer should be comforting and aligned with Christian teachings. Address God directly (e.g., 'Dear Heavenly Father', 'Lord Jesus').";
const contentWriterSystemInstruction = "You are a professional content writer for faith-based organizations. Based on the provided keywords, write a compelling and well-structured 'About Us' text for a Christian church website. The tone should be inviting, professional, and clearly articulate the church's identity and mission.";
const ttsSystemInstruction = `You are a high-quality text-to-speech engine with word timing capabilities. Given a text, you must generate natural-sounding speech and provide precise timing for each word. Respond with a JSON object that strictly adheres to the provided schema. The JSON object must contain two keys: 'audioB64' for the base64-encoded MPEG audio, and 'timedWords' for an array of word-timing objects. Each object in 'timedWords' must have 'word', 'startTime' (in seconds), and 'endTime' (in seconds) properties. Ensure the word timings are accurate and correspond to the generated audio. Do not add any commentary or extra text. Only output the JSON.`;
const notificationImproverSystemInstruction = "You are an expert copy editor for church communications. A user will provide text for a push notification. Your task is to refine it to be clearer, more engaging, and concise, while maintaining a warm and inviting tone appropriate for a church community. If the text is bilingual (e.g., separated by a newline), refine both parts independently. Return only the improved text.";

const ttsResponseSchema = {
  type: Type.OBJECT,
  properties: {
    audioB64: {
      type: Type.STRING,
      description: "The base64 encoded audio data for the entire text in MPEG format.",
    },
    timedWords: {
      type: Type.ARRAY,
      description: "An array of objects, each containing a word and its timing information.",
      items: {
        type: Type.OBJECT,
        required: ["word", "startTime", "endTime"],
        properties: {
          word: {
            type: Type.STRING,
            description: "A single word from the text.",
          },
          startTime: {
            type: Type.NUMBER,
            description: "The start time of the word in the audio, in seconds.",
          },
          endTime: {
            type: Type.NUMBER,
            description: "The end time of the word in the audio, in seconds.",
          },
        },
      },
    },
  },
  required: ["audioB64", "timedWords"],
};


export const geminiService = {
  chatWithAlHayat: async (history: ChatMessage[]): Promise<GenerateContentResponse> => {
    try {
      const contents: Content[] = history
        .filter(msg => !msg.isConnectingToWhatsapp && msg.text)
        .map(msg => ({
            role: msg.sender === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text }],
        }));

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: chatSystemInstruction,
          temperature: 0.7,
          topP: 1,
          topK: 32,
        },
      });
      return response;
    } catch (error) {
      console.error("Error in chatWithAlHayat:", error);
      throw error;
    }
  },

  generatePrayer: async (request: string): Promise<GenerateContentResponse> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: `My prayer request is: ${request}` }] }],
        config: {
          systemInstruction: prayerSystemInstruction,
          temperature: 0.8,
          topP: 1,
          topK: 32,
        },
      });
      return response;
    } catch (error) {
      console.error("Error in generatePrayer:", error);
      throw error;
    }
  },
  
  generateAboutText: async (keywords: string): Promise<GenerateContentResponse> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: `Keywords: ${keywords}` }] }],
            config: {
                systemInstruction: contentWriterSystemInstruction,
                temperature: 0.7,
                topP: 1,
                topK: 40
            }
        });
        return response;
    } catch (error) {
        console.error("Error generating about text:", error);
        throw error;
    }
  },

  textToSpeech: async (text: string): Promise<TTSResponse> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text }] }],
        config: {
          systemInstruction: ttsSystemInstruction,
          responseMimeType: "application/json",
          responseSchema: ttsResponseSchema,
        },
      });

      const jsonText = response.text.trim();
      const parsed = JSON.parse(jsonText);
      
      if (!parsed.audioB64 || !Array.isArray(parsed.timedWords)) {
          throw new Error("Invalid TTS response structure from Gemini.");
      }
      
      return parsed;
    } catch (error) {
      console.error("Error in Gemini textToSpeech:", error);
      throw new Error("Failed to process Text-to-Speech response.");
    }
  },
  
  improveNotificationText: async (text: string): Promise<GenerateContentResponse> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text }] }],
            config: {
                systemInstruction: notificationImproverSystemInstruction,
                temperature: 0.5,
            }
        });
        return response;
    } catch (error) {
        console.error("Error improving notification text:", error);
        throw error;
    }
  },

  generateImage: async (prompt: string): Promise<string> => {
    try {
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: `Christian theme: ${prompt}. Photorealistic, high quality.`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
      }
      throw new Error("No image was generated.");
    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
  }
};