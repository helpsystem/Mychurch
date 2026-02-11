import React, { useState, useEffect } from 'react';
import { X, Camera, Mic, Volume2, Monitor, AlertCircle, RefreshCw, Check, Video, MoreHorizontal, Layers } from 'lucide-react';

interface DeviceSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoDevices: MediaDeviceInfo[];
    audioDevices: MediaDeviceInfo[];
    selectedVideoDevice: string;
    selectedAudioDevice: string;
    onVideoDeviceChange: (deviceId: string) => void;
    onAudioDeviceChange: (deviceId: string) => void;
    onRefreshDevices: () => void;
    // Advanced Settings
    videoResolution: 'default' | 'hd' | 'fhd';
    onResolutionChange: (res: 'default' | 'hd' | 'fhd') => void;
    isMirrored: boolean;
    onMirrorChange: (isMirrored: boolean) => void;
    isBlur: boolean;
    onBlurChange: (isBlur: boolean) => void;
    isRTL?: boolean;
}

const DeviceSettingsModal: React.FC<DeviceSettingsModalProps> = ({
    isOpen, onClose,
    videoDevices, audioDevices,
    selectedVideoDevice, selectedAudioDevice,
    onVideoDeviceChange, onAudioDeviceChange,
    onRefreshDevices,
    videoResolution, onResolutionChange,
    isMirrored, onMirrorChange,
    isBlur, onBlurChange,
    isRTL = false
}) => {
    const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'background'>('video');

    if (!isOpen) return null;

    const tabs = [
        { id: 'video', label: isRTL ? 'ویدیو' : 'Video', icon: Video },
        { id: 'audio', label: isRTL ? 'صدا' : 'Audio', icon: Mic },
        { id: 'background', label: isRTL ? 'پس‌زمینه و افکت' : 'Background & Filters', icon: Layers },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[90vh]" dir={isRTL ? 'rtl' : 'ltr'}>

                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 rounded-t-2xl">
                    <h2 className={`text-xl font-bold text-white flex items-center gap-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        <MoreHorizontal className="w-5 h-5 text-indigo-400" />
                        {isRTL ? 'تنظیمات دستگاه‌ها' : 'Device Settings'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1 rounded-full hover:bg-slate-700" title={isRTL ? 'بستن' : 'Close'}>
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-48 bg-slate-950 border-r border-slate-800 p-2 flex flex-col gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium ${activeTab === tab.id
                                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 overflow-y-auto bg-slate-900">

                        {/* VIDEO SETTINGS */}
                        {activeTab === 'video' && (
                            <div className="space-y-6">
                                {/* Camera Source */}
                                <div className="space-y-3">
                                    <label className={`block text-sm font-medium text-slate-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                                        {isRTL ? '📷 دوربین' : 'Camera Source'}
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedVideoDevice}
                                            onChange={(e) => onVideoDeviceChange(e.target.value)}
                                            className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            title={isRTL ? 'انتخاب دوربین' : 'Select Camera'}
                                        >
                                            {videoDevices.map((device, i) => (
                                                <option key={device.deviceId} value={device.deviceId}>
                                                    {device.label || `Camera ${i + 1}`}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={onRefreshDevices}
                                            className="p-2.5 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 text-slate-300"
                                            title="Refresh Devices"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-800" />

                                {/* Resolution */}
                                <div className="space-y-3">
                                    <label className={`block text-sm font-medium text-slate-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                                        {isRTL ? '📐 کیفیت تصویر' : 'Resolution'}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => onResolutionChange('default')}
                                            className={`px-3 py-2 rounded-lg border text-sm ${videoResolution === 'default' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            Default
                                        </button>
                                        <button
                                            onClick={() => onResolutionChange('hd')}
                                            className={`px-3 py-2 rounded-lg border text-sm ${videoResolution === 'hd' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            HD (720p)
                                        </button>
                                        <button
                                            onClick={() => onResolutionChange('fhd')}
                                            className={`px-3 py-2 rounded-lg border text-sm ${videoResolution === 'fhd' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            Full HD (1080p)
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {isRTL ? 'کیفیت بالاتر ممکن است پهنای باند و پردازش بیشتری نیاز داشته باشد.' : 'Higher resolution requires more bandwidth and CPU.'}
                                    </p>
                                </div>

                                <div className="h-px bg-slate-800" />

                                {/* Mirror Toggle */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className={`block text-sm font-medium text-slate-200 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                                            {isRTL ? 'آینه‌ای کردن ویدیو من' : 'Mirror My Video'}
                                        </span>
                                        <span className="text-xs text-slate-500 block">
                                            {isRTL ? 'مفید برای خواندن متن‌ها و جهت‌گیری طبیعی‌تر' : 'Useful for reading text naturally'}
                                        </span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={isMirrored}
                                            onChange={(e) => onMirrorChange(e.target.checked)}
                                            title={isRTL ? 'آینه‌ای کردن ویدیو' : 'Mirror Video'}
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* AUDIO SETTINGS */}
                        {activeTab === 'audio' && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className={`block text-sm font-medium text-slate-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                                        {isRTL ? '🎤 میکروفون' : 'Microphone Source'}
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedAudioDevice}
                                            onChange={(e) => onAudioDeviceChange(e.target.value)}
                                            className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            title={isRTL ? 'انتخاب میکروفون' : 'Select Microphone'}
                                        >
                                            {audioDevices.map((device, i) => (
                                                <option key={device.deviceId} value={device.deviceId}>
                                                    {device.label || `Microphone ${i + 1}`}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={onRefreshDevices}
                                            className="p-2.5 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 text-slate-300"
                                            title={isRTL ? 'بروزرسانی لیست میکروفون‌ها' : 'Refresh Microphone List'}
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center gap-3">
                                    <Volume2 className="w-5 h-5 text-green-400" />
                                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                        {/* Placeholder for audio meter visualization - to be implemented with WebAudio API */}
                                        <div className="h-full w-[60%] bg-gradient-to-r from-green-500 to-green-400 animate-pulse" />
                                    </div>
                                    <span className="text-xs text-slate-400">Testing...</span>
                                </div>
                            </div>
                        )}

                        {/* BACKGROUND SETTINGS */}
                        {activeTab === 'background' && (
                            <div className="space-y-6">
                                {/* Blur Toggle */}
                                <div className="flex items-center justify-between p-4 border border-slate-700 rounded-xl bg-slate-800/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className={`block text-sm font-medium text-slate-200 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                                                {isRTL ? 'تار کردن پس‌زمینه (Blur)' : 'Background Blur'}
                                            </span>
                                            <span className="text-xs text-slate-500 block">
                                                {isRTL ? 'اعمال افکت تار روی تصویر' : 'Apply basic blur effect'}
                                            </span>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={isBlur}
                                            onChange={(e) => onBlurChange(e.target.checked)}
                                            title={isRTL ? 'تار کردن پس‌زمینه' : 'Blur Background'}
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                                    <div className="flex gap-2 text-yellow-500 mb-1">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className={`text-xs font-bold ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                                            {isRTL ? 'توجه:' : 'Note:'}
                                        </span>
                                    </div>
                                    <p className={`text-xs text-yellow-200/80 leading-relaxed ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                                        {isRTL
                                            ? 'قابلیت حذف کامل پس‌زمینه (Virtual Background) در حال توسعه است و به زودی اضافه خواهد شد.'
                                            : 'Virtual Background removal is currently under development and will be available soon.'}
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-sm font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                    >
                        {isRTL ? 'بستن' : 'Done'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeviceSettingsModal;
