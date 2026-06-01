import { create } from 'zustand';
import { Slide, BroadcastOverlayConfig, ScriptureReferenceItem } from '@/types/broadcast';
import { createClient } from '@/utils/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface BroadcastState {
    sessionId: string;
    isLive: boolean;
    activeSceneId: string;
    slides: Slide[];
    activeSlideIndex: number;
    internalPageIndex: number; // for multi-page scriptures or long lyrics
    activeScriptureReference: ScriptureReferenceItem | null;
    scripturePopupScale: number;

    // Overlay & Display Config
    config: BroadcastOverlayConfig;

    // Hardware State
    isCameraOn: boolean;
    isMicOn: boolean;
    selectedVideoDevice: string;
    selectedAudioDevice: string;
    videoResolution: 'default' | 'hd' | 'fhd';
    mediaStream: MediaStream | null;
    videoDevices: MediaDeviceInfo[];
    audioDevices: MediaDeviceInfo[];
    isMirrored: boolean;
    isBlur: boolean;
    showDeviceSelector: boolean;

    // Network / Sync
    isConnected: boolean;
    syncChannel: RealtimeChannel | null; // Keep track of active connection

    // Actions
    setSessionId: (id: string) => void;
    setIsLive: (isLive: boolean) => void;
    setActiveSceneId: (id: string) => void;
    setSlides: (slides: Slide[]) => void;
    setActiveSlideIndex: (index: number, skipSync?: boolean) => void;
    setInternalPageIndex: (index: number, skipSync?: boolean) => void;
    setActiveScriptureReference: (ref: ScriptureReferenceItem | null, skipSync?: boolean) => void;
    setScripturePopupScale: (scale: number, skipSync?: boolean) => void;
    nextSlide: () => void;
    prevSlide: () => void;
    updateConfig: (updates: Partial<BroadcastOverlayConfig>) => void;

    // Hardware Actions
    setMediaDevices: (video: string, audio: string) => void;
    setVideoResolution: (res: 'default' | 'hd' | 'fhd') => void;
    toggleCamera: () => void;
    toggleMic: () => void;
    setMediaStream: (stream: MediaStream | null) => void;
    setVideoDevices: (devices: MediaDeviceInfo[]) => void;
    setAudioDevices: (devices: MediaDeviceInfo[]) => void;
    setIsMirrored: (isMirrored: boolean) => void;
    setIsBlur: (isBlur: boolean) => void;
    setShowDeviceSelector: (show: boolean) => void;
    setVideoDevice: (deviceId: string) => void;
    setAudioDevice: (deviceId: string) => void;

    // Sync Actions
    setIsConnected: (connected: boolean) => void;
    initRemoteSync: () => void;
    pushRemoteSync: (payload: { type: string, [key: string]: any }) => void;
    disconnectSync: () => void;
}

const DEFAULT_CONFIG: BroadcastOverlayConfig = {
    layout: 'FULL_CAM',
    pipScale: 0.3,
    leaderVideoShape: 'rectangle',
    showLogo: true,
    logoUrl: '/logo-transparent.png',
    lowerThirds: [],
    activeLowerThirdIndex: 0,
    showLowerThird: false,
    lowerThirdSize: 'standard',
    lowerThirdTheme: 'modern',
    isRotating: false,
    rotationInterval: 10,
    prayerRequests: [],
    showPrayerTicker: false,
    donations: [],
    activeDonationId: null,
    donationDisplayMode: 'OVERLAY',
    showLiveMeetingOverlay: false,
    meetingDialIn: '+1 (605) 313-9689',
    meetingAccessCode: '1036379',
    meetingOnlineId: 'iranianchurchdcus',
    contentScale: 1.0,
};

