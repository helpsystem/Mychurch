/**
 * 🎬 Recording Panel Component
 * 
 * پنل کنترل ضبط ویدیو، لایو استریم یوتیوب و سینک کلود
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  Video, VideoOff, Circle, Square, Pause, Play,
  Upload, Save, Youtube, HardDrive, Cloud, CloudOff,
  Settings, AlertCircle, CheckCircle2, Loader2,
  MonitorPlay, Wifi, WifiOff
} from 'lucide-react';
import { useHybridRecorder, YouTubeStreamConfig, CloudSyncConfig } from './useHybridRecorder';
import { AppLanguage } from './types';

interface RecordingPanelProps {
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  audioStream?: MediaStream;
  lang: AppLanguage;
}

const TRANSLATIONS = {
  fa: {
    recording: 'ضبط',
    startRecording: 'شروع ضبط',
    stopRecording: 'توقف ضبط',
    pauseRecording: 'وقفه',
    resumeRecording: 'ادامه',
    streaming: 'استریم',
    startStreaming: 'شروع لایو',
    stopStreaming: 'پایان لایو',
    save: 'ذخیره',
    saveLocal: 'ذخیره محلی',
    syncCloud: 'سینک کلود',
    settings: 'تنظیمات',
    duration: 'مدت',
    status: 'وضعیت',
    ready: 'آماده',
    recording_status: 'در حال ضبط',
    paused: 'متوقف شده',
    streaming_status: 'در حال پخش',
    saved: 'ذخیره شد',
    uploading: 'در حال آپلود',
    synced: 'سینک شد',
    error: 'خطا',
    youtubeKey: 'کلید استریم یوتیوب',
    hidriveToken: 'توکن HiDrive',
    googleToken: 'توکن Google Drive',
    enterYoutubeKey: 'کلید استریم یوتیوب را وارد کنید',
    noRecording: 'ضبطی وجود ندارد',
    connected: 'متصل',
    disconnected: 'قطع',
    live: 'زنده',
  },
  en: {
    recording: 'Recording',
    startRecording: 'Start Recording',
    stopRecording: 'Stop Recording',
    pauseRecording: 'Pause',
    resumeRecording: 'Resume',
    streaming: 'Streaming',
    startStreaming: 'Go Live',
    stopStreaming: 'End Stream',
    save: 'Save',
    saveLocal: 'Save Local',
    syncCloud: 'Cloud Sync',
    settings: 'Settings',
    duration: 'Duration',
    status: 'Status',
    ready: 'Ready',
    recording_status: 'Recording',
    paused: 'Paused',
    streaming_status: 'Streaming',
    saved: 'Saved',
    uploading: 'Uploading',
    synced: 'Synced',
    error: 'Error',
    youtubeKey: 'YouTube Stream Key',
    hidriveToken: 'HiDrive Token',
    googleToken: 'Google Drive Token',
    enterYoutubeKey: 'Enter YouTube stream key',
    noRecording: 'No recording available',
    connected: 'Connected',
    disconnected: 'Disconnected',
    live: 'LIVE',
  }
};

export const RecordingPanel: React.FC<RecordingPanelProps> = ({
  canvasRef,
  audioStream,
  lang
}) => {
  const t = TRANSLATIONS[lang];
  const isRTL = lang === 'fa';
  
  const {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    saveLocal,
    startYouTubeStream,
    stopYouTubeStream,
    syncToCloud,
  } = useHybridRecorder();
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [youtubeStreamKey, setYoutubeStreamKey] = useState('');
  const [hidriveToken, setHidriveToken] = useState('');
  const [googleToken, setGoogleToken] = useState('');
  const [cloudProvider, setCloudProvider] = useState<'hidrive' | 'googledrive' | 'both'>('hidrive');
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle recording
  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording(canvasRef?.current || undefined, audioStream);
    } catch (err) {
      console.error('Recording start error:', err);
    }
  }, [startRecording, canvasRef, audioStream]);
  
  const handleStopRecording = useCallback(async () => {
    await stopRecording();
  }, [stopRecording]);
  
  // Handle streaming
  const handleStartStreaming = useCallback(async () => {
    if (!youtubeStreamKey) {
      alert(t.enterYoutubeKey);
      setShowSettings(true);
      return;
    }
    
    const config: YouTubeStreamConfig = {
      streamKey: youtubeStreamKey,
    };
    
    await startYouTubeStream(config);
  }, [youtubeStreamKey, startYouTubeStream, t.enterYoutubeKey]);
  
  // Handle cloud sync
  const handleCloudSync = useCallback(async () => {
    const config: CloudSyncConfig = {
      provider: cloudProvider,
      hidriveAccessToken: hidriveToken,
      googleAccessToken: googleToken,
    };
    
    await syncToCloud(config);
  }, [cloudProvider, hidriveToken, googleToken, syncToCloud]);
  
  // Get status color
  const getStatusColor = () => {
    if (state.error) return 'text-red-500';
    if (state.isStreaming) return 'text-red-500';
    if (state.isRecording) return 'text-emerald-500';
    return 'text-slate-400';
  };
  
  // Get status text
  const getStatusText = () => {
    if (state.error) return t.error;
    if (state.isStreaming) return t.streaming_status;
    if (state.isPaused) return t.paused;
    if (state.isRecording) return t.recording_status;
    return t.ready;
  };

  return (
    <div 
      className={`bg-slate-900/95 backdrop-blur rounded-xl border border-slate-700 p-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-red-500" />
          <span className="font-bold text-white">{t.recording}</span>
          
          {/* Live Badge */}
          {state.isStreaming && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full animate-pulse">
              <Circle className="w-2 h-2 fill-current" />
              {t.live}
            </span>
          )}
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-700"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
      
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-4 p-2 bg-slate-800 rounded-lg">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            state.isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-600'
          }`} />
          <span className={`text-sm ${getStatusColor()}`}>{getStatusText()}</span>
        </div>
        
        <span className="text-white font-mono text-lg">
          {formatDuration(state.duration)}
        </span>
      </div>
      
      {/* Recording Controls */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {!state.isRecording ? (
          <button
            onClick={handleStartRecording}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
          >
            <Circle className="w-4 h-4 fill-current" />
            {t.startRecording}
          </button>
        ) : (
          <>
            <button
              onClick={handleStopRecording}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-red-800 hover:bg-red-700 text-white rounded-lg transition"
            >
              <Square className="w-4 h-4 fill-current" />
              {t.stopRecording}
            </button>
            
            <button
              onClick={state.isPaused ? resumeRecording : pauseRecording}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              {state.isPaused ? (
                <>
                  <Play className="w-4 h-4" />
                  {t.resumeRecording}
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  {t.pauseRecording}
                </>
              )}
            </button>
          </>
        )}
        
        {!state.isRecording && (
          <div /> // Empty cell
        )}
      </div>
      
      {/* Streaming Controls */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Youtube className="w-4 h-4 text-red-500" />
          <span className="text-sm text-slate-400">{t.streaming}</span>
          
          {/* Connection status */}
          <span className={`text-xs px-2 py-0.5 rounded ${
            state.youtubeStatus === 'streaming' 
              ? 'bg-red-500/20 text-red-400' 
              : state.youtubeStatus === 'connecting'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-slate-700 text-slate-400'
          }`}>
            {state.youtubeStatus === 'streaming' && (
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                {t.connected}
              </span>
            )}
            {state.youtubeStatus === 'connecting' && (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Connecting...
              </span>
            )}
            {state.youtubeStatus === 'idle' && (
              <span className="flex items-center gap-1">
                <WifiOff className="w-3 h-3" />
                {t.disconnected}
              </span>
            )}
          </span>
        </div>
        
        {!state.isStreaming ? (
          <button
            onClick={handleStartStreaming}
            disabled={!state.isRecording}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-600/80 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition"
          >
            <MonitorPlay className="w-4 h-4" />
            {t.startStreaming}
          </button>
        ) : (
          <button
            onClick={stopYouTubeStream}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-800 hover:bg-red-700 text-white rounded-lg transition"
          >
            <VideoOff className="w-4 h-4" />
            {t.stopStreaming}
          </button>
        )}
      </div>
      
      {/* Save Controls */}
      <div className="border-t border-slate-700 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Save className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-slate-400">{t.save}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Local Save */}
          <button
            onClick={() => saveLocal()}
            disabled={!state.recordedBlob}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition"
          >
            {state.localSaveStatus === 'saving' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : state.localSaveStatus === 'saved' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <HardDrive className="w-4 h-4" />
            )}
            {t.saveLocal}
          </button>
          
          {/* Cloud Sync */}
          <button
            onClick={handleCloudSync}
            disabled={!state.recordedBlob || state.isUploading}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-600/80 hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition"
          >
            {state.cloudSyncStatus === 'uploading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : state.cloudSyncStatus === 'synced' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : state.cloudSyncStatus === 'error' ? (
              <CloudOff className="w-4 h-4 text-red-500" />
            ) : (
              <Cloud className="w-4 h-4" />
            )}
            {t.syncCloud}
          </button>
        </div>
        
        {/* Error message */}
        {state.error && (
          <div className="mt-2 flex items-center gap-2 text-red-400 text-sm p-2 bg-red-500/10 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {state.error}
          </div>
        )}
        
        {/* No recording message */}
        {!state.recordedBlob && !state.isRecording && (
          <div className="mt-2 text-slate-500 text-sm text-center">
            {t.noRecording}
          </div>
        )}
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
          <h4 className="text-white font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" />
            {t.settings}
          </h4>
          
          {/* YouTube Stream Key */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              {t.youtubeKey}
            </label>
            <input
              type="password"
              value={youtubeStreamKey}
              onChange={(e) => setYoutubeStreamKey(e.target.value)}
              placeholder={t.enterYoutubeKey}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm"
            />
          </div>
          
          {/* Cloud Provider Selection */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Cloud Provider
            </label>
            <select
              value={cloudProvider}
              onChange={(e) => setCloudProvider(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
            >
              <option value="hidrive">HiDrive</option>
              <option value="googledrive">Google Drive</option>
              <option value="both">Both</option>
            </select>
          </div>
          
          {/* HiDrive Token */}
          {(cloudProvider === 'hidrive' || cloudProvider === 'both') && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                {t.hidriveToken}
              </label>
              <input
                type="password"
                value={hidriveToken}
                onChange={(e) => setHidriveToken(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
              />
            </div>
          )}
          
          {/* Google Token */}
          {(cloudProvider === 'googledrive' || cloudProvider === 'both') && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                {t.googleToken}
              </label>
              <input
                type="password"
                value={googleToken}
                onChange={(e) => setGoogleToken(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordingPanel;
