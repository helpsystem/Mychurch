/**
 * Gemini Live Speech-to-Speech & Speech-to-Text Continuous Translation Client
 * Powered by Google's `gemini-3.5-live-translate-preview` over WebSockets.
 *
 * v2 Improvements:
 *  - Uses AudioWorkletNode instead of deprecated ScriptProcessorNode
 *  - Auto-reconnect with exponential backoff (max 3 attempts)
 *  - Heartbeat ping every 20s to detect silent disconnects
 *  - onReconnecting & onMaxRetriesReached callbacks
 *  - Cleaner stop() that always fully cleans up
 */

export interface GeminiLiveCallbacks {
  onOpen?: () => void;
  onClose?: (reason?: string) => void;
  onError?: (error: string) => void;
  onReconnecting?: (attempt: number, maxAttempts: number) => void;
  onMaxRetriesReached?: () => void;
  onInputTranscript?: (text: string, languageCode?: string) => void;
  onOutputTranscript?: (text: string, languageCode?: string) => void;
  onAudioChunkReceived?: (chunkLength: number) => void;
  onVolumeChange?: (volume: number) => void;
}

export interface GeminiLiveOptions {
  targetLanguageCode: string; // e.g. "en", "fa", "es", "de", "ar"
  echoTargetLanguage?: boolean;
  apiKey?: string;
  token?: string;
  /** Max reconnect attempts before giving up. Default: 3 */
  maxReconnectAttempts?: number;
}

/** Inline AudioWorklet processor code as a Blob URL to avoid a separate .js file */
const WORKLET_CODE = `
class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._chunkSize = 2048; // ~128ms at 16kHz
  }
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const samples = input[0];
    for (let i = 0; i < samples.length; i++) {
      this._buffer.push(samples[i]);
    }
    while (this._buffer.length >= this._chunkSize) {
      const chunk = this._buffer.splice(0, this._chunkSize);
      this.port.postMessage(new Float32Array(chunk));
    }
    return true;
  }
}
registerProcessor('pcm-capture-processor', PCMCaptureProcessor);
`;

export class GeminiLiveTranslator {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private playbackContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private workletBlobUrl: string | null = null;
  private nextPlayTime = 0;
  private isRunning = false;
  private reconnectAttempts = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly maxReconnects: number;

  constructor(
    private options: GeminiLiveOptions,
    private callbacks: GeminiLiveCallbacks = {}
  ) {
    this.maxReconnects = options.maxReconnectAttempts ?? 3;
  }

