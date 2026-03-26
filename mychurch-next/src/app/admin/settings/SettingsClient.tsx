"use client";

import React, { useState } from "react";
import { AIConfig, updateAIConfig } from "@/actions/ai-config";
import { 
    Save, ShieldCheck, Sparkles, Cloud, 
    Key, Info, AlertCircle, CheckCircle2,
    Database, Cpu
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface SettingsClientProps {
    initialConfig: AIConfig;
}

export default function SettingsClient({ initialConfig }: SettingsClientProps) {
    const [config, setConfig] = useState<AIConfig>(initialConfig);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateAIConfig(config);
            toast.success("Settings saved successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-8">
            {/* Provider Selection */}
            <section className="bg-neutral-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:scale-110 transition-transform duration-700">
                    <Sparkles size={120} />
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Cpu className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold">AI Provider Engine</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => setConfig({ ...config, active_provider: 'studio' })}
                        className={`p-6 rounded-2xl border-2 transition-all flex flex-col gap-3 text-left ${
                            config.active_provider === 'studio'
                                ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                : 'border-white/5 bg-white/5 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <Sparkles className={config.active_provider === 'studio' ? 'text-primary' : 'text-muted-foreground'} />
                            {config.active_provider === 'studio' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                        </div>
                        <div>
                            <h3 className="font-bold">Google AI Studio</h3>
                            <p className="text-xs text-muted-foreground">Standard Gemini API using API Keys. Best for quick integration and high limits.</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setConfig({ ...config, active_provider: 'vertex' })}
                        className={`p-6 rounded-2xl border-2 transition-all flex flex-col gap-3 text-left ${
                            config.active_provider === 'vertex'
                                ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                                : 'border-white/5 bg-white/5 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <Cloud className={config.active_provider === 'vertex' ? 'text-indigo-400' : 'text-muted-foreground'} />
                            {config.active_provider === 'vertex' && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                        </div>
                        <div>
                            <h3 className="font-bold">Google Cloud Vertex AI</h3>
                            <p className="text-xs text-muted-foreground">Enterprise-grade AI. Use this to utilize your $1000 Google Cloud credits.</p>
                        </div>
                    </button>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-8 relative">
                <AnimatePresence mode="wait">
                    {config.active_provider === 'studio' ? (
                        <motion.div
                            key="studio"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <div className="bg-neutral-900/50 border border-white/10 rounded-3xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <Key className="w-5 h-5 text-primary" />
                                    <h3 className="font-bold">Gemini API Configuration</h3>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Gemini API Key</label>
                                        <input
                                            type="password"
                                            value={config.gemini_api_key || ""}
                                            onChange={(e) => setConfig({ ...config, gemini_api_key: e.target.value })}
                                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
                                            placeholder="AIzaSy..."
                                        />
                                        <p className="text-[10px] text-muted-foreground pl-1 flex items-center gap-1">
                                            <Info className="w-3 h-3" /> Get your key from Google AI Studio.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="vertex"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="bg-neutral-900/50 border border-indigo-500/20 rounded-3xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <Database className="w-5 h-5 text-indigo-400" />
                                    <h3 className="font-bold">Vertex AI (Google Cloud) Config</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Cloud Project ID</label>
                                        <input
                                            value={config.vertex_project_id || ""}
                                            onChange={(e) => setConfig({ ...config, vertex_project_id: e.target.value })}
                                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                                            placeholder="my-project-123"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Region</label>
                                        <input
                                            value={config.vertex_region || "us-central1"}
                                            onChange={(e) => setConfig({ ...config, vertex_region: e.target.value })}
                                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                                            placeholder="us-central1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Service Account JSON</label>
                                    <textarea
                                        value={typeof config.vertex_service_account === 'string' ? config.vertex_service_account : JSON.stringify(config.vertex_service_account, null, 2) || ""}
                                        onChange={(e) => {
                                            try {
                                                const json = JSON.parse(e.target.value);
                                                setConfig({ ...config, vertex_service_account: json });
                                            } catch (err) {
                                                setConfig({ ...config, vertex_service_account: e.target.value });
                                            }
                                        }}
                                        rows={10}
                                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-xs custom-scrollbar"
                                        placeholder='{ "type": "service_account", ... }'
                                    />
                                    <p className="text-[10px] text-muted-foreground pl-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Ensure the Service Account has 'Vertex AI User' role.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Save Button Floating */}
            <div className="sticky bottom-8 z-30 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-black px-8 py-4 rounded-2xl shadow-2xl shadow-primary/20 transition-all disabled:opacity-50 disabled:scale-95 group"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    )}
                    SAVE CONFIGURATION
                </button>
            </div>
        </div>
    );
}
