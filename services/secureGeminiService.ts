// Secure Gemini Service - Frontend calls backend API endpoints
// Replaces the insecure direct Gemini API calls

import { ChatMessage, TTSResponse } from '../types';

const API_BASE = process.env.VITE_API_BASE || '/api';

export const secureGeminiService = {
  chatWithAlHayat: async (history: ChatMessage[]) => {
    try {
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { text: data.text };
    } catch (error) {
      console.error('Error in chatWithAlHayat:', error);
      throw error;
    }
  },

  generatePrayer: async (request: string) => {
    try {
      const response = await fetch(`${API_BASE}/ai/generate-prayer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { text: data.text };
    } catch (error) {
      console.error('Error in generatePrayer:', error);
      throw error;
    }
  },

  generateAboutText: async (keywords: string) => {
    try {
      const response = await fetch(`${API_BASE}/ai/generate-about`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { text: data.text };
    } catch (error) {
      console.error('Error generating about text:', error);
      throw error;
    }
  },

  textToSpeech: async (text: string): Promise<TTSResponse> => {
    try {
      const response = await fetch(`${API_BASE}/ai/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in textToSpeech:', error);
      throw error;
    }
  },

  improveNotificationText: async (text: string) => {
    try {
      const response = await fetch(`${API_BASE}/ai/improve-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { text: data.text };
    } catch (error) {
      console.error('Error improving notification text:', error);
      throw error;
    }
  },

  generateImage: async (prompt: string): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE}/ai/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.imageUrl || '';
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }
};