  // ─────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.reconnectAttempts = 0;
    await this._initMic();
    await this._connect();
  }

  public stop(): void {
    this.isRunning = false;
    this._clearTimers();
    this._teardownAudio();
    this._closeWs();
  }

  public setTargetLanguage(langCode: string): void {
    this.options.targetLanguageCode = langCode;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this._sendSetup();
    }
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE — INIT & CONNECT
  // ─────────────────────────────────────────────────────────

  private async _initMic(): Promise<void> {
    // Only grab mic once; reuse stream on reconnects
    if (this.mediaStream) return;

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
    this.playbackContext = new AudioCtx({ sampleRate: 24000 }); // Gemini outputs 24kHz
  }

  private async _connect(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const keyOrToken = this.options.apiKey || this.options.token;
      if (!keyOrToken) {
        this.callbacks.onError?.('کلید API یا توکن Gemini یافت نشد.');
        return;
      }

      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(keyOrToken)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        this.reconnectAttempts = 0;
        this._sendSetup();
        await this._startWorkletStreaming();
        this._startHeartbeat();
        this.callbacks.onOpen?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._handleServerMessage(data);
        } catch (e) {
          console.error('[Gemini Live] Message parse error:', e);
        }
      };

      this.ws.onerror = (event: any) => {
        console.error('[Gemini Live] WebSocket error:', event);
        this.callbacks.onError?.(event?.message || 'خطا در اتصال WebSocket');
      };

      this.ws.onclose = (event) => {
        this._clearTimers();
        this._stopWorklet();

        if (!this.isRunning) {
          // Intentional stop
          this.callbacks.onClose?.(event.reason);
          return;
        }

        // Unexpected close → try reconnect
        this._scheduleReconnect(event.reason);
      };
    } catch (err: any) {
      this.callbacks.onError?.(err.message || 'خطا در اتصال');
      this._scheduleReconnect();
    }
  }

  private _scheduleReconnect(reason?: string): void {
    if (!this.isRunning) return;

    if (this.reconnectAttempts >= this.maxReconnects) {
      this.callbacks.onMaxRetriesReached?.();
      this.stop();
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 8000); // 1s, 2s, 4s, 8s cap
    this.callbacks.onReconnecting?.(this.reconnectAttempts, this.maxReconnects);

    console.warn(`[Gemini Live] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnects}). Reason: ${reason}`);

    this.reconnectTimer = setTimeout(async () => {
      await this._connect();
    }, delay);
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE — AUDIO WORKLET (replaces ScriptProcessorNode)
  // ─────────────────────────────────────────────────────────

  private async _startWorkletStreaming(): Promise<void> {
    if (!this.audioContext || !this.mediaStream) return;

    try {
      // Create worklet blob URL once
      if (!this.workletBlobUrl) {
        const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
        this.workletBlobUrl = URL.createObjectURL(blob);
      }

      await this.audioContext.audioWorklet.addModule(this.workletBlobUrl);

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-capture-processor');

      this.workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
        if (!this.isRunning || this.ws?.readyState !== WebSocket.OPEN) return;

        const inputData: Float32Array = event.data;

        // Volume calculation
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        this.callbacks.onVolumeChange?.(Math.min(1, rms * 6));

        // Float32 → PCM16LE
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        const base64Audio = this._arrayBufferToBase64(pcm16.buffer);
        this.ws!.send(JSON.stringify({
          realtimeInput: {
            audio: { data: base64Audio, mimeType: 'audio/pcm;rate=16000' },
          },
        }));
      };

      source.connect(this.workletNode);
      // NOTE: do NOT connect workletNode to destination (no output speaker echo)
    } catch (err) {
      console.error('[Gemini Live] AudioWorklet setup failed:', err);
      this.callbacks.onError?.('خطا در راه‌اندازی ضبط صدا (AudioWorklet)');
    }
  }

  private _stopWorklet(): void {
    if (this.workletNode) {
      try {
        this.workletNode.disconnect();
      } catch (e) {}
      this.workletNode = null;
    }
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE — HEARTBEAT (keep-alive ping every 20s)
  // ─────────────────────────────────────────────────────────

  private _startHeartbeat(): void {
    this._clearTimers();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Gemini Live doesn't have a native ping; send a silent empty realtimeInput
        try {
          this.ws.send(JSON.stringify({ realtimeInput: { activityHandling: 'NO_INTERRUPTION' } }));
        } catch (e) {}
      }
    }, 20_000);
  }

  private _clearTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE — SETUP MESSAGE
  // ─────────────────────────────────────────────────────────

  private _sendSetup(): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
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
    }));
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE — SERVER MESSAGE HANDLER
  // ─────────────────────────────────────────────────────────

  private _handleServerMessage(response: any): void {
    if (!response?.serverContent) return;
    const content = response.serverContent;

    if (content.inputTranscription?.text) {
      this.callbacks.onInputTranscript?.(content.inputTranscription.text, content.inputTranscription.languageCode);
    }

    if (content.outputTranscription?.text) {
      this.callbacks.onOutputTranscript?.(content.outputTranscription.text, content.outputTranscription.languageCode);
    }

    if (content.modelTurn?.parts) {
      for (const part of content.modelTurn.parts) {
        if (part.inlineData?.data) {
          const pcmBuffer = this._base64ToArrayBuffer(part.inlineData.data);
          this.callbacks.onAudioChunkReceived?.(pcmBuffer.byteLength);
          this._queueAudioForPlayback(pcmBuffer);
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE — AUDIO PLAYBACK (24kHz PCM)
  // ─────────────────────────────────────────────────────────

  private _queueAudioForPlayback(pcmBuffer: ArrayBuffer): void {
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

  // ─────────────────────────────────────────────────────────
  // PRIVATE — TEARDOWN
  // ─────────────────────────────────────────────────────────

  private _teardownAudio(): void {
    this._stopWorklet();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      try { this.audioContext.close(); } catch (e) {}
      this.audioContext = null;
    }
    if (this.playbackContext) {
      try { this.playbackContext.close(); } catch (e) {}
      this.playbackContext = null;
    }
    if (this.workletBlobUrl) {
      URL.revokeObjectURL(this.workletBlobUrl);
      this.workletBlobUrl = null;
    }
  }

  private _closeWs(): void {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE — UTILS
  // ─────────────────────────────────────────────────────────

  private _arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private _base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
