/**
 * Gemini Live Speech-to-Speech & Speech-to-Text Continuous Translation Client
 * Powered by Google's `gemini-3.5-live-translate-preview` over WebSockets.
 */

export interface GeminiLiveCallbacks {
  onOpen?: () => void;
  onClose?: (reason?: string) => void;
  onError?: (error: string) => void;
  onInputTranscript?: (text: string, languageCode?: string) => void;
  onOutputTranscript?: (text: string, languageCode?: string) => void;
  onAudioChunkReceived?: (chunkLength: number) => void;
  onVolumeChange?: (volume: number) => void;
}

export interface GeminiLiveOptions {
  targetLanguageCode: string; // e.g. "en", "fa", "es", "de", "ar"
  echoTargetLanguage?: boolean;
  apiKey?: string; // Optional if using direct key or ephemeral token
  token?: string;
}

export class GeminiLiveTranslator {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private audioQueue: ArrayBuffer[] = [];
  private isPlayingAudio = false;
  private playbackContext: AudioContext | null = null;
  private nextPlayTime = 0;
  private isRunning = false;

  constructor(
    private options: GeminiLiveOptions,
    private callbacks: GeminiLiveCallbacks = {}
  ) {}

  /**
   * Start live translation session: captures mic, connects WebSocket, begins stream
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      // 1. Initialize Microphone at 16kHz for Gemini PCM requirement
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.mediaStream = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 16000 });
      this.playbackContext = new AudioCtx({ sampleRate: 24000 }); // Gemini outputs 24kHz PCM

      // 2. Connect WebSocket
      const keyOrToken = this.options.apiKey || this.options.token;
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(
        keyOrToken || ''
      )}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.sendSetupMessage();
        this.startMicStreaming();
        this.callbacks.onOpen?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (e) {
          console.error('[Gemini Live] Message parse error:', e);
        }
      };

      this.ws.onerror = (event: any) => {
        console.error('[Gemini Live] WebSocket error:', event);
        this.callbacks.onError?.(event?.message || 'WebSocket connection error');
      };

      this.ws.onclose = (event) => {
        this.callbacks.onClose?.(event.reason);
        this.stop();
      };
    } catch (err: any) {
      this.stop();
      this.callbacks.onError?.(err.message || 'Failed to access microphone');
      throw err;
    }
  }

  /**
   * Sends the initial Setup configuration message to Gemini Live API
   */
  private sendSetupMessage(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const setupMessage = {
      setup: {
        model: 'models/gemini-3.5-live-translate-preview',
        generationConfig: {
          responseModalities: ['AUDIO'],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          translationConfig: {
            targetLanguageCode: this.options.targetLanguageCode || 'en',
            echoTargetLanguage: this.options.echoTargetLanguage ?? true,
          },
        },
      },
    };

    this.ws.send(JSON.stringify(setupMessage));
  }

  /**
   * Captures raw 16-bit PCM at 16kHz and streams it to Gemini in 100ms chunks
   */
  private startMicStreaming(): void {
    if (!this.audioContext || !this.mediaStream) return;

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    // Buffer size 2048 at 16kHz is approx ~128ms chunks
    const processor = this.audioContext.createScriptProcessor(2048, 1, 1);
    this.processor = processor;

    processor.onaudioprocess = (e) => {
      if (!this.isRunning || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);

      // Volume calculation for visualizer
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      this.callbacks.onVolumeChange?.(Math.min(1, rms * 5));

      // Convert Float32Array to 16-bit PCM (little-endian)
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      // Convert buffer to base64
      const base64Audio = this.arrayBufferToBase64(pcm16.buffer);

      const audioMessage = {
        realtimeInput: {
          audio: {
            data: base64Audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        },
      };

      this.ws.send(JSON.stringify(audioMessage));
    };

    source.connect(processor);
    processor.connect(this.audioContext.destination);
  }

  /**
   * Handles incoming server messages (transcripts & audio chunks)
   */
  private handleServerMessage(response: any): void {
    if (!response?.serverContent) return;

    const content = response.serverContent;

    // 1. Input Transcript (Original language speaker)
    if (content.inputTranscription?.text) {
      this.callbacks.onInputTranscript?.(
        content.inputTranscription.text,
        content.inputTranscription.languageCode
      );
    }

    // 2. Output Transcript (Translated text)
    if (content.outputTranscription?.text) {
      this.callbacks.onOutputTranscript?.(
        content.outputTranscription.text,
        content.outputTranscription.languageCode
      );
    }

    // 3. Translated Audio Stream (PCM 24kHz)
    if (content.modelTurn?.parts) {
      for (const part of content.modelTurn.parts) {
        if (part.inlineData?.data) {
          const rawBase64 = part.inlineData.data;
          const pcmBuffer = this.base64ToArrayBuffer(rawBase64);
          this.callbacks.onAudioChunkReceived?.(pcmBuffer.byteLength);
          this.queueAudioForPlayback(pcmBuffer);
        }
      }
    }
  }

  /**
   * Queues and seamlessly plays translated 24kHz PCM chunks without gaps
   */
  private queueAudioForPlayback(pcmBuffer: ArrayBuffer): void {
    if (!this.playbackContext) return;

    const int16Array = new Int16Array(pcmBuffer);
    const float32Array = new Float32Array(int16Array.length);

    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = this.playbackContext.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = this.playbackContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.playbackContext.destination);

    const currentTime = this.playbackContext.currentTime;
    if (this.nextPlayTime < currentTime) {
      this.nextPlayTime = currentTime;
    }

    source.start(this.nextPlayTime);
    this.nextPlayTime += audioBuffer.duration;
  }

  /**
   * Updates target language on the fly
   */
  public setTargetLanguage(langCode: string): void {
    this.options.targetLanguageCode = langCode;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSetupMessage();
    }
  }

  /**
   * Stops microphone, WebSocket, and playback context
   */
  public stop(): void {
    this.isRunning = false;

    if (this.processor) {
      try {
        this.processor.disconnect();
      } catch (e) {}
      this.processor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }

    if (this.playbackContext) {
      try {
        this.playbackContext.close();
      } catch (e) {}
      this.playbackContext = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
