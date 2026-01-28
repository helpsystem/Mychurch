/**
 * 🎬 Broadcast Console Module
 * Export all components, hooks, and services
 * 
 * Features:
 * - 📺 Broadcast Console (Slides, Overlays, Layouts)
 * - 🎵 Karaoke Lyrics with Timing Sync
 * - 🎬 Recording + YouTube Live + Cloud Sync
 * - 🤖 Gemini AI Translation & Search
 * - 💾 Session Storage (Supabase)
 * - 🔌 WebSocket Multi-device Sync
 * - 📊 PowerPoint Export
 */

// Main Components
export { BroadcastConsole } from './BroadcastConsole';
export { SlideBuilder } from './SlideBuilder';
export { LiveConsole } from './LiveConsole';
export { KaraokeLyricsDisplay } from './KaraokeLyricsDisplay';
export { RecordingPanel } from './RecordingPanel';

// Hooks
export { useHybridRecorder } from './useHybridRecorder';
export type { RecordingConfig, YouTubeStreamConfig, CloudSyncConfig, RecordingState } from './useHybridRecorder';
export { useWebSocketSync } from './useWebSocketSync';
export type { SyncMessage, ConnectedDevice, SyncState, UseWebSocketSyncOptions } from './useWebSocketSync';

// Services
export * from './types';
export * from './dataService';
export * as geminiService from './geminiService';
export * as sessionStorage from './sessionStorage';
export * as pptxExport from './pptxExport';