export const useBroadcastStore = create<BroadcastState>((set, get) => ({
    sessionId: 'default',
    isLive: false,
    activeSceneId: 'scene_1',
    slides: [],
    activeSlideIndex: 0,
    internalPageIndex: 0,
    activeScriptureReference: null,
    scripturePopupScale: 1.0,

    config: DEFAULT_CONFIG,

    isCameraOn: false,
    isMicOn: false,
    selectedVideoDevice: '',
    selectedAudioDevice: '',
    videoResolution: 'default',
    mediaStream: null,
    videoDevices: [],
    audioDevices: [],
    isMirrored: false,
    isBlur: false,
    showDeviceSelector: false,

    isConnected: false,
    syncChannel: null,

    // Implementations
    setSessionId: (id) => set({ sessionId: id }),
    setIsLive: (isLive) => set({ isLive }),
    setActiveSceneId: (id) => set({ activeSceneId: id }),
    setSlides: (slides) => set({ slides }),

    setActiveSlideIndex: (index, skipSync = false) => {
        set({ activeSlideIndex: index, internalPageIndex: 0, activeScriptureReference: null });
        if (!skipSync) {
            get().pushRemoteSync({ type: 'SET_SLIDE', slideIndex: index, pageIndex: 0 });
            get().pushRemoteSync({ type: 'SET_ACTIVE_REFERENCE', reference: null });
        }
    },

    setInternalPageIndex: (index, skipSync = false) => {
        set({ internalPageIndex: index, activeScriptureReference: null });
        if (!skipSync) {
            get().pushRemoteSync({ type: 'SET_PAGE', slideIndex: get().activeSlideIndex, pageIndex: index });
            get().pushRemoteSync({ type: 'SET_ACTIVE_REFERENCE', reference: null });
        }
    },

    setActiveScriptureReference: (ref, skipSync = false) => {
        set({ activeScriptureReference: ref });
        if (!skipSync) {
            get().pushRemoteSync({ type: 'SET_ACTIVE_REFERENCE', reference: ref });
        }
    },

    setScripturePopupScale: (scale, skipSync = false) => {
        const safeScale = Math.max(0.5, Math.min(scale, 3.0));
        set({ scripturePopupScale: safeScale });
        if (!skipSync) {
            get().pushRemoteSync({ type: 'SET_POPUP_SCALE', scale: safeScale });
        }
    },

    nextSlide: () => {
        const { activeSlideIndex, slides } = get();
        if (activeSlideIndex < slides.length - 1) {
            get().setActiveSlideIndex(activeSlideIndex + 1);
        }
    },

    prevSlide: () => {
        const { activeSlideIndex } = get();
        if (activeSlideIndex > 0) {
            get().setActiveSlideIndex(activeSlideIndex - 1);
        }
    },

    updateConfig: (updates) => set((state) => ({
        config: { ...state.config, ...updates }
    })),

    setMediaDevices: (video, audio) => set({
        selectedVideoDevice: video,
        selectedAudioDevice: audio
    }),

    setVideoResolution: (res) => set({ videoResolution: res }),
    toggleCamera: () => set((state) => ({ isCameraOn: !state.isCameraOn })),
    toggleMic: () => set((state) => ({ isMicOn: !state.isMicOn })),
    setMediaStream: (stream) => set({ mediaStream: stream }),
    setVideoDevices: (devices) => set({ videoDevices: devices }),
    setAudioDevices: (devices) => set({ audioDevices: devices }),
    setIsMirrored: (isMirrored) => set({ isMirrored }),
    setIsBlur: (isBlur) => set({ isBlur }),
    setShowDeviceSelector: (show) => set({ showDeviceSelector: show }),
    setVideoDevice: (deviceId) => set({ selectedVideoDevice: deviceId }),
    setAudioDevice: (deviceId) => set({ selectedAudioDevice: deviceId }),

    setIsConnected: (connected) => set({ isConnected: connected }),

    // ----- SUPABASE REALTIME REMOTE CONTROL -----
    initRemoteSync: () => {
        const state = get();
        // Prevent double connections
        if (state.syncChannel) return;

        const supabase = createClient();
        // The broadcast channel is public so any connected iPad/Browser can sync.
        const channel = supabase.channel('broadcast-remote', {
            config: {
                broadcast: { self: false } // don't receive our own messages
            }
        });

        channel
            .on('broadcast', { event: 'sync-event' }, (payload) => {
                const data = payload.payload;
                if (!data) return;

                console.log("[Remote Control] Received:", data);

                if (data.type === 'SET_SLIDE') {
                    // Force update without pushing back (infinite loop prevent)
                    set({ activeSlideIndex: data.slideIndex, internalPageIndex: data.pageIndex || 0, activeScriptureReference: null });
                } else if (data.type === 'SET_PAGE') {
                    set({ internalPageIndex: data.pageIndex, activeScriptureReference: null });
                } else if (data.type === 'TOGGLE_LIVE') {
                    set({ isLive: data.isLive });
                } else if (data.type === 'SET_SCENE') {
                    set({ activeSceneId: data.sceneId });
                } else if (data.type === 'SET_ACTIVE_REFERENCE') {
                    set({ activeScriptureReference: data.reference });
                } else if (data.type === 'SET_POPUP_SCALE') {
                    set({ scripturePopupScale: data.scale });
                }
            })
            .subscribe((status) => {
                console.log("[Remote Control] Status:", status);
                if (status === 'SUBSCRIBED') {
                    set({ isConnected: true, syncChannel: channel });
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    set({ isConnected: false, syncChannel: null });
                }
            });
    },

    pushRemoteSync: (payload) => {
        const { syncChannel, isConnected } = get();
        if (isConnected && syncChannel) {
            syncChannel.send({
                type: 'broadcast',
                event: 'sync-event',
                payload: payload
            });
        }
    },

    disconnectSync: () => {
        const { syncChannel } = get();
        if (syncChannel) {
            syncChannel.unsubscribe();
            set({ isConnected: false, syncChannel: null });
        }
    }
}));
