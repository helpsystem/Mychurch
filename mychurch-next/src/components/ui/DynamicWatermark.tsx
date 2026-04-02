"use client";

import React, { useEffect, useState } from "react";
import { getWatermarkConfig } from "@/actions/widgets";
import { createClient } from "@/utils/supabase/client";
import { WatermarkLogo, type WatermarkPosition } from "./WatermarkLogo";

interface Props {
    className?: string;
    defaultSize?: number;
    defaultPosition?: WatermarkPosition;
    defaultOpacity?: number;
    defaultCustomOffsets?: { x: number, y: number };
}

interface WatermarkConfigState {
    size?: number;
    position?: WatermarkPosition;
    opacity?: number;
    imageUrl?: string;
    customOffsets?: { x: number, y: number };
}


export function DynamicWatermark({
    className,
    defaultSize = 400,
    defaultPosition = 'custom',
    defaultOpacity = 4,
    defaultCustomOffsets = { x: 50, y: 50 }
}: Props) {
    const [config, setConfig] = useState<WatermarkConfigState | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let isMounted = true;

        // Fetch initial config with defensive guards for both sync and async failures.
        const loadInitialConfig = async () => {
            try {
                const res = await getWatermarkConfig();
                if (isMounted && res) {
                    setConfig(res as WatermarkConfigState);
                }
            } catch {
                // Keep defaults when remote config cannot be loaded.
            } finally {
                if (isMounted) {
                    setIsLoaded(true);
                }
            }
        };

        loadInitialConfig();

        // Subscribe to real-time changes
        const supabase = createClient();
        const channel = supabase.channel('watermark-live-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'widgets',
                    filter: "id=eq.w_watermark"
                },
                (payload) => {
                    if (payload.new && payload.new.config) {
                        setConfig(payload.new.config as WatermarkConfigState);
                    }
                }
            )
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, []);

    // Always render a container to prevent hydration mismatch
    // Use WatermarkLogo only when config is loaded to avoid flickers
    return (
        <>
            {isLoaded && (
                <WatermarkLogo
                    size={config?.size || defaultSize}
                    position={config?.position || defaultPosition}
                    opacity={config?.opacity || defaultOpacity}
                    imageUrl={config?.imageUrl}
                    customOffsets={config?.customOffsets || defaultCustomOffsets}
                    className={className}
                />
            )}
        </>
    );
}
