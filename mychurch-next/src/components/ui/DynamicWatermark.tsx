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
        // Fetch initial config
        getWatermarkConfig().then(res => {
            if (res) setConfig(res as WatermarkConfigState);
            setIsLoaded(true);
        }).catch(() => {
            setIsLoaded(true);
        });

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
            supabase.removeChannel(channel);
        };
    }, []);

    // Prevent rendering until we know the actual config to avoid flickers
    if (!isLoaded) return null;

    return (
        <WatermarkLogo
            size={config?.size || defaultSize}
            position={config?.position || defaultPosition}
            opacity={config?.opacity || defaultOpacity}
            imageUrl={config?.imageUrl}
            customOffsets={config?.customOffsets || defaultCustomOffsets}
            className={className}
        />
    );
}